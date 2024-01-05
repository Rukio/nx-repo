package main

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"reflect"
	"strconv"
	"time"

	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/sns"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	healthCheckPath = "/healthcheck"
	partnerFilePath = "/api/v1/partners/file"
	resultsFilePath = "/api/v1/results/file"
	statusCodeTag   = "status_code"
	urlPathTag      = "url_path"
)

type awsHTTPClient interface {
	SubscribePartnerTopic(context.Context, string, string) error
	SubscribeResultsTopic(context.Context, string, string) error
	BucketExists(context.Context, string) bool
}

type fileProcessingService interface {
	ProcessSourceFile(ctx context.Context, s3BucketName, objectKey string) error
	ProcessResultsFileAsync(ctx context.Context, awsObjectKey string)
	IsDBHealthy(context.Context) bool
}

type server interface {
	ListenAndServe() error
	Shutdown(context.Context) error
}

type writerRecorder struct {
	http.ResponseWriter
	StatusCode int
}

func (w *writerRecorder) WriteHeader(statusCode int) {
	w.StatusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

type HTTPVars struct {
	addr           string
	popHealthURL   string
	bucketForCheck string
}

type HTTPServer struct {
	aws            awsHTTPClient
	vars           HTTPVars
	server         server
	processService fileProcessingService
	logger         *zap.SugaredLogger
	influxScope    monitoring.Scope
}

func createHTTPServer(vars HTTPVars, awsClient awsHTTPClient, process fileProcessingService, logger *zap.SugaredLogger, influxScope monitoring.Scope) *HTTPServer {
	if influxScope == nil {
		influxScope = &monitoring.NoopScope{}
	}
	s := &HTTPServer{
		aws:            awsClient,
		vars:           vars,
		processService: process,
		logger:         logger,
		influxScope:    influxScope,
	}
	s.server = &http.Server{
		Addr:    vars.addr,
		Handler: createRouter(s),
	}
	return s
}

func createRouter(server *HTTPServer) *http.ServeMux {
	router := http.NewServeMux()
	router.HandleFunc(healthCheckPath, server.healthCheckEndpoint)
	router.Handle(partnerFilePath, server.influxDBMiddleware(server.partnerFileEndpoint))
	router.Handle(resultsFilePath, server.influxDBMiddleware(server.resultsFileEndpoint))
	return router
}

func (s *HTTPServer) influxDBMiddleware(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		wr := &writerRecorder{ResponseWriter: writer}
		start := time.Now()
		next.ServeHTTP(wr, request)
		s.influxScope.WritePoint("requests",
			monitoring.Tags{statusCodeTag: strconv.Itoa(wr.StatusCode), urlPathTag: request.URL.Path},
			monitoring.Fields{"duration_ms": time.Since(start).Milliseconds(), "count": 1})
	})
}

func (s *HTTPServer) healthCheckEndpoint(writer http.ResponseWriter, request *http.Request) {
	ctx := request.Context()
	if !s.healthValidations(ctx) {
		writer.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	writer.WriteHeader(http.StatusOK)
}

func (s *HTTPServer) healthValidations(ctx context.Context) bool {
	if !s.processService.IsDBHealthy(ctx) {
		return false
	}

	if s.aws == nil || reflect.ValueOf(s.aws).IsNil() {
		return false
	} else if !s.aws.BucketExists(ctx, s.vars.bucketForCheck) {
		return false
	}

	return true
}

func (s *HTTPServer) partnerFileEndpoint(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		writer.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	s.processFile(writer, request, s.processPartnerFile)
}

func (s *HTTPServer) resultsFileEndpoint(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		writer.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	s.processFile(writer, request, s.processResultsFile)
}

func (s *HTTPServer) processFile(writer http.ResponseWriter, request *http.Request, process func(ctx context.Context, payload sns.Payload) error) {
	payload, err := sns.GetPayload(request.Body)
	defer request.Body.Close()
	if err != nil {
		s.logger.Errorw("error unmarshalling sns payload", zap.Error(err))
		writer.WriteHeader(http.StatusBadRequest)
		return
	}
	err = sns.VerifySignature(request.Context(), payload)
	if err != nil {
		s.logger.Errorw("error verifying signature", zap.Error(err))
		writer.WriteHeader(http.StatusBadRequest)
		return
	}
	switch request.Header.Get(awsSnsHeader) {
	case subscriptionConfirmation:
		err = ConfirmSubscription(request.Context(), payload, s.logger)
		if err != nil {
			s.logger.Errorw("error confirming subscription", zap.Error(err))
			writer.WriteHeader(http.StatusUnprocessableEntity)
			return
		}
	case notification:
		if err = process(request.Context(), payload); err != nil {
			s.logger.Errorw("error processing pop health file", zap.Error(err))
			writer.WriteHeader(http.StatusUnprocessableEntity)
			return
		}
	default:
		s.logger.Infow("invalid sns message type",
			"header", request.Header.Get(awsSnsHeader))
		writer.WriteHeader(http.StatusBadRequest)
		return
	}
	writer.WriteHeader(http.StatusOK)
}

func (s *HTTPServer) processPartnerFile(ctx context.Context, payload sns.Payload) error {
	eventMsg, err := s.getS3Event(payload.Message)
	if err != nil {
		return err
	}
	if len(eventMsg.Records) != 1 {
		return fmt.Errorf("unexpected number of pop health files received message: %s", payload.Message)
	}
	s.logger.Infow("pop health file received",
		"filename", eventMsg.Records[0].S3.Object.Key,
		"bucket", eventMsg.Records[0].S3.Bucket.Name)
	return s.processService.ProcessSourceFile(ctx, eventMsg.Records[0].S3.Bucket.Name, eventMsg.Records[0].S3.Object.Key)
}

func (s *HTTPServer) processResultsFile(_ context.Context, payload sns.Payload) error {
	event, err := s.getS3Event(payload.Message)
	if err != nil {
		return fmt.Errorf("error unmarshalling results file notification event messageId: %s, error: %w", payload.MessageId, err)
	}
	if len(event.Records) != 1 {
		return fmt.Errorf("unexpected number of results files received, message: %s", payload.Message)
	}
	awsObjectKey := event.Records[0].S3.Object.Key

	s.logger.Infow("result file received",
		"filename", event.Records[0].S3.Object.Key,
		"bucket", event.Records[0].S3.Bucket.Name)

	go s.processService.ProcessResultsFileAsync(context.Background(), awsObjectKey) //nolint
	return nil
}

func (s *HTTPServer) Address() string {
	return s.vars.addr
}

func (s *HTTPServer) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

func (s *HTTPServer) StartServer(ctx context.Context) error {
	u, err := url.Parse(s.vars.popHealthURL)
	if err != nil {
		return err
	}
	go func() {
		if err := s.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			s.logger.Panicw("error starting http server", zap.Error(err))
		}
	}()
	err = s.aws.SubscribeResultsTopic(ctx, u.Scheme, s.vars.popHealthURL+resultsFilePath)
	if err != nil {
		return err
	}
	return s.aws.SubscribePartnerTopic(ctx, u.Scheme, s.vars.popHealthURL+partnerFilePath)
}

func (s *HTTPServer) getS3Event(message string) (S3Event, error) {
	var eventMsg S3Event
	err := json.Unmarshal([]byte(message), &eventMsg)
	return eventMsg, err
}

func ConfirmSubscription(ctx context.Context, payload sns.Payload, logger *zap.SugaredLogger) error {
	var response ConfirmSubscriptionResponse
	if payload.SubscribeURL == "" {
		return errors.New("sns payload does not have a subscribe URL")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, payload.SubscribeURL, nil)
	if err != nil {
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	xmlErr := xml.Unmarshal(body, &response)
	if xmlErr != nil {
		return xmlErr
	}
	logger.Infow("sns subscription succeed",
		"arn", response.SubscriptionArn)
	return nil
}

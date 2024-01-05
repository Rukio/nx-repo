package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/mailer"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	awsConfig "github.com/*company-data-covered*/services/go/pkg/aws"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const (
	popHealthPartnerTopicARNKey = "POP_HEALTH_PARTNER_TOPIC_ARN"
	popHealthResultsTopicARNKey = "POP_HEALTH_RESULTS_TOPIC_ARN"
	popHealthServiceURLKey      = "POP_HEALTH_SERVICE_URL"
	popHealthExchangeBucket     = "POP_HEALTH_FILE_EXCHANGE_BUCKET"
	// go-elasticsearch package requires to export this environment variable to set the cluster endpoint(s).
	elasticSearchURLKey                   = "ELASTICSEARCH_URL"
	prefectProcessFileVersionGroupID      = "PREFECT_PROCESS_FILE_VERSION_GROUP_ID"
	prefectSyncPatientsVersionGroupID     = "PREFECT_SYNC_PATIENTS_VERSION_GROUP_ID"
	prefectDeactivateBucketVersionGroupID = "PREFECT_DEACTIVATE_BUCKET_VERSION_GROUP_ID"
	prefectPopHealthClientTokenKey        = "PREFECT_POP_HEALTH_CLIENT_TOKEN"
	sendgridAPIKey                        = "SENDGRID_API_KEY"
	*company-data-covered*LogoImageURL            = "LOGO_IMAGE_URL"
	serviceName                           = "PopHealthService"
	searchPatientServiceName              = "SearchPatientService"
	dbScopeName                           = "DB"
	webServerScopeName                    = "WebServer"
	processorServiceScopeName             = "ProcessorService"
)

var (
	awsAccessKeyID       = flag.String("aws-access-key-id", "", "AWS access key id")
	awsRegion            = flag.String("aws-region", "", "AWS Region")
	awsSecretAccessKey   = flag.String("aws-secret-access-key", "", "AWS secret access key")
	httpAddr             = flag.String("http-listen-addr", ":8080", "HTTP address to listen to")
	grpcAddr             = flag.String("grpc-listen-addr", ":8081", "GRPC address to listen to")
	defaultGRPCTimeout   = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	refreshTokenInterval = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	healthCheckInterval  = flag.Duration("health-check-interval", 1*time.Minute, "time interval for triggering a service health check")

	authorizationDisabled = flag.Bool("authorization-disabled", false, "flag to disable auth0")
	auth0IssuerURL        = flag.String("auth0-issuer-url", "", "auth0 issuer URL")
	auth0Audience         = flag.String("auth0-audience", fmt.Sprintf("%s,pophealth.*company-data-covered*.com", auth.LogicalAPIAudience), "auth0 audience for pophealth service")

	partnerServiceAuth0Audience = flag.String("partner-service-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for partner service")
	partnerServiceGRPCAddr      = flag.String("partner-service-grpc-addr", "localhost:8472", "Partner service GRPC address")

	useDevLogger                        = flag.Bool("dev-server", false, "Use dev logger for more verbose logging")
	elasticSearchTimeOut                = flag.Duration("elastic-search-timeout", 5*time.Second, "Elastic Search timeout")
	popHealthElasticSearchIndex         = flag.String("pop-health-es-index", "pop_health_patients", "Elastic Search index for pop health eligible patients")
	popHealthElasticSearchBackfillIndex = flag.String("pop-health-es-backfill-index", "pop_health_backfill_patients", "Elastic Search index for pop health backfill eligible patients")
	elasticSearchWorkers                = flag.Int("elastic-search-workers", 5, "Number of workers to use when doing bulk indexing")
	elasticSearchFlushBytes             = flag.Int("elastic-search-flush-bytes", 1024, "The flush threshold in bytes")
	elasticSearchFlushInterval          = flag.Duration("elastic-search-flush-interval", 5*time.Second, "Elastic Search flush interval")
	numberOfParallelBackfills           = flag.Int("number-of-parallel-backfills", 1, "Number of allowed backfills to run at a time")

	prefectURL                 = flag.String("prefect-url", "https://api.prefect.io", "Prefect service URL")
	prefectTimeout             = flag.Duration("prefect-timeout", 5*time.Second, "Prefect client timeout")
	prefectChangePercentLimit  = flag.Int("prefect-change-percent-limit", 25, "Prefect change percent limit")
	prefectErrorPercentLimit   = flag.Int("prefect-error-percent-limit", 5, "Prefect error percent limit")
	prefectWaitBetweenRequests = flag.Duration("prefect-wait-between-requests", 15*time.Second, "Wait time between prefect requests")
	prefectNumRetries          = flag.Int("prefect-retries-count", 1, "Number of retries if prefect request times out")
	prefectRetriesInterval     = flag.Duration("prefect-retries-interval", 5*time.Second, "Interval between prefect requests")

	influxDBRetentionPolicy   = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	dbPoolStatsReportInterval = flag.Duration("db-pool-stats-report-interval", 0, "Interval between reporting database connection pooling statistics. 0 means do not report statistics.")
)

func getDB(ctx context.Context, logger *zap.SugaredLogger) basedb.DBTX {
	config := basedb.DefaultEnvConfig(logger)
	return basedb.Connect(ctx, logger, config)
}

func getAwsClient(ctx context.Context, logger *zap.SugaredLogger) *AwsClient {
	partnerTopicArn := os.Getenv(popHealthPartnerTopicARNKey)
	resultsTopicArn := os.Getenv(popHealthResultsTopicARNKey)

	client, err := NewAWSClient(ctx, partnerTopicArn, resultsTopicArn, awsConfig.ProviderOptions{
		AccessKeyID:     *awsAccessKeyID,
		SecretAccessKey: *awsSecretAccessKey,
		Region:          *awsRegion,
	}, logger)
	if err != nil {
		logger.Panicw("unable to create aws client", zap.Error(err))
	}

	return client
}

func auth0Env(audience string) auth.Auth0Env {
	return auth.Auth0Env{
		ClientID:     os.Getenv("POPHEALTH_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("POPHEALTH_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     audience,
		IssuerURL:    *auth0IssuerURL,
	}
}

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			pophealthpb.File_pophealth_service_proto.Services().ByName(serviceName),
			pophealthpb.File_pophealth_patient_search_proto.Services().ByName(searchPatientServiceName),
		},
		GRPCAddr: *grpcAddr,
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *useDevLogger,
		},
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled:  *authorizationDisabled,
			IssuerURL:              *auth0IssuerURL,
			Audience:               *auth0Audience,
			AllowMultipleAudiences: true,
		},
		InfluxEnv:     monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(monitoring.DataDogPopHealthServiceName),
	})
	if err != nil {
		log.Panic("could not initialize server", err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("Pophealth", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	partnerServiceConnection, closePartnerServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 monitoring.DataDogPopHealthServiceName,
			Address:              partnerServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(*partnerServiceAuth0Audience),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closePartnerServiceConn()

	var dbScope monitoring.Scope = &monitoring.NoopScope{}
	var webServerScope monitoring.Scope = &monitoring.NoopScope{}
	var processFileScope monitoring.Scope = &monitoring.NoopScope{}
	if ir := server.InfluxRecorder(); ir != nil {
		dbScope = ir.With(dbScopeName, nil, nil)
		webServerScope = ir.With(webServerScopeName, nil, nil)
		processFileScope = ir.With(processorServiceScopeName, nil, nil)
	}

	dbPool := getDB(ctx, logger)
	defer dbPool.Close()

	dBService := pophealthdb.NewPopHealthDB(dbPool, dbScope)
	if ir := server.InfluxRecorder(); ir != nil && *dbPoolStatsReportInterval > 0 {
		r := ir.DBPoolStatsRecorder(dbPool, *dbPoolStatsReportInterval)
		r.Start(ctx)
	}

	clientAws := getAwsClient(ctx, logger)

	token := auth.FixedToken{
		TokenType:   auth.BearerTokenType,
		AccessToken: os.Getenv(prefectPopHealthClientTokenKey),
	}

	prefectClient, err := NewPrefectClient(&PrefectClient{
		URL:   *prefectURL,
		Token: token,
		VersionGroupIDs: map[string]string{
			ProcessFile:      os.Getenv(prefectProcessFileVersionGroupID),
			SyncPatients:     os.Getenv(prefectSyncPatientsVersionGroupID),
			DeactivateBucket: os.Getenv(prefectDeactivateBucketVersionGroupID),
		},
		ChangePercentLimit:  *prefectChangePercentLimit,
		ErrorPercentLimit:   *prefectErrorPercentLimit,
		WaitBetweenRequests: *prefectWaitBetweenRequests,
		NumRetriesIfTimeout: *prefectNumRetries,
		RetryInterval:       *prefectRetriesInterval,
		client: &http.Client{
			Timeout: *prefectTimeout,
		},
	})
	if err != nil {
		logger.Panicw("error creating prefect client", zap.Error(err))
	}

	fileExchangeBucket := os.Getenv(popHealthExchangeBucket)
	if fileExchangeBucket == "" {
		logger.Panic("error starting service, no file exchange bucket configured")
	}

	elasticSearchClient, err := NewElasticSearchClient(ESClientParams{
		URL:     os.Getenv(elasticSearchURLKey),
		Timeout: *elasticSearchTimeOut,
		Index: map[PopHealthIndexKey]string{
			PatientIndexKey:         *popHealthElasticSearchIndex,
			BackfillPatientIndexKey: *popHealthElasticSearchBackfillIndex,
		},
		NumWorkers:    *elasticSearchWorkers,
		NumFlushBytes: *elasticSearchFlushBytes,
		FlushInterval: *elasticSearchFlushInterval,
	}, logger)
	if err != nil {
		logger.Panicw("error starting elasticsearch client", zap.Error(err))
	}
	if err := elasticSearchClient.EnsureIndexExists(ctx); err != nil {
		logger.Panicw("error validating index on elasticsearch client", zap.Error(err))
	}

	mailerClient, err := mailer.New(os.Getenv(sendgridAPIKey), os.Getenv(*company-data-covered*LogoImageURL))
	if err != nil {
		logger.Panicw("error creating mailer client", zap.Error(err))
	}

	templateService := NewTemplateService(dBService)

	fileService := NewProcessFileService(
		ProcessFileDependencies{
			Aws:              clientAws,
			TemplatesService: templateService,
			DBService:        dBService,
			BackfillService:  partnerpb.NewPartnerServiceClient(partnerServiceConnection),
			PrefectClient:    prefectClient,
			ElasticSearch:    elasticSearchClient,
			Mailer:           mailerClient,
			Scope:            processFileScope,
		},
		fileExchangeBucket,
		logger,
	)

	healthService := &HealthCheckServer{
		DBService:      dBService,
		AWSClient:      clientAws,
		BucketForCheck: fileExchangeBucket,
	}

	patientService := PatientSearchServer{
		PatientSearchService: elasticSearchClient,
		logger:               logger,
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthService.Check,
		DataDogRecorder:       server.DataDogRecorder(),
		DataDogLogServiceName: monitoring.DataDogPopHealthServiceName,
		Logger:                logger,
	}
	healthCheckPoller.Start()

	go func() {
		fileCheckerService := &FileCheckerService{
			db:             dBService,
			processService: fileService,
			logger:         logger,
			influxScope:    processFileScope,
			sleepDuration:  time.Hour * 1,
		}

		err = fileCheckerService.Run(ctx)

		if err != nil {
			logger.Panicw("File Checker failed!", zap.Error(err))
		}
	}()

	go func() {
		grpcServerDependencies := GrpcServerDependencies{
			Aws:                 clientAws,
			Prefect:             prefectClient,
			FileTemplateService: templateService,
			DBService:           dBService,
			Mailer:              mailerClient,
		}
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			pophealthpb.RegisterPopHealthServiceServer(grpcServer, NewGRPCServer(grpcServerDependencies, fileExchangeBucket, int64(*numberOfParallelBackfills), logger))
			healthpb.RegisterHealthServer(grpcServer, healthService)
			pophealthpb.RegisterSearchPatientServiceServer(grpcServer, &patientService)
		})

		if err != nil {
			logger.Panicw("GRPC Server failed!", zap.Error(err))
		}
	}()

	phURL := os.Getenv(popHealthServiceURLKey)
	if phURL == "" {
		logger.Panic("unable to start service, missing pop health URL")
	}

	httpServer := createHTTPServer(HTTPVars{
		addr:           *httpAddr,
		popHealthURL:   phURL,
		bucketForCheck: fileExchangeBucket,
	}, clientAws, fileService, logger, webServerScope)

	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, os.Interrupt, syscall.SIGTERM)
	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		s := <-signalChannel
		ctxTimeOut, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		logger.Infof("got signal %v", s)
		logger.Info("attempting HTTP server graceful shutdown")
		if err = httpServer.Shutdown(ctxTimeOut); err != nil {
			logger.Panicw("error shutting down http server", zap.Error(err))
		}
		wg.Done()
	}()

	logger.Infow("http server listening at",
		"url", httpServer.Address())
	err = httpServer.StartServer(ctx)
	if err != nil {
		logger.Panicw("http server failed", zap.Error(err))
	}
	wg.Wait()
	logger.Info("clean shutdown")
}

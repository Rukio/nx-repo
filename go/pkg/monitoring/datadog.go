package monitoring

import (
	"fmt"
	"net/http"

	"github.com/DataDog/datadog-go/v5/statsd"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	grpctrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/google.golang.org/grpc"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
	"gopkg.in/DataDog/dd-trace-go.v1/profiler"
)

const (
	DataDogCareManagerServiceName     = "caremanager-service"
	DataDogPopHealthServiceName       = "pophealth-service"
	DataDogAuditServiceName           = "audit-service"
	DataDogStationServiceName         = "station"
	DataDogAthenaServiceName          = "athena-service"
	DataDogAthenaPCIServiceName       = "athena-pci-service"
	DataDogAthenaListenerServiceName  = "athena-listener-service"
	DataDogPatientsServiceName        = "patients-service"
	DataDogPatientAccountsServiceName = "patientaccounts-service"
	DataDogExampleServiceName         = "example-service"
	missingConfigFieldErrorMessage    = "missing datadog config field: %s"
)

var (
	servingStatusToStatsD = map[healthpb.HealthCheckResponse_ServingStatus]statsd.ServiceCheckStatus{
		healthpb.HealthCheckResponse_NOT_SERVING:     statsd.Critical,
		healthpb.HealthCheckResponse_SERVING:         statsd.Ok,
		healthpb.HealthCheckResponse_SERVICE_UNKNOWN: statsd.Unknown,
	}
)

type DataDogConfig struct {
	Env            string
	APMUrl         string
	AppVersion     string
	ServiceName    string
	StatsDUrl      string
	EnableProfiler bool
}

func (c DataDogConfig) isBaseConfigValid() bool {
	return c.AppVersion != "" && c.Env != "" && c.ServiceName != ""
}

func (c DataDogConfig) validateBaseConfig() error {
	if c.AppVersion == "" {
		return fmt.Errorf(missingConfigFieldErrorMessage, "AppVersion")
	}
	if c.Env == "" {
		return fmt.Errorf(missingConfigFieldErrorMessage, "Env")
	}
	if c.ServiceName == "" {
		return fmt.Errorf(missingConfigFieldErrorMessage, "ServiceName")
	}
	return nil
}

func (c DataDogConfig) IsStatsDValid() bool {
	return c.isBaseConfigValid() && c.StatsDUrl != ""
}

func (c DataDogConfig) ValidateStatsD() error {
	if err := c.validateBaseConfig(); err != nil {
		return err
	}
	if c.StatsDUrl == "" {
		return fmt.Errorf(missingConfigFieldErrorMessage, "StatsDUrl")
	}
	return nil
}

func (c DataDogConfig) IsAPMValid() bool {
	return c.isBaseConfigValid() && c.APMUrl != ""
}

func (c DataDogConfig) ValidateAPM() error {
	if err := c.validateBaseConfig(); err != nil {
		return err
	}
	if c.APMUrl == "" {
		return fmt.Errorf(missingConfigFieldErrorMessage, "APMUrl")
	}
	return nil
}

func HTTPResourceNamer(req *http.Request) string {
	return fmt.Sprintf("%s_%s", req.Method, req.URL.Path)
}

func TracingDialOptions(serviceName string) []grpc.DialOption {
	return []grpc.DialOption{
		grpc.WithUnaryInterceptor(
			grpctrace.UnaryClientInterceptor(
				grpctrace.WithServiceName(serviceName)),
		),
		grpc.WithStreamInterceptor(
			grpctrace.StreamClientInterceptor(
				grpctrace.WithServiceName(serviceName),
			),
		),
	}
}

type DataDogRecorder struct {
	Client statsd.ClientInterface
	logger *zap.SugaredLogger
	config *DataDogConfig
}

func NewDataDogRecorder(e *DataDogConfig, logger *zap.SugaredLogger) (*DataDogRecorder, error) {
	if !e.IsStatsDValid() {
		logger.Warn("StatsD is invalid for DataDogConfig: %s", e)
		return nil, nil
	}

	clientStatsd, err := statsd.New(e.StatsDUrl)

	if err != nil {
		return nil, fmt.Errorf("unable to init client: %s", e.StatsDUrl)
	}

	incrErr := clientStatsd.Incr("startup", nil, 1)
	if incrErr != nil {
		return nil, incrErr
	}

	return &DataDogRecorder{
		Client: clientStatsd,
		logger: logger,
		config: e,
	}, nil
}

func addNewTags(dataDogTags *[]string, tags Tags) {
	for k, v := range tags {
		*dataDogTags = append(*dataDogTags, fmt.Sprintf("%s: %s", k, v))
	}
}

func (r *DataDogRecorder) SetupTracing() error {
	// TODO: IsAPMValid should return an error so we can resolve bad configs.
	if r.config.IsAPMValid() {
		tracer.Start(
			tracer.WithEnv(r.config.Env),
			tracer.WithService(r.config.ServiceName),
			tracer.WithServiceVersion(r.config.AppVersion),
			tracer.WithAgentAddr(r.config.APMUrl),
		)

		if r.config.EnableProfiler {
			logger := r.logger.With("Host", r.config.StatsDUrl)

			logger.Infow("Enabling DataDog Profiler...")

			err := profiler.Start(
				profiler.WithEnv(r.config.Env),
				profiler.WithService(r.config.ServiceName),
				profiler.WithVersion(r.config.AppVersion),
				profiler.WithAgentAddr(r.config.APMUrl),
				profiler.WithProfileTypes(
					profiler.CPUProfile,
					profiler.HeapProfile,
					profiler.BlockProfile,
					profiler.MutexProfile,
					profiler.GoroutineProfile,
				),
			)
			if err != nil {
				return err
			}

			logger.Infow("DataDog Profiler enabled.")
		}
	}
	return nil
}

func (r *DataDogRecorder) GRPCUnaryInterceptor() grpc.UnaryServerInterceptor {
	return grpctrace.UnaryServerInterceptor(grpctrace.WithServiceName(r.config.ServiceName))
}

func (r *DataDogRecorder) GRPCStreamInterceptor() grpc.StreamServerInterceptor {
	return grpctrace.StreamServerInterceptor(grpctrace.WithServiceName(r.config.ServiceName))
}

func (r *DataDogRecorder) Count(name string, count int64, tags Tags) {
	var dataDogTags []string
	if r.config != nil {
		addNewTags(&dataDogTags, Tags{
			"app_version": r.config.AppVersion,
			"env":         r.config.Env,
			"service":     r.config.ServiceName,
		})
	}
	addNewTags(&dataDogTags, tags)

	err := r.Client.Count(
		name,
		count,
		dataDogTags,
		1.0)
	if err != nil {
		r.logger.Errorf("Failed to report %d messages sent to Datadog", count)
	}
}

func (r *DataDogRecorder) Gauge(name string, gauge float64, tags Tags) {
	var dataDogTags []string
	if r.config != nil {
		addNewTags(&dataDogTags, Tags{
			"app_version": r.config.AppVersion,
			"env":         r.config.Env,
			"service":     r.config.ServiceName,
		})
	}
	addNewTags(&dataDogTags, tags)

	err := r.Client.Gauge(
		name,
		gauge,
		dataDogTags,
		1.0)
	if err != nil {
		r.logger.Errorf("Failed to report %f value to Datadog", gauge)
	}
}

func (r *DataDogRecorder) SendStatsDServiceCheck(status healthpb.HealthCheckResponse_ServingStatus, dataDogLogServiceName string) {
	if r.Client == nil {
		r.logger.Errorf("unable to send datadog service check: statsd client is nil")
		return
	}

	statsdStatus, ok := servingStatusToStatsD[status]
	if !ok {
		r.logger.Error("unable to map serving status to statsd status")
		statsdStatus = statsd.Unknown
	}

	err := r.Client.ServiceCheck(statsd.NewServiceCheck(dataDogLogServiceName, statsdStatus))
	if err != nil {
		r.logger.Errorw("failed to send service check to datadog", zap.Error(err))
	}
}

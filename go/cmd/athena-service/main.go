package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	athenaauth "github.com/*company-data-covered*/services/go/pkg/athena/auth"
	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	httptrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/net/http"
)

const (
	serviceName                  = "AthenaService"
	authorizationDisabledKey     = "AUTHORIZATION_DISABLED"
	insuranceIDEmptyErrorMessage = "insuranceId is empty"
	patientIDEmptyErrorMessage   = "patientId is empty"
	dataDogLogServiceName        = "athena-service"
)

var (
	grpcAddr                         = flag.String("grpc-listen-addr", ":8472", "GRPC address to listen to")
	defaultGRPCTimeout               = flag.Duration("default-grpc-timeout", 5*time.Second, "Default GRPC timeout")
	httpAddr                         = flag.String("http-listen-addr", ":8182", "HTTP API address to listen to")
	influxDBRetentionPolicy          = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	allowedHTTPOrigins               = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	auth0IssuerURL                   = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	internalAuth0Audience            = flag.String("internal-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for athena service")
	auditServiceGRPCAddr             = flag.String("audit-service-grpc-addr", "localhost:8482", "gRPC address for the audit service")
	refreshTokenInterval             = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	athenaRefreshTokenInterval       = flag.Duration("athena-refresh-token-interval", 30*time.Minute, "time interval for refreshing Athena tokens")
	athenaAuthURL                    = flag.String("athena-auth-url", "https://api.preview.platform.athenahealth.com/oauth2/v1/token", "Athena auth URL")
	practiceID                       = flag.String("athena-practice-id", "13869", "dispatch practice ID for Athena EHR")
	athenaTimeout                    = flag.Duration("athena-timeout", 30*time.Second, "default timeout for athena requests")
	enableRedis                      = flag.Bool("enable-redis", false, "enable redis for caching calls")
	healthCheckInterval              = flag.Duration("health-check-interval", 1*time.Minute, "time interval for triggering a service health check")
	insuranceEligibilityCheckTimeout = flag.Duration("insurance-eligibility-check-timeout", 2*time.Minute, "default timeout for insurance eligibility check")
	enableInsuranceEligibilityCheck  = flag.Bool("enable-insurance-eligibility-check", false, "enable insurance eligibility check")

	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodGet}
)

func main() {
	flag.Parse()
	serviceDescriptors := []protoreflect.ServiceDescriptor{
		athenapb.File_athena_service_proto.Services().ByName(serviceName),
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{ServiceName: serviceName})

	auditServiceConnection, closeAuditServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:        monitoring.DataDogAuditServiceName,
			Address:     auditServiceGRPCAddr,
			DialTimeout: *defaultGRPCTimeout,
			Logger:      logger,
			Env: auth.Auth0Env{
				ClientID:     os.Getenv("ATHENA_SERVICE_M2M_AUTH0_CLIENT_ID"),
				ClientSecret: os.Getenv("ATHENA_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
				Audience:     *internalAuth0Audience,
				IssuerURL:    *auth0IssuerURL,
			},
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeAuditServiceConn()
	auditClient := auditpb.NewAuditServiceClient(auditServiceConnection)
	auditInterceptor, err := audit.NewAuditInterceptor(
		serviceName,
		auditClient,
		serviceDescriptors,
	)
	if err != nil {
		logger.Panicw("failed to initialize audit interceptor", zap.Error(err))
	}

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			athenapb.File_athena_service_proto.Services().ByName(serviceName),
			healthcheck.HealthcheckServiceDescriptor,
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *internalAuth0Audience,
		},
		ExtraUnaryServerInterceptors: []grpc.UnaryServerInterceptor{auditInterceptor.CreateEvent},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		InfluxEnv:             monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		StatsigProviderConfig: baseserv.DefaultEnvStatsigProviderConfig(),
		DataDogConfig:         baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	athenaAuthToken, err := auth.NewAutoRefreshToken(
		athenaauth.Config{
			ClientID:     os.Getenv("ATHENA_CLIENT_ID"),
			ClientSecret: os.Getenv("ATHENA_SECRET_KEY"),
			AuthURL:      *athenaAuthURL,
			Timeout:      *athenaTimeout,
		},
		*athenaRefreshTokenInterval)
	if err != nil {
		logger.Panicw("could not initialize token", "service", "station", zap.Error(err))
	}
	err = athenaAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start token", "service", "station", zap.Error(err))
	}
	athenaClient, err := athena.NewClient(athena.NewClientParams{
		AuthToken:  athenaAuthToken,
		BaseURL:    os.Getenv("ATHENA_BASE_URL"),
		PracticeID: *practiceID,
		HTTPClient: &http.Client{
			Timeout: *athenaTimeout,
			Transport: httptrace.WrapRoundTripper(
				http.DefaultTransport,
				httptrace.RTWithServiceName(dataDogLogServiceName),
				httptrace.RTWithResourceNamer(monitoring.HTTPResourceNamer),
				httptrace.RTWithAnalytics(true)),
		},
		DataDogRecorder: server.DataDogRecorder(),
	})
	if err != nil {
		logger.Panicw("could not initialize athena client", zap.Error(err))
	}

	statsigProvider := server.StatsigProvider()
	if statsigProvider == nil {
		logger.Panic("no statsig provider")
	}

	var redisClient *redisclient.Client
	if *enableRedis {
		redisURL := os.Getenv("REDIS_URL")
		if redisURL == "" {
			logger.Panic("REDIS_URL not set")
		}
		redisClient, err = redisclient.New(&redisclient.Config{
			ServiceName: serviceName,
			RedisURL:    redisURL,
			AuditClient: &auditClient,
		})
		if err != nil {
			logger.Panicw("failed to create redis client", zap.Error(err))
		}
	}

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()

	serverConfig := &GRPCServer{
		AuthToken:                       athenaAuthToken,
		AthenaClient:                    athenaClient,
		DBService:                       NewAthenaDB(db),
		RedisClient:                     redisClient,
		StatsigProvider:                 statsigProvider,
		Logger:                          logger,
		EnableInsuranceEligibilityCheck: *enableInsuranceEligibilityCheck,
	}

	healthServer := &HealthCheckServer{
		AthenaClient:             athenaClient,
		AuditHealthServiceClient: healthpb.NewHealthClient(auditServiceConnection),
		Logger:                   logger,
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthServer.Check,
		DataDogRecorder:       server.DataDogRecorder(),
		DataDogLogServiceName: dataDogLogServiceName,
		Logger:                logger,
	}

	healthCheckPoller.Start()

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			athenapb.RegisterAthenaServiceServer(grpcServer, serverConfig)
			healthpb.RegisterHealthServer(grpcServer, healthServer)
		})
		if err != nil {
			server.Logger().Panic(err)
		}
	}()
	// TODO: change local httpResponseModifier for grpcgateway.HTTPResponseModifier
	mux := runtime.NewServeMux(runtime.WithForwardResponseOption(httpResponseModifier))

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	parsedAllowedHTTPOrigins := strings.Split(*allowedHTTPOrigins, ",")
	config := cors.Config{
		AllowedHTTPHeaders: allowedHTTPHeaders,
		AllowedHTTPMethods: allowedHTTPMethods,
		AllowedHTTPOrigins: parsedAllowedHTTPOrigins,
	}
	corsInstance, err := cors.Initialize(config)
	if err != nil {
		logger.Panicw("error initializing cors", zap.Error(err))
	}
	if err = http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicw("error serving http", zap.Error(err))
	}
}

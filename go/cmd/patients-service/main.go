package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName              = "PatientsService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
)

var (
	grpcAddr                         = flag.String("grpc-listen-addr", ":8471", "GRPC address to listen to")
	httpAddr                         = flag.String("http-listen-addr", ":8473", "HTTP address to listen to")
	defaultGRPCTimeout               = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	stationURL                       = flag.String("station-url", "http://localhost:3000", "station url")
	influxDBRetentionPolicy          = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	auth0IssuerURL                   = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	refreshTokenInterval             = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	auditServiceGRPCAddr             = flag.String("audit-service-grpc-addr", "localhost:8482", "GRPC address of the audit service")
	athenaServiceGRPCAddr            = flag.String("athena-service-grpc-addr", "localhost:8472", "GRPC address of the Athena service")
	stationPatientsServiceGRPCAddr   = flag.String("station-patients-service-grpc-addr", "localhost:9001", "GRPC address of the Station Patients service")
	internalAuth0Audience            = flag.String("internal-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for internal api")
	healthCheckInterval              = flag.Duration("health-check-interval", 1*time.Minute, "time interval for triggering a service health check")
	insuranceEligibilityCheckTimeout = flag.Duration("insurance-eligibility-check-timeout", 2*time.Minute, "default timeout for insurance eligibility check")
)

func auth0Env() auth.Auth0Env {
	return auth.Auth0Env{
		ClientID:     os.Getenv("PATIENTS_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("PATIENTS_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *internalAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}
}

func main() {
	flag.Parse()
	serviceDescriptors := []protoreflect.ServiceDescriptor{
		patientspb.File_patients_service_proto.Services().ByName(serviceName),
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{ServiceName: serviceName})

	auditServiceConnection, closeAuditServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 monitoring.DataDogAuditServiceName,
			Address:              auditServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeAuditServiceConn()

	auditInterceptor, err := audit.NewAuditInterceptor(
		serviceName,
		auditpb.NewAuditServiceClient(auditServiceConnection),
		serviceDescriptors,
	)
	if err != nil {
		log.Panicf("failed to initialize audit interceptor, err: %s", err)
	}

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName:             serviceName,
		GRPCServiceDescriptors: serviceDescriptors,
		GRPCAddr:               *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv("AUTHORIZATION_DISABLED") == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *internalAuth0Audience,
		},
		ExtraUnaryServerInterceptors: []grpc.UnaryServerInterceptor{auditInterceptor.CreateEvent},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		StatsigProviderConfig: baseserv.DefaultEnvStatsigProviderConfig(),
		InfluxEnv:             monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		DataDogConfig:         baseserv.DefaultEnvDataDogConfig(monitoring.DataDogPatientsServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	athenaServiceConnection, closeAthenaServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 "athena",
			Address:              athenaServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeAthenaServiceConn()

	stationPatientsServiceConnection, closeStationPatientsServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 "station_patients",
			Address:              stationPatientsServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeStationPatientsServiceConn()

	stationAuthToken, err := auth.NewAutoRefreshToken(auth0Env(), *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not initialize token", "service", "station", zap.Error(err))
	}
	err = stationAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start token", "service", "station", zap.Error(err))
	}

	stationClient := &station.Client{
		AuthToken:  stationAuthToken,
		StationURL: *stationURL,
	}

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()

	serverConfig := &GRPCServer{
		StationClient:         stationClient,
		StationPatientsClient: stationpatientspb.NewStationPatientsServiceClient(stationPatientsServiceConnection),
		AthenaClient:          athenapb.NewAthenaServiceClient(athenaServiceConnection),
		Logger:                logger,
		DBService:             NewPatientsDB(db),
		StatsigProvider:       server.StatsigProvider(),
		DataDogRecorder:       server.DataDogRecorder(),
	}

	healthServer := &HealthCheckServer{
		AthenaHealthServiceClient: healthpb.NewHealthClient(athenaServiceConnection),
		StationClient:             stationClient,
		Logger:                    logger,
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthServer.Check,
		DataDogRecorder:       server.DataDogRecorder(),
		DataDogLogServiceName: monitoring.DataDogPatientsServiceName,
		Logger:                logger,
	}

	healthCheckPoller.Start()

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			patientspb.RegisterPatientsServiceServer(grpcServer, serverConfig)
			healthpb.RegisterHealthServer(grpcServer, healthServer)
		})
		if err != nil {
			logger.Panic(err)
		}
	}()

	mux := runtime.NewServeMux()
	err = patientspb.RegisterPatientsServiceHandlerServer(ctx, mux, serverConfig)
	if err != nil {
		logger.Panicw("Could not register proxy endpoint", err)
	}

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	if err = http.ListenAndServe(*httpAddr, mux); err != nil {
		logger.Panicf("error serving http: %s", err)
	}
}

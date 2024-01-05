package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/station"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const (
	serviceName              = "ClinicalKpiService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	healthServiceName        = "ClinicalKpiHealthService"
	dbName                   = "ClinicalKPIDB"
	dataDogLogServiceName    = "clinicalkpi-service"
	dbSeedErrorTemplate      = "Error seeding DB"
	changeDaysPeriod         = 7
	lookBackShiftsTrendDays  = 7
)

var (
	grpcAddr                = flag.String("grpc-listen-addr", ":8183", "GRPC address to listen to")
	httpAddr                = flag.String("http-addr", ":8182", "HTTP API address to listen to")
	stationURL              = flag.String("station-url", "http://localhost:3000", "station url")
	opaURL                  = flag.String("opa-url", "http://localhost:8181", "OPA url")
	influxDBRetentionPolicy = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	auth0IssuerURL          = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	auth0Audience           = flag.String("auth0-audience", auth.LogicalAPIAudience, "auth0 audience for clinicalKPI service")
	allowedHTTPOrigins      = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	refreshTokenInterval    = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	stationAuth0Audience    = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")
	grpcDialTimeout         = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")
	healthCheckInterval     = flag.Duration("health-check-interval", 5*time.Minute, "time interval for triggering a service health check")
	allowedHTTPHeaders      = []string{"*"}
	allowedHTTPMethods      = []string{http.MethodGet}
	authorizationDisabled   = os.Getenv(authorizationDisabledKey) == "true"

	completedCareRequestsThreshold = flag.Int("completed-care-requests-threshold", 80, "the threshold that will prevent returning calculated metrics for a provider")

	seedCalculatedMetricsOnServerStart = flag.Bool("seed-calculated-metrics", false, "seeds metrics for each provider in Station to the calculated metrics table")
	seedStagingMetricsOnServerStart    = flag.Bool("seed-staging-metrics", false, "seeds metrics for each provider in Station to the staging metrics table")
	seedLeaderHubMetricsOnServerStart  = flag.Bool("seed-leader-hub-metrics", false, "seeds metrics for each provider in Station to the leader hub tables")
	seedLookBackMetricsOnServerStart   = flag.Bool("seed-look-back-metrics", false, "seeds metrics for each provider in Station to the look back tables")

	devMode = flag.Bool("dev-mode", false, "Enables dev mode logging")
)

func main() {
	flag.Parse()

	policyServiceEnabled := func() bool {
		return !authorizationDisabled
	}

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			clinicalkpi.File_clinicalkpi_service_proto.Services().ByName(serviceName),
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: authorizationDisabled,
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *devMode,
		},
		InfluxEnv:     monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
		GRPCPolicyAuthorizerConfig: &auth.GRPCPolicyAuthorizerConfig{
			Enabled:              policyServiceEnabled,
			PolicyServiceBaseURL: *opaURL,
		},
		StatsigProviderConfig: baseserv.DefaultEnvStatsigProviderConfig(),
	})

	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()

	stationAuthToken, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("CLINICALKPI_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("CLINICALKPI_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *stationAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not create a refresh token", zap.Error(err))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	err = stationAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start refresh token", zap.Error(err))
	}

	statsigProvider := server.StatsigProvider()
	if statsigProvider == nil {
		logger.Panic("no statsig provider")
	}

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()
	var cdbScope monitoring.Scope = &monitoring.NoopScope{}
	if ir := server.InfluxRecorder(); ir != nil {
		cdbScope = ir.With(dbName, nil, nil)
	}
	clinicalkpiDB := clinicalkpidb.NewClinicalKPIDB(db, cdbScope, server.DataDogRecorder())
	kpiServer := NewGRPCServer(gRPCServerParams{
		dbService: clinicalkpiDB,
		stationClient: &station.Client{
			AuthToken:  stationAuthToken,
			StationURL: *stationURL,
		},
		statsigProvider: statsigProvider,
		logger:          logger,
	})

	healthServer := &HealthCheckServer{
		DBService: clinicalkpiDB,
		Logger:    logger,
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
			clinicalkpi.RegisterClinicalKpiServiceServer(grpcServer, kpiServer)
			healthpb.RegisterHealthServer(grpcServer, healthServer)
		})

		if err != nil {
			logger.Panic("GRPC Server failed!")
		}
	}()

	type GRPCRequest struct {
		Request    any
		Policy     auth.PolicyRule
		Serializer auth.PolicyResourceSerializer
	}
	var grpcRequests = []GRPCRequest{
		{
			Request:    &clinicalkpi.ListProviderVisitsRequest{},
			Policy:     auth.PolicyClinicalKpiMarketMetrics,
			Serializer: nil,
		},
		{
			Request:    &clinicalkpi.ListProviderShiftsRequest{},
			Policy:     auth.PolicyClinicalKpiMarketMetrics,
			Serializer: nil,
		},
		{
			Request:    &clinicalkpi.GetProviderOverallMetricsRequest{},
			Policy:     auth.PolicyClinicalKpiMarketMetrics,
			Serializer: nil,
		},
		{
			Request:    &clinicalkpi.GetProviderOverallMetricsRequest{},
			Policy:     auth.PolicyClinicalKpiMarketRole,
			Serializer: &GetProviderOverallMetricsRequestSerializer{ClinicalKpiPolicyResourceSerializer{dbService: clinicalkpiDB}},
		},
		{
			Request:    &clinicalkpi.GetMarketOverallMetricsRequest{},
			Policy:     auth.PolicyClinicalKpiMarketRole,
			Serializer: &GetMarketOverallMetricsRequestSerializer{},
		},
		{
			Request:    &clinicalkpi.ListProviderMetricsByMarketRequest{},
			Policy:     auth.PolicyClinicalKpiMarketRole,
			Serializer: &ListProviderMetricsByMarketRequestSerializer{},
		},
		{
			Request:    &clinicalkpi.GetProviderMetricsByMarketRequest{},
			Policy:     auth.PolicyClinicalKpiMarketRole,
			Serializer: &GetProviderMetricsByMarketRequestSerializer{ClinicalKpiPolicyResourceSerializer{dbService: clinicalkpiDB}},
		},
		{
			Request:    &clinicalkpi.GetProviderLookBackRequest{},
			Policy:     auth.PolicyClinicalKpiPersonalMetrics,
			Serializer: &GetProviderLookBackSerializer{},
		},
	}

	for _, req := range grpcRequests {
		err := server.GRPCPolicyAuthorizer().RegisterGRPCRequest(req.Request, req.Policy, req.Serializer)
		if err != nil {
			log.Panicf("failed to register grpc request, err: %s", err)
		}
	}

	if *seedCalculatedMetricsOnServerStart {
		err := seedCalculatedMetrics(ctx, logger, kpiServer, clinicalkpiDB)
		if err != nil {
			logger.Errorw(dbSeedErrorTemplate, zap.Error(err))
		}
	}

	if *seedStagingMetricsOnServerStart {
		err := seedStagingMetrics(ctx, logger, kpiServer, clinicalkpiDB)
		if err != nil {
			logger.Errorw(dbSeedErrorTemplate, zap.Error(err))
		}
	}

	if *seedLeaderHubMetricsOnServerStart {
		err := seedLeaderHubMetrics(ctx, logger, kpiServer, clinicalkpiDB)
		if err != nil {
			logger.Errorw(dbSeedErrorTemplate, zap.Error(err))
		}
	}

	if *seedLookBackMetricsOnServerStart {
		err := seedLookBackDailyMetrics(ctx, logger, kpiServer, clinicalkpiDB)
		if err != nil {
			logger.Errorw(dbSeedErrorTemplate, zap.Error(err))
		}
	}

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	opts = append(opts, monitoring.TracingDialOptions(dataDogLogServiceName)...)

	healthCheckGRPCConnection, closeHealthCheckConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"healthcheck",
		grpcAddr,
		opts,
		*grpcDialTimeout,
		logger,
	)
	defer closeHealthCheckConn()

	mux := runtime.NewServeMux(
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
		runtime.WithHealthEndpointAt(healthpb.NewHealthClient(healthCheckGRPCConnection), "/healthcheck"),
	)

	err = clinicalkpi.RegisterClinicalKpiServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, opts)
	if err != nil {
		logger.Panicw("Could not register proxy endpoint", err)
	}

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	parsedAllowedHTTPOrigins := strings.Split(*allowedHTTPOrigins, ",")
	config := cors.Config{
		AllowedHTTPHeaders: allowedHTTPHeaders,
		AllowedHTTPMethods: allowedHTTPMethods,
		AllowedHTTPOrigins: parsedAllowedHTTPOrigins,
	}

	corsInstance, err := cors.Initialize(config)
	if err != nil {
		logger.Panicf("initialize cors error: %s", err)
	}
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicf("error serving http: %s", err)
	}
}

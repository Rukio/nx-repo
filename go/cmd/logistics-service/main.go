package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"
	"googlemaps.github.io/maps"
)

const (
	httpGoogleMapsRoutesAPIClientType = "routes-api-http"
	grpcGoogleMapsRoutesAPIClientType = "routes-api-grpc"
	v1GoogleMapsRoutesAPIClientType   = "distance-matrix-http"
)

var (
	httpAddr = flag.String("http-listen-addr", ":8080", "HTTP address to listen to")
	grpcAddr = flag.String("grpc-listen-addr", ":8081", "GRPC address to listen to")

	osrmAddr          = flag.String("osrm-addr", "http://127.0.0.1:5050", "OSRM Backend http address")
	optimizerGRPCAddr = flag.String("optimizer-grpc-addr", "", "Optimizer GRPC address")
	stationGRPCAddr   = flag.String("station-grpc-addr", "", "Station GRPC address")
	enableGoogleMaps  = flag.Bool("use-google-maps", false, "Use Google Maps for distance matrix and routing instead of OSRM")

	googleMapsRoutesAPIClientType = flag.String("google-maps-client-type", v1GoogleMapsRoutesAPIClientType,
		fmt.Sprintf("Google Maps distance matrix client type. One of %v",
			[]string{v1GoogleMapsRoutesAPIClientType, httpGoogleMapsRoutesAPIClientType, grpcGoogleMapsRoutesAPIClientType}))

	googleMapsMatrixRequestsPerSec = flag.Int("google-maps-matrix-reqs-per-sec-limit", 50, "Max number of distance matrix requests per second to send to Google Maps. 0 means unlimited.")
	googleMapsMatrixElementsPerSec = flag.Int("google-maps-matrix-elements-per-sec-limit", 400, "Max number of distance matrix elements per second to send to Google Maps. 0 means unlimited.")
	googleMapsRouteReqPerSec       = flag.Int("google-maps-route-reqs-per-sec-limit", 50, "Max number of route requests per second to send to Google Maps. 0 means unlimited.")

	enableDevServer         = flag.Bool("dev-server", false, "Expose Dev server for demo purposes")
	devServerStaticDir      = flag.String("static-dir", "go/pkg/logistics/demo/static", "Dev server static asset directory")
	influxDBRetentionPolicy = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")

	optimizerSettingsPollInterval = flag.Duration(
		"optimizer-settings-poll-interval", 0,
		"Poll interval for retrieving new optimizer region settings from database. If poll interval is 0, then the optimizer runner will not be enabled")

	auth0IssuerURL         = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	logisticsAuth0Audience = flag.String("auth0-audience", fmt.Sprintf("%s,logistics-service.*company-data-covered*.com", auth.LogicalAPIAudience), "auth0 audience for logistics service")
	stationAuth0Audience   = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")

	grpcDialTimeout          = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")
	grpcServerPerCallTimeout = flag.Duration("grpc-server-per-call-timeout", 5*time.Second, "Timeout for incoming GRPC server calls to return. 0 means do not set a timeout.")
	grpcServerPerCallIgnore  = flag.String("grpc-server-per-call-timeout-ignore", "", "Comma-seperated list of RPC method strings that should ignore the set timeout in the format of '/package.service/method'.")
	grpcRoundRobin           = flag.Bool("grpc-round-robin", false, "Use round robin load balancing policy")

	dbPoolStatsReportInterval = flag.Duration("db-pool-stats-report-interval", 0, "Interval between reporting database connection pooling statistics. 0 means do not report statistics.")
	dbLockPoolQueryTimeout    = flag.Duration("lock-db-pool-query-timeout", 5*time.Minute, "Timeout for queries in lock database pool.")

	refreshTokenInterval            = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	maxRestBreaksPerShiftTeamPerDay = flag.Uint("max-rest-breaks-per-shift-team-per-day", 1, "number of rest breaks a shift team can take in a day")

	statsigOptimizerSettingsRefreshInterval = flag.Duration("statsig-optimizer-settings-refresh-interval", 1*time.Minute, "time interval for refreshing optimizer settings from Statsig. 0 means do not use Statsig for optimizer settings.")
	getLatestDistancesForLocationsBatchSize = flag.Uint("get-latest-distances-for-locations-batch-size", 0, "batch size for BatchGetLatestDistancesForLocations")
)

const (
	serviceName                          = "LogisticsService"
	authorizationDisabledKey             = "AUTHORIZATION_DISABLED"
	checkFeasibilityDiagnosticsEnableKey = "DEBUG_ENABLE_CHECK_FEASIBILITY_DIAGNOSTICS"
	dataDogLogServiceName                = "logistics-service"

	googleMapsAPIKeyEnvVar = "GOOGLE_MAPS_API_KEY"
)

func getM2MToken(logger *zap.SugaredLogger) *auth.AutoRefreshToken {
	token, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("LOGISTICS_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("LOGISTICS_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *stationAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not initialize M2M token", zap.Error(err))
	}

	return token
}

func main() {
	flag.Parse()

	var serverInterceptors []grpc.UnaryServerInterceptor
	if *grpcServerPerCallTimeout > 0 {
		ignoreList := strings.Split(*grpcServerPerCallIgnore, ",")
		ignoreMap := make(map[string]struct{})
		for _, ignoreFunc := range ignoreList {
			ignoreMap[ignoreFunc] = struct{}{}
		}
		serverInterceptors = append(serverInterceptors, baseserv.GRPCPerCallTimeoutWithIgnore(*grpcServerPerCallTimeout, ignoreMap))
	}

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			logisticspb.File_logistics_service_proto.Services().ByName(serviceName),
		},
		GRPCAddr: *grpcAddr,
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *enableDevServer,
		},
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled:  os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:              *auth0IssuerURL,
			Audience:               *logisticsAuth0Audience,
			AllowMultipleAudiences: true,
		},

		ExtraUnaryServerInterceptors: serverInterceptors,
		InfluxEnv:                    monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		StatsigProviderConfig:        baseserv.DefaultEnvStatsigProviderConfig(),
		DataDogConfig:                baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
	})
	if err != nil {
		log.Panic("could not initialize server", err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("Logistics", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	grpcDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	}

	if *stationGRPCAddr != "" {
		authToken := getM2MToken(logger)
		err = authToken.Start(ctx)
		if err != nil {
			logger.Panicw("could not start refreshing M2M token", zap.Error(err))
		}

		grpcDialOptions = append(grpcDialOptions, grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
			Token: authToken,
		}))
	}

	if *grpcRoundRobin {
		grpcDialOptions = append(grpcDialOptions, grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`))
	}

	grpcDialOptions = append(grpcDialOptions, monitoring.TracingDialOptions(dataDogLogServiceName)...)

	var ldbScope monitoring.Scope = &monitoring.NoopScope{}
	var mapScope monitoring.Scope = &monitoring.NoopScope{}
	var runnerScope monitoring.Scope = &monitoring.NoopScope{}
	if ir := server.InfluxRecorder(); ir != nil {
		ldbScope = ir.With("LogisticsDB", nil, nil)
		mapScope = ir.With("MapService", nil, nil)
		runnerScope = ir.With("", nil, nil)

		grpcDialOptions = append(grpcDialOptions, grpc.WithStatsHandler(server.InfluxRecorder().GRPCStatsHandler()))
	}

	var optimizerGRPC *grpc.ClientConn
	if *optimizerGRPCAddr != "" {
		dialCtx, dialCancel := context.WithTimeout(context.Background(), *grpcDialTimeout)
		defer dialCancel()
		optimizerGRPC, err = grpc.DialContext(dialCtx, *optimizerGRPCAddr, grpcDialOptions...)
		if err != nil {
			logger.Panicw("could not connect to optimizer GRPC",
				"addr", *optimizerGRPCAddr,
				zap.Error(err))
		}

		logger.Infow("Optimizer GRPC connected", "state", optimizerGRPC.GetState())

		defer optimizerGRPC.Close()
	}

	var stationGRPC *grpc.ClientConn
	if *stationGRPCAddr != "" {
		dialCtx, dialCancel := context.WithTimeout(context.Background(), *grpcDialTimeout)
		defer dialCancel()
		stationGRPC, err = grpc.DialContext(dialCtx, *stationGRPCAddr, grpcDialOptions...)
		if err != nil {
			logger.Panicw("could not connect to station GRPC",
				"addr", *stationGRPCAddr,
				zap.Error(err))
		}

		logger.Infow("Station GRPC connected",
			"state", stationGRPC.GetState())

		defer stationGRPC.Close()
	}

	dbConfig := basedb.DefaultEnvConfig(logger)
	db := basedb.Connect(ctx, logger, dbConfig)
	defer db.Close()
	if ir := server.InfluxRecorder(); ir != nil && *dbPoolStatsReportInterval > 0 {
		r := ir.DBPoolStatsRecorder(db, *dbPoolStatsReportInterval)
		r.Start(ctx)
	}
	mapSrcLDB := logisticsdb.NewLogisticsDB(db, nil, nil, ldbScope)

	osrmSource, err := mapSrcLDB.GetDistanceSourceByShortName(ctx, logisticsdb.OSRMMapsSourceShortName)
	if err != nil {
		logger.Panicw("could not find map source", "short_name", logisticsdb.OSRMMapsSourceShortName, zap.Error(err))
	}
	osrmMapService := logistics.NewOSRMService(*osrmAddr, osrmSource.ID, mapScope.With("", monitoring.Tags{"service": "osrm"}, nil))
	osrmMapServiceHealthChecker := HealthChecker(osrmMapService)

	mapService := logistics.MapService(osrmMapService)

	var gmapsServiceHealthChecker HealthChecker
	if *enableGoogleMaps {
		gmapsSource, err := mapSrcLDB.GetDistanceSourceByShortName(ctx, logisticsdb.GoogleMapsSourceShortName)
		if err != nil {
			logger.Panicw("could not find map source", "short_name", logisticsdb.GoogleMapsSourceShortName, zap.Error(err))
		}

		gmapsService, cleanup := googleMapsService(logger, gmapsSource.ID, mapScope)
		defer cleanup()

		mapService = gmapsService
		gmapsServiceHealthChecker = gmapsService
	}

	statsigProvider := server.StatsigProvider()
	if statsigProvider == nil {
		log.Panic("no statsig provider")
	}
	statsigSettingsSvc := &optimizersettings.StatsigService{
		StatsigProvider: statsigProvider,
		RefreshInterval: *statsigOptimizerSettingsRefreshInterval,
		Logger:          logger.Named("statsig_optimizer_settings"),
	}
	statsigSettingsSvc.Start(ctx)

	lockDBConfig := basedb.Config{
		URL:             basedb.DatabaseURL(),
		PerQueryTimeout: *dbLockPoolQueryTimeout,
	}
	lockDB := basedb.Connect(ctx, logger, lockDBConfig)
	logisticsLocker := logisticsdb.NewLockDB(lockDB, logger.Named("logistics_lock_db"), ldbScope)

	defer lockDB.Close()

	mapServicePicker := logistics.NewMapServicePicker(osrmMapService, mapService, statsigSettingsSvc)
	ldb := logisticsdb.NewLogisticsDB(db, mapServicePicker, statsigSettingsSvc, ldbScope)
	ldb.QuerySettings = logisticsdb.QuerySettings{
		GetLatestDistancesForLocationsBatchSize: *getLatestDistancesForLocationsBatchSize,
	}

	optimizerService := optimizerpb.NewOptimizerServiceClient(optimizerGRPC)

	serverConfig := &GRPCServer{
		ShiftTeamService: shiftteampb.NewShiftTeamServiceClient(stationGRPC),
		EpisodeService:   episodepb.NewEpisodeServiceClient(stationGRPC),
		MarketService:    marketpb.NewMarketServiceClient(stationGRPC),
		OptimizerService: optimizerService,
		VRPSolver: &optimizer.VRPSolver{
			OptimizerServiceClient: optimizerService,
			SolveVRPLogisticsDB:    ldb,
			RouteProvider:          nil,
		},
		SettingsService:  statsigSettingsSvc,
		StatsigProvider:  statsigProvider,
		MapServicePicker: mapServicePicker,

		Cfg: GRPCServerConfig{
			MaxRestBreaksPerShiftTeamPerDay:   int64(*maxRestBreaksPerShiftTeamPerDay),
			EnableCheckFeasibilityDiagnostics: os.Getenv(checkFeasibilityDiagnosticsEnableKey) == "true",
		},
		LogisticsDB: ldb,
		LockDB:      logisticsLocker,
	}
	if err := serverConfig.Validate(); err != nil {
		logger.Panicw("invalid server config", zap.Error(err))
	}

	go func() {
		err := server.ServeGRPC(func(grpcServer *grpc.Server) {
			logisticspb.RegisterLogisticsServiceServer(grpcServer, serverConfig)
		})
		if err != nil {
			logger.Panic("GRPC Server failed!")
		}
	}()

	httpServer := &Server{
		Optimizer:                 optimizerGRPC,
		MapService:                mapService,
		NearestWaypointMapService: osrmMapService,

		GRPCServer: serverConfig,

		LogisticsDB: ldb,

		GoogleMapsHealthChecker: gmapsServiceHealthChecker,
		OSRMHealthChecker:       osrmMapServiceHealthChecker,
	}

	if *optimizerSettingsPollInterval > 0 {
		optimizerRunner := optimizer.NewRunner(ldb, optimizerGRPC, logger, runnerScope, *optimizerSettingsPollInterval, statsigSettingsSvc)
		optimizerRunner.Start(ctx)
	}

	router := http.NewServeMux()
	router.HandleFunc("/version", handleMethod(http.MethodGet, httpServer.version))
	router.HandleFunc("/healthcheck", handleMethod(http.MethodGet, httpServer.healthCheck))
	router.HandleFunc("/optimizer-run", handleMethod(http.MethodGet, httpServer.optimizerRun))
	router.HandleFunc("/care-request-check-feasibility-history", handleMethod(http.MethodGet, httpServer.careRequestCheckFeasibility))
	router.HandleFunc("/market", handleMethod(http.MethodGet, httpServer.market))
	router.HandleFunc("/market/feasibility", handleMethod(http.MethodPost, httpServer.updateMarketFeasibilityCheckSettings))

	if *enableDevServer {
		devServer := *NewDevServer(httpServer)
		router.HandleFunc("/api/example-vrp", handleMethod(http.MethodGet, devServer.exampleVRP))
		router.HandleFunc("/api/example-vrp-bounds", handleMethod(http.MethodGet, devServer.exampleVRPBounds))
		router.HandleFunc("/api/solve-vrp", handleMethod(http.MethodPost, devServer.solveVRP))
		router.HandleFunc("/api/solve-vrp-status", handleMethod(http.MethodGet, devServer.solveVRPStatus))

		router.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(*devServerStaticDir))))
	}

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	if err := http.ListenAndServe(*httpAddr, router); err != nil {
		logger.Panicw("http server failed", zap.Error(err))
	}
}

func googleMapsService(logger *zap.SugaredLogger, sourceID int64, mapScope monitoring.Scope) (*logistics.GoogleMapsService, func()) {
	apiKeyValue := os.Getenv(googleMapsAPIKeyEnvVar)
	apiKeys := strings.Split(apiKeyValue, ",")
	if len(apiKeys) == 0 {
		logger.Panicf("No Google Maps API keys supplied: %v", googleMapsAPIKeyEnvVar)
	}
	for i, key := range apiKeys {
		if key == "" {
			logger.Panicf("Some empty API key: %d: %v", i, googleMapsAPIKeyEnvVar)
		}
	}

	apiKeyPicker := logistics.NewAPIKeyPicker(apiKeys, rand.New(rand.NewSource(time.Now().UnixNano())))

	c, err := maps.NewClient(maps.WithAPIKey(apiKeys[0]))
	if err != nil {
		logger.Panic(err)
	}

	var rc logistics.MapsRoutesAPIClient
	var pdmc logistics.PathDistanceMatrixClient
	var limits logistics.GoogleMapsLimits

	var cleanup func()
	switch *googleMapsRoutesAPIClientType {
	case v1GoogleMapsRoutesAPIClientType:
		rc = &logistics.RoutesAPIAdapter{
			Client: c,
		}
		pdmc = nil
		limits = logistics.GoogleMapsAdvancedAPILimits

	case httpGoogleMapsRoutesAPIClientType:
		c := logistics.NewHTTPRoutesAPIClient(apiKeyPicker)
		rc = c
		pdmc = c

		limits = logistics.GoogleMapsRoutesAPITrafficAwareLimits

	case grpcGoogleMapsRoutesAPIClientType:
		grc := &logistics.GRPCRoutesAPIClient{
			APIKeys: apiKeyPicker,
		}
		err = grc.Start()
		if err != nil {
			logger.Panicw("could not start RouteGRPCClient", zap.Error(err))
		}
		cleanup = grc.Cleanup
		rc = grc
		pdmc = grc
		limits = logistics.GoogleMapsRoutesAPITrafficAwareLimits

	default:
		logger.Panicw("unknown google-maps-client-type", "type", *googleMapsRoutesAPIClientType)
	}

	if cleanup == nil {
		cleanup = func() {}
	}

	gmapsService := &logistics.GoogleMapsService{
		Client:                   c,
		RoutesAPIClient:          rc,
		PathDistanceMatrixClient: pdmc,

		Limits:          limits,
		MatrixThrottler: logistics.NewThrottler(*googleMapsMatrixRequestsPerSec, *googleMapsMatrixElementsPerSec, limits, logistics.MatrixThrottlerErrors),
		RouteThrottler:  logistics.NewThrottler(*googleMapsRouteReqPerSec, 0, limits, logistics.RouteThrottlerErrors),

		DistanceSourceID: sourceID,
		ScopedMetrics:    mapScope.With("", monitoring.Tags{"service": "google_maps"}, nil),
	}
	if pdmc == nil {
		gmapsService.PathDistanceMatrixClient = gmapsService
	}

	return gmapsService, cleanup
}

package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	addresspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/address"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	visitvaluepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/visit_value"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const (
	careManagerServiceName   = "CareManagerService"
	visitValueServiceName    = "VisitValueService"
	healthServiceName        = "HealthCheckService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	segmentWriteKey          = "CAREMANAGER_SERVICE_SEGMENT_WRITE_KEY"
	segmentURL               = "https://api.segment.io/v1/track"
)

var (
	grpcAddr = flag.String("grpc-listen-addr", ":8081", "GRPC address to listen to")
	httpAddr = flag.String("http-listen-addr", ":8080", "HTTP address to listen to")

	stationURL               = flag.String("station-url", "http://localhost:3000", "URL for the station API")
	stationGRPCAddr          = flag.String("station-grpc-addr", "127.0.0.1:9001", "Station GRPC address")
	auditServiceGRPCAddr     = flag.String("audit-service-grpc-addr", "127.0.0.1:8482", "gRPC address for the Audit service")
	logisticsServiceGRPCAddr = flag.String("logistics-service-grpc-addr", "127.0.0.1:8081", "gRPC address for the Logistics service")
	grpcDialTimeout          = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")

	influxDBRetentionPolicy = flag.String("influx-db-retention-policy", "autogen", "InfluxDB retention policy")

	auth0IssuerURL                = flag.String("auth0-issuer-url", "https://dispatch-development.auth0.com/", "Auth0 issuer URL")
	auth0Audience                 = flag.String("auth0-audience", fmt.Sprintf("%s,caremanager-service.*company-data-covered*.com", auth.LogicalAPIAudience), "Auth0 audience for caremanager service")
	auth0AuditServiceAudience     = flag.String("auth0-audit-service-audience", auth.LogicalAPIAudience, "Auth0 audience for audit service")
	auth0LogisticsServiceAudience = flag.String("auth0-logistics-service-audience", auth.LogicalAPIAudience, "Auth0 audience for logistics service")
	// TODO (CO-1415): Remove support for multiple audiences.
	allowMultipleAudiences     = flag.Bool("allow-multiple-audiences", true, "accept multiple audiences, useful for serving external and internal requests")
	refreshTokenInterval       = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	stationCareManagerUserRole = flag.String("station-caremanager-user-role", "caremanager", "CareManager user role defined in Station")

	devMode = flag.Bool("dev-mode", false, "Enables dev mode logging")

	allowedHTTPOrigins = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodHead, http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete}
	// https://grpc-ecosystem.github.io/grpc-gateway/docs/development/grpc-gateway_v2_migration_guide/#we-now-use-the-camelcase-json-names-by-default
	openAPIMarshaller = &runtime.HTTPBodyMarshaler{
		Marshaler: &runtime.JSONPb{
			MarshalOptions: protojson.MarshalOptions{
				UseProtoNames:   true,
				EmitUnpopulated: true,
			},
			UnmarshalOptions: protojson.UnmarshalOptions{
				DiscardUnknown: true,
			},
		},
	}
	proxyServiceGRPCDialOptions = []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}
	auditServiceGRPCDialOptions = []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	}
	logisticsServiceGRPCDialOptions = []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}
	stationGRPCDialOptions = []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	}
)

func getM2MToken(logger *zap.SugaredLogger, audience *string) *auth.AutoRefreshToken {
	token, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("CAREMANAGER_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("CAREMANAGER_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not initialize M2M token", zap.Error(err))
	}

	return token
}

func buildRPCLoggingInterceptor(logger *zap.SugaredLogger) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		startTime := time.Now()

		handlerResult, err := handler(ctx, req)

		rpcExecutionTime := time.Since(startTime).String()

		if err == nil {
			logger.Infow(info.FullMethod, "time", rpcExecutionTime)
		} else {
			logger.Errorw(info.FullMethod, "time", rpcExecutionTime, "error", err)
		}

		return handlerResult, err
	}
}

func main() {
	flag.Parse()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{
		ServiceName:  careManagerServiceName,
		UseDevConfig: *devMode,
	})
	logger.Infow(careManagerServiceName, "version", buildinfo.Version)

	authorizationDisabled := os.Getenv(authorizationDisabledKey) == "true"

	stationGRPCDialOptions = append(stationGRPCDialOptions, monitoring.TracingDialOptions(monitoring.DataDogStationServiceName)...)
	stationGRPCConnection, closeStationConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"station",
		stationGRPCAddr,
		stationGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeStationConn()

	if !authorizationDisabled {
		auditAuthToken := getM2MToken(logger, auth0AuditServiceAudience)
		err := auditAuthToken.Start(ctx)

		if err != nil {
			logger.Panicw("could not start refreshing audit M2M token", zap.Error(err))
		}

		logisticsAuthToken := getM2MToken(logger, auth0LogisticsServiceAudience)
		err = logisticsAuthToken.Start(ctx)

		if err != nil {
			logger.Panicw("could not start refreshing logistics M2M token", zap.Error(err))
		}

		auditServiceGRPCDialOptions = append(
			auditServiceGRPCDialOptions,
			grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
				Token: auditAuthToken,
			}),
		)

		logisticsServiceGRPCDialOptions = append(
			logisticsServiceGRPCDialOptions,
			grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
				Token: logisticsAuthToken,
			}),
		)
	}
	auditServiceGRPCDialOptions = append(auditServiceGRPCDialOptions, monitoring.TracingDialOptions(monitoring.DataDogAuditServiceName)...)
	auditServiceConnection, closeAuditServiceConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"audit-service",
		auditServiceGRPCAddr,
		auditServiceGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeAuditServiceConn()
	auditServiceClient := auditpb.NewAuditServiceClient(auditServiceConnection)

	// This should be a temporary measure to ease caremanager development while we work on
	// a docker implementation or update the run script to launch all dependencies.
	// Move the WithBlock option back to the var definition once that is done.
	if !*devMode {
		logisticsServiceGRPCDialOptions = append(logisticsServiceGRPCDialOptions, grpc.WithBlock())
	}
	logisticsServiceConnection, closeLogisticsServiceConnection := baseserv.CreateGRPCConnection(
		context.Background(),
		"logistics-service",
		logisticsServiceGRPCAddr,
		logisticsServiceGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeLogisticsServiceConnection()
	logisticsServiceClient := logisticspb.NewLogisticsServiceClient(logisticsServiceConnection)

	var extraUnaryServerInterceptors []grpc.UnaryServerInterceptor

	serviceDescriptorsToAudit := []protoreflect.ServiceDescriptor{
		caremanagerpb.File_caremanager_service_proto.Services().ByName(careManagerServiceName),
	}
	auditInterceptor, err := audit.NewAuditInterceptor(
		careManagerServiceName,
		auditServiceClient,
		serviceDescriptorsToAudit,
	)
	if err != nil {
		logger.Panicf("failed to initialize audit interceptor, err: %s", err)
	}

	if *devMode {
		extraUnaryServerInterceptors = append(
			extraUnaryServerInterceptors,
			buildRPCLoggingInterceptor(logger),
		)
	}

	extraUnaryServerInterceptors = append(extraUnaryServerInterceptors, auditInterceptor.CreateEvent)

	if !authorizationDisabled {
		roleInterceptor := NewCareManagerRoleInterceptor(
			&CareManagerRoleInterceptorParams{
				careManagerUserRole: *stationCareManagerUserRole,
				serviceDescriptors: []protoreflect.ServiceDescriptor{
					caremanagerpb.File_caremanager_service_proto.Services().ByName(careManagerServiceName),
				},
				userServiceClient: userpb.NewUserServiceClient(stationGRPCConnection),
			},
		)

		extraUnaryServerInterceptors = append(extraUnaryServerInterceptors, roleInterceptor.Handle)
	}

	baseGRPCServer, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: careManagerServiceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			caremanagerpb.File_caremanager_service_proto.Services().ByName(careManagerServiceName),
			visitvaluepb.File_visit_value_service_proto.Services().ByName(visitValueServiceName),
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled:  authorizationDisabled,
			IssuerURL:              *auth0IssuerURL,
			Audience:               *auth0Audience,
			AllowMultipleAudiences: *allowMultipleAudiences,
		},
		Logger:                       logger,
		InfluxEnv:                    monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		StatsigProviderConfig:        baseserv.DefaultEnvStatsigProviderConfig(),
		DataDogConfig:                baseserv.DefaultEnvDataDogConfig(monitoring.DataDogCareManagerServiceName),
		ExtraUnaryServerInterceptors: extraUnaryServerInterceptors,
	})
	if err != nil {
		logger.Panicw("could not initialize server", err)
	}
	defer baseGRPCServer.Cleanup()
	statsigProvider := baseGRPCServer.StatsigProvider()
	if statsigProvider == nil {
		logger.Panic("no statsig provider")
	}
	statsigProvider.Start()
	segmentClient := NewSegmentClient(&NewSegmentClientParameters{
		WriteKey: os.Getenv(segmentWriteKey),
		URL:      segmentURL,
	})

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()
	caremanagerDB := NewCaremanagerDB(db)

	caremanagerService := CaremanagerGRPCServer{
		CaremanagerDB:   caremanagerDB,
		LogisticsClient: NewLogisticsClient(logisticsServiceClient),
		StationClient: NewStationClient(NewStationClientParams{
			AuthEnabled:      true,
			StationURL:       *stationURL,
			MarketService:    marketpb.NewMarketServiceClient(stationGRPCConnection),
			UserService:      userpb.NewUserServiceClient(stationGRPCConnection),
			AddressService:   addresspb.NewAddressServiceClient(stationGRPCConnection),
			ShiftTeamService: shiftteampb.NewShiftTeamServiceClient(stationGRPCConnection),
			EpisodeService:   episodepb.NewEpisodeServiceClient(stationGRPCConnection),
		}),
		SegmentClient:   segmentClient,
		StatsigProvider: statsigProvider,
		Logger:          logger,
	}
	visitValueService := VisitValueGRPCServer{
		CaremanagerDB: caremanagerDB,
	}
	healthService := HealthGRPCService{
		CaremanagerDB: caremanagerDB,
		Logger:        logger,
		StationClient: NewStationClient(NewStationClientParams{
			AuthEnabled: false,
			StationURL:  *stationURL,
		}),
	}

	go func() {
		err = baseGRPCServer.ServeGRPC(func(grpcServer *grpc.Server) {
			caremanagerpb.RegisterCareManagerServiceServer(
				grpcServer,
				&caremanagerService,
			)
			visitvaluepb.RegisterVisitValueServiceServer(
				grpcServer,
				&visitValueService,
			)
			healthpb.RegisterHealthServer(grpcServer, &healthService)
		})

		if err != nil {
			logger.Panicw("GRPC Server failed", zap.Error(err))
		}
	}()

	healthcheckGRPCConnection, closeHealthcheckConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"healthcheck",
		grpcAddr,
		proxyServiceGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeHealthcheckConn()

	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, openAPIMarshaller),
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
		runtime.WithHealthEndpointAt(healthpb.NewHealthClient(healthcheckGRPCConnection), "/healthcheck"),
	)

	err = caremanagerpb.RegisterCareManagerServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, proxyServiceGRPCDialOptions)
	if err != nil {
		logger.Panicw("Could not register CareManagerService proxy endpoints", err)
	}

	parsedAllowedHTTPOrigins := strings.Split(*allowedHTTPOrigins, ",")
	cors, err := cors.Initialize(cors.Config{
		AllowedHTTPOrigins: parsedAllowedHTTPOrigins,
		AllowedHTTPHeaders: allowedHTTPHeaders,
		AllowedHTTPMethods: allowedHTTPMethods,
	})
	if err != nil {
		logger.Panicw("initialize cors error", zap.Error(err))
	}

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	if err := http.ListenAndServe(*httpAddr, cors.Handler(mux)); err != nil {
		logger.Panicw("http server failed", zap.Error(err))
	}
}

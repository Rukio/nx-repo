package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/station"

	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"

	"go.uber.org/zap"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"

	"github.com/*company-data-covered*/services/go/cmd/insurance-service/insurancedb"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
)

const (
	serviceName                 = "InsuranceService"
	healthServiceName           = "HealthService"
	authorizationDisabledKey    = "AUTHORIZATION_DISABLED"
	dataDogInsuranceServiceName = "insurance-service"
)

var (
	grpcAddr        = flag.String("grpc-listen-addr", ":8096", "GRPC address to listen to")
	httpAddr        = flag.String("http-listen-addr", ":8097", "HTTP API address to listen to")
	grpcDialTimeout = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")
	stationURL      = flag.String("station-url", "http://localhost:3000", "station url")
	stationGRPCAddr = flag.String("station-grpc-addr", "127.0.0.1:9001", "Station GRPC address")

	auth0IssuerURL       = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience        = flag.String("auth0-audience", fmt.Sprintf("%s,insurance-service.*company-data-covered*.com", auth.LogicalAPIAudience), "default auth0 audience for insurance service")
	allowedHTTPOrigins   = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders   = []string{"*"}
	allowedHTTPMethods   = []string{http.MethodGet, http.MethodPatch, http.MethodPost, http.MethodDelete}
	refreshTokenInterval = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	stationAuth0Audience = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")
)

func main() {
	flag.Parse()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			insurancepb.File_insurance_service_proto.Services().ByName(serviceName),
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled:  os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:              *auth0IssuerURL,
			Audience:               *auth0Audience,
			AllowMultipleAudiences: true,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogInsuranceServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("Insurance", "version", buildinfo.Version)

	stationAuthToken, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("INSURANCE_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("INSURANCE_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *stationAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not create a refresh token", zap.Error(err))
	}

	err = stationAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could nit start refresh token", zap.Error(err))
	}

	stationGRPCDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
			Token: stationAuthToken,
		}),
	}
	stationGRPCConnection, closeStationConnection := baseserv.CreateGRPCConnection(
		context.Background(),
		"station",
		stationGRPCAddr,
		stationGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeStationConnection()

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()
	insuranceDB := insurancedb.NewInsuranceDB(db)

	// TODO - [ON-596] add user permissions check
	insuranceService := &InsuranceGRPCServer{
		Logger:               logger,
		InsuranceDB:          insuranceDB,
		StationClient:        &station.Client{AuthToken: stationAuthToken, StationURL: *stationURL},
		PayerGroupService:    payergrouppb.NewPayerGroupServiceClient(stationGRPCConnection),
		StateService:         statepb.NewStateServiceClient(stationGRPCConnection),
		InsurancePlanService: insuranceplanpb.NewInsurancePlanServiceClient(stationGRPCConnection),
	}

	healthService := &HealthGRPCService{
		Logger:      logger,
		InsuranceDB: insuranceDB,
	}

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			insurancepb.RegisterInsuranceServiceServer(grpcServer, insuranceService)
			healthpb.RegisterHealthServer(grpcServer, healthService)
		})
		if err != nil {
			logger.Panicf("error serving grpc: %s", err)
		}
	}()

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	opts = append(opts, monitoring.TracingDialOptions(dataDogInsuranceServiceName)...)

	healthcheckGRPCConnection, closeHealthcheckConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"healthcheck",
		grpcAddr,
		opts,
		*grpcDialTimeout,
		logger,
	)
	defer closeHealthcheckConn()

	mux := runtime.NewServeMux(
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
		runtime.WithHealthEndpointAt(healthpb.NewHealthClient(healthcheckGRPCConnection), "/healthcheck"),
	)

	err = insurancepb.RegisterInsuranceServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, opts)

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
		logger.Panicw("error initializing cors", zap.Error(err))
	}
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicw("error serving http", zap.Error(err))
	}
}

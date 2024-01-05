package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	expressgrpc "github.com/*company-data-covered*/services/go/cmd/partner-service/expressgrpc"
	partnergrpc "github.com/*company-data-covered*/services/go/cmd/partner-service/grpc"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	awsConfig "github.com/*company-data-covered*/services/go/pkg/aws"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	dataDogLogServiceName   = "partner-service"
	expressServiceName      = "ExpressService"
	m2mAuth0ClientIDKey     = "PARTNER_SERVICE_M2M_AUTH0_CLIENT_ID"
	m2mAuth0ClientSecretKey = "PARTNER_SERVICE_M2M_AUTH0_CLIENT_SECRET"
	serviceName             = "PartnerService"
)

var (
	allowedHTTPOrigins              = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders              = []string{"*"}
	allowedHTTPMethods              = []string{http.MethodHead, http.MethodGet, http.MethodPost}
	auth0IssuerURL                  = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	auth0Audience                   = flag.String("auth0-audience", auth.LogicalAPIAudience, "Auth0 audience for partner service")
	authorizationDisabled           = flag.Bool("authorization-disabled", false, "Flag to disable auth0")
	awsAccessKeyID                  = flag.String("aws-access-key-id", "", "AWS access key id")
	awsRegion                       = flag.String("aws-region", "", "AWS Region")
	awsSecretAccessKey              = flag.String("aws-secret-access-key", "", "AWS secret access key")
	backfillListVisitsBatchSize     = flag.Int("backfill-list-visits-batch-size", 50, "Batch size for list visits service call")
	backfillSleepTimeBetweenBatches = flag.Duration("backfill-sleep-time-between-batches", 0*time.Second, "Sleep time between list visits service calls")
	defaultGRPCTimeout              = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	enableFeatureStore              = flag.Bool("enable-feature-store", false, "AWS feature store check")
	episodeServiceGRPCAddr          = flag.String("episode-service-grpc-addr", "localhost:9001", "GRPC address of the Station Episode service")
	expressGrpcAddr                 = flag.String("express-grpc-listen-addr", ":8480", "GRPC address for Express server to listen to")
	expressHTTPAddr                 = flag.String("express-http-listen-addr", ":8082", "HTTP address for Express server to listen to")
	expressAuth0IssuerURL           = flag.String("express-auth0-issuer-url", "https://express-development.us.auth0.com/", "auth0 issuer URL")
	expressAuth0Audience            = flag.String("express-auth0-audience", "express-development-user-management", "Auth0 audience for partner service")
	featureStoreFeatureName         = flag.String("feature-store-feature-name", "", "Name of feature store feature")
	featureStoreFeatureGroupName    = flag.String("feature-store-feature-group-name", "", "Name of group to pull feature store features from")
	grpcAddr                        = flag.String("grpc-listen-addr", ":8481", "GRPC address to listen to")
	healthCheckInterval             = flag.Duration("health-check-interval", 1*time.Minute, "Time interval for triggering a service health check")
	httpAddr                        = flag.String("http-listen-addr", ":8080", "HTTP address to listen to")
	insuranceServiceGRPCAddr        = flag.String("insurance-service-grpc-addr", "localhost:8096", "GRPC address of the Insurance service")
	insuranceServiceAuth0Audience   = flag.String("insurance-service-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for insurance service")
	patientsAuth0Audience           = flag.String("patients-auth0-audience", auth.LogicalAPIAudience, "Auth0 audience for Patients service")
	patientsServiceGRPCAddr         = flag.String("patients-service-grpc-addr", "localhost:8471", "GRPC address of the Patients service")
	policyServiceEnabled            = flag.Bool("policy-service-enabled", true, "Enable OPA policy service")
	policyServiceBaseURL            = flag.String("policy-service-base-url", "http://localhost:8181", "URL for OPA policy service")
	popHealthServiceAuth0Audience   = flag.String("pophealth-service-auth0-audience", auth.LogicalAPIAudience, "Auth0 audience for pop health service")
	popHealthServiceGRPCAddr        = flag.String("pophealth-service-grpc-addr", "localhost:8081", "Pop health service GRPC address")
	refreshTokenInterval            = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "Time interval for refreshing M2M tokens")
	stationAuth0Audience            = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "Auth0 audience for station")
	useDevLogger                    = flag.Bool("dev-server", false, "Use dev logger for more verbose logging")
)

type webServerParams struct {
	logger             *zap.SugaredLogger
	openAPIMarshaller  *runtime.HTTPBodyMarshaler
	grpcAddr           string
	httpAddr           string
	allowedHTTPOrigins string
	allowedHTTPHeaders []string
	allowedHTTPMethods []string
}

type registerFunc func(context.Context, *runtime.ServeMux, string, []grpc.DialOption) error

func auth0Env(audience string) auth.Auth0Env {
	return auth.Auth0Env{
		ClientID:     os.Getenv(m2mAuth0ClientIDKey),
		ClientSecret: os.Getenv(m2mAuth0ClientSecretKey),
		Audience:     audience,
		IssuerURL:    *auth0IssuerURL,
	}
}

func startWebServer(ctx context.Context, params *webServerParams, registerFunc registerFunc) {
	logger := params.logger

	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, params.openAPIMarshaller),
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
	)

	err := registerFunc(ctx, mux, params.grpcAddr, []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	})
	if err != nil {
		logger.Panic("Could not register proxy endpoints", err)
	}

	parsedAllowedHTTPOrigins := strings.Split(params.allowedHTTPOrigins, ",")
	cors, err := cors.Initialize(cors.Config{
		AllowedHTTPOrigins: parsedAllowedHTTPOrigins,
		AllowedHTTPHeaders: params.allowedHTTPHeaders,
		AllowedHTTPMethods: params.allowedHTTPMethods,
	})
	if err != nil {
		logger.Panic("initialize cors error", err)
	}

	logger.Infow("Starting HTTP server", "address", params.httpAddr)
	if err := http.ListenAndServe(params.httpAddr, cors.Handler(mux)); err != nil {
		logger.Panic("http server failed", err)
	}
}

func enablePolicyService() bool {
	return *policyServiceEnabled
}

func main() {
	flag.Parse()

	openAPIMarshaller := &runtime.HTTPBodyMarshaler{
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

	mainServer, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			partnerpb.File_partner_service_proto.Services().ByName(serviceName),
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: *authorizationDisabled,
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *useDevLogger,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer mainServer.Cleanup()

	expressServer, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: expressServiceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			partnerpb.File_partner_express_service_proto.Services().ByName(expressServiceName),
		},
		GRPCAddr: *expressGrpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled:  *authorizationDisabled,
			IssuerURL:              *expressAuth0IssuerURL,
			Audience:               *expressAuth0Audience,
			AllowMultipleAudiences: true,
		},
		GRPCPolicyAuthorizerConfig: &auth.GRPCPolicyAuthorizerConfig{
			Enabled:              enablePolicyService,
			PolicyServiceBaseURL: *policyServiceBaseURL,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *useDevLogger,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer expressServer.Cleanup()

	logger := mainServer.Logger()
	dbConfig := basedb.DefaultEnvConfig(logger)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	popHealthServiceConnection, closePopHealthServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 dataDogLogServiceName,
			Address:              popHealthServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(*popHealthServiceAuth0Audience),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closePopHealthServiceConn()

	episodeServiceConnection, closeEpisodeServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 dataDogLogServiceName,
			Address:              episodeServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(*stationAuth0Audience),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeEpisodeServiceConn()

	patientsServiceConnection, closePatientsServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 dataDogLogServiceName,
			Address:              patientsServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(*patientsAuth0Audience),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closePatientsServiceConn()

	insuranceServiceConnection, closeInsuranceServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 dataDogLogServiceName,
			Address:              insuranceServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  auth0Env(*insuranceServiceAuth0Audience),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeInsuranceServiceConn()

	dbPool := basedb.Connect(ctx, logger, dbConfig)
	defer dbPool.Close()

	dbScope := &monitoring.NoopScope{}
	dBService := partnerdb.NewPartnerDB(dbPool, dbScope)
	var awsConfigPtr *aws.Config
	if *enableFeatureStore {
		awsConfigPtr, err = awsConfig.NewAWSConfig(ctx, awsConfig.ProviderOptions{
			AccessKeyID:     *awsAccessKeyID,
			SecretAccessKey: *awsSecretAccessKey,
			Region:          *awsRegion,
		})
		if err != nil {
			log.Panic("aws cannot be configured", err)
		}
	}

	healthServer := &partnergrpc.HealthCheckServer{
		DBService:                   dBService,
		PopHealthCheckService:       healthpb.NewHealthClient(popHealthServiceConnection),
		InsuranceHealthCheckService: healthpb.NewHealthClient(insuranceServiceConnection),
		Logger:                      logger,
	}

	serverConfig, err := partnergrpc.NewServer(
		&partnergrpc.ServerParams{
			AwsConfig:                    awsConfigPtr,
			DBService:                    dBService,
			Logger:                       logger,
			PopHealthSearchPatientClient: pophealthpb.NewSearchPatientServiceClient(popHealthServiceConnection),
			PopHealthBackfillClient:      pophealthpb.NewPopHealthServiceClient(popHealthServiceConnection),
			EpisodeClient:                episodepb.NewEpisodeServiceClient(episodeServiceConnection),
			InsuranceClient:              insurancepb.NewInsuranceServiceClient(insuranceServiceConnection),
			FeatureGroupName:             *featureStoreFeatureGroupName,
			FeatureName:                  *featureStoreFeatureName,
			BackfillBatchingParams: partnergrpc.BackfillBatchingParams{
				SleepTimeBetweenBatches: *backfillSleepTimeBetweenBatches,
				BatchSize:               int32(*backfillListVisitsBatchSize),
			},
		},
	)
	if err != nil {
		logger.Panic("main server cannot be created", err)
	}

	expressServerConfig, err := expressgrpc.NewServer(&expressgrpc.ServerParams{
		DBService:      dBService,
		Logger:         logger,
		PatientsClient: patientspb.NewPatientsServiceClient(patientsServiceConnection),
	})
	if err != nil {
		logger.Panic("express server cannot be created", err)
	}

	requests := []any{
		&partnerpb.CreateConfigurationSourceRequest{},
		&partnerpb.CreateMarketRequest{},
		&partnerpb.DeleteConfigurationRequest{},
		&partnerpb.DeleteMarketRequest{},
		&partnerpb.GetConfigurationRequest{},
		&partnerpb.GetConfigurationSourceRequest{},
		&partnerpb.GetMarketRequest{},
		&partnerpb.GetPatientRequest{},
		&partnerpb.ListConfigurationSourcesRequest{},
		&partnerpb.ListMarketsRequest{},
		&partnerpb.ListServiceLinesRequest{},
		&partnerpb.UpdateMarketRequest{},
	}
	superAdminRequests := []any{
		&partnerpb.CreateConfigurationRequest{},
		&partnerpb.ExpressServiceSearchPartnersRequest{},
		&partnerpb.ListConfigurationsRequest{},
	}

	for _, req := range requests {
		err = expressServer.GRPCPolicyAuthorizer().RegisterGRPCRequest(&req, auth.PolicyPartnerBelongsToPartner, expressServerConfig)
		if err != nil {
			log.Panicf("failed to register grpc request, err: %s", err)
		}
	}
	for _, req := range superAdminRequests {
		err = expressServer.GRPCPolicyAuthorizer().RegisterGRPCRequest(&req, auth.PolicyPartnerIsSuperAdmin, expressServerConfig)
		if err != nil {
			log.Panicf("failed to register grpc request, err: %s", err)
		}
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthServer.Check,
		DataDogRecorder:       mainServer.DataDogRecorder(),
		DataDogLogServiceName: dataDogLogServiceName,
		Logger:                logger,
	}
	healthCheckPoller.Start()

	go func() {
		err := mainServer.ServeGRPC(func(grpcServer *grpc.Server) {
			partnerpb.RegisterPartnerServiceServer(grpcServer, serverConfig)
			healthpb.RegisterHealthServer(grpcServer, healthServer)
		})
		if err != nil {
			logger.Panic("main server cannot be registered", err)
		}
	}()

	go func() {
		err := expressServer.ServeGRPC(func(grpcServer *grpc.Server) {
			partnerpb.RegisterExpressServiceServer(grpcServer, expressServerConfig)
		})
		if err != nil {
			logger.Panic("express server cannot be registered", err)
		}
	}()

	go func() {
		err := serverConfig.ProcessPendingBackfills(ctx)
		if err != nil {
			logger.Errorf("ProcessPendingBackfills error: %w", err)
		}
	}()

	go func() {
		startWebServer(ctx, &webServerParams{
			logger:             mainServer.Logger(),
			openAPIMarshaller:  openAPIMarshaller,
			grpcAddr:           *grpcAddr,
			httpAddr:           *httpAddr,
			allowedHTTPOrigins: *allowedHTTPOrigins,
			allowedHTTPHeaders: allowedHTTPHeaders,
			allowedHTTPMethods: allowedHTTPMethods,
		}, partnerpb.RegisterPartnerServiceHandlerFromEndpoint)
	}()

	startWebServer(ctx, &webServerParams{
		logger:             expressServer.Logger(),
		openAPIMarshaller:  openAPIMarshaller,
		grpcAddr:           *expressGrpcAddr,
		httpAddr:           *expressHTTPAddr,
		allowedHTTPOrigins: *allowedHTTPOrigins,
		allowedHTTPHeaders: allowedHTTPHeaders,
		allowedHTTPMethods: allowedHTTPMethods,
	}, partnerpb.RegisterExpressServiceHandlerFromEndpoint)
}

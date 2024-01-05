package main

import (
	"context"
	"flag"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	"github.com/*company-data-covered*/services/go/pkg/googlemapsclient"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName              = "PatientAccountsService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
)

var (
	grpcAddr = flag.String("grpc-listen-addr", ":8477", "GRPC address to listen to")
	httpAddr = flag.String("http-listen-addr", ":8475", "HTTP address to listen to")

	patientsAuth0IssuerURL       = flag.String("patients-auth0-issuer-url", "https://dev-patients-auth.*company-data-covered*.com/", "auth0 issuer URL for the patient Auth0 tenant")
	internalAuth0IssuerURL       = flag.String("internal-auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL for the internal Auth0 tenant")
	patientAccountsAuth0Audience = flag.String("auth0-audience", "patients.*company-data-covered*.com", "auth0 audience for patient accounts service")
	refreshTokenInterval         = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	auditServiceGRPCAddr         = flag.String("audit-service-grpc-addr", "localhost:8482", "GRPC address of the audit service")
	allowedHTTPOrigins           = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders           = []string{"*"}
	allowedHTTPMethods           = []string{http.MethodHead, http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete}
	patientsServiceGRPCAddr      = flag.String("patients-service-grpc-addr", "localhost:8471", "GRPC address of the Patients service")
	policyServiceHTTPAddr        = flag.String("policy-service-http-addr", "http://localhost:8181", "HTTP address of the policy service")
	defaultGRPCTimeout           = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	internalAuth0Audience        = flag.String("internal-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for internal API")
	healthCheckInterval          = flag.Duration("health-check-interval", 1*time.Minute, "time interval for triggering a service health check")
)

func internalAuth0Env() auth.Auth0Env {
	return auth.Auth0Env{
		ClientID:     os.Getenv("PATIENT_ACCOUNTS_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("PATIENT_ACCOUNTS_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *internalAuth0Audience,
		IssuerURL:    *internalAuth0IssuerURL,
	}
}

func main() {
	flag.Parse()
	serviceDescriptors := []protoreflect.ServiceDescriptor{
		patientaccountspb.File_patients_accounts_service_proto.Services().ByName(serviceName),
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
			Env:                  internalAuth0Env(),
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
		logger.Panicw("failed to initialize audit interceptor", zap.Error(err))
	}
	authorizationDisabled := os.Getenv(authorizationDisabledKey) == "true"
	policyServiceEnabled := func() bool {
		return !authorizationDisabled
	}

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()
	patientAccountsDB := NewPatientAccountsDB(db)

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName:             serviceName,
		GRPCServiceDescriptors: serviceDescriptors,
		GRPCAddr:               *grpcAddr,
		GRPCAuthConfig: auth.Config{
			IssuerURL:             *patientsAuth0IssuerURL,
			Audience:              *patientAccountsAuth0Audience,
			AuthorizationDisabled: authorizationDisabled,
		},
		ExtraUnaryServerInterceptors: []grpc.UnaryServerInterceptor{auditInterceptor.CreateEvent},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(serviceName),
		GRPCPolicyAuthorizerConfig: &auth.GRPCPolicyAuthorizerConfig{
			Enabled:              policyServiceEnabled,
			PolicyServiceBaseURL: *policyServiceHTTPAddr,
			PolicyActorConfigurator: &PolicyActorConfigurator{
				dbService: patientAccountsDB,
				logger:    logger,
			},
		},
	})
	if err != nil {
		logger.Panicw("failed to create base server", zap.Error(err))
	}
	defer server.Cleanup()

	patientsServiceConnection, closePatientsServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:                 monitoring.DataDogPatientsServiceName,
			Address:              patientsServiceGRPCAddr,
			DialTimeout:          *defaultGRPCTimeout,
			Logger:               logger,
			Env:                  internalAuth0Env(),
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closePatientsServiceConn()

	addrValidationGRPCClient, err := googlemapsclient.NewAddressValidationGRPCClient(ctx, os.Getenv("PATIENT_ACCOUNTS_ADDRESS_VALIDATION_API_KEY"), logger)
	if err != nil {
		logger.Panicw("failed to create address validation client", zap.Error(err))
	}

	policyResourceSerializer := &PatientAccountsPolicyResourceSerializer{
		DBService: patientAccountsDB,
		Logger:    logger,
	}

	accountIDRequestSerializer := &AccountIDRequestSerializer{}
	addressRequestSerializer := &AddressRequestSerializer{*policyResourceSerializer}
	accountPatientRequestSerializer := &AccountPatientLinkRequestSerializer{*policyResourceSerializer}

	var grpcRequests = []struct {
		Request    any
		Policy     auth.PolicyRule
		Serializer auth.PolicyResourceSerializer
	}{
		{
			Request: &patientaccountspb.FindOrCreateAccountByTokenRequest{},
			Policy:  auth.PolicyPatientAccountsIsPatient,
		},
		{
			Request:    &patientaccountspb.GetAccountRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
		{
			Request:    &patientaccountspb.UpdateAccountRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
		{
			Request:    &patientaccountspb.CreateAddressRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
		{
			Request:    &patientaccountspb.GetAddressRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: addressRequestSerializer,
		},
		{
			Request:    &patientaccountspb.UpdateAddressRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: addressRequestSerializer,
		},
		{
			Request:    &patientaccountspb.DeleteAddressRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: addressRequestSerializer,
		},
		{
			Request:    &patientaccountspb.ListAddressesRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
		{
			Request:    &patientaccountspb.DeleteAccountPatientLinkRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountPatientRequestSerializer,
		},
		{
			Request:    &patientaccountspb.ListAccountPatientLinksRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
		{
			Request:    &patientaccountspb.GetAccountPatientLinkRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountPatientRequestSerializer,
		},
		{
			Request: &patientaccountspb.UpdateAccountPatientLinkRequest{},
			Policy:  auth.PolicyPatientAccountsManageAccountPatientLinks,
		},
		{
			Request:    &patientaccountspb.AddUnverifiedAccountPatientLinkRequest{},
			Policy:     auth.PolicyPatientAccountsBelongsToAccount,
			Serializer: accountIDRequestSerializer,
		},
	}

	for _, req := range grpcRequests {
		err := server.GRPCPolicyAuthorizer().RegisterGRPCRequest(req.Request, req.Policy, req.Serializer)
		if err != nil {
			logger.Panicw("failed to register grpc request", zap.Error(err))
		}
	}

	serverConfig := &GRPCServer{
		Logger:                  logger,
		DB:                      patientAccountsDB,
		PatientsServiceClient:   patients.NewPatientsServiceClient(patientsServiceConnection),
		AddressValidationClient: addrValidationGRPCClient,
	}

	healthServer := &HealthCheckServer{
		AuditHealthServiceClient: healthpb.NewHealthClient(auditServiceConnection),
		DB:                       patientAccountsDB,
		Logger:                   logger,
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthServer.Check,
		DataDogRecorder:       server.DataDogRecorder(),
		DataDogLogServiceName: monitoring.DataDogPatientAccountsServiceName,
		Logger:                logger,
	}

	healthCheckPoller.Start()

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			patientaccountspb.RegisterPatientAccountsServiceServer(grpcServer, serverConfig)
			healthpb.RegisterHealthServer(grpcServer, &HealthCheckServer{
				Logger:                   logger,
				AuditHealthServiceClient: healthpb.NewHealthClient(auditServiceConnection),
				DB:                       patientAccountsDB,
			})
		})
		if err != nil {
			logger.Panic(err)
		}
	}()

	mux := runtime.NewServeMux()
	proxyServiceGRPCDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}
	err = patientaccountspb.RegisterPatientAccountsServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, proxyServiceGRPCDialOptions)
	if err != nil {
		logger.Panicw("Could not register proxy endpoint", err)
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
	if err = http.ListenAndServe(*httpAddr, cors.Handler(mux)); err != nil {
		logger.Panicf("http server failed: %s", err)
	}
}

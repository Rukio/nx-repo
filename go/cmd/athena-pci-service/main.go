package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	athenaauth "github.com/*company-data-covered*/services/go/pkg/athena/auth"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	athenapcipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena_pci"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"
	httptrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/net/http"
)

const (
	serviceName              = "AthenaPCIService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
)

var (
	httpAddr                   = flag.String("http-listen-addr", ":8476", "HTTP API address to listen to")
	grpcAddr                   = flag.String("grpc-listen-addr", ":8474", "GRPC address to listen to")
	athenaAuthURL              = flag.String("athena-auth-url", "https://api.preview.platform.athenahealth.com/oauth2/v1/token", "Athena auth URL")
	athenaTimeout              = flag.Duration("athena-timeout", 30*time.Second, "default timeout for athena requests")
	athenaRefreshTokenInterval = flag.Duration("athena-refresh-token-interval", 30*time.Minute, "time interval for refreshing Athena tokens")
	practiceID                 = flag.String("athena-practice-id", "13869", "dispatch practice ID for Athena EHR")

	auth0IssuerURL     = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience      = flag.String("auth0-audience", "athena-pci-service.*company-data-covered*.com", "default auth0 audience for pci service")
	allowedHTTPOrigins = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodGet, http.MethodPost, http.MethodDelete}
)

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCAddr:   *grpcAddr,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			athenapcipb.File_athena_pci_service_proto.Services().ByName(serviceName),
			healthcheck.HealthcheckServiceDescriptor,
		},
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		StatsigProviderConfig: baseserv.DefaultEnvStatsigProviderConfig(),
		DataDogConfig:         baseserv.DefaultEnvDataDogConfig(monitoring.DataDogAthenaPCIServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow(serviceName, "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	athenaAuthToken, err := auth.NewAutoRefreshToken(athenaauth.Config{
		ClientID:     os.Getenv("ATHENA_CLIENT_ID"),
		ClientSecret: os.Getenv("ATHENA_SECRET_KEY"),
		AuthURL:      *athenaAuthURL,
		Timeout:      *athenaTimeout,
	}, *athenaRefreshTokenInterval)
	if err != nil {
		logger.Panicw("could not create athena token", zap.Error(err))
	}
	err = athenaAuthToken.Start(context.Background())
	if err != nil {
		logger.Panicw("could not start process to authenticate athena token", zap.Error(err))
	}
	athenaClient, err := athena.NewClient(athena.NewClientParams{
		AuthToken:  athenaAuthToken,
		BaseURL:    os.Getenv("ATHENA_BASE_URL"),
		PracticeID: *practiceID,
		HTTPClient: &http.Client{
			Timeout: *athenaTimeout,
			Transport: httptrace.WrapRoundTripper(
				http.DefaultTransport,
				httptrace.RTWithServiceName(monitoring.DataDogAthenaPCIServiceName),
				httptrace.RTWithResourceNamer(monitoring.HTTPResourceNamer),
				httptrace.RTWithAnalytics(true)),
		},
	})
	if err != nil {
		logger.Panicw("could not initialize athena client", zap.Error(err))
	}

	statsigProvider := server.StatsigProvider()
	if statsigProvider == nil {
		log.Panic("no statsig provider")
	}

	pciServer := &GRPCServer{
		AthenaClient: athenaClient,
		Logger:       logger,
	}

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			athenapcipb.RegisterAthenaPCIServiceServer(grpcServer, pciServer)
		})
		if err != nil {
			logger.Panicf("error serving grpc: %s", err)
		}
	}()

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	opts = append(opts, monitoring.TracingDialOptions(monitoring.DataDogAthenaPCIServiceName)...)

	mux := runtime.NewServeMux(
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
	)

	err = athenapcipb.RegisterAthenaPCIServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, opts)
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
	if err = http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicw("error serving http", zap.Error(err))
	}
}

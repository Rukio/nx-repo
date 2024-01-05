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

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName              = "TytoCareService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	tytoCareBaseURLKey       = "TYTO_CARE_BASE_URL"
	tytoCareTokenTypeKey     = "TYTO_CARE_TOKEN_TYPE"
	tytoCareAccessTokenKey   = "TYTO_CARE_ACCESS_TOKEN"
)

var (
	grpcAddr                = flag.String("grpc-listen-addr", ":8090", "GRPC address to listen to")
	httpAddr                = flag.String("http-addr", ":8091", "HTTP API address to listen to")
	defaultHTTPTimeout      = flag.Duration("default-http-timeout", 30*time.Second, "Default timeout for HTTP requests to TytoCare")
	defaultGRPCTimeout      = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	influxDBRetentionPolicy = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	auth0IssuerURL          = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience           = flag.String("auth0-audience", fmt.Sprintf("%s,tyto-care-service.*company-data-covered*.com", auth.LogicalAPIAudience), "default auth0 audience for tytocare service")
	allowedHTTPOrigins      = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders      = []string{"*"}
	allowedHTTPMethods      = []string{http.MethodGet, http.MethodPatch, http.MethodPost}
	allowedPublicPaths      = []string{"/healthcheck"}

	stationAuth0Audience = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")
	refreshTokenInterval = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
)

func getM2MToken(logger *zap.SugaredLogger) *auth.AutoRefreshToken {
	token, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("TYTOCARE_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("TYTOCARE_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
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

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			tytocarepb.File_tytocare_service_proto.Services().ByName(serviceName),
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
		InfluxEnv: monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("TytoCare", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	authToken := getM2MToken(logger)
	err = authToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start refreshing M2M token", zap.Error(err))
	}

	mux := runtime.NewServeMux()
	serverConfig := &GRPCServer{
		TytoCareBaseURL: os.Getenv(tytoCareBaseURLKey),
		TytoCareAuthToken: auth.FixedToken{
			TokenType:   os.Getenv(tytoCareTokenTypeKey),
			AccessToken: os.Getenv(tytoCareAccessTokenKey),
		},
		Client: &http.Client{},
		Logger: logger,
	}
	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			tytocarepb.RegisterTytoCareServiceServer(grpcServer, serverConfig)

			opts := []grpc.DialOption{
				grpc.WithTransportCredentials(insecure.NewCredentials()),
				grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
					Token: authToken,
				}),
			}
			err = tytocarepb.RegisterTytoCareServiceHandlerFromEndpoint(context.Background(), mux, *grpcAddr, opts)
			if err != nil {
				logger.Panic(err)
			}
		})
		if err != nil {
			logger.Panicf("error serving grpc: %s", err)
		}
	}()

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
	httpAuthConfig := auth.Config{
		AuthorizationDisabled:          os.Getenv(authorizationDisabledKey) == "true",
		IssuerURL:                      *auth0IssuerURL,
		Audience:                       *stationAuth0Audience,
		HTTPAuthorizationDisabledPaths: allowedPublicPaths,
	}
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(auth.HTTPHandler(ctx, mux, httpAuthConfig))); err != nil {
		logger.Panicf("error serving http: %s", err)
	}
}

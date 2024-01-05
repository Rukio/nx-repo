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

	"go.uber.org/zap"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	modalitypb "github.com/*company-data-covered*/services/go/pkg/generated/proto/modality"
	"github.com/*company-data-covered*/services/go/pkg/modality/modalitydb"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	serviceName                = "ModalityService"
	healthServiceName          = "HealthService"
	authorizationDisabledKey   = "AUTHORIZATION_DISABLED"
	dataDogModalityServiceName = "modality-service"
)

var (
	grpcAddr                = flag.String("grpc-listen-addr", ":8092", "GRPC address to listen to")
	httpAddr                = flag.String("http-listen-addr", ":8093", "HTTP API address to listen to")
	defaultHTTPTimeout      = flag.Duration("default-http-timeout", 30*time.Second, "Default HTTP timeout")
	defaultGRPCTimeout      = flag.Duration("default-grpc-timeout", 30*time.Second, "Default GRPC timeout")
	influxDBRetentionPolicy = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	grpcDialTimeout         = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")
	insuranceGRPCAddr       = flag.String("insurance-grpc-addr", "127.0.0.1:8096", "Insurance Service GRPC address")

	auth0IssuerURL         = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience          = flag.String("auth0-audience", fmt.Sprintf("%s,modality-service.*company-data-covered*.com", auth.LogicalAPIAudience), "default auth0 audience for modality service")
	allowedHTTPOrigins     = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders     = []string{"*"}
	allowedHTTPMethods     = []string{http.MethodGet, http.MethodPatch, http.MethodPost}
	refreshTokenInterval   = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	insuranceAuth0Audience = flag.String("insurance-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for insurance service")
)

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			modalitypb.File_modality_service_proto.Services().ByName(serviceName),
			modalitypb.File_modality_healthcheck_proto.Services().ByName(healthServiceName),
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
		InfluxEnv:     monitoring.DefaultInfluxEnv(*influxDBRetentionPolicy),
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogModalityServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("Modality", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	insuranceAuthToken, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("MODALITY_INSURANCE_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("MODALITY_INSURANCE_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *insuranceAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not create a refresh token", zap.Error(err))
	}

	err = insuranceAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start refresh token", zap.Error(err))
	}

	insuraneGRPCDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
			Token: insuranceAuthToken,
		}),
	}
	insuranceGRPCConnection, closeInsuranceConnection := baseserv.CreateGRPCConnection(
		context.Background(),
		"insurance",
		insuranceGRPCAddr,
		insuraneGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeInsuranceConnection()

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()

	var mdbScope monitoring.Scope = &monitoring.NoopScope{}
	if ir := server.InfluxRecorder(); ir != nil {
		mdbScope = ir.With("ModalityDB", nil, nil)
	}

	modalityDB := modalitydb.NewModalityDB(db, mdbScope)

	serverConfig := &ModalityGRPCServer{
		ModalityDB:       modalityDB,
		Logger:           logger,
		InsuranceService: insurancepb.NewInsuranceServiceClient(insuranceGRPCConnection),
	}

	healthServerConfig := HealthGRPCService{
		ModalityDB: modalityDB,
		Logger:     logger,
	}

	mux := runtime.NewServeMux()

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			modalitypb.RegisterModalityServiceServer(grpcServer, serverConfig)
			modalitypb.RegisterHealthServiceServer(grpcServer, &healthServerConfig)

			opts := []grpc.DialOption{
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			}

			err = modalitypb.RegisterHealthServiceHandlerFromEndpoint(context.Background(), mux, *grpcAddr, opts)
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
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicf("error serving http: %s", err)
	}
}

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

	"github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	riskstratificationpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName              = "RiskStratificationService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	dataDogLogServiceName    = "riskstratification-service"
)

var (
	grpcAddr           = flag.String("grpc-listen-addr", ":8094", "GRPC address to listen to")
	httpAddr           = flag.String("http-listen-addr", ":8095", "HTTP API address to listen to")
	auth0IssuerURL     = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience      = flag.String("auth0-audience", fmt.Sprintf("%s,risk-stratification-service.*company-data-covered*.com", auth.LogicalAPIAudience), "default auth0 audience for RiskStratification service")
	grpcDialTimeout    = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")
	allowedHTTPOrigins = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodGet, http.MethodPatch, http.MethodPost}
	// HTTP body marshaller to output snake_case JSONs, more info at:
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
)

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			riskstratificationpb.File_riskstratification_service_proto.Services().ByName(serviceName),
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
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(dataDogLogServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow("RiskStratification", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()

	var mdbScope monitoring.Scope = &monitoring.NoopScope{}
	if ir := server.InfluxRecorder(); ir != nil {
		mdbScope = ir.With("RiskStratificationDB", nil, nil)
	}

	riskStratificationDB := riskstratificationdb.NewRiskStratificationDB(db, mdbScope, server.DataDogRecorder())

	serverConfig := &RiskStratificationGRPCServer{
		Logger:               logger,
		RiskStratificationDB: riskStratificationDB,
	}

	healthService := &HealthGRPCService{
		RiskStratificationDB: riskStratificationDB,
		Logger:               logger,
	}

	healthcheckGRPCConnection, closeHealthcheckConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"healthcheck",
		grpcAddr,
		proxyServiceGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeHealthcheckConn()

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			riskstratificationpb.RegisterRiskStratificationServiceServer(grpcServer, serverConfig)
			healthpb.RegisterHealthServer(grpcServer, healthService)
		})
		if err != nil {
			logger.Panicw("error serving grpc: ", zap.Error(err))
		}
	}()

	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, openAPIMarshaller),
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
		runtime.WithHealthEndpointAt(healthpb.NewHealthClient(healthcheckGRPCConnection), "/healthcheck"),
	)

	err = riskstratificationpb.RegisterRiskStratificationServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, proxyServiceGRPCDialOptions)
	if err != nil {
		logger.Panicw("Could not register RiskStratificationService proxy endpoints", err)
	}

	parsedAllowedHTTPOrigins := strings.Split(*allowedHTTPOrigins, ",")
	config := cors.Config{
		AllowedHTTPHeaders: allowedHTTPHeaders,
		AllowedHTTPMethods: allowedHTTPMethods,
		AllowedHTTPOrigins: parsedAllowedHTTPOrigins,
	}
	corsInstance, err := cors.Initialize(config)
	if err != nil {
		logger.Panicw("initialize cors error: ", zap.Error(err))
	}

	logger.Infow("Starting HTTP server", "address", *httpAddr)
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicw("error serving http: ", zap.Error(err))
	}
}

package main

import (
	"flag"
	"log"
	"os"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/reflect/protoreflect"

	"github.com/*company-data-covered*/services/go/pkg/baseserv"
)

const (
	serviceName              = "ExampleService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	dataDogLogServiceName    = "example-service"
)

var (
	grpcAddr            = flag.String("grpc-listen-addr", ":8471", "GRPC address to listen to")
	auth0IssuerURL      = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	auth0Audience       = flag.String("auth0-audience", "example-service.*company-data-covered*.com", "auth0 audience for example service")
	healthCheckInterval = flag.Duration("health-check-interval", 1*time.Minute, "time interval for triggering a service health check")
)

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			examplepb.File_example_service_proto.Services().ByName(serviceName),
			healthcheck.HealthcheckServiceDescriptor,
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: false,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(monitoring.DataDogExampleServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	healthServer := &HealthCheckServer{
		Logger: server.Logger(),
	}

	healthCheckPoller := &monitoring.HealthCheckPoller{
		Interval:              *healthCheckInterval,
		Check:                 healthServer.Check,
		DataDogRecorder:       server.DataDogRecorder(),
		DataDogLogServiceName: dataDogLogServiceName,
		Logger:                server.Logger(),
	}

	healthCheckPoller.Start()

	err = server.ServeGRPC(func(grpcServer *grpc.Server) {
		examplepb.RegisterExampleServiceServer(grpcServer, &GRPCServer{
			Logger: server.Logger(),
		})
		healthpb.RegisterHealthServer(grpcServer, &HealthCheckServer{
			Logger: server.Logger(),
		})
	})
	if err != nil {
		server.Logger().Panic(err)
	}
}

package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName              = "AuditService"
	authorizationDisabledKey = "AUTHORIZATION_DISABLED"
	policyServiceBaseURLKey  = "POLICY_SERVICE_BASE_URL"
)

var (
	grpcAddr              = flag.String("grpc-listen-addr", ":8482", "GRPC address to listen to")
	auth0IssuerURL        = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "default auth0 issuer URL")
	auth0Audience         = flag.String("auth0-audience", auth.LogicalAPIAudience, "default auth0 audience for audit service")
	enableDevMode         = flag.Bool("dev-mode", false, "Enable the server to run in dev mode")
	authorizationDisabled = os.Getenv(authorizationDisabledKey) == "true"
	policyServiceBaseURL  = os.Getenv(policyServiceBaseURLKey)
)

func main() {
	flag.Parse()

	policyServiceEnabled := func() bool {
		return !authorizationDisabled
	}

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			auditpb.File_audit_service_proto.Services().ByName(serviceName),
			healthcheck.HealthcheckServiceDescriptor,
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		GRPCPolicyAuthorizerConfig: &auth.GRPCPolicyAuthorizerConfig{
			Enabled:              policyServiceEnabled,
			PolicyServiceBaseURL: policyServiceBaseURL,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *enableDevMode,
		},
		DataDogConfig: baseserv.DefaultEnvDataDogConfig(monitoring.DataDogAuditServiceName),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	err = server.GRPCPolicyAuthorizer().RegisterGRPCRequest(&auditpb.CreateAuditEventRequest{}, auth.PolicyAuditCreateAuditEvent, nil)
	if err != nil {
		log.Panicf("failed to register grpc request, err: %s", err)
	}

	logger := server.Logger()
	logger.Infow("Audit", "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	db := basedb.Connect(ctx, logger, basedb.DefaultEnvConfig(logger))
	defer db.Close()

	auditDB := audit.NewDB(db)
	err = server.ServeGRPC(func(grpcServer *grpc.Server) {
		auditpb.RegisterAuditServiceServer(grpcServer, &GRPCServer{
			AuditDB: auditDB,
			Logger:  logger,
		})
		healthpb.RegisterHealthServer(grpcServer, &HealthCheckServer{
			AuditDB: auditDB,
			Logger:  logger,
		})
	})
	if err != nil {
		logger.Panic(err)
	}
}

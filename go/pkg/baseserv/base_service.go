package baseserv

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"runtime/debug"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
	"google.golang.org/protobuf/reflect/protoreflect"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
	"gopkg.in/DataDog/dd-trace-go.v1/profiler"
)

type NewServerParams struct {
	ServerName             string
	GRPCServiceDescriptors []protoreflect.ServiceDescriptor
	GRPCAddr               string

	GRPCAuthConfig             auth.Config
	GRPCPolicyAuthorizerConfig *auth.GRPCPolicyAuthorizerConfig

	Logger        *zap.SugaredLogger
	LoggerOptions baselogger.LoggerOptions

	ExtraUnaryServerInterceptors  []grpc.UnaryServerInterceptor
	ExtraStreamServerInterceptors []grpc.StreamServerInterceptor

	InfluxEnv             *monitoring.InfluxEnv
	StatsigProviderConfig *providers.StatsigProviderConfig

	DataDogConfig *monitoring.DataDogConfig
}

type Server struct {
	logger *zap.SugaredLogger

	grpcServer   *grpc.Server
	grpcListener net.Listener

	dataDogRecorder *monitoring.DataDogRecorder
	influxRecorder  *monitoring.InfluxRecorder
	statsigProvider *providers.StatsigProvider

	grpcPolicyAuthorizer *auth.GRPCPolicyAuthorizer
}

type GRPCConnParams struct {
	Name                 string
	Address              *string
	DialTimeout          time.Duration
	Logger               *zap.SugaredLogger
	Env                  auth.Env
	RefreshTokenInterval time.Duration
	Opts                 []grpc.DialOption
}

func (s *Server) ServeGRPC(grpcRegisterFn func(grpcServer *grpc.Server)) error {
	grpcRegisterFn(s.grpcServer)
	reflection.Register(s.grpcServer)

	logger := s.logger.With("addr", s.grpcListener.Addr())
	logger.Info("Starting GRPC server")

	if err := s.grpcServer.Serve(s.grpcListener); err != nil {
		return err
	}

	logger.Info("Stopping GRPC listener gracefully")

	return nil
}

func (s *Server) Logger() *zap.SugaredLogger {
	return s.logger
}

func (s *Server) InfluxRecorder() *monitoring.InfluxRecorder {
	return s.influxRecorder
}

func (s *Server) DataDogRecorder() *monitoring.DataDogRecorder {
	return s.dataDogRecorder
}

func (s *Server) StatsigProvider() *providers.StatsigProvider {
	return s.statsigProvider
}

func (s *Server) GRPCPolicyAuthorizer() *auth.GRPCPolicyAuthorizer {
	return s.grpcPolicyAuthorizer
}

func (s *Server) Cleanup() {
	s.grpcServer.GracefulStop()
	s.logger.Sync()
	tracer.Stop()
	profiler.Stop()

	if s.statsigProvider != nil {
		s.statsigProvider.Shutdown()
	}
}

func (s *Server) GRPCAddr() net.Addr {
	return s.grpcListener.Addr()
}

func CreateAuthedGRPCConnection(ctx context.Context, params GRPCConnParams) (*grpc.ClientConn, func()) {
	authToken, err := auth.NewAutoRefreshToken(params.Env, params.RefreshTokenInterval)
	if err != nil {
		params.Logger.Panicw("could not initialize token", "service", params.Name, zap.Error(err))
	}
	err = authToken.Start(ctx)
	if err != nil {
		params.Logger.Panicw("could not start token", "service", params.Name, zap.Error(err))
	}

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{Token: authToken}),
	}
	opts = append(opts, monitoring.TracingDialOptions(params.Name)...)
	opts = append(opts, params.Opts...)

	return CreateGRPCConnection(ctx, params.Name, params.Address, opts, params.DialTimeout, params.Logger)
}

func CreateGRPCConnection(
	ctx context.Context,
	name string,
	address *string,
	opts []grpc.DialOption,
	dialTimeout time.Duration,
	logger *zap.SugaredLogger,
) (*grpc.ClientConn, func()) {
	if address == nil || *address == "" {
		return nil, nil
	}

	dialCtx, dialCancel := context.WithTimeout(ctx, dialTimeout)
	clientConnection, err := grpc.DialContext(dialCtx, *address, opts...)
	if err != nil {
		logger.Panicw("could not connect to GRPC", "service", name, "addr", *address, "err", err)
	}

	logger.Infow(
		"GRPC connected",
		"service", name, "state", clientConnection.GetState(),
	)

	return clientConnection, func() {
		clientConnection.Close()
		dialCancel()
	}
}

// logPanicThenCrash is to be the first interceptor in grpc chains, to attempt to log panics
// in a structured way (instead of line-by-line) before ultimately crashing.
//
// Note that this routine will not execute if the panic originated
// in another go-routine spun off from the grpc request context.
func logPanicThenCrash(logger *zap.SugaredLogger) grpc_recovery.RecoveryHandlerFuncContext {
	return func(ctx context.Context, p any) error {
		logger.Errorf("Panic: %v,\n%s", p, debug.Stack())
		os.Exit(1)
		return nil
	}
}

func NewServer(params NewServerParams) (*Server, error) {
	var server Server

	if params.ServerName == "" {
		return nil, errors.New("missing ServerName")
	}

	if params.Logger != nil {
		server.logger = params.Logger
	} else {
		server.logger = baselogger.NewSugaredLogger(params.LoggerOptions)
	}

	grpcListener, err := net.Listen("tcp", params.GRPCAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to bring up GRPC Listener: %w", err)
	}
	server.grpcListener = grpcListener
	metricsPrefix := params.ServerName
	if len(params.GRPCServiceDescriptors) == 0 {
		return nil, errors.New("missing GRPCServiceDescriptors")
	}

	var grpcUnaryInterceptors = []grpc.UnaryServerInterceptor{
		grpc_recovery.UnaryServerInterceptor(grpc_recovery.WithRecoveryHandlerContext(logPanicThenCrash(server.logger))),
	}
	var grpcStreamInterceptors = []grpc.StreamServerInterceptor{
		grpc_recovery.StreamServerInterceptor(grpc_recovery.WithRecoveryHandlerContext(logPanicThenCrash(server.logger))),
	}

	if params.DataDogConfig != nil && params.DataDogConfig.IsStatsDValid() {
		logger := server.logger.With("Host", params.DataDogConfig.StatsDUrl)

		logger.Infow("Enabling DataDog Recorder...")

		dataDogRecorder, err := monitoring.NewDataDogRecorder(params.DataDogConfig, server.logger)
		if err != nil {
			return nil, fmt.Errorf("failed to bring up DataDog Recorder: %w", err)
		}

		if params.DataDogConfig.IsAPMValid() {
			err = dataDogRecorder.SetupTracing()
			if err != nil {
				server.logger.Panicw("Setup Datadog failed.", zap.Error(err))
			}

			grpcUnaryInterceptors = append(grpcUnaryInterceptors, dataDogRecorder.GRPCUnaryInterceptor())
			grpcStreamInterceptors = append(grpcStreamInterceptors, dataDogRecorder.GRPCStreamInterceptor())
		}
		server.dataDogRecorder = dataDogRecorder
	}

	if params.InfluxEnv != nil {
		logger := server.logger.With("addr", params.InfluxEnv.URL)
		if params.InfluxEnv.URL != "" {
			logger.Infow("Enabling InfluxDB...")
		}
		influxRecorder, err := monitoring.NewInfluxRecorder(context.Background(), params.InfluxEnv, metricsPrefix, server.logger)
		if err != nil {
			return nil, fmt.Errorf("failed to bring up InfluxDB: %w", err)
		}

		if influxRecorder != nil {
			logger.Infow("InfluxDB enabled.")
			grpcUnaryInterceptors = append(grpcUnaryInterceptors, influxRecorder.GRPCUnaryInterceptor())
			grpcStreamInterceptors = append(grpcStreamInterceptors, influxRecorder.GRPCStreamInterceptor())

			influxRecorder.With("", nil, nil).WritePoint(
				"startup",
				nil,
				monitoring.Fields{
					"version": buildinfo.Version,
				})
		}

		server.influxRecorder = influxRecorder
	}

	if params.StatsigProviderConfig != nil {
		logger := server.logger.With("env", params.StatsigProviderConfig.Tier)
		if params.StatsigProviderConfig.Tier != "" {
			logger.Infow("Enabling Statsig...")
		}
		statsigProvider, err := providers.NewStatsigProvider(*params.StatsigProviderConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to Statsig: %w", err)
		}

		logger.Infow("Connecting to Statsig...")
		statsigProvider.Start()
		logger.Infow("Statsig connected.")

		server.statsigProvider = statsigProvider
	}

	if err := params.GRPCAuthConfig.Validate(); err != nil {
		return nil, fmt.Errorf("error starting %s, missing auth0 configurations: %w", params.ServerName, err)
	}

	if params.GRPCAuthConfig.AllowMultipleAudiences {
		server.logger.Info("grpc-auth: multiple-audience support is enabled.")
	}

	perms := auth.NewMethodPermissions(params.GRPCServiceDescriptors, params.GRPCAuthConfig)
	grpcUnaryInterceptors = append(grpcUnaryInterceptors, perms.GRPCUnaryInterceptor())
	grpcStreamInterceptors = append(grpcStreamInterceptors, perms.GRPCStreamInterceptor())

	if params.GRPCPolicyAuthorizerConfig != nil {
		server.grpcPolicyAuthorizer, err = auth.NewGRPCPolicyAuthorizer(auth.GRPCPolicyAuthorizerConfig{
			Enabled:                 params.GRPCPolicyAuthorizerConfig.Enabled,
			Logger:                  server.logger,
			PolicyServiceBaseURL:    params.GRPCPolicyAuthorizerConfig.PolicyServiceBaseURL,
			PolicyActorConfigurator: params.GRPCPolicyAuthorizerConfig.PolicyActorConfigurator,
		})
		if err != nil {
			return nil, fmt.Errorf("error initializing grpc policy authorizer: %w", err)
		}

		// It's important that the policy interceptor follows the permissions interceptor as it
		// depends on verified actor context from the JWT to evaluate policies
		grpcUnaryInterceptors = append(grpcUnaryInterceptors, server.grpcPolicyAuthorizer.GRPCUnaryInterceptor())
		grpcStreamInterceptors = append(grpcStreamInterceptors, server.grpcPolicyAuthorizer.GRPCStreamInterceptor())
	}

	grpcUnaryInterceptors = append(grpcUnaryInterceptors, params.ExtraUnaryServerInterceptors...)
	grpcStreamInterceptors = append(grpcStreamInterceptors, params.ExtraStreamServerInterceptors...)

	server.grpcServer = grpc.NewServer(
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(grpcUnaryInterceptors...)),
		grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(grpcStreamInterceptors...)),
	)

	return &server, nil
}

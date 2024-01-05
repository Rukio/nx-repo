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

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
	"github.com/*company-data-covered*/services/go/pkg/jobscheduler"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName                    = "ShiftScheduleService"
	healthcheckServiceName         = "ShiftScheduleHealthService"
	authorizationDisabledKey       = "AUTHORIZATION_DISABLED"
	shiftAdminUserName             = "SHIFT_ADMIN_USERNAME"
	shiftAdminPassword             = "SHIFT_ADMIN_PASSWORD"
	syncOnCallShiftsCronExpression = "0 23 * * *"
	syncOnCallShiftsJobName        = "SyncOnCallShiftsJob"
)

var (
	grpcAddr                 = flag.String("grpc-listen-addr", ":8184", "GRPC address to listen to")
	httpAddr                 = flag.String("http-listen-addr", ":8185", "HTTP API address to listen to")
	stationURL               = flag.String("station-url", "http://localhost:3000", "station url")
	influxDBRetentionPolicy  = flag.String("influx-db-retention-policy", "autogen", "default influxDB retention policy")
	auth0IssuerURL           = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	auth0Audience            = flag.String("auth0-audience", fmt.Sprintf("%s,shiftschedule-service.*company-data-covered*.com", auth.LogicalAPIAudience), "auth0 audience for shift schedule service")
	refreshTokenInterval     = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	stationAuth0Audience     = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")
	shiftAdminURL            = flag.String("shift-admin-url", "https://www.shiftadmin.com", "shift admin url")
	shiftAdminVirtualGroupID = flag.Int64("shift-admin-virtual-group-id", 23, "shift admin virtual group id")

	allowedHTTPOrigins = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")
	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodGet}
)

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			shiftschedulepb.File_shift_schedule_service_proto.Services().ByName(serviceName),
			shiftschedulepb.File_shift_schedule_healthcheck_proto.Services().ByName(healthcheckServiceName),
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
	logger.Infow("ShiftSchedule", "version", buildinfo.Version)

	stationAuthToken, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("SHIFTSCHEDULE_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("SHIFTSCHEDULE_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     *stationAuth0Audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not create a refresh token", zap.Error(err))
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	err = stationAuthToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start refresh token", zap.Error(err))
	}

	shiftScheduleService := NewGRPCServer(
		&station.Client{
			AuthToken:  stationAuthToken,
			StationURL: *stationURL,
		},
		&ShiftAdminClient{
			UserName:      os.Getenv(shiftAdminUserName),
			Password:      os.Getenv(shiftAdminPassword),
			ShiftAdminURL: *shiftAdminURL,
		},
		logger,
	)
	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			shiftschedulepb.RegisterShiftScheduleServiceServer(grpcServer, shiftScheduleService)
			shiftschedulepb.RegisterShiftScheduleHealthServiceServer(grpcServer, &HealthCheckServer{})
		})

		if err != nil {
			logger.Panicw("GRPC Server failed!", zap.Error(err))
		}
	}()

	scheduler := jobscheduler.NewJobScheduler(logger)
	err = scheduler.AddFunc(syncOnCallShiftsCronExpression, syncOnCallShiftsJobName, shiftScheduleService.SyncOnCallShiftsJob)
	if err != nil {
		logger.Panicw("could not add job!", zap.Error(err))
	}
	scheduler.Start(ctx)

	mux := runtime.NewServeMux()

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}
	err = shiftschedulepb.RegisterShiftScheduleHealthServiceHandlerFromEndpoint(ctx, mux, *grpcAddr, opts)
	if err != nil {
		logger.Panicw("Could not register healthcheck endpoint.", zap.Error(err))
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

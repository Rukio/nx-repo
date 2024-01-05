package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	providernotifications "github.com/*company-data-covered*/services/go/cmd/notifications-service/provider-notifications-service"
	"github.com/*company-data-covered*/services/go/cmd/notifications-service/slack-service"
	"github.com/*company-data-covered*/services/go/cmd/notifications-service/twilio-service"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/cors"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	slackpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/slack"
	twiliopb "github.com/*company-data-covered*/services/go/pkg/generated/proto/twilio"
	"github.com/*company-data-covered*/services/go/pkg/grpcgateway"
	"github.com/*company-data-covered*/services/go/pkg/jobscheduler"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	serviceName                     = "NotificationsService"
	twilioServiceName               = "TwilioService"
	slackServiceName                = "SlackService"
	authorizationDisabledKey        = "AUTHORIZATION_DISABLED"
	scheduleChangedJobName          = "SendScheduleChangedNotificationsToProviders"
	dataDogNotificationsServiceName = "notifications-service"
)

var (
	httpAddr       = flag.String("http-listen-addr", ":8101", "HTTP API address to listen to")
	grpcAddr       = flag.String("grpc-listen-addr", ":8100", "GRPC address to listen to")
	auth0IssuerURL = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	auth0Audience  = flag.String("auth0-audience", auth.LogicalAPIAudience, "auth0 audience for notifications service")

	logisticsGRPCAddr      = flag.String("logistics-grpc-addr", "127.0.0.1:8082", "Logistics service GRPC address")
	logisticsAuth0Audience = flag.String("logistics-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for logistics service")
	stationAuth0Audience   = flag.String("station-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for station")
	stationURL             = flag.String("station-url", "http://localhost:3000", "station url")
	twilioStatCheckURL     = flag.String("twilio-statistics-check-url", "https://status.twilio.com/api/v2/components.json", "twilio API statistic check url")
	refreshTokenInterval   = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")

	devMode = flag.Bool("dev-mode-logging", false, "Enables dev mode logging")

	grpcDialTimeout = flag.Duration("grpc-dial-timeout", 5*time.Second, "Timeout for initial connection to GRPC servers")

	allowedHTTPHeaders = []string{"*"}
	allowedHTTPMethods = []string{http.MethodGet}
	allowedHTTPOrigins = flag.String("allowed-http-origins", "http://localhost:*", "Allowed domains for CORS configuration, can be a comma separated list")

	scheduleChangedCronExpression = flag.String("schedule-changed-cron-expression", "*/5 * * * *", "cron expression for sending notifications with schedule changes")
)

func initAndStartRefreshingM2MToken(ctx context.Context, audience string, logger *zap.SugaredLogger) *auth.AutoRefreshToken {
	token, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("NOTIFICATIONS_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("NOTIFICATIONS_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     audience,
		IssuerURL:    *auth0IssuerURL,
	}, *refreshTokenInterval)
	if err != nil {
		logger.Panicw("could not initialize M2M token", "audience", audience, zap.Error(err))
	}
	err = token.Start(ctx)
	if err != nil {
		logger.Panicw("could not start refreshing M2M token", "audience", audience, zap.Error(err))
	}

	return token
}

func main() {
	flag.Parse()

	server, err := baseserv.NewServer(baseserv.NewServerParams{
		ServerName: serviceName,
		GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{
			twiliopb.File_twilio_service_proto.Services().ByName(twilioServiceName),
			slackpb.File_slack_service_proto.Services().ByName(slackServiceName),
		},
		GRPCAddr: *grpcAddr,
		GRPCAuthConfig: auth.Config{
			AuthorizationDisabled: os.Getenv(authorizationDisabledKey) == "true",
			IssuerURL:             *auth0IssuerURL,
			Audience:              *auth0Audience,
		},
		LoggerOptions: baselogger.LoggerOptions{
			ServiceName:  serviceName,
			UseDevConfig: *devMode,
		},
		DataDogConfig:         baseserv.DefaultEnvDataDogConfig(dataDogNotificationsServiceName),
		StatsigProviderConfig: baseserv.DefaultEnvStatsigProviderConfig(),
	})
	if err != nil {
		log.Panic(err)
	}
	defer server.Cleanup()

	logger := server.Logger()
	logger.Infow(serviceName, "version", buildinfo.Version)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	stationAuthToken := initAndStartRefreshingM2MToken(ctx, *stationAuth0Audience, logger)
	logisticsAuthToken := initAndStartRefreshingM2MToken(ctx, *logisticsAuth0Audience, logger)

	logisticsGRPCDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
			Token: logisticsAuthToken,
		}),
	}
	logisticsGRPCConnection, closeLogisticsGRPCConnection := baseserv.CreateGRPCConnection(
		context.Background(),
		"logistics",
		logisticsGRPCAddr,
		logisticsGRPCDialOptions,
		*grpcDialTimeout,
		logger,
	)
	defer closeLogisticsGRPCConnection()

	accountSID := os.Getenv("TWILIO_ACCOUNT_SID")
	twilioAPIKey := os.Getenv("TWILIO_API_KEY")
	twilioAPISecret := os.Getenv("TWILIO_API_SECRET")
	twilioFromNumber := os.Getenv("TWILIO_FROM_NUMBER")
	twilioClient, err := twilio.NewTwilioClient(accountSID, twilioAPIKey, twilioAPISecret, twilioFromNumber)
	if err != nil {
		logger.Panic(err.Error())
	}

	slackClient, err := slack.NewSlackClient(os.Getenv("SLACK_BOT_TOKEN"))
	if err != nil {
		logger.Panic(err.Error())
	}

	scheduler := jobscheduler.NewJobScheduler(logger)

	statsigProvider := server.StatsigProvider()
	if statsigProvider == nil {
		log.Panic("could not initialize Statsig provider")
	}
	providerNotificationsCronService := providernotifications.NewCronService(
		providernotifications.NewCronServiceParams{
			StationClient: &providernotifications.StationClient{
				StationHTTPClient: &station.Client{
					AuthToken:  stationAuthToken,
					StationURL: *stationURL,
				},
			},
			LogisticsService: logisticspb.NewLogisticsServiceClient(logisticsGRPCConnection),
			TwilioClient:     twilioClient,
			StatsigProvider:  statsigProvider,
			Logger:           logger,
		},
	)

	err = scheduler.AddFunc(
		*scheduleChangedCronExpression,
		scheduleChangedJobName,
		func() error {
			return providerNotificationsCronService.SendScheduleChangedNotificationsToProviders(ctx)
		},
	)
	if err != nil {
		logger.Panicw("could not add job!", "job_name", scheduleChangedJobName, zap.Error(err))
	}
	scheduler.Start(ctx)

	go func() {
		err = server.ServeGRPC(func(grpcServer *grpc.Server) {
			twiliopb.RegisterTwilioServiceServer(grpcServer, &twilio.GRPCServer{
				TwilioClient: twilioClient,
				Logger:       logger,
			})
			slackpb.RegisterSlackServiceServer(grpcServer, &slack.GRPCServer{
				SlackClient: slackClient,
				Logger:      logger,
			})
			healthpb.RegisterHealthServer(grpcServer, &HealthGRPCService{
				SlackClient: slackClient,
				TwilioStatCheckClient: &TwilioStatCheckClient{
					TwilioStatCheckURL: *twilioStatCheckURL,
				},
				Logger: logger,
			})
		})
		if err != nil {
			logger.Panicw("GRPC Server failed", zap.Error(err))
		}
	}()

	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	opts = append(opts, monitoring.TracingDialOptions(dataDogNotificationsServiceName)...)

	healthcheckGRPCConnection, closeHealthcheckConn := baseserv.CreateGRPCConnection(
		context.Background(),
		"healthcheck",
		grpcAddr,
		opts,
		*grpcDialTimeout,
		logger,
	)
	defer closeHealthcheckConn()

	mux := runtime.NewServeMux(
		runtime.WithForwardResponseOption(grpcgateway.HTTPResponseModifier),
		runtime.WithHealthEndpointAt(healthpb.NewHealthClient(healthcheckGRPCConnection), "/healthcheck"),
	)

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
	if err := http.ListenAndServe(*httpAddr, corsInstance.Handler(mux)); err != nil {
		logger.Panicw("error serving http", zap.Error(err))
	}
}

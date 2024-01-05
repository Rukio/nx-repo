package main

import (
	"context"
	"encoding/base64"
	"flag"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/featureflags"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/bsm/redislock"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	serviceName = "AthenaListenerService"
)

var (
	refreshTokenInterval       = flag.Duration("grpc-refresh-token-interval", 1*time.Hour, "time interval for refreshing M2M tokens")
	listenerPollingInterval    = flag.Duration("listener-polling-interval", 10*time.Second, "default polling interval for athena listener")
	auth0IssuerURL             = flag.String("auth0-issuer-url", "https://staging-auth.*company-data-covered*.com/", "auth0 issuer URL")
	athenaServiceGRPCAddr      = flag.String("athena-service-grpc-addr", "localhost:8472", "GRPC address of the Athena service")
	auth0Audience              = flag.String("internal-auth0-audience", auth.LogicalAPIAudience, "auth0 audience for athena service")
	leaveUnprocessed           = flag.Bool("leave-unprocessed", true, "whether to pass leave_unprocessed=true to Athena ListChanged endpoints")
	defaultGRPCTimeout         = flag.Duration("default-grpc-timeout", 5*time.Second, "Default GRPC timeout")
	auditServiceGRPCAddr       = flag.String("audit-service-grpc-addr", "localhost:8482", "gRPC address for the audit service")
	redisLockExpiry            = flag.Duration("redis-lock-expiry", 1*time.Minute, "expiry for holding a redis lock on a polling loop")
	enableRedis                = flag.Bool("enable-redis", true, "enable redis for caching calls")
	envProvider                = providers.NewEnvProvider()
	changedPatientsTopicName   = featureflags.NewStringFlag("KAFKA_CHANGED_PATIENTS_TOPIC_NAME", "dev.athena.changed-patients").Get(envProvider)
	changedLabResultsTopicName = featureflags.NewStringFlag("KAFKA_CHANGED_LAB_RESULTS_TOPIC_NAME", "dev.athena.changed-lab-results").Get(envProvider)
	versionSetting             = featureflags.NewStringFlag("KAFKA_VERSION", "3.2.3")
	loggingSetting             = featureflags.NewBooleanFlag("KAFKA_LOGGING_VERBOSE", false)
	brokersSetting             = featureflags.NewStringFlag("KAFKA_BROKERS", "localhost:9092")
	rootCAStrPem               = featureflags.NewStringFlag("KAFKA_BROKER_CA_PEM", "")
	clientCertStrPem           = featureflags.NewStringFlag("KAFKA_BROKER_CERTIFICATE_PEM", "")
	clientKeyStrPem            = featureflags.NewStringFlag("KAFKA_BROKER_KEY_PEM", "")
	rootCASetting              = decodePemStrFlag(rootCAStrPem)
	clientCertSetting          = decodePemStrFlag(clientCertStrPem)
	clientKeySetting           = decodePemStrFlag(clientKeyStrPem)
)

func getM2MToken(audience string, issuerURL string) (*auth.AutoRefreshToken, error) {
	token, err := auth.NewAutoRefreshToken(auth.Auth0Env{
		ClientID:     os.Getenv("ATHENA_LISTENER_SERVICE_M2M_AUTH0_CLIENT_ID"),
		ClientSecret: os.Getenv("ATHENA_LISTENER_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
		Audience:     audience,
		IssuerURL:    issuerURL,
	}, *refreshTokenInterval)

	return token, err
}

func listenerProducerConfig() *eventstreaming.ClientConfig {
	return &eventstreaming.ClientConfig{
		Brokers:        strings.Split(brokersSetting.Get(envProvider), ","),
		KafkaVersion:   versionSetting.Get(envProvider),
		VerboseLogging: loggingSetting.Get(envProvider),
		Certs: &eventstreaming.ClientCerts{
			RootCA:     rootCASetting,
			ClientCert: clientCertSetting,
			ClientKey:  clientKeySetting,
		},
		Producer:       &eventstreaming.ProducerConfig{},
		LoggingOptions: baselogger.LoggerOptions{ServiceName: serviceName},
	}
}

func listenerConsumerConfig() *eventstreaming.ClientConfig {
	groupSetting := featureflags.NewStringFlag("KAFKA_CONSUMER_GROUP", "")
	assignmentStrategySetting := featureflags.NewStringFlag("KAFKA_ASSIGNMENT_STRATEGY", eventstreaming.RangeAssignment)
	oldestOffsetSetting := featureflags.NewBooleanFlag("KAFKA_OLDEST_OFFSET", true)

	return &eventstreaming.ClientConfig{
		Brokers:        strings.Split(brokersSetting.Get(envProvider), ","),
		KafkaVersion:   versionSetting.Get(envProvider),
		LoggingOptions: baselogger.LoggerOptions{},
		VerboseLogging: loggingSetting.Get(envProvider),
		Certs: &eventstreaming.ClientCerts{
			RootCA:     rootCASetting,
			ClientCert: clientCertSetting,
			ClientKey:  clientKeySetting,
		},
		Consumer: &eventstreaming.ConsumerConfig{
			GroupID:            groupSetting.Get(envProvider),
			AssignmentStrategy: eventstreaming.AssignmentStrategy(assignmentStrategySetting.Get(envProvider)),
			ConsumeFromOldest:  oldestOffsetSetting.Get(envProvider),
		},
	}
}

func decodePemStrFlag(psf *featureflags.StringFlag) []byte {
	decodedVar, err := base64.StdEncoding.DecodeString(psf.Get(envProvider))
	if err != nil {
		log.Printf("could not decode StringFlag: %s", err.Error())
		return nil
	}
	return decodedVar
}

func main() {
	flag.Parse()
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	defer stop()
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{ServiceName: serviceName})
	authToken, err := getM2MToken(*auth0Audience, *auth0IssuerURL)
	if err != nil {
		logger.Panicw("could not initialize athena-service M2M token", zap.Error(err))
	}
	err = authToken.Start(ctx)
	if err != nil {
		logger.Panicw("could not start athena-service refresh token", zap.Error(err))
	}
	gRPCDialOptions := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithPerRPCCredentials(&auth.GRPCAddCredentials{
			Token: authToken,
		}),
	}
	gRPCDialOptions = append(gRPCDialOptions, monitoring.TracingDialOptions(monitoring.DataDogAthenaListenerServiceName)...)
	datadogConfig := baseserv.DefaultEnvDataDogConfig(monitoring.DataDogAthenaListenerServiceName)
	var datadogRecorder *monitoring.DataDogRecorder
	if datadogConfig != nil {
		datadogRecorder, err = monitoring.NewDataDogRecorder(datadogConfig, logger)
		if err != nil {
			logger.Panicw("could not setup datadog recorder", zap.Error(err))
		}

		err = datadogRecorder.SetupTracing()
		if err != nil {
			logger.Panicw("could not setup datadog tracing", zap.Error(err))
		}
	}

	athenaServiceConnection, err := grpc.DialContext(ctx, *athenaServiceGRPCAddr, gRPCDialOptions...)
	if err != nil {
		logger.Panicw("could not connect to Athena service GRPC",
			"addr", athenaServiceGRPCAddr,
			zap.Error(err))
	}
	defer athenaServiceConnection.Close()
	logger.Infow("Athena Service GRPC connected", "state", athenaServiceConnection.GetState())
	statsigConfig := baseserv.DefaultEnvStatsigProviderConfig()
	logger = logger.With("env", statsigConfig.Tier)
	statsigProvider, err := providers.NewStatsigProvider(*statsigConfig)
	if err != nil {
		logger.Panicw("failed to connect to Statsig: %w", zap.Error(err))
	}
	statsigProvider.Start()
	if statsigProvider == nil {
		logger.Panic("no statsig provider")
	}

	auditServiceConnection, closeAuditServiceConn := baseserv.CreateAuthedGRPCConnection(
		ctx,
		baseserv.GRPCConnParams{
			Name:        monitoring.DataDogAuditServiceName,
			Address:     auditServiceGRPCAddr,
			DialTimeout: *defaultGRPCTimeout,
			Logger:      logger,
			Env: auth.Auth0Env{
				ClientID:     os.Getenv("ATHENA_LISTENER_SERVICE_M2M_AUTH0_CLIENT_ID"),
				ClientSecret: os.Getenv("ATHENA_LISTENER_SERVICE_M2M_AUTH0_CLIENT_SECRET"),
				Audience:     *auth0Audience,
				IssuerURL:    *auth0IssuerURL,
			},
			RefreshTokenInterval: *refreshTokenInterval,
		},
	)
	defer closeAuditServiceConn()
	if err != nil {
		logger.Panicw("could not connect to audit service", "addr", *auditServiceGRPCAddr, zap.Error(err))
	}
	auditClient := auditpb.NewAuditServiceClient(auditServiceConnection)

	var redisClient *redisclient.Client
	var redisLockClient *redislock.Client
	if *enableRedis {
		redisURL := os.Getenv("REDIS_URL")
		if redisURL == "" {
			logger.Panic("REDIS_URL not set")
		}
		redisClient, err = redisclient.New(&redisclient.Config{
			ServiceName: serviceName,
			RedisURL:    redisURL,
			AuditClient: &auditClient,
		})

		if err != nil {
			logger.Panicw("failed to create redis client", zap.Error(err))
		}

		redisLockClient = redislock.New(redisClient.Client)
	}

	producerConfig := listenerProducerConfig()
	producer, err := eventstreaming.NewMessageProducer(producerConfig)
	if err != nil {
		logger.Panicw("failed to create new eventstreaming message producer for Athena subscriptions", zap.Error(err))
	}

	consumerConfig := listenerConsumerConfig()
	consumerConfig.Consumer.Topics = map[string]eventstreaming.MessageProcessor{
		changedLabResultsTopicName: &LabResultProcessor{
			ctx:          ctx,
			logger:       logger,
			redisClient:  redisClient,
			athenaClient: athenapb.NewAthenaServiceClient(athenaServiceConnection),
		},
	}

	consumerGroup, err := eventstreaming.NewConsumerGroup(consumerConfig)
	if err != nil {
		log.Panic(err)
	}

	listener := &Listener{
		AthenaClient:     athenapb.NewAthenaServiceClient(athenaServiceConnection),
		RedisClient:      redisClient,
		DataDogRecorder:  datadogRecorder,
		Logger:           logger,
		StatsigProvider:  statsigProvider,
		PollInterval:     listenerPollingInterval,
		Producer:         producer,
		LeaveUnprocessed: *leaveUnprocessed,
		Locker:           redisLockClient,
		LockExpiry:       *redisLockExpiry,
		ConsumerGroup:    consumerGroup,
	}
	err = listener.Initialize(ctx)
	if err != nil {
		logger.Panicw("failed to start listener", zap.Error(err))
	}
	listener.Start(ctx)

	<-ctx.Done()
	logger.Info("shutting down athena listener service")
}

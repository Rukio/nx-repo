package baseserv

// TODO: Move other default configs to this file.

import (
	"log"
	"os"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	"github.com/*company-data-covered*/services/go/pkg/featureflags"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

var (
	provider       = providers.NewEnvProvider()
	versionSetting = featureflags.NewStringFlag("KAFKA_VERSION", "3.2.3")
	loggingSetting = featureflags.NewBooleanFlag("KAFKA_LOGGING_VERBOSE", false)
	brokersSetting = featureflags.NewStringFlag("KAFKA_BROKERS", "localhost:9092")
)

func DefaultEnvStatsigProviderConfig() *providers.StatsigProviderConfig {
	config := &providers.StatsigProviderConfig{
		SDKKey:         os.Getenv("STATSIG_SDK_SERVER_SECRET_KEY"),
		Tier:           os.Getenv("STATSIG_ENVIRONMENT"),
		DefaultUserKey: "userID",
	}

	if config.SDKKey == "" {
		return nil
	}

	err := config.Validate()
	if err != nil {
		log.Panicf("Invalid statsig config: %v", err)
	}

	return config
}

func DefaultEnvDataDogConfig(serviceName string) *monitoring.DataDogConfig {
	// TODO: Move os.Getenv calls out of package into main.go, to avoid hiding dependencies from callers.
	if os.Getenv("DATADOG_DISABLED") == "true" {
		return nil
	}
	return &monitoring.DataDogConfig{
		ServiceName:    serviceName,
		APMUrl:         os.Getenv("DD_AGENT_HOST"),
		Env:            os.Getenv("DD_ENV"),
		AppVersion:     buildinfo.Version,
		StatsDUrl:      os.Getenv("DD_STATSD_HOST"),
		EnableProfiler: os.Getenv("DD_ENABLE_PROFILER") == "true",
	}
}

func DefaultEventStreamingConsumerConfig() eventstreaming.ClientConfig {
	groupSetting := featureflags.NewStringFlag("KAFKA_CONSUMER_GROUP", "")
	assignmentStrategySetting := featureflags.NewStringFlag("KAFKA_ASSIGNMENT_STRATEGY", eventstreaming.RangeAssignment)
	oldestOffsetSetting := featureflags.NewBooleanFlag("KAFKA_OLDEST_OFFSET", true)

	return eventstreaming.ClientConfig{
		Brokers:        strings.Split(brokersSetting.Get(provider), ","),
		KafkaVersion:   versionSetting.Get(provider),
		LoggingOptions: baselogger.LoggerOptions{},
		VerboseLogging: loggingSetting.Get(provider),
		Consumer: &eventstreaming.ConsumerConfig{
			GroupID:            groupSetting.Get(provider),
			AssignmentStrategy: eventstreaming.AssignmentStrategy(assignmentStrategySetting.Get(provider)),
			ConsumeFromOldest:  oldestOffsetSetting.Get(provider),
		},
	}
}

func DefaultEventStreamingProducerConfig() eventstreaming.ClientConfig {
	return eventstreaming.ClientConfig{
		Brokers:        strings.Split(brokersSetting.Get(provider), ","),
		KafkaVersion:   versionSetting.Get(provider),
		VerboseLogging: loggingSetting.Get(provider),
	}
}

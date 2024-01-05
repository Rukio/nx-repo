package eventstreaming

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/Shopify/sarama"
)

const (
	StickyAssignment     = "sticky"
	RoundRobinAssignment = "roundrobin"
	RangeAssignment      = "range"
)

var (
	errConfigNoBrokers              = errors.New("no Kafka bootstrap brokers are defined")
	errConfigInvalidVersion         = errors.New("invalid version specified")
	errConfigNoRootCA               = errors.New("missing root CA")
	errConfigNoClientCert           = errors.New("missing client certificate")
	errConfigNoClientKey            = errors.New("missing client key")
	errConfigNoConsumerOrProducer   = errors.New("missing at least one of consumer or producer config")
	errConfigInvalidBalanceStrategy = errors.New("invalid consumer assignment strategy")
)

var balanceStrategiesMap = map[AssignmentStrategy][]sarama.BalanceStrategy{
	StickyAssignment:     {sarama.BalanceStrategySticky},
	RoundRobinAssignment: {sarama.BalanceStrategyRoundRobin},
	RangeAssignment:      {sarama.BalanceStrategyRange},
}

type ClientConfig struct {
	// Semantic version number of the Kakfa cluster
	KafkaVersion string

	// Determines whether connection management events should be logged
	VerboseLogging bool

	// Service logging options
	LoggingOptions baselogger.LoggerOptions

	// Brokers is a list of addresses to which a client can connect in order to automatically fetch
	// metadata on the rest of the kafka cluster.
	Brokers []string

	// Certificates for client athenticaiton
	Certs *ClientCerts

	// DialTimeout configures the timeout initializing a broker, shared across Client/Producer/Consumer config.
	DialTimeout time.Duration

	// Produucer config options
	Producer *ProducerConfig

	// Produucer config options
	Consumer *ConsumerConfig
}

type ClientCerts struct {
	// Kafka servers root CA, used when verifying the servers certificates
	RootCA []byte

	// Client Public certificate used for SSL authentication
	ClientCert []byte

	// Client private key used for SSL authentication
	ClientKey []byte
}

type ProducerConfig struct {
	// Async determines if the producer is in async mode or sync mode for sending messages
	Async bool
}

type AssignmentStrategy string

type ConsumerConfig struct {
	// GroupID uniquely identifies the group of consumer processes to which a consumer belongs.
	// Consumers label themselves with a consumer group name, and each record published to a topic is delivered to one
	// consumer instance within each subscribing consumer group. Consumer instances can be in separate processes or on separate machines.
	// If all the consumer instances have the same consumer group, then the records will effectively be load balanced over the consumer instances.
	// If all the consumer instances have different consumer groups, then each record will be broadcast to all the consumer processes.
	GroupID string

	// AssignmentStrategy determines how topics and partitions are balanced
	// across members of a consumer group
	AssignmentStrategy AssignmentStrategy

	// ConsumeFromOldest indicates whether the consumer should consume messages
	// starting from the oldest offset that is still available on the broker
	// or whether it should start consuming new messages
	ConsumeFromOldest bool

	// Topics defines a map of Kafka topics that should be consumed to the set of
	// message processors that process them.
	// Topics represent the of set of message categories from which the consumer should read messages from.
	// A Topic organizes messages into virtual groups or virtual logs that hold messages and events in a logical order.
	// Messages for a given topic will be appended one after the other thereby creating a log file of messages for that given
	// topic creating a logical segregation analogous to how data is segregated in a database by table.
	Topics map[string]MessageProcessor
}

func (config *ClientConfig) Validate() error {
	if len(config.Brokers) == 0 {
		return errConfigNoBrokers
	}

	if config.KafkaVersion != "" {
		if _, err := sarama.ParseKafkaVersion(config.KafkaVersion); err != nil {
			return errConfigInvalidVersion
		}
	}

	if config.Certs != nil {
		if config.Certs.RootCA == nil || len(config.Certs.RootCA) == 0 {
			return errConfigNoRootCA
		}

		if config.Certs.ClientCert == nil || len(config.Certs.ClientCert) == 0 {
			return errConfigNoClientCert
		}

		if config.Certs.ClientKey == nil || len(config.Certs.ClientKey) == 0 {
			return errConfigNoClientKey
		}
	}

	if config.Producer == nil && config.Consumer == nil {
		return errConfigNoConsumerOrProducer
	}

	if config.Producer != nil {
		if err := config.producerConfigValidate(); err != nil {
			return err
		}
	}

	if config.Consumer != nil {
		if err := config.consumerConfigValidate(); err != nil {
			return err
		}
	}

	return nil
}

func (config *ClientConfig) producerConfigValidate() error {
	// currently no further validation needed for producer settings
	return nil
}

func (config *ClientConfig) consumerConfigValidate() error {
	if len(config.Consumer.GroupID) == 0 {
		return errors.New("no Kafka consumer group defined")
	}

	if config.Consumer.Topics == nil || len(config.Consumer.Topics) == 0 {
		return errors.New("no topics given to be consumed")
	}

	for topic, processor := range config.Consumer.Topics {
		if processor == nil {
			return fmt.Errorf("no processor is configured for the %s topic", topic)
		}
	}

	if bs := balanceStrategiesMap[config.Consumer.AssignmentStrategy]; bs == nil {
		return errConfigInvalidBalanceStrategy
	}

	return nil
}

func toSaramaConfig(config *ClientConfig) (*sarama.Config, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}
	var err error
	saramaConfig := sarama.NewConfig()

	kafkaVersion := sarama.MinVersion
	if config.KafkaVersion != "" {
		if kafkaVersion, err = sarama.ParseKafkaVersion(config.KafkaVersion); err != nil {
			return nil, err
		}
	}
	saramaConfig.Version = kafkaVersion

	if config.DialTimeout > 0 {
		saramaConfig.Net.DialTimeout = config.DialTimeout
	}

	if config.Certs != nil {
		saramaConfig.Net.TLS.Enable = true

		pool, _ := x509.SystemCertPool()
		if ok := pool.AppendCertsFromPEM(config.Certs.RootCA); !ok {
			return nil, errors.New("invalid cert: failed to load root CA")
		}

		cert, err := tls.X509KeyPair(config.Certs.ClientCert, config.Certs.ClientKey)
		if err != nil {
			return nil, errors.New("invalid cert: failed to load key pair")
		}

		saramaConfig.Net.TLS.Config = &tls.Config{
			RootCAs: pool,
			Certificates: []tls.Certificate{
				cert,
			},
		}
	}

	if config.Producer != nil {
		if config.Producer.Async {
			saramaConfig.Producer.RequiredAcks = sarama.WaitForLocal
			saramaConfig.Producer.Flush.Frequency = 500 * time.Millisecond
			// TODO: enable errors when interface is decided
			// disable to avoid deadlock
			saramaConfig.Producer.Return.Errors = false
		} else {
			saramaConfig.Producer.Retry.Max = 10
			saramaConfig.Producer.Return.Successes = true
		}
	}

	if config.Consumer != nil {
		if config.Consumer.ConsumeFromOldest {
			saramaConfig.Consumer.Offsets.Initial = sarama.OffsetOldest
		}

		balanceStrategies := balanceStrategiesMap[config.Consumer.AssignmentStrategy]
		saramaConfig.Consumer.Group.Rebalance.GroupStrategies = balanceStrategies
	}

	if err = saramaConfig.Validate(); err != nil {
		return nil, err
	}

	return saramaConfig, nil
}

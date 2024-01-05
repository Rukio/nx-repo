package eventstreaming

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/Shopify/sarama"
	"go.uber.org/zap"
)

// Consumer Lifecycle
// The life-cycle of a consumer session is represented by the following steps:
//
// 1. Consumers join the group (as explained in https://kafka.apache.org/documentation/#intro_consumers) and are assigned their "fair share" of partitions, aka 'claims'.
// 2. Before processing starts, the handler's `Setup()` hook is called to notify the user of the claims and allow any necessary preparation or alteration of state.
// 3. For each of the assigned claims the handler's `ConsumeClaim()` function is then called in a separate `goroutine`.
//   - This requires it to be thread-safe.
//   - Any state must be carefully protected from concurrent reads/writes.
//
// 4. The session will persist until one of the `ConsumeClaim()` functions exits. This can be either when the parent context is canceled or when a server-side rebalance cycle is initiated.
// 5. Once all the `ConsumeClaim()` loops have exited, the handler's `Cleanup()` hook is called to allow the user to perform any final tasks before a rebalance.
// 6. Finally, marked offsets are committed one last time before claims are released.
//
// These life-cycle events are captured in the `consumerGroupHandler` interface.  As such, a concrete Consumer must implement this interface in order for the `consumerGroupClient` to use it as a message consumer.

type MessageConsumerCerts struct {
	// Kafka servers root CA, used when verifying the servers certificates
	RootCA []byte

	// Client Public certificate used for SSL authentication
	ClientCert []byte

	// Client private key used for SSL authentication
	ClientKey []byte
}

type ConsumerGroup interface {
	Error() chan error
	Start(ctx context.Context)
	Stop() error
	Pause()
	Resume()
}

type consumerGroupClient struct {
	config  *ConsumerConfig
	client  sarama.ConsumerGroup
	cancel  context.CancelFunc
	errChan chan error
	logger  *zap.SugaredLogger
}

func (cg *consumerGroupClient) Error() chan error {
	return cg.errChan
}

func (cg *consumerGroupClient) Start(ctx context.Context) {
	topicsProcessor := newTopicsProcessor(cg.config.Topics)
	consumer := newConsumerGroupHandler(topicsProcessor)

	ctx, cancel := context.WithCancel(ctx)
	cg.cancel = cancel

	go func() {
		// Consume is called inside an infinite loop because the consumer client
		// may need to be recreated as a result of a server-side rebalance
		for {
			if err := cg.client.Consume(ctx, topicsProcessor.Topics(), consumer); err != nil {
				cg.errChan <- fmt.Errorf("consume error: %w", err)
				return
			}

			// Stop consuming when the context has been cancelled.
			if ctx.Err() != nil {
				return
			}

			// In order to get the new claims when a server-side rebalance occurs
			// the consumer session will be recreated.  As a result the ready state
			// is reset indicating that the consumer client is not yet ready until
			// Setup is invoked by the new consumer session.
			consumer.resetReady()
		}
	}()

	<-consumer.ready() // Wait until the consumer has been set up
	cg.logger.Info("Consumer group has started...")
}

func (cg *consumerGroupClient) Stop() error {
	if cg.cancel != nil {
		cg.cancel()
	}

	if err := cg.client.Close(); err != nil {
		return fmt.Errorf("error closing client: %w", err)
	}

	return nil
}

func (cg *consumerGroupClient) Pause() {
	cg.client.PauseAll()
	cg.logger.Info("Pausing consumption")
}

func (cg *consumerGroupClient) Resume() {
	cg.client.ResumeAll()
	cg.logger.Info("Resuming consumption")
}

func NewConsumerGroup(config *ClientConfig) (ConsumerGroup, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}

	if config.Consumer == nil {
		return nil, errors.New("no consumer config provided")
	}

	clientConfig, err := toSaramaConfig(config)
	if err != nil {
		return nil, err
	}

	if config.VerboseLogging {
		sarama.Logger = log.New(os.Stdout, "[eventstreaming] ", log.LstdFlags)
	}

	client, err := consumerGroupProvider(config.Brokers, config.Consumer.GroupID, clientConfig)
	if err != nil {
		return nil, fmt.Errorf("error creating consumer group client: %w", err)
	}

	return &consumerGroupClient{
		config:  config.Consumer,
		client:  client,
		errChan: make(chan error),
		logger:  baselogger.NewSugaredLogger(config.LoggingOptions),
	}, nil
}

// TODO: remove when Kafka is running in CI/CD
// Temporary usage for testing consumer group creation without Kafka running in CI/CD environment.
// Testing can substitute this provider with its own mock.
var defaultConsumerGroupProvider = sarama.NewConsumerGroup
var consumerGroupProvider = defaultConsumerGroupProvider

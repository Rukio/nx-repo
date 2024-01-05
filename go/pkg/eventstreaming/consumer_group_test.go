package eventstreaming

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/Shopify/sarama"
)

var topics = map[string]MessageProcessor{
	"test-topic-1": newTestMessageLogger(),
	"test-topic-2": newTestMessageLogger(),
	"test-topic-3": newTestMessageLogger(),
}

var testConsumerConfig = ConsumerConfig{
	GroupID:            "consumerGroupID",
	AssignmentStrategy: StickyAssignment,
	ConsumeFromOldest:  true,
	Topics:             topics,
}

func TestNewConsumerGroup(t *testing.T) {
	tcs := []struct {
		Desc            string
		Config          *ClientConfig
		UseMockProvider bool
		HasError        bool
	}{
		{
			Desc: "invalid kafka version",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Consumer: &ConsumerConfig{
					GroupID:            "consumerGroupID",
					AssignmentStrategy: StickyAssignment,
					ConsumeFromOldest:  true,
					Topics:             topics,
				},
			},

			HasError: true,
		},
		{
			Desc: "invalid broker",
			Config: &ClientConfig{
				Brokers:      []string{"localhost:9095"},
				KafkaVersion: "3.2.3",
				Consumer: &ConsumerConfig{
					GroupID:            "consumerGroupID",
					AssignmentStrategy: RoundRobinAssignment,
					ConsumeFromOldest:  true,
					Topics:             topics,
				},
			},

			HasError: true,
		},
		{
			Desc: "missing broker",
			Config: &ClientConfig{
				KafkaVersion: "3.2.3",
				Consumer: &ConsumerConfig{
					GroupID:            "consumerGroupID",
					AssignmentStrategy: RangeAssignment,
					ConsumeFromOldest:  true,
					Topics:             topics,
				},
			},

			HasError: true,
		},
		{
			Desc: "minimally valid configuration",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9092"},
				Consumer: &ConsumerConfig{
					GroupID:            "consumerGroupID",
					AssignmentStrategy: RoundRobinAssignment,
					ConsumeFromOldest:  true,
					Topics:             topics,
				},
			},

			UseMockProvider: true,
			HasError:        false,
		},
	}

	for _, tc := range tcs {
		if tc.UseMockProvider {
			consumerGroupProvider = NewMockConsumerGroup
		}

		consumerGroup, err := NewConsumerGroup(tc.Config)

		if tc.UseMockProvider {
			consumerGroupProvider = defaultConsumerGroupProvider
		}

		if err != nil && !tc.HasError {
			t.Fatalf("Expected no error but received error for case %s", tc.Desc)
		}

		if consumerGroup == nil && !tc.HasError {
			t.Fatalf("Expected a consumer group but received nil for case %s", tc.Desc)
		}
	}
}

func TestConsumerGroup_Stop(t *testing.T) {
	consumerGroup := consumerGroupClient{
		config: &testConsumerConfig,
		client: &MockConsumerGroupClient{},
	}
	err := consumerGroup.Stop()
	testutils.MustMatch(t, nil, err)

	consumerGroup2 := consumerGroupClient{
		config: &testConsumerConfig,
		client: &MockConsumerGroupClient{closeWithError: true},
	}
	err = consumerGroup2.Stop()
	testutils.MustMatch(t, errors.New("error closing client: close failed").Error(), err.Error())
}

func TestConsumerGroupPause(t *testing.T) {
	mockConsumerGroupClient := MockConsumerGroupClient{}
	consumerGroup := consumerGroupClient{
		config: &testConsumerConfig,
		client: &mockConsumerGroupClient,
		logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}
	consumerGroup.Pause()
}

func TestConsumerGroup_Resume(t *testing.T) {
	mockConsumerGroupClient := MockConsumerGroupClient{}
	consumerGroup := consumerGroupClient{
		config: &testConsumerConfig,
		client: &mockConsumerGroupClient,
		logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}
	consumerGroup.Resume()
}

func TestConsumerGroup_Start(t *testing.T) {
	consumerGroup := consumerGroupClient{
		config: &testConsumerConfig,
		client: &MockConsumerGroupClient{},
		logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}
	consumerGroup.Start(context.Background())
	err := consumerGroup.Stop()
	testutils.MustMatch(t, nil, err)

	consumerGroup = consumerGroupClient{
		config:  &testConsumerConfig,
		client:  &MockConsumerGroupClient{consumeWithError: true},
		errChan: make(chan error),
		logger:  baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}
	consumerGroup.Start(context.Background())
	err = <-consumerGroup.Error()
	testutils.MustMatch(t, errors.New("consume error: error consuming claim").Error(), err.Error())
}

type MockConsumerGroupClient struct {
	closeWithError   bool
	consumeWithError bool
	paused           bool
}

func (mcg *MockConsumerGroupClient) Consume(ctx context.Context, topics []string, handler sarama.ConsumerGroupHandler) error {
	err := handler.Setup(&MockConsumerGroupSession{})
	if err != nil {
		return err
	}

	if mcg.consumeWithError {
		return errors.New("error consuming claim")
	}
	return nil
}
func (mcg *MockConsumerGroupClient) Errors() <-chan error { return nil }
func (mcg *MockConsumerGroupClient) Close() error {
	if mcg.closeWithError {
		return errors.New("close failed")
	}

	return nil
}
func (mcg *MockConsumerGroupClient) Pause(partitions map[string][]int32)  {}
func (mcg *MockConsumerGroupClient) Resume(partitions map[string][]int32) {}
func (mcg *MockConsumerGroupClient) PauseAll()                            { mcg.paused = true }
func (mcg *MockConsumerGroupClient) ResumeAll()                           { mcg.paused = false }

func NewMockConsumerGroup(addrs []string, groupID string, config *sarama.Config) (sarama.ConsumerGroup, error) {
	return &MockConsumerGroupClient{}, nil
}

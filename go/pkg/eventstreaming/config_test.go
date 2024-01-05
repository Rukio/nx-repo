package eventstreaming

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/Shopify/sarama"
)

func TestConfigValidate(t *testing.T) {
	tcs := []struct {
		Desc   string
		Config *ClientConfig

		WantErr error
	}{
		{
			Desc: "Minimum required producer values",
			Config: &ClientConfig{
				Brokers:  []string{"localhost:9095"},
				Producer: newTestProducerConfig(),
			},
		},
		{
			Desc: "Minimum required consumer values",
			Config: &ClientConfig{
				Brokers:  []string{"localhost:9095"},
				Consumer: newTestConsumerConfig(),
			},
		},
		{
			Desc: "missing both producer and consumer",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
			},

			WantErr: errors.New("missing at least one of consumer or producer config"),
		},
		{
			Desc: "invalid version",
			Config: &ClientConfig{
				Brokers:      []string{"localhost:9095"},
				KafkaVersion: "0.0.1",
			},

			WantErr: errors.New("invalid version specified"),
		},
		{
			Desc:   "no brokers",
			Config: &ClientConfig{},

			WantErr: errors.New("no Kafka bootstrap brokers are defined"),
		},
		{
			Desc: "Missing RootCA fails if others provided",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Certs: &ClientCerts{
					ClientKey:  []byte("KEY"),
					ClientCert: []byte("CERT"),
				},
			},

			WantErr: errors.New("missing root CA"),
		},
		{
			Desc: "Missing ClientCert fails if others provided",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Certs: &ClientCerts{
					RootCA:    []byte("ROOT"),
					ClientKey: []byte("KEY"),
				},
			},

			WantErr: errors.New("missing client certificate"),
		},
		{
			Desc: "Missing ClientKey fails if others provided",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Certs: &ClientCerts{
					RootCA:     []byte("ROOT"),
					ClientCert: []byte("CERT"),
				},
			},

			WantErr: errors.New("missing client key"),
		},
	}

	for _, tc := range tcs {
		result := tc.Config.Validate()
		testutils.MustMatch(t, tc.WantErr, result, fmt.Sprintf("%s: validation result is incorrect", tc.Desc))
	}
}

func TestProducerConfigValidate(t *testing.T) {
	tcs := []struct {
		Desc   string
		Config *ClientConfig

		WantErr error
	}{
		{
			Desc: "minimally viable producer config is valid",
			Config: &ClientConfig{
				Brokers:  []string{"localhost:9095"},
				Producer: &ProducerConfig{},
			},
		},
		{
			Desc: "valid sync prodcer",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Producer: &ProducerConfig{
					Async: false,
				},
			},
		},
		{
			Desc: "valid async producer",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Producer: &ProducerConfig{
					Async: true,
				},
			},
		},
	}

	for _, tc := range tcs {
		result := tc.Config.Validate()
		testutils.MustMatch(t, tc.WantErr, result, fmt.Sprintf("%s: validation result is incorrect", tc.Desc))
	}
}

func TestConsumerConfigValidate(t *testing.T) {
	testTopics := map[string]MessageProcessor{
		"test-topic-1": newTestMessageLogger(),
		"test-topic-2": newTestMessageLogger(),
		"test-topic-3": newTestMessageLogger(),
	}
	tcs := []struct {
		Desc   string
		Config *ClientConfig

		WantErr error
	}{
		{
			Desc: "minimally viable consumer",
			Config: &ClientConfig{
				Brokers:  []string{"localhost:9095"},
				Consumer: newTestConsumerConfig(),
			},
		},
		{
			Desc: "missing group",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Consumer: &ConsumerConfig{
					Topics:             testTopics,
					AssignmentStrategy: StickyAssignment,
				},
			},

			WantErr: errors.New("no Kafka consumer group defined"),
		},
		{
			Desc: "missing topics",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Consumer: &ConsumerConfig{
					GroupID:            "consumerGroupID",
					AssignmentStrategy: StickyAssignment,
				},
			},

			WantErr: errors.New("no topics given to be consumed"),
		},
		{
			Desc: "missing topics processor",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Consumer: &ConsumerConfig{
					GroupID: "consumerGroupID",
					Topics: map[string]MessageProcessor{
						"test-topic-1": newTestMessageLogger(),
						"test-topic-2": nil,
						"test-topic-3": newTestMessageLogger(),
					},
					AssignmentStrategy: StickyAssignment,
				},
			},

			WantErr: errors.New("no processor is configured for the test-topic-2 topic"),
		},
		{
			Desc: "invalid assignment strategy",
			Config: &ClientConfig{
				Brokers: []string{"localhost:9095"},
				Consumer: &ConsumerConfig{
					GroupID: "consumerGroupID",
					Topics: map[string]MessageProcessor{
						"test-topic-1": newTestMessageLogger(),
					},
					AssignmentStrategy: AssignmentStrategy("bad"),
				},
			},

			WantErr: errors.New("invalid consumer assignment strategy"),
		},
	}

	for _, tc := range tcs {
		result := tc.Config.Validate()
		testutils.MustMatch(t, tc.WantErr, result, fmt.Sprintf("%s: validation result is incorrect", tc.Desc))
	}
}

func TestToSaramaConfig(t *testing.T) {
	testBrokers := []string{"127.0.0.1:9095"}
	validSyncProducer := &ProducerConfig{
		Async: false,
	}

	tcs := []struct {
		Desc   string
		Config *ClientConfig

		ExpectErr bool
		// using a function as a param because of composite structs
		ExpectedSaramaConfig func(*sarama.Config)
	}{
		{
			Desc: "valid sync producer",
			Config: &ClientConfig{
				Brokers:  testBrokers,
				Producer: validSyncProducer,
			},

			ExpectedSaramaConfig: func(c *sarama.Config) {
				c.Version = sarama.MinVersion
				setDefaultSyncProducerSaramaConfig(c)
			},
		},
		{
			Desc: "valid async producer",
			Config: &ClientConfig{
				Brokers: testBrokers,
				Producer: &ProducerConfig{
					Async: true,
				},
			},

			ExpectedSaramaConfig: func(c *sarama.Config) {
				c.Version = sarama.MinVersion
				c.Producer.RequiredAcks = sarama.WaitForLocal
				c.Producer.Flush.Frequency = 500 * time.Millisecond
				c.Producer.Return.Errors = false
			},
		},
		{
			Desc: "DialTimeout is set",
			Config: &ClientConfig{
				Brokers:     testBrokers,
				DialTimeout: 100 * time.Millisecond,
				Producer:    validSyncProducer,
			},

			ExpectedSaramaConfig: func(c *sarama.Config) {
				c.Version = sarama.MinVersion
				setDefaultSyncProducerSaramaConfig(c)
				c.Net.DialTimeout = 100 * time.Millisecond
			},
		},
	}

	for _, tc := range tcs {
		expectedConfig := sarama.NewConfig()
		tc.ExpectedSaramaConfig(expectedConfig)
		c, err := toSaramaConfig(tc.Config)

		if (err != nil) != tc.ExpectErr {
			t.Fatalf("[%s] failed with unexpected error: %v", tc.Desc, err)
		}
		if err != nil {
			continue
		}

		// ignore coreFn and Partitioner as they are pointers to functions
		// so they cannot be consistently compared
		testutils.MustMatchFn(".coreFn", ".Partitioner")(t, expectedConfig, c, "sarama config does not match")
	}
}

func setDefaultSyncProducerSaramaConfig(c *sarama.Config) {
	c.Producer.Retry.Max = 10
	c.Producer.Return.Successes = true
}

// Generate the minimally viable producer config.
func newTestProducerConfig() *ProducerConfig {
	return &ProducerConfig{}
}

// Generate the minimally viable producer config.
func newTestConsumerConfig() *ConsumerConfig {
	return &ConsumerConfig{
		GroupID: "TestGroupID",
		Topics: map[string]MessageProcessor{
			"test-topic-1": newTestMessageLogger(),
			"test-topic-2": newTestMessageLogger(),
			"test-topic-3": newTestMessageLogger(),
		},
		AssignmentStrategy: StickyAssignment,
	}
}

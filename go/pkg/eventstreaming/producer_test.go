package eventstreaming

import (
	"errors"
	"io"
	"testing"
	"time"

	"github.com/Shopify/sarama"
	"github.com/Shopify/sarama/mocks"
)

func TestNewProducer(t *testing.T) {
	// setup the mock broker
	seedBroker := sarama.NewMockBrokerAddr(t, 1, "127.0.0.1:9095")
	defer seedBroker.Close()

	tcs := []struct {
		Desc   string
		Config *ClientConfig

		ExpectError bool
	}{
		{
			Desc: "valid sync producer",
			Config: &ClientConfig{
				Brokers: []string{seedBroker.Addr()},
				Producer: &ProducerConfig{
					Async: false,
				},
			},

			ExpectError: false,
		},
		{
			Desc: "valid async producer",
			Config: &ClientConfig{
				Brokers: []string{seedBroker.Addr()},
				Producer: &ProducerConfig{
					Async: false,
				},
			},

			ExpectError: false,
		},
		{
			Desc: "unreachable broker sync",
			Config: &ClientConfig{
				Brokers:     []string{"192.168.1.1:9095"},
				DialTimeout: time.Millisecond,
			},

			ExpectError: true,
		},
		{
			Desc: "unreachable broker async",
			Config: &ClientConfig{
				Brokers:     []string{"192.168.1.1:9095"},
				DialTimeout: time.Millisecond,
				Producer: &ProducerConfig{
					Async: false,
				},
			},

			ExpectError: true,
		},
		{
			Desc: "invalid missing producer configuration",
			Config: &ClientConfig{
				Brokers: []string{seedBroker.Addr()},
			},

			ExpectError: true,
		},
		{
			Desc: "invalid missing producer configuration with consumer config",
			Config: &ClientConfig{
				Brokers:  []string{seedBroker.Addr()},
				Consumer: &ConsumerConfig{},
			},

			ExpectError: true,
		},
		{
			Desc:   "Invalid Empty Configuration",
			Config: &ClientConfig{},

			ExpectError: true,
		},
	}

	for _, tc := range tcs {
		if !tc.ExpectError {
			metadataResponse := new(sarama.MetadataResponse)
			seedBroker.Returns(metadataResponse)
		}

		producer, err := NewMessageProducer(tc.Config)
		defer safeClose(t, producer)

		if err != nil && !tc.ExpectError {
			t.Fatalf("Expected no error but received error %v", err)
		}

		if producer != nil && tc.ExpectError {
			t.Fatalf("Expected a producer but received nil")
		}
	}
}

func TestSendMessageSync(t *testing.T) {
	tcs := []struct {
		Desc    string
		Message *ProducerMessage

		FailSend bool
	}{
		{
			Desc: "valid message",
			Message: &ProducerMessage{
				Topic: "my_topic",
				Value: []byte("test message"),
			},

			FailSend: false,
		},
		{
			Desc: "failed message should surface error",
			Message: &ProducerMessage{
				Topic: "my_topic",
				Value: []byte("test message"),
			},

			FailSend: true,
		},
	}

	for _, tc := range tcs {
		mockProducer := mocks.NewSyncProducer(t, sarama.NewConfig())
		if tc.FailSend {
			mockProducer.ExpectSendMessageAndFail(errors.New("Failed to send message"))
		} else {
			mockProducer.ExpectSendMessageAndSucceed()
		}
		producer := syncProducer{
			producer: mockProducer,
		}
		err := producer.SendMessage(tc.Message)

		if tc.FailSend && err == nil {
			t.Fatalf("Expected error when message fails to send")
		}

		if !tc.FailSend && err != nil {
			t.Fatalf("Unexpected error returned on message send success")
		}
	}
}

func TestSendMessageAsync(t *testing.T) {
	tcs := []struct {
		Desc     string
		Message  *ProducerMessage
		FailSend bool
	}{
		{
			Desc: "Valid message",
			Message: &ProducerMessage{
				Topic: "my_topic",
				Value: []byte("test message"),
			},

			FailSend: false,
		},
		{
			Desc: "Failed message should not surface error",
			Message: &ProducerMessage{
				Topic: "my_topic",
				Value: []byte("test message"),
			},

			FailSend: true,
		},
	}

	for _, tc := range tcs {
		mockProducer := mocks.NewAsyncProducer(t, sarama.NewConfig())
		if tc.FailSend {
			mockProducer.ExpectInputAndFail(errors.New("Failed to send message"))
		} else {
			mockProducer.ExpectInputAndSucceed()
		}
		producer := asyncProducer{
			producer: mockProducer,
		}
		err := producer.SendMessage(tc.Message)

		if tc.FailSend && err != nil {
			t.Fatalf("Expected error when message fails to send")
		}

		if !tc.FailSend && err != nil {
			t.Fatalf("Unexpected error returned on message send success")
		}
	}
}

func safeClose(t *testing.T, o io.Closer) {
	if o == nil {
		return
	}
	if err := o.Close(); err != nil {
		t.Error(err)
	}
}

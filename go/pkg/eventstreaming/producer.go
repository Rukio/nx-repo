package eventstreaming

import (
	"errors"
	"log"
	"os"

	"github.com/Shopify/sarama"
)

type ProducerMessage struct {
	Topic string
	Value []byte
}

type MessageProducer interface {
	// SendMessage produces a given message.
	// In sync mode it will return on success or failure with an error if it failed.
	// In async mode it will immediately return with an always nil error.
	SendMessage(message *ProducerMessage) error

	// Close shuts down the producer; you must call this function before a producer
	// object passes out of scope, as it may otherwise leak memory.
	Close() error
}

type syncProducer struct {
	producer sarama.SyncProducer
}

type asyncProducer struct {
	producer sarama.AsyncProducer
}

func (producer *syncProducer) SendMessage(message *ProducerMessage) error {
	_, _, err := producer.producer.SendMessage(&sarama.ProducerMessage{
		Topic: message.Topic,
		Value: sarama.ByteEncoder(message.Value),
	})
	return err
}

func (producer *syncProducer) Close() error {
	if producer.producer != nil {
		return producer.producer.Close()
	}
	return nil
}

func (producer *asyncProducer) SendMessage(message *ProducerMessage) error {
	producer.producer.Input() <- (&sarama.ProducerMessage{
		Topic: message.Topic,
		Value: sarama.ByteEncoder(message.Value),
	})
	return nil
}

func (producer *asyncProducer) Close() error {
	if producer.producer != nil {
		return producer.producer.Close()
	}
	return nil
}

func newSyncProducer(config *ClientConfig) (*syncProducer, error) {
	clientConfig, err := toSaramaConfig(config)
	if err != nil {
		return nil, err
	}

	if config.VerboseLogging {
		sarama.Logger = log.New(os.Stdout, "[eventstreaming] ", log.LstdFlags)
	}

	producer, err := sarama.NewSyncProducer(config.Brokers, clientConfig)
	if err != nil {
		return nil, err
	}

	return &syncProducer{
		producer: producer,
	}, nil
}

func newAsyncProducer(config *ClientConfig) (*asyncProducer, error) {
	clientConfig, err := toSaramaConfig(config)
	if err != nil {
		return nil, err
	}

	producer, err := sarama.NewAsyncProducer(config.Brokers, clientConfig)
	if err != nil {
		return nil, err
	}
	return &asyncProducer{
		producer: producer,
	}, nil
}

func NewMessageProducer(config *ClientConfig) (MessageProducer, error) {
	if err := config.Validate(); err != nil {
		return nil, err
	}

	if config.Producer == nil {
		return nil, errors.New("no producer config provided")
	}

	var err error
	var producer MessageProducer
	if config.Producer.Async {
		producer, err = newAsyncProducer(config)
	} else {
		producer, err = newSyncProducer(config)
	}
	if err != nil {
		return nil, err
	}

	return producer, nil
}

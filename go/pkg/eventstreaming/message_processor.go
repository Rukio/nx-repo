package eventstreaming

import (
	"time"

	"github.com/Shopify/sarama"
)

type ConsumerMessage interface {
	Topic() string
	Value() []byte
	Timestamp() time.Time
}

// ConsumerMessage is processed by MessageProcessor.ProcessMessage.
type consumerMessage struct {
	consumerMessage *sarama.ConsumerMessage
}

func (cm *consumerMessage) Topic() string {
	return cm.consumerMessage.Topic
}
func (cm *consumerMessage) Value() []byte {
	return cm.consumerMessage.Value
}
func (cm *consumerMessage) Timestamp() time.Time {
	return cm.consumerMessage.Timestamp
}

// MessageProcessor performs some useful work on a retrieved message via its ProcessMessage implementation.
type MessageProcessor interface {
	ProcessMessage(message ConsumerMessage) error
}

// topicsProcessor defines how a set of topics should be processed.
type topicsProcessor struct {
	processors map[string]MessageProcessor
}

// ProcessMessage processes the message if there is a processor for the message topic.
func (tp *topicsProcessor) ProcessMessage(message ConsumerMessage) error {
	processor := tp.processors[message.Topic()]
	return processor.ProcessMessage(message)
}

func (tp *topicsProcessor) Topics() []string {
	keys := make([]string, 0, len(tp.processors))
	for k := range tp.processors {
		keys = append(keys, k)
	}
	return keys
}

func newTopicsProcessor(processors map[string]MessageProcessor) *topicsProcessor {
	return &topicsProcessor{
		processors: processors,
	}
}

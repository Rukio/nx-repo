package eventstreaming

import (
	"errors"
	"fmt"
	"log"
	"sort"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type MockConsumerMessage struct {
	topic     string
	value     []byte
	timestamp time.Time
}

func (cm *MockConsumerMessage) Topic() string {
	return cm.topic
}
func (cm *MockConsumerMessage) Value() []byte {
	return cm.value
}
func (cm *MockConsumerMessage) Timestamp() time.Time {
	return cm.timestamp
}

type testMessageCounter struct {
	count int
	err   error
}

func (p *testMessageCounter) ProcessMessage(message ConsumerMessage) error {
	if p.err == nil {
		p.count++
	}
	return p.err
}

type testMessageLogger struct {
}

func (p *testMessageLogger) ProcessMessage(message ConsumerMessage) error {
	log.Printf("Message claimed: value = %s, timestamp = %v, topic = %s", string(message.Value()), message.Timestamp(), message.Topic())
	return nil
}

func newTestMessageLogger() *testMessageLogger {
	return &testMessageLogger{}
}

var messageProcessors = map[string]*testMessageCounter{
	"test-topic-1": {},
	"test-topic-2": {},
	"test-topic-3": {},
	"test-topic-4": {},
}

func TestTopicsProcessor_ProcessMessageError(t *testing.T) {
	exampleErr := errors.New("whee")
	topicsProcessor := newTopicsProcessor(map[string]MessageProcessor{
		"topic-with-err":    &testMessageCounter{err: exampleErr},
		"topic-without-err": &testMessageCounter{err: nil},
	})

	tcs := []struct {
		Desc    string
		Message ConsumerMessage
		WantErr error
	}{
		{
			Desc: "With Error",
			Message: &MockConsumerMessage{
				topic: "topic-with-err",
				value: []byte("Hi there!"),
			},
			WantErr: exampleErr,
		},
		{
			Desc: "Without Error",
			Message: &MockConsumerMessage{
				topic: "topic-without-err",
				value: []byte("Hi there!"),
			},
			WantErr: nil,
		},
	}

	for _, tc := range tcs {
		err := topicsProcessor.ProcessMessage(tc.Message)
		testutils.MustMatch(t, tc.WantErr, err)
	}
}

func TestTopicsProcessor_ProcessMessage(t *testing.T) {
	topicsProcessor := newTopicsProcessor(map[string]MessageProcessor{
		"test-topic-1": messageProcessors["test-topic-1"],
		"test-topic-2": messageProcessors["test-topic-2"],
		"test-topic-3": messageProcessors["test-topic-3"],
	})

	tcs := []struct {
		Desc    string
		Message ConsumerMessage
		Result  int
	}{
		{
			Desc: "Process test-topic-1",
			Message: &MockConsumerMessage{
				topic: "test-topic-1",
				value: []byte("Hi there!"),
			},
			Result: 1,
		},
		{
			Desc: "Process test-topic-2",
			Message: &MockConsumerMessage{
				topic: "test-topic-2",
				value: []byte("Hi there!"),
			},
			Result: 1,
		},
		{
			Desc: "Process test-topic-3",
			Message: &MockConsumerMessage{
				topic: "test-topic-3",
				value: []byte("Hi there!"),
			},
			Result: 1,
		},
	}

	for _, tc := range tcs {
		err := topicsProcessor.ProcessMessage(tc.Message)
		testutils.MustMatch(t, nil, err)
		testutils.MustMatch(t, messageProcessors[tc.Message.Topic()].count, tc.Result, fmt.Sprintf("The process message invocation count for %s does not match", tc.Message.Topic()))
	}
}

func TestTopicsProcessor_Topics(t *testing.T) {
	topicsProcessor := newTopicsProcessor(map[string]MessageProcessor{
		"test-topic-1": newTestMessageLogger(),
		"test-topic-2": newTestMessageLogger(),
		"test-topic-3": newTestMessageLogger(),
	})
	control := []string{"test-topic-1", "test-topic-2", "test-topic-3"}
	topics := topicsProcessor.Topics()
	sort.Strings(topics)

	testutils.MustMatch(t, control, topics, "received incorrect topics")
}

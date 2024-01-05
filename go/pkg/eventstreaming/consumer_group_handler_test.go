package eventstreaming

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/Shopify/sarama"
)

type MockConsumerGroupSession struct {
	context        context.Context
	cancel         context.CancelFunc
	markedMessages []*sarama.ConsumerMessage
}

func newMockConsumerGroupSession() *MockConsumerGroupSession {
	cgs := MockConsumerGroupSession{}
	cgs.context, cgs.cancel = context.WithCancel(context.Background())
	return &cgs
}

func (cgs *MockConsumerGroupSession) Claims() map[string][]int32 { return map[string][]int32{} }
func (cgs *MockConsumerGroupSession) MemberID() string           { return "memberID" }
func (cgs *MockConsumerGroupSession) GenerationID() int32        { return 1234 }
func (cgs *MockConsumerGroupSession) MarkOffset(topic string, partition int32, offset int64, metadata string) {
}
func (cgs *MockConsumerGroupSession) Commit() {}
func (cgs *MockConsumerGroupSession) ResetOffset(topic string, partition int32, offset int64, metadata string) {
}
func (cgs *MockConsumerGroupSession) MarkMessage(msg *sarama.ConsumerMessage, metadata string) {
	cgs.markedMessages = append(cgs.markedMessages, msg)
}
func (cgs *MockConsumerGroupSession) Context() context.Context { return cgs.context }

type MockConsumerGroupClaim struct {
	topic               string
	partition           int32
	initialOffset       int64
	highWaterMarkOffset int64
	messages            chan *sarama.ConsumerMessage
}

func (cgc *MockConsumerGroupClaim) Topic() string                            { return cgc.topic }
func (cgc *MockConsumerGroupClaim) Partition() int32                         { return cgc.partition }
func (cgc *MockConsumerGroupClaim) InitialOffset() int64                     { return cgc.initialOffset }
func (cgc *MockConsumerGroupClaim) HighWaterMarkOffset() int64               { return cgc.highWaterMarkOffset }
func (cgc *MockConsumerGroupClaim) Messages() <-chan *sarama.ConsumerMessage { return cgc.messages }

func TestConsumerGroupHandler_Ready(t *testing.T) {
	cgh := consumerGroupHandler{}
	cgh.resetReady()
	err := cgh.Setup(&MockConsumerGroupSession{})
	<-cgh.ready()
	testutils.MustMatch(t, nil, err)
}

func TestConsumerGroupHandler_Cleanup(t *testing.T) {
	cgh := consumerGroupHandler{}
	err := cgh.Cleanup(&MockConsumerGroupSession{})
	testutils.MustMatch(t, nil, err)
}

func TestConsumerGroupHandler_ConsumeClaim(t *testing.T) {
	testTopic1Processor := testMessageCounter{}
	testTopic2Processor := testMessageCounter{}
	testTopic4Processor := testMessageCounter{err: errors.New("ima error")}
	cgh := newConsumerGroupHandler(newTopicsProcessor(map[string]MessageProcessor{
		"test-topic-1": &testTopic1Processor,
		"test-topic-2": &testTopic2Processor,
		"test-topic-3": newTestMessageLogger(),
		"test-topic-4": &testTopic4Processor,
	}))
	session := newMockConsumerGroupSession()
	claim := MockConsumerGroupClaim{
		messages: make(chan *sarama.ConsumerMessage),
	}
	go func() {
		claim.messages <- &sarama.ConsumerMessage{Topic: "test-topic-1", Value: []byte("Hi There!")}
		claim.messages <- &sarama.ConsumerMessage{Topic: "test-topic-1", Value: []byte("Bye Bye!")}
		claim.messages <- &sarama.ConsumerMessage{Topic: "test-topic-2", Value: []byte("test message")}
		claim.messages <- &sarama.ConsumerMessage{Topic: "test-topic-3", Value: []byte("test message")}
		claim.messages <- &sarama.ConsumerMessage{Topic: "test-topic-4", Value: []byte("test message")}
		session.cancel()
	}()

	err := cgh.ConsumeClaim(session, &claim)
	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, 2, testTopic1Processor.count)
	testutils.MustMatch(t, 1, testTopic2Processor.count)
	testutils.MustMatch(t, 0, testTopic4Processor.count)
	// Test topic 4 should not increase len of markedMessages because ProcessMessage errors
	testutils.MustMatch(t, 4, len(session.markedMessages))
}

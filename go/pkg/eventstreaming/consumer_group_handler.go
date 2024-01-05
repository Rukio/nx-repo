package eventstreaming

import (
	"github.com/Shopify/sarama"
)

// consumerGroupHandler implements sarama.ConsumerGroupHandler.
// Instances of consumerGroupHandler are used to handle individual topic/partition claims.
// It also provides hooks for your consumer group session life-cycle and allow you to trigger logic before or after the consume loop(s).
// Handlers are likely be called from several goroutines concurrently.
// It must be ensured that all state is safely protected against race conditions.
type consumerGroupHandler struct {
	topicsProcessor *topicsProcessor
	readyChan       chan bool
}

// ready indicates whether the consumer client is in a ready state to begin consuming messages.
func (cgh *consumerGroupHandler) ready() <-chan bool {
	return cgh.readyChan
}

// resetReady recreates the channel used to indicate whether the consumer is in a ready state.
func (cgh *consumerGroupHandler) resetReady() {
	cgh.readyChan = make(chan bool)
}

// Setup is run at the beginning of a new session, before ConsumeClaim
// Before processing starts, the handler's Setup() hook is called to notify the user
// of the claims and allow any necessary preparation or alteration of state.
func (cgh *consumerGroupHandler) Setup(sarama.ConsumerGroupSession) error {
	// Mark the consumer as ready
	close(cgh.readyChan)
	return nil
}

// Cleanup is run at the end of a session, once all ConsumeClaim goroutines have exited
// Once all the ConsumeClaim() loops have exited, the handler's Cleanup() hook is called
// to allow the user to perform any final tasks before a rebalance.
func (cgh *consumerGroupHandler) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

// ConsumeClaim must start a consumer loop of ConsumerGroupClaim's Messages().
//   - The consumers join the group (as explained in https://kafka.apache.org/documentation/#intro_consumers)
//     and is assigned their "fair share" of partitions, aka 'claims'.
//   - For each of the assigned claims the handler's ConsumeClaim() function is then called
//     in a separate goroutine which requires it to be thread-safe. Any state must be carefully protected
//     from concurrent reads/writes.
//   - The session will persist until one of the ConsumeClaim() functions exits. This can be either when the
//     parent context is canceled or when a server-side rebalance cycle is initiated.
func (cgh *consumerGroupHandler) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for {
		select {
		case message := <-claim.Messages():
			err := cgh.topicsProcessor.ProcessMessage(&consumerMessage{message})
			if err == nil {
				session.MarkMessage(message, "")
			}

		// The `for` should return when `session.Context()` is done. Without monitoring for `session.Context.Done()
		// `ErrRebalanceInProgress` or `read tcp <ip>:<port>: i/o timeout` will be raised when kafka rebalances
		// https://github.com/Shopify/sarama/issues/1192
		case <-session.Context().Done():
			return nil
		}
	}
}

func newConsumerGroupHandler(processors *topicsProcessor) *consumerGroupHandler {
	return &consumerGroupHandler{
		readyChan:       make(chan bool),
		topicsProcessor: processors,
	}
}

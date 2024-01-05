package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
)

// MessageLogger implements MessageProcessor.ProcessMessage and prints message information.
type MessageLogger struct {
}

func (p *MessageLogger) ProcessMessage(message eventstreaming.ConsumerMessage) error {
	log.Printf("Message claimed: value = %s, timestamp = %v, topic = %s", string(message.Value()), message.Timestamp(), message.Topic())
	return nil
}

func main() {
	log.Println("Starting event streaming consumer example")

	consumerConfig := baseserv.DefaultEventStreamingConsumerConfig()
	consumerConfig.Consumer.Topics = map[string]eventstreaming.MessageProcessor{
		"test-topic-1": &MessageLogger{},
		"test-topic-2": &MessageLogger{},
		"test-topic-3": &MessageLogger{},
	}

	consumerGroup, err := eventstreaming.NewConsumerGroup(&consumerConfig)
	if err != nil {
		log.Panic(err)
	}

	ctx := context.Background()

	consumerGroup.Start(ctx)

	executionLoop(ctx, consumerGroup)

	if err := consumerGroup.Stop(); err != nil {
		log.Panicf("Error stopping consumer group: %v", err)
	}
}

func executionLoop(ctx context.Context, consumerGroup eventstreaming.ConsumerGroup) {
	sigusr1 := make(chan os.Signal, 1)
	signal.Notify(sigusr1, syscall.SIGUSR1)

	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)

	consumptionIsPaused := false
	for {
		select {
		case err := <-consumerGroup.Error():
			log.Printf("consumer error: %v", err)
			return
		case <-ctx.Done():
			log.Println("terminating: context cancelled")
			return
		case <-sigterm:
			log.Println("terminating: via signal")
			return
		case <-sigusr1:
			if consumptionIsPaused {
				consumerGroup.Resume()
			} else {
				consumerGroup.Pause()
			}
		}
	}
}

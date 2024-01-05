package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
)

func main() {
	log.Println("Starting event streaming producer example")

	producerConfig := baseserv.DefaultEventStreamingProducerConfig()

	ctx, cancel := context.WithCancel(context.Background())

	producersCount := 3
	producers := []eventstreaming.MessageProducer{}
	var wg sync.WaitGroup
	for i := 0; i < producersCount; i++ {
		topic := fmt.Sprintf("test-topic-%d", i+1)
		producer, err := eventstreaming.NewMessageProducer(&producerConfig)
		if err != nil {
			log.Panic(err)
		}
		producers = append(producers, producer)

		wg.Add(1)
		go func() {
			defer wg.Done()

			for {
				select {
				case <-ctx.Done():
					return
				default:
					produceTestRecords(producer, topic, 1000)
				}
			}
		}()
	}

	executionLoop(ctx)

	cancel()
	wg.Wait()

	for _, producer := range producers {
		producer.Close()
	}
}

func produceTestRecords(producer eventstreaming.MessageProducer, topic string, records int) {
	for i := 0; i < records; i++ {
		now := fmt.Sprint(time.Now())
		value := []byte(fmt.Sprintf("TEST MSG #%d - %s", i, now))
		err := producer.SendMessage(&eventstreaming.ProducerMessage{Topic: topic, Value: value})
		if err != nil {
			fmt.Printf("cannot send message: %v", err)
			return
		}
	}
}

func executionLoop(ctx context.Context) {
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ctx.Done():
			log.Println("terminating: context cancelled")
			return
		case <-sigterm:
			log.Println("terminating: via signal")
			return
		}
	}
}

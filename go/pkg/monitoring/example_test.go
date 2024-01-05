package monitoring_test

import (
	"context"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

const exampleServiceName = "ExampleService"

func ExampleInfluxEnv() {
	fmt.Println(monitoring.InfluxEnv{
		URL:             "localhost:8086",
		Username:        "admin",
		Password:        "adminpw",
		DatabaseName:    "testdb",
		RetentionPolicy: "autogen",
		MaxBatchSize:    100,
		MaxBatchWait:    time.Second,
	})
	// Output: {localhost:8086 admin adminpw testdb autogen 100 1s}
}

func ExampleNewInfluxRecorder() {
	e := monitoring.InfluxEnv{
		Username:        "admin",
		Password:        "admin",
		DatabaseName:    "test",
		RetentionPolicy: "autogen",
		MaxBatchSize:    100,
		MaxBatchWait:    30 * time.Second,
	}
	_, err := monitoring.NewInfluxRecorder(context.Background(), &e, exampleServiceName, zap.NewNop().Sugar())
	if err != nil {
		fmt.Println(err)
	}
}

func ExampleInfluxRecorder_GRPCUnaryInterceptor() {
	e := monitoring.InfluxEnv{
		DatabaseName: "test",
	}
	r, _ := monitoring.NewInfluxRecorder(context.Background(), &e, exampleServiceName, zap.NewNop().Sugar())
	option := r.GRPCUnaryInterceptor()
	grpc.NewServer(grpc.UnaryInterceptor(option))
}

func ExampleInfluxRecorder_GRPCStreamInterceptor() {
	e := monitoring.InfluxEnv{
		DatabaseName: "test",
	}
	r, _ := monitoring.NewInfluxRecorder(context.Background(), &e, exampleServiceName, zap.NewNop().Sugar())
	option := r.GRPCStreamInterceptor()
	grpc.NewServer(grpc.StreamInterceptor(option))
}

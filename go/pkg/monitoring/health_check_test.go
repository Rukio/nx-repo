package monitoring

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func mockCheck() (*healthpb.HealthCheckResponse, error) {
	return &healthpb.HealthCheckResponse{
		Status: healthpb.HealthCheckResponse_SERVING,
	}, nil
}

func TestStart(t *testing.T) {
	tests := []struct {
		name                string
		dataDogConfig       *DataDogConfig
		healthCheckInterval time.Duration
		sleepDuration       time.Duration

		check func(t *testing.T, serviceCheckCalls int)
	}{
		{
			name:                "zero interval return an error",
			dataDogConfig:       dataDogValidConfig,
			healthCheckInterval: 0,
			sleepDuration:       100 * time.Millisecond,

			check: func(t *testing.T, serviceCheckCallCount int) {
				testutils.MustMatch(t, 0, serviceCheckCallCount, "unexpected calls to service check")
			},
		},
		{
			name:                "non nil interval does trigger check",
			dataDogConfig:       dataDogValidConfig,
			healthCheckInterval: 10 * time.Millisecond,
			sleepDuration:       100 * time.Millisecond,

			check: func(t *testing.T, serviceCheckCallCount int) {
				if serviceCheckCallCount == 0 {
					t.Fatal("service check did not receive calls")
				}
			},
		},
		{
			name:                "nil datadog recorder does not trigger check",
			dataDogConfig:       dataDogInvalidConfig,
			healthCheckInterval: 10 * time.Millisecond,
			sleepDuration:       100 * time.Millisecond,

			check: func(t *testing.T, serviceCheckCallCount int) {
				testutils.MustMatch(t, 0, serviceCheckCallCount, "unexpected calls to service check")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			serviceCheckCalls := 0

			checkFunc := func(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
				serviceCheckCalls++
				return mockCheck()
			}

			var logger = baselogger.NewSugaredLogger(baselogger.LoggerOptions{
				ServiceName:  "test",
				UseDevConfig: false,
			})

			var dataDogRecorder, _ = NewDataDogRecorder(tt.dataDogConfig, logger)

			healthCheckPoller := &HealthCheckPoller{
				Interval:              tt.healthCheckInterval,
				Check:                 checkFunc,
				DataDogRecorder:       dataDogRecorder,
				DataDogLogServiceName: "test",
				Logger:                logger,
			}

			healthCheckPoller.Start()
			time.Sleep(tt.sleepDuration)
			tt.check(t, serviceCheckCalls)
		})
	}
}

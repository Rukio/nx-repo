package main

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func TestHealthCheck(t *testing.T) {
	tcs := []struct {
		Desc string

		Want    *healthpb.HealthCheckResponse
		WantErr bool
	}{
		{
			Desc: "success - service is up",
			Want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := &HealthCheckServer{
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}, context.Background()

			result, _ := s.Check(ctx, &healthpb.HealthCheckRequest{})
			testutils.MustMatchProto(t, result, tc.Want, "HealthCheck response mismatch")
		})
	}
}

package grpc

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type mockDBCheck struct {
	isHealthyResp bool
}

func (m *mockDBCheck) IsHealthy(ctx context.Context) bool {
	return m.isHealthyResp
}

type mockHealthCheckService struct {
	checkResp *healthpb.HealthCheckResponse
	checkErr  error
}

func (m *mockHealthCheckService) Check(ctx context.Context, in *healthpb.HealthCheckRequest, opts ...grpc.CallOption) (*healthpb.HealthCheckResponse, error) {
	return m.checkResp, m.checkErr
}

func (m *mockHealthCheckService) Watch(ctx context.Context, in *healthpb.HealthCheckRequest, opts ...grpc.CallOption) (healthpb.Health_WatchClient, error) {
	return nil, errors.New("not implemented")
}

func TestCheck(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	healthyCheckService := &mockHealthCheckService{
		checkResp: &healthpb.HealthCheckResponse{
			Status: healthpb.HealthCheckResponse_SERVING,
		},
	}
	unhealthyCheckService := &mockHealthCheckService{
		checkResp: &healthpb.HealthCheckResponse{
			Status: healthpb.HealthCheckResponse_NOT_SERVING,
		},
	}
	errorCheckService := &mockHealthCheckService{
		checkErr: errors.New("service is unhealthy"),
	}
	tests := []struct {
		name   string
		server *HealthCheckServer

		expectedResponse *healthpb.HealthCheckResponse
	}{
		{
			name: "returns serving if db is healthy and pophealth and insurance services are healthy",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{isHealthyResp: true},
				PopHealthCheckService:       healthyCheckService,
				InsuranceHealthCheckService: healthyCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
		},
		{
			name: "returns not serving if db is unhealthy",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{},
				PopHealthCheckService:       healthyCheckService,
				InsuranceHealthCheckService: healthyCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			name: "returns not serving if pophealth service is unhealthy",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{isHealthyResp: true},
				PopHealthCheckService:       unhealthyCheckService,
				InsuranceHealthCheckService: healthyCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			name: "returns not serving if insurance service is unhealthy",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{isHealthyResp: true},
				PopHealthCheckService:       healthyCheckService,
				InsuranceHealthCheckService: unhealthyCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			name: "returns not serving if pophealth service returns an error",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{isHealthyResp: true},
				PopHealthCheckService:       errorCheckService,
				InsuranceHealthCheckService: healthyCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			name: "returns not serving if insurance service returns an error",
			server: &HealthCheckServer{
				DBService:                   &mockDBCheck{isHealthyResp: true},
				PopHealthCheckService:       healthyCheckService,
				InsuranceHealthCheckService: errorCheckService,
				Logger:                      logger,
			},

			expectedResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, _ := test.server.Check(ctx, &healthpb.HealthCheckRequest{})

			testutils.MustMatch(t, test.expectedResponse, response)
		})
	}
}

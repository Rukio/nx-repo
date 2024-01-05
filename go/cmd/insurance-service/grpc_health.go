package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/cmd/insurance-service/insurancedb"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthGRPCService struct {
	healthpb.UnimplementedHealthServer

	Logger      *zap.SugaredLogger
	InsuranceDB *insurancedb.InsuranceDB
}

func (s *HealthGRPCService) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING
	isHealthy := s.InsuranceDB.IsHealthy(ctx)
	if !isHealthy {
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	err := healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		s.Logger.Errorw("Failed to set HTTP header metadata.", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

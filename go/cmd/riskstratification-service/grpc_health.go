package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"

	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthGRPCService struct {
	healthpb.UnimplementedHealthServer

	RiskStratificationDB *riskstratificationdb.RiskStratificationDB
	Logger               *zap.SugaredLogger
}

func (s *HealthGRPCService) Check(
	ctx context.Context,
	in *healthpb.HealthCheckRequest,
) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING

	if !s.RiskStratificationDB.IsHealthy(ctx) {
		status = healthpb.HealthCheckResponse_NOT_SERVING
		s.Logger.Error("Risk Stratification DB is unhealthy")
	}

	err := healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		s.Logger.Errorw("failed to set HTTP header metadata", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

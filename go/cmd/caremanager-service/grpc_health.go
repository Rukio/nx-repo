package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"go.uber.org/zap"

	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthGRPCService struct {
	healthpb.UnimplementedHealthServer

	CaremanagerDB *CaremanagerDB
	Logger        *zap.SugaredLogger
	StationClient *StationClient
}

func (s *HealthGRPCService) Check(
	ctx context.Context,
	in *healthpb.HealthCheckRequest,
) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING

	if !s.CaremanagerDB.IsHealthy(ctx) {
		status = healthpb.HealthCheckResponse_NOT_SERVING
		s.Logger.Error("CareManager DB is unhealthy")
	}

	stationErrs := []error{
		s.StationClient.GetHealthCheck(ctx, "default"),
		s.StationClient.GetHealthCheck(ctx, "database"),
	}

	for _, err := range stationErrs {
		if err != nil {
			status = healthpb.HealthCheckResponse_NOT_SERVING
			s.Logger.Error(err.Error())
		}
	}

	err := healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		s.Logger.Errorw("failed to set HTTP header metadata", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

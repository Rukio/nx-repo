package main

import (
	"context"
	"net/http"

	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/station"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer

	Logger                    *zap.SugaredLogger
	StationClient             *station.Client
	AthenaHealthServiceClient healthpb.HealthClient
}

func (s *HealthCheckServer) Check(
	ctx context.Context,
	_ *healthpb.HealthCheckRequest,
) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method: http.MethodGet,
		Path:   "/health-check/default.json",
	})
	if err != nil {
		s.Logger.Errorw("Station app is not healthy", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}
	err = s.StationClient.Request(ctx, &station.RequestConfig{
		Method: http.MethodGet,
		Path:   "/health-check/database.json",
	})
	if err != nil {
		s.Logger.Errorw("Station database is not healthy", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	resp, err := s.AthenaHealthServiceClient.Check(ctx, &healthpb.HealthCheckRequest{})
	if err != nil || resp.Status != healthpb.HealthCheckResponse_SERVING {
		s.Logger.Errorw("Athena service is not healthy", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	err = healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		s.Logger.Errorw("failed to set HTTP header metadata", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

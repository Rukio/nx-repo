package main

import (
	"context"

	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer

	Logger *zap.SugaredLogger
}

func (s *HealthCheckServer) Check(
	ctx context.Context,
	in *healthpb.HealthCheckRequest,
) (*healthpb.HealthCheckResponse, error) {
	return &healthpb.HealthCheckResponse{
		Status: healthpb.HealthCheckResponse_SERVING,
	}, nil
}

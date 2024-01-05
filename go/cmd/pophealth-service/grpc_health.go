package main

import (
	"context"

	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type DBCheck interface {
	IsHealthy(context.Context) bool
}

type AWSCheck interface {
	BucketExists(context.Context, string) bool
}

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer

	DBService      DBCheck
	AWSClient      AWSCheck
	BucketForCheck string
}

func (s *HealthCheckServer) Check(ctx context.Context, _ *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	checkerStatus := healthpb.HealthCheckResponse_SERVING
	isHealthy := s.DBService.IsHealthy(ctx)
	if !isHealthy {
		checkerStatus = healthpb.HealthCheckResponse_NOT_SERVING
	}

	if s.AWSClient == nil || !s.AWSClient.BucketExists(ctx, s.BucketForCheck) {
		checkerStatus = healthpb.HealthCheckResponse_NOT_SERVING
	}

	return &healthpb.HealthCheckResponse{
		Status: checkerStatus,
	}, nil
}

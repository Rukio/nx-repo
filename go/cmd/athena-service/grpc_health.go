package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer

	AthenaClient             *athena.Client
	AuditHealthServiceClient healthpb.HealthClient
	Logger                   *zap.SugaredLogger
}

func (h *HealthCheckServer) getStatus(ctx context.Context, _ *healthpb.HealthCheckRequest) healthpb.HealthCheckResponse_ServingStatus {
	healthCheckStatus := healthpb.HealthCheckResponse_SERVING

	if !h.AthenaClient.IsHealthy(ctx) {
		h.Logger.Error("Athena EHR is not healthy")
		healthCheckStatus = healthpb.HealthCheckResponse_NOT_SERVING
	}

	_, err := h.AuditHealthServiceClient.Check(ctx, &healthpb.HealthCheckRequest{})
	if err != nil {
		h.Logger.Errorw("Audit service is not healthy", zap.Error(err))
		healthCheckStatus = healthpb.HealthCheckResponse_NOT_SERVING
	}

	return healthCheckStatus
}

func (h *HealthCheckServer) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	healthCheckStatus := h.getStatus(ctx, req)

	if healthCheckStatus != healthpb.HealthCheckResponse_SERVING {
		err := grpc.SetHeader(ctx, metadata.Pairs("x-http-code", "503"))
		if err != nil {
			h.Logger.Errorw("Failed to set response HTTP header.", zap.Error(err))
		}
	}

	return &healthpb.HealthCheckResponse{
		Status: healthCheckStatus,
	}, nil
}

func (h *HealthCheckServer) Watch(req *healthpb.HealthCheckRequest, stream healthpb.Health_WatchServer) error {
	return status.Error(codes.Unimplemented, "unimplemented")
}

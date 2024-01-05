package main

import (
	"context"
	"net/http"
	"strconv"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
)

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer
	DBService *clinicalkpidb.ClinicalKPIDB
	Logger    *zap.SugaredLogger
}

func (h *HealthCheckServer) getStatus(ctx context.Context, _ *healthpb.HealthCheckRequest) healthpb.HealthCheckResponse_ServingStatus {
	status := healthpb.HealthCheckResponse_SERVING

	if !h.DBService.IsHealthy(ctx) {
		h.Logger.Error("Clinical KPI DB is not healthy")
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	return status
}

func (h *HealthCheckServer) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	status := h.getStatus(ctx, req)

	if status != healthpb.HealthCheckResponse_SERVING {
		err := grpc.SetHeader(ctx, metadata.Pairs("x-http-code", strconv.Itoa(http.StatusServiceUnavailable)))
		if err != nil {
			h.Logger.Errorw("Failed to set response HTTP header.", zap.Error(err))
		}
	}

	err := healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		h.Logger.Errorw("failed to set HTTP header metadata", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

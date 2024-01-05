package grpc

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type DBCheck interface {
	IsHealthy(context.Context) bool
}

type HealthCheckServer struct {
	healthpb.UnimplementedHealthServer

	DBService                   DBCheck
	PopHealthCheckService       healthpb.HealthClient
	InsuranceHealthCheckService healthpb.HealthClient
	Logger                      *zap.SugaredLogger
}

func (h *HealthCheckServer) Check(ctx context.Context, _ *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING
	isHealthy := h.DBService.IsHealthy(ctx)
	if !isHealthy {
		h.Logger.Error("partner database is not healthy")
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	popHealthCheckResponse, err := h.PopHealthCheckService.Check(ctx, &healthpb.HealthCheckRequest{})
	if err != nil || popHealthCheckResponse == nil || popHealthCheckResponse.Status != healthpb.HealthCheckResponse_SERVING {
		h.Logger.Errorw("error checking pophealth service", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	insuranceCheckResponse, err := h.InsuranceHealthCheckService.Check(ctx, &healthpb.HealthCheckRequest{})
	if err != nil || insuranceCheckResponse == nil || insuranceCheckResponse.Status != healthpb.HealthCheckResponse_SERVING {
		h.Logger.Errorw("error checking insurance service", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	err = healthcheck.SetHTTPHeaderMetadata(ctx, status)
	if err != nil {
		h.Logger.Errorw("Failed to set HTTP header metadata.", zap.Error(err))
	}

	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

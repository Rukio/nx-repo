package main

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	modalitypb "github.com/*company-data-covered*/services/go/pkg/generated/proto/modality"
)

type HealthGRPCService struct {
	modalitypb.UnimplementedHealthServiceServer

	ModalityDB ModalityDB
	Logger     *zap.SugaredLogger
}

func (s *HealthGRPCService) HealthCheck(
	ctx context.Context,
	in *modalitypb.HealthCheckRequest,
) (*modalitypb.HealthCheckResponse, error) {
	_, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	status := modalitypb.HealthCheckResponse{
		Version:       buildinfo.Version,
		DbStatus:      "OK",
		ServiceStatus: "OK",
	}

	if !s.ModalityDB.IsHealthy(ctx) {
		s.Logger.Error("Modality DB is unhealthy")
		return nil, fmt.Errorf("DB is unhealthy")
	}

	return &status, nil
}

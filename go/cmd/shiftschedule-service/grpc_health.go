package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
)

type HealthCheckServer struct {
	shiftschedulepb.UnimplementedShiftScheduleHealthServiceServer
}

func (h *HealthCheckServer) Check(_ context.Context, _ *shiftschedulepb.CheckRequest) (*shiftschedulepb.CheckResponse, error) {
	version := buildinfo.Version
	shiftScheduleHealth := shiftschedulepb.ServiceStatus{
		Service: serviceName,
		Status:  shiftschedulepb.ServingStatus_SERVING_STATUS_SERVING,
	}

	return &shiftschedulepb.CheckResponse{
		Status: []*shiftschedulepb.ServiceStatus{
			&shiftScheduleHealth,
		},
		Version: version,
	}, nil
}

package main

import (
	"context"

	"google.golang.org/grpc"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
)

type MockLogisticsServiceClient struct {
	GetServiceRegionScheduleResponse *logisticspb.GetServiceRegionScheduleResponse
	GetServiceRegionScheduleErr      error
	GetAssignableVisitsResponse      *logisticspb.GetAssignableVisitsResponse
	GetAssignableVisitsErr           error
}

func (c *MockLogisticsServiceClient) GetServiceRegionSchedule(ctx context.Context, in *logisticspb.GetServiceRegionScheduleRequest, opts ...grpc.CallOption) (*logisticspb.GetServiceRegionScheduleResponse, error) {
	return c.GetServiceRegionScheduleResponse, c.GetServiceRegionScheduleErr
}

func (c *MockLogisticsServiceClient) GetAssignableVisits(ctx context.Context, in *logisticspb.GetAssignableVisitsRequest, opts ...grpc.CallOption) (*logisticspb.GetAssignableVisitsResponse, error) {
	return c.GetAssignableVisitsResponse, c.GetAssignableVisitsErr
}

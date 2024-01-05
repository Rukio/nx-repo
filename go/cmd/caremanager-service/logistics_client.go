package main

import (
	"context"

	"google.golang.org/grpc"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
)

type LogisticsService interface {
	GetServiceRegionSchedule(
		ctx context.Context,
		in *logisticspb.GetServiceRegionScheduleRequest,
		opts ...grpc.CallOption,
	) (*logisticspb.GetServiceRegionScheduleResponse, error)
	GetAssignableVisits(
		ctx context.Context,
		in *logisticspb.GetAssignableVisitsRequest,
		opts ...grpc.CallOption,
	) (*logisticspb.GetAssignableVisitsResponse, error)
}

type CareRequestSchedule struct {
	Date                        *common.Date
	ShiftTeamID                 int64
	EstimatedTimeOfArrival      *int64
	EstimatedTimeOfCompletition *int64
	Status                      *logisticspb.ShiftTeamVisit_Status
	CareRequestID               int64
}

type LogisticsClient struct {
	LogisticsService
}

func NewLogisticsClient(service LogisticsService) *LogisticsClient {
	return &LogisticsClient{service}
}

// This function should only be human manual triggered,
// otherwise it can put a strain on the logistics service.
func (lc *LogisticsClient) GetFirstScheduledShiftTeamIDForCareRequest(
	ctx context.Context,
	careRequestID int64,
	marketID int64,
) (*int64, error) {
	marketSchedule, err := lc.GetServiceRegionSchedule(
		ctx,
		&logisticspb.GetServiceRegionScheduleRequest{
			MarketId: &marketID,
		},
	)
	if err != nil {
		return nil, err
	}

	if len(marketSchedule.DateSchedules) > 0 {
		for _, schedule := range marketSchedule.DateSchedules[0].Schedules {
			stops := schedule.Route.Stops
			for _, stop := range stops {
				visit := stop.GetVisit()
				if visit != nil && *visit.CareRequestId == careRequestID {
					return &schedule.ShiftTeamId, nil
				}
			}
		}
	}

	return nil, nil
}

// GetSchedulesForCareRequests returns a map between CareRequestID and its CareRequestSchedule, if the CareRequest has a defined schedule.
// This call uses Logistic's GetSchedulesForCareRequests and will only be called when a user renders the Episode View in CareManager,
// no polling is involved to refresh the data in the UI and the same data is shown in the UI until it gets refreshed.
func (lc *LogisticsClient) GetSchedulesForCareRequests(ctx context.Context, careRequestIDs []int64, marketID int64) (map[int64]*CareRequestSchedule, error) {
	marketSchedule, err := lc.GetServiceRegionSchedule(
		ctx,
		&logisticspb.GetServiceRegionScheduleRequest{
			MarketId: &marketID,
		},
	)
	if err != nil {
		return nil, err
	}

	careRequestIDsSet := collections.NewLinkedInt64Set(len(careRequestIDs))
	careRequestIDsSet.Add(careRequestIDs...)

	careRequestSchedulesMap := map[int64]*CareRequestSchedule{}

	for _, date := range marketSchedule.DateSchedules {
		for _, schedule := range date.Schedules {
			for _, stop := range schedule.Route.Stops {
				visit := stop.GetVisit()

				if visit != nil && careRequestIDsSet.Has(*visit.CareRequestId) {
					careRequestSchedulesMap[*visit.CareRequestId] = &CareRequestSchedule{
						Date:                        date.ServiceDate,
						ShiftTeamID:                 schedule.ShiftTeamId,
						EstimatedTimeOfArrival:      visit.ArrivalTimestampSec,
						EstimatedTimeOfCompletition: visit.CompleteTimestampSec,
						CareRequestID:               *visit.CareRequestId,
						Status:                      visit.Status,
					}
				}
			}
		}
	}

	return careRequestSchedulesMap, nil
}

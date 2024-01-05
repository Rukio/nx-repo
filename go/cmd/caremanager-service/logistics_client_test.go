package main

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestLogisticsClientGetFirstScheduledShiftTeamIDForCareRequest(t *testing.T) {
	ctx := context.Background()
	id := time.Now().UnixNano()
	careRequestID := id
	shiftTeamID := id + 1
	logistisServiceError := errors.New("logistics client error")

	matchedStop := logisticspb.ShiftTeamRouteStop_Visit{
		Visit: &logisticspb.ShiftTeamVisit{CareRequestId: &careRequestID},
	}

	otherCareRequestID := id + 2
	otherStop := logisticspb.ShiftTeamRouteStop_Visit{
		Visit: &logisticspb.ShiftTeamVisit{CareRequestId: &otherCareRequestID},
	}

	matchedDateSchedule := logisticspb.ServiceRegionDateSchedule{
		Schedules: []*logisticspb.ShiftTeamSchedule{
			{
				ShiftTeamId: shiftTeamID,
				Route: &logisticspb.ShiftTeamRoute{
					Stops: []*logisticspb.ShiftTeamRouteStop{
						{
							Stop: &otherStop,
						},
						{
							Stop: &matchedStop,
						},
					},
				},
			},
		},
	}
	otherDateSchedule := logisticspb.ServiceRegionDateSchedule{}

	type Args struct {
		careRequestID int64
		marketID      int64
	}

	tests := []struct {
		name                string
		args                Args
		clientResponse      *logisticspb.GetServiceRegionScheduleResponse
		clientResponseError error

		want    *int64
		wantErr error
	}{
		{
			name: "should return the first shift team id that matches a care request id",
			args: Args{
				careRequestID: careRequestID,
				marketID:      1,
			},
			clientResponse: &logisticspb.GetServiceRegionScheduleResponse{
				DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
					&matchedDateSchedule,
				},
			},

			want: &shiftTeamID,
		},
		{
			name: "should return nil when no shift team was found",
			args: Args{
				careRequestID: careRequestID,
				marketID:      1,
			},
			clientResponse: &logisticspb.GetServiceRegionScheduleResponse{
				DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
					&otherDateSchedule,
				},
			},
		},
		{
			name: "should only look into the current day for retrieving a matching shift team",
			args: Args{
				careRequestID: careRequestID,
				marketID:      1,
			},
			clientResponse: &logisticspb.GetServiceRegionScheduleResponse{
				DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
					&otherDateSchedule,
					&matchedDateSchedule,
				},
			},
		},
		{
			name: "should forward errors returned from logistics service",
			args: Args{
				careRequestID: careRequestID,
				marketID:      1,
			},
			clientResponseError: logistisServiceError,

			wantErr: logistisServiceError,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			logisticsClient := NewLogisticsClient(&MockLogisticsServiceClient{
				GetServiceRegionScheduleResponse: test.clientResponse,
				GetServiceRegionScheduleErr:      test.clientResponseError,
			})

			result, err := logisticsClient.GetFirstScheduledShiftTeamIDForCareRequest(ctx, careRequestID, shiftTeamID)
			if err != nil {
				testutils.MustMatch(t, test.wantErr, err)
			}
			testutils.MustMatch(t, test.want, result)
		})
	}
}

func TestGetSchedulesForCareRequests(t *testing.T) {
	ctx := context.Background()

	now := time.Now().Unix()
	careRequestIDs := []int64{now + 1, now + 100, now + 1000}
	etas := []int64{now + 1000, now + 2000, now + 3000}
	completeTimes := []int64{now + 5000, now + 6000, now + 7000}

	tests := []struct {
		name           string
		careRequestIDs []int64
		marketID       int64

		clientResponse      *logisticspb.GetServiceRegionScheduleResponse
		clientResponseError error

		want    map[int64]*CareRequestSchedule
		wantErr error
	}{
		{
			name:           "returns schedules for all the requested care request IDs, when logistics has them",
			careRequestIDs: careRequestIDs,
			marketID:       6,

			clientResponse: &logisticspb.GetServiceRegionScheduleResponse{
				DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
					{
						ServiceDate: &common.Date{
							Day:   10,
							Month: 1,
							Year:  1938,
						},
						Schedules: []*logisticspb.ShiftTeamSchedule{
							{
								ShiftTeamId: 1,
								Route: &logisticspb.ShiftTeamRoute{
									Stops: []*logisticspb.ShiftTeamRouteStop{
										{
											Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId:        &careRequestIDs[0],
													ArrivalTimestampSec:  &etas[0],
													CompleteTimestampSec: &completeTimes[0],
													Status:               logisticspb.ShiftTeamVisit_STATUS_COMMITTED.Enum(),
												},
											},
										},
									},
								},
							},
							{
								ShiftTeamId: 2,
								Route: &logisticspb.ShiftTeamRoute{
									Stops: []*logisticspb.ShiftTeamRouteStop{
										{
											Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId:        &careRequestIDs[1],
													ArrivalTimestampSec:  &etas[1],
													CompleteTimestampSec: &completeTimes[1],
													Status:               logisticspb.ShiftTeamVisit_STATUS_EN_ROUTE.Enum(),
												},
											},
										},
									},
								}},
						},
					},
					{
						ServiceDate: &common.Date{
							Year:  1906,
							Month: 4,
							Day:   28,
						},
						Schedules: []*logisticspb.ShiftTeamSchedule{
							{
								ShiftTeamId: 3,
								Route: &logisticspb.ShiftTeamRoute{
									Stops: []*logisticspb.ShiftTeamRouteStop{
										{
											Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId:        &careRequestIDs[2],
													ArrivalTimestampSec:  &etas[2],
													CompleteTimestampSec: &completeTimes[2],
													Status:               logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
												},
											},
										},
									},
								}},
						},
					},
				},
			},

			want: map[int64]*CareRequestSchedule{
				careRequestIDs[0]: {
					Date: &common.Date{
						Day:   10,
						Month: 1,
						Year:  1938,
					},
					ShiftTeamID:                 1,
					EstimatedTimeOfArrival:      &etas[0],
					EstimatedTimeOfCompletition: &completeTimes[0],
					Status:                      logisticspb.ShiftTeamVisit_STATUS_COMMITTED.Enum(),
					CareRequestID:               careRequestIDs[0],
				},
				careRequestIDs[1]: {
					Date: &common.Date{
						Day:   10,
						Month: 1,
						Year:  1938,
					},
					ShiftTeamID:                 2,
					EstimatedTimeOfArrival:      &etas[1],
					EstimatedTimeOfCompletition: &completeTimes[1],
					Status:                      logisticspb.ShiftTeamVisit_STATUS_EN_ROUTE.Enum(),
					CareRequestID:               careRequestIDs[1],
				},
				careRequestIDs[2]: {
					Date: &common.Date{
						Year:  1906,
						Month: 4,
						Day:   28,
					},
					ShiftTeamID:                 3,
					EstimatedTimeOfArrival:      &etas[2],
					EstimatedTimeOfCompletition: &completeTimes[2],
					Status:                      logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
					CareRequestID:               careRequestIDs[2],
				},
			},
		},
		{
			name:           "returns empty map, when there is not schedules for the care requests ids sent",
			careRequestIDs: careRequestIDs,
			marketID:       9,

			clientResponse: &logisticspb.GetServiceRegionScheduleResponse{
				DateSchedules: []*logisticspb.ServiceRegionDateSchedule{},
			},

			want: map[int64]*CareRequestSchedule{},
		},
		{
			name:           "returns error, when there is an error from calling GetServiceRegionSchedule",
			careRequestIDs: careRequestIDs,
			marketID:       9,

			clientResponseError: errors.New("an error occurred while calling this endpoint"),

			wantErr: errors.New("an error occurred while calling this endpoint"),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			logisticsClient := NewLogisticsClient(&MockLogisticsServiceClient{
				GetServiceRegionScheduleResponse: test.clientResponse,
				GetServiceRegionScheduleErr:      test.clientResponseError,
			})

			result, err := logisticsClient.GetSchedulesForCareRequests(ctx, test.careRequestIDs, test.marketID)

			testutils.MustMatch(t, test.wantErr, err)
			testutils.MustMatch(t, test.want, result)
		})
	}
}

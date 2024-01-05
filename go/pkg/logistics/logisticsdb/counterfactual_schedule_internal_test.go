package logisticsdb

import (
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/testutils"

	"google.golang.org/protobuf/proto"
)

func TestScheduleFromVRPSolution_Schedule(t *testing.T) {
	visitID := int64(10)
	careRequestID := int64(11)

	shiftTeamSnapshotID := int64(100)
	shiftTeamID := int64(111)

	careRequestsMappings := make(map[VisitSnapshotID]CareRequestID)
	careRequestsMappings[VisitSnapshotID(visitID)] = CareRequestID(careRequestID)
	shiftTeamsMappings := make(map[ShiftTeamSnapshotID]ShiftTeamID)
	shiftTeamsMappings[ShiftTeamSnapshotID(shiftTeamSnapshotID)] = ShiftTeamID(shiftTeamID)
	entityMappings := EntityMappings{
		CareRequests: careRequestsMappings,
		ShiftTeams:   shiftTeamsMappings,
	}

	locationID := int64(20)
	location := &common.Location{
		LatitudeE6:  int32(222),
		LongitudeE6: int32(333),
	}

	solution := &optimizerpb.VRPSolution{
		Description: &optimizerpb.VRPDescription{
			ShiftTeams: []*optimizerpb.VRPShiftTeam{
				{
					Id:              proto.Int64(shiftTeamSnapshotID),
					DepotLocationId: proto.Int64(locationID),
					Route: &optimizerpb.VRPShiftTeamRoute{
						Stops: []*optimizerpb.VRPShiftTeamRouteStop{
							{
								Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
									Visit: &optimizerpb.VRPShiftTeamVisit{
										VisitId:             proto.Int64(visitID),
										ArrivalTimestampSec: proto.Int64(1),
									},
								},
							},
							{
								Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
									RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
										RestBreakId:       proto.Int64(3131),
										StartTimestampSec: proto.Int64(300),
									},
								},
							},
						},
					},
				},
			},
			Visits: []*optimizerpb.VRPVisit{
				{
					Id:         proto.Int64(visitID),
					LocationId: proto.Int64(locationID),
					ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
						StartTimestampSec: proto.Int64(1),
						EndTimestampSec:   proto.Int64(300),
					},
					ServiceDurationSec: proto.Int64(5),
				},
			},
			Locations: []*optimizerpb.VRPLocation{{
				Id:          proto.Int64(locationID),
				LatitudeE6:  proto.Int32(location.LatitudeE6),
				LongitudeE6: proto.Int32(location.LongitudeE6),
			},
			},
			RestBreaks: []*optimizerpb.VRPRestBreak{
				{
					Id:                proto.Int64(3131),
					ShiftTeamId:       proto.Int64(shiftTeamSnapshotID),
					DurationSec:       proto.Int64(100),
					LocationId:        proto.Int64(locationID),
					StartTimestampSec: proto.Int64(300),
				},
			},
		},
	}

	date := time.Date(2022, 10, 31, 0, 0, 0, 0, time.UTC)
	serviceDate := protoconv.TimeToProtoDate(&date)
	expectedSchedule := &logisticspb.ServiceRegionDateSchedule{
		Meta: &logisticspb.ScheduleMetadata{
			ServiceDate: serviceDate,
		},
		Schedules: []*logisticspb.ShiftTeamSchedule{
			{
				ShiftTeamId: shiftTeamID,
				Route: &logisticspb.ShiftTeamRoute{
					BaseLocation: location,
					Stops: []*logisticspb.ShiftTeamRouteStop{
						{
							Stop: &logisticspb.ShiftTeamRouteStop_Visit{
								Visit: &logisticspb.ShiftTeamVisit{
									CareRequestId:       proto.Int64(careRequestID),
									ArrivalTimestampSec: proto.Int64(1),
									Location:            location,
								},
							},
						},
						{
							Stop: &logisticspb.ShiftTeamRouteStop_RestBreak{
								RestBreak: &logisticspb.ShiftTeamRestBreak{
									RestBreakId:       3131,
									StartTimestampSec: proto.Int64(300),
									DurationSec:       proto.Int64(100),
									Location:          location,
								},
							},
						},
					},
				},
			},
		},
	}

	solver := CounterfactualSchedule{
		CounterfactualSolution: solution,
		ServiceDate:            serviceDate,
		EntityMappings:         entityMappings,
	}
	schedule, err := solver.Schedule()
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchProto(t, expectedSchedule, schedule.Schedule, "not matching schedules")

	solver = CounterfactualSchedule{}
	_, err = solver.Schedule()
	if err == nil {
		t.Fatal("expected error")
	}
}

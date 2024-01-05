package timewindowavailability

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/logistics/checkfeasibility"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

type MockVRPSolver struct {
	responsesBySeed map[*int64]*optimizerpb.SolveVRPResponse
}

func (m *MockVRPSolver) SolveVRP(ctx context.Context, solveVRPParams *optimizer.SolveVRPParams) (<-chan *optimizer.WrappedSolveVRPResp, error) {
	solveVRPResps := make(chan *optimizer.WrappedSolveVRPResp, 1)
	defer close(solveVRPResps)

	solveVRPResps <- &optimizer.WrappedSolveVRPResp{
		Response: m.responsesBySeed[solveVRPParams.SolveVRPRequest.Config.RandomSeed],
	}

	return solveVRPResps, nil
}

func TestTimeWindowAvailability_TimeWindowAvailabilities(t *testing.T) {
	now := time.Now()
	startServiceDate := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		t.Fatal(err)
	}

	locationID := int64(3)
	locIDs := []int64{
		locationID,
	}

	serviceRegionID := time.Now().UnixNano()
	twDuration := 4 * time.Hour
	firstDayStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(startServiceDate, startDayTime, time.UTC)
	serviceDates := make([]*common.Date, 3)
	vrpDataByDate := make(map[*common.Date]*logisticsdb.ServiceRegionVRPData)
	vrpInputByDate := make(map[*common.Date]*checkfeasibility.SolveVRPInput)
	expectedTimeWindowsByDate := make(map[*common.Date][]*logisticspb.TimeWindowAvailability)
	responsesBySeed := make(map[*int64]*optimizerpb.SolveVRPResponse)
	for i := 0; i < 3; i++ {
		serviceDate := startServiceDate.AddDate(0, 0, i)
		startTimestamp := firstDayStartTimestamp.AddDate(0, 0, i)
		endTimestamp := startTimestamp.Add(8 * time.Hour)

		baseVisit := &logisticspb.CheckFeasibilityVisit{
			MarketId: proto.Int64(1),
			ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalDate{
				ArrivalDate: logisticsdb.TimeToProtoDate(&serviceDate),
			},
		}
		visits := []*logisticspb.CheckFeasibilityVisit{
			baseVisit,
		}

		date := logisticsdb.TimeToProtoDate(&serviceDate)
		serviceDates[i] = date
		vrpDataByDate[date] = &logisticsdb.ServiceRegionVRPData{
			ServiceRegionID: serviceRegionID,
			ServiceDate:     serviceDate,
			OpenHoursTW: &logisticsdb.TimeWindow{
				Start: startTimestamp,
				End:   endTimestamp,
			},
			CheckFeasibilityData: &logisticsdb.CheckFeasibilityVRPDataResult{
				Visits: visits,
				LocIDs: locIDs,
			},
		}

		seed := proto.Int64(int64(i))
		vrpInputByDate[date] = &checkfeasibility.SolveVRPInput{
			VRPProblemData: &logisticsdb.VRPProblemData{},
			VRPRequest: &optimizerpb.SolveVRPRequest{
				Problem: &optimizerpb.VRPProblem{
					Description: &optimizerpb.VRPDescription{},
				},
				Config: &optimizerpb.VRPConfig{
					RandomSeed: seed,
				},
			},
		}

		var expectedTimeWindows []*logisticspb.TimeWindowAvailability
		var expectedRouteStops []*optimizerpb.VRPShiftTeamRouteStop
		for i := 0; i < 6; i++ {
			start := startTimestamp.Add(time.Duration(i) * time.Hour)
			visitID := int64(-1 * (i + 1))
			arrivalTimestampSec := start.Add(twDuration / 2).Unix()
			expectedRouteStops = append(expectedRouteStops, &optimizerpb.VRPShiftTeamRouteStop{
				Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
					Visit: &optimizerpb.VRPShiftTeamVisit{
						VisitId:             proto.Int64(visitID),
						ArrivalTimestampSec: &arrivalTimestampSec,
					},
				},
			})

			twStatus := logisticspb.TimeWindowAvailability_STATUS_AVAILABLE
			if visitID == recommendedTWVisitID {
				twStatus = logisticspb.TimeWindowAvailability_STATUS_RECOMMENDED
			}

			end := start.Add(twDuration)
			if end.After(endTimestamp) {
				break
			}

			expectedTimeWindows = append(expectedTimeWindows, &logisticspb.TimeWindowAvailability{
				TimeWindow: &common.TimeWindow{
					StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
					EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
				},
				Status: twStatus,
			})
		}
		expectedTimeWindowsByDate[date] = expectedTimeWindows
		responsesBySeed[seed] = &optimizerpb.SolveVRPResponse{
			Solution: &optimizerpb.VRPSolution{
				Score: &optimizerpb.VRPScore{
					IsValid:   proto.Bool(true),
					HardScore: proto.Int64(0),
				},
				Description: &optimizerpb.VRPDescription{
					ShiftTeams: []*optimizerpb.VRPShiftTeam{
						{
							Route: &optimizerpb.VRPShiftTeamRoute{
								Stops: expectedRouteStops,
							},
						},
					},
				},
			},
		}
	}

	availabilities, err := TimeWindowAvailabilities(context.Background(), &AvailabilitiesParams{
		ServiceDates:   serviceDates,
		VRPDataByDate:  vrpDataByDate,
		VRPInputByDate: vrpInputByDate,

		Duration:       twDuration,
		StartTimestamp: firstDayStartTimestamp,

		VRPSolver: &MockVRPSolver{
			responsesBySeed: responsesBySeed,
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, availability := range availabilities {
		testutils.MustMatch(t, expectedTimeWindowsByDate[availability.ServiceDate], availability.TimeWindows)
	}
}

func TestTimeWindowAvailability_isFeasibleSolution(t *testing.T) {
	baseVRPSolution := &optimizerpb.VRPSolution{
		Score: &optimizerpb.VRPScore{
			IsValid:   proto.Bool(true),
			HardScore: proto.Int64(0),
		},
	}
	tcs := []struct {
		Desc string

		vrpSolution          *optimizerpb.VRPSolution
		ExpectedResponse     bool
		availabilityVisitIDs []int64
	}{
		{
			Desc:             "base case",
			vrpSolution:      baseVRPSolution,
			ExpectedResponse: true,
		},
		{
			Desc: "invalid score",
			vrpSolution: &optimizerpb.VRPSolution{
				Score: &optimizerpb.VRPScore{
					IsValid: proto.Bool(false),
				},
			},
			ExpectedResponse: false,
		},
		{
			Desc: "non-zero score",
			vrpSolution: &optimizerpb.VRPSolution{
				Score: &optimizerpb.VRPScore{
					IsValid:   proto.Bool(true),
					HardScore: proto.Int64(123),
				},
			},
			ExpectedResponse: false,
		},
		{
			Desc: "newly unassigned visits",
			vrpSolution: &optimizerpb.VRPSolution{
				Score: baseVRPSolution.Score,
				Description: &optimizerpb.VRPDescription{
					UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{
						{
							VisitId: proto.Int64(5),
						},
					},
				},
			},
			ExpectedResponse: false,
		},
		{
			Desc: "existing unassigned visits",
			vrpSolution: &optimizerpb.VRPSolution{
				Score: baseVRPSolution.Score,
				Description: &optimizerpb.VRPDescription{
					UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{
						{
							VisitId: proto.Int64(5),
							Pinned:  proto.Bool(true),
						},
					},
				},
			},
			ExpectedResponse: true,
		},
		{
			Desc: "unassigned availability visits",
			vrpSolution: &optimizerpb.VRPSolution{
				Score: baseVRPSolution.Score,
				Description: &optimizerpb.VRPDescription{
					UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{
						{
							VisitId: proto.Int64(-34),
						},
						{
							VisitId: proto.Int64(-123),
						},
					},
				},
			},
			availabilityVisitIDs: []int64{-34, -123},
			ExpectedResponse:     true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			response := isFeasibleSolution(tc.vrpSolution, tc.availabilityVisitIDs)

			testutils.MustMatch(t, tc.ExpectedResponse, response)
		})
	}
}

func Test_possibleTimeWindows(t *testing.T) {
	baseStartTime := time.Date(2022, time.January, 1, 7, 0, 0, 0, time.UTC)
	baseEndTime := baseStartTime.Add(8 * time.Hour)
	baseCaseTWs := []*common.TimeWindow{
		{
			StartDatetime: logisticsdb.TimeToProtoDateTime(&baseStartTime),
			EndDatetime:   logisticsdb.TimeToProtoDateTime(&baseEndTime),
		},
	}
	baseDuration := 4 * time.Hour
	for start := baseStartTime; start.Before(baseEndTime); start = start.Add(time.Hour) {
		end := start.Add(baseDuration)
		if end.After(baseEndTime) {
			break
		}

		baseCaseTWs = append(baseCaseTWs, &common.TimeWindow{
			StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
			EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
		})
	}

	tcs := []struct {
		desc          string
		startTime     time.Time
		endTime       time.Time
		offsetMinutes int
		twDuration    time.Duration

		want []*common.TimeWindow
	}{
		{
			desc:       "base case",
			startTime:  baseStartTime,
			endTime:    baseEndTime,
			twDuration: baseDuration,

			want: baseCaseTWs,
		},
		{
			desc:          "base case plus 15 minutes, rounds down",
			startTime:     baseStartTime,
			offsetMinutes: 15,
			endTime:       baseStartTime.Add(8 * time.Hour),
			twDuration:    baseDuration,

			want: baseCaseTWs,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := possibleTimeWindows(
				tc.startTime.Add(time.Duration(tc.offsetMinutes)*time.Minute),
				tc.endTime,
				tc.twDuration)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

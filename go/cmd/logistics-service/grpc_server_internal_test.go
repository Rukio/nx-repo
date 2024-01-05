package main

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/logistics/checkfeasibility"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
)

type MockVRPSolver struct {
	mx             sync.Mutex
	hardScores     []int64
	isValidScore   bool
	nextScoreIndex int
	solution       *optimizerpb.VRPSolution
	err            error
}

func (m *MockVRPSolver) SolveVRP(ctx context.Context, solveVRPParams *optimizer.SolveVRPParams) (<-chan *optimizer.WrappedSolveVRPResp, error) {
	if m.err != nil {
		return nil, m.err
	}

	m.mx.Lock()
	i := m.nextScoreIndex
	m.nextScoreIndex++
	m.mx.Unlock()

	solveVRPResps := make(chan *optimizer.WrappedSolveVRPResp, 1)
	defer close(solveVRPResps)

	solution := m.solution
	if solution == nil {
		solution = &optimizerpb.VRPSolution{
			Description: &optimizerpb.VRPDescription{
				ShiftTeams:       []*optimizerpb.VRPShiftTeam{},
				UnassignedVisits: []*optimizerpb.VRPUnassignedVisit{},
				RestBreaks:       []*optimizerpb.VRPRestBreak{},
				Visits:           []*optimizerpb.VRPVisit{},
				Locations:        []*optimizerpb.VRPLocation{},
			},
			Score: &optimizerpb.VRPScore{
				HardScore: &m.hardScores[i],
				IsValid:   &m.isValidScore,
			},
		}
	}
	solveVRPResps <- &optimizer.WrappedSolveVRPResp{
		Response: &optimizerpb.SolveVRPResponse{
			Solution: solution,
		},
	}
	return solveVRPResps, nil
}

type MockOptimizerService struct {
	grpc.ClientStream

	mx                              sync.Mutex
	hardScores                      []int64
	isValidScore                    bool
	nextScoreIndex                  int
	mockRecvError                   error
	mockSolveVRPError               error
	mockGetAssignableShiftTeamsResp *optimizerpb.GetAssignableShiftTeamsResponse
	mockGetAssignableShiftTeamsErr  error
	mockGetAssignableVisitsResp     *optimizerpb.GetAssignableVisitsResponse
	mockGetAssignableVisistsErr     error
}

func (s *MockOptimizerService) Recv() (*optimizerpb.SolveVRPResponse, error) {
	s.mx.Lock()
	i := s.nextScoreIndex
	s.nextScoreIndex++
	s.mx.Unlock()

	if s.mockRecvError != nil {
		return nil, s.mockRecvError
	}

	return &optimizerpb.SolveVRPResponse{
		Solution: &optimizerpb.VRPSolution{
			Score: &optimizerpb.VRPScore{
				HardScore: &s.hardScores[i],
				IsValid:   &s.isValidScore,
			},
		},
	}, nil
}

func (s *MockOptimizerService) SolveVRP(ctx context.Context, in *optimizerpb.SolveVRPRequest, opts ...grpc.CallOption) (optimizerpb.OptimizerService_SolveVRPClient, error) {
	if s.mockSolveVRPError != nil {
		return nil, s.mockSolveVRPError
	}
	return s, nil
}

func (s *MockOptimizerService) GetAssignableShiftTeams(ctx context.Context, in *optimizerpb.GetAssignableShiftTeamsRequest, opts ...grpc.CallOption) (*optimizerpb.GetAssignableShiftTeamsResponse, error) {
	return s.mockGetAssignableShiftTeamsResp, s.mockGetAssignableShiftTeamsErr
}

func (s *MockOptimizerService) GetAssignableVisits(ctx context.Context, in *optimizerpb.GetAssignableVisitsRequest, opts ...grpc.CallOption) (*optimizerpb.GetAssignableVisitsResponse, error) {
	return s.mockGetAssignableVisitsResp, s.mockGetAssignableVisistsErr
}

func TestDiagnosticsErrorSource(t *testing.T) {
	logistics, err := diagnosticsErrorSource(1)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_LOGISTICS, logistics)

	optimizer, err := diagnosticsErrorSource(2)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_OPTIMIZER, optimizer)

	_, err = diagnosticsErrorSource(9999)
	if err == nil {
		t.Fatal("must have error for unknown error source")
	}
}

func TestCheckFeasibilityForVisits(t *testing.T) {
	startTime := time.Date(2022, time.January, 1, 17, 0, 0, 0, time.Local)
	endTime := time.Date(2022, time.January, 1, 18, 0, 0, 0, time.Local)

	tcs := []struct {
		Description        string
		ShiftTeamsCount    int
		HardScores         []int64
		IsValid            bool
		useLastScheduleRun bool
		ExpectedResponse   logisticspb.CheckFeasibilityResponse_Status
	}{
		{
			Description:      "base case: valid, no hard scores is feasible",
			ShiftTeamsCount:  1,
			HardScores:       []int64{0, 0, 0, 0, 0, 0},
			IsValid:          true,
			ExpectedResponse: logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE,
		},
		{
			Description:      "invalid optimizer score is infeasible",
			ShiftTeamsCount:  1,
			HardScores:       []int64{0, 0, 0, 0, 0, 0},
			IsValid:          false,
			ExpectedResponse: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Description:      "valid, but hard optimizer score is infeasible",
			ShiftTeamsCount:  1,
			HardScores:       []int64{-100, -100, -100, 100, 100, 100},
			IsValid:          true,
			ExpectedResponse: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Description:      "no shift teams is infeasible",
			ShiftTeamsCount:  0,
			HardScores:       []int64{0},
			IsValid:          true,
			ExpectedResponse: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Description:        "base case: use last schedule run, valid, feasible",
			ShiftTeamsCount:    1,
			HardScores:         []int64{0, 0, 0, 0, 0, 0},
			IsValid:            true,
			useLastScheduleRun: true,
			ExpectedResponse:   logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE,
		},
	}

	ctx := context.Background()

	latenessThresholdMs := int64(0)
	settings := &optimizersettings.Settings{
		FeasibilityCheckLatenessMinutes:             120,
		FeasibilityShiftTeamStartBufferSec:          100,
		FeasibilityLongServiceDurationSec:           3600,
		FeasibilityPercentCapacity:                  50,
		UseLimitedMarketAvailabilityChecks:          true,
		FeasibilityCheckLatenessThresholdOverrideMs: &latenessThresholdMs,
	}

	locationID := int64(3)
	optimizerRunID := int64(4)
	lastScheduleID := int64(5)
	latE6 := int32(12345678)
	lngE6 := int32(98765421)

	visitLocations := []*logisticssql.Location{
		{
			ID:          locationID,
			LatitudeE6:  latE6,
			LongitudeE6: lngE6,
		},
	}

	locIDs := []int64{
		locationID,
	}

	logisticsDB := &MockLogisticsDB{
		GetServiceRegionForStationMarketIDResult: &logisticssql.ServiceRegion{
			IanaTimeZoneName: "America/Mexico_City",
		},
		CreateVRPProblemResult: &logisticsdb.VRPProblemData{
			OptimizerRun: &logisticssql.OptimizerRun{
				ID: optimizerRunID,
			},
		},
		GetServiceRegionOpenHoursForDateResultTW: &logisticsdb.TimeWindow{
			Start: time.Date(2022, time.January, 1, 8, 0, 0, 0, time.UTC),
			End:   time.Date(2022, time.January, 1, 20, 0, 0, 0, time.UTC),
		},
		GetVisitLocationsResult: visitLocations,
		GetServiceRegionVRPDataResult: &logisticsdb.ServiceRegionVRPData{
			ServiceDate:        startTime,
			ShiftTeamSnapshots: []*logisticssql.ShiftTeamSnapshot{{}, {}},
			Settings: &optimizersettings.Settings{
				FeasibilityCheckLatenessMinutes:    120,
				FeasibilityShiftTeamStartBufferSec: 100,
				UseLimitedMarketAvailabilityChecks: true,
				FeasibilityCheckUseLastScheduleRun: true,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			settings.FeasibilityCheckUseLastScheduleRun = tc.useLastScheduleRun
			shiftTeams := make([]*optimizerpb.VRPShiftTeam, tc.ShiftTeamsCount)
			vrpProblem := &optimizerpb.VRPProblem{
				Description: &optimizerpb.VRPDescription{
					ShiftTeams: shiftTeams,
				},
			}
			logisticsDB.AttachCheckFeasibilityRequestToProblemResult = &logisticsdb.VRPProblemData{
				FeasibilityVisitIDs: []int64{-1},
				VRPProblem:          vrpProblem,
				CheckFeasibilityDiagnostics: &logisticspb.CheckFeasibilityDiagnostics{
					OptimizerRunId: optimizerRunID,
				},
			}
			logisticsDB.VRPProblemDataForScheduleResult = &logisticsdb.VRPProblemData{
				FeasibilityVisitIDs: []int64{-1},
				VRPProblem:          vrpProblem,
			}
			s := GRPCServer{
				VRPSolver: &MockVRPSolver{
					hardScores:   tc.HardScores,
					isValidScore: tc.IsValid,
				},
				LogisticsDB: logisticsDB,
				SettingsService: &optimizersettings.MockSettingsService{
					RegionSettings: settings,
				},
			}

			visits := make([]*logisticspb.CheckFeasibilityVisit, 2)
			for i := range visits {
				visits[i] = &logisticspb.CheckFeasibilityVisit{
					MarketId: proto.Int64(1),
					ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
						ArrivalTimeWindow: &commonpb.TimeWindow{
							StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
							EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
						}},
				}
			}

			feasibilityResponse, err := s.checkFeasibilityForVisits(ctx, &logisticsdb.ServiceRegionVRPData{
				ServiceDate: startTime,
				Settings:    settings,
				CheckFeasibilityData: &logisticsdb.CheckFeasibilityVRPDataResult{
					Visits: visits,
					LocIDs: locIDs,
					Diagnostics: &logisticspb.CheckFeasibilityDiagnostics{
						OptimizerRunId: optimizerRunID,
						ScheduleId:     lastScheduleID,
					},
				},
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.ExpectedResponse, feasibilityResponse.GetStatus(), "Feasibility status doesn't match")
			testutils.MustMatch(t, optimizerRunID, feasibilityResponse.GetDiagnostics().OptimizerRunId)
		})
	}

	s := GRPCServer{
		VRPSolver: &MockVRPSolver{
			hardScores: []int64{0},
		},
	}

	_, err := s.feasibilityForRequests(ctx, nil, &logisticspb.CheckFeasibilityDiagnostics{})
	if err == nil {
		t.Fatal("Expected error for nil feasibilityTree")
	}
	_, err = s.feasibilityForRequests(ctx, &checkfeasibility.FeasibilityTree{}, &logisticspb.CheckFeasibilityDiagnostics{})
	if err == nil {
		t.Fatal("Expected error for empty vrpRequests in feasibilityTree")
	}
}

func TestFeasibilityRequestNearingCapacity(t *testing.T) {
	marketID := proto.Int64(1)
	arrivalDate := &logisticspb.CheckFeasibilityVisit_ArrivalDate{ArrivalDate: &commonpb.Date{Year: 2022, Month: 7, Day: 22}}
	lat1 := int32(12345678)
	lng1 := int32(98765421)
	hour := int64(3600)
	fifty := int64(50)
	visits := []*logisticspb.CheckFeasibilityVisit{{
		MarketId:                 marketID,
		ArrivalTimeSpecification: arrivalDate,
		Location:                 &commonpb.Location{LatitudeE6: lat1, LongitudeE6: lng1},
		IsManualAdjustment:       true,
	}}

	locIDs := []int64{int64(1), int64(2)}
	nearingCapacityVisits, cfLocIDs := createVisitsForNearingCapacity(createVisitsForNearingCapacityParams{
		activeShiftTeamsCount:             4,
		visits:                            visits,
		locIDs:                            locIDs,
		feasibilityLongServiceDurationSec: hour,
		feasibilityPercentCapacity:        fifty,
	})

	templateLoc := &commonpb.Location{LatitudeE6: lat1, LongitudeE6: lng1}
	expectedVisits := []*logisticspb.CheckFeasibilityVisit{
		{
			MarketId:                 marketID,
			ArrivalTimeSpecification: arrivalDate,
			Location:                 templateLoc,
			IsManualAdjustment:       true,
			ServiceDurationSec:       &hour,
		},
		{
			MarketId:                 marketID,
			ArrivalTimeSpecification: arrivalDate,
			Location:                 templateLoc,
			IsManualAdjustment:       true,
			ServiceDurationSec:       &hour,
		}}

	testutils.MustMatch(t, len(expectedVisits), len(nearingCapacityVisits), "unexpected number of visits")
	for i, nearingCapacityVisit := range nearingCapacityVisits {
		testutils.MustMatchProto(t, expectedVisits[i], nearingCapacityVisit, "not matching visit for nearing capacity visit")
	}
	testutils.MustMatch(t, len(nearingCapacityVisits), len(cfLocIDs))
}

func TestFeasibilityVisitsWithLocations(t *testing.T) {
	marketID := int64(123)
	templateVisit := &logisticspb.CheckFeasibilityVisit{
		MarketId: &marketID,
	}

	locations := []*logisticssql.Location{
		{LatitudeE6: 1, LongitudeE6: 2},
		{LatitudeE6: 2, LongitudeE6: 2},
		{LatitudeE6: 3, LongitudeE6: 2},
	}

	visits := logisticsdb.FeasibilityVisitsWithLocations(templateVisit, locations)
	for i, location := range locations {
		testutils.MustMatch(t, location.LatitudeE6, visits[i].Location.LatitudeE6)
		testutils.MustMatch(t, location.LongitudeE6, visits[i].Location.LongitudeE6)
	}
}

func TestGRPCServer_locsFromCSVData(t *testing.T) {
	tcs := []struct {
		Desc string
		CSV  string

		HasErr   bool
		Expected []logistics.LatLng
	}{
		{
			Desc: "base case",
			CSV: `
latitude,longitude
1.234,5.678
2.34,6.78
`,

			Expected: []logistics.LatLng{
				logistics.NewLatLng(1.234, 5.678),
				logistics.NewLatLng(2.34, 6.78),
			},
		},
		{
			Desc: "bad header fails",
			CSV: `
latitude,longitude1
1.234,5.678
2.34,6.78
`,
			HasErr: true,
		},
		{
			Desc: "no data fails",
			CSV: `
latitude,longitude
`,

			HasErr: true,
		},
		{
			Desc: "bad latitude fails",
			CSV: `
latitude,longitude
1.234s,5.678
2.34,6.78
`,

			HasErr: true,
		},
		{
			Desc: "bad longitude fails",
			CSV: `
latitude,longitude
1.234s,5.678
2.34,6.78
`,

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			lls, err := locsFromCSVData([]byte(tc.CSV))
			if (err != nil) != tc.HasErr {
				t.Fatalf("error doesn't match: %v", err)
			}

			testutils.MustMatch(t, tc.Expected, lls)
		})
	}
}

func TestGRPCServer_recordFeasibilityQuery(t *testing.T) {
	ctx := context.Background()

	careRequestID := int64(1)
	serviceDate := time.Date(2022, time.January, 1, 17, 0, 0, 0, time.Local)

	templateVisit := &logisticspb.CheckFeasibilityVisit{
		EntityDescriptor: &logisticspb.CheckFeasibilityVisit_CareRequestId{
			CareRequestId: careRequestID,
		},
		ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{},
	}

	badTW := &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
		ArrivalTimeWindow: &commonpb.TimeWindow{
			StartDatetime: &commonpb.DateTime{
				TimeOffset: &commonpb.DateTime_TimeZone{
					TimeZone: &commonpb.TimeZone{
						Id: "-flerg",
					},
				},
			},
			EndDatetime: &commonpb.DateTime{},
		},
	}

	badTWParams := &recordFeasibilityQueryParams{
		visit: &logisticspb.CheckFeasibilityVisit{
			EntityDescriptor: &logisticspb.CheckFeasibilityVisit_CareRequestId{
				CareRequestId: careRequestID,
			},
			ArrivalTimeSpecification: badTW,
		},
	}

	tcs := []struct {
		Desc string

		LogisticsDB LogisticsDB
		Params      *recordFeasibilityQueryParams
		ServiceDate time.Time

		HasErr bool
	}{
		{
			Desc: "base case",
			LogisticsDB: &MockLogisticsDB{
				AddCheckFeasibilityQueryResult: &logisticssql.CheckFeasibilityQuery{},
			},
			Params: &recordFeasibilityQueryParams{
				visit:       templateVisit,
				serviceDate: &serviceDate,
			},
			HasErr: false,
		},
		{
			Desc:   "bad time window",
			Params: badTWParams,
			HasErr: true,
		},
		{
			Desc: "error adding query",
			LogisticsDB: &MockLogisticsDB{
				AddCheckFeasibilityQueryErr: errors.New("whoops! can't do that"),
			},
			Params: &recordFeasibilityQueryParams{
				visit:       templateVisit,
				serviceDate: &serviceDate,
			},
			HasErr: true,
		},
		{
			Desc: "service region availability",
			LogisticsDB: &MockLogisticsDB{
				AddServiceRegionAvailabilityQueryResult: &logisticssql.ServiceRegionAvailabilityQuery{},
			},
			Params: &recordFeasibilityQueryParams{
				visit:       &logisticspb.CheckFeasibilityVisit{},
				serviceDate: &serviceDate,
			},
			HasErr: false,
		},
		{
			Desc: "service region availability, error adding",
			LogisticsDB: &MockLogisticsDB{
				AddServiceRegionAvailabilityQueryErr: errors.New("whoops! can't do that"),
			},
			Params: &recordFeasibilityQueryParams{
				visit:       &logisticspb.CheckFeasibilityVisit{},
				serviceDate: &serviceDate,
			},
			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GRPCServer{
				LogisticsDB: tc.LogisticsDB,
			}

			err := s.recordFeasibilityQuery(ctx, tc.Params)

			if (err != nil) != tc.HasErr {
				t.Fatalf("error doesn't match: %v", err)
			}
		})
	}
}

func TestGRPCServer_scheduleTokenFromOpaqueToken(t *testing.T) {
	scheduleID := time.Now().UnixNano()

	opaqueToken, err := proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
	if err != nil {
		t.Fatal(err)
	}

	scheduleToken, err := scheduleTokenFromOpaqueToken(opaqueToken)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchProto(t, &logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	}, scheduleToken, "schedule token does not match")
}

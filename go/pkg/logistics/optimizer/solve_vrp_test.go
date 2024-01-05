package optimizer

import (
	"context"
	"errors"
	"testing"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
)

type MockSolveVRPLogisticsDB struct {
	AddOptimizerRunResult             *logisticssql.OptimizerRun
	AddOptimizerRunErr                error
	WriteScheduleForVRPSolutionResult *logisticssql.Schedule
	WriteScheduleForVRPSolutionErr    error
	AddOptimizerRunErrorErr           error
}

func (m *MockSolveVRPLogisticsDB) AddOptimizerRun(context.Context, logisticssql.AddOptimizerRunParams, *optimizerpb.VRPConstraintConfig, *optimizersettings.Settings) (*logisticssql.OptimizerRun, error) {
	return m.AddOptimizerRunResult, m.AddOptimizerRunErr
}

func (m *MockSolveVRPLogisticsDB) WriteScheduleForVRPSolution(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error) {
	return m.WriteScheduleForVRPSolutionResult, m.WriteScheduleForVRPSolutionErr
}

func (m *MockSolveVRPLogisticsDB) AddOptimizerRunError(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error {
	return m.AddOptimizerRunErrorErr
}

type mockOptimizerServiceClient struct {
	grpc.ClientStream
	solveVRPErr error
	recvErr     error
	recv        chan *optimizerpb.SolveVRPResponse
}

func (m *mockOptimizerServiceClient) Recv() (*optimizerpb.SolveVRPResponse, error) {
	if m.recvErr != nil {
		return nil, m.recvErr
	}

	resp, more := <-m.recv
	if !more {
		return nil, errors.New("empty")
	}

	return resp, nil
}

func (m *mockOptimizerServiceClient) GetAssignableShiftTeams(ctx context.Context, in *optimizerpb.GetAssignableShiftTeamsRequest, opts ...grpc.CallOption) (*optimizerpb.GetAssignableShiftTeamsResponse, error) {
	return nil, errors.New("not implemented")
}

func (m *mockOptimizerServiceClient) GetAssignableVisits(ctx context.Context, in *optimizerpb.GetAssignableVisitsRequest, opts ...grpc.CallOption) (*optimizerpb.GetAssignableVisitsResponse, error) {
	return nil, errors.New("not implemented")
}

func (m *mockOptimizerServiceClient) SolveVRP(ctx context.Context, in *optimizerpb.SolveVRPRequest, opts ...grpc.CallOption) (optimizerpb.OptimizerService_SolveVRPClient, error) {
	return m, m.solveVRPErr
}

func (m *mockOptimizerServiceClient) send(resp *optimizerpb.SolveVRPResponse) {
	m.recv <- resp
}

type mockRouteProvider func(context.Context, ...logistics.LatLng) (*logistics.Route, error)

func (m mockRouteProvider) GetRoute(ctx context.Context, tags monitoring.Tags, latLng ...logistics.LatLng) (*logistics.Route, error) {
	return m(ctx, latLng...)
}

func TestCollectVisitIDsForPolylineExhaustiveStopMatch(t *testing.T) {
	testutils.AssertExhaustiveOneOfMapping(t,
		&optimizerpb.VRPShiftTeamRouteStop{},
		"stop", []string{"visit", "rest_break"},
		"for a new type of route stop, one must explicitly determine how to handle it"+
			" in collectVisitIDs, for how the polylines are generated for the route",
	)
}

func TestCollectVisitIDsForPolyline(t *testing.T) {
	st := &optimizerpb.VRPShiftTeam{Route: &optimizerpb.VRPShiftTeamRoute{Stops: []*optimizerpb.VRPShiftTeamRouteStop{
		{Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
			Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(1)},
		}},
		{Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{},
		}},
	}}}

	testutils.MustMatch(t, []int64{1}, collectVisitIDsForPolyline(st))
}

func TestNewRun(t *testing.T) {
	wantRun := &logisticssql.OptimizerRun{
		ID:              123,
		ServiceRegionID: 456,
	}
	runnerLDB := &mockRunnerLDB{
		optimizerRun: wantRun,
	}

	collector, _ := newRun(context.Background(), runnerLDB, logisticssql.AddOptimizerRunParams{}, &optimizerpb.VRPConstraintConfig{}, &optimizersettings.Settings{}, AvailabilityParams{
		IDMap:            logisticsdb.AvailabilityVisitIDMap{},
		UnassignedVisits: []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow{},
	})

	if collector.writeChan == nil {
		t.Fatal("writeChan is nil")
	}

	testutils.MustMatch(t, wantRun, collector.run)
}

func TestVRPSolver_SolveVRP(t *testing.T) {
	tcs := []struct {
		Desc             string
		OptimizerRunType logisticsdb.OptimizerRunType
	}{
		{
			Desc:             "Base Case, no check feasibility",
			OptimizerRunType: logisticsdb.ServiceRegionScheduleRunType,
		},
		{
			Desc:             "Check Feasibility problem",
			OptimizerRunType: logisticsdb.FeasibilityCheckRunType,
		},
	}

	polyline := logistics.RoutePolyline{
		{LatE6: 12, LngE6: 34},
		{LatE6: 56, LngE6: 78},
	}

	routeProvider := mockRouteProvider(func(ctx context.Context, ll ...logistics.LatLng) (*logistics.Route, error) {
		return &logistics.Route{
			Polyline: polyline,
		}, nil
	})

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			optimizerServiceClient := &mockOptimizerServiceClient{
				recv: make(chan *optimizerpb.SolveVRPResponse),
			}

			vrpSolver := VRPSolver{
				OptimizerServiceClient: optimizerServiceClient,
				SolveVRPLogisticsDB: &MockSolveVRPLogisticsDB{
					AddOptimizerRunResult: &logisticssql.OptimizerRun{
						ID: int64(3),
					},
				},
				RouteProvider: routeProvider,
			}
			solveVRPResponses, err := vrpSolver.SolveVRP(context.Background(), &SolveVRPParams{
				SolveVRPRequest:   &optimizerpb.SolveVRPRequest{},
				OptimizerRun:      &logisticssql.OptimizerRun{},
				OptimizerSettings: &optimizersettings.Settings{},
				OptimizerRunType:  tc.OptimizerRunType,
				WriteToDatabase:   true,
			})
			if err != nil {
				t.Fatal(err)
			}

			const shiftTeamID = 123

			shiftTeams := []*optimizerpb.VRPShiftTeam{
				{
					Id:    proto.Int64(shiftTeamID),
					Route: &optimizerpb.VRPShiftTeamRoute{},
				},
			}

			optimizerServiceClient.send(&optimizerpb.SolveVRPResponse{
				Solution: &optimizerpb.VRPSolution{
					Description: &optimizerpb.VRPDescription{
						ShiftTeams: shiftTeams,
					},
				},
			})

			want := &WrappedSolveVRPResp{
				Response: &optimizerpb.SolveVRPResponse{
					Solution: &optimizerpb.VRPSolution{
						Description: &optimizerpb.VRPDescription{
							ShiftTeams: shiftTeams,
						},
					},
				},
				RoutePolylines: []ShiftTeamRoutePolyline{
					{
						ShiftTeamID: shiftTeamID,
						Polyline:    polyline,
					},
				},
				OptimizerRunID: int64(3),
			}

			select {
			case solveVRPResponse := <-solveVRPResponses:
				testutils.MustMatch(t, want, solveVRPResponse)
			case <-time.After(100 * time.Millisecond):
				t.Fatal("no response was received")
			}
		})
	}
}

func TestProcessWriteChan(t *testing.T) {
	optimizerRunID := time.Now().UnixNano()
	var addOptimizerRunErrorCalled bool
	c := &ResultCollector{
		ctx:       context.TODO(),
		writeChan: make(chan *optimizerpb.SolveVRPResponse, 1),
		run:       &logisticssql.OptimizerRun{ID: optimizerRunID},
		ScheduleResultWriter: mockScheduleResultWriter{
			writeScheduleForVRPSolution: func(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error) {
				return nil, errors.New("logistics write error")
			},
			addOptimizerRunError: func(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error {
				addOptimizerRunErrorCalled = true
				return errors.New("add optimizer run error for test coverage")
			},
		},
	}
	c.writeChan <- &optimizerpb.SolveVRPResponse{}
	close(c.writeChan)
	c.processWriteChan()
	testutils.MustMatch(t, true, addOptimizerRunErrorCalled)
}

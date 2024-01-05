package checkfeasibility

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"

	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"google.golang.org/protobuf/proto"
)

type MockVRPSolverForRequest struct {
	recvByReq map[*optimizerpb.SolveVRPRequest]*optimizerpb.SolveVRPResponse
}

func (m *MockVRPSolverForRequest) SolveVRP(ctx context.Context, solveVRPParams *optimizer.SolveVRPParams) (<-chan *optimizer.WrappedSolveVRPResp, error) {
	solveVRPResps := make(chan *optimizer.WrappedSolveVRPResp, 1)
	defer close(solveVRPResps)

	resp, ok := m.recvByReq[solveVRPParams.SolveVRPRequest]
	if ok {
		solveVRPResps <- &optimizer.WrappedSolveVRPResp{
			Response: resp,
		}
	}

	return solveVRPResps, nil
}

func TestFeasibilityTreeResolution(t *testing.T) {
	feasbileReq := &optimizerpb.SolveVRPRequest{Config: &optimizerpb.VRPConfig{RandomSeed: proto.Int64(1)},
		Problem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{ShiftTeams: []*optimizerpb.VRPShiftTeam{
			{ /* we need a shift team to not short circuit*/ }}}}}
	infeasibleReq := &optimizerpb.SolveVRPRequest{Config: &optimizerpb.VRPConfig{RandomSeed: proto.Int64(2)},
		Problem: &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{ShiftTeams: []*optimizerpb.VRPShiftTeam{
			{ /* we need a shift team to not short circuit*/ }}}}}

	mockVRPSolver := &MockVRPSolverForRequest{recvByReq: map[*optimizerpb.SolveVRPRequest]*optimizerpb.SolveVRPResponse{
		feasbileReq:   {Solution: &optimizerpb.VRPSolution{Score: &optimizerpb.VRPScore{IsValid: proto.Bool(true), HardScore: proto.Int64(0)}}},
		infeasibleReq: {Solution: &optimizerpb.VRPSolution{Score: &optimizerpb.VRPScore{IsValid: proto.Bool(true), HardScore: proto.Int64(100)}}},
	}}
	for _, tc := range []struct {
		Description    string
		Tree           *FeasibilityTree
		ExpectedResult logisticspb.CheckFeasibilityResponse_Status
	}{
		{
			Description: "partially feasible",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{
					VRPRequest: feasbileReq,
					OptimizerRun: &logisticssql.OptimizerRun{
						ID: int64(2),
					},
				}),
				NewFeasibilityLeaf(&SolveVRPInput{
					VRPRequest: infeasibleReq,
					OptimizerRun: &logisticssql.OptimizerRun{
						ID: int64(3),
					},
				}),
			),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
		},
		{
			Description: "totallyFeasibleMultiLevelTree",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{
					VRPRequest: feasbileReq,
					OptimizerRun: &logisticssql.OptimizerRun{
						ID: int64(4),
					},
				}),
				NewFeasibilityTree(logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
					NewFeasibilityLeaf(&SolveVRPInput{
						VRPRequest: feasbileReq,
						OptimizerRun: &logisticssql.OptimizerRun{
							ID: int64(5),
						},
					})),
			),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE,
		},
		{
			Description: "infeasible result propagates through the rest of the tree",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: feasbileReq}),
				NewFeasibilityTree(
					logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: feasbileReq}),
					// this single infeasible leaf will result in the full check being infeasible.
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: infeasibleReq}).WithPropagateInfeasibility(),
				)),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Description: "partially feasible result does not propagate infeasible through the rest of the tree",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: feasbileReq}),
				NewFeasibilityTree(
					logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: feasbileReq}),
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: infeasibleReq}),
				).WithPropagateInfeasibility(),
			),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
		},
		{
			Description: "wholly infeasible tree propagates fully infeasible through the rest of the tree",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: feasbileReq}),
				NewFeasibilityTree(
					logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: infeasibleReq}),
					NewFeasibilityLeaf(&SolveVRPInput{VRPRequest: infeasibleReq}),
				).WithPropagateInfeasibility(),
			),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
		{
			Description: "totallyInfeasibleMultiLevelTree",
			Tree: NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
				NewFeasibilityLeaf(&SolveVRPInput{
					VRPRequest: infeasibleReq,
					OptimizerRun: &logisticssql.OptimizerRun{
						ID: int64(6),
					},
				}),
				NewFeasibilityTree(logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
					NewFeasibilityLeaf(&SolveVRPInput{
						VRPRequest: infeasibleReq,
						OptimizerRun: &logisticssql.OptimizerRun{
							ID: int64(7),
						},
					})),
			),
			ExpectedResult: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		},
	} {
		t.Run(tc.Description, func(t *testing.T) {
			res, err := tc.Tree.Evaluate(context.Background(), mockVRPSolver, false)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.ExpectedResult, res.Status)
		})
	}
}

func Test_isFeasibleScore(t *testing.T) {
	tcs := []struct {
		Desc           string
		Score          *optimizerpb.VRPScore
		ExpectFeasible bool
	}{
		{
			Desc:           "base",
			Score:          &optimizerpb.VRPScore{IsValid: proto.Bool(true)},
			ExpectFeasible: true,
		},
		{
			Desc: "bad hard score",
			Score: &optimizerpb.VRPScore{
				HardScore: proto.Int64(-1),
				IsValid:   proto.Bool(true),
			},
			ExpectFeasible: false,
		},
		{
			Desc: "bad unassigned visit score",
			Score: &optimizerpb.VRPScore{
				UnassignedVisitsScore: proto.Int64(1),
				IsValid:               proto.Bool(true),
			},
			ExpectFeasible: false,
		},
		{
			Desc: "bad hard and unassigned visit score",
			Score: &optimizerpb.VRPScore{
				HardScore:             proto.Int64(-1),
				UnassignedVisitsScore: proto.Int64(1),
				IsValid:               proto.Bool(true),
			},
			ExpectFeasible: false,
		},
		{
			Desc: "non-zero soft score",
			Score: &optimizerpb.VRPScore{
				SoftScore: proto.Int64(1),
				IsValid:   proto.Bool(true),
			},
			ExpectFeasible: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.ExpectFeasible, isFeasibleScore(tc.Score))
		})
	}
}

func TestAvailabilitiesFromServiceRegionAvailabilityData(t *testing.T) {
	tcs := []struct {
		Desc                   string
		Data                   *logisticsdb.ServiceRegionAvailability
		RequiredAttributesSets []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet

		Result *logisticspb.ServiceRegionAvailability
	}{
		{
			Desc: "full availability",
			Data: &logisticsdb.ServiceRegionAvailability{
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{},
							{},
						},
						UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE,
			},
		},
		{
			Desc: "full availability by locations and attributes",
			RequiredAttributesSets: []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet{
				{
					RequiredAttributes: []*common.Attribute{
						{
							Name: "attribute1",
						},
					},
				},
				{
					RequiredAttributes: []*common.Attribute{
						{
							Name: "attribute2",
						},
					},
				},
			},
			Data: &logisticsdb.ServiceRegionAvailability{
				CanonicalLocationsSetIDs: []int64{1, 2},
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{
								ID:         1,
								LocationID: 1,
							},
							{
								ID:         2,
								LocationID: 1,
							},
							{
								ID:         3,
								LocationID: 2,
							},
						},
						UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{
								ID:         4,
								LocationID: 2,
							},
						},
						VisitsAttributesMap: logisticsdb.VisitsAttributesMap{
							1: {
								"attribute1": true,
								"attribute2": true,
							},
							2: {
								"attribute1": true,
								"attribute2": true,
							},
							3: {
								"attribute1": true,
								"attribute2": true,
							},
						},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE,
			},
		},
		{
			Desc: "limited availability by locations",
			Data: &logisticsdb.ServiceRegionAvailability{
				CanonicalLocationsSetIDs: []int64{1, 2},
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{LocationID: 1},
						},
						UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{LocationID: 2},
						},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_PARTIALLY_AVAILABLE,
			},
		},
		{
			Desc: "limited availability by attributes",
			RequiredAttributesSets: []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet{
				{
					RequiredAttributes: []*common.Attribute{
						{Name: "acute"},
						{Name: "in_person"},
					},
				},
				{
					RequiredAttributes: []*common.Attribute{
						{Name: "acute"},
						{Name: "virtual"},
					},
				},
			},
			Data: &logisticsdb.ServiceRegionAvailability{
				CanonicalLocationsSetIDs: []int64{1, 2},
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{
								ID:         1,
								LocationID: 1,
							},
							{
								ID:         2,
								LocationID: 2,
							},
							{
								ID:         5,
								LocationID: 1,
							},
							{
								ID:         6,
								LocationID: 1,
							},
							{
								ID:         7,
								LocationID: 2,
							},
							{
								ID:         8,
								LocationID: 2,
							},
						},
						UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{
								ID:         3,
								LocationID: 1,
							},
							{
								ID:         4,
								LocationID: 2,
							},
						},
						VisitsAttributesMap: logisticsdb.VisitsAttributesMap{
							1: {
								"acute":     true,
								"in_person": true,
							},
							2: {
								"acute":     true,
								"in_person": true,
							},
							3: {
								"acute":   true,
								"virtual": true,
							},
							4: {
								"acute":   true,
								"virtual": true,
							},
							5: {
								"bridge":    true,
								"in_person": true,
							},
							6: {
								"bridge":    true,
								"in_person": true,
							},
							7: {
								"bridge":  true,
								"virtual": true,
							},
							8: {
								"bridge":  true,
								"virtual": true,
							},
						},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_PARTIALLY_AVAILABLE,
			},
		},
		{
			Desc: "all unassigned visits returns unavailable",
			Data: &logisticsdb.ServiceRegionAvailability{
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						UnassignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{},
						},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
			},
		},
		{
			Desc: "new unassigned visits default to unavailable",
			Data: &logisticsdb.ServiceRegionAvailability{
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{
						AssignedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
							{},
							{},
						},
						ScheduleDiagnostics: &logisticssql.ScheduleDiagnostic{
							UnassignedVisitsDiff: sqltypes.ToValidNullInt64(int64(1)),
						},
					},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
			},
		},
		{
			Desc: "empty data returns unavailable",
			Data: &logisticsdb.ServiceRegionAvailability{
				Results: []logisticsdb.ServiceRegionAvailabilityResult{
					{},
				},
			},
			Result: &logisticspb.ServiceRegionAvailability{
				Status: logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			res := AvailabilitiesFromServiceRegionAvailabilityData(tc.Data, tc.RequiredAttributesSets)

			testutils.MustMatchProto(t, tc.Result, res[0])
		})
	}
}

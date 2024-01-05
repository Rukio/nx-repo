package checkfeasibility

import (
	"context"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// VRPSolver solves a vehicle routing problem, returning a channel of intermediary results.
type VRPSolver interface {
	SolveVRP(ctx context.Context, solveVRPParams *optimizer.SolveVRPParams) (<-chan *optimizer.WrappedSolveVRPResp, error)
}

// FeasibilityTree is a recursive data structure that allows determination of feasible/infeasible/partially-feasible
// status due to rule-based logic that is encoded in how the tree is laid out; primarily to handle logic defined in
// https://*company-data-covered*.sharepoint.com/:w:/s/tech-team/EYiZ8jeIQepMqs7uw6AtK1YB4oyFTkls4xt39VVUkqQT-w?e=QfRJBx
//
// The resulting status of the Tree is determined by the following rule:
//  1. A leaf node of the tree has the feasibility status of leafRequest'Status result, whether Optaplanner
//     said that that problem with that configuration was feasible or infeasible.
//  2. A non-leaf node'Status (n) feasibility status is computed by:
//     A. If all children are FEASIBLE, then n is FEASIBLE
//     B. If all children are INFEASIBLE, then n is also INFEASIBLE
//     C. If some children are FEASIBLE, some children are INFEASIBLE, then n is PARTIALLY_FEASIBLE
//     (for which there are multiple options, configured according to partiallyFeasibleResult).
//     D. If one child is partially feasible, then n is PARTIALLY_FEASIBLE with the child'Status status.
//     E. If two or more children are partially feasible, then n is PARTIALLY_FEASIBLE with the rightmost partially feasible child'Status status.
//
// Sample Use Cases:
//
//	A. For a feasibility check for a single care request -- we might have a single leaf node for the VRPProblem with that care request'Status VRPVisit.
//	B. For a market-level feasibility check that has more complex logic surrounding partial feasibility -- we might have we following tree:
//	            root node________________
//	           /                          \
//	      child_0 (check 60m visit)      child_1 (check 20m visits at canonical locations)
//	         \                              \___________canonical_location_1 with 20m service duration
//	          \                              \__________canonical_location_2 with 20m service duration
//	           \
//	            \_____________________canonical_location_2 with 60m service duration
//	             \____________________canonical_location_2 with 60m service duration
//
// .
type FeasibilityTree struct {
	Children []*FeasibilityTree
	// PartiallyFeasibleResult is the result to return if some children are feasible and some are infeasible.
	PartiallyFeasibleResult logisticspb.CheckFeasibilityResponse_Status
	// PropagateInfeasibility can be initialized with "WithPropagateInfeasibility", and communicates
	// that an infeasible result should propagate up the tree and result in the root being infeasible.
	PropagateInfeasibility bool

	// LeafVRPInput, if set, is the feasibility problem to check.
	// Otherwise, the feasibility result is determined by the resolution of the node'Status children.
	LeafVRPInput *SolveVRPInput
}

func (f *FeasibilityTree) SolveVRPRequests() []*optimizerpb.SolveVRPRequest {
	if f.LeafVRPInput != nil {
		return []*optimizerpb.SolveVRPRequest{f.LeafVRPInput.VRPRequest}
	}
	var results []*optimizerpb.SolveVRPRequest
	for _, child := range f.Children {
		results = append(results, child.SolveVRPRequests()...)
	}
	return results
}

func (f *FeasibilityTree) Evaluate(
	ctx context.Context,
	vrpSolver VRPSolver,
	enableDebugMarshaling bool,
) (FeasibilityResult, error) {
	if f.LeafVRPInput != nil {
		return f.evaluateLeaf(ctx, vrpSolver, enableDebugMarshaling)
	}

	results := make(FeasibilityResults, len(f.Children))
	eg, ctx := errgroup.WithContext(ctx)
	for i, child := range f.Children {
		i, child := i, child
		eg.Go(func() error {
			childResult, err := child.Evaluate(ctx, vrpSolver, enableDebugMarshaling)
			if err != nil {
				return err
			}
			results[i] = childResult
			return nil
		})
	}
	if err := eg.Wait(); err != nil {
		return FeasibilityResult{Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE}, err
	}

	return results.collectResult(f.PartiallyFeasibleResult, f.PropagateInfeasibility), nil
}

var (
	vrpDiagnosticsMarshaller = protojson.MarshalOptions{
		UseProtoNames: true,
	}
)

func (f *FeasibilityTree) evaluateLeaf(
	ctx context.Context,
	vrpSolver VRPSolver,
	enableDebugMarshaling bool,
) (FeasibilityResult, error) {
	req := f.LeafVRPInput.VRPRequest
	if len(req.GetProblem().GetDescription().GetShiftTeams()) == 0 {
		return FeasibilityResult{Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE}, nil
	}
	solveVRPResponses, err := vrpSolver.SolveVRP(ctx, &optimizer.SolveVRPParams{
		SolveVRPRequest:   req,
		OptimizerRun:      f.LeafVRPInput.OptimizerRun,
		OptimizerSettings: f.LeafVRPInput.OptimizerSettings,
		OptimizerRunType:  logisticsdb.FeasibilityCheckRunType,
		WriteToDatabase:   true,
	})
	if err != nil {
		return FeasibilityResult{
				Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
			},
			status.Errorf(codes.Internal, "optimizer request failed: %Status", err)
	}
	solveVRPResponse := <-solveVRPResponses
	if solveVRPResponse == nil {
		return FeasibilityResult{
				Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
			},
			status.Errorf(codes.Internal, "did not receive any expected response from optimizer")
	}

	score := solveVRPResponse.Response.GetSolution().GetScore()

	debugData := &logisticspb.CheckFeasibilityVRPDebugData{
		HardScore:             score.HardScore,
		UnassignedVisitsScore: score.UnassignedVisitsScore,
		DebugExplanation:      score.DebugExplanation,
	}

	if enableDebugMarshaling {
		problemJSON, err := vrpDiagnosticsMarshaller.Marshal(req)
		if err != nil {
			return FeasibilityResult{
					Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
				},
				status.Errorf(codes.Internal, "couldn't marshal vrp problem %Status", err)
		}
		debugData.VrpProblemJsonString = proto.String(string(problemJSON))
	}

	diagnosticsData := DiagnosticsData{
		DebugData:      []*logisticspb.CheckFeasibilityVRPDebugData{debugData},
		OptimizerRunID: solveVRPResponse.OptimizerRunID,
	}

	result := logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE
	if isFeasibleScore(score) {
		result = logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE
	}
	return FeasibilityResult{
		Status:                 result,
		Diagnostics:            diagnosticsData,
		propagateInfeasibility: f.PropagateInfeasibility,
	}, nil
}

func (f *FeasibilityTree) WithPropagateInfeasibility() *FeasibilityTree {
	f.PropagateInfeasibility = true
	return f
}

// SolveVRPInput wraps the data required by the VRPSolver.
type SolveVRPInput struct {
	VRPRequest             *optimizerpb.SolveVRPRequest
	OptimizerRun           *logisticssql.OptimizerRun
	OptimizerSettings      *optimizersettings.Settings
	VRPProblemData         *logisticsdb.VRPProblemData
	VisitArrivalTimestamps map[int64]time.Time
}

type FeasibilityResults []FeasibilityResult
type FeasibilityResult struct {
	Status                  logisticspb.CheckFeasibilityResponse_Status
	Diagnostics             DiagnosticsData
	propagateInfeasibility  bool
	partiallyFeasibleStatus logisticspb.CheckFeasibilityResponse_Status
}

func (frs FeasibilityResults) collectResult(
	partiallyFeasibleStatus logisticspb.CheckFeasibilityResponse_Status,
	propagateInfeasibility bool,
) FeasibilityResult {
	var hasFeasible, hasInfeasible, hasPartiallyFeasible bool
	var hasInfeasibleOverride bool
	var collectedDebugData []*logisticspb.CheckFeasibilityVRPDebugData
	if len(frs) == 0 {
		return FeasibilityResult{
			Status: logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE,
		}
	}
	for _, fr := range frs {
		switch fr.Status {
		case logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE:
			hasFeasible = true
		case logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE:
			if fr.propagateInfeasibility {
				// if a child is infeasible and wants to propagate, return the infeasible result
				// all the way up the tree. (We don't short circuit here since we still collect all the debug data).
				hasInfeasibleOverride = true
			}
			hasInfeasible = true
		default:
			hasPartiallyFeasible = true
			if fr.partiallyFeasibleStatus != logisticspb.CheckFeasibilityResponse_STATUS_UNSPECIFIED {
				partiallyFeasibleStatus = fr.partiallyFeasibleStatus
			}
		}
		collectedDebugData = append(collectedDebugData, fr.Diagnostics.DebugData...)
	}
	diagnosticsData := DiagnosticsData{DebugData: collectedDebugData}
	if hasInfeasibleOverride {
		return FeasibilityResult{
			Status:                 logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
			Diagnostics:            diagnosticsData,
			propagateInfeasibility: true,
		}
	}
	if hasPartiallyFeasible || (hasFeasible && hasInfeasible) {
		return FeasibilityResult{
			Status:                  partiallyFeasibleStatus,
			Diagnostics:             diagnosticsData,
			partiallyFeasibleStatus: partiallyFeasibleStatus,
		}
	}
	if hasFeasible {
		return FeasibilityResult{
			Status:      logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE,
			Diagnostics: diagnosticsData,
		}
	}
	return FeasibilityResult{
		Status:                 logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		Diagnostics:            diagnosticsData,
		propagateInfeasibility: propagateInfeasibility,
	}
}

type DiagnosticsData struct {
	DebugData      []*logisticspb.CheckFeasibilityVRPDebugData
	OptimizerRunID int64
}

func NewFeasibilityLeaf(r *SolveVRPInput) *FeasibilityTree {
	return &FeasibilityTree{LeafVRPInput: r}
}

func NewFeasibilityTree(
	partiallyFeasibleResult logisticspb.CheckFeasibilityResponse_Status,
	children ...*FeasibilityTree,
) *FeasibilityTree {
	return &FeasibilityTree{
		Children:                children,
		PartiallyFeasibleResult: partiallyFeasibleResult,
	}
}

func isFeasibleScore(score *optimizerpb.VRPScore) bool {
	return score.GetIsValid() && score.GetHardScore() == 0 && score.GetUnassignedVisitsScore() == 0
}

func AvailabilitiesFromServiceRegionAvailabilityData(
	data *logisticsdb.ServiceRegionAvailability,
	requiredAttributesSet []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet,
) []*logisticspb.ServiceRegionAvailability {
	results := data.Results
	availabilities := make([]*logisticspb.ServiceRegionAvailability, len(results))
	for i, result := range results {
		assignedVisits := filterVisitsByAttributesSet(result.AssignedVisits, result.VisitsAttributesMap, requiredAttributesSet)
		unassignedVisits := filterVisitsByAttributesSet(result.UnassignedVisits, result.VisitsAttributesMap, requiredAttributesSet)

		var hasNewUnassignedVisits bool
		if result.ScheduleDiagnostics != nil {
			hasNewUnassignedVisits = result.ScheduleDiagnostics.UnassignedVisitsDiff.Int64 > 0
		}

		var availabilityStatus logisticspb.ServiceRegionAvailability_Status
		availabilityParams := AvailabilityParams{
			AssignedVisits:   assignedVisits,
			UnassignedVisits: unassignedVisits,
		}
		switch {
		case hasNewUnassignedVisits:
			availabilityStatus = logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE
		case isFullyAvailable(availabilityParams):
			availabilityStatus = logisticspb.ServiceRegionAvailability_STATUS_AVAILABLE
		case isPartiallyAvailable(availabilityParams):
			availabilityStatus = logisticspb.ServiceRegionAvailability_STATUS_PARTIALLY_AVAILABLE
		default:
			availabilityStatus = logisticspb.ServiceRegionAvailability_STATUS_UNAVAILABLE
		}

		availabilities[i] = &logisticspb.ServiceRegionAvailability{
			Status: availabilityStatus,
		}
	}

	return availabilities
}

func filterVisitsByAttributesSet(
	visits []*logisticssql.ServiceRegionAvailabilityVisit,
	attributesMap logisticsdb.VisitsAttributesMap,
	requiredAttributesSets []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet,
) []*logisticssql.ServiceRegionAvailabilityVisit {
	if len(requiredAttributesSets) == 0 {
		return visits
	}

	var filteredVisits []*logisticssql.ServiceRegionAvailabilityVisit
	for _, requiredAttributesSet := range requiredAttributesSets {
		requiredAttributes := requiredAttributesSet.RequiredAttributes
		for _, visit := range visits {
			visitAttributes, ok := attributesMap[visit.ID]
			if !ok {
				continue
			}

			missingRequired := false
			for _, requiredAttribute := range requiredAttributes {
				_, ok := visitAttributes[requiredAttribute.Name]
				if !ok {
					missingRequired = true
				}
			}

			if missingRequired {
				continue
			}

			filteredVisits = append(filteredVisits, visit)
		}
	}

	return filteredVisits
}

type AvailabilityParams struct {
	AssignedVisits      []*logisticssql.ServiceRegionAvailabilityVisit
	UnassignedVisits    []*logisticssql.ServiceRegionAvailabilityVisit
	ScheduleDiagnostics *logisticssql.ScheduleDiagnostic
}

func isFullyAvailable(
	params AvailabilityParams,
) bool {
	return len(params.AssignedVisits) > 0 && len(params.UnassignedVisits) == 0
}

func isPartiallyAvailable(
	params AvailabilityParams,
) bool {
	return len(params.AssignedVisits) > 0 && len(params.UnassignedVisits) > 0
}

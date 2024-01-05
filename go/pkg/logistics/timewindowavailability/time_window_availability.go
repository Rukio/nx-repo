package timewindowavailability

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/checkfeasibility"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	visitSetName         = "tw-availability-set"
	recommendedTWVisitID = int64(-1)
)

type AvailabilitiesParams struct {
	ServiceDates   []*common.Date
	VRPDataByDate  map[*common.Date]*logisticsdb.ServiceRegionVRPData
	VRPInputByDate map[*common.Date]*checkfeasibility.SolveVRPInput

	Duration       time.Duration
	StartTimestamp time.Time
	LimitEnd       *time.Time

	VRPSolver checkfeasibility.VRPSolver
}

type availabilityVRP struct {
	visits               []*optimizerpb.VRPVisit
	availabilityVisitIDs []int64
	visitsTWMap          map[int64]*logisticspb.TimeWindowAvailability
	solveVRPParams       *optimizer.SolveVRPParams
}

func TimeWindowAvailabilities(ctx context.Context, params *AvailabilitiesParams) ([]*logisticspb.ServiceDateAvailability, error) {
	serviceDates := params.ServiceDates
	vrpDataByDate := params.VRPDataByDate
	startTimestamp := params.StartTimestamp

	twAvailabilitiesByDate, err := buildTWAvailabilitiesVRP(params)
	if err != nil {
		return nil, err
	}

	eg, solveCtx := errgroup.WithContext(ctx)
	vrpResponses := make(map[*common.Date]optimizer.WrappedSolveVRPResp)
	responsesMutex := sync.Mutex{}
	for date, twData := range twAvailabilitiesByDate {
		date := date
		twData := twData
		eg.Go(func() error {
			solveVRPResponses, err := params.VRPSolver.SolveVRP(solveCtx, twData.solveVRPParams)
			if err != nil {
				return err
			}
			solveVRPResponse := <-solveVRPResponses
			if solveVRPResponse == nil {
				return status.Errorf(codes.Internal, "did not receive any expected response from optimizer")
			}

			responsesMutex.Lock()
			vrpResponses[date] = *solveVRPResponse
			responsesMutex.Unlock()

			return nil
		})
	}

	if err := eg.Wait(); err != nil {
		return nil, err
	}

	var serviceDateAvailabilities []*logisticspb.ServiceDateAvailability
	for _, date := range serviceDates {
		solveVRPResponse := vrpResponses[date]
		vrpData := vrpDataByDate[date]
		twData := twAvailabilitiesByDate[date]
		if solveVRPResponse.Response == nil || !isFeasibleSolution(
			solveVRPResponse.Response.Solution,
			twData.availabilityVisitIDs,
		) {
			serviceDateAvailabilities = append(serviceDateAvailabilities, &logisticspb.ServiceDateAvailability{
				ServiceDate: date,
			})
			continue
		}

		visitsTWMap := twData.visitsTWMap
		shiftTeams := solveVRPResponse.Response.GetSolution().GetDescription().GetShiftTeams()
		var recommendedTW *common.TimeWindow
		for _, shiftTeam := range shiftTeams {
			stops := shiftTeam.GetRoute().GetStops()
			for _, stop := range stops {
				visit := stop.GetVisit()
				if visit != nil {
					visitID := visit.GetVisitId()
					twa, ok := visitsTWMap[visitID]
					if ok {
						twa.Status = logisticspb.TimeWindowAvailability_STATUS_AVAILABLE
						if visitID == recommendedTWVisitID {
							twa.Status = logisticspb.TimeWindowAvailability_STATUS_RECOMMENDED
							recommendedTW = recommendedTimeWindow(&recommendedTimeWindowParams{
								twDuration:        params.Duration,
								arrivalTimestamp:  time.Unix(visit.GetArrivalTimestampSec(), 0),
								earliestTimestamp: startTimestamp,
								latestTimestamp:   vrpData.OpenHoursTW.End,
							})
							twa.TimeWindow = recommendedTW
						}
					}
				}
			}
		}

		timeWindows := filteredTimeWindows(&filteredTWsParams{
			recommendedTW:        recommendedTW,
			availabilityVisitIDs: twData.availabilityVisitIDs,
			visitsTWMap:          visitsTWMap,
		})

		serviceDateAvailabilities = append(serviceDateAvailabilities, &logisticspb.ServiceDateAvailability{
			ServiceDate: date,
			TimeWindows: timeWindows,
		})
	}

	return serviceDateAvailabilities, nil
}

// ClampTime clamps timestamp to between min and max. If min/max are nil, then ignores the respective limit.
func ClampTime(timestamp time.Time, min, max *time.Time) time.Time {
	if min != nil && timestamp.Before(*min) {
		return *min
	}

	if max != nil && timestamp.After(*max) {
		return *max
	}

	return timestamp
}

type filteredTWsParams struct {
	recommendedTW        *common.TimeWindow
	availabilityVisitIDs []int64
	visitsTWMap          map[int64]*logisticspb.TimeWindowAvailability
}

func filteredTimeWindows(params *filteredTWsParams) []*logisticspb.TimeWindowAvailability {
	recommendedTW := params.recommendedTW
	var timeWindows []*logisticspb.TimeWindowAvailability
	for _, vid := range params.availabilityVisitIDs {
		twa, ok := params.visitsTWMap[vid]
		if ok &&
			recommendedTW != nil &&
			twa.Status != logisticspb.TimeWindowAvailability_STATUS_RECOMMENDED &&
			twa.TimeWindow.StartDatetime.Hours == recommendedTW.StartDatetime.Hours &&
			twa.TimeWindow.EndDatetime.Hours == recommendedTW.EndDatetime.Hours {
			continue
		}
		timeWindows = append(timeWindows, twa)
	}
	return timeWindows
}

func buildTWAvailabilitiesVRP(params *AvailabilitiesParams) (map[*common.Date]*availabilityVRP, error) {
	vrpDataByDate := params.VRPDataByDate
	limitEnd := params.LimitEnd
	twAvailabilitiesByDate := make(map[*common.Date]*availabilityVRP)
	for _, date := range params.ServiceDates {
		vrpData := vrpDataByDate[date]
		if vrpData == nil {
			continue
		}

		cfData := vrpData.CheckFeasibilityData
		if cfData == nil {
			continue
		}

		if len(cfData.Visits) != 1 {
			return nil, status.Errorf(codes.Internal,
				"exactly 1 visit is expected in check feasibility vrp data")
		}

		if len(cfData.LocIDs) != 1 {
			return nil, status.Errorf(codes.Internal,
				"exactly one location ID is expected in check feasibility vrp data")
		}

		dateStartTimestamp := ClampTime(params.StartTimestamp, &vrpData.OpenHoursTW.Start, nil)
		dateEndTimestamp := ClampTime(vrpData.OpenHoursTW.End, &vrpData.OpenHoursTW.Start, limitEnd)

		twDuration := params.Duration
		timeWindows := possibleTimeWindows(dateStartTimestamp, dateEndTimestamp, twDuration)
		templateVisit := cfData.Visits[0]
		locID := cfData.LocIDs[0]
		visitIDs := make([]int64, len(timeWindows))
		vrpInput := params.VRPInputByDate[date]
		twVisits := make([]*optimizerpb.VRPVisit, len(timeWindows))
		visitsTWMap := make(map[int64]*logisticspb.TimeWindowAvailability)
		for i, tw := range timeWindows {
			visitID := int64(-1 * (i + 1))
			visitIDs[i] = visitID
			vrpVisit, err := logisticsdb.VRPVisitFromCheckFeasibilityRequest(&logisticsdb.VRPVisitFromCFVisitParams{
				Visit:              templateVisit,
				FeasibilityVisitID: visitID,
				LocationID:         locID,
				OpenHoursTW:        *vrpData.OpenHoursTW,
				NowClamp:           vrpData.SnapshotTime,
			})
			if err != nil {
				return nil, fmt.Errorf("error in vrpVisitFromCheckFeasibilityRequest: %w", err)
			}

			vrpTW, err := logisticsdb.VRPTimeWindowFromTimeWindow(tw)
			if err != nil {
				return nil, err
			}

			vrpVisit.ArrivalTimeWindow = vrpTW
			vrpVisit.OverlapSetKey = proto.String(visitSetName)

			vrpInput.VRPRequest.Problem.Description.Visits = append(
				vrpInput.VRPRequest.Problem.Description.Visits,
				vrpVisit,
			)
			twVisits[i] = vrpVisit
			visitsTWMap[visitID] = &logisticspb.TimeWindowAvailability{
				TimeWindow: tw,
				Status:     logisticspb.TimeWindowAvailability_STATUS_UNAVAILABLE,
			}
		}

		vrpInput.VRPProblemData.FeasibilityVisitIDs = visitIDs

		twAvailabilitiesByDate[date] = &availabilityVRP{
			visits:               twVisits,
			availabilityVisitIDs: visitIDs,
			visitsTWMap:          visitsTWMap,
			solveVRPParams: &optimizer.SolveVRPParams{
				SolveVRPRequest:   vrpInput.VRPRequest,
				OptimizerRun:      vrpInput.OptimizerRun,
				OptimizerSettings: vrpInput.OptimizerSettings,
				OptimizerRunType:  logisticsdb.FeasibilityCheckRunType,
				WriteToDatabase:   true,
			},
		}
	}
	return twAvailabilitiesByDate, nil
}

func possibleTimeWindows(
	startTime time.Time,
	endTime time.Time,
	twDuration time.Duration,
) []*common.TimeWindow {
	startTime = startTime.Round(time.Hour).UTC()
	endTime = endTime.Round(time.Hour).UTC()
	initialRecommendedTW := &common.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
	}
	timeWindows := []*common.TimeWindow{
		initialRecommendedTW,
	}
	for currentTime := startTime; currentTime.Before(endTime); currentTime = currentTime.Add(time.Hour) {
		start := currentTime
		end := currentTime.Add(twDuration)
		if end.After(endTime) {
			break
		}
		timeWindows = append(timeWindows, &common.TimeWindow{
			StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
			EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
		})
	}

	return timeWindows
}

func isFeasibleSolution(vrpSolution *optimizerpb.VRPSolution, availabilityVisitIDs []int64) bool {
	score := vrpSolution.GetScore()
	if !score.GetIsValid() || score.GetHardScore() != 0 {
		return false
	}

	allowUnassignedVisitIDs := make(map[int64]struct{})
	for _, id := range availabilityVisitIDs {
		allowUnassignedVisitIDs[id] = struct{}{}
	}

	for _, uv := range vrpSolution.GetDescription().GetUnassignedVisits() {
		_, ok := allowUnassignedVisitIDs[*uv.VisitId]
		if !ok && !uv.GetPinned() {
			return false
		}
	}

	return true
}

type recommendedTimeWindowParams struct {
	twDuration        time.Duration
	arrivalTimestamp  time.Time
	earliestTimestamp time.Time
	latestTimestamp   time.Time
}

func recommendedTimeWindow(params *recommendedTimeWindowParams) *common.TimeWindow {
	twDuration := params.twDuration
	startTimestamp := params.arrivalTimestamp.Add(-1 * (twDuration / 2))
	earliestTimestamp := params.earliestTimestamp
	if startTimestamp.Before(earliestTimestamp) {
		startTimestamp = earliestTimestamp
	}

	endTimestamp := startTimestamp.Add(twDuration)
	latestTimestamp := params.latestTimestamp
	if endTimestamp.After(latestTimestamp) {
		endTimestamp = latestTimestamp
	}

	start := startTimestamp.Round(time.Hour).UTC()
	end := endTimestamp.Round(time.Hour).UTC()
	return &common.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&start),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&end),
	}
}

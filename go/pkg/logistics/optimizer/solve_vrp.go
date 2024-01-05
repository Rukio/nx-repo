package optimizer

import (
	"context"
	"errors"
	"io"
	"log"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	// TODO: Change this channel size to something more sane. Usually should use 1 to keep from blocking,
	// but this is a tradeoff of more capacity to make sure Optimizer isn't blocked.
	writeChanSize = 5

	logisticsRunErrorSourceID = 1
	optimizerRunErrorSourceID = 2

	SolveVRPUseTag             = "use"
	SolveVRPUseTagFeasibility  = "feasibility"
	SolveVRPUseTagSchedule     = "schedule"
	SolveVRPUseTagAvailability = "availability"
)

type ShiftTeamRoutePolyline struct {
	ShiftTeamID int64                   `json:"shift_team_id"`
	Polyline    logistics.RoutePolyline `json:"polyline"`
}

type WrappedSolveVRPResp struct {
	Response       *optimizerpb.SolveVRPResponse `json:"response"`
	RoutePolylines []ShiftTeamRoutePolyline      `json:"route_polylines"`
	OptimizerRunID int64                         `json:"optimizer_run_id"`
}

type SolveVRPLogisticsDB interface {
	AddOptimizerRun(context.Context, logisticssql.AddOptimizerRunParams, *optimizerpb.VRPConstraintConfig, *optimizersettings.Settings) (*logisticssql.OptimizerRun, error)
	WriteScheduleForVRPSolution(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error)
	AddOptimizerRunError(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error
}

func collectVisitIDsForPolyline(shiftTeam *optimizerpb.VRPShiftTeam) []int64 {
	var visitIDs []int64
	for _, stop := range shiftTeam.Route.Stops {
		switch stop.GetStop().(type) {
		case *optimizerpb.VRPShiftTeamRouteStop_Visit:
			visitIDs = append(visitIDs, stop.GetVisit().GetVisitId())
		case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
			// TODO: Include rest break stops when we care about it for dev visualization.
			continue
		default:
			log.Panic("unhandled VRPShiftTeamRouteStop type")
		}
	}
	return visitIDs
}

// VRPSolver solves a vehicle routing problem.
type VRPSolver struct {
	OptimizerServiceClient optimizerpb.OptimizerServiceClient
	SolveVRPLogisticsDB    SolveVRPLogisticsDB
	RouteProvider          RouteProvider
}

type RouteProvider interface {
	GetRoute(context.Context, monitoring.Tags, ...logistics.LatLng) (*logistics.Route, error)
}

type SolveVRPParams struct {
	SolveVRPRequest   *optimizerpb.SolveVRPRequest
	OptimizerRun      *logisticssql.OptimizerRun
	OptimizerSettings *optimizersettings.Settings
	OptimizerRunType  logisticsdb.OptimizerRunType
	WriteToDatabase   bool

	AvailabilityVisitIDMap logisticsdb.AvailabilityVisitIDMap
	UnassignedVisits       []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
}

// SolveVRP solves a vehicle routing problem, returning a channel of intermediary results.
func (s *VRPSolver) SolveVRP(ctx context.Context, solveVRPParams *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error) {
	var addRunParams logisticssql.AddOptimizerRunParams
	runParams := solveVRPParams.OptimizerRun
	if runParams != nil {
		addRunParams = logisticssql.AddOptimizerRunParams{
			ServiceRegionID:            runParams.ServiceRegionID,
			ServiceDate:                runParams.ServiceDate,
			OpenHoursScheduleDayID:     runParams.OpenHoursScheduleDayID,
			OpenHoursStartTimestampSec: runParams.OpenHoursStartTimestampSec,
			OpenHoursEndTimestampSec:   runParams.OpenHoursEndTimestampSec,
			EarliestDistanceTimestamp:  runParams.EarliestDistanceTimestamp,
			LatestDistanceTimestamp:    runParams.LatestDistanceTimestamp,
			SnapshotTimestamp:          runParams.SnapshotTimestamp,
			OptimizerConfigID:          runParams.OptimizerConfigID,
			ServiceVersion:             runParams.ServiceVersion,
			DistanceSourceID:           runParams.DistanceSourceID,
			OptimizerRunType:           string(solveVRPParams.OptimizerRunType),
		}
	}

	stream, err := s.OptimizerServiceClient.SolveVRP(ctx, solveVRPParams.SolveVRPRequest)
	if err != nil {
		return nil, err
	}

	var resultCollector *ResultCollector
	if s.SolveVRPLogisticsDB != nil && solveVRPParams.WriteToDatabase {
		resultCollector, err = newRun(
			ctx,
			s.SolveVRPLogisticsDB,
			addRunParams,
			solveVRPParams.SolveVRPRequest.GetConfig().GetConstraintConfig(),
			solveVRPParams.OptimizerSettings,
			AvailabilityParams{
				IDMap:            solveVRPParams.AvailabilityVisitIDMap,
				UnassignedVisits: solveVRPParams.UnassignedVisits,
			},
		)
		if err != nil {
			return nil, err
		}
	}

	respChan := make(chan *WrappedSolveVRPResp, 5)
	go func() {
		defer close(respChan)
		if resultCollector != nil {
			resultCollector.Start()
			defer resultCollector.Close()
		}

		for {
			resp, optimizerErr := stream.Recv()
			if errors.Is(optimizerErr, io.EOF) {
				break
			}
			if optimizerErr != nil {
				if resultCollector != nil {
					if err := resultCollector.ScheduleResultWriter.AddOptimizerRunError(ctx, logisticssql.AddOptimizerRunErrorParams{
						OptimizerRunID:            resultCollector.run.ID,
						ErrorValue:                optimizerErr.Error(),
						OptimizerRunErrorSourceID: optimizerRunErrorSourceID,
					}); err != nil {
						log.Println(err)
					}
				}
				log.Println(optimizerErr)
				break
			}

			respJSON := &WrappedSolveVRPResp{
				Response: resp,
			}

			if resultCollector != nil {
				respJSON.OptimizerRunID = resultCollector.run.ID
				resultCollector.AddResult(resp)
			}

			if s.RouteProvider != nil {
				tags := monitoring.Tags{
					serviceRegionTag: logisticsdb.I64ToA(runParams.ServiceRegionID),
					serviceDateTag:   runParams.ServiceDate.Format(dateLayout),
				}
				for _, shiftTeam := range resp.Solution.Description.ShiftTeams {
					if shiftTeam.Route == nil {
						continue
					}

					poly, err := getPolyline(
						ctx,
						tags,
						s.RouteProvider,
						resp.Solution.Description.Locations,
						resp.Solution.Description.Visits,
						shiftTeam.GetDepotLocationId(), collectVisitIDsForPolyline(shiftTeam)...)
					if err != nil {
						log.Println(err)
						continue
					}

					respJSON.RoutePolylines = append(respJSON.RoutePolylines, ShiftTeamRoutePolyline{
						ShiftTeamID: *shiftTeam.Id,
						Polyline:    poly,
					})
				}
			}

			respChan <- respJSON
		}
	}()

	return respChan, nil
}

func getPolyline(
	ctx context.Context,
	tags monitoring.Tags,
	routeProvider RouteProvider,
	locs []*optimizerpb.VRPLocation,
	visits []*optimizerpb.VRPVisit,
	depotLocationID int64,
	visitIDs ...int64,
) (logistics.RoutePolyline, error) {
	locIDLatLngs := map[int64]logistics.LatLng{}
	for _, loc := range locs {
		locIDLatLngs[*loc.Id] = logistics.LatLng{
			LatE6: *loc.LatitudeE6,
			LngE6: *loc.LongitudeE6,
		}
	}

	visitIDLatLngs := map[int64]logistics.LatLng{}
	for _, visit := range visits {
		visitIDLatLngs[*visit.Id] = locIDLatLngs[*visit.LocationId]
	}

	latLngs := make([]logistics.LatLng, len(visitIDs)+2)
	latLngs[0] = locIDLatLngs[depotLocationID]
	for i, visitID := range visitIDs {
		latLngs[i+1] = visitIDLatLngs[visitID]
	}
	latLngs[len(visitIDs)+1] = locIDLatLngs[depotLocationID]

	route, err := routeProvider.GetRoute(ctx, tags, latLngs...)
	if err != nil {
		return nil, err
	}
	return route.Polyline, nil
}

type AvailabilityParams struct {
	IDMap            logisticsdb.AvailabilityVisitIDMap
	UnassignedVisits []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
}

func newRun(
	ctx context.Context,
	ldb SolveVRPLogisticsDB,
	params logisticssql.AddOptimizerRunParams,
	config *optimizerpb.VRPConstraintConfig,
	settings *optimizersettings.Settings,
	availabilityParams AvailabilityParams,
) (*ResultCollector, error) {
	run, err := ldb.AddOptimizerRun(ctx, params, config, settings)
	if err != nil {
		return nil, err
	}

	writeChan := make(chan *optimizerpb.SolveVRPResponse, writeChanSize)

	collector := &ResultCollector{
		ctx:                  context.Background(), // TODO(https://github.com/*company-data-covered*/services/pull/2540#discussion_r1055798348) clean up the lifecycle management of the result collector.
		ScheduleResultWriter: ldb,
		writeChan:            writeChan,

		run:                    run,
		AvailabilityVisitIDMap: availabilityParams.IDMap,
		UnassignedVisits:       availabilityParams.UnassignedVisits,
	}

	return collector, nil
}

type ScheduleResultWriter interface {
	WriteScheduleForVRPSolution(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error)
	AddOptimizerRunError(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error
}

type ResultCollector struct {
	ctx       context.Context
	writeChan chan *optimizerpb.SolveVRPResponse

	run *logisticssql.OptimizerRun

	ScheduleResultWriter ScheduleResultWriter

	AvailabilityVisitIDMap logisticsdb.AvailabilityVisitIDMap
	UnassignedVisits       []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
}

func (c *ResultCollector) processWriteChan() {
	for resp := range c.writeChan {
		_, logisticsWriteError := c.writeResult(resp)
		if logisticsWriteError != nil {
			if err := c.ScheduleResultWriter.AddOptimizerRunError(c.ctx, logisticssql.AddOptimizerRunErrorParams{
				OptimizerRunID:            c.run.ID,
				ErrorValue:                logisticsWriteError.Error(),
				OptimizerRunErrorSourceID: logisticsRunErrorSourceID,
			}); err != nil {
				log.Println(err)
			}
			log.Println(logisticsWriteError)
		}
	}
}

func (c *ResultCollector) Start() {
	go c.processWriteChan()
}

func (c *ResultCollector) Close() {
	close(c.writeChan)
}

func (c *ResultCollector) AddResult(resp *optimizerpb.SolveVRPResponse) {
	c.writeChan <- resp
}

func (c *ResultCollector) writeResult(resp *optimizerpb.SolveVRPResponse) (*logisticssql.Schedule, error) {
	optimizerVersion := resp.GetOptimizerMetadata().GetVersion()
	params := &logisticsdb.WriteScheduleForVRPSolutionParams{
		ServiceRegionID:              c.run.ServiceRegionID,
		OptimizerRunID:               c.run.ID,
		OptimizerVersion:             optimizerVersion,
		Solution:                     resp.Solution,
		AvailabilityVisitIDMap:       c.AvailabilityVisitIDMap,
		LastScheduleUnassignedVisits: c.UnassignedVisits,
	}
	return c.ScheduleResultWriter.WriteScheduleForVRPSolution(c.ctx, params)
}

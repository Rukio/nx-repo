package logisticsdb

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/collections"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"google.golang.org/protobuf/proto"
)

type ServiceRegionVRPDataParams struct {
	ServiceRegionID           int64
	ServiceDate               time.Time
	HorizonDay                int
	ShiftTeamCapacitySettings []*optimizersettings.CapacitySettings

	CheckFeasibilityVisit *logisticspb.CheckFeasibilityVisit

	SnapshotTime time.Time
}

type ServiceRegionVRPData struct {
	ServiceRegionID int64
	ServiceDate     time.Time

	OpenHoursTW  *TimeWindow
	OpenHoursDay *logisticssql.ServiceRegionOpenHoursScheduleDay

	ShiftTeamSnapshots []*logisticssql.ShiftTeamSnapshot
	ShiftTeamAttrs     []*logisticssql.GetAttributesForShiftTeamSnapshotsRow
	VisitSnapshots     []*logisticssql.GetLatestVisitSnapshotsInRegionRow
	VisitAttrs         []*logisticssql.GetAttributesForVisitSnapshotsRow
	RestBreakRequests  []*logisticssql.ShiftTeamRestBreakRequest

	Locations        []*logisticssql.Location
	DepotLocationIDs *collections.LinkedSet[int64]

	PreviousUnassignedVisits []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow

	CheckFeasibilityData *CheckFeasibilityVRPDataResult

	Settings            *optimizersettings.Settings
	ShiftTeamCapacities []*ShiftTeamCapacity

	SnapshotTime time.Time
}

func (ldb *LogisticsDB) GetServiceRegionVRPData(
	ctx context.Context,
	params *ServiceRegionVRPDataParams,
) (*ServiceRegionVRPData, error) {
	queries := ldb.queries

	serviceRegionSettings, err := ldb.settingsService.ServiceRegionSettings(ctx, params.ServiceRegionID)
	if err != nil {
		return nil, err
	}

	snapshotTime := params.SnapshotTime
	previousRun, err := ldb.GetLatestOptimizerRunWithScheduleForRegionDate(ctx, logisticssql.GetLatestOptimizerRunWithScheduleForRegionDateParams{
		ServiceRegionID: params.ServiceRegionID,
		ServiceDate:     params.ServiceDate,
		CreatedBefore:   snapshotTime,
	})
	if err != nil && !errors.Is(err, ErrNoOptimizerRunForDate) {
		return nil, err
	}

	var checkFeasibilityVRPData *CheckFeasibilityVRPDataResult
	var vrpUnassignedVisits []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
	var previousSchedule *logisticssql.GetScheduleForIDRow
	if previousRun != nil && previousRun.ScheduleID > 0 {
		vrpUnassignedVisits, err = queries.GetUnassignedScheduleVisitsForScheduleID(ctx, logisticssql.GetUnassignedScheduleVisitsForScheduleIDParams{
			ScheduleID:         previousRun.ScheduleID,
			LatestSnapshotTime: params.SnapshotTime,
		})
		if err != nil {
			return nil, fmt.Errorf("error in GetUnassignedScheduleVisitsForScheduleID: %w", err)
		}

		previousSchedule, err = queries.GetScheduleForID(ctx, previousRun.ScheduleID)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("error in GetScheduleForID: %w", err)
		}
	}

	var cfLocIDs []int64
	isFeasibilityCheck := params.CheckFeasibilityVisit != nil
	if isFeasibilityCheck && previousSchedule != nil {
		checkFeasibilityVRPData, err = ldb.CheckFeasibilityVRPData(ctx, CheckFeasibilityVRPDataParams{
			Visit:    params.CheckFeasibilityVisit,
			Schedule: *previousSchedule,

			Settings: serviceRegionSettings,
		})
		if err != nil {
			return nil, fmt.Errorf("error in CheckFeasibilityVRPData: %w", err)
		}

		cfLocIDs = checkFeasibilityVRPData.LocIDs

		if serviceRegionSettings.FeasibilityCheckUseLastScheduleRun {
			snapshotTime = previousSchedule.CreatedAt
		}
	}

	openHoursTW, openHoursDay, err := ldb.GetServiceRegionOpenHoursForDate(ctx, GetServiceRegionOpenHoursForDateParams{
		Date:            params.ServiceDate,
		SnapshotTime:    snapshotTime,
		ServiceRegionID: params.ServiceRegionID,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetServiceRegionOpenHoursForDate: %w", err)
	}

	sinceSnapshotTime := snapshotTime.Add(-serviceRegionSettings.SnapshotsLookbackDuration())
	shiftTeams, err := queries.GetLatestShiftTeamSnapshotsInRegion(ctx, logisticssql.GetLatestShiftTeamSnapshotsInRegionParams{
		ServiceRegionID:    params.ServiceRegionID,
		StartTimestampSec:  openHoursTW.Start.Unix(),
		EndTimestampSec:    openHoursTW.End.Unix(),
		LatestSnapshotTime: snapshotTime,
		SinceSnapshotTime:  sinceSnapshotTime,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestShiftTeamSnapshotsInRegion: %w", err)
	}

	visits, err := queries.GetLatestVisitSnapshotsInRegion(ctx, logisticssql.GetLatestVisitSnapshotsInRegionParams{
		ServiceRegionID:    params.ServiceRegionID,
		StartTimestampSec:  sqltypes.ToValidNullInt64(openHoursTW.Start.Unix()),
		EndTimestampSec:    sqltypes.ToValidNullInt64(openHoursTW.End.Unix()),
		LatestSnapshotTime: snapshotTime,
		SinceSnapshotTime:  sinceSnapshotTime,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestVisitSnapshotsInRegion: %w", err)
	}

	if isFeasibilityCheck && previousSchedule != nil && serviceRegionSettings.FeasibilityGetUnscheduledVisits {
		visits, err = addUnscheduledVisits(ctx, addUnscheduledVisitsParams{
			serviceRegionID: params.ServiceRegionID,
			scheduleID:      previousRun.ScheduleID,
			openHoursTW:     openHoursTW,
			snapshotTime:    snapshotTime,
			queries:         ldb.queries,
			visits:          visits,
		})
		if err != nil {
			return nil, err
		}
	}

	shiftTeamSnapshotIDs := make([]int64, len(shiftTeams))
	for i, snapshot := range shiftTeams {
		shiftTeamSnapshotIDs[i] = snapshot.ID
	}
	visitSnapshotIDs := make([]int64, len(visits))
	for i, snapshot := range visits {
		visitSnapshotIDs[i] = snapshot.ID
	}

	shiftTeamAttrs, err := queries.GetAttributesForShiftTeamSnapshots(ctx, shiftTeamSnapshotIDs)
	if err != nil {
		return nil, fmt.Errorf("error in GetAttributesForShiftTeamSnapshots: %w", err)
	}
	visitAttrs, err := queries.GetAttributesForVisitSnapshots(ctx, visitSnapshotIDs)
	if err != nil {
		return nil, fmt.Errorf("error in GetAttributesForVisitSnapshots: %w", err)
	}

	restBreakRequests, err := queries.GetShiftTeamRestBreakRequestsForShiftTeams(
		ctx,
		logisticssql.GetShiftTeamRestBreakRequestsForShiftTeamsParams{
			ShiftTeamIds:  shiftTeamIDsFromSnapshots(shiftTeams),
			CreatedBefore: snapshotTime,
		})
	if err != nil {
		return nil, fmt.Errorf("error in GetShiftTeamRestBreakRequestsForShiftTeams: %w", err)
	}

	locs, depotLocIDs, err := ldb.VRPLocations(ctx, VRPLocationsParams{
		CheckFeasibilityLocIDs: cfLocIDs,
		RestBreakRequests:      restBreakRequests,
		ShiftTeamSnapshots:     shiftTeams,
		VisitSnapshots:         visits,
	})
	if err != nil {
		return nil, err
	}

	shiftTeamCapacities := ShiftTeamCapacitiesOnHorizonDayFromCapacitySettings(params.ShiftTeamCapacitySettings, params.HorizonDay)

	return &ServiceRegionVRPData{
		ServiceRegionID:          params.ServiceRegionID,
		ServiceDate:              params.ServiceDate,
		OpenHoursTW:              openHoursTW,
		OpenHoursDay:             openHoursDay,
		ShiftTeamSnapshots:       shiftTeams,
		VisitSnapshots:           visits,
		ShiftTeamAttrs:           shiftTeamAttrs,
		VisitAttrs:               visitAttrs,
		RestBreakRequests:        restBreakRequests,
		Locations:                locs,
		DepotLocationIDs:         depotLocIDs,
		PreviousUnassignedVisits: vrpUnassignedVisits,
		CheckFeasibilityData:     checkFeasibilityVRPData,
		Settings:                 serviceRegionSettings,
		SnapshotTime:             snapshotTime,
		ShiftTeamCapacities:      shiftTeamCapacities,
	}, nil
}

type addUnscheduledVisitsParams struct {
	serviceRegionID int64
	visits          []*logisticssql.GetLatestVisitSnapshotsInRegionRow

	scheduleID  int64
	openHoursTW *TimeWindow

	snapshotTime time.Time
	queries      *logisticssql.Queries
}

func addUnscheduledVisits(ctx context.Context, params addUnscheduledVisitsParams) ([]*logisticssql.GetLatestVisitSnapshotsInRegionRow, error) {
	now := time.Now()
	visits := params.visits
	latestVisits, err := params.queries.GetLatestVisitSnapshotsInRegion(ctx, logisticssql.GetLatestVisitSnapshotsInRegionParams{
		ServiceRegionID:    params.serviceRegionID,
		StartTimestampSec:  sqltypes.ToValidNullInt64(params.openHoursTW.Start.Unix()),
		EndTimestampSec:    sqltypes.ToValidNullInt64(params.openHoursTW.End.Unix()),
		LatestSnapshotTime: now,
		SinceSnapshotTime:  params.snapshotTime,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestVisitSnapshotsInRegionParams: %w", err)
	}

	careRequestsInPriorSchedule := make(map[int64]struct{})
	scheduledCareRequestIDs, err := params.queries.GetCareRequestIDsForSchedule(ctx, params.scheduleID)
	if err != nil {
		return nil, fmt.Errorf("error in GetCareRequestIDsForScheduleParams: %w", err)
	}

	for _, scheduledCareRequestID := range scheduledCareRequestIDs {
		careRequestsInPriorSchedule[scheduledCareRequestID] = struct{}{}
	}
	for _, visit := range latestVisits {
		_, present := careRequestsInPriorSchedule[visit.CareRequestID]
		if !present && visit.VisitPhaseTypeShortName == VisitPhaseTypeShortNameUncommitted.String() {
			visits = append(visits, visit)
		}
	}
	return visits, nil
}

type CheckFeasibilityVRPDataParams struct {
	Schedule logisticssql.GetScheduleForIDRow

	Visit *logisticspb.CheckFeasibilityVisit

	Settings *optimizersettings.Settings
}

type CheckFeasibilityVRPDataResult struct {
	Visits    []*logisticspb.CheckFeasibilityVisit
	LocIDs    []int64
	Durations VisitServiceDurations

	IsMarketLevel bool
	Diagnostics   *logisticspb.CheckFeasibilityDiagnostics
}

func (ldb *LogisticsDB) CheckFeasibilityVRPData(
	ctx context.Context,
	params CheckFeasibilityVRPDataParams) (*CheckFeasibilityVRPDataResult, error) {
	schedule := params.Schedule
	templateVisit := params.Visit
	durations, err := ldb.GetServiceRegionVisitServiceDurations(
		ctx,
		logisticssql.GetServiceRegionCanonicalVisitDurationsParams{
			ServiceRegionID: schedule.ServiceRegionID,
			CreatedBefore:   schedule.CreatedAt,
		})
	if err != nil {
		return nil, err
	}
	if templateVisit.ServiceDurationSec == nil {
		templateVisit.ServiceDurationSec = proto.Int64(int64(durations[MinVisitServiceDurationKey].Seconds()))
	}

	settings := params.Settings
	visits := []*logisticspb.CheckFeasibilityVisit{templateVisit}
	isMarketLevelAvailabilityCheck := templateVisit.GetCareRequestId() == 0
	useCanonicalVisits := (settings.MarketAvailabilityUseCanonicalLocationsVisits && isMarketLevelAvailabilityCheck) ||
		templateVisit.Location == nil
	if useCanonicalVisits {
		locations, err := ldb.GetServiceRegionCanonicalLocations(ctx, schedule.ServiceRegionID)
		if err != nil {
			return nil, err
		}
		if len(locations) < 1 {
			return nil, fmt.Errorf("no canonical locations found for service region")
		}

		visits = FeasibilityVisitsWithLocations(templateVisit, locations)
	}

	err = ldb.UpsertVisitLocations(ctx, visits)
	if err != nil {
		return nil, err
	}

	locations, err := ldb.GetVisitLocations(ctx, visits)
	if err != nil {
		return nil, err
	}

	locIDs := make([]int64, len(locations))
	for i, loc := range locations {
		locIDs[i] = loc.ID
	}

	checkFeasibilityDiagnostics := &logisticspb.CheckFeasibilityDiagnostics{
		OptimizerRunId:                       schedule.OptimizerRunID,
		ScheduleId:                           schedule.ID,
		LogisticsVersion:                     buildinfo.Version,
		OriginalOptimizerRunLogisticsVersion: schedule.LogisticsVersion,
		OriginalOptimizerRunOptimizerVersion: schedule.OptimizerVersion,
	}

	return &CheckFeasibilityVRPDataResult{
		Visits:    visits,
		LocIDs:    locIDs,
		Durations: durations,

		IsMarketLevel: isMarketLevelAvailabilityCheck,
		Diagnostics:   checkFeasibilityDiagnostics,
	}, nil
}

type VRPLocationsParams struct {
	CheckFeasibilityLocIDs []int64
	RestBreakRequests      []*logisticssql.ShiftTeamRestBreakRequest
	ShiftTeamSnapshots     []*logisticssql.ShiftTeamSnapshot
	VisitSnapshots         []*logisticssql.GetLatestVisitSnapshotsInRegionRow
}

func (ldb *LogisticsDB) VRPLocations(ctx context.Context, params VRPLocationsParams) ([]*logisticssql.Location, *collections.LinkedSet[int64], error) {
	shiftTeams := params.ShiftTeamSnapshots
	visits := params.VisitSnapshots
	restBreakRequests := params.RestBreakRequests
	checkFeasibilityLocIDs := params.CheckFeasibilityLocIDs

	allLocIDs := collections.NewLinkedInt64Set(len(shiftTeams) +
		len(checkFeasibilityLocIDs) +
		len(visits) +
		len(restBreakRequests))
	depotLocIDs := collections.NewLinkedInt64Set(len(shiftTeams))
	for _, shiftTeam := range shiftTeams {
		allLocIDs.Add(shiftTeam.BaseLocationID)
		depotLocIDs.Add(shiftTeam.BaseLocationID)
	}
	for _, visit := range visits {
		allLocIDs.Add(visit.LocationID)
	}
	for _, restBreakRequest := range restBreakRequests {
		allLocIDs.Add(restBreakRequest.LocationID)
	}

	allLocIDs.Add(checkFeasibilityLocIDs...)
	locs, err := ldb.GetLocationsByIDs(ctx, allLocIDs.Elems())
	if err != nil {
		return nil, nil, fmt.Errorf(getLocationsByIDsError, err)
	}

	return locs, depotLocIDs, nil
}

type VRPProblemParams struct {
	ServiceRegionVRPData       *ServiceRegionVRPData
	UseDistancesAfterTime      time.Time
	UnrequestedRestBreakConfig UnrequestedRestBreakConfig
	// ValidationConfig configures the behavior of functions that validate
	// (and possibly mutate) the problem just before it's returned to the caller.
	ValidationConfig validation.Config

	// Extra start-of-shift time before shift teams are expected to leave depots.
	ShiftTeamStartBufferSec int64
}

type VRPProblemData struct {
	VRPProblem   *optimizerpb.VRPProblem
	OptimizerRun *logisticssql.OptimizerRun

	// FeasibilityVisitIDs are visitIDs in the VRPProblem that represent hypothetical visits not currently in the market.
	FeasibilityVisitIDs         []int64
	CheckFeasibilityDiagnostics *logisticspb.CheckFeasibilityDiagnostics

	// EntityMappings are references from VRPProblem identifiers to Station identifiers.
	EntityMappings EntityMappings
}

func (ldb *LogisticsDB) CreateVRPProblem(ctx context.Context, params VRPProblemParams) (*VRPProblemData, error) {
	vrpData := params.ServiceRegionVRPData

	shiftTeams := vrpData.ShiftTeamSnapshots
	visits := vrpData.VisitSnapshots
	restBreakRequests := vrpData.RestBreakRequests
	var cfLocIDs []int64
	if vrpData.CheckFeasibilityData != nil {
		cfLocIDs = vrpData.CheckFeasibilityData.LocIDs
	}
	if len(shiftTeams)+len(visits)+len(cfLocIDs) == 0 {
		return nil, ErrEmptyVRPDescription
	}

	settings := vrpData.Settings

	vrpVisits, err := vrpVisitsForVisitSnapshots(vrpVisitsForVisitSnapshotsParams{
		visitSnapshots:             visits,
		attrs:                      vrpData.VisitAttrs,
		visitExtraSetupDurationSec: settings.VisitExtraSetupDurationSec,
		useVisitValue:              settings.UseVisitValue,
	})
	if err != nil {
		return nil, fmt.Errorf("error in vrpVisitsForVisitSnapshots: %w", err)
	}

	// TODO(MARK-2391): Investigate if this is really needed and removed if is not or just consume when check feasibility
	var previousRunVRPUnassignedVisits []*optimizerpb.VRPUnassignedVisit
	shouldPinUnassignedVisits := len(cfLocIDs) > 0
	for _, uv := range vrpData.PreviousUnassignedVisits {
		previousRunVRPUnassignedVisits = append(previousRunVRPUnassignedVisits, &optimizerpb.VRPUnassignedVisit{
			VisitId: proto.Int64(uv.VisitSnapshotID.Int64),
			Pinned:  proto.Bool(shouldPinUnassignedVisits),
		})
	}

	desc := descriptionWithoutShiftTeams{
		visits:           vrpVisits,
		unassignedVisits: previousRunVRPUnassignedVisits,
		restBreaks: restBreaksForRestBreakRequests(
			restBreakRequests,
			shiftTeams,
			params.UnrequestedRestBreakConfig,
			vrpData.SnapshotTime),
		latestSnapshotTime: vrpData.SnapshotTime,
	}
	reconciler, err := ldb.newSnapshotIDReconciler(ctx, desc)
	if err != nil {
		return nil, fmt.Errorf("error initializing reconciler: %w", err)
	}

	historian := &routeHistorian{
		snapshotIDReconciler: reconciler,
		shiftStartBufferSec:  params.ShiftTeamStartBufferSec,
	}
	vrpShiftTeams, err := historian.vrpShiftTeamsForSnapshots(shiftTeams, vrpData.ShiftTeamAttrs)
	if err != nil {
		return nil, fmt.Errorf("error constructing VRPShiftTeams: %w", err)
	}

	ApplyCapacityLimitationsToShiftTeams(vrpShiftTeams, vrpData.ShiftTeamCapacities)
	stopLocationIDsNotInRouteHistory, err := historian.locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments(vrpShiftTeams)
	if err != nil {
		return nil, fmt.Errorf("error determining locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments: %w", err)
	}
	planningStopLocIDs := collections.NewLinkedInt64Set(len(visits) +
		len(cfLocIDs) +
		len(restBreakRequests))
	planningStopLocIDs.Add(cfLocIDs...)
	planningStopLocIDs.Add(stopLocationIDsNotInRouteHistory...)

	routeHistoryPaths, tailLocationIDs, err := historian.routeHistoryPathDistanceReqsAndTailLocationIDs(vrpShiftTeams)
	if err != nil {
		return nil, fmt.Errorf("error computing route history required distances: %w", err)
	}

	dmReqs := buildDistanceMatrixReqs(buildDistanceMatrixReqsParams{
		routeHistoryPaths:  routeHistoryPaths,
		tailLocationIDs:    tailLocationIDs,
		planningStopLocIDs: planningStopLocIDs.Elems(),
		depotLocIDs:        vrpData.DepotLocationIDs.Elems(),
	})

	mapService, err := ldb.mapServicePicker.MapServiceForRegion(ctx, vrpData.ServiceRegionID)
	if err != nil {
		return nil, err
	}
	var otherMapServices []logistics.MapService
	if vrpData.Settings.FetchOtherMapServiceDistances {
		otherMapServices, err = ldb.mapServicePicker.OtherMapServicesForRegion(ctx, vrpData.ServiceRegionID)
		if err != nil {
			return nil, err
		}
	}

	matrix, distanceTW, err := ldb.GetDistanceMatrix(ctx, GetDistanceMatrixParams{
		Reqs:                dmReqs,
		MapService:          mapService,
		ResearchMapServices: otherMapServices,
		AfterCreatedAt:      params.UseDistancesAfterTime,
		MapsTags: &DistanceMatrixMapsTags{
			ServiceRegionID: vrpData.ServiceRegionID,
			ServiceDate:     vrpData.ServiceDate,
		},
		Settings: *vrpData.Settings,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetDistanceMatrix: %w", err)
	}

	optimizerRun := &logisticssql.OptimizerRun{
		ServiceRegionID:            vrpData.ServiceRegionID,
		ServiceDate:                vrpData.ServiceDate,
		OpenHoursScheduleDayID:     vrpData.OpenHoursDay.ID,
		OpenHoursStartTimestampSec: vrpData.OpenHoursTW.Start.Unix(),
		OpenHoursEndTimestampSec:   vrpData.OpenHoursTW.End.Unix(),
		EarliestDistanceTimestamp:  distanceTW.Start,
		LatestDistanceTimestamp:    distanceTW.End,
		SnapshotTimestamp:          vrpData.SnapshotTime,
		ServiceVersion:             buildinfo.Version,
		DistanceSourceID:           mapService.GetDistanceSourceID(),
	}
	reconciled, err := reconciler.Reconcile(&optimizerpb.VRPDescription{
		ShiftTeams:          vrpShiftTeams,
		RestBreaks:          desc.restBreaks.toVRPRestBreaks(),
		Visits:              desc.visits,
		Locations:           vrpLocsForLocs(vrpData.Locations),
		DistanceMatrix:      matrix,
		UnassignedVisits:    desc.unassignedVisits,
		CurrentTimestampSec: proto.Int64(vrpData.SnapshotTime.Unix()),
	})
	if err != nil {
		return nil, err
	}
	problem := &optimizerpb.VRPProblem{Description: reconciled}

	validator := validation.NewValidator(
		ldb.scope.With("", monitoring.Tags{serviceRegionTag: I64ToA(vrpData.ServiceRegionID)}, nil),
		params.ValidationConfig,
	)
	if err := validator.Validate(problem); err != nil {
		return nil, err
	}

	var checkFeasibilityDiagnostics *logisticspb.CheckFeasibilityDiagnostics
	if vrpData.CheckFeasibilityData != nil {
		checkFeasibilityDiagnostics = vrpData.CheckFeasibilityData.Diagnostics
	}

	return &VRPProblemData{
		VRPProblem:                  problem,
		OptimizerRun:                optimizerRun,
		CheckFeasibilityDiagnostics: checkFeasibilityDiagnostics,
		EntityMappings:              newEntityMappings(visits, shiftTeams),
	}, nil
}

func shiftTeamIDsFromSnapshots(sts []*logisticssql.ShiftTeamSnapshot) []int64 {
	res := make([]int64, len(sts))
	for i, st := range sts {
		res[i] = st.ShiftTeamID
	}
	return res
}

type vrpVisitsForVisitSnapshotsParams struct {
	visitSnapshots             []*logisticssql.GetLatestVisitSnapshotsInRegionRow
	attrs                      []*logisticssql.GetAttributesForVisitSnapshotsRow
	visitExtraSetupDurationSec int64
	useVisitValue              bool
}

func vrpVisitsForVisitSnapshots(params vrpVisitsForVisitSnapshotsParams) ([]*optimizerpb.VRPVisit, error) {
	snapshotRequiredAttrs := map[int64][]*optimizerpb.VRPAttribute{}
	snapshotForbiddenAttrs := map[int64][]*optimizerpb.VRPAttribute{}
	snapshotPreferredAttrs := map[int64][]*optimizerpb.VRPAttribute{}
	snapshotUnwantedAttrs := map[int64][]*optimizerpb.VRPAttribute{}

	for _, attr := range params.attrs {
		if attr.IsRequired {
			snapshotRequiredAttrs[attr.VisitSnapshotID] = append(snapshotRequiredAttrs[attr.VisitSnapshotID], &optimizerpb.VRPAttribute{Id: attr.Name})
		}
		if attr.IsForbidden {
			snapshotForbiddenAttrs[attr.VisitSnapshotID] = append(snapshotForbiddenAttrs[attr.VisitSnapshotID], &optimizerpb.VRPAttribute{Id: attr.Name})
		}
		if attr.IsPreferred {
			snapshotPreferredAttrs[attr.VisitSnapshotID] = append(snapshotPreferredAttrs[attr.VisitSnapshotID], &optimizerpb.VRPAttribute{Id: attr.Name})
		}
		if attr.IsUnwanted.Valid && attr.IsUnwanted.Bool {
			snapshotUnwantedAttrs[attr.VisitSnapshotID] = append(snapshotUnwantedAttrs[attr.VisitSnapshotID], &optimizerpb.VRPAttribute{Id: attr.Name})
		}
	}

	vrpVisits := make([]*optimizerpb.VRPVisit, len(params.visitSnapshots))
	for i, snapshot := range params.visitSnapshots {
		start := snapshot.ArrivalStartTimestampSec
		end := snapshot.ArrivalEndTimestampSec
		if !start.Valid || !end.Valid {
			return nil, fmt.Errorf("invalid snapshot without arrival window cannot be put in schedule: %d", snapshot.ID)
		}

		var optimizerRequiredAttrs = snapshotRequiredAttrs[snapshot.ID]
		var optimizerForbiddenAttrs = snapshotForbiddenAttrs[snapshot.ID]
		if !snapshot.IsManualOverride {
			// we put preferred attributes into required when not manually overridden. The preferred
			// vs required distinction is only important for which attributes are "allowed" to be overridden.
			optimizerRequiredAttrs = append(optimizerRequiredAttrs, snapshotPreferredAttrs[snapshot.ID]...)
			optimizerForbiddenAttrs = append(optimizerForbiddenAttrs, snapshotUnwantedAttrs[snapshot.ID]...)
		}

		// all VRPVisits have acuity, but don't require a time window
		visitAcuity := &optimizerpb.VRPVisitAcuity{Level: proto.Int64(DefaultOptimizerAcuityLevel)}
		if snapshot.OptimizerUrgencyLevel.Valid {
			visitAcuity.Level = proto.Int64(snapshot.OptimizerUrgencyLevel.Int64)
			if snapshot.ClinicalWindowDurationSec.Valid {
				acuityWindowEnd := start.Int64 + snapshot.ClinicalWindowDurationSec.Int64
				visitAcuity.TimeWindow = &optimizerpb.VRPTimeWindow{
					StartTimestampSec: proto.Int64(start.Int64),
					EndTimestampSec:   proto.Int64(acuityWindowEnd),
				}
			}
		}

		var visitValue *optimizerpb.VRPVisitValue
		if params.useVisitValue {
			visitValue = vrpVisitValue(snapshot.CompletionValueCents, snapshot.PartnerPriorityScore, snapshot.PartnerInfluencedCompletionValueCents)
		}

		vrpVisits[i] = &optimizerpb.VRPVisit{
			Id:         &snapshot.ID,
			LocationId: &snapshot.LocationID,
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: &start.Int64,
				EndTimestampSec:   &end.Int64,
			},
			ServiceDurationSec:    &snapshot.ServiceDurationSec,
			RequiredAttributes:    optimizerRequiredAttrs,
			ForbiddenAttributes:   optimizerForbiddenAttrs,
			Acuity:                visitAcuity,
			Priority:              vrpPriority(snapshot.IsPrioritized),
			Value:                 visitValue,
			ExtraSetupDurationSec: proto.Int64(params.visitExtraSetupDurationSec),
		}
	}
	return vrpVisits, nil
}

func vrpPriority(isPrioritized bool) *optimizerpb.VRPVisitPriority {
	if !isPrioritized {
		return nil
	}
	// NOTE: Higher (non-zero) priority levels represent "more urgent".
	// Thus, when we add prioritiy-level to the care request priority, be sure
	// to keep that invariant at least within the logistics+optimizer systems.
	return &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(1)}
}

func vrpVisitValue(completionValueCents, partnerPriorityScore sql.NullInt64, partnerInfluencedCompletionValueCents sql.NullInt64) *optimizerpb.VRPVisitValue {
	var vrpCompletionValueCents, vrpPartnerPriorityScore *int64

	if partnerInfluencedCompletionValueCents.Valid {
		vrpCompletionValueCents = &partnerInfluencedCompletionValueCents.Int64
	} else if completionValueCents.Valid {
		vrpCompletionValueCents = &completionValueCents.Int64
	}
	if partnerPriorityScore.Valid {
		vrpPartnerPriorityScore = &partnerPriorityScore.Int64
	}

	return &optimizerpb.VRPVisitValue{
		CompletionValueCents: vrpCompletionValueCents,
		PartnerPriorityScore: vrpPartnerPriorityScore,
	}
}

func vrpLocsForLocs(locs []*logisticssql.Location) []*optimizerpb.VRPLocation {
	vrpLocs := make([]*optimizerpb.VRPLocation, len(locs))
	for i, loc := range locs {
		vrpLocs[i] = &optimizerpb.VRPLocation{
			Id:          &loc.ID,
			LatitudeE6:  &loc.LatitudeE6,
			LongitudeE6: &loc.LongitudeE6,
		}
	}

	return vrpLocs
}

func newEntityMappings(visits []*logisticssql.GetLatestVisitSnapshotsInRegionRow, shiftTeams []*logisticssql.ShiftTeamSnapshot) EntityMappings {
	em := EntityMappings{
		CareRequests: make(map[VisitSnapshotID]CareRequestID, len(visits)),
		ShiftTeams:   make(map[ShiftTeamSnapshotID]ShiftTeamID, len(shiftTeams)),
	}
	for _, v := range visits {
		em.CareRequests[VisitSnapshotID(v.ID)] = CareRequestID(v.CareRequestID)
	}
	for _, st := range shiftTeams {
		em.ShiftTeams[ShiftTeamSnapshotID(st.ID)] = ShiftTeamID(st.ShiftTeamID)
	}
	return em
}

func FeasibilityVisitsWithLocations(
	templateVisit *logisticspb.CheckFeasibilityVisit,
	locations []*logisticssql.Location,
) []*logisticspb.CheckFeasibilityVisit {
	var visits []*logisticspb.CheckFeasibilityVisit

	for _, location := range locations {
		visit := proto.Clone(templateVisit).(*logisticspb.CheckFeasibilityVisit)
		visit.Location = &common.Location{
			LatitudeE6:  location.LatitudeE6,
			LongitudeE6: location.LongitudeE6,
		}
		visits = append(visits, visit)
	}

	return visits
}

func (ldb *LogisticsDB) VRPAvailabilityVisitsForScheduleID(
	ctx context.Context,
	scheduleID,
	extraSetupDurationSec int64,
	openHoursTW *TimeWindow,
) ([]*optimizerpb.VRPVisit, error) {
	availabilityVisits, err := ldb.availabilityVisitsForSchedule(ctx, scheduleID)
	if err != nil {
		return nil, err
	}

	visitIDs := make([]int64, len(availabilityVisits))
	for i, visit := range availabilityVisits {
		visitIDs[i] = visit.ID
	}
	attrsGroupByVisitID, err := ldb.GetAvailabilityAttributesByVisitID(ctx, visitIDs)
	if err != nil {
		return nil, err
	}

	vrpVisits, _ := BuildAvailabilityVRPVisits(BuildAvailabilityVRPVisitsParams{
		Visits:                availabilityVisits,
		AttrsGroupByVisitID:   attrsGroupByVisitID,
		ExtraSetupDurationSec: extraSetupDurationSec,
		OpenHoursTW:           openHoursTW,
		ExpendableVisits:      true,
	})
	return vrpVisits, nil
}

func (ldb *LogisticsDB) availabilityVisitsForSchedule(ctx context.Context, scheduleID int64) ([]*logisticssql.ServiceRegionAvailabilityVisit, error) {
	assignedVisits, err := ldb.queries.GetAssignedAvailabilityVisitsForScheduleID(ctx, scheduleID)
	if err != nil {
		return nil, err
	}

	unassignedVisits, err := ldb.queries.GetUnassignedAvailabilityVisitsForScheduleID(ctx, scheduleID)
	if err != nil {
		return nil, err
	}

	var visits []*logisticssql.ServiceRegionAvailabilityVisit
	visits = append(visits, assignedVisits...)
	visits = append(visits, unassignedVisits...)

	return visits, nil
}

type BuildAvailabilityVRPVisitsParams struct {
	Visits                []*logisticssql.ServiceRegionAvailabilityVisit
	AttrsGroupByVisitID   map[int64][]*logisticssql.Attribute
	OpenHoursTW           *TimeWindow
	ExtraSetupDurationSec int64
	ExpendableVisits      bool
}

func BuildAvailabilityVRPVisits(params BuildAvailabilityVRPVisitsParams) ([]*optimizerpb.VRPVisit, AvailabilityVisitIDMap) {
	var vrpAvailabilityVisits []*optimizerpb.VRPVisit
	availabilityVisitIDMap := make(AvailabilityVisitIDMap)
	for _, visit := range params.Visits {
		visitID := visit.ID
		availabilityVisitID := visitID * -1
		availabilityVisitIDMap[availabilityVisitID] = visitID
		acuity := &optimizerpb.VRPVisitAcuity{Level: proto.Int64(DefaultOptimizerAcuityLevel)}
		serviceDurationSec := visit.ServiceDurationSec
		arrivalTimeWindow := &optimizerpb.VRPTimeWindow{
			StartTimestampSec: proto.Int64(params.OpenHoursTW.Start.Unix()),
			EndTimestampSec:   proto.Int64(params.OpenHoursTW.End.Unix()),
		}
		var requiredAttrs []*optimizerpb.VRPAttribute
		for _, attr := range params.AttrsGroupByVisitID[visitID] {
			requiredAttrs = append(requiredAttrs, &optimizerpb.VRPAttribute{Id: attr.Name})
		}
		overlapSetKey := I64ToA(visit.ServiceRegionAvailabilityVisitSetID)

		vrpAvailabilityVisits = append(vrpAvailabilityVisits, &optimizerpb.VRPVisit{
			Id:                    proto.Int64(availabilityVisitID),
			Acuity:                acuity,
			ArrivalTimeWindow:     arrivalTimeWindow,
			ServiceDurationSec:    proto.Int64(serviceDurationSec),
			ExtraSetupDurationSec: proto.Int64(params.ExtraSetupDurationSec),
			RequiredAttributes:    requiredAttrs,
			LocationId:            proto.Int64(visit.LocationID),
			OverlapSetKey:         proto.String(overlapSetKey),
			IsExpendable:          proto.Bool(params.ExpendableVisits),
		})
	}

	return vrpAvailabilityVisits, availabilityVisitIDMap
}

func AddAvailabilityVisitsToProblem(problem *VRPProblemData, vrpAvailabilityVisits []*optimizerpb.VRPVisit) (*VRPProblemData, error) {
	vrpVisits := problem.VRPProblem.GetDescription().GetVisits()
	for _, visit := range vrpVisits {
		if visit.Priority == nil {
			visit.Priority = &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(1)}
			continue
		}
		level := visit.Priority.GetUnassignedPriorityLevel()
		if level > 9 {
			return nil, fmt.Errorf("visit id %d has invalid unassigned priority over 9", visit.Id)
		}
		if level < 9 {
			visit.Priority.UnassignedPriorityLevel = proto.Uint32(level + uint32(1))
		}
	}
	vrpVisits = append(vrpVisits, vrpAvailabilityVisits...)
	problem.VRPProblem.Description.Visits = vrpVisits

	var vrpAvailabilityVisitIDs []int64
	for _, availVisit := range vrpAvailabilityVisits {
		vrpAvailabilityVisitIDs = append(vrpAvailabilityVisitIDs, availVisit.GetId())
	}
	problem.FeasibilityVisitIDs = vrpAvailabilityVisitIDs

	return problem, nil
}

package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/collections"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/attributes"
	"github.com/*company-data-covered*/services/go/pkg/logistics/checkfeasibility"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/logistics/timewindowavailability"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	oldestDistanceAge = 4 * time.Hour

	defaultFeasibilityVRPTerminationDuration = 1 * time.Second

	requestedStatusName = "requested"

	defaultTWDuration = 4 * time.Hour
)

const (
	marketTag               = "market"
	isManualOverrideTag     = "is_manual_override"
	careRequestStatusTag    = "care_request_status"
	visitPhaseSourceTypeTag = "visit_phase_source_type"
	serviceRegionTag        = "service_region"
	serviceDateTag          = "service_date"
	feasibilityTag          = "feasibility"
	etaPrecisionTag         = "eta_precision"
	visitPhaseTag           = "visit_phase"

	unknownServiceDateStr            = "unknown"
	serviceRegionNotFoundForMarketID = "service region not found for market id: %s"
	couldNotDetermineDateForVisit    = "could not determine date for visit: %s"

	optimizerRequestsField  = "optimizer_requests"
	numShiftTeamsField      = "shift_teams"
	numVisitsField          = "visits"
	unassignedVisitsField   = "unassigned_visits"
	pendingRestBreaksField  = "pending_rest_breaks"
	shiftTeamsField         = "shift_teams"
	lastOptimizerRunIDField = "last_optimizer_run_id"
	dateLayout              = "2006-01-02"

	statsigErrorTemplate         = "%s statsig error: %w"
	settingsServiceErrorTemplate = "settings service error: %s"
)

var (
	diagnosticsErrorSourceMapping = map[int64]logisticspb.GetOptimizerRunDiagnosticsResponse_Error_Source{
		0: logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_UNSPECIFIED,
		1: logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_LOGISTICS,
		2: logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_OPTIMIZER,
	}
	passthroughErrorCodes = []codes.Code{
		codes.Unavailable,
		codes.Canceled,
		codes.Aborted,
		codes.DeadlineExceeded,
	}
	assignableVisitFilterStatuses = map[optimizerpb.AssignableStatus]bool{
		optimizerpb.AssignableStatus_ASSIGNABLE_STATUS_ASSIGNABLE:          true,
		optimizerpb.AssignableStatus_ASSIGNABLE_STATUS_OVERRIDE_ASSIGNABLE: true,
	}
)

type Clock interface {
	Now() time.Time
}

// LogisticsDB demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type LogisticsDB interface {
	WriteVisitSnapshot(context.Context, int64, *episodepb.GetVisitResponse) (*logisticssql.VisitSnapshot, error)
	GetServiceRegionOpenHoursForDate(context.Context, logisticsdb.GetServiceRegionOpenHoursForDateParams) (*logisticsdb.TimeWindow, *logisticssql.ServiceRegionOpenHoursScheduleDay, error)
	GetVRPShiftTeamsFromScheduleID(context.Context, int64, time.Time) ([]*optimizerpb.VRPShiftTeam, error)
	GetOptimizerRunDiagnostics(context.Context, int64, *logisticspb.CheckFeasibilityRequest, []int64) (*logisticsdb.OptimizerRunDiagnostics, error)
	CreateVRPProblem(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error)
	AttachCheckFeasibilityRequestToProblem(problem *logisticsdb.VRPProblemData, cfVisits []*logisticspb.CheckFeasibilityVisit, cfLocIDs []int64) (*logisticsdb.VRPProblemData, error)
	GetLatestCareRequestsDataForDiagnostics(ctx context.Context, careRequestIDs []int64, createdBefore time.Time) ([]*logisticsdb.CareRequestDiagnostics, error)
	GetCheckFeasibilityCareRequestHistory(ctx context.Context, id int64) ([]*logisticspb.CheckFeasibilityCareRequestDiagnostic, error)
	UpsertVisitLocations(context.Context, []*logisticspb.CheckFeasibilityVisit) error
	GetVisitLocations(context.Context, []*logisticspb.CheckFeasibilityVisit) ([]*logisticssql.Location, error)
	WriteShiftTeamSnapshot(context.Context, int64, *shiftteampb.GetShiftTeamResponse) (*logisticssql.ShiftTeamSnapshot, error)
	HasAnyNewInfoInRegionSince(context.Context, logisticsdb.NewInfoParams) (bool, error)
	GetServiceRegionByID(context.Context, int64) (*logisticssql.ServiceRegion, error)
	GetServiceRegionVisitServiceDurations(ctx context.Context, params logisticssql.GetServiceRegionCanonicalVisitDurationsParams) (logisticsdb.VisitServiceDurations, error)
	UpdateServiceRegionFeasibilityCheckSettings(ctx context.Context, settingsParams logisticsdb.UpdateServiceRegionFeasibilityCheckSettingsParams) ([]*logisticssql.Location, error)
	GetServiceRegionCanonicalLocations(context.Context, int64) ([]*logisticssql.Location, error)
	GetServiceRegionForStationMarketID(context.Context, int64) (*logisticssql.ServiceRegion, error)
	GetMarketForStationMarketID(ctx context.Context, stationMarketID int64) (*logisticssql.Market, error)
	GetLatestShiftTeamSnapshotID(context.Context, time.Time, int64) (*logisticsdb.ShiftTeamSnapshotIDResponse, error)
	UpdateShiftTeamLocation(context.Context, time.Time, int64, logistics.LatLng) (*logisticsdb.UpdateShiftTeamLocationResponse, error)
	DeleteVisitSnapshotForCareRequestID(context.Context, int64) (*logisticsdb.DeleteVisitSnapshotForCareRequestIDResponse, error)
	UpsertMarketAndServiceRegionFromStationMarket(context.Context, *marketpb.Market) error
	GetOpenHoursScheduleForServiceRegion(ctx context.Context, serviceRegionID int64, beforeCreatedAt time.Time) ([]*common.ScheduleDay, error)
	GetLatestShiftTeamSnapshotsInRegion(context.Context, int64, time.Time, time.Time, time.Time) ([]*logisticssql.ShiftTeamSnapshot, error)
	GetLatestShiftTeamSchedulesInServiceRegion(context.Context, int64, time.Time, bool) (*logisticsdb.LatestShiftTeamSchedulesResponse, error)
	GetLatestShiftTeamSchedule(context.Context, int64, logisticsdb.TimeWindow) (*logisticsdb.ShiftTeamSchedule, error)
	GetLatestInfoForCareRequest(context.Context, int64, time.Time) (*logisticsdb.CareRequestLatestInfo, error)
	GetLatestShiftTeamLocationID(context.Context, int64, time.Time) (int64, error)
	AddShiftTeamRestBreakRequest(context.Context, logisticsdb.AddShiftTeamRestBreakParams) (*logisticsdb.AddShiftTeamRestBreakResponse, error)
	GetAssignableShiftTeamCandidatesForDate(ctx context.Context, params logisticsdb.GetAssignableShiftTeamCandidatesForDateParams) ([]*optimizerpb.AssignableShiftTeam, error)
	AddServiceRegionAvailabilityQuery(ctx context.Context, params *logisticsdb.ServiceRegionAvailabilityQueryParams) (*logisticssql.ServiceRegionAvailabilityQuery, error)
	AddCheckFeasibilityQuery(ctx context.Context, params logisticsdb.CheckFeasibilityQueryParams) (*logisticssql.CheckFeasibilityQuery, error)
	GetCheckFeasibilityQueriesForCareRequest(ctx context.Context, careRequestID int64) ([]*logisticsdb.CheckFeasibilityQueryData, error)
	GetAssignableVisitsForDate(ctx context.Context, params logisticsdb.GetAssignableVisitsForDateParams) ([]*optimizerpb.AssignableVisit, error)
	GetShiftTeamsSchedulesFromScheduleID(ctx context.Context, scheduleID int64, latestTimestamp time.Time, includeDebug bool) (*logisticsdb.ScheduleAndDebugScore, error)
	VisitArrivalTimestampsForSchedule(ctx context.Context, scheduleID int64) (map[int64]time.Time, error)
	VRPProblemDataForSchedule(ctx context.Context, scheduleID int64) (*logisticsdb.VRPProblemData, error)
	GetServiceRegionVRPData(ctx context.Context, params *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error)
	ServiceRegionAvailability(ctx context.Context, params logisticsdb.ServiceRegionAvailabilityParams) (*logisticsdb.ServiceRegionAvailability, error)
	AddServiceRegionAvailabilityQueries(ctx context.Context, params logisticssql.AddServiceRegionAvailabilityQueriesParams) ([]*logisticssql.ServiceRegionAvailabilityQuery, error)
	AddServiceRegionAvailabilityQueryAttributes(ctx context.Context, availabilityQueries []*logisticssql.ServiceRegionAvailabilityQuery, attributeNames []string) ([]*logisticssql.ServiceRegionAvailabilityQueryAttribute, error)
}

// a compile-time assertion that our assumed implementation satisfies the above interface.
var _ LogisticsDB = (*logisticsdb.LogisticsDB)(nil)

type GRPCServerConfig struct {
	MaxRestBreaksPerShiftTeamPerDay   int64
	EnableCheckFeasibilityDiagnostics bool
}

type GRPCServer struct {
	logisticspb.UnimplementedLogisticsServiceServer
	ShiftTeamService shiftteampb.ShiftTeamServiceClient
	MarketService    marketpb.MarketServiceClient
	EpisodeService   episodepb.EpisodeServiceClient
	OptimizerService optimizerpb.OptimizerServiceClient
	VRPSolver        checkfeasibility.VRPSolver
	LogisticsDB      LogisticsDB
	LockDB           logisticsdb.Lock
	MapServicePicker *logistics.MapServicePicker
	SettingsService  optimizersettings.Service
	StatsigProvider  *providers.StatsigProvider

	// Cfg is required, and configures rpc-specific logic.
	Cfg GRPCServerConfig

	// Clock for mocking in tests. Nil clock will use the system clock.
	Clock Clock
}

func (s *GRPCServer) Validate() error {
	return s.Cfg.Validate()
}

func (cfg *GRPCServerConfig) Validate() error {
	if cfg.MaxRestBreaksPerShiftTeamPerDay <= 0 {
		return errors.New("invalid MaxRestBreaksPerShiftTeamPerDay")
	}
	return nil
}

func (s *GRPCServer) now() time.Time {
	if s.Clock != nil {
		return s.Clock.Now()
	}

	return time.Now()
}

var (
	errMarketIDRequired = status.Errorf(codes.InvalidArgument, "market id required")
)

// grpcError allows for less awkward construction of threading errors through multiple levels of the call stack.
// For example, a method might know that it can return an InvalidArgument based on some condition, but
// when that error is bubbled up to the handler level -- that information is lost.
func grpcError(err error, msgHeader string, defaultCode codes.Code) error {
	if s, ok := status.FromError(err); ok {
		return status.Errorf(s.Code(), "%s: %v", msgHeader, err)
	}
	return status.Errorf(defaultCode, "%s: %v", msgHeader, err)
}

func (s *GRPCServer) UpdateShiftTeamLoc(
	ctx context.Context,
	req *logisticspb.UpdateShiftTeamLocRequest,
) (*logisticspb.UpdateShiftTeamLocResponse, error) {
	loc := req.Location

	updateLocation, err := s.LogisticsDB.UpdateShiftTeamLocation(ctx, s.now(), req.ShiftTeamId, logistics.LatLng{
		LatE6: loc.LatitudeE6,
		LngE6: loc.LongitudeE6,
	})
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownShiftTeam) {
			return nil, status.Errorf(codes.NotFound, "Unknown shift team %d: %v", req.ShiftTeamId, err)
		}
		return nil, status.Errorf(codes.Internal, "Unable to update location: %v", err)
	}
	monitoring.AddGRPCTag(ctx, serviceRegionTag, logisticsdb.I64ToA(*updateLocation.ServiceRegionID))
	return &logisticspb.UpdateShiftTeamLocResponse{}, nil
}

func (s *GRPCServer) addRestBreakParamsFromOnDemand(ctx context.Context, restBreak *logisticspb.ShiftTeamRestBreakRequest) (logisticssql.AddShiftTeamRestBreakRequestParams, error) {
	var noResult logisticssql.AddShiftTeamRestBreakRequestParams
	od := restBreak.GetOnDemand()
	startTimestampSec := s.now().Unix()
	durationSec := od.GetDurationSec()
	if durationSec == 0 {
		return noResult,
			status.Error(codes.InvalidArgument, "durationSec must be set for ShiftTeamBreakRequest.OnDemand")
	}

	latestLocationID, err := s.LogisticsDB.GetLatestShiftTeamLocationID(ctx, restBreak.ShiftTeamId, s.now())
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownShiftTeam) {
			return noResult,
				status.Errorf(codes.FailedPrecondition, "unknown shift team: %d", restBreak.ShiftTeamId)
		}
		if errors.Is(err, logisticsdb.ErrNoShiftTeamLocation) {
			return noResult,
				status.Errorf(codes.FailedPrecondition, "no known location for shift team: %d", restBreak.ShiftTeamId)
		}
		return noResult, err
	}
	return logisticssql.AddShiftTeamRestBreakRequestParams{
		ShiftTeamID:          restBreak.ShiftTeamId,
		StartTimestampSec:    startTimestampSec,
		DurationSec:          durationSec,
		LocationID:           latestLocationID,
		MaxRestBreakRequests: s.Cfg.MaxRestBreaksPerShiftTeamPerDay,
	}, nil
}

func (s *GRPCServer) RequestShiftTeamRestBreak(
	ctx context.Context,
	req *logisticspb.RequestShiftTeamRestBreakRequest,
) (*logisticspb.RequestShiftTeamRestBreakResponse, error) {
	restBreak := req.GetRestBreak()
	shiftTeamID := restBreak.ShiftTeamId
	if shiftTeamID == 0 {
		return nil,
			status.Error(codes.InvalidArgument, "shiftTeamID must be set for RequestShiftTeamRestBreakRequest")
	}
	if restBreak.BreakType == nil {
		return nil,
			status.Errorf(codes.InvalidArgument, "break type must be set for RequestShiftTeamRestBreakRequest")
	}

	var restBreakParams logisticssql.AddShiftTeamRestBreakRequestParams
	var err error
	switch restBreak.BreakType.(type) {
	case *logisticspb.ShiftTeamRestBreakRequest_OnDemand:
		restBreakParams, err = s.addRestBreakParamsFromOnDemand(ctx, restBreak)
		if err != nil {
			return nil, grpcError(err, "error adding on demand shift team rest break", codes.Internal)
		}
	default:
		return nil, status.Errorf(codes.Unimplemented, "unhandled break type")
	}

	restBreakData, err := s.LogisticsDB.AddShiftTeamRestBreakRequest(
		ctx,
		logisticsdb.AddShiftTeamRestBreakParams{
			RestBreakParams: restBreakParams,
			LatestTimestamp: s.now(),
		},
	)
	if err != nil {
		return nil, grpcError(err, "error adding shift team break", codes.Internal)
	}

	monitoring.AddGRPCTag(ctx, serviceRegionTag, logisticsdb.I64ToA(restBreakData.ServiceRegionID))
	return &logisticspb.RequestShiftTeamRestBreakResponse{}, nil
}

func diagnosticsErrorSource(sourceID int64) (logisticspb.GetOptimizerRunDiagnosticsResponse_Error_Source, error) {
	val, ok := diagnosticsErrorSourceMapping[sourceID]
	if !ok {
		return logisticspb.GetOptimizerRunDiagnosticsResponse_Error_SOURCE_UNSPECIFIED,
			fmt.Errorf("unknown sourceID: %d", sourceID)
	}
	return val, nil
}

func (s *GRPCServer) GetCareRequestsDiagnostics(
	ctx context.Context,
	req *logisticspb.GetCareRequestsDiagnosticsRequest,
) (*logisticspb.GetCareRequestsDiagnosticsResponse, error) {
	if len(req.CareRequestIds) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "at least one care request id is required")
	}
	hasDuplicateCareRequestID := duplicateCareRequestIDExists(req.CareRequestIds)
	if hasDuplicateCareRequestID {
		return nil, status.Errorf(codes.InvalidArgument, "duplicate care request id found in request")
	}

	createdBefore, err := s.getCreatedBeforeTime(req.CreatedBefore)
	if err != nil {
		return nil, err
	}
	careRequestsDiagnostics, err := s.LogisticsDB.GetLatestCareRequestsDataForDiagnostics(
		ctx,
		req.CareRequestIds,
		*createdBefore)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting care requests diagnostics data: %s", err)
	}
	if len(careRequestsDiagnostics) != len(req.CareRequestIds) {
		return nil, status.Errorf(codes.Internal, "error, not all care requests found")
	}

	return &logisticspb.GetCareRequestsDiagnosticsResponse{
		CareRequestDiagnostics: buildCareRequestsDiagnosticsProtos(careRequestsDiagnostics),
	}, nil
}

func duplicateCareRequestIDExists(careRequestIDs []int64) bool {
	uniqueCareRequestIDs := make(map[int64]bool)
	for _, careRequestID := range careRequestIDs {
		if uniqueCareRequestIDs[careRequestID] {
			return true
		}
		uniqueCareRequestIDs[careRequestID] = true
	}
	return false
}

func (s *GRPCServer) getCreatedBeforeTime(createdBefore *common.DateTime) (*time.Time, error) {
	if createdBefore != nil {
		result, err := logisticsdb.ProtoDateTimeToTime(createdBefore)
		if err != nil {
			return nil, err
		}
		return result, nil
	}
	result := s.now()
	return &result, nil
}

func buildCareRequestsDiagnosticsProtos(careRequestsDiagnostics []*logisticsdb.CareRequestDiagnostics) []*logisticspb.CareRequestDiagnostics {
	var careRequestsDiagnosticsProtos []*logisticspb.CareRequestDiagnostics
	for _, diagnostic := range careRequestsDiagnostics {
		location := protoconv.LocationToCommonLocation(diagnostic.VisitLocation)
		twStartTime := time.Unix(diagnostic.ArrivalStartTimestampSec, 0)
		twEndTime := time.Unix(diagnostic.ArrivalEndTimestampSec, 0)

		careRequestsDiagnosticsProtos = append(careRequestsDiagnosticsProtos, &logisticspb.CareRequestDiagnostics{
			CareRequestId: diagnostic.CareRequestID,
			ShiftTeamId:   diagnostic.ShiftTeamID,
			Phase:         &diagnostic.VisitPhase,
			TimeWindow: &common.TimeWindow{
				StartDatetime: logisticsdb.TimeToProtoDateTime(&twStartTime),
				EndDatetime:   logisticsdb.TimeToProtoDateTime(&twEndTime),
			},
			Location:           location,
			ServiceDurationSec: diagnostic.ServiceDurationSec,
			IsManualOverride:   diagnostic.IsManualOverride,
			RequiredAttributes: attributes.Attributes(
				protoconv.AttributeToCommonAttribute(diagnostic.RequiredAttributes),
			).ToExternal().ToCommon(),
			PreferredAttributes: attributes.Attributes(
				protoconv.AttributeToCommonAttribute(diagnostic.PreferredAttributes),
			).ToExternal().ToCommon(),
			ForbiddenAttributes: attributes.Attributes(
				protoconv.AttributeToCommonAttribute(diagnostic.ForbiddenAttributes),
			).ToExternal().ToCommon(),
			UnwantedAttributes: attributes.Attributes(
				protoconv.AttributeToCommonAttribute(diagnostic.UnwantedAttributes),
			).ToExternal().ToCommon(),
			ArrivalTimestampSec: diagnostic.ArrivalTimestampSec,
		})
	}
	return careRequestsDiagnosticsProtos
}

func (s *GRPCServer) GetOptimizerRunDiagnostics(ctx context.Context,
	req *logisticspb.GetOptimizerRunDiagnosticsRequest,
) (*logisticspb.GetOptimizerRunDiagnosticsResponse, error) {
	if req.OptimizerRunId == 0 {
		return nil,
			status.Error(codes.InvalidArgument, "optimizer_run_id must be set for GetOptimizerRunDiagnosticsRequest")
	}

	optimizerRunDiagnostics, err := s.LogisticsDB.GetOptimizerRunDiagnostics(ctx, req.OptimizerRunId, nil, nil)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownOptimizerRunID) {
			return nil,
				status.Errorf(codes.NotFound, "optimizer run diagnostic data not found for %d", req.OptimizerRunId)
		}
		return nil, status.Errorf(codes.Unknown, "error getting optimizer run data: %s", err)
	}

	constraintConfig := optimizerRunDiagnostics.ConstraintConfig
	if constraintConfig == nil {
		constraintConfig = optimizer.DefaultConstraintConfig.ToProto()
	}

	resp := &logisticspb.GetOptimizerRunDiagnosticsResponse{
		SolveVrpRequest: &optimizerpb.SolveVRPRequest{
			Problem: optimizerRunDiagnostics.Problem,
			Config: &optimizerpb.VRPConfig{
				// TODO(https://github.com/*company-data-covered*/services/pull/1523): Also resolve this config similarly.
				// TODO: Add feasibility from settings.
				TerminationDurationMs:        proto.Int64(defaultFeasibilityVRPTerminationDuration.Milliseconds()),
				PerVisitRevenueUsdCents:      proto.Int64(25000),
				AppHourlyCostUsdCents:        proto.Int64(8700),
				DhmtHourlyCostUsdCents:       proto.Int64(2500),
				TerminationType:              optimizerpb.VRPConfig_TERMINATION_TYPE_BEST_FOR_TIME.Enum(),
				IncludeIntermediateSolutions: proto.Bool(false),
				ConstraintConfig:             constraintConfig,
			},
		},
		UnvalidatedProblem: optimizerRunDiagnostics.UnvalidatedProblem,
		Revisions: &logisticspb.GetOptimizerRunDiagnosticsResponse_Revisions{
			Logistics:        optimizerRunDiagnostics.Run.ServiceVersion,
			Optimizer:        optimizerRunDiagnostics.OptimizerVersion,
			CurrentLogistics: buildinfo.Version,
		},
	}
	if runError := optimizerRunDiagnostics.RunError; runError != nil {
		source, err := diagnosticsErrorSource(runError.OptimizerRunErrorSourceID)
		if err != nil {
			return nil,
				status.Errorf(codes.Internal,
					"invalid error source for optimizer run(%d): %d",
					req.OptimizerRunId,
					runError.OptimizerRunErrorSourceID)
		}
		resp.Result = &logisticspb.GetOptimizerRunDiagnosticsResponse_Error_{
			Error: &logisticspb.GetOptimizerRunDiagnosticsResponse_Error{
				Value:  runError.ErrorValue,
				Source: source,
			},
		}
	}
	return resp, nil
}

func (s *GRPCServer) GetShiftTeamSchedule(
	ctx context.Context,
	req *logisticspb.GetShiftTeamScheduleRequest,
) (*logisticspb.GetShiftTeamScheduleResponse, error) {
	shiftTeamID := req.ShiftTeamId

	latestSnapshot := s.now()
	earliestSnapshot := latestSnapshot.Add(-optimizersettings.DefaultSnapshotsLookbackDuration())
	schedule, err := s.LogisticsDB.GetLatestShiftTeamSchedule(
		ctx,
		shiftTeamID,
		logisticsdb.TimeWindow{
			Start: earliestSnapshot,
			End:   latestSnapshot,
		},
	)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownShiftTeam) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		if errors.Is(err, logisticsdb.ErrShiftTeamSnapshotNotYetIncorporated) {
			return nil, status.Error(codes.Aborted, err.Error())
		}

		return nil, status.Errorf(codes.Internal, "could not get schedule: %s", err)
	}

	serviceDateStr := unknownServiceDateStr
	if schedule.Metadata != nil {
		serviceDateStr = logisticsdb.ProtoDateToTime(schedule.Metadata.ServiceDate).Format(dateLayout)
	}
	monitoring.AddGRPCTags(
		ctx,
		monitoring.Tags{
			serviceRegionTag: logisticsdb.I64ToA(schedule.ServiceRegionID),
			serviceDateTag:   serviceDateStr,
		},
	)

	return &logisticspb.GetShiftTeamScheduleResponse{
		Meta:           schedule.Metadata,
		Schedule:       schedule.Schedule,
		PendingUpdates: schedule.PendingUpdates,
	}, nil
}

func (s *GRPCServer) GetServiceRegionSchedule(
	ctx context.Context,
	req *logisticspb.GetServiceRegionScheduleRequest,
) (*logisticspb.GetServiceRegionScheduleResponse, error) {
	if req.MarketId == nil {
		return nil, status.Errorf(codes.InvalidArgument, "MarketId is required")
	}

	schedulesResponse, err := s.LogisticsDB.GetLatestShiftTeamSchedulesInServiceRegion(
		ctx,
		*req.MarketId,
		s.now(),
		false)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrServiceRegionMarketNotFound) ||
			errors.Is(err, logisticsdb.ErrServiceRegionSettingsNotFound) {
			return nil,
				status.Errorf(codes.NotFound,
					"error getting service region data for market %d: %v",
					*req.MarketId,
					err)
		}
		return nil, status.Errorf(codes.Internal, "error loading schedule: %v", err)
	}
	shiftTeamSchedules := schedulesResponse.ShiftTeamSchedules

	monitoring.AddGRPCFields(ctx, collectMetricsForGetServiceRegionSchedule(shiftTeamSchedules))
	monitoring.AddGRPCTags(ctx, monitoring.Tags{
		serviceRegionTag: logisticsdb.I64ToA(schedulesResponse.ServiceRegionID),
		marketTag:        logisticsdb.I64ToA(req.GetMarketId()),
	})

	return &logisticspb.GetServiceRegionScheduleResponse{
		DateSchedules: shiftTeamSchedules,
	}, nil
}

func collectMetricsForGetServiceRegionSchedule(dateSchedules []*logisticspb.ServiceRegionDateSchedule) monitoring.Fields {
	totalShiftTeams := 0
	totalPendingUpdates := 0
	totalUnassignedVisits := 0
	totalVisits := 0

	for _, dateSchedule := range dateSchedules {
		schedules := dateSchedule.GetSchedules()
		totalShiftTeams += len(schedules)
		for _, sch := range schedules {
			totalVisits += len(sch.GetRoute().GetStops())
		}
		totalUnassignedVisits += len(dateSchedule.GetUnassignableVisits())
		totalPendingUpdates += len(dateSchedule.GetPendingUpdates().GetRestBreakRequests())
	}

	return monitoring.Fields{
		shiftTeamsField:        totalShiftTeams,
		unassignedVisitsField:  totalUnassignedVisits,
		pendingRestBreaksField: totalPendingUpdates,
		numVisitsField:         totalVisits,
	}
}

func (s *GRPCServer) RemoveCareRequest(
	ctx context.Context,
	req *logisticspb.RemoveCareRequestRequest,
) (*logisticspb.RemoveCareRequestResponse, error) {
	if req.CareRequestId == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "CareRequestId is required")
	}

	deletedVisit, err := s.LogisticsDB.DeleteVisitSnapshotForCareRequestID(ctx, req.CareRequestId)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownCareRequest) {
			return nil, status.Error(codes.NotFound, "no visit snapshot found for care request")
		}
		return nil, status.Errorf(codes.Internal, "error deleting visit snapshots for care request: %s", err)
	}
	monitoring.AddGRPCTag(ctx, serviceRegionTag, logisticsdb.I64ToA(deletedVisit.ServiceRegionID))
	return &logisticspb.RemoveCareRequestResponse{}, nil
}

func (s *GRPCServer) UpsertShiftTeam(ctx context.Context, req *logisticspb.UpsertShiftTeamRequest) (*logisticspb.UpsertShiftTeamResponse, error) {
	if req.ShiftTeamId == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "ShiftTeamID is required")
	}

	resp, err := s.ShiftTeamService.GetShiftTeam(ctx, &shiftteampb.GetShiftTeamRequest{
		Id: req.ShiftTeamId,
	})
	if err != nil {
		returnCode := codes.Internal
		if statusCode := status.Code(err); slices.Contains(passthroughErrorCodes, status.Code(err)) {
			returnCode = statusCode
		}
		return nil, status.Errorf(returnCode, "error fetching shift team: %s", err)
	}

	monitoring.AddGRPCTag(ctx, marketTag, logisticsdb.I64ToA(resp.GetShiftTeam().GetMarketId()))
	_, err = s.LogisticsDB.WriteShiftTeamSnapshot(ctx, req.ShiftTeamId, resp)
	if err != nil {
		return nil, err
	}

	return &logisticspb.UpsertShiftTeamResponse{}, nil
}

func (s *GRPCServer) UpsertCareRequest(ctx context.Context, req *logisticspb.UpsertCareRequestRequest) (*logisticspb.UpsertCareRequestResponse, error) {
	if req.CareRequestId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "CareRequestID is invalid")
	}
	resp, err := s.EpisodeService.GetVisit(ctx, &episodepb.GetVisitRequest{
		CareRequestId: req.CareRequestId,
	})
	if err != nil {
		returnCode := codes.Internal
		if slices.Contains(passthroughErrorCodes, status.Code(err)) {
			returnCode = status.Code(err)
		}
		return nil, status.Errorf(returnCode, "error fetching visit: %s", err)
	}

	cr := resp.GetCareRequest()
	crRequestStatus := cr.GetRequestStatus()
	monitoring.AddGRPCTags(
		ctx,
		monitoring.Tags{
			marketTag:               logisticsdb.I64ToA(cr.GetMarketId()),
			isManualOverrideTag:     strconv.FormatBool(cr.GetIsManualOverride()),
			careRequestStatusTag:    crRequestStatus.GetName(),
			visitPhaseSourceTypeTag: crRequestStatus.GetSourceType().String(),
		},
	)
	_, err = s.LogisticsDB.WriteVisitSnapshot(ctx, req.CareRequestId, resp)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrVisitSnapshotRequiresArrivalTimeWindow) {
			return nil, status.Error(codes.FailedPrecondition, err.Error())
		}
		return nil, err
	}

	return &logisticspb.UpsertCareRequestResponse{}, nil
}

func (s *GRPCServer) UpsertVisitIfFeasible(
	ctx context.Context,
	req *logisticspb.UpsertVisitIfFeasibleRequest,
) (*logisticspb.UpsertVisitIfFeasibleResponse, error) {
	err := validateUpsertIfFeasibleRequest(req)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}
	feasibilityRequest := logisticsdb.ToCheckFeasibilityProto(req)

	serviceRegion, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, *req.CareRequestInfo.MarketId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("error getting service region ID for market ID %d: %s", *req.CareRequestInfo.MarketId, err.Error()))
	}

	lockDateTime, err := dateForCheckFeasibilityVisit(feasibilityRequest.Visits[0], serviceRegion.IanaTimeZoneName)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting local date for visit: %s", err)
	}

	lockDate := &common.Date{
		Year:  int32(lockDateTime.Year()),
		Month: int32(lockDateTime.Month()),
		Day:   int32(lockDateTime.Day()),
	}

	monitoring.AddGRPCTags(
		ctx,
		monitoring.Tags{
			marketTag:           logisticsdb.I64ToA(req.CareRequestInfo.GetMarketId()),
			serviceRegionTag:    logisticsdb.I64ToA(serviceRegion.ID),
			isManualOverrideTag: strconv.FormatBool(req.CareRequestInfo.GetIsManualOverride()),
		},
	)

	lock, err := s.LockDB.Lock(ctx, serviceRegion.ID, lockDate)
	defer lock.Release(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error acquiring lock: %s", err)
	}

	feasibilityResponse, err := s.CheckFeasibility(ctx, feasibilityRequest)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting check feasibility data: %s", err)
	}

	switch feasibilityResponse.Status {
	case logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE:
		return &logisticspb.UpsertVisitIfFeasibleResponse{
			FeasibilityStatus: logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_INFEASIBLE,
		}, nil
	case logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE:
		// nothing
	default:
		return nil, status.Errorf(codes.Internal, "unhandled check feasibility status: %s", feasibilityResponse.Status)
	}

	_, err = s.LogisticsDB.WriteVisitSnapshot(ctx, req.CareRequestInfo.Id, &episodepb.GetVisitResponse{
		CareRequest: req.CareRequestInfo,
	})
	if err != nil {
		returnCode := codes.Internal
		if slices.Contains(passthroughErrorCodes, status.Code(err)) {
			returnCode = status.Code(err)
		}
		return nil, status.Errorf(returnCode, "error upserting care request: %s", err)
	}

	return &logisticspb.UpsertVisitIfFeasibleResponse{
		FeasibilityStatus: logisticspb.UpsertVisitIfFeasibleResponse_FEASIBILITY_STATUS_FEASIBLE,
	}, nil
}

func validateUpsertIfFeasibleRequest(req *logisticspb.UpsertVisitIfFeasibleRequest) error {
	careRequestInfo := req.GetCareRequestInfo()
	if careRequestInfo == nil {
		return errors.New("CareRequestInfo is required")
	}
	if careRequestInfo.GetId() <= 0 {
		return errors.New("CareRequestID is required")
	}
	if careRequestInfo.GetMarketId() <= 0 {
		return errors.New("MarketID is required")
	}
	if careRequestInfo.GetLocation() == nil {
		return errors.New("location is required")
	}
	if careRequestInfo.GetArrivalTimeWindow() == nil {
		return errors.New("ArrivalTimeWindow is required")
	}
	if careRequestInfo.GetRequestStatus() == nil {
		return errors.New("CareRequestStatus is required")
	}
	if careRequestInfo.GetRequestStatus().GetName() != requestedStatusName {
		return errors.New("CareRequestStatus must be requested")
	}
	return nil
}

func dateForCheckFeasibilityVisit(visit *logisticspb.CheckFeasibilityVisit, ianaTimezone string) (*time.Time, error) {
	switch visit.ArrivalTimeSpecification.(type) {
	case *logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow:
		timeWindow := visit.GetArrivalTimeWindow()
		startDate, err := logisticsdb.ProtoDateTimeToTime(timeWindow.StartDatetime)
		if err != nil {
			return nil, err
		}
		endDate, err := logisticsdb.ProtoDateTimeToTime(timeWindow.EndDatetime)
		if err != nil {
			return nil, err
		}

		timezone, err := time.LoadLocation(ianaTimezone)
		if err != nil {
			return nil, err
		}

		localStartDate := startDate.In(timezone).Format(dateLayout)
		localEndDate := endDate.In(timezone).Format(dateLayout)
		if localStartDate != localEndDate {
			return nil, errors.New("visit time window must not span multiple days")
		}

		dateForVisit := logisticsdb.TimestampFromDateTimeLoc(startDate.In(timezone), time.Time{}, time.UTC)
		return &dateForVisit, nil
	case *logisticspb.CheckFeasibilityVisit_ArrivalDate:
		return logisticsdb.ProtoDateToTime(visit.GetArrivalDate()), nil
	default:
		return nil, errors.New("visit must provide a time window or an arrival date")
	}
}

func validateVisitAttributes(v *logisticspb.CheckFeasibilityVisit) error {
	requiredAttrs := make(map[string]bool)
	for _, a := range v.RequiredAttributes {
		requiredAttrs[a.Name] = true
	}
	for _, a := range v.ForbiddenAttributes {
		if _, exists := requiredAttrs[a.Name]; exists {
			return fmt.Errorf("attribute(%s) cannot both be required and forbidden", a.Name)
		}
	}
	return nil
}

func (s *GRPCServer) validateVisitsAttributes(
	visits []*logisticspb.CheckFeasibilityVisit,
	serviceRegionTimeZoneName string,
) error {
	if len(visits) == 0 {
		return status.Errorf(codes.InvalidArgument, "at least one visit is required")
	}

	marketID := visits[0].MarketId
	if marketID == nil {
		return status.Errorf(codes.InvalidArgument, "visit does not contain a MarketId")
	}

	requiredDate, err := dateForCheckFeasibilityVisit(visits[0], serviceRegionTimeZoneName)
	if err != nil {
		return status.Errorf(codes.InvalidArgument, couldNotDetermineDateForVisit, err)
	}

	requiredMarketID := visits[0].GetMarketId()
	for _, v := range visits {
		if err := validateVisitAttributes(v); err != nil {
			return status.Errorf(codes.InvalidArgument, "invalid visit: %s", err)
		}
		if v.GetMarketId() != requiredMarketID {
			return fmt.Errorf("a group of check feasibility visists must all have same market ID")
		}
		date, err := dateForCheckFeasibilityVisit(v, serviceRegionTimeZoneName)
		if err != nil {
			return status.Errorf(codes.InvalidArgument, couldNotDetermineDateForVisit, err)
		}
		if requiredDate != nil && !requiredDate.Equal(*date) {
			return fmt.Errorf("a group of check feasibility visists must all have same date")
		}
	}
	return nil
}

func (s *GRPCServer) VRPProblemParamsFromCheckFeasibilityRequest(
	vrpData *logisticsdb.ServiceRegionVRPData,
) *logisticsdb.VRPProblemParams {
	now := vrpData.SnapshotTime
	settings := vrpData.Settings
	// TODO(MARK-2421): use serviceRegionSettings.DistanceValiditySec from settings
	earliestDistanceTimestamp := now.Add(-oldestDistanceAge)
	params := &logisticsdb.VRPProblemParams{
		ServiceRegionVRPData:  vrpData,
		UseDistancesAfterTime: earliestDistanceTimestamp,
		UnrequestedRestBreakConfig: logisticsdb.UnrequestedRestBreakConfig{
			IncludeUnrequestedRestBreaks: true,
			// TODO: use statsig after implementing duration type flag;
			// or support for binding nested config access to the flag variable for ergonomic use.
			RestBreakDuration: 30 * time.Minute,
		},
		ValidationConfig: validation.Config{
			FailOnRecoverableError: false,
			ProblemValidators:      logisticsdb.DefaultProblemValidators,
		},
		ShiftTeamStartBufferSec: settings.FeasibilityShiftTeamStartBufferSec,
	}

	return params
}

func (s *GRPCServer) GetAvailableTimeWindows(
	ctx context.Context,
	req *logisticspb.GetAvailableTimeWindowsRequest,
) (*logisticspb.GetAvailableTimeWindowsResponse, error) {
	if req.CheckFeasibilityVisit == nil {
		return nil, status.Errorf(codes.InvalidArgument, "a visit is required")
	}

	serviceDates := req.ServiceDates
	if len(serviceDates) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "at least one service date is required")
	}

	templateVisit := req.CheckFeasibilityVisit
	serviceRegion, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, *templateVisit.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, serviceRegionNotFoundForMarketID, err)
	}

	limitTW := req.MustBeSeenWithinTimeWindow
	var limitStart *time.Time
	var limitEnd *time.Time
	if limitTW != nil &&
		limitTW.StartDatetime != nil &&
		limitTW.EndDatetime != nil {
		limitStart, err = logisticsdb.ProtoDateTimeToTime(limitTW.StartDatetime)
		if err != nil {
			return nil, status.Errorf(codes.Internal,
				fmt.Errorf("error parsing MustBeSeenWithinTimeWindow.StartDatetime. %w",
					err).Error(),
			)
		}

		limitEnd, err = logisticsdb.ProtoDateTimeToTime(limitTW.EndDatetime)
		if err != nil {
			return nil, status.Errorf(codes.Internal,
				fmt.Errorf("error parsing MustBeSeenWithinTimeWindow.EndDatetime. %w",
					err).Error(),
			)
		}
	}
	now := s.now()
	vrpDataByDate := make(map[*common.Date]*logisticsdb.ServiceRegionVRPData)
	vrpInputByDate := make(map[*common.Date]*checkfeasibility.SolveVRPInput)
	for _, date := range serviceDates {
		serviceDate := logisticsdb.ProtoDateToTime(date)
		if limitEnd != nil && serviceDate.After(*limitEnd) {
			continue
		}
		vrpData, err := s.LogisticsDB.GetServiceRegionVRPData(ctx, &logisticsdb.ServiceRegionVRPDataParams{
			ServiceRegionID:       serviceRegion.ID,
			ServiceDate:           *serviceDate,
			CheckFeasibilityVisit: templateVisit,
			SnapshotTime:          now,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting service region VRP data %s", err)
		}
		vrpDataByDate[date] = vrpData
		if vrpData.CheckFeasibilityData == nil {
			continue
		}

		vrpInput, err := s.createFeasibilityVRPRequest(ctx, vrpData)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error in createFeasibilityVRPRequest: %Status", err)
		}

		vrpInputByDate[date] = vrpInput
	}

	if len(vrpDataByDate) == 0 {
		return nil, status.Errorf(codes.Internal, "No VRP Data found for any service date")
	}

	twDuration := defaultTWDuration
	settings := vrpDataByDate[serviceDates[0]].Settings
	if settings.AvailabilityTimeWindowDurationHrs != nil {
		twDuration = time.Duration(*settings.AvailabilityTimeWindowDurationHrs) * time.Hour
	}

	startTimestamp := timewindowavailability.ClampTime(now, limitStart, limitEnd)

	serviceDateAvailabilities, err := timewindowavailability.TimeWindowAvailabilities(
		ctx,
		&timewindowavailability.AvailabilitiesParams{
			ServiceDates:   serviceDates,
			VRPDataByDate:  vrpDataByDate,
			VRPInputByDate: vrpInputByDate,

			Duration:       twDuration,
			StartTimestamp: startTimestamp,
			LimitEnd:       limitEnd,

			VRPSolver: s.VRPSolver,
		},
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error in TimeWindowAvailabilities: %Status", err)
	}

	return &logisticspb.GetAvailableTimeWindowsResponse{
		ServiceDateAvailabilities: serviceDateAvailabilities,
	}, nil
}

func (s *GRPCServer) CheckFeasibility(
	ctx context.Context,
	req *logisticspb.CheckFeasibilityRequest,
) (*logisticspb.CheckFeasibilityResponse, error) {
	if len(req.Visits) != 1 {
		return nil, status.Errorf(codes.InvalidArgument, "exactly one visit is required")
	}

	visits := req.Visits
	templateVisit := visits[0]
	serviceRegion, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, *templateVisit.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, serviceRegionNotFoundForMarketID, err)
	}

	serviceDate, err := dateForCheckFeasibilityVisit(templateVisit, serviceRegion.IanaTimeZoneName)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, couldNotDetermineDateForVisit, err)
	}

	now := s.now()
	vrpData, err := s.LogisticsDB.GetServiceRegionVRPData(ctx, &logisticsdb.ServiceRegionVRPDataParams{
		ServiceRegionID:       serviceRegion.ID,
		ServiceDate:           *serviceDate,
		CheckFeasibilityVisit: templateVisit,
		SnapshotTime:          now,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting service region VRP data %s", err)
	}
	if vrpData.CheckFeasibilityData == nil {
		cfResponse := &logisticspb.CheckFeasibilityResponse{
			Status: logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
		}
		err = s.recordFeasibilityQuery(ctx, &recordFeasibilityQueryParams{
			serviceRegionID: serviceRegion.ID,
			responseStatus:  cfResponse.Status,
			visit:           templateVisit,
			serviceDate:     serviceDate,
		})
		if err != nil {
			return nil, err
		}
		return cfResponse, nil
	}

	err = s.validateVisitsAttributes(visits, serviceRegion.IanaTimeZoneName)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid visit attributes: %s", err)
	}

	if !templateVisit.IsManualAdjustment {
		isMarketClosingSoon, err := s.marketClosingSoon(marketClosingSoonParams{
			Visit:                     templateVisit,
			ServiceRegionClosingTime:  vrpData.OpenHoursTW.End,
			ServiceRegionTimeZoneName: serviceRegion.IanaTimeZoneName,
			Now:                       now,
			Settings:                  vrpData.Settings,
		})
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "couldn't validate market open hours: %s", err)
		}

		if isMarketClosingSoon {
			return &logisticspb.CheckFeasibilityResponse{
				Status: logisticspb.CheckFeasibilityResponse_STATUS_MARKET_INFEASIBLE_CLOSING_SOON,
			}, nil
		}
	}

	monitoring.AddGRPCTags(ctx, monitoring.Tags{
		marketTag:        logisticsdb.I64ToA(templateVisit.GetMarketId()),
		serviceRegionTag: logisticsdb.I64ToA(serviceRegion.ID),
		serviceDateTag:   serviceDate.Format(dateLayout),
	})

	cfResponse, err := s.checkFeasibilityForVisits(ctx, vrpData)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "check feasibility error: %s", err)
	}

	err = s.recordFeasibilityQuery(ctx, &recordFeasibilityQueryParams{
		serviceRegionID: serviceRegion.ID,

		responseStatus: cfResponse.Status,
		visit:          templateVisit,
		serviceDate:    serviceDate,
		optimizerRunID: cfResponse.GetDiagnostics().GetOptimizerRunId(),
		scheduleID:     cfResponse.GetDiagnostics().GetScheduleId(),
	})
	if err != nil {
		return nil, err
	}

	if !s.Cfg.EnableCheckFeasibilityDiagnostics {
		cfResponse.Diagnostics = nil
	}

	return cfResponse, nil
}

type recordFeasibilityQueryParams struct {
	serviceRegionID int64

	serviceDate    *time.Time
	optimizerRunID int64
	scheduleID     int64
	visit          *logisticspb.CheckFeasibilityVisit
	responseStatus logisticspb.CheckFeasibilityResponse_Status
}

func (s *GRPCServer) recordFeasibilityQuery(ctx context.Context, params *recordFeasibilityQueryParams) error {
	if params.visit.GetCareRequestId() <= 0 {
		_, err := s.LogisticsDB.AddServiceRegionAvailabilityQuery(ctx, &logisticsdb.ServiceRegionAvailabilityQueryParams{
			ServiceRegionID:     params.serviceRegionID,
			ServiceDate:         *params.serviceDate,
			ReferenceScheduleID: params.scheduleID,
			FeasibilityStatus:   params.responseStatus.String(),
		})
		if err != nil {
			return status.Errorf(codes.Internal, "service region availability query error: %s", err)
		}

		return nil
	}

	var arrivalTWStartTimestampSec int64
	var arrivalTWEndTimestampSec int64
	visit := params.visit
	tw := visit.GetArrivalTimeWindow()
	if tw != nil {
		arrivalTW, err := logisticsdb.VRPTimeWindowFromTimeWindow(tw)
		if err != nil {
			return status.Errorf(
				codes.InvalidArgument,
				"couldn't determine time window for visit: %s",
				err)
		}
		arrivalTWStartTimestampSec = *arrivalTW.StartTimestampSec
		arrivalTWEndTimestampSec = *arrivalTW.EndTimestampSec
	}

	isFeasible := params.responseStatus == logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE
	_, err := s.LogisticsDB.AddCheckFeasibilityQuery(
		ctx,
		logisticsdb.CheckFeasibilityQueryParams{
			CareRequestID:                      visit.GetCareRequestId(),
			ServiceRegionID:                    params.serviceRegionID,
			LatitudeE6:                         visit.GetLocation().GetLatitudeE6(),
			LongitudeE6:                        visit.GetLocation().GetLongitudeE6(),
			ArrivalTimeWindowStartTimestampSec: arrivalTWStartTimestampSec,
			ArrivalTimeWindowEndTimestampSec:   arrivalTWEndTimestampSec,
			ServiceDurationSec:                 visit.GetServiceDurationSec(),
			ServiceDate:                        *params.serviceDate,
			RequiredAttributes:                 visit.RequiredAttributes,
			PreferredAttributes:                visit.PreferredAttributes,
			ForbiddenAttributes:                visit.ForbiddenAttributes,
			UnwantedAttributes:                 visit.UnwantedAttributes,
			OptimizerRunID:                     params.optimizerRunID,
			BestScheduleID:                     params.scheduleID,
			BestScheduleIsFeasible:             isFeasible,
			ResponseStatus:                     params.responseStatus.String(),
		})
	if err != nil {
		return status.Errorf(codes.Internal, "check feasibility query error: %s", err)
	}

	return nil
}

func (s *GRPCServer) GetCheckFeasibilityCareRequestHistory(
	ctx context.Context,
	req *logisticspb.GetCheckFeasibilityCareRequestHistoryRequest,
) (*logisticspb.GetCheckFeasibilityCareRequestHistoryResponse, error) {
	if req.CareRequestId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "CareRequestID is invalid")
	}

	history, err := s.LogisticsDB.GetCheckFeasibilityCareRequestHistory(ctx, req.CareRequestId)
	if err != nil {
		return nil, err
	}

	return &logisticspb.GetCheckFeasibilityCareRequestHistoryResponse{
		Results: history,
	}, nil
}

type marketClosingSoonParams struct {
	Visit *logisticspb.CheckFeasibilityVisit

	ServiceRegionClosingTime  time.Time
	ServiceRegionTimeZoneName string
	Now                       time.Time

	Settings *optimizersettings.Settings
}

func (s *GRPCServer) marketClosingSoon(params marketClosingSoonParams) (bool, error) {
	tzLoc, err := time.LoadLocation(params.ServiceRegionTimeZoneName)
	if err != nil {
		return false, err
	}

	evaluationTime := params.Now.In(tzLoc)
	visit := params.Visit
	if visit.GetArrivalTimeWindow() != nil {
		startTime, err := logisticsdb.ProtoDateTimeToTime(visit.GetArrivalTimeWindow().StartDatetime)
		if err != nil {
			return false, err
		}
		evaluationTime = startTime.In(tzLoc)
	}

	settings := params.Settings
	closingSoonDuration := time.Duration(settings.FeasibilityCheckLatenessMinutes) * time.Minute
	return evaluationTime.Add(closingSoonDuration).After(params.ServiceRegionClosingTime), nil
}

var (
	errFeasibilityWindowHasPassed = errors.New("feasibility window has passed")
)

func (s *GRPCServer) checkFeasibilityForVisits(
	ctx context.Context,
	vrpData *logisticsdb.ServiceRegionVRPData,
) (*logisticspb.CheckFeasibilityResponse, error) {
	baseVrpInput, err := s.createFeasibilityVRPRequest(ctx, vrpData)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error in createFeasibilityVRPRequest: %s", err)
	}

	cfData := vrpData.CheckFeasibilityData
	visits := cfData.Visits
	locIDs := cfData.LocIDs
	settings := vrpData.Settings
	children, checkFeasibilityDiagnostics, err := s.feasibilityLeavesForFeasibilityVisits(
		visits,
		baseVrpInput,
		locIDs)
	if err != nil {
		if errors.Is(err, errFeasibilityWindowHasPassed) {
			return &logisticspb.CheckFeasibilityResponse{
				Status:      logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE,
				Diagnostics: checkFeasibilityDiagnostics,
			}, nil
		}

		return nil, err
	}

	locationLimitedFeasibilityTree := checkfeasibility.NewFeasibilityTree(
		logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_LOCATION_LIMITED,
		children...,
	)
	feasibilityTree := locationLimitedFeasibilityTree
	if cfData.IsMarketLevel && settings.UseLimitedMarketAvailabilityChecks {
		longDurationVisits := longDurationVisitsFromCanonicalVisits(
			visits,
			&settings.FeasibilityLongServiceDurationSec)
		longDurationVisitsFeasibilityLeaves, _, err := s.feasibilityLeavesForFeasibilityVisits(
			longDurationVisits,
			baseVrpInput,
			locIDs)
		if err != nil {
			return nil, err
		}

		nearingCapacityRequest, _, err := s.feasibilityRequestForNearingCapacity(feasibilityRequestForNearingCapacityParams{
			visits:     visits,
			shiftTeams: vrpData.ShiftTeamSnapshots,
			locIDs:     locIDs,

			vrpInput: baseVrpInput,
			settings: settings,

			now: vrpData.SnapshotTime,
		})
		if err != nil {
			return nil, err
		}

		feasibilityTree = checkfeasibility.NewFeasibilityTree(
			logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_SERVICE_DURATION_LIMITED,

			// A market should be partially feasible "service duration limited" if any (or all) canonical
			// locations cannot admit a pessimistically long duration visit.
			checkfeasibility.NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_SERVICE_DURATION_LIMITED,
				longDurationVisitsFeasibilityLeaves...,
			),

			// A market should be partially feasible "nearing capacity" if a number of vists for a defined percentage
			// of active shift teams at canonical locations cannot admit a pesimistically long duration visit.
			checkfeasibility.NewFeasibilityTree(
				logisticspb.CheckFeasibilityResponse_STATUS_MARKET_PARTIALLY_FEASIBLE_NEARING_CAPACITY,
				checkfeasibility.NewFeasibilityLeaf(nearingCapacityRequest),
				// A market should be partially feasible "location limited" if any (and not all) canonical
				// locations cannot admit an optimistically short duration visit.
				locationLimitedFeasibilityTree.WithPropagateInfeasibility(),
			),
		)
	}

	monitoring.AddGRPCField(ctx, numVisitsField, len(visits))
	return s.feasibilityForRequests(ctx, feasibilityTree, checkFeasibilityDiagnostics)
}

func longDurationVisitsFromCanonicalVisits(
	visits []*logisticspb.CheckFeasibilityVisit,
	longerServiceDurationSec *int64) []*logisticspb.CheckFeasibilityVisit {
	var longDurationVisits = make([]*logisticspb.CheckFeasibilityVisit, len(visits))
	for i, templateVisit := range visits {
		longDurationVisit := proto.Clone(templateVisit).(*logisticspb.CheckFeasibilityVisit)
		longDurationVisit.ServiceDurationSec = longerServiceDurationSec
		longDurationVisits[i] = longDurationVisit
	}

	return longDurationVisits
}

type feasibilityRequestForNearingCapacityParams struct {
	visits     []*logisticspb.CheckFeasibilityVisit
	shiftTeams []*logisticssql.ShiftTeamSnapshot
	locIDs     []int64

	vrpInput *checkfeasibility.SolveVRPInput
	settings *optimizersettings.Settings

	now time.Time
}

func (s *GRPCServer) feasibilityRequestForNearingCapacity(
	params feasibilityRequestForNearingCapacityParams,
) (*checkfeasibility.SolveVRPInput, *logisticspb.CheckFeasibilityDiagnostics, error) {
	now := params.now
	var activeShiftTeamsCount int64
	for _, snapshot := range params.shiftTeams {
		if snapshot.EndTimestampSec < now.Unix() {
			continue
		}
		activeShiftTeamsCount++
	}

	settings := params.settings
	nearingCapacityVisits, cfLocIDs := createVisitsForNearingCapacity(
		createVisitsForNearingCapacityParams{
			activeShiftTeamsCount:             activeShiftTeamsCount,
			visits:                            params.visits,
			locIDs:                            params.locIDs,
			feasibilityLongServiceDurationSec: settings.FeasibilityLongServiceDurationSec,
			feasibilityPercentCapacity:        settings.FeasibilityPercentCapacity,
		},
	)

	vrpInput := params.vrpInput
	problemData, err := s.LogisticsDB.AttachCheckFeasibilityRequestToProblem(
		vrpInput.VRPProblemData,
		nearingCapacityVisits,
		cfLocIDs)
	if err != nil {
		return nil, problemData.CheckFeasibilityDiagnostics, err
	}
	return vrpInputWithProblemData(
		vrpInput,
		problemData,
	), problemData.CheckFeasibilityDiagnostics, nil
}

type createVisitsForNearingCapacityParams struct {
	activeShiftTeamsCount int64

	visits []*logisticspb.CheckFeasibilityVisit
	locIDs []int64

	feasibilityLongServiceDurationSec int64
	feasibilityPercentCapacity        int64
}

// See LOG-1982 - the definition of a market that is nearing capacity is that less than a configurable percentage of available shift teams can be
// allocated.  We round robin hypothetical visits among canonical locations for the market.
func createVisitsForNearingCapacity(
	params createVisitsForNearingCapacityParams,
) ([]*logisticspb.CheckFeasibilityVisit, []int64) {
	visits := params.visits
	feasibilityPercentCapacity := params.feasibilityPercentCapacity
	limitedMarketVisitCount := int(math.Max(math.Ceil(float64(params.activeShiftTeamsCount*feasibilityPercentCapacity)/100.00), 1.0))

	feasibilityLongServiceDurationSec := params.feasibilityLongServiceDurationSec
	locIDs := params.locIDs
	nearingCapacityVisits := make([]*logisticspb.CheckFeasibilityVisit, limitedMarketVisitCount)
	// TODO(MARK-2233): Check at least one visit is present, return err if not.
	templateVisit := visits[0]
	cfLocIDs := make([]int64, limitedMarketVisitCount)
	for i := 0; i < limitedMarketVisitCount; i++ {
		visit := proto.Clone(templateVisit).(*logisticspb.CheckFeasibilityVisit)
		visit.ServiceDurationSec = &feasibilityLongServiceDurationSec

		cfLocIDs[i] = locIDs[i%len(locIDs)]
		nearingCapacityVisits[i] = visit
	}
	return nearingCapacityVisits, cfLocIDs
}

func (s *GRPCServer) feasibilityForRequests(
	ctx context.Context,
	feasibilityTree *checkfeasibility.FeasibilityTree,
	diagnostics *logisticspb.CheckFeasibilityDiagnostics,
) (*logisticspb.CheckFeasibilityResponse, error) {
	if feasibilityTree == nil {
		return nil, status.Errorf(codes.Internal, "nil feasibilityTree")
	}
	var optimizerRequests int
	requests := feasibilityTree.SolveVRPRequests()
	if len(requests) == 0 {
		return nil, status.Error(codes.Internal, "no vrpRequests found in feasibilityTree")
	}
	numShiftTeams := len(requests[0].GetProblem().GetDescription().GetShiftTeams())

	feasibilityResult, err := feasibilityTree.Evaluate(ctx, s.VRPSolver, s.Cfg.EnableCheckFeasibilityDiagnostics)
	if err != nil {
		return nil, err
	}
	monitoring.AddGRPCFields(ctx, monitoring.Fields{
		optimizerRequestsField: optimizerRequests,
		numShiftTeamsField:     numShiftTeams,
	})

	monitoring.AddGRPCTag(ctx, feasibilityTag, feasibilityResult.Status.String())

	response := &logisticspb.CheckFeasibilityResponse{
		Status: feasibilityResult.Status,
	}

	if diagnostics != nil {
		if len(feasibilityResult.Diagnostics.DebugData) > 0 {
			diagnostics.DebugData = feasibilityResult.Diagnostics.DebugData
		}
		response.Diagnostics = diagnostics
	}

	return response, nil
}

func vrpInputWithProblemData(
	baseSolveVRPInput *checkfeasibility.SolveVRPInput,
	problemData *logisticsdb.VRPProblemData,
) *checkfeasibility.SolveVRPInput {
	vrpRequest := proto.Clone(baseSolveVRPInput.VRPRequest).(*optimizerpb.SolveVRPRequest)
	vrpRequest.Problem = problemData.VRPProblem

	visits := problemData.VRPProblem.GetDescription().GetVisits()
	feasibilityVisitIDs := problemData.FeasibilityVisitIDs
	visitArrivalTimestamps := baseSolveVRPInput.VisitArrivalTimestamps

	settings := baseSolveVRPInput.OptimizerSettings
	constraintConfig := optimizer.DefaultConstraintConfig.
		WithOptimizerSettings(*settings).
		WithDisallowedLateArrivalVisitIds(feasibilityVisitIDs...)

	latenessThresholdMs := settings.FeasibilityCheckLatenessThresholdOverrideMs
	if latenessThresholdMs != nil {
		constraintConfig = constraintConfig.WithVisitLatenessToleranceOverrides(optimizer.VisitLatenessToleranceOverridesParams{
			VRPVisits:                  visits,
			VisitArrivalTimestamps:     visitArrivalTimestamps,
			FeasibilityCheckVisitIDs:   feasibilityVisitIDs,
			DefaultLatenessThresholdMs: *latenessThresholdMs,
			ShiftTeamStartBufferSec:    settings.FeasibilityShiftTeamStartBufferSec,
		})
	}

	vrpRequest.Config.ConstraintConfig = constraintConfig.ToProto()

	return &checkfeasibility.SolveVRPInput{
		VRPProblemData:    problemData,
		OptimizerRun:      problemData.OptimizerRun,
		OptimizerSettings: settings,
		VRPRequest:        vrpRequest,
	}
}

func (s *GRPCServer) feasibilityLeavesForFeasibilityVisits(
	visits []*logisticspb.CheckFeasibilityVisit,
	baseVRPInput *checkfeasibility.SolveVRPInput,
	cfLocIDs []int64,
) ([]*checkfeasibility.FeasibilityTree, *logisticspb.CheckFeasibilityDiagnostics, error) {
	var checkFeasibilityDiagnostics *logisticspb.CheckFeasibilityDiagnostics
	vrpInputs := make([]*checkfeasibility.SolveVRPInput, len(visits))

	for i, visit := range visits {
		requestVisits := []*logisticspb.CheckFeasibilityVisit{visit}
		requestLocIDs := []int64{cfLocIDs[i%len(cfLocIDs)]}
		problemData, err := s.LogisticsDB.AttachCheckFeasibilityRequestToProblem(
			baseVRPInput.VRPProblemData,
			requestVisits,
			requestLocIDs)
		if err != nil {
			return nil, nil, err
		}
		checkFeasibilityDiagnostics = problemData.CheckFeasibilityDiagnostics
		vrpInputs[i] = vrpInputWithProblemData(baseVRPInput, problemData)
	}
	var children []*checkfeasibility.FeasibilityTree
	for _, input := range vrpInputs {
		children = append(children, checkfeasibility.NewFeasibilityLeaf(input))
	}
	// feasibilityTree organizes complex logic for determining the feasibility response
	// For example, say we had the following groups:
	//   1. A collection of requests for each canonical location with 60m visit on scene times
	//   2. A collection of requests for each canonical location with 20m visit on-scene times
	//
	// If (1) is partially feasible and (2) is partially feasible:  we return the parent's "partially feasible response".
	// If (1) is all infeasible and (2) is all feasible, we return the parent's "partially feasible response".
	// If everything is feasible (or conversely everything infeasible), we return feasible (or infeasible).
	return children, checkFeasibilityDiagnostics, nil
}

func (s *GRPCServer) createFeasibilityVRPRequest(
	ctx context.Context,
	vrpData *logisticsdb.ServiceRegionVRPData,
) (*checkfeasibility.SolveVRPInput, error) {
	params := s.VRPProblemParamsFromCheckFeasibilityRequest(vrpData)
	vrpProblemData, err := s.LogisticsDB.CreateVRPProblem(ctx, *params)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrFeasibilityInThePast) {
			return nil, errFeasibilityWindowHasPassed
		}
		return nil, status.Errorf(codes.Internal, "error creating vrp description: %s", err)
	}

	var checkFeasibilityDiagnostics *logisticspb.CheckFeasibilityDiagnostics
	visitArrivalTimestamps := map[int64]time.Time{}
	if vrpProblemData.CheckFeasibilityDiagnostics != nil {
		checkFeasibilityDiagnostics = vrpProblemData.CheckFeasibilityDiagnostics
		visitArrivalTimestamps, err = s.LogisticsDB.
			VisitArrivalTimestampsForSchedule(ctx, checkFeasibilityDiagnostics.ScheduleId)
		if err != nil {
			return nil, err
		}
	}

	vrpProblem := vrpProblemData.VRPProblem

	visits := vrpProblem.GetDescription().GetVisits()
	feasibilityVisitIDs := vrpProblemData.FeasibilityVisitIDs

	settings := vrpData.Settings
	constraintConfig := optimizer.DefaultConstraintConfig.
		WithOptimizerSettings(*settings).
		WithDisallowedLateArrivalVisitIds(feasibilityVisitIDs...)

	latenessThresholdMs := settings.FeasibilityCheckLatenessThresholdOverrideMs
	if latenessThresholdMs != nil {
		constraintConfig = constraintConfig.
			WithVisitLatenessToleranceOverrides(optimizer.VisitLatenessToleranceOverridesParams{
				VRPVisits:                  visits,
				VisitArrivalTimestamps:     visitArrivalTimestamps,
				FeasibilityCheckVisitIDs:   feasibilityVisitIDs,
				DefaultLatenessThresholdMs: *latenessThresholdMs,
				ShiftTeamStartBufferSec:    settings.FeasibilityShiftTeamStartBufferSec,
			})
	}

	terminationDurationMs := defaultFeasibilityVRPTerminationDuration.Milliseconds()
	if settings.FeasibilityOptimizerTerminationDurationMs > 0 {
		terminationDurationMs = settings.FeasibilityOptimizerTerminationDurationMs
	}

	var unimprovedTerminationDurationMs *int64
	if settings.FeasibilityOptimizerUnimprovedScoreTerminationDurationMs > 0 {
		unimprovedTerminationDurationMs = &settings.FeasibilityOptimizerUnimprovedScoreTerminationDurationMs
	}

	return &checkfeasibility.SolveVRPInput{
		OptimizerSettings: settings,
		VRPRequest: &optimizerpb.SolveVRPRequest{
			Problem: vrpProblem,
			Config: &optimizerpb.VRPConfig{
				IncludeIntermediateInfeasibleSolutions: proto.Bool(false),
				TerminationDurationMs:                  &terminationDurationMs,
				UnimprovedScoreTerminationDurationMs:   unimprovedTerminationDurationMs,
				TerminationType:                        optimizerpb.VRPConfig_TERMINATION_TYPE_FIRST_FEASIBLE.Enum(),
				// TODO(LOG-1979): add support for multiple disallowed feasibility
				// visits in a first-class way.
				ConstraintConfig: constraintConfig.ToProto(),
			},
			Monitoring: &optimizerpb.Monitoring{
				Tags: map[string]string{
					serviceRegionTag: logisticsdb.I64ToA(vrpData.ServiceRegionID),
					serviceDateTag:   vrpData.ServiceDate.Format(dateLayout),

					optimizer.SolveVRPUseTag: optimizer.SolveVRPUseTagFeasibility,
				},
			},
		},
		OptimizerRun:           vrpProblemData.OptimizerRun,
		VRPProblemData:         vrpProblemData,
		VisitArrivalTimestamps: visitArrivalTimestamps,
	}, nil
}

func (s *GRPCServer) UpsertMarket(
	ctx context.Context,
	req *logisticspb.UpsertMarketRequest,
) (*logisticspb.UpsertMarketResponse, error) {
	if req.MarketId == nil {
		return nil, errMarketIDRequired
	}
	monitoring.AddGRPCTag(ctx, marketTag, logisticsdb.I64ToA(req.GetMarketId()))
	marketResp, err := s.MarketService.GetMarket(ctx, &marketpb.GetMarketRequest{
		MarketId: *req.MarketId,
	})
	if err != nil {
		returnCode := codes.Internal
		if slices.Contains(passthroughErrorCodes, status.Code(err)) {
			returnCode = status.Code(err)
		}
		return nil, status.Errorf(returnCode, "error fetching market: %s", err)
	}

	market := marketResp.Market
	if market.Name == nil {
		return nil, status.Errorf(codes.FailedPrecondition, "market name required")
	}
	if market.IanaTimeZoneName == nil {
		return nil, status.Errorf(codes.FailedPrecondition, "market time zone required")
	}
	if market.ShortName == nil {
		return nil, status.Errorf(codes.FailedPrecondition, "market short name required")
	}
	if market.Enabled == nil {
		return nil, status.Errorf(codes.FailedPrecondition, "market enabled required")
	}

	err = s.LogisticsDB.UpsertMarketAndServiceRegionFromStationMarket(ctx, market)
	if err != nil {
		return nil, status.Errorf(codes.FailedPrecondition, "error upserting market and service region: %s", err)
	}

	return &logisticspb.UpsertMarketResponse{}, nil
}

type statsigSyncJSON struct {
	EnableGoMarketShortNames []string `json:"enable_go_market_short_names"`
}

func (st statsigSyncJSON) HasMarketShortName(name string) bool {
	return contains(st.EnableGoMarketShortNames, name)
}

type statsigUILaunchedMarketsJSON struct {
	LaunchedMarketShortNames []string `json:"lv1_launched_markets"`
}

func (m statsigUILaunchedMarketsJSON) HasMarketShortName(name string) bool {
	return contains(m.LaunchedMarketShortNames, name)
}

func contains(ss []string, e string) bool {
	for _, s := range ss {
		if e == s {
			return true
		}
	}

	return false
}

const (
	syncShiftTeamsStatsigKey    = "logistics_send_market_shift_teams_to_lp"
	syncCareReqsStatsigKey      = "logistics_send_market_care_requests_to_lp"
	uiLaunchedMarketsStatsigKey = "lv1_launched_markets"
)

func (s *GRPCServer) GetMarketDiagnostics(
	ctx context.Context,
	req *logisticspb.GetMarketDiagnosticsRequest,
) (*logisticspb.GetMarketDiagnosticsResponse, error) {
	if req.MarketId == 0 {
		return nil, errMarketIDRequired
	}

	market, err := s.LogisticsDB.GetMarketForStationMarketID(ctx, req.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "market not found for market id: %s", err)
	}

	serviceRegion, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, req.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, err.Error())
	}

	allSettings, err := s.SettingsService.AllSettings(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, settingsServiceErrorTemplate, err)
	}

	optimizerSettings, ok := allSettings.OptimizerRegionSettingsMap[market.ServiceRegionID]
	if !ok {
		optimizerSettings = optimizersettings.Settings{}
	}

	availabilitySettings, ok := allSettings.AvailabilityRegionSettingsMap[market.ServiceRegionID]
	if !ok {
		availabilitySettings = optimizersettings.AvailabilitySettings{}
	}
	var availabilityAttributes []*logisticspb.MarketDiagnostics_AvailabilityRuns_Attributes
	for _, attr := range availabilitySettings.Attributes {
		availabilityAttributes = append(availabilityAttributes, &logisticspb.MarketDiagnostics_AvailabilityRuns_Attributes{
			Name:     attr.Name,
			Variants: attr.Variants,
		})
	}
	var capacitySettings []*logisticspb.MarketDiagnostics_AvailabilityRuns_CapacitySettings
	for _, cs := range availabilitySettings.CapacitySettings {
		capacitySettings = append(capacitySettings, &logisticspb.MarketDiagnostics_AvailabilityRuns_CapacitySettings{
			ShiftTeamAttributes:           cs.ShiftTeamAttributes,
			CapacityPercentForHorizonDays: cs.CapacityPercentForHorizonDays,
		})
	}

	locs, err := s.LogisticsDB.GetServiceRegionCanonicalLocations(ctx, serviceRegion.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	canLocs := &logisticspb.CanonicalLocations{}
	for _, loc := range locs {
		canLocs.Locations = append(canLocs.Locations, protoconv.LocationToCommonLocation(loc))
	}

	now := s.now()
	visitDurations, err := s.LogisticsDB.GetServiceRegionVisitServiceDurations(
		ctx,
		logisticssql.GetServiceRegionCanonicalVisitDurationsParams{
			ServiceRegionID: serviceRegion.ID,
			CreatedBefore:   now,
		})
	if err != nil && !errors.Is(err, logisticsdb.ErrUndefinedVisitServiceDurationsForRegion) {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	scheduleDays, err := s.LogisticsDB.GetOpenHoursScheduleForServiceRegion(ctx, serviceRegion.ID, now)
	if err != nil {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	var shiftTeams, careReqs statsigSyncJSON
	err = s.StatsigProvider.Struct(syncShiftTeamsStatsigKey, &shiftTeams)
	if err != nil {
		return nil, status.Errorf(codes.Internal, fmt.Errorf(statsigErrorTemplate, syncShiftTeamsStatsigKey, err).Error())
	}
	err = s.StatsigProvider.Struct(syncCareReqsStatsigKey, &careReqs)
	if err != nil {
		return nil, status.Errorf(codes.Internal, fmt.Errorf(statsigErrorTemplate, syncCareReqsStatsigKey, err).Error())
	}

	var uiLaunchedMarkets statsigUILaunchedMarketsJSON
	err = s.StatsigProvider.Struct(uiLaunchedMarketsStatsigKey, &uiLaunchedMarkets)
	if err != nil {
		return nil, status.Errorf(codes.Internal, fmt.Errorf(statsigErrorTemplate, uiLaunchedMarketsStatsigKey, err).Error())
	}

	resp := &logisticspb.MarketDiagnostics{
		MarketId:        req.MarketId,
		MarketShortName: &market.ShortName,
		ServiceRegionId: &serviceRegion.ID,

		Sync: &logisticspb.MarketDiagnostics_Sync{
			ShiftTeams:   shiftTeams.HasMarketShortName(market.ShortName),
			CareRequests: careReqs.HasMarketShortName(market.ShortName),
		},

		OptimizerRuns: &logisticspb.MarketDiagnostics_OptimizerRuns{
			HorizonDays:       optimizerSettings.OptimizeHorizonDays,
			PollIntervalSec:   optimizerSettings.PollIntervalSec,
			OptimizerConfigId: optimizerSettings.OptimizerConfigID,
		},

		AvailabilityRuns: &logisticspb.MarketDiagnostics_AvailabilityRuns{
			PollIntervalSec:  availabilitySettings.PollIntervalSec,
			Attributes:       availabilityAttributes,
			CapacitySettings: capacitySettings,
		},

		Feasibility: &logisticspb.MarketDiagnostics_Feasibility{
			Locations:           canLocs,
			MinVisitDurationSec: int64(visitDurations[logisticsdb.MinVisitServiceDurationKey].Seconds()),
			MaxVisitDurationSec: int64(visitDurations[logisticsdb.MaxVisitServiceDurationKey].Seconds()),
		},

		Schedule: &logisticspb.MarketDiagnostics_Schedule{
			Days: scheduleDays,
		},

		Lv1UiEnabled: uiLaunchedMarkets.HasMarketShortName(market.ShortName),
	}

	resp.Sync.Enabled = (resp.Sync.CareRequests && resp.Sync.ShiftTeams)
	resp.OptimizerRuns.Enabled = (resp.OptimizerRuns.HorizonDays > 0 &&
		resp.OptimizerRuns.PollIntervalSec > 0 &&
		resp.OptimizerRuns.OptimizerConfigId > 0)
	resp.AvailabilityRuns.Enabled = (resp.AvailabilityRuns.PollIntervalSec > 0 &&
		len(resp.AvailabilityRuns.Attributes) > 0 &&
		len(resp.AvailabilityRuns.CapacitySettings) > 0)
	resp.Feasibility.Enabled = (len(resp.Feasibility.GetLocations().Locations) > 0 &&
		resp.Feasibility.MinVisitDurationSec > 0 &&
		resp.Feasibility.MaxVisitDurationSec > resp.Feasibility.MinVisitDurationSec)
	resp.Schedule.Enabled = (len(resp.Schedule.Days) == 7)

	resp.Lv1Launchable = (resp.Sync.Enabled &&
		resp.OptimizerRuns.Enabled &&
		resp.AvailabilityRuns.Enabled &&
		resp.Feasibility.Enabled &&
		resp.Schedule.Enabled)

	return &logisticspb.GetMarketDiagnosticsResponse{
		Market: resp,
	}, nil
}

var (
	canonicalLocsCSVHeader = []string{"latitude", "longitude"}
)

func locsFromCSVData(csvData []byte) ([]logistics.LatLng, error) {
	r := csv.NewReader(bytes.NewReader(csvData))
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(rows) < 2 {
		return nil, errors.New("not enough rows in CSV")
	}

	headerRow := rows[0]
	properHeader := (len(headerRow) == 2 &&
		(headerRow[0] == canonicalLocsCSVHeader[0]) &&
		(headerRow[1] == canonicalLocsCSVHeader[1]))
	if !properHeader {
		return nil, fmt.Errorf("CSV header row must be %s", strings.Join(canonicalLocsCSVHeader, ","))
	}

	lls := make([]logistics.LatLng, len(rows)-1)
	for i, row := range rows[1:] {
		lat, err := strconv.ParseFloat(row[0], 64)
		if err != nil {
			return nil, fmt.Errorf("row %d: bad latitude (%s)", i+2, row[0])
		}
		lng, err := strconv.ParseFloat(row[1], 64)
		if err != nil {
			return nil, fmt.Errorf("row %d: bad longitude (%s)", i+2, row[1])
		}

		lls[i] = logistics.NewLatLng(lat, lng)
	}

	return lls, nil
}

func (s *GRPCServer) UpdateMarketFeasibilityCheckSettings(
	ctx context.Context,
	req *logisticspb.UpdateMarketFeasibilityCheckSettingsRequest,
) (*logisticspb.UpdateMarketFeasibilityCheckSettingsResponse, error) {
	if req.MarketId == 0 {
		return nil, errMarketIDRequired
	}

	var minVisitDuration *time.Duration
	if req.MinVisitDurationSec != nil {
		minVisitDurationSec := req.GetMinVisitDurationSec()
		if minVisitDurationSec <= 0 {
			return nil, status.Errorf(codes.InvalidArgument, "minimum visit duration must be greater than 0")
		}

		duration := time.Duration(minVisitDurationSec) * time.Second
		minVisitDuration = &duration
	}

	var maxVisitDuration *time.Duration
	if req.MaxVisitDurationSec != nil {
		maxVisitDurationSec := req.GetMaxVisitDurationSec()
		if maxVisitDurationSec <= 0 {
			return nil, status.Errorf(codes.InvalidArgument, "maximum visit duration must be greater than 0")
		}

		if maxVisitDurationSec < req.GetMinVisitDurationSec() {
			return nil, status.Errorf(codes.InvalidArgument, "maximum visit duration must be greater than minimum visit duration")
		}

		duration := time.Duration(maxVisitDurationSec) * time.Second
		maxVisitDuration = &duration
	}

	var lls []logistics.LatLng
	switch req.Data.(type) {
	case *logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_CsvData:
		var err error
		lls, err = locsFromCSVData(req.GetCsvData())
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, fmt.Errorf("bad csv data: %w", err).Error())
		}
	case *logisticspb.UpdateMarketFeasibilityCheckSettingsRequest_Locations:
		locs := req.GetLocations().GetLocations()
		lls = make([]logistics.LatLng, len(locs))
		for i, loc := range locs {
			lls[i] = logistics.LatLng{
				LatE6: loc.LatitudeE6,
				LngE6: loc.LongitudeE6,
			}
		}

	default:
		return nil, status.Errorf(codes.InvalidArgument, "not supported")
	}

	if len(lls) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "no locations")
	}

	region, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, req.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "no market for id")
	}

	_, err = s.LogisticsDB.UpdateServiceRegionFeasibilityCheckSettings(
		ctx,
		logisticsdb.UpdateServiceRegionFeasibilityCheckSettingsParams{
			ServiceRegionID:  region.ID,
			Locations:        lls,
			MinVisitDuration: minVisitDuration,
			MaxVisitDuration: maxVisitDuration,
		})
	if err != nil {
		return nil, status.Errorf(codes.Internal,
			fmt.Errorf("could not update canonical locations: %w", err).Error())
	}

	return &logisticspb.UpdateMarketFeasibilityCheckSettingsResponse{}, nil
}

// UpdateCareRequestStatus is DEPRECATED, in favor of taking visit phase information during visit snapshotting.
func (s *GRPCServer) UpdateCareRequestStatus(
	_ context.Context,
	_ *logisticspb.UpdateCareRequestStatusRequest,
) (*logisticspb.UpdateCareRequestStatusResponse, error) {
	return &logisticspb.UpdateCareRequestStatusResponse{}, nil
}

func (s *GRPCServer) GetCareRequestETA(
	ctx context.Context,
	req *logisticspb.GetCareRequestETARequest,
) (*logisticspb.GetCareRequestETAResponse, error) {
	if req.CareRequestId == nil {
		return nil, status.Error(codes.InvalidArgument, "care request id must be set")
	}

	latestTimestamp := s.now()
	careRequestLatestInfo, err := s.LogisticsDB.GetLatestInfoForCareRequest(ctx, req.GetCareRequestId(), latestTimestamp)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrUnknownCareRequest) {
			return nil, status.Errorf(codes.NotFound, "unknown care request: %v", err)
		}
		return nil, status.Errorf(codes.Internal, "unable to get care request: %v", err)
	}

	return s.etaFromCareRequestLatestInfo(ctx, careRequestLatestInfo, latestTimestamp)
}

func (s *GRPCServer) etaFromCareRequestLatestInfo(
	ctx context.Context,
	careRequestLatestInfo *logisticsdb.CareRequestLatestInfo,
	currentTimestamp time.Time,
) (*logisticspb.GetCareRequestETAResponse, error) {
	visitPhaseShortName := logisticsdb.VisitPhaseShortName(careRequestLatestInfo.VisitPhaseShortName)
	if err := visitPhaseShortName.Validate(); err != nil {
		return nil, err
	}

	monitoring.AddGRPCTag(ctx, visitPhaseTag, visitPhaseShortName.String())
	switch visitPhaseShortName {
	case logisticsdb.VisitPhaseTypeShortNameEnRoute:
		// continue
	case logisticsdb.VisitPhaseTypeShortNameRequested:
		return nil, status.Error(codes.FailedPrecondition, "care request is only requested")
	case logisticsdb.VisitPhaseTypeShortNameCompleted,
		logisticsdb.VisitPhaseTypeShortNameOnScene,
		logisticsdb.VisitPhaseTypeShortNameCancelled:
		return nil, status.Error(codes.FailedPrecondition,
			"care request already completed, cancelled, or is on scene")
	case logisticsdb.VisitPhaseTypeShortNameUncommitted, logisticsdb.VisitPhaseTypeShortNameCommitted:
		precision := logisticspb.GetCareRequestETAResponse_PRECISION_COARSE
		monitoring.AddGRPCTag(ctx, etaPrecisionTag, precision.String())
		return &logisticspb.GetCareRequestETAResponse{
			EstimatedArrivalTimestampSec: proto.Int64(careRequestLatestInfo.CareRequestEtaSec),
			Precision:                    precision.Enum(),
		}, nil
	default:
		return nil, status.Errorf(codes.Unimplemented, "Unknown visit phase type %s", visitPhaseShortName)
	}

	if careRequestLatestInfo.VisitLocation == nil {
		return nil, status.Error(codes.Internal,
			"care request doesn't have enough data to provide an ETA, missing care request location")
	}

	if careRequestLatestInfo.ShiftTeamLocation == nil {
		return nil,
			status.Error(codes.Internal,
				"care request doesn't have enough data to provide an ETA, missing shift team location")
	}

	origin := logistics.LatLng{
		LatE6: careRequestLatestInfo.ShiftTeamLocation.LatitudeE6,
		LngE6: careRequestLatestInfo.ShiftTeamLocation.LongitudeE6,
	}
	destination := logistics.LatLng{
		LatE6: careRequestLatestInfo.VisitLocation.LatitudeE6,
		LngE6: careRequestLatestInfo.VisitLocation.LongitudeE6,
	}
	mapService, err := s.MapServicePicker.RealTimeTrafficMapService(ctx, careRequestLatestInfo.ServiceRegionID)
	if err != nil {
		return nil,
			status.Errorf(codes.Internal,
				"error resolving map service for service region(%d): %s",
				careRequestLatestInfo.ServiceRegionID,
				err.Error())
	}
	tags := monitoring.Tags{
		serviceRegionTag: logisticsdb.I64ToA(careRequestLatestInfo.ServiceRegionID),
	}
	route, err := mapService.GetRoute(ctx, tags, origin, destination)
	if err != nil {
		return nil, status.Errorf(codes.FailedPrecondition, "unable to get ETA for care request: %v", err)
	}

	precision := logisticspb.GetCareRequestETAResponse_PRECISION_EN_ROUTE_REALTIME
	monitoring.AddGRPCTag(ctx, etaPrecisionTag, precision.String())
	etaSec := currentTimestamp.Add(route.Distance.Duration).Unix()
	return &logisticspb.GetCareRequestETAResponse{
		EstimatedArrivalTimestampSec: proto.Int64(etaSec),
		Precision:                    precision.Enum(),
	}, nil
}

func (s *GRPCServer) GetAssignableShiftTeams(
	ctx context.Context,
	req *logisticspb.GetAssignableShiftTeamsRequest,
) (*logisticspb.GetAssignableShiftTeamsResponse, error) {
	if req.Visit == nil {
		return nil, status.Errorf(codes.InvalidArgument, "visit must be set")
	}

	visit := req.Visit
	if visit.MarketId == nil {
		return nil, status.Errorf(codes.InvalidArgument, "visit market ID must be set")
	}
	monitoring.AddGRPCTag(ctx, marketTag, logisticsdb.I64ToA(visit.GetMarketId()))

	if visit.TimeWindow == nil {
		return nil, status.Errorf(codes.InvalidArgument, "visit time window must be set")
	}

	startTime, err := logisticsdb.ProtoDateTimeToTime(visit.TimeWindow.StartDatetime)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "unable to convert proto start time to time %v", err)
	}

	endTime, err := logisticsdb.ProtoDateTimeToTime(visit.TimeWindow.EndDatetime)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "unable to convert proto end time to time %v", err)
	}

	serviceRegion, err := s.LogisticsDB.GetServiceRegionForStationMarketID(ctx, *visit.MarketId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "unable to get candidates: %v", err)
	}

	tz, err := time.LoadLocation(serviceRegion.IanaTimeZoneName)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "unable to get candidates: %v", err)
	}

	serviceDate := dateInTimezone(*startTime, tz)
	latestSnapshot := s.now()
	monitoring.AddGRPCTags(ctx, monitoring.Tags{
		serviceDateTag: serviceDate.Format(dateLayout),
	})

	monitoring.AddGRPCFields(ctx, monitoring.Fields{
		"required_attributes":  len(visit.GetRequiredAttributes()),
		"preferred_attributes": len(visit.GetPreferredAttributes()),
		"forbidden_attributes": len(visit.GetForbiddenAttributes()),
		"unwanted_attributes":  len(visit.GetUnwantedAttributes()),
	})

	candidates, err := s.LogisticsDB.GetAssignableShiftTeamCandidatesForDate(
		ctx,
		logisticsdb.GetAssignableShiftTeamCandidatesForDateParams{
			StationMarketID:    *visit.MarketId,
			Date:               serviceDate,
			LatestSnapshotTime: latestSnapshot,
		})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "unable to get shift team candidates: %v", err)
	}

	if candidates == nil {
		return &logisticspb.GetAssignableShiftTeamsResponse{}, nil
	}

	assignableShiftTeamResponse, err := s.OptimizerService.GetAssignableShiftTeams(
		ctx,
		&optimizerpb.GetAssignableShiftTeamsRequest{
			Visit: &optimizerpb.AssignableVisit{
				Id: visit.Id,
				ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
					StartTimestampSec: proto.Int64(startTime.Unix()),
					EndTimestampSec:   proto.Int64(endTime.Unix()),
				},
				RequiredAttributes: logisticsdb.VRPAttributesFromAttributes(
					attributes.Attributes(visit.RequiredAttributes).ToInternal()),
				PreferredAttributes: logisticsdb.VRPAttributesFromAttributes(
					attributes.Attributes(visit.PreferredAttributes).ToInternal()),
				ForbiddenAttributes: logisticsdb.VRPAttributesFromAttributes(
					attributes.Attributes(visit.ForbiddenAttributes).ToInternal()),
				UnwantedAttributes: logisticsdb.VRPAttributesFromAttributes(
					attributes.Attributes(visit.UnwantedAttributes).ToInternal()),
			},
			ShiftTeams: candidates,
		})
	if err != nil {
		return nil, status.Errorf(status.Code(err), "unable to get assignable shift teams: %v", err)
	}

	return assignableShiftTeamResponseFromOptimizerResponse(ctx, assignableShiftTeamResponse), nil
}

// TODO: Refactor to use in various date sanitization usages.
func dateInTimezone(t time.Time, tz *time.Location) time.Time {
	return logisticsdb.TimestampFromDateTimeLoc(t.In(tz), time.Time{}, tz)
}

func assignableShiftTeamResponseFromOptimizerResponse(
	ctx context.Context,
	optimizerResponse *optimizerpb.GetAssignableShiftTeamsResponse,
) *logisticspb.GetAssignableShiftTeamsResponse {
	shiftTeamStatusCountMap := map[optimizerpb.AssignableShiftTeamResult_Status]int64{}

	vrpShiftTeamsResults := optimizerResponse.ShiftTeams
	results := make([]*logisticspb.AssignableShiftTeamResult, len(vrpShiftTeamsResults))
	for i, vrpShiftTeamResult := range vrpShiftTeamsResults {
		vrpShiftTeam := vrpShiftTeamResult.ShiftTeam
		results[i] = &logisticspb.AssignableShiftTeamResult{
			ShiftTeam: &logisticspb.AssignableShiftTeam{
				Id: vrpShiftTeam.Id,
				AvailableTimeWindow: logisticsdb.TimeWindowFromVRPTimeWindow(
					vrpShiftTeam.AvailableTimeWindow),
				Attributes: logisticsdb.AttributesFromVRPAttributes(
					vrpShiftTeam.Attributes).ToExternal().ToCommon(),
			},
			Status:                      logisticsdb.OptimizerAssignableStatusToLogisticsAssignableStatus[*vrpShiftTeamResult.Status].Enum(),
			TimeWindowStatus:            logisticsdb.OptimizerTimeWindowStatusToLogisticsTimeWindowStatus[*vrpShiftTeamResult.TimeWindowStatus].Enum(),
			MissingRequiredAttributes:   logisticsdb.AttributesFromVRPAttributes(vrpShiftTeamResult.MissingRequiredAttributes).ToExternal().ToCommon(),
			MissingPreferredAttributes:  logisticsdb.AttributesFromVRPAttributes(vrpShiftTeamResult.MissingPreferredAttributes).ToExternal().ToCommon(),
			IncludedForbiddenAttributes: logisticsdb.AttributesFromVRPAttributes(vrpShiftTeamResult.IncludedForbiddenAttributes).ToExternal().ToCommon(),
			IncludedUnwantedAttributes:  logisticsdb.AttributesFromVRPAttributes(vrpShiftTeamResult.IncludedUnwantedAttributes).ToExternal().ToCommon(),
		}

		shiftTeamStatusCountMap[*vrpShiftTeamResult.Status]++
	}

	monitoring.AddGRPCFields(ctx, monitoring.Fields{
		"assignable_shift_teams":          shiftTeamStatusCountMap[optimizerpb.AssignableShiftTeamResult_STATUS_ASSIGNABLE],
		"override_assignable_shift_teams": shiftTeamStatusCountMap[optimizerpb.AssignableShiftTeamResult_STATUS_OVERRIDE_ASSIGNABLE],
		"unassignable_shift_teams":        shiftTeamStatusCountMap[optimizerpb.AssignableShiftTeamResult_STATUS_NOT_ASSIGNABLE],
	})
	return &logisticspb.GetAssignableShiftTeamsResponse{
		ShiftTeams: results,
	}
}

func (s *GRPCServer) GetAssignableVisits(
	ctx context.Context,
	req *logisticspb.GetAssignableVisitsRequest,
) (*logisticspb.GetAssignableVisitsResponse, error) {
	if len(req.MarketIds) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "marketIds is required")
	}

	if len(req.VisitPhases) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "latestVisitPhases is required")
	}

	if len(req.VirtualAppVisitPhases) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "latestVirtualAppVisitPhases is required")
	}

	if len(req.ShiftTeamAttributes) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "attributes is required")
	}

	if req.TimeWindow == nil {
		return nil, status.Errorf(codes.InvalidArgument, "timeWindow is required")
	}

	startTime, err := logisticsdb.ProtoDateTimeToTime(req.GetTimeWindow().GetStartDatetime())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid start time")
	}

	endTime, err := logisticsdb.ProtoDateTimeToTime(req.GetTimeWindow().GetEndDatetime())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid endtime time")
	}

	var extAttributes attributes.ExternalAttributes
	for _, attr := range req.ShiftTeamAttributes {
		extAttributes = append(extAttributes, &attributes.ExternalAttribute{Name: attr.Name})
	}

	latestSnapshot := s.now()
	visits, err := s.LogisticsDB.GetAssignableVisitsForDate(ctx, logisticsdb.GetAssignableVisitsForDateParams{
		MarketIDs:             req.MarketIds,
		Date:                  *startTime,
		LatestSnapshotTime:    latestSnapshot,
		VisitPhases:           req.VisitPhases,
		VirtualAPPVisitPhases: req.VirtualAppVisitPhases,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "unable to get assignable visits: %v", err)
	}

	optimizerAssignableVisits, err := s.OptimizerService.GetAssignableVisits(
		ctx,
		&optimizerpb.GetAssignableVisitsRequest{
			ShiftTeam: &optimizerpb.AssignableShiftTeam{
				AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
					StartTimestampSec: proto.Int64(startTime.Unix()),
					EndTimestampSec:   proto.Int64(endTime.Unix()),
				},
				Attributes: logisticsdb.VRPAttributesFromAttributes(extAttributes.ToInternal()),
			},
			Visits: visits,
		})
	if err != nil {
		return nil, status.Errorf(status.Code(err), "unable to get optimizer assignable visits: %v", err)
	}

	var assignableVisits []*logisticspb.AssignableVisitResult
	for _, visit := range optimizerAssignableVisits.Visits {
		if assignableVisitFilterStatuses[visit.Status] {
			assignableVisits = append(assignableVisits, &logisticspb.AssignableVisitResult{
				CareRequestId: *visit.Visit.Id,
			})
		}
	}

	return &logisticspb.GetAssignableVisitsResponse{
		Visits: assignableVisits,
	}, nil
}

func validateCompareScheduleCounterfactualRequest(req *logisticspb.CompareScheduleCounterfactualRequest) error {
	if req == nil {
		return errors.New("invalid nil request")
	}

	if len(req.ScheduleToken) == 0 {
		return errors.New("empty ScheduleToken")
	}

	if len(req.AdditionalScheduleConstraints) == 0 {
		return errors.New(
			"must supply AdditionalScheduleConstraints for the schedule to be any different from the production schedule")
	}

	return nil
}

func validateCounterfactualConstraintConsistency(
	req *logisticspb.CompareScheduleCounterfactualRequest,
	actualSchedule *logisticspb.ServiceRegionDateSchedule,
	actualProblemData *logisticsdb.VRPProblemData,
) error {
	knownCareRequestIDs := collections.NewLinkedInt64Set(len(actualSchedule.GetSchedules()))
	routeHistoryCareRequestIDs := collections.NewLinkedInt64Set(len(actualSchedule.GetSchedules()))
	knownShiftTeamIDs := collections.NewLinkedInt64Set(len(actualSchedule.GetSchedules()))

	for _, v := range actualProblemData.VRPProblem.GetDescription().GetVisits() {
		crID, ok := actualProblemData.EntityMappings.CareRequests[logisticsdb.VisitSnapshotID(v.GetId())]
		if !ok {
			return fmt.Errorf("invalid problemData with no care request ID for visit snapshot: %d", v.GetId())
		}
		knownCareRequestIDs.Add(crID.Int64())
	}
	for _, st := range actualProblemData.VRPProblem.GetDescription().GetShiftTeams() {
		stID, ok := actualProblemData.EntityMappings.ShiftTeams[logisticsdb.ShiftTeamSnapshotID(st.GetId())]
		if !ok {
			return fmt.Errorf("invalid problemData with no shift team ID for shift team snapshot: %d", st.GetId())
		}
		knownShiftTeamIDs.Add(stID.Int64())
	}
	for _, shiftTeam := range actualProblemData.VRPProblem.GetDescription().GetShiftTeams() {
		for _, routeHistoryStop := range shiftTeam.GetRouteHistory().GetStops() {
			if v := routeHistoryStop.GetVisit(); v != nil {
				crID, ok := actualProblemData.EntityMappings.CareRequests[logisticsdb.VisitSnapshotID(v.GetVisitId())]
				if !ok {
					return fmt.Errorf(
						"invalid route history stop, unknown visit -> care request mapping: visit_id(%d)",
						v.GetVisitId())
				}
				routeHistoryCareRequestIDs.Add(crID.Int64())
			}
		}
	}

	type pairingTuple struct {
		shiftTeamID   int64
		careRequestID int64
	}
	seenOrderingConstraintCRIDs := collections.NewLinkedInt64Set(len(req.GetAdditionalScheduleConstraints()))
	seenPairings := collections.NewLinkedSet[pairingTuple](len(req.GetAdditionalScheduleConstraints()))
	for _, constraint := range req.GetAdditionalScheduleConstraints() {
		switch c := constraint.Constraint.(type) {
		case *logisticspb.CounterfactualScheduleConstraint_Ordering_:
			o := c.Ordering
			for _, crID := range o.GetCareRequestIds() {
				if !knownCareRequestIDs.Has(crID) {
					return fmt.Errorf("unknown care request ID for ordering constraint: %d", crID)
				}
				if routeHistoryCareRequestIDs.Has(crID) {
					return fmt.Errorf(
						"historical (already served) care request ID cannot be in ordering constraint: %d",
						crID)
				}
				if seenOrderingConstraintCRIDs.Has(crID) {
					return fmt.Errorf("duplicate care request ID in ordering constraint: %d", crID)
				}
				seenOrderingConstraintCRIDs.Add(crID)
			}

		case *logisticspb.CounterfactualScheduleConstraint_Pairing_:
			p := c.Pairing
			if !knownCareRequestIDs.Has(p.GetCareRequestId()) {
				return fmt.Errorf("unknown care request ID for pairing constraint: %d", p.GetCareRequestId())
			}
			if routeHistoryCareRequestIDs.Has(p.GetCareRequestId()) {
				return fmt.Errorf(
					"historical (already served) care request ID cannot be in pairing constraint: %d",
					p.GetCareRequestId())
			}

			if !knownShiftTeamIDs.Has(p.GetShiftTeamId()) {
				return fmt.Errorf("unknown shift team ID for pairing constraint: %d", p.GetShiftTeamId())
			}
			pairing := pairingTuple{
				shiftTeamID:   p.GetShiftTeamId(),
				careRequestID: p.GetCareRequestId(),
			}
			if seenPairings.Has(pairing) {
				return fmt.Errorf("duplicate pairing found in pairing/unpairing constraint: %v", pairing)
			}
			seenPairings.Add(pairing)

		case *logisticspb.CounterfactualScheduleConstraint_Unpairing_:
			up := c.Unpairing
			if !knownCareRequestIDs.Has(up.GetCareRequestId()) {
				return fmt.Errorf("unknown care request ID for unpairing constraint: %d", up.GetCareRequestId())
			}
			if !knownShiftTeamIDs.Has(up.GetShiftTeamId()) {
				return fmt.Errorf("unknown shift team ID for unpairing constraint: %d", up.GetShiftTeamId())
			}
			if routeHistoryCareRequestIDs.Has(up.GetCareRequestId()) {
				return fmt.Errorf(
					"historical (already served) care request ID cannot be in unpairing constraint: %d",
					up.GetCareRequestId())
			}

			pairing := pairingTuple{
				shiftTeamID:   up.GetShiftTeamId(),
				careRequestID: up.GetCareRequestId(),
			}
			if seenPairings.Has(pairing) {
				return fmt.Errorf("duplicate pairing found in unpairing/pairing constraint: %v", pairing)
			}
			seenPairings.Add(pairing)

		case *logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride_:
			stOverride := c.ShiftTeamOverride
			if !knownShiftTeamIDs.Has(stOverride.GetShiftTeamId()) {
				return fmt.Errorf("unknown shift team ID for override constraint: %d", stOverride.GetShiftTeamId())
			}

		default:
			return errors.New("unhandled CounterfactualScheduleConstraint type")
		}
	}
	return nil
}

// applyCounterfactualConstraintsToProblem returns a copy of the problemData.VRPProblem with changes
// to enforce the CompareScheduleCounterfactualRequest's AdditionalScheduleConstraints.
func applyCounterfactualConstraintsToProblem(
	req *logisticspb.CompareScheduleCounterfactualRequest,
	problemData *logisticsdb.VRPProblemData,
) (*optimizerpb.VRPProblem, error) {
	clonedProblem := proto.Clone(problemData.VRPProblem).(*optimizerpb.VRPProblem)
	visitIndexByCareRequestID := make(map[int64]*optimizerpb.VRPVisit,
		len(problemData.VRPProblem.GetDescription().GetVisits()))
	shiftTeamIndexByShiftTeamID := make(map[int64]*optimizerpb.VRPShiftTeam,
		len(problemData.VRPProblem.GetDescription().GetShiftTeams()))
	for _, v := range clonedProblem.GetDescription().GetVisits() {
		crID, ok := problemData.EntityMappings.CareRequests[logisticsdb.VisitSnapshotID(v.GetId())]
		if !ok {
			return nil, fmt.Errorf(
				"invalid problemData with no care request ID for visit snapshot: %d",
				v.GetId())
		}
		visitIndexByCareRequestID[crID.Int64()] = v
	}
	for _, st := range clonedProblem.GetDescription().GetShiftTeams() {
		stID, ok := problemData.EntityMappings.ShiftTeams[logisticsdb.ShiftTeamSnapshotID(st.GetId())]
		if !ok {
			return nil, fmt.Errorf(
				"invalid problemData with no shift team ID for shift team snapshot: %d",
				st.GetId())
		}
		shiftTeamIndexByShiftTeamID[stID.Int64()] = st
	}

	for _, constraint := range req.GetAdditionalScheduleConstraints() {
		switch constraint.Constraint.(type) {
		case *logisticspb.CounterfactualScheduleConstraint_Ordering_:
			return nil, errors.New("CounterfactualScheduleConstraint_Ordering is unimplemented")

		case *logisticspb.CounterfactualScheduleConstraint_Pairing_:
			p := constraint.GetPairing()
			attr := pairingAttribute(p.CareRequestId, p.ShiftTeamId)

			// To enforce a pairing: we inject a required attribute to the referenced visit and shift team.
			// TODO(very nice to have): consider validating that the care request is not overly constrained:
			// e.g. that it's not "manually assigned" to another care request at the same time.
			visitIndexByCareRequestID[p.CareRequestId].RequiredAttributes = append(
				visitIndexByCareRequestID[p.CareRequestId].RequiredAttributes,
				attr,
			)
			shiftTeamIndexByShiftTeamID[p.ShiftTeamId].Attributes = append(
				shiftTeamIndexByShiftTeamID[p.ShiftTeamId].Attributes,
				attr,
			)

		case *logisticspb.CounterfactualScheduleConstraint_Unpairing_:
			up := constraint.GetUnpairing()
			attr := unpairingAttribute(up.CareRequestId, up.ShiftTeamId)

			// To enforce a unpairing: we inject a forbidden attribute to the referenced visit and shift team.
			// TODO(very nice to have): consider validating that the care request is not overly constrained:
			// e.g. that it's not "manually assigned" to this same shift team!
			visitIndexByCareRequestID[up.CareRequestId].ForbiddenAttributes = append(
				visitIndexByCareRequestID[up.CareRequestId].ForbiddenAttributes,
				attr,
			)
			shiftTeamIndexByShiftTeamID[up.ShiftTeamId].Attributes = append(
				shiftTeamIndexByShiftTeamID[up.ShiftTeamId].Attributes,
				attr,
			)

		case *logisticspb.CounterfactualScheduleConstraint_ShiftTeamOverride_:
			stOverride := constraint.GetShiftTeamOverride()
			sts := shiftTeamIndexByShiftTeamID[stOverride.ShiftTeamId]
			if stOverride.StartTimestampSec > 0 {
				sts.AvailableTimeWindow.StartTimestampSec = &stOverride.StartTimestampSec
			}

			if stOverride.EndTimestampSec > 0 {
				sts.AvailableTimeWindow.EndTimestampSec = &stOverride.EndTimestampSec
			}

		default:
			return nil, errors.New("unhandled CounterfactualScheduleConstraint type")
		}
	}
	return clonedProblem, nil
}

func unpairingAttribute(careRequestID int64, shiftTeamID int64) *optimizerpb.VRPAttribute {
	return &optimizerpb.VRPAttribute{
		Id: fmt.Sprintf("counterfactual_unpairing_%d_%d", careRequestID, shiftTeamID),
	}
}

func pairingAttribute(careRequestID int64, shiftTeamID int64) *optimizerpb.VRPAttribute {
	return &optimizerpb.VRPAttribute{
		Id: fmt.Sprintf("counterfactual_pairing_%d_%d", careRequestID, shiftTeamID),
	}
}

func (s *GRPCServer) CompareScheduleCounterfactual(
	ctx context.Context,
	req *logisticspb.CompareScheduleCounterfactualRequest,
) (*logisticspb.CompareScheduleCounterfactualResponse, error) {
	now := s.now()
	if err := validateCompareScheduleCounterfactualRequest(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %s", err.Error())
	}

	scheduleToken, err := scheduleTokenFromOpaqueToken(req.ScheduleToken)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid schedule token: %s", err.Error())
	}

	scheduleID := scheduleToken.GetScheduleId()
	actualSchedule, err := s.LogisticsDB.GetShiftTeamsSchedulesFromScheduleID(
		ctx,
		scheduleID,
		now,
		true)
	if err != nil {
		return nil, status.Errorf(codes.Internal,
			"error in GetShiftTeamsSchedulesFromScheduleID: %s",
			err.Error())
	}

	actualProblemData, err := s.LogisticsDB.VRPProblemDataForSchedule(ctx, scheduleID)
	if err != nil {
		if errors.Is(err, logisticsdb.ErrScheduleNotFound) {
			return nil, status.Errorf(codes.NotFound, "schedule(%d) not found", scheduleID)
		}
		return nil, status.Errorf(codes.Internal, "error in VRPProblemForSchedule: %s", err.Error())
	}

	if err := validateCounterfactualConstraintConsistency(req, actualSchedule.Schedule, actualProblemData); err != nil {
		return nil, status.Errorf(codes.InvalidArgument,
			"request inconsistent with schedule data: %s", err.Error())
	}

	counterfactualProblem, err := applyCounterfactualConstraintsToProblem(req, actualProblemData)
	if err != nil {
		return nil, status.Errorf(codes.Internal,
			"error in applyCounterfactualConstraintsToProblem: %s", err.Error())
	}

	respChan, err := s.VRPSolver.SolveVRP(ctx, &optimizer.SolveVRPParams{
		SolveVRPRequest: &optimizerpb.SolveVRPRequest{
			Problem: counterfactualProblem,
			// TODO(https://github.com/*company-data-covered*/services/pull/1523): Also resolve this config similarly.
			Config: &optimizerpb.VRPConfig{
				// TODO: Add feasibility from settings.
				TerminationDurationMs:        proto.Int64(defaultFeasibilityVRPTerminationDuration.Milliseconds()),
				PerVisitRevenueUsdCents:      proto.Int64(25000),
				AppHourlyCostUsdCents:        proto.Int64(8700),
				DhmtHourlyCostUsdCents:       proto.Int64(2500),
				TerminationType:              optimizerpb.VRPConfig_TERMINATION_TYPE_BEST_FOR_TIME.Enum(),
				IncludeIntermediateSolutions: proto.Bool(false),
				// TODO: Add in constraint config from previous run.
				ConstraintConfig: optimizer.DefaultConstraintConfig.ToProto(),
			},
			// TODO: Add Monitoring field.
		},
		// TODO MARK-2576: Find a better optimizer run type.
		OptimizerRunType: logisticsdb.ServiceRegionScheduleRunType,
		WriteToDatabase:  false,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error in SolveVRP: %s", err.Error())
	}
	result := <-respChan
	if result == nil {
		return nil, status.Error(codes.Unavailable, "SolveVRP returned no solution in time for problem")
	}

	counterfactualSchedule, err := (&logisticsdb.CounterfactualSchedule{
		CounterfactualSolution: result.Response.GetSolution(),
		EntityMappings:         actualProblemData.EntityMappings,
		ServiceDate:            actualSchedule.Schedule.Meta.ServiceDate,
	}).Schedule()
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error in scheduleFromVRPSolution: %s", err.Error())
	}

	return &logisticspb.CompareScheduleCounterfactualResponse{
		// Original Data:
		OriginalSchedule: actualSchedule.Schedule,
		OriginalScore:    actualSchedule.Score,
		// Counterfactual Data:
		CounterfactualSchedule: counterfactualSchedule.Schedule,
		CounterfactualScore:    counterfactualSchedule.Score,
	}, nil
}

func scheduleTokenFromOpaqueToken(opaqueToken []byte) (*logisticspb.ScheduleToken, error) {
	scheduleToken := &logisticspb.ScheduleToken{}
	err := proto.Unmarshal(opaqueToken, scheduleToken)
	if err != nil {
		return nil, err
	}

	return scheduleToken, nil
}

func (s *GRPCServer) GetServiceRegionAvailability(
	ctx context.Context,
	req *logisticspb.GetServiceRegionAvailabilityRequest,
) (*logisticspb.GetServiceRegionAvailabilityResponse, error) {
	if req.MarketId == nil {
		return nil, status.Errorf(codes.InvalidArgument, "marketID is required")
	}

	if req.ServiceDate == nil {
		return nil, status.Errorf(codes.InvalidArgument, "service Date is required")
	}

	requiredAttrSets := req.RequiredAttributesSets
	serviceDate := logisticsdb.ProtoDateToTime(req.ServiceDate)
	availability, err := s.LogisticsDB.ServiceRegionAvailability(ctx, logisticsdb.ServiceRegionAvailabilityParams{
		StationMarketID:   *req.MarketId,
		ServiceDate:       *serviceDate,
		IncludeAttributes: len(requiredAttrSets) > 0,
		SnapshotTime:      s.now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error getting availability: %v", err)
	}

	availabilities := checkfeasibility.AvailabilitiesFromServiceRegionAvailabilityData(availability, req.RequiredAttributesSets)

	err = s.addServiceRegionQueries(ctx, &addServiceRegionAvailabilityQueriesParams{
		serviceRegionAvailabilityData: availability,
		serviceRegionAvailabilities:   availabilities,
		requiredAttributesSets:        requiredAttrSets,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error storing availability queries: %v", err)
	}

	return &logisticspb.GetServiceRegionAvailabilityResponse{
		Availabilities: availabilities,
	}, nil
}

func availabilityQueriesParams(
	availabilities []*logisticspb.ServiceRegionAvailability,
	availabilityData *logisticsdb.ServiceRegionAvailability,
) logisticssql.AddServiceRegionAvailabilityQueriesParams {
	serviceRegionIDs := make([]int64, len(availabilities))
	serviceDates := make([]time.Time, len(availabilities))
	scheduleIDs := make([]int64, len(availabilities))
	statuses := make([]string, len(availabilities))
	for i, availability := range availabilities {
		availabilityResult := availabilityData.Results[i]
		serviceRegionIDs[i] = availabilityData.ServiceRegionID
		serviceDates[i] = availabilityResult.ServiceDate

		scheduleID := int64(0)
		if availabilityResult.ScheduleDiagnostics != nil {
			scheduleID = availabilityResult.ScheduleDiagnostics.ScheduleID
		}
		scheduleIDs[i] = scheduleID
		statuses[i] = availability.Status.String()
	}

	return logisticssql.AddServiceRegionAvailabilityQueriesParams{
		ServiceRegionIds:     serviceRegionIDs,
		ServiceDates:         serviceDates,
		ReferenceScheduleIds: scheduleIDs,
		FeasibilityStatuses:  statuses,
	}
}

type addServiceRegionAvailabilityQueriesParams struct {
	serviceRegionAvailabilityData *logisticsdb.ServiceRegionAvailability
	serviceRegionAvailabilities   []*logisticspb.ServiceRegionAvailability
	requiredAttributesSets        []*logisticspb.GetServiceRegionAvailabilityRequest_RequiredAttributesSet
}

func (s *GRPCServer) addServiceRegionQueries(ctx context.Context, params *addServiceRegionAvailabilityQueriesParams) error {
	queriesParams := availabilityQueriesParams(params.serviceRegionAvailabilities, params.serviceRegionAvailabilityData)
	availabilityQueries, err := s.LogisticsDB.AddServiceRegionAvailabilityQueries(ctx, queriesParams)
	if err != nil {
		return err
	}

	attrNamesSet := collections.NewLinkedSet[string](0)
	for _, set := range params.requiredAttributesSets {
		for _, attr := range set.RequiredAttributes {
			attrNamesSet.Add(attr.Name)
		}
	}

	serviceRegionID := params.serviceRegionAvailabilityData.ServiceRegionID
	_, err = s.LogisticsDB.AddServiceRegionAvailabilityQueryAttributes(ctx, availabilityQueries, attrNamesSet.Elems())
	if err != nil {
		return fmt.Errorf("error storing availability query attributes for service region id %d: %w", serviceRegionID, err)
	}

	return nil
}

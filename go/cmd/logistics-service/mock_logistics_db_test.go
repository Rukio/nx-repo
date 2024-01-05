package main

import (
	"context"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
)

// MockLogisticsDB is a mock implementation of LogisticsDB for testing.
//
// It allows direct configuration of the return (including error) values.
// It does not (yet) capture whether it is called or the arguments that it is
// called with, but that is a relatively simple extension if desired.
type MockLogisticsDB struct {
	WriteVisitSnapshotResult                          *logisticssql.VisitSnapshot
	WriteVisitSnapshotErr                             error
	GetServiceRegionOpenHoursForDateResultTW          *logisticsdb.TimeWindow
	GetServiceRegionOpenHoursForDateResultSD          *logisticssql.ServiceRegionOpenHoursScheduleDay
	GetServiceRegionOpenHoursForDateErr               error
	GetVRPShiftTeamsFromScheduleIDResult              []*optimizerpb.VRPShiftTeam
	GetVRPShiftTeamsFromScheduleIDErr                 error
	GetLatestOptimizerRunForRegionDateResult          *logisticssql.OptimizerRun
	GetLatestOptimizerRunForRegionDateErr             error
	AttachCheckFeasibilityRequestToProblemResult      *logisticsdb.VRPProblemData
	AttachCheckFeasibilityRequestToProblemErr         error
	CreateVRPProblemResult                            *logisticsdb.VRPProblemData
	CreateVRPProblemErr                               error
	UpsertVisitLocationsErr                           error
	GetVisitLocationsResult                           []*logisticssql.Location
	GetVisitLocationsErr                              error
	WriteShiftTeamSnapshotResult                      *logisticssql.ShiftTeamSnapshot
	WriteShiftTeamSnapshotErr                         error
	HasAnyNewInfoInRegionSinceResult                  bool
	HasAnyNewInfoInRegionSinceErr                     error
	GetOptimizerRunDiagnosticsResult                  *logisticsdb.OptimizerRunDiagnostics
	GetOptimizerRunDiagnosticsErr                     error
	GetLatestCareRequestsDataForDiagnosticsResult     []*logisticsdb.CareRequestDiagnostics
	GetLatestCareRequestsDataForDiagnosticsError      error
	GetServiceRegionVisitDurationsResult              logisticsdb.VisitServiceDurations
	GetServiceRegionVisitDurationErr                  error
	GetServiceRegionCanonicalLocationsResult          []*logisticssql.Location
	GetServiceRegionCanonicalLocationsErr             error
	UpdateServiceRegionFeasibilityCheckSettingsResult []*logisticssql.Location
	UpdateServiceRegionFeasibilityCheckSettingsErr    error
	GetMarketForStationMarketIDResult                 *logisticssql.Market
	GetMarketForStationMarketIDErr                    error
	GetServiceRegionForStationMarketIDResult          *logisticssql.ServiceRegion
	GetServiceRegionForStationMarketIDErr             error
	GetLatestShiftTeamSnapshotsInRegionResult         []*logisticssql.ShiftTeamSnapshot
	GetLatestShiftTeamSnapshotsInRegionErr            error
	GetLatestShiftTeamSnapshotIDResult                *logisticsdb.ShiftTeamSnapshotIDResponse
	GetLatestShiftTeamSnapshotIDErr                   error
	UpdateShiftTeamLocationResult                     *logisticsdb.UpdateShiftTeamLocationResponse
	UpdateShiftTeamLocationErr                        error
	DeleteVisitSnapshotForCareRequestIDResult         *logisticsdb.DeleteVisitSnapshotForCareRequestIDResponse
	DeleteVisitSnapshotForCareRequestIDErr            error
	UpsertMarketAndServiceRegionFromStationMarketErr  error
	GetLatestShiftTeamSchedulesInServiceRegionResult  *logisticsdb.LatestShiftTeamSchedulesResponse
	GetLatestShiftTeamSchedulesInServiceRegionErr     error
	GetLatestShiftTeamScheduleResult                  *logisticsdb.ShiftTeamSchedule
	GetLatestShiftTeamScheduleErr                     error
	GetLatestInfoForCareRequestResult                 *logisticsdb.CareRequestLatestInfo
	GetLatestInfoForCareRequestErr                    error
	GetLatestShiftTeamLocationIDResult                int64
	GetLatestShiftTeamLocationIDErr                   error
	GetAssignableShiftTeamCandidatesForDateResult     []*optimizerpb.AssignableShiftTeam
	GetAssignableShiftTeamCandidatesForDateErr        error
	AddShiftTeamRestBreakRequestResult                *logisticsdb.AddShiftTeamRestBreakResponse
	AddShiftTeamRestBreakRequestErr                   error
	GetServiceRegionByIDResult                        *logisticssql.ServiceRegion
	GetServiceRegionByIDErr                           error
	GetOpenHoursScheduleForServiceRegionResult        []*common.ScheduleDay
	GetOpenHoursScheduleForServiceRegionErr           error
	AddServiceRegionAvailabilityQueryResult           *logisticssql.ServiceRegionAvailabilityQuery
	AddServiceRegionAvailabilityQueryErr              error
	AddCheckFeasibilityQueryResult                    *logisticssql.CheckFeasibilityQuery
	AddCheckFeasibilityQueryErr                       error
	GetCheckFeasibilityQueriesForCareRequestResult    []*logisticsdb.CheckFeasibilityQueryData
	GetCheckFeasibilityQueriesForCareRequestErr       error
	GetCheckFeasibilityCareRequestHistoryResult       []*logisticspb.CheckFeasibilityCareRequestDiagnostic
	GetCheckFeasibilityCareRequestHistoryErr          error
	GetAssignableVisitsForDateResult                  []*optimizerpb.AssignableVisit
	GetAssignableVisitsForDateErr                     error
	GetShiftTeamsSchedulesFromScheduleIDResult        *logisticsdb.ScheduleAndDebugScore
	GetShiftTeamsSchedulesFromScheduleIDErr           error
	VRPProblemDataForScheduleResult                   *logisticsdb.VRPProblemData
	VRPProblemDataForScheduleErr                      error
	VisitArrivalTimestampsForScheduleResult           map[int64]time.Time
	VisitArrivalTimestampsForScheduleErr              error
	GetServiceRegionVRPDataResult                     *logisticsdb.ServiceRegionVRPData
	GetServiceRegionVRPDataErr                        error
	ServiceRegionAvailabilityResult                   *logisticsdb.ServiceRegionAvailability
	ServiceRegionAvailabilityErr                      error
	AddServiceRegionAvailabilityQueriesResult         []*logisticssql.ServiceRegionAvailabilityQuery
	AddServiceRegionAvailabilityQueriesErr            error
	AddServiceRegionAvailabilityQueryAttributesResult []*logisticssql.ServiceRegionAvailabilityQueryAttribute
	AddServiceRegionAvailabilityQueryAttributesErr    error
}

func (m *MockLogisticsDB) WithVRPProblemDataForScheduleErr(err error) *MockLogisticsDB {
	c := *m
	c.VRPProblemDataForScheduleErr = err
	return &c
}

func (m *MockLogisticsDB) WithGetShiftTeamsSchedulesFromScheduleIDErr(err error) *MockLogisticsDB {
	c := *m
	c.GetShiftTeamsSchedulesFromScheduleIDErr = err
	return &c
}

func (m *MockLogisticsDB) VRPProblemDataForSchedule(ctx context.Context, scheduleID int64) (*logisticsdb.VRPProblemData, error) {
	return m.VRPProblemDataForScheduleResult, m.VRPProblemDataForScheduleErr
}

func (m *MockLogisticsDB) GetShiftTeamsSchedulesFromScheduleID(context.Context, int64, time.Time, bool) (*logisticsdb.ScheduleAndDebugScore, error) {
	return m.GetShiftTeamsSchedulesFromScheduleIDResult, m.GetShiftTeamsSchedulesFromScheduleIDErr
}

func (m *MockLogisticsDB) WriteVisitSnapshot(context.Context, int64, *episodepb.GetVisitResponse) (*logisticssql.VisitSnapshot, error) {
	return m.WriteVisitSnapshotResult, m.WriteVisitSnapshotErr
}

func (m *MockLogisticsDB) GetServiceRegionOpenHoursForDate(context.Context, logisticsdb.GetServiceRegionOpenHoursForDateParams) (*logisticsdb.TimeWindow, *logisticssql.ServiceRegionOpenHoursScheduleDay, error) {
	return m.GetServiceRegionOpenHoursForDateResultTW, m.GetServiceRegionOpenHoursForDateResultSD, m.GetServiceRegionOpenHoursForDateErr
}

func (m *MockLogisticsDB) GetVRPShiftTeamsFromScheduleID(context.Context, int64, time.Time) ([]*optimizerpb.VRPShiftTeam, error) {
	return m.GetVRPShiftTeamsFromScheduleIDResult, m.GetVRPShiftTeamsFromScheduleIDErr
}

func (m *MockLogisticsDB) GetLatestOptimizerRunForRegionDate(context.Context, logisticssql.GetLatestOptimizerRunForRegionDateParams) (*logisticssql.OptimizerRun, error) {
	return m.GetLatestOptimizerRunForRegionDateResult, m.GetLatestOptimizerRunForRegionDateErr
}

func (m *MockLogisticsDB) AttachCheckFeasibilityRequestToProblem(*logisticsdb.VRPProblemData, []*logisticspb.CheckFeasibilityVisit, []int64) (*logisticsdb.VRPProblemData, error) {
	return m.AttachCheckFeasibilityRequestToProblemResult, m.AttachCheckFeasibilityRequestToProblemErr
}

func (m *MockLogisticsDB) CreateVRPProblem(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
	return m.CreateVRPProblemResult, m.CreateVRPProblemErr
}

func (m *MockLogisticsDB) UpsertVisitLocations(context.Context, []*logisticspb.CheckFeasibilityVisit) error {
	return m.UpsertVisitLocationsErr
}

func (m *MockLogisticsDB) GetVisitLocations(context.Context, []*logisticspb.CheckFeasibilityVisit) ([]*logisticssql.Location, error) {
	return m.GetVisitLocationsResult, m.GetVisitLocationsErr
}

func (m *MockLogisticsDB) WriteShiftTeamSnapshot(context.Context, int64, *shiftteampb.GetShiftTeamResponse) (*logisticssql.ShiftTeamSnapshot, error) {
	return m.WriteShiftTeamSnapshotResult, m.WriteShiftTeamSnapshotErr
}

func (m *MockLogisticsDB) HasAnyNewInfoInRegionSince(context.Context, logisticsdb.NewInfoParams) (bool, error) {
	return m.HasAnyNewInfoInRegionSinceResult, m.HasAnyNewInfoInRegionSinceErr
}

func (m *MockLogisticsDB) GetOptimizerRunDiagnostics(context.Context, int64, *logisticspb.CheckFeasibilityRequest, []int64) (*logisticsdb.OptimizerRunDiagnostics, error) {
	return m.GetOptimizerRunDiagnosticsResult, m.GetOptimizerRunDiagnosticsErr
}

func (m *MockLogisticsDB) GetLatestCareRequestsDataForDiagnostics(ctx context.Context, careRequestIDs []int64, createdBefore time.Time) ([]*logisticsdb.CareRequestDiagnostics, error) {
	return m.GetLatestCareRequestsDataForDiagnosticsResult, m.GetLatestCareRequestsDataForDiagnosticsError
}

func (m *MockLogisticsDB) GetServiceRegionVisitServiceDurations(ctx context.Context, params logisticssql.GetServiceRegionCanonicalVisitDurationsParams) (logisticsdb.VisitServiceDurations, error) {
	return m.GetServiceRegionVisitDurationsResult, m.GetServiceRegionVisitDurationErr
}

func (m *MockLogisticsDB) GetServiceRegionCanonicalLocations(context.Context, int64) ([]*logisticssql.Location, error) {
	return m.GetServiceRegionCanonicalLocationsResult, m.GetServiceRegionCanonicalLocationsErr
}

func (m *MockLogisticsDB) UpdateServiceRegionFeasibilityCheckSettings(ctx context.Context, settingsParams logisticsdb.UpdateServiceRegionFeasibilityCheckSettingsParams) ([]*logisticssql.Location, error) {
	return m.UpdateServiceRegionFeasibilityCheckSettingsResult, m.UpdateServiceRegionFeasibilityCheckSettingsErr
}

func (m *MockLogisticsDB) GetMarketForStationMarketID(ctx context.Context, stationMarketID int64) (*logisticssql.Market, error) {
	return m.GetMarketForStationMarketIDResult, m.GetMarketForStationMarketIDErr
}

func (m *MockLogisticsDB) GetServiceRegionForStationMarketID(context.Context, int64) (*logisticssql.ServiceRegion, error) {
	return m.GetServiceRegionForStationMarketIDResult, m.GetServiceRegionForStationMarketIDErr
}

func (m *MockLogisticsDB) GetLatestShiftTeamSnapshotID(context.Context, time.Time, int64) (*logisticsdb.ShiftTeamSnapshotIDResponse, error) {
	return m.GetLatestShiftTeamSnapshotIDResult, m.GetLatestShiftTeamSnapshotIDErr
}

func (m *MockLogisticsDB) UpdateShiftTeamLocation(context.Context, time.Time, int64, logistics.LatLng) (*logisticsdb.UpdateShiftTeamLocationResponse, error) {
	return m.UpdateShiftTeamLocationResult, m.UpdateShiftTeamLocationErr
}

func (m *MockLogisticsDB) DeleteVisitSnapshotForCareRequestID(context.Context, int64) (*logisticsdb.DeleteVisitSnapshotForCareRequestIDResponse, error) {
	return m.DeleteVisitSnapshotForCareRequestIDResult, m.DeleteVisitSnapshotForCareRequestIDErr
}

func (m *MockLogisticsDB) UpsertMarketAndServiceRegionFromStationMarket(context.Context, *marketpb.Market) error {
	return m.UpsertMarketAndServiceRegionFromStationMarketErr
}

func (m *MockLogisticsDB) GetLatestShiftTeamSchedulesInServiceRegion(context.Context, int64, time.Time, bool) (*logisticsdb.LatestShiftTeamSchedulesResponse, error) {
	return m.GetLatestShiftTeamSchedulesInServiceRegionResult, m.GetLatestShiftTeamSchedulesInServiceRegionErr
}

func (m *MockLogisticsDB) GetLatestShiftTeamSnapshotsInRegion(context.Context, int64, time.Time, time.Time, time.Time) ([]*logisticssql.ShiftTeamSnapshot, error) {
	return m.GetLatestShiftTeamSnapshotsInRegionResult, m.GetLatestShiftTeamSnapshotsInRegionErr
}

func (m *MockLogisticsDB) GetLatestShiftTeamSchedule(
	context.Context,
	int64,
	logisticsdb.TimeWindow,
) (*logisticsdb.ShiftTeamSchedule, error) {
	return m.GetLatestShiftTeamScheduleResult, m.GetLatestShiftTeamScheduleErr
}

func (m *MockLogisticsDB) GetLatestInfoForCareRequest(context.Context, int64, time.Time) (*logisticsdb.CareRequestLatestInfo, error) {
	return m.GetLatestInfoForCareRequestResult, m.GetLatestInfoForCareRequestErr
}

func (m *MockLogisticsDB) GetLatestShiftTeamLocationID(context.Context, int64, time.Time) (int64, error) {
	return m.GetLatestShiftTeamLocationIDResult, m.GetLatestShiftTeamLocationIDErr
}

func (m *MockLogisticsDB) AddShiftTeamRestBreakRequest(context.Context, logisticsdb.AddShiftTeamRestBreakParams) (*logisticsdb.AddShiftTeamRestBreakResponse, error) {
	return m.AddShiftTeamRestBreakRequestResult, m.AddShiftTeamRestBreakRequestErr
}

func (m *MockLogisticsDB) GetAssignableShiftTeamCandidatesForDate(ctx context.Context, params logisticsdb.GetAssignableShiftTeamCandidatesForDateParams) ([]*optimizerpb.AssignableShiftTeam, error) {
	return m.GetAssignableShiftTeamCandidatesForDateResult, m.GetAssignableShiftTeamCandidatesForDateErr
}

func (m *MockLogisticsDB) GetServiceRegionByID(context.Context, int64) (*logisticssql.ServiceRegion, error) {
	return m.GetServiceRegionByIDResult, m.GetServiceRegionByIDErr
}

func (m *MockLogisticsDB) GetOpenHoursScheduleForServiceRegion(ctx context.Context, serviceRegionID int64, beforeCreatedAt time.Time) ([]*common.ScheduleDay, error) {
	return m.GetOpenHoursScheduleForServiceRegionResult, m.GetOpenHoursScheduleForServiceRegionErr
}

func (m *MockLogisticsDB) AddServiceRegionAvailabilityQuery(ctx context.Context, params *logisticsdb.ServiceRegionAvailabilityQueryParams) (*logisticssql.ServiceRegionAvailabilityQuery, error) {
	return m.AddServiceRegionAvailabilityQueryResult, m.AddServiceRegionAvailabilityQueryErr
}

func (m *MockLogisticsDB) AddCheckFeasibilityQuery(ctx context.Context, params logisticsdb.CheckFeasibilityQueryParams) (*logisticssql.CheckFeasibilityQuery, error) {
	return m.AddCheckFeasibilityQueryResult, m.AddCheckFeasibilityQueryErr
}

func (m *MockLogisticsDB) GetCheckFeasibilityQueriesForCareRequest(ctx context.Context, careRequestID int64) ([]*logisticsdb.CheckFeasibilityQueryData, error) {
	return m.GetCheckFeasibilityQueriesForCareRequestResult, m.GetCheckFeasibilityQueriesForCareRequestErr
}

func (m *MockLogisticsDB) GetCheckFeasibilityCareRequestHistory(ctx context.Context, id int64) ([]*logisticspb.CheckFeasibilityCareRequestDiagnostic, error) {
	return m.GetCheckFeasibilityCareRequestHistoryResult, m.GetCheckFeasibilityCareRequestHistoryErr
}

func (m *MockLogisticsDB) GetAssignableVisitsForDate(ctx context.Context, params logisticsdb.GetAssignableVisitsForDateParams) ([]*optimizerpb.AssignableVisit, error) {
	return m.GetAssignableVisitsForDateResult, m.GetAssignableVisitsForDateErr
}

func (m *MockLogisticsDB) VisitArrivalTimestampsForSchedule(ctx context.Context, scheduleID int64) (map[int64]time.Time, error) {
	return m.VisitArrivalTimestampsForScheduleResult, m.VisitArrivalTimestampsForScheduleErr
}

func (m *MockLogisticsDB) GetServiceRegionVRPData(ctx context.Context, params *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error) {
	return m.GetServiceRegionVRPDataResult, m.GetServiceRegionVRPDataErr
}

func (m *MockLogisticsDB) ServiceRegionAvailability(ctx context.Context, params logisticsdb.ServiceRegionAvailabilityParams) (*logisticsdb.ServiceRegionAvailability, error) {
	return m.ServiceRegionAvailabilityResult, m.ServiceRegionAvailabilityErr
}

func (m *MockLogisticsDB) AddServiceRegionAvailabilityQueries(ctx context.Context, params logisticssql.AddServiceRegionAvailabilityQueriesParams) ([]*logisticssql.ServiceRegionAvailabilityQuery, error) {
	return m.AddServiceRegionAvailabilityQueriesResult, m.AddServiceRegionAvailabilityQueriesErr
}

func (m *MockLogisticsDB) AddServiceRegionAvailabilityQueryAttributes(ctx context.Context, availabilityQueries []*logisticssql.ServiceRegionAvailabilityQuery, attributeNames []string) ([]*logisticssql.ServiceRegionAvailabilityQueryAttribute, error) {
	return m.AddServiceRegionAvailabilityQueryAttributesResult, m.AddServiceRegionAvailabilityQueryAttributesErr
}

var _ LogisticsDB = (*MockLogisticsDB)(nil)

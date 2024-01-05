package logisticsdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type OptimizerRunType string
type VisitServiceDurationKey string

const (
	// Optimizer run for a schedule in a service region.
	ServiceRegionScheduleRunType OptimizerRunType = "service_region_schedule"
	// Feasibility check optimizer run.
	FeasibilityCheckRunType OptimizerRunType = "feasibility_check"
	// Optimizer run with availability visits in a service region.
	ServiceRegionAvailabilityRunType OptimizerRunType = "service_region_availability"
)

const (
	requestedCareRequestStatus = "requested"
	archivedCareRequestStatus  = "archived"

	VisitPhaseTypeShortNameRequested   VisitPhaseShortName = "requested"
	VisitPhaseTypeShortNameUncommitted VisitPhaseShortName = "uncommitted"
	VisitPhaseTypeShortNameCommitted   VisitPhaseShortName = "committed"
	VisitPhaseTypeShortNameEnRoute     VisitPhaseShortName = "en_route"
	VisitPhaseTypeShortNameOnScene     VisitPhaseShortName = "on_scene"
	VisitPhaseTypeShortNameCompleted   VisitPhaseShortName = "completed"
	VisitPhaseTypeShortNameCancelled   VisitPhaseShortName = "cancelled"

	VirtualAPPVisitPhaseTypeShortNameUnspecified VirtualAPPVisitPhaseShortName = "unspecified"
	VirtualAPPVisitPhaseTypeShortNameAssigned    VirtualAPPVisitPhaseShortName = "assigned"
	VirtualAPPVisitPhaseTypeShortNameUnassigned  VirtualAPPVisitPhaseShortName = "unassigned"

	unexpectedStatusDataMetric = "status_without_shift_team"
	phaseTypeTag               = "phase_type"
	careRequestField           = "care_request"

	MinVisitServiceDurationKey VisitServiceDurationKey = "min_visit_service_duration_sec"
	MaxVisitServiceDurationKey VisitServiceDurationKey = "max_visit_service_duration_sec"
)

const (
	OSRMMapsSourceShortName   = "osrm"
	GoogleMapsSourceShortName = "google_maps"
)

const (
	serviceRegionTag = "service_region"
	serviceDateTag   = "service_date"

	distanceMatrixUseTag         = "use"
	distancematrixUseTagResearch = "research"

	dateLayout = "2006-01-02"
)

const (
	DefaultOptimizerAcuityLevel = int64(2)
)

const (
	getLocationsByIDsError = "error in GetLocationsByIDs: %w"
)

var (
	CareRequestStatusesThatDontRequireArrivalTimeWindows = map[string]bool{
		requestedCareRequestStatus: true,
		archivedCareRequestStatus:  true,
	}

	ErrFeasibilityInThePast                    = errors.New("cannot check feasibility for time windows in the past")
	ErrVisitSnapshotRequiresArrivalTimeWindow  = errors.New("arrival time window is empty for status that requires that window")
	ErrNotAllLocationIDsFound                  = errors.New("could not find all location IDs")
	ErrUnknownShiftTeam                        = errors.New("unknown shift team")
	ErrNoShiftTeamLocation                     = errors.New("no shift team location")
	ErrNoOptimizerRunForDate                   = errors.New("no optimizer run for region date")
	ErrEmptyVRPDescription                     = errors.New("nothing to solve for VRP")
	ErrUnknownStationMarketID                  = errors.New("service region not found for market id")
	ErrUnknownMarketForStationMarketID         = errors.New("market not found for market id")
	ErrUnknownOptimizerRunID                   = errors.New("optimizer run not found for optimizer run id")
	ErrUndefinedVisitServiceDurationsForRegion = errors.New("undefined visits service durations for service region")
	ErrUndefinedCanonicalLocationsForRegion    = errors.New("undefined canonical locations for service region")
	ErrUnknownCareRequest                      = errors.New("unknown care request")
	ErrServiceRegionMarketNotFound             = errors.New("service region not found for market")
	ErrServiceRegionSettingsNotFound           = errors.New("service region settings not found")
	ErrScheduleNotFound                        = errors.New("schedule not found")
	ErrShiftTeamSnapshotNotYetIncorporated     = errors.New("latest shift team snapshot is not yet incorporated in a schedule")
	ErrInvalidConstraintConfig                 = errors.New("invalid constraint config")
)

var (
	constraintConfigMarshaller = protojson.MarshalOptions{
		UseProtoNames: true,
	}
	constraintConfigUnmarshaller = protojson.UnmarshalOptions{}
)

type DBTX interface {
	logisticssql.DBTX

	BeginFunc(ctx context.Context, f func(pgx.Tx) error) error
	BeginTxFunc(ctx context.Context, txOptions pgx.TxOptions, f func(pgx.Tx) error) error
	Ping(ctx context.Context) error
}

type LogisticsDB struct {
	db               DBTX
	mapServicePicker *logistics.MapServicePicker
	scope            monitoring.Scope
	settingsService  optimizersettings.Service
	QuerySettings    QuerySettings

	queries *logisticssql.Queries
}

type QuerySettings struct {
	GetLatestDistancesForLocationsBatchSize uint
}

func NewLogisticsDB(db DBTX, mapServicePicker *logistics.MapServicePicker, settingsService optimizersettings.Service, scope monitoring.Scope) *LogisticsDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}
	mdb := monitoring.NewDB(db, scope.With("DB", nil, nil))
	return &LogisticsDB{
		db:               db,
		mapServicePicker: mapServicePicker,
		settingsService:  settingsService,
		scope:            scope,

		queries: logisticssql.New(mdb),
	}
}

// WithScope returns a copy of the DB with the tags and fields applied to the scope.
// A common use-case here would be to tag the server-global LDB with the rpc name in the handler.
func (ldb *LogisticsDB) WithScope(tags monitoring.Tags, fields monitoring.Fields) *LogisticsDB {
	c := *ldb
	c.scope = c.scope.With("", tags, fields)
	return &c
}

func (ldb *LogisticsDB) writeVisitSnapshotTransactionally(ctx context.Context, careRequestID int64, careRequest *commonpb.CareRequestInfo, serviceRegion *logisticssql.ServiceRegion, arrivalStartTimestampSec, arrivalEndTimestampSec sql.NullInt64) (*logisticssql.VisitSnapshot, error) {
	var visitSnapshot *logisticssql.VisitSnapshot
	err := ldb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := ldb.queries.WithTx(tx)
		location, err := UpsertLocation(ctx, queries, logistics.LatLng{
			LatE6: careRequest.Location.LatitudeE6,
			LngE6: careRequest.Location.LongitudeE6,
		})
		if err != nil {
			return err
		}

		visitSnapshot, err = queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
			CareRequestID:            careRequestID,
			ServiceRegionID:          serviceRegion.ID,
			LocationID:               location.ID,
			ArrivalStartTimestampSec: arrivalStartTimestampSec,
			ArrivalEndTimestampSec:   arrivalEndTimestampSec,
			ServiceDurationSec:       *careRequest.ServiceDurationSec,
			IsManualOverride:         careRequest.IsManualOverride,
		})
		if err != nil {
			return err
		}

		if priority := careRequest.Priority; priority != nil {
			_, err = queries.AddVisitPrioritySnapshot(ctx, logisticssql.AddVisitPrioritySnapshotParams{
				VisitSnapshotID:       visitSnapshot.ID,
				RequestedByUserID:     sqltypes.ToNullInt64(priority.RequestedByUserId),
				RequestedTimestampSec: sqltypes.ToNullInt64(priority.RequestedTimestampSec),
				Note:                  sqltypes.ToNullString(priority.Note),
			})

			if err != nil {
				return err
			}
		}

		requestStatus := careRequest.GetRequestStatus()
		if requestStatus == nil {
			return fmt.Errorf("invalid nil request status for care request info: %d", careRequestID)
		}
		visitPhaseTypeID, err := visitPhaseTypeIDForStatusName(requestStatus.GetName())
		if err != nil {
			return fmt.Errorf("error resolving visit phase type from request status: %w", err)
		}
		visitPhaseSourceTypeID, err := visitPhaseSourceTypeIDForEpisodeEnum(requestStatus.GetSourceType())
		if err != nil {
			return fmt.Errorf("error resolving visit phase source type from episode enum: %w", err)
		}
		// TODO: validate shift-team-id requirement for certain status names (once station code is in).
		userID := requestStatus.GetUserId()
		_, err = queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
			VisitSnapshotID:        visitSnapshot.ID,
			VisitPhaseTypeID:       visitPhaseTypeID,
			VisitPhaseSourceTypeID: visitPhaseSourceTypeID,
			StationUserID:          sql.NullInt64{Valid: userID != 0, Int64: userID},
			StatusCreatedAt:        time.Unix(careRequest.GetRequestStatus().GetCreatedAtSec(), 0),
			ShiftTeamID:            sql.NullInt64{Int64: requestStatus.GetShiftTeamId(), Valid: requestStatus.ShiftTeamId != nil},
		})
		if err != nil {
			return fmt.Errorf("error adding visit phase snapshot: %w", err)
		}

		virtualAPPRequestStatus := careRequest.GetVirtualAppCareRequestStatus()
		if virtualAPPRequestStatus != nil {
			err = ldb.writeVirtualAPPVisitPhaseSnapshot(ctx, virtualAPPRequestStatus, visitSnapshot.ID)
			if err != nil {
				return fmt.Errorf("error adding virtual APP visit phase snapshot: %w", err)
			}
		}

		if err := ldb.writeVisitAcuitySnapshot(ctx, careRequest, visitSnapshot); err != nil {
			return fmt.Errorf("error adding visit acuity snapshot: %w", err)
		}

		visitValue := careRequest.Value
		if visitValue != nil {
			_, err = queries.AddVisitValueSnapshot(ctx, logisticssql.AddVisitValueSnapshotParams{
				VisitSnapshotID:                       visitSnapshot.ID,
				CompletionValueCents:                  sqltypes.ToNullInt64(visitValue.CompletionValueCents),
				PartnerPriorityScore:                  sqltypes.ToNullInt64(visitValue.PartnerPriorityScore),
				PartnerInfluencedCompletionValueCents: sqltypes.ToNullInt64(visitValue.PartnerInfluencedCompletionValueCents),
			})
			if err != nil {
				return fmt.Errorf("error adding visit value snapshot: %w", err)
			}
		}

		// TODO: single upsert for all attrs at once
		if attrs := careRequest.RequiredAttributes; attrs != nil {
			err := upsertAttributes(ctx, queries, visitSnapshot.ID, attrs, requiredAttributeType)
			if err != nil {
				return fmt.Errorf("error upserting visit required attributes: %w", err)
			}
		}
		if attrs := careRequest.ForbiddenAttributes; attrs != nil {
			err := upsertAttributes(ctx, queries, visitSnapshot.ID, attrs, forbiddenAttributeType)
			if err != nil {
				return fmt.Errorf("error upserting visit forbidden attributes: %w", err)
			}
		}
		if attrs := careRequest.PreferredAttributes; attrs != nil {
			err := upsertAttributes(ctx, queries, visitSnapshot.ID, attrs, preferredAttributeType)
			if err != nil {
				return fmt.Errorf("error upserting visit preferred attributes: %w", err)
			}
		}
		if attrs := careRequest.UnwantedAttributes; attrs != nil {
			err := upsertAttributes(ctx, queries, visitSnapshot.ID, attrs, unwantedAttributeType)
			if err != nil {
				return fmt.Errorf("error upserting visit unwanted attributes: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return visitSnapshot, nil
}

func (ldb *LogisticsDB) writeVirtualAPPVisitPhaseSnapshot(ctx context.Context, careRequestStatus *commonpb.VirtualAPPCareRequestStatus, visitSnapshotID int64) error {
	shiftTeamID := careRequestStatus.GetShiftTeamId()
	stationUserID := careRequestStatus.GetUserId()
	virtualAPPVisitPhaseTypeID, err := virtualAPPVisitPhaseTypeIDForEnum(careRequestStatus.GetStatus())
	if err != nil {
		return err
	}
	virtualAPPVisitPhaseSourceTypeID, err := virtualAPPVisitPhaseSourceTypeIDForEnum(careRequestStatus.GetSourceType())
	if err != nil {
		return err
	}

	_, err = ldb.queries.AddVirtualAPPVisitPhaseSnapshot(
		ctx,
		logisticssql.AddVirtualAPPVisitPhaseSnapshotParams{
			VisitSnapshotID:            visitSnapshotID,
			VirtualAppVisitPhaseTypeID: virtualAPPVisitPhaseTypeID,
			VisitPhaseSourceTypeID:     virtualAPPVisitPhaseSourceTypeID,
			StationUserID:              sql.NullInt64{Valid: stationUserID != 0, Int64: stationUserID},
			ShiftTeamID:                sql.NullInt64{Valid: shiftTeamID != 0, Int64: shiftTeamID},
		},
	)
	return err
}

func (ldb *LogisticsDB) writeVisitAcuitySnapshot(ctx context.Context, careRequest *commonpb.CareRequestInfo, visitSnapshot *logisticssql.VisitSnapshot) error {
	acuity := careRequest.GetAcuity()
	if acuity == nil {
		return nil
	}

	visitAcuitySnapshotParams, err := latestVisitAcuitySnapshotParams(ctx, acuity, careRequest.Id, visitSnapshot.ID, ldb.queries)
	if err != nil {
		return err
	}

	_, err = ldb.queries.AddVisitAcuitySnapshot(ctx, *visitAcuitySnapshotParams)
	return err
}

func latestVisitAcuitySnapshotParams(ctx context.Context, acuity *commonpb.AcuityInfo, careRequestID int64, visitSnapshotID int64, queries *logisticssql.Queries) (*logisticssql.AddVisitAcuitySnapshotParams, error) {
	// if there was an error retrieving the acuity info, use the latest acuity snapshot.
	if acuity.RequestError != nil {
		latestVisitAcuitySnapshot, err := queries.GetLatestVisitAcuitySnapshotByCareRequestID(ctx, logisticssql.GetLatestVisitAcuitySnapshotByCareRequestIDParams{
			CareRequestID: careRequestID,
			CreatedAt:     time.Now(),
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return &logisticssql.AddVisitAcuitySnapshotParams{
					VisitSnapshotID: visitSnapshotID,
				}, nil
			}
			return nil, err
		}

		return &logisticssql.AddVisitAcuitySnapshotParams{
			VisitSnapshotID:        visitSnapshotID,
			ClinicalUrgencyLevelID: latestVisitAcuitySnapshot.ClinicalUrgencyLevelID,
			PatientAge:             latestVisitAcuitySnapshot.PatientAge,
			ChiefComplaint:         latestVisitAcuitySnapshot.ChiefComplaint,
		}, nil
	}

	nullPatientAge := sql.NullInt64{Valid: false}
	if patientAge := acuity.PatientAge; patientAge != nil {
		nullPatientAge.Int64 = int64(*patientAge)
		nullPatientAge.Valid = true
	}

	clinicalUrgencyLevelID, err := clinicalUrgencyLevelIDForEnum(acuity.GetLevel())
	if err != nil {
		return nil, err
	}

	return &logisticssql.AddVisitAcuitySnapshotParams{
		VisitSnapshotID:        visitSnapshotID,
		ClinicalUrgencyLevelID: clinicalUrgencyLevelID,
		PatientAge:             nullPatientAge,
		ChiefComplaint:         sqltypes.ToNullString(acuity.CurrentChiefComplaint),
	}, nil
}

func (ldb *LogisticsDB) WriteVisitSnapshot(ctx context.Context,
	careRequestID int64, resp *episodepb.GetVisitResponse) (*logisticssql.VisitSnapshot, error) {
	if resp.CareRequest == nil {
		return nil, errors.New("missing care request")
	}
	careRequest := resp.CareRequest

	if careRequest.MarketId == nil {
		return nil, errors.New("market id is empty")
	}

	serviceRegion, err := ldb.queries.GetServiceRegionForStationMarket(ctx, *careRequest.MarketId)
	if err != nil {
		return nil, fmt.Errorf("error getting service region for station market id: %w", err)
	}

	if careRequest.ArrivalTimeWindow == nil {
		if !CareRequestStatusesThatDontRequireArrivalTimeWindows[careRequest.GetRequestStatus().GetName()] {
			return nil, fmt.Errorf("%w: %s", ErrVisitSnapshotRequiresArrivalTimeWindow, careRequest.GetRequestStatus().GetName())
		}
	}

	arrivalStartTimestampSec, err := ProtoDateTimeToNullableTimestampUnixSec(careRequest.GetArrivalTimeWindow().GetStartDatetime())
	if err != nil {
		return nil, err
	}

	arrivalEndTimestampSec, err := ProtoDateTimeToNullableTimestampUnixSec(careRequest.GetArrivalTimeWindow().GetEndDatetime())
	if err != nil {
		return nil, err
	}

	if careRequest.ServiceDurationSec == nil {
		return nil, errors.New("service duration seconds is empty")
	}

	if careRequest.Location == nil {
		return nil, errors.New("location is empty")
	}

	return ldb.writeVisitSnapshotTransactionally(
		ctx,
		careRequestID,
		careRequest,
		serviceRegion,
		arrivalStartTimestampSec,
		arrivalEndTimestampSec,
	)
}

func visitPhaseTypeIDForStatusName(statusName string) (int64, error) {
	val, ok := CareRequestStatusNameToPhaseTypeID[statusName]
	if !ok {
		return 0, fmt.Errorf("unknown phase type ID for status name(%s)", statusName)
	}
	return val, nil
}

func visitPhaseSourceTypeIDForEpisodeEnum(episodeEnum commonpb.CareRequestStatus_SourceType) (int64, error) {
	val, ok := CareRequestStatusSourceTypeToPhaseSourceTypeID[episodeEnum]
	if !ok {
		return 0, fmt.Errorf("unknown phase source type ID for episode type(%s)", episodeEnum.String())
	}
	return val, nil
}

func virtualAPPVisitPhaseTypeIDForEnum(enum commonpb.VirtualAPPCareRequestStatus_Status) (int64, error) {
	val, ok := VirtualAPPVisitPhaseTypeEnumToID[enum]
	if !ok {
		return 0, fmt.Errorf("unknown virtual APP phase type ID for episode type(%s)", enum.String())
	}
	return val, nil
}

func virtualAPPVisitPhaseSourceTypeIDForEnum(enum commonpb.StatusSourceType) (int64, error) {
	val, ok := StatusSourceTypeToPhaseSourceTypeID[enum]
	if !ok {
		return 0, fmt.Errorf("unknown virtual APP phase source type ID for episode type(%s)", enum.String())
	}
	return val, nil
}

func clinicalUrgencyLevelIDForEnum(enum commonpb.ClinicalUrgencyLevel) (sql.NullInt64, error) {
	var nullInt64 sql.NullInt64
	if enum == commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_UNSPECIFIED {
		return nullInt64, nil
	}
	id, ok := ClinicalUrgencyLevelEnumToID[enum]
	if !ok {
		return nullInt64, status.Errorf(codes.FailedPrecondition, "unknown urgency level ID for urgency level %s", enum.String())
	}
	return sqltypes.ToValidNullInt64(id), nil
}

type attributeType int

const (
	requiredAttributeType attributeType = iota + 1
	forbiddenAttributeType
	preferredAttributeType
	unwantedAttributeType
)

func upsertAttributes(ctx context.Context, queries *logisticssql.Queries, visitSnapshotID int64, attrs []*commonpb.Attribute, attrType attributeType) error {
	var attributeNames []string
	for _, attribute := range attrs {
		attributeNames = append(attributeNames, attribute.Name)
	}

	_, err := queries.UpsertAttributes(ctx, attributeNames)
	if err != nil {
		return err
	}

	attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
	if err != nil {
		return err
	}

	attributeIDs := make([]int64, len(attributes))
	visitSnapshotIDs := make([]int64, len(attributes))
	isRequireds := make([]bool, len(attributes))
	isForbiddens := make([]bool, len(attributes))
	isPreferreds := make([]bool, len(attributes))
	isUnwanteds := make([]bool, len(attributes))
	// we do a little dance here to comply with the (batch) UpsertVisitAttributes generated method.
	var isRequired, isForbidden, isPreferred, isUnwanted bool
	switch attrType {
	case requiredAttributeType:
		isRequired = true
	case forbiddenAttributeType:
		isForbidden = true
	case preferredAttributeType:
		isPreferred = true
	case unwantedAttributeType:
		isUnwanted = true
	default:
		return fmt.Errorf("unhandled attribute type %d", attrType)
	}

	for i, attribute := range attributes {
		visitSnapshotIDs[i] = visitSnapshotID
		attributeIDs[i] = attribute.ID
		isRequireds[i] = isRequired
		isForbiddens[i] = isForbidden
		isPreferreds[i] = isPreferred
		isUnwanteds[i] = isUnwanted
	}

	_, err = queries.UpsertVisitAttributes(ctx,
		logisticssql.UpsertVisitAttributesParams{
			VisitSnapshotIds: visitSnapshotIDs,
			AttributeIds:     attributeIDs,
			IsRequireds:      isRequireds,
			IsForbiddens:     isForbiddens,
			IsPreferreds:     isPreferreds,
			IsUnwanteds:      isUnwanteds,
		})
	return err
}

type locIDPair struct {
	from int64
	to   int64
}

func (ldb *LogisticsDB) batchGetLatestDistancesForLocations(
	ctx context.Context,
	batchQueryParams []logisticssql.BatchGetLatestDistancesForLocationsParams,
) ([]*logisticssql.BatchGetLatestDistancesForLocationsRow, error) {
	distancesBatchQuery := ldb.queries.BatchGetLatestDistancesForLocations(ctx, batchQueryParams)
	defer distancesBatchQuery.Close()

	var errors []error
	var distances []*logisticssql.BatchGetLatestDistancesForLocationsRow
	distancesBatchQuery.Query(func(i int, rows []*logisticssql.BatchGetLatestDistancesForLocationsRow, err error) {
		if err != nil {
			errors = append(errors, err)
			return
		}
		distances = append(distances, rows...)
	})

	if len(errors) > 0 {
		return nil, fmt.Errorf("errors trying to get distances for locations: %v", errors)
	}

	return distances, nil
}

func openHoursForWeekday(schedule []*logisticssql.ServiceRegionOpenHoursScheduleDay, weekDay time.Weekday) *logisticssql.ServiceRegionOpenHoursScheduleDay {
	for _, daySchedule := range schedule {
		if daySchedule.DayOfWeek == int32(weekDay) {
			return daySchedule
		}
	}
	return nil
}

func (ldb *LogisticsDB) GetLatestShiftTeamSnapshotsInRegion(ctx context.Context, serviceRegionID int64, beforeCreatedAt time.Time, shiftStart time.Time, shiftEnd time.Time) ([]*logisticssql.ShiftTeamSnapshot, error) {
	serviceRegionSettings, err := ldb.settingsService.ServiceRegionSettings(ctx, serviceRegionID)
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestShiftTeamSnapshotsInRegion: %w", err)
	}

	sinceSnapshotTime := beforeCreatedAt.Add(-serviceRegionSettings.SnapshotsLookbackDuration())
	shiftTeams, err := ldb.queries.GetLatestShiftTeamSnapshotsInRegion(ctx, logisticssql.GetLatestShiftTeamSnapshotsInRegionParams{
		ServiceRegionID:    serviceRegionID,
		StartTimestampSec:  shiftStart.Unix(),
		EndTimestampSec:    shiftEnd.Unix(),
		LatestSnapshotTime: beforeCreatedAt,
		SinceSnapshotTime:  sinceSnapshotTime,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestShiftTeamSnapshotsInRegion: %w", err)
	}

	return shiftTeams, nil
}

func TimestampFromDateTimeLoc(date time.Time, dayTime time.Time, tzLoc *time.Location) time.Time {
	return time.Date(
		date.Year(),
		date.Month(),
		date.Day(),
		dayTime.Hour(),
		dayTime.Minute(),
		dayTime.Second(),
		dayTime.Nanosecond(),
		tzLoc,
	)
}

type TimeWindow struct {
	Start time.Time
	End   time.Time
}

type GetServiceRegionOpenHoursForDateParams struct {
	ServiceRegionID int64
	Date            time.Time
	SnapshotTime    time.Time
}

func (ldb *LogisticsDB) GetOpenHoursScheduleForServiceRegion(ctx context.Context, serviceRegionID int64, beforeCreatedAt time.Time) ([]*commonpb.ScheduleDay, error) {
	schedule, err := ldb.queries.GetLatestOpenHoursScheduleForServiceRegion(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionParams{
		ServiceRegionID: serviceRegionID,
		BeforeCreatedAt: beforeCreatedAt,
	})
	if err != nil {
		return nil, err
	}

	days := make([]*commonpb.ScheduleDay, len(schedule))
	for i, day := range schedule {
		days[i] = &commonpb.ScheduleDay{
			DayOfWeek: day.DayOfWeek,
			OpenTime:  ProtoTimeOfDayFromTime(day.StartTime),
			CloseTime: ProtoTimeOfDayFromTime(day.EndTime),
		}
	}

	return days, nil
}

type ServiceRegionOpenHourDay struct {
	ServiceRegionOpenHoursScheduleDay *logisticssql.ServiceRegionOpenHoursScheduleDay
	TimeWindow                        *TimeWindow
	ServiceRegionID                   int64
}

type GetMultipleServiceRegionOpenHoursForDateParams struct {
	ServiceRegionIDS []int64
	Date             time.Time
	SnapshotTime     time.Time
}

func (ldb *LogisticsDB) GetMultipleServiceRegionOpenHoursForDate(ctx context.Context, params GetMultipleServiceRegionOpenHoursForDateParams) (
	[]*ServiceRegionOpenHourDay, error) {
	queries := ldb.queries

	openHoursDays, err := queries.GetLatestOpenHoursScheduleForServiceRegionsForDay(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionsForDayParams{
		ServiceRegionIds: params.ServiceRegionIDS,
		BeforeCreatedAt:  params.SnapshotTime,
		DayOfWeek:        int32(params.Date.Weekday()),
	})
	if err != nil {
		return nil, err
	}

	var results []*ServiceRegionOpenHourDay
	for _, openHourDay := range openHoursDays {
		tzLoc, err := time.LoadLocation(openHourDay.IanaTimeZoneName)
		if err != nil {
			return nil, err
		}

		startTimestamp := TimestampFromDateTimeLoc(params.Date, openHourDay.StartTime, tzLoc)
		endTimestamp := TimestampFromDateTimeLoc(params.Date, openHourDay.EndTime, tzLoc)
		timeWindow := &TimeWindow{
			Start: startTimestamp,
			End:   endTimestamp,
		}

		scheduleDay := &logisticssql.ServiceRegionOpenHoursScheduleDay{
			ID:                               openHourDay.ID,
			ServiceRegionOpenHoursScheduleID: openHourDay.ServiceRegionOpenHoursScheduleID,
			DayOfWeek:                        openHourDay.DayOfWeek,
			StartTime:                        openHourDay.StartTime,
			EndTime:                          openHourDay.EndTime,
			CreatedAt:                        openHourDay.CreatedAt,
		}

		serviceRegionOpenHourDay := &ServiceRegionOpenHourDay{
			TimeWindow:                        timeWindow,
			ServiceRegionOpenHoursScheduleDay: scheduleDay,
			ServiceRegionID:                   openHourDay.ServiceRegionID,
		}

		results = append(results, serviceRegionOpenHourDay)
	}

	return results, nil
}

func (ldb *LogisticsDB) GetServiceRegionOpenHoursForDate(ctx context.Context, params GetServiceRegionOpenHoursForDateParams) (
	*TimeWindow, *logisticssql.ServiceRegionOpenHoursScheduleDay, error) {
	queries := ldb.queries

	region, err := queries.GetServiceRegionByID(ctx, params.ServiceRegionID)
	if err != nil {
		return nil, nil, err
	}

	tzLoc, err := time.LoadLocation(region.IanaTimeZoneName)
	if err != nil {
		return nil, nil, err
	}

	schedule, err := queries.GetLatestOpenHoursScheduleForServiceRegion(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionParams{
		ServiceRegionID: params.ServiceRegionID,
		BeforeCreatedAt: params.SnapshotTime,
	})
	if err != nil {
		return nil, nil, err
	}

	openHoursDay := openHoursForWeekday(schedule, params.Date.Weekday())
	if openHoursDay == nil {
		return nil, nil, errors.New("open hours not found for day of week: " + params.Date.Weekday().String())
	}

	startTimestamp := TimestampFromDateTimeLoc(params.Date, openHoursDay.StartTime, tzLoc)
	endTimestamp := TimestampFromDateTimeLoc(params.Date, openHoursDay.EndTime, tzLoc)

	return &TimeWindow{
		Start: startTimestamp,
		End:   endTimestamp,
	}, openHoursDay, nil
}

// snapshotIDReconciler massages a VRPDescription to always refer to the latest snapshots for entities
// referenced within it.  For example, if a previous optimizer run had an unassigned visit, we need to
// be able to remember that that visit was unassigned even if a new snapshot was taken for that visit.
type snapshotIDReconciler struct {
	latestSnapshotTime               time.Time
	visitIDToCareRequestID           map[VisitSnapshotID]CareRequestID
	canonicalCareReqIDToCurrentVisit map[CareRequestID]*optimizerpb.VRPVisit
	visitIDToPhaseTypeShortName      map[VisitSnapshotID]VisitPhaseShortName
	careRequestActuals               CareRequestActuals
	stopLocations                    stopLocations
}

func filterCareRequestIDs(ids []int64, predicate func(id int64) bool) []int64 {
	var res []int64
	for _, id := range ids {
		if predicate(id) {
			res = append(res, id)
		}
	}
	return res
}

func (ldb *LogisticsDB) CareRequestActualsFromCareRequestIDs(ctx context.Context, visitIDs []int64, careRequestIDs []int64, latestSnapshotTime time.Time) (CareRequestActuals, error) {
	shiftTeamActuals := NewShiftTeamActuals()
	scope := ldb.scope.With("CareRequestActualsFromCareRequestIDs", nil, nil)

	latestVisitPhasesForCareRequests, err := ldb.queries.GetVisitPhaseForVisitSnapshotsByCareRequestID(ctx, visitIDs)
	if err != nil {
		return CareRequestActuals{}, err
	}
	careRequestToCurrentVisitPhase := make(map[CareRequestID]VisitPhaseShortName)
	for _, row := range latestVisitPhasesForCareRequests {
		careRequestToCurrentVisitPhase[CareRequestID(row.CareRequestID)] = VisitPhaseShortName(row.VisitPhaseShortName)
	}

	// only trust actual arrivals and completion times for care requests that are currently on scene or completed
	onSceneOrCompletedCareRequestIDs := filterCareRequestIDs(careRequestIDs, func(id int64) bool {
		latestVisitPhase, ok := careRequestToCurrentVisitPhase[CareRequestID(id)]
		return ok && latestVisitPhase == VisitPhaseTypeShortNameOnScene || latestVisitPhase == VisitPhaseTypeShortNameCompleted
	})
	// Actual Arrival Times:
	arrivedAtSecFromCareRequestIDs, err := ldb.queries.GetLatestStatusCreatedAtForPhaseTypeID(ctx, logisticssql.GetLatestStatusCreatedAtForPhaseTypeIDParams{
		CareRequestIds:     onSceneOrCompletedCareRequestIDs,
		LatestSnapshotTime: latestSnapshotTime,
		VisitPhaseTypeID:   VisitPhaseTypeShortNameOnScene.PhaseTypeID(),
	})
	if err != nil {
		return CareRequestActuals{}, err
	}

	arrivedAtByCareReqID := map[CareRequestID]time.Time{}
	for _, arrivedAt := range arrivedAtSecFromCareRequestIDs {
		arrivedAtByCareReqID[CareRequestID(arrivedAt.CareRequestID)] = arrivedAt.StatusCreatedAt
		if arrivedAt.ShiftTeamID.Valid {
			shiftTeamActuals.AddArrival(
				EntityIDPair{
					ShiftTeamID:   ShiftTeamID(arrivedAt.ShiftTeamID.Int64),
					CareRequestID: CareRequestID(arrivedAt.CareRequestID),
				},
				arrivedAt.StatusCreatedAt,
			)
		} else {
			// TODO: rig these up to a grafana panel.
			scope.WritePoint(unexpectedStatusDataMetric,
				monitoring.Tags{phaseTypeTag: VisitPhaseTypeShortNameOnScene.String()},
				monitoring.Fields{careRequestField: arrivedAt.CareRequestID},
			)
		}
	}

	// Actual Completion Times:
	completedAtSecFromCareRequestIDs, err := ldb.queries.GetLatestStatusCreatedAtForPhaseTypeID(ctx, logisticssql.GetLatestStatusCreatedAtForPhaseTypeIDParams{
		// only trust completion times for currently completed care request statuses;
		CareRequestIds: filterCareRequestIDs(onSceneOrCompletedCareRequestIDs, func(id int64) bool {
			latestVisitPhase, ok := careRequestToCurrentVisitPhase[CareRequestID(id)]
			return ok && latestVisitPhase == VisitPhaseTypeShortNameCompleted
		}),
		LatestSnapshotTime: latestSnapshotTime,
		VisitPhaseTypeID:   VisitPhaseTypeShortNameCompleted.PhaseTypeID(),
	})
	if err != nil {
		return CareRequestActuals{}, err
	}

	completedAtByCareReqID := map[CareRequestID]time.Time{}
	for _, completedAt := range completedAtSecFromCareRequestIDs {
		completedAtByCareReqID[CareRequestID(completedAt.CareRequestID)] = completedAt.StatusCreatedAt
		if completedAt.ShiftTeamID.Valid {
			shiftTeamActuals.AddCompletion(
				EntityIDPair{
					ShiftTeamID:   ShiftTeamID(completedAt.ShiftTeamID.Int64),
					CareRequestID: CareRequestID(completedAt.CareRequestID),
				},
				completedAt.StatusCreatedAt,
			)
		} else {
			scope.WritePoint(unexpectedStatusDataMetric,
				monitoring.Tags{phaseTypeTag: VisitPhaseTypeShortNameCompleted.String()},
				monitoring.Fields{careRequestField: completedAt.CareRequestID},
			)
		}
	}

	// EnRoute start Times:
	enRouteSecFromCareRequestIDs, err := ldb.queries.GetLatestStatusCreatedAtForPhaseTypeID(ctx, logisticssql.GetLatestStatusCreatedAtForPhaseTypeIDParams{
		CareRequestIds: filterCareRequestIDs(careRequestIDs, func(id int64) bool {
			latestVisitPhase, ok := careRequestToCurrentVisitPhase[CareRequestID(id)]
			return ok && latestVisitPhase == VisitPhaseTypeShortNameEnRoute
		}),
		LatestSnapshotTime: latestSnapshotTime,
		VisitPhaseTypeID:   VisitPhaseTypeShortNameEnRoute.PhaseTypeID(),
	})
	if err != nil {
		return CareRequestActuals{}, err
	}

	currentlyEnRouteByCareReqID := map[CareRequestID]time.Time{}
	for _, enRoute := range enRouteSecFromCareRequestIDs {
		currentlyEnRouteByCareReqID[CareRequestID(enRoute.CareRequestID)] = enRoute.StatusCreatedAt
		if enRoute.ShiftTeamID.Valid {
			shiftTeamActuals.AddCurrentlyEnRoute(
				EntityIDPair{
					ShiftTeamID:   ShiftTeamID(enRoute.ShiftTeamID.Int64),
					CareRequestID: CareRequestID(enRoute.CareRequestID),
				},
				enRoute.StatusCreatedAt,
			)
		} else {
			scope.WritePoint(unexpectedStatusDataMetric,
				monitoring.Tags{phaseTypeTag: VisitPhaseTypeShortNameEnRoute.String()},
				monitoring.Fields{careRequestField: enRoute.CareRequestID},
			)
		}
	}

	// Committed start Times:
	committedTimestampsFromCareRequestIDs, err := ldb.queries.GetLatestStatusCreatedAtForPhaseTypeID(ctx, logisticssql.GetLatestStatusCreatedAtForPhaseTypeIDParams{
		CareRequestIds: filterCareRequestIDs(careRequestIDs, func(id int64) bool {
			latestVisitPhase, ok := careRequestToCurrentVisitPhase[CareRequestID(id)]
			return ok && latestVisitPhase == VisitPhaseTypeShortNameCommitted
		}),
		LatestSnapshotTime: latestSnapshotTime,
		VisitPhaseTypeID:   VisitPhaseTypeShortNameCommitted.PhaseTypeID(),
	})
	if err != nil {
		return CareRequestActuals{}, err
	}
	for _, committed := range committedTimestampsFromCareRequestIDs {
		if committed.ShiftTeamID.Valid {
			shiftTeamActuals.AddCommitted(
				EntityIDPair{
					ShiftTeamID:   ShiftTeamID(committed.ShiftTeamID.Int64),
					CareRequestID: CareRequestID(committed.CareRequestID),
				},
				committed.StatusCreatedAt,
			)
		} else {
			scope.WritePoint(unexpectedStatusDataMetric,
				monitoring.Tags{phaseTypeTag: VisitPhaseTypeShortNameCommitted.String()},
				monitoring.Fields{careRequestField: committed.CareRequestID},
			)
		}
	}
	return CareRequestActuals{
		ArrivalTimes:          arrivedAtByCareReqID,
		CompletionTimes:       completedAtByCareReqID,
		CurrentlyEnRouteTimes: currentlyEnRouteByCareReqID,

		ShiftTeamActuals: shiftTeamActuals,
	}, nil
}

type descriptionWithoutShiftTeams struct {
	visits             []*optimizerpb.VRPVisit
	unassignedVisits   []*optimizerpb.VRPUnassignedVisit
	restBreaks         restBreaks
	latestSnapshotTime time.Time
}

func (ldb *LogisticsDB) newSnapshotIDReconciler(ctx context.Context, desc descriptionWithoutShiftTeams) (*snapshotIDReconciler, error) {
	allVisitIDs := collections.NewLinkedInt64Set(len(desc.visits) + len(desc.unassignedVisits))

	for _, visit := range desc.visits {
		allVisitIDs.Add(*visit.Id)
	}

	for _, uv := range desc.unassignedVisits {
		allVisitIDs.Add(*uv.VisitId)
	}

	careRequestVisitIDs, err := ldb.queries.GetCareRequestIDsAndPhasesFromVisitIDs(ctx, allVisitIDs.Elems())

	if err != nil {
		return nil, err
	}

	careRequestIDs := collections.NewLinkedInt64Set(len(careRequestVisitIDs))
	for _, careReqVisitID := range careRequestVisitIDs {
		careRequestIDs.Add(careReqVisitID.CareRequestID)
	}

	careRequestActuals, err := ldb.CareRequestActualsFromCareRequestIDs(ctx, allVisitIDs.Elems(), careRequestIDs.Elems(), desc.latestSnapshotTime)
	if err != nil {
		return nil, err
	}

	return newSnapshotIDReconcilerImpl(careRequestVisitIDs, desc.visits, desc.restBreaks, careRequestActuals, desc.latestSnapshotTime)
}

func newSnapshotIDReconcilerImpl(careRequestVisitIDs []*logisticssql.GetCareRequestIDsAndPhasesFromVisitIDsRow, currentVisits []*optimizerpb.VRPVisit, restBreaks restBreaks, careRequestActuals CareRequestActuals, latestSnapshotTime time.Time) (*snapshotIDReconciler, error) {
	visitIDToCareRequestID := map[VisitSnapshotID]CareRequestID{}
	visitSnapshotIDToPhaseShortName := map[VisitSnapshotID]VisitPhaseShortName{}
	for _, careRequestVisitID := range careRequestVisitIDs {
		visitID := VisitSnapshotID(careRequestVisitID.VisitSnapshotID)
		careReqID := CareRequestID(careRequestVisitID.CareRequestID)

		if err := VisitPhaseShortName(careRequestVisitID.VisitPhaseTypeShortName).Validate(); err != nil {
			return nil, fmt.Errorf("invalid visit phase short name: %w", err)
		}
		visitSnapshotIDToPhaseShortName[visitID] = VisitPhaseShortName(careRequestVisitID.VisitPhaseTypeShortName)
		visitIDToCareRequestID[visitID] = careReqID
	}

	canonicalCareReqIDToCurrentVisit := map[CareRequestID]*optimizerpb.VRPVisit{}

	stopLocations := newStopLocations(currentVisits, restBreaks)
	for _, visit := range currentVisits {
		currentVisitID := VisitSnapshotID(*visit.Id)
		careReqID := visitIDToCareRequestID[currentVisitID]

		canonicalCareReqIDToCurrentVisit[careReqID] = visit
	}
	for _, rb := range restBreaks {
		actuals := &Actuals{}
		if rb.basis.GetStartTimestampSec() != 0 {
			actuals.Arrival = time.Unix(rb.basis.GetStartTimestampSec(), 0)
			completionTime := time.Unix(rb.basis.GetStartTimestampSec()+rb.basis.GetDurationSec(), 0)
			// Note: If we add "rest break end" events instead of an implicit timeout, we should use that timestamp.
			if !completionTime.After(latestSnapshotTime) {
				actuals.Completion = time.Unix(rb.basis.GetStartTimestampSec()+rb.basis.GetDurationSec(), 0)
			}
		}
		careRequestActuals.ShiftTeamActuals.AddRestBreak(rb.shiftTeamID, rb.basis.GetId(), actuals)
	}
	reconciler := &snapshotIDReconciler{
		latestSnapshotTime:               latestSnapshotTime,
		visitIDToCareRequestID:           visitIDToCareRequestID,
		canonicalCareReqIDToCurrentVisit: canonicalCareReqIDToCurrentVisit,
		visitIDToPhaseTypeShortName:      visitSnapshotIDToPhaseShortName,
		careRequestActuals:               careRequestActuals,
		stopLocations:                    stopLocations,
	}

	if err := reconciler.Validate(); err != nil {
		return nil, err
	}
	return reconciler, nil
}

func (r *snapshotIDReconciler) Validate() error {
	// Validate that all currently enroute visits have a current en route time associated with it.
	for crID, currentVisit := range r.canonicalCareReqIDToCurrentVisit {
		currentVisitSnapshotID := VisitSnapshotID(currentVisit.GetId())
		if currentVisitSnapshotID.isCheckFeasibilityVisitSnapshotID() {
			continue
		}
		if currentVisitSnapshotID == 0 {
			return fmt.Errorf("invalid no Id for currentVisit for care_request_id %d", crID)
		}
		shortName, ok := r.visitIDToPhaseTypeShortName[currentVisitSnapshotID]
		if !ok {
			return fmt.Errorf("invalid missing visit phase short name for visit_snapshot_id %d, care_request_id %d", currentVisitSnapshotID, crID)
		}
		if shortName != VisitPhaseTypeShortNameEnRoute {
			continue
		}
		crID2, ok := r.visitIDToCareRequestID[currentVisitSnapshotID]
		if !ok {
			return fmt.Errorf("no care request ID found in visitIDToCareRequestID for en route visit ID: %d", currentVisitSnapshotID)
		}
		if crID != crID2 {
			return fmt.Errorf("inconsistent care request IDs for visit_snapshot_id %d: %d %d", currentVisitSnapshotID, crID, crID2)
		}
		_, ok = r.careRequestActuals.CurrentlyEnRouteTimes[crID]
		if !ok {
			return fmt.Errorf("no en route time found for care request ID(%d) for visit ID(%d)", crID, currentVisitSnapshotID)
		}
	}
	return nil
}

func (r *snapshotIDReconciler) reconcileUnassignedToLatestSnapshot(vrpUnassignedVisits []*optimizerpb.VRPUnassignedVisit) []*optimizerpb.VRPUnassignedVisit {
	var reconciled []*optimizerpb.VRPUnassignedVisit

	for _, uv := range vrpUnassignedVisits {
		if careRequestID, found := r.visitIDToCareRequestID[VisitSnapshotID(*uv.VisitId)]; found {
			currentVisit, found := r.canonicalCareReqIDToCurrentVisit[careRequestID]

			if !found {
				// deleted visits will be removed from previous run's unassigned visits.
				continue
			}

			reconciled = append(reconciled, uv)

			if found && *currentVisit.Id != *uv.VisitId {
				uv.VisitId = currentVisit.Id
			}
		}
	}
	return reconciled
}

func (r *snapshotIDReconciler) removeUnassignedThatAreNowInRouteHistoryOrCommitments(unassigned []*optimizerpb.VRPUnassignedVisit, shiftTeams []*optimizerpb.VRPShiftTeam) []*optimizerpb.VRPUnassignedVisit {
	var reconciled []*optimizerpb.VRPUnassignedVisit

	seen := make(map[int64]bool)
	for _, st := range shiftTeams {
		for _, stop := range st.GetRouteHistory().GetStops() {
			seen[stop.GetVisit().GetVisitId()] = true
		}
		for _, commitment := range st.GetUpcomingCommitments().GetCommitments() {
			seen[commitment.GetVisitId()] = true
		}
	}
	for _, uv := range unassigned {
		if _, ok := seen[uv.GetVisitId()]; !ok {
			reconciled = append(reconciled, uv)
		}
	}
	return reconciled
}

// ReconcileUnassignedVisits reconciles visit IDs referenced in unassigned visits, updating in place:
//  1. Mapping into the latest visit snapshot ID for the associated care request.
//  2. Removing missing (i.e. deleted) unassigned visits from the returned slice.
//  3. Removing unassigned visits that now show up in the route history or commitments.
//
// TODO: consider whether we need this logic at all, or whether we should just junk it.
// CheckFeasibility likely still needs this, but the core optimization run probably does not.
func (r *snapshotIDReconciler) ReconcileUnassignedVisits(vrpUnassignedVisits []*optimizerpb.VRPUnassignedVisit, shiftTeams []*optimizerpb.VRPShiftTeam) []*optimizerpb.VRPUnassignedVisit {
	latestSnapshotIDUnassigned := r.reconcileUnassignedToLatestSnapshot(vrpUnassignedVisits)
	return r.removeUnassignedThatAreNowInRouteHistoryOrCommitments(latestSnapshotIDUnassigned, shiftTeams)
}

func (r *snapshotIDReconciler) currentPositionForLatestStopWithActualArrivalOrCompletion(st *optimizerpb.VRPShiftTeam) (*optimizerpb.VRPShiftTeamPosition, error) {
	for i := len(st.GetRouteHistory().GetStops()) - 1; i >= 0; i-- {
		stop := st.RouteHistory.Stops[i]
		// unexpected state transitions could cause a stop to have a completion timestamp but not a start timestamp.
		// For this case, we will assume that the two timestamps are the same (which is enforced by validation later).
		if stop.ActualStartTimestampSec != nil || stop.ActualCompletionTimestampSec != nil {
			var locationID int64
			switch stop.GetStop().(type) {
			case *optimizerpb.VRPShiftTeamRouteStop_Visit:
				locationID = r.stopLocations.visitLocations[VisitSnapshotID(stop.GetVisit().GetVisitId())]
			case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
				locationID = r.stopLocations.restBreakLocations[stop.GetRestBreak().GetRestBreakId()]
			default:
				return nil, errors.New("unhandled VRPShiftTeamRouteStop type for current position location ID")
			}

			// time ticks up from the actual arrival timestamp up to completion.
			knownTimestampSec := stop.GetActualStartTimestampSec()
			if r.latestSnapshotTime.Unix() >= knownTimestampSec {
				knownTimestampSec = r.latestSnapshotTime.Unix()
			}
			// If the stop is completed;  then we need to decide whether to tick time or if they are en-route
			// to the next stop without actuals.
			if stop.ActualCompletionTimestampSec != nil {
				var nextStopWithoutActualArrival *optimizerpb.VRPShiftTeamRouteStop
				if i+1 < len(st.RouteHistory.GetStops()) {
					nextStopWithoutActualArrival = st.RouteHistory.Stops[i+1]
				}
				return r.currentPositionFromLastKnownLocation(locationID, nextStopWithoutActualArrival)
			}
			return &optimizerpb.VRPShiftTeamPosition{
				LocationId:        locationID,
				KnownTimestampSec: knownTimestampSec,
			}, nil
		}
	}
	return nil, nil
}

func (r *snapshotIDReconciler) currentPositionFromLastKnownLocation(fromLocationID int64, nextStopWithoutActualArrival *optimizerpb.VRPShiftTeamRouteStop) (*optimizerpb.VRPShiftTeamPosition, error) {
	// unless we are en-route to the next stop;  we continue to tick time at the current location.
	snapshotTimeAtFromLocation := &optimizerpb.VRPShiftTeamPosition{
		LocationId:        fromLocationID,
		KnownTimestampSec: r.latestSnapshotTime.Unix(),
	}
	if nextStopWithoutActualArrival == nil {
		return snapshotTimeAtFromLocation, nil
	}
	switch nextStopWithoutActualArrival.GetStop().(type) {
	case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
		return snapshotTimeAtFromLocation, nil
	case *optimizerpb.VRPShiftTeamRouteStop_Visit:
		nextStopVisitID := VisitSnapshotID(nextStopWithoutActualArrival.GetVisit().GetVisitId())
		if r.visitIDToPhaseTypeShortName[nextStopVisitID] == VisitPhaseTypeShortNameEnRoute {
			enRouteTime, ok := r.careRequestActuals.CurrentlyEnRouteTimes[r.visitIDToCareRequestID[nextStopVisitID]]
			if !ok {
				return nil, fmt.Errorf("improperly initialized reconciler: missing visit->care request->enroute time for enroute visit: %d", nextStopVisitID)
			}
			// TODO: actually, the en-route timestamp should probably be associated with a particular
			// location when that transition occurred (instead of the previous stop's location). So, stamping the latest
			// shift team location onto the visit phase snapshot table might be slightly preferable to this approach.
			//
			// while en-route to the next stop visit;  we set the timestamp of departure from this location.
			return &optimizerpb.VRPShiftTeamPosition{
				LocationId:        fromLocationID,
				KnownTimestampSec: enRouteTime.Unix(),
			}, nil
		}
		return snapshotTimeAtFromLocation, nil
	}
	return nil, errors.New("unhandled stop type in setCurrentPositionForDepotAndFirstStopNoActualArrivals")
}

// annotateRouteHistoryCurrentPositions adds RouteHistory.CurrentPosition to  every shift team
// based on the latest stops with factual timing data set on them (thus must run within annotateRouteHistories).
func (r *snapshotIDReconciler) annotateRouteHistoryCurrentPositions(vrpShiftTeams []*optimizerpb.VRPShiftTeam) error {
	for _, shiftTeam := range vrpShiftTeams {
		currentPosition, err := r.currentPositionForLatestStopWithActualArrivalOrCompletion(shiftTeam)
		if err != nil {
			return err
		}

		// If we don't have a current position yet; it means that we're still at the depot
		// or driving to the first stop (as the first stop doesn't have an actual arrival timestamp).
		if currentPosition == nil {
			if len(shiftTeam.GetRouteHistory().GetStops()) == 0 {
				// time ticks if there are no stops.
				currentPosition = &optimizerpb.VRPShiftTeamPosition{
					LocationId:        shiftTeam.GetDepotLocationId(),
					KnownTimestampSec: r.latestSnapshotTime.Unix(),
				}
			} else {
				currentPosition, err = r.currentPositionFromLastKnownLocation(shiftTeam.GetDepotLocationId(), shiftTeam.GetRouteHistory().GetStops()[0])
				if err != nil {
					return err
				}
			}
		}

		shiftTeam.RouteHistory.CurrentPosition = currentPosition
	}
	return nil
}

var IsPinnedVisitPhase = map[VisitPhaseShortName]bool{
	VisitPhaseTypeShortNameRequested:   false,
	VisitPhaseTypeShortNameUncommitted: false,
	VisitPhaseTypeShortNameCancelled:   false,

	VisitPhaseTypeShortNameCommitted: true,
	VisitPhaseTypeShortNameEnRoute:   true,
	VisitPhaseTypeShortNameOnScene:   true,
	VisitPhaseTypeShortNameCompleted: true,
}

func (ldb *LogisticsDB) GetUnassignedScheduleVisitsForScheduleID(ctx context.Context, scheduleID int64, latestTimestamp time.Time) ([]*optimizerpb.VRPUnassignedVisit, error) {
	usvs, err := ldb.queries.GetUnassignedScheduleVisitsForScheduleID(ctx, logisticssql.GetUnassignedScheduleVisitsForScheduleIDParams{
		ScheduleID:         scheduleID,
		LatestSnapshotTime: latestTimestamp,
	})
	if err != nil {
		return nil, err
	}
	res := make([]*optimizerpb.VRPUnassignedVisit, len(usvs))
	for i, usv := range usvs {
		res[i] = &optimizerpb.VRPUnassignedVisit{VisitId: proto.Int64(usv.VisitSnapshotID.Int64)}
	}
	return res, nil
}

func (ldb *LogisticsDB) GetVRPShiftTeamsFromScheduleID(ctx context.Context, scheduleID int64, latestTimestamp time.Time) ([]*optimizerpb.VRPShiftTeam, error) {
	queries := ldb.queries

	routes, err := queries.GetScheduleRoutesForSchedule(ctx, scheduleID)
	if err != nil {
		return nil, err
	}

	var shiftTeams []*optimizerpb.VRPShiftTeam

	srs, err := queries.GetScheduleRouteStopsForSchedule(ctx, logisticssql.GetScheduleRouteStopsForScheduleParams{
		ScheduleID:         scheduleID,
		LatestSnapshotTime: latestTimestamp,
	})
	if err != nil {
		return nil, err
	}

	routeStops := map[int64][]*optimizerpb.VRPShiftTeamRouteStop{}
	for _, rs := range srs {
		stops := routeStops[rs.ScheduleRouteID]
		if len(stops) != int(rs.RouteIndex)-1 {
			return nil, errors.New("incorrect route index")
		}
		routeStop := &optimizerpb.VRPShiftTeamRouteStop{}
		switch {
		case rs.ScheduleRestBreakID.Valid:
			if err := validateRestBreakRouteStop(rs); err != nil {
				return nil, fmt.Errorf("invalid rest break route stop: %w", err)
			}
			routeStop.Stop = &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
				RestBreakId:       proto.Int64(rs.BreakRequestID.Int64),
				StartTimestampSec: proto.Int64(rs.BreakRequestStartTimestampSec.Int64),
			}}
			startTime := time.Unix(rs.BreakRequestStartTimestampSec.Int64, 0)
			startedInPast := latestTimestamp.After(startTime)
			// a rest break is pinned if it started in the past (i.e. we can't potentially move it around in the schedule).
			routeStop.Pinned = proto.Bool(startedInPast)
			if startedInPast {
				routeStop.ActualStartTimestampSec = proto.Int64(startTime.Unix())
			}
			completionTime := time.Unix(rs.BreakRequestStartTimestampSec.Int64+rs.BreakRequestDurationSec.Int64, 0)
			stopIsComplete := latestTimestamp.After(completionTime)
			if stopIsComplete {
				routeStop.ActualCompletionTimestampSec = proto.Int64(completionTime.Unix())
			}

		case rs.ScheduleVisitID.Valid:
			if err := validateVisitRouteStop(rs); err != nil {
				return nil, fmt.Errorf("invalid visit route stop: %w", err)
			}
			routeStop.Stop = &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
				VisitId:             proto.Int64(rs.VisitSnapshotID.Int64),
				ArrivalTimestampSec: proto.Int64(rs.ArrivalTimestampSec.Int64),
			}}
			routeStop.Pinned = proto.Bool(VisitPhaseShortName(rs.VisitPhaseShortName.String).IsPinned())
			// schedule visit actuals are left to the reconciler to enforce (which listens to care request state changes).
		default:
			return nil, fmt.Errorf("invalid schedule_route_stop(%d) that is not a rest break nor visit", rs.ID)
		}
		routeStops[rs.ScheduleRouteID] = append(stops, routeStop)
	}

	for _, route := range routes {
		shiftTeams = append(shiftTeams, &optimizerpb.VRPShiftTeam{
			Id:                  &route.ShiftTeamSnapshotID,
			Route:               &optimizerpb.VRPShiftTeamRoute{Stops: routeStops[route.ID]},
			RouteHistory:        &optimizerpb.VRPShiftTeamRouteHistory{},
			UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
		})
	}

	return shiftTeams, err
}

func validateRestBreakRouteStop(row *logisticssql.GetScheduleRouteStopsForScheduleRow) error {
	if !row.ScheduleRestBreakID.Valid {
		return errors.New("invalid ScheduleRestBreakID")
	}
	if !row.BreakRequestID.Valid {
		return errors.New("invalid BreakRequestID")
	}
	if !row.BreakRequestDurationSec.Valid {
		return errors.New("invalid BreakRequestDurationSec")
	}
	if !row.BreakRequestLocationID.Valid {
		return errors.New("invalid BreakRequestLocationID")
	}
	return nil
}

func validateVisitRouteStop(row *logisticssql.GetScheduleRouteStopsForScheduleRow) error {
	if !row.ScheduleVisitID.Valid {
		return errors.New("invalid null ScheduleVisitID")
	}
	if !row.VisitSnapshotID.Valid {
		return errors.New("invalid null VisitSnapshotID")
	}
	if !row.ArrivalTimestampSec.Valid {
		return errors.New("invalid null ArrivalTimestampSec")
	}
	if !row.VisitPhaseShortName.Valid {
		return errors.New("invalid null VisitPhaseShortName")
	}
	if err := VisitPhaseShortName(row.VisitPhaseShortName.String).Validate(); err != nil {
		return fmt.Errorf("invalid VisitPhaseShortName: %w", err)
	}
	return nil
}

// UnrequestedRestBreakConfig configures how a VRPProblem description handles
// shift teams without a known requested rest break.
type UnrequestedRestBreakConfig struct {
	// IncludeUnrequestedRestBreaks injects an unrequested break for every
	// shift team without a requested rest break in the day.
	IncludeUnrequestedRestBreaks bool
	// RestBreakDuration is the duration of such an unrequested rest break.
	RestBreakDuration time.Duration
}

func (cfg UnrequestedRestBreakConfig) shouldAddUnrequestedRestBreak(currentTime time.Time, snapshot *logisticssql.ShiftTeamSnapshot) bool {
	start := time.Unix(snapshot.StartTimestampSec, 0)
	end := time.Unix(snapshot.EndTimestampSec, 0)
	// TODO: Are there other criteria by which we don't send this rest break? For example, looking at service and
	// drive time still remaining?
	// Note that a single shift team being in a weird state still bricks the market, which is not super desirable.
	//
	// If the shift is over (or getting close to being so) - we don't try to fill this time.
	// Honestly, we should try to incorporate the drive time back to the depot from the shift team's location as well.
	return maxTime(currentTime, start).Before(end.Add(-cfg.RestBreakDuration))
}

type EntityMappings struct {
	CareRequests map[VisitSnapshotID]CareRequestID
	ShiftTeams   map[ShiftTeamSnapshotID]ShiftTeamID
}

// AttachCheckFeasibilityRequestToProblem returns a deep copy of the VRPProblemData with check feasibility data in it.
//
// Example Usage: If there are many VRPProblems to construct from a base problem that only differ in the location
// of the feasibility visit, one would call CreateVRPProblem once for the market's base problem, then
// AttachCheckFeasibilityRequestToProblem several times, once for each feasibility visit.
func (ldb *LogisticsDB) AttachCheckFeasibilityRequestToProblem(p *VRPProblemData, cfVisits []*logisticspb.CheckFeasibilityVisit, cfLocIDs []int64) (*VRPProblemData, error) {
	if len(p.FeasibilityVisitIDs) > 0 {
		return nil, errors.New("WithCheckFeasibilityRequest called on base VRPProblemData that already has FeasibilityVisitIDs")
	}
	optimizerRunCopy := *p.OptimizerRun
	result := &VRPProblemData{
		VRPProblem:                  proto.Clone(p.VRPProblem).(*optimizerpb.VRPProblem),
		OptimizerRun:                &optimizerRunCopy,
		CheckFeasibilityDiagnostics: p.CheckFeasibilityDiagnostics,
	}

	cfVRPVisits, err := feasibilityVisitsWithLocationIDs(cfVisits, TimeWindow{
		Start: time.Unix(optimizerRunCopy.OpenHoursStartTimestampSec, 0),
		End:   time.Unix(optimizerRunCopy.OpenHoursEndTimestampSec, 0),
	}, optimizerRunCopy.SnapshotTimestamp, cfLocIDs)
	if err != nil {
		return nil, fmt.Errorf("error in feasibilityVisitsWithLocationIDs: %w", err)
	}

	var feasibilityVisitIDs []int64
	for _, v := range cfVRPVisits {
		feasibilityVisitIDs = append(feasibilityVisitIDs, v.GetId())
	}
	result.VRPProblem.Description.Visits = append(result.VRPProblem.Description.Visits, cfVRPVisits...)
	result.FeasibilityVisitIDs = feasibilityVisitIDs

	return result, nil
}

func feasibilityVisitsWithLocationIDs(visits []*logisticspb.CheckFeasibilityVisit, openHoursTW TimeWindow, snapshotTime time.Time, cfLocIDs []int64) ([]*optimizerpb.VRPVisit, error) {
	if len(cfLocIDs) < len(visits) {
		return nil, fmt.Errorf("wrong number of location IDs (%d), expected at least %d", len(cfLocIDs), len(visits))
	}

	var feasibilityVisits []*optimizerpb.VRPVisit
	for i, paramVisit := range visits {
		visitID := int64(-1 * (i + 1))
		locID := cfLocIDs[i]
		checkFeasibilityVisit, err := VRPVisitFromCheckFeasibilityRequest(&VRPVisitFromCFVisitParams{
			Visit:              paramVisit,
			FeasibilityVisitID: visitID,
			LocationID:         locID,
			OpenHoursTW:        openHoursTW,
			NowClamp:           snapshotTime,
		})

		if err != nil {
			return nil, fmt.Errorf("error in VRPVisitFromCheckFeasibilityRequest: %w", err)
		}

		feasibilityVisits = append(feasibilityVisits, checkFeasibilityVisit)
	}
	return feasibilityVisits, nil
}

// Reconcile historical and current references in the description to be that of the latest snapshot IDs.
func (r *snapshotIDReconciler) Reconcile(desc *optimizerpb.VRPDescription) (*optimizerpb.VRPDescription, error) {
	desc.UnassignedVisits = r.ReconcileUnassignedVisits(desc.UnassignedVisits, desc.ShiftTeams)
	return desc, nil
}

func shiftTeamIDsFromSchedules(schedules []*logisticspb.ShiftTeamSchedule) []int64 {
	res := make([]int64, len(schedules))
	for i, schedule := range schedules {
		res[i] = schedule.ShiftTeamId
	}
	return res
}

func (ldb *LogisticsDB) GetVisitLocations(ctx context.Context, visits []*logisticspb.CheckFeasibilityVisit) ([]*logisticssql.Location, error) {
	latE6s := make([]int32, len(visits))
	lngE6s := make([]int32, len(visits))
	for i, visit := range visits {
		if visit.Location == nil {
			return nil, status.Errorf(codes.Internal, "error location not found for visit: %s", visit)
		}
		latE6s[i] = visit.Location.LatitudeE6
		lngE6s[i] = visit.Location.LongitudeE6
	}

	locs, err := ldb.queries.GetLocations(ctx,
		logisticssql.GetLocationsParams{
			LatE6s: latE6s,
			LngE6s: lngE6s,
		})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "error adding locations: %s", err)
	}

	return locs, nil
}

func (ldb *LogisticsDB) UpsertVisitLocations(ctx context.Context, visits []*logisticspb.CheckFeasibilityVisit) error {
	latE6s := make([]int32, len(visits))
	lngE6s := make([]int32, len(visits))
	for i, visit := range visits {
		if visit.Location == nil {
			return status.Errorf(codes.Internal, "error location not found for visit: %s", visit)
		}
		latE6s[i] = visit.Location.LatitudeE6
		lngE6s[i] = visit.Location.LongitudeE6
	}

	_, err := ldb.queries.UpsertLocations(ctx,
		logisticssql.UpsertLocationsParams{
			LatE6s: latE6s,
			LngE6s: lngE6s,
		})
	if err != nil {
		return status.Errorf(codes.Internal, "error adding locations: %s", err)
	}

	return nil
}

func (ldb *LogisticsDB) WriteShiftTeamSnapshot(ctx context.Context,
	shiftTeamID int64, resp *shiftteampb.GetShiftTeamResponse) (*logisticssql.ShiftTeamSnapshot, error) {
	if resp.ShiftTeam == nil {
		return nil, errors.New("no shift team")
	}

	shiftTeam := resp.ShiftTeam

	if shiftTeam.ShiftTimeWindow == nil {
		return nil, errors.New("shift time window is empty")
	}

	queries := ldb.queries

	startTime, err := ProtoDateTimeToTime(shiftTeam.ShiftTimeWindow.StartDatetime)
	if err != nil {
		return nil, err
	}

	endTime, err := ProtoDateTimeToTime(shiftTeam.ShiftTimeWindow.EndDatetime)
	if err != nil {
		return nil, err
	}

	if shiftTeam.MarketId == nil {
		return nil, errors.New("the marketId is empty")
	}

	serviceRegion, err := queries.GetServiceRegionForStationMarket(ctx, *shiftTeam.MarketId)
	if err != nil {
		return nil, fmt.Errorf("error getting service region for station market id: %w", err)
	}

	if shiftTeam.BaseLocation == nil {
		return nil, errors.New("location is empty")
	}

	var shiftTeamSnapshot *logisticssql.ShiftTeamSnapshot
	err = ldb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := ldb.queries.WithTx(tx)

		baseLocation, err := UpsertLocation(ctx, queries, logistics.LatLng{
			LatE6: shiftTeam.BaseLocation.LatitudeE6,
			LngE6: shiftTeam.BaseLocation.LongitudeE6,
		})
		if err != nil {
			return err
		}
		var deletedAt sql.NullTime
		if shiftTeam.DeletedAt != nil {
			deletedTime, err := ProtoDateTimeToTime(shiftTeam.DeletedAt)
			if err != nil {
				return err
			}

			deletedAt = sql.NullTime{Valid: true, Time: *deletedTime}
		}

		shiftTeamSnapshot, err = queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
			ShiftTeamID:       shiftTeamID,
			ServiceRegionID:   serviceRegion.ID,
			BaseLocationID:    baseLocation.ID,
			StartTimestampSec: startTime.Unix(),
			EndTimestampSec:   endTime.Unix(),
			DeletedAt:         deletedAt,
			NumAppMembers:     shiftTeam.GetAdvancedPracticeProviderCount(),
			NumDhmtMembers:    shiftTeam.Get*company-data-covered*MedicalTechnicianCount(),
		})
		if err != nil {
			return err
		}
		if shiftTeam.CurrentLocation != nil {
			currentLocation, err := UpsertLocation(ctx, queries, logistics.LatLng{
				LatE6: shiftTeam.CurrentLocation.LatitudeE6,
				LngE6: shiftTeam.CurrentLocation.LongitudeE6,
			})
			if err != nil {
				return err
			}
			_, err = queries.AddShiftTeamLocation(ctx, logisticssql.AddShiftTeamLocationParams{
				ShiftTeamSnapshotID: shiftTeamSnapshot.ID,
				LocationID:          currentLocation.ID,
			})
			if err != nil {
				return err
			}
		}

		if shiftTeam.ShiftTeamAttributes != nil {
			var attributeNames []string
			for _, attribute := range shiftTeam.ShiftTeamAttributes {
				attributeNames = append(attributeNames, attribute.Name)
			}

			_, err := queries.UpsertAttributes(ctx, attributeNames)
			if err != nil {
				return err
			}

			attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
			if err != nil {
				return err
			}

			var attributeIDs, snapshotIDs []int64
			for _, attribute := range attributes {
				snapshotIDs = append(snapshotIDs, shiftTeamSnapshot.ID)
				attributeIDs = append(attributeIDs, attribute.ID)
			}

			_, err = queries.UpsertShiftTeamAttributes(ctx,
				logisticssql.UpsertShiftTeamAttributesParams{
					ShiftTeamSnapshotIds: snapshotIDs,
					AttributeIds:         attributeIDs,
				})
			if err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return shiftTeamSnapshot, nil
}

type NewInfoParams struct {
	ServiceRegionID int64

	TimeWindow         TimeWindow
	SinceSnapshotTime  time.Time
	LatestSnapshotTime time.Time
}

func (ldb *LogisticsDB) HasAnyNewInfoInRegionSince(ctx context.Context, params NewInfoParams) (bool, error) {
	queries := ldb.queries

	// TODO: Maybe run all queries in parallel/batch.

	// Order queries from cheapest to most expensive queries.

	vals, err := queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, logisticssql.HasAnyShiftTeamSnapshotsInRegionSinceParams{
		ServiceRegionID:    params.ServiceRegionID,
		StartTimestampSec:  params.TimeWindow.Start.Unix(),
		EndTimestampSec:    params.TimeWindow.End.Unix(),
		SinceSnapshotTime:  params.SinceSnapshotTime,
		LatestSnapshotTime: params.LatestSnapshotTime,
	})
	if err != nil {
		return false, err
	}

	if len(vals) > 0 {
		return true, nil
	}

	vals, err = queries.HasAnyVisitSnapshotsInRegionSince(ctx, logisticssql.HasAnyVisitSnapshotsInRegionSinceParams{
		ServiceRegionID:    params.ServiceRegionID,
		StartTimestampSec:  sqltypes.ToValidNullInt64(params.TimeWindow.Start.Unix()),
		EndTimestampSec:    sqltypes.ToValidNullInt64(params.TimeWindow.End.Unix()),
		SinceSnapshotTime:  params.SinceSnapshotTime,
		LatestSnapshotTime: params.LatestSnapshotTime,
	})
	if err != nil {
		return false, err
	}

	if len(vals) > 0 {
		return true, nil
	}

	vals, err = queries.HasAnyNewShiftTeamRestBreakRequestsForShiftTeamsInRegionSince(ctx, logisticssql.HasAnyNewShiftTeamRestBreakRequestsForShiftTeamsInRegionSinceParams{
		ServiceRegionID:    params.ServiceRegionID,
		StartTimestampSec:  params.TimeWindow.Start.Unix(),
		EndTimestampSec:    params.TimeWindow.End.Unix(),
		SinceSnapshotTime:  params.SinceSnapshotTime,
		LatestSnapshotTime: params.LatestSnapshotTime,
	})
	if err != nil {
		return false, err
	}

	if len(vals) > 0 {
		return true, nil
	}

	return false, nil
}

type VRPVisitFromCFVisitParams struct {
	Visit              *logisticspb.CheckFeasibilityVisit
	FeasibilityVisitID int64
	LocationID         int64

	OpenHoursTW TimeWindow
	NowClamp    time.Time
}

func VRPVisitFromCheckFeasibilityRequest(params *VRPVisitFromCFVisitParams) (*optimizerpb.VRPVisit, error) {
	feasibilityVisitID := params.FeasibilityVisitID
	if !VisitSnapshotID(feasibilityVisitID).isCheckFeasibilityVisitSnapshotID() {
		return nil, status.Errorf(codes.Internal, "feasibility visits must have negative identifiers, observed: %d", feasibilityVisitID)
	}

	visit := params.Visit
	var vrpRequiredAttributes []*optimizerpb.VRPAttribute
	for _, attribute := range visit.RequiredAttributes {
		vrpRequiredAttributes = append(vrpRequiredAttributes, &optimizerpb.VRPAttribute{Id: attribute.Name})
	}
	for _, attribute := range visit.PreferredAttributes {
		vrpRequiredAttributes = append(vrpRequiredAttributes, &optimizerpb.VRPAttribute{Id: attribute.Name})
	}
	var vrpForbiddenAttributes []*optimizerpb.VRPAttribute
	for _, attribute := range visit.ForbiddenAttributes {
		vrpForbiddenAttributes = append(vrpForbiddenAttributes, &optimizerpb.VRPAttribute{Id: attribute.Name})
	}
	for _, attribute := range visit.UnwantedAttributes {
		vrpForbiddenAttributes = append(vrpForbiddenAttributes, &optimizerpb.VRPAttribute{Id: attribute.Name})
	}

	timeWindow, err := getVRPTimeWindowFromCheckFeasibilityVisit(
		visit,
		params.OpenHoursTW,
		params.NowClamp)
	if err != nil {
		if errors.Is(err, ErrFeasibilityInThePast) {
			return nil, err
		}
		return nil, status.Errorf(codes.Internal, "error getting time window: %s", err)
	}

	vrpVisit := &optimizerpb.VRPVisit{
		Id:                  proto.Int64(feasibilityVisitID),
		Acuity:              &optimizerpb.VRPVisitAcuity{Level: proto.Int64(DefaultOptimizerAcuityLevel)},
		ArrivalTimeWindow:   timeWindow,
		ServiceDurationSec:  visit.ServiceDurationSec,
		RequiredAttributes:  vrpRequiredAttributes,
		ForbiddenAttributes: vrpForbiddenAttributes,
		LocationId:          proto.Int64(params.LocationID),
	}

	return vrpVisit, nil
}

func clampTimeWindowStart(tw *optimizerpb.VRPTimeWindow, clamp time.Time) (*optimizerpb.VRPTimeWindow, error) {
	clampTimestampSec := clamp.Unix()
	if clampTimestampSec >= *tw.EndTimestampSec {
		return nil, ErrFeasibilityInThePast
	}
	if clampTimestampSec >= *tw.StartTimestampSec {
		tw.StartTimestampSec = proto.Int64(clampTimestampSec)
	}
	return tw, nil
}

func getVRPTimeWindowFromCheckFeasibilityVisit(visit *logisticspb.CheckFeasibilityVisit, serviceRegionOpenHoursTW TimeWindow, nowClamp time.Time) (*optimizerpb.VRPTimeWindow, error) {
	switch visit.ArrivalTimeSpecification.(type) {
	case *logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow:
		tw, err := VRPTimeWindowFromTimeWindow(visit.GetArrivalTimeWindow())
		if err != nil {
			return nil, err
		}
		return clampTimeWindowStart(tw, nowClamp)
	case *logisticspb.CheckFeasibilityVisit_ArrivalDate:
		return clampTimeWindowStart(
			&optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(serviceRegionOpenHoursTW.Start.Unix()),
				EndTimestampSec:   proto.Int64(serviceRegionOpenHoursTW.End.Unix()),
			},
			nowClamp,
		)
	default:
		return nil, errors.New("visit must provide a time window or an arrival date")
	}
}

// GetLocationsByIDs returns all locations for locIDs, or ErrNotAllLocationIDsFound if any are missing.
func (ldb *LogisticsDB) GetLocationsByIDs(ctx context.Context, locIDs []int64) ([]*logisticssql.Location, error) {
	queries := ldb.queries

	locs, err := queries.GetLocationsByIDs(ctx, locIDs)
	if err != nil {
		return nil, err
	}
	if len(locs) != len(locIDs) {
		return locs, ErrNotAllLocationIDsFound
	}

	return locs, nil
}

type VisitServiceDurations map[VisitServiceDurationKey]time.Duration

func (ldb *LogisticsDB) GetServiceRegionVisitServiceDurations(ctx context.Context, params logisticssql.GetServiceRegionCanonicalVisitDurationsParams) (VisitServiceDurations, error) {
	serviceRegionVisitDurations, err := ldb.queries.GetServiceRegionCanonicalVisitDurations(ctx, params)
	if err != nil {
		return nil, ErrUndefinedVisitServiceDurationsForRegion
	}

	minVisitServiceDuration := time.Duration(serviceRegionVisitDurations.ServiceDurationMinSec) * time.Second
	maxVisitServiceDuration := time.Duration(serviceRegionVisitDurations.ServiceDurationMaxSec) * time.Second
	visitDurations := make(VisitServiceDurations)
	visitDurations[MinVisitServiceDurationKey] = minVisitServiceDuration
	visitDurations[MaxVisitServiceDurationKey] = maxVisitServiceDuration
	return visitDurations, nil
}

type UpdateServiceRegionFeasibilityCheckSettingsParams struct {
	ServiceRegionID  int64
	Locations        []logistics.LatLng
	MinVisitDuration *time.Duration
	MaxVisitDuration *time.Duration
}

// UpdateServiceRegionFeasibilityCheckSettings updates a service region's set of canonical locations.
func (ldb *LogisticsDB) UpdateServiceRegionFeasibilityCheckSettings(ctx context.Context, settingsParams UpdateServiceRegionFeasibilityCheckSettingsParams) ([]*logisticssql.Location, error) {
	var canonicalLocations []*logisticssql.Location
	err := ldb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := ldb.queries.WithTx(tx)

		set, err := queries.AddServiceRegionCanonicalLocationSet(ctx, settingsParams.ServiceRegionID)
		if err != nil {
			return err
		}

		locs, err := UpsertLocations(ctx, queries, settingsParams.Locations)
		if err != nil {
			return err
		}

		params := logisticssql.AddServiceRegionCanonicalLocationsParams{
			ServiceRegionCanonicalLocationSetID: set.ID,
			LocationsIds:                        make([]int64, len(locs)),
		}
		for i, loc := range locs {
			params.LocationsIds[i] = loc.ID
		}
		_, err = queries.AddServiceRegionCanonicalLocations(ctx, params)
		if err != nil {
			return err
		}

		var minVisitDuration int64
		if settingsParams.MinVisitDuration != nil {
			minVisitDuration = int64(settingsParams.MinVisitDuration.Seconds())
		}

		var maxVisitDuration int64
		if settingsParams.MaxVisitDuration != nil {
			maxVisitDuration = int64(settingsParams.MaxVisitDuration.Seconds())
		}

		if minVisitDuration > 0 || maxVisitDuration > 0 {
			_, err = queries.AddServiceRegionCanonicalVisitDurations(ctx, logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
				ServiceRegionID:       settingsParams.ServiceRegionID,
				ServiceDurationMinSec: minVisitDuration,
				ServiceDurationMaxSec: maxVisitDuration,
			})
			if err != nil {
				return err
			}
		}

		canonicalLocations = locs
		return err
	})
	if err != nil {
		return nil, err
	}

	return canonicalLocations, nil
}

func (ldb *LogisticsDB) GetServiceRegionCanonicalLocations(ctx context.Context, serviceRegionID int64) ([]*logisticssql.Location, error) {
	canonicalLocations, err := ldb.queries.GetServiceRegionCanonicalLocations(ctx, serviceRegionID)
	if err != nil {
		return nil, ErrUndefinedCanonicalLocationsForRegion
	}

	locationIDs := make([]int64, len(canonicalLocations))
	for i, canonicalLocation := range canonicalLocations {
		locationIDs[i] = canonicalLocation.LocationID
	}

	locations, err := ldb.GetLocationsByIDs(ctx, locationIDs)
	if err != nil {
		return nil, err
	}

	return locations, nil
}

func (ldb *LogisticsDB) GetMarketForStationMarketID(ctx context.Context, stationMarketID int64) (*logisticssql.Market, error) {
	queries := ldb.queries
	market, err := queries.GetMarketByStationMarketID(ctx, stationMarketID)
	if err != nil {
		return nil, ErrUnknownMarketForStationMarketID
	}

	return market, nil
}

func (ldb *LogisticsDB) GetServiceRegionForStationMarketID(ctx context.Context, stationMarketID int64) (*logisticssql.ServiceRegion, error) {
	queries := ldb.queries
	serviceRegion, err := queries.GetServiceRegionForStationMarket(ctx, stationMarketID)
	if err != nil {
		return nil, ErrUnknownStationMarketID
	}

	return serviceRegion, nil
}

type ShiftTeamSnapshotIDResponse struct {
	ShiftTeamSnapshotID *int64
	ServiceRegionID     *int64
}

func (ldb *LogisticsDB) GetLatestShiftTeamSnapshotID(ctx context.Context, latestSnapshotTimestamp time.Time, shiftTeamID int64) (*ShiftTeamSnapshotIDResponse, error) {
	queries := ldb.queries
	snapshot, err := queries.GetLatestShiftTeamSnapshot(ctx,
		logisticssql.GetLatestShiftTeamSnapshotParams{
			ShiftTeamID: shiftTeamID,
			CreatedAt:   latestSnapshotTimestamp,
		})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnknownShiftTeam
		}

		return nil, err
	}

	return &ShiftTeamSnapshotIDResponse{
		ShiftTeamSnapshotID: &snapshot.ID,
		ServiceRegionID:     &snapshot.ServiceRegionID,
	}, nil
}

func (ldb *LogisticsDB) GetLatestShiftTeamLocationID(ctx context.Context, shiftTeamID int64, before time.Time) (int64, error) {
	snapshotResponse, err := ldb.GetLatestShiftTeamSnapshotID(ctx, before, shiftTeamID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrUnknownShiftTeam
		}
		return 0, err
	}
	loc, err := ldb.queries.GetLatestShiftTeamLocation(ctx, logisticssql.GetLatestShiftTeamLocationParams{
		ShiftTeamSnapshotID: *snapshotResponse.ShiftTeamSnapshotID,
		CreatedAt:           before,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrNoShiftTeamLocation
		}
		return 0, err
	}
	return loc.LocationID, nil
}

type UpdateShiftTeamLocationResponse struct {
	ServiceRegionID *int64
}

func (ldb *LogisticsDB) UpdateShiftTeamLocation(ctx context.Context, latestSnapshotTimestamp time.Time, shiftTeamID int64, latLng logistics.LatLng) (*UpdateShiftTeamLocationResponse, error) {
	queries := ldb.queries

	snapshotResponse, err := ldb.GetLatestShiftTeamSnapshotID(ctx, latestSnapshotTimestamp, shiftTeamID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnknownShiftTeam
		}
		return nil, err
	}

	location, err := UpsertLocation(ctx, queries, latLng)
	if err != nil {
		return nil, err
	}

	_, err = queries.AddShiftTeamLocation(ctx,
		logisticssql.AddShiftTeamLocationParams{
			ShiftTeamSnapshotID: *snapshotResponse.ShiftTeamSnapshotID,
			LocationID:          location.ID,
		})

	return &UpdateShiftTeamLocationResponse{ServiceRegionID: snapshotResponse.ServiceRegionID}, err
}

func UpsertLocation(ctx context.Context, queries *logisticssql.Queries, latLng logistics.LatLng) (*logisticssql.Location, error) {
	locations, err := queries.UpsertLocation(ctx,
		logisticssql.UpsertLocationParams{
			LatitudeE6:  latLng.LatE6,
			LongitudeE6: latLng.LngE6,
		})
	if err != nil {
		return nil, err
	}

	if len(locations) == 1 {
		return locations[0], nil
	}

	return queries.GetLocation(ctx, logisticssql.GetLocationParams{
		LatitudeE6:  latLng.LatE6,
		LongitudeE6: latLng.LngE6,
	})
}

func UpsertLocations(ctx context.Context, queries *logisticssql.Queries, latLngs []logistics.LatLng) ([]*logisticssql.Location, error) {
	params := logisticssql.UpsertLocationsParams{
		LatE6s: make([]int32, len(latLngs)),
		LngE6s: make([]int32, len(latLngs)),
	}
	for i, ll := range latLngs {
		params.LatE6s[i] = ll.LatE6
		params.LngE6s[i] = ll.LngE6
	}

	_, err := queries.UpsertLocations(ctx, params)
	if err != nil {
		return nil, err
	}

	locs, err := queries.GetLocations(ctx, logisticssql.GetLocationsParams(params))
	if err != nil {
		return nil, err
	}

	if len(locs) != len(latLngs) {
		return nil, fmt.Errorf("could not upsert all locations, mismatch length %d != %d", len(locs), len(latLngs))
	}

	return locs, nil
}

func UpsertOptimizerSettings(ctx context.Context, queries *logisticssql.Queries, settings *optimizersettings.Settings) (*logisticssql.OptimizerSetting, error) {
	buf, err := json.Marshal(settings)
	if err != nil {
		return nil, err
	}

	var optimizerSettingsJSONB pgtype.JSONB
	err = optimizerSettingsJSONB.Set(buf)
	if err != nil {
		return nil, err
	}

	optimizerSettings, err := queries.UpsertOptimizerSettings(ctx, optimizerSettingsJSONB)
	if err != nil {
		return nil, err
	}

	if len(optimizerSettings) == 1 {
		return optimizerSettings[0], nil
	}

	sc, err := queries.GetOptimizerSettingsByValue(ctx, optimizerSettingsJSONB)
	if err != nil {
		return nil, err
	}

	return sc, nil
}

func (ldb *LogisticsDB) GetOptimizerSettingsByID(ctx context.Context, id int64) (*optimizersettings.Settings, error) {
	optimizerSettingsRow, err := ldb.queries.GetOptimizerSettingsByID(ctx, id)
	if err != nil {
		return nil, err
	}

	var optimizerSettings optimizersettings.Settings
	err = json.Unmarshal(optimizerSettingsRow.Settings.Bytes, &optimizerSettings)
	if err != nil {
		return nil, err
	}
	return &optimizerSettings, nil
}

func UpsertConstraintConfig(ctx context.Context, queries *logisticssql.Queries, config *optimizerpb.VRPConstraintConfig) (*logisticssql.OptimizerConstraintConfig, error) {
	buf, err := constraintConfigMarshaller.Marshal(config)
	if err != nil {
		return nil, err
	}

	var configJSONB pgtype.JSONB
	err = configJSONB.Set(buf)
	if err != nil {
		return nil, err
	}

	configs, err := queries.UpsertConstraintConfig(ctx, configJSONB)
	if err != nil {
		return nil, err
	}

	if len(configs) == 1 {
		return configs[0], nil
	}

	c, err := queries.GetConstraintConfigByValue(ctx, configJSONB)
	if err != nil {
		return nil, err
	}

	return c, nil
}

func (ldb *LogisticsDB) GetConstraintConfig(ctx context.Context, id int64) (*optimizerpb.VRPConstraintConfig, error) {
	c, err := ldb.queries.GetConstraintConfig(ctx, id)
	if err != nil {
		return nil, err
	}

	if c.Config.Status != pgtype.Present {
		return nil, ErrInvalidConstraintConfig
	}

	var config optimizerpb.VRPConstraintConfig
	err = constraintConfigUnmarshaller.Unmarshal(c.Config.Bytes, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

type toShiftTeamRouteStopParams struct {
	row                        *logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow
	visitExtraSetupDurationSec int64
	locationIndex              map[int64]*logisticssql.Location
}

func toShiftTeamRouteStop(params toShiftTeamRouteStopParams) (*logisticspb.ShiftTeamRouteStop, error) {
	row := params.row
	locIndex := params.locationIndex

	switch {
	case row.ScheduleRestBreakID.Valid:
		if !row.BreakRequestLocationID.Valid {
			return nil, fmt.Errorf("invalid BreakRequestLocationID for stop: %d", row.ID)
		}
		loc, ok := locIndex[row.BreakRequestLocationID.Int64]
		if !ok {
			return nil, fmt.Errorf("missing location for location ID: %d", row.BreakRequestLocationID.Int64)
		}
		return &logisticspb.ShiftTeamRouteStop{Stop: &logisticspb.ShiftTeamRouteStop_RestBreak{RestBreak: &logisticspb.ShiftTeamRestBreak{
			RestBreakId:       row.BreakRequestID.Int64,
			StartTimestampSec: &row.BreakRequestStartTimestampSec.Int64,
			DurationSec:       &row.BreakRequestDurationSec.Int64,
			Location: &commonpb.Location{
				LatitudeE6:  loc.LatitudeE6,
				LongitudeE6: loc.LongitudeE6,
			},
		}}}, nil
	case row.ScheduleVisitID.Valid:
		if !row.VisitPhaseShortName.Valid {
			return nil, fmt.Errorf("invalid missing visit phase short name for schedule visit ID(%d)", row.ScheduleVisitID.Int64)
		}
		status := VisitPhaseShortNameToScheduleVisitStatus[VisitPhaseShortName(row.VisitPhaseShortName.String)]
		if status == nil {
			return nil, fmt.Errorf(
				"unexpected visit phase for schedule visit ID(%d): %s",
				row.ScheduleVisitID.Int64,
				row.VisitPhaseShortName.String,
			)
		}
		if !row.VisitLocationID.Valid {
			return nil, fmt.Errorf("invalid VisitLocationID for stop:%d", row.ID)
		}
		loc, ok := locIndex[row.VisitLocationID.Int64]
		if !ok {
			return nil, fmt.Errorf("missing location for location ID: %d", row.VisitLocationID.Int64)
		}
		if !row.ArrivalTimestampSec.Valid {
			return nil, fmt.Errorf("invalid missing arrival time for schedule visit ID(%d)", row.ScheduleVisitID.Int64)
		}
		if !row.ArrivalStartTimestampSec.Valid {
			return nil, fmt.Errorf("invalid missing arrival start time for visit ID(%d)", row.VisitSnapshotID.Int64)
		}
		if !row.ServiceDurationSec.Valid {
			return nil, fmt.Errorf("invalid missing service duration for visit ID(%d)", row.VisitSnapshotID.Int64)
		}

		visitAcuityConverter := &rowToVisitAcuityConverter{
			arrivalStartTimestampSec:              row.ArrivalStartTimestampSec,
			arrivalEndTimestampSec:                row.ArrivalEndTimestampSec,
			visitClinicalUrgencyWindowDurationSec: row.VisitClinicalUrgencyWindowSec,
			visitClinicalUrgencyLevelID:           row.VisitClinicalUrgencyLevelID,
		}

		return &logisticspb.ShiftTeamRouteStop{Stop: &logisticspb.ShiftTeamRouteStop_Visit{Visit: &logisticspb.ShiftTeamVisit{
			CareRequestId:       &row.CareRequestID.Int64,
			ArrivalTimestampSec: &row.ArrivalTimestampSec.Int64,
			// TODO: Fetch from Visit table, which Optimizer will return
			CompleteTimestampSec: proto.Int64(estimateToComplete(
				estimateToCompleteParams{
					visitPhaseShortName:      VisitPhaseShortName(row.VisitPhaseShortName.String),
					arrivalTimestampSec:      row.ArrivalTimestampSec.Int64,
					arrivalStartTimestampSec: row.ArrivalStartTimestampSec.Int64,
					serviceDurationSec:       row.ServiceDurationSec.Int64,
					extraSetupDurationSec:    params.visitExtraSetupDurationSec,
				},
			)),
			Location: &commonpb.Location{
				LatitudeE6:  loc.LatitudeE6,
				LongitudeE6: loc.LongitudeE6,
			},
			Status: status,
			Acuity: visitAcuityConverter.toVisitAcuity(),
		}}}, nil
	}

	return nil, errors.New("unhandled route stop type")
}

// ShiftTeamSchedule wraps a proto ShiftTeamSchedule with additional metadata.
type ShiftTeamSchedule struct {
	Metadata        *logisticspb.ScheduleMetadata
	Schedule        *logisticspb.ShiftTeamSchedule
	PendingUpdates  *logisticspb.SchedulePendingUpdates
	ServiceRegionID int64
}

func locationIDsFromRouteStops(routeStops []*logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow) ([]int64, error) {
	locationIDSet := collections.NewLinkedInt64Set(len(routeStops))
	for _, row := range routeStops {
		switch {
		case row.BreakRequestLocationID.Valid:
			locationIDSet.Add(row.BreakRequestLocationID.Int64)
		case row.VisitLocationID.Valid:
			locationIDSet.Add(row.VisitLocationID.Int64)
		default:
			return nil, fmt.Errorf("locationIDsFromRouteStops: invalid schedule_route_stop(%d) that is not a rest break nor visit", row.ID)
		}
	}
	return locationIDSet.Elems(), nil
}

type estimateToCompleteParams struct {
	visitPhaseShortName      VisitPhaseShortName
	arrivalTimestampSec      int64
	arrivalStartTimestampSec int64
	serviceDurationSec       int64
	extraSetupDurationSec    int64
}

func estimateToComplete(params estimateToCompleteParams) int64 {
	var serviceStartTimestampSec int64
	switch params.visitPhaseShortName {
	case VisitPhaseTypeShortNameEnRoute, VisitPhaseTypeShortNameOnScene:
		serviceStartTimestampSec = params.arrivalTimestampSec
	default:
		serviceStartTimestampSec = int64(math.Max(
			float64(params.arrivalTimestampSec),
			float64(params.arrivalStartTimestampSec),
		))
	}

	return serviceStartTimestampSec +
		params.extraSetupDurationSec +
		params.serviceDurationSec
}

func indexLocationsByID(locations []*logisticssql.Location) map[int64]*logisticssql.Location {
	res := make(map[int64]*logisticssql.Location, len(locations))
	for _, loc := range locations {
		res[loc.ID] = loc
	}
	return res
}

type getShiftTeamScheduleForScheduleRouteParams struct {
	scheduleRouteData       *logisticssql.GetLatestScheduleRouteForShiftTeamIDRow
	latestScheduleTimestamp time.Time
	settings                *optimizersettings.Settings
}

func (ldb *LogisticsDB) getShiftTeamScheduleForScheduleRoute(ctx context.Context, params getShiftTeamScheduleForScheduleRouteParams) (*ShiftTeamSchedule, error) {
	queries := ldb.queries
	scheduleRouteData := params.scheduleRouteData
	latestScheduleTimestamp := params.latestScheduleTimestamp

	baseLocations, err := ldb.GetLocationsByIDs(ctx, []int64{scheduleRouteData.ShiftTeamBaseLocationID})
	if err != nil {
		return nil, fmt.Errorf("base location not found: %w", err)
	}

	baseLocation := &commonpb.Location{
		LatitudeE6:  baseLocations[0].LatitudeE6,
		LongitudeE6: baseLocations[0].LongitudeE6,
	}

	openHoursTW, _, err := ldb.GetServiceRegionOpenHoursForDate(ctx, GetServiceRegionOpenHoursForDateParams{
		ServiceRegionID: scheduleRouteData.ServiceRegionID,
		Date:            scheduleRouteData.ServiceDate,
		SnapshotTime:    latestScheduleTimestamp,
	})
	if err != nil {
		return nil, err
	}

	missingSchedulesInfoByDateOffset, err := ldb.GetMissingScheduleInfoByServiceDates(ctx, GetMissingScheduleInfoByServiceDatesParams{
		ShiftTeamParams: []logisticssql.GetShiftTeamsIDsInRegionSinceParams{
			{
				ServiceRegionID:    scheduleRouteData.ServiceRegionID,
				StartTimestampSec:  openHoursTW.Start.Unix(),
				EndTimestampSec:    openHoursTW.End.Unix(),
				SinceSnapshotTime:  scheduleRouteData.SnapshotTimestamp,
				LatestSnapshotTime: latestScheduleTimestamp,
			},
		},
		CareRequestParams: []logisticssql.GetCareRequestIDsSinceParams{
			{
				ServiceRegionID:    scheduleRouteData.ServiceRegionID,
				StartTimestampSec:  sqltypes.ToValidNullInt64(openHoursTW.Start.Unix()),
				EndTimestampSec:    sqltypes.ToValidNullInt64(openHoursTW.End.Unix()),
				SinceSnapshotTime:  scheduleRouteData.SnapshotTimestamp,
				LatestSnapshotTime: latestScheduleTimestamp,
			},
		},
	})
	if err != nil {
		return nil, err
	}

	opaqueToken, err := scheduleToken(scheduleRouteData.ScheduleID)
	if err != nil {
		return nil, err
	}

	meta := &logisticspb.ScheduleMetadata{
		ScheduleToken: opaqueToken,
		ServiceDate:   TimeToProtoDate(&scheduleRouteData.ServiceDate),
		GeneratedAt:   timestamppb.New(scheduleRouteData.SnapshotTimestamp),
	}

	restBreakRequests, err := queries.GetShiftTeamRestBreakRequestsForShiftTeams(ctx, logisticssql.GetShiftTeamRestBreakRequestsForShiftTeamsParams{
		ShiftTeamIds:  []int64{scheduleRouteData.ShiftTeamID},
		CreatedBefore: latestScheduleTimestamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting rest break requests: %w", err)
	}
	routeStops, err := queries.GetScheduleRouteStopsForScheduleRouteID(ctx, logisticssql.GetScheduleRouteStopsForScheduleRouteIDParams{
		ScheduleRouteID:    scheduleRouteData.RouteID,
		LatestSnapshotTime: latestScheduleTimestamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error reading schedule: %w", err)
	}

	var depotArrivalTimeSec *int64
	if len(routeStops) > 0 {
		depotArrivalTimeSec = &routeStops[0].DepotArrivalTimestampSec
	}
	locationIDs, err := locationIDsFromRouteStops(routeStops)
	if err != nil {
		return nil, fmt.Errorf("error loading locationsIDs: %w", err)
	}
	locations, err := ldb.GetLocationsByIDs(ctx, locationIDs)
	if err != nil {
		return nil, fmt.Errorf("error loading locations: %w", err)
	}

	var stops []*logisticspb.ShiftTeamRouteStop
	for _, stop := range routeStops {
		apiStop, err := toShiftTeamRouteStop(toShiftTeamRouteStopParams{
			row:                        stop,
			visitExtraSetupDurationSec: params.settings.VisitExtraSetupDurationSec,
			locationIndex:              indexLocationsByID(locations),
		})
		if err != nil {
			return nil, err
		}
		stops = append(stops, apiStop)
	}

	schedule := &logisticspb.ShiftTeamSchedule{
		ShiftTeamId: scheduleRouteData.ShiftTeamID,
		Route: &logisticspb.ShiftTeamRoute{
			BaseLocation:                    baseLocation,
			BaseLocationArrivalTimestampSec: depotArrivalTimeSec,
			// TODO(LOG-1648): Implement BaseLocationDepartureTimestampSec
			Stops: stops,
		},
	}
	shiftTeamSchedule := &ShiftTeamSchedule{
		ServiceRegionID: scheduleRouteData.ServiceRegionID,
		Schedule:        schedule,
		Metadata:        meta,
		PendingUpdates: &logisticspb.SchedulePendingUpdates{
			RestBreakRequests: pendingRestBreakUpdatesForSchedules([]*logisticspb.ShiftTeamSchedule{schedule}, restBreakRequests),
			ShiftTeams:        missingSchedulesInfoByDateOffset[0].ShiftTeams,
			Visits:            missingSchedulesInfoByDateOffset[0].CareRequests,
		},
	}

	return shiftTeamSchedule, nil
}

func pendingRestBreakUpdatesForSchedules(schedules []*logisticspb.ShiftTeamSchedule, restBreakRequests []*logisticssql.ShiftTeamRestBreakRequest) []*logisticspb.ShiftTeamRestBreakRequest {
	var pendingRestBreaks []*logisticspb.ShiftTeamRestBreakRequest

	seenRestBreakIDs := make(map[int64]bool)
	for _, schedule := range schedules {
		for _, stop := range schedule.GetRoute().GetStops() {
			if rb := stop.GetRestBreak(); rb != nil {
				seenRestBreakIDs[rb.RestBreakId] = true
			}
		}
	}
	for _, rbr := range restBreakRequests {
		// A rest break is only pending if we don't already see it in a schedule.
		if _, ok := seenRestBreakIDs[rbr.ID]; !ok {
			pendingRestBreaks = append(pendingRestBreaks, &logisticspb.ShiftTeamRestBreakRequest{
				ShiftTeamId: rbr.ShiftTeamID,
				// TODO: handle other types of rest break requests when they are created.
				BreakType: &logisticspb.ShiftTeamRestBreakRequest_OnDemand{
					OnDemand: &logisticspb.BreakOnDemand{
						StartTimestampSec: proto.Int64(rbr.StartTimestampSec),
						DurationSec:       proto.Int64(rbr.DurationSec),
					},
				},
			})
		}
	}

	return pendingRestBreaks
}

func scheduleToken(scheduleID int64) ([]byte, error) {
	return proto.Marshal(&logisticspb.ScheduleToken{
		ScheduleId: proto.Int64(scheduleID),
	})
}

func (ldb *LogisticsDB) GetLatestShiftTeamSchedule(
	ctx context.Context,
	shiftTeamID int64,
	timeWindow TimeWindow,
) (*ShiftTeamSchedule, error) {
	queries := ldb.queries

	scheduleRouteData, err := queries.GetLatestScheduleRouteForShiftTeamID(ctx, logisticssql.GetLatestScheduleRouteForShiftTeamIDParams{
		ShiftTeamID:               shiftTeamID,
		LatestScheduleTimestamp:   timeWindow.End,
		EarliestScheduleTimestamp: timeWindow.Start,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			opaqueToken, err := scheduleToken(scheduleRouteData.ScheduleID)
			if err != nil {
				return nil, err
			}

			return &ShiftTeamSchedule{
				Metadata: &logisticspb.ScheduleMetadata{
					ScheduleToken: opaqueToken,
					ServiceDate:   TimeToProtoDate(&timeWindow.End),
				},
				PendingUpdates: &logisticspb.SchedulePendingUpdates{
					ShiftTeams: []*logisticspb.PendingShiftTeamUpdate{
						{
							ShiftTeamId: shiftTeamID,
						},
					},
				},
			}, nil
		}

		return nil, fmt.Errorf("error reading latest schedule route: %w", err)
	}

	settings, err := ldb.settingsService.ServiceRegionSettings(ctx, scheduleRouteData.ServiceRegionID)
	if err != nil {
		return nil, fmt.Errorf("error loading settings: %w", err)
	}

	schedule, err := ldb.getShiftTeamScheduleForScheduleRoute(ctx, getShiftTeamScheduleForScheduleRouteParams{
		scheduleRouteData:       scheduleRouteData,
		latestScheduleTimestamp: timeWindow.End,
		settings:                settings,
	})
	if err != nil {
		return nil, err
	}

	return schedule, nil
}

type AddShiftTeamRestBreakParams struct {
	RestBreakParams logisticssql.AddShiftTeamRestBreakRequestParams
	LatestTimestamp time.Time
}

type AddShiftTeamRestBreakResponse struct {
	RestBreakRequest *logisticssql.ShiftTeamRestBreakRequest
	ServiceRegionID  int64
}

func (ldb *LogisticsDB) AddShiftTeamRestBreakRequest(ctx context.Context, params AddShiftTeamRestBreakParams) (*AddShiftTeamRestBreakResponse, error) {
	snapshot, err := ldb.queries.GetLatestShiftTeamSnapshot(
		ctx,
		logisticssql.GetLatestShiftTeamSnapshotParams{
			ShiftTeamID: params.RestBreakParams.ShiftTeamID,
			CreatedAt:   params.LatestTimestamp,
		},
	)
	if err != nil {
		return nil, err
	}

	var req *logisticssql.ShiftTeamRestBreakRequest
	txErr := ldb.db.BeginTxFunc(ctx, pgx.TxOptions{
		IsoLevel: pgx.Serializable,
	}, func(tx pgx.Tx) error {
		q := ldb.queries.WithTx(tx)
		r, err := q.AddShiftTeamRestBreakRequest(ctx, params.RestBreakParams)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return fmt.Errorf("shift team %d already has the maximum %d rest breaks per day", params.RestBreakParams.ShiftTeamID, params.RestBreakParams.MaxRestBreakRequests)
			}
			return err
		}

		req = r
		return nil
	})
	if txErr != nil {
		return nil, txErr
	}
	return &AddShiftTeamRestBreakResponse{
		RestBreakRequest: req,
		ServiceRegionID:  snapshot.ServiceRegionID,
	}, nil
}

func toScheduleRouteIDRow(row *logisticssql.GetScheduleRouteStopsForScheduleRow) *logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow {
	// TODO: though well-tested to ensure fields get mapped, consider consolidating queries.
	return &logisticssql.GetScheduleRouteStopsForScheduleRouteIDRow{
		ID:                            row.ID,
		ScheduleID:                    row.ScheduleID,
		ScheduleRouteID:               row.ScheduleRouteID,
		RouteIndex:                    row.RouteIndex,
		ScheduleVisitID:               row.ScheduleVisitID,
		ScheduleRestBreakID:           row.ScheduleRestBreakID,
		CreatedAt:                     row.CreatedAt,
		BreakRequestStartTimestampSec: row.BreakRequestStartTimestampSec,
		BreakRequestID:                row.BreakRequestID,
		BreakRequestDurationSec:       row.BreakRequestDurationSec,
		BreakRequestLocationID:        row.BreakRequestLocationID,
		ArrivalTimestampSec:           row.ArrivalTimestampSec,
		VisitSnapshotID:               row.VisitSnapshotID,
		DepotArrivalTimestampSec:      row.DepotArrivalTimestampSec,
		VisitPhaseShortName:           row.VisitPhaseShortName,
		CareRequestID:                 row.CareRequestID,
		ArrivalStartTimestampSec:      row.ArrivalStartTimestampSec,
		ArrivalEndTimestampSec:        row.ArrivalEndTimestampSec,
		ServiceDurationSec:            row.ServiceDurationSec,
		VisitLocationID:               row.VisitLocationID,
		VisitClinicalUrgencyWindowSec: row.VisitClinicalUrgencyWindowSec,
		VisitClinicalUrgencyLevelID:   row.VisitClinicalUrgencyLevelID,
	}
}

type toRouteStopParams struct {
	row                        *logisticssql.GetScheduleRouteStopsForScheduleRow
	visitExtraSetupDurationSec int64
	locIndex                   map[int64]*logisticssql.Location
}

func toRouteStop(params toRouteStopParams) (*logisticspb.ShiftTeamRouteStop, error) {
	return toShiftTeamRouteStop(toShiftTeamRouteStopParams{
		row:                        toScheduleRouteIDRow(params.row),
		visitExtraSetupDurationSec: params.visitExtraSetupDurationSec,
		locationIndex:              params.locIndex,
	})
}

type ServiceRegionDate struct {
	ServiceRegionID int64
	Date            time.Time
}

// ScheduleAndDebugScore associates a production schedule with *optional* debug score information.
type ScheduleAndDebugScore struct {
	Schedule *logisticspb.ServiceRegionDateSchedule
	// Score is only set if `includeDebug` is configured.
	Score *optimizerpb.VRPScore
}

func (ldb *LogisticsDB) GetShiftTeamsSchedulesFromScheduleID(ctx context.Context, scheduleID int64, latestTimestamp time.Time, includeDebug bool) (*ScheduleAndDebugScore, error) {
	queries := ldb.queries

	optimizerRun, err := queries.GetOptimizerRunForScheduleID(ctx, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("error getting optimizer run for schedule: %w", err)
	}

	opaqueToken, err := scheduleToken(scheduleID)
	if err != nil {
		return nil, fmt.Errorf("error marshalling schedule opaque token: %w", err)
	}

	meta := &logisticspb.ScheduleMetadata{
		ScheduleToken: opaqueToken,
		GeneratedAt:   timestamppb.New(optimizerRun.SnapshotTimestamp),
		ServiceDate:   TimeToProtoDate(&optimizerRun.ServiceDate),
	}

	routes, err := queries.GetScheduleRoutesForSchedule(ctx, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("error getting schedule routes: %w", err)
	}

	scheduleRouteStops, err := queries.GetScheduleRouteStopsForSchedule(ctx, logisticssql.GetScheduleRouteStopsForScheduleParams{
		ScheduleID:         scheduleID,
		LatestSnapshotTime: latestTimestamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting schedule visits: %w", err)
	}

	locationIDSet := collections.NewLinkedInt64Set(len(scheduleRouteStops))
	for _, stop := range scheduleRouteStops {
		switch {
		case stop.VisitLocationID.Valid:
			locationIDSet.Add(stop.VisitLocationID.Int64)
		case stop.BreakRequestLocationID.Valid:
			locationIDSet.Add(stop.BreakRequestLocationID.Int64)
		default:
			return nil, fmt.Errorf("missing location for stored stop(%d)", stop.ID)
		}
	}

	locs, err := ldb.GetLocationsByIDs(ctx, locationIDSet.Elems())
	if err != nil {
		return nil, fmt.Errorf("error fetching locations for stored stops: %w", err)
	}

	settings, err := ldb.settingsService.ServiceRegionSettings(ctx, optimizerRun.ServiceRegionID)
	if err != nil {
		return nil, fmt.Errorf("error fetching settings: %w", err)
	}

	locIndex := indexLocationsByID(locs)
	routeStops := map[int64][]*logisticspb.ShiftTeamRouteStop{}
	for _, stop := range scheduleRouteStops {
		stops := routeStops[stop.ScheduleRouteID]
		if len(stops) != int(stop.RouteIndex)-1 {
			return nil, errors.New("incorrect route index")
		}
		shiftTeamRouteStop, err := toRouteStop(toRouteStopParams{
			row:                        stop,
			visitExtraSetupDurationSec: settings.VisitExtraSetupDurationSec,
			locIndex:                   locIndex,
		})
		if err != nil {
			return nil, fmt.Errorf("error converting stored stop: %w", err)
		}

		routeStops[stop.ScheduleRouteID] = append(stops, shiftTeamRouteStop)
	}

	var schedules []*logisticspb.ShiftTeamSchedule
	for _, route := range routes {
		schedules = append(schedules, &logisticspb.ShiftTeamSchedule{
			ShiftTeamId: route.ShiftTeamID,
			Route: &logisticspb.ShiftTeamRoute{
				Stops: routeStops[route.ID],
				BaseLocation: &commonpb.Location{
					LatitudeE6:  route.BaseLocationLatitudeE6,
					LongitudeE6: route.BaseLocationLongitudeE6,
				},
				BaseLocationArrivalTimestampSec: proto.Int64(route.DepotArrivalTimestampSec),
				// TODO(LOG-1648): Implement BaseLocationDepartureTimestampSec
			},
		})
	}

	restBreakRequests, err := queries.GetShiftTeamRestBreakRequestsForShiftTeams(ctx,
		logisticssql.GetShiftTeamRestBreakRequestsForShiftTeamsParams{
			ShiftTeamIds:  shiftTeamIDsFromSchedules(schedules),
			CreatedBefore: latestTimestamp,
		},
	)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("error getting rest break requests: %w", err)
	}

	uvs, err := queries.GetUnassignedScheduleVisitsForScheduleID(ctx, logisticssql.GetUnassignedScheduleVisitsForScheduleIDParams{
		ScheduleID:         scheduleID,
		LatestSnapshotTime: latestTimestamp, // TODO: this should be the snapshot timestamp of that schedule
	})
	if err != nil {
		return nil, fmt.Errorf("error getting unassigned schedule visits: %w", err)
	}
	var unassignableVisits []*logisticspb.UnassignableVisit
	for _, uv := range uvs {
		converter := &rowToVisitAcuityConverter{
			arrivalStartTimestampSec:              uv.ArrivalStartTimestampSec,
			arrivalEndTimestampSec:                uv.ArrivalEndTimestampSec,
			visitClinicalUrgencyWindowDurationSec: uv.ClinicalUrgencyWindowDurationSec,
			visitClinicalUrgencyLevelID:           uv.ClinicalUrgencyLevelID,
		}
		unassignableVisits = append(unassignableVisits, &logisticspb.UnassignableVisit{
			CareRequestId: proto.Int64(uv.CareRequestID),
			Acuity:        converter.toVisitAcuity(),
		})
	}

	result := &ScheduleAndDebugScore{Schedule: &logisticspb.ServiceRegionDateSchedule{
		UnassignableVisits: unassignableVisits,
		Schedules:          schedules,
		Meta:               meta,
		PendingUpdates: &logisticspb.SchedulePendingUpdates{
			RestBreakRequests: pendingRestBreakUpdatesForSchedules(schedules, restBreakRequests),
			// TODO: How can we fill ShiftTeams and Visits for PendingUpdates based on latestTimestamp?
			// Would require queries against what was in visit snapshots for a region but not yet in a schedule.
		},
	}}
	if includeDebug {
		schedule, err := queries.GetSchedule(ctx, scheduleID)
		if err != nil {
			return nil, fmt.Errorf("error getting schedule: %w", err)
		}
		diagnostics, err := ldb.queries.GetDiagnosticsForSchedule(ctx, scheduleID)
		if err != nil {
			return nil, fmt.Errorf("error in GetDiagnosticsForSchedule: %w", err)
		}
		result.Score = &optimizerpb.VRPScore{
			IsValid:               proto.Bool(true),
			HardScore:             proto.Int64(schedule.HardScore),
			SoftScore:             proto.Int64(schedule.SoftScore),
			UnassignedVisitsScore: proto.Int64(schedule.UnassignedVisitsScore),
			DebugExplanation:      sqltypes.ToProtoString(diagnostics.DebugExplanation),
		}
	}
	return result, nil
}

type LatestShiftTeamSchedulesResponse struct {
	ShiftTeamSchedules []*logisticspb.ServiceRegionDateSchedule
	ServiceRegionID    int64
}

func (ldb *LogisticsDB) GetLatestShiftTeamSchedulesInServiceRegion(ctx context.Context, stationMarketID int64, now time.Time, includeDebug bool) (*LatestShiftTeamSchedulesResponse, error) {
	queries := ldb.queries

	serviceRegion, err := queries.GetServiceRegionForStationMarket(ctx, stationMarketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrServiceRegionMarketNotFound
		}
		return nil, fmt.Errorf("error finding service region for market id: %d: %w", stationMarketID, err)
	}

	tzLoc, err := time.LoadLocation(serviceRegion.IanaTimeZoneName)
	if err != nil {
		return nil, fmt.Errorf("error getting time zone: %w", err)
	}

	serviceRegionSettings, err := ldb.settingsService.ServiceRegionSettings(ctx, serviceRegion.ID)
	if err != nil {
		if errors.Is(err, optimizersettings.ErrServiceRegionSettingsNotFound) {
			return nil, ErrServiceRegionSettingsNotFound
		}
		return nil, err
	}

	schedule, err := queries.GetLatestOpenHoursScheduleForServiceRegion(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionParams{
		ServiceRegionID: serviceRegion.ID,
		BeforeCreatedAt: now,
	})
	if err != nil {
		return nil, err
	}

	nowTZ := now.In(tzLoc)
	startDate := TimestampFromDateTimeLoc(nowTZ, time.Time{}, tzLoc)
	var schedules []*logisticspb.ServiceRegionDateSchedule
	missingShiftTeamParams := make([]logisticssql.GetShiftTeamsIDsInRegionSinceParams, serviceRegionSettings.OptimizeHorizonDays)
	missingCareRequestParams := make([]logisticssql.GetCareRequestIDsSinceParams, serviceRegionSettings.OptimizeHorizonDays)
	for i := 0; i < int(serviceRegionSettings.OptimizeHorizonDays); i++ {
		serviceDate := startDate.AddDate(0, 0, i)
		openHoursTW := openHoursForWeekday(schedule, serviceDate.Weekday())
		if openHoursTW == nil {
			continue
		}
		startTimestamp := TimestampFromDateTimeLoc(serviceDate, openHoursTW.StartTime, tzLoc)
		endTimestamp := TimestampFromDateTimeLoc(serviceDate, openHoursTW.EndTime, tzLoc)
		validStartTimestampSec := sqltypes.ToValidNullInt64(startTimestamp.Unix())
		validEndTimestampSec := sqltypes.ToValidNullInt64(endTimestamp.Unix())

		scheduleInfo, err := queries.GetLatestScheduleInfoForServiceRegionDate(
			ctx,
			logisticssql.GetLatestScheduleInfoForServiceRegionDateParams{
				ServiceRegionID:  serviceRegion.ID,
				ServiceDate:      serviceDate,
				OptimizerRunType: string(ServiceRegionScheduleRunType),
				CreatedBefore:    now,
			})
		if errors.Is(err, pgx.ErrNoRows) {
			missingShiftTeamParams[i] = logisticssql.GetShiftTeamsIDsInRegionSinceParams{
				ServiceRegionID:    serviceRegion.ID,
				StartTimestampSec:  startTimestamp.Unix(),
				EndTimestampSec:    endTimestamp.Unix(),
				SinceSnapshotTime:  startDate,
				LatestSnapshotTime: now,
			}
			missingCareRequestParams[i] = logisticssql.GetCareRequestIDsSinceParams{
				ServiceRegionID:    serviceRegion.ID,
				StartTimestampSec:  validStartTimestampSec,
				EndTimestampSec:    validEndTimestampSec,
				SinceSnapshotTime:  startDate,
				LatestSnapshotTime: now,
			}
			schedules = append(schedules, &logisticspb.ServiceRegionDateSchedule{ServiceDate: TimeToProtoDate(&serviceDate), PendingUpdates: &logisticspb.SchedulePendingUpdates{}})
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("error getting schedule: %w", err)
		}
		missingShiftTeamParams[i] = logisticssql.GetShiftTeamsIDsInRegionSinceParams{
			ServiceRegionID:    serviceRegion.ID,
			StartTimestampSec:  startTimestamp.Unix(),
			EndTimestampSec:    endTimestamp.Unix(),
			SinceSnapshotTime:  scheduleInfo.SnapshotTimestamp,
			LatestSnapshotTime: now,
		}
		missingCareRequestParams[i] = logisticssql.GetCareRequestIDsSinceParams{
			ServiceRegionID:    serviceRegion.ID,
			StartTimestampSec:  validStartTimestampSec,
			EndTimestampSec:    validEndTimestampSec,
			SinceSnapshotTime:  scheduleInfo.SnapshotTimestamp,
			LatestSnapshotTime: now,
		}

		scheduleForDate, err := ldb.GetShiftTeamsSchedulesFromScheduleID(ctx, scheduleInfo.ScheduleID, now, includeDebug)
		if err != nil {
			return nil, err
		}

		scheduleForDate.Schedule.ServiceDate = TimeToProtoDate(&serviceDate)

		schedules = append(schedules, scheduleForDate.Schedule)
	}

	missingSchedulesByDateOffset, err := ldb.GetMissingScheduleInfoByServiceDates(ctx, GetMissingScheduleInfoByServiceDatesParams{
		ShiftTeamParams:   missingShiftTeamParams,
		CareRequestParams: missingCareRequestParams,
	})
	if err != nil {
		return nil, err
	}

	for i, schedule := range schedules {
		schedule.PendingUpdates.ShiftTeams = missingSchedulesByDateOffset[i].ShiftTeams
		schedule.PendingUpdates.Visits = missingSchedulesByDateOffset[i].CareRequests
	}

	return &LatestShiftTeamSchedulesResponse{
		ShiftTeamSchedules: schedules,
		ServiceRegionID:    serviceRegion.ID,
	}, nil
}

type MissingScheduleInfo struct {
	ShiftTeams   []*logisticspb.PendingShiftTeamUpdate
	CareRequests []*logisticspb.PendingVisitUpdate
}

type GetMissingScheduleInfoByServiceDatesParams struct {
	ShiftTeamParams   []logisticssql.GetShiftTeamsIDsInRegionSinceParams
	CareRequestParams []logisticssql.GetCareRequestIDsSinceParams
}

func (ldb *LogisticsDB) GetMissingScheduleInfoByServiceDates(
	ctx context.Context, params GetMissingScheduleInfoByServiceDatesParams) (map[int]MissingScheduleInfo, error) {
	queries := ldb.queries

	nonScheduledShiftTeamIDsBatch := queries.GetShiftTeamsIDsInRegionSince(ctx, params.ShiftTeamParams)
	nonScheduledVisitIDsBatch := queries.GetCareRequestIDsSince(ctx, params.CareRequestParams)
	defer nonScheduledShiftTeamIDsBatch.Close()
	defer nonScheduledVisitIDsBatch.Close()

	missingSchedulesInfo := make(map[int]MissingScheduleInfo)
	var errMessages []string
	nonScheduledShiftTeamIDsBatch.Query(func(i int, shiftTeamIDs []int64, err error) {
		if err != nil {
			errMessages = append(errMessages, err.Error())
			return
		}
		pendingShiftTeamUpdates := make([]*logisticspb.PendingShiftTeamUpdate, len(shiftTeamIDs))
		for j, ID := range shiftTeamIDs {
			pendingShiftTeamUpdates[j] = &logisticspb.PendingShiftTeamUpdate{
				ShiftTeamId: ID,
			}
		}
		missingSchedulesInfo[i] = MissingScheduleInfo{ShiftTeams: pendingShiftTeamUpdates, CareRequests: missingSchedulesInfo[i].CareRequests}
	})
	if len(errMessages) > 0 {
		errMsg := strings.Join(errMessages, ",")
		return nil, errors.New("Errors trying to get non scheduled shift teams: " + errMsg)
	}

	nonScheduledVisitIDsBatch.Query(func(i int, careRequestIDs []int64, err error) {
		if err != nil {
			errMessages = append(errMessages, err.Error())
			return
		}

		pendingCareRequestUpdates := make([]*logisticspb.PendingVisitUpdate, len(careRequestIDs))
		for j, ID := range careRequestIDs {
			pendingCareRequestUpdates[j] = &logisticspb.PendingVisitUpdate{
				CareRequestId: ID,
			}
		}

		missingSchedulesInfo[i] = MissingScheduleInfo{ShiftTeams: missingSchedulesInfo[i].ShiftTeams, CareRequests: pendingCareRequestUpdates}
	})
	if len(errMessages) > 0 {
		errMsg := strings.Join(errMessages, ",")
		return nil, errors.New("Errors trying to get non scheduled visits: " + errMsg)
	}

	return missingSchedulesInfo, nil
}

func (ldb *LogisticsDB) GetLatestVisitSnapshot(ctx context.Context, careRequestID int64, before time.Time) (*logisticssql.VisitSnapshot, error) {
	return ldb.queries.GetLatestVisitSnapshot(ctx, logisticssql.GetLatestVisitSnapshotParams{
		CareRequestID: careRequestID,
		CreatedAt:     before,
	})
}

type DeleteVisitSnapshotForCareRequestIDResponse struct {
	ServiceRegionID int64
}

func (ldb *LogisticsDB) DeleteVisitSnapshotForCareRequestID(ctx context.Context, careRequestID int64) (*DeleteVisitSnapshotForCareRequestIDResponse, error) {
	snapshot, err := ldb.queries.DeleteVisitSnapshotForCareRequestID(ctx, careRequestID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnknownCareRequest
		}
		return nil, err
	}
	return &DeleteVisitSnapshotForCareRequestIDResponse{ServiceRegionID: snapshot.ServiceRegionID}, nil
}

type HasNewScheduleParams struct {
	ServiceRegionID    int64
	ServiceDate        time.Time
	LatestSnapShotTime time.Time
}

func (ldb *LogisticsDB) HasAnyNewScheduleSinceLastAvailabilityRun(ctx context.Context, params HasNewScheduleParams) (bool, error) {
	schedule, err := ldb.queries.GetLatestScheduleInfoForServiceRegionDate(ctx,
		logisticssql.GetLatestScheduleInfoForServiceRegionDateParams{
			ServiceRegionID:  params.ServiceRegionID,
			ServiceDate:      params.ServiceDate,
			OptimizerRunType: string(ServiceRegionScheduleRunType),
			CreatedBefore:    params.LatestSnapShotTime,
		})
	if err != nil {
		if errors.Is(pgx.ErrNoRows, err) {
			return false, nil
		}
		return false, err
	}

	availabilitySchedule, err := ldb.queries.GetLatestScheduleInfoForServiceRegionDate(ctx,
		logisticssql.GetLatestScheduleInfoForServiceRegionDateParams{
			ServiceRegionID:  params.ServiceRegionID,
			ServiceDate:      params.ServiceDate,
			OptimizerRunType: string(ServiceRegionAvailabilityRunType),
			CreatedBefore:    params.LatestSnapShotTime,
		})
	if err != nil && !errors.Is(pgx.ErrNoRows, err) {
		return false, err
	}

	return schedule.SnapshotTimestamp.After(availabilitySchedule.SnapshotTimestamp), nil
}

// HasNewInfoParams are parameters used to checking for new information for optimizer runs.
type HasNewInfoParams struct {
	// Service region ID.
	ServiceRegionID int64

	// Service date.
	ServiceDate time.Time

	// Validity of distance data, in seconds.
	DistanceValiditySec int64

	// Latest timestamp to consider for new information.
	LatestTimestamp time.Time
}

type NewRegionInfo struct {
	HasNewInfo bool
	LastRun    *logisticssql.OptimizerRun
	TZ         *time.Location
}

func (ldb *LogisticsDB) HasAnyNewInfoInRegionDateSinceLastRun(ctx context.Context, params HasNewInfoParams) (*NewRegionInfo, error) {
	var sinceSnapshotTime time.Time
	run, err := ldb.queries.GetLatestOptimizerRunForRegionDate(ctx, logisticssql.GetLatestOptimizerRunForRegionDateParams{
		ServiceRegionID: params.ServiceRegionID,
		ServiceDate:     params.ServiceDate,
		CreatedBefore:   params.LatestTimestamp,
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		run = nil
	} else {
		sinceSnapshotTime = run.SnapshotTimestamp
	}

	openHoursTW, _, err := ldb.GetServiceRegionOpenHoursForDate(ctx, GetServiceRegionOpenHoursForDateParams{
		ServiceRegionID: params.ServiceRegionID,
		Date:            params.ServiceDate,
		SnapshotTime:    params.LatestTimestamp,
	})
	if err != nil {
		return nil, err
	}

	if run != nil {
		distanceInfoTooOld := run.EarliestDistanceTimestamp.Before(params.LatestTimestamp.Add(time.Duration(-params.DistanceValiditySec) * time.Second))
		if distanceInfoTooOld {
			return &NewRegionInfo{HasNewInfo: true, LastRun: run, TZ: openHoursTW.Start.Location()}, nil
		}
	}

	hasNewInfo, err := ldb.HasAnyNewInfoInRegionSince(ctx, NewInfoParams{
		ServiceRegionID: params.ServiceRegionID,
		TimeWindow: TimeWindow{
			Start: openHoursTW.Start,
			End:   openHoursTW.End,
		},
		SinceSnapshotTime:  sinceSnapshotTime,
		LatestSnapshotTime: params.LatestTimestamp,
	})
	if err != nil {
		return nil, err
	}

	return &NewRegionInfo{HasNewInfo: hasNewInfo, LastRun: run, TZ: openHoursTW.Start.Location()}, nil
}

func unnestConfigIDs(configs []*logisticssql.OptimizerConfig) []int64 {
	if configs == nil {
		return nil
	}
	res := make([]int64, len(configs))
	for i, c := range configs {
		res[i] = c.ID
	}
	return res
}

func (ldb *LogisticsDB) GetOptimizerConfigsByIDs(ctx context.Context, configIDs []int64) (map[int64]*logisticssql.OptimizerConfig, error) {
	configs, err := ldb.queries.GetOptimizerConfigsByIDs(ctx, configIDs)
	if err != nil {
		return nil, err
	}
	if len(configs) != len(configIDs) {
		return nil, fmt.Errorf("not enough configs: %v vs %v", unnestConfigIDs(configs), configIDs)
	}

	configMap := make(map[int64]*logisticssql.OptimizerConfig)
	for _, config := range configs {
		configMap[config.ID] = config
	}

	return configMap, nil
}

func (ldb *LogisticsDB) GetServiceRegionByID(ctx context.Context, serviceRegionID int64) (*logisticssql.ServiceRegion, error) {
	return ldb.queries.GetServiceRegionByID(ctx, serviceRegionID)
}

func (ldb *LogisticsDB) AddOptimizerRun(
	ctx context.Context,
	params logisticssql.AddOptimizerRunParams,
	config *optimizerpb.VRPConstraintConfig,
	settings *optimizersettings.Settings,
) (*logisticssql.OptimizerRun, error) {
	q := ldb.queries
	cc, err := UpsertConstraintConfig(ctx, q, config)
	if err != nil {
		return nil, err
	}
	os, err := UpsertOptimizerSettings(ctx, q, settings)
	if err != nil {
		return nil, err
	}

	paramsCopy := params
	paramsCopy.OptimizerConstraintConfigID = sqltypes.ToValidNullInt64(cc.ID)
	paramsCopy.OptimizerSettingsID = sqltypes.ToValidNullInt64(os.ID)

	return ldb.queries.AddOptimizerRun(ctx, paramsCopy)
}

func visitIDsFromUnassignedVisits(unassignedVisits []*optimizerpb.VRPUnassignedVisit, idMap AvailabilityVisitIDMap) ([]int64, []int64) {
	if len(unassignedVisits) == 0 {
		return nil, nil
	}
	visitIDs := make([]int64, 0, len(unassignedVisits))
	availVisitIDs := make([]int64, 0, len(unassignedVisits))
	for _, uv := range unassignedVisits {
		vid := uv.GetVisitId()
		aVID, ok := idMap[vid]
		if ok {
			availVisitIDs = append(availVisitIDs, aVID)
			continue
		}
		visitIDs = append(visitIDs, vid)
	}
	return visitIDs, availVisitIDs
}

type addUnassignedVisitsParams struct {
	scheduleID             int64
	unassignedVisits       []*optimizerpb.VRPUnassignedVisit
	availabilityVisitIDMap AvailabilityVisitIDMap
}

func addUnassignedVisits(ctx context.Context, queries *logisticssql.Queries, params addUnassignedVisitsParams) error {
	unassigned := params.unassignedVisits
	scheduleID := params.scheduleID
	visitIDs, availVisitIDs := visitIDsFromUnassignedVisits(unassigned, params.availabilityVisitIDMap)
	if len(availVisitIDs) > 0 {
		_, err := queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
			ScheduleID:                        scheduleID,
			ServiceRegionAvailabilityVisitIds: availVisitIDs,
		})
		if err != nil {
			return err
		}
	}
	_, err := queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
		ScheduleID:       scheduleID,
		VisitSnapshotIds: visitIDs,
	})
	if err != nil {
		return err
	}
	return nil
}

type AvailabilityVisitIDMap map[int64]int64
type WriteScheduleForVRPSolutionParams struct {
	ServiceRegionID  int64
	OptimizerRunID   int64
	OptimizerVersion string
	Solution         *optimizerpb.VRPSolution

	AvailabilityVisitIDMap       AvailabilityVisitIDMap
	LastScheduleUnassignedVisits []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
}

func (ldb *LogisticsDB) WriteScheduleForVRPSolution(
	ctx context.Context,
	params *WriteScheduleForVRPSolutionParams,
) (*logisticssql.Schedule, error) {
	var schedule *logisticssql.Schedule
	var addVisitStopsParams logisticssql.AddScheduleVisitStopsParams
	var addRestBreakStopsParams logisticssql.AddScheduleRestBreakStopsParams

	solution := params.Solution
	err := ldb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := ldb.queries.WithTx(tx)
		var err error
		optimizerRunID := params.OptimizerRunID
		schedule, err = queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
			ServiceRegionID:       params.ServiceRegionID,
			OptimizerRunID:        optimizerRunID,
			HardScore:             solution.GetScore().GetHardScore(),
			UnassignedVisitsScore: solution.GetScore().GetUnassignedVisitsScore(),
			SoftScore:             solution.GetScore().GetSoftScore(),
			OptimizerVersion:      params.OptimizerVersion,
		})
		if err != nil {
			return err
		}

		var debugExplanation string
		if solution.GetScore() != nil {
			debugExplanation = solution.GetScore().GetDebugExplanation()
		}

		availabilityVisitIDMap := params.AvailabilityVisitIDMap
		if availabilityVisitIDMap == nil {
			availabilityVisitIDMap = make(AvailabilityVisitIDMap)
		}
		unassignedVisits := solution.GetDescription().GetUnassignedVisits()
		unassignedVisitsDiff := unassignedVisitsDifferenceForResult(params.LastScheduleUnassignedVisits, unassignedVisits, availabilityVisitIDMap)
		_, err = queries.AddScheduleDiagnostics(ctx, logisticssql.AddScheduleDiagnosticsParams{
			ScheduleID:           schedule.ID,
			DebugExplanation:     sqltypes.ToNullString(&debugExplanation),
			UnassignedVisitsDiff: sqltypes.ToNullInt64(unassignedVisitsDiff),
		})
		// We don't fail writing a schedule for this non-critical data failure.
		if err != nil {
			ldb.scope.WritePoint("error_writing_schedule_diagnostics", nil, monitoring.Fields{"schedule_id": schedule.ID, "error": err})
		}

		if len(unassignedVisits) > 0 {
			err := addUnassignedVisits(ctx, queries, addUnassignedVisitsParams{
				scheduleID:             schedule.ID,
				unassignedVisits:       unassignedVisits,
				availabilityVisitIDMap: availabilityVisitIDMap,
			})
			if err != nil {
				return err
			}
		}

		shiftTeams := solution.Description.ShiftTeams
		var scheduleIDs, shiftTeamSnapshotIDs, depotArrivalTimestampsSec []int64
		for _, shiftTeam := range shiftTeams {
			scheduleIDs = append(scheduleIDs, schedule.ID)
			shiftTeamSnapshotIDs = append(shiftTeamSnapshotIDs, *shiftTeam.Id)
			depotArrivalTimestampsSec = append(depotArrivalTimestampsSec, shiftTeam.GetRoute().GetDepotArrivalTimestampSec())
		}
		routes, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
			ScheduleIds:               scheduleIDs,
			ShiftTeamSnapshotIds:      shiftTeamSnapshotIDs,
			DepotArrivalTimestampsSec: depotArrivalTimestampsSec,
		})
		if err != nil {
			return err
		}

		shiftRouteIDs := map[int64]int64{}
		for _, route := range routes {
			shiftRouteIDs[route.ShiftTeamSnapshotID] = route.ID
		}

		for _, shiftTeam := range shiftTeams {
			routeID := shiftRouteIDs[*shiftTeam.Id]
			for i, stop := range shiftTeam.Route.GetStops() {
				// Note: we don't serialize the actuals to the DB for stops,
				// as those are sourced from the snapshot data directly.
				switch stop.GetStop().(type) {
				case *optimizerpb.VRPShiftTeamRouteStop_Visit:
					visit := stop.GetVisit()
					scheduleVisit, err := addScheduleVisit(ctx, queries, addScheduleVisitParams{
						scheduleID:             schedule.ID,
						routeID:                routeID,
						visit:                  visit,
						availabilityVisitIDMap: availabilityVisitIDMap,
					})
					if err != nil {
						return err
					}

					addVisitStopsParams.ScheduleIds = append(addVisitStopsParams.ScheduleIds, schedule.ID)
					addVisitStopsParams.ScheduleRouteIds = append(addVisitStopsParams.ScheduleRouteIds, routeID)
					addVisitStopsParams.RouteIndexes = append(addVisitStopsParams.RouteIndexes, int32(i+1))
					addVisitStopsParams.ScheduleVisitIds = append(addVisitStopsParams.ScheduleVisitIds, scheduleVisit.ID)

				case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
					restBreak := stop.GetRestBreak()
					scheduleRestBreak, err := queries.AddScheduleRestBreak(ctx, logisticssql.AddScheduleRestBreakParams{
						ScheduleID:              schedule.ID,
						ScheduleRouteID:         routeID,
						ShiftTeamBreakRequestID: restBreak.GetRestBreakId(),
					})
					if err != nil {
						return err
					}
					addRestBreakStopsParams.ScheduleIds = append(addRestBreakStopsParams.ScheduleIds, schedule.ID)
					addRestBreakStopsParams.ScheduleRouteIds = append(addRestBreakStopsParams.ScheduleRouteIds, routeID)
					addRestBreakStopsParams.RouteIndexes = append(addRestBreakStopsParams.RouteIndexes, int32(i+1))
					addRestBreakStopsParams.ScheduleRestBreakIds = append(addRestBreakStopsParams.ScheduleRestBreakIds, scheduleRestBreak.ID)

				default:
					return fmt.Errorf("unhandled route stop type(%T) for optimizer_run_id=%d vrp_shift_team_id=%d", stop.GetStop(), optimizerRunID, shiftTeam.GetId())
				}
			}
		}

		if len(addVisitStopsParams.ScheduleRouteIds) != 0 {
			_, err := queries.AddScheduleVisitStops(ctx, addVisitStopsParams)
			if err != nil {
				return err
			}
		}
		if len(addRestBreakStopsParams.ScheduleRouteIds) != 0 {
			_, err := queries.AddScheduleRestBreakStops(ctx, addRestBreakStopsParams)
			if err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if err := ldb.WriteScheduleStats(ctx, schedule.ID, solution.GetTotalStats()); err != nil {
		return nil, err
	}

	return schedule, nil
}

func (ldb *LogisticsDB) WriteScheduleStats(ctx context.Context, scheduleID int64, stats *optimizerpb.VRPStats) error {
	if stats == nil {
		return nil
	}

	_, err := ldb.queries.AddScheduleStats(ctx, logisticssql.AddScheduleStatsParams{
		ScheduleID:          scheduleID,
		DriveDurationSec:    sqltypes.ToNullInt64(stats.DriveDurationSec),
		DriveDistanceMeters: sqltypes.ToNullInt64(stats.DriveDistanceMeters),
		ServiceDurationSec:  sqltypes.ToNullInt64(stats.ServiceDurationSec),
	})

	return err
}

func (ldb *LogisticsDB) GetVRPSolutionFromScheduleID(ctx context.Context, id int64, latestTimestamp time.Time, devOnly bool) (*optimizerpb.VRPSolution, error) {
	queries := ldb.queries

	schedule, err := queries.GetSchedule(ctx, id)
	if err != nil {
		return nil, err
	}

	shiftTeams, err := ldb.GetVRPShiftTeamsFromScheduleID(ctx, schedule.ID, latestTimestamp)
	if err != nil {
		return nil, err
	}

	unassignedVisits, err := ldb.GetUnassignedScheduleVisitsForScheduleID(ctx, schedule.ID, latestTimestamp)
	if err != nil {
		return nil, err
	}

	optimizerRun, err := ldb.queries.GetOptimizerRun(ctx, schedule.OptimizerRunID)
	if err != nil {
		return nil, err
	}

	vrpData, err := ldb.GetServiceRegionVRPData(ctx, &ServiceRegionVRPDataParams{
		ServiceRegionID: schedule.ServiceRegionID,
		ServiceDate:     optimizerRun.ServiceDate,
		SnapshotTime:    optimizerRun.CreatedAt,
	})
	if err != nil {
		return nil, err
	}

	vrp, _, err := ldb.vrpProblemForOptimizerRun(ctx, optimizerRun, vrpData)
	if err != nil && !devOnly {
		return nil, err
	}
	var incomingDescription *optimizerpb.VRPDescription
	if vrp != nil {
		incomingDescription = vrp.VRPProblem.GetDescription()
	}

	stats, err := ldb.queries.GetScheduleStats(ctx, schedule.ID)
	if err != nil {
		return nil, err
	}

	scheduleDiagnostic, err := ldb.queries.GetDiagnosticsForSchedule(ctx, schedule.ID)
	if err != nil {
		return nil, err
	}

	return buildVRPSolution(schedule, shiftTeams, unassignedVisits, incomingDescription, stats, scheduleDiagnostic), nil
}

type addScheduleVisitParams struct {
	scheduleID int64
	routeID    int64

	visit                  *optimizerpb.VRPShiftTeamVisit
	availabilityVisitIDMap AvailabilityVisitIDMap
}

func addScheduleVisit(
	ctx context.Context,
	queries *logisticssql.Queries,
	params addScheduleVisitParams,
) (*logisticssql.ScheduleVisit, error) {
	visit := params.visit
	vid := visit.GetVisitId()

	queryParams := logisticssql.AddScheduleVisitParams{
		ScheduleID:          params.scheduleID,
		ScheduleRouteID:     params.routeID,
		VisitSnapshotID:     sqltypes.ToValidNullInt64(vid),
		ArrivalTimestampSec: visit.GetArrivalTimestampSec(),
	}

	aVID, ok := params.availabilityVisitIDMap[vid]
	if ok {
		queryParams.VisitSnapshotID = sqltypes.ToNullInt64(nil)
		queryParams.ServiceRegionAvailabilityVisitID = sqltypes.ToValidNullInt64(aVID)
	}

	scheduleVisit, err := queries.AddScheduleVisit(ctx, queryParams)
	if err != nil {
		return nil, err
	}

	return scheduleVisit, err
}

func unassignedVisitsDifferenceForResult(
	baseScheduleUnassignedVisits []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow,
	resultUnassignedVisits []*optimizerpb.VRPUnassignedVisit,
	availabilityVisitIDMap AvailabilityVisitIDMap,
) *int64 {
	if len(availabilityVisitIDMap) == 0 {
		return nil
	}

	var unassignedVisits []*optimizerpb.VRPUnassignedVisit
	for _, visit := range resultUnassignedVisits {
		_, ok := availabilityVisitIDMap[visit.GetVisitId()]
		if ok {
			continue
		}

		unassignedVisits = append(unassignedVisits, visit)
	}

	unassignedVisitsDiff := int64(len(unassignedVisits) - len(baseScheduleUnassignedVisits))
	return &unassignedVisitsDiff
}

func (ldb *LogisticsDB) GetCheckFeasibilityCareRequestHistory(ctx context.Context, id int64) ([]*logisticspb.CheckFeasibilityCareRequestDiagnostic, error) {
	queries := ldb.queries

	checkFeasbilityQueries, err := ldb.GetCheckFeasibilityQueriesForCareRequest(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("error in GetCheckFeasibilityQueriesForCareRequest: %w", err)
	}

	var res []*logisticspb.CheckFeasibilityCareRequestDiagnostic
	for i, checkFeasibilityQuery := range checkFeasbilityQueries {
		cfQuery := checkFeasibilityQuery.CheckFeasibilityQuery
		if !cfQuery.OptimizerRunID.Valid || cfQuery.OptimizerRunID.Int64 == 0 {
			continue
		}

		optimizerRun, err := queries.GetOptimizerRun(ctx, cfQuery.OptimizerRunID.Int64)
		if err != nil {
			res = append(res, &logisticspb.CheckFeasibilityCareRequestDiagnostic{
				Error: proto.String(fmt.Sprintf("error in GetOptimizerRun: %s", err.Error())),
			})
			continue
		}

		feasibilityRequest, err := ldb.buildCheckFeasibilityRequest(ctx, queries, checkFeasbilityQueries[i])
		if err != nil {
			res = append(res, &logisticspb.CheckFeasibilityCareRequestDiagnostic{
				Error: proto.String(fmt.Sprintf("error in buildCheckFeasbilityRequest: %s", err.Error())),
			})
			continue
		}

		cfLocIDs := []int64{checkFeasbilityQueries[i].CheckFeasibilityQuery.LocationID.Int64}
		optimizerRunDiagnostics, err := ldb.GetOptimizerRunDiagnostics(ctx, optimizerRun.ID, feasibilityRequest, cfLocIDs)
		if err != nil {
			res = append(res, &logisticspb.CheckFeasibilityCareRequestDiagnostic{
				Error: proto.String(fmt.Sprintf("error getting optimizer run data: %s", err.Error())),
			})
			continue
		}

		diagnostic := &logisticspb.CheckFeasibilityCareRequestDiagnostic{
			Problem:   optimizerRunDiagnostics.Problem,
			CreatedAt: timestamppb.New(optimizerRun.CreatedAt),
		}
		incomingDescription := optimizerRunDiagnostics.Problem.GetDescription()
		if cfQuery.BestScheduleID.Valid && cfQuery.BestScheduleID.Int64 > 0 { //nolint:nestif
			schedule, err := queries.GetSchedule(ctx, cfQuery.BestScheduleID.Int64)
			if err != nil {
				diagnostic.Error = proto.String(fmt.Sprintf("error in GetSchedule: %s", err.Error()))
				res = append(res, diagnostic)
				continue
			}

			stats, err := ldb.queries.GetScheduleStats(ctx, cfQuery.BestScheduleID.Int64)
			if err != nil {
				diagnostic.Error = proto.String(fmt.Sprintf("error in GetScheduleStats: %s", err.Error()))
				res = append(res, diagnostic)
				continue
			}

			shiftTeams, err := ldb.GetVRPShiftTeamsFromScheduleID(ctx, schedule.ID, optimizerRun.SnapshotTimestamp)
			if err != nil {
				diagnostic.Error = proto.String(fmt.Sprintf("error in GetVRPShiftTeamsFromScheduleID: %s", err.Error()))
				res = append(res, diagnostic)
				continue
			}

			unassignedVisits, err := ldb.GetUnassignedScheduleVisitsForScheduleID(ctx, schedule.ID, optimizerRun.SnapshotTimestamp)
			if err != nil {
				diagnostic.Error = proto.String(fmt.Sprintf("error in GetUnassignedScheduleVisitsForScheduleID: %s", err.Error()))
				res = append(res, diagnostic)
				continue
			}

			scheduleDiagnostic, err := queries.GetDiagnosticsForSchedule(ctx, schedule.ID)
			// we need to handle queries that were serialized before we started writing schedule diagnostics!
			// So we allow the ErrNoRows known error.
			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
				diagnostic.Error = proto.String(fmt.Sprintf("error in GetDiagnosticsForSchedule: %s", err.Error()))
				res = append(res, diagnostic)
				continue
			}

			diagnostic.Solution = buildVRPSolution(schedule, shiftTeams, unassignedVisits, incomingDescription, stats, scheduleDiagnostic)
		}
		res = append(res, diagnostic)
	}

	return res, nil
}

func (ldb *LogisticsDB) buildCheckFeasibilityRequest(ctx context.Context, queries *logisticssql.Queries, feasibilityQuery *CheckFeasibilityQueryData) (*logisticspb.CheckFeasibilityRequest, error) {
	visitAttrs := feasibilityQuery.Attributes
	var snapshotRequiredAttrs []*commonpb.Attribute
	var snapshotPreferredAttrs []*commonpb.Attribute
	var snapshotForbiddenAttrs []*commonpb.Attribute
	var snapshotUnwantedAttrs []*commonpb.Attribute
	for _, attr := range visitAttrs {
		if attr.IsRequired {
			snapshotRequiredAttrs = append(snapshotRequiredAttrs, &commonpb.Attribute{Name: attr.Name})
		}
		if attr.IsPreferred {
			snapshotPreferredAttrs = append(snapshotPreferredAttrs, &commonpb.Attribute{Name: attr.Name})
		}
		if attr.IsForbidden {
			snapshotForbiddenAttrs = append(snapshotForbiddenAttrs, &commonpb.Attribute{Name: attr.Name})
		}
		if attr.IsUnwanted {
			snapshotUnwantedAttrs = append(snapshotUnwantedAttrs, &commonpb.Attribute{Name: attr.Name})
		}
	}

	locations, err := queries.GetLocationsByIDs(ctx, []int64{feasibilityQuery.CheckFeasibilityQuery.LocationID.Int64})
	if err != nil {
		return nil, fmt.Errorf(getLocationsByIDsError, err)
	}

	cfVisit := &logisticspb.CheckFeasibilityVisit{
		ServiceDurationSec: &feasibilityQuery.CheckFeasibilityQuery.ServiceDurationSec.Int64,
		Location: &commonpb.Location{
			LatitudeE6:  locations[0].LatitudeE6,
			LongitudeE6: locations[0].LongitudeE6,
		},
		RequiredAttributes:  snapshotRequiredAttrs,
		PreferredAttributes: snapshotPreferredAttrs,
		ForbiddenAttributes: snapshotForbiddenAttrs,
		UnwantedAttributes:  snapshotUnwantedAttrs,
		EntityDescriptor: &logisticspb.CheckFeasibilityVisit_CareRequestId{
			CareRequestId: feasibilityQuery.CheckFeasibilityQuery.CareRequestID.Int64,
		},
	}

	if feasibilityQuery.CheckFeasibilityQuery.ArrivalTimeWindowStartTimestampSec.Valid {
		visitStartDateTime := time.Unix(feasibilityQuery.CheckFeasibilityQuery.ArrivalTimeWindowStartTimestampSec.Int64, 0)
		visitEndDateTime := time.Unix(feasibilityQuery.CheckFeasibilityQuery.ArrivalTimeWindowEndTimestampSec.Int64, 0)
		cfVisit.ArrivalTimeSpecification = &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
			ArrivalTimeWindow: &commonpb.TimeWindow{
				StartDatetime: TimeToProtoDateTime(&visitStartDateTime),
				EndDatetime:   TimeToProtoDateTime(&visitEndDateTime),
			},
		}
	} else {
		cfVisit.ArrivalTimeSpecification = &logisticspb.CheckFeasibilityVisit_ArrivalDate{
			ArrivalDate: TimeToProtoDate(&feasibilityQuery.CheckFeasibilityQuery.ServiceDate.Time),
		}
	}

	return &logisticspb.CheckFeasibilityRequest{
		Visits: []*logisticspb.CheckFeasibilityVisit{cfVisit},
	}, nil
}

func buildVRPSolution(schedule *logisticssql.Schedule, shiftTeams []*optimizerpb.VRPShiftTeam, unassignedVisits []*optimizerpb.VRPUnassignedVisit, incomingDescription *optimizerpb.VRPDescription, stats *logisticssql.ScheduleStat, scheduleDiagnostic *logisticssql.ScheduleDiagnostic) *optimizerpb.VRPSolution {
	return &optimizerpb.VRPSolution{
		Score: &optimizerpb.VRPScore{
			HardScore:             &schedule.HardScore,
			UnassignedVisitsScore: &schedule.UnassignedVisitsScore,
			SoftScore:             &schedule.SoftScore,
			DebugExplanation:      sqltypes.ToProtoString(scheduleDiagnostic.DebugExplanation),
		},
		Description: &optimizerpb.VRPDescription{
			// Output fields, changed by the optimizer run:
			ShiftTeams:       shiftTeams,
			UnassignedVisits: unassignedVisits,
			// Input fields, unchanged by the optimizer run:
			Visits:         incomingDescription.GetVisits(),
			Locations:      incomingDescription.GetLocations(),
			RestBreaks:     incomingDescription.GetRestBreaks(),
			DistanceMatrix: incomingDescription.GetDistanceMatrix(),
		},
		TotalStats: &optimizerpb.VRPStats{
			DriveDistanceMeters: protoconv.FromNullInt64(stats.DriveDistanceMeters),
			DriveDurationSec:    protoconv.FromNullInt64(stats.DriveDurationSec),
			ServiceDurationSec:  protoconv.FromNullInt64(stats.ServiceDurationSec),
		},
	}
}

func (ldb *LogisticsDB) createServiceRegionAndMarketFromStationMarket(ctx context.Context, stationMarket *marketpb.Market) (*logisticssql.Market, error) {
	queries := ldb.queries

	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      *stationMarket.Name,
		IanaTimeZoneName: *stationMarket.IanaTimeZoneName,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating service region: %w", err)
	}

	market, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: stationMarket.Id,
		ShortName:       *stationMarket.ShortName,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating market: %w", err)
	}

	return market, nil
}

func (ldb *LogisticsDB) MarketHasNonScheduleChanges(stationMarket *marketpb.Market, existingMarket *logisticssql.Market, existingServiceRegion *logisticssql.ServiceRegion) bool {
	return *stationMarket.ShortName != existingMarket.ShortName || *stationMarket.IanaTimeZoneName != existingServiceRegion.IanaTimeZoneName || *stationMarket.Name != existingServiceRegion.Description
}

func (ldb *LogisticsDB) ensureMarket(ctx context.Context, stationMarket *marketpb.Market) (*logisticssql.Market, error) {
	market, err := ldb.queries.GetMarketByStationMarketID(ctx, stationMarket.Id)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}

		market, err = ldb.createServiceRegionAndMarketFromStationMarket(ctx, stationMarket)
		if err != nil {
			return nil, err
		}
	}
	return market, nil
}

func (ldb *LogisticsDB) UpdateOpenHoursScheduleForServiceRegion(ctx context.Context, serviceRegionID int64, scheduleDays []*commonpb.ScheduleDay) (*logisticssql.ServiceRegionOpenHoursSchedule, error) {
	schedule, err := ldb.queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegionID)
	if err != nil {
		return nil, fmt.Errorf("error creating schedule: %w", err)
	}

	var addParams logisticssql.AddServiceRegionOpenHoursScheduleDaysParams
	for _, scheduleDay := range scheduleDays {
		addParams.ServiceRegionOpenHoursScheduleIds = append(addParams.ServiceRegionOpenHoursScheduleIds, schedule.ID)
		addParams.DaysOfWeek = append(addParams.DaysOfWeek, scheduleDay.DayOfWeek)
		addParams.StartTimes = append(addParams.StartTimes, *ProtoTimeOfDayToTime(scheduleDay.OpenTime))
		addParams.EndTimes = append(addParams.EndTimes, *ProtoTimeOfDayToTime(scheduleDay.CloseTime))
	}

	_, err = ldb.queries.AddServiceRegionOpenHoursScheduleDays(ctx, addParams)
	if err != nil {
		return nil, fmt.Errorf("error creating schedule days: %w", err)
	}

	return schedule, nil
}

func (ldb *LogisticsDB) UpsertMarketAndServiceRegionFromStationMarket(ctx context.Context, stationMarket *marketpb.Market) error {
	queries := ldb.queries

	market, err := ldb.ensureMarket(ctx, stationMarket)
	if err != nil {
		return err
	}

	serviceRegion, err := queries.GetServiceRegionByID(ctx, market.ServiceRegionID)
	if err != nil {
		return err
	}

	if ldb.MarketHasNonScheduleChanges(stationMarket, market, serviceRegion) {
		if *stationMarket.Enabled {
			return errors.New("cannot update an enabled market")
		}
		_, err = ldb.createServiceRegionAndMarketFromStationMarket(ctx, stationMarket)
		if err != nil {
			return err
		}
	}

	_, err = ldb.UpdateOpenHoursScheduleForServiceRegion(ctx, serviceRegion.ID, stationMarket.ScheduleDays)
	if err != nil {
		return fmt.Errorf("error creating schedule: %w", err)
	}

	return nil
}

type CareRequestLatestInfo struct {
	VisitPhaseShortName string
	CareRequestEtaSec   int64
	ServiceRegionID     int64
	VisitLocation       *logisticssql.Location
	ShiftTeamLocation   *logisticssql.Location
}

type OptimizerRunDiagnostics struct {
	Run                *logisticssql.OptimizerRun
	RunError           *logisticssql.OptimizerRunError
	OptimizerVersion   string
	Problem            *optimizerpb.VRPProblem
	UnvalidatedProblem *optimizerpb.VRPProblem

	ConstraintConfig *optimizerpb.VRPConstraintConfig
}

type CareRequestDiagnostics struct {
	CareRequestID            *int64
	ArrivalStartTimestampSec int64
	ArrivalEndTimestampSec   int64
	ServiceDurationSec       *int64
	IsManualOverride         *bool
	ShiftTeamID              *int64
	VisitPhase               logisticspb.VisitPhase
	ArrivalTimestampSec      *int64
	VisitLocation            *logisticssql.Location
	RequiredAttributes       []*logisticssql.Attribute
	PreferredAttributes      []*logisticssql.Attribute
	ForbiddenAttributes      []*logisticssql.Attribute
	UnwantedAttributes       []*logisticssql.Attribute
}

func (ldb *LogisticsDB) AddOptimizerRunError(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error {
	_, err := ldb.queries.AddOptimizerRunError(ctx, params)
	return err
}

func (ldb *LogisticsDB) GetLatestCareRequestsDataForDiagnostics(ctx context.Context, careRequestIDs []int64, createdBefore time.Time) ([]*CareRequestDiagnostics, error) {
	queries := ldb.queries
	careRequestsDiagnosticsRows, err := queries.GetLatestCareRequestsDataForDiagnostics(ctx, logisticssql.GetLatestCareRequestsDataForDiagnosticsParams{
		CareRequestIds: careRequestIDs,
		CreatedBefore:  createdBefore,
	})
	if err != nil {
		return nil, err
	}

	var visitSnapshotIDs []int64
	for _, careRequestDiagnosticRow := range careRequestsDiagnosticsRows {
		visitSnapshotIDs = append(visitSnapshotIDs, careRequestDiagnosticRow.VisitSnapshotID)
	}
	visitAttrs, err := queries.GetAttributesForVisitSnapshots(ctx, visitSnapshotIDs)
	if err != nil {
		return nil, err
	}
	snapshotRequiredAttrs := map[int64][]*logisticssql.Attribute{}
	snapshotPreferredAttrs := map[int64][]*logisticssql.Attribute{}
	snapshotForbiddenAttrs := map[int64][]*logisticssql.Attribute{}
	snapshotUnwantedAttrs := map[int64][]*logisticssql.Attribute{}
	for _, attr := range visitAttrs {
		if attr.IsRequired {
			snapshotRequiredAttrs[attr.VisitSnapshotID] = append(snapshotRequiredAttrs[attr.VisitSnapshotID], &logisticssql.Attribute{ID: attr.ID, Name: attr.Name})
		}
		if attr.IsPreferred {
			snapshotPreferredAttrs[attr.VisitSnapshotID] = append(snapshotPreferredAttrs[attr.VisitSnapshotID], &logisticssql.Attribute{ID: attr.ID, Name: attr.Name})
		}
		if attr.IsForbidden {
			snapshotForbiddenAttrs[attr.VisitSnapshotID] = append(snapshotForbiddenAttrs[attr.VisitSnapshotID], &logisticssql.Attribute{ID: attr.ID, Name: attr.Name})
		}
		if attr.IsUnwanted.Valid && attr.IsUnwanted.Bool {
			snapshotUnwantedAttrs[attr.VisitSnapshotID] = append(snapshotUnwantedAttrs[attr.VisitSnapshotID], &logisticssql.Attribute{ID: attr.ID, Name: attr.Name})
		}
	}

	var locationIDs []int64
	uniqueLocationIDs := make(map[int64]bool)
	for _, careRequestDiagnosticRow := range careRequestsDiagnosticsRows {
		if !uniqueLocationIDs[careRequestDiagnosticRow.LocationID] {
			uniqueLocationIDs[careRequestDiagnosticRow.LocationID] = true
			locationIDs = append(locationIDs, careRequestDiagnosticRow.LocationID)
		}
	}
	locations, err := queries.GetLocationsByIDs(ctx, locationIDs)
	if err != nil {
		return nil, err
	}
	locationsMap := map[int64]*logisticssql.Location{}
	for _, loc := range locations {
		locationsMap[loc.ID] = loc
	}

	careRequestsDiagnostics := []*CareRequestDiagnostics{}
	for _, row := range careRequestsDiagnosticsRows {
		// TODO: Return ArrivalTimestamp. LOG-1838
		careRequestsDiagnostics = append(careRequestsDiagnostics, &CareRequestDiagnostics{
			CareRequestID:            &row.CareRequestID,
			ArrivalStartTimestampSec: row.ArrivalStartTimestampSec.Int64,
			ArrivalEndTimestampSec:   row.ArrivalEndTimestampSec.Int64,
			ServiceDurationSec:       &row.ServiceDurationSec,
			IsManualOverride:         &row.IsManualOverride,
			ShiftTeamID:              protoconv.FromNullInt64(row.ShiftTeamID),
			VisitPhase:               VisitPhaseShortNameToPhases[VisitPhaseShortName(row.VisitPhaseShortName)],
			VisitLocation:            locationsMap[row.LocationID],
			RequiredAttributes:       snapshotRequiredAttrs[row.VisitSnapshotID],
			PreferredAttributes:      snapshotPreferredAttrs[row.VisitSnapshotID],
			ForbiddenAttributes:      snapshotForbiddenAttrs[row.VisitSnapshotID],
			UnwantedAttributes:       snapshotUnwantedAttrs[row.VisitSnapshotID],
		})
	}
	return careRequestsDiagnostics, nil
}

func (ldb *LogisticsDB) GetOptimizerRunDiagnostics(ctx context.Context, optimizerRunID int64, feasibilityRequest *logisticspb.CheckFeasibilityRequest, cfLocIDs []int64) (*OptimizerRunDiagnostics, error) {
	optimizerRun, err := ldb.queries.GetOptimizerRun(ctx, optimizerRunID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnknownOptimizerRunID
		}
		return nil, err
	}

	var config *optimizerpb.VRPConstraintConfig
	if optimizerRun.OptimizerConstraintConfigID.Valid {
		config, err = ldb.GetConstraintConfig(ctx, optimizerRun.OptimizerConstraintConfigID.Int64)
		if err != nil {
			return nil, err
		}
	}

	optionalRunError, err := ldb.queries.GetOptimizerRunErrorForOptimizerRunID(ctx, optimizerRunID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	availabilityRunType, err := ldb.queries.GetOptimizerRunTypeByName(ctx, string(ServiceRegionAvailabilityRunType))
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	var feasibilityVisit *logisticspb.CheckFeasibilityVisit
	switch {
	case feasibilityRequest != nil && len(feasibilityRequest.Visits) > 0:
		feasibilityVisit = feasibilityRequest.Visits[0]
	case optimizerRun.OptimizerRunTypeID == availabilityRunType.ID:
		feasibilityVisit = &logisticspb.CheckFeasibilityVisit{}
	}

	vrpData, err := ldb.GetServiceRegionVRPData(ctx, &ServiceRegionVRPDataParams{
		ServiceRegionID:       optimizerRun.ServiceRegionID,
		ServiceDate:           optimizerRun.ServiceDate,
		CheckFeasibilityVisit: feasibilityVisit,
		SnapshotTime:          optimizerRun.CreatedAt,
	})
	if err != nil {
		return nil, err
	}

	problemData, unvalidatedProblem, err := ldb.vrpProblemForOptimizerRun(ctx, optimizerRun, vrpData)
	if err != nil {
		return nil, err
	}

	var optimizerVersion string
	s, err := ldb.queries.GetLatestScheduleForOptimizerRunID(ctx, optimizerRunID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if err == nil {
		optimizerVersion = s.OptimizerVersion
	}

	if feasibilityRequest != nil {
		problemData, err = ldb.AttachCheckFeasibilityRequestToProblem(problemData, feasibilityRequest.Visits, cfLocIDs)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error in AttachCheckFeasibilityRequestToProblem: %s", err)
		}
	}

	if optimizerRun.OptimizerRunTypeID == availabilityRunType.ID {
		extraSetupDuration := vrpData.Settings.VisitExtraSetupDurationSec
		vrpAvailabilityVisits, err := ldb.VRPAvailabilityVisitsForScheduleID(ctx, s.ID, extraSetupDuration, vrpData.OpenHoursTW)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting availability visits for schedule: %s", err)
		}

		problemData, err = AddAvailabilityVisitsToProblem(problemData, vrpAvailabilityVisits)
		if err != nil {
			return nil, err
		}
	}

	return &OptimizerRunDiagnostics{
		Run:                optimizerRun,
		RunError:           optionalRunError,
		OptimizerVersion:   optimizerVersion,
		Problem:            problemData.VRPProblem,
		UnvalidatedProblem: unvalidatedProblem,
		ConstraintConfig:   config,
	}, nil
}

func (ldb *LogisticsDB) VRPProblemDataForSchedule(ctx context.Context, scheduleID int64) (*VRPProblemData, error) {
	schedule, err := ldb.queries.GetSchedule(ctx, scheduleID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrScheduleNotFound
		}
		return nil, fmt.Errorf("error in GetSchedule: %w", err)
	}

	optimizerRun, err := ldb.queries.GetOptimizerRun(ctx, schedule.OptimizerRunID)
	if err != nil {
		return nil, err
	}

	vrpData, err := ldb.GetServiceRegionVRPData(ctx, &ServiceRegionVRPDataParams{
		ServiceRegionID: optimizerRun.ServiceRegionID,
		ServiceDate:     optimizerRun.ServiceDate,
		SnapshotTime:    optimizerRun.CreatedAt,
	})
	if err != nil {
		return nil, err
	}

	problemData, _, err := ldb.vrpProblemForOptimizerRun(ctx, optimizerRun, vrpData)
	if err != nil {
		return nil, fmt.Errorf("error in vrpProblemForOptimizerRun: %w", err)
	}

	return problemData, nil
}

func (ldb *LogisticsDB) vrpProblemForOptimizerRun(ctx context.Context, optimizerRun *logisticssql.OptimizerRun, vrpData *ServiceRegionVRPData) (*VRPProblemData, *optimizerpb.VRPProblem, error) {
	problemData, err := ldb.CreateVRPProblem(ctx, VRPProblemParams{
		ServiceRegionVRPData:  vrpData,
		UseDistancesAfterTime: optimizerRun.EarliestDistanceTimestamp,
		// In order to return both the validated and unvalidated versions,
		// we start by not validating the problem inside LDB.
		ValidationConfig: validation.NoValidationConfig,
	})
	if err != nil {
		if errors.Is(err, ErrEmptyVRPDescription) {
			return &VRPProblemData{
				VRPProblem: &optimizerpb.VRPProblem{Description: nil},
			}, &optimizerpb.VRPProblem{Description: nil}, nil
		}
		return nil, nil, err
	}

	validatedProblem := proto.Clone(problemData.VRPProblem).(*optimizerpb.VRPProblem)
	validationErr := validation.NewValidator(&monitoring.NoopScope{}, validation.Config{
		FailOnRecoverableError: false,
		ProblemValidators:      DefaultProblemValidators,
	}).Validate(validatedProblem)
	if validationErr != nil {
		return nil, nil, validationErr
	}
	unvalidatedProblem := problemData.VRPProblem
	problemData.VRPProblem = validatedProblem

	return problemData, unvalidatedProblem, nil
}

func (ldb *LogisticsDB) GetLatestOptimizerRunForRegionDate(ctx context.Context, params logisticssql.GetLatestOptimizerRunForRegionDateParams) (*logisticssql.OptimizerRun, error) {
	latestOptimizerRun, err := ldb.queries.GetLatestOptimizerRunForRegionDate(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNoOptimizerRunForDate
	}
	if err != nil {
		return nil, err
	}
	return latestOptimizerRun, nil
}

func (ldb *LogisticsDB) GetLatestOptimizerRunWithScheduleForRegionDate(ctx context.Context, params logisticssql.GetLatestOptimizerRunWithScheduleForRegionDateParams) (*logisticssql.GetLatestOptimizerRunWithScheduleForRegionDateRow, error) {
	latestOptimizerRun, err := ldb.queries.GetLatestOptimizerRunWithScheduleForRegionDate(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNoOptimizerRunForDate
	}
	if err != nil {
		return nil, err
	}
	return latestOptimizerRun, nil
}

func (ldb *LogisticsDB) GetLatestInfoForCareRequest(ctx context.Context, careRequestID int64, latestTimeStamp time.Time) (*CareRequestLatestInfo, error) {
	scheduleVisit, err := ldb.queries.GetLatestScheduleVisitForCareRequest(ctx, logisticssql.GetLatestScheduleVisitForCareRequestParams{
		CareRequestID: careRequestID,
		CreatedAt:     latestTimeStamp,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnknownCareRequest
		}
		return nil, fmt.Errorf("error in GetLatestScheduleVisitForCareRequest: %w", err)
	}

	locationIDs := []int64{
		scheduleVisit.LocationID,
	}
	var shiftTeamLocationID int64
	shiftTeamID := scheduleVisit.ShiftTeamID
	shiftTeamSnapshot, err := ldb.queries.GetLatestShiftTeamSnapshot(ctx, logisticssql.GetLatestShiftTeamSnapshotParams{
		ShiftTeamID: shiftTeamID,
		CreatedAt:   latestTimeStamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestShiftTeamSnapshot: %w", err)
	}
	shiftTeamLocation, err := ldb.queries.GetLatestShiftTeamLocation(ctx, logisticssql.GetLatestShiftTeamLocationParams{
		ShiftTeamSnapshotID: shiftTeamSnapshot.ID,
		CreatedAt:           latestTimeStamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetLatestShiftTeamLocation: %w", err)
	}
	locationIDs = append(locationIDs, shiftTeamLocation.LocationID)
	shiftTeamLocationID = shiftTeamLocation.LocationID

	locations, err := ldb.GetLocationsByIDs(ctx, locationIDs)
	if err != nil {
		return nil, fmt.Errorf(getLocationsByIDsError, err)
	}

	locationsMap := make(map[int64]*logisticssql.Location)
	for _, location := range locations {
		locationsMap[location.ID] = location
	}

	return &CareRequestLatestInfo{
		VisitPhaseShortName: scheduleVisit.VisitPhaseShortName,
		CareRequestEtaSec:   scheduleVisit.ArrivalTimestampSec,
		ServiceRegionID:     scheduleVisit.ServiceRegionID,
		ShiftTeamLocation:   locationsMap[shiftTeamLocationID],
		VisitLocation:       locationsMap[scheduleVisit.LocationID],
	}, nil
}

type GetAssignableShiftTeamCandidatesForDateParams struct {
	StationMarketID    int64
	Date               time.Time
	LatestSnapshotTime time.Time
}

func (ldb *LogisticsDB) GetAssignableShiftTeamCandidatesForDate(ctx context.Context, params GetAssignableShiftTeamCandidatesForDateParams) ([]*optimizerpb.AssignableShiftTeam, error) {
	market, err := ldb.queries.GetMarketByStationMarketID(ctx, params.StationMarketID)
	if err != nil {
		return nil, err
	}

	timeWindow, _, err := ldb.GetServiceRegionOpenHoursForDate(ctx, GetServiceRegionOpenHoursForDateParams{
		ServiceRegionID: market.ServiceRegionID,
		Date:            params.Date,
		SnapshotTime:    params.LatestSnapshotTime,
	})
	if err != nil {
		return nil, err
	}

	serviceRegionSettings, err := ldb.settingsService.ServiceRegionSettings(ctx, market.ServiceRegionID)
	if err != nil {
		return nil, err
	}

	sinceSnapshotTime := params.LatestSnapshotTime.Add(-serviceRegionSettings.SnapshotsLookbackDuration())
	shiftTeamsSnapshots, err := ldb.queries.GetLatestShiftTeamSnapshotsInRegion(ctx, logisticssql.GetLatestShiftTeamSnapshotsInRegionParams{
		ServiceRegionID:    market.ServiceRegionID,
		StartTimestampSec:  timeWindow.Start.Unix(),
		EndTimestampSec:    timeWindow.End.Unix(),
		LatestSnapshotTime: params.LatestSnapshotTime,
		SinceSnapshotTime:  sinceSnapshotTime,
	})
	if err != nil {
		return nil, err
	}

	if len(shiftTeamsSnapshots) == 0 {
		return nil, nil
	}

	shiftTeamsSnapshotsIDs := make([]int64, len(shiftTeamsSnapshots))
	for i, snapshot := range shiftTeamsSnapshots {
		shiftTeamsSnapshotsIDs[i] = snapshot.ID
	}

	attributes, err := ldb.queries.GetAttributesForShiftTeamSnapshots(ctx, shiftTeamsSnapshotsIDs)
	if err != nil {
		return nil, err
	}

	return optimizerAssignableShiftTeamsFromShiftTeams(shiftTeamsSnapshots, attributes), nil
}

func optimizerAssignableShiftTeamsFromShiftTeams(shiftTeamSnapshots []*logisticssql.ShiftTeamSnapshot, attributesRows []*logisticssql.GetAttributesForShiftTeamSnapshotsRow) []*optimizerpb.AssignableShiftTeam {
	shiftTeamAttrs := make(map[int64][]*optimizerpb.VRPAttribute)
	for _, attributeRow := range attributesRows {
		shiftTeamAttrs[attributeRow.ShiftTeamSnapshotID] = append(shiftTeamAttrs[attributeRow.ShiftTeamSnapshotID], &optimizerpb.VRPAttribute{Id: attributeRow.Name})
	}

	assignableShiftTeams := make([]*optimizerpb.AssignableShiftTeam, len(shiftTeamSnapshots))
	for i, shiftTeamSnapshot := range shiftTeamSnapshots {
		assignableShiftTeams[i] = &optimizerpb.AssignableShiftTeam{
			Id: proto.Int64(shiftTeamSnapshot.ShiftTeamID),
			AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(shiftTeamSnapshot.StartTimestampSec),
				EndTimestampSec:   proto.Int64(shiftTeamSnapshot.EndTimestampSec),
			},
			Attributes: shiftTeamAttrs[shiftTeamSnapshot.ID],
		}
	}

	return assignableShiftTeams
}

func (ldb *LogisticsDB) IsHealthy(ctx context.Context) bool {
	return ldb.db.Ping(ctx) == nil
}

func TimestampToDate(timestamp time.Time) time.Time {
	date := time.Date(timestamp.Year(), timestamp.Month(), timestamp.Day(), 0, 0, 0, 0, time.UTC)
	return date
}

func (ldb *LogisticsDB) GetDistanceSourceByShortName(ctx context.Context, sourceShortName string) (*logisticssql.DistanceSource, error) {
	return ldb.queries.GetDistanceSource(ctx, sql.NullString{Valid: sourceShortName != "", String: sourceShortName})
}

type CheckFeasibilityQueryAttribute struct {
	Name        string
	IsRequired  bool
	IsForbidden bool
	IsUnwanted  bool
	IsPreferred bool
}
type CheckFeasibilityQueryParams struct {
	CareRequestID                      int64
	ServiceRegionID                    int64
	LatitudeE6                         int32
	LongitudeE6                        int32
	ServiceDate                        time.Time
	ArrivalTimeWindowStartTimestampSec int64
	ArrivalTimeWindowEndTimestampSec   int64
	ServiceDurationSec                 int64
	OptimizerRunID                     int64
	BestScheduleID                     int64
	BestScheduleIsFeasible             bool
	RequiredAttributes                 []*commonpb.Attribute
	PreferredAttributes                []*commonpb.Attribute
	ForbiddenAttributes                []*commonpb.Attribute
	UnwantedAttributes                 []*commonpb.Attribute
	ResponseStatus                     string
}

type CheckFeasibilityQueryData struct {
	CheckFeasibilityQuery *logisticssql.CheckFeasibilityQuery
	Attributes            []*CheckFeasibilityQueryAttribute
}

func (ldb *LogisticsDB) AddCheckFeasibilityQuery(ctx context.Context, params CheckFeasibilityQueryParams) (*logisticssql.CheckFeasibilityQuery, error) {
	queries := ldb.queries

	var location logisticssql.Location
	if params.LatitudeE6 != 0 && params.LongitudeE6 != 0 {
		loc, err := queries.GetLocation(ctx, logisticssql.GetLocationParams{
			LatitudeE6:  params.LatitudeE6,
			LongitudeE6: params.LongitudeE6,
		})
		if err != nil {
			return nil, err
		}
		location = *loc
	}

	checkFeasibilityQuery, err := queries.AddCheckFeasibilityQuery(ctx, logisticssql.AddCheckFeasibilityQueryParams{
		CareRequestID:                      sql.NullInt64{Valid: params.CareRequestID != 0, Int64: params.CareRequestID},
		ServiceRegionID:                    sqltypes.ToNullInt64(&params.ServiceRegionID),
		LocationID:                         sql.NullInt64{Valid: location.ID != 0, Int64: location.ID},
		ServiceDate:                        sql.NullTime{Valid: true, Time: params.ServiceDate},
		ArrivalTimeWindowStartTimestampSec: sql.NullInt64{Valid: params.ArrivalTimeWindowStartTimestampSec != 0, Int64: params.ArrivalTimeWindowStartTimestampSec},
		ArrivalTimeWindowEndTimestampSec:   sql.NullInt64{Valid: params.ArrivalTimeWindowEndTimestampSec != 0, Int64: params.ArrivalTimeWindowEndTimestampSec},
		ServiceDurationSec:                 sqltypes.ToNullInt64(&params.ServiceDurationSec),
		OptimizerRunID:                     sqltypes.ToNullInt64(&params.OptimizerRunID),
		BestScheduleID:                     sqltypes.ToNullInt64(&params.BestScheduleID),
		BestScheduleIsFeasible:             sql.NullBool{Valid: true, Bool: params.BestScheduleIsFeasible},
		ResponseStatus:                     sql.NullString{Valid: true, String: params.ResponseStatus},
	})
	if err != nil {
		return nil, err
	}

	var attributeNames []string
	attributesDic := make(map[string]CheckFeasibilityQueryAttribute)

	for _, attr := range params.RequiredAttributes {
		attributeNames = append(attributeNames, attr.Name)
		attributesDic[attr.Name] = CheckFeasibilityQueryAttribute{
			Name:       attr.Name,
			IsRequired: true,
		}
	}

	for _, attr := range params.ForbiddenAttributes {
		attributeNames = append(attributeNames, attr.Name)
		attributesDic[attr.Name] = CheckFeasibilityQueryAttribute{
			Name:        attr.Name,
			IsForbidden: true,
		}
	}

	for _, attr := range params.PreferredAttributes {
		attributeNames = append(attributeNames, attr.Name)
		attributesDic[attr.Name] = CheckFeasibilityQueryAttribute{
			Name:        attr.Name,
			IsPreferred: true,
		}
	}

	for _, attr := range params.UnwantedAttributes {
		attributeNames = append(attributeNames, attr.Name)
		attributesDic[attr.Name] = CheckFeasibilityQueryAttribute{
			Name:       attr.Name,
			IsUnwanted: true,
		}
	}

	var cfqIDs []int64
	var attributeIDs []int64
	var isRequireds []bool
	var isForbiddens []bool
	var isPreferreds []bool
	var isUnwanteds []bool

	_, err = queries.UpsertAttributes(ctx, attributeNames)
	if err != nil {
		return nil, err
	}
	attrs, err := queries.GetAttributesForNames(ctx, attributeNames)
	if err != nil {
		return nil, err
	}

	for _, attr := range attrs {
		attributeDetails := attributesDic[attr.Name]

		cfqIDs = append(cfqIDs, checkFeasibilityQuery.ID)
		attributeIDs = append(attributeIDs, attr.ID)
		isRequireds = append(isRequireds, attributeDetails.IsRequired)
		isForbiddens = append(isForbiddens, attributeDetails.IsForbidden)
		isPreferreds = append(isPreferreds, attributeDetails.IsPreferred)
		isUnwanteds = append(isUnwanteds, attributeDetails.IsUnwanted)
	}

	_, err = queries.AddCheckFeasibilityQueryAttributes(ctx, logisticssql.AddCheckFeasibilityQueryAttributesParams{
		CheckFeasibilityQueryIds: cfqIDs,
		AttributeIds:             attributeIDs,
		IsRequireds:              isRequireds,
		IsForbiddens:             isForbiddens,
		IsPreferreds:             isPreferreds,
		IsUnwanteds:              isUnwanteds,
	})
	if err != nil {
		return nil, err
	}

	return checkFeasibilityQuery, nil
}

type ServiceRegionAvailabilityQueryParams struct {
	ServiceRegionID int64
	ServiceDate     time.Time

	ReferenceScheduleID int64
	FeasibilityStatus   string
}

func (ldb *LogisticsDB) AddServiceRegionAvailabilityQuery(ctx context.Context, params *ServiceRegionAvailabilityQueryParams) (*logisticssql.ServiceRegionAvailabilityQuery, error) {
	queries := ldb.queries

	serviceRegionAvailability, err := queries.AddServiceRegionAvailabilityQuery(ctx, logisticssql.AddServiceRegionAvailabilityQueryParams{
		ServiceRegionID: params.ServiceRegionID,
		ServiceDate:     params.ServiceDate,

		ReferenceScheduleID: sql.NullInt64{Valid: params.ReferenceScheduleID > 0, Int64: params.ReferenceScheduleID},
		FeasibilityStatus:   sql.NullString{Valid: true, String: params.FeasibilityStatus},
	})
	if err != nil {
		return nil, err
	}

	return serviceRegionAvailability, nil
}

func (ldb *LogisticsDB) AddServiceRegionAvailabilityQueries(
	ctx context.Context,
	params logisticssql.AddServiceRegionAvailabilityQueriesParams,
) ([]*logisticssql.ServiceRegionAvailabilityQuery, error) {
	queries := ldb.queries

	serviceRegionAvailabilities, err := queries.AddServiceRegionAvailabilityQueries(ctx, params)
	if err != nil {
		return nil, err
	}

	return serviceRegionAvailabilities, nil
}

func addServiceRegionAvailabilityQueryAttributesParams(
	queries []*logisticssql.ServiceRegionAvailabilityQuery,
	attributes []*logisticssql.Attribute,
) logisticssql.AddServiceRegionAvailabilityQueryAttributesParams {
	totalQueryAttributes := len(queries) * len(attributes)
	queryIDs := make([]int64, 0, totalQueryAttributes)
	attrIDs := make([]int64, 0, totalQueryAttributes)
	for _, q := range queries {
		for _, a := range attributes {
			queryIDs = append(queryIDs, q.ID)
			attrIDs = append(attrIDs, a.ID)
		}
	}

	return logisticssql.AddServiceRegionAvailabilityQueryAttributesParams{
		ServiceRegionAvailabilityQueryIds: queryIDs,
		AttributeIds:                      attrIDs,
	}
}

func (ldb *LogisticsDB) AddServiceRegionAvailabilityQueryAttributes(
	ctx context.Context,
	availabilityQueries []*logisticssql.ServiceRegionAvailabilityQuery,
	attributeNames []string,
) ([]*logisticssql.ServiceRegionAvailabilityQueryAttribute, error) {
	queries := ldb.queries

	attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
	if err != nil {
		return nil, fmt.Errorf("error getting attributes data for availability queries: %w", err)
	}

	params := addServiceRegionAvailabilityQueryAttributesParams(availabilityQueries, attributes)

	queriesAttributes, err := queries.AddServiceRegionAvailabilityQueryAttributes(ctx, params)
	if err != nil {
		return nil, err
	}

	return queriesAttributes, nil
}

func (ldb *LogisticsDB) GetCheckFeasibilityQueriesForCareRequest(ctx context.Context, careRequestID int64) ([]*CheckFeasibilityQueryData, error) {
	queries := ldb.queries

	checkFeasibilityQueries, err := queries.GetAllCheckFeasibilityQueriesForCareRequest(ctx, sqltypes.ToNullInt64(&careRequestID))
	if err != nil {
		return nil, err
	}

	cfqsResponse := make([]*CheckFeasibilityQueryData, len(checkFeasibilityQueries))
	for i, cfq := range checkFeasibilityQueries {
		cfqData := &CheckFeasibilityQueryData{CheckFeasibilityQuery: cfq}
		attributes, err := queries.GetAttributesForCheckFeasibilityQuery(ctx, cfq.ID)
		if err != nil {
			return nil, err
		}

		for _, attr := range attributes {
			cfqData.Attributes = append(cfqData.Attributes, &CheckFeasibilityQueryAttribute{
				Name:        attr.Name,
				IsRequired:  attr.IsRequired.Bool,
				IsForbidden: attr.IsForbidden.Bool,
				IsPreferred: attr.IsPreferred.Bool,
				IsUnwanted:  attr.IsUnwanted.Bool,
			})
		}

		cfqsResponse[i] = cfqData
	}

	return cfqsResponse, nil
}

type GetAssignableVisitsForDateParams struct {
	MarketIDs             []int64
	Date                  time.Time
	LatestSnapshotTime    time.Time
	VisitPhases           []logisticspb.VisitPhase
	VirtualAPPVisitPhases []logisticspb.VirtualAPPVisitPhase
}

func (ldb *LogisticsDB) GetAssignableVisitsForDate(ctx context.Context, params GetAssignableVisitsForDateParams) ([]*optimizerpb.AssignableVisit, error) {
	serviceRegions, err := ldb.GetServiceRegionsForStationMarkets(ctx, params.MarketIDs)
	if err != nil {
		return nil, fmt.Errorf("error in GetServiceRegionsForStationMarketIDs: %w", err)
	}

	var serviceRegionIDs []int64
	for _, serviceRegion := range serviceRegions {
		serviceRegionIDs = append(serviceRegionIDs, serviceRegion.ID)
	}

	serviceRegionOpenHourDays, err := ldb.GetMultipleServiceRegionOpenHoursForDate(ctx, GetMultipleServiceRegionOpenHoursForDateParams{
		ServiceRegionIDS: serviceRegionIDs,
		Date:             params.Date,
		SnapshotTime:     params.LatestSnapshotTime,
	})
	if err != nil {
		return nil, fmt.Errorf("error in GetServiceRegionsOpenHoursForDate: %w", err)
	}
	if len(serviceRegionOpenHourDays) == 0 {
		return nil, fmt.Errorf("no configured service region open hours for the date")
	}

	serviceRegionOpenHoursTimeWindowMap := make(map[int64]*TimeWindow, len(serviceRegionOpenHourDays))
	for _, serviceRegionOpenHourDay := range serviceRegionOpenHourDays {
		serviceRegionOpenHoursTimeWindowMap[serviceRegionOpenHourDay.ServiceRegionID] = serviceRegionOpenHourDay.TimeWindow
	}

	var visitPhaseTypeIDs []int64
	for _, visitPhase := range params.VisitPhases {
		visitPhaseTypeIDs = append(visitPhaseTypeIDs, int64(visitPhase))
	}

	var virtualAppVisitPhaseTypeIDs []int64
	for _, virtualAppVisitPhase := range params.VirtualAPPVisitPhases {
		virtualAppVisitPhaseTypeIDs = append(virtualAppVisitPhaseTypeIDs, VirtualAPPVisitPhaseTypeEnumToID[commonpb.VirtualAPPCareRequestStatus_Status(virtualAppVisitPhase)])
	}

	var batchGetLatestVisitSnapshotsInRegionParams []logisticssql.BatchGetLatestVisitSnapshotsInRegionParams
	for _, serviceRegionID := range serviceRegionIDs {
		serviceRegionSettings, err := ldb.settingsService.ServiceRegionSettings(ctx, serviceRegionID)
		if err != nil {
			return nil, fmt.Errorf("error trying to get service region settings with id %v: %w", serviceRegionID, err)
		}
		sinceSnapshotTime := params.LatestSnapshotTime.Add(-serviceRegionSettings.SnapshotsLookbackDuration())
		timeWindow := serviceRegionOpenHoursTimeWindowMap[serviceRegionID]
		batchGetLatestVisitSnapshotsInRegionParams = append(batchGetLatestVisitSnapshotsInRegionParams, logisticssql.BatchGetLatestVisitSnapshotsInRegionParams{
			ServiceRegionID:           serviceRegionID,
			StartTimestampSec:         sqltypes.ToValidNullInt64(timeWindow.Start.Unix()),
			EndTimestampSec:           sqltypes.ToValidNullInt64(timeWindow.End.Unix()),
			LatestSnapshotTime:        params.LatestSnapshotTime,
			SinceSnapshotTime:         sinceSnapshotTime,
			VisitPhaseTypes:           visitPhaseTypeIDs,
			VirtualAppVisitPhaseTypes: virtualAppVisitPhaseTypeIDs,
		})
	}

	regionsVisitSnapshots := ldb.queries.BatchGetLatestVisitSnapshotsInRegion(ctx, batchGetLatestVisitSnapshotsInRegionParams)
	defer regionsVisitSnapshots.Close()

	var allVisitSnapshots []*logisticssql.BatchGetLatestVisitSnapshotsInRegionRow
	var allVisitSnapShotIDs []int64
	var errs []error
	regionsVisitSnapshots.Query(
		func(i int, rows []*logisticssql.BatchGetLatestVisitSnapshotsInRegionRow, err error) {
			if err != nil {
				errs = append(errs, err)
				return
			}
			for _, snapshot := range rows {
				allVisitSnapshots = append(allVisitSnapshots, snapshot)
				allVisitSnapShotIDs = append(allVisitSnapShotIDs, snapshot.ID)
			}
		})

	if len(errs) > 0 {
		return nil, fmt.Errorf("errors trying to get latest visit snapshots in multiple regions: %v", errs)
	}

	visitSnapshotAttributes, err := ldb.queries.GetAttributesForVisitSnapshots(ctx, allVisitSnapShotIDs)
	if err != nil {
		return nil, fmt.Errorf("error in GetAttributesForVisitSnapshots: %w", err)
	}

	return optimizerAssignableVisitsFromVisits(allVisitSnapshots, visitSnapshotAttributes), nil
}

func optimizerAssignableVisitsFromVisits(visitSnapshots []*logisticssql.BatchGetLatestVisitSnapshotsInRegionRow, attributesRows []*logisticssql.GetAttributesForVisitSnapshotsRow) []*optimizerpb.AssignableVisit {
	visitRequiredAttrs := make(map[int64][]*optimizerpb.VRPAttribute)
	visitPreferredAttrs := make(map[int64][]*optimizerpb.VRPAttribute)
	visitUnwantedAttrs := make(map[int64][]*optimizerpb.VRPAttribute)
	visitForbiddenAttrs := make(map[int64][]*optimizerpb.VRPAttribute)
	for _, attributeRow := range attributesRows {
		visitSnapshotID := attributeRow.VisitSnapshotID
		attributeName := attributeRow.Name
		if attributeRow.IsRequired {
			visitRequiredAttrs[visitSnapshotID] = append(visitRequiredAttrs[visitSnapshotID], &optimizerpb.VRPAttribute{Id: attributeName})
		}
		if attributeRow.IsForbidden {
			visitForbiddenAttrs[visitSnapshotID] = append(visitForbiddenAttrs[visitSnapshotID], &optimizerpb.VRPAttribute{Id: attributeName})
		}
		if attributeRow.IsPreferred {
			visitPreferredAttrs[visitSnapshotID] = append(visitPreferredAttrs[visitSnapshotID], &optimizerpb.VRPAttribute{Id: attributeName})
		}
		if attributeRow.IsUnwanted.Bool {
			visitUnwantedAttrs[visitSnapshotID] = append(visitUnwantedAttrs[visitSnapshotID], &optimizerpb.VRPAttribute{Id: attributeName})
		}
	}

	assignableVisits := make([]*optimizerpb.AssignableVisit, len(visitSnapshots))
	for i, visitSnapshot := range visitSnapshots {
		assignableVisits[i] = &optimizerpb.AssignableVisit{
			Id: proto.Int64(visitSnapshot.CareRequestID),
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(visitSnapshot.ArrivalStartTimestampSec.Int64),
				EndTimestampSec:   proto.Int64(visitSnapshot.ArrivalEndTimestampSec.Int64),
			},
			RequiredAttributes:  visitRequiredAttrs[visitSnapshot.ID],
			PreferredAttributes: visitPreferredAttrs[visitSnapshot.ID],
			UnwantedAttributes:  visitUnwantedAttrs[visitSnapshot.ID],
			ForbiddenAttributes: visitForbiddenAttrs[visitSnapshot.ID],
		}
	}

	return assignableVisits
}

func (ldb *LogisticsDB) GetServiceRegionsForStationMarkets(ctx context.Context, stationMarketIDs []int64) ([]logisticssql.ServiceRegion, error) {
	serviceRegionRows, err := ldb.queries.GetServiceRegionsForStationMarkets(ctx, stationMarketIDs)
	if err != nil {
		return nil, fmt.Errorf("error getting service regions for station markets: %w", err)
	}

	marketIDSet := collections.NewLinkedInt64Set(len(serviceRegionRows))
	serviceRegionSet := collections.NewLinkedSet[logisticssql.ServiceRegion](len(serviceRegionRows))
	for _, row := range serviceRegionRows {
		marketIDSet.Add(row.StationMarketID)
		serviceRegionSet.Add(logisticssql.ServiceRegion{
			ID:               row.ID,
			Description:      row.Description,
			IanaTimeZoneName: row.IanaTimeZoneName,
			CreatedAt:        row.CreatedAt,
		})
	}

	var badMarkets []int64
	for _, marketID := range stationMarketIDs {
		if !marketIDSet.Has(marketID) {
			badMarkets = append(badMarkets, marketID)
		}
	}
	if len(badMarkets) > 0 {
		return nil, fmt.Errorf("bad markets: %v", badMarkets)
	}

	return serviceRegionSet.Elems(), nil
}

func (ldb *LogisticsDB) VisitArrivalTimestampsForSchedule(ctx context.Context, scheduleID int64) (map[int64]time.Time, error) {
	visitsArrivalTimestampSecs, err := ldb.queries.
		GetVisitsArrivalTimestampSecsForSchedule(ctx, scheduleID)
	if err != nil {
		return nil, err
	}

	arrivalTimestampByVisitID := make(map[int64]time.Time, len(visitsArrivalTimestampSecs))

	for _, visitArrivalTimestampSec := range visitsArrivalTimestampSecs {
		arrivalTimestamp := time.Unix(visitArrivalTimestampSec.ArrivalTimestampSec, 0).
			UTC()
		visitID := visitArrivalTimestampSec.VisitSnapshotID.Int64
		arrivalTimestampByVisitID[visitID] = arrivalTimestamp
	}

	return arrivalTimestampByVisitID, nil
}

type ServiceRegionAvailabilityParams struct {
	StationMarketID   int64
	ServiceDate       time.Time
	IncludeAttributes bool
	SnapshotTime      time.Time
}

type ServiceRegionAvailability struct {
	ServiceRegionID          int64
	CanonicalLocationsSetIDs []int64
	Results                  []ServiceRegionAvailabilityResult
}

type ServiceRegionAvailabilityResult struct {
	ServiceDate      time.Time
	AssignedVisits   []*logisticssql.ServiceRegionAvailabilityVisit
	UnassignedVisits []*logisticssql.ServiceRegionAvailabilityVisit

	VisitsAttributesMap VisitsAttributesMap
	ScheduleDiagnostics *logisticssql.ScheduleDiagnostic
}

func (ldb *LogisticsDB) ServiceRegionAvailability(
	ctx context.Context,
	params ServiceRegionAvailabilityParams,
) (*ServiceRegionAvailability, error) {
	serviceRegion, err := ldb.GetServiceRegionForStationMarketID(ctx, params.StationMarketID)
	if err != nil {
		return nil, err
	}

	settings, err := ldb.settingsService.ServiceRegionSettings(ctx, serviceRegion.ID)
	if err != nil {
		return nil, err
	}

	baseDate := params.ServiceDate
	availabilityResults := make([]ServiceRegionAvailabilityResult, settings.OptimizeHorizonDays)
	scheduleParams := make(
		[]logisticssql.BatchGetLatestServiceRegionAvailabilityOptimizerRunWithScheduleParams,
		settings.OptimizeHorizonDays)
	for i := 0; i < int(settings.OptimizeHorizonDays); i++ {
		serviceDate := baseDate.AddDate(0, 0, i)

		availabilityResults[i] = ServiceRegionAvailabilityResult{
			ServiceDate: serviceDate,
		}

		scheduleParams[i] = logisticssql.BatchGetLatestServiceRegionAvailabilityOptimizerRunWithScheduleParams{
			ServiceRegionID: serviceRegion.ID,
			ServiceDate:     serviceDate,
			CreatedBefore:   params.SnapshotTime,
		}
	}

	queries := ldb.queries
	withScheduleQuery := queries.BatchGetLatestServiceRegionAvailabilityOptimizerRunWithSchedule(ctx, scheduleParams)
	defer withScheduleQuery.Close()

	var errs []error
	scheduleIDs := make([]int64, settings.OptimizeHorizonDays)
	withScheduleQuery.QueryRow(
		func(i int, row *logisticssql.BatchGetLatestServiceRegionAvailabilityOptimizerRunWithScheduleRow, err error) {
			if err != nil && !errors.Is(pgx.ErrNoRows, err) {
				errs = append(errs, err)
				return
			}

			scheduleIDs[i] = row.ScheduleID
		})
	if len(errs) > 0 {
		return nil, fmt.Errorf("error getting optimizer run with schedule: %v", errs)
	}

	scheduleDiagnosticsBatch := queries.GetDiagnosticsForScheduleBatch(ctx, scheduleIDs)
	defer scheduleDiagnosticsBatch.Close()

	scheduleDiagnosticsBatch.QueryRow(func(i int, diagnostic *logisticssql.ScheduleDiagnostic, err error) {
		if err != nil && !errors.Is(pgx.ErrNoRows, err) {
			errs = append(errs, err)
			return
		}

		availabilityResults[i].ScheduleDiagnostics = diagnostic
	})

	assignedAvailabilityVisitsForScheduleIDs := queries.BatchGetAssignedAvailabilityVisitsForScheduleID(ctx, scheduleIDs)
	defer assignedAvailabilityVisitsForScheduleIDs.Close()

	assignedAvailabilityVisitsForScheduleIDs.Query(
		func(i int, visits []*logisticssql.ServiceRegionAvailabilityVisit, err error) {
			if err != nil {
				errs = append(errs, err)
				return
			}

			availabilityResults[i].AssignedVisits = visits
		})
	if len(errs) > 0 {
		return nil, fmt.Errorf("error getting assigned visits: %v", errs)
	}

	unassignedAvailabilityVisitsForScheduleIDs := queries.BatchGetUnassignedAvailabilityVisitsForScheduleID(ctx, scheduleIDs)
	defer unassignedAvailabilityVisitsForScheduleIDs.Close()

	unassignedAvailabilityVisitsForScheduleIDs.Query(
		func(i int, visits []*logisticssql.ServiceRegionAvailabilityVisit, err error) {
			if err != nil {
				errs = append(errs, err)
				return
			}

			availabilityResults[i].UnassignedVisits = visits
		})
	if len(errs) > 0 {
		return nil, fmt.Errorf("error getting unassigned visits: %v", errs)
	}

	if params.IncludeAttributes {
		availabilityResults, err = addAttributesMapToServiceRegionAvailabilityResult(ctx, queries, availabilityResults)
		if err != nil {
			return nil, err
		}
	}

	canonicalLocationSetIDs, err := ldb.canonicalLocationSetIDs(ctx, serviceRegion.ID)
	if err != nil {
		return nil, err
	}

	return &ServiceRegionAvailability{
		ServiceRegionID:          serviceRegion.ID,
		CanonicalLocationsSetIDs: canonicalLocationSetIDs,
		Results:                  availabilityResults,
	}, nil
}

func (ldb *LogisticsDB) canonicalLocationSetIDs(
	ctx context.Context,
	serviceRegionID int64,
) ([]int64, error) {
	canonicalLocations, err := ldb.GetServiceRegionCanonicalLocations(ctx, serviceRegionID)
	if err != nil {
		return nil, err
	}

	locationIDs := make([]int64, len(canonicalLocations))
	for i, location := range canonicalLocations {
		locationIDs[i] = location.ID
	}

	return locationIDs, err
}

type AttributesMap map[string]bool
type VisitsAttributesMap map[int64]AttributesMap

func addAttributesMapToServiceRegionAvailabilityResult(
	ctx context.Context,
	queries *logisticssql.Queries,
	results []ServiceRegionAvailabilityResult,
) ([]ServiceRegionAvailabilityResult, error) {
	paramsVisitIDs := make([][]int64, len(results))
	for i, result := range results {
		var visitIDs []int64
		for _, visit := range result.AssignedVisits {
			visitIDs = append(visitIDs, visit.ID)
		}
		for _, visit := range result.UnassignedVisits {
			visitIDs = append(visitIDs, visit.ID)
		}

		paramsVisitIDs[i] = visitIDs
	}

	availabilityVisitAttributesQuery := queries.BatchGetServiceRegionAvailabilityVisitAttributes(ctx, paramsVisitIDs)
	defer availabilityVisitAttributesQuery.Close()

	attributesResults := make([][]*logisticssql.BatchGetServiceRegionAvailabilityVisitAttributesRow, len(paramsVisitIDs))
	var errors []error
	availabilityVisitAttributesQuery.Query(
		func(i int, rows []*logisticssql.BatchGetServiceRegionAvailabilityVisitAttributesRow, err error) {
			if err != nil {
				errors = append(errors, err)
				return
			}
			attributesResults[i] = rows
		})
	if len(errors) > 0 {
		return nil, fmt.Errorf("error getting visits attributes: %v", errors)
	}

	for i, attributesResult := range attributesResults {
		visitsAttributesMap := make(VisitsAttributesMap)
		for _, attribute := range attributesResult {
			visitID := attribute.ServiceRegionAvailabilityVisitID.(int64)
			if visitsAttributesMap[visitID] == nil {
				visitsAttributesMap[visitID] = make(AttributesMap)
			}

			visitsAttributesMap[visitID][attribute.Name] = true
		}

		results[i].VisitsAttributesMap = visitsAttributesMap
	}

	return results, nil
}

func (ldb *LogisticsDB) GetAttributesForNames(ctx context.Context, attrNames []string) ([]*logisticssql.Attribute, error) {
	attrs, err := ldb.queries.GetAttributesForNames(ctx, attrNames)
	if err != nil {
		return nil, err
	}

	return attrs, nil
}

func (ldb *LogisticsDB) GetLatestAvailabilityVisitsInRegion(ctx context.Context, serviceRegionID int64) ([]*logisticssql.ServiceRegionAvailabilityVisit, error) {
	latestAvailabilityVisits, err := ldb.queries.GetLatestAvailabilityVisitsInRegion(ctx, serviceRegionID)
	if err != nil {
		return nil, err
	}

	return latestAvailabilityVisits, nil
}

func (ldb *LogisticsDB) GetAvailabilityAttributesByVisitID(ctx context.Context, visitIDs []int64) (map[int64][]*logisticssql.Attribute, error) {
	availVisitAttrs, err := ldb.queries.GetServiceRegionAvailabilityVisitAttributes(ctx, visitIDs)
	if err != nil {
		return nil, err
	}

	attrMapByVisitID := map[int64][]*logisticssql.Attribute{}
	for _, availVisitAttr := range availVisitAttrs {
		visitID := availVisitAttr.ServiceRegionAvailabilityVisitID.(int64)
		attrMapByVisitID[visitID] = append(attrMapByVisitID[visitID], &logisticssql.Attribute{
			ID:   availVisitAttr.ID,
			Name: availVisitAttr.Name,
		})
	}

	return attrMapByVisitID, nil
}

type AddServiceRegionAvailabilityVisitsTransactionallyParams struct {
	ServiceRegionID       int64
	OpenHoursDay          *logisticssql.ServiceRegionOpenHoursScheduleDay
	LocIDs                []int64
	AttrIDsCombinations   [][]int64
	VisitServiceDurations VisitServiceDurations
}

func (ldb *LogisticsDB) AddServiceRegionAvailabilityVisitsTransactionally(
	ctx context.Context,
	params *AddServiceRegionAvailabilityVisitsTransactionallyParams,
) ([]*logisticssql.ServiceRegionAvailabilityVisit, []*logisticssql.ServiceRegionAvailabilityVisitAttribute, error) {
	var newAvailabilityVisits []*logisticssql.ServiceRegionAvailabilityVisit
	var newAvailabilityVisitAttrs []*logisticssql.ServiceRegionAvailabilityVisitAttribute
	err := ldb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		queries := ldb.queries.WithTx(tx)

		newAvailabilitySet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, params.ServiceRegionID)
		if err != nil {
			return err
		}

		var totalAttrCombinations [][]int64
		var serviceRegionAvailabilitySetIDs []int64
		var locIDs []int64
		var startTimes []time.Time
		var endTimes []time.Time
		var serviceDurationsSec []int64
		for _, visitDuration := range params.VisitServiceDurations {
			for _, locID := range params.LocIDs {
				for _, attrIDs := range params.AttrIDsCombinations {
					serviceRegionAvailabilitySetIDs = append(serviceRegionAvailabilitySetIDs, newAvailabilitySet.ID)
					locIDs = append(locIDs, locID)
					startTimes = append(startTimes, params.OpenHoursDay.StartTime)
					endTimes = append(endTimes, params.OpenHoursDay.EndTime)
					serviceDurationsSec = append(serviceDurationsSec, int64(visitDuration.Seconds()))

					totalAttrCombinations = append(totalAttrCombinations, attrIDs)
				}
			}
		}

		newAvailabilityVisits, err = queries.AddServiceRegionAvailabilityVisits(ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
			ServiceRegionAvailabilityVisitSetIds: serviceRegionAvailabilitySetIDs,
			LocationIds:                          locIDs,
			ArrivalStartTimes:                    startTimes,
			ArrivalEndTimes:                      endTimes,
			ServiceDurationsSec:                  serviceDurationsSec,
		})
		if err != nil {
			return err
		}

		var totalVisitIDs []int64
		var totalAttrIDs []int64
		var isRequireds []bool
		var allFalse []bool
		for i, visit := range newAvailabilityVisits {
			for _, attrID := range totalAttrCombinations[i] {
				totalVisitIDs = append(totalVisitIDs, visit.ID)
				totalAttrIDs = append(totalAttrIDs, attrID)
				isRequireds = append(isRequireds, true)
				allFalse = append(allFalse, false)
			}
		}
		newAvailabilityVisitAttrs, err = queries.AddServiceRegionAvailabilityVisitAttributes(ctx, logisticssql.AddServiceRegionAvailabilityVisitAttributesParams{
			ServiceRegionAvailabilityVisitIds: totalVisitIDs,
			AttributeIds:                      totalAttrIDs,
			IsRequireds:                       isRequireds,
			IsForbiddens:                      allFalse,
			IsPreferreds:                      allFalse,
			IsUnwanteds:                       allFalse,
		})
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	return newAvailabilityVisits, newAvailabilityVisitAttrs, nil
}

package logisticsdb

// TODO: Move to proto converters package.

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/attributes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

var (
	OptimizerAssignableStatusToLogisticsAssignableStatus = map[optimizerpb.AssignableShiftTeamResult_Status]logisticspb.AssignableShiftTeamResult_Status{
		optimizerpb.AssignableShiftTeamResult_STATUS_UNSPECIFIED:         logisticspb.AssignableShiftTeamResult_STATUS_UNSPECIFIED,
		optimizerpb.AssignableShiftTeamResult_STATUS_ASSIGNABLE:          logisticspb.AssignableShiftTeamResult_STATUS_ASSIGNABLE,
		optimizerpb.AssignableShiftTeamResult_STATUS_OVERRIDE_ASSIGNABLE: logisticspb.AssignableShiftTeamResult_STATUS_OVERRIDE_ASSIGNABLE,
		optimizerpb.AssignableShiftTeamResult_STATUS_NOT_ASSIGNABLE:      logisticspb.AssignableShiftTeamResult_STATUS_NOT_ASSIGNABLE,
	}

	OptimizerTimeWindowStatusToLogisticsTimeWindowStatus = map[optimizerpb.AssignableShiftTeamResult_TimeWindowStatus]logisticspb.AssignableShiftTeamResult_TimeWindowStatus{
		optimizerpb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_UNSPECIFIED: logisticspb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_UNSPECIFIED,
		optimizerpb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_OVERLAP:     logisticspb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_OVERLAP,
		optimizerpb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_NO_OVERLAP:  logisticspb.AssignableShiftTeamResult_TIME_WINDOW_STATUS_NO_OVERLAP,
	}
)

func ProtoTimeOfDayToTime(timeOfDay *commonpb.TimeOfDay) *time.Time {
	if timeOfDay == nil {
		return nil
	}

	t := time.Date(
		0,
		0,
		0,
		int(timeOfDay.Hours),
		int(timeOfDay.Minutes),
		int(timeOfDay.Seconds),
		int(timeOfDay.Nanos),
		time.UTC)
	return &t
}

func ProtoTimeOfDayFromTime(t time.Time) *commonpb.TimeOfDay {
	return &commonpb.TimeOfDay{
		Hours:   int32(t.Hour()),
		Minutes: int32(t.Minute()),
		Seconds: int32(t.Second()),
		Nanos:   int32(t.Nanosecond()),
	}
}

func ProtoDateTimeToTime(datetime *commonpb.DateTime) (*time.Time, error) {
	timeZone, err := time.LoadLocation(datetime.GetTimeZone().GetId())
	if err != nil {
		return nil, err
	}
	t := time.Date(
		int(datetime.Year),
		time.Month(datetime.Month),
		int(datetime.Day),
		int(datetime.Hours),
		int(datetime.Minutes),
		int(datetime.Seconds),
		int(datetime.Nanos),
		timeZone)
	return &t, nil
}

func ProtoDateTimeToNullableTimestampUnixSec(datetime *commonpb.DateTime) (sql.NullInt64, error) {
	if datetime == nil {
		return sql.NullInt64{}, nil
	}
	t, err := ProtoDateTimeToTime(datetime)
	if err != nil {
		return sql.NullInt64{}, err
	}
	return sqltypes.ToValidNullInt64(t.Unix()), nil
}

func TimeToProtoDateTime(timestamp *time.Time) *commonpb.DateTime {
	if timestamp == nil {
		return nil
	}
	return &commonpb.DateTime{
		Year:    int32(timestamp.Year()),
		Month:   int32(timestamp.Month()),
		Day:     int32(timestamp.Day()),
		Hours:   int32(timestamp.Hour()),
		Minutes: int32(timestamp.Minute()),
		Seconds: int32(timestamp.Second()),
		Nanos:   int32(timestamp.Nanosecond()),
		TimeOffset: &commonpb.DateTime_TimeZone{
			TimeZone: &commonpb.TimeZone{
				Id: timestamp.Location().String(),
			},
		},
	}
}

func TimeToProtoDate(timestamp *time.Time) *commonpb.Date {
	if timestamp == nil {
		return nil
	}
	return &commonpb.Date{
		Year:  int32(timestamp.Year()),
		Month: int32(timestamp.Month()),
		Day:   int32(timestamp.Day()),
	}
}

func ProtoDateToTime(datetime *commonpb.Date) *time.Time {
	if datetime == nil {
		return nil
	}
	t := time.Date(
		int(datetime.Year),
		time.Month(datetime.Month),
		int(datetime.Day),
		0,
		0,
		0,
		0,
		time.UTC)
	return &t
}

func VRPTimeWindowFromTimeWindow(timeWindow *commonpb.TimeWindow) (*optimizerpb.VRPTimeWindow, error) {
	startTime, err := ProtoDateTimeToTime(timeWindow.StartDatetime)
	if err != nil {
		return nil, fmt.Errorf("could not parse start time: %w", err)
	}
	startTimestampSec := startTime.Unix()

	endTime, err := ProtoDateTimeToTime(timeWindow.EndDatetime)
	if err != nil {
		return nil, fmt.Errorf("could not parse end time: %w", err)
	}
	endTimestampSec := endTime.Unix()

	return &optimizerpb.VRPTimeWindow{
		StartTimestampSec: &startTimestampSec,
		EndTimestampSec:   &endTimestampSec,
	}, nil
}

func TimeWindowFromVRPTimeWindow(timeWindow *optimizerpb.VRPTimeWindow) *commonpb.TimeWindow {
	if timeWindow == nil {
		return nil
	}

	startTime := time.Unix(*timeWindow.StartTimestampSec, 0)
	endTime := time.Unix(*timeWindow.EndTimestampSec, 0)
	return &commonpb.TimeWindow{
		StartDatetime: TimeToProtoDateTime(&startTime),
		EndDatetime:   TimeToProtoDateTime(&endTime),
	}
}

func VRPAttributesFromAttributes(attributes attributes.InternalAttributes) []*optimizerpb.VRPAttribute {
	if attributes == nil {
		return nil
	}
	vrpAttributes := make([]*optimizerpb.VRPAttribute, len(attributes))
	for i, attribute := range attributes {
		vrpAttributes[i] = &optimizerpb.VRPAttribute{
			Id: attribute.Name,
		}
	}

	return vrpAttributes
}

func AttributesFromVRPAttributes(vrpAttributes []*optimizerpb.VRPAttribute) attributes.InternalAttributes {
	if vrpAttributes == nil {
		return nil
	}
	res := make(attributes.InternalAttributes, len(vrpAttributes))
	for i, attribute := range vrpAttributes {
		res[i] = &attributes.InternalAttribute{Name: attribute.Id}
	}

	return res
}

func I64ToA(v int64) string {
	return strconv.FormatInt(v, 10)
}

// rowToVisitAcuityConverter takes a row resulting from querying visit snapshots and converts it to the VisitAcuity proto message.
type rowToVisitAcuityConverter struct {
	arrivalStartTimestampSec              sql.NullInt64
	arrivalEndTimestampSec                sql.NullInt64
	visitClinicalUrgencyWindowDurationSec sql.NullInt64
	visitClinicalUrgencyLevelID           sql.NullInt64
}

func (r *rowToVisitAcuityConverter) toVisitAcuity() *logisticspb.VisitAcuity {
	if !r.visitClinicalUrgencyLevelID.Valid {
		return nil
	}
	return &logisticspb.VisitAcuity{
		ClinicalUrgencyLevel:  ClinicalUrgencyLevelIDToEnum[r.visitClinicalUrgencyLevelID.Int64],
		ClinicalUrgencyWindow: r.toClinicalUrgencyWindow(),
	}
}

func (r *rowToVisitAcuityConverter) toClinicalUrgencyWindow() *commonpb.TimeWindow {
	if !r.arrivalStartTimestampSec.Valid {
		return nil
	}

	arrivalStartTimestamp := time.Unix(r.arrivalStartTimestampSec.Int64, 0).UTC()

	if r.visitClinicalUrgencyWindowDurationSec.Valid {
		windowEndTimestamp := arrivalStartTimestamp.Add(time.Duration(r.visitClinicalUrgencyWindowDurationSec.Int64) * time.Second).UTC()
		return &commonpb.TimeWindow{
			StartDatetime: TimeToProtoDateTime(&arrivalStartTimestamp),
			// TODO(LOG-1899): consider starting from patient onboarding time to be able
			// to signal to operators that the acuity is not reflected in the patient's availability.
			EndDatetime: TimeToProtoDateTime(&windowEndTimestamp),
		}
	}

	arrivalEndTimestamp := time.Unix(r.arrivalEndTimestampSec.Int64, 0).UTC()
	return &commonpb.TimeWindow{
		StartDatetime: TimeToProtoDateTime(&arrivalStartTimestamp),
		EndDatetime:   TimeToProtoDateTime(&arrivalEndTimestamp),
	}
}

func ToCheckFeasibilityProto(req *logisticspb.UpsertVisitIfFeasibleRequest) *logisticspb.CheckFeasibilityRequest {
	return &logisticspb.CheckFeasibilityRequest{
		Visits: []*logisticspb.CheckFeasibilityVisit{
			{
				MarketId:           req.CareRequestInfo.MarketId,
				ServiceDurationSec: req.CareRequestInfo.ServiceDurationSec,
				Location:           req.CareRequestInfo.Location,
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: req.CareRequestInfo.ArrivalTimeWindow,
				},
				IsManualAdjustment:  req.CareRequestInfo.IsManualOverride,
				RequiredAttributes:  req.CareRequestInfo.RequiredAttributes,
				PreferredAttributes: req.CareRequestInfo.PreferredAttributes,
				ForbiddenAttributes: req.CareRequestInfo.ForbiddenAttributes,
				UnwantedAttributes:  req.CareRequestInfo.UnwantedAttributes,
				EntityDescriptor: &logisticspb.CheckFeasibilityVisit_CareRequestId{
					CareRequestId: req.CareRequestInfo.Id,
				},
			}},
	}
}

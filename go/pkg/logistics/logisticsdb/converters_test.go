package logisticsdb_test

import (
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/attributes"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestTimeToProtoDate(t *testing.T) {
	var nilT *time.Time

	if logisticsdb.TimeToProtoDate(nilT) != nil {
		t.Fatal("nil -> nil")
	}
	now := time.Now()
	if logisticsdb.TimeToProtoDateTime(&now) == nil {
		t.Fatal("not nil -> not nil")
	}
}

func TestProtoDateToTime(t *testing.T) {
	var nilDT *commonpb.Date

	if logisticsdb.ProtoDateToTime(nilDT) != nil {
		t.Fatal("nil -> nil")
	}
	if logisticsdb.ProtoDateToTime(&commonpb.Date{
		Year:  2020,
		Month: 3,
		Day:   1,
	}) == nil {
		t.Fatal("not nil -> not nil")
	}
}

func TestRoundtripProtoDateNil(t *testing.T) {
	var ts *time.Time
	converted := logisticsdb.TimeToProtoDateTime(ts)
	if converted != nil {
		t.Fatal("nil -> nil")
	}
}

func TestRoundtripProtoDate(t *testing.T) {
	loc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	timestamp := time.Date(2022, time.February, 7, 16, 20, 35, 4280, loc)
	datetime := logisticsdb.TimeToProtoDateTime(&timestamp)
	newTimestamp, err := logisticsdb.ProtoDateTimeToTime(datetime)
	if err != nil {
		t.Fatal(err)
	}

	if !newTimestamp.Equal(timestamp) {
		t.Fatal(err)
	}
}

func TestRoundtripProtoDateTimeToNullableTimestampUnixSec(t *testing.T) {
	null, err := logisticsdb.ProtoDateTimeToNullableTimestampUnixSec(nil)
	if err != nil {
		t.Fatal(err)
	}
	if null.Valid {
		t.Fatal("nil -> Null SQL time")
	}

	loc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	// we don't have nano precision with ProtoDateTimeToNullableTimestampUnixSec.
	timestamp := time.Date(2022, time.February, 7, 16, 20, 35, 0, loc)
	datetime := logisticsdb.TimeToProtoDateTime(&timestamp)
	newTimestampSec, err := logisticsdb.ProtoDateTimeToNullableTimestampUnixSec(datetime)
	if err != nil {
		t.Fatal(err)
	}

	if !time.Unix(newTimestampSec.Int64, 0).In(loc).Equal(timestamp) {
		t.Fatal(time.Unix(newTimestampSec.Int64, 0).In(loc), timestamp)
	}
}

func TestOptimizerAssignableStatusToLogisticsAssignableStatus(t *testing.T) {
	mapLen := len(logisticsdb.OptimizerAssignableStatusToLogisticsAssignableStatus)
	optimizerMapLen := len(optimizerpb.AssignableShiftTeamResult_Status_name)
	logisticsMapLen := len(logisticspb.AssignableShiftTeamResult_Status_name)
	testutils.MustMatch(t, optimizerMapLen, mapLen, "OptimizerAssignableStatusToLogisticsAssignableStatus not matching with AssignableShiftTeamResult_Status on optimizer")
	testutils.MustMatch(t, logisticsMapLen, mapLen, "OptimizerAssignableStatusToLogisticsAssignableStatus not matching with AssignableShiftTeamResult_Status on logistics grpc")
}

func TestOptimizerTimeWindowStatusToLogisticsTimeWindowStatus(t *testing.T) {
	mapLen := len(logisticsdb.OptimizerTimeWindowStatusToLogisticsTimeWindowStatus)
	optimizerMapLen := len(optimizerpb.AssignableShiftTeamResult_TimeWindowStatus_name)
	logisticsMapLen := len(logisticspb.AssignableShiftTeamResult_TimeWindowStatus_name)
	testutils.MustMatch(t, optimizerMapLen, mapLen, "OptimizerTimeWindowStatusToLogisticsTimeWindowStatus not matching with AssignableShiftTeamResult_TimeWindowStatus_name on optimizer")
	testutils.MustMatch(t, logisticsMapLen, mapLen, "OptimizerTimeWindowStatusToLogisticsTimeWindowStatus not matching with AssignableShiftTeamResult_TimeWindowStatus_name on logistics grpc")
}

func TestAttributesFromVRPAttributes(t *testing.T) {
	testingVRPAttributes := []*optimizerpb.VRPAttribute{
		{Id: "testing attribute 1"},
		{Id: "testing attribute 2"},
	}

	attributes := logisticsdb.AttributesFromVRPAttributes(testingVRPAttributes)
	for i, attribute := range attributes {
		testutils.MustMatch(t, testingVRPAttributes[i].Id, attribute.Name, "transformer attributes not matching")
	}
}

func TestVRPAttributesFromAttributes(t *testing.T) {
	testingAttributes := []*commonpb.Attribute{
		{Name: "testing attribute 1"},
		{Name: "testing attribute 2"},
	}

	vrpAttributes := logisticsdb.VRPAttributesFromAttributes(attributes.Attributes(testingAttributes).ToInternal())
	for i, vrpAttribute := range vrpAttributes {
		testutils.MustMatch(t, testingAttributes[i].Name, vrpAttribute.Id, "transformer vrp attributes not matching")
	}
}

func TestVRPTimeWindowFromTimeWindow(t *testing.T) {
	goodStart := &commonpb.DateTime{
		Year:  2022,
		Month: 1,
		Day:   1,
	}
	goodEnd := &commonpb.DateTime{
		Year:  2022,
		Month: 1,
		Day:   1,
	}
	niceWindow := &commonpb.TimeWindow{StartDatetime: goodStart, EndDatetime: goodEnd}
	testutils.MustFn(t)(logisticsdb.VRPTimeWindowFromTimeWindow(niceWindow))

	_, errStart := logisticsdb.VRPTimeWindowFromTimeWindow(&commonpb.TimeWindow{
		StartDatetime: &commonpb.DateTime{TimeOffset: &commonpb.DateTime_TimeZone{TimeZone: &commonpb.TimeZone{Id: "nonsense"}}},
		EndDatetime:   goodEnd},
	)
	testutils.MustMatch(t, true, errStart != nil)

	_, errEnd := logisticsdb.VRPTimeWindowFromTimeWindow(&commonpb.TimeWindow{
		StartDatetime: goodStart,
		EndDatetime:   &commonpb.DateTime{TimeOffset: &commonpb.DateTime_TimeZone{TimeZone: &commonpb.TimeZone{Id: "nonsense"}}}},
	)
	testutils.MustMatch(t, true, errEnd != nil)
}

func TestToCheckFeasibilityProto(t *testing.T) {
	careRequestID := int64(1)
	marketID := int64(2)
	userID := int64(3)
	channelItemID := int64(4)
	completionValueCents := int64(5)
	partnerPriorityScore := int64(6)
	attributes := []*commonpb.Attribute{{}}
	sourceType := commonpb.CareRequestStatus_SOURCE_TYPE_PROVIDER
	statusSourceType := commonpb.StatusSourceType_STATUS_SOURCE_TYPE_PROVIDER
	patientAge := int32(10)
	location := &commonpb.Location{LatitudeE6: 123456, LongitudeE6: 654321}
	startTime := time.Date(2022, time.January, 1, 12, 0, 0, 0, time.UTC)
	endTime := startTime.Add(time.Hour * 1)
	arrivalTimeWindow := commonpb.TimeWindow{
		StartDatetime: logisticsdb.TimeToProtoDateTime(&startTime),
		EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTime),
	}

	serviceDuration := int64(3600)

	upsertIfFeasibleRequest := &logisticspb.UpsertVisitIfFeasibleRequest{
		CareRequestInfo: &commonpb.CareRequestInfo{
			Id:                  careRequestID,
			MarketId:            &marketID,
			ServiceDurationSec:  &serviceDuration,
			Location:            location,
			ArrivalTimeWindow:   &arrivalTimeWindow,
			RequiredAttributes:  attributes,
			PreferredAttributes: attributes,
			ForbiddenAttributes: attributes,
			UnwantedAttributes:  attributes,
			RequestStatus: &commonpb.CareRequestStatus{
				UserId:           &userID,
				SourceType:       &sourceType,
				StatusSourceType: &statusSourceType,
			},
			Acuity: &commonpb.AcuityInfo{
				PatientAge: &patientAge,
			},
			Priority: &commonpb.CareRequestPriority{
				RequestedByUserId: &userID,
			},
			Partner: &commonpb.Partner{
				ChannelItemId: &channelItemID,
			},
			Value: &commonpb.CareRequestValue{
				CompletionValueCents: &completionValueCents,
				PartnerPriorityScore: &partnerPriorityScore,
			},
		},
	}

	checkFeasibilityRequest := logisticsdb.ToCheckFeasibilityProto(upsertIfFeasibleRequest)

	expectedCheckFeasibilityRequest := &logisticspb.CheckFeasibilityRequest{
		Visits: []*logisticspb.CheckFeasibilityVisit{
			{
				MarketId:           &marketID,
				ServiceDurationSec: &serviceDuration,
				Location:           location,
				ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
					ArrivalTimeWindow: &arrivalTimeWindow,
				},
				IsManualAdjustment:  false,
				RequiredAttributes:  attributes,
				PreferredAttributes: attributes,
				ForbiddenAttributes: attributes,
				UnwantedAttributes:  attributes,
				EntityDescriptor: &logisticspb.CheckFeasibilityVisit_CareRequestId{
					CareRequestId: careRequestID,
				},
			}},
	}
	testutils.MustMatchProto(t, checkFeasibilityRequest, expectedCheckFeasibilityRequest)
}

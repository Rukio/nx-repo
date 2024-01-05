package protoconv

import (
	"database/sql"
	"encoding/json"
	"strconv"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/nyaruka/phonenumbers"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const usPhoneNumberRegionCode = "US"

func BytesToProtoStruct(bytes []byte) (*structpb.Struct, error) {
	if bytes == nil {
		return nil, nil
	}

	var jsonData map[string]any
	err := json.Unmarshal(bytes, &jsonData)
	if err != nil {
		return nil, err
	}

	return MapToProtoStruct(jsonData)
}

func MapToProtoStruct(data map[string]any) (*structpb.Struct, error) {
	if data == nil {
		return nil, nil
	}

	d, err := structpb.NewStruct(data)
	if err != nil {
		return nil, err
	}

	return d, nil
}

func ProtoStructToMap(data *structpb.Struct) map[string]any {
	if data == nil {
		return nil
	}

	d := data.AsMap()
	return d
}

func TimeToProtoTimestamp(time *time.Time) *timestamppb.Timestamp {
	if time == nil {
		return nil
	}

	return timestamppb.New(*time)
}

func ProtoTimestampToTime(timestamp *timestamppb.Timestamp) *time.Time {
	if timestamp == nil {
		return nil
	}

	t := timestamp.AsTime()
	return &t
}

func FromNullInt64(i sql.NullInt64) *int64 {
	if !i.Valid {
		return nil
	}
	return proto.Int64(i.Int64)
}

func LocationToCommonLocation(location *logisticssql.Location) *commonpb.Location {
	if location == nil {
		return nil
	}

	return &commonpb.Location{
		LatitudeE6:  location.LatitudeE6,
		LongitudeE6: location.LongitudeE6,
	}
}

func AttributeToCommonAttribute(attribute []*logisticssql.Attribute) []*commonpb.Attribute {
	var commonAttributes []*commonpb.Attribute
	for _, attr := range attribute {
		commonAttributes = append(commonAttributes, &commonpb.Attribute{
			Name: attr.Name,
		})
	}
	return commonAttributes
}

func PhoneNumberProto(number *string, phoneNumberType commonpb.PhoneNumber_PhoneNumberType) (*commonpb.PhoneNumber, error) {
	if number == nil {
		return nil, nil
	}

	num, err := phonenumbers.Parse(*number, usPhoneNumberRegionCode)
	if err != nil {
		return nil, errors.Wrap(err, "could not parse phone number")
	}

	return &commonpb.PhoneNumber{
		CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
		PhoneNumber:     proto.String(phonenumbers.Format(num, phonenumbers.NATIONAL)),
		PhoneNumberType: phoneNumberType,
	}, nil
}

func DateProto(date *string, dateLayout string) (*commonpb.Date, error) {
	if date == nil {
		return nil, nil
	}
	timeObject, err := time.Parse(dateLayout, *date)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse date")
	}
	return &commonpb.Date{
		Year:  int32(timeObject.Year()),
		Month: int32(timeObject.Month()),
		Day:   int32(timeObject.Day()),
	}, nil
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

func DateTimeProto(date *string, dateLayout string) (*commonpb.DateTime, error) {
	if date == nil {
		return nil, nil
	}
	t, err := time.Parse(dateLayout, *date)
	if err != nil {
		return nil, err
	}

	return &commonpb.DateTime{
		Year:    int32(t.Year()),
		Month:   int32(t.Month()),
		Day:     int32(t.Day()),
		Hours:   int32(t.Hour()),
		Minutes: int32(t.Minute()),
		Seconds: int32(t.Second()),
	}, err
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

func ProtoDateToTime(date *commonpb.Date) *time.Time {
	if date == nil {
		return nil
	}
	res := time.Date(int(date.Year), time.Month(int(date.Month)), int(date.Day), 0, 0, 0, 0, time.UTC)
	return &res
}

func ProtoDateToString(date *commonpb.Date, dateLayout string) *string {
	if date == nil {
		return nil
	}
	dateString := ProtoDateToTime(date).Format(dateLayout)
	return &dateString
}

func ProtoBoolToString(b *bool) *string {
	if b == nil {
		return nil
	}
	boolString := strconv.FormatBool(*b)
	return &boolString
}

func ProtoStringToInt64(stringValue *string) (*int64, error) {
	if stringValue == nil || *stringValue == "" {
		return nil, nil
	}
	value, err := strconv.ParseInt(*stringValue, 10, 64)
	if err != nil {
		return nil, err
	}
	return &value, nil
}

func ProtoInt64ToString(value *int64) *string {
	if value == nil {
		return nil
	}
	return proto.String(strconv.FormatInt(*value, 10))
}

func TimeToProtoTimeOfDay(t *time.Time) *commonpb.TimeOfDay {
	if t == nil {
		return nil
	}

	return &commonpb.TimeOfDay{
		Hours:   int32(t.Hour()),
		Minutes: int32(t.Minute()),
		Seconds: int32(t.Second()),
		Nanos:   int32(t.Nanosecond()),
	}
}

func TimestampToBytes(timestamp *timestamppb.Timestamp) ([]byte, error) {
	err := timestamp.CheckValid()
	if err != nil {
		return nil, err
	}

	res, _ := timestamp.AsTime().MarshalBinary()

	return res, nil
}

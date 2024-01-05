package protoconv

import (
	"database/sql"
	"encoding/json"
	"reflect"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/nyaruka/phonenumbers"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var jsonData = map[string]any{
	"color":   "green",
	"count":   123.0,
	"enabled": true,
	"item": map[string]any{
		"name":  "candybar",
		"price": 3.75,
	},
}

func TestBytesToProtoStruct(t *testing.T) {
	expectedValue, _ := structpb.NewStruct(jsonData)
	bytes, _ := json.Marshal(jsonData)

	tcs := []struct {
		Description   string
		Value         []byte
		ExpectedValue *structpb.Struct

		HasError bool
	}{
		{
			Description:   "Base Case",
			Value:         bytes,
			ExpectedValue: expectedValue,
			HasError:      false,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
			HasError:      true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted, _ := BytesToProtoStruct(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestJSONToProtoStruct(t *testing.T) {
	expectedValue, _ := structpb.NewStruct(jsonData)

	tcs := []struct {
		Description   string
		Value         map[string]any
		ExpectedValue *structpb.Struct

		HasError bool
	}{
		{
			Description:   "Base Case",
			Value:         jsonData,
			ExpectedValue: expectedValue,
			HasError:      true,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
			HasError:      true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted, _ := MapToProtoStruct(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestProtoStructToJSON(t *testing.T) {
	value, _ := structpb.NewStruct(jsonData)

	tcs := []struct {
		Description   string
		Value         *structpb.Struct
		ExpectedValue map[string]any
		HasError      bool
	}{
		{
			Description:   "Base Case",
			Value:         value,
			ExpectedValue: jsonData,
			HasError:      true,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
			HasError:      true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted := ProtoStructToMap(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestTimeToProtoTimestamp(t *testing.T) {
	tm := time.Date(2022, 1, 1, 12, 0, 0, 0, time.UTC)

	tcs := []struct {
		Description   string
		Value         *time.Time
		ExpectedValue *timestamppb.Timestamp

		HasError bool
	}{
		{
			Description:   "Base Case",
			Value:         &tm,
			ExpectedValue: timestamppb.New(time.Date(2022, 1, 1, 12, 0, 0, 0, time.UTC)),
			HasError:      false,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
			HasError:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted := TimeToProtoTimestamp(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestProtoTimestampToTime(t *testing.T) {
	ptm := timestamppb.Now()
	tm := ptm.AsTime()

	tcs := []struct {
		Description   string
		Value         *timestamppb.Timestamp
		ExpectedValue *time.Time

		HasError bool
	}{
		{
			Description:   "Base Case",
			Value:         ptm,
			ExpectedValue: &tm,
			HasError:      true,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
			HasError:      true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted := ProtoTimestampToTime(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestFromNullInt64(t *testing.T) {
	var nilInt64 *int64
	invalid := sql.NullInt64{Valid: false, Int64: 5}
	testutils.MustMatch(t, nilInt64, FromNullInt64(invalid))

	valid := sql.NullInt64{Valid: true, Int64: 5}
	testutils.MustMatch(t, proto.Int64(5), FromNullInt64(valid))
}

func TestLocationToCommonLocation(t *testing.T) {
	sqlLocation := &logisticssql.Location{
		LatitudeE6:  0,
		LongitudeE6: 0,
	}

	commonLocation := &commonpb.Location{
		LatitudeE6:  0,
		LongitudeE6: 0,
	}

	tcs := []struct {
		Description   string
		Value         *logisticssql.Location
		ExpectedValue *commonpb.Location
	}{
		{
			Description:   "Base Case",
			Value:         sqlLocation,
			ExpectedValue: commonLocation,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted := LocationToCommonLocation(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestAttributeToCommonAttribute(t *testing.T) {
	testDate := time.Now()
	sqlAttributes := []*logisticssql.Attribute{
		{
			ID:        1,
			Name:      "Attribute 1",
			CreatedAt: testDate,
		},
		{
			ID:        2,
			Name:      "Attribute 2",
			CreatedAt: testDate,
		},
	}

	commonAttributes := []*commonpb.Attribute{
		{
			Name: "Attribute 1",
		},
		{
			Name: "Attribute 2",
		},
	}

	tcs := []struct {
		Description   string
		Value         []*logisticssql.Attribute
		ExpectedValue []*commonpb.Attribute
	}{
		{
			Description:   "Base Case",
			Value:         sqlAttributes,
			ExpectedValue: commonAttributes,
		},
		{
			Description:   "Nil Value",
			Value:         nil,
			ExpectedValue: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			converted := AttributeToCommonAttribute(tc.Value)
			testutils.MustMatch(t, tc.ExpectedValue, converted)
		})
	}
}

func TestPhoneNumberToCommonPhoneNumber(t *testing.T) {
	number := "5550676888"
	formattedPhone := "(555) 067-6888"
	notANumber := "telephone number"
	type args struct {
		number     *string
		numberType commonpb.PhoneNumber_PhoneNumberType
	}
	tests := []struct {
		name    string
		args    args
		want    *commonpb.PhoneNumber
		wantErr bool
	}{
		{
			name: "Base case",
			args: args{
				number:     &number,
				numberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
			},
			want: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
				PhoneNumber:     &formattedPhone,
				Extension:       nil,
			},
			wantErr: false,
		},
		{
			name: "Is Mobile",
			args: args{
				number:     &number,
				numberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
			},
			want: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
				PhoneNumber:     &formattedPhone,
				Extension:       nil,
			},
			wantErr: false,
		},
		{
			name: "Is Work Phone",
			args: args{
				number:     &number,
				numberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
			},
			want: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
				CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
				PhoneNumber:     &formattedPhone,
				Extension:       nil,
			},
			wantErr: false,
		},
		{
			name: "Not a Number",
			args: args{
				number:     &notANumber,
				numberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
			},
			want:    nil,
			wantErr: true,
		},

		{
			name: "Number is Nil",
			args: args{
				number:     nil,
				numberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
			},
			want:    nil,
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PhoneNumberProto(tt.args.number, tt.args.numberType)
			if (err != nil) != tt.wantErr {
				t.Errorf("PhoneNumberProto() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestDateProto(t *testing.T) {
	date := "2006-01-02"
	invalidDate := "20060102"
	type args struct {
		date       *string
		dateLayout string
	}
	tests := []struct {
		name    string
		args    args
		want    *commonpb.Date
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				date:       &date,
				dateLayout: "2006-01-02",
			},
			want: &commonpb.Date{
				Year:  2006,
				Month: 1,
				Day:   2,
			},
			wantErr: false,
		},
		{
			name: "Date is Nil",
			args: args{
				date:       nil,
				dateLayout: "2006-01-02",
			},
			want:    nil,
			wantErr: false,
		},
		{
			name: "Invalid Date",
			args: args{
				date:       &invalidDate,
				dateLayout: "2006-01-02",
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DateProto(tt.args.date, tt.args.dateLayout)
			if (err != nil) != tt.wantErr {
				t.Errorf("DateProto() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestTimeToProtoDate(t *testing.T) {
	now := time.Now()
	type args struct {
		time *time.Time
	}
	tests := []struct {
		name string
		args args

		want *commonpb.Date
	}{
		{
			name: "Base Case",
			args: args{
				time: &now,
			},

			want: &commonpb.Date{
				Year:  int32(now.Year()),
				Month: int32(now.Month()),
				Day:   int32(now.Day()),
			},
		},
		{
			name: "Time is Nil",
			args: args{
				time: nil,
			},

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TimeToProtoDate(tt.args.time)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestTimeToProtoDateTime(t *testing.T) {
	now := time.Now()
	tests := []struct {
		name string
		time *time.Time

		want *commonpb.DateTime
	}{
		{
			name: "Base Case",
			time: &now,

			want: &commonpb.DateTime{
				Year:    int32(now.Year()),
				Month:   int32(now.Month()),
				Day:     int32(now.Day()),
				Hours:   int32(now.Hour()),
				Minutes: int32(now.Minute()),
				Seconds: int32(now.Second()),
				Nanos:   int32(now.Nanosecond()),
				TimeOffset: &commonpb.DateTime_TimeZone{
					TimeZone: &commonpb.TimeZone{
						Id: now.Location().String(),
					},
				},
			},
		},
		{
			name: "Time is Nil",
			time: nil,

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TimeToProtoDateTime(tt.time)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestDateTimeProto(t *testing.T) {
	dateTime := "01/02/2006 15:04:05"
	invalidDate := "20060102 150405"
	type args struct {
		dateTime       *string
		dateTimeLayout string
	}
	tests := []struct {
		name    string
		args    args
		want    *commonpb.DateTime
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				dateTime:       &dateTime,
				dateTimeLayout: "01/02/2006 15:04:05",
			},
			want: &commonpb.DateTime{
				Year:    2006,
				Month:   1,
				Day:     2,
				Hours:   15,
				Minutes: 4,
				Seconds: 5,
			},
			wantErr: false,
		},
		{
			name: "Date is Nil",
			args: args{
				dateTime:       nil,
				dateTimeLayout: "01/02/2006 15:04:05",
			},
			want:    nil,
			wantErr: false,
		},
		{
			name: "Invalid Date",
			args: args{
				dateTime:       &invalidDate,
				dateTimeLayout: "01/02/2006 15:04:05",
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DateTimeProto(tt.args.dateTime, tt.args.dateTimeLayout)
			if (err != nil) != tt.wantErr {
				t.Errorf("DateTimeProto() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestProtoDateToString(t *testing.T) {
	defaultDateLayout := "2006-01-02"
	tcs := []struct {
		desc       string
		date       *commonpb.Date
		dateLayout string

		want *string
	}{
		{
			desc:       "Base Case",
			date:       &commonpb.Date{Year: 2022, Month: 12, Day: 6},
			dateLayout: defaultDateLayout,

			want: proto.String("2022-12-06"),
		},
		{
			desc:       "Date layout with slashes",
			date:       &commonpb.Date{Year: 2022, Month: 12, Day: 6},
			dateLayout: "01/02/2006",

			want: proto.String("12/06/2022"),
		},
		{
			desc:       "Date layout without preceding zero",
			date:       &commonpb.Date{Year: 2022, Month: 12, Day: 6},
			dateLayout: "2006-1-2",

			want: proto.String("2022-12-6"),
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			date := ProtoDateToString(tc.date, tc.dateLayout)
			testutils.MustMatch(t, tc.want, date)
		})
	}
}

func TestProtoBoolToString(t *testing.T) {
	type args struct {
		b *bool
	}
	tests := []struct {
		name string
		args args
		want *string
	}{
		{
			name: "Base Case - True",
			args: args{
				b: proto.Bool(true),
			},
			want: proto.String("true"),
		},
		{
			name: "Base Case - False",
			args: args{
				b: proto.Bool(false),
			},
			want: proto.String("false"),
		},
		{
			name: "handles nil values",
			args: args{
				b: nil,
			},
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ProtoBoolToString(tt.args.b)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestProtoStringToInt64(t *testing.T) {
	type args struct {
		string *string
	}
	tests := []struct {
		name    string
		args    args
		want    *int64
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				string: proto.String("12345"),
			},
			want:    proto.Int64(12345),
			wantErr: false,
		},
		{
			name: "returns nil for nil input",
			args: args{
				string: nil,
			},
			want:    nil,
			wantErr: false,
		},
		{
			name: "returns nil for empty string input",
			args: args{
				string: proto.String(""),
			},
			want:    nil,
			wantErr: false,
		},
		{
			name: "returns error for not numeric input",
			args: args{
				string: proto.String("some value"),
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ProtoStringToInt64(tt.args.string)
			if (err != nil) != tt.wantErr {
				t.Errorf("ProtoStringToInt64() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestProtoInt64ToString(t *testing.T) {
	type args struct {
		value *int64
	}
	tests := []struct {
		name string
		args args
		want *string
	}{
		{
			name: "base case",
			args: args{
				value: proto.Int64(123456789),
			},
			want: proto.String("123456789"),
		},
		{
			name: "returns nil for nil input",
			args: args{
				value: nil,
			},
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ProtoInt64ToString(tt.args.value)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestTimeToProtoTimeOfDay(t *testing.T) {
	timeNow := time.Now()

	tests := []struct {
		name  string
		input *time.Time

		want *commonpb.TimeOfDay
	}{
		{
			name:  "base case",
			input: &timeNow,

			want: &commonpb.TimeOfDay{
				Hours:   int32(timeNow.Hour()),
				Minutes: int32(timeNow.Minute()),
				Seconds: int32(timeNow.Second()),
				Nanos:   int32(timeNow.Nanosecond()),
			},
		},
		{
			name:  "returns nil for nil input",
			input: nil,

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := TimeToProtoTimeOfDay(tt.input)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestTimestampToBytes(t *testing.T) {
	timestamp := timestamppb.New(time.Now())
	invalidNanos := 1000000000 // Example value greater than the valid range
	invalidTimestamp := &timestamppb.Timestamp{
		Seconds: time.Now().Unix(), // Use the current timestamp in seconds
		Nanos:   int32(invalidNanos),
	}

	tests := []struct {
		name  string
		input *timestamppb.Timestamp

		want    []byte
		wantErr bool
	}{
		{
			name:  "base case",
			input: timestamp,

			want: []byte{},
		},
		{
			name:  "returns err for nil input",
			input: nil,

			wantErr: true,
		},
		{
			name:  "returns err for nil input",
			input: invalidTimestamp,

			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := TimestampToBytes(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("TimestampToBytes() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, reflect.TypeOf(tt.want), reflect.TypeOf(got))
		})
	}
}

func TestProtoDateToTime(t *testing.T) {
	exampleDate := time.Date(2022, 12, 6, 0, 0, 0, 0, time.UTC)

	tcs := []struct {
		desc string
		date *commonpb.Date

		want *time.Time
	}{
		{
			desc: "Base Case",
			date: &commonpb.Date{Year: 2022, Month: 12, Day: 6},

			want: &exampleDate,
		},
		{
			desc: "nil Date",

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			date := ProtoDateToTime(tc.date)
			testutils.MustMatch(t, tc.want, date)
		})
	}
}

package sqltypes

import (
	"database/sql"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestValidToNullInt64(t *testing.T) {
	testutils.MustMatch(t, sql.NullInt64{Valid: true, Int64: 5}, ToValidNullInt64(5))
	testutils.MustMatch(t, sql.NullInt64{Valid: true, Int64: 0}, ToValidNullInt64(0), "0 is validly not null")
}

func TestValidToNullInt32(t *testing.T) {
	testutils.MustMatch(t, sql.NullInt32{Valid: true, Int32: 5}, ToValidNullInt32(5))
	testutils.MustMatch(t, sql.NullInt32{Valid: true, Int32: 0}, ToValidNullInt32(0), "0 is validly not null")
}

func TestToNullInt64(t *testing.T) {
	var validInt64 int64 = 5

	testutils.MustMatch(t, sql.NullInt64{Valid: true, Int64: 5}, ToNullInt64(&validInt64))
	testutils.MustMatch(t, sql.NullInt64{Valid: false, Int64: 0}, ToNullInt64(nil), "non-null int64")
}

func TestToNullInt32(t *testing.T) {
	var validInt32 int32 = 5

	testutils.MustMatch(t, sql.NullInt32{Valid: true, Int32: 5}, ToNullInt32(&validInt32))
	testutils.MustMatch(t, sql.NullInt32{Valid: false, Int32: 0}, ToNullInt32(nil), "non-null int32")
}

// ToProtoInt64 maps NULL to proto nil, and otherwise wraps the valid value.
func TestToProtoInt64(t *testing.T) {
	var validInt64 int64 = 5
	var nilInt64 *int64

	testutils.MustMatch(t, proto.Int64(validInt64), ToProtoInt64(sql.NullInt64{Valid: true, Int64: validInt64}))
	testutils.MustMatch(t, nilInt64, ToProtoInt64(sql.NullInt64{Valid: false, Int64: validInt64}))
}

// ToProtoInt32 maps NULL to proto nil, and otherwise wraps the valid value.
func TestToProtoInt32(t *testing.T) {
	var validInt32 int32 = 5
	var nilInt32 *int32

	testutils.MustMatch(t, proto.Int32(validInt32), ToProtoInt32(sql.NullInt32{Valid: true, Int32: validInt32}))
	testutils.MustMatch(t, nilInt32, ToProtoInt32(sql.NullInt32{Valid: false, Int32: validInt32}))
}

// ToProtoFloat64 maps NULL to proto nil, and otherwise wraps the valid value.
func TestToProtoFloat64(t *testing.T) {
	var validFloat64 float64 = 5
	var nilFloat64 *float64

	testutils.MustMatch(t, proto.Float64(validFloat64), ToProtoFloat64(sql.NullFloat64{Valid: true, Float64: validFloat64}))
	testutils.MustMatch(t, nilFloat64, ToProtoFloat64(sql.NullFloat64{Valid: false, Float64: validFloat64}))
}

// ToValidNullFloat64 wraps a float64 value as a non-null (valid) sql.NullFloat64.
func TestToValidNullFloat64(t *testing.T) {
	testutils.MustMatch(t, sql.NullFloat64{Valid: true, Float64: 10}, ToValidNullFloat64(10))
	testutils.MustMatch(t, sql.NullFloat64{Valid: true, Float64: 0}, ToValidNullFloat64(0), "0 is validly not null")
}

func TestToNullFloat64(t *testing.T) {
	validFloat64 := float64(10)

	testutils.MustMatch(t, sql.NullFloat64{Valid: true, Float64: 10}, ToNullFloat64(&validFloat64))
	testutils.MustMatch(t, sql.NullFloat64{Valid: false, Float64: 0}, ToNullFloat64(nil), "non-null float64")
}

func TestToValidNullString(t *testing.T) {
	testutils.MustMatch(t, sql.NullString{Valid: true, String: "String"}, ToValidNullString("String"))
	testutils.MustMatch(t, sql.NullString{Valid: true, String: ""}, ToValidNullString(""), "empty is validly not null")
}

func TestToNullString(t *testing.T) {
	validString := "Test String"

	testutils.MustMatch(t, sql.NullString{Valid: true, String: "Test String"}, ToNullString(&validString))
	testutils.MustMatch(t, sql.NullString{Valid: false, String: ""}, ToNullString(nil), "non-null string")
}

func TestToNullTime(t *testing.T) {
	validTime := time.Now()

	testutils.MustMatch(t, sql.NullTime{Valid: true, Time: validTime}, ToNullTime(&validTime))
	testutils.MustMatch(t, sql.NullTime{Valid: false}, ToNullTime(nil), "non-null time value")
}

func TestToProtoString(t *testing.T) {
	validString := "Test String"
	var nilString *string

	testutils.MustMatch(t, proto.String(validString), ToProtoString(sql.NullString{Valid: true, String: validString}))
	testutils.MustMatch(t, nilString, ToProtoString(sql.NullString{Valid: false, String: validString}))
}

func TestStringToValidNullTime(t *testing.T) {
	nowDateString := time.Now().Format(timestampLayout)
	testDate, _ := time.Parse(timestampLayout, nowDateString)

	testutils.MustMatch(t, sql.NullTime{Valid: true, Time: testDate}, StringToValidNullTime(nowDateString))
	testutils.MustMatch(t, sql.NullTime{Valid: false}, StringToValidNullTime(""), "empty is validly not null")
}

func TestStringToNullTime(t *testing.T) {
	nowDateString := time.Now().Format(timestampLayout)
	testDate, _ := time.Parse(timestampLayout, nowDateString)

	testutils.MustMatch(t, sql.NullTime{Valid: true, Time: testDate}, StringToNullTime(&nowDateString))
	testutils.MustMatch(t, sql.NullTime{Valid: false}, StringToNullTime(nil), "non-null string")
}

func TestToProtoStringTimestamp(t *testing.T) {
	var nilStringDate *string
	nowDateString := time.Now().Format(timestampLayout)
	testDate, _ := time.Parse(timestampLayout, nowDateString)

	testutils.MustMatch(t, proto.String(nowDateString), ToProtoStringTimestamp(sql.NullTime{Valid: true, Time: testDate}))
	testutils.MustMatch(t, nilStringDate, ToProtoStringTimestamp(sql.NullTime{Valid: false}))
}

func TestToProtoTimestamp(t *testing.T) {
	var nilStringDate *string
	time := time.Now()

	testutils.MustMatch(t, timestamppb.New(time), ToProtoTimestamp(sql.NullTime{Valid: true, Time: time}))
	testutils.MustMatch(t, nilStringDate, ToProtoStringTimestamp(sql.NullTime{Valid: false}))
}

func TestToNullBool(t *testing.T) {
	var validBool = true

	testutils.MustMatch(t, sql.NullBool{Valid: true, Bool: true}, ToNullBool(&validBool))
	testutils.MustMatch(t, sql.NullBool{Valid: false, Bool: false}, ToNullBool(nil), "non-null int32")
}

func TestToValidNullBool(t *testing.T) {
	testutils.MustMatch(t, sql.NullBool{Valid: true, Bool: true}, ToValidNullBool(true))
	testutils.MustMatch(t, sql.NullBool{Valid: true, Bool: false}, ToValidNullBool(false))
}

func TestToProtoBool(t *testing.T) {
	var nilBool *bool

	testutils.MustMatch(t, proto.Bool(true), ToProtoBool(sql.NullBool{Valid: true, Bool: true}))
	testutils.MustMatch(t, proto.Bool(false), ToProtoBool(sql.NullBool{Valid: true, Bool: false}))
	testutils.MustMatch(t, nilBool, ToProtoBool(sql.NullBool{Valid: false}))
}

func TestJSONBToMap(t *testing.T) {
	tcs := []struct {
		Description   string
		Value         pgtype.JSONB
		ExpectedValue map[string]any
		HasError      bool
	}{
		{
			Description: "success - valid JSONB",
			Value: pgtype.JSONB{
				Bytes:  []byte(`{"color":"green", "item": {"price": 3.75}}`),
				Status: pgtype.Present,
			},
			ExpectedValue: map[string]any{
				"color": "green",
				"item": map[string]any{
					"price": 3.75,
				},
			},
			HasError: false,
		},
		{
			Description:   "Empty string",
			Value:         pgtype.JSONB{Bytes: []byte(""), Status: pgtype.Present},
			ExpectedValue: nil,
			HasError:      true,
		},
		{
			Description:   "Invalid JSON",
			Value:         pgtype.JSONB{Bytes: []byte(`{signs: "test"}`), Status: pgtype.Present},
			ExpectedValue: nil,
			HasError:      true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			value, err := JSONBToMap(&tc.Value)
			if tc.HasError {
				testutils.MustMatch(t, true, err != nil)
			}

			testutils.MustMatch(t, tc.ExpectedValue, value)
		})
	}
}

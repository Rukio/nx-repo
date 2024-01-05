package sqltypes

import (
	"database/sql"
	"errors"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	timestampLayout = "2006-01-02T15:04:05.999Z"
)

// ToValidNullInt64 wraps an int64 value as a non-null (valid) sql.NullInt64.
func ToValidNullInt64(val int64) sql.NullInt64 {
	return sql.NullInt64{Valid: true, Int64: val}
}

// ToNullInt64 returns a null or non-null sql.NullInt64 depending on whether
// val is nil or not.
func ToNullInt64(val *int64) sql.NullInt64 {
	if val == nil {
		return sql.NullInt64{Valid: false}
	}
	return ToValidNullInt64(*val)
}

// ToValidNullInt32 wraps an int32 value as a non-null (valid) sql.NullInt32.
func ToValidNullInt32(val int32) sql.NullInt32 {
	return sql.NullInt32{Valid: true, Int32: val}
}

// ToNullInt32 returns a null or non-null sql.NullInt32 depending on whether
// val is nil or not.
func ToNullInt32(val *int32) sql.NullInt32 {
	if val == nil {
		return sql.NullInt32{Valid: false}
	}
	return ToValidNullInt32(*val)
}

// ToProtoInt64 maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoInt64(val sql.NullInt64) *int64 {
	if !val.Valid {
		return nil
	}
	return proto.Int64(val.Int64)
}

// ToProtoInt32 maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoInt32(val sql.NullInt32) *int32 {
	if !val.Valid {
		return nil
	}
	return proto.Int32(val.Int32)
}

// ToProtoFloat64 maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoFloat64(val sql.NullFloat64) *float64 {
	if !val.Valid {
		return nil
	}
	return proto.Float64(val.Float64)
}

// ToValidNullFloat64 wraps a float64 value as a non-null (valid) sql.NullFloat64.
func ToValidNullFloat64(val float64) sql.NullFloat64 {
	return sql.NullFloat64{Valid: true, Float64: val}
}

// ToNullFloat64 returns a null or non-null sql.NullFloat64 depending on whether
// val is nil or not.
func ToNullFloat64(val *float64) sql.NullFloat64 {
	if val == nil {
		return sql.NullFloat64{Valid: false}
	}
	return ToValidNullFloat64(*val)
}

// ToValidNullString wraps an string value as a non-null (valid) sql.NullString.
func ToValidNullString(val string) sql.NullString {
	return sql.NullString{Valid: true, String: val}
}

// ToNullString returns a null or non-null sql.NullString depending on whether
// val is nil or not.
func ToNullString(val *string) sql.NullString {
	if val == nil {
		return sql.NullString{Valid: false}
	}
	return ToValidNullString(*val)
}

// ToProtoString maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoString(val sql.NullString) *string {
	if !val.Valid {
		return nil
	}
	return proto.String(val.String)
}

// StringToNullTime returns a null or non-null sql.NullTime depending on whether
// val is nil or not.
func StringToNullTime(val *string) sql.NullTime {
	if val == nil {
		return sql.NullTime{Valid: false}
	}

	return StringToValidNullTime(*val)
}

// StringToValidNullTime wraps an string value as a non-null (valid) and converts it
// to a sql.NullTime.
func StringToValidNullTime(val string) sql.NullTime {
	date, err := time.Parse(timestampLayout, val)
	if err != nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Valid: true, Time: date}
}

// ToNullTime returns a null or non-null sql.NullTime depending on whether
// val is nil or not.
func ToNullTime(val *time.Time) sql.NullTime {
	if val == nil {
		return sql.NullTime{Valid: false}
	}
	return ToValidNullTime(*val)
}

// ToValidNullTime wraps a time value as a non-null (valid) and converts it
// to a sql.NullTime.
func ToValidNullTime(val time.Time) sql.NullTime {
	return sql.NullTime{Valid: true, Time: val}
}

// ToNullBool returns a null or non-null sql.NullBool depending on whether
// val is nil or not.
func ToNullBool(val *bool) sql.NullBool {
	if val == nil {
		return sql.NullBool{Valid: false}
	}

	return sql.NullBool{Valid: true, Bool: *val}
}

// ToValidNullBool wraps a bool value as a non-null (valid) sql.NullBool.
func ToValidNullBool(val bool) sql.NullBool {
	return sql.NullBool{Valid: true, Bool: val}
}

// ToProtoBool maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoBool(val sql.NullBool) *bool {
	if !val.Valid {
		return nil
	}
	return proto.Bool(val.Bool)
}

// ToProtoStringTimestamp maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoStringTimestamp(val sql.NullTime) *string {
	if !val.Valid {
		return nil
	}
	return proto.String(val.Time.Format(timestampLayout))
}

// ToProtoTimestamp maps NULL to proto nil, and otherwise wraps the valid value.
func ToProtoTimestamp(val sql.NullTime) *timestamppb.Timestamp {
	if !val.Valid {
		return nil
	}
	return protoconv.TimeToProtoTimestamp(&val.Time)
}

func JSONBToMap(val *pgtype.JSONB) (map[string]any, error) {
	// use .Get() + type assertion to try to force to map[string]any or return an err
	ret, ok := val.Get().(map[string]any)
	if !ok {
		return nil, errors.New("failed to convert jsonb to map")
	}

	return ret, nil
}

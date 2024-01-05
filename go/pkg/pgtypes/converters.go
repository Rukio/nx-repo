package pgtypes

import (
	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/proto"
)

func BuildNumeric(n any) (pgtype.Numeric, error) {
	r := pgtype.Numeric{}
	err := r.Set(n)
	if err != nil {
		return pgtype.Numeric{Status: pgtype.Null}, err
	}
	return r, nil
}

func NumericToProtoFloat64(n pgtype.Numeric) *float64 {
	var f float64
	err := n.AssignTo(&f)
	if err != nil {
		return nil
	}
	return proto.Float64(f)
}

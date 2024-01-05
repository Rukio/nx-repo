package pgtypes

import (
	"math/big"
	"reflect"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
)

func TestBuildNumeric(t *testing.T) {
	type args struct {
		n any
	}
	tests := []struct {
		name    string
		args    args
		want    pgtype.Numeric
		wantErr bool
	}{
		{
			name: "should convert numeric string value to pgtype.Numeric",
			args: args{
				n: "33.33",
			},
			want: pgtype.Numeric{
				Int:              big.NewInt(3333),
				Exp:              -2,
				Status:           pgtype.Present,
				NaN:              false,
				InfinityModifier: pgtype.None,
			},
			wantErr: false,
		},
		{
			name: "should convert numeric float value to pgtype.Numeric",
			args: args{
				n: float64(33.33),
			},
			want: pgtype.Numeric{
				Int:              big.NewInt(3333),
				Exp:              -2,
				Status:           pgtype.Present,
				NaN:              false,
				InfinityModifier: pgtype.None,
			},
			wantErr: false,
		},
		{
			name: "should return an error and Numeric value null if the value is invalid",
			args: args{
				n: "invalid value",
			},
			want: pgtype.Numeric{
				Status: pgtype.Null,
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := BuildNumeric(tt.args.n)
			if (err != nil) != tt.wantErr {
				t.Errorf("BuildNumeric() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got, "pgtype.Numeric conversion failed")
		})
	}
}

func TestNumericToProtoFloat64(t *testing.T) {
	type args struct {
		n pgtype.Numeric
	}
	val := 33.33
	tests := []struct {
		name string
		args args
		want *float64
	}{
		{
			name: "should convert a pgtype.Numeric value to *float64",
			args: args{
				n: pgtype.Numeric{
					Int:    big.NewInt(3333),
					Exp:    -2,
					Status: pgtype.Present,
				},
			},
			want: &val,
		},
		{
			name: "should return nil if conversion fails",
			args: args{
				n: pgtype.Numeric{
					Status: pgtype.Null,
				},
			},
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := NumericToProtoFloat64(tt.args.n); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("NumericToProtoFloat64() = %v, want %v", got, tt.want)
			}
		})
	}
}

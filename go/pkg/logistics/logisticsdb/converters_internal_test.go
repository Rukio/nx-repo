package logisticsdb

import (
	"database/sql"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func Test_toVisitAcuity(t *testing.T) {
	const oneHourInSeconds = 3600

	arrivalStartTimestamp := time.Date(1994, 11, 12, 13, 0, 0, 0, time.UTC)
	arrivalEndTimestamp := time.Date(1994, 11, 16, 13, 0, 0, 0, time.UTC)
	clinicalUrgencyLevelHigh := commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH

	windowEnd := time.Date(1994, 11, 12, 14, 0, 0, 0, time.UTC)

	tcs := []struct {
		name                      string
		rowToVisitAcuityConverter *rowToVisitAcuityConverter
		want                      *logisticspb.VisitAcuity
	}{
		{
			name: "all columns are valid",
			rowToVisitAcuityConverter: &rowToVisitAcuityConverter{
				arrivalStartTimestampSec:              sqltypes.ToValidNullInt64(arrivalStartTimestamp.Unix()),
				arrivalEndTimestampSec:                sqltypes.ToValidNullInt64(arrivalEndTimestamp.Unix()),
				visitClinicalUrgencyWindowDurationSec: sqltypes.ToValidNullInt64(int64(oneHourInSeconds)),
				visitClinicalUrgencyLevelID:           sqltypes.ToValidNullInt64(ClinicalUrgencyLevelEnumToID[clinicalUrgencyLevelHigh]),
			},
			want: &logisticspb.VisitAcuity{
				ClinicalUrgencyLevel: clinicalUrgencyLevelHigh,
				ClinicalUrgencyWindow: &commonpb.TimeWindow{
					StartDatetime: TimeToProtoDateTime(&arrivalStartTimestamp),
					EndDatetime:   TimeToProtoDateTime(&windowEnd),
				},
			},
		},
		{
			name: "with null arrivalStartTimestampSec the window is nil",
			rowToVisitAcuityConverter: &rowToVisitAcuityConverter{
				arrivalStartTimestampSec:              sql.NullInt64{},
				visitClinicalUrgencyWindowDurationSec: sqltypes.ToValidNullInt64(int64(oneHourInSeconds)),
				visitClinicalUrgencyLevelID:           sqltypes.ToValidNullInt64(ClinicalUrgencyLevelEnumToID[clinicalUrgencyLevelHigh]),
			},
			want: &logisticspb.VisitAcuity{
				ClinicalUrgencyLevel:  clinicalUrgencyLevelHigh,
				ClinicalUrgencyWindow: nil,
			},
		},
		{
			name: "with null visitClinicalUrgencyWindowDurationSec the window end is equal to arrivalEndTimestampSec",
			rowToVisitAcuityConverter: &rowToVisitAcuityConverter{
				arrivalStartTimestampSec:              sqltypes.ToValidNullInt64(arrivalStartTimestamp.Unix()),
				visitClinicalUrgencyWindowDurationSec: sql.NullInt64{},
				arrivalEndTimestampSec:                sqltypes.ToValidNullInt64(arrivalEndTimestamp.Unix()),
				visitClinicalUrgencyLevelID:           sqltypes.ToValidNullInt64(ClinicalUrgencyLevelEnumToID[clinicalUrgencyLevelHigh]),
			},
			want: &logisticspb.VisitAcuity{
				ClinicalUrgencyLevel: clinicalUrgencyLevelHigh,
				ClinicalUrgencyWindow: &commonpb.TimeWindow{
					StartDatetime: TimeToProtoDateTime(&arrivalStartTimestamp),
					EndDatetime:   TimeToProtoDateTime(&arrivalEndTimestamp),
				},
			},
		},
		{
			name: "with null visitClinicalUrgencyLevelID the result is nil",
			rowToVisitAcuityConverter: &rowToVisitAcuityConverter{
				visitClinicalUrgencyLevelID: sql.NullInt64{},
			},
			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := tc.rowToVisitAcuityConverter.toVisitAcuity()
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

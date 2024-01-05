package clinicalkpiconv

import (
	"database/sql"
	"testing"
	"time"

	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestProviderShiftSQLToProto(t *testing.T) {
	timeNow := time.Now()
	date := &common.Date{
		Year:  int32(timeNow.Year()),
		Month: int32(timeNow.Month()),
		Day:   int32(timeNow.Day()),
	}
	timeOfDay := &common.TimeOfDay{
		Hours:   int32(timeNow.Hour()),
		Minutes: int32(timeNow.Minute()),
		Seconds: int32(timeNow.Second()),
		Nanos:   int32(timeNow.Nanosecond()),
	}

	tcs := []struct {
		name  string
		input *clinicalkpisql.GetProviderShiftsRow

		want    *clinicalkpipb.ProviderShift
		wantErr bool
	}{
		{
			name: "should parse all shift fields",
			input: &clinicalkpisql.GetProviderShiftsRow{
				ID:                        1,
				ShiftTeamID:               2,
				ProviderID:                3,
				ServiceDate:               timeNow,
				StartTime:                 timeNow,
				EndTime:                   timeNow,
				PatientsSeen:              sql.NullInt32{Valid: true, Int32: 4},
				OutTheDoorDurationSeconds: sql.NullInt32{Valid: true, Int32: 5},
				EnRouteDurationSeconds:    sql.NullInt32{Valid: true, Int32: 6},
				OnSceneDurationSeconds:    sql.NullInt32{Valid: true, Int32: 7},
				OnBreakDurationSeconds:    sql.NullInt32{Valid: true, Int32: 8},
				IdleDurationSeconds:       sql.NullInt32{Valid: true, Int32: 9},
				CreatedAt:                 timeNow,
			},

			want: &clinicalkpipb.ProviderShift{
				ShiftTeamId:               2,
				ProviderId:                3,
				ServiceDate:               date,
				StartTime:                 timeOfDay,
				EndTime:                   timeOfDay,
				PatientsSeen:              proto.Int32(4),
				OutTheDoorDurationSeconds: proto.Int32(5),
				EnRouteDurationSeconds:    proto.Int32(6),
				OnSceneDurationSeconds:    proto.Int32(7),
				OnBreakDurationSeconds:    proto.Int32(8),
				IdleDurationSeconds:       proto.Int32(9),
			},
		},
		{
			name: "should parse partial shift struct",
			input: &clinicalkpisql.GetProviderShiftsRow{
				ID:          1,
				ShiftTeamID: 2,
				ProviderID:  3,
				ServiceDate: timeNow,
				StartTime:   timeNow,
				EndTime:     timeNow,
			},

			want: &clinicalkpipb.ProviderShift{
				ShiftTeamId: 2,
				ProviderId:  3,
				ServiceDate: date,
				StartTime:   timeOfDay,
				EndTime:     timeOfDay,
			},
		},
		{
			name:  "should return empty struct if there is nil shift",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := ProviderShiftSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestMarketMetricsSQLToProto(t *testing.T) {
	tcs := []struct {
		desc  string
		input *clinicalkpisql.GetMarketMetricsRow

		want    *clinicalkpipb.MarketMetrics
		wantErr bool
	}{
		{
			desc: "should parse all metrics",
			input: &clinicalkpisql.GetMarketMetricsRow{
				MarketID:                     1,
				OnSceneTimeMedianSeconds:     sql.NullInt32{Valid: true, Int32: 2},
				OnSceneTimeWeekChangeSeconds: sql.NullInt32{Valid: true, Int32: 3},
				ChartClosureRate:             sql.NullFloat64{Valid: true, Float64: 4},
				ChartClosureRateWeekChange:   sql.NullFloat64{Valid: true, Float64: 5},
				SurveyCaptureRate:            sql.NullFloat64{Valid: true, Float64: 6},
				SurveyCaptureRateWeekChange:  sql.NullFloat64{Valid: true, Float64: 7},
				NetPromoterScoreAverage:      sql.NullFloat64{Valid: true, Float64: 8},
				NetPromoterScoreWeekChange:   sql.NullFloat64{Valid: true, Float64: 9},
			},

			want: &clinicalkpipb.MarketMetrics{
				MarketId:                     1,
				OnSceneTimeMedianSeconds:     proto.Int32(2),
				OnSceneTimeWeekChangeSeconds: proto.Int32(3),
				ChartClosureRate:             proto.Float64(4),
				ChartClosureRateWeekChange:   proto.Float64(5),
				SurveyCaptureRate:            proto.Float64(6),
				SurveyCaptureRateWeekChange:  proto.Float64(7),
				NetPromoterScoreAverage:      proto.Float64(8),
				NetPromoterScoreWeekChange:   proto.Float64(9),
			},
		},
		{
			desc: "should parse partial metrics struct",
			input: &clinicalkpisql.GetMarketMetricsRow{
				MarketID: 1,
			},

			want: &clinicalkpipb.MarketMetrics{
				MarketId: 1,
			},
		},
		{
			desc: "should return empty struct if market id is 0",
			input: &clinicalkpisql.GetMarketMetricsRow{
				MarketID: 0,
			},

			want: nil,
		},
		{
			desc:  "should return empty struct if there is no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := MarketMetricsSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestMarketMetricsMarketSQLToProto(t *testing.T) {
	tcs := []struct {
		desc  string
		input *clinicalkpisql.GetMarketMetricsRow

		want    *clinicalkpipb.Market
		wantErr bool
	}{
		{
			desc: "should parse all metrics",
			input: &clinicalkpisql.GetMarketMetricsRow{
				MarketID:        1,
				MarketName:      sql.NullString{Valid: true, String: "Denver"},
				MarketShortName: sql.NullString{Valid: true, String: "DEN"},
			},

			want: &clinicalkpipb.Market{
				Id:        1,
				Name:      "Denver",
				ShortName: "DEN",
			},
		},
		{
			desc: "should return empty struct if market id is 0",
			input: &clinicalkpisql.GetMarketMetricsRow{
				MarketID:        0,
				MarketName:      sql.NullString{Valid: true, String: "Denver"},
				MarketShortName: sql.NullString{Valid: true, String: "DEN"},
			},

			want: nil,
		},
		{
			desc:  "should return empty struct if there is no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := MarketMetricsMarketSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestMarketSQLToProto(t *testing.T) {
	tcs := []struct {
		desc  string
		input *clinicalkpisql.Market

		want    *clinicalkpipb.Market
		wantErr bool
	}{
		{
			desc: "should parse all market fields",
			input: &clinicalkpisql.Market{
				MarketID:  1,
				Name:      "Denver",
				ShortName: sqltypes.ToNullString(proto.String("DEN")),
			},

			want: &clinicalkpipb.Market{
				Id:        1,
				Name:      "Denver",
				ShortName: "DEN",
			},
		},
		{
			desc: "should parse partial object",
			input: &clinicalkpisql.Market{
				MarketID: 1,
				Name:     "Denver",
			},

			want: &clinicalkpipb.Market{
				Id:   1,
				Name: "Denver",
			},
		},
		{
			desc: "should return empty struct if market id is 0",
			input: &clinicalkpisql.Market{
				MarketID:  0,
				Name:      "Denver",
				ShortName: sqltypes.ToNullString(proto.String("DEN")),
			},

			want: nil,
		},
		{
			desc:  "should return empty struct if there is no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := MarketSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestProviderOverallMetricsSQLToProto(t *testing.T) {
	tcs := []struct {
		desc  string
		input *clinicalkpisql.GetProviderMetricsRow

		want    *clinicalkpipb.OverallProviderMetrics
		wantErr bool
	}{
		{
			desc: "should parse all metrics",
			input: &clinicalkpisql.GetProviderMetricsRow{
				ProviderID:               1,
				OnSceneTimeMedianSeconds: sqltypes.ToValidNullInt32(2),
				ChartClosureRate:         sqltypes.ToValidNullFloat64(3),
				SurveyCaptureRate:        sqltypes.ToValidNullFloat64(4),
				NetPromoterScoreAverage:  sqltypes.ToValidNullFloat64(5),
				OnTaskPercent:            sqltypes.ToValidNullFloat64(6),
				EscalationRate:           sqltypes.ToValidNullFloat64(7),
				AbxPrescribingRate:       sqltypes.ToValidNullFloat64(8),
				Provider: clinicalkpisql.Provider{
					ProviderID: 1,
					FirstName:  "John",
					LastName:   "Doe",
					AvatarUrl:  sqltypes.ToNullString(proto.String("URL")),
					JobTitle:   "APP",
				},
			},

			want: &clinicalkpipb.OverallProviderMetrics{
				ProviderId:               1,
				OnSceneTimeMedianSeconds: proto.Int32(2),
				ChartClosureRate:         proto.Float64(3),
				SurveyCaptureRate:        proto.Float64(4),
				NetPromoterScoreAverage:  proto.Float64(5),
				OnTaskPercent:            proto.Float64(6),
				EscalationRate:           proto.Float64(7),
				AbxPrescribingRate:       proto.Float64(8),
				Provider: &clinicalkpipb.Provider{
					Id:        1,
					FirstName: "John",
					LastName:  "Doe",
					AvatarUrl: proto.String("URL"),
					Profile: &clinicalkpipb.ProviderProfile{
						Position: "APP",
					},
				},
			},
		},
		{
			desc: "should parse partial metrics struct",
			input: &clinicalkpisql.GetProviderMetricsRow{
				ProviderID: 1,
			},

			want: &clinicalkpipb.OverallProviderMetrics{
				ProviderId: 1,
			},
		},
		{
			desc:  "should return empty struct if there are no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := ProviderOverallMetricsSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestProviderVisitSQLToProto(t *testing.T) {
	now := time.Now()
	serviceDate := &common.Date{
		Year:  int32(now.Year()),
		Month: int32(now.Month()),
		Day:   int32(now.Day()),
	}

	tcs := []struct {
		desc  string
		input *clinicalkpisql.ProviderVisit

		want    *clinicalkpipb.ProviderVisit
		wantErr bool
	}{
		{
			desc: "should parse all visit fields",
			input: &clinicalkpisql.ProviderVisit{
				CareRequestID:    1,
				ProviderID:       2,
				PatientFirstName: "John",
				PatientLastName:  "Doe",
				PatientAthenaID:  "123456",
				ServiceDate:      now,
				ChiefComplaint:   sql.NullString{Valid: true, String: "Complaint"},
				Diagnosis:        sql.NullString{Valid: true, String: "Diagnosis"},
				IsAbxPrescribed:  true,
				AbxDetails:       sql.NullString{Valid: true, String: "ABX details"},
				IsEscalated:      true,
				EscalatedReason:  sql.NullString{Valid: true, String: "Reason of escalation"},
				CreatedAt:        now,
			},

			want: &clinicalkpipb.ProviderVisit{
				CareRequestId:    1,
				ProviderId:       2,
				PatientFirstName: "John",
				PatientLastName:  "Doe",
				PatientAthenaId:  "123456",
				ServiceDate:      serviceDate,
				ChiefComplaint:   proto.String("Complaint"),
				Diagnosis:        proto.String("Diagnosis"),
				IsAbxPrescribed:  true,
				AbxDetails:       proto.String("ABX details"),
				IsEscalated:      true,
				EscalatedReason:  proto.String("Reason of escalation"),
			},
		},
		{
			desc: "should parse partial visit struct",
			input: &clinicalkpisql.ProviderVisit{
				ProviderID:  1,
				ServiceDate: now,
			},

			want: &clinicalkpipb.ProviderVisit{
				ProviderId:  1,
				ServiceDate: serviceDate,
			},
		},
		{
			desc:  "should return empty struct if there is nil visit",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := ProviderVisitSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestMarketProviderMetricsListItemSQLToProto(t *testing.T) {
	createdAt := time.Now()
	id := time.Now().UnixNano()
	avatarURL := "url"
	numericValue, _ := pgtypes.BuildNumeric(int32(5))

	tcs := []struct {
		name  string
		input *clinicalkpisql.GetProvidersMetricsByMarketRow

		want    *clinicalkpipb.MarketProviderMetricsListItem
		wantErr bool
	}{
		{
			name: "should parse all metrics",
			input: &clinicalkpisql.GetProvidersMetricsByMarketRow{
				ProviderID:                   1,
				MarketID:                     2,
				OnSceneTimeMedianSeconds:     sql.NullInt32{Int32: 3, Valid: true},
				OnSceneTimeWeekChangeSeconds: sql.NullInt32{Int32: 4, Valid: true},
				ChartClosureRate:             numericValue,
				ChartClosureRateWeekChange:   numericValue,
				SurveyCaptureRate:            numericValue,
				SurveyCaptureRateWeekChange:  numericValue,
				NetPromoterScoreAverage:      numericValue,
				NetPromoterScoreWeekChange:   numericValue,
				OnTaskPercent:                numericValue,
				OnTaskPercentWeekChange:      numericValue,
				OnSceneTimeRank:              6,
				ChartClosureRateRank:         7,
				SurveyCaptureRateRank:        8,
				NetPromoterScoreRank:         9,
				OnTaskPercentRank:            10,
				Provider: clinicalkpisql.Provider{
					ID:         id + 2,
					ProviderID: 1,
					FirstName:  "Ben",
					LastName:   "Sahar",
					AvatarUrl:  sql.NullString{String: avatarURL, Valid: true},
					JobTitle:   "app",
					CreatedAt:  createdAt,
				},
				Count: 1,
			},

			want: &clinicalkpipb.MarketProviderMetricsListItem{
				ProviderId:                   1,
				MarketId:                     2,
				OnSceneTimeMedianSeconds:     proto.Int32(3),
				OnSceneTimeWeekChangeSeconds: proto.Int32(4),
				OnSceneTimeRank:              proto.Int64(6),
				ChartClosureRate:             proto.Float64(5),
				ChartClosureRateWeekChange:   proto.Float64(5),
				ChartClosureRateRank:         proto.Int64(7),
				SurveyCaptureRate:            proto.Float64(5),
				SurveyCaptureRateWeekChange:  proto.Float64(5),
				SurveyCaptureRateRank:        proto.Int64(8),
				NetPromoterScoreAverage:      proto.Float64(5),
				NetPromoterScoreWeekChange:   proto.Float64(5),
				NetPromoterScoreRank:         proto.Int64(9),
				OnTaskPercent:                proto.Float64(5),
				OnTaskPercentWeekChange:      proto.Float64(5),
				OnTaskPercentRank:            proto.Int64(10),
				Provider: &clinicalkpipb.Provider{
					Id:        1,
					FirstName: "Ben",
					LastName:  "Sahar",
					AvatarUrl: &avatarURL,
					Profile: &clinicalkpipb.ProviderProfile{
						Position:    "app",
						Credentials: "",
					},
				},
			},
		},
		{
			name: "should parse partial metrics struct",
			input: &clinicalkpisql.GetProvidersMetricsByMarketRow{
				ProviderID: 1,
				MarketID:   2,
				Provider: clinicalkpisql.Provider{
					ID:         id + 2,
					ProviderID: 1,
					FirstName:  "Ben",
					LastName:   "Sahar",
					AvatarUrl:  sql.NullString{String: avatarURL, Valid: true},
					JobTitle:   "app",
					CreatedAt:  createdAt,
				},
				Count: 1,
			},

			want: &clinicalkpipb.MarketProviderMetricsListItem{
				ProviderId: 1,
				MarketId:   2,
				Provider: &clinicalkpipb.Provider{
					Id:        1,
					FirstName: "Ben",
					LastName:  "Sahar",
					AvatarUrl: &avatarURL,
					Profile: &clinicalkpipb.ProviderProfile{
						Position:    "app",
						Credentials: "",
					},
				},
			},
		},
		{
			name:  "should return empty struct if there is no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := MarketProviderMetricsListItemSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestMarketProviderMetricsSQLToProto(t *testing.T) {
	numericValue, _ := pgtypes.BuildNumeric(int32(5))

	tcs := []struct {
		desc  string
		input *clinicalkpisql.GetProviderMetricsByMarketRow

		want    *clinicalkpipb.MarketProviderMetrics
		wantErr bool
	}{
		{
			desc: "should parse all metrics",
			input: &clinicalkpisql.GetProviderMetricsByMarketRow{
				ProviderID:                   1,
				MarketID:                     2,
				OnSceneTimeMedianSeconds:     sql.NullInt32{Valid: true, Int32: 3},
				OnSceneTimeWeekChangeSeconds: sql.NullInt32{Valid: true, Int32: 4},
				ChartClosureRate:             numericValue,
				ChartClosureRateWeekChange:   numericValue,
				SurveyCaptureRate:            numericValue,
				SurveyCaptureRateWeekChange:  numericValue,
				NetPromoterScoreAverage:      numericValue,
				NetPromoterScoreWeekChange:   numericValue,
				OnTaskPercent:                numericValue,
				OnTaskPercentWeekChange:      numericValue,
				ProviderID_2:                 6,
				OnSceneTimeRank:              7,
				ChartClosureRateRank:         8,
				SurveyCaptureRateRank:        9,
				NetPromoterScoreRank:         10,
				OnTaskPercentRank:            11,
				TotalProviders:               20,
			},

			want: &clinicalkpipb.MarketProviderMetrics{
				ProviderId:                   1,
				MarketId:                     2,
				OnSceneTimeMedianSeconds:     proto.Int32(3),
				OnSceneTimeWeekChangeSeconds: proto.Int32(4),
				OnSceneTimeRank:              proto.Int64(7),
				ChartClosureRate:             proto.Float64(5),
				ChartClosureRateWeekChange:   proto.Float64(5),
				ChartClosureRateRank:         proto.Int64(8),
				SurveyCaptureRate:            proto.Float64(5),
				SurveyCaptureRateWeekChange:  proto.Float64(5),
				SurveyCaptureRateRank:        proto.Int64(9),
				NetPromoterScoreAverage:      proto.Float64(5),
				NetPromoterScoreWeekChange:   proto.Float64(5),
				NetPromoterScoreRank:         proto.Int64(10),
				OnTaskPercent:                proto.Float64(5),
				OnTaskPercentWeekChange:      proto.Float64(5),
				OnTaskPercentRank:            proto.Int64(11),
				TotalProviders:               20,
			},
		},
		{
			desc: "should parse partial metrics struct",
			input: &clinicalkpisql.GetProviderMetricsByMarketRow{
				ProviderID: 1,
				MarketID:   2,
			},

			want: &clinicalkpipb.MarketProviderMetrics{
				ProviderId: 1,
				MarketId:   2,
			},
		},
		{
			desc: "should return empty struct if provider id is 0",
			input: &clinicalkpisql.GetProviderMetricsByMarketRow{
				ProviderID: 0,
				MarketID:   2,
			},

			want: nil,
		},
		{
			desc: "should return empty struct if market id is 0",
			input: &clinicalkpisql.GetProviderMetricsByMarketRow{
				ProviderID: 1,
				MarketID:   0,
			},

			want: nil,
		},
		{
			desc:  "should return empty struct if there is no metrics",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := MarketProviderMetricsSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestShiftSnapshotsSQLToProto(t *testing.T) {
	timeNow := time.Now()
	timeOfDay := timestamppb.New(timeNow)

	tcs := []struct {
		desc  string
		input *clinicalkpisql.GetShiftSnapshotsRow

		want    *clinicalkpipb.ShiftSnapshot
		wantErr bool
	}{
		{
			desc: "should parse all shift snapshot fields",
			input: &clinicalkpisql.GetShiftSnapshotsRow{
				ID:                       1,
				ShiftTeamID:              2,
				StartTimestamp:           timeNow,
				EndTimestamp:             timeNow,
				ShiftSnapshotPhaseTypeID: 3,
				LatitudeE6:               sqltypes.ToValidNullInt32(4),
				LongitudeE6:              sqltypes.ToValidNullInt32(5),
				CreatedAt:                timeNow,
				Phase:                    sqltypes.ToValidNullString("on_scene"),
			},

			want: &clinicalkpipb.ShiftSnapshot{
				ShiftTeamId:    proto.Int64(2),
				StartTimestamp: timeOfDay,
				EndTimestamp:   timeOfDay,
				Phase:          "on_scene",
				LatitudeE6:     proto.Int32(4),
				LongitudeE6:    proto.Int32(5),
			},
		},
		{
			desc: "should parse partial shift snapshot struct",
			input: &clinicalkpisql.GetShiftSnapshotsRow{
				ID:             1,
				ShiftTeamID:    2,
				StartTimestamp: timeNow,
				EndTimestamp:   timeNow,
			},

			want: &clinicalkpipb.ShiftSnapshot{
				ShiftTeamId:    proto.Int64(2),
				StartTimestamp: timeOfDay,
				EndTimestamp:   timeOfDay,
			},
		},
		{
			desc:  "should return empty struct if there is nil shift snapshot",
			input: nil,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := ShiftSnapshotsSQLToProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

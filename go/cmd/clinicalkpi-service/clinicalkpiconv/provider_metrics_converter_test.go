package clinicalkpiconv

import (
	"database/sql"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestProviderMetricsSQLToProto(t *testing.T) {
	score, _ := pgtypes.BuildNumeric(123)
	scoreChange, _ := pgtypes.BuildNumeric(66.6)
	rate, _ := pgtypes.BuildNumeric(66.6)
	rateChange, _ := pgtypes.BuildNumeric(66.6)
	ccls := int32(time.Now().UnixNano())
	onSceneTimeSecs := sqltypes.ToValidNullInt32(int32(40 * 60))
	onSceneTimeSecsChange := sqltypes.ToValidNullInt32(int32(5*60) - onSceneTimeSecs.Int32)
	lastCareRequestCompletedAt := sqltypes.ToValidNullTime(time.Now())
	createdAt := time.Now()
	updatedAt := createdAt.AddDate(0, 0, 1)
	changeDays := int32(7)
	nilNumeric, _ := pgtypes.BuildNumeric(nil)
	completedCareRequestsThreshold := int32(80)
	type args struct {
		metric                         *clinicalkpisql.CalculatedProviderMetric
		completedCareRequestsThreshold int32
	}

	tcs := []struct {
		name  string
		input args

		want    *clinicalkpipb.MetricsData
		wantErr bool
	}{
		{
			name: "success: should parse the metrics query results",
			input: args{
				metric: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         time.Now().UnixNano(),
					CareRequestsCompletedLastSevenDays: ccls,
					AverageNetPromoterScore:            score,
					AverageNetPromoterScoreChange:      scoreChange,
					ChartClosureRate:                   rate,
					ChartClosureRateChange:             rateChange,
					SurveyCaptureRate:                  rate,
					SurveyCaptureRateChange:            rateChange,
					MedianOnSceneTimeSecs:              onSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        onSceneTimeSecsChange,
					ChangeDays:                         changeDays,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              completedCareRequestsThreshold,
					CreatedAt:                          createdAt,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				completedCareRequestsThreshold: completedCareRequestsThreshold,
			},

			want: &clinicalkpipb.MetricsData{
				CareRequestsCompletedLastSevenDays: proto.Int32(ccls),
				AverageNetPromoterScore:            proto.Float64(123),
				AverageNetPromoterScoreChange:      proto.Float64(66.6),
				ChartClosureRate:                   proto.Float64(66.6),
				ChartClosureRateChange:             proto.Float64(66.6),
				SurveyCaptureRate:                  proto.Float64(66.6),
				SurveyCaptureRateChange:            proto.Float64(66.6),
				MedianOnSceneTimeSecs:              sqltypes.ToProtoInt32(onSceneTimeSecs),
				MedianOnSceneTimeSecsChange:        sqltypes.ToProtoInt32(onSceneTimeSecsChange),
				ChangeDays:                         proto.Int32(changeDays),
				LastCareRequestCompletedAt:         sqltypes.ToProtoTimestamp(lastCareRequestCompletedAt),
				CompletedCareRequests:              &completedCareRequestsThreshold,
				CreatedAt:                          protoconv.TimeToProtoTimestamp(&createdAt),
				UpdatedAt:                          protoconv.TimeToProtoTimestamp(&updatedAt),
				Status:                             clinicalkpipb.MetricsData_STATUS_OK,
			},
		},
		{
			name: "success: should support null values",
			input: args{
				metric: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         time.Now().UnixNano(),
					CareRequestsCompletedLastSevenDays: ccls,
					AverageNetPromoterScore:            score,
					AverageNetPromoterScoreChange:      scoreChange,
					ChartClosureRate:                   nilNumeric,
					ChartClosureRateChange:             nilNumeric,
					SurveyCaptureRate:                  nilNumeric,
					SurveyCaptureRateChange:            nilNumeric,
					MedianOnSceneTimeSecs:              sqltypes.ToNullInt32(nil),
					MedianOnSceneTimeSecsChange:        sqltypes.ToNullInt32(nil),
					ChangeDays:                         changeDays,
					LastCareRequestCompletedAt:         sqltypes.StringToNullTime(nil),
					CompletedCareRequests:              completedCareRequestsThreshold,
					CreatedAt:                          createdAt,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				completedCareRequestsThreshold: completedCareRequestsThreshold,
			},

			want: &clinicalkpipb.MetricsData{
				CareRequestsCompletedLastSevenDays: proto.Int32(ccls),
				AverageNetPromoterScore:            proto.Float64(123),
				AverageNetPromoterScoreChange:      proto.Float64(66.6),
				ChartClosureRate:                   nil,
				ChartClosureRateChange:             nil,
				SurveyCaptureRate:                  nil,
				SurveyCaptureRateChange:            nil,
				MedianOnSceneTimeSecs:              nil,
				MedianOnSceneTimeSecsChange:        nil,
				ChangeDays:                         proto.Int32(changeDays),
				LastCareRequestCompletedAt:         nil,
				CompletedCareRequests:              &completedCareRequestsThreshold,
				CreatedAt:                          protoconv.TimeToProtoTimestamp(&createdAt),
				UpdatedAt:                          protoconv.TimeToProtoTimestamp(&updatedAt),
				Status:                             clinicalkpipb.MetricsData_STATUS_OK,
			},
		},
		{
			name: "success: should support completed care requests threshold",
			input: args{
				metric: &clinicalkpisql.CalculatedProviderMetric{
					ProviderID:                         time.Now().UnixNano(),
					CareRequestsCompletedLastSevenDays: ccls,
					AverageNetPromoterScore:            score,
					AverageNetPromoterScoreChange:      scoreChange,
					ChartClosureRate:                   rate,
					ChartClosureRateChange:             rateChange,
					SurveyCaptureRate:                  rate,
					SurveyCaptureRateChange:            rateChange,
					MedianOnSceneTimeSecs:              onSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        onSceneTimeSecsChange,
					ChangeDays:                         changeDays,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              completedCareRequestsThreshold - 1,
					CreatedAt:                          createdAt,
					UpdatedAt:                          sqltypes.ToValidNullTime(updatedAt),
				},
				completedCareRequestsThreshold: completedCareRequestsThreshold,
			},

			want: &clinicalkpipb.MetricsData{
				CareRequestsCompletedLastSevenDays: proto.Int32(ccls),
				AverageNetPromoterScore:            nil,
				AverageNetPromoterScoreChange:      nil,
				ChartClosureRate:                   nil,
				ChartClosureRateChange:             nil,
				SurveyCaptureRate:                  nil,
				SurveyCaptureRateChange:            nil,
				MedianOnSceneTimeSecs:              nil,
				MedianOnSceneTimeSecsChange:        nil,
				ChangeDays:                         proto.Int32(changeDays),
				LastCareRequestCompletedAt:         sqltypes.ToProtoTimestamp(lastCareRequestCompletedAt),
				CompletedCareRequests:              proto.Int32(completedCareRequestsThreshold - 1),
				CreatedAt:                          protoconv.TimeToProtoTimestamp(&createdAt),
				UpdatedAt:                          protoconv.TimeToProtoTimestamp(&updatedAt),
				Status:                             clinicalkpipb.MetricsData_STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS,
				ErrorMessage:                       proto.String(NotEnoughCompletedCareRequestsErrMsg),
			},
		},
		{
			name: "success: should support nil metric",
			input: args{
				metric:                         nil,
				completedCareRequestsThreshold: completedCareRequestsThreshold,
			},

			want: &clinicalkpipb.MetricsData{
				Status:       clinicalkpipb.MetricsData_STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS,
				ErrorMessage: proto.String(NotEnoughCompletedCareRequestsErrMsg),
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := ProviderMetricsSQLToProto(tc.input.metric, tc.input.completedCareRequestsThreshold)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestProviderDailyMetricsWithMarketAveragesRowsSQLToLookBackMetricsListProto(t *testing.T) {
	averagePatientsSeen, _ := pgtypes.BuildNumeric(7.3)
	averageOnShiftDurationSeconds, _ := pgtypes.BuildNumeric(32400)

	today := TimestampToDate(time.Now())

	type args struct {
		providerDailyMetrics []*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow
	}

	tcs := []struct {
		desc  string
		input args

		want []*clinicalkpipb.LookBackMetrics
	}{
		{
			desc: "should convert to proto",
			input: args{
				providerDailyMetrics: []*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
					{
						ProviderID:                               1,
						ServiceDate:                              today,
						MarketGroupID:                            1,
						MarketGroupName:                          "Dallas",
						PatientsSeen:                             7,
						MarketGroupAveragePatientsSeen:           averagePatientsSeen,
						MarketGroupAverageOnShiftDurationSeconds: averageOnShiftDurationSeconds,
					},
				},
			},

			want: []*clinicalkpipb.LookBackMetrics{
				{
					ServiceDate:                   protoconv.TimeToProtoDate(&today),
					ProviderPatientsSeen:          proto.Int32(7),
					MarketGroupId:                 proto.Int64(1),
					MarketGroupName:               proto.String("Dallas"),
					AveragePatientsSeen:           proto.Float64(7.3),
					AverageOnShiftDurationSeconds: proto.Float64(32400),
				},
			},
		},
		{
			desc: "should support nil metrics",
			input: args{
				providerDailyMetrics: nil,
			},

			want: []*clinicalkpipb.LookBackMetrics{},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := ProviderDailyMetricsWithMarketAveragesRowsSQLToLookBackMetricsListProto(tc.input.providerDailyMetrics)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestLastProviderShiftSnapshotsSQLToBreakdownProto(t *testing.T) {
	now := time.Now()
	today := TimestampToDate(now)
	providerID := int64(1)
	enRouteStartTime := today.Add(8 * time.Hour)
	enRouteEndTime := now.Add(30 * time.Minute)
	onSceneStartTime := enRouteEndTime.Add(2 * time.Minute)
	onSceneEndTime := onSceneStartTime.Add(40 * time.Minute)
	onBreakStartTime := onSceneEndTime.Add(1 * time.Minute)
	onBreakEndTime := onBreakStartTime.Add(30 * time.Minute)
	enRoute2StartTime := onBreakEndTime.Add(2 * time.Minute)
	enRoute2EndTime := enRoute2StartTime.Add(20 * time.Minute)
	onScene2StartTime := enRoute2EndTime.Add(2 * time.Minute)
	onScene2EndTime := onScene2StartTime.Add(40 * time.Minute)

	generateLastProviderShiftSnapshotsRow := func(phaseShortName clinicalkpidb.ShiftSnapshotPhaseShortName, startTime time.Time, endTime time.Time) *clinicalkpisql.GetLastShiftSnapshotsRow {
		phase := phaseShortName.String()
		return &clinicalkpisql.GetLastShiftSnapshotsRow{
			ProviderID:     providerID,
			ServiceDate:    today,
			Phase:          sqltypes.ToNullString(&phase),
			StartTimestamp: startTime,
			EndTimestamp:   endTime,
			CreatedAt:      now,
		}
	}

	tcs := []struct {
		desc  string
		input []*clinicalkpisql.GetLastShiftSnapshotsRow

		want *clinicalkpipb.Breakdown
	}{
		{
			desc: "should convert to proto",
			input: []*clinicalkpisql.GetLastShiftSnapshotsRow{
				generateLastProviderShiftSnapshotsRow(clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute, enRouteStartTime, enRouteEndTime),
				generateLastProviderShiftSnapshotsRow(clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene, onSceneStartTime, onSceneEndTime),
				generateLastProviderShiftSnapshotsRow(clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak, onBreakStartTime, onBreakEndTime),
				generateLastProviderShiftSnapshotsRow(clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute, enRoute2StartTime, enRoute2EndTime),
				generateLastProviderShiftSnapshotsRow(clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene, onScene2StartTime, onScene2EndTime),
			},

			want: &clinicalkpipb.Breakdown{
				ServiceDate: protoconv.TimeToProtoDate(&now),
				Snapshots: []*clinicalkpipb.Snapshot{
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_EN_ROUTE,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&enRouteStartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&enRouteEndTime),
					},
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_ON_SCENE,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&onSceneStartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&onSceneEndTime),
					},
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_ON_BREAK,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&onBreakStartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&onBreakEndTime),
					},
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_EN_ROUTE,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&enRoute2StartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&enRoute2EndTime),
					},
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_ON_SCENE,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&onScene2StartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&onScene2EndTime),
					},
				},
			},
		},
		{
			desc: "should return unspecified phase",
			input: []*clinicalkpisql.GetLastShiftSnapshotsRow{
				generateLastProviderShiftSnapshotsRow("on_route", enRouteStartTime, enRouteEndTime),
			},

			want: &clinicalkpipb.Breakdown{
				ServiceDate: protoconv.TimeToProtoDate(&now),
				Snapshots: []*clinicalkpipb.Snapshot{
					{
						Phase:          clinicalkpipb.Snapshot_PHASE_UNSPECIFIED,
						StartTimestamp: protoconv.TimeToProtoTimestamp(&enRouteStartTime),
						EndTimestamp:   protoconv.TimeToProtoTimestamp(&enRouteEndTime),
					},
				},
			},
		},
		{
			desc:  "should support nil shift snapshots",
			input: nil,

			want: &clinicalkpipb.Breakdown{},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := LastProviderShiftSnapshotsSQLToBreakdownProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestPhaseToSnapshotPhaseProto(t *testing.T) {
	unknownShortName := "unknown"
	enRouteShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute.String()
	onSceneShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene.String()
	onBreakShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak.String()

	tcs := []struct {
		desc  string
		input sql.NullString

		want clinicalkpipb.Snapshot_Phase
	}{
		{
			desc:  "should return proto en_route phase",
			input: sqltypes.ToNullString(&enRouteShortName),

			want: clinicalkpipb.Snapshot_PHASE_EN_ROUTE,
		},
		{
			desc:  "should return proto on_scene phase",
			input: sqltypes.ToNullString(&onSceneShortName),

			want: clinicalkpipb.Snapshot_PHASE_ON_SCENE,
		},
		{
			desc:  "should return proto on_break phase",
			input: sqltypes.ToNullString(&onBreakShortName),

			want: clinicalkpipb.Snapshot_PHASE_ON_BREAK,
		},
		{
			desc:  "should return proto unspecified phase",
			input: sqltypes.ToNullString(&unknownShortName),

			want: clinicalkpipb.Snapshot_PHASE_UNSPECIFIED,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := PhaseToSnapshotPhaseProto(tc.input)
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

package clinicalkpiconv

import (
	"database/sql"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"google.golang.org/protobuf/proto"
)

const (
	NotEnoughCompletedCareRequestsErrMsg = `There aren't enough completed visits to calculate your performance metrics.`
)

var (
	ShiftSnapshotPhaseTypeShortNameToProtoEnum = map[clinicalkpidb.ShiftSnapshotPhaseShortName]clinicalkpipb.Snapshot_Phase{
		clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute: clinicalkpipb.Snapshot_PHASE_EN_ROUTE,
		clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene: clinicalkpipb.Snapshot_PHASE_ON_SCENE,
		clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak: clinicalkpipb.Snapshot_PHASE_ON_BREAK,
	}
)

func ProviderMetricsSQLToProto(metric *clinicalkpisql.CalculatedProviderMetric, completedCareRequestsThreshold int32) *clinicalkpipb.MetricsData {
	if metric == nil {
		return &clinicalkpipb.MetricsData{
			Status:       clinicalkpipb.MetricsData_STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS,
			ErrorMessage: proto.String(NotEnoughCompletedCareRequestsErrMsg),
		}
	}

	result := &clinicalkpipb.MetricsData{
		CareRequestsCompletedLastSevenDays: proto.Int32(metric.CareRequestsCompletedLastSevenDays),
		ChangeDays:                         proto.Int32(metric.ChangeDays),
		CompletedCareRequests:              proto.Int32(metric.CompletedCareRequests),
		CreatedAt:                          protoconv.TimeToProtoTimestamp(&metric.CreatedAt),
		UpdatedAt:                          sqltypes.ToProtoTimestamp(metric.UpdatedAt),
		Status:                             clinicalkpipb.MetricsData_STATUS_OK,
	}

	if metric.LastCareRequestCompletedAt.Valid {
		result.LastCareRequestCompletedAt = protoconv.TimeToProtoTimestamp(&metric.LastCareRequestCompletedAt.Time)
	}

	if metric.CompletedCareRequests >= completedCareRequestsThreshold {
		result.AverageNetPromoterScore = pgtypes.NumericToProtoFloat64(metric.AverageNetPromoterScore)
		result.AverageNetPromoterScoreChange = pgtypes.NumericToProtoFloat64(metric.AverageNetPromoterScoreChange)
		result.ChartClosureRate = pgtypes.NumericToProtoFloat64(metric.ChartClosureRate)
		result.ChartClosureRateChange = pgtypes.NumericToProtoFloat64(metric.ChartClosureRateChange)
		result.SurveyCaptureRate = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRate)
		result.SurveyCaptureRateChange = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRateChange)

		if metric.MedianOnSceneTimeSecs.Valid {
			result.MedianOnSceneTimeSecs = &metric.MedianOnSceneTimeSecs.Int32
		}

		if metric.MedianOnSceneTimeSecsChange.Valid {
			result.MedianOnSceneTimeSecsChange = &metric.MedianOnSceneTimeSecsChange.Int32
		}
	} else {
		result.Status = clinicalkpipb.MetricsData_STATUS_NOT_ENOUGH_COMPLETED_CARE_REQUESTS
		result.ErrorMessage = proto.String(NotEnoughCompletedCareRequestsErrMsg)
	}

	return result
}

func ProviderDailyMetricsWithMarketAveragesRowsSQLToLookBackMetricsListProto(providerDailyMetrics []*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow) []*clinicalkpipb.LookBackMetrics {
	lookBackMetrics := make([]*clinicalkpipb.LookBackMetrics, len(providerDailyMetrics))

	for i, metric := range providerDailyMetrics {
		lookBackMetrics[i] = ProviderDailyMetricsWithMarketAveragesRowSQLToLookBackMetricsProto(metric)
	}

	return lookBackMetrics
}

func ProviderDailyMetricsWithMarketAveragesRowSQLToLookBackMetricsProto(providerDailyMetrics *clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow) *clinicalkpipb.LookBackMetrics {
	return &clinicalkpipb.LookBackMetrics{
		ServiceDate:                   protoconv.TimeToProtoDate(&providerDailyMetrics.ServiceDate),
		ProviderPatientsSeen:          proto.Int32(providerDailyMetrics.PatientsSeen),
		MarketGroupId:                 proto.Int64(providerDailyMetrics.MarketGroupID),
		MarketGroupName:               proto.String(providerDailyMetrics.MarketGroupName),
		AveragePatientsSeen:           pgtypes.NumericToProtoFloat64(providerDailyMetrics.MarketGroupAveragePatientsSeen),
		AverageOnShiftDurationSeconds: pgtypes.NumericToProtoFloat64(providerDailyMetrics.MarketGroupAverageOnShiftDurationSeconds),
	}
}

func LastProviderShiftSnapshotsSQLToBreakdownProto(providerShiftSnapshots []*clinicalkpisql.GetLastShiftSnapshotsRow) *clinicalkpipb.Breakdown {
	if len(providerShiftSnapshots) == 0 {
		return &clinicalkpipb.Breakdown{}
	}

	snapshots := make([]*clinicalkpipb.Snapshot, len(providerShiftSnapshots))
	for i, providerShiftSnapshot := range providerShiftSnapshots {
		snapshots[i] = &clinicalkpipb.Snapshot{
			Phase:          PhaseToSnapshotPhaseProto(providerShiftSnapshot.Phase),
			StartTimestamp: protoconv.TimeToProtoTimestamp(&providerShiftSnapshot.StartTimestamp),
			EndTimestamp:   protoconv.TimeToProtoTimestamp(&providerShiftSnapshot.EndTimestamp),
		}
	}

	return &clinicalkpipb.Breakdown{
		ServiceDate: protoconv.TimeToProtoDate(&providerShiftSnapshots[0].ServiceDate),
		Snapshots:   snapshots,
	}
}

func PhaseToSnapshotPhaseProto(phase sql.NullString) clinicalkpipb.Snapshot_Phase {
	if !phase.Valid {
		return clinicalkpipb.Snapshot_PHASE_UNSPECIFIED
	}

	phaseShortName := clinicalkpidb.ShiftSnapshotPhaseShortName(phase.String)
	snapshotPhase, ok := ShiftSnapshotPhaseTypeShortNameToProtoEnum[phaseShortName]
	if !ok {
		return clinicalkpipb.Snapshot_PHASE_UNSPECIFIED
	}

	return snapshotPhase
}

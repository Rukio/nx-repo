package clinicalkpiconv

import (
	"time"

	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TimestampToDate(timestamp time.Time) time.Time {
	return time.Date(timestamp.Year(), timestamp.Month(), timestamp.Day(), 0, 0, 0, 0, time.UTC)
}

func ProviderShiftSQLToProto(shift *clinicalkpisql.GetProviderShiftsRow) *clinicalkpipb.ProviderShift {
	if shift == nil {
		return nil
	}

	return &clinicalkpipb.ProviderShift{
		ShiftTeamId:               shift.ShiftTeamID,
		ProviderId:                shift.ProviderID,
		ServiceDate:               protoconv.TimeToProtoDate(&shift.ServiceDate),
		StartTime:                 protoconv.TimeToProtoTimeOfDay(&shift.StartTime),
		EndTime:                   protoconv.TimeToProtoTimeOfDay(&shift.EndTime),
		PatientsSeen:              sqltypes.ToProtoInt32(shift.PatientsSeen),
		OutTheDoorDurationSeconds: sqltypes.ToProtoInt32(shift.OutTheDoorDurationSeconds),
		EnRouteDurationSeconds:    sqltypes.ToProtoInt32(shift.EnRouteDurationSeconds),
		OnSceneDurationSeconds:    sqltypes.ToProtoInt32(shift.OnSceneDurationSeconds),
		OnBreakDurationSeconds:    sqltypes.ToProtoInt32(shift.OnBreakDurationSeconds),
		IdleDurationSeconds:       sqltypes.ToProtoInt32(shift.IdleDurationSeconds),
	}
}

func MarketMetricsSQLToProto(metric *clinicalkpisql.GetMarketMetricsRow) *clinicalkpipb.MarketMetrics {
	if metric == nil || metric.MarketID == 0 {
		return nil
	}

	return &clinicalkpipb.MarketMetrics{
		MarketId:                     metric.MarketID,
		OnSceneTimeMedianSeconds:     sqltypes.ToProtoInt32(metric.OnSceneTimeMedianSeconds),
		OnSceneTimeWeekChangeSeconds: sqltypes.ToProtoInt32(metric.OnSceneTimeWeekChangeSeconds),
		ChartClosureRate:             sqltypes.ToProtoFloat64(metric.ChartClosureRate),
		ChartClosureRateWeekChange:   sqltypes.ToProtoFloat64(metric.ChartClosureRateWeekChange),
		SurveyCaptureRate:            sqltypes.ToProtoFloat64(metric.SurveyCaptureRate),
		SurveyCaptureRateWeekChange:  sqltypes.ToProtoFloat64(metric.SurveyCaptureRateWeekChange),
		NetPromoterScoreAverage:      sqltypes.ToProtoFloat64(metric.NetPromoterScoreAverage),
		NetPromoterScoreWeekChange:   sqltypes.ToProtoFloat64(metric.NetPromoterScoreWeekChange),
	}
}

func MarketMetricsMarketSQLToProto(metric *clinicalkpisql.GetMarketMetricsRow) *clinicalkpipb.Market {
	if metric == nil || metric.MarketID == 0 {
		return nil
	}

	return &clinicalkpipb.Market{
		Id:        metric.MarketID,
		Name:      *sqltypes.ToProtoString(metric.MarketName),
		ShortName: *sqltypes.ToProtoString(metric.MarketShortName),
	}
}

func MarketSQLToProto(market *clinicalkpisql.Market) *clinicalkpipb.Market {
	if market == nil || market.MarketID == 0 {
		return nil
	}

	result := &clinicalkpipb.Market{
		Id:   market.MarketID,
		Name: market.Name,
	}

	shortName := sqltypes.ToProtoString(market.ShortName)
	if shortName != nil {
		result.ShortName = *shortName
	}

	return result
}

func ProviderOverallMetricsSQLToProto(metric *clinicalkpisql.GetProviderMetricsRow) *clinicalkpipb.OverallProviderMetrics {
	if metric == nil {
		return nil
	}

	metrics := &clinicalkpipb.OverallProviderMetrics{
		ProviderId:               metric.ProviderID,
		OnSceneTimeMedianSeconds: sqltypes.ToProtoInt32(metric.OnSceneTimeMedianSeconds),
		ChartClosureRate:         sqltypes.ToProtoFloat64(metric.ChartClosureRate),
		SurveyCaptureRate:        sqltypes.ToProtoFloat64(metric.SurveyCaptureRate),
		NetPromoterScoreAverage:  sqltypes.ToProtoFloat64(metric.NetPromoterScoreAverage),
		OnTaskPercent:            sqltypes.ToProtoFloat64(metric.OnTaskPercent),
		EscalationRate:           sqltypes.ToProtoFloat64(metric.EscalationRate),
		AbxPrescribingRate:       sqltypes.ToProtoFloat64(metric.AbxPrescribingRate),
	}
	if metric.Provider.ProviderID != 0 {
		metrics.Provider = &clinicalkpipb.Provider{
			Id:        metric.Provider.ProviderID,
			FirstName: metric.Provider.FirstName,
			LastName:  metric.Provider.LastName,
			AvatarUrl: sqltypes.ToProtoString(metric.Provider.AvatarUrl),
			Profile: &clinicalkpipb.ProviderProfile{
				Position: metric.Provider.JobTitle,
			},
		}
	}

	return metrics
}

func ProviderVisitSQLToProto(visit *clinicalkpisql.ProviderVisit) *clinicalkpipb.ProviderVisit {
	if visit == nil {
		return nil
	}

	return &clinicalkpipb.ProviderVisit{
		CareRequestId:    visit.CareRequestID,
		ProviderId:       visit.ProviderID,
		PatientFirstName: visit.PatientFirstName,
		PatientLastName:  visit.PatientLastName,
		PatientAthenaId:  visit.PatientAthenaID,
		ServiceDate:      protoconv.TimeToProtoDate(&visit.ServiceDate),
		ChiefComplaint:   sqltypes.ToProtoString(visit.ChiefComplaint),
		Diagnosis:        sqltypes.ToProtoString(visit.Diagnosis),
		IsAbxPrescribed:  visit.IsAbxPrescribed,
		AbxDetails:       sqltypes.ToProtoString(visit.AbxDetails),
		IsEscalated:      visit.IsEscalated,
		EscalatedReason:  sqltypes.ToProtoString(visit.EscalatedReason),
	}
}

func MarketProviderMetricsListItemSQLToProto(metric *clinicalkpisql.GetProvidersMetricsByMarketRow) *clinicalkpipb.MarketProviderMetricsListItem {
	if metric == nil {
		return nil
	}

	result := &clinicalkpipb.MarketProviderMetricsListItem{
		MarketId:                     metric.MarketID,
		ProviderId:                   metric.ProviderID,
		OnSceneTimeMedianSeconds:     sqltypes.ToProtoInt32(metric.OnSceneTimeMedianSeconds),
		OnSceneTimeWeekChangeSeconds: sqltypes.ToProtoInt32(metric.OnSceneTimeWeekChangeSeconds),
		Provider: &clinicalkpipb.Provider{
			Id:        metric.Provider.ProviderID,
			FirstName: metric.Provider.FirstName,
			LastName:  metric.Provider.LastName,
			AvatarUrl: sqltypes.ToProtoString(metric.Provider.AvatarUrl),
			Profile: &clinicalkpipb.ProviderProfile{
				Position: metric.Provider.JobTitle,
			},
		},
	}

	if metric.OnSceneTimeRank != 0 {
		result.OnSceneTimeRank = &metric.OnSceneTimeRank
	}
	if metric.ChartClosureRateRank != 0 {
		result.ChartClosureRateRank = &metric.ChartClosureRateRank
	}
	if metric.SurveyCaptureRateRank != 0 {
		result.SurveyCaptureRateRank = &metric.SurveyCaptureRateRank
	}
	if metric.NetPromoterScoreRank != 0 {
		result.NetPromoterScoreRank = &metric.NetPromoterScoreRank
	}
	if metric.OnTaskPercentRank != 0 {
		result.OnTaskPercentRank = &metric.OnTaskPercentRank
	}

	if metric.ChartClosureRate.Status == pgtype.Present {
		result.ChartClosureRate = pgtypes.NumericToProtoFloat64(metric.ChartClosureRate)
	}
	if metric.ChartClosureRateWeekChange.Status == pgtype.Present {
		result.ChartClosureRateWeekChange = pgtypes.NumericToProtoFloat64(metric.ChartClosureRateWeekChange)
	}
	if metric.SurveyCaptureRate.Status == pgtype.Present {
		result.SurveyCaptureRate = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRate)
	}
	if metric.SurveyCaptureRateWeekChange.Status == pgtype.Present {
		result.SurveyCaptureRateWeekChange = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRateWeekChange)
	}
	if metric.NetPromoterScoreAverage.Status == pgtype.Present {
		result.NetPromoterScoreAverage = pgtypes.NumericToProtoFloat64(metric.NetPromoterScoreAverage)
	}
	if metric.NetPromoterScoreWeekChange.Status == pgtype.Present {
		result.NetPromoterScoreWeekChange = pgtypes.NumericToProtoFloat64(metric.NetPromoterScoreWeekChange)
	}
	if metric.OnTaskPercent.Status == pgtype.Present {
		result.OnTaskPercent = pgtypes.NumericToProtoFloat64(metric.OnTaskPercent)
	}
	if metric.OnTaskPercentWeekChange.Status == pgtype.Present {
		result.OnTaskPercentWeekChange = pgtypes.NumericToProtoFloat64(metric.OnTaskPercentWeekChange)
	}

	return result
}

func MarketProviderMetricsSQLToProto(metric *clinicalkpisql.GetProviderMetricsByMarketRow) *clinicalkpipb.MarketProviderMetrics {
	if metric == nil || metric.MarketID == 0 || metric.ProviderID == 0 {
		return nil
	}

	result := &clinicalkpipb.MarketProviderMetrics{
		MarketId:                     metric.MarketID,
		ProviderId:                   metric.ProviderID,
		OnSceneTimeMedianSeconds:     sqltypes.ToProtoInt32(metric.OnSceneTimeMedianSeconds),
		OnSceneTimeWeekChangeSeconds: sqltypes.ToProtoInt32(metric.OnSceneTimeWeekChangeSeconds),
		TotalProviders:               metric.TotalProviders,
	}

	if metric.OnSceneTimeRank != 0 {
		result.OnSceneTimeRank = &metric.OnSceneTimeRank
	}
	if metric.ChartClosureRateRank != 0 {
		result.ChartClosureRateRank = &metric.ChartClosureRateRank
	}
	if metric.SurveyCaptureRateRank != 0 {
		result.SurveyCaptureRateRank = &metric.SurveyCaptureRateRank
	}
	if metric.NetPromoterScoreRank != 0 {
		result.NetPromoterScoreRank = &metric.NetPromoterScoreRank
	}
	if metric.OnTaskPercentRank != 0 {
		result.OnTaskPercentRank = &metric.OnTaskPercentRank
	}

	if metric.ChartClosureRate.Status == pgtype.Present {
		result.ChartClosureRate = pgtypes.NumericToProtoFloat64(metric.ChartClosureRate)
	}
	if metric.ChartClosureRateWeekChange.Status == pgtype.Present {
		result.ChartClosureRateWeekChange = pgtypes.NumericToProtoFloat64(metric.ChartClosureRateWeekChange)
	}
	if metric.SurveyCaptureRate.Status == pgtype.Present {
		result.SurveyCaptureRate = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRate)
	}
	if metric.SurveyCaptureRateWeekChange.Status == pgtype.Present {
		result.SurveyCaptureRateWeekChange = pgtypes.NumericToProtoFloat64(metric.SurveyCaptureRateWeekChange)
	}
	if metric.NetPromoterScoreAverage.Status == pgtype.Present {
		result.NetPromoterScoreAverage = pgtypes.NumericToProtoFloat64(metric.NetPromoterScoreAverage)
	}
	if metric.NetPromoterScoreWeekChange.Status == pgtype.Present {
		result.NetPromoterScoreWeekChange = pgtypes.NumericToProtoFloat64(metric.NetPromoterScoreWeekChange)
	}
	if metric.OnTaskPercent.Status == pgtype.Present {
		result.OnTaskPercent = pgtypes.NumericToProtoFloat64(metric.OnTaskPercent)
	}
	if metric.OnTaskPercentWeekChange.Status == pgtype.Present {
		result.OnTaskPercentWeekChange = pgtypes.NumericToProtoFloat64(metric.OnTaskPercentWeekChange)
	}

	return result
}

func ShiftSnapshotsSQLToProto(shiftSnapshot *clinicalkpisql.GetShiftSnapshotsRow) *clinicalkpipb.ShiftSnapshot {
	if shiftSnapshot == nil {
		return nil
	}

	result := &clinicalkpipb.ShiftSnapshot{
		ShiftTeamId:    &shiftSnapshot.ShiftTeamID,
		StartTimestamp: timestamppb.New(shiftSnapshot.StartTimestamp),
		EndTimestamp:   timestamppb.New(shiftSnapshot.EndTimestamp),
		LatitudeE6:     sqltypes.ToProtoInt32(shiftSnapshot.LatitudeE6),
		LongitudeE6:    sqltypes.ToProtoInt32(shiftSnapshot.LongitudeE6),
	}

	if shiftSnapshot.Phase.Valid {
		result.Phase = *sqltypes.ToProtoString(shiftSnapshot.Phase)
	}
	return result
}

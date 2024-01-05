package clinicalkpidb

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	stagingMetricsMarketIDsDelimiter = "|"
)

var (
	ErrMarketMetricsNotFound           = errors.New("market metrics not found with given MarketID")
	ErrProviderMetricsNotFound         = errors.New("provider metrics not found with given ProviderID")
	ErrProviderMetricsByMarketNotFound = errors.New("provider metrics by market not found with given ProviderID and MarketID")
)

type ClinicalKPIDB struct {
	db              basedb.DBTX
	scope           monitoring.Scope
	queries         *clinicalkpisql.Queries
	datadogRecorder *monitoring.DataDogRecorder
}

func NewClinicalKPIDB(db basedb.DBTX, scope monitoring.Scope, ddr *monitoring.DataDogRecorder) *ClinicalKPIDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}
	return &ClinicalKPIDB{
		db:              db,
		scope:           scope,
		queries:         clinicalkpisql.New(db),
		datadogRecorder: ddr,
	}
}

func (cdb *ClinicalKPIDB) GetLatestMetricsForProvider(ctx context.Context, providerID int64) (*clinicalkpisql.CalculatedProviderMetric, error) {
	metric, err := cdb.queries.GetCalculatedMetricsByProvider(ctx, providerID)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	return metric, err
}

func (cdb *ClinicalKPIDB) GetCalculatedMetricsForProvidersActiveAfterDate(ctx context.Context, args clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams) ([]*clinicalkpisql.CalculatedProviderMetric, error) {
	return cdb.queries.GetCalculatedMetricsForProvidersActiveAfterDate(ctx, args)
}

func (cdb *ClinicalKPIDB) UpsertCalculatedProviderMetric(ctx context.Context, metric clinicalkpisql.UpsertCalculatedProviderMetricsParams) (*clinicalkpisql.CalculatedProviderMetric, error) {
	return cdb.queries.UpsertCalculatedProviderMetrics(ctx, metric)
}

func (cdb *ClinicalKPIDB) AddActiveProviderForMarkets(ctx context.Context, val clinicalkpisql.AddActiveProviderForMarketsParams) error {
	return cdb.queries.AddActiveProviderForMarkets(ctx, val)
}

func (cdb *ClinicalKPIDB) AddStagingProviderMetric(ctx context.Context, val clinicalkpisql.AddStagingProviderMetricParams) (*clinicalkpisql.StagingProviderMetric, error) {
	return cdb.queries.AddStagingProviderMetric(ctx, val)
}

func (cdb *ClinicalKPIDB) DeleteAllStagingProviderMetrics(ctx context.Context) error {
	return cdb.queries.DeleteAllStagingProviderMetrics(ctx)
}

func (cdb *ClinicalKPIDB) GetActiveProvidersForMarket(ctx context.Context, marketID int64) ([]int64, error) {
	return cdb.queries.GetActiveProvidersForMarket(ctx, marketID)
}

func (cdb *ClinicalKPIDB) GetActiveMarketsForProvider(ctx context.Context, providerID int64) ([]int64, error) {
	return cdb.queries.GetActiveMarketsForProvider(ctx, providerID)
}

func (cdb *ClinicalKPIDB) DeleteActiveMarketsForProvider(ctx context.Context, params clinicalkpisql.DeleteActiveMarketsForProviderParams) error {
	return cdb.queries.DeleteActiveMarketsForProvider(ctx, params)
}

func (cdb *ClinicalKPIDB) GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx context.Context, args clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams) ([]*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow, error) {
	return cdb.queries.GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx, args)
}

func (cdb *ClinicalKPIDB) GetLastShiftSnapshots(ctx context.Context, providerID int64) ([]*clinicalkpisql.GetLastShiftSnapshotsRow, error) {
	return cdb.queries.GetLastShiftSnapshots(ctx, providerID)
}

func (cdb *ClinicalKPIDB) GetProviderMarketIDs(ctx context.Context, providerID int64) ([]int64, error) {
	return cdb.queries.GetProviderMarketIDs(ctx, providerID)
}

func (cdb *ClinicalKPIDB) GetProviderMarkets(ctx context.Context, providerID int64) ([]*clinicalkpisql.Market, error) {
	return cdb.queries.GetProviderMarkets(ctx, providerID)
}

func (cdb *ClinicalKPIDB) ProcessStagingRecords(ctx context.Context, changeDaysPeriod int, logger *zap.SugaredLogger) error {
	marketIDParseErrorCount := 0
	transactionErrorCount := 0
	stagingRecords, err := cdb.queries.GetAllStagingProviderMetrics(ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to get staging provider metrics: %s", err)
	}

	stagingRecordCount := len(stagingRecords)
	if stagingRecordCount == 0 {
		logger.Infof("no records found, process staging records aborted.")
		err = cdb.sendProcessingMetricsToDatadog(ProcessingMetrics{
			stagingRecordCount:      stagingRecordCount,
			marketIDParseErrorCount: marketIDParseErrorCount,
			transactionErrorCount:   transactionErrorCount,
		})
		if err != nil {
			logger.Errorf("error when sending Datadog metrics: %w", err)
		}
		return nil
	}
	logger.Infof("Found %d staging records", stagingRecordCount)

	start := time.Now()
	startOfToday := time.Date(start.Year(), start.Month(), start.Day(), 0, 0, 0, 0, time.UTC)
	createdAfterDate := startOfToday.AddDate(0, 0, -changeDaysPeriod)
	for _, stagingRecord := range stagingRecords {
		err = cdb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
			qtx := cdb.queries.WithTx(tx)
			newCreatedMetric, err := qtx.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
				ProviderID:                         stagingRecord.ProviderID,
				CareRequestsCompletedLastSevenDays: stagingRecord.CareRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            stagingRecord.AverageNetPromoterScore,
				ChartClosureRate:                   stagingRecord.ChartClosureRate,
				SurveyCaptureRate:                  stagingRecord.SurveyCaptureRate,
				MedianOnSceneTimeSecs:              stagingRecord.MedianOnSceneTimeSecs,
				LastCareRequestCompletedAt:         stagingRecord.LastCareRequestCompletedAt,
				CompletedCareRequests:              stagingRecord.CompletedCareRequests,
			})
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "failed to add historical metric for provider with ID: %v. Error: %s", newCreatedMetric.ProviderID, err))
				transactionErrorCount++
				return err
			}
			changeReferenceMetric, err := qtx.GetOldestHistoricalProviderMetricAfterDate(ctx, clinicalkpisql.GetOldestHistoricalProviderMetricAfterDateParams{
				ProviderID:   stagingRecord.ProviderID,
				CreatedAfter: createdAfterDate,
			})
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "failed to get oldest historical provider metric after a date with ID: %v. Error: %s", stagingRecord.ProviderID, err))
				transactionErrorCount++
				return err
			}

			if changeReferenceMetric == nil {
				return nil
			}

			averageNetPromoterScoreChange, err := SubtractNumerics(newCreatedMetric.AverageNetPromoterScore, changeReferenceMetric.AverageNetPromoterScore)
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "Failed to calculate the change value of AverageNetPromoterScore: %s", err))
			}
			chartClosureRateChange, err := SubtractNumerics(newCreatedMetric.ChartClosureRate, changeReferenceMetric.ChartClosureRate)
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "Failed to calculate the change value of ChartClosureRate: %s", err))
			}
			surveyCaptureRateChange, err := SubtractNumerics(newCreatedMetric.SurveyCaptureRate, changeReferenceMetric.SurveyCaptureRate)
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "Failed to calculate the change value of SurveyCaptureRate: %s", err))
			}
			medianOnSceneTimeSecsChange := sqltypes.ToNullInt32(nil)
			if newCreatedMetric.MedianOnSceneTimeSecs.Valid && changeReferenceMetric.MedianOnSceneTimeSecs.Valid {
				medianOnSceneTimeSecsChange = sqltypes.ToValidNullInt32(newCreatedMetric.MedianOnSceneTimeSecs.Int32 - changeReferenceMetric.MedianOnSceneTimeSecs.Int32)
			}

			calculatedProviderMetric := clinicalkpisql.UpsertCalculatedProviderMetricsParams{
				ProviderID:                         stagingRecord.ProviderID,
				CareRequestsCompletedLastSevenDays: stagingRecord.CareRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newCreatedMetric.AverageNetPromoterScore,
				AverageNetPromoterScoreChange:      averageNetPromoterScoreChange,
				MedianOnSceneTimeSecs:              newCreatedMetric.MedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        medianOnSceneTimeSecsChange,
				ChartClosureRate:                   newCreatedMetric.ChartClosureRate,
				ChartClosureRateChange:             chartClosureRateChange,
				SurveyCaptureRate:                  newCreatedMetric.SurveyCaptureRate,
				SurveyCaptureRateChange:            surveyCaptureRateChange,
				ChangeDays:                         int32(changeDaysPeriod),
				CompletedCareRequests:              newCreatedMetric.CompletedCareRequests,
				LastCareRequestCompletedAt:         newCreatedMetric.LastCareRequestCompletedAt,
			}

			_, err = qtx.UpsertCalculatedProviderMetrics(ctx, calculatedProviderMetric)
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "failed to upsert calculated provider metric with ID: %d. Error: %s", calculatedProviderMetric.ProviderID, err))
				transactionErrorCount++
				return err
			}

			newActiveMarketIDs, errors := ParseMarketIDs(stagingRecord.MarketIds, logger)
			marketIDParseErrorCount += len(errors)
			err = cdb.updateProvidersActiveMarkets(ctx, qtx, stagingRecord.ProviderID, newActiveMarketIDs)
			if err != nil {
				logger.Error("failed to update active markets for provider with ID: %d. Error: %s", stagingRecord.ProviderID, err)
				transactionErrorCount++
				return err
			}

			err = qtx.DeleteStagingProviderMetric(ctx, stagingRecord.ID)
			if err != nil {
				logger.Error(status.Errorf(codes.Internal, "failed to delete processed staging metric with ID: %d. Error: %s", stagingRecord.ID, err))
				transactionErrorCount++
				return err
			}

			return nil
		})
		if err != nil {
			logger.Error(status.Errorf(codes.Internal, "An error occurs when processing. Error: %s", err))
		}
	}

	durationMs := time.Since(start).Milliseconds()
	err = cdb.sendProcessingMetricsToDatadog(ProcessingMetrics{
		durationMs:              durationMs,
		stagingRecordCount:      stagingRecordCount,
		marketIDParseErrorCount: marketIDParseErrorCount,
		transactionErrorCount:   transactionErrorCount,
	})
	if err != nil {
		logger.Errorf("error when sending Datadog metrics: %w", err)
	}

	logger.Info("completed process staging records")
	return nil
}

type ProcessingMetrics struct {
	durationMs              int64
	stagingRecordCount      int
	marketIDParseErrorCount int
	transactionErrorCount   int
}

func processingMetricName(name string) string {
	prefix := "staging_records.processing"
	return fmt.Sprintf("%s.%s", prefix, name)
}

func (cdb *ClinicalKPIDB) sendProcessingMetricsToDatadog(metrics ProcessingMetrics) error {
	if cdb.datadogRecorder == nil || cdb.datadogRecorder.Client == nil {
		return fmt.Errorf("unable to log datadog metrics for staging record processing: datadog recorder is nil")
	}

	errors := []error{}
	err := cdb.datadogRecorder.Client.Histogram(processingMetricName("duration_ms"), float64(metrics.durationMs), nil, 1)
	if err != nil {
		errors = append(errors, err)
	}

	err = cdb.datadogRecorder.Client.Count(processingMetricName("staging_record_count"), int64(metrics.stagingRecordCount), nil, 1)
	if err != nil {
		errors = append(errors, err)
	}

	err = cdb.datadogRecorder.Client.Count(processingMetricName("market_id_parse_error_count"), int64(metrics.marketIDParseErrorCount), nil, 1)
	if err != nil {
		errors = append(errors, err)
	}

	err = cdb.datadogRecorder.Client.Count(processingMetricName("transaction_error_count"), int64(metrics.transactionErrorCount), nil, 1)
	if err != nil {
		errors = append(errors, err)
	}

	if len(errors) > 0 {
		return fmt.Errorf("errors trying to send metrics to datadog: %v", errors)
	}

	return nil
}

func (cdb *ClinicalKPIDB) updateProvidersActiveMarkets(ctx context.Context, qtx *clinicalkpisql.Queries, providerID int64, newActiveMarketIDs []int64) error {
	existingActiveMarketIDs, err := qtx.GetActiveMarketsForProvider(ctx, providerID)
	if err != nil {
		return fmt.Errorf("failed to get existing market IDs for provider ID, %d. Error: %w", providerID, err)
	}

	marketsToAdd := difference(newActiveMarketIDs, existingActiveMarketIDs)
	err = qtx.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
		ProviderID: providerID,
		MarketIds:  marketsToAdd,
	})
	if err != nil {
		return fmt.Errorf("failed to add active markets, for provider ID, %d. Error: %w", providerID, err)
	}

	marketsToRemove := difference(existingActiveMarketIDs, newActiveMarketIDs)
	err = qtx.DeleteActiveMarketsForProvider(ctx, clinicalkpisql.DeleteActiveMarketsForProviderParams{
		ProviderID: providerID,
		MarketIds:  marketsToRemove,
	})
	if err != nil {
		return fmt.Errorf("failed to remove active market IDs, %v, for provider ID, %d. Error: %w", marketsToRemove, providerID, err)
	}

	return nil
}

// difference returns the elements in `a` that aren't in `b`.
func difference(a []int64, b []int64) []int64 {
	mb := make(map[int64]struct{}, len(b))
	for _, x := range b {
		mb[x] = struct{}{}
	}
	var diff []int64
	for _, x := range a {
		if _, found := mb[x]; !found {
			diff = append(diff, x)
		}
	}
	return diff
}

func (cdb *ClinicalKPIDB) IsHealthy(ctx context.Context) bool {
	return cdb.db.Ping(ctx) == nil
}

func ParseMarketIDs(s sql.NullString, logger *zap.SugaredLogger) ([]int64, []error) {
	marketIDs := []int64{}
	errors := []error{}
	if s.Valid {
		marketIDsStrings := strings.Split(s.String, stagingMetricsMarketIDsDelimiter)
		for _, idStr := range marketIDsStrings {
			id, err := strconv.Atoi(strings.TrimSpace(idStr))
			if err != nil {
				errors = append(errors, fmt.Errorf("failed to parse market ID as integer: %w", err))
			} else {
				marketIDs = append(marketIDs, int64(id))
			}
		}
	}

	return marketIDs, errors
}

func (cdb *ClinicalKPIDB) UpdateProviderAvatars(ctx context.Context, params clinicalkpisql.UpdateProviderAvatarsParams) error {
	return cdb.queries.UpdateProviderAvatars(ctx, params)
}

func (cdb *ClinicalKPIDB) GetProviderAvatars(ctx context.Context) ([]*clinicalkpisql.GetProviderAvatarsRow, error) {
	return cdb.queries.GetProviderAvatars(ctx)
}

func SubtractNumerics(newValue, oldValue pgtype.Numeric) (pgtype.Numeric, error) {
	newVal := pgtypes.NumericToProtoFloat64(newValue)
	oldVal := pgtypes.NumericToProtoFloat64(oldValue)
	if newVal == nil || oldVal == nil {
		return pgtype.Numeric{Status: pgtype.Null}, nil
	}
	return pgtypes.BuildNumeric(*newVal - *oldVal)
}

type GetProviderVisitsParams struct {
	ProviderID      int64
	IsAbxPrescribed *bool
	IsEscalated     *bool
	SearchText      *string
	Page            int32
	PerPage         int32
}

type GetProviderVisitsResponse struct {
	Rows  []*clinicalkpisql.ProviderVisit
	Total int64
}

func (cdb *ClinicalKPIDB) GetProviderVisits(ctx context.Context, args GetProviderVisitsParams) (*GetProviderVisitsResponse, error) {
	rows, err := cdb.queries.GetProviderVisits(ctx, clinicalkpisql.GetProviderVisitsParams{
		ProviderID:      args.ProviderID,
		IsAbxPrescribed: sqltypes.ToNullBool(args.IsAbxPrescribed),
		IsEscalated:     sqltypes.ToNullBool(args.IsEscalated),
		SearchText:      sqltypes.ToNullString(args.SearchText),
		LimitValue:      args.PerPage,
		OffsetValue:     args.PerPage * (args.Page - 1),
	})
	if err != nil {
		return nil, err
	}

	visits := make([]*clinicalkpisql.ProviderVisit, len(rows))
	for i, row := range rows {
		visits[i] = &clinicalkpisql.ProviderVisit{
			ID:               row.ProviderVisit.ID,
			CareRequestID:    row.ProviderVisit.CareRequestID,
			ProviderID:       row.ProviderVisit.ProviderID,
			PatientFirstName: row.ProviderVisit.PatientFirstName,
			PatientLastName:  row.ProviderVisit.PatientLastName,
			PatientAthenaID:  row.ProviderVisit.PatientAthenaID,
			ServiceDate:      row.ProviderVisit.ServiceDate,
			ChiefComplaint:   row.ProviderVisit.ChiefComplaint,
			Diagnosis:        row.ProviderVisit.Diagnosis,
			IsAbxPrescribed:  row.ProviderVisit.IsAbxPrescribed,
			AbxDetails:       row.ProviderVisit.AbxDetails,
			IsEscalated:      row.ProviderVisit.IsEscalated,
			EscalatedReason:  row.ProviderVisit.EscalatedReason,
			CreatedAt:        row.ProviderVisit.CreatedAt,
		}
	}

	total := int64(0)
	if len(rows) > 0 {
		total = rows[0].Count
	}

	return &GetProviderVisitsResponse{
		Rows:  visits,
		Total: total,
	}, nil
}

func (cdb *ClinicalKPIDB) GetMarketMetrics(ctx context.Context, marketID int64) (*clinicalkpisql.GetMarketMetricsRow, error) {
	metrics, err := cdb.queries.GetMarketMetrics(ctx, marketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrMarketMetricsNotFound
		}
		return nil, err
	}

	return metrics, nil
}

type GetProviderShiftsParams struct {
	ProviderID           int64
	FromDate             *time.Time
	Page                 int32
	PerPage              int32
	ServiceDateSortOrder string
}

type GetProviderShiftsResponse struct {
	Rows  []*clinicalkpisql.GetProviderShiftsRow
	Total int64
}

func (cdb *ClinicalKPIDB) GetProviderShifts(ctx context.Context, args GetProviderShiftsParams) (*GetProviderShiftsResponse, error) {
	rows, err := cdb.queries.GetProviderShifts(ctx, clinicalkpisql.GetProviderShiftsParams{
		ProviderID:           args.ProviderID,
		FromDate:             sqltypes.ToNullTime(args.FromDate),
		LimitValue:           args.PerPage,
		OffsetValue:          args.PerPage * (args.Page - 1),
		ServiceDateSortOrder: args.ServiceDateSortOrder,
	})
	if err != nil {
		return nil, err
	}

	total := int64(0)
	if len(rows) > 0 {
		total = rows[0].Count
	}

	return &GetProviderShiftsResponse{
		Rows:  rows,
		Total: total,
	}, nil
}

func (cdb *ClinicalKPIDB) GetShiftSnapshots(ctx context.Context, shiftTeamID int64) ([]*clinicalkpisql.GetShiftSnapshotsRow, error) {
	return cdb.queries.GetShiftSnapshots(ctx, shiftTeamID)
}

func (cdb *ClinicalKPIDB) GetProviderMetrics(ctx context.Context, providerID int64) (*clinicalkpisql.GetProviderMetricsRow, error) {
	metrics, err := cdb.queries.GetProviderMetrics(ctx, providerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProviderMetricsNotFound
		}
		return nil, err
	}

	return metrics, nil
}

type GetProvidersMetricsByMarketParams struct {
	MarketID         int64
	SortBy           *string
	ProviderJobTitle *string
	SearchText       *string
	Page             int32
	PerPage          int32
}

type GetProvidersMetricsByMarketResponse struct {
	Rows  []*clinicalkpisql.GetProvidersMetricsByMarketRow
	Total int64
}

func (cdb *ClinicalKPIDB) GetProvidersMetricsByMarket(ctx context.Context, args GetProvidersMetricsByMarketParams) (*GetProvidersMetricsByMarketResponse, error) {
	rows, err := cdb.queries.GetProvidersMetricsByMarket(ctx, clinicalkpisql.GetProvidersMetricsByMarketParams{
		MarketID:         args.MarketID,
		SortBy:           sqltypes.ToNullString(args.SortBy),
		ProviderJobTitle: sqltypes.ToNullString(args.ProviderJobTitle),
		SearchText:       sqltypes.ToNullString(args.SearchText),
		LimitValue:       args.PerPage,
		OffsetValue:      args.PerPage * (args.Page - 1),
	})
	if err != nil {
		return nil, err
	}

	total := int64(0)
	if len(rows) > 0 {
		total = rows[0].Count
	}

	return &GetProvidersMetricsByMarketResponse{
		Rows:  rows,
		Total: total,
	}, nil
}

type GetProviderMetricsByMarketParams struct {
	MarketID   int64
	ProviderID int64
}

func (cdb *ClinicalKPIDB) GetProviderMetricsByMarket(ctx context.Context, args GetProviderMetricsByMarketParams) (*clinicalkpisql.GetProviderMetricsByMarketRow, error) {
	metrics, err := cdb.queries.GetProviderMetricsByMarket(ctx, clinicalkpisql.GetProviderMetricsByMarketParams{
		MarketID:   args.MarketID,
		ProviderID: args.ProviderID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrProviderMetricsByMarketNotFound
		}
		return nil, err
	}

	return metrics, nil
}

func (cdb *ClinicalKPIDB) DeleteAllLeaderHubMetrics(ctx context.Context) error {
	if err := cdb.queries.TestDeleteAllProviders(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllMarkets(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllMarketMetrics(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllMarketProviderMetrics(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllProviderMetrics(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllProviderVisits(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllShiftSnapshots(ctx); err != nil {
		return err
	}
	return cdb.queries.TestDeleteAllProviderShifts(ctx)
}

type Market struct {
	MarketID      int64
	Name          string
	ShortName     string
	MarketGroupID *int64
}

func (cdb *ClinicalKPIDB) SeedMarkets(ctx context.Context, markets []*Market) (int64, error) {
	marketsToSave := make([]clinicalkpisql.TestAddMarketsParams, len(markets))
	for i, market := range markets {
		marketsToSave[i].MarketID = market.MarketID
		marketsToSave[i].Name = market.Name
		marketsToSave[i].ShortName = sqltypes.ToNullString(&market.ShortName)
		marketsToSave[i].MarketGroupID = sqltypes.ToNullInt64(market.MarketGroupID)
	}

	return cdb.queries.TestAddMarkets(ctx, marketsToSave)
}

type ProviderMetrics struct {
	ProviderID                int64
	OnSceneTimeMedianSeconds  int32
	ChartClosureRateAverage   float64
	SurveyCaptureRateAverage  float64
	NetPromoterScoreAverage   float64
	OnTaskPercentAverage      float64
	EscalationRateAverage     float64
	AbxPrescribingRateAverage float64
}

func (cdb *ClinicalKPIDB) SeedProviderMetrics(ctx context.Context, providerMetrics []*ProviderMetrics) ([]*clinicalkpisql.ProviderMetric, error) {
	providerMetricsToSave := clinicalkpisql.TestAddProviderMetricsParams{
		ProviderIds:              make([]int64, len(providerMetrics)),
		OnSceneTimeMedianSeconds: make([]int32, len(providerMetrics)),
		ChartClosureRates:        make([]float64, len(providerMetrics)),
		SurveyCaptureRates:       make([]float64, len(providerMetrics)),
		NetPromoterScoreAverages: make([]float64, len(providerMetrics)),
		OnTaskPercents:           make([]float64, len(providerMetrics)),
		EscalationRates:          make([]float64, len(providerMetrics)),
		AbxPrescribingRates:      make([]float64, len(providerMetrics)),
	}
	for i, provider := range providerMetrics {
		providerMetricsToSave.ProviderIds[i] = provider.ProviderID
		providerMetricsToSave.OnSceneTimeMedianSeconds[i] = provider.OnSceneTimeMedianSeconds
		providerMetricsToSave.ChartClosureRates[i] = provider.ChartClosureRateAverage
		providerMetricsToSave.SurveyCaptureRates[i] = provider.SurveyCaptureRateAverage
		providerMetricsToSave.NetPromoterScoreAverages[i] = provider.NetPromoterScoreAverage
		providerMetricsToSave.OnTaskPercents[i] = provider.OnTaskPercentAverage
		providerMetricsToSave.EscalationRates[i] = provider.EscalationRateAverage
		providerMetricsToSave.AbxPrescribingRates[i] = provider.AbxPrescribingRateAverage
	}

	return cdb.queries.TestAddProviderMetrics(ctx, providerMetricsToSave)
}

type ShiftSnapshot struct {
	ShiftTeamID              int64
	StartTimestamp           time.Time
	EndTimestamp             time.Time
	ShiftSnapshotPhaseTypeID int64
	LatitudesE6              int32
	LongitudesE6             int32
}

func (cdb *ClinicalKPIDB) SeedShiftSnapshots(ctx context.Context, shiftSnapshots []*ShiftSnapshot) ([]*clinicalkpisql.ShiftSnapshot, error) {
	shiftSnapshotsToSave := clinicalkpisql.TestAddShiftSnapshotsParams{
		ShiftTeamIds:              make([]int64, len(shiftSnapshots)),
		StartTimestamps:           make([]time.Time, len(shiftSnapshots)),
		EndTimestamps:             make([]time.Time, len(shiftSnapshots)),
		ShiftSnapshotPhaseTypeIds: make([]int64, len(shiftSnapshots)),
		LatitudesE6:               make([]int32, len(shiftSnapshots)),
		LongitudesE6:              make([]int32, len(shiftSnapshots)),
	}
	for i, snapshot := range shiftSnapshots {
		shiftSnapshotsToSave.ShiftTeamIds[i] = snapshot.ShiftTeamID
		shiftSnapshotsToSave.StartTimestamps[i] = snapshot.StartTimestamp
		shiftSnapshotsToSave.EndTimestamps[i] = snapshot.EndTimestamp
		shiftSnapshotsToSave.ShiftSnapshotPhaseTypeIds[i] = snapshot.ShiftSnapshotPhaseTypeID
		shiftSnapshotsToSave.LatitudesE6[i] = snapshot.LatitudesE6
		shiftSnapshotsToSave.LongitudesE6[i] = snapshot.LongitudesE6
	}

	return cdb.queries.TestAddShiftSnapshots(ctx, shiftSnapshotsToSave)
}

type ProviderVisit struct {
	CareRequestID    int64
	ProviderID       int64
	PatientFirstName string
	PatientLastName  string
	PatientAthenaID  string
	ServiceDate      time.Time
	ChiefComplaint   string
	Diagnosis        string
	IsAbxPrescribed  bool
	AbxDetails       string
	IsEscalated      bool
	EscalatedReason  string
}

func (cdb *ClinicalKPIDB) SeedProviderVisits(ctx context.Context, providerVisits []*ProviderVisit) ([]*clinicalkpisql.ProviderVisit, error) {
	providerVisitsToSave := clinicalkpisql.TestAddProviderVisitsParams{
		CareRequestIds:    make([]int64, len(providerVisits)),
		ProviderIds:       make([]int64, len(providerVisits)),
		PatientFirstNames: make([]string, len(providerVisits)),
		PatientLastNames:  make([]string, len(providerVisits)),
		PatientAthenaIds:  make([]string, len(providerVisits)),
		ServiceDates:      make([]time.Time, len(providerVisits)),
		ChiefComplaints:   make([]string, len(providerVisits)),
		Diagnosises:       make([]string, len(providerVisits)),
		IsAbxPrescribeds:  make([]bool, len(providerVisits)),
		AbxDetailses:      make([]string, len(providerVisits)),
		IsEscalateds:      make([]bool, len(providerVisits)),
		EscalatedReasons:  make([]string, len(providerVisits)),
	}
	for i, visit := range providerVisits {
		providerVisitsToSave.CareRequestIds[i] = visit.CareRequestID
		providerVisitsToSave.ProviderIds[i] = visit.ProviderID
		providerVisitsToSave.PatientFirstNames[i] = visit.PatientFirstName
		providerVisitsToSave.PatientLastNames[i] = visit.PatientLastName
		providerVisitsToSave.PatientAthenaIds[i] = visit.PatientAthenaID
		providerVisitsToSave.ServiceDates[i] = visit.ServiceDate
		providerVisitsToSave.ChiefComplaints[i] = visit.ChiefComplaint
		providerVisitsToSave.Diagnosises[i] = visit.Diagnosis
		providerVisitsToSave.IsAbxPrescribeds[i] = visit.IsAbxPrescribed
		providerVisitsToSave.AbxDetailses[i] = visit.AbxDetails
		providerVisitsToSave.IsEscalateds[i] = visit.IsEscalated
		providerVisitsToSave.EscalatedReasons[i] = visit.EscalatedReason
	}

	return cdb.queries.TestAddProviderVisits(ctx, providerVisitsToSave)
}

type MarketMetrics struct {
	MarketID                     int64
	OnSceneTimeMedianSeconds     int32
	OnSceneTimeWeekChangeSeconds int32
	ChartClosureRate             float64
	ChartClosureRateWeekChange   float64
	SurveyCaptureRate            float64
	SurveyCaptureRateWeekChange  float64
	NetPromoterScoreAverage      float64
	NetPromoterScoreWeekChange   float64
}

func (cdb *ClinicalKPIDB) SeedMarketMetrics(ctx context.Context, markerMetrics []*MarketMetrics) ([]*clinicalkpisql.MarketMetric, error) {
	marketMetricsToSave := clinicalkpisql.TestAddMarketMetricsParams{
		MarketIds:                    make([]int64, len(markerMetrics)),
		OnSceneTimeMedianSeconds:     make([]int32, len(markerMetrics)),
		OnSceneTimeWeekChangeSeconds: make([]int32, len(markerMetrics)),
		ChartClosureRates:            make([]float64, len(markerMetrics)),
		ChartClosureRateWeekChanges:  make([]float64, len(markerMetrics)),
		SurveyCaptureRates:           make([]float64, len(markerMetrics)),
		SurveyCaptureRateWeekChanges: make([]float64, len(markerMetrics)),
		NetPromoterScoreAverages:     make([]float64, len(markerMetrics)),
		NetPromoterScoreWeekChanges:  make([]float64, len(markerMetrics)),
	}
	for i, market := range markerMetrics {
		marketMetricsToSave.MarketIds[i] = market.MarketID
		marketMetricsToSave.OnSceneTimeMedianSeconds[i] = market.OnSceneTimeMedianSeconds
		marketMetricsToSave.OnSceneTimeWeekChangeSeconds[i] = market.OnSceneTimeWeekChangeSeconds
		marketMetricsToSave.ChartClosureRates[i] = market.ChartClosureRate
		marketMetricsToSave.ChartClosureRateWeekChanges[i] = market.ChartClosureRateWeekChange
		marketMetricsToSave.SurveyCaptureRates[i] = market.SurveyCaptureRate
		marketMetricsToSave.SurveyCaptureRateWeekChanges[i] = market.SurveyCaptureRateWeekChange
		marketMetricsToSave.NetPromoterScoreAverages[i] = market.NetPromoterScoreAverage
		marketMetricsToSave.NetPromoterScoreWeekChanges[i] = market.NetPromoterScoreWeekChange
	}

	return cdb.queries.TestAddMarketMetrics(ctx, marketMetricsToSave)
}

type Provider struct {
	ProviderID int64
	FirstName  string
	LastName   string
	AvatarURL  *string
	JobTitle   *string
}

func (cdb *ClinicalKPIDB) SeedProviders(ctx context.Context, providers []*Provider) (int64, error) {
	providersToSave := make([]clinicalkpisql.TestAddProvidersParams, len(providers))
	for i, provider := range providers {
		providersToSave[i] = clinicalkpisql.TestAddProvidersParams{
			ProviderID: provider.ProviderID,
			FirstName:  provider.FirstName,
			LastName:   provider.LastName,
			AvatarUrl:  sqltypes.ToNullString(provider.AvatarURL),
		}
		if provider.JobTitle != nil {
			providersToSave[i].JobTitle = *provider.JobTitle
		}
	}

	return cdb.queries.TestAddProviders(ctx, providersToSave)
}

type MarketProviderMetrics struct {
	ProviderID                   int64
	MarketID                     int64
	OnSceneTimeMedianSeconds     int32
	OnSceneTimeWeekChangeSeconds int32
	ChartClosureRate             float64
	ChartClosureRateWeekChange   float64
	SurveyCaptureRate            float64
	SurveyCaptureRateWeekChange  float64
	NetPromoterScoreAverage      float64
	NetPromoterScoreWeekChange   float64
	OnTaskPercent                float64
	OnTaskPercentWeekChange      float64
}

func (cdb *ClinicalKPIDB) SeedMarketProviderMetrics(ctx context.Context, marketProviderMetrics []*MarketProviderMetrics) ([]*clinicalkpisql.MarketProviderMetric, error) {
	providerMetricsToSave := clinicalkpisql.TestAddMarketProviderMetricsParams{
		ProviderIds:                  make([]int64, len(marketProviderMetrics)),
		MarketIds:                    make([]int64, len(marketProviderMetrics)),
		OnSceneTimeMedianSeconds:     make([]int32, len(marketProviderMetrics)),
		OnSceneTimeWeekChangeSeconds: make([]int32, len(marketProviderMetrics)),
		ChartClosureRates:            make([]float64, len(marketProviderMetrics)),
		ChartClosureRateWeekChanges:  make([]float64, len(marketProviderMetrics)),
		SurveyCaptureRates:           make([]float64, len(marketProviderMetrics)),
		SurveyCaptureRateWeekChanges: make([]float64, len(marketProviderMetrics)),
		NetPromoterScoreAverages:     make([]float64, len(marketProviderMetrics)),
		NetPromoterScoreWeekChanges:  make([]float64, len(marketProviderMetrics)),
		OnTaskPercents:               make([]float64, len(marketProviderMetrics)),
		OnTaskPercentWeekChanges:     make([]float64, len(marketProviderMetrics)),
	}
	for i, metrics := range marketProviderMetrics {
		providerMetricsToSave.ProviderIds[i] = metrics.ProviderID
		providerMetricsToSave.MarketIds[i] = metrics.MarketID
		providerMetricsToSave.OnSceneTimeMedianSeconds[i] = metrics.OnSceneTimeMedianSeconds
		providerMetricsToSave.OnSceneTimeWeekChangeSeconds[i] = metrics.OnSceneTimeWeekChangeSeconds
		providerMetricsToSave.ChartClosureRates[i] = metrics.ChartClosureRate
		providerMetricsToSave.ChartClosureRateWeekChanges[i] = metrics.ChartClosureRateWeekChange
		providerMetricsToSave.SurveyCaptureRates[i] = metrics.SurveyCaptureRate
		providerMetricsToSave.SurveyCaptureRateWeekChanges[i] = metrics.SurveyCaptureRateWeekChange
		providerMetricsToSave.NetPromoterScoreAverages[i] = metrics.NetPromoterScoreAverage
		providerMetricsToSave.NetPromoterScoreWeekChanges[i] = metrics.NetPromoterScoreWeekChange
		providerMetricsToSave.OnTaskPercents[i] = metrics.OnTaskPercent
		providerMetricsToSave.OnTaskPercentWeekChanges[i] = metrics.OnTaskPercentWeekChange
	}

	return cdb.queries.TestAddMarketProviderMetrics(ctx, providerMetricsToSave)
}

type ProviderShift struct {
	ShiftTeamID               int64
	ProviderID                int64
	ServiceDate               time.Time
	StartTime                 time.Time
	EndTime                   time.Time
	PatientsSeen              int32
	OutTheDoorDurationSeconds int32
	EnRouteDurationSeconds    int32
	OnSceneDurationSeconds    int32
	OnBreakDurationSeconds    int32
	IdleDurationSeconds       int32
}

func (cdb *ClinicalKPIDB) SeedProviderShifts(ctx context.Context, providerShifts []*ProviderShift) ([]*clinicalkpisql.ProviderShift, error) {
	providerShiftsToSave := clinicalkpisql.TestAddProviderShiftsParams{
		ShiftTeamIds:              make([]int64, len(providerShifts)),
		ProviderIds:               make([]int64, len(providerShifts)),
		ServiceDates:              make([]time.Time, len(providerShifts)),
		StartTimes:                make([]time.Time, len(providerShifts)),
		EndTimes:                  make([]time.Time, len(providerShifts)),
		PatientsSeens:             make([]int32, len(providerShifts)),
		OutTheDoorDurationSeconds: make([]int32, len(providerShifts)),
		EnRouteDurationSeconds:    make([]int32, len(providerShifts)),
		OnSceneDurationSeconds:    make([]int32, len(providerShifts)),
		OnBreakDurationSeconds:    make([]int32, len(providerShifts)),
		IdleDurationSeconds:       make([]int32, len(providerShifts)),
	}
	for i, providerShift := range providerShifts {
		providerShiftsToSave.ShiftTeamIds[i] = providerShift.ShiftTeamID
		providerShiftsToSave.ProviderIds[i] = providerShift.ProviderID
		providerShiftsToSave.ServiceDates[i] = providerShift.ServiceDate
		providerShiftsToSave.StartTimes[i] = providerShift.StartTime
		providerShiftsToSave.EndTimes[i] = providerShift.EndTime
		providerShiftsToSave.PatientsSeens[i] = providerShift.PatientsSeen
		providerShiftsToSave.OutTheDoorDurationSeconds[i] = providerShift.OutTheDoorDurationSeconds
		providerShiftsToSave.EnRouteDurationSeconds[i] = providerShift.EnRouteDurationSeconds
		providerShiftsToSave.OnSceneDurationSeconds[i] = providerShift.OnSceneDurationSeconds
		providerShiftsToSave.OnBreakDurationSeconds[i] = providerShift.OnBreakDurationSeconds
		providerShiftsToSave.IdleDurationSeconds[i] = providerShift.IdleDurationSeconds
	}

	return cdb.queries.TestAddProviderShifts(ctx, providerShiftsToSave)
}

type MarketGroup struct {
	MarketGroupID int64
	Name          string
}

func (cdb *ClinicalKPIDB) SeedMarketGroups(ctx context.Context, marketGroups []MarketGroup) ([]*clinicalkpisql.MarketGroup, error) {
	marketGroupsCount := len(marketGroups)
	marketGroupsToSave := clinicalkpisql.TestAddMarketGroupsParams{
		MarketGroupIds:   make([]int64, marketGroupsCount),
		MarketGroupNames: make([]string, marketGroupsCount),
	}
	for i, marketGroup := range marketGroups {
		marketGroupsToSave.MarketGroupIds[i] = marketGroup.MarketGroupID
		marketGroupsToSave.MarketGroupNames[i] = marketGroup.Name
	}
	return cdb.queries.TestAddMarketGroups(ctx, marketGroupsToSave)
}

type ProviderDailyMetrics struct {
	ProviderID             int64
	MarketID               int64
	ServiceDate            time.Time
	PatientsSeen           int32
	OnShiftDurationSeconds int32
}

func (cdb *ClinicalKPIDB) SeedProviderDailyMetrics(ctx context.Context, metrics []ProviderDailyMetrics) ([]*clinicalkpisql.ProviderDailyMetric, error) {
	metricsCount := len(metrics)
	metricsToSave := clinicalkpisql.TestAddProviderDailyMetricsParams{
		ProviderIds:                  make([]int64, metricsCount),
		MarketIds:                    make([]int64, metricsCount),
		ServiceDates:                 make([]time.Time, metricsCount),
		PatientsSeenValues:           make([]int32, metricsCount),
		OnShiftDurationSecondsValues: make([]int32, metricsCount),
	}
	for i, metric := range metrics {
		metricsToSave.ProviderIds[i] = metric.ProviderID
		metricsToSave.MarketIds[i] = metric.MarketID
		metricsToSave.ServiceDates[i] = metric.ServiceDate
		metricsToSave.PatientsSeenValues[i] = metric.PatientsSeen
		metricsToSave.OnShiftDurationSecondsValues[i] = metric.OnShiftDurationSeconds
	}
	return cdb.queries.TestAddProviderDailyMetrics(ctx, metricsToSave)
}

func (cdb *ClinicalKPIDB) DeleteAllLookBackMetrics(ctx context.Context) error {
	if err := cdb.queries.TestDeleteAllMarkets(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllMarketGroups(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllProviderDailyMetrics(ctx); err != nil {
		return err
	}
	if err := cdb.queries.TestDeleteAllShiftSnapshots(ctx); err != nil {
		return err
	}
	return cdb.queries.TestDeleteAllProviderShifts(ctx)
}

//go:build db_test

package clinicalkpidb_test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math/big"
	"testing"
	"time"

	"github.com/DataDog/datadog-go/v5/statsd"
	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpiconv"
	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

var (
	testDBName = "clinicalkpi"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *clinicalkpisql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, clinicalkpisql.New(db), func() {
		db.Close()
	}
}

var dbResultMustMatch = testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")

var (
	mockCareRequestsCompletedLastSevenDays = int32(20)
	mockCompleteCareRequests               = int32(90)

	mockChangeDays = int32(7)

	mockOnSceneTimeSecs       = sqltypes.ToValidNullInt32(int32(3600))
	mockOnSceneTimeSecsChange = sqltypes.ToValidNullInt32(int32(3600))

	mockNetPromoterScore, _       = pgtypes.BuildNumeric(int32(3600))
	mockNetPromoterScoreChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockChartClosureRate, _       = pgtypes.BuildNumeric(int32(3600))
	mockChartClosureRateChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockSurveyCaptureRate, _       = pgtypes.BuildNumeric(int32(3600))
	mockSurveyCaptureRateChange, _ = pgtypes.BuildNumeric(int32(3600))

	mockLastCareRequestCompletedAt = sqltypes.ToValidNullTime(time.Now())

	mockCompletedCareRequests = int32(100)
)

func TestIsHealthy(t *testing.T) {
	ctx, _, _, done := setupDBTest(t)
	defer done()

	testCases := []struct {
		name           string
		db             *basedb.MockPingDBTX
		expectedOutput bool
	}{
		{
			name:           "DB is healthy",
			db:             &basedb.MockPingDBTX{},
			expectedOutput: true,
		},
		{
			name:           "DB is unhealthy",
			db:             &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			expectedOutput: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			clinicalkpidb := clinicalkpidb.NewClinicalKPIDB(testCase.db, nil, nil)
			isHealthy := clinicalkpidb.IsHealthy(ctx)

			if isHealthy != testCase.expectedOutput {
				testutils.MustMatch(t, testCase.expectedOutput, isHealthy, "IsHealthy test failed")
			}
		})
	}
}

func compareCalculatedMetrics(t *testing.T, want clinicalkpisql.CalculatedProviderMetric, got clinicalkpisql.CalculatedProviderMetric) {
	testutils.MustMatchFn(".CreatedAt", ".UpdatedAt", ".SurveyCaptureRate", ".ChartClosureRate", ".AverageNetPromoterScore", ".SurveyCaptureRateChange", ".ChartClosureRateChange", ".AverageNetPromoterScoreChange", ".LastCareRequestCompletedAt")(t, want, got, "all fields must match except excluded fields!")
	compareNumeric(t, want.ChartClosureRate, got.ChartClosureRate, "ChartClosureRate does not match")
	compareNumeric(t, want.SurveyCaptureRate, got.SurveyCaptureRate, "SurveyCaptureRate does not match")
	compareNumeric(t, want.AverageNetPromoterScore, got.AverageNetPromoterScore, "AverageNetPromoterScore does not match")
	compareNumeric(t, want.ChartClosureRateChange, got.ChartClosureRateChange, "ChartClosureRateChange does not match")
	compareNumeric(t, want.SurveyCaptureRateChange, got.SurveyCaptureRateChange, "SurveyCaptureRateChange does not match")
	compareNumeric(t, want.AverageNetPromoterScoreChange, got.AverageNetPromoterScoreChange, "AverageNetPromoterScoreChange does not match")
}

func compareStagingMetrics(t *testing.T, want clinicalkpisql.StagingProviderMetric, got clinicalkpisql.StagingProviderMetric) {
	testutils.MustMatchFn(".ID", ".CreatedAt", ".SurveyCaptureRate", ".ChartClosureRate", ".AverageNetPromoterScore", ".LastCareRequestCompletedAt")(t, want, got, "all fields must match except excluded fields!")
	compareNumeric(t, want.ChartClosureRate, got.ChartClosureRate, "ChartClosureRate does not match")
	compareNumeric(t, want.SurveyCaptureRate, got.SurveyCaptureRate, "SurveyCaptureRate does not match")
	compareNumeric(t, want.AverageNetPromoterScore, got.AverageNetPromoterScore, "AverageNetPromoterScore does not match")
}

func compareHistoricalMetrics(t *testing.T, want clinicalkpisql.HistoricalProviderMetric, got clinicalkpisql.HistoricalProviderMetric) {
	testutils.MustMatchFn(".ID", ".CreatedAt", ".SurveyCaptureRate", ".ChartClosureRate", ".AverageNetPromoterScore", ".LastCareRequestCompletedAt")(t, want, got, "all fields must match except excluded fields!")
	compareNumeric(t, want.ChartClosureRate, got.ChartClosureRate, "ChartClosureRate does not match")
	compareNumeric(t, want.SurveyCaptureRate, got.SurveyCaptureRate, "SurveyCaptureRate does not match")
	compareNumeric(t, want.AverageNetPromoterScore, got.AverageNetPromoterScore, "AverageNetPromoterScore does not match")
}

func compareGetProviderDailyMetricsWithMarketGroupAveragesFromDateRows(t *testing.T, want clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow, got clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow) {
	testutils.MustMatchFn(".MarketGroupAveragePatientsSeen", ".MarketGroupAverageOnShiftDurationSeconds")(t, want, got, "all fields must match except excluded fields!")
	compareNumeric(t, want.MarketGroupAveragePatientsSeen, got.MarketGroupAveragePatientsSeen, "MarketGroupAveragePatientsSeen does not match")
	compareNumeric(t, want.MarketGroupAverageOnShiftDurationSeconds, got.MarketGroupAverageOnShiftDurationSeconds, "MarketGroupAverageOnShiftDurationSeconds does not match")
}

func compareGetLastShiftSnapshotsRows(t *testing.T, want clinicalkpisql.GetLastShiftSnapshotsRow, got clinicalkpisql.GetLastShiftSnapshotsRow) {
	testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, want, got, "all fields must match except excluded fields!")
}

func compareNumeric(t *testing.T, want pgtype.Numeric, got pgtype.Numeric, errMsg string) {
	testutils.MustMatch(t, pgtypes.NumericToProtoFloat64(want), pgtypes.NumericToProtoFloat64(got), errMsg)
}

func TestCDB_GetCalculatedMetricsForProvidersActiveAfterDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID
	providerID1 := baseID + 1
	activeAfterDateQuery := time.Date(2022, time.Month(9), 25, 12, 0, 0, 0, time.UTC)
	includedDate := activeAfterDateQuery.AddDate(0, 2, 0)
	notIncludedDate := activeAfterDateQuery.AddDate(0, -1, 0)

	testCases := []struct {
		Name    string
		Metrics []clinicalkpisql.UpsertCalculatedProviderMetricsParams
		Query   clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams

		Want []clinicalkpisql.CalculatedProviderMetric
	}{
		{
			Name: "excludes metrics for inactive providers",
			Metrics: []clinicalkpisql.UpsertCalculatedProviderMetricsParams{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(includedDate),
				},
				{
					ProviderID:                         providerID1,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(notIncludedDate),
				},
			},
			Query: clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams{
				ProviderIds: []int64{providerID, providerID1},
				ActiveAfter: sqltypes.ToValidNullTime(activeAfterDateQuery),
			},

			Want: []clinicalkpisql.CalculatedProviderMetric{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            mockNetPromoterScore,
					AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
					ChartClosureRate:                   mockChartClosureRate,
					ChartClosureRateChange:             mockChartClosureRateChange,
					SurveyCaptureRate:                  mockSurveyCaptureRate,
					SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
					ChangeDays:                         mockChangeDays,
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(includedDate),
				},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			for _, mtr := range testCase.Metrics {
				_, err := queries.UpsertCalculatedProviderMetrics(ctx, mtr)
				if err != nil {
					t.Fatal(err)
				}
			}

			metricsFound, err := cdb.GetCalculatedMetricsForProvidersActiveAfterDate(ctx, testCase.Query)
			if err != nil {
				t.Fatal(err)
			}

			for i, metric := range metricsFound {
				if metric.LastCareRequestCompletedAt.Time.Before(testCase.Query.ActiveAfter.Time) {
					t.Fatal(err)
				}
				compareCalculatedMetrics(t, testCase.Want[i], *metric)
			}
		})
	}
}

func TestCDB_AddActiveProviderForMarkets(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	marketID1 := baseID + 1

	tcs := []struct {
		Name          string
		Upsert        []clinicalkpisql.AddActiveProviderForMarketsParams
		QueryMarketID int64

		Want []int64
	}{
		{
			Name: "success - base case",
			Upsert: []clinicalkpisql.AddActiveProviderForMarketsParams{
				{
					ProviderID: providerID1,
					MarketIds:  []int64{marketID1},
				},
			},
			QueryMarketID: marketID1,

			Want: []int64{providerID1},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			for _, u := range tc.Upsert {
				err := cdb.AddActiveProviderForMarkets(ctx, u)
				if err != nil {
					t.Fatal(err)
				}
			}

			providerIDs, err := cdb.GetActiveProvidersForMarket(ctx, tc.QueryMarketID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, providerIDs, "unexpected result")
		})
	}
}

func TestCDB_GetActiveProvidersForMarket(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	marketID1 := baseID + 1

	tcs := []struct {
		Name   string
		Upsert []clinicalkpisql.AddActiveProviderForMarketsParams
		Query  int64

		Want []int64
	}{
		{
			Name: "success - base case",
			Upsert: []clinicalkpisql.AddActiveProviderForMarketsParams{
				{
					ProviderID: providerID1,
					MarketIds:  []int64{marketID1},
				},
			},
			Query: marketID1,

			Want: []int64{providerID1},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			for _, u := range tc.Upsert {
				err := queries.AddActiveProviderForMarkets(ctx, u)
				if err != nil {
					t.Fatal(err)
				}
			}

			providerIDs, err := cdb.GetActiveProvidersForMarket(ctx, tc.Query)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, providerIDs, "unexpected result")
		})
	}
}

func TestCDB_GetActiveMarketsForProvider(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	marketID1 := baseID + 2

	tcs := []struct {
		Name   string
		Upsert []clinicalkpisql.AddActiveProviderForMarketsParams
		Query  int64

		Want []int64
	}{
		{
			Name: "success - base case",
			Upsert: []clinicalkpisql.AddActiveProviderForMarketsParams{
				{
					ProviderID: providerID1,
					MarketIds:  []int64{marketID1},
				},
			},
			Query: providerID1,

			Want: []int64{marketID1},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			for _, u := range tc.Upsert {
				err := queries.AddActiveProviderForMarkets(ctx, u)
				if err != nil {
					t.Fatal(err)
				}
			}

			marketIDs, err := cdb.GetActiveMarketsForProvider(ctx, tc.Query)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, marketIDs, "unexpected result")
		})
	}
}

func TestCDB_DeleteActiveMarketsForProvider(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	marketID1 := baseID + 2

	tcs := []struct {
		Name   string
		Upsert []clinicalkpisql.AddActiveProviderForMarketsParams
		Query  clinicalkpisql.DeleteActiveMarketsForProviderParams

		Want []int64
	}{
		{
			Name: "success - base case",
			Upsert: []clinicalkpisql.AddActiveProviderForMarketsParams{
				{
					ProviderID: providerID1,
					MarketIds:  []int64{marketID1},
				},
			},
			Query: clinicalkpisql.DeleteActiveMarketsForProviderParams{
				ProviderID: providerID1,
				MarketIds:  []int64{marketID1},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			for _, u := range tc.Upsert {
				err := queries.AddActiveProviderForMarkets(ctx, u)
				if err != nil {
					t.Fatal(err)
				}
			}

			err := cdb.DeleteActiveMarketsForProvider(ctx, tc.Query)
			if err != nil {
				t.Fatal(err)
			}

			marketIDs, err := cdb.GetActiveMarketsForProvider(ctx, tc.Query.ProviderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, marketIDs, "unexpected result")
		})
	}
}

type mockStatsDClient struct {
	statsd.ClientInterface

	histogramErr error
	countErr     error
}

func (c mockStatsDClient) Histogram(name string, value float64, tags []string, rate float64) error {
	return c.histogramErr
}

func (c mockStatsDClient) Count(name string, value int64, tags []string, rate float64) error {
	return c.countErr
}

type mockClinicalKPIDBTX struct {
	basedb.DBTX

	QueryResult pgx.Rows
	QueryErr    error
}

func (db *mockClinicalKPIDBTX) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	return db.QueryResult, db.QueryErr
}

func TestProcessStagingRecords(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	providerID := now.UnixNano()
	providerID1 := now.UnixNano() + 1
	providerID2 := now.UnixNano() + 2
	providerID3 := now.UnixNano() + 3
	providerID4 := now.UnixNano() + 4
	providerID5 := now.UnixNano() + 5
	providerID6 := now.UnixNano() + 6
	careRequestsCompletedLastSevenDays := int32(20)
	oldMedianNps, _ := pgtypes.BuildNumeric(98)
	newMedianNps, _ := pgtypes.BuildNumeric(96)
	changeMedianNps, _ := pgtypes.BuildNumeric(-2)
	oldSurveyCaptureRate, _ := pgtypes.BuildNumeric(98)
	newSurveyCaptureRate, _ := pgtypes.BuildNumeric(99)
	changeSurveyCaptureRate, _ := pgtypes.BuildNumeric(1)
	oldChartClosureRate, _ := pgtypes.BuildNumeric(98)
	newChartClosureRate, _ := pgtypes.BuildNumeric(95)
	changeChartClosureRate, _ := pgtypes.BuildNumeric(-3)
	oldMedianOnSceneTimeSecs := sqltypes.ToValidNullInt32(int32(3600))
	newMedianOnSceneTimeSecs := sqltypes.ToValidNullInt32(int32(3500))
	changeMedianOnSceneTimeSecs := sqltypes.ToValidNullInt32(int32(-100))
	lastCareRequestCompletedAt := sqltypes.ToValidNullTime(now)

	tcs := []struct {
		desc                    string
		providerIDQuery         int64
		changeDaysPeriod        int
		activeMarketsIDs        []int64
		historicalMetrics       []clinicalkpisql.AddHistoricalProviderMetricParams
		stagingProviderMetrics  []clinicalkpisql.AddStagingProviderMetricParams
		statsdClient            statsd.ClientInterface
		deleteAllStagingMetrics bool
		db                      basedb.DBTX

		wantCalculatedMetric      *clinicalkpisql.CalculatedProviderMetric
		wantActiveMarkets         []int64
		wantStagingMetricsDeleted bool
		wantError                 error
	}{
		{
			desc: "oldest historicalProviderMetrics not found then transaction should rollback changes",
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID1,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID1,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: -100,
			statsdClient:     mockStatsDClient{},
			db:               db,

			wantCalculatedMetric:      &clinicalkpisql.CalculatedProviderMetric{},
			wantStagingMetricsDeleted: false,
			wantError:                 nil,
		},
		{
			desc:                   "failed - as staging table is empty",
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{},
			historicalMetrics:      []clinicalkpisql.AddHistoricalProviderMetricParams{},
			changeDaysPeriod:       90,
			statsdClient:           mockStatsDClient{},
			db:                     db,

			wantCalculatedMetric:      &clinicalkpisql.CalculatedProviderMetric{},
			wantStagingMetricsDeleted: false,
			wantError:                 nil,
		},
		{
			desc:             "success - transaction should commit changes",
			providerIDQuery:  providerID,
			activeMarketsIDs: []int64{1, 2, 4, 5, 6},
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            newMedianNps,
					ChartClosureRate:                   newChartClosureRate,
					SurveyCaptureRate:                  newSurveyCaptureRate,
					MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
					MarketIds:                          sqltypes.ToValidNullString("1|2|3"),
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			statsdClient:     mockStatsDClient{},
			db:               db,

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newMedianNps,
				AverageNetPromoterScoreChange:      changeMedianNps,
				ChartClosureRate:                   newChartClosureRate,
				ChartClosureRateChange:             changeChartClosureRate,
				SurveyCaptureRate:                  newSurveyCaptureRate,
				SurveyCaptureRateChange:            changeSurveyCaptureRate,
				MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        changeMedianOnSceneTimeSecs,
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantActiveMarkets:         []int64{1, 2, 3},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{
			desc:             "success - nil datadog record does not cause error",
			providerIDQuery:  providerID2,
			activeMarketsIDs: []int64{1, 2, 4, 5, 6},
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID2,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            newMedianNps,
					ChartClosureRate:                   newChartClosureRate,
					SurveyCaptureRate:                  newSurveyCaptureRate,
					MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
					MarketIds:                          sqltypes.ToValidNullString("1|2|3"),
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID2,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			statsdClient:     mockStatsDClient{},
			db:               db,

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID2,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newMedianNps,
				AverageNetPromoterScoreChange:      changeMedianNps,
				ChartClosureRate:                   newChartClosureRate,
				ChartClosureRateChange:             changeChartClosureRate,
				SurveyCaptureRate:                  newSurveyCaptureRate,
				SurveyCaptureRateChange:            changeSurveyCaptureRate,
				MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        changeMedianOnSceneTimeSecs,
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantActiveMarkets:         []int64{1, 2, 3},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{
			desc:            "success - transaction should handle null values",
			providerIDQuery: providerID,
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            pgtype.Numeric{Status: pgtype.Null},
					ChartClosureRate:                   pgtype.Numeric{Status: pgtype.Null},
					SurveyCaptureRate:                  pgtype.Numeric{Status: pgtype.Null},
					MedianOnSceneTimeSecs:              sqltypes.ToNullInt32(nil),
					LastCareRequestCompletedAt:         sqltypes.StringToNullTime(nil),
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            pgtype.Numeric{Status: pgtype.Null},
					ChartClosureRate:                   pgtype.Numeric{Status: pgtype.Null},
					SurveyCaptureRate:                  pgtype.Numeric{Status: pgtype.Null},
					MedianOnSceneTimeSecs:              sqltypes.ToNullInt32(nil),
					LastCareRequestCompletedAt:         sqltypes.StringToNullTime(nil),
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			statsdClient:     mockStatsDClient{},
			db:               db,

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            pgtype.Numeric{Status: pgtype.Null},
				AverageNetPromoterScoreChange:      pgtype.Numeric{Status: pgtype.Null},
				ChartClosureRate:                   pgtype.Numeric{Status: pgtype.Null},
				ChartClosureRateChange:             pgtype.Numeric{Status: pgtype.Null},
				SurveyCaptureRate:                  pgtype.Numeric{Status: pgtype.Null},
				SurveyCaptureRateChange:            pgtype.Numeric{Status: pgtype.Null},
				MedianOnSceneTimeSecs:              sqltypes.ToNullInt32(nil),
				MedianOnSceneTimeSecsChange:        sqltypes.ToNullInt32(nil),
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         sqltypes.StringToNullTime(nil),
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{
			desc:                    "success - no metrics to process",
			providerIDQuery:         providerID3,
			stagingProviderMetrics:  []clinicalkpisql.AddStagingProviderMetricParams{},
			historicalMetrics:       []clinicalkpisql.AddHistoricalProviderMetricParams{},
			deleteAllStagingMetrics: true,
			statsdClient:            mockStatsDClient{},
			db:                      db,

			wantCalculatedMetric: nil,
			wantError:            nil,
		},
		{
			desc:             "success - error logging statsd histogram does not return error",
			providerIDQuery:  providerID4,
			activeMarketsIDs: []int64{1, 2, 4, 5, 6},
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID4,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            newMedianNps,
					ChartClosureRate:                   newChartClosureRate,
					SurveyCaptureRate:                  newSurveyCaptureRate,
					MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
					MarketIds:                          sqltypes.ToValidNullString("1|2|3"),
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID4,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			db:               db,
			statsdClient: mockStatsDClient{
				histogramErr: errors.New("histogram error"),
			},

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID4,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newMedianNps,
				AverageNetPromoterScoreChange:      changeMedianNps,
				ChartClosureRate:                   newChartClosureRate,
				ChartClosureRateChange:             changeChartClosureRate,
				SurveyCaptureRate:                  newSurveyCaptureRate,
				SurveyCaptureRateChange:            changeSurveyCaptureRate,
				MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        changeMedianOnSceneTimeSecs,
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantActiveMarkets:         []int64{1, 2, 3},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{

			desc:             "success - error logging statsd count does not return error",
			providerIDQuery:  providerID5,
			activeMarketsIDs: []int64{1, 2, 4, 5, 6},
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID5,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            newMedianNps,
					ChartClosureRate:                   newChartClosureRate,
					SurveyCaptureRate:                  newSurveyCaptureRate,
					MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
					MarketIds:                          sqltypes.ToValidNullString("1|2|3"),
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID5,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			db:               db,
			statsdClient: mockStatsDClient{
				countErr: errors.New("count error"),
			},

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID5,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newMedianNps,
				AverageNetPromoterScoreChange:      changeMedianNps,
				ChartClosureRate:                   newChartClosureRate,
				ChartClosureRateChange:             changeChartClosureRate,
				SurveyCaptureRate:                  newSurveyCaptureRate,
				SurveyCaptureRateChange:            changeSurveyCaptureRate,
				MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        changeMedianOnSceneTimeSecs,
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantActiveMarkets:         []int64{1, 2, 3},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{
			desc:             "success - nil statsd does not return error",
			providerIDQuery:  providerID6,
			activeMarketsIDs: []int64{1, 2, 4, 5, 6},
			stagingProviderMetrics: []clinicalkpisql.AddStagingProviderMetricParams{
				{
					ProviderID:                         providerID6,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            newMedianNps,
					ChartClosureRate:                   newChartClosureRate,
					SurveyCaptureRate:                  newSurveyCaptureRate,
					MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
					MarketIds:                          sqltypes.ToValidNullString("1|2|3"),
				},
			},
			historicalMetrics: []clinicalkpisql.AddHistoricalProviderMetricParams{
				{
					ProviderID:                         providerID6,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            oldMedianNps,
					ChartClosureRate:                   oldChartClosureRate,
					SurveyCaptureRate:                  oldSurveyCaptureRate,
					MedianOnSceneTimeSecs:              oldMedianOnSceneTimeSecs,
					LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				},
			},
			changeDaysPeriod: 90,
			statsdClient:     nil,
			db:               db,

			wantCalculatedMetric: &clinicalkpisql.CalculatedProviderMetric{
				ProviderID:                         providerID6,
				CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            newMedianNps,
				AverageNetPromoterScoreChange:      changeMedianNps,
				ChartClosureRate:                   newChartClosureRate,
				ChartClosureRateChange:             changeChartClosureRate,
				SurveyCaptureRate:                  newSurveyCaptureRate,
				SurveyCaptureRateChange:            changeSurveyCaptureRate,
				MedianOnSceneTimeSecs:              newMedianOnSceneTimeSecs,
				MedianOnSceneTimeSecsChange:        changeMedianOnSceneTimeSecs,
				ChangeDays:                         int32(90),
				LastCareRequestCompletedAt:         lastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
			wantActiveMarkets:         []int64{1, 2, 3},
			wantStagingMetricsDeleted: true,
			wantError:                 nil,
		},
		{
			desc: "failed - unable to retrieve staging provider metrics",
			db:   &mockClinicalKPIDBTX{QueryErr: errors.New("1,2,3")},

			wantActiveMarkets: nil,
			wantError:         status.Error(codes.Internal, "failed to get staging provider metrics: 1,2,3"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(tc.db, nil, &monitoring.DataDogRecorder{Client: tc.statsdClient})

			if tc.deleteAllStagingMetrics {
				err := queries.DeleteAllStagingProviderMetrics(ctx)
				if err != nil {
					t.Fatal(err)
				}
			}

			historicalMetrics := tc.historicalMetrics
			if len(historicalMetrics) > 0 {
				for i := 0; i < len(historicalMetrics); i++ {
					_, err := queries.AddHistoricalProviderMetric(ctx, historicalMetrics[i])
					if err != nil {
						t.Fatal(err)
					}
				}
			}

			if len(tc.activeMarketsIDs) > 0 {
				err := queries.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
					ProviderID: tc.providerIDQuery,
					MarketIds:  tc.activeMarketsIDs,
				})
				if err != nil {
					t.Fatal(err)
				}
			}

			stagingProviderMetricsToAdd := tc.stagingProviderMetrics
			stagingProviderMetricIDs := []int64{}
			if len(stagingProviderMetricsToAdd) > 0 {
				for i := 0; i < len(stagingProviderMetricsToAdd); i++ {
					m, err := queries.AddStagingProviderMetric(ctx, stagingProviderMetricsToAdd[i])
					if err != nil {
						t.Fatal(err)
					}

					stagingProviderMetricIDs = append(stagingProviderMetricIDs, m.ID)
				}
			}

			err := cdb.ProcessStagingRecords(ctx, tc.changeDaysPeriod, zap.NewNop().Sugar())

			testutils.MustMatch(t, tc.wantError, err)

			foundCalculatedMetric, err := queries.GetCalculatedMetricsByProvider(ctx, tc.providerIDQuery)
			if err != nil && !errors.Is(err, pgx.ErrNoRows) {
				t.Fatal(err)
			}

			if tc.wantCalculatedMetric != nil {
				if foundCalculatedMetric != nil {
					compareCalculatedMetrics(t, *tc.wantCalculatedMetric, *foundCalculatedMetric)
				} else {
					t.Fatal(fmt.Errorf("unexpected calculated metric"))
				}
			}

			if tc.wantStagingMetricsDeleted {
				remainingStagingProviderMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
				if err != nil {
					t.Fatal(err)
				}

				for _, existingMetric := range remainingStagingProviderMetrics {
					if slices.Contains(stagingProviderMetricIDs, existingMetric.ID) {
						t.Fatal("unexpected staging metric")
					}
				}
			}

			if tc.wantActiveMarkets != nil {
				gotActiveMarkets, err := queries.GetActiveMarketsForProvider(ctx, tc.providerIDQuery)
				if err != nil {
					t.Fatal(err)
				}

				testutils.MustMatch(t, tc.wantActiveMarkets, gotActiveMarkets, "Unexpected behavior occurs")
			}
		})
	}
}

func TestParseMarketIDs(t *testing.T) {
	tcs := []struct {
		desc        string
		inputString sql.NullString

		want                 []int64
		wantMarketParseCount int
	}{
		{
			desc:        "success - base case",
			inputString: sqltypes.ToValidNullString("1|2|3"),

			want:                 []int64{1, 2, 3},
			wantMarketParseCount: 0,
		},
		{
			desc:        "success - invalid market ID",
			inputString: sqltypes.ToValidNullString("1|b|3"),

			want:                 []int64{1, 3},
			wantMarketParseCount: 1,
		},
		{
			desc:        "success - null error counter",
			inputString: sqltypes.ToNullString(nil),

			want:                 []int64{},
			wantMarketParseCount: 0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			result, errors := clinicalkpidb.ParseMarketIDs(tc.inputString, zap.NewNop().Sugar())

			testutils.MustMatch(t, tc.want, result, "unexpected market IDs result")
			testutils.MustMatch(t, tc.wantMarketParseCount, len(errors), "Unexpected count of market parse errors")
		})
	}
}

func TestSubtractNumerics(t *testing.T) {
	oldVal, _ := pgtypes.BuildNumeric(100)
	newVal, _ := pgtypes.BuildNumeric(58)
	wantVal, _ := pgtypes.BuildNumeric(-42)
	nilVal, _ := pgtypes.BuildNumeric(nil)

	tcs := []struct {
		desc   string
		newVal pgtype.Numeric
		oldVal pgtype.Numeric
		want   pgtype.Numeric
	}{
		{
			desc:   "new value is nil then nil should be returned",
			newVal: nilVal,
			oldVal: oldVal,
			want:   pgtype.Numeric{Status: pgtype.Null},
		}, {
			desc:   "old value is nil then nil should be returned",
			newVal: newVal,
			oldVal: nilVal,
			want:   pgtype.Numeric{Status: pgtype.Null},
		}, {
			desc:   "old value and new value not nil then we should calculate",
			newVal: newVal,
			oldVal: oldVal,
			want:   wantVal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			result, err := clinicalkpidb.SubtractNumerics(tc.newVal, tc.oldVal)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.want, result, "Unexpected behavior occurs")
		})
	}
}

func TestCDB_GetProviderVisits(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()

	providerID := baseID + 1
	careRequestID1 := baseID + 101
	careRequestID2 := baseID + 102

	todayDate, _ := time.Parse("2006-01-02", time.DateOnly)
	yesterdayDate := todayDate.AddDate(0, 0, -1)

	_, err := queries.TestAddProviderVisits(ctx, clinicalkpisql.TestAddProviderVisitsParams{
		CareRequestIds:    []int64{careRequestID1, careRequestID2},
		ProviderIds:       []int64{providerID, providerID},
		PatientFirstNames: []string{"John", "Tom"},
		PatientLastNames:  []string{"Doe", "Smith"},
		PatientAthenaIds:  []string{"123456", "123457"},
		ServiceDates:      []time.Time{todayDate, yesterdayDate},
		ChiefComplaints:   []string{"ear pain", "headache"},
		Diagnosises:       []string{"diagnose 1", "diagnose 2"},
		IsAbxPrescribeds:  []bool{false, true},
		AbxDetailses:      []string{"", "some details"},
		IsEscalateds:      []bool{true, false},
		EscalatedReasons:  []string{"some reason", ""},
	})
	if err != nil {
		t.Fatal(err)
	}

	johnDoeVisit := []*clinicalkpisql.ProviderVisit{
		{
			CareRequestID:    careRequestID1,
			ProviderID:       providerID,
			PatientFirstName: "John",
			PatientLastName:  "Doe",
			PatientAthenaID:  "123456",
			ServiceDate:      todayDate,
			ChiefComplaint:   sql.NullString{Valid: true, String: "ear pain"},
			Diagnosis:        sql.NullString{Valid: true, String: "diagnose 1"},
			IsAbxPrescribed:  false,
			AbxDetails:       sql.NullString{Valid: true, String: ""},
			IsEscalated:      true,
			EscalatedReason:  sql.NullString{Valid: true, String: "some reason"},
		},
	}

	tcs := []struct {
		desc  string
		query clinicalkpidb.GetProviderVisitsParams

		want *clinicalkpidb.GetProviderVisitsResponse
	}{
		{
			desc: "should return all provider's visits",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows: []*clinicalkpisql.ProviderVisit{
					{
						CareRequestID:    careRequestID1,
						ProviderID:       providerID,
						PatientFirstName: "John",
						PatientLastName:  "Doe",
						PatientAthenaID:  "123456",
						ServiceDate:      todayDate,
						ChiefComplaint:   sql.NullString{Valid: true, String: "ear pain"},
						Diagnosis:        sql.NullString{Valid: true, String: "diagnose 1"},
						IsAbxPrescribed:  false,
						AbxDetails:       sql.NullString{Valid: true, String: ""},
						IsEscalated:      true,
						EscalatedReason:  sql.NullString{Valid: true, String: "some reason"},
					},
					{
						CareRequestID:    careRequestID2,
						ProviderID:       providerID,
						PatientFirstName: "Tom",
						PatientLastName:  "Smith",
						PatientAthenaID:  "123457",
						ServiceDate:      yesterdayDate,
						ChiefComplaint:   sql.NullString{Valid: true, String: "headache"},
						Diagnosis:        sql.NullString{Valid: true, String: "diagnose 2"},
						IsAbxPrescribed:  true,
						AbxDetails:       sql.NullString{Valid: true, String: "some details"},
						IsEscalated:      false,
						EscalatedReason:  sql.NullString{Valid: true, String: ""},
					},
				},
				Total: 2,
			},
		},
		{
			desc: "should return second page",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				Page:       2,
				PerPage:    1,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows: []*clinicalkpisql.ProviderVisit{
					{
						CareRequestID:    careRequestID2,
						ProviderID:       providerID,
						PatientFirstName: "Tom",
						PatientLastName:  "Smith",
						PatientAthenaID:  "123457",
						ServiceDate:      yesterdayDate,
						ChiefComplaint:   sql.NullString{Valid: true, String: "headache"},
						Diagnosis:        sql.NullString{Valid: true, String: "diagnose 2"},
						IsAbxPrescribed:  true,
						AbxDetails:       sql.NullString{Valid: true, String: "some details"},
						IsEscalated:      false,
						EscalatedReason:  sql.NullString{Valid: true, String: ""},
					},
				},
				Total: 2,
			},
		},
		{
			desc: "should filter visits by IsAbxPrescribed field",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID:      providerID,
				IsAbxPrescribed: proto.Bool(true),
				Page:            1,
				PerPage:         10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows: []*clinicalkpisql.ProviderVisit{
					{
						CareRequestID:    careRequestID2,
						ProviderID:       providerID,
						PatientFirstName: "Tom",
						PatientLastName:  "Smith",
						PatientAthenaID:  "123457",
						ServiceDate:      yesterdayDate,
						ChiefComplaint:   sql.NullString{Valid: true, String: "headache"},
						Diagnosis:        sql.NullString{Valid: true, String: "diagnose 2"},
						IsAbxPrescribed:  true,
						AbxDetails:       sql.NullString{Valid: true, String: "some details"},
						IsEscalated:      false,
						EscalatedReason:  sql.NullString{Valid: true, String: ""},
					},
				},
				Total: 1,
			},
		},
		{
			desc: "should filter visits by IsEscalated field",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID:  providerID,
				IsEscalated: proto.Bool(true),
				Page:        1,
				PerPage:     10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should filter visits by search text field",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				SearchText: proto.String("Jo"),
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should search visits by full name",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				SearchText: proto.String("John Doe"),
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should search visits by full name with coma delimiter",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				SearchText: proto.String("John, Doe"),
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should search visits by full name last - first",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				SearchText: proto.String("Doe John"),
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should search visits by full name last - first with coma delimiter",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID,
				SearchText: proto.String("Doe, John"),
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  johnDoeVisit,
				Total: 1,
			},
		},
		{
			desc: "should return an empty array if there is no record in DB",
			query: clinicalkpidb.GetProviderVisitsParams{
				ProviderID: providerID + 1,
				Page:       1,
				PerPage:    10,
			},

			want: &clinicalkpidb.GetProviderVisitsResponse{
				Rows:  []*clinicalkpisql.ProviderVisit{},
				Total: 0,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderVisits(ctx, tc.query)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt")(t, tc.want, result)
		})
	}
}

func TestCDB_GetMarketMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()

	marketID1 := baseID + 1
	marketID2 := baseID + 2
	denverShortName := "DEN"
	coloradoShortName := "COS"

	_, err := queries.TestAddMarkets(ctx, []clinicalkpisql.TestAddMarketsParams{
		{
			MarketID:  marketID1,
			Name:      "Denver",
			ShortName: sqltypes.ToNullString(&denverShortName),
		},
		{
			MarketID:  marketID2,
			Name:      "Colorado Springs",
			ShortName: sqltypes.ToNullString(&coloradoShortName),
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.TestAddMarketMetrics(ctx, clinicalkpisql.TestAddMarketMetricsParams{
		MarketIds:                    []int64{marketID1, marketID2},
		OnSceneTimeMedianSeconds:     []int32{600, 650},
		OnSceneTimeWeekChangeSeconds: []int32{30, 25},
		ChartClosureRates:            []float64{95, 89},
		ChartClosureRateWeekChanges:  []float64{0.3, 0.8},
		SurveyCaptureRates:           []float64{90, 92},
		SurveyCaptureRateWeekChanges: []float64{0.25, 0.42},
		NetPromoterScoreAverages:     []float64{33, 45},
		NetPromoterScoreWeekChanges:  []float64{3, 4},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc        string
		getMarketID int64

		want      *clinicalkpisql.GetMarketMetricsRow
		wantError error
	}{
		{
			desc:        "should return market metric",
			getMarketID: marketID1,

			want: &clinicalkpisql.GetMarketMetricsRow{
				MarketID:                     marketID1,
				OnSceneTimeMedianSeconds:     sqltypes.ToValidNullInt32(int32(600)),
				OnSceneTimeWeekChangeSeconds: sqltypes.ToValidNullInt32(int32(30)),
				ChartClosureRate:             sqltypes.ToValidNullFloat64(95),
				ChartClosureRateWeekChange:   sqltypes.ToValidNullFloat64(0.3),
				SurveyCaptureRate:            sqltypes.ToValidNullFloat64(90),
				SurveyCaptureRateWeekChange:  sqltypes.ToValidNullFloat64(0.25),
				NetPromoterScoreAverage:      sqltypes.ToValidNullFloat64(33),
				NetPromoterScoreWeekChange:   sqltypes.ToValidNullFloat64(3),
				MarketName:                   sql.NullString{String: "Denver", Valid: true},
				MarketShortName:              sql.NullString{String: "DEN", Valid: true},
			},
		},
		{
			desc:        "should return an empty object if no rows are returned from DB",
			getMarketID: marketID1 + 10,

			want:      nil,
			wantError: clinicalkpidb.ErrMarketMetricsNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetMarketMetrics(ctx, tc.getMarketID)
			if err != nil && tc.wantError == nil {
				t.Fatal(err)
			}

			dbResultMustMatch(t, tc.want, result)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestCDB_GetProviderShifts(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()
	todayDateTime := now.Truncate(time.Microsecond).UTC()
	yesterdayDateTime := todayDateTime.AddDate(0, 0, -1)

	todayDate, _ := time.Parse("2006-01-02", time.DateOnly)
	yesterdayDate := todayDate.AddDate(0, 0, -1)

	shiftTeamID1 := baseID + 1
	shiftTeamID2 := baseID + 2
	providerID := baseID + 3
	_, err := queries.TestAddProviderShifts(ctx, clinicalkpisql.TestAddProviderShiftsParams{
		ShiftTeamIds:              []int64{shiftTeamID1, shiftTeamID2},
		ProviderIds:               []int64{providerID, providerID},
		ServiceDates:              []time.Time{yesterdayDate, todayDate},
		StartTimes:                []time.Time{yesterdayDateTime, todayDateTime},
		EndTimes:                  []time.Time{yesterdayDateTime, todayDateTime},
		PatientsSeens:             []int32{8, 7},
		OutTheDoorDurationSeconds: []int32{600, 800},
		EnRouteDurationSeconds:    []int32{6500, 7300},
		OnSceneDurationSeconds:    []int32{10800, 11200},
		OnBreakDurationSeconds:    []int32{1800, 1750},
		IdleDurationSeconds:       []int32{1200, 1111},
	})

	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query clinicalkpidb.GetProviderShiftsParams

		wantShiftTeamIDs []int64
		wantTotal        int64
	}{
		{
			desc: "should return all shifts for provider with default sorting order",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID: providerID,
				Page:       1,
				PerPage:    10,
			},

			wantShiftTeamIDs: []int64{shiftTeamID2, shiftTeamID1},
			wantTotal:        2,
		},
		{
			desc: "should return all shifts for provider and sort by service date ASC",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID:           providerID,
				Page:                 1,
				PerPage:              10,
				ServiceDateSortOrder: "ASC",
			},

			wantShiftTeamIDs: []int64{shiftTeamID1, shiftTeamID2},
			wantTotal:        2,
		},
		{
			desc: "should return all shifts for provider and sort by service date DESC",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID:           providerID,
				Page:                 1,
				PerPage:              10,
				ServiceDateSortOrder: "DESC",
			},

			wantShiftTeamIDs: []int64{shiftTeamID2, shiftTeamID1},
			wantTotal:        2,
		},
		{
			desc: "should return the first page",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID: providerID,
				Page:       1,
				PerPage:    1,
			},

			wantShiftTeamIDs: []int64{shiftTeamID2},
			wantTotal:        2,
		},
		{
			desc: "should filter using fromDate",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID: providerID,
				FromDate:   &todayDate,
				Page:       1,
				PerPage:    10,
			},

			wantShiftTeamIDs: []int64{shiftTeamID2},
			wantTotal:        1,
		},
		{
			desc: "should return nil if there is no records in DB",
			query: clinicalkpidb.GetProviderShiftsParams{
				ProviderID: providerID + 1,
				Page:       1,
				PerPage:    10,
			},

			wantShiftTeamIDs: []int64{},
			wantTotal:        0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderShifts(ctx, tc.query)
			if err != nil {
				t.Fatal(err)
			}

			shiftTeamIDs := make([]int64, len(result.Rows))
			for i := range shiftTeamIDs {
				shiftTeamIDs[i] = result.Rows[i].ShiftTeamID
			}

			testutils.MustMatch(t, tc.wantShiftTeamIDs, shiftTeamIDs)
			testutils.MustMatch(t, tc.wantTotal, result.Total)
		})
	}
}

func TestCDB_GetShiftSnapshots(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()
	shiftTeamID1 := baseID + 1
	shiftTeamID2 := baseID + 2

	date := time.Time{}
	laterDate := date.Add(time.Hour)
	phaseTypeID := int64(10)
	shiftSnapshotPhaseTypeID := int64(10)
	latitudeE6 := int32(300)
	longitudeE6 := int32(300)

	_, err := queries.TestAddShiftSnapshots(ctx, clinicalkpisql.TestAddShiftSnapshotsParams{
		ShiftTeamIds:              []int64{shiftTeamID1, shiftTeamID2, shiftTeamID2},
		StartTimestamps:           []time.Time{date, laterDate, date},
		EndTimestamps:             []time.Time{date, date, date},
		ShiftSnapshotPhaseTypeIds: []int64{phaseTypeID, phaseTypeID, phaseTypeID},
		LatitudesE6:               []int32{latitudeE6, latitudeE6, latitudeE6},
		LongitudesE6:              []int32{longitudeE6, longitudeE6, longitudeE6},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc        string
		shiftTeamID int64

		want []*clinicalkpisql.GetShiftSnapshotsRow
	}{
		{
			desc:        "should return shift snapshot",
			shiftTeamID: shiftTeamID1,

			want: []*clinicalkpisql.GetShiftSnapshotsRow{
				{
					ShiftTeamID:              shiftTeamID1,
					StartTimestamp:           date,
					EndTimestamp:             date,
					ShiftSnapshotPhaseTypeID: shiftSnapshotPhaseTypeID,
					LatitudeE6:               sqltypes.ToValidNullInt32(latitudeE6),
					LongitudeE6:              sqltypes.ToValidNullInt32(longitudeE6),
					Phase:                    sql.NullString{String: "", Valid: false},
				},
			},
		},
		{
			desc:        "should sort shift snapshots by start timestamp",
			shiftTeamID: shiftTeamID2,

			want: []*clinicalkpisql.GetShiftSnapshotsRow{
				{
					ShiftTeamID:              shiftTeamID2,
					StartTimestamp:           date,
					EndTimestamp:             date,
					ShiftSnapshotPhaseTypeID: shiftSnapshotPhaseTypeID,
					LatitudeE6:               sqltypes.ToValidNullInt32(latitudeE6),
					LongitudeE6:              sqltypes.ToValidNullInt32(longitudeE6),
					Phase:                    sql.NullString{String: "", Valid: false},
				},
				{
					ShiftTeamID:              shiftTeamID2,
					StartTimestamp:           laterDate,
					EndTimestamp:             date,
					ShiftSnapshotPhaseTypeID: shiftSnapshotPhaseTypeID,
					LatitudeE6:               sqltypes.ToValidNullInt32(latitudeE6),
					LongitudeE6:              sqltypes.ToValidNullInt32(longitudeE6),
					Phase:                    sql.NullString{String: "", Valid: false},
				},
			},
		},
		{
			desc:        "should return nil if shift team id is 0",
			shiftTeamID: 0,

			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetShiftSnapshots(ctx, tc.shiftTeamID)
			if err != nil {
				t.Fatal(err)
			}

			dbResultMustMatch(t, tc.want, result)
		})
	}
}

func TestCDB_GetProviderMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2

	onSceneTimeMedianSeconds := int32(60)
	chartClosureRates := float64(95)
	surveyCaptureRates := float64(95)
	netPromoterScoreAverages := float64(95)
	onTaskPercents := float64(95)
	escalationRates := float64(95)
	abxPrescribingRates := float64(95)

	_, err := queries.TestAddProviders(ctx, []clinicalkpisql.TestAddProvidersParams{
		{
			ProviderID: providerID1,
			FirstName:  "Ben",
			LastName:   "Sahar",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID2,
			FirstName:  "John",
			LastName:   "Doe",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-2")),
			JobTitle:   "APP",
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc              string
		addProviderMetric clinicalkpisql.TestAddProviderMetricsParams
		query             int64

		want      *clinicalkpisql.GetProviderMetricsRow
		wantError error
	}{
		{
			desc: "should return provider metric",
			addProviderMetric: clinicalkpisql.TestAddProviderMetricsParams{
				ProviderIds:              []int64{providerID1, providerID2},
				OnSceneTimeMedianSeconds: []int32{onSceneTimeMedianSeconds, onSceneTimeMedianSeconds},
				ChartClosureRates:        []float64{chartClosureRates, chartClosureRates},
				SurveyCaptureRates:       []float64{surveyCaptureRates, surveyCaptureRates},
				NetPromoterScoreAverages: []float64{netPromoterScoreAverages, netPromoterScoreAverages},
				OnTaskPercents:           []float64{onTaskPercents, onTaskPercents},
				EscalationRates:          []float64{escalationRates, escalationRates},
				AbxPrescribingRates:      []float64{abxPrescribingRates, abxPrescribingRates},
			},
			query: providerID1,

			want: &clinicalkpisql.GetProviderMetricsRow{
				ProviderID:               providerID1,
				OnSceneTimeMedianSeconds: sqltypes.ToValidNullInt32(onSceneTimeMedianSeconds),
				ChartClosureRate:         sqltypes.ToValidNullFloat64(chartClosureRates),
				SurveyCaptureRate:        sqltypes.ToValidNullFloat64(surveyCaptureRates),
				NetPromoterScoreAverage:  sqltypes.ToValidNullFloat64(netPromoterScoreAverages),
				OnTaskPercent:            sqltypes.ToValidNullFloat64(onTaskPercents),
				EscalationRate:           sqltypes.ToValidNullFloat64(escalationRates),
				AbxPrescribingRate:       sqltypes.ToValidNullFloat64(abxPrescribingRates),
				Provider: clinicalkpisql.Provider{
					ProviderID: providerID1,
					FirstName:  "Ben",
					LastName:   "Sahar",
					AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
					JobTitle:   "APP",
				},
			},
		},
		{
			desc:  "should return an empty object if no rows are returned from DB",
			query: providerID1 + 3,

			want:      nil,
			wantError: clinicalkpidb.ErrProviderMetricsNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := queries.TestAddProviderMetrics(ctx, tc.addProviderMetric)
			if err != nil {
				t.Fatal(err)
			}

			result, err := cdb.GetProviderMetrics(ctx, tc.query)
			if err != nil && tc.wantError == nil {
				t.Fatal(err)
			}

			dbResultMustMatch(t, tc.want, result)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestCDB_GetProvidersMetricsByMarket(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()
	marketID := baseID + 1
	providerID1 := baseID + 2
	providerID2 := baseID + 3
	providerID3 := baseID + 4
	providerID4 := baseID + 5

	_, err := queries.TestAddMarketProviderMetrics(ctx, clinicalkpisql.TestAddMarketProviderMetricsParams{
		ProviderIds:                  []int64{providerID1, providerID2, providerID3, providerID4},
		MarketIds:                    []int64{marketID, marketID, marketID, marketID},
		OnSceneTimeMedianSeconds:     []int32{600, 650, 800, 700},
		OnSceneTimeWeekChangeSeconds: []int32{60, -20, 30, 10},
		ChartClosureRates:            []float64{89.555, 88.9111, 86.222, 0},
		ChartClosureRateWeekChanges:  []float64{0.5321, 0.3213, 0.2, 0},
		SurveyCaptureRates:           []float64{0, 0.001, 0.002, 75.638},
		SurveyCaptureRateWeekChanges: []float64{0, 0, 0, -0.7112},
		NetPromoterScoreAverages:     []float64{75.656, 88.981, 89.555, 80},
		NetPromoterScoreWeekChanges:  []float64{0.505, 0.301, -0.722, -1},
		OnTaskPercents:               []float64{89.555, 88.9, 75.6, 74},
		OnTaskPercentWeekChanges:     []float64{0.5, 0.3, -0.7, 1},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.TestAddProviders(ctx, []clinicalkpisql.TestAddProvidersParams{
		{
			ProviderID: providerID1,
			FirstName:  "Ben",
			LastName:   "Sahar",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID2,
			FirstName:  "John",
			LastName:   "Doe",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-2")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID3,
			FirstName:  "Joe",
			LastName:   "Grant",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-3")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID4,
			FirstName:  "Sam",
			LastName:   "Johnson",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-4")),
			JobTitle:   "DHMT",
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name  string
		query clinicalkpidb.GetProvidersMetricsByMarketParams

		wantIDs                          []int64
		wantOnSceneTimeRanks             []int64
		wantChartClosureRateRanks        []int64
		wantChartClosureRates            []float64
		wantChartClosureRateWeekChanges  []float64
		wantSurveyCaptureRateRanks       []int64
		wantSurveyCaptureRates           []float64
		wantSurveyCaptureRateWeekChanges []float64
		wantNetPromoterScoreRanks        []int64
		wantNetPromoterScores            []float64
		wantNetPromoterScoreWeekChanges  []float64
		wantRowsCount                    int
		wantTotal                        int64
	}{
		{
			name: "should return all providers metrics by market",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID: marketID,
				Page:     1,
				PerPage:  5,
			},

			wantRowsCount: 4,
			wantTotal:     4,
		},
		{
			name: "should return first page of providers metrics by market",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID: marketID,
				Page:     1,
				PerPage:  2,
			},

			wantRowsCount: 2,
			wantTotal:     4,
		},
		{
			name: "should return second page of providers metrics by market",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				ProviderJobTitle: proto.String("APP"),
				Page:             2,
				PerPage:          2,
			},

			wantRowsCount: 1,
			wantTotal:     3,
		},
		{
			name: "should return 0 rows for another market",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID: marketID + 1,
				Page:     1,
				PerPage:  5,
			},

			wantRowsCount: 0,
			wantTotal:     0,
		},
		{
			name: "should sort by first name",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID: marketID,
				Page:     1,
				PerPage:  5,
			},

			wantIDs:       []int64{providerID1, providerID3, providerID2, providerID4},
			wantRowsCount: 4,
			wantTotal:     4,
		},
		{
			name: "should sort by on scene time",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				SortBy:           proto.String("on_scene_time"),
				ProviderJobTitle: proto.String("APP"),
				Page:             1,
				PerPage:          5,
			},

			wantIDs:              []int64{providerID1, providerID2, providerID3},
			wantOnSceneTimeRanks: []int64{1, 2, 3},
			wantRowsCount:        3,
			wantTotal:            3,
		},
		{
			name: "should sort by chart closure rate",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				SortBy:           proto.String("chart_closure_rate"),
				ProviderJobTitle: proto.String("APP"),
				Page:             1,
				PerPage:          5,
			},

			wantIDs:                         []int64{providerID1, providerID2, providerID3},
			wantChartClosureRateRanks:       []int64{1, 2, 3},
			wantChartClosureRates:           []float64{89.56, 88.91, 86.22},
			wantChartClosureRateWeekChanges: []float64{0.53, 0.32, 0.2},
			wantRowsCount:                   3,
			wantTotal:                       3,
		},
		{
			name: "should sort by survey capture rate",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				SortBy:           proto.String("survey_capture_rate"),
				ProviderJobTitle: proto.String("DHMT"),
				Page:             1,
				PerPage:          5,
			},

			wantIDs:                          []int64{providerID4},
			wantSurveyCaptureRateRanks:       []int64{1},
			wantSurveyCaptureRates:           []float64{75.64},
			wantSurveyCaptureRateWeekChanges: []float64{-0.71},
			wantRowsCount:                    1,
			wantTotal:                        1,
		},
		{
			name: "should sort by net promoter score",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				SortBy:           proto.String("net_promoter_score"),
				ProviderJobTitle: proto.String("APP"),
				Page:             1,
				PerPage:          5,
			},

			wantIDs:                         []int64{providerID3, providerID2, providerID1},
			wantNetPromoterScoreRanks:       []int64{1, 2, 3},
			wantNetPromoterScores:           []float64{89.56, 88.98, 75.66},
			wantNetPromoterScoreWeekChanges: []float64{-0.72, 0.3, 0.51},
			wantRowsCount:                   3,
			wantTotal:                       3,
		},
		{
			name: "should filter by APP",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				ProviderJobTitle: proto.String("APP"),
				Page:             1,
				PerPage:          5,
			},

			wantRowsCount: 3,
			wantTotal:     3,
		},
		{
			name: "should filter by DHMT",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:         marketID,
				ProviderJobTitle: proto.String("DHMT"),
				Page:             1,
				PerPage:          5,
			},

			wantRowsCount: 1,
			wantTotal:     1,
		},
		{
			name: "should search by full name",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:   marketID,
				SearchText: proto.String("Joe Grant"),
				Page:       1,
				PerPage:    5,
			},

			wantRowsCount: 1,
			wantTotal:     1,
		},
		{
			name: "should search by full name with coma delimiter",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:   marketID,
				SearchText: proto.String("Joe, Grant"),
				Page:       1,
				PerPage:    5,
			},

			wantRowsCount: 1,
			wantTotal:     1,
		},
		{
			name: "should search by full name last - first",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:   marketID,
				SearchText: proto.String("Grant Joe"),
				Page:       1,
				PerPage:    5,
			},

			wantRowsCount: 1,
			wantTotal:     1,
		},
		{
			name: "should search by full name last - first with coma delimiter",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:   marketID,
				SearchText: proto.String("Grant, Joe"),
				Page:       1,
				PerPage:    5,
			},

			wantRowsCount: 1,
			wantTotal:     1,
		},
		{
			name: "should search by part of name",
			query: clinicalkpidb.GetProvidersMetricsByMarketParams{
				MarketID:   marketID,
				SearchText: proto.String("Jo"),
				Page:       1,
				PerPage:    5,
			},

			wantRowsCount: 3,
			wantTotal:     3,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProvidersMetricsByMarket(ctx, tc.query)
			if err != nil {
				t.Fatal(err)
			}

			if tc.wantIDs != nil {
				providerIDs := make([]int64, len(result.Rows))
				for i := range providerIDs {
					providerIDs[i] = result.Rows[i].ProviderID
				}
				testutils.MustMatch(t, tc.wantIDs, providerIDs)
			}

			if tc.wantOnSceneTimeRanks != nil {
				ranks := make([]int64, len(result.Rows))
				for i := range ranks {
					ranks[i] = result.Rows[i].OnSceneTimeRank
				}
				testutils.MustMatch(t, tc.wantOnSceneTimeRanks, ranks)
			}

			if tc.wantChartClosureRateRanks != nil {
				ranks := make([]int64, len(result.Rows))
				for i := range ranks {
					ranks[i] = result.Rows[i].ChartClosureRateRank
				}
				testutils.MustMatch(t, tc.wantChartClosureRateRanks, ranks)
			}

			if tc.wantChartClosureRates != nil {
				rates := make([]float64, len(result.Rows))
				for i := range rates {
					rates[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].ChartClosureRate)
				}
				testutils.MustMatch(t, tc.wantChartClosureRates, rates)
			}

			if tc.wantChartClosureRateWeekChanges != nil {
				weekChanges := make([]float64, len(result.Rows))
				for i := range weekChanges {
					weekChanges[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].ChartClosureRateWeekChange)
				}
				testutils.MustMatch(t, tc.wantChartClosureRateWeekChanges, weekChanges)
			}

			if tc.wantSurveyCaptureRateRanks != nil {
				ranks := make([]int64, len(result.Rows))
				for i := range ranks {
					ranks[i] = result.Rows[i].SurveyCaptureRateRank
				}
				testutils.MustMatch(t, tc.wantSurveyCaptureRateRanks, ranks)
			}

			if tc.wantSurveyCaptureRates != nil {
				rates := make([]float64, len(result.Rows))
				for i := range rates {
					rates[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].SurveyCaptureRate)
				}
				testutils.MustMatch(t, tc.wantSurveyCaptureRates, rates)
			}

			if tc.wantSurveyCaptureRateWeekChanges != nil {
				weekChanges := make([]float64, len(result.Rows))
				for i := range weekChanges {
					weekChanges[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].SurveyCaptureRateWeekChange)
				}
				testutils.MustMatch(t, tc.wantSurveyCaptureRateWeekChanges, weekChanges)
			}

			if tc.wantNetPromoterScoreRanks != nil {
				ranks := make([]int64, len(result.Rows))
				for i := range ranks {
					ranks[i] = result.Rows[i].NetPromoterScoreRank
				}
				testutils.MustMatch(t, tc.wantNetPromoterScoreRanks, ranks)
			}

			if tc.wantNetPromoterScores != nil {
				rates := make([]float64, len(result.Rows))
				for i := range rates {
					rates[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].NetPromoterScoreAverage)
				}
				testutils.MustMatch(t, tc.wantNetPromoterScores, rates)
			}

			if tc.wantNetPromoterScoreWeekChanges != nil {
				weekChanges := make([]float64, len(result.Rows))
				for i := range weekChanges {
					weekChanges[i] = *pgtypes.NumericToProtoFloat64(result.Rows[i].NetPromoterScoreWeekChange)
				}
				testutils.MustMatch(t, tc.wantNetPromoterScoreWeekChanges, weekChanges)
			}

			testutils.MustMatch(t, tc.wantTotal, result.Total)
			testutils.MustMatch(t, tc.wantRowsCount, len(result.Rows))
		})
	}
}

func TestCDB_GetProviderMetricsByMarket(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	baseID := now.UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2
	providerID3 := baseID + 3
	marketID1 := baseID + 101
	marketID2 := baseID + 102

	_, err := queries.TestAddMarketProviderMetrics(ctx, clinicalkpisql.TestAddMarketProviderMetricsParams{
		ProviderIds:                  []int64{providerID1, providerID2, providerID3},
		MarketIds:                    []int64{marketID1, marketID2, marketID1},
		OnSceneTimeMedianSeconds:     []int32{60, 60, 61},
		OnSceneTimeWeekChangeSeconds: []int32{6, 6, 6},
		ChartClosureRates:            []float64{95, 95, 94},
		ChartClosureRateWeekChanges:  []float64{-3, -3, -3},
		SurveyCaptureRates:           []float64{95, 95, 94},
		SurveyCaptureRateWeekChanges: []float64{2, 2, 2},
		NetPromoterScoreAverages:     []float64{95, 95, 94},
		NetPromoterScoreWeekChanges:  []float64{2, 2, 2},
		OnTaskPercents:               []float64{95, 30, 94},
		OnTaskPercentWeekChanges:     []float64{30, 30, 29},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.TestAddProviders(ctx, []clinicalkpisql.TestAddProvidersParams{
		{
			ProviderID: providerID1,
			FirstName:  "Ben",
			LastName:   "Sahar",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID2,
			FirstName:  "John",
			LastName:   "Doe",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-2")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID3,
			FirstName:  "Joe",
			LastName:   "Grant",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-3")),
			JobTitle:   "APP",
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query clinicalkpidb.GetProviderMetricsByMarketParams

		want      *clinicalkpisql.GetProviderMetricsByMarketRow
		wantError error
	}{
		{
			desc:  "should return provider metrics by market",
			query: clinicalkpidb.GetProviderMetricsByMarketParams{MarketID: marketID1, ProviderID: providerID1},

			want: &clinicalkpisql.GetProviderMetricsByMarketRow{
				MarketID:                     marketID1,
				ProviderID:                   providerID1,
				OnSceneTimeMedianSeconds:     sql.NullInt32{Int32: 60, Valid: true},
				OnSceneTimeWeekChangeSeconds: sql.NullInt32{Int32: 6, Valid: true},
				ChartClosureRate:             pgtype.Numeric{Int: big.NewInt(9500), Exp: -2, Status: 2},
				ChartClosureRateWeekChange:   pgtype.Numeric{Int: big.NewInt(-300), Exp: -2, Status: 2},
				SurveyCaptureRate:            pgtype.Numeric{Int: big.NewInt(9500), Exp: -2, Status: 2},
				SurveyCaptureRateWeekChange:  pgtype.Numeric{Int: big.NewInt(200), Exp: -2, Status: 2},
				NetPromoterScoreAverage:      pgtype.Numeric{Int: big.NewInt(9500), Exp: -2, Status: 2},
				NetPromoterScoreWeekChange:   pgtype.Numeric{Int: big.NewInt(200), Exp: -2, Status: 2},
				OnTaskPercent:                pgtype.Numeric{Int: big.NewInt(9500), Exp: -2, Status: 2},
				OnTaskPercentWeekChange:      pgtype.Numeric{Int: big.NewInt(3000), Exp: -2, Status: 2},
				ProviderID_2:                 providerID1,
				OnSceneTimeRank:              1,
				ChartClosureRateRank:         1,
				SurveyCaptureRateRank:        1,
				NetPromoterScoreRank:         1,
				OnTaskPercentRank:            1,
				JobTitle:                     "APP",
				TotalProviders:               2,
			},
		},
		{
			desc:  "should return an empty object if no rows are returned from DB",
			query: clinicalkpidb.GetProviderMetricsByMarketParams{MarketID: marketID1 + 10, ProviderID: providerID1},

			want:      nil,
			wantError: clinicalkpidb.ErrProviderMetricsByMarketNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderMetricsByMarket(ctx, tc.query)
			if err != nil && tc.wantError == nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt")(t, tc.want, result)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestCDB_SeedMarkets(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	waMarketGroupID := baseID
	marketID1 := baseID
	marketID2 := baseID + 1
	marketID3 := baseID + 2
	marketID4 := baseID + 3
	marketID5 := baseID + 4
	denverShortName := "DEN"
	coloradoShortName := "COS"
	olympiaShortName := "OLY"
	seattleShortName := "SEA"

	_, err := queries.TestAddMarketGroups(ctx, clinicalkpisql.TestAddMarketGroupsParams{
		MarketGroupIds:   []int64{waMarketGroupID},
		MarketGroupNames: []string{"Olympia|Seattle|Tacoma"},
	})

	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc          string
		marketsToSave []*clinicalkpidb.Market

		want      []*clinicalkpisql.Market
		wantError bool
	}{
		{
			desc: "should work successfully",
			marketsToSave: []*clinicalkpidb.Market{
				{
					MarketID:  marketID1,
					Name:      "Denver",
					ShortName: denverShortName,
				},
				{
					MarketID:  marketID2,
					Name:      "Colorado Springs",
					ShortName: coloradoShortName,
				},
			},

			want: []*clinicalkpisql.Market{
				{
					MarketID:  marketID1,
					Name:      "Denver",
					ShortName: sqltypes.ToNullString(&denverShortName),
				},
				{
					MarketID:  marketID2,
					Name:      "Colorado Springs",
					ShortName: sqltypes.ToNullString(&coloradoShortName),
				},
			},
		},
		{
			desc: "should work with market group id",
			marketsToSave: []*clinicalkpidb.Market{
				{
					MarketID:      marketID3,
					Name:          "Olympia",
					ShortName:     olympiaShortName,
					MarketGroupID: &waMarketGroupID,
				},
				{
					MarketID:      marketID4,
					Name:          "Seattle",
					ShortName:     seattleShortName,
					MarketGroupID: &waMarketGroupID,
				},
			},

			want: []*clinicalkpisql.Market{
				{
					MarketID:      marketID3,
					Name:          "Olympia",
					ShortName:     sqltypes.ToNullString(&olympiaShortName),
					MarketGroupID: sqltypes.ToNullInt64(&waMarketGroupID),
				},
				{
					MarketID:      marketID4,
					Name:          "Seattle",
					ShortName:     sqltypes.ToNullString(&seattleShortName),
					MarketGroupID: sqltypes.ToNullInt64(&waMarketGroupID),
				},
			},
		},
		{
			desc:          "should work without error in case there are no markets to save",
			marketsToSave: []*clinicalkpidb.Market{},

			want: []*clinicalkpisql.Market{},
		},
		{
			desc: "should return error on unique constraint validation error",
			marketsToSave: []*clinicalkpidb.Market{
				{
					MarketID:      marketID5,
					Name:          "Olympia",
					ShortName:     olympiaShortName,
					MarketGroupID: &waMarketGroupID,
				},
				{
					MarketID:      marketID5,
					Name:          "Seattle",
					ShortName:     seattleShortName,
					MarketGroupID: &waMarketGroupID,
				},
			},

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedMarkets(ctx, tc.marketsToSave)
			if (err != nil) != tc.wantError {
				t.Errorf("AddMarkets() error = %v, wantErr %v", err, tc.wantError)
				return
			}

			for _, want := range tc.want {
				got, err := queries.TestGetMarketByID(ctx, want.MarketID)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, want, got)
			}
		})
	}
}

func TestCDB_SeedProviderMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()

	providerID1 := now.UnixNano() + 1
	providerID2 := now.UnixNano() + 2

	tcs := []struct {
		desc                  string
		providerMetricsToSave []*clinicalkpidb.ProviderMetrics

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			providerMetricsToSave: []*clinicalkpidb.ProviderMetrics{
				{
					ProviderID:                providerID1,
					OnSceneTimeMedianSeconds:  1200,
					ChartClosureRateAverage:   95,
					NetPromoterScoreAverage:   90,
					OnTaskPercentAverage:      80,
					EscalationRateAverage:     10,
					AbxPrescribingRateAverage: 25,
				},
				{
					ProviderID:                providerID2,
					OnSceneTimeMedianSeconds:  1300,
					SurveyCaptureRateAverage:  90,
					NetPromoterScoreAverage:   90,
					OnTaskPercentAverage:      85,
					EscalationRateAverage:     20,
					AbxPrescribingRateAverage: 40,
				},
			},

			wantIDs: []int64{providerID1, providerID2},
		},
		{
			desc:                  "should work without error in case there is no provider metrics to save",
			providerMetricsToSave: []*clinicalkpidb.ProviderMetrics{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedProviderMetrics(ctx, tc.providerMetricsToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				metrics, err := queries.TestGetProviderMetricsByProviderID(ctx, id)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, metrics.ProviderID)
			}
		})
	}
}

func TestCDB_SeedShiftSnapshots(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	now := time.Now()

	shiftTeamID := now.UnixNano() + 1

	tcs := []struct {
		desc                 string
		shiftSnapshotsToSave []*clinicalkpidb.ShiftSnapshot

		wantCount int
	}{
		{
			desc: "success - base case",
			shiftSnapshotsToSave: []*clinicalkpidb.ShiftSnapshot{
				{
					ShiftTeamID:              shiftTeamID,
					StartTimestamp:           now,
					EndTimestamp:             now,
					ShiftSnapshotPhaseTypeID: 1,
				},
				{
					ShiftTeamID:              shiftTeamID,
					StartTimestamp:           now.Add(time.Minute),
					EndTimestamp:             now,
					ShiftSnapshotPhaseTypeID: 2,
					LatitudesE6:              100,
					LongitudesE6:             100,
				},
			},

			wantCount: 2,
		},
		{
			desc:                 "success - empty input",
			shiftSnapshotsToSave: []*clinicalkpidb.ShiftSnapshot{},

			wantCount: 0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			snapshots, err := cdb.SeedShiftSnapshots(ctx, tc.shiftSnapshotsToSave)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCount, len(snapshots))
		})
	}
}

func TestCDB_SeedProviderVisits(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()

	providerID1 := now.UnixNano() + 1
	providerID2 := now.UnixNano() + 2
	careRequestID1 := now.UnixNano() + 3
	careRequestID2 := now.UnixNano() + 4

	tcs := []struct {
		desc                 string
		providerVisitsToSave []*clinicalkpidb.ProviderVisit

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			providerVisitsToSave: []*clinicalkpidb.ProviderVisit{
				{
					CareRequestID:    careRequestID1,
					ProviderID:       providerID1,
					PatientFirstName: "Joe",
					PatientLastName:  "Dou",
					PatientAthenaID:  "1234",
					ServiceDate:      now,
					ChiefComplaint:   "Headache",
					Diagnosis:        "",
					IsAbxPrescribed:  false,
					IsEscalated:      false,
				},
				{
					CareRequestID:    careRequestID2,
					ProviderID:       providerID2,
					PatientFirstName: "John",
					PatientLastName:  "Doe",
					PatientAthenaID:  "5678",
					ServiceDate:      now,
					ChiefComplaint:   "Back pain",
					IsAbxPrescribed:  true,
					AbxDetails:       "some details",
					IsEscalated:      true,
					EscalatedReason:  "some reason",
				},
			},

			wantIDs: []int64{careRequestID1, careRequestID2},
		},
		{
			desc:                 "success - empty input",
			providerVisitsToSave: []*clinicalkpidb.ProviderVisit{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedProviderVisits(ctx, tc.providerVisitsToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				visit, err := queries.TestGetProviderVisitByCareRequestID(ctx, id)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, visit.CareRequestID)
			}
		})
	}
}

func TestCDB_SeedMarketMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()

	marketID1 := now.UnixNano() + 1
	marketID2 := now.UnixNano() + 2

	tcs := []struct {
		desc                string
		marketMetricsToSave []*clinicalkpidb.MarketMetrics

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			marketMetricsToSave: []*clinicalkpidb.MarketMetrics{
				{
					MarketID:                     marketID1,
					OnSceneTimeMedianSeconds:     1200,
					OnSceneTimeWeekChangeSeconds: 300,
					ChartClosureRate:             95,
					ChartClosureRateWeekChange:   3,
					SurveyCaptureRate:            90,
					SurveyCaptureRateWeekChange:  -2,
					NetPromoterScoreAverage:      88,
					NetPromoterScoreWeekChange:   -5,
				},
				{
					MarketID:                     marketID2,
					OnSceneTimeMedianSeconds:     1200,
					OnSceneTimeWeekChangeSeconds: 300,
					ChartClosureRate:             95,
					ChartClosureRateWeekChange:   3,
					SurveyCaptureRate:            90,
					SurveyCaptureRateWeekChange:  -2,
					NetPromoterScoreAverage:      88,
					NetPromoterScoreWeekChange:   -5,
				},
			},

			wantIDs: []int64{marketID1, marketID2},
		},
		{
			desc:                "success - empty input",
			marketMetricsToSave: []*clinicalkpidb.MarketMetrics{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedMarketMetrics(ctx, tc.marketMetricsToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				metrics, err := queries.TestGetMarketMetricsByMarketID(ctx, id)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, metrics.MarketID)
			}
		})
	}
}

func TestCDB_SeedProviders(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()

	providerID1 := now.UnixNano() + 1
	providerID2 := now.UnixNano() + 2

	tcs := []struct {
		desc            string
		providersToSave []*clinicalkpidb.Provider

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			providersToSave: []*clinicalkpidb.Provider{
				{
					ProviderID: providerID1,
					FirstName:  "Joe",
					LastName:   "Dou",
					AvatarURL:  proto.String("url"),
					JobTitle:   proto.String("APP"),
				},
				{
					ProviderID: providerID2,
					FirstName:  "John",
					LastName:   "Doe",
					JobTitle:   proto.String("DHMT"),
				},
			},

			wantIDs: []int64{providerID1, providerID2},
		},
		{
			desc:            "success - empty input",
			providersToSave: []*clinicalkpidb.Provider{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedProviders(ctx, tc.providersToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				provider, err := queries.TestGetProviderByProviderID(ctx, id)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, provider.ProviderID)
			}
		})
	}
}

func TestCDB_SeedMarketProviderMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	providerID1 := baseID + 1
	providerID2 := baseID + 2
	marketID := baseID + 3

	tcs := []struct {
		desc                        string
		marketProviderMetricsToSave []*clinicalkpidb.MarketProviderMetrics

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			marketProviderMetricsToSave: []*clinicalkpidb.MarketProviderMetrics{
				{
					ProviderID:                   providerID1,
					MarketID:                     marketID,
					OnSceneTimeMedianSeconds:     6000,
					OnSceneTimeWeekChangeSeconds: 100,
					ChartClosureRate:             94,
					ChartClosureRateWeekChange:   -3,
					NetPromoterScoreAverage:      90,
					NetPromoterScoreWeekChange:   2,
					OnTaskPercent:                70,
					OnTaskPercentWeekChange:      11,
				},
				{
					ProviderID:                   providerID2,
					MarketID:                     marketID,
					OnSceneTimeMedianSeconds:     7000,
					OnSceneTimeWeekChangeSeconds: -300,
					SurveyCaptureRate:            90,
					SurveyCaptureRateWeekChange:  4,
					NetPromoterScoreAverage:      88,
					NetPromoterScoreWeekChange:   -5,
					OnTaskPercent:                80,
					OnTaskPercentWeekChange:      -7,
				},
			},

			wantIDs: []int64{providerID1, providerID2},
		},
		{
			desc:                        "success - empty input",
			marketProviderMetricsToSave: []*clinicalkpidb.MarketProviderMetrics{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedMarketProviderMetrics(ctx, tc.marketProviderMetricsToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				metrics, err := queries.TestGetMarketProviderMetricsByProviderIDAndMarketID(
					ctx,
					clinicalkpisql.TestGetMarketProviderMetricsByProviderIDAndMarketIDParams{
						MarketID:   marketID,
						ProviderID: id,
					},
				)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, metrics.ProviderID)
			}
		})
	}
}

func TestCDB_SeedProviderShifts(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()

	shiftTeamID1 := now.UnixNano() + 1
	shiftTeamID2 := now.UnixNano() + 2
	providerID1 := now.UnixNano() + 3
	providerID2 := now.UnixNano() + 4

	tcs := []struct {
		desc                 string
		providerShiftsToSave []*clinicalkpidb.ProviderShift

		wantIDs []int64
	}{
		{
			desc: "success - base case",
			providerShiftsToSave: []*clinicalkpidb.ProviderShift{
				{
					ShiftTeamID:               shiftTeamID1,
					ProviderID:                providerID1,
					ServiceDate:               now,
					StartTime:                 now,
					EndTime:                   now,
					PatientsSeen:              7,
					OutTheDoorDurationSeconds: 1500,
					EnRouteDurationSeconds:    7000,
					OnSceneDurationSeconds:    8000,
					OnBreakDurationSeconds:    1800,
					IdleDurationSeconds:       500,
				},
				{
					ShiftTeamID:               shiftTeamID2,
					ProviderID:                providerID2,
					ServiceDate:               now,
					StartTime:                 now,
					EndTime:                   now,
					PatientsSeen:              7,
					OutTheDoorDurationSeconds: 1500,
					EnRouteDurationSeconds:    7000,
					OnSceneDurationSeconds:    8000,
					OnBreakDurationSeconds:    1800,
					IdleDurationSeconds:       500,
				},
			},

			wantIDs: []int64{shiftTeamID1, shiftTeamID2},
		},
		{
			desc:                 "success - empty input",
			providerShiftsToSave: []*clinicalkpidb.ProviderShift{},

			wantIDs: []int64{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedProviderShifts(ctx, tc.providerShiftsToSave)
			if err != nil {
				t.Fatal(err)
			}

			for _, id := range tc.wantIDs {
				shift, err := queries.TestGetProviderShiftByShiftTeamID(ctx, id)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatch(t, id, shift.ShiftTeamID)
			}
		})
	}
}

func TestCDB_GetProviderDailyMetricsWithMarketGroupAveragesFromDate(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	today := clinicalkpiconv.TimestampToDate(now)
	yesterday := today.AddDate(0, 0, -1)
	baseID := now.UnixNano()
	provider1ID := baseID
	provider2ID := baseID + 1
	provider3ID := baseID + 2
	provider4ID := baseID + 3
	provider5ID := baseID + 4
	marketGroupTX := baseID
	marketGroupWA := baseID + 1
	dallasMarketID := baseID
	olympiaMarketID := baseID + 1
	seattleMarketID := baseID + 2
	tacomaMarketID := baseID + 3
	dallasShortName := "DAL"
	olympiaShortName := "OLY"
	seattleShortName := "SEA"
	tacomaShortName := "TAC"

	_, err := queries.TestAddMarketGroups(ctx, clinicalkpisql.TestAddMarketGroupsParams{
		MarketGroupIds:   []int64{marketGroupTX, marketGroupWA},
		MarketGroupNames: []string{"Dallas", "Olympia|Seattle|Tacoma"},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = queries.TestAddMarkets(ctx, []clinicalkpisql.TestAddMarketsParams{
		{
			MarketID:      dallasMarketID,
			Name:          "Dallas",
			ShortName:     sqltypes.ToNullString(&dallasShortName),
			MarketGroupID: sqltypes.ToNullInt64(&marketGroupTX),
		},
		{
			MarketID:      olympiaMarketID,
			Name:          "Olympia",
			ShortName:     sqltypes.ToNullString(&olympiaShortName),
			MarketGroupID: sqltypes.ToNullInt64(&marketGroupWA),
		},
		{
			MarketID:      seattleMarketID,
			Name:          "Seattle",
			ShortName:     sqltypes.ToNullString(&seattleShortName),
			MarketGroupID: sqltypes.ToNullInt64(&marketGroupWA),
		},
		{
			MarketID:      tacomaMarketID,
			Name:          "Tacoma",
			ShortName:     sqltypes.ToNullString(&tacomaShortName),
			MarketGroupID: sqltypes.ToNullInt64(&marketGroupWA),
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = queries.TestAddProviderDailyMetrics(ctx, clinicalkpisql.TestAddProviderDailyMetricsParams{
		ProviderIds:                  []int64{provider1ID, provider2ID, provider1ID, provider2ID, provider2ID, provider3ID, provider4ID, provider4ID, provider5ID, provider5ID},
		MarketIds:                    []int64{dallasMarketID, dallasMarketID, dallasMarketID, olympiaMarketID, tacomaMarketID, seattleMarketID, dallasMarketID, seattleMarketID, dallasMarketID, seattleMarketID},
		ServiceDates:                 []time.Time{yesterday, yesterday, today, today, today, today, today, today, today, today},
		PatientsSeenValues:           []int32{7, 6, 5, 2, 5, 8, 1, 7, 3, 3},
		OnShiftDurationSecondsValues: []int32{30240, 25920, 21600, 8640, 21600, 34560, 4320, 30240, 12960, 12960},
	})
	if err != nil {
		t.Fatal(err)
	}

	yesterdayTXAveragePatientsSeen, _ := pgtypes.BuildNumeric(6.5)
	yesterdayTXAverageOnShiftDurationSeconds, _ := pgtypes.BuildNumeric(28080)
	todayTXAveragePatientsSeen, _ := pgtypes.BuildNumeric(3)
	todayTXAverageOnShiftDurationSeconds, _ := pgtypes.BuildNumeric(12960)
	todayWAAveragePatientsSeen, _ := pgtypes.BuildNumeric(6.25)
	todayWAAverageOnShiftDurationSeconds, _ := pgtypes.BuildNumeric(27000)

	tcs := []struct {
		desc   string
		params clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams

		want []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow
	}{
		{
			desc:   "should return provider daily metrics",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: provider1ID},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
				{
					ProviderID:                               provider1ID,
					ServiceDate:                              yesterday,
					MarketGroupID:                            marketGroupTX,
					MarketGroupName:                          "Dallas",
					PatientsSeen:                             7,
					MarketGroupAveragePatientsSeen:           yesterdayTXAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: yesterdayTXAverageOnShiftDurationSeconds,
				},
				{
					ProviderID:                               provider1ID,
					ServiceDate:                              today,
					MarketGroupID:                            marketGroupTX,
					MarketGroupName:                          "Dallas",
					PatientsSeen:                             5,
					MarketGroupAveragePatientsSeen:           todayTXAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: todayTXAverageOnShiftDurationSeconds,
				},
			},
		},
		{
			desc:   "should return provider daily metrics from date",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: provider1ID, FromDate: today},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
				{
					ProviderID:                               provider1ID,
					ServiceDate:                              today,
					MarketGroupID:                            marketGroupTX,
					MarketGroupName:                          "Dallas",
					PatientsSeen:                             5,
					MarketGroupAveragePatientsSeen:           todayTXAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: todayTXAverageOnShiftDurationSeconds,
				},
			},
		},
		{
			desc:   "should return correct number of patients seen and average values when provider has seen patients in different markets from one market group",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: provider2ID, FromDate: today},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
				{
					ProviderID:                               provider2ID,
					ServiceDate:                              today,
					MarketGroupID:                            marketGroupWA,
					MarketGroupName:                          "Olympia|Seattle|Tacoma",
					PatientsSeen:                             7,
					MarketGroupAveragePatientsSeen:           todayWAAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: todayWAAverageOnShiftDurationSeconds,
				},
			},
		},
		{
			desc:   "should return metrics with max visits for market group if provider has visits in more than one market group",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: provider4ID, FromDate: today},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
				{
					ProviderID:                               provider4ID,
					ServiceDate:                              today,
					MarketGroupID:                            marketGroupWA,
					MarketGroupName:                          "Olympia|Seattle|Tacoma",
					PatientsSeen:                             7,
					MarketGroupAveragePatientsSeen:           todayWAAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: todayWAAverageOnShiftDurationSeconds,
				},
			},
		},
		{
			desc:   "should return only one metric if provider has visits in more than one market group with same number of visits",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: provider5ID, FromDate: today},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{
				{
					ProviderID:                               provider5ID,
					ServiceDate:                              today,
					MarketGroupID:                            marketGroupTX,
					MarketGroupName:                          "Dallas",
					PatientsSeen:                             3,
					MarketGroupAveragePatientsSeen:           todayTXAveragePatientsSeen,
					MarketGroupAverageOnShiftDurationSeconds: todayTXAverageOnShiftDurationSeconds,
				},
			},
		},
		{
			desc:   "should return empty array",
			params: clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{},

			want: []clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			providerDailyMetrics, err := cdb.GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx, tc.params)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, len(tc.want), len(providerDailyMetrics), "wrong number of metrics")
			for index := range providerDailyMetrics {
				compareGetProviderDailyMetricsWithMarketGroupAveragesFromDateRows(t, tc.want[index], *providerDailyMetrics[index])
			}
		})
	}
}

func TestCDB_GetLastShiftSnapshots(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	today := clinicalkpiconv.TimestampToDate(now)
	yesterday := today.AddDate(0, 0, -1)
	baseID := now.UnixNano()
	provider1ID := baseID
	provider2ID := baseID + 1
	shiftTeam1ID := baseID + 2
	shiftTeam2ID := baseID + 3
	shiftTeam3ID := baseID + 4
	enRouteStartTime := yesterday.Add(8 * time.Hour)
	enRouteEndTime := enRouteStartTime.Add(1 * time.Hour)
	onSceneStartTime := enRouteEndTime.Add(5 * time.Minute)
	onSceneEndTime := onSceneStartTime.Add(44 * time.Minute)
	onBreakStartTime := onSceneEndTime.Add(7 * time.Minute)
	onBreakEndTime := onBreakStartTime.Add(30 * time.Minute)
	enRoute2StartTime := yesterday.Add(8 * time.Hour)
	enRoute2EndTime := enRoute2StartTime.Add(33 * time.Minute)
	enRoute2TodayStartTime := today.Add(8 * time.Hour)
	enRoute2TodayEndTime := enRoute2TodayStartTime.Add(33 * time.Minute)
	enRoutePhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute.PhaseTypeID()
	onScenePhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene.PhaseTypeID()
	onBreakPhaseID := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak.PhaseTypeID()
	enRouteShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameEnRoute.String()
	onSceneShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnScene.String()
	onBreakShortName := clinicalkpidb.ShiftSnapshotPhaseTypeShortNameOnBreak.String()

	_, err := queries.TestAddProviderShifts(ctx, clinicalkpisql.TestAddProviderShiftsParams{
		ProviderIds:  []int64{provider1ID, provider2ID, provider2ID},
		ShiftTeamIds: []int64{shiftTeam1ID, shiftTeam2ID, shiftTeam3ID},
		ServiceDates: []time.Time{yesterday, yesterday, today},
		StartTimes:   []time.Time{enRouteStartTime, enRoute2StartTime, enRoute2TodayStartTime},
		EndTimes:     []time.Time{onBreakEndTime, enRoute2EndTime, enRoute2TodayEndTime},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.TestAddShiftSnapshots(ctx, clinicalkpisql.TestAddShiftSnapshotsParams{
		ShiftTeamIds:              []int64{shiftTeam1ID, shiftTeam1ID, shiftTeam1ID, shiftTeam2ID, shiftTeam3ID},
		ShiftSnapshotPhaseTypeIds: []int64{onBreakPhaseID, onScenePhaseID, enRoutePhaseID, enRoutePhaseID, enRoutePhaseID},
		StartTimestamps:           []time.Time{onBreakStartTime, onSceneStartTime, enRouteStartTime, enRoute2StartTime, enRoute2TodayStartTime},
		EndTimestamps:             []time.Time{onBreakEndTime, onSceneEndTime, enRouteEndTime, enRoute2EndTime, enRoute2TodayEndTime},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc       string
		providerID int64

		want []clinicalkpisql.GetLastShiftSnapshotsRow
	}{
		{
			desc:       "should return provider shift snapshots sorted by start_time",
			providerID: provider1ID,

			want: []clinicalkpisql.GetLastShiftSnapshotsRow{
				{
					ProviderID:               provider1ID,
					ShiftTeamID:              shiftTeam1ID,
					ServiceDate:              yesterday,
					ShiftSnapshotPhaseTypeID: enRoutePhaseID,
					Phase:                    sqltypes.ToNullString(&enRouteShortName),
					StartTimestamp:           enRouteStartTime,
					EndTimestamp:             enRouteEndTime,
				},
				{
					ProviderID:               provider1ID,
					ShiftTeamID:              shiftTeam1ID,
					ServiceDate:              yesterday,
					ShiftSnapshotPhaseTypeID: onScenePhaseID,
					Phase:                    sqltypes.ToNullString(&onSceneShortName),
					StartTimestamp:           onSceneStartTime,
					EndTimestamp:             onSceneEndTime,
				},
				{
					ProviderID:               provider1ID,
					ShiftTeamID:              shiftTeam1ID,
					ServiceDate:              yesterday,
					ShiftSnapshotPhaseTypeID: onBreakPhaseID,
					Phase:                    sqltypes.ToNullString(&onBreakShortName),
					StartTimestamp:           onBreakStartTime,
					EndTimestamp:             onBreakEndTime,
				},
			},
		},
		{
			desc:       "should return provider shift snapshots only for last working day",
			providerID: provider2ID,

			want: []clinicalkpisql.GetLastShiftSnapshotsRow{
				{
					ProviderID:               provider2ID,
					ShiftTeamID:              shiftTeam3ID,
					ServiceDate:              today,
					ShiftSnapshotPhaseTypeID: enRoutePhaseID,
					Phase:                    sqltypes.ToNullString(&enRouteShortName),
					StartTimestamp:           enRoute2TodayStartTime,
					EndTimestamp:             enRoute2TodayEndTime,
				},
			},
		},
		{
			desc: "should return empty array",

			want: []clinicalkpisql.GetLastShiftSnapshotsRow{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			lastProviderShiftSnapshots, err := cdb.GetLastShiftSnapshots(ctx, tc.providerID)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, len(tc.want), len(lastProviderShiftSnapshots), "wrong number of snapshots")
			for index := range lastProviderShiftSnapshots {
				compareGetLastShiftSnapshotsRows(t, tc.want[index], *lastProviderShiftSnapshots[index])
			}
		})
	}
}

func TestCDB_GetProviderAvatars(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2

	_, err := queries.TestAddProviders(ctx, []clinicalkpisql.TestAddProvidersParams{
		{
			ProviderID: providerID1,
			FirstName:  "Ben",
			LastName:   "Sahar",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID2,
			FirstName:  "John",
			LastName:   "Doe",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-2")),
			JobTitle:   "DHMT",
		},
	})

	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc string
	}{
		{
			desc: "should return ProviderAvatars",
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderAvatars(ctx)
			if err != nil {
				t.Fatal(err)
			}
			if len(result) == 0 {
				t.Fatal("Providers is nil")
			}
		})
	}
}

func TestCDB_UpdateProviderAvatars(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2

	_, err := queries.TestAddProviders(ctx, []clinicalkpisql.TestAddProvidersParams{
		{
			ProviderID: providerID1,
			FirstName:  "Ben",
			LastName:   "Sahar",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-1")),
			JobTitle:   "APP",
		},
		{
			ProviderID: providerID2,
			FirstName:  "John",
			LastName:   "Doe",
			AvatarUrl:  sqltypes.ToNullString(proto.String("URL-2")),
			JobTitle:   "DHMT",
		},
	})

	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc   string
		params clinicalkpisql.UpdateProviderAvatarsParams

		want      []sql.NullString
		wantError error
	}{
		{
			desc: "should upsert ProviderAvatars",
			params: clinicalkpisql.UpdateProviderAvatarsParams{
				ProviderIds: []int64{providerID1, providerID2},
				AvatarUrls:  []string{"URL-3", "URL-4"},
			},

			want:      []sql.NullString{sqltypes.ToValidNullString("URL-3"), sqltypes.ToValidNullString("URL-4")},
			wantError: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			err := cdb.UpdateProviderAvatars(ctx, tc.params)
			if err != nil && tc.wantError == nil {
				t.Fatal(err)
			}

			result, errGetProvider := queries.GetProviderAvatars(ctx)
			if errGetProvider != nil {
				t.Fatal(errGetProvider)
			}

			providerURLs := make([]sql.NullString, 2)
			for _, res := range result {
				if providerID1 == res.ProviderID {
					providerURLs[0] = res.AvatarUrl
				} else if providerID2 == res.ProviderID {
					providerURLs[1] = res.AvatarUrl
				}
			}

			testutils.MustMatchFn(".ID", ".CreatedAt")(t, tc.want, providerURLs)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestCDB_GetProviderMarketIDs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2
	marketID1 := baseID + 3
	marketID2 := baseID + 4

	_, err := queries.TestAddMarketProviderMetrics(ctx, clinicalkpisql.TestAddMarketProviderMetricsParams{
		ProviderIds:                  []int64{providerID1, providerID1, providerID2},
		MarketIds:                    []int64{marketID1, marketID2, marketID2},
		OnSceneTimeMedianSeconds:     []int32{600, 600, 600},
		OnSceneTimeWeekChangeSeconds: []int32{60, 60, 60},
		ChartClosureRates:            []float64{89.555, 91.431, 87.121},
		ChartClosureRateWeekChanges:  []float64{0.5321, 0.4231, 0.5215},
		SurveyCaptureRates:           []float64{0, 0, 0},
		SurveyCaptureRateWeekChanges: []float64{0, 0, 0},
		NetPromoterScoreAverages:     []float64{75.656, 67.321, 61.421},
		NetPromoterScoreWeekChanges:  []float64{0.505, 0.652, 0.543},
		OnTaskPercents:               []float64{89.555, 85.321, 82.421},
		OnTaskPercentWeekChanges:     []float64{0.5, 0.5, 0.5},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc       string
		providerID int64

		want []int64
	}{
		{
			desc:       "should return provider markets id",
			providerID: providerID1,

			want: []int64{marketID1, marketID2},
		},
		{
			desc:       "should return provider market id",
			providerID: providerID2,

			want: []int64{marketID2},
		},
		{
			desc:       "should return nil",
			providerID: 0,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderMarketIDs(ctx, tc.providerID)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.want, result)
		})
	}
}

func TestCDB_GetProviderMarkets(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID1 := baseID + 1
	providerID2 := baseID + 2
	marketID1 := baseID + 3
	marketID2 := baseID + 4

	_, err := queries.TestAddMarketProviderMetrics(ctx, clinicalkpisql.TestAddMarketProviderMetricsParams{
		ProviderIds:                  []int64{providerID1, providerID1, providerID2},
		MarketIds:                    []int64{marketID1, marketID2, marketID2},
		OnSceneTimeMedianSeconds:     []int32{600, 600, 600},
		OnSceneTimeWeekChangeSeconds: []int32{60, 60, 60},
		ChartClosureRates:            []float64{89.555, 91.431, 87.121},
		ChartClosureRateWeekChanges:  []float64{0.5321, 0.4231, 0.5215},
		SurveyCaptureRates:           []float64{0, 0, 0},
		SurveyCaptureRateWeekChanges: []float64{0, 0, 0},
		NetPromoterScoreAverages:     []float64{75.656, 67.321, 61.421},
		NetPromoterScoreWeekChanges:  []float64{0.505, 0.652, 0.543},
		OnTaskPercents:               []float64{89.555, 85.321, 82.421},
		OnTaskPercentWeekChanges:     []float64{0.5, 0.5, 0.5},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.TestAddMarkets(ctx, []clinicalkpisql.TestAddMarketsParams{
		{
			MarketID:  marketID1,
			Name:      "Denver",
			ShortName: sqltypes.ToNullString(proto.String("DEN")),
		},
		{
			MarketID:  marketID2,
			Name:      "Colorado Springs",
			ShortName: sqltypes.ToNullString(proto.String("COS")),
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc       string
		providerID int64

		want []*clinicalkpisql.Market
	}{
		{
			desc:       "should return 2 markets for the first provider",
			providerID: providerID1,

			want: []*clinicalkpisql.Market{
				{
					MarketID:  marketID1,
					Name:      "Denver",
					ShortName: sqltypes.ToNullString(proto.String("DEN")),
				},
				{
					MarketID:  marketID2,
					Name:      "Colorado Springs",
					ShortName: sqltypes.ToNullString(proto.String("COS")),
				},
			},
		},
		{
			desc:       "should return 1 market for the second provider",
			providerID: providerID2,

			want: []*clinicalkpisql.Market{
				{
					MarketID:  marketID2,
					Name:      "Colorado Springs",
					ShortName: sqltypes.ToNullString(proto.String("COS")),
				},
			},
		},
		{
			desc:       "should return nil",
			providerID: 0,

			want: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			result, err := cdb.GetProviderMarkets(ctx, tc.providerID)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".MarketGroupID")(t, tc.want, result)
		})
	}
}

func TestCDB_SeedMarketGroups(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	marketGroup1ID := baseID
	marketGroup2ID := baseID + 1
	marketGroup3ID := baseID + 2

	tcs := []struct {
		desc   string
		params []clinicalkpidb.MarketGroup

		want      []*clinicalkpisql.MarketGroup
		wantError bool
	}{
		{
			desc: "should work successfully",
			params: []clinicalkpidb.MarketGroup{
				{
					MarketGroupID: marketGroup1ID,
					Name:          "Dallas",
				},
				{
					MarketGroupID: marketGroup2ID,
					Name:          "Olympia|Seattle|Tacoma",
				},
			},

			want: []*clinicalkpisql.MarketGroup{
				{
					MarketGroupID: marketGroup1ID,
					Name:          "Dallas",
				},
				{
					MarketGroupID: marketGroup2ID,
					Name:          "Olympia|Seattle|Tacoma",
				},
			},
		},
		{
			desc:   "should work without error in case there are no market groups to save",
			params: []clinicalkpidb.MarketGroup{},

			want: []*clinicalkpisql.MarketGroup{},
		},
		{
			desc: "should return error on unique constraint validation error",
			params: []clinicalkpidb.MarketGroup{
				{
					MarketGroupID: marketGroup3ID,
					Name:          "Dallas",
				},
				{
					MarketGroupID: marketGroup3ID,
					Name:          "Olympia|Seattle|Tacoma",
				},
			},

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedMarketGroups(ctx, tc.params)

			if (err != nil) != tc.wantError {
				t.Errorf("AddMarketGroups() error = %v, wantErr %v", err, tc.wantError)
				return
			}

			for _, want := range tc.want {
				got, err := queries.TestGetMarketGroupByMarketGroupID(ctx, want.MarketGroupID)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, want, got)
			}
		})
	}
}

func TestCDB_SeedProviderDailyMetrics(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	now := time.Now()
	today := clinicalkpiconv.TimestampToDate(now)
	yesterday := today.AddDate(0, 0, -1)
	baseID := now.UnixNano()
	marketGroupID := baseID
	marketID := baseID
	provider1ID := baseID
	provider2ID := baseID + 1
	provider3ID := baseID + 3
	dallasShortName := "DAL"

	_, err := queries.TestAddMarketGroups(ctx, clinicalkpisql.TestAddMarketGroupsParams{
		MarketGroupIds:   []int64{marketGroupID},
		MarketGroupNames: []string{"Dallas"},
	})
	if err != nil {
		t.Fatal(err)
	}
	_, err = queries.TestAddMarkets(ctx, []clinicalkpisql.TestAddMarketsParams{
		{
			MarketID:      marketID,
			Name:          "Dallas",
			ShortName:     sqltypes.ToNullString(&dallasShortName),
			MarketGroupID: sqltypes.ToNullInt64(&marketGroupID),
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc   string
		params []clinicalkpidb.ProviderDailyMetrics

		want      map[int64][]*clinicalkpisql.ProviderDailyMetric
		wantError bool
	}{
		{
			desc: "should work successfully",
			params: []clinicalkpidb.ProviderDailyMetrics{
				{
					ProviderID:             provider1ID,
					MarketID:               marketID,
					ServiceDate:            yesterday,
					PatientsSeen:           7,
					OnShiftDurationSeconds: 30240,
				},
				{
					ProviderID:             provider2ID,
					MarketID:               marketID,
					ServiceDate:            yesterday,
					PatientsSeen:           6,
					OnShiftDurationSeconds: 25920,
				},
				{
					ProviderID:             provider1ID,
					MarketID:               marketID,
					ServiceDate:            today,
					PatientsSeen:           5,
					OnShiftDurationSeconds: 21600,
				},
				{
					ProviderID:             provider2ID,
					MarketID:               marketID,
					ServiceDate:            today,
					PatientsSeen:           8,
					OnShiftDurationSeconds: 34560,
				},
			},

			want: map[int64][]*clinicalkpisql.ProviderDailyMetric{
				provider1ID: {
					{
						ProviderID:             provider1ID,
						MarketID:               marketID,
						ServiceDate:            yesterday,
						PatientsSeen:           7,
						OnShiftDurationSeconds: 30240,
					},
					{
						ProviderID:             provider1ID,
						MarketID:               marketID,
						ServiceDate:            today,
						PatientsSeen:           5,
						OnShiftDurationSeconds: 21600,
					},
				},
				provider2ID: {
					{
						ProviderID:             provider2ID,
						MarketID:               marketID,
						ServiceDate:            yesterday,
						PatientsSeen:           6,
						OnShiftDurationSeconds: 25920,
					},
					{
						ProviderID:             provider2ID,
						MarketID:               marketID,
						ServiceDate:            today,
						PatientsSeen:           8,
						OnShiftDurationSeconds: 34560,
					},
				},
			},
		},
		{
			desc:   "should work without error in case there are no daily metrics to save",
			params: []clinicalkpidb.ProviderDailyMetrics{},

			want: map[int64][]*clinicalkpisql.ProviderDailyMetric{},
		},
		{
			desc: "should return error on unique constraint validation error",
			params: []clinicalkpidb.ProviderDailyMetrics{
				{
					ProviderID:             provider3ID,
					MarketID:               marketID,
					ServiceDate:            today,
					PatientsSeen:           7,
					OnShiftDurationSeconds: 30240,
				},
				{
					ProviderID:             provider3ID,
					MarketID:               marketID,
					ServiceDate:            today,
					PatientsSeen:           5,
					OnShiftDurationSeconds: 21600,
				},
			},

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)

			_, err := cdb.SeedProviderDailyMetrics(ctx, tc.params)

			if (err != nil) != tc.wantError {
				t.Errorf("AddProviderDailyMetrics() error = %v, wantErr %v", err, tc.wantError)
				return
			}

			for providerID, wantMetrics := range tc.want {
				gotMetrics, err := queries.TestGetProviderDailyMetricsByProviderID(ctx, providerID)
				if err != nil {
					t.Fatal(err)
				}
				testutils.MustMatchFn(".ID", ".CreatedAt")(t, wantMetrics, gotMetrics)
			}
		})
	}
}

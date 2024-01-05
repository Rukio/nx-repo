//go:build db_test

package clinicalkpidb_test

import (
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestUpsertCalculatedProviderMetrics(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	providerID := time.Now().UnixNano()

	testCases := []struct {
		Name                                  string
		UpsertCalculatedProviderMetricsParams clinicalkpisql.UpsertCalculatedProviderMetricsParams

		Want clinicalkpisql.CalculatedProviderMetric
	}{
		{
			Name: "first upsert to create the calculated provider metric",
			UpsertCalculatedProviderMetricsParams: clinicalkpisql.UpsertCalculatedProviderMetricsParams{
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
				LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},

			Want: clinicalkpisql.CalculatedProviderMetric{
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
				LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
				CompletedCareRequests:              mockCompleteCareRequests,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			got, err := queries.UpsertCalculatedProviderMetrics(ctx, testCase.UpsertCalculatedProviderMetricsParams)
			if err != nil {
				t.Fatal(err)
			}

			compareCalculatedMetrics(t, testCase.Want, *got)
		})
	}
}

func TestGetCalculatedMetricsByProvider(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	providerID1 := baseID
	providerID2 := baseID + 1

	providerMetric1Params := clinicalkpisql.UpsertCalculatedProviderMetricsParams{
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
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	providerMetric2Params := clinicalkpisql.UpsertCalculatedProviderMetricsParams{
		ProviderID:                         providerID2,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		AverageNetPromoterScoreChange:      mockNetPromoterScoreChange,
		ChartClosureRate:                   mockChartClosureRate,
		ChartClosureRateChange:             mockChartClosureRateChange,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		SurveyCaptureRateChange:            mockSurveyCaptureRateChange,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		MedianOnSceneTimeSecsChange:        mockOnSceneTimeSecsChange,
		ChangeDays:                         mockChangeDays + 1,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}

	want := clinicalkpisql.CalculatedProviderMetric{
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
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}

	_, err := queries.UpsertCalculatedProviderMetrics(ctx, providerMetric1Params)
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.UpsertCalculatedProviderMetrics(ctx, providerMetric2Params)
	if err != nil {
		t.Fatal(err)
	}

	metric, err := queries.GetCalculatedMetricsByProvider(ctx, providerID1)
	if err != nil {
		t.Fatal(err)
	}

	compareCalculatedMetrics(t, want, *metric)
}

func TestGetCalculatedMetricsForProvidersActiveAfterDate(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	providerID1 := baseID
	providerID2 := baseID + 1

	providerMetric1Params := clinicalkpisql.UpsertCalculatedProviderMetricsParams{
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
		LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(11), 25, 12, 0, 0, 0, time.UTC)),
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	providerMetric2Params := clinicalkpisql.UpsertCalculatedProviderMetricsParams{
		ProviderID:                         providerID2,
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
		LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(8), 30, 12, 0, 0, 0, time.UTC)),
		CompletedCareRequests:              mockCompleteCareRequests,
	}

	_, err := queries.UpsertCalculatedProviderMetrics(ctx, providerMetric1Params)
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.UpsertCalculatedProviderMetrics(ctx, providerMetric2Params)
	if err != nil {
		t.Fatal(err)
	}

	activeAfter := time.Date(2022, time.Month(9), 06, 12, 0, 0, 0, time.UTC)
	metricsFound, err := queries.GetCalculatedMetricsForProvidersActiveAfterDate(ctx, clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams{
		ProviderIds: []int64{providerID1, providerID2},
		ActiveAfter: sqltypes.ToValidNullTime(activeAfter),
	})

	for i := 0; i < len(metricsFound); i++ {
		metric := metricsFound[i]
		if metric.LastCareRequestCompletedAt.Time.Before(activeAfter) {
			t.Fatal(err)
		}
	}

	testutils.MustMatch(t, 1, len(metricsFound), "Wrong number of calculated metrics returned")
}

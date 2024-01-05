//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"math/rand"
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

func BenchmarkUpsertCalculatedProviderMetrics(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		baseID := time.Now().UnixNano()
		_, err := queries.UpsertCalculatedProviderMetrics(ctx, clinicalkpisql.UpsertCalculatedProviderMetricsParams{
			ProviderID:                         baseID + 1,
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
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkBulkGetCalculatedMetricsByProvider(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		metricCount int
	}{
		{1},
		{10},
		{100},
		{1000},
		{10000},
	}

	for _, tc := range tcs {
		var providerIDs []int64
		b.Run(fmt.Sprintf("%d", tc.metricCount), func(b *testing.B) {
			for i := 0; i < tc.metricCount; i++ {
				baseID := time.Now().UnixNano()
				providerID := baseID + 1
				providerIDs = append(providerIDs, providerID)
				_, err := queries.UpsertCalculatedProviderMetrics(ctx, clinicalkpisql.UpsertCalculatedProviderMetricsParams{
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
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			r := rand.New(rand.NewSource(time.Now().Unix()))
			min := 0
			max := len(providerIDs) - 1
			for n := 0; n < b.N; n++ {
				randomIndex := int64(r.Intn(max-min+1) + min)
				_, err := queries.GetCalculatedMetricsByProvider(ctx, providerIDs[randomIndex])
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkBulkGetCalculatedMetricsForProvidersActiveAfterDate(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		totalProviderCount int
		queryProviderCount int
	}{
		{1, 1},
		{100, 1},
		{10000, 100},
	}

	activeAfter := time.Date(2022, time.Month(9), 06, 12, 0, 0, 0, time.UTC)

	for _, tc := range tcs {
		providerIDs := make([]int64, 0, tc.totalProviderCount)
		b.Run(fmt.Sprintf("%d-%d", tc.totalProviderCount, tc.queryProviderCount), func(b *testing.B) {
			for i := 0; i < tc.totalProviderCount; i++ {
				baseID := time.Now().UnixNano()
				providerID := baseID + 1
				providerIDs = append(providerIDs, providerID)
				_, err := queries.UpsertCalculatedProviderMetrics(ctx, clinicalkpisql.UpsertCalculatedProviderMetricsParams{
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
					LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Date(2022, time.Month(randomInt(8, 11)), 2, 12, 0, 0, 0, time.UTC)),
					CompletedCareRequests:              mockCompleteCareRequests,
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				metrics, err := queries.GetCalculatedMetricsForProvidersActiveAfterDate(ctx, clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams{
					ProviderIds: providerIDs[0:tc.queryProviderCount],
					ActiveAfter: sqltypes.ToValidNullTime(activeAfter),
				})
				if err != nil {
					b.Fatal(err)
				}
				resultLength := len(metrics)
				if resultLength > 0 {
					for i := 0; i < resultLength; i++ {
						metric := metrics[i]
						if metric.LastCareRequestCompletedAt.Time.Before(activeAfter) {
							b.Fatal(err)
						}
					}
				}
			}
		})
	}
}

func randomInt(min, max int) int {
	r := rand.New(rand.NewSource(time.Now().Unix()))
	return r.Intn(max-min+1) + min
}

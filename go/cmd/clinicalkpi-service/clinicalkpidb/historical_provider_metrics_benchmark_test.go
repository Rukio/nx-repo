//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
)

func BenchmarkGetOldestHistoricalProviderMetricAfterDate(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		totalProviderCount int
		metricsPerProvider int
	}{
		{1, 100},
		{10, 100},
		{100, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d-%d", tc.totalProviderCount, tc.metricsPerProvider), func(b *testing.B) {
			baseID := time.Now().UnixNano()
			for i := 0; i < tc.totalProviderCount; i++ {
				for k := 0; k < tc.metricsPerProvider; k++ {
					_, err := queries.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
						ProviderID:                         baseID + int64(i),
						CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
						AverageNetPromoterScore:            mockNetPromoterScore,
						ChartClosureRate:                   mockChartClosureRate,
						SurveyCaptureRate:                  mockSurveyCaptureRate,
						MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
						LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
						CompletedCareRequests:              mockCompleteCareRequests,
					})
					if err != nil {
						b.Fatal(err)
					}
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetOldestHistoricalProviderMetricAfterDate(ctx, clinicalkpisql.GetOldestHistoricalProviderMetricAfterDateParams{
					ProviderID:   baseID,
					CreatedAfter: time.Now().Add(-1 * time.Hour),
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

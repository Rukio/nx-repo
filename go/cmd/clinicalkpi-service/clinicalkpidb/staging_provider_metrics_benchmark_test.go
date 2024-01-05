//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
)

func BenchmarkAddStagingProviderMetric(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	providerID := time.Now().UnixNano()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
			ProviderID:                         providerID,
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

func BenchmarkGetAllStagingProviderMetrics(b *testing.B) {
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

	baseID := time.Now().UnixNano()

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.metricCount), func(b *testing.B) {
			err := queries.DeleteAllStagingProviderMetrics(ctx)
			if err != nil {
				b.Fatal(err)
			}
			for i := 0; i < tc.metricCount; i++ {
				_, err := queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
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

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetAllStagingProviderMetrics(ctx)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

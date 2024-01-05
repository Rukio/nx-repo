//go:build db_test

package clinicalkpidb_test

import (
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestAddHistoricalProviderMetric(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	providerID := time.Now().UnixNano()
	input := clinicalkpisql.AddHistoricalProviderMetricParams{
		ProviderID:                         providerID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	want := clinicalkpisql.HistoricalProviderMetric{
		ProviderID:                         providerID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	got, err := queries.AddHistoricalProviderMetric(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	compareHistoricalMetrics(t, want, *got)
}

func TestGetOldestHistoricalProviderMetricAfterDate(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID

	_, err := queries.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
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
		t.Fatal(err)
	}

	metricToCheck, err := queries.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
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
		t.Fatal(err)
	}

	_, err = queries.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
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
		t.Fatal(err)
	}

	result, err := queries.GetOldestHistoricalProviderMetricAfterDate(ctx, clinicalkpisql.GetOldestHistoricalProviderMetricAfterDateParams{
		ProviderID:   providerID,
		CreatedAfter: metricToCheck.CreatedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, metricToCheck.ID, result.ID, "wrong metric id")
}

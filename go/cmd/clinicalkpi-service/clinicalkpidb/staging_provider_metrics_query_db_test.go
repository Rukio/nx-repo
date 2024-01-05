//go:build db_test

package clinicalkpidb_test

import (
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestAddStagingProviderMetric(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	err := queries.DeleteAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	providerID := time.Now().UnixNano()
	input := clinicalkpisql.AddStagingProviderMetricParams{
		ProviderID:                         providerID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	expectedOutput := clinicalkpisql.StagingProviderMetric{
		ProviderID:                         providerID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
		CompletedCareRequests:              mockCompleteCareRequests,
	}
	_, err = queries.AddStagingProviderMetric(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	stagingMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 1, len(stagingMetrics), "wrong number of metrics")
	compareStagingMetrics(t, expectedOutput, *stagingMetrics[0])
}

func TestGetAllStagingProviderMetrics(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	err := queries.DeleteAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	baseID := time.Now().UnixNano()
	provider1ID := baseID
	provider2ID := baseID + 1
	provider3ID := baseID + 2

	_, err = queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
		ProviderID:                         provider1ID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
		ProviderID:                         provider2ID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
		ProviderID:                         provider3ID,
		CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
		AverageNetPromoterScore:            mockNetPromoterScore,
		ChartClosureRate:                   mockChartClosureRate,
		SurveyCaptureRate:                  mockSurveyCaptureRate,
		MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
		LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	stagingMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 3, len(stagingMetrics), "wrong number of metrics")
}

func TestDeleteAllStagingProviderMetrics(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()
	providerID := time.Now().UnixNano()

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
		t.Fatal(err)
	}

	err = queries.DeleteAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	stagingMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 0, len(stagingMetrics), "wrong number of metrics")
}

func TestDeleteStagingProviderMetric(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()
	providerID := baseID

	tcs := []struct {
		name   string
		metric *clinicalkpisql.AddStagingProviderMetricParams

		wantSuccess bool
	}{
		{
			name: "success - base case",
			metric: &clinicalkpisql.AddStagingProviderMetricParams{
				ProviderID:                         providerID,
				CareRequestsCompletedLastSevenDays: mockCareRequestsCompletedLastSevenDays,
				AverageNetPromoterScore:            mockNetPromoterScore,
				ChartClosureRate:                   mockChartClosureRate,
				SurveyCaptureRate:                  mockSurveyCaptureRate,
				MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
				CompletedCareRequests:              mockCompletedCareRequests,
				LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
			},

			wantSuccess: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			metric, err := queries.AddStagingProviderMetric(ctx, *tc.metric)
			if err != nil {
				t.Fatalf("error adding staging provider metric: %s", err)
			}

			preDeletionMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
			if err != nil {
				t.Fatalf("error getting staging provider metrics: %s", err)
			}

			wantLength := len(preDeletionMetrics)
			if tc.wantSuccess {
				wantLength--
			}

			err = queries.DeleteStagingProviderMetric(ctx, metric.ID)
			if err != nil {
				t.Fatalf("error deleting staging provider metric: %s", err)
			}

			postDeletionMetrics, err := queries.GetAllStagingProviderMetrics(ctx)
			if err != nil {
				t.Fatalf("error getting staging provider metrics: %s", err)
			}

			gotLength := len(postDeletionMetrics)

			testutils.MustMatch(t, wantLength, gotLength, "wrong number of metrics")
		})
	}
}

//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"go.uber.org/zap"
)

func BenchmarkProcessStagingRecords(b *testing.B) {
	ctx, db, queries, done := setupDBTest(b)
	defer done()

	tcsTimes := []struct {
		metricCount int
	}{
		{1},
		{10},
		{100},
		{1000},
		{10000},
		{100000},
	}

	b.ResetTimer()
	for _, tcsTime := range tcsTimes {
		b.Run(fmt.Sprintf("%d", tcsTime.metricCount), func(b *testing.B) {
			cdb := clinicalkpidb.NewClinicalKPIDB(db, nil, nil)
			for i := 0; i < tcsTime.metricCount; i++ {
				baseID := time.Now().UnixNano()
				r := rand.New(rand.NewSource(baseID))

				careRequestsCompletedLastSevenDays := int32(r.Int() % 20)
				surveyCaptureRate, _ := pgtypes.BuildNumeric(r.Int() % 100)
				chartClosureRate, _ := pgtypes.BuildNumeric(r.Int() % 100)
				netPromoterScore, _ := pgtypes.BuildNumeric(r.Int() % 100)

				providerID := baseID + int64(i)
				_, err := queries.AddHistoricalProviderMetric(ctx, clinicalkpisql.AddHistoricalProviderMetricParams{
					ProviderID:                         providerID,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
					CompletedCareRequests:              mockCompleteCareRequests,
				})
				if err != nil {
					b.Fatal(err)
				}

				_, err = queries.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
					ProviderID:                         providerID,
					MedianOnSceneTimeSecs:              mockOnSceneTimeSecs,
					LastCareRequestCompletedAt:         mockLastCareRequestCompletedAt,
					CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
					AverageNetPromoterScore:            netPromoterScore,
					ChartClosureRate:                   chartClosureRate,
					SurveyCaptureRate:                  surveyCaptureRate,
					CompletedCareRequests:              mockCompleteCareRequests,
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				err := cdb.ProcessStagingRecords(ctx, 90, zap.NewNop().Sugar())
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"math/rand"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpiconv"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

func BenchmarkGetProviderDailyMetricsWithMarketGroupAveragesFromDate(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()
	marketCount := 50
	marketGroupCount := 10

	tcs := []struct {
		providerCount     int
		serviceDatesCount int
	}{
		{10, 10},
		{100, 10},
		{1000, 10},
		{10000, 10},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d-%d", tc.providerCount, tc.serviceDatesCount), func(b *testing.B) {
			now := time.Now()
			today := clinicalkpiconv.TimestampToDate(now)
			r := rand.New(rand.NewSource(now.Unix()))
			baseID := now.UnixNano()

			marketGroupIDs := make([]int64, marketGroupCount)
			marketGroupNames := make([]string, marketGroupCount)
			for i := 0; i < marketGroupCount; i++ {
				marketGroupIDs[i] = baseID + int64(i)
				marketGroupNames[i] = fmt.Sprintf("market_group_%d", i+1)
			}
			_, err := queries.TestAddMarketGroups(ctx, clinicalkpisql.TestAddMarketGroupsParams{
				MarketGroupIds:   marketGroupIDs,
				MarketGroupNames: marketGroupNames,
			})
			if err != nil {
				b.Fatal(err)
			}

			marketsToSave := make([]clinicalkpisql.TestAddMarketsParams, marketCount)
			for i := 0; i < marketCount; i++ {
				shortName := fmt.Sprintf("mk_%d", i+1)
				marketsToSave[i].MarketID = baseID + int64(i)
				marketsToSave[i].Name = fmt.Sprintf("market_%d", i+1)
				marketsToSave[i].ShortName = sqltypes.ToNullString(&shortName)
				marketsToSave[i].MarketGroupID = sqltypes.ToNullInt64(&marketGroupIDs[i%marketGroupCount])
			}
			_, err = queries.TestAddMarkets(ctx, marketsToSave)
			if err != nil {
				b.Fatal(err)
			}

			metricProviderIDs := make([]int64, tc.providerCount)
			metricMarketIDs := make([]int64, tc.providerCount)
			metricServiceDates := make([]time.Time, tc.providerCount)
			metricPatientSeenValues := make([]int32, tc.providerCount)
			metricOnShiftDurationSecondsValues := make([]int32, tc.providerCount)
			for j := 0; j < tc.providerCount; j++ {
				metricProviderIDs[j] = baseID + int64(j)
				metricPatientSeenValues[j] = 8
				metricOnShiftDurationSecondsValues[j] = 34560
			}
			for i := 0; i < tc.serviceDatesCount; i++ {
				currentDate := today.AddDate(0, 0, i-tc.serviceDatesCount)
				for j := 0; j < tc.providerCount; j++ {
					metricMarketIDs[j] = marketsToSave[r.Intn(marketCount)].MarketID
					metricServiceDates[j] = currentDate
				}
				_, err = queries.TestAddProviderDailyMetrics(ctx, clinicalkpisql.TestAddProviderDailyMetricsParams{
					ProviderIds:                  metricProviderIDs,
					MarketIds:                    metricMarketIDs,
					ServiceDates:                 metricServiceDates,
					PatientsSeenValues:           metricPatientSeenValues,
					OnShiftDurationSecondsValues: metricOnShiftDurationSecondsValues,
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				randomProviderID := metricProviderIDs[r.Intn(tc.providerCount)]
				_, err := queries.GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx, clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{
					ProviderID: randomProviderID,
					FromDate:   today.AddDate(0, 0, -7),
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

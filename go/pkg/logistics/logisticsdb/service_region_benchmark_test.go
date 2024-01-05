//go:build db_test

package logisticsdb_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func BenchmarkGetMarkets(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)

	queries := logisticssql.New(db)

	ctx := context.Background()

	tcs := []struct {
		serviceRegions int
		markets        int
	}{
		{1, 1},
		{2, 1},
		{2, 2},
		{2, 5},
		{20, 5},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.serviceRegions, tc.markets), func(b *testing.B) {
			var lastServiceRegionID int64
			for i := 0; i < tc.serviceRegions; i++ {
				serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
					Description: "some description",
				})
				if err != nil {
					b.Fatal(err)
				}
				for j := 0; j < tc.markets; j++ {
					_, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
						ServiceRegionID: serviceRegion.ID,
						StationMarketID: time.Now().UnixNano(),
						ShortName:       "ABC",
					})
					if err != nil {
						b.Fatal(err)
					}
				}
				lastServiceRegionID = serviceRegion.ID
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetMarketsInServiceRegion(ctx, lastServiceRegionID)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetServiceRegionForMarket(b *testing.B) {
	ctx, _, queries, _ := setupDBTest(b)

	tcs := []struct {
		serviceRegions  int
		markets         int
		marketSnapshots int
	}{
		{1, 1, 1},
		{2, 1, 2},
		{2, 2, 3},
		{2, 5, 5},
		{10, 10, 10},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%dx%d", tc.serviceRegions, tc.markets, tc.marketSnapshots), func(b *testing.B) {
			markets := make([]*logisticssql.Market, tc.markets)
			for i := 0; i < tc.serviceRegions; i++ {
				serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
					Description: "some description",
				})
				if err != nil {
					b.Fatal(err)
				}
				for j := 0; j < tc.markets; j++ {
					for k := 0; k < tc.marketSnapshots; k++ {
						market, err := queries.AddMarket(ctx, logisticssql.AddMarketParams{
							ServiceRegionID: serviceRegion.ID,
							StationMarketID: int64(j),
							ShortName:       fmt.Sprintf("ABC%d", j),
						})
						if err != nil {
							b.Fatal(err)
						}
						markets[j] = market
					}
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetServiceRegionForStationMarket(ctx, markets[0].StationMarketID)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetLatestOpenHoursScheduleForServiceRegions(b *testing.B) {
	ctx, _, queries, _ := setupDBTest(b)

	tcs := []struct {
		serviceRegions                  int
		serviceRegionOpenHoursSchedules int
	}{
		{1, 1},
		{2, 2},
		{2, 5},
		{10, 10},
	}

	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")
	var serviceRegionIDS []int64
	var day *logisticssql.ServiceRegionOpenHoursScheduleDay
	tzLoc, err := time.LoadLocation("America/Mexico_City")
	if err != nil {
		b.Fatal(err)
	}

	date := time.Date(2022, time.November, 30, 0, 0, 0, 0, tzLoc)
	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.serviceRegions, tc.serviceRegionOpenHoursSchedules), func(b *testing.B) {
			for i := 0; i < tc.serviceRegions; i++ {
				serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
					Description: "A Service Region",
				})
				if err != nil {
					b.Fatal(err)
				}
				serviceRegionIDS = append(serviceRegionIDS, serviceRegion.ID)
				for j := 0; j < tc.serviceRegionOpenHoursSchedules; j++ {
					schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
					if err != nil {
						b.Fatal(err)
					}

					days, err := queries.AddServiceRegionOpenHoursScheduleDays(ctx, logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
						ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID, schedule.ID, schedule.ID, schedule.ID, schedule.ID, schedule.ID, schedule.ID},
						DaysOfWeek:                        []int32{0, 1, 2, 3, 4, 5, 6},
						StartTimes:                        []time.Time{startDayTime, startDayTime, startDayTime, startDayTime, startDayTime, startDayTime, startDayTime},
						EndTimes:                          []time.Time{endDayTime, endDayTime, endDayTime, endDayTime, endDayTime, endDayTime, endDayTime},
					})
					if err != nil {
						b.Fatal(err)
					}
					day = days[0]
				}
			}
			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetLatestOpenHoursScheduleForServiceRegionsForDay(ctx, logisticssql.GetLatestOpenHoursScheduleForServiceRegionsForDayParams{
					ServiceRegionIds: serviceRegionIDS,
					BeforeCreatedAt:  day.CreatedAt,
					DayOfWeek:        int32(date.Weekday()),
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetServiceRegionsForStationMarkets(b *testing.B) {
	ctx, db, queries, _ := setupDBTest(b)

	ldb := logisticsdb.NewLogisticsDB(db, nil, noSettingsService, monitoring.NewMockScope())

	tcs := []struct {
		serviceRegions int
		markets        int
	}{
		{1, 1},
		{10, 10},
		{100, 100},
		{1000, 1000},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.serviceRegions, tc.markets), func(b *testing.B) {
			var marketIDs []int64
			for i := 0; i < tc.markets; i++ {
				stationMarketID := time.Now().UnixNano()
				err := ldb.UpsertMarketAndServiceRegionFromStationMarket(ctx, &marketpb.Market{
					Id:               stationMarketID,
					Enabled:          proto.Bool(true),
					ScheduleDays:     []*commonpb.ScheduleDay{},
					IanaTimeZoneName: proto.String("America/Denver"),
					Name:             proto.String("get service regions benchmark test"),
					ShortName:        proto.String("get service regions benchmark test"),
				})
				if err != nil {
					b.Fatal(err)
				}
				marketIDs = append(marketIDs, stationMarketID)
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				serviceRegions, err := queries.GetServiceRegionsForStationMarkets(ctx, marketIDs)
				if err != nil {
					b.Fatal(err)
				}

				if len(serviceRegions) != tc.serviceRegions {
					b.Fatal("not enough service regions")
				}
			}
		})
	}
}

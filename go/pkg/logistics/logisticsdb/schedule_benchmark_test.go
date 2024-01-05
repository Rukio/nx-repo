//go:build db_test

package logisticsdb_test

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

func repeat(val int64, num int) []int64 {
	var res []int64
	for i := 0; i < num; i++ {
		res = append(res, val)
	}
	return res
}

func repeatInt32(val int32, num int) []int32 {
	var res []int32
	for i := 0; i < num; i++ {
		res = append(res, val)
	}
	return res
}

func routeIDs(routes []*logisticssql.ScheduleRoute) []int64 {
	if routes == nil {
		return nil
	}
	res := make([]int64, len(routes))
	for i, r := range routes {
		res[i] = r.ID
	}
	return res
}

func scheduleRouteID(visitIndex int64, numRoutes int) int64 {
	// round-robing the visits in the routes.
	return visitIndex % int64(numRoutes)
}

func scheduleRouteIndex(visitIndex int64, numRoutes int) int32 {
	// 10 visits, 5 routes
	// 0 1 2 3 4 5 6 7 8 9
	// a b c d e a b c d e
	// 1 1 1 1 1 2 2 2 2 2
	previousVisitsOnRoute := visitIndex / int64(numRoutes)
	// how many before visitIndex were also on this route?

	return int32(1 + previousVisitsOnRoute)
}

func addRoutesWithRestBreakAndVisitStops(ctx context.Context, scheduleID int64, numRoutes, visits, stops int, queries *logisticssql.Queries, b *testing.B) []int64 {
	// For simplicity, we put a single rest break per route.
	numRestBreaks := numRoutes
	if visits+numRestBreaks != stops {
		b.Fatalf("visits(%d) and numRoutes(%d) must add up to stops(%d)", visits, numRestBreaks, stops)
	}
	routesParams := logisticssql.AddScheduleRoutesParams{}
	for i := int64(0); i < int64(numRoutes); i++ {
		routesParams.DepotArrivalTimestampsSec = append(routesParams.DepotArrivalTimestampsSec, i)
		routesParams.ShiftTeamSnapshotIds = append(routesParams.ShiftTeamSnapshotIds, i)
		routesParams.ScheduleIds = append(routesParams.ScheduleIds, scheduleID)
	}

	var scheduleRestBreakIDs []int64
	routes, err := queries.AddScheduleRoutes(ctx, routesParams)
	if err != nil {
		b.Fatal(err)
	}
	for i := int64(0); i < int64(numRestBreaks); i++ {
		br, err := queries.AddShiftTeamRestBreakRequest(ctx, logisticssql.AddShiftTeamRestBreakRequestParams{
			ShiftTeamID:          i,
			StartTimestampSec:    i,
			DurationSec:          i,
			LocationID:           i,
			MaxRestBreakRequests: int64(numRestBreaks),
		})
		if err != nil {
			b.Fatal(err)
		}
		brs, err := queries.AddScheduleRestBreak(ctx, logisticssql.AddScheduleRestBreakParams{
			ScheduleID:              scheduleID,
			ScheduleRouteID:         routes[i].ID,
			ShiftTeamBreakRequestID: br.ID,
		})
		if err != nil {
			b.Fatal(err)
		}
		scheduleRestBreakIDs = append(scheduleRestBreakIDs, brs.ID)
	}
	var scheduleVisitStopsParams logisticssql.AddScheduleVisitStopsParams
	for i := int64(0); i < int64(visits); i++ {
		vs, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
			LocationID:    i,
			CareRequestID: i,
		})
		if err != nil {
			b.Fatal(err)
		}
		testutils.MustFn(b)(queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{VisitSnapshotID: vs.ID, VisitPhaseTypeID: 2}))
		sv, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
			ScheduleID:          scheduleID,
			ScheduleRouteID:     routes[scheduleRouteID(i, numRoutes)].ID,
			VisitSnapshotID:     sqltypes.ToValidNullInt64(vs.ID),
			ArrivalTimestampSec: time.Now().Unix(),
		})
		if err != nil {
			b.Fatal(err)
		}

		scheduleVisitStopsParams.ScheduleVisitIds = append(scheduleVisitStopsParams.ScheduleVisitIds, sv.ID)
		scheduleVisitStopsParams.ScheduleIds = append(scheduleVisitStopsParams.ScheduleIds, scheduleID)
		scheduleVisitStopsParams.ScheduleRouteIds = append(scheduleVisitStopsParams.ScheduleRouteIds, sv.ScheduleRouteID)
		scheduleVisitStopsParams.RouteIndexes = append(scheduleVisitStopsParams.RouteIndexes, scheduleRouteIndex(i, numRoutes))
		// b.Log(sv.ScheduleRouteID, scheduleRouteID(i, numRoutes), scheduleRouteIndex(int64(visits), i, numRoutes), i)
	}

	// create rest break stops
	testutils.MustFn(b)(queries.AddScheduleRestBreakStops(ctx, logisticssql.AddScheduleRestBreakStopsParams{
		ScheduleIds:          repeat(scheduleID, numRestBreaks),
		ScheduleRouteIds:     routeIDs(routes),
		RouteIndexes:         repeatInt32(0, numRestBreaks),
		ScheduleRestBreakIds: scheduleRestBreakIDs,
	}))

	// create visit stops
	testutils.MustFn(b)(queries.AddScheduleVisitStops(ctx, scheduleVisitStopsParams))
	return routeIDs(routes)
}

func addVisitsAndShiftTeams(ctx context.Context, schedules, routes, visits int, queries *logisticssql.Queries, b *testing.B) ([]int64, []int64) {
	serviceRegionID := time.Now().UnixNano()

	var scheduleIds, depotArrivalTimestampsSec []int64
	var visitSnapshotIDs, shiftTeamSnapshotIDs []int64
	for i := 0; i < schedules; i++ {
		schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
			ServiceRegionID: serviceRegionID,
			OptimizerRunID:  0,
		})
		if err != nil {
			b.Fatal(err)
		}

		for j := 0; j < routes; j++ {
			shiftTeamSnapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
				ShiftTeamID: int64(j),
			})
			if err != nil {
				b.Fatal(err)
			}
			scheduleIds = append(scheduleIds, schedule.ID)
			shiftTeamSnapshotIDs = append(shiftTeamSnapshotIDs, shiftTeamSnapshot.ID)
			depotArrivalTimestampsSec = append(depotArrivalTimestampsSec, int64(j))
		}
	}

	scheduleRoutes, err := queries.AddScheduleRoutes(ctx, logisticssql.AddScheduleRoutesParams{
		ScheduleIds:               scheduleIds,
		ShiftTeamSnapshotIds:      shiftTeamSnapshotIDs,
		DepotArrivalTimestampsSec: depotArrivalTimestampsSec,
	})
	if err != nil {
		b.Fatal(err)
	}

	{
		var scheduleIDs, routeIDs, arrivalTimestampsSec []int64
		baseCareRequestID := time.Now().UnixNano()
		for i := 0; i < len(scheduleRoutes); i++ {
			for j := 0; j < visits; j++ {
				visitSnapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
					CareRequestID: baseCareRequestID + int64(i*visits+j),
				})
				if err != nil {
					b.Fatal(err)
				}

				scheduleIDs = append(scheduleIDs, scheduleRoutes[i].ScheduleID)
				routeIDs = append(routeIDs, scheduleRoutes[i].ID)
				visitSnapshotIDs = append(visitSnapshotIDs, visitSnapshot.ID)
				arrivalTimestampsSec = append(arrivalTimestampsSec, rand.Int63())
			}
		}
		addScheduleVisitStopsParams := logisticssql.AddScheduleVisitStopsParams{}
		for i := 0; i < len(scheduleIDs); i++ {
			sv, err := queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
				ScheduleID:          scheduleIDs[i],
				ScheduleRouteID:     routeIDs[i],
				VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotIDs[i]),
				ArrivalTimestampSec: arrivalTimestampsSec[i],
			})
			if err != nil {
				b.Fatal(err)
			}
			addScheduleVisitStopsParams.ScheduleVisitIds = append(addScheduleVisitStopsParams.ScheduleVisitIds, sv.ID)
			addScheduleVisitStopsParams.ScheduleIds = append(addScheduleVisitStopsParams.ScheduleIds, sv.ScheduleID)
			addScheduleVisitStopsParams.ScheduleRouteIds = append(addScheduleVisitStopsParams.ScheduleRouteIds, sv.ScheduleRouteID)
			addScheduleVisitStopsParams.RouteIndexes = append(addScheduleVisitStopsParams.RouteIndexes, int32(i+1))
		}

		testutils.MustFn(b)(queries.AddScheduleVisitStops(ctx, addScheduleVisitStopsParams))
	}

	return visitSnapshotIDs, shiftTeamSnapshotIDs
}

func benchmarkAddSchedule(count int, db *pgxpool.Pool, b *testing.B) int64 {
	b.Helper()
	queries := logisticssql.New(db)

	serviceRegionID := time.Now().UnixMilli()

	b.ResetTimer()
	for n := 0; n < count; n++ {
		_, err := queries.AddSchedule(context.Background(), logisticssql.AddScheduleParams{
			ServiceRegionID: serviceRegionID,
			OptimizerRunID:  0,
		})
		if err != nil {
			b.Fatal(err)
		}
	}

	return serviceRegionID
}

func BenchmarkAddSchedule(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	benchmarkAddSchedule(b.N, db, b)
}

func benchmarkAddScheduleRoutes(count int, db *pgxpool.Pool, b *testing.B) {
	queries := logisticssql.New(db)

	var shiftTeamSnapshotIds, depotArrivalTimestampsSec []int64
	scheduleIds := make([]int64, count)
	for i := 0; i < count; i++ {
		shiftTeamSnapshotIds = append(shiftTeamSnapshotIds, int64(i))
		depotArrivalTimestampsSec = append(depotArrivalTimestampsSec, rand.Int63())
	}

	scheduleID := time.Now().UnixNano()

	for n := 0; n < b.N; n++ {
		scheduleID++
		for i := 0; i < count; i++ {
			scheduleIds[i] = scheduleID
		}
		_, err := queries.AddScheduleRoutes(context.Background(), logisticssql.AddScheduleRoutesParams{
			ScheduleIds:               scheduleIds,
			ShiftTeamSnapshotIds:      shiftTeamSnapshotIds,
			DepotArrivalTimestampsSec: depotArrivalTimestampsSec,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAddScheduleRoutes(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []int{10, 100, 1000}

	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			benchmarkAddScheduleRoutes(count, db, b)
		})
	}
}

func BenchmarkAddScheduleVisit(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	routeID := time.Now().UnixMilli()

	tcs := []struct {
		routes int
		visits int
	}{
		{1, 10},
		{1, 100},
		{5, 10},
		{10, 10},
		{10, 20},
		{20, 10},
		{20, 20},
		{10, 100},
		{20, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d=%d", tc.routes, tc.visits, tc.routes*tc.visits), func(b *testing.B) {
			var visitSnapshotIds, arrivalTimestampsSec []int64
			routeIds := make([]int64, tc.routes*tc.visits)
			for i := 0; i < tc.routes; i++ {
				for j := 0; j < tc.visits; j++ {
					visitSnapshotIds = append(visitSnapshotIds, int64(i*tc.visits+j))
					arrivalTimestampsSec = append(arrivalTimestampsSec, rand.Int63())
				}
			}

			for n := 0; n < b.N; n++ {
				routeID++
				for i := 0; i < len(routeIds); i++ {
					routeIds[i] = routeID
				}
				for i := 0; i < len(routeIds); i++ {
					_, err := queries.AddScheduleVisit(context.Background(), logisticssql.AddScheduleVisitParams{
						ScheduleRouteID:     routeIds[i],
						VisitSnapshotID:     sqltypes.ToValidNullInt64(visitSnapshotIds[i]),
						ArrivalTimestampSec: arrivalTimestampsSec[i],
					})
					if err != nil {
						b.Fatal(err)
					}
				}
			}
		})
	}
}

func BenchmarkGetLatestScheduleIDForServiceRegionDate(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	tcs := []int{
		1, 10, 100,
	}

	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			serviceRegionID := benchmarkAddSchedule(count, db, b)

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetLatestScheduleInfoForServiceRegionDate(
					context.Background(),
					logisticssql.GetLatestScheduleInfoForServiceRegionDateParams{
						ServiceRegionID:  serviceRegionID,
						ServiceDate:      time.UnixMilli(serviceRegionID),
						OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
						CreatedBefore:    time.Now(),
					},
				)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetLatestScheduleRouteVisitForVisitID(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	tcs := []struct {
		schedules int
		routes    int
		visits    int
	}{
		{1, 1, 1},
		{1, 5, 1},
		{1, 5, 10},
		{1, 10, 10},
		{2, 10, 10},
		{5, 10, 10},
		{5, 20, 10},
		{5, 20, 20},
		{10, 20, 20},
	}

	ctx := context.Background()

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d/%dx%d", tc.schedules, tc.routes, tc.visits), func(b *testing.B) {
			visitIDs, _ := addVisitsAndShiftTeams(ctx, tc.schedules, tc.routes, tc.visits, queries, b)

			lastVisitID := visitIDs[len(visitIDs)-1]

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetLatestScheduleRouteVisitForVisitSnapshotID(
					ctx,
					sqltypes.ToValidNullInt64(lastVisitID),
				)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetShiftTeamsIDsInRegionSince(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	tcs := []struct {
		NumShiftTeamSnapshotsPerDay []int
	}{
		{
			NumShiftTeamSnapshotsPerDay: []int{5, 5, 5},
		},
		{
			NumShiftTeamSnapshotsPerDay: []int{20, 30, 40, 40, 40},
		},
		{
			NumShiftTeamSnapshotsPerDay: []int{50, 50, 60, 70, 90, 100, 100},
		},
		{
			NumShiftTeamSnapshotsPerDay: []int{200, 200, 200, 200, 200, 200, 200, 200},
		},
	}

	ctx := context.Background()

	for _, tc := range tcs {
		params := addBenchmarkServiceRegionShiftTeams(ctx, tc.NumShiftTeamSnapshotsPerDay, db, b)
		b.Run(fmt.Sprintf("%dx%v", len(tc.NumShiftTeamSnapshotsPerDay), tc.NumShiftTeamSnapshotsPerDay), func(b *testing.B) {
			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				result := queries.GetShiftTeamsIDsInRegionSince(ctx, params)
				result.Query(func(_ int, _ []int64, err error) {
					if err != nil {
						b.Fatal(err)
					}
				})
				result.Close()
			}
		})
	}
}

func addBenchmarkServiceRegionShiftTeams(ctx context.Context, shiftTeamSnapshotsPerDay []int, db *pgxpool.Pool, b *testing.B) []logisticssql.GetShiftTeamsIDsInRegionSinceParams {
	b.Helper()
	queries := logisticssql.New(db)
	serviceRegionID := time.Now().UnixMilli()

	tzLoc, _ := time.LoadLocation("UTC")
	date := time.Now().In(tzLoc)

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		b.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "9:00PM")
	if err != nil {
		b.Fatal(err)
	}

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, startDayTime, tzLoc)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, endDayTime, tzLoc)

	params := make([]logisticssql.GetShiftTeamsIDsInRegionSinceParams, len(shiftTeamSnapshotsPerDay))
	for i := 0; i < len(shiftTeamSnapshotsPerDay); i++ {
		var earliestCreationTimestamp time.Time
		var latestCreationTimestamp time.Time
		for j := 0; j < shiftTeamSnapshotsPerDay[i]; j++ {
			shiftTeam, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
				ShiftTeamID:       int64(i * j),
				ServiceRegionID:   serviceRegionID,
				StartTimestampSec: startTimestamp.AddDate(0, 0, i).Unix(),
				EndTimestampSec:   endTimestamp.AddDate(0, 0, i).Unix(),
			})
			if err != nil {
				b.Fatal(err)
			}

			if j == 0 {
				earliestCreationTimestamp = shiftTeam.CreatedAt
			}
			latestCreationTimestamp = shiftTeam.CreatedAt
		}
		params[i] = logisticssql.GetShiftTeamsIDsInRegionSinceParams{
			ServiceRegionID:    serviceRegionID,
			StartTimestampSec:  startTimestamp.AddDate(0, 0, i).Unix(),
			EndTimestampSec:    endTimestamp.AddDate(0, 0, i).Unix(),
			SinceSnapshotTime:  earliestCreationTimestamp,
			LatestSnapshotTime: latestCreationTimestamp,
		}
	}

	return params
}

func BenchmarkGetCareRequestIDsSince(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	ctx := context.Background()
	queries := logisticssql.New(db)

	tcs := []struct {
		NumVisitSnapshotsPerDay []int
	}{
		{
			NumVisitSnapshotsPerDay: []int{5, 5, 5},
		},
		{
			NumVisitSnapshotsPerDay: []int{20, 30, 40, 40, 40},
		},
		{
			NumVisitSnapshotsPerDay: []int{50, 50, 60, 70, 90, 100, 100},
		},
		{
			NumVisitSnapshotsPerDay: []int{200, 200, 200, 200, 200, 200, 200, 200},
		},
	}

	for _, tc := range tcs {
		params := addBenchmarkServiceRegionVisits(ctx, b, db, tc.NumVisitSnapshotsPerDay)

		b.Run(fmt.Sprintf("%d,%v", len(tc.NumVisitSnapshotsPerDay), tc.NumVisitSnapshotsPerDay), func(b *testing.B) {
			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				result := queries.GetCareRequestIDsSince(ctx, params)
				result.Query(func(_ int, _ []int64, err error) {
					if err != nil {
						b.Fatal(err)
					}
				})
				result.Close()
			}
		})
	}
}

func addBenchmarkServiceRegionVisits(ctx context.Context, b *testing.B, db *pgxpool.Pool, visitSnapshotsPerDay []int) []logisticssql.GetCareRequestIDsSinceParams {
	b.Helper()
	queries := logisticssql.New(db)
	serviceRegionID := time.Now().UnixNano()

	tzLoc, _ := time.LoadLocation("UTC")
	date := time.Now().In(tzLoc)

	startDayTime, err := time.Parse(time.Kitchen, "8:00AM")
	if err != nil {
		b.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "9:00PM")
	if err != nil {
		b.Fatal(err)
	}

	arrivalStartTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, startDayTime, tzLoc)
	arrivalEndTimestampSec := logisticsdb.TimestampFromDateTimeLoc(date, endDayTime, tzLoc)
	params := make([]logisticssql.GetCareRequestIDsSinceParams, len(visitSnapshotsPerDay))
	for i := 0; i < len(visitSnapshotsPerDay); i++ {
		arrivalStartTimestampInDate := arrivalStartTimestamp.AddDate(0, 0, i)
		arrivalEndTimestampSecInDate := arrivalEndTimestampSec.AddDate(0, 0, i)
		var earliestCreationTimestamp time.Time
		var latestCreationTimestamp time.Time
		for j := 0; j < visitSnapshotsPerDay[i]; j++ {
			visit, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
				CareRequestID:   int64(i * j),
				ServiceRegionID: serviceRegionID,
				LocationID:      0,
				ArrivalStartTimestampSec: sql.NullInt64{
					Valid: true,
					Int64: arrivalStartTimestampInDate.Unix(),
				},
				ArrivalEndTimestampSec: sql.NullInt64{
					Valid: true,
					Int64: arrivalEndTimestampSecInDate.Unix(),
				},
			})
			if err != nil {
				b.Fatal(err)
			}

			if j == 0 {
				earliestCreationTimestamp = visit.CreatedAt
			}
			latestCreationTimestamp = visit.CreatedAt
		}
		params[i] = logisticssql.GetCareRequestIDsSinceParams{
			ServiceRegionID:    serviceRegionID,
			StartTimestampSec:  sqltypes.ToValidNullInt64(arrivalStartTimestampInDate.Unix()),
			EndTimestampSec:    sqltypes.ToValidNullInt64(arrivalEndTimestampSecInDate.Unix()),
			SinceSnapshotTime:  earliestCreationTimestamp,
			LatestSnapshotTime: latestCreationTimestamp,
		}
	}
	return params
}

func BenchmarkGetScheduleRouteStopsForSchedule(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	tcs := []struct {
		numRoutes int
		stops     int
		visits    int
	}{
		{1, 1, 0},
		{5, 15, 10},
		{10, 100, 90},
		{100, 1000, 900},
	}

	ctx := context.Background()

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d/%dx%d", tc.numRoutes, tc.stops, tc.visits), func(b *testing.B) {
			scheduleID := time.Now().UnixNano()
			addRoutesWithRestBreakAndVisitStops(ctx, scheduleID, tc.numRoutes, tc.visits, tc.stops, queries, b)

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetScheduleRouteStopsForSchedule(ctx, logisticssql.GetScheduleRouteStopsForScheduleParams{
					ScheduleID:         scheduleID,
					LatestSnapshotTime: time.Now(),
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetScheduleRouteStopsForScheduleRouteID(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := logisticssql.New(db)

	tcs := []struct {
		visits int
	}{
		{1},
		{10},
		{100},
		{1000},
	}

	ctx := context.Background()

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.visits), func(b *testing.B) {
			scheduleID := time.Now().UnixNano()
			// a single route
			scheduleRouteIDs := addRoutesWithRestBreakAndVisitStops(ctx, scheduleID, 1, tc.visits, tc.visits+1, queries, b)
			if len(scheduleRouteIDs) != 1 {
				b.Fatalf("wrong number of routes created: %d", len(scheduleRouteIDs))
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetScheduleRouteStopsForScheduleRouteID(ctx, logisticssql.GetScheduleRouteStopsForScheduleRouteIDParams{
					ScheduleRouteID:    scheduleRouteIDs[0],
					LatestSnapshotTime: time.Now(),
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

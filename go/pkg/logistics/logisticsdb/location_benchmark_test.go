//go:build db_test

package logisticsdb_test

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/pkg/errors"
)

func randLatLng(r *rand.Rand) (int32, int32) {
	return r.Int31(), r.Int31()
}

func chunkArray(items []int64, chunkSize int) [][]int64 {
	var chunks [][]int64
	for chunkSize < len(items) {
		chunks = append(chunks, items[0:chunkSize])
		items = items[chunkSize:]
	}
	return append(chunks, items)
}

func benchmarkBulkInsertLocations(count int, db *pgxpool.Pool, b *testing.B) ([]int32, []int32) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	latE6s := make([]int32, count)
	lngE6s := make([]int32, count)
	for i := 0; i < count; i++ {
		latE6s[i], lngE6s[i] = randLatLng(r)
	}

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.UpsertLocations(context.Background(), logisticssql.UpsertLocationsParams{
			LatE6s: latE6s,
			LngE6s: lngE6s,
		})
		if err != nil {
			b.Fatal(err)
		}
	}

	return latE6s, lngE6s
}

func benchmarkBulkGetLocations(count int, db *pgxpool.Pool, b *testing.B) {
	b.Helper()
	latE6s, lngE6s := benchmarkBulkInsertLocations(count, db, b)

	queries := logisticssql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetLocations(context.Background(), logisticssql.GetLocationsParams{
			LatE6s: latE6s,
			LngE6s: lngE6s,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func benchmarkBulkAddDistances(count int, db *pgxpool.Pool, b *testing.B) ([]int64, []int64, []int64) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	fromLocationIDs := make([]int64, count)
	toLocationIDs := make([]int64, count)
	sourceIDs := make([]int64, count)
	distancesMeters := make([]int32, count)
	durationsSec := make([]int32, count)
	for i := 0; i < count; i++ {
		fromLocationIDs[i] = r.Int63()
		toLocationIDs[i] = r.Int63()
		sourceIDs[i] = r.Int63()
		distancesMeters[i] = r.Int31()
		durationsSec[i] = r.Int31()
	}

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddDistances(context.Background(), logisticssql.AddDistancesParams{
			FromLocationIds:  fromLocationIDs,
			ToLocationIds:    toLocationIDs,
			DistancesMeters:  distancesMeters,
			DurationsSeconds: durationsSec,
			SourceIds:        sourceIDs,
		})
		if err != nil {
			b.Fatal(err)
		}
	}

	return fromLocationIDs, toLocationIDs, sourceIDs
}

func benchmarkBatchGetLatestDistances(count int, distancesPerPair int, batchSize int, db *pgxpool.Pool, b *testing.B) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	fromLocationIds, toLocationIds, sourceIds := benchmarkBulkAddDistances(count, db, b)
	for i := 0; i < distancesPerPair; i++ {
		distancesMeters := make([]int32, count)
		durationsSec := make([]int32, count)
		for j := 0; j < count; j++ {
			distancesMeters[j] = r.Int31()
			durationsSec[j] = r.Int31()
		}
		_, err := queries.AddDistances(context.Background(), logisticssql.AddDistancesParams{
			FromLocationIds:  fromLocationIds,
			ToLocationIds:    toLocationIds,
			DistancesMeters:  distancesMeters,
			DurationsSeconds: durationsSec,
			SourceIds:        sourceIds,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
	batchedFromLocationIDs := chunkArray(fromLocationIds, batchSize)
	batchedToLocationIDs := chunkArray(toLocationIds, batchSize)
	batchedSourceIDs := chunkArray(sourceIds, batchSize)
	var batchParams []logisticssql.BatchGetLatestDistancesForLocationsParams

	batches := int(math.Ceil(float64(count) / float64(batchSize)))

	for i := 0; i < batches; i++ {
		batchParams = append(batchParams, logisticssql.BatchGetLatestDistancesForLocationsParams{
			FromLocationIds: batchedFromLocationIDs[i],
			ToLocationIds:   batchedToLocationIDs[i],
			SourceIds:       batchedSourceIDs[i],
		})
	}

	b.ResetTimer()
	ctx := context.Background()
	for n := 0; n < b.N; n++ {
		var allDistances []*logisticssql.BatchGetLatestDistancesForLocationsRow
		batchGetLatestDistancesForLocations := queries.BatchGetLatestDistancesForLocations(ctx, batchParams)
		defer batchGetLatestDistancesForLocations.Close()

		batchGetLatestDistancesForLocations.Query(func(i int, rows []*logisticssql.BatchGetLatestDistancesForLocationsRow, err error) {
			if err != nil {
				b.Fatal(err)
			}
			allDistances = append(allDistances, rows...)
		})
		if len(allDistances) != count {
			b.Fatal(errors.Errorf("incorrect number of distances, got: %d, expected: %d", len(allDistances), count))
		}
	}
}

func benchmarkBulkGetLatestDistances(count int, distancesPerPair int, db *pgxpool.Pool, b *testing.B) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	fromLocationIds, toLocationIds, sourceIds := benchmarkBulkAddDistances(count, db, b)
	for i := 0; i < distancesPerPair; i++ {
		distancesMeters := make([]int32, count)
		durationsSec := make([]int32, count)
		for j := 0; j < count; j++ {
			distancesMeters[j] = r.Int31()
			durationsSec[j] = r.Int31()
		}
		_, err := queries.AddDistances(context.Background(), logisticssql.AddDistancesParams{
			FromLocationIds:  fromLocationIds,
			ToLocationIds:    toLocationIds,
			DistancesMeters:  distancesMeters,
			DurationsSeconds: durationsSec,
			SourceIds:        sourceIds,
		})
		if err != nil {
			b.Fatal(err)
		}
	}

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetLatestDistancesForLocations(context.Background(), logisticssql.GetLatestDistancesForLocationsParams{
			FromLocationIds: fromLocationIds,
			ToLocationIds:   toLocationIds,
			SourceIds:       sourceIds,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func benchmarkGetLatestDistances(count int, distancesPerPair int, db *pgxpool.Pool, b *testing.B) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	fromLocationIds, toLocationIds, sourceIds := benchmarkBulkAddDistances(count, db, b)
	for i := 0; i < distancesPerPair; i++ {
		distancesMeters := make([]int32, count)
		durationsSec := make([]int32, count)
		for j := 0; j < count; j++ {
			distancesMeters[j] = r.Int31()
			durationsSec[j] = r.Int31()
		}
		_, err := queries.AddDistances(context.Background(), logisticssql.AddDistancesParams{
			FromLocationIds:  fromLocationIds,
			ToLocationIds:    toLocationIds,
			DistancesMeters:  distancesMeters,
			DurationsSeconds: durationsSec,
			SourceIds:        sourceIds,
		})
		if err != nil {
			b.Fatal(err)
		}
	}

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		for i := 0; i < len(fromLocationIds); i++ {
			_, err := queries.GetLatestDistanceForLocation(context.Background(), logisticssql.GetLatestDistanceForLocationParams{
				FromLocationID: fromLocationIds[i],
				ToLocationID:   toLocationIds[i],
				SourceID:       sourceIds[i],
			})
			if err != nil {
				b.Fatal(err)
			}
		}
	}
}

func BenchmarkBulkInsertLocations(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []int{10, 100, 1000, 10000}
	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			benchmarkBulkInsertLocations(count, db, b)
		})
	}
}

func BenchmarkBulkGetLocations(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []int{10, 100, 1000, 10000}
	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			benchmarkBulkGetLocations(count, db, b)
		})
	}

	benchmarkBulkGetLocations(10, db, b)
}

func BenchmarkBulkAddDistances(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []int{10, 100, 1000, 10000}
	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			benchmarkBulkAddDistances(count, db, b)
		})
	}
}

func BenchmarkGetLatestDistances(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []struct {
		elems       int
		elemHistory int
	}{
		{1, 1},
		{10, 1},
		{10, 10},
		{10, 100},
		{100, 10},
		{1000, 10},
		{10000, 10},
	}
	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.elems, tc.elemHistory), func(b *testing.B) {
			benchmarkGetLatestDistances(tc.elems, tc.elemHistory, db, b)
		})
	}
}

func BenchmarkBatchGetLatestDistances(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []struct {
		elems       int
		elemHistory int
		batchSize   int
	}{
		{10, 1, 10},
		{10, 10, 500},
		{10, 10, 1000},
		{100, 10, 500},
		{100, 10, 1000},
		{1000, 50, 500},
		{1000, 50, 1000},
		{10000, 50, 100},
		{10000, 50, 500},
		{10000, 50, 1000},
	}
	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%dbatchSize%d", tc.elems, tc.elemHistory, tc.batchSize), func(b *testing.B) {
			benchmarkBatchGetLatestDistances(tc.elems, tc.elemHistory, tc.batchSize, db, b)
		})
	}
}

func BenchmarkBulkGetLatestDistances(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []struct {
		elems       int
		elemHistory int
	}{
		{10, 1},
		{10, 10},
		{10, 100},
		{100, 10},
		{100, 100},
		{1000, 10},
		{1000, 100},
		{10000, 10},
		{10000, 50},
	}
	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.elems, tc.elemHistory), func(b *testing.B) {
			benchmarkBulkGetLatestDistances(tc.elems, tc.elemHistory, db, b)
		})
	}
}

func benchmarkGetLocationsByIDs(count int, db *pgxpool.Pool, b *testing.B) {
	b.Helper()
	queries := logisticssql.New(db)

	r := rand.New(rand.NewSource(time.Now().Unix()))

	latE6s := make([]int32, count)
	lngE6s := make([]int32, count)
	for i := 0; i < count; i++ {
		latE6s[i], lngE6s[i] = randLatLng(r)
	}

	locations, err := queries.UpsertLocations(context.Background(), logisticssql.UpsertLocationsParams{
		LatE6s: latE6s,
		LngE6s: lngE6s,
	})
	if err != nil {
		b.Fatal(err)
	}

	var locationsIds []int64
	for _, location := range locations {
		locationsIds = append(locationsIds, location.ID)
	}

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		locationsByIds, err := queries.GetLocationsByIDs(context.Background(), locationsIds)
		if err != nil {
			b.Fatal(err)
		}
		if len(locationsByIds) != len(locationsIds) {
			b.Fatalf("the number of elements isn't the same, the expected number of elements is %d and we receive %d", len(locationsIds), len(locationsByIds))
		}
	}
}

func BenchmarkGetLocationsByIDs(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	tcs := []int{10, 100, 1000, 10000}

	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			benchmarkGetLocationsByIDs(count, db, b)
		})
	}
}

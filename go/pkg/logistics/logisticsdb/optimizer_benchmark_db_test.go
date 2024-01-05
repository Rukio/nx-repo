//go:build db_test

package logisticsdb_test

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"testing"
	"time"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

func BenchmarkAddVisitSnapshots(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
			CareRequestID:      1,
			ServiceRegionID:    1,
			LocationID:         1,
			ServiceDurationSec: 0,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAddShiftTeamSnapshots(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
			ShiftTeamID:       int64(n),
			ServiceRegionID:   1,
			BaseLocationID:    1,
			StartTimestampSec: 0,
			EndTimestampSec:   0,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetVisitSnapshotsInRegion(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		visitCount int
	}{
		{1},
		{10},
		{100},
		{1000},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.visitCount), func(b *testing.B) {
			regionID := time.Now().UnixNano()
			for i := 0; i < tc.visitCount; i++ {
				_, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
					CareRequestID:            int64(i),
					ServiceRegionID:          regionID,
					LocationID:               int64(i),
					ArrivalStartTimestampSec: sql.NullInt64{Valid: true, Int64: int64(i)},
					ArrivalEndTimestampSec:   sql.NullInt64{Valid: true, Int64: int64(i)},
					ServiceDurationSec:       int64(i),
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				visitSnapshots, err := queries.GetVisitSnapshotsInRegion(ctx, logisticssql.GetVisitSnapshotsInRegionParams{
					ServiceRegionID:          regionID,
					ArrivalStartTimestampSec: sql.NullInt64{Valid: true, Int64: 0},
					ArrivalEndTimestampSec:   sql.NullInt64{Valid: true, Int64: int64(tc.visitCount)},
				})
				if err != nil {
					b.Fatal(err)
				}

				if len(visitSnapshots) != tc.visitCount {
					b.Fatal("not enough snapshots")
				}
			}
		})
	}
}
func BenchmarkGetLatestShiftTeamSnapshot(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		snapshotCount int
	}{
		{1},
		{10},
		{100},
		{1000},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.snapshotCount), func(b *testing.B) {
			shiftTeamID := time.Now().UnixNano()
			for i := 0; i < tc.snapshotCount; i++ {
				_, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
					ShiftTeamID:     shiftTeamID,
					ServiceRegionID: int64(1),
					BaseLocationID:  int64(i),
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			createdAtLimit := time.Now().Add(1 * time.Hour)
			for n := 0; n < b.N; n++ {
				_, err := queries.GetLatestShiftTeamSnapshot(ctx, logisticssql.GetLatestShiftTeamSnapshotParams{
					ShiftTeamID: shiftTeamID,
					CreatedAt:   createdAtLimit,
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
func BenchmarkGetLatestVisitSnapshot(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		snapshotCount int
	}{
		{1},
		{10},
		{100},
		{1000},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.snapshotCount), func(b *testing.B) {
			careReqID := time.Now().UnixNano()
			for i := 0; i < tc.snapshotCount; i++ {
				_, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
					CareRequestID: careReqID,
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			createdAtLimit := time.Now().Add(1 * time.Hour)
			for n := 0; n < b.N; n++ {
				_, err := queries.GetLatestVisitSnapshot(ctx, logisticssql.GetLatestVisitSnapshotParams{
					CareRequestID: careReqID,
					CreatedAt:     createdAtLimit,
				})
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetLatestVisitSnapshotsInRegion(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		regionCount   int
		visitCount    int
		snapshotCount int
	}{
		{1, 1, 1},
		{1, 10, 1},
		{1, 1, 10},
		{1, 10, 10},
		{1, 10, 100},
		{1, 100, 10},
		{1, 100, 100},
		{2, 10, 10},
		{5, 10, 10},
		{10, 10, 10},
		{20, 10, 10},
		{2, 100, 10},
		{5, 100, 10},
		{10, 100, 10},
		{20, 100, 10},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%dx%d", tc.regionCount, tc.visitCount, tc.snapshotCount), func(b *testing.B) {
			startRegionID := time.Now().UnixNano()
			startCareReqID := time.Now().UnixNano()

			for i := 0; i < tc.regionCount; i++ {
				for j := 0; j < tc.visitCount; j++ {
					for k := 0; k < tc.snapshotCount; k++ {
						_, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
							ServiceRegionID: startRegionID + int64(i),
							CareRequestID:   startCareReqID + int64(j),
						})
						if err != nil {
							b.Fatal(err)
						}
					}
				}
			}

			latestSnapshotTime := time.Now().Add(1 * time.Hour)

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				visits, err := queries.GetLatestVisitSnapshotsInRegion(ctx, logisticssql.GetLatestVisitSnapshotsInRegionParams{
					ServiceRegionID:    startRegionID,
					LatestSnapshotTime: latestSnapshotTime,
				})
				if err != nil {
					b.Fatal(err)
				}

				if len(visits) != tc.visitCount {
					b.Fatal("not enough visits")
				}
			}
		})
	}
}

func BenchmarBatchkGetLatestVisitSnapshotsInRegion(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		regionCount   int
		visitCount    int
		snapshotCount int
	}{
		{1, 1, 1},
		{2, 10, 10},
		{5, 10, 10},
		{10, 10, 10},
		{20, 10, 10},
		{2, 100, 10},
		{5, 100, 10},
		{10, 100, 10},
		{20, 100, 10},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%dx%d", tc.regionCount, tc.visitCount, tc.snapshotCount), func(b *testing.B) {
			arrivalStartTimestampSec := sql.NullInt64{Int64: 0, Valid: true}
			arrivalEndTimestampSec := sql.NullInt64{Int64: 100, Valid: true}
			visitPhaseTypeIDs := []int64{int64(logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE)}
			virtualAPPphaseTypeIDs := []int64{int64(logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED)}

			batchParams := make([]logisticssql.BatchGetLatestVisitSnapshotsInRegionParams, 0, tc.regionCount)
			for i := 0; i < tc.regionCount; i++ {
				startRegionID := time.Now().UnixNano()

				for j := 0; j < tc.visitCount; j++ {
					startCareReqID := time.Now().UnixNano()

					for k := 0; k < tc.snapshotCount; k++ {
						snapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
							ServiceRegionID:          startRegionID,
							CareRequestID:            startCareReqID,
							ArrivalStartTimestampSec: arrivalStartTimestampSec,
							ArrivalEndTimestampSec:   arrivalEndTimestampSec,
						})
						if err != nil {
							b.Fatal(err)
						}
						_, err = queries.AddVisitPhaseSnapshot(ctx, logisticssql.AddVisitPhaseSnapshotParams{
							VisitSnapshotID:  snapshot.ID,
							VisitPhaseTypeID: visitPhaseTypeIDs[0],
						})
						if err != nil {
							b.Fatal(err)
						}
						_, err = queries.AddVirtualAPPVisitPhaseSnapshot(ctx, logisticssql.AddVirtualAPPVisitPhaseSnapshotParams{
							VisitSnapshotID:            snapshot.ID,
							VirtualAppVisitPhaseTypeID: virtualAPPphaseTypeIDs[0],
						})
						if err != nil {
							b.Fatal(err)
						}
					}
				}

				latestSnapshotTime := time.Now().Add(1 * time.Hour)
				batchParams = append(batchParams, logisticssql.BatchGetLatestVisitSnapshotsInRegionParams{
					ServiceRegionID:           startRegionID,
					LatestSnapshotTime:        latestSnapshotTime,
					StartTimestampSec:         arrivalStartTimestampSec,
					EndTimestampSec:           arrivalEndTimestampSec,
					VisitPhaseTypes:           visitPhaseTypeIDs,
					VirtualAppVisitPhaseTypes: virtualAPPphaseTypeIDs,
				})
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				var allVisitSnapshots []*logisticssql.BatchGetLatestVisitSnapshotsInRegionRow
				batchGetLatestVisitSnapshotsInRegion := queries.BatchGetLatestVisitSnapshotsInRegion(ctx, batchParams)
				defer batchGetLatestVisitSnapshotsInRegion.Close()

				batchGetLatestVisitSnapshotsInRegion.Query(
					func(i int, rows []*logisticssql.BatchGetLatestVisitSnapshotsInRegionRow, err error) {
						if err != nil {
							b.Fatal(err)
						}
						allVisitSnapshots = append(allVisitSnapshots, rows...)
					})

				if len(allVisitSnapshots) != tc.visitCount*tc.regionCount {
					b.Fatal("not enough visits")
				}
			}
		})
	}
}
func BenchmarkGetLatestShiftTeamSnapshotsInRegion(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		regionCount    int
		shiftTeamCount int
		snapshotCount  int
	}{
		{1, 1, 1},
		{1, 10, 1},
		{1, 1, 10},
		{1, 10, 10},
		{1, 10, 100},
		{1, 100, 10},
		{1, 100, 100},
		{2, 10, 10},
		{5, 10, 10},
		{10, 10, 10},
		{20, 10, 10},
		{2, 100, 10},
		{5, 100, 10},
		{10, 100, 10},
		{20, 100, 10},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%dx%d", tc.regionCount, tc.shiftTeamCount, tc.snapshotCount), func(b *testing.B) {
			startRegionID := time.Now().UnixNano()
			startShiftTeamID := time.Now().UnixNano()

			for i := 0; i < tc.regionCount; i++ {
				for j := 0; j < tc.shiftTeamCount; j++ {
					for k := 0; k < tc.snapshotCount; k++ {
						_, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
							ServiceRegionID: startRegionID + int64(i),
							ShiftTeamID:     startShiftTeamID + int64(j),
						})
						if err != nil {
							b.Fatal(err)
						}
					}
				}
			}

			latestSnapshotTime := time.Now().Add(1 * time.Hour)

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				shiftTeams, err := queries.GetLatestShiftTeamSnapshotsInRegion(ctx, logisticssql.GetLatestShiftTeamSnapshotsInRegionParams{
					ServiceRegionID:    startRegionID,
					LatestSnapshotTime: latestSnapshotTime,
				})
				if err != nil {
					b.Fatal(err)
				}

				if len(shiftTeams) != tc.shiftTeamCount {
					b.Fatal("not enough shift teams")
				}
			}
		})
	}
}

func BenchmarkGetAttributesForShiftTeam(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		shiftTeamCount int
		attributeCount int
	}{
		{1, 1},
		{1, 10},
		{10, 1},
		{10, 10},
		{10, 100},
		{100, 10},
		{100, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.shiftTeamCount, tc.attributeCount), func(b *testing.B) {
			startShiftTeamSnapshotID := time.Now().UnixNano()

			var attributeNames []string
			for i := 0; i < tc.attributeCount; i++ {
				attributeNames = append(attributeNames, strconv.Itoa(i))
			}
			_, err := queries.UpsertAttributes(ctx, attributeNames)
			if err != nil {
				b.Fatal(err)
			}

			attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
			if err != nil {
				b.Fatal(err)
			}

			var shiftTeamSnapshotIds, attributeIds []int64
			for i := 0; i < tc.shiftTeamCount; i++ {
				for j := 0; j < tc.attributeCount; j++ {
					shiftTeamSnapshotIds = append(shiftTeamSnapshotIds, startShiftTeamSnapshotID+int64(i))
					attributeIds = append(attributeIds, attributes[j].ID)
				}
			}
			_, err = queries.UpsertShiftTeamAttributes(ctx, logisticssql.UpsertShiftTeamAttributesParams{
				ShiftTeamSnapshotIds: shiftTeamSnapshotIds,
				AttributeIds:         attributeIds,
			})
			if err != nil {
				b.Fatal(err)
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				attributes, err := queries.GetAttributesForShiftTeam(ctx, startShiftTeamSnapshotID)
				if err != nil {
					b.Fatal(err)
				}

				if len(attributes) != tc.attributeCount {
					b.Fatal("not enough attributes")
				}
			}
		})
	}
}

func BenchmarkGetAttributesForVisit(b *testing.B) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	tcs := []struct {
		visitCount     int
		attributeCount int
	}{
		{1, 1},
		{1, 10},
		{10, 1},
		{10, 10},
		{10, 100},
		{100, 10},
		{100, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.visitCount, tc.attributeCount), func(b *testing.B) {
			startVisitSnapshotID := time.Now().UnixNano()

			var attributeNames []string
			for i := 0; i < tc.attributeCount; i++ {
				attributeNames = append(attributeNames, strconv.Itoa(i))
			}
			_, err := queries.UpsertAttributes(ctx, attributeNames)
			if err != nil {
				b.Fatal(err)
			}

			attributes, err := queries.GetAttributesForNames(ctx, attributeNames)
			if err != nil {
				b.Fatal(err)
			}

			var visitSnapshotIds, attributeIds []int64
			for i := 0; i < tc.visitCount; i++ {
				for j := 0; j < tc.attributeCount; j++ {
					visitSnapshotIds = append(visitSnapshotIds, startVisitSnapshotID+int64(i))
					attributeIds = append(attributeIds, attributes[j].ID)
				}
			}
			_, err = queries.UpsertVisitAttributes(ctx, logisticssql.UpsertVisitAttributesParams{
				VisitSnapshotIds: visitSnapshotIds,
				AttributeIds:     attributeIds,
			})
			if err != nil {
				b.Fatal(err)
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				attributes, err := queries.GetAttributesForVisit(ctx, startVisitSnapshotID)
				if err != nil {
					b.Fatal(err)
				}

				if len(attributes) != tc.attributeCount {
					b.Fatal("not enough attributes")
				}
			}
		})
	}
}

func benchmarkHasAnyEntitiesSince(b *testing.B,
	addEntitySnapshot func(b *testing.B, ctx context.Context, queries *logisticssql.Queries,
		serviceRegionID, entityID int64, tw timeWindow) time.Time,
	hasSnapshotsSince func(b *testing.B, ctx context.Context, queries *logisticssql.Queries,
		serviceRegionID int64, tw timeWindow, sinceSnapshotTime, latestSnapshotTime time.Time),
) {
	ctx, _, queries, done := setupDBTest(b)
	defer done()

	type snapshotCounts struct {
		during int
		before int
		after  int
	}

	tcs := []struct {
		OldSnapshots snapshotCounts
		NewSnapshots snapshotCounts
	}{
		{snapshotCounts{}, snapshotCounts{1, 0, 0}},
		{snapshotCounts{}, snapshotCounts{10, 0, 0}},
		{snapshotCounts{}, snapshotCounts{100, 0, 0}},
		{snapshotCounts{}, snapshotCounts{100, 10, 10}},
		{snapshotCounts{}, snapshotCounts{100, 100, 100}},
		{snapshotCounts{}, snapshotCounts{1000, 0, 0}},
		{snapshotCounts{}, snapshotCounts{1000, 10, 10}},
		{snapshotCounts{}, snapshotCounts{1000, 100, 100}},
		{snapshotCounts{}, snapshotCounts{1000, 1000, 1000}},

		{snapshotCounts{1, 0, 0}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{10, 0, 0}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{100, 0, 0}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{1000, 0, 0}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{1000, 1, 1}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{1000, 10, 10}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{1000, 100, 100}, snapshotCounts{1, 1, 1}},
		{snapshotCounts{1000, 1000, 1000}, snapshotCounts{1, 1, 1}},

		{snapshotCounts{1000, 1000, 1000}, snapshotCounts{1000, 1000, 1000}},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("old %+v/new %+v", tc.OldSnapshots, tc.NewSnapshots), func(b *testing.B) {
			serviceRegionID := time.Now().UnixNano()
			entityID := time.Now().UnixNano()

			tw := timeWindow{
				start: time.Now(),
				end:   time.Now().Add(1 * time.Hour),
			}
			beforeTW := timeWindow{
				start: tw.start.Add(-2 * time.Second),
				end:   tw.start.Add(-1 * time.Second),
			}
			afterTW := timeWindow{
				start: tw.end.Add(1 * time.Second),
				end:   tw.end.Add(2 * time.Second),
			}

			var sinceSnapshotTime time.Time

			oldSnapshots := []struct {
				snapshotCount int
				tw            timeWindow
			}{
				{tc.OldSnapshots.before, beforeTW},
				{tc.OldSnapshots.during, tw},
				{tc.OldSnapshots.after, afterTW},
			}
			for _, s := range oldSnapshots {
				for i := 0; i < s.snapshotCount; i++ {
					sinceSnapshotTime = addEntitySnapshot(b, ctx, queries, serviceRegionID, entityID, s.tw)
				}
			}

			latestSnapshotTime := sinceSnapshotTime
			newSnapshots := []struct {
				snapshotCount int
				tw            timeWindow
			}{
				{tc.NewSnapshots.before, beforeTW},
				{tc.NewSnapshots.during, tw},
				{tc.NewSnapshots.after, afterTW},
			}
			for _, s := range newSnapshots {
				for i := 0; i < tc.NewSnapshots.during; i++ {
					latestSnapshotTime = addEntitySnapshot(b, ctx, queries, serviceRegionID, entityID, s.tw)
				}
			}

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				hasSnapshotsSince(b, ctx, queries, serviceRegionID, tw, sinceSnapshotTime, latestSnapshotTime)
			}
		})
	}
}

func BenchmarkHasAnyShiftTeamsSince(b *testing.B) {
	addEntitySnapshot := func(b *testing.B, ctx context.Context, queries *logisticssql.Queries, serviceRegionID, entityID int64, tw timeWindow) time.Time {
		snapshot, err := queries.AddShiftTeamSnapshot(ctx, logisticssql.AddShiftTeamSnapshotParams{
			ShiftTeamID:       entityID,
			ServiceRegionID:   serviceRegionID,
			BaseLocationID:    0,
			StartTimestampSec: tw.start.Unix(),
			EndTimestampSec:   tw.end.Unix(),
		})
		if err != nil {
			b.Fatal(err)
		}

		return snapshot.CreatedAt
	}

	hasSnapshotsSince := func(b *testing.B, ctx context.Context, queries *logisticssql.Queries, serviceRegionID int64, tw timeWindow, sinceSnapshotTime, latestSnapshotTime time.Time) {
		ids, err := queries.HasAnyShiftTeamSnapshotsInRegionSince(ctx, logisticssql.HasAnyShiftTeamSnapshotsInRegionSinceParams{
			ServiceRegionID:    serviceRegionID,
			StartTimestampSec:  tw.start.Unix(),
			EndTimestampSec:    tw.end.Unix(),
			SinceSnapshotTime:  sinceSnapshotTime,
			LatestSnapshotTime: latestSnapshotTime,
		})
		if err != nil {
			b.Fatal(err)
		}

		if len(ids) == 0 {
			b.Fatal("should have ids, but got none")
		}
	}

	benchmarkHasAnyEntitiesSince(b, addEntitySnapshot, hasSnapshotsSince)
}

func BenchmarkHasAnyVisitsSince(b *testing.B) {
	addEntitySnapshot := func(b *testing.B, ctx context.Context, queries *logisticssql.Queries, serviceRegionID, entityID int64, tw timeWindow) time.Time {
		snapshot, err := queries.AddVisitSnapshot(ctx, logisticssql.AddVisitSnapshotParams{
			CareRequestID:            entityID,
			ServiceRegionID:          serviceRegionID,
			LocationID:               0,
			ArrivalStartTimestampSec: sql.NullInt64{Valid: true, Int64: tw.start.Unix()},
			ArrivalEndTimestampSec:   sql.NullInt64{Valid: true, Int64: tw.end.Unix()},
		})
		if err != nil {
			b.Fatal(err)
		}

		return snapshot.CreatedAt
	}

	hasSnapshotsSince := func(b *testing.B, ctx context.Context, queries *logisticssql.Queries, serviceRegionID int64, tw timeWindow, sinceSnapshotTime, latestSnapshotTime time.Time) {
		ids, err := queries.HasAnyVisitSnapshotsInRegionSince(ctx, logisticssql.HasAnyVisitSnapshotsInRegionSinceParams{
			ServiceRegionID:    serviceRegionID,
			StartTimestampSec:  sqltypes.ToValidNullInt64(tw.start.Unix()),
			EndTimestampSec:    sqltypes.ToValidNullInt64(tw.end.Unix()),
			SinceSnapshotTime:  sinceSnapshotTime,
			LatestSnapshotTime: latestSnapshotTime,
		})
		if err != nil {
			b.Fatal(err)
		}

		if len(ids) == 0 {
			b.Fatal("should have ids, but got none")
		}
	}

	benchmarkHasAnyEntitiesSince(b, addEntitySnapshot, hasSnapshotsSince)
}

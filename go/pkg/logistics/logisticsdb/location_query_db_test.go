//go:build db_test

package logisticsdb_test

import (
	"testing"
	"time"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestUpsertLocation(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	latE6 := time.Now().UnixNano()
	lonE6 := latE6 + 1

	loc1Req := logisticssql.UpsertLocationParams{
		LatitudeE6:  int32(latE6),
		LongitudeE6: int32(lonE6),
	}
	locs, err := queries.UpsertLocation(ctx, loc1Req)
	if err != nil {
		t.Fatal(err)
	}
	if len(locs) != 1 {
		t.Fatal(locs)
	}

	locs, err = queries.UpsertLocation(ctx, loc1Req)
	if err != nil {
		t.Fatal(err)
	}

	if len(locs) != 0 {
		t.Fatal(locs)
	}
}

func TestGetLatestDistances(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	fromLocID := baseID
	toLocID := baseID + 1
	sourceID := baseID + 2

	now := time.Now()

	copies := 2
	for i := 0; i < copies; i++ {
		_, err := queries.AddDistanceWithCreatedAt(ctx, logisticssql.AddDistanceWithCreatedAtParams{
			FromLocationID:  fromLocID,
			ToLocationID:    toLocID,
			SourceID:        sourceID,
			DistanceMeters:  int32(i),
			DurationSeconds: int32(i),
			CreatedAt:       now,
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	distances, err := queries.GetLatestDistancesForLocations(ctx, logisticssql.GetLatestDistancesForLocationsParams{
		FromLocationIds: []int64{fromLocID},
		ToLocationIds:   []int64{toLocID},
		SourceIds:       []int64{sourceID},
		CreatedAt:       now,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, 1, len(distances), "expect number of distances don't match")
}

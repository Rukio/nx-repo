//go:build db_test

package clinicalkpidb_test

import (
	"fmt"
	"testing"
	"time"

	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestAddActiveProviderForMarkets(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID + 1
	originalMarketIDs := []int64{1, 2, 3}

	err := queries.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
		ProviderID: providerID,
		MarketIds:  originalMarketIDs,
	})
	if err != nil {
		t.Fatal(err)
	}

	gotOriginalMarketIDs, err := queries.GetActiveMarketsForProvider(ctx, providerID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, originalMarketIDs, gotOriginalMarketIDs, "unexpected result after first insert")

	newMarketIDs := []int64{4}
	err = queries.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
		ProviderID: providerID,
		MarketIds:  newMarketIDs,
	})
	if err != nil {
		t.Fatal(fmt.Errorf("duplicate insert failed: %w", err))
	}

	gotNewMarketIDs, err := queries.GetActiveMarketsForProvider(ctx, providerID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, append(originalMarketIDs, newMarketIDs...), gotNewMarketIDs, "unexpected result after second insert")
}

func TestGetActiveMarketsForProvider(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID + 1
	marketID := baseID + 2
	input := clinicalkpisql.AddActiveProviderForMarketsParams{
		ProviderID: providerID,
		MarketIds:  []int64{marketID},
	}
	want := []int64{marketID}

	err := queries.AddActiveProviderForMarkets(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	got, err := queries.GetActiveMarketsForProvider(ctx, providerID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, want, got, "unexpected result")
}

func TestGetActiveProvidersForMarket(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID + 1
	marketID := baseID + 2
	input := clinicalkpisql.AddActiveProviderForMarketsParams{
		ProviderID: providerID,
		MarketIds:  []int64{marketID},
	}
	want := []int64{providerID}

	err := queries.AddActiveProviderForMarkets(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	got, err := queries.GetActiveProvidersForMarket(ctx, marketID)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, want, got, "unexpected result")
}

func TestDeleteActiveMarketsForProvider(t *testing.T) {
	ctx, _, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	providerID := baseID + 1
	marketID := baseID + 2
	providerID1 := baseID + 3
	marketID1 := baseID + 4
	marketID2 := baseID + 5

	tcs := []struct {
		Desc            string
		ProviderID      int64
		InsertMarketIDs []int64
		DeleteMarketIDs []int64

		Want []int64
	}{
		{
			Desc:            "success - base case",
			ProviderID:      providerID,
			InsertMarketIDs: []int64{marketID},
			DeleteMarketIDs: []int64{marketID},
		},
		{
			Desc:            "success - only deletes specified market IDs",
			ProviderID:      providerID1,
			InsertMarketIDs: []int64{marketID1, marketID2},
			DeleteMarketIDs: []int64{marketID1},

			Want: []int64{marketID2},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			for _, marketID := range tc.InsertMarketIDs {
				err := queries.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
					ProviderID: tc.ProviderID,
					MarketIds:  []int64{marketID},
				})
				if err != nil {
					t.Fatal(err)
				}
			}

			err := queries.DeleteActiveMarketsForProvider(ctx, clinicalkpisql.DeleteActiveMarketsForProviderParams{
				ProviderID: tc.ProviderID,
				MarketIds:  tc.DeleteMarketIDs,
			})
			if err != nil {
				t.Fatal(err)
			}

			got, err := queries.GetActiveMarketsForProvider(ctx, tc.ProviderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, got, "unexpected result")
		})
	}
}

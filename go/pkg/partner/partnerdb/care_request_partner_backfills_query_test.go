//go:build db_test

package partnerdb_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	adhocpartnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner/DO_NOT_USE"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	popHealthBackfillTypeID       = int64(1)
	providerNetworkBackfillTypeID = int64(2)
)

func TestPartnerDB_GetInProgressBackfillByPartnerAndType(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	startDate := time.Date(2023, 1, 30, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2023, 1, 31, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name                       string
		partnerAssociationBackfill partnersql.AddPartnerAssociationBackfillParams
		params                     partnersql.GetInProgressBackfillByPartnerAndTypeParams

		wantResponse *partnersql.CareRequestPartnerBackfill
	}{
		{
			name: "successfully gets in progress pop health backfill",
			partnerAssociationBackfill: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID + 1,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "pophealth",
			},
			params: partnersql.GetInProgressBackfillByPartnerAndTypeParams{
				PartnerID:    baseID + 1,
				BackfillType: "pophealth",
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:             baseID,
				PartnerID:      baseID + 1,
				BackfillTypeID: popHealthBackfillTypeID,
				StartDate:      startDate,
				EndDate:        endDate,
			},
		},
		{
			name: "successfully gets in progress provider network backfill",
			partnerAssociationBackfill: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID + 2,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "provider_network",
			},
			params: partnersql.GetInProgressBackfillByPartnerAndTypeParams{
				PartnerID:    baseID + 2,
				BackfillType: "provider_network",
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:             baseID,
				PartnerID:      baseID + 2,
				BackfillTypeID: providerNetworkBackfillTypeID,
				StartDate:      startDate,
				EndDate:        endDate,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			_, removeCareRequestPartnerBackfills := addAndRemoveCareRequestPartnerBackfills(ctx, t, queries, adhocQueries,
				[]partnersql.AddPartnerAssociationBackfillParams{test.partnerAssociationBackfill})
			defer removeCareRequestPartnerBackfills()

			partnerAssociationBackfill, err := pdb.GetInProgressBackfillByPartnerAndType(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResponse, partnerAssociationBackfill)
		})
	}
}

func TestPartnerDB_AddPartnerAssociationBackfill(t *testing.T) {
	ctx, db, _, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	startDate := time.Date(2023, 1, 30, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2023, 1, 31, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name   string
		params partnersql.AddPartnerAssociationBackfillParams

		wantResponse *partnersql.CareRequestPartnerBackfill
	}{
		{
			name: "successfully adds pop health backfill",
			params: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID + 1,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "pophealth",
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:             baseID,
				PartnerID:      baseID + 1,
				BackfillTypeID: popHealthBackfillTypeID,
				StartDate:      startDate,
				EndDate:        endDate,
			},
		},
		{
			name: "successfully adds provider network backfill",
			params: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID + 2,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "provider_network",
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:             baseID,
				PartnerID:      baseID + 2,
				BackfillTypeID: providerNetworkBackfillTypeID,
				StartDate:      startDate,
				EndDate:        endDate,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			partnerAssociationBackfill, err := pdb.AddPartnerAssociationBackfill(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			err = adhocQueries.DeleteCareRequestPartnerBackfillByID(ctx, partnerAssociationBackfill.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResponse, partnerAssociationBackfill)
		})
	}
}

func TestPartnerDB_CompletePartnerAssociationBackfillByID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	startDate := time.Date(2023, 1, 30, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2023, 1, 31, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name                       string
		partnerAssociationBackfill partnersql.AddPartnerAssociationBackfillParams
		params                     partnersql.CompletePartnerAssociationBackfillByIDParams

		wantResponse *partnersql.CareRequestPartnerBackfill
	}{
		{
			name: "successfully completes partner association backfill",
			partnerAssociationBackfill: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "pophealth",
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:             baseID,
				PartnerID:      baseID,
				BackfillTypeID: popHealthBackfillTypeID,
				StartDate:      startDate,
				EndDate:        endDate,
			},
		},
		{
			name: "successfully completes partner association backfill with error",
			partnerAssociationBackfill: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "pophealth",
			},
			params: partnersql.CompletePartnerAssociationBackfillByIDParams{
				ErrorDescription: sqltypes.ToValidNullString("error"),
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:               baseID,
				PartnerID:        baseID,
				BackfillTypeID:   popHealthBackfillTypeID,
				StartDate:        startDate,
				EndDate:          endDate,
				ErrorDescription: sqltypes.ToValidNullString("error"),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			careRequestPartnerBackfillIDs, removeCareRequestPartnerBackfills := addAndRemoveCareRequestPartnerBackfills(ctx, t, queries, adhocQueries,
				[]partnersql.AddPartnerAssociationBackfillParams{test.partnerAssociationBackfill})
			defer removeCareRequestPartnerBackfills()

			test.params.ID = careRequestPartnerBackfillIDs[0]
			partnerAssociationBackfill, err := pdb.CompletePartnerAssociationBackfillByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			if !partnerAssociationBackfill.CompletedAt.Valid {
				t.Fatal("expected completed_at to be valid")
			}
			testutils.MustMatchFn(".ID", ".CompletedAt", ".CreatedAt", ".UpdatedAt")(t, test.wantResponse, partnerAssociationBackfill)
		})
	}
}

func TestPartnerDB_UpdatePartnerAssociationBackfillByID(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	currentTime := time.Now().UnixMilli()
	startDate := time.Date(2023, 1, 30, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2023, 1, 31, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name                       string
		partnerAssociationBackfill partnersql.AddPartnerAssociationBackfillParams
		updateParams               partnersql.UpdatePartnerAssociationBackfillByIDParams

		wantResponse *partnersql.CareRequestPartnerBackfill
	}{
		{
			name: "successfully updates partner association backfill",
			partnerAssociationBackfill: partnersql.AddPartnerAssociationBackfillParams{
				PartnerID:    baseID,
				StartDate:    startDate,
				EndDate:      endDate,
				BackfillType: "pophealth",
			},
			updateParams: partnersql.UpdatePartnerAssociationBackfillByIDParams{
				LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(time.Unix(currentTime, 0).UTC()),
				NumberOfNewMatches:                8,
			},

			wantResponse: &partnersql.CareRequestPartnerBackfill{
				ID:                                baseID,
				PartnerID:                         baseID,
				BackfillTypeID:                    popHealthBackfillTypeID,
				StartDate:                         startDate,
				EndDate:                           endDate,
				LastProcessedCareRequestCreatedAt: sqltypes.ToValidNullTime(time.Unix(currentTime, 0).UTC()),
				NumberOfMatches:                   8,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			careRequestPartnerBackfillIDs, removeCareRequestPartnerBackfills := addAndRemoveCareRequestPartnerBackfills(ctx, t, queries, adhocQueries,
				[]partnersql.AddPartnerAssociationBackfillParams{test.partnerAssociationBackfill})
			defer removeCareRequestPartnerBackfills()

			test.updateParams.ID = careRequestPartnerBackfillIDs[0]
			partnerAssociationBackfill, err := pdb.UpdatePartnerAssociationBackfillByID(ctx, test.updateParams)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResponse, partnerAssociationBackfill)
		})
	}
}

func TestPartnerDB_GetPendingBackfills(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	fmt.Println(baseID)
	startDate := time.Date(2023, 1, 30, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2023, 1, 31, 0, 0, 0, 0, time.UTC)

	tests := []struct {
		name                        string
		partnerAssociationBackfills []partnersql.AddPartnerAssociationBackfillParams

		wantResponse []*partnersql.CareRequestPartnerBackfill
	}{
		{
			name: "successfully gets pending backfills",
			partnerAssociationBackfills: []partnersql.AddPartnerAssociationBackfillParams{
				{
					PartnerID:    baseID,
					StartDate:    startDate,
					EndDate:      endDate,
					BackfillType: "pophealth",
				},
				{
					PartnerID:    baseID + 1,
					StartDate:    startDate,
					EndDate:      endDate,
					BackfillType: "provider_network",
				},
			},

			wantResponse: []*partnersql.CareRequestPartnerBackfill{
				{
					ID:             baseID,
					PartnerID:      baseID,
					BackfillTypeID: popHealthBackfillTypeID,
					StartDate:      startDate,
					EndDate:        endDate,
				},
				{
					ID:             baseID + 1,
					PartnerID:      baseID + 1,
					BackfillTypeID: providerNetworkBackfillTypeID,
					StartDate:      startDate,
					EndDate:        endDate,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			_, removeCareRequestPartnerBackfills := addAndRemoveCareRequestPartnerBackfills(ctx, t, queries, adhocQueries, test.partnerAssociationBackfills)
			defer removeCareRequestPartnerBackfills()

			pendingBackfills, err := pdb.GetPendingBackfills(ctx)
			if err != nil {
				t.Fatal(err)
			}

			for i, gotPendingBackfill := range pendingBackfills {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.wantResponse[i], gotPendingBackfill)
			}
		})
	}
}

func addAndRemoveCareRequestPartnerBackfills(
	ctx context.Context,
	t *testing.T,
	queries *partnersql.Queries,
	adhocQueries *adhocpartnersql.Queries,
	careRequestPartnerBackfills []partnersql.AddPartnerAssociationBackfillParams,
) ([]int64, func()) {
	careRequestPartnerBackfillIDs := make([]int64, len(careRequestPartnerBackfills))
	for i, careRequestPartnerBackfill := range careRequestPartnerBackfills {
		newCareRequestPartnerBackfill, err := queries.AddPartnerAssociationBackfill(ctx, careRequestPartnerBackfill)
		if err != nil {
			t.Fatal(err)
		}
		careRequestPartnerBackfillIDs[i] = newCareRequestPartnerBackfill.ID
	}

	return careRequestPartnerBackfillIDs, func() {
		for _, id := range careRequestPartnerBackfillIDs {
			err := adhocQueries.DeleteCareRequestPartnerBackfillByID(ctx, id)
			if err != nil {
				t.Fatal(err)
			}
		}
	}
}

//go:build db_test

package partnerdb_test

import (
	"testing"
	"time"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/generated/sql/partner/DO_NOT_USE"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPartnerDB_AddCareRequestPartner(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	stationCareRequestID := baseID + 1
	partnerID := baseID + 1
	origin := "source"

	tests := []struct {
		name   string
		params []partnersql.AddCareRequestPartnerParams

		expectedResponse partnersql.CareRequestPartner
		expectedError    bool
	}{
		{
			name: "success - base case",
			params: []partnersql.AddCareRequestPartnerParams{{
				StationCareRequestID:         stationCareRequestID,
				PartnerID:                    partnerID,
				CareRequestPartnerOriginSlug: origin},
			},

			expectedResponse: partnersql.CareRequestPartner{
				ID:                         baseID,
				StationCareRequestID:       stationCareRequestID,
				PartnerID:                  partnerID,
				CareRequestPartnerOriginID: careRequestPartnerOriginSlugToID[origin],
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			var gotResponse *partnersql.CareRequestPartner
			var err error
			for _, params := range test.params {
				gotResponse, err = pdb.AddCareRequestPartner(ctx, params)
			}

			testutils.MustMatch(t, test.expectedError, err != nil)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, gotResponse, &test.expectedResponse)
		})
	}
}

func TestPartnerDB_DeleteCareRequestPartner(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	now := time.Now()
	nowString := now.Format(partnerdb.TimestampLayout)
	baseID := time.Now().UnixNano()
	stationCareRequestID := baseID + 1
	partnerID := baseID + 1
	origin := "pop_health"

	tests := []struct {
		name               string
		careRequestPartner partnersql.AddCareRequestPartnerParams

		want *partnersql.CareRequestPartner
	}{
		{
			name: "success - base case",
			careRequestPartner: partnersql.AddCareRequestPartnerParams{
				StationCareRequestID:         stationCareRequestID,
				PartnerID:                    partnerID,
				CareRequestPartnerOriginSlug: origin,
			},

			want: &partnersql.CareRequestPartner{
				ID:                         baseID,
				StationCareRequestID:       stationCareRequestID,
				PartnerID:                  partnerID,
				CareRequestPartnerOriginID: careRequestPartnerOriginSlugToID[origin],
				DeletedAt:                  sqltypes.StringToValidNullTime(nowString),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			careRequestPartnerToDelete, err := queries.AddCareRequestPartner(ctx, test.careRequestPartner)
			if err != nil {
				t.Fatal(err)
			}

			careRequestPartner, err := pdb.DeleteCareRequestPartner(ctx, careRequestPartnerToDelete.ID)
			if err != nil {
				t.Fatal(err)
			}

			if !careRequestPartner.DeletedAt.Valid {
				t.Error("expected careRequestPartner.DeletedAt to be valid")
			}
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, careRequestPartner)
		})
	}
}

func TestPartnerDB_GetCareRequestPartnersByStationCareRequestID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	stationCareRequestID := baseID + 1
	partnerID1 := baseID + 1
	partnerID2 := baseID + 2
	origin1 := "provider_network"
	origin2 := "insurance"

	tests := []struct {
		name                string
		careRequestPartners []partnersql.AddCareRequestPartnerParams

		want []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow
	}{
		{
			name: "success - base case",
			careRequestPartners: []partnersql.AddCareRequestPartnerParams{
				{
					StationCareRequestID:         stationCareRequestID,
					PartnerID:                    partnerID1,
					CareRequestPartnerOriginSlug: origin1,
				},
				{
					StationCareRequestID:         stationCareRequestID,
					PartnerID:                    partnerID2,
					CareRequestPartnerOriginSlug: origin2,
				},
			},

			want: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
				{
					ID:                           baseID,
					StationCareRequestID:         stationCareRequestID,
					PartnerID:                    partnerID1,
					CareRequestPartnerOriginID:   careRequestPartnerOriginSlugToID[origin1],
					CareRequestPartnerOriginSlug: origin1,
				},
				{
					ID:                           baseID + 1,
					StationCareRequestID:         stationCareRequestID,
					PartnerID:                    partnerID2,
					CareRequestPartnerOriginID:   careRequestPartnerOriginSlugToID[origin2],
					CareRequestPartnerOriginSlug: origin2,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			for _, careRequestPartner := range test.careRequestPartners {
				_, err := queries.AddCareRequestPartner(ctx, careRequestPartner)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotCareRequestPartners, err := pdb.GetCareRequestPartnersByStationCareRequestID(ctx, stationCareRequestID)
			if err != nil {
				t.Fatal(err)
			}

			for i, gotCarecareRequestPartner := range gotCareRequestPartners {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want[i], gotCarecareRequestPartner)
			}
		})
	}
}

func TestPartnerDB_GetCareRequestSourceByCareRequestID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	const origin = "source"
	baseID := time.Now().UnixNano()
	stationCareRequestID := baseID
	partnerID := baseID

	tests := []struct {
		name                string
		careRequestPartners []partnersql.AddCareRequestPartnerParams

		want *partnersql.CareRequestPartner
	}{
		{
			name: "success - base case",
			careRequestPartners: []partnersql.AddCareRequestPartnerParams{
				{
					StationCareRequestID:         stationCareRequestID,
					PartnerID:                    partnerID,
					CareRequestPartnerOriginSlug: origin,
				},
			},

			want: &partnersql.CareRequestPartner{
				ID:                         baseID,
				StationCareRequestID:       stationCareRequestID,
				PartnerID:                  partnerID,
				CareRequestPartnerOriginID: careRequestPartnerOriginSlugToID[origin],
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			for _, careRequestPartner := range test.careRequestPartners {
				_, err := queries.AddCareRequestPartner(ctx, careRequestPartner)
				if err != nil {
					t.Fatal(err)
				}
			}

			sourcePartner, err := pdb.GetSourceCareRequestPartnerByCareRequestID(ctx, stationCareRequestID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, sourcePartner)
		})
	}
}

func TestPartnerDB_GetInsuranceByCareRequestAndOrigin(t *testing.T) {
	ctx, db, queries, adhocQueries, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	stationCareRequestID := baseID

	partners := []partnersql.AddPartnerParams{
		{
			StationChannelItemID:     baseID,
			DisplayName:              "Test Partner 1",
			PartnerCategoryShortName: "home_health",
		},
		{
			StationChannelItemID:     baseID + 1,
			DisplayName:              "Test Partner 2",
			PartnerCategoryShortName: "provider_group",
		},
	}
	partnerIDs, removePartners := addAndRemovePartners(ctx, t, queries, adhocQueries, partners)
	defer removePartners()

	for _, partnerID := range partnerIDs {
		err := adhocQueries.UpdatePartnerInsuranceByID(ctx, DO_NOT_USE.UpdatePartnerInsuranceByIDParams{
			ID:                 partnerID,
			InsurancePackageID: sqltypes.ToValidNullInt64(partnerID),
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	careRequestPartners := []partnersql.AddCareRequestPartnerParams{
		{
			StationCareRequestID:         stationCareRequestID,
			PartnerID:                    partnerIDs[0],
			CareRequestPartnerOriginSlug: "source",
		},
		{
			StationCareRequestID:         stationCareRequestID,
			PartnerID:                    partnerIDs[1],
			CareRequestPartnerOriginSlug: "pop_health",
		},
	}
	for _, careRequestPartner := range careRequestPartners {
		_, err := queries.AddCareRequestPartner(ctx, careRequestPartner)
		if err != nil {
			t.Fatal(err)
		}
	}

	tests := []struct {
		name   string
		params partnersql.GetInsuranceByCareRequestAndOriginParams

		want    *partnersql.Partner
		wantErr bool
	}{
		{
			name: "successfully gets partner by care request and source origin",
			params: partnersql.GetInsuranceByCareRequestAndOriginParams{
				CareRequestPartnerOriginSlug: "source",
				StationCareRequestID:         stationCareRequestID,
			},

			want: &partnersql.Partner{
				ID:                   partnerIDs[0],
				StationChannelItemID: partners[0].StationChannelItemID,
				DisplayName:          partners[0].DisplayName,
				PartnerCategoryID:    partnerCategoryShortNameToID[partners[0].PartnerCategoryShortName],
				InsurancePackageID:   sqltypes.ToValidNullInt64(partnerIDs[0]),
			},
		},
		{
			name: "successfully gets partner by care request and pop_health origin",
			params: partnersql.GetInsuranceByCareRequestAndOriginParams{
				CareRequestPartnerOriginSlug: "pop_health",
				StationCareRequestID:         stationCareRequestID,
			},

			want: &partnersql.Partner{
				ID:                   partnerIDs[1],
				StationChannelItemID: partners[1].StationChannelItemID,
				DisplayName:          partners[1].DisplayName,
				PartnerCategoryID:    partnerCategoryShortNameToID[partners[1].PartnerCategoryShortName],
				InsurancePackageID:   sqltypes.ToValidNullInt64(partnerIDs[1]),
			},
		},
		{
			name: "fails when partner does not exist for care request and origin",
			params: partnersql.GetInsuranceByCareRequestAndOriginParams{
				CareRequestPartnerOriginSlug: "insurance",
				StationCareRequestID:         stationCareRequestID,
			},

			want:    &partnersql.Partner{},
			wantErr: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			partner, err := pdb.GetInsuranceByCareRequestAndOrigin(ctx, test.params)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, test.want, partner)
			testutils.MustMatch(t, test.wantErr, err != nil)
		})
	}
}

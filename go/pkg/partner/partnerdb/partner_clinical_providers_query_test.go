//go:build db_test

package partnerdb_test

import (
	"testing"
	"time"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPartnerDB_AddPartnerClinicalProvider(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	partnerID := baseID
	athenaClinicalProviderID := baseID
	pdb := partnerdb.NewPartnerDB(db, nil)

	tests := []struct {
		name   string
		params partnersql.AddPartnerClinicalProviderParams

		expectedResponse partnersql.PartnerClinicalProvider
	}{
		{
			name: "success - base case",
			params: partnersql.AddPartnerClinicalProviderParams{
				PartnerID:                partnerID,
				AthenaClinicalProviderID: athenaClinicalProviderID,
			},

			expectedResponse: partnersql.PartnerClinicalProvider{
				PartnerID:                partnerID,
				AthenaClinicalProviderID: athenaClinicalProviderID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			partnerClinicalProvider, err := pdb.AddPartnerClinicalProvider(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, partnerClinicalProvider, &test.expectedResponse)
		})
	}
}

func TestPartnerDB_GetPartnerClinicalProvidersByPartnerID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	tests := []struct {
		name                     string
		partnerClinicalProviders []partnersql.AddPartnerClinicalProviderParams
		partnerID                int64

		expectedResponse []*partnersql.PartnerClinicalProvider
	}{
		{
			name: "success - base case",
			partnerClinicalProviders: []partnersql.AddPartnerClinicalProviderParams{
				{
					PartnerID:                baseID,
					AthenaClinicalProviderID: baseID,
				},
				{
					PartnerID:                baseID + 1,
					AthenaClinicalProviderID: baseID + 1,
				},
			},
			partnerID: baseID,

			expectedResponse: []*partnersql.PartnerClinicalProvider{
				{
					PartnerID:                baseID,
					AthenaClinicalProviderID: baseID,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			for _, partnerClinicalProvider := range test.partnerClinicalProviders {
				_, err := queries.AddPartnerClinicalProvider(ctx, partnerClinicalProvider)
				if err != nil {
					t.Fatal(err)
				}
			}

			gotPartnerClinicalProviders, err := pdb.GetPartnerClinicalProvidersByPartnerID(ctx, test.partnerID)
			if err != nil {
				t.Fatal(err)
			}

			for i, partnerClinicalProvider := range gotPartnerClinicalProviders {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.expectedResponse[i], partnerClinicalProvider)
			}
		})
	}
}

func TestPartnerDB_DeletePartnerClinicalProvidersByPartnerID(t *testing.T) {
	ctx, db, queries, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()

	tests := []struct {
		name                    string
		partnerClinicalProvider *partnersql.AddPartnerClinicalProviderParams
		deletePartnerID         int64

		expectedResponse []*partnersql.PartnerClinicalProvider
		expectedError    error
	}{
		{
			name: "success - base case",
			partnerClinicalProvider: &partnersql.AddPartnerClinicalProviderParams{
				PartnerID:                baseID,
				AthenaClinicalProviderID: baseID,
			},
			deletePartnerID: baseID,

			expectedResponse: []*partnersql.PartnerClinicalProvider{
				{
					PartnerID:                baseID,
					AthenaClinicalProviderID: baseID,
				},
			},
		},
		{
			name:            "success - no partner id matches the query",
			deletePartnerID: baseID + 1,

			expectedResponse: []*partnersql.PartnerClinicalProvider{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := partnerdb.NewPartnerDB(db, nil)

			if test.partnerClinicalProvider != nil {
				_, err := queries.AddPartnerClinicalProvider(ctx, *test.partnerClinicalProvider)
				if err != nil {
					t.Fatal(err)
				}
			}

			response, err := pdb.DeletePartnerClinicalProvidersByPartnerID(ctx, test.deletePartnerID)

			testutils.MustMatch(t, test.expectedError, err)
			for i := range test.expectedResponse {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.expectedResponse[i], response[i])
			}
		})
	}
}

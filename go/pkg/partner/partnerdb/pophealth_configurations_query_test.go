//go:build db_test

package partnerdb_test

import (
	"testing"
	"time"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPartnerDB_AddPophealthConfiguration(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()

	tests := []struct {
		name   string
		params partnersql.AddPophealthConfigurationParams

		want *partnersql.PophealthConfiguration
	}{
		{
			name: "successfully add pophealth configuration",
			params: partnersql.AddPophealthConfigurationParams{
				PartnerConfigurationID: baseID,
				PartnerID:              baseID,
			},

			want: &partnersql.PophealthConfiguration{
				PartnerConfigurationID: baseID,
				PartnerID:              baseID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResp, err := pdb.AddPophealthConfiguration(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotResp)
		})
	}
}

func TestPartnerDB_DeletePartnerConfigurationByID(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()

	tests := []struct {
		name   string
		params partnersql.AddPophealthConfigurationParams

		want *partnersql.PophealthConfiguration
	}{
		{
			name: "successfully soft delete pophealth configuration",
			params: partnersql.AddPophealthConfigurationParams{
				PartnerConfigurationID: baseID,
				PartnerID:              baseID,
			},

			want: &partnersql.PophealthConfiguration{
				ID:                     0,
				PartnerConfigurationID: baseID,
				PartnerID:              baseID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pophealthConfiguration, err := pdb.AddPophealthConfiguration(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			gotResp, err := pdb.DeletePophealthConfiguration(ctx, pophealthConfiguration.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, gotResp.DeletedAt.Valid, true, "expected pophealthConfiguration.DeletedAt to be valid")
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, gotResp)
		})
	}
}

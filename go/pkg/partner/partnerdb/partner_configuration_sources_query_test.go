//go:build db_test

package partnerdb_test

import (
	"testing"
	"time"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPartnerDB_AddPartnerConfigurationSource(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	callbackOptionSlug := "source"
	callbackOptionID := int64(1)
	location := &partnerpb.Location{}

	tests := []struct {
		name     string
		location *partnerpb.Location
		params   *partnersql.AddPartnerConfigurationSourceParams

		want *partnersql.PartnerConfigurationSource
	}{
		{
			name: "successfully inserts a new partner configuration source",
			params: &partnersql.AddPartnerConfigurationSourceParams{
				PartnerID:                 baseID,
				PartnerConfigurationID:    baseID,
				DefaultCallbackOptionSlug: callbackOptionSlug,
			},

			want: &partnersql.PartnerConfigurationSource{
				PartnerID:               baseID,
				PartnerConfigurationID:  baseID,
				DefaultCallbackOptionID: callbackOptionID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResponse, err := pdb.AddPartnerConfigurationSource(ctx, location, *test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, gotResponse.LocationID.Valid, true)
			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".LocationID")(t, test.want, gotResponse)
		})
	}
}

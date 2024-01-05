//go:build db_test

package partnerdb_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestPartnerDB_AddLocation(t *testing.T) {
	ctx, db, _, _, done := setupDBTest(t)
	defer done()

	pdb := partnerdb.NewPartnerDB(db, nil)
	baseID := time.Now().UnixNano()
	addressLineOne := "Address 1"
	addressLineTwo := "Address 2"
	city := "Denver"
	stateCode := "CO"
	zipcode := "12345"
	latitudeE6 := int32(10000000)
	longitudeE6 := int32(20000000)
	tests := []struct {
		name   string
		params *partnerpb.Location

		wantResp sql.NullInt64
	}{
		{
			name: "successfully adds a location",
			params: &partnerpb.Location{
				Address: &common.Address{
					AddressLineOne: proto.String(addressLineOne),
					AddressLineTwo: proto.String(addressLineTwo),
					City:           proto.String(city),
					State:          proto.String(stateCode),
					ZipCode:        proto.String(zipcode),
				},
				GeoLocation: &common.Location{
					LatitudeE6:  latitudeE6,
					LongitudeE6: longitudeE6,
				},
			},

			wantResp: sql.NullInt64{
				Int64: baseID,
				Valid: true,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResp, err := pdb.AddLocation(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".Int64")(t, test.wantResp, gotResp)
		})
	}
}

//go:build db_test

package partnerdb_test

import (
	"context"

	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	adhocpartnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner/DO_NOT_USE"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName                       = "partner"
	careRequestPartnerOriginSlugToID = map[string]int64{
		"insurance":        1,
		"location":         2,
		"pop_health":       3,
		"provider_network": 4,
		"source":           5,
	}
	partnerCategoryShortNameToID = map[string]int64{
		"employer":                    1,
		"health_system":               2,
		"home_health":                 3,
		"hospice_and_palliative_care": 4,
		"injury_finance":              5,
		"payer":                       6,
		"provider_group":              7,
		"senior_care":                 8,
		"snf":                         9,
		"unspecified":                 10,
	}
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *partnersql.Queries, *adhocpartnersql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, partnersql.New(db), adhocpartnersql.New(db), func() {
		db.Close()
	}
}

func unorderedEqual(first, second []int64) bool {
	if len(first) != len(second) {
		return false
	}
	exists := make(map[int64]struct{})
	for _, value := range first {
		exists[value] = struct{}{}
	}
	for _, value := range second {
		if _, isPresent := exists[value]; !isPresent {
			return false
		}
	}
	return true
}

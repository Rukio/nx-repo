//go:build db_test

package pophealthdb_test

import (
	"context"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName = "pophealth"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *pophealthsql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, pophealthsql.New(db), func() {
		db.Close()
	}
}

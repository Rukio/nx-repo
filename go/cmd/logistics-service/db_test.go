//go:build db_test

package main_test

import (
	"context"

	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName = "logistics"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *logisticssql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, logisticssql.New(db), func() {
		db.Close()
	}
}

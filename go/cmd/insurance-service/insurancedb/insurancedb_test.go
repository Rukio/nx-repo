//go:build db_test

package insurancedb

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v4/pgxpool"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	testDBName = "insurance"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, db.Close
}

func TestNewInsuranceDB(t *testing.T) {
	_, db, done := setupDBTest(t)
	defer done()

	t.Run("Create insurance DB connection", func(t *testing.T) {
		idb := NewInsuranceDB(db)

		if idb == nil {
			t.Fatal("DB was not connected")
		}
	})
}

func TestIsHealthy(t *testing.T) {
	ctx, _, done := setupDBTest(t)
	defer done()

	testCases := []struct {
		Name string
		DB   *basedb.MockPingDBTX

		ExpectedOutput bool
	}{
		{
			Name:           "DB is healthy",
			DB:             &basedb.MockPingDBTX{},
			ExpectedOutput: true,
		},
		{
			Name:           "DB is unhealthy",
			DB:             &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			ExpectedOutput: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			insuranceDB := NewInsuranceDB(testCase.DB)

			isHealthy := insuranceDB.IsHealthy(ctx)

			if isHealthy != testCase.ExpectedOutput {
				testutils.MustMatch(t, testCase.ExpectedOutput, isHealthy, "IsHealthy test failed")
			}
		})
	}
}

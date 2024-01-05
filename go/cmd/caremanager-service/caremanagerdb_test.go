//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

const (
	testDBName = "caremanager"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)

	return context.Background(), db, func() {
		db.Close()
	}
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
			caremanagerDB := NewCaremanagerDB(testCase.DB)

			isHealthy := caremanagerDB.IsHealthy(ctx)

			if isHealthy != testCase.ExpectedOutput {
				testutils.MustMatch(t, testCase.ExpectedOutput, isHealthy, "IsHealthy test failed")
			}
		})
	}
}

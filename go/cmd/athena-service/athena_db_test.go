//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestIsHealthy(t *testing.T) {
	tcs := []struct {
		name string
		db   *basedb.MockPingDBTX

		want bool
	}{
		{
			name: "DB is healthy",
			db:   &basedb.MockPingDBTX{},
			want: true,
		},
		{
			name: "DB is unhealthy",
			db:   &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			want: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			db := NewAthenaDB(tc.db)
			isHealthy := db.IsHealthy(context.Background())
			testutils.MustMatch(t, tc.want, isHealthy, "IsHealthy test failed")
		})
	}
}

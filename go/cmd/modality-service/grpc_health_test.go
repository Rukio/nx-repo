//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v4/pgxpool"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	modalitypb "github.com/*company-data-covered*/services/go/pkg/generated/proto/modality"
	"github.com/*company-data-covered*/services/go/pkg/modality/modalitydb"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	healthyStatus = "OK"
)

const testDBName = "modality"

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, db.Close
}

func TestHealthCheck(t *testing.T) {
	_, db, done := setupDBTest(t)
	defer done()

	modalityDB := modalitydb.NewModalityDB(db, &monitoring.NoopScope{})
	unhealthyModalityDB := modalitydb.NewModalityDB(&basedb.MockPingDBTX{PingErr: errors.New("some error")}, &monitoring.NoopScope{})

	tcs := []struct {
		Desc       string
		ModalityDB ModalityDB

		Want         *modalitypb.HealthCheckResponse
		WantError    bool
		ErrorMessage string
	}{
		{
			Desc:       "success - modality service is up",
			ModalityDB: modalityDB,
			Want: &modalitypb.HealthCheckResponse{
				Version:       buildinfo.Version,
				DbStatus:      healthyStatus,
				ServiceStatus: healthyStatus,
			},
			WantError: false,
		},
		{
			Desc:         "fails because the db is unhealthy",
			ModalityDB:   unhealthyModalityDB,
			Want:         nil,
			WantError:    true,
			ErrorMessage: "DB is unhealthy",
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := &HealthGRPCService{
				Logger:     baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
				ModalityDB: tc.ModalityDB,
			}, context.Background()

			result, err := s.HealthCheck(ctx, &modalitypb.HealthCheckRequest{})

			if tc.WantError {
				testutils.MustMatch(t, tc.ErrorMessage, err.Error(), "HealthCheck test with unhealty DB failed")
			}

			if err != nil && !tc.WantError {
				t.Fatal(err)
			}

			testutils.MustMatchProto(t, result, tc.Want, "HealthCheck response mismatch")
		})
	}
}

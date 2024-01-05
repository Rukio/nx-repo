//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
)

var (
	testDBName = "riskstratification"
)

func setupDBTest(t testutils.GetDBConnPooler) (*pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return db, func() {
		db.Close()
	}
}

func TestCheck(t *testing.T) {
	_, done := setupDBTest(t)
	defer done()
	testCases := []struct {
		name string
		db   *basedb.MockPingDBTX

		wantHealthCheckResponseStatus          healthpb.HealthCheckResponse_ServingStatus
		wantResponseIncludesHTTPStatusMetadata bool
	}{
		{
			name: "Health check success",
			db:   &basedb.MockPingDBTX{},

			wantHealthCheckResponseStatus: healthpb.HealthCheckResponse_SERVING,
		},
		{
			name: "health check failed because database is not reachable",
			db:   &basedb.MockPingDBTX{PingErr: errors.New("boo")},

			wantHealthCheckResponseStatus:          healthpb.HealthCheckResponse_NOT_SERVING,
			wantResponseIncludesHTTPStatusMetadata: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			riskStratificationDB := riskstratificationdb.NewRiskStratificationDB(testCase.db, nil, nil)

			healthService := &HealthGRPCService{
				Logger:               zap.NewNop().Sugar(),
				RiskStratificationDB: riskStratificationDB,
			}
			md := &metadata.MD{}
			mockTransportStream := &healthcheck.MockServerTransportStream{MockMethod: "Check", MD: md}
			ctx := grpc.NewContextWithServerTransportStream(context.Background(), mockTransportStream)
			resp, _ := healthService.Check(ctx, &healthpb.HealthCheckRequest{})
			testutils.MustMatch(t, testCase.wantHealthCheckResponseStatus, resp.Status)

			if testCase.wantResponseIncludesHTTPStatusMetadata && !slices.Contains(md.Get("x-http-code"), "503") {
				t.Error("want metadata to contain x-http-code 503")
			}
		})
	}
}

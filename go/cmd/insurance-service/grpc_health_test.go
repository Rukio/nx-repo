//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/cmd/insurance-service/insurancedb"

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
	testDBName = "insurance"
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
		name                              string
		db                                *basedb.MockPingDBTX
		expectedHealthCheckResponseStatus healthpb.HealthCheckResponse_ServingStatus
		includesHTTPStatusMetadata        bool
	}{
		{
			name:                              "Health check success",
			db:                                &basedb.MockPingDBTX{},
			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_SERVING,
		},
		{
			name:                              "health check failed because database is not reachable",
			db:                                &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
			includesHTTPStatusMetadata:        true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			insuranceDB := insurancedb.NewInsuranceDB(testCase.db)

			healthService := &HealthGRPCService{
				Logger:      zap.NewNop().Sugar(),
				InsuranceDB: insuranceDB,
			}
			md := &metadata.MD{}
			mockTransportStream := &healthcheck.MockServerTransportStream{MockMethod: "Check", MD: md}
			ctx := grpc.NewContextWithServerTransportStream(context.Background(), mockTransportStream)
			resp, _ := healthService.Check(ctx, &healthpb.HealthCheckRequest{})
			if resp.Status != testCase.expectedHealthCheckResponseStatus {
				testutils.MustMatch(t, testCase.expectedHealthCheckResponseStatus, resp.Status, "Health Check test failed")
			}
			if testCase.includesHTTPStatusMetadata && !slices.Contains(md.Get("x-http-code"), "503") {
				t.Error("Want metadata to contain x-http-code 503")
			}
		})
	}
}

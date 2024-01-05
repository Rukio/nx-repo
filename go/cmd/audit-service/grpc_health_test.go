package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func TestHealthCheck(t *testing.T) {
	auditDB := audit.NewDB(&basedb.MockPingDBTX{})
	unhealthyAuditDB := audit.NewDB(&basedb.MockPingDBTX{PingErr: errors.New("boo")})

	tcs := []struct {
		Desc    string
		AuditDB *audit.DB

		Want *healthpb.HealthCheckResponse
	}{
		{
			Desc:    "success - audit service is up",
			AuditDB: auditDB,
			Want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
		},
		{
			Desc:    "fails because the db is unhealthy",
			AuditDB: unhealthyAuditDB,
			Want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := &HealthCheckServer{
				Logger:  baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
				AuditDB: tc.AuditDB,
			}, context.Background()

			result, _ := s.Check(ctx, &healthpb.HealthCheckRequest{})
			testutils.MustMatchProto(t, tc.Want, result, "HealthCheck response mismatch")
		})
	}
}

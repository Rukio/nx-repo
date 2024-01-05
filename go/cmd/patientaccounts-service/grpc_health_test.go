package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

func TestHealthCheckServerCheck(t *testing.T) {
	tests := []struct {
		name                     string
		DB                       *basedb.MockPingDBTX
		auditHealthServiceClient healthpb.HealthClient
		want                     *healthpb.HealthCheckResponse
		wantErr                  bool
	}{
		{
			name: "server is serving",
			DB:   &basedb.MockPingDBTX{},
			auditHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_SERVING,
				},
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
			wantErr: false,
		},
		{
			name: "server is not serving - DB unavailable",
			DB:   &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			auditHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_SERVING,
				},
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
			wantErr: false,
		},
		{
			// Even though audit service returned NOT_SERVING, we return serving because we got a response
			name: "server is serving - audit service not serving",
			DB:   &basedb.MockPingDBTX{},
			auditHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_NOT_SERVING,
				},
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
			wantErr: false,
		},
		{
			name: "server is not serving - audit service error",
			DB:   &basedb.MockPingDBTX{},
			auditHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckErr: status.Error(codes.Internal, "it just exploded idk what happened"),
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			db := NewPatientAccountsDB(tc.DB)
			s := &HealthCheckServer{
				DB:                       db,
				AuditHealthServiceClient: tc.auditHealthServiceClient,
				Logger:                   baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			got, err := s.Check(context.Background(), &healthpb.HealthCheckRequest{})
			if (err != nil) != tc.wantErr {
				t.Errorf("Check() error = %v, wantErr %v", err, tc.wantErr)
				return
			}
			testutils.MustMatch(t, tc.want, got)
		})
	}
}

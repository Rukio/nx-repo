package main

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
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
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			db := clinicalkpidb.NewClinicalKPIDB(tc.DB, nil, nil)
			s := &HealthCheckServer{
				DBService: db,
				Logger:    baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
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

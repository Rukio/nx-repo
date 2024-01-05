//go:build db_test

package main

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
)

func TestCheck(t *testing.T) {
	healthyServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, r *http.Request) {
			rw.WriteHeader(http.StatusOK)
		},
	))
	defer healthyServer.Close()

	unhealthyServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, r *http.Request) {
			rw.WriteHeader(http.StatusInternalServerError)
		},
	))
	defer unhealthyServer.Close()

	unavailableServer := httptest.NewServer(http.HandlerFunc(
		nil,
	))
	defer unavailableServer.Close()

	ctx, db, done := setupDBTest(t)
	defer done()

	caremanagerDB := NewCaremanagerDB(db)
	unhealthyCaremanagerDB := NewCaremanagerDB(&basedb.MockPingDBTX{PingErr: errors.New("boo")})

	testCases := []struct {
		Name                       string
		HTTPClient                 *http.Client
		HTTPServerURL              string
		CaremanagerDB              *CaremanagerDB
		IncludesHTTPStatusMetadata bool

		ExpectedHealthCheckResponseStatus healthpb.HealthCheckResponse_ServingStatus
	}{
		{
			Name:          "works",
			HTTPClient:    healthyServer.Client(),
			HTTPServerURL: healthyServer.URL,
			CaremanagerDB: caremanagerDB,

			ExpectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_SERVING,
		},
		{
			Name:                       "fails because the db is unhealthy",
			HTTPClient:                 healthyServer.Client(),
			HTTPServerURL:              healthyServer.URL,
			CaremanagerDB:              unhealthyCaremanagerDB,
			IncludesHTTPStatusMetadata: true,

			ExpectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
		},
		{
			Name:                       "fails because Station checks are failing",
			HTTPClient:                 unhealthyServer.Client(),
			HTTPServerURL:              unhealthyServer.URL,
			CaremanagerDB:              caremanagerDB,
			IncludesHTTPStatusMetadata: true,

			ExpectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
		},
		{
			Name:                       "fails because Station is unavailable",
			HTTPClient:                 unavailableServer.Client(),
			HTTPServerURL:              unavailableServer.URL,
			CaremanagerDB:              caremanagerDB,
			IncludesHTTPStatusMetadata: true,

			ExpectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			healthCheckGRPCService := &HealthGRPCService{
				StationClient: NewStationClient(NewStationClientParams{
					AuthEnabled: false,
					StationURL:  testCase.HTTPServerURL,
					HTTPClient:  testCase.HTTPClient,
				}),
				CaremanagerDB: testCase.CaremanagerDB,
				Logger:        zap.NewNop().Sugar(),
			}

			md := &metadata.MD{}
			mockTransportStream := &healthcheck.MockServerTransportStream{MockMethod: "Check", MD: md}
			ctx = grpc.NewContextWithServerTransportStream(ctx, mockTransportStream)
			resp, _ := healthCheckGRPCService.Check(ctx, &healthpb.HealthCheckRequest{})

			testutils.MustMatchProto(t, &healthpb.HealthCheckResponse{
				Status: testCase.ExpectedHealthCheckResponseStatus,
			}, resp, "Health Check test failed")
			if testCase.IncludesHTTPStatusMetadata && !slices.Contains(md.Get("x-http-code"), "503") {
				t.Error("Want metadata to contain x-http-code 503")
			}
		})
	}
}

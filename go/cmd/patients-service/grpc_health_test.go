package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/station"
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

	testCases := []struct {
		name                      string
		stationHTTPClient         *http.Client
		stationHTTPServerURL      string
		athenaHealthServiceClient healthpb.HealthClient

		expectedHealthCheckResponseStatus healthpb.HealthCheckResponse_ServingStatus
		includesHTTPStatusMetadata        bool
	}{
		{
			name:                 "Health check success",
			stationHTTPClient:    healthyServer.Client(),
			stationHTTPServerURL: healthyServer.URL,
			athenaHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_SERVING,
				},
			},

			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_SERVING,
		},
		{
			name:                 "health check failing because station is returning error",
			stationHTTPClient:    unhealthyServer.Client(),
			stationHTTPServerURL: unhealthyServer.URL,
			athenaHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_SERVING,
				},
			},

			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
			includesHTTPStatusMetadata:        true,
		},
		{
			name:                 "health check failing because station is unavailable",
			stationHTTPClient:    unavailableServer.Client(),
			stationHTTPServerURL: unavailableServer.URL,
			athenaHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_SERVING,
				},
			},

			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
			includesHTTPStatusMetadata:        true,
		},
		{
			name:                 "health check failing because athenaservice is returning NOT_SERVING",
			stationHTTPClient:    healthyServer.Client(),
			stationHTTPServerURL: healthyServer.URL,
			athenaHealthServiceClient: &healthcheck.MockHealthClient{
				HealthCheckResponse: &healthpb.HealthCheckResponse{
					Status: healthpb.HealthCheckResponse_NOT_SERVING,
				},
			},

			expectedHealthCheckResponseStatus: healthpb.HealthCheckResponse_NOT_SERVING,
			includesHTTPStatusMetadata:        true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			healthService := &HealthCheckServer{
				StationClient:             &station.Client{HTTPClient: testCase.stationHTTPClient, StationURL: testCase.stationHTTPServerURL, AuthDisabled: true},
				AthenaHealthServiceClient: testCase.athenaHealthServiceClient,
				Logger:                    zap.NewNop().Sugar(),
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

package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/cmd/notifications-service/slack-service"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
)

type mockSlackClient struct {
	slack.Client

	authError error
}

func (msc *mockSlackClient) AuthTest() error {
	return msc.authError
}

func TestCheck(t *testing.T) {
	tcs := []struct {
		desc           string
		slackClient    slack.Client
		responseStatus int
		responseJSON   string
		wantStatus     healthpb.HealthCheckResponse_ServingStatus
	}{
		{
			desc:           "should return unhealthy status when Slack health check fails",
			slackClient:    &mockSlackClient{authError: errors.New("error")},
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"REST API","status":"operational","only_show_if_degraded":false}]}`,
			wantStatus:     healthpb.HealthCheckResponse_NOT_SERVING,
		},
		{
			desc:           "should return unhealthy status when Twilio health check fails",
			slackClient:    &mockSlackClient{},
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"REST API","status":"major_outage","only_show_if_degraded":false}]}`,
			wantStatus:     healthpb.HealthCheckResponse_NOT_SERVING,
		},
		{
			desc:           "should return healthy status",
			slackClient:    &mockSlackClient{},
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"REST API","status":"operational","only_show_if_degraded":false}]}`,
			wantStatus:     healthpb.HealthCheckResponse_SERVING,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.responseStatus)
				fmt.Fprint(w, tc.responseJSON)
			}))
			defer testServer.Close()

			healthServer := &HealthGRPCService{
				SlackClient: tc.slackClient,
				TwilioStatCheckClient: &TwilioStatCheckClient{
					TwilioStatCheckURL: testServer.URL,
				},
				Logger: zap.NewNop().Sugar(),
			}

			ctx := context.Background()

			req := &healthpb.HealthCheckRequest{}

			resp, err := healthServer.Check(ctx, req)

			if err != nil {
				t.Fatalf("Check returned an error: %v", err)
			}

			testutils.MustMatch(t, tc.wantStatus, resp.Status)
		})
	}
}

func TestTwilioHealthCheck(t *testing.T) {
	testCases := []struct {
		desc           string
		responseStatus int
		responseJSON   string

		wantError error
	}{
		{
			desc:           "should return operational status",
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"REST API","status":"operational","only_show_if_degraded":false}]}`,
		},
		{
			desc:           "should return error could not find component",
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"API","status":"operational","only_show_if_degraded":false}]}`,

			wantError: fmt.Errorf("could not find Twilio REST API component"),
		},
		{
			desc:           "should return error cause http status not found",
			responseStatus: http.StatusNotFound,
			responseJSON:   "",

			wantError: status.Error(codes.NotFound, "HTTP request had error response 404: "),
		},
		{
			desc:           "should return error cause bad JSON",
			responseStatus: http.StatusOK,
			responseJSON:   "",

			wantError: status.Error(codes.Internal, "Failed to unmarshal json into given struct: EOF"),
		},
		{
			desc:           "should return major outage status",
			responseStatus: http.StatusOK,
			responseJSON:   `{"components":[{"id":"1","name":"REST API","status":"major_outage","only_show_if_degraded":false}]}`,

			wantError: fmt.Errorf("REST API status: major_outage"),
		},
	}
	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.responseStatus)
				fmt.Fprint(w, tc.responseJSON)
			}))
			defer testServer.Close()

			healthServer := &HealthGRPCService{
				TwilioStatCheckClient: &TwilioStatCheckClient{
					TwilioStatCheckURL: testServer.URL,
				},
				Logger: zap.NewNop().Sugar(),
			}

			err := healthServer.twilioHealthCheck(context.Background())

			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

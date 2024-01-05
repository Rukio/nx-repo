package main

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type mockDBCheckService struct {
	isHealthyResp bool
}

func (s mockDBCheckService) IsHealthy(context.Context) bool {
	return s.isHealthyResp
}

type mockAwsCheck struct {
	err error
}

func (m *mockAwsCheck) BucketExists(context.Context, string) bool {
	return m.err == nil
}

func TestCheck(t *testing.T) {
	ctx := context.Background()
	testCases := []struct {
		Name              string
		DBService         DBCheck
		AwsClientHasValue bool
		MockAwsClient     *mockAwsCheck

		ExpectedHealthCheckResponse *healthpb.HealthCheckResponse
	}{
		{
			Name: "works",
			DBService: &mockDBCheckService{
				isHealthyResp: true,
			},
			AwsClientHasValue: true,
			MockAwsClient: &mockAwsCheck{
				err: nil,
			},
			ExpectedHealthCheckResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
		},
		{
			Name: "fail DB",
			DBService: &mockDBCheckService{
				isHealthyResp: false,
			},
			AwsClientHasValue: true,
			MockAwsClient: &mockAwsCheck{
				err: nil,
			},
			ExpectedHealthCheckResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			Name: "fail nil AWS service",
			DBService: &mockDBCheckService{
				isHealthyResp: true,
			},
			AwsClientHasValue: false,
			ExpectedHealthCheckResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
		{
			Name: "fail AWS error service",
			DBService: &mockDBCheckService{
				isHealthyResp: true,
			},
			AwsClientHasValue: true,
			MockAwsClient: &mockAwsCheck{
				err: errInternalTest,
			},
			ExpectedHealthCheckResponse: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			var awsc AWSCheck
			awsc = nil
			if testCase.AwsClientHasValue {
				awsc = testCase.MockAwsClient
			}

			healthService := &HealthCheckServer{
				DBService:      testCase.DBService,
				AWSClient:      awsc,
				BucketForCheck: "bucket-test",
			}

			resp, _ := healthService.Check(ctx, &healthpb.HealthCheckRequest{})

			testutils.MustMatch(t, testCase.ExpectedHealthCheckResponse, resp)
		})
	}
}

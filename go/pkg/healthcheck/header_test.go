package healthcheck

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func TestSetHTTPHeaderMetadata(t *testing.T) {
	exampleErr := status.Error(codes.Internal, "the call is coming from INSIDE the house")
	tcs := []struct {
		Desc            string
		Status          healthpb.HealthCheckResponse_ServingStatus
		TransportStream *MockServerTransportStream

		expectedHeader metadata.MD
		expectedError  error
	}{
		{
			Desc:            "status serving",
			Status:          healthpb.HealthCheckResponse_SERVING,
			TransportStream: &MockServerTransportStream{MD: &metadata.MD{}},

			expectedHeader: metadata.MD{},
		},
		{
			Desc:            "status not serving",
			Status:          healthpb.HealthCheckResponse_NOT_SERVING,
			TransportStream: &MockServerTransportStream{MD: &metadata.MD{}},

			expectedHeader: metadata.Pairs("x-http-code", "503"),
		},
		{
			Desc:            "set header error",
			Status:          healthpb.HealthCheckResponse_NOT_SERVING,
			TransportStream: &MockServerTransportStream{MD: &metadata.MD{}, SetHeaderError: exampleErr},

			expectedError:  exampleErr,
			expectedHeader: metadata.MD{},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			ctx := grpc.NewContextWithServerTransportStream(context.Background(), tc.TransportStream)
			err := SetHTTPHeaderMetadata(ctx, tc.Status)
			testutils.MustMatch(t, tc.expectedError, err, "error mismatch")
			if tc.TransportStream.MD != &tc.expectedHeader {
				testutils.MustMatch(t, &tc.expectedHeader, tc.TransportStream.MD, "header metadata mismatch")
			}
		})
	}
}

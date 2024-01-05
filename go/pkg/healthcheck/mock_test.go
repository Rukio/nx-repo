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

func TestMockHealthCheck(t *testing.T) {
	tcs := []struct {
		Desc    string
		Serving bool

		Want *healthpb.HealthCheckResponse
	}{
		{
			Desc:    "serving",
			Serving: true,

			Want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
		},
		{
			Desc:    "not serving",
			Serving: false,

			Want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := &MockHealthServer{serving: tc.Serving}, context.Background()

			md := &metadata.MD{}
			mockTransportStream := &MockServerTransportStream{MockMethod: "Check", MD: md}
			ctx = grpc.NewContextWithServerTransportStream(ctx, mockTransportStream)
			result, _ := s.Check(ctx, &healthpb.HealthCheckRequest{})
			testutils.MustMatchProto(t, result, tc.Want, "HealthCheck response mismatch")
		})
	}
}

func TestMockServerTransportStreamUnimplemented(t *testing.T) {
	md := &metadata.MD{}
	mockTransportStream := &MockServerTransportStream{MockMethod: "MockMethod", MD: md}
	tcs := []struct {
		Desc string
		Func func(md metadata.MD) error
	}{
		{
			Desc: "SendHeader is Unimplemented",
			Func: mockTransportStream.SendHeader,
		},
		{
			Desc: "SetTrailer is Unimplemented",
			Func: mockTransportStream.SetTrailer,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			err := tc.Func(metadata.MD{})
			testutils.MustMatch(t, codes.Unimplemented, status.Code(err), "...")
		})
	}
}

package healthcheck

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type MockHealthServer struct {
	healthpb.UnimplementedHealthServer
	serving bool
}

func (h *MockHealthServer) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	status := healthpb.HealthCheckResponse_SERVING
	if !h.serving {
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}
	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

func (h *MockHealthServer) Watch(req *healthpb.HealthCheckRequest, stream healthpb.Health_WatchServer) error {
	return status.Error(codes.Unimplemented, "unimplemented")
}

type MockHealthClient struct {
	HealthCheckResponse *healthpb.HealthCheckResponse
	HealthCheckErr      error
}

func (c *MockHealthClient) Check(_ context.Context, in *healthpb.HealthCheckRequest, opts ...grpc.CallOption) (*healthpb.HealthCheckResponse, error) {
	return c.HealthCheckResponse, c.HealthCheckErr
}

func (c *MockHealthClient) Watch(_ context.Context, in *healthpb.HealthCheckRequest, opts ...grpc.CallOption) (healthpb.Health_WatchClient, error) {
	return nil, status.Error(codes.Unimplemented, "unimplemented")
}

type MockServerTransportStream struct {
	MockMethod     string
	MD             *metadata.MD
	SetHeaderError error
}

func (m *MockServerTransportStream) Method() string {
	return m.MockMethod
}

func (m *MockServerTransportStream) SetHeader(md metadata.MD) error {
	if m.SetHeaderError != nil {
		return m.SetHeaderError
	}
	*m.MD = md
	return nil
}

func (m *MockServerTransportStream) SendHeader(md metadata.MD) error {
	return status.Error(codes.Unimplemented, "Unimplemented")
}

func (m *MockServerTransportStream) SetTrailer(md metadata.MD) error {
	return status.Error(codes.Unimplemented, "Unimplemented")
}

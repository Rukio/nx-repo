package healthcheck

import (
	"context"

	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
)

func SetHTTPHeaderMetadata(ctx context.Context, status healthpb.HealthCheckResponse_ServingStatus) error {
	if status != healthpb.HealthCheckResponse_SERVING {
		return grpc.SetHeader(ctx, metadata.Pairs("x-http-code", "503"))
	}
	return nil
}

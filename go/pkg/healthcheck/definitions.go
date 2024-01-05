package healthcheck

import (
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

const (
	healthcheckServiceName = "Health"
)

var (
	HealthcheckServiceDescriptor = healthpb.File_grpc_health_v1_health_proto.Services().ByName(healthcheckServiceName)
)

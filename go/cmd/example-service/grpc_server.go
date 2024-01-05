package main

import (
	"context"

	"time"

	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type GRPCServer struct {
	examplepb.UnimplementedExampleServiceServer
	Logger *zap.SugaredLogger
}

func (s *GRPCServer) GetVersion(ctx context.Context, req *examplepb.GetVersionRequest) (*examplepb.GetVersionResponse, error) {
	monitoring.AddGRPCTag(ctx, "some_tag", "you're it!")
	monitoring.AddGRPCField(ctx, "some_field", 123)
	monitoring.AddGRPCField(ctx, "ignored_nil_field", nil)

	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "request is nil")
	}
	s.Logger.Debug("GetVersion was called with request time logged as metadata.", zap.Time("request_time", time.Now()))
	return &examplepb.GetVersionResponse{
		Version: proto.String("1"),
	}, nil
}

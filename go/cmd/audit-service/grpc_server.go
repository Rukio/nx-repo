package main

import (
	"context"
	"fmt"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	auditpb.UnimplementedAuditServiceServer
	Logger  *zap.SugaredLogger
	AuditDB *audit.DB
}

func (s *GRPCServer) CreateAuditEvent(ctx context.Context, req *auditpb.CreateAuditEventRequest) (*auditpb.CreateAuditEventResponse, error) {
	if req == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event request is nil")
	}
	if req.Source == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event source is required")
	}
	if req.Agent == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event agent field is required")
	}
	if req.EventType == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event event type field is required")
	}
	if req.EventDataType == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event event data type field is required")
	}
	if req.EventTimestamp == nil {
		return nil, status.Error(codes.InvalidArgument, "the audit event event timestamp field is required")
	}

	auditEvent, err := s.AuditDB.CreateAuditEvent(ctx, auditEventFromCreateRequest(req))
	if err != nil {
		return nil, fmt.Errorf("failed to create audit event: %w", err)
	}

	response, err := auditEventToCreateResponse(auditEvent)
	if err != nil {
		return nil, fmt.Errorf("failed to create audit event response: %w", err)
	}

	return response, nil
}

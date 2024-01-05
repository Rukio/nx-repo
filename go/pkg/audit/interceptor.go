package audit

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"google.golang.org/grpc/metadata"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	traceIDHeaderName    = "x-trace-id"
	traceEmailHeaderName = "x-trace-email"
)

type methodRule struct {
	*auditpb.AuditRule
	defaultAgent string
}

type Interceptor struct {
	auditedServiceName string
	client             auditpb.AuditServiceClient

	methodAuditRules map[string]*methodRule
}

// NewAuditInterceptor initializes an audit client and builds a table of audit rules for all methods included in the serviceDescriptors.
//
// It is required to set audit rules in all methods protos for the services included in serviceDescriptors.
// If the invoked method doesn't need to be audited, the AuditRule SkipAudit value must be set to true.
func NewAuditInterceptor(auditedServiceName string, auditServiceClient auditpb.AuditServiceClient, serviceDescriptors []protoreflect.ServiceDescriptor) (*Interceptor, error) {
	if auditedServiceName == "" {
		return nil, errors.New("auditedServiceName value is required")
	}
	if auditServiceClient == nil {
		return nil, errors.New("auditServiceClient is required")
	}
	if len(serviceDescriptors) == 0 {
		return nil, errors.New("serviceDescriptor list is empty")
	}

	methodAuditRules := map[string]*methodRule{}
	for _, serviceDescriptor := range serviceDescriptors {
		methods := serviceDescriptor.Methods()
		for i := 0; i < methods.Len(); i++ {
			methodDescriptor := methods.Get(i)

			methodName := baseserv.GrpcFullMethodStringFromProtoQualifiedName((string(methodDescriptor.FullName())))
			protoMessage := methodDescriptor.Options()
			auditRules, _ := proto.GetExtension(protoMessage, auditpb.E_Rule).(*auditpb.AuditRule)

			if auditRules == nil {
				return nil, fmt.Errorf("method '%s', doesn't define any audit rules", methodName)
			}
			methodAuditRules[methodName] = &methodRule{
				AuditRule:    auditRules,
				defaultAgent: string(serviceDescriptor.Name()),
			}
		}
	}

	return &Interceptor{
		auditedServiceName: auditedServiceName,
		client:             auditServiceClient,
		methodAuditRules:   methodAuditRules,
	}, nil
}

// CreateEvent is an UnaryServerInterceptor that will create an audit event with the request details.
func (i *Interceptor) CreateEvent(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
	auditRules, ok := i.methodAuditRules[info.FullMethod]
	if !ok || auditRules.SkipAudit {
		return handler(ctx, req)
	}
	agent := auditRules.defaultAgent
	claims, ok := auth.CustomClaimsFromContext(ctx)
	if ok {
		agent = claims.Email
	}

	ctx = i.forwardTraceHeaders(ctx)
	contextMetadata := i.createContextMetadata(ctx)
	auditEventRequest, err := i.createAuditEventRequest(agent, info.FullMethod, req, auditRules.EventDataType, &contextMetadata)
	if err != nil {
		return nil, err
	}
	_, err = i.client.CreateAuditEvent(ctx, auditEventRequest)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "An error occurred while creating an audit event, err: %s", err)
	}

	return handler(ctx, req)
}

func (i *Interceptor) createContextMetadata(ctx context.Context) structpb.Struct {
	var traceID, traceEmail string
	md, ok := metadata.FromOutgoingContext(ctx)
	if ok {
		traceID = i.getHeaderValue(md, traceIDHeaderName)
		traceEmail = i.getHeaderValue(md, traceEmailHeaderName)
	}

	return structpb.Struct{
		Fields: map[string]*structpb.Value{
			"trace_id": {
				Kind: &structpb.Value_StringValue{
					StringValue: traceID,
				},
			},
			"trace_email": {
				Kind: &structpb.Value_StringValue{
					StringValue: traceEmail,
				},
			},
		},
	}
}

func (i *Interceptor) getHeaderValue(md metadata.MD, headerName string) string {
	var traceHeader string
	header := md.Get(headerName)
	if len(header) > 0 {
		traceHeader = header[0]
	}
	return traceHeader
}

func (i *Interceptor) forwardTraceHeaders(ctx context.Context) context.Context {
	var traceID, traceEmail string

	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		traceID = i.getHeaderValue(md, traceIDHeaderName)
		if traceID == "" {
			traceID = (uuid.New()).String()
		}

		traceEmail = i.getHeaderValue(md, traceEmailHeaderName)
		if traceEmail == "" {
			claims, ok := auth.CustomClaimsFromContext(ctx)
			if ok {
				traceEmail = claims.Email
			}
		}
	}

	return metadata.NewOutgoingContext(ctx, metadata.Pairs(traceIDHeaderName, traceID, traceEmailHeaderName, traceEmail))
}

func (i *Interceptor) createAuditEventRequest(agent string, eventType string, req any, eventDataType string, contextMetadata *structpb.Struct) (*auditpb.CreateAuditEventRequest, error) {
	reqRaw, err := json.Marshal(req)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "could not create an audit event, Marshal err: %s", err)
	}
	reqMap := map[string]any{}
	err = json.Unmarshal(reqRaw, &reqMap)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "could not create an audit event, Unmarshal err: %s", err)
	}
	reqStructProto, err := structpb.NewStruct(reqMap)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "could not create an audit event, NewStruct err: %s", err)
	}
	return &auditpb.CreateAuditEventRequest{
		Source:          proto.String(i.auditedServiceName),
		Agent:           proto.String(agent),
		EventType:       proto.String(eventType),
		EventDataType:   proto.String(eventDataType),
		EventTimestamp:  timestamppb.Now(),
		EventData:       reqStructProto,
		ContextMetadata: contextMetadata,
	}, nil
}

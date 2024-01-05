package audit

import (
	"context"
	"errors"
	"testing"

	"google.golang.org/grpc/metadata"

	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/structpb"
)

type MockAuditServiceClient struct {
	CreateAuditEventResult *auditpb.CreateAuditEventResponse
	CreateAuditEventErr    error
}

func (c *MockAuditServiceClient) CreateAuditEvent(_ context.Context, _ *auditpb.CreateAuditEventRequest, _ ...grpc.CallOption) (*auditpb.CreateAuditEventResponse, error) {
	return c.CreateAuditEventResult, c.CreateAuditEventErr
}

func TestInterceptorCreateEvent(t *testing.T) {
	type fields struct {
		auditedService string
	}

	type args struct {
		req  any
		info *grpc.UnaryServerInfo
	}

	tests := []struct {
		name              string
		auditServiceError error
		methodAuditRules  map[string]*methodRule
		fields            fields
		args              args

		handlerCalled bool
		wantErr       bool
	}{
		{
			name:              "Base Case - create an audit event",
			auditServiceError: nil,
			fields: fields{
				auditedService: "test service",
			},
			methodAuditRules: map[string]*methodRule{
				"/athena.AthenaService/GetPatient": {
					AuditRule: &auditpb.AuditRule{
						EventDataType: "Patient",
						SkipAudit:     false,
					},
					defaultAgent: "AthenaService",
				},
			},
			args: args{
				req: nil,
				info: &grpc.UnaryServerInfo{
					FullMethod: "/athena.AthenaService/GetPatient",
				},
			},

			handlerCalled: true,
			wantErr:       false,
		},
		{
			name:              "skips creating an audit event if rule SkipAudit is true",
			auditServiceError: errors.New("should not have been called"),
			fields: fields{
				auditedService: "test service",
			},
			methodAuditRules: map[string]*methodRule{
				"/athena.AthenaService/GetPatient": {
					AuditRule: &auditpb.AuditRule{
						EventDataType: "Patient",
						SkipAudit:     true,
					},
					defaultAgent: "AthenaService",
				},
			},
			args: args{
				req: nil,
				info: &grpc.UnaryServerInfo{
					FullMethod: "/athena.AthenaService/GetPatient",
				},
			},

			handlerCalled: true,
			wantErr:       false,
		},
		{
			name:              "fails to create audit event request if req is invalid",
			auditServiceError: nil,
			fields: fields{
				auditedService: "test service",
			},
			methodAuditRules: map[string]*methodRule{
				"/athena.AthenaService/GetPatient": {
					AuditRule: &auditpb.AuditRule{
						EventDataType: "Patient",
						SkipAudit:     false,
					},
					defaultAgent: "AthenaService",
				},
			},
			args: args{
				req: new(chan int),
				info: &grpc.UnaryServerInfo{
					FullMethod: "/athena.AthenaService/GetPatient",
				},
			},

			handlerCalled: false,
			wantErr:       true,
		},
		{
			name:              "handler is not called if creating an audit event fails",
			auditServiceError: errors.New("something bad happened"),
			fields: fields{
				auditedService: "test service",
			},
			methodAuditRules: map[string]*methodRule{
				"/athena.AthenaService/GetPatient": {
					AuditRule: &auditpb.AuditRule{
						EventDataType: "Patient",
						SkipAudit:     false,
					},
					defaultAgent: "AthenaService",
				},
			},
			args: args{
				req: nil,
				info: &grpc.UnaryServerInfo{
					FullMethod: "/athena.AthenaService/GetPatient",
				},
			},

			handlerCalled: false,
			wantErr:       true,
		},
		{
			name:              "skips auditing if auditRules are not set",
			auditServiceError: nil,
			fields: fields{
				auditedService: "test service",
			},
			methodAuditRules: map[string]*methodRule{},
			args: args{
				req: nil,
				info: &grpc.UnaryServerInfo{
					FullMethod: "/athena.AthenaService/GetPatient",
				},
			},

			handlerCalled: true,
			wantErr:       false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var handlerFunc = func(ctx context.Context, req any) (any, error) {
				testutils.MustMatch(t, true, tt.handlerCalled)
				return "huzzah", nil
			}

			i := &Interceptor{
				auditedServiceName: tt.fields.auditedService,
				client: &MockAuditServiceClient{
					CreateAuditEventErr: tt.auditServiceError,
				},
				methodAuditRules: tt.methodAuditRules,
			}
			resp, err := i.CreateEvent(context.Background(), tt.args.req, tt.args.info, handlerFunc)
			if (err != nil) != tt.wantErr {
				t.Errorf("CreateEvent() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.handlerCalled {
				testutils.MustMatch(t, resp, "huzzah")
			}
		})
	}
}

func TestCreateAuditEventRequest(t *testing.T) {
	type args struct {
		agent           string
		eventType       string
		req             any
		eventDataType   string
		contextMetadata *structpb.Struct
	}
	m := []any{
		map[string]any{
			"key": "value",
		},
		map[string]any{
			"key":  "value",
			"key2": "value",
		},
	}

	mp, _ := structpb.NewValue(m)

	tests := []struct {
		name        string
		args        args
		serviceName string

		want           *auditpb.CreateAuditEventRequest
		wantErr        bool
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				agent:     "agent",
				eventType: "GET",
				req: struct {
					StrVal   string
					IntVal   int
					FloatVal float64
					MapSlice []map[string]string
				}{
					StrVal:   "value",
					IntVal:   123,
					FloatVal: 0.123,
					MapSlice: []map[string]string{
						{
							"key": "value",
						},
						{
							"key":  "value",
							"key2": "value",
						},
					},
				},
				eventDataType: "testEventDataType",
				contextMetadata: &structpb.Struct{
					Fields: map[string]*structpb.Value{
						"TraceID": {
							Kind: &structpb.Value_StringValue{
								StringValue: "123",
							},
						},
						"TraceEmail": {
							Kind: &structpb.Value_StringValue{
								StringValue: "email@example.com",
							},
						},
					},
				},
			},
			serviceName: "test",

			want: &auditpb.CreateAuditEventRequest{
				Source:    proto.String("test"),
				Agent:     proto.String("agent"),
				EventType: proto.String("GET"),
				ContextMetadata: &structpb.Struct{Fields: map[string]*structpb.Value{
					"TraceID":    structpb.NewStringValue("123"),
					"TraceEmail": structpb.NewStringValue("email@example.com"),
				}},
				EventDataType: proto.String("testEventDataType"),
				EventData: &structpb.Struct{Fields: map[string]*structpb.Value{
					"StrVal":   structpb.NewStringValue("value"),
					"IntVal":   structpb.NewNumberValue(123),
					"FloatVal": structpb.NewNumberValue(0.123),
					"MapSlice": mp,
				}},
			},
			wantErr: false,
		},
		{
			name: "returns error if req is not serializable",
			args: args{
				agent:     "agent",
				eventType: "GET",
				req:       make(chan int),
			},
			serviceName: "test",

			want:           nil,
			wantErr:        true,
			wantErrMessage: "could not create an audit event, Marshal err: json: unsupported type: chan int",
		},
		{
			name: "returns error if req is not unmarshall-able into map[string]any",
			args: args{
				agent:     "agent",
				eventType: "GET",
				req:       "plain string",
			},
			serviceName: "test",

			want:           nil,
			wantErr:        true,
			wantErrMessage: "could not create an audit event, Unmarshal err: json: cannot unmarshal string into Go value of type map[string]interface {}",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &Interceptor{
				auditedServiceName: tt.serviceName,
			}
			got, err := i.createAuditEventRequest(tt.args.agent, tt.args.eventType, tt.args.req, tt.args.eventDataType, tt.args.contextMetadata)
			if err != nil {
				if !tt.wantErr {
					t.Errorf("createAuditEventRequest() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErrMessage, e.Message())
			}

			testutils.MustMatchFn(".EventTimestamp")(t, tt.want, got)
		})
	}
}

func TestGetHeaderValue(t *testing.T) {
	type args struct {
		md         metadata.MD
		headerName string
	}

	ctx := metadata.NewOutgoingContext(context.Background(), metadata.Pairs(traceIDHeaderName, "123", traceEmailHeaderName, "mail@example.com"))
	metaData, _ := metadata.FromOutgoingContext(ctx)

	tests := []struct {
		name string
		args args

		serviceName    string
		want           string
		wantErr        bool
		wantErrMessage string
	}{
		{
			name: "Base Case For TraceID",
			args: args{
				md:         metaData,
				headerName: traceIDHeaderName,
			},
			serviceName: "test",
			want:        "123",
			wantErr:     false,
		},
		{
			name: "Base Case For TraceEmail",
			args: args{
				md:         metaData,
				headerName: traceEmailHeaderName,
			},
			serviceName: "test",
			want:        "mail@example.com",
			wantErr:     false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &Interceptor{
				auditedServiceName: tt.serviceName,
			}
			got := i.getHeaderValue(tt.args.md, tt.args.headerName)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestFollowTraceHeaders(t *testing.T) {
	type args struct {
		ctx context.Context
	}
	ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs(traceIDHeaderName, "123", traceEmailHeaderName, "mail@example.com"))
	ctxEmptyEmail := metadata.NewIncomingContext(context.Background(), metadata.Pairs(traceIDHeaderName, "123", traceEmailHeaderName, ""))
	ctxEmptyID := metadata.NewIncomingContext(context.Background(), metadata.Pairs(traceIDHeaderName, "", traceEmailHeaderName, "mail@example.com"))
	tests := []struct {
		name string
		args args

		serviceName    string
		want           context.Context
		wantErr        bool
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				ctx: ctx,
			},
			serviceName: "test",
			want:        metadata.NewOutgoingContext(ctx, metadata.Pairs(traceIDHeaderName, "123", traceEmailHeaderName, "mail@example.com")),
			wantErr:     false,
		},
		{
			name: "Empty Email",
			args: args{
				ctx: ctxEmptyEmail,
			},
			serviceName: "test",
			want:        metadata.NewOutgoingContext(ctxEmptyEmail, metadata.Pairs(traceIDHeaderName, "123", traceEmailHeaderName, "")),
			wantErr:     false,
		},
		{
			name: "Empty ID",
			args: args{
				ctx: ctxEmptyID,
			},
			serviceName: "test",
			want:        metadata.NewOutgoingContext(ctxEmptyEmail, metadata.Pairs(traceIDHeaderName, "", traceEmailHeaderName, "mail@example.com")),
			wantErr:     false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &Interceptor{
				auditedServiceName: tt.serviceName,
			}
			switch tt.name {
			case "Empty ID":
				firstCallMetadata, _ := metadata.FromOutgoingContext(i.forwardTraceHeaders(tt.args.ctx))
				secondCallMetadata, _ := metadata.FromOutgoingContext(i.forwardTraceHeaders(tt.args.ctx))
				firstTraceID := firstCallMetadata.Get("x-trace-id")[0]
				secondTraceID := secondCallMetadata.Get("x-trace-id")[0]
				if firstTraceID == secondTraceID {
					t.Errorf("forwardTraceHeaders() must generate new traceID if x-trace-id is empty.")
					return
				}
			default:
				got := i.forwardTraceHeaders(tt.args.ctx)
				testutils.MustMatch(t, tt.want, got)
			}
		})
	}
}

func TestNewAuditInterceptor(t *testing.T) {
	auditedServiceDescriptorList := []protoreflect.ServiceDescriptor{
		examplepb.File_example_service_proto.Services().ByName("ExampleService"),
	}
	unauditedServiceDescriptorList := []protoreflect.ServiceDescriptor{
		healthcheck.HealthcheckServiceDescriptor,
	}
	type args struct {
		auditedService     string
		auditServiceClient auditpb.AuditServiceClient
		serviceDescriptors []protoreflect.ServiceDescriptor
	}
	tests := []struct {
		name    string
		args    args
		want    *Interceptor
		wantErr bool
	}{
		{
			name: "BaseCase",
			args: args{
				auditedService:     "serviceName",
				auditServiceClient: &MockAuditServiceClient{},
				serviceDescriptors: auditedServiceDescriptorList,
			},
			want: &Interceptor{
				auditedServiceName: "serviceName",
				methodAuditRules: map[string]*methodRule{
					"/example.ExampleService/GetVersion": {
						AuditRule:    &auditpb.AuditRule{EventDataType: "ExampleDataType"},
						defaultAgent: string(auditedServiceDescriptorList[0].Name()),
					},
				},
			},
			wantErr: false,
		},
		{
			name: "Audit rule not defined",
			args: args{
				auditedService:     "serviceName",
				auditServiceClient: &MockAuditServiceClient{},
				serviceDescriptors: unauditedServiceDescriptorList,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "ServiceDescriptors are required",
			args: args{
				auditedService:     "serviceName",
				auditServiceClient: &MockAuditServiceClient{},
				serviceDescriptors: []protoreflect.ServiceDescriptor{},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Audited service name is required",
			args: args{
				auditServiceClient: &MockAuditServiceClient{},
				serviceDescriptors: auditedServiceDescriptorList,
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Audit service client is required",
			args: args{
				auditedService:     "serviceName",
				serviceDescriptors: auditedServiceDescriptorList,
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := NewAuditInterceptor(tt.args.auditedService, tt.args.auditServiceClient, tt.args.serviceDescriptors)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewAuditInterceptor() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatchFn(".client", ".methodAuditRules")(t, tt.want, got)
		})
	}
}

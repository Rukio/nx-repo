package auth

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type mockRequestType struct{}
type mockRequestTypeWithSerializer struct{}
type mockRequestTypeWithFailedSerializer struct{}
type mockRequestTypeNotMapped struct{}
type mockRequestTypeAsPointer struct{}
type mockPolicyClient struct {
	allowedResult bool
	errResult     error
	lastPolicy    string
	lastResource  any
}

func (m *mockPolicyClient) Allowed(ctx context.Context, policy string, resource any) (bool, error) {
	m.lastPolicy = policy
	m.lastResource = resource
	return m.allowedResult, m.errResult
}

var mockResourceData = map[string]string{"key": "value"}

type mockSerializer struct{}

func (s *mockSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	return mockResourceData, nil
}

type mockFailedSerializer struct{}

func (s *mockFailedSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	return nil, errors.New("something bad")
}

func TestGRPCPolicyAuthorizerConfig(t *testing.T) {
	enabledBool := func() bool { return true }

	tcs := []struct {
		desc   string
		config GRPCPolicyAuthorizerConfig

		wantError bool
	}{
		{
			desc:   "invalid config, missing 'enabled' parameter",
			config: GRPCPolicyAuthorizerConfig{},

			wantError: true,
		},
		{
			desc: "valid config",
			config: GRPCPolicyAuthorizerConfig{
				Enabled: enabledBool,
			},

			wantError: false,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			_, err := NewGRPCPolicyAuthorizer(tc.config)
			if tc.wantError != (err != nil) {
				t.Fatalf("expected error: %t, but error was: %s", tc.wantError, err)
			}
		})
	}
}

func TestGRPCPolicyRegistration(t *testing.T) {
	enabledBool := func() bool { return true }
	config := GRPCPolicyAuthorizerConfig{Enabled: enabledBool}

	tcs := []struct {
		desc               string
		request            any
		policy             PolicyRule
		resourceSerializer PolicyResourceSerializer

		wantMap   map[string]gRPCEndpointAuthzConfig
		wantError bool
	}{
		{
			desc:               "works with nil resource serializer",
			request:            mockRequestType{},
			policy:             PolicyTestPolicy,
			resourceSerializer: nil,

			wantMap:   map[string]gRPCEndpointAuthzConfig{"auth.mockRequestType": {policyName: PolicyTestPolicy}},
			wantError: false,
		},
		{
			desc:               "no-op with nil request",
			request:            nil,
			policy:             PolicyTestPolicy,
			resourceSerializer: nil,

			wantMap:   map[string]gRPCEndpointAuthzConfig{},
			wantError: true,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			authorizer, _ := NewGRPCPolicyAuthorizer(config)
			err := authorizer.RegisterGRPCRequest(tc.request, tc.policy, tc.resourceSerializer)
			if tc.wantError != (err != nil) {
				t.Fatalf("expected error: %t, but error was: %s", tc.wantError, err)
			}
			testutils.MustMatch(t, tc.wantMap, authorizer.requestTypeToAuthzConfig)
		})
	}
}

func TestGRPCPolicyAuthorize(t *testing.T) {
	authorizer := &GRPCPolicyAuthorizer{
		requestTypeToAuthzConfig: map[string]gRPCEndpointAuthzConfig{},
	}
	_ = authorizer.RegisterGRPCRequest(mockRequestType{}, PolicyTestPolicy, nil)
	_ = authorizer.RegisterGRPCRequest(&mockRequestTypeAsPointer{}, PolicyTestPolicy, nil)
	_ = authorizer.RegisterGRPCRequest(mockRequestTypeWithSerializer{}, PolicyTestPolicy, &mockSerializer{})
	_ = authorizer.RegisterGRPCRequest(mockRequestTypeWithFailedSerializer{}, PolicyTestPolicy, &mockFailedSerializer{})

	tcs := []struct {
		desc             string
		configEnabled    bool
		request          any
		mockPolicyClient *mockPolicyClient

		wantError              bool
		wantErrorStatusCode    codes.Code
		wantPolicyQueried      bool
		wantPolicyName         PolicyRule
		wantPolicyResourceData any
	}{
		{
			desc:          "no error if authorizer disabled",
			configEnabled: false,
			request:       nil,

			wantError: false,
		},
		{
			desc:          "no error if request is unmapped",
			configEnabled: true,
			request:       mockRequestTypeNotMapped{},

			wantError: false,
		},
		{
			desc:          "internal error if request is nil",
			configEnabled: true,
			request:       nil,

			wantError:           true,
			wantErrorStatusCode: codes.Internal,
		},
		{
			desc:          "internal error if serializer fails",
			configEnabled: true,
			request:       mockRequestTypeWithFailedSerializer{},

			wantError:           true,
			wantErrorStatusCode: codes.Internal,
		},
		{
			desc:          "internal error if policy client fails",
			configEnabled: true,
			request:       mockRequestType{},
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     errors.New("something bad"),
			},

			wantError:           true,
			wantErrorStatusCode: codes.Internal,
		},
		{
			desc:          "permission denied if policy client forbids",
			configEnabled: true,
			request:       mockRequestType{},
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     nil,
			},

			wantError:           true,
			wantErrorStatusCode: codes.PermissionDenied,
			wantPolicyQueried:   true,
			wantPolicyName:      PolicyTestPolicy,
		},
		{
			desc:          "successful with no serializer",
			configEnabled: true,
			request:       mockRequestType{},
			mockPolicyClient: &mockPolicyClient{
				allowedResult: true,
				errResult:     nil,
			},

			wantError:         false,
			wantPolicyQueried: true,
			wantPolicyName:    PolicyTestPolicy,
		},
		{
			desc:          "successful with no serializer as request pointer",
			configEnabled: true,
			request:       &mockRequestTypeAsPointer{},
			mockPolicyClient: &mockPolicyClient{
				allowedResult: true,
				errResult:     nil,
			},

			wantError:         false,
			wantPolicyQueried: true,
			wantPolicyName:    PolicyTestPolicy,
		},
		{
			desc:          "successful with serializer",
			configEnabled: true,
			request:       mockRequestTypeWithSerializer{},
			mockPolicyClient: &mockPolicyClient{
				allowedResult: true,
				errResult:     nil,
			},

			wantError:              false,
			wantPolicyQueried:      true,
			wantPolicyName:         PolicyTestPolicy,
			wantPolicyResourceData: mockResourceData,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			authorizer.enabled = func() bool { return tc.configEnabled }
			authorizer.policyClient = tc.mockPolicyClient

			err := authorizer.authorize(context.Background(), tc.request)
			if (err != nil) != tc.wantError {
				t.Fatal("expected error, but got nil")
			}
			if tc.wantError {
				testutils.MustMatch(t, status.Code(err), tc.wantErrorStatusCode)
			}
			if tc.wantPolicyQueried {
				testutils.MustMatch(t, tc.mockPolicyClient.lastPolicy, string(tc.wantPolicyName))
				testutils.MustMatch(t, tc.mockPolicyClient.lastResource, tc.wantPolicyResourceData)
			}
		})
	}
}

type mockGrpcHandler struct {
	gotRequest any
}

func (m *mockGrpcHandler) UnaryHandler(ctx context.Context, req any) (any, error) {
	m.gotRequest = req
	return nil, nil
}
func (m *mockGrpcHandler) StreamHandler(srv any, stream grpc.ServerStream) error {
	m.gotRequest = stream
	return nil
}

type mockStreamRequest struct {
	grpc.ServerStream
}

func (m *mockStreamRequest) Context() context.Context {
	return context.Background()
}

func TestGRPCPolicyAuthorizerUnaryInterceptor(t *testing.T) {
	enabled := func() bool { return true }
	authorizer := &GRPCPolicyAuthorizer{
		requestTypeToAuthzConfig: map[string]gRPCEndpointAuthzConfig{},
		enabled:                  enabled,
	}
	mockHandler := &mockGrpcHandler{}
	mockRequest := &mockRequestType{}
	_ = authorizer.RegisterGRPCRequest(mockRequest, PolicyTestPolicy, nil)

	tcs := []struct {
		desc             string
		mockPolicyClient *mockPolicyClient

		wantError bool
	}{
		{
			desc: "expect error when policy authorization fails",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     errors.New("something bad"),
			},

			wantError: true,
		},
		{
			desc: "expect error when policy client forbids",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     nil,
			},

			wantError: true,
		},
		{
			desc: "success",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: true,
				errResult:     nil,
			},

			wantError: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			authorizer.policyClient = tc.mockPolicyClient
			interceptor := authorizer.GRPCUnaryInterceptor()

			_, err := interceptor(context.Background(), mockRequest, nil, mockHandler.UnaryHandler)

			if tc.wantError != (err != nil) {
				t.Fatalf("expected error: %t, but error was: %s", tc.wantError, err)
			}
			if err == nil {
				testutils.MustMatch(t, mockRequest, mockHandler.gotRequest)
			}
		})
	}
}

func TestGRPCPolicyAuthorizerStreamInterceptor(t *testing.T) {
	enabled := func() bool { return true }
	authorizer := &GRPCPolicyAuthorizer{
		requestTypeToAuthzConfig: map[string]gRPCEndpointAuthzConfig{},
		enabled:                  enabled,
	}
	mockHandler := &mockGrpcHandler{}
	mockRequest := &mockStreamRequest{}
	_ = authorizer.RegisterGRPCRequest(mockRequest, PolicyTestPolicy, nil)

	tcs := []struct {
		desc             string
		mockPolicyClient *mockPolicyClient

		wantError bool
	}{
		{
			desc: "expect error when policy authorization fails",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     errors.New("something bad"),
			},

			wantError: true,
		},
		{
			desc: "expect error when policy client forbids",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: false,
				errResult:     nil,
			},

			wantError: true,
		},
		{
			desc: "success",
			mockPolicyClient: &mockPolicyClient{
				allowedResult: true,
				errResult:     nil,
			},

			wantError: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			authorizer.policyClient = tc.mockPolicyClient
			interceptor := authorizer.GRPCStreamInterceptor()

			err := interceptor(nil, mockRequest, nil, mockHandler.StreamHandler)

			if tc.wantError != (err != nil) {
				t.Fatalf("expected error: %t, but error was: %s", tc.wantError, err)
			}
			if err == nil {
				testutils.MustMatch(t, mockRequest, mockHandler.gotRequest)
			}
		})
	}
}

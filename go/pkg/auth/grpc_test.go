package auth

import (
	"context"
	"errors"
	"fmt"
	"testing"

	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/testutils"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	goodMethod = "good/method"
)

func assertValidateTokenFunc(t *testing.T, returnScope string, err error) func(context.Context, Config, string) (*CustomClaims, error) {
	t.Helper()
	return func(ctx context.Context, config Config, token string) (*CustomClaims, error) {
		return &CustomClaims{Scope: returnScope}, err
	}
}

func grpcStreamHandler(srv any, stream grpc.ServerStream) error {
	return nil
}

type mockServerStream struct {
	grpc.ServerStream

	ctx context.Context
}

func (s mockServerStream) Context() context.Context {
	return s.ctx
}

func TestValid(t *testing.T) {
	tcs := []struct {
		Desc           string
		GRPCAuthConfig Config

		ExpectedErr error
	}{
		{
			Desc: "Base case",
			GRPCAuthConfig: Config{
				AuthorizationDisabled: false,
				IssuerURL:             "anything",
				Audience:              "anything",
			},
			ExpectedErr: nil,
		},
		{
			Desc: "works (several audiences with AllowMultipleAudiences set to true)",
			GRPCAuthConfig: Config{
				AuthorizationDisabled:  false,
				IssuerURL:              "anything",
				Audience:               "one,two,three",
				AllowMultipleAudiences: true,
			},
		},
		{
			Desc: "Empty Issuer URL",
			GRPCAuthConfig: Config{
				AuthorizationDisabled: false,
				IssuerURL:             "",
				Audience:              "anything",
			},
			ExpectedErr: fmt.Errorf("issuer url cannot be empty if authorization is enabled"),
		},
		{
			Desc: "Empty Audience",
			GRPCAuthConfig: Config{
				AuthorizationDisabled: false,
				IssuerURL:             "anything",
				Audience:              "",
			},
			ExpectedErr: fmt.Errorf("audience cannot be empty if authorization is enabled"),
		},
		{
			Desc: "Several Audiences with AllowMultipleAudiences set to false",
			GRPCAuthConfig: Config{
				AuthorizationDisabled:  false,
				IssuerURL:              "anything",
				Audience:               "one,two,three",
				AllowMultipleAudiences: false,
			},
			ExpectedErr: fmt.Errorf("use of multiple audiences is not allowed"),
		},
		{
			Desc: "Authorization disabled",
			GRPCAuthConfig: Config{
				AuthorizationDisabled: true,
				IssuerURL:             "",
				Audience:              "",
			},
			ExpectedErr: nil,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			err := tc.GRPCAuthConfig.Validate()
			testutils.MustMatch(t, err, tc.ExpectedErr, "expected error and actual error mismatch")
		})
	}
}

func TestNewMethodPermissions(t *testing.T) {
	descriptor := examplepb.File_example_service_proto.Services().ByName("ExampleService")
	mp := NewMethodPermissions([]protoreflect.ServiceDescriptor{descriptor}, Config{})

	expectedPerms := map[string]permission{
		"/example.ExampleService/GetVersion": {
			allowedScopes: map[string]bool{
				"read:version:all": true,
			},
		},
		"/grpc.health.v1.Health/Check": {
			public: true,
		},
		"/grpc.health.v1.Health/Watch": {
			public: true,
		},
		"/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo": {
			public: true,
		},
	}

	testutils.MustMatch(t, expectedPerms, mp.perms, "permissions don't match")
}

func TestCheckAuth(t *testing.T) {
	perms := MethodPermissions{
		perms: map[string]permission{
			goodMethod:    {allowedScopes: map[string]bool{"good:perm": true}},
			"unprotected": unprotectedPermission,
			"public":      publicPermission,
		},
	}
	canceledContext, cancelFunc := context.WithCancel(context.Background())
	cancelFunc()
	contextWithEmptyMetadata := metadata.NewIncomingContext(context.Background(), metadata.MD{})
	contextWithBadTokenFormat := metadata.NewIncomingContext(context.Background(), metadata.Pairs(grpcAuthHeaderKey, "badtoken"))
	contextWithToken := metadata.NewIncomingContext(context.Background(), metadata.Pairs(grpcAuthHeaderKey, "Bearer faketoken"))

	tcs := []struct {
		Desc           string
		FullMethodName string
		Scope          string
		AuthDisabled   bool
		Context        context.Context
		HasValidateErr bool

		HasErr                    bool
		ErrCode                   codes.Code
		HandlerCtxHasCustomClaims bool
	}{
		{
			Desc:           "Base case",
			FullMethodName: goodMethod,
			Scope:          "good:perm",
			Context:        contextWithToken,

			HasErr:                    false,
			HandlerCtxHasCustomClaims: true,
		},
		{
			Desc:           "Base case without token",
			FullMethodName: goodMethod,
			Scope:          "good:perm",
			Context:        contextWithEmptyMetadata,

			HasErr:  true,
			ErrCode: codes.Unauthenticated,
		},
		{
			Desc:           "Validation error",
			FullMethodName: goodMethod,
			Scope:          "good:perm",
			Context:        contextWithToken,
			HasValidateErr: true,

			HasErr:  true,
			ErrCode: codes.Unauthenticated,
		},
		{
			Desc:           "Multiple scopes",
			FullMethodName: goodMethod,
			Scope:          "good:perm ignored:perm",
			Context:        contextWithToken,

			HasErr:                    false,
			HandlerCtxHasCustomClaims: true,
		},
		{
			Desc:           "Unprotected method allowed with bad token format",
			FullMethodName: "unprotected",
			Context:        contextWithBadTokenFormat,

			HasErr:  true,
			ErrCode: codes.Unauthenticated,
		},
		{
			Desc:           "Unprotected method, no scope",
			FullMethodName: "unprotected",
			Context:        contextWithToken,

			HasErr:                    false,
			HandlerCtxHasCustomClaims: true,
		},
		{
			Desc:           "Unprotected method, no scope, no token",
			FullMethodName: "unprotected",
			Context:        contextWithEmptyMetadata,

			HasErr:  true,
			ErrCode: codes.Unauthenticated,
		},
		{
			Desc:           "Unprotected method, with scope",
			FullMethodName: "unprotected",
			Scope:          "ignored:perm",
			Context:        contextWithToken,

			HasErr:                    false,
			HandlerCtxHasCustomClaims: true,
		},
		{
			Desc:           "Unprotected method, with scope, no token",
			FullMethodName: "unprotected",
			Scope:          "ignored:perm",
			Context:        contextWithEmptyMetadata,

			HasErr:  true,
			ErrCode: codes.Unauthenticated,
		},
		{
			Desc:           "Unknown method name",
			FullMethodName: "unknown",
			Context:        contextWithToken,

			HasErr:  true,
			ErrCode: codes.PermissionDenied,
		},
		{
			Desc:           "Empty scope",
			FullMethodName: goodMethod,
			Scope:          "",
			Context:        contextWithToken,

			HasErr:  true,
			ErrCode: codes.PermissionDenied,
		},
		{
			Desc:           "Incorrect scope",
			FullMethodName: goodMethod,
			Scope:          "wrong:perm",
			Context:        contextWithToken,

			HasErr:  true,
			ErrCode: codes.PermissionDenied,
		},
		{
			Desc:           "Canceled context",
			FullMethodName: goodMethod,
			Scope:          "good:perm",
			Context:        canceledContext,

			HasErr:  true,
			ErrCode: codes.PermissionDenied,
		},
		{
			Desc:           "Public method allowed",
			FullMethodName: "public",
			Context:        contextWithEmptyMetadata,

			HasErr: false,
		},
		{
			Desc:           "Public method allowed, with token",
			FullMethodName: "public",
			Context:        contextWithToken,

			HasErr: false,
		},
		{
			Desc:         "Authorization disabled",
			AuthDisabled: true,
			Context:      contextWithEmptyMetadata,

			HasErr: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var validateErr error
			if tc.HasValidateErr {
				validateErr = errors.New("validation error")
			}
			perms.validateToken = assertValidateTokenFunc(t, tc.Scope, validateErr)
			perms.config = Config{AuthorizationDisabled: tc.AuthDisabled}

			grpcUnaryHandler := func(ctx context.Context, _ any) (any, error) {
				_, hasCustomClaims := CustomClaimsFromContext(ctx)

				testutils.MustMatch(t, tc.HandlerCtxHasCustomClaims, hasCustomClaims, "CustomClaims presence error")

				return nil, nil
			}

			_, unaryErr := perms.GRPCUnaryInterceptor()(
				tc.Context,
				nil,
				&grpc.UnaryServerInfo{
					FullMethod: tc.FullMethodName,
				},
				grpcUnaryHandler)
			if tc.HasErr != (unaryErr != nil) {
				t.Errorf("Bad err: %+v\nTest Case: %+v", unaryErr, tc)
			}

			if tc.HasErr && tc.ErrCode != status.Code(unaryErr) {
				t.Errorf("ErrCode: %+v\nTest Case: %+v", status.Code(unaryErr), tc)
			}

			streamErr := perms.GRPCStreamInterceptor()(nil, mockServerStream{ctx: tc.Context}, &grpc.StreamServerInfo{
				FullMethod: tc.FullMethodName,
			}, grpcStreamHandler)
			testutils.MustMatch(t, unaryErr, streamErr, "unary and stream errors do not match")
		})
	}
}

func TestCopyCreds_GetRequestMetadata(t *testing.T) {
	createCtx := func(values map[string]string) context.Context {
		meta := metadata.MD{}
		for k, v := range values {
			meta.Append(k, v)
		}
		return metadata.NewIncomingContext(context.Background(), meta)
	}

	tcs := []struct {
		Description          string
		Ctx                  context.Context
		RequireIncomingCreds bool

		ExpectedErr   error
		ExpectedCreds string
	}{
		{
			Description:          "Require incoming creds, base case",
			Ctx:                  createCtx(map[string]string{grpcAuthHeaderKey: "secret creds"}),
			RequireIncomingCreds: true,
			ExpectedCreds:        "secret creds",
		},
		{
			Description:          "Require incoming creds, no metadata",
			Ctx:                  context.Background(),
			RequireIncomingCreds: true,
			ExpectedErr:          ErrNoMetadataFoundInContext,
		},
		{
			Description:          "Require incoming creds, no authorization key",
			Ctx:                  createCtx(map[string]string{}),
			RequireIncomingCreds: true,
			ExpectedErr:          ErrNoAuthKeyOnMetadata,
		},

		{
			Description:          "No require incoming creds, base case",
			Ctx:                  createCtx(map[string]string{grpcAuthHeaderKey: "secret creds"}),
			RequireIncomingCreds: false,
			ExpectedCreds:        "secret creds",
		},
		{
			Description:          "No require incoming creds, no metadata",
			Ctx:                  context.Background(),
			RequireIncomingCreds: false,
		},
		{
			Description:          "No require incoming creds, no authorization key",
			Ctx:                  createCtx(map[string]string{}),
			RequireIncomingCreds: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			copyCreds := GRPCCopyCredentials{
				RequireIncomingCredentials: tc.RequireIncomingCreds,
			}
			meta, err := copyCreds.GetRequestMetadata(tc.Ctx, "")
			testutils.MustMatch(t, tc.ExpectedErr, err, "not expected error")

			var creds string
			if meta != nil {
				creds = meta[grpcAuthHeaderKey]
			}
			testutils.MustMatch(t, tc.ExpectedCreds, creds, "credentials don't match")

			testutils.MustMatch(t, false, copyCreds.RequireTransportSecurity(), "should never require transport security")
		})
	}
}

type mockValuer string

func (v mockValuer) AuthorizationValue() string {
	return string(v)
}

func TestAddCreds(t *testing.T) {
	c := GRPCAddCredentials{
		Token: mockValuer("fake token"),
	}

	meta, err := c.GetRequestMetadata(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, map[string]string{
		grpcAuthHeaderKey: "fake token",
	}, meta, "metadata doesn't match")

	testutils.MustMatch(t, false, c.RequireTransportSecurity(), "RequireTransportSecurity doesn't match")
}

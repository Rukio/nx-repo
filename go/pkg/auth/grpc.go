package auth

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	authpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common/auth"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	grpcAuthHeaderKey             = "authorization"
	grpcReflectionFullMethodName  = "/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo"
	grpcHealthCheckFullMethodName = "/grpc.health.v1.Health/Check"
	grpcHealthWatchFullMethodName = "/grpc.health.v1.Health/Watch"
)

var (
	unprotectedPermission = permission{unprotected: true}
	publicPermission      = permission{public: true}

	ErrNoMetadataFoundInContext = errors.New("no metadata found in incoming context")
	ErrNoAuthKeyOnMetadata      = errors.New("no authorization info found in metadata")

	grpcAuthHeaderFormatRE = regexp.MustCompile("^Bearer (.*)$")
)

type permission struct {
	/*
		A flag for indicating that the method has no scope or permission
		definitions, but that it requires a valid jwt token.
	*/
	unprotected bool
	/*
		A flag for indicating that the method is public and that it does not
		require a jwt token or explicit scopes or permissions.
	*/
	public bool
	/*
		A map of the required scopes or permissions a user must have in order to
		request this method.
	*/
	allowedScopes map[string]bool
}

func (p permission) IsAllowed(c *CustomClaims) bool {
	tokenScopes := strings.Split(c.Scope, " ")
	tokenScopeSet := make(map[string]bool)
	for _, key := range tokenScopes {
		tokenScopeSet[key] = true
	}
	for allowedScope := range p.allowedScopes {
		if tokenScopeSet[allowedScope] {
			return true
		}
	}
	return false
}

type MethodPermissions struct {
	perms         map[string]permission
	config        Config
	validateToken func(ctx context.Context, config Config, token string) (*CustomClaims, error)
}

func NewMethodPermissions(serviceDescriptors []protoreflect.ServiceDescriptor, config Config) MethodPermissions {
	requiredPermissions := MethodPermissions{
		perms: map[string]permission{
			grpcReflectionFullMethodName:  publicPermission,
			grpcHealthCheckFullMethodName: publicPermission,
			grpcHealthWatchFullMethodName: publicPermission,
		},
		config:        config,
		validateToken: validateToken,
	}

	for _, serviceDescriptor := range serviceDescriptors {
		svcName := string(serviceDescriptor.FullName())
		methods := serviceDescriptor.Methods()

		for i := 0; i < methods.Len(); i++ {
			method := methods.Get(i)
			methodDescriptor := method.Options()
			methodName := method.Name()

			isMethodPublic, _ := proto.GetExtension(methodDescriptor, authpb.E_Public).(bool)
			rule, _ := proto.GetExtension(methodDescriptor, authpb.E_Rule).(*authpb.AuthorizationRule)

			permission := unprotectedPermission
			permission.public = isMethodPublic
			if rule != nil {
				permission.unprotected = false
				permission.allowedScopes = map[string]bool{
					*rule.JwtPermission: true,
				}
			}
			fullMethodName := fmt.Sprintf("/%s/%s", svcName, methodName)
			requiredPermissions.perms[fullMethodName] = permission
		}
	}

	return requiredPermissions
}

func (p MethodPermissions) checkAuth(
	ctx context.Context,
	fullMethodName string,
) (*CustomClaims, error) {
	if p.config.AuthorizationDisabled {
		return nil, nil
	}

	// Obtain required scopes from proto definition. The gRPC call must include at least one
	// of these scopes to be authorized.
	perm, ok := p.perms[fullMethodName]
	if !ok {
		return nil, status.Error(codes.PermissionDenied, "unknown method")
	}

	if perm.public {
		return nil, nil
	}

	meta, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.PermissionDenied, "error obtaining incoming context")
	}

	// Check if authorization header is set.
	authValues := meta[grpcAuthHeaderKey]
	if len(authValues) == 0 {
		return nil, status.Error(codes.Unauthenticated, "no authorization header included")
	}

	// Check to see if authorization token from the authorization header is valid.
	authValueParts := grpcAuthHeaderFormatRE.FindStringSubmatch(authValues[0])
	if len(authValueParts) != 2 {
		return nil, status.Error(codes.Unauthenticated, "bad authorization header format")
	}

	accessToken := authValueParts[1]
	customClaims, err := p.validateToken(ctx, p.config, accessToken)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "validation error: %s", err)
	}

	// If authorization token is valid, check the scopes from the token to make sure caller's scope includes one of the allowed scopes.
	if !perm.unprotected && !perm.IsAllowed(customClaims) {
		return nil, status.Error(codes.PermissionDenied, "signed token does not have required scopes")
	}

	return customClaims, nil
}

// GRPCUnaryInterceptor returns gRPC interceptors to enforce authentication for unary gRPC calls.
func (p MethodPermissions) GRPCUnaryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		customClaims, err := p.checkAuth(ctx, info.FullMethod)
		if err != nil {
			return nil, err
		}

		handlerCtx := ctx

		if customClaims != nil {
			handlerCtx = addCustomClaims(handlerCtx, customClaims)
		}

		return handler(handlerCtx, req)
	}
}

// GRPCStreamInterceptor returns gRPC interceptors to enforce authentication for streamed gRPC calls.
func (p MethodPermissions) GRPCStreamInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		ctx := stream.Context()
		_, err := p.checkAuth(ctx, info.FullMethod)
		if err != nil {
			return err
		}

		return handler(srv, stream)
	}
}

// GRPCCopyCredentials supplies PerRPCCredentials from the incoming GRPC auth header.
type GRPCCopyCredentials struct {
	RequireIncomingCredentials bool
}

var _ credentials.PerRPCCredentials = GRPCCopyCredentials{}

func (c GRPCCopyCredentials) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	type copyCredentialErrors struct {
		noMetadata error
		noAuthKey  error
	}

	var errors copyCredentialErrors
	if c.RequireIncomingCredentials {
		errors = copyCredentialErrors{
			noMetadata: ErrNoMetadataFoundInContext,
			noAuthKey:  ErrNoAuthKeyOnMetadata,
		}
	}

	meta, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.noMetadata
	}

	authValues, ok := meta[grpcAuthHeaderKey]
	if !ok || len(authValues) < 1 {
		return nil, errors.noAuthKey
	}

	return map[string]string{
		grpcAuthHeaderKey: authValues[0],
	}, nil
}

func (c GRPCCopyCredentials) RequireTransportSecurity() bool {
	return false
}

// GRPCAddCredentials supplies PerRPCCredentials from an auth.Valuer token.
type GRPCAddCredentials struct {
	Token Valuer
}

func (c *GRPCAddCredentials) GetRequestMetadata(_ context.Context, _ ...string) (map[string]string, error) {
	return map[string]string{
		grpcAuthHeaderKey: c.Token.AuthorizationValue(),
	}, nil
}

func (c *GRPCAddCredentials) RequireTransportSecurity() bool {
	return false
}

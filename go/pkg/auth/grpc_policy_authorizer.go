package auth

import (
	"context"
	"errors"
	"reflect"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type PolicyActorConfigurator interface {
	ConfigurePolicyActor(ctx context.Context) error
}

type GRPCPolicyAuthorizer struct {
	enabled                  func() bool
	policyClient             Allowable
	requestTypeToAuthzConfig map[string]gRPCEndpointAuthzConfig
	policyActorConfigurator  PolicyActorConfigurator
}

type GRPCPolicyAuthorizerConfig struct {
	PolicyServiceBaseURL    string
	Enabled                 func() bool
	Logger                  *zap.SugaredLogger
	PolicyActorConfigurator PolicyActorConfigurator
}

type PolicyResourceSerializer interface {
	SerializePolicyResource(ctx context.Context, req any) (any, error)
}

type gRPCEndpointAuthzConfig struct {
	policyName               PolicyRule
	policyResourceSerializer PolicyResourceSerializer
}

func NewGRPCPolicyAuthorizer(config GRPCPolicyAuthorizerConfig) (*GRPCPolicyAuthorizer, error) {
	if config.Enabled == nil {
		return nil, errors.New("GRPCPolicyAuthorizer configuration error: enabled flag is required")
	}

	return &GRPCPolicyAuthorizer{
		enabled:                  config.Enabled,
		policyClient:             NewPolicyClient(&PolicyClientConfig{Host: config.PolicyServiceBaseURL, Logger: config.Logger}),
		requestTypeToAuthzConfig: make(map[string]gRPCEndpointAuthzConfig),
		policyActorConfigurator:  config.PolicyActorConfigurator,
	}, nil
}

func (g *GRPCPolicyAuthorizer) RegisterGRPCRequest(req any, policy PolicyRule, resourceSerializer PolicyResourceSerializer) error {
	if req == nil {
		return errors.New("GRPCPolicyAuthorizer cannot register nil request")
	}

	requestType := endpointKey(req)

	g.requestTypeToAuthzConfig[requestType] = gRPCEndpointAuthzConfig{
		policyName:               policy,
		policyResourceSerializer: resourceSerializer,
	}

	return nil
}

func (g *GRPCPolicyAuthorizer) configFor(request any) *gRPCEndpointAuthzConfig {
	requestType := endpointKey(request)
	config, ok := g.requestTypeToAuthzConfig[requestType]
	if !ok {
		return nil
	}
	return &config
}

func (g *GRPCPolicyAuthorizer) authorize(ctx context.Context, req any) error {
	if !g.enabled() {
		return nil
	}

	if req == nil {
		return status.Error(codes.Internal, "GRPCPolicyAuthorizer req must not be nil")
	}

	authConfig := g.configFor(req)
	if authConfig == nil {
		return nil // Policy is not enforced for endpoint
	}

	if g.policyActorConfigurator != nil {
		err := g.policyActorConfigurator.ConfigurePolicyActor(ctx)
		if err != nil {
			return status.Errorf(codes.Internal, "GRPCPolicyAuthorizer actor configuration failed: %s", err)
		}
	}

	var resource any
	var err error
	if authConfig.policyResourceSerializer != nil {
		resource, err = authConfig.policyResourceSerializer.SerializePolicyResource(ctx, req)
		if err != nil {
			return status.Errorf(codes.Internal, "GRPCPolicyAuthorizer serialization failed: %s", err)
		}
	}

	allowed, err := g.policyClient.Allowed(ctx, string(authConfig.policyName), resource)
	if err != nil {
		return status.Errorf(codes.Internal, "GRPCPolicyAuthorizer policy client failed: %s", err)
	}
	if !allowed {
		return status.Error(codes.PermissionDenied, "permission denied: failed policy check")
	}

	return nil
}

func (g *GRPCPolicyAuthorizer) GRPCUnaryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if err := g.authorize(ctx, req); err != nil {
			return nil, err
		}

		return handler(ctx, req)
	}
}

func (g *GRPCPolicyAuthorizer) GRPCStreamInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		ctx := stream.Context()
		if err := g.authorize(ctx, stream); err != nil {
			return err
		}

		return handler(srv, stream)
	}
}

func endpointKey(req any) string {
	return reflect.TypeOf(req).String()
}

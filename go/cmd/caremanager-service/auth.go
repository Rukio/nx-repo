package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	authpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common/auth"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"

	"golang.org/x/exp/slices"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

type CareManagerRoleInterceptor struct {
	careManagerUserRole string
	userServiceClient   userpb.UserServiceClient

	methods map[string]*authpb.AuthorizationRule
}

type CareManagerRoleInterceptorParams struct {
	careManagerUserRole string
	serviceDescriptors  []protoreflect.ServiceDescriptor
	userServiceClient   userpb.UserServiceClient
}

func NewCareManagerRoleInterceptor(params *CareManagerRoleInterceptorParams) *CareManagerRoleInterceptor {
	methods := map[string]*authpb.AuthorizationRule{}
	for _, serviceDescriptor := range params.serviceDescriptors {
		grpcMethods := serviceDescriptor.Methods()
		for i := 0; i < grpcMethods.Len(); i++ {
			methodDescriptor := grpcMethods.Get(i)
			methodName := baseserv.GrpcFullMethodStringFromProtoQualifiedName(string(methodDescriptor.FullName()))
			descriptor := methodDescriptor.Options()
			authRule, _ := proto.GetExtension(descriptor, authpb.E_Rule).(*authpb.AuthorizationRule)

			methods[methodName] = authRule
		}
	}

	return &CareManagerRoleInterceptor{
		careManagerUserRole: params.careManagerUserRole,
		userServiceClient:   params.userServiceClient,

		methods: methods,
	}
}

func (ri *CareManagerRoleInterceptor) Handle(
	ctx context.Context,
	req any,
	info *grpc.UnaryServerInfo,
	handler grpc.UnaryHandler,
) (any, error) {
	rule, ok := ri.methods[info.FullMethod]
	if !ok {
		return handler(ctx, req)
	}

	// TODO (AC-1412): Separate logical server for the external and internal CareManager API.
	// If an auth rule is present in the method's proto,
	// the Caremanager role will not be enforced and the auth middleware should handle it.
	if rule != nil {
		return handler(ctx, req)
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("no metadata in context")
	}

	authHeader := md.Get("authorization")
	if len(authHeader) == 0 || authHeader[0] == "" {
		return nil, errors.New("missing authorization header in metadata")
	}

	outgoingCtx := metadata.NewOutgoingContext(
		ctx,
		metadata.Pairs("authorization", authHeader[0]),
	)
	roles, err := ri.userServiceClient.GetAuthenticatedUserRoles(
		outgoingCtx,
		&userpb.GetAuthenticatedUserRolesRequest{},
	)
	if err != nil {
		return nil, err
	}

	userRoles := make([]string, len(roles.Roles))
	for i, role := range roles.Roles {
		userRoles[i] = role.Name
	}

	if slices.Contains(userRoles, ri.careManagerUserRole) {
		return handler(ctx, req)
	}

	return nil, fmt.Errorf("required role '%s' not present", ri.careManagerUserRole)
}

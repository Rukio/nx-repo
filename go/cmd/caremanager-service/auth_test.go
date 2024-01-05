package main

import (
	"context"
	"errors"
	"testing"

	authpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common/auth"
	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/reflect/protoreflect"
)

func TestCareManagerRoleInterceptorHandle(t *testing.T) {
	permission := "read:version:all"

	type args struct {
		ctx               context.Context
		methods           map[string]*authpb.AuthorizationRule
		userServiceClient userpb.UserServiceClient
		serverInfo        *grpc.UnaryServerInfo
	}
	tcs := []struct {
		name string
		args args

		wantHandlerCalled bool
		wantErr           string
	}{
		{
			name: "works - base case",
			args: args{
				ctx: metadata.NewIncomingContext(
					context.Background(),
					metadata.Pairs("authorization", "Bearer faketoken"),
				),
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.CareManagerService/GetEpisodes",
				},
				userServiceClient: &MockUserServiceClient{
					GetAuthenticatedUserRolesResult: &userpb.GetAuthenticatedUserRolesResponse{
						Roles: []*userpb.Role{
							{
								Id:   1,
								Name: "caremanager",
							},
						},
					},
				},
			},

			wantHandlerCalled: true,
		},
		{
			name: "works - executes handler without checking roles if method is not present in methods map",
			args: args{
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.HealthCheckService/Check",
				},
			},

			wantHandlerCalled: true,
		},
		{
			name: "works - executes handler without checking roles if the method contains an auth rule",
			args: args{
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": {JwtPermission: &permission},
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.HealthCheckService/Check",
				},
			},

			wantHandlerCalled: true,
		},
		{
			name: "fails - user does not have the correct role",
			args: args{
				ctx: metadata.NewIncomingContext(
					context.Background(),
					metadata.Pairs("authorization", "Bearer faketoken"),
				),
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.CareManagerService/GetEpisodes",
				},
				userServiceClient: &MockUserServiceClient{
					GetAuthenticatedUserRolesResult: &userpb.GetAuthenticatedUserRolesResponse{
						Roles: []*userpb.Role{
							{
								Id:   1,
								Name: "admin",
							},
						},
					},
				},
			},
			wantErr: "required role 'caremanager' not present",
		},
		{
			name: "fails - no metadata in context",
			args: args{
				ctx: context.Background(),
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.CareManagerService/GetEpisodes",
				},
			},

			wantErr: "no metadata in context",
		},
		{
			name: "fails - no authorization header in metadata",
			args: args{
				ctx: metadata.NewIncomingContext(
					context.Background(),
					metadata.Pairs("authorization", ""),
				),
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.CareManagerService/GetEpisodes",
				},
			},

			wantErr: "missing authorization header in metadata",
		},
		{
			name: "fails - call to userService errors",
			args: args{
				ctx: metadata.NewIncomingContext(
					context.Background(),
					metadata.Pairs("authorization", "Bearer faketoken"),
				),
				methods: map[string]*authpb.AuthorizationRule{
					"/caremanager.CareManagerService/GetEpisodes": nil,
				},
				serverInfo: &grpc.UnaryServerInfo{
					FullMethod: "/caremanager.CareManagerService/GetEpisodes",
				},
				userServiceClient: &MockUserServiceClient{
					GetAuthenticatedUserRolesErr: errors.New("service error"),
				},
			},

			wantErr: "service error",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			var handlerFunc = func(ctx context.Context, req any) (any, error) {
				testutils.MustMatch(t, true, tc.wantHandlerCalled, "handler should have been called")
				return "", nil
			}

			interceptor := &CareManagerRoleInterceptor{
				careManagerUserRole: "caremanager",
				methods:             tc.args.methods,
				userServiceClient:   tc.args.userServiceClient,
			}

			_, err := interceptor.Handle(tc.args.ctx, "", tc.args.serverInfo, handlerFunc)

			if tc.wantErr != "" {
				testutils.MustMatch(t, tc.wantErr, err.Error(), "errors don't match")
			} else if err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestNewCareManagerRoleInterceptor(t *testing.T) {
	permission := "read:version:all"
	tcs := []struct {
		name string
		args *CareManagerRoleInterceptorParams

		want *CareManagerRoleInterceptor
	}{
		{
			name: "works",
			args: &CareManagerRoleInterceptorParams{
				careManagerUserRole: "caremanager",
				serviceDescriptors: []protoreflect.ServiceDescriptor{
					examplepb.File_example_service_proto.Services().ByName("ExampleService"),
				},
				userServiceClient: &MockUserServiceClient{},
			},

			want: &CareManagerRoleInterceptor{
				careManagerUserRole: "caremanager",
				methods: map[string]*authpb.AuthorizationRule{"/example.ExampleService/GetVersion": {
					JwtPermission: &permission,
				}},
				userServiceClient: &MockUserServiceClient{},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			interceptor := NewCareManagerRoleInterceptor(tc.args)

			testutils.MustMatchFn(".state")(t, tc.want, interceptor, "Interceptor instances don't match")
		})
	}
}

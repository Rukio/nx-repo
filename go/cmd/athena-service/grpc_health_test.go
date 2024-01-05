package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/healthcheck"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

type mockAuditServer struct {
	auditpb.UnimplementedAuditServiceServer
}

func dialer() func(context.Context, string) (net.Conn, error) {
	listener := bufconn.Listen(1024 * 1024)
	server := grpc.NewServer()
	auditpb.RegisterAuditServiceServer(server, &mockAuditServer{})

	go func() {
		if err := server.Serve(listener); err != nil {
			log.Fatal(err)
		}
	}()

	return func(ctx context.Context, s string) (net.Conn, error) {
		return listener.Dial()
	}
}

type mockServerTransportStream struct{}

func (m *mockServerTransportStream) Method() string {
	return "foo"
}

func (m *mockServerTransportStream) SetHeader(md metadata.MD) error {
	return nil
}

func (m *mockServerTransportStream) SendHeader(md metadata.MD) error {
	return nil
}

func (m *mockServerTransportStream) SetTrailer(md metadata.MD) error {
	return nil
}

func TestHealthCheckServerCheck(t *testing.T) {
	goodAthenaServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, req *http.Request) {
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`{"pong": "true"}`))
		},
	))
	defer goodAthenaServer.Close()
	badAthenaServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, req *http.Request) {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(`other response`))
		},
	))
	defer badAthenaServer.Close()

	grpcCtx := grpc.NewContextWithServerTransportStream(context.Background(), &mockServerTransportStream{})

	type globals struct {
		athenaHTTPClient         *http.Client
		athenaURL                string
		auditHealthServiceClient healthpb.HealthClient
		options                  []grpc.DialOption
		ctx                      context.Context
	}

	tests := []struct {
		name    string
		globals globals
		want    *healthpb.HealthCheckResponse
		wantErr bool
	}{
		{
			name: "server is serving",
			globals: globals{
				athenaHTTPClient: goodAthenaServer.Client(),
				athenaURL:        goodAthenaServer.URL,
				auditHealthServiceClient: &healthcheck.MockHealthClient{
					HealthCheckResponse: &healthpb.HealthCheckResponse{
						Status: healthpb.HealthCheckResponse_SERVING,
					},
				},
				ctx: grpcCtx,
				options: []grpc.DialOption{
					grpc.WithContextDialer(dialer()),
				},
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
			wantErr: false,
		},
		{
			name: "server is not serving - athena unavailable",
			globals: globals{
				athenaHTTPClient: badAthenaServer.Client(),
				athenaURL:        badAthenaServer.URL,
				auditHealthServiceClient: &healthcheck.MockHealthClient{
					HealthCheckResponse: &healthpb.HealthCheckResponse{
						Status: healthpb.HealthCheckResponse_SERVING,
					},
				},
				ctx: grpcCtx,
				options: []grpc.DialOption{
					grpc.WithContextDialer(dialer()),
				},
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
			wantErr: false,
		},
		{
			// Even though audit service returned NOT_SERVING, we return serving because we got a response
			name: "server is serving - audit service not serving",
			globals: globals{
				athenaHTTPClient: goodAthenaServer.Client(),
				athenaURL:        goodAthenaServer.URL,
				auditHealthServiceClient: &healthcheck.MockHealthClient{
					HealthCheckResponse: &healthpb.HealthCheckResponse{
						Status: healthpb.HealthCheckResponse_NOT_SERVING,
					},
				},
				ctx: grpcCtx,
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_SERVING,
			},
			wantErr: false,
		},
		{
			name: "server is not serving - audit service error",
			globals: globals{
				athenaHTTPClient: goodAthenaServer.Client(),
				athenaURL:        goodAthenaServer.URL,
				auditHealthServiceClient: &healthcheck.MockHealthClient{
					HealthCheckErr: status.Error(codes.Internal, "it just exploded idk what happened"),
				},
				ctx: context.Background(),
			},
			want: &healthpb.HealthCheckResponse{
				Status: healthpb.HealthCheckResponse_NOT_SERVING,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaClient, _ := athena.NewClient(athena.NewClientParams{
				AuthToken:  mockAuthValuer{},
				BaseURL:    tt.globals.athenaURL,
				PracticeID: "1234",
				HTTPClient: tt.globals.athenaHTTPClient,
			})
			s := &HealthCheckServer{
				AthenaClient:             athenaClient,
				AuditHealthServiceClient: tt.globals.auditHealthServiceClient,
				Logger:                   baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}

			got, err := s.Check(tt.globals.ctx, &healthpb.HealthCheckRequest{})
			if (err != nil) != tt.wantErr {
				t.Errorf("Check() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

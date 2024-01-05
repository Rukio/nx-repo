package redisclient

import (
	"context"
	"errors"
	"reflect"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"google.golang.org/grpc"

	redislib "github.com/redis/go-redis/v9"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type MockAuditServiceClient struct {
	CreateAuditEventResult *auditpb.CreateAuditEventResponse
	CreateAuditEventErr    error
}

func (c *MockAuditServiceClient) CreateAuditEvent(_ context.Context, _ *auditpb.CreateAuditEventRequest, _ ...grpc.CallOption) (*auditpb.CreateAuditEventResponse, error) {
	return c.CreateAuditEventResult, c.CreateAuditEventErr
}

func getTestAuditClient(client *MockAuditServiceClient) *auditpb.AuditServiceClient {
	var testAuditClient *auditpb.AuditServiceClient
	if client != nil {
		var auditClient auditpb.AuditServiceClient = client
		testAuditClient = &auditClient
	}
	return testAuditClient
}

func TestNew(t *testing.T) {
	tcs := []struct {
		desc        string
		inputConfig *Config
		wantClient  *Client
		hasErr      bool
	}{
		{
			desc: "Base case",
			inputConfig: &Config{
				ServiceName: "Test",
				RedisURL:    "redis:localhost:6379",
			},
			wantClient: &Client{
				Client: &redislib.Client{},
				Source: "Test",
			},
		},
		{
			desc: "nil options",
			inputConfig: &Config{
				ServiceName: "Test",
			},
			hasErr: true,
		},
		{
			desc: "Invalid URL",
			inputConfig: &Config{
				ServiceName: "Test",
				RedisURL:    "invalid-url",
			},
			hasErr: true,
		},
	}

	for _, test := range tcs {
		t.Run(test.desc, func(t *testing.T) {
			client, err := New(test.inputConfig)
			if err != nil {
				if test.hasErr {
					return
				}
				t.Fatalf("NewClient hit unexpected error %s with test case %+v", err, test)
			}
			testutils.MustMatch(t, test.wantClient.Source, client.Source, "sources don't match")
			testutils.MustMatch(t, reflect.TypeOf(test.wantClient.Client).String(), reflect.TypeOf(client.Client).String(), "clients don't match")
		})
	}
}

func TestGet(t *testing.T) {
	exampleErr := errors.New("something went wrong")

	tcs := []struct {
		desc        string
		want        string
		wantErr     error
		redisClient *MockRedis
	}{
		{
			desc: "Base case",
			redisClient: &MockRedis{
				mockGetMap: map[string]string{"test": "example"},
			},
			want: "example",
		},
		{
			desc: "Invalid input",
			redisClient: &MockRedis{
				getError: exampleErr,
			},
			wantErr: exampleErr,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			client := &Client{
				Client:      tc.redisClient,
				Source:      "",
				AuditClient: nil,
			}

			res := client.Get(context.Background(), "test")

			if res != nil {
				if tc.want != "" {
					testutils.MustMatch(t, tc.want, res.Val())
				}
				if tc.wantErr != nil {
					testutils.MustMatch(t, tc.wantErr, res.Err())
				}
			}
		})
	}
}

func TestSet(t *testing.T) {
	exampleErr := errors.New("something went wrong")
	tcs := []struct {
		desc        string
		auditEntry  AuditEvent
		redisClient *MockRedis
		setKey      string
		setVal      string
		auditClient *MockAuditServiceClient

		auditServiceError error
		wantErr           error
	}{
		{
			desc:        "Base case",
			redisClient: &MockRedis{},
			auditClient: &MockAuditServiceClient{},
		},
		{
			desc: "Redis error",
			redisClient: &MockRedis{
				setErrorMap: map[string]error{"dirty_bit": errors.New("dirty bit")},
			},
			setKey:      "dirty_bit",
			setVal:      "dirty bit",
			auditClient: &MockAuditServiceClient{},

			wantErr: errors.New("dirty bit"),
		},
		{
			desc:        "Success - nil audit client",
			redisClient: &MockRedis{},

			wantErr: status.Error(codes.Internal, "audit client can not be empty"),
		},
		{
			desc:        "Audit returns error",
			redisClient: &MockRedis{},
			auditClient: &MockAuditServiceClient{
				CreateAuditEventErr: exampleErr,
			},

			wantErr: exampleErr,
		},
	}

	for _, test := range tcs {
		t.Run(test.desc, func(t *testing.T) {
			auditClient := getTestAuditClient(test.auditClient)
			client := &Client{
				Client:      test.redisClient,
				Source:      "Test",
				AuditClient: auditClient,
			}

			res := client.Set(context.Background(), test.setKey, test.setVal, 0)
			if res != nil {
				testutils.MustMatch(t, test.wantErr, res)
			}
		})
	}
}

func TestDel(t *testing.T) {
	exampleErr := errors.New("something went wrong")
	tcs := []struct {
		desc        string
		auditEntry  AuditEvent
		redisClient *MockRedis
		delKey      string
		auditClient *MockAuditServiceClient

		auditServiceError error
		wantErr           error
	}{
		{
			desc:        "Base case",
			redisClient: &MockRedis{},
			auditClient: &MockAuditServiceClient{},
		},
		{
			desc: "Redis error",
			redisClient: &MockRedis{
				delErrorMap: map[string]error{"dirty_bit": errors.New("dirty bit")},
			},
			delKey:      "dirty_bit",
			auditClient: &MockAuditServiceClient{},

			wantErr: errors.New("dirty bit"),
		},
		{
			desc:        "Success - nil audit client",
			redisClient: &MockRedis{},

			wantErr: status.Error(codes.Internal, "audit client can not be empty"),
		},
		{
			desc:        "Audit returns error",
			redisClient: &MockRedis{},
			auditClient: &MockAuditServiceClient{CreateAuditEventErr: exampleErr},

			wantErr: exampleErr,
		},
	}

	for _, test := range tcs {
		t.Run(test.desc, func(t *testing.T) {
			auditClient := getTestAuditClient(test.auditClient)
			client := &Client{
				Client:      test.redisClient,
				Source:      "Test",
				AuditClient: auditClient,
			}

			res := client.Del(context.Background(), test.delKey)
			if res != nil {
				testutils.MustMatch(t, test.wantErr, res)
			}
		})
	}
}

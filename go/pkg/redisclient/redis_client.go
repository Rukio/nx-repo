package redisclient

import (
	"context"
	"encoding/json"
	"time"

	"google.golang.org/grpc/metadata"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"google.golang.org/protobuf/encoding/protojson"

	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	Client      redis.Cmdable
	Source      string
	AuditClient *auditpb.AuditServiceClient
}

type AuditEvent struct {
	Action string
	Name   string
	Object map[string]any
}

type Config struct {
	ServiceName string
	RedisURL    string
	AuditClient *auditpb.AuditServiceClient
}

const Nil = redis.Nil

func New(config *Config) (*Client, error) {
	if config.RedisURL != "" {
		opts, err := redis.ParseURL(config.RedisURL)
		if err != nil {
			return nil, err
		}
		client := redis.NewClient(opts)
		return &Client{
			Client:      client,
			Source:      config.ServiceName,
			AuditClient: config.AuditClient,
		}, nil
	}

	return nil, status.Error(codes.InvalidArgument, "redis config can not be empty")
}

func (r *Client) Get(ctx context.Context, key string) *redis.StringCmd {
	return r.Client.Get(ctx, key)
}

func (r *Client) Set(ctx context.Context, key string, value any, exp time.Duration) error {
	auditEntry := AuditEvent{Action: "SET", Name: key, Object: map[string]any{key: value}}
	err := r.audit(ctx, auditEntry)
	if err != nil {
		return err
	}

	return r.Client.Set(ctx, key, value, exp).Err()
}

func (r *Client) Del(ctx context.Context, key string) error {
	auditEntry := AuditEvent{Action: "DELETE", Name: key, Object: map[string]any{key: ""}}
	err := r.audit(ctx, auditEntry)
	if err != nil {
		return err
	}

	return r.Client.Del(ctx, key).Err()
}

func (r *Client) audit(ctx context.Context, entry AuditEvent) error {
	if r.AuditClient == nil {
		return status.Error(codes.Internal, "audit client can not be empty")
	}

	eventDataJSON, err := json.Marshal(entry.Object)
	if err != nil {
		return err
	}
	eventData := &structpb.Struct{}
	err = protojson.Unmarshal(eventDataJSON, eventData)
	if err != nil {
		return err
	}

	var userAgent string

	md, _ := metadata.FromIncomingContext(ctx)
	if ua := md.Get("User-Agent"); len(ua) > 0 {
		userAgent = ua[0]
	} else {
		userAgent = "service"
	}

	auditClient := *r.AuditClient
	_, err = auditClient.CreateAuditEvent(ctx, &auditpb.CreateAuditEventRequest{
		Source:          proto.String(r.Source),
		Agent:           proto.String(userAgent),
		EventType:       proto.String(entry.Action),
		EventDataType:   proto.String(entry.Name),
		EventData:       eventData,
		EventTimestamp:  timestamppb.Now(),
		ContextMetadata: nil,
	})

	return err
}

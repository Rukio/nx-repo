package redisclient

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type MockRedis struct {
	redis.Cmdable
	mockGetMap  map[string]string
	getError    error
	setErrorMap map[string]error
	delErrorMap map[string]error
}

func (m MockRedis) Get(ctx context.Context, key string) *redis.StringCmd {
	cmd := redis.NewStringCmd(ctx)
	val, ok := m.mockGetMap[key]
	if ok {
		cmd.SetVal(val)
	} else {
		cmd.SetErr(m.getError)
	}
	return cmd
}

func (m MockRedis) Set(ctx context.Context, key string, value any, expiration time.Duration) *redis.StatusCmd {
	cmd := redis.NewStatusCmd(ctx)
	val, ok := m.setErrorMap[key]
	if ok {
		cmd.SetErr(val)
	}
	return cmd
}

func (m MockRedis) Del(ctx context.Context, keys ...string) *redis.IntCmd {
	cmd := redis.NewIntCmd(ctx)
	val, ok := m.delErrorMap[keys[0]]
	if ok {
		cmd.SetErr(val)
	}
	return cmd
}

package monitoring

import (
	"context"
	"sync"
)

const (
	reflectionActionName = "/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo"

	grpcTypeUnary  = "unary"
	grpcTypeStream = "stream"

	grpcDirectionIncoming = "in"
	grpcDirectionOutgoing = "out"

	prefixDelimiter = "_"
)

type metricsContext struct {
	mx     sync.RWMutex
	tags   Tags
	fields Fields
}

func newMetricsContext() *metricsContext {
	return &metricsContext{
		tags:   Tags{},
		fields: Fields{},
	}
}

func (mc *metricsContext) AddTags(tags Tags) {
	mc.mx.Lock()
	defer mc.mx.Unlock()

	for k, v := range tags {
		mc.tags[k] = v
	}
}

func (mc *metricsContext) AddFields(fields Fields) {
	mc.mx.Lock()
	defer mc.mx.Unlock()

	for k, v := range fields {
		mc.fields[k] = v
	}
}

func (mc *metricsContext) Tags() Tags {
	return mc.WithTags(nil)
}

func (mc *metricsContext) WithTags(extraTags Tags) Tags {
	mc.mx.RLock()
	defer mc.mx.RUnlock()

	tags := Tags{}
	for k, v := range mc.tags {
		tags[k] = v
	}
	for k, v := range extraTags {
		tags[k] = v
	}

	return tags
}

func (mc *metricsContext) Fields() Fields {
	return mc.WithFields(nil)
}

func (mc *metricsContext) WithFields(extraFields Fields) Fields {
	mc.mx.RLock()
	defer mc.mx.RUnlock()

	fields := Fields{}
	for k, v := range mc.fields {
		if v == nil {
			continue
		}
		fields[k] = v
	}
	for k, v := range extraFields {
		if v == nil {
			continue
		}
		fields[k] = v
	}

	return fields
}

func newPrefix(oldPrefix, prefix string) string {
	if oldPrefix == "" {
		return prefix
	}
	if prefix == "" {
		return oldPrefix
	}

	return oldPrefix + prefixDelimiter + prefix
}

type Tags map[string]string
type Fields map[string]any

func (t Tags) Clone() Tags {
	tags := make(Tags, len(t))
	for k, v := range t {
		tags[k] = v
	}

	return tags
}

func AddGRPCTag(ctx context.Context, k, v string) {
	AddGRPCTags(ctx, Tags{k: v})
}

func AddGRPCTags(ctx context.Context, tags Tags) {
	c, ok := ctx.Value(grpcMetricsContextKey{}).(*metricsContext)
	if !ok {
		return
	}

	c.AddTags(tags)
}

func AddGRPCField(ctx context.Context, k string, v any) {
	AddGRPCFields(ctx, Fields{k: v})
}

func AddGRPCFields(ctx context.Context, fields Fields) {
	c, ok := ctx.Value(grpcMetricsContextKey{}).(*metricsContext)
	if !ok {
		return
	}

	c.AddFields(fields)
}

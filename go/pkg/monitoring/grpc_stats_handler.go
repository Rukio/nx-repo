package monitoring

import (
	"context"

	"google.golang.org/grpc/stats"
	"google.golang.org/grpc/status"
)

type grpcStatsHandlerContextKey struct{}

type statsHandler struct {
	r *InfluxRecorder
}

func (h *statsHandler) TagRPC(ctx context.Context, info *stats.RPCTagInfo) context.Context {
	ctx = context.WithValue(ctx, grpcStatsHandlerContextKey{}, info.FullMethodName)
	return ctx
}

func (h *statsHandler) HandleRPC(ctx context.Context, rpcStats stats.RPCStats) {
	end, ok := rpcStats.(*stats.End)
	if !ok {
		return
	}

	action := ctx.Value(grpcStatsHandlerContextKey{}).(string)
	err := end.Error
	code := status.Convert(err).Code()

	// TODO: Figure out how to get the stats.Begin information to determine whether this is a streaming connection.
	var grpcType string
	direction := grpcDirectionOutgoing
	if !end.IsClient() {
		direction = grpcDirectionIncoming
	}

	h.r.recordGRPCCall(grpcCall{
		direction: direction,
		action:    action,
		code:      code,
		latency:   end.EndTime.Sub(end.BeginTime),
		grpcType:  grpcType,
		mc:        newMetricsContext(),
		err:       err,
	})
}

func (h *statsHandler) TagConn(ctx context.Context, info *stats.ConnTagInfo) context.Context {
	return ctx
}

func (h *statsHandler) HandleConn(_ context.Context, connStats stats.ConnStats) {
}

var _ stats.Handler = (*statsHandler)(nil)

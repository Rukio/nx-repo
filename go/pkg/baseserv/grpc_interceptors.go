package baseserv

import (
	"context"
	"errors"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type grpcResp struct {
	resp any
	err  error
}

func GRPCPerCallTimeoutWithIgnore(d time.Duration, ignoreMap map[string]struct{}) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		_, present := ignoreMap[info.FullMethod]
		if present {
			return handler(ctx, req)
		}
		ctx, cancel := context.WithTimeout(ctx, d)
		defer cancel()

		return unaryServerInterceptorWithDeadline(ctx, req, handler)
	}
}

func GRPCPerCallTimeout(d time.Duration) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		ctx, cancel := context.WithTimeout(ctx, d)
		defer cancel()

		return unaryServerInterceptorWithDeadline(ctx, req, handler)
	}
}

func unaryServerInterceptorWithDeadline(ctx context.Context, req any, handler grpc.UnaryHandler) (any, error) {
	c := make(chan grpcResp, 1)
	go func() {
		resp, err := handler(ctx, req)
		c <- grpcResp{resp, err}
		close(c)
	}()

	select {
	case <-ctx.Done():
		err := ctx.Err()

		code := codes.Aborted
		if errors.Is(err, context.DeadlineExceeded) {
			code = codes.DeadlineExceeded
		} else if errors.Is(err, context.Canceled) {
			code = codes.Canceled
		}

		return nil, status.Error(code, "")
	case r := <-c:
		return r.resp, r.err
	}
}

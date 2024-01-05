package baseserv

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestGRPCPerCallTimeout(t *testing.T) {
	type args struct {
		timeout    time.Duration
		ctxTimeout time.Duration
		fnDuration time.Duration
		cancel     bool
	}
	tests := []struct {
		name string
		args args
		want codes.Code
	}{
		{
			name: "base case: fast function returns OK",
			args: args{
				timeout:    3000 * time.Millisecond,
				ctxTimeout: 5000 * time.Millisecond,
				fnDuration: 10 * time.Millisecond,
			},
			want: codes.OK,
		},
		{
			name: "slow function, short timeout",
			args: args{
				timeout:    10 * time.Millisecond,
				ctxTimeout: 5000 * time.Millisecond,
				fnDuration: 1000 * time.Millisecond,
			},
			want: codes.DeadlineExceeded,
		},
		{
			name: "slow function, short incoming context timeout",
			args: args{
				timeout:    5000 * time.Millisecond,
				ctxTimeout: 10 * time.Millisecond,
				fnDuration: 1000 * time.Millisecond,
			},
			want: codes.DeadlineExceeded,
		},
		{
			name: "slow function, parent context cancel",
			args: args{
				timeout:    1000 * time.Millisecond,
				ctxTimeout: 2000 * time.Millisecond,
				fnDuration: 300 * time.Millisecond,
				cancel:     true,
			},
			want: codes.Canceled,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			interceptor := GRPCPerCallTimeout(tt.args.timeout)

			ctx, cancel := context.WithTimeout(context.Background(), tt.args.ctxTimeout)
			defer cancel()

			if tt.args.cancel {
				go func() {
					cancel()
				}()
			}
			handler := grpc.UnaryHandler(func(_ context.Context, _ any) (any, error) {
				time.Sleep(tt.args.fnDuration)
				return nil, status.Error(codes.OK, "ok")
			})
			_, err := interceptor(ctx, nil, nil, handler)

			testutils.MustMatch(t, tt.want, status.Code(err))
		})
	}
}

func TestGRPCPerCallTimeoutWithIgnore(t *testing.T) {
	type args struct {
		timeout    time.Duration
		ctxTimeout time.Duration
		fnDuration time.Duration
		ignoreList map[string]struct{}
	}
	tests := []struct {
		name string
		args args
		want codes.Code
	}{
		{
			name: "matches ignore list, slow function, short timeout",
			args: args{
				timeout:    10 * time.Millisecond,
				ctxTimeout: 5000 * time.Millisecond,
				fnDuration: 1000 * time.Millisecond,
				ignoreList: map[string]struct{}{"/matches.service/Method": {}},
			},
			want: codes.OK,
		},
		{
			name: "does not match ignore list, slow function, short timeout",
			args: args{
				timeout:    10 * time.Millisecond,
				ctxTimeout: 5000 * time.Millisecond,
				fnDuration: 1000 * time.Millisecond,
				ignoreList: map[string]struct{}{"/ignores.service/Method": {}},
			},
			want: codes.DeadlineExceeded,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			interceptor := GRPCPerCallTimeoutWithIgnore(tt.args.timeout, tt.args.ignoreList)

			ctx, cancel := context.WithTimeout(context.Background(), tt.args.ctxTimeout)
			defer cancel()

			handler := grpc.UnaryHandler(func(_ context.Context, _ any) (any, error) {
				time.Sleep(tt.args.fnDuration)
				return nil, status.Error(codes.OK, "ok")
			})
			info := grpc.UnaryServerInfo{
				Server:     struct{}{},
				FullMethod: "/matches.service/Method",
			}
			_, err := interceptor(ctx, nil, &info, handler)

			testutils.MustMatch(t, tt.want, status.Code(err))
		})
	}
}

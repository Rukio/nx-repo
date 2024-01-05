package monitoring

import (
	"context"
	"time"

	"go.uber.org/zap"

	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

type HealthCheckPoller struct {
	Interval              time.Duration
	Check                 func(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error)
	DataDogRecorder       *DataDogRecorder
	DataDogLogServiceName string
	Logger                *zap.SugaredLogger
}

func (p *HealthCheckPoller) Start() {
	if p.Interval == 0 {
		p.Logger.Info("interval is not set, aborting health check polling")
		return
	}
	if p.DataDogRecorder == nil {
		p.Logger.Info("datadog recorder is nil, aborting health check polling")
		return
	}

	ctx := context.Background()

	go func() {
		for {
			healthCheck, err := p.Check(ctx, &healthpb.HealthCheckRequest{})
			if err != nil {
				p.Logger.Errorw("error executing health check in interval check", zap.Error(err))
			}

			p.DataDogRecorder.SendStatsDServiceCheck(healthCheck.Status, p.DataDogLogServiceName)

			select {
			case <-ctx.Done():
				return

			case <-time.After(p.Interval):
				continue
			}
		}
	}()
}

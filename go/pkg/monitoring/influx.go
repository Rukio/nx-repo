package monitoring

import (
	"context"
	"fmt"
	"os"
	"path"
	"time"

	client "github.com/influxdata/influxdb1-client/v2"
	"go.uber.org/zap"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/stats"
	"google.golang.org/grpc/status"
)

const (
	pingTimeout = 10 * time.Second

	influxUsernameKey = "INFLUXDB_ADMIN_USER"
	influxPasswordKey = "INFLUXDB_ADMIN_PASSWORD"
	influxDatabaseKey = "INFLUXDB_DB"
	influxURLKey      = "INFLUXDB_URL"
)

type grpcMetricsContextKey struct{}

// InfluxScope is the default implementation of Scope for production uses with an Influx sink.
type InfluxScope struct {
	r      *InfluxRecorder
	prefix string
	mc     *metricsContext
}

// InfluxEnv holds variables for initializing an InfluxRecorder.
// Retention Policy documentation: https://docs.influxdata.com/influxdb/v1.8/concepts/glossary/#retention-policy-rp
// If retention policy is empty, the default retention policy will be used.
type InfluxEnv struct {
	URL             string
	Username        string
	Password        string
	DatabaseName    string
	RetentionPolicy string
	MaxBatchSize    int
	MaxBatchWait    time.Duration
}

func (e *InfluxEnv) isEnabled() bool {
	return e != nil && e.URL != ""
}

func (e *InfluxEnv) isValid() bool {
	return e.isEnabled() && e.DatabaseName != ""
}

func DefaultInfluxEnv(retentionPolicy string) *InfluxEnv {
	return &InfluxEnv{
		URL:             os.Getenv(influxURLKey),
		Username:        os.Getenv(influxUsernameKey),
		Password:        os.Getenv(influxPasswordKey),
		DatabaseName:    os.Getenv(influxDatabaseKey),
		RetentionPolicy: retentionPolicy,
		MaxBatchSize:    maxBatchSize,
		MaxBatchWait:    maxBatchWait,
	}
}

// InfluxRecorder is a wrapper around InfluxDB's Go API, intended to handle all interaction with the InfluxDB API in one place.
// Interceptors should be passed to as grpc.ServerOptions to grpc.NewServer to automatically record latency and errors.
type InfluxRecorder struct {
	client            client.Client
	seriesPrefix      string
	databaseName      string
	retentionPolicy   string
	batchPointsConfig client.BatchPointsConfig
	maxBatchSize      int
	maxBatchWait      time.Duration
	logger            *zap.SugaredLogger

	pointChan chan *client.Point
}

const (
	maxBatchSize = 5000
	maxBatchWait = 1 * time.Second

	pointChanSize = 100000
)

// NewInfluxRecorder creates a new InfluxRecorder.
// seriesPrefix will be prepended to names of measurements, and is generally just the GRPC service name (e.g., "ExampleService").
// If InfluxEnv has no URL, NewInfluxRecorder will return nil.
// If InfluxEnv has an invalid database name, NewInfluxRecorder will return an error.
func NewInfluxRecorder(ctx context.Context, e *InfluxEnv, seriesPrefix string, logger *zap.SugaredLogger) (*InfluxRecorder, error) {
	if !e.isEnabled() {
		return nil, nil
	}
	if !e.isValid() {
		return nil, fmt.Errorf("invalid database name: %s", e.DatabaseName)
	}

	c, err := client.NewHTTPClient(client.HTTPConfig{
		Addr:     e.URL,
		Username: e.Username,
		Password: e.Password,
	})
	if err != nil {
		return nil, fmt.Errorf("error creating InfluxDB Client: %w", err)
	}
	defer c.Close()

	createDBQuery := client.NewQuery(fmt.Sprintf("CREATE DATABASE %s", e.DatabaseName), "", "")
	_, err = c.Query(createDBQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to create database: %w", err)
	}

	_, _, err = c.Ping(pingTimeout)
	if err != nil {
		return nil, fmt.Errorf("failed ping with err %w", err)
	}

	pointChan := make(chan *client.Point, pointChanSize)
	r := &InfluxRecorder{
		client:          c,
		seriesPrefix:    seriesPrefix,
		databaseName:    e.DatabaseName,
		retentionPolicy: e.RetentionPolicy,
		batchPointsConfig: client.BatchPointsConfig{
			Database:        e.DatabaseName,
			RetentionPolicy: e.RetentionPolicy,
		},
		maxBatchSize: e.MaxBatchSize,
		maxBatchWait: e.MaxBatchWait,
		logger:       logger,

		pointChan: pointChan,
	}

	go r.startBatcher(ctx)

	return r, nil
}

func (r *InfluxRecorder) startBatcher(ctx context.Context) {
	batchChan := make(chan []*client.Point)
	defer close(batchChan)

	go func() {
		for batch := range batchChan {
			if len(batch) == 0 {
				continue
			}

			bp, err := client.NewBatchPoints(r.batchPointsConfig)
			if err != nil {
				r.logger.Errorw("influx failed to create batch points", zap.Error(err))
				continue
			}

			for _, p := range batch {
				bp.AddPoint(p)
			}

			err = r.client.Write(bp)
			if err != nil {
				r.logger.Errorw("influxRecorder failed to write to influxdb", zap.Error(err))
			}
		}
	}()

NextBatch:
	for {
		batch := make([]*client.Point, 0, r.maxBatchSize)

		p, ok := <-r.pointChan
		if !ok {
			return
		}

		batch = append(batch, p)
		expire := time.After(r.maxBatchWait)
		for {
			select {
			case p, ok := <-r.pointChan:
				if !ok {
					batchChan <- batch
					return
				}

				batch = append(batch, p)
				if len(batch) == r.maxBatchSize {
					batchChan <- batch
					continue NextBatch
				}

			case <-expire:
				batchChan <- batch
				continue NextBatch

			case <-ctx.Done():
				batchChan <- batch
				return
			}
		}
	}
}

// With creates a new Scope.
// Prefix will be added to the parent Scope's prefix with a delimiter if not empty.
func (s *InfluxScope) With(prefix string, tags Tags, fields Fields) Scope {
	mc := newMetricsContext()
	mc.AddTags(s.mc.WithTags(tags))
	mc.AddFields(s.mc.WithFields(fields))

	return &InfluxScope{
		r:      s.r,
		prefix: newPrefix(s.prefix, prefix),
		mc:     mc,
	}
}

// With creates a new Scope.
// Prefix will be added to the parent Scope's prefix with a delimiter if not empty.
func (r *InfluxRecorder) With(prefix string, tags Tags, fields Fields) *InfluxScope {
	if r == nil {
		return nil
	}
	mc := newMetricsContext()
	mc.AddTags(tags)
	mc.AddFields(fields)

	return &InfluxScope{
		r:      r,
		prefix: newPrefix(r.seriesPrefix, prefix),
		mc:     mc,
	}
}

func (r *InfluxRecorder) writePoint(measurement string, tags Tags, fields Fields) {
	p, err := client.NewPoint(measurement, tags, fields, time.Now())
	if err != nil {
		r.logger.Errorw("influx failed to create new points", zap.Error(err))
		return
	}

	r.pointChan <- p
}

func (s *InfluxScope) WritePoint(measurement string, tags Tags, fields Fields) {
	if s == nil {
		return
	}

	go s.r.writePoint(newPrefix(s.prefix, measurement), s.mc.WithTags(tags), s.mc.WithFields(fields))
}

type grpcCall struct {
	direction string
	action    string
	code      codes.Code
	latency   time.Duration
	grpcType  string
	mc        *metricsContext
	err       error
}

// TODO: Add tests.
func (r *InfluxRecorder) recordGRPCCall(c grpcCall) {
	s := &InfluxScope{
		r:      r,
		mc:     c.mc,
		prefix: r.seriesPrefix,
	}

	s.WritePoint("grpc_service_calls",
		Tags{
			"action":            c.action,
			"action_short_name": path.Base(c.action),
			"service":           path.Dir(c.action),
			"grpc_type":         c.grpcType,
			"grpc_status_code":  c.code.String(),
			"direction":         c.direction,
		},
		Fields{
			"duration_ms": c.latency.Milliseconds(),
			"count":       1,
			"error":       c.err,
		})
}

// GRPCUnaryInterceptor intercepts Unary GRPC requests with an influx metrics recorder.
// When added as a grpc.ServerOption to a GRPC server, it will automatically record latencies and errors for all unary GRPC requests made with that server.
func (r *InfluxRecorder) GRPCUnaryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		start := time.Now()

		mc := newMetricsContext()
		ctx = context.WithValue(ctx, grpcMetricsContextKey{}, mc)

		resp, err := handler(ctx, req)

		action := info.FullMethod
		if action == reflectionActionName {
			return resp, err
		}

		elapsed := time.Since(start)
		code := status.Convert(err).Code()
		r.recordGRPCCall(grpcCall{
			direction: grpcDirectionIncoming,
			action:    action,
			code:      code,
			latency:   elapsed,
			grpcType:  grpcTypeUnary,
			mc:        mc,
			err:       err,
		})

		return resp, err
	}
}

// GRPCStreamInterceptor intercepts streamed GRPC requests with an influx metrics recorder.
// When added as a grpc.ServerOption to a GRPC server, it will automatically record latencies and errors for all streamed GRPC requests made with that server.
func (r *InfluxRecorder) GRPCStreamInterceptor() grpc.StreamServerInterceptor {
	return func(srv any, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
		start := time.Now()

		err := handler(srv, stream)

		action := info.FullMethod
		if action == reflectionActionName {
			return err
		}

		elapsed := time.Since(start)
		code := status.Convert(err).Code()
		r.recordGRPCCall(grpcCall{
			direction: grpcDirectionIncoming,
			action:    action,
			code:      code,
			latency:   elapsed,
			grpcType:  grpcTypeStream,
			mc:        newMetricsContext(),
			err:       err,
		})

		return err
	}
}

func (r *InfluxRecorder) GRPCStatsHandler() stats.Handler {
	return &statsHandler{r: r}
}

func (r *InfluxRecorder) DBPoolStatsRecorder(db DBPoolStater, reportingInterval time.Duration) *DBPoolStatsRecorder {
	return &DBPoolStatsRecorder{
		db:                db,
		scope:             r.With("DB_pool", nil, nil),
		reportingInterval: reportingInterval,
	}
}

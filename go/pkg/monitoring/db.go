package monitoring

import (
	"context"
	"regexp"
	"time"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/ext"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
)

const (
	queriesMetricName = "queries"

	queryTypeTag   = "type"
	queryNameTag   = "name"
	queryStatusTag = "status"

	queryStatusTagSuccess = "success"
	queryStatusTagError   = "error"

	latencyMsField = "duration_ms"
	errorField     = "error"
)

var (
	queryNameRE = regexp.MustCompile("^-- name: (.+?) :")
)

// Match generated sqlc.DBTX interface.
type DBTX interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
	SendBatch(context.Context, *pgx.Batch) pgx.BatchResults
}

type DB struct {
	db    DBTX
	scope Scope
}

func NewDB(db DBTX, scope Scope) *DB {
	return &DB{
		db:    db,
		scope: scope,
	}
}

func queryName(query string) string {
	s := queryNameRE.FindStringSubmatch(query)
	if len(s) != 2 {
		return ""
	}

	return s[1]
}

func (mdb *DB) recordQuery(typ string, name string, startTime time.Time, err error) {
	status := queryStatusTagSuccess
	if err != nil {
		status = queryStatusTagError
	}
	mdb.scope.WritePoint(queriesMetricName,
		Tags{
			queryTypeTag:   typ,
			queryNameTag:   name,
			queryStatusTag: status,
		},
		Fields{
			latencyMsField: time.Since(startTime).Milliseconds(),
			errorField:     err,
		})
}

func (mdb *DB) Exec(ctx context.Context, query string, args ...any) (pgconn.CommandTag, error) {
	startTime := time.Now()

	tag, err := mdb.db.Exec(ctx, query, args...)
	mdb.recordQuery("exec", queryName(query), startTime, err)

	return tag, err
}
func (mdb *DB) Query(ctx context.Context, query string, args ...any) (pgx.Rows, error) {
	startTime := time.Now()

	rows, err := mdb.db.Query(ctx, query, args...)
	mdb.recordQuery("query", queryName(query), startTime, err)

	return rows, err
}

type wrappedRow struct {
	row  pgx.Row
	done func(error)
}

func (r *wrappedRow) Scan(dest ...any) error {
	err := r.row.Scan(dest...)
	r.done(err)
	return err
}

func (mdb *DB) QueryRow(ctx context.Context, query string, args ...any) pgx.Row {
	startTime := time.Now()

	row := &wrappedRow{
		row: mdb.db.QueryRow(ctx, query, args...),
		done: func(err error) {
			mdb.recordQuery("queryrow", queryName(query), startTime, err)
		},
	}

	return row
}
func (mdb *DB) SendBatch(ctx context.Context, batch *pgx.Batch) pgx.BatchResults {
	startTime := time.Now()

	results := mdb.db.SendBatch(ctx, batch)
	// TODO: Add error if there's an easy way to get it.
	mdb.recordQuery("batch", "batch", startTime, nil)

	return results
}

type DDTraceDB struct {
	db          DBTX
	serviceName string
}

func NewDDTraceDB(db DBTX, serviceName string) *DDTraceDB {
	return &DDTraceDB{
		db:          db,
		serviceName: serviceName,
	}
}

func (mdb *DDTraceDB) startSpan(ctx context.Context, name string, query string) (ddtrace.Span, context.Context) {
	return tracer.StartSpanFromContext(
		ctx,
		"db.postgres",
		tracer.ServiceName("db."+mdb.serviceName),
		tracer.ResourceName(name),
		tracer.SpanType(ext.SpanTypeSQL),
		tracer.Tag("sql.name", name),
		tracer.Tag("sql.command", query),
	)
}

func (mdb *DDTraceDB) Exec(ctx context.Context, query string, args ...any) (pgconn.CommandTag, error) {
	span, _ := mdb.startSpan(ctx, queryName(query), query)

	tag, err := mdb.db.Exec(ctx, query, args...)
	span.Finish()

	return tag, err
}

func (mdb *DDTraceDB) Query(ctx context.Context, query string, args ...any) (pgx.Rows, error) {
	span, _ := mdb.startSpan(ctx, queryName(query), query)

	rows, err := mdb.db.Query(ctx, query, args...)
	span.Finish()

	return rows, err
}

func (mdb *DDTraceDB) QueryRow(ctx context.Context, query string, args ...any) pgx.Row {
	span, _ := mdb.startSpan(ctx, queryName(query), query)

	row := &wrappedRow{
		row: mdb.db.QueryRow(ctx, query, args...),
		done: func(err error) {
			span.Finish()
		},
	}

	return row
}

func (mdb *DDTraceDB) SendBatch(ctx context.Context, batch *pgx.Batch) pgx.BatchResults {
	span, _ := mdb.startSpan(ctx, "batch", "batch")

	results := mdb.db.SendBatch(ctx, batch)
	span.Finish()

	return results
}

type DBPoolStater interface {
	Stat() *pgxpool.Stat
}

type DBPoolStatsRecorder struct {
	db                DBPoolStater
	scope             Scope
	reportingInterval time.Duration
}

func (r *DBPoolStatsRecorder) Start(ctx context.Context) {
	go func() {
		for {
			stat := r.db.Stat()
			r.scope.WritePoint("conns",
				nil,
				Fields{
					"cumulative_new":                    stat.NewConnsCount(),
					"cumulative_acquired":               stat.AcquireCount(),
					"cumulative_cancelled_acquired":     stat.CanceledAcquireCount(),
					"cumulative_empty_wait_acquired":    stat.EmptyAcquireCount(),
					"cumulative_idle_destroyed":         stat.MaxIdleDestroyCount(),
					"cumulative_max_lifetime_destroyed": stat.MaxLifetimeDestroyCount(),

					"total":        stat.TotalConns(),
					"constructing": stat.ConstructingConns(),
					"acquired":     stat.AcquiredConns(),
					"idle":         stat.IdleConns(),
				},
			)

			select {
			case <-ctx.Done():
				return
			case <-time.After(r.reportingInterval):
				continue
			}
		}
	}()
}

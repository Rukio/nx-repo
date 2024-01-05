package basedb

import (
	"context"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"go.uber.org/zap"
)

const (
	dbURLEnvKey             = "DATABASE_URL"
	dbPerQueryTimeoutEnvKey = "DATABASE_PER_QUERY_TIMEOUT"
)

type DBTX interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
	CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rowSrc pgx.CopyFromSource) (int64, error)
	SendBatch(context.Context, *pgx.Batch) pgx.BatchResults
	Begin(ctx context.Context) (pgx.Tx, error)
	BeginFunc(ctx context.Context, f func(pgx.Tx) error) error
	BeginTxFunc(ctx context.Context, txOptions pgx.TxOptions, f func(pgx.Tx) error) error
	Ping(ctx context.Context) error
	Stat() *pgxpool.Stat
	Close()
}

type Config struct {
	URL string

	PerQueryTimeout time.Duration
}

func DatabaseURL() string {
	return os.Getenv(dbURLEnvKey)
}

// DefaultEnvConfig returns the default Config based on standard environment variables.
// Most servers should use this configuration, unless there are very specific needs.
func DefaultEnvConfig(logger *zap.SugaredLogger) Config {
	perQueryTimeoutStr := os.Getenv(dbPerQueryTimeoutEnvKey)
	var perQueryTimeout time.Duration
	if perQueryTimeoutStr != "" {
		var err error
		perQueryTimeout, err = time.ParseDuration(perQueryTimeoutStr)
		if err != nil {
			logger.Panicw("Unable to parse per query timeout", dbPerQueryTimeoutEnvKey, perQueryTimeoutStr, zap.Error(err))
		}
	}
	return Config{
		URL: os.Getenv(dbURLEnvKey),

		PerQueryTimeout: perQueryTimeout,
	}
}

// Connect connects to the database using config.
// The database should be Close() when done.
//
//	db := Connect(...)
//	defer db.Close()
//
// Note: Connect will panic if it cannot connect to the database,
// as this is expected to only be used on startup, where databases are a requirement to do anything useful.
func Connect(ctx context.Context, logger *zap.SugaredLogger, config Config) DBTX {
	cfg, err := pgxpool.ParseConfig(config.URL)
	if err != nil {
		logger.Panicw("Unable to parse config for database", zap.Error(err))
	}

	// Ref: https://brandur.org/fragments/postgres-parameters
	// Ref: https://www.postgresql.org/docs/current/runtime-config-client.html
	if config.PerQueryTimeout > 0 {
		cfg.ConnConfig.RuntimeParams["statement_timeout"] = strconv.Itoa(int(config.PerQueryTimeout.Milliseconds()))
	}

	var db DBTX
	db, err = pgxpool.ConnectConfig(ctx, cfg)
	if err != nil {
		logger.Panicw("Unable to connect to database", zap.Error(err))
	}

	return db
}

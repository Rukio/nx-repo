package basedb

import (
	"context"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
)

const notImplemented = "not implemented"

type MockPingDBTX struct {
	PingErr error
}

func (db *MockPingDBTX) Exec(_ context.Context, _ string, _ ...any) (pgconn.CommandTag, error) {
	panic(notImplemented)
}

func (db *MockPingDBTX) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	panic(notImplemented)
}

func (db *MockPingDBTX) QueryRow(_ context.Context, _ string, _ ...any) pgx.Row {
	panic(notImplemented)
}

func (db *MockPingDBTX) CopyFrom(ctx context.Context, tableName pgx.Identifier, columnNames []string, rowSrc pgx.CopyFromSource) (int64, error) {
	panic(notImplemented)
}

func (db *MockPingDBTX) SendBatch(_ context.Context, _ *pgx.Batch) pgx.BatchResults {
	panic(notImplemented)
}

func (db *MockPingDBTX) Begin(ctx context.Context) (pgx.Tx, error) {
	panic(notImplemented)
}

func (db *MockPingDBTX) BeginFunc(ctx context.Context, f func(pgx.Tx) error) error {
	panic(notImplemented)
}

func (db *MockPingDBTX) BeginTxFunc(ctx context.Context, _ pgx.TxOptions, f func(pgx.Tx) error) error {
	panic(notImplemented)
}

func (db *MockPingDBTX) Stat() *pgxpool.Stat {
	panic(notImplemented)
}

func (db *MockPingDBTX) Close() {
	panic(notImplemented)
}

func (db *MockPingDBTX) Ping(_ context.Context) error {
	return db.PingErr
}

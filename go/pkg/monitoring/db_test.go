package monitoring

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
)

type mockDBTX struct {
}

func (mockDBTX) Exec(_ context.Context, _ string, _ ...any) (pgconn.CommandTag, error) {
	return nil, nil
}
func (mockDBTX) Query(_ context.Context, _ string, _ ...any) (pgx.Rows, error) {
	return nil, nil
}
func (mockDBTX) QueryRow(_ context.Context, _ string, _ ...any) pgx.Row {
	return nil
}
func (mockDBTX) SendBatch(_ context.Context, _ *pgx.Batch) pgx.BatchResults {
	return nil
}

func TestDB(t *testing.T) {
	db := NewDB(mockDBTX{}, &NoopScope{})
	if db == nil {
		t.Fatal()
	}

	ctx := context.Background()

	_, err := db.Exec(ctx, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Query(ctx, "")
	if err != nil {
		t.Fatal(err)
	}

	_ = db.QueryRow(ctx, "")
	_ = db.SendBatch(ctx, nil)
}

func TestDDTraceDB(t *testing.T) {
	db := NewDDTraceDB(mockDBTX{}, "serviceName")
	if db == nil {
		t.Fatal()
	}

	ctx := context.Background()

	_, err := db.Exec(ctx, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Query(ctx, "")
	if err != nil {
		t.Fatal(err)
	}

	_ = db.QueryRow(ctx, "")
	_ = db.SendBatch(ctx, nil)
}

func Test_queryName(t *testing.T) {
	tests := []struct {
		name  string
		query string
		want  string
	}{
		{
			name:  "empty",
			query: "",
			want:  "",
		},
		{
			name:  "one",
			query: "-- name: GetLatestScheduleVisitForCareRequest :one\nblahblah",
			want:  "GetLatestScheduleVisitForCareRequest",
		},
		{
			name:  "many",
			query: "-- name: GetLatestScheduleVisitForCareRequest :many\nblahblah",
			want:  "GetLatestScheduleVisitForCareRequest",
		},
		{
			name:  "exec",
			query: "-- name: GetLatestScheduleVisitForCareRequest :exec\nblahblah",
			want:  "GetLatestScheduleVisitForCareRequest",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testutils.MustMatch(t, tt.want, queryName(tt.query))
		})
	}
}

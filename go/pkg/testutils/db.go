//go:build db_test

package testutils

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"

	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4/pgxpool"
)

type GetDBConnPooler interface {
	Helper()
	Fatal(args ...any)
}

func GetDBConnPool(c GetDBConnPooler, testDBName string) *pgxpool.Pool {
	c.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		baseDBURL := os.Getenv("BASE_DATABASE_URL")
		if baseDBURL == "" {
			c.Fatal("no database url set (DATABASE_URL or BASE_DATABASE_URL)")
		}

		uri, err := url.Parse(baseDBURL)
		if err != nil {
			c.Fatal(err)
		}
		uri.Path = testDBName

		dbURL = uri.String()
	}

	pool, err := pgxpool.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		c.Fatal(err)
	}

	return pool
}

func ToJSONB(v any) pgtype.JSONB {
	buf, _ := json.Marshal(v)

	return pgtype.JSONB{
		Bytes:  buf,
		Status: pgtype.Present,
	}
}

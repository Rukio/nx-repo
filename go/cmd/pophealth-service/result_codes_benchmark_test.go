//go:build db_test

// TODO: PAR-93 - move pophealth benchmarks and database logic in to a package
package main_test

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func BenchmarkCreateResultCode(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	ctx := context.Background()
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.CreateResultCode(ctx, pophealthsql.CreateResultCodeParams{
			Code:            fmt.Sprintf("Code-%d", time.Now().UnixNano()),
			CodeDescription: sql.NullString{String: "test code", Valid: true},
			CodeLevel:       "row",
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetResultCodeByCode(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	ctx := context.Background()
	codeUniqueness := time.Now().UnixNano()
	_, err := queries.CreateResultCode(ctx, pophealthsql.CreateResultCodeParams{
		Code:            fmt.Sprintf("Code-test-%d", codeUniqueness),
		CodeDescription: sql.NullString{String: "test code", Valid: true},
		CodeLevel:       "row",
	})
	if err != nil {
		b.Fatal(err)
	}
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err = queries.GetResultCodeByCode(ctx, fmt.Sprintf("Code-test-%d", codeUniqueness))
		if err != nil {
			b.Fatal(err)
		}
	}
}

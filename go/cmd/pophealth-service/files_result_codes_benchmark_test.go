//go:build db_test

// TODO: PAR-93 - move pophealth benchmarks and database logic in to a package
package main_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func BenchmarkAddFilesResultCodes(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	ctx := context.Background()
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddFilesResultCodes(ctx, pophealthsql.AddFilesResultCodesParams{
			FileID:       time.Now().UnixNano(),
			ResultCodeID: time.Now().UnixNano(),
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAddFilesResultCodesWithOccurrences(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	ctx := context.Background()
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddFilesResultCodesWithOccurrences(ctx, pophealthsql.AddFilesResultCodesWithOccurrencesParams{
			FileID:       time.Now().UnixNano(),
			ResultCodeID: time.Now().UnixNano(),
			Fields: sql.NullString{
				String: "test",
				Valid:  true,
			},
			NumberOfOccurrences: 5,
			FirstOccurrence:     sql.NullInt32{Int32: 2, Valid: true},
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

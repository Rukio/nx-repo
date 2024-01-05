//go:build db_test

// TODO: move pophealth benchmarks and database logic in to a package
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

func BenchmarkAddFile(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	startFileID := time.Now().UnixNano()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddFile(context.Background(), pophealthsql.AddFileParams{
			Filename:       fmt.Sprintf("File-Name-%d", startFileID+int64(n)),
			Status:         pophealthsql.FileStatusProcessed,
			BucketFolderID: startFileID + int64(n),
			AwsObjectKey: sql.NullString{
				String: fmt.Sprintf("load/File-Name-%d", startFileID+int64(n)),
				Valid:  true,
			},
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetFilesByBucket(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetFilesByBucket(ctx, pophealthsql.GetFilesByBucketParams{
			BucketFolderID:      int64(n),
			LastIDFilterEnabled: true,
			IsPagingForward:     true,
			LastIDSeen:          10,
			StatusFilterEnabled: false,
			StatusProcessed:     pophealthsql.FileStatusUnspecified,
			SearchNameEnabled:   false,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetFilesByBucketAllFiltersEnable(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetFilesByBucket(ctx, pophealthsql.GetFilesByBucketParams{
			BucketFolderID:      int64(n),
			LastIDFilterEnabled: true,
			IsPagingForward:     true,
			LastIDSeen:          10,
			StatusFilterEnabled: true,
			SearchForProcessed:  true,
			StatusProcessed:     pophealthsql.FileStatusProcessed,
			SearchNameEnabled:   true,
			NameSearched:        "test",
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetFileCountForBucketFolder(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetFileCountForBucketFolder(ctx, pophealthsql.GetFileCountForBucketFolderParams{
			BucketFolderID:      int64(n),
			StatusFilterEnabled: false,
			SearchForProcessed:  false,
			StatusProcessed:     pophealthsql.FileStatusUnspecified,
			SearchNameEnabled:   false,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetFileCountForBucketFolderWithSearch(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetFileCountForBucketFolder(ctx, pophealthsql.GetFileCountForBucketFolderParams{
			BucketFolderID:      int64(n),
			StatusFilterEnabled: false,
			SearchForProcessed:  false,
			StatusProcessed:     pophealthsql.FileStatusUnspecified,
			SearchNameEnabled:   true,
			NameSearched:        "test",
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetFileByBucketAndObjectKey(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.GetFileByBucketAndObjectKey(ctx, pophealthsql.GetFileByBucketAndObjectKeyParams{
			BucketFolderID: int64(n),
			AwsObjectKey: sql.NullString{
				String: "load/test.csv",
				Valid:  true,
			},
			Status: pophealthsql.FileStatusNew,
		})
		if err != nil {
			b.Fatal(err)
		}
	}
}

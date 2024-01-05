//go:build db_test

// TODO: PAR-93 - move pophealth benchmarks and database logic in to a package
package main_test

import (
	"context"
	"database/sql"
	"fmt"
	"math/rand"
	"testing"
	"time"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func BenchmarkAddBucketFolder(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	startBucketID := time.Now().UnixNano()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddBucketFolder(context.Background(), pophealthsql.AddBucketFolderParams{
			Name:         fmt.Sprintf("Name-%d", startBucketID+int64(n)),
			S3BucketName: fmt.Sprintf("BucketName-%d", startBucketID+int64(n)),
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetBucketFolderByS3BucketName(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)

	tcs := []int{1, 10, 100, 1000}
	for _, count := range tcs {
		b.Run(fmt.Sprintf("%d", count), func(b *testing.B) {
			startBucketID := time.Now().UnixNano()
			for i := 0; i < count; i++ {
				_, err := queries.AddBucketFolder(ctx, pophealthsql.AddBucketFolderParams{
					Name:         fmt.Sprintf("Name-%d", startBucketID+int64(i)),
					S3BucketName: fmt.Sprintf("BucketName-%d", startBucketID+int64(i)),
				})

				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				s3BucketNameToSearch := fmt.Sprintf("BucketName-%d", startBucketID+int64(0))
				_, err := queries.GetBucketFolderByS3BucketName(ctx, s3BucketNameToSearch)

				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetTemplatesInBucketFolder(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)

	tcs := []struct {
		bucketFolderCount int
		templateCount     int
	}{
		{1, 2},
		{2, 1},
		{5, 10},
		{10, 100},
		{100, 10},
		{100, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.bucketFolderCount, tc.templateCount), func(b *testing.B) {
			var lastBucketFolderID int64
			for i := 0; i < tc.bucketFolderCount; i++ {
				lastBucketFolderID = setupTemplates(ctx, b, i, tc.templateCount, queries)
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetTemplatesInBucketFolder(ctx, lastBucketFolderID)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func BenchmarkGetActiveTemplatesInBucketFolder(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)

	tcs := []struct {
		bucketFolderCount int
		templateCount     int
	}{
		{1, 2},
		{2, 1},
		{5, 10},
		{10, 100},
		{100, 10},
		{100, 100},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.bucketFolderCount, tc.templateCount), func(b *testing.B) {
			var lastBucketFolderID int64
			for i := 0; i < tc.bucketFolderCount; i++ {
				lastBucketFolderID = setupTemplates(ctx, b, i, tc.templateCount, queries)
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetActiveTemplatesInBucketFolder(ctx, lastBucketFolderID)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

func setupTemplates(ctx context.Context, b *testing.B, index, templateCount int, queries *pophealthsql.Queries) int64 {
	bucketFolder, err := queries.AddBucketFolder(ctx, pophealthsql.AddBucketFolderParams{
		Name:         fmt.Sprintf("Name-%d", index),
		S3BucketName: fmt.Sprintf("BucketName-%d", rand.Int()),
	})
	if err != nil {
		b.Fatal(err)
	}
	for j := 0; j < templateCount; j++ {
		t, err := queries.AddTemplateToBucketFolder(ctx, pophealthsql.AddTemplateToBucketFolderParams{
			Name:                fmt.Sprintf("Template name%d", j),
			FileType:            fmt.Sprintf("File type%d", j),
			FileIdentifierType:  fmt.Sprintf("File identifier%d", j),
			FileIdentifierValue: fmt.Sprintf("Identifier value %d", j),
			ColumnMapping:       testutils.ToJSONB([]int{1, 2, 3}),
			ChannelItemID:       int64(j),
			BucketFolderID:      bucketFolder.ID,
		})
		if err != nil {
			b.Fatal(err)
		}
		// deletes third part of new templates
		if j%3 == 0 {
			_, err = queries.DeleteTemplateByID(ctx, t.ID)
			if err != nil {
				b.Fatal(err)
			}
		}
	}
	return bucketFolder.ID
}

func BenchmarkGetFilesAndTemplatesCount(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)

	tcs := []struct {
		fileCount     int
		templateCount int
	}{
		{0, 0},
		{5, 10},
		{10, 5},
		{100, 10},
		{10, 100},
		{100, 100},
	}

	for i, tc := range tcs {
		b.Run(fmt.Sprintf("%dx%d", tc.fileCount, tc.templateCount), func(b *testing.B) {
			bucketFolder, err := queries.AddBucketFolder(ctx, pophealthsql.AddBucketFolderParams{
				Name:         fmt.Sprintf("Test Bucket %d", i),
				S3BucketName: fmt.Sprintf("test-bucket-%d", i),
			})
			if err != nil {
				b.Fatal(err)
			}
			for j := 0; j < tc.templateCount; j++ {
				_, err := queries.AddTemplateToBucketFolder(ctx, pophealthsql.AddTemplateToBucketFolderParams{
					Name:                fmt.Sprintf("Template name%d", j),
					FileType:            fmt.Sprintf("File type%d", j),
					FileIdentifierType:  fmt.Sprintf("File identifier%d", j),
					FileIdentifierValue: fmt.Sprintf("Identifier value %d", j),
					ColumnMapping:       testutils.ToJSONB([]int{1, 2, 3}),
					ChannelItemID:       int64(j),
					MarketID:            int64(j),
					BucketFolderID:      bucketFolder.ID,
				})
				if err != nil {
					b.Fatal(err)
				}
			}
			for j := 0; j < tc.fileCount; j++ {
				_, err := queries.AddFile(ctx, pophealthsql.AddFileParams{
					Filename:       fmt.Sprintf("File name%d", j),
					Status:         pophealthsql.FileStatusNew,
					BucketFolderID: bucketFolder.ID,
					AwsObjectKey:   sql.NullString{String: fmt.Sprintf("load/File name%d", j), Valid: true},
					TemplateID:     sql.NullInt64{},
					FileParameters: testutils.ToJSONB(pophealthpb.FileParameters{}),
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				_, err := queries.GetFilesAndTemplatesCount(ctx, bucketFolder.ID)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}

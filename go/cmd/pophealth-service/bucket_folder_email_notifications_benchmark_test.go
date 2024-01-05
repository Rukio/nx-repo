//go:build db_test

// TODO: PAR-93 - move pophealth benchmarks and database logic in to a package
package main_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func BenchmarkAddBucketFolderEmailNotifications(b *testing.B) {
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)
	startBucketID := time.Now().UnixNano()

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_, err := queries.AddBucketFolderEmailNotifications(context.Background(), pophealthsql.AddBucketFolderEmailNotificationsParams{
			Email:          fmt.Sprintf("email-%d@test.com", startBucketID+int64(n)),
			BucketFolderID: startBucketID + int64(n),
		})

		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkDeleteBucketFolderEmailNotifications(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()
	queries := pophealthsql.New(db)

	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		bucketID := time.Now().UnixNano()
		_, err := queries.AddBucketFolderEmailNotifications(ctx, pophealthsql.AddBucketFolderEmailNotificationsParams{
			Email:          fmt.Sprintf("email-%d@test.com", bucketID),
			BucketFolderID: bucketID,
		})
		if err != nil {
			b.Fatal(err)
		}

		err = queries.DeleteBucketFolderEmailNotifications(ctx, bucketID)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkGetEmailNotificationsByBucketID(b *testing.B) {
	ctx := context.Background()
	db := testutils.GetDBConnPool(b, testDBName)
	defer db.Close()

	queries := pophealthsql.New(db)

	tcs := []struct {
		count int
	}{
		{1},
		{10},
		{100},
		{1000},
	}

	for _, tc := range tcs {
		b.Run(fmt.Sprintf("%d", tc.count), func(b *testing.B) {
			bucketID := time.Now().UnixNano()
			for i := 0; i < tc.count; i++ {
				_, err := queries.AddBucketFolderEmailNotifications(ctx, pophealthsql.AddBucketFolderEmailNotificationsParams{
					Email:          fmt.Sprintf("email-%d@test.com", int64(i)),
					BucketFolderID: bucketID,
				})
				if err != nil {
					b.Fatal(err)
				}
			}

			b.ResetTimer()
			for n := 0; n < b.N; n++ {
				visitSnapshots, err := queries.GetEmailNotificationsByBucketID(ctx, bucketID)
				if err != nil {
					b.Fatal(err)
				}

				if len(visitSnapshots) != tc.count {
					b.Fatal("not enough snapshots")
				}
			}
		})
	}
}

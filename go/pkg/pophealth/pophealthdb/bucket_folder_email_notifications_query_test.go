//go:build db_test

package pophealthdb_test

import (
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestPopHealthDB_AddBucketFolderEmailNotifications(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		params pophealthsql.AddBucketFolderEmailNotificationsParams

		want *pophealthsql.BucketFolderEmailNotification
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddBucketFolderEmailNotificationsParams{
				Email:          "abc@4test.com",
				BucketFolderID: baseID,
			},

			want: &pophealthsql.BucketFolderEmailNotification{
				ID:             baseID + 1,
				Email:          "abc@4test.com",
				BucketFolderID: baseID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			got, err := pdb.AddBucketFolderEmailNotifications(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolderEmailNotifications(ctx, got.BucketFolderID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_DeleteBucketFolderEmailNotifications(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name              string
		bucketFolderEmail pophealthsql.AddBucketFolderEmailNotificationsParams

		want []string
	}{
		{
			name: "success - base case",
			bucketFolderEmail: pophealthsql.AddBucketFolderEmailNotificationsParams{
				Email:          "abc@4test.com",
				BucketFolderID: baseID,
			},

			want: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolderEmail, err := queries.AddBucketFolderEmailNotifications(ctx, test.bucketFolderEmail)
			if err != nil {
				t.Fatal(err)
			}

			err = pdb.DeleteBucketFolderEmailNotifications(ctx, newBucketFolderEmail.BucketFolderID)
			if err != nil {
				t.Fatal(err)
			}

			got, err := queries.GetEmailNotificationsByBucketID(ctx, newBucketFolderEmail.BucketFolderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetEmailNotificationsByBucketID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name              string
		bucketFolderEmail pophealthsql.AddBucketFolderEmailNotificationsParams

		want []string
	}{
		{
			name: "success - base case",
			bucketFolderEmail: pophealthsql.AddBucketFolderEmailNotificationsParams{
				Email:          "abc@4test.com",
				BucketFolderID: baseID,
			},

			want: []string{"abc@4test.com"},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolderEmail, err := queries.AddBucketFolderEmailNotifications(ctx, test.bucketFolderEmail)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolderEmailNotifications(ctx, newBucketFolderEmail.BucketFolderID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			got, err := pdb.GetEmailNotificationsByBucketID(ctx, newBucketFolderEmail.BucketFolderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

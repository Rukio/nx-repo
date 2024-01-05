//go:build db_test

package pophealthdb_test

import (
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
)

func TestPopHealthDB_ActivateBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				ID:           baseID,
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			gotBucketFolder, err := pdb.ActivateBucketFolder(ctx, newBucketFolder.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolder)
		})
	}
}

func TestPopHealthDB_AddBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	tests := []struct {
		name   string
		params pophealthsql.AddBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			gotBucketFolder, err := pdb.AddBucketFolder(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, gotBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolder)
		})
	}
}

func TestPopHealthDB_AddTemplateToBucketFolder(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		params pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			gotTemplate, err := pdb.AddTemplateToBucketFolder(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotTemplate)
		})
	}
}

func TestPopHealthDB_DeactivateBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				Name:          "TestBucket",
				S3BucketName:  "test-bucket",
				DeactivatedAt: sqltypes.ToValidNullTime(time.Now()),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			gotBucketFolder, err := pdb.DeactivateBucketFolder(ctx, newBucketFolder.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeactivatedAt")(t, test.want, gotBucketFolder)
			testutils.MustMatch(t, test.want.DeactivatedAt.Valid, gotBucketFolder.DeactivatedAt.Valid)
		})
	}
}

func TestPopHealthDB_DeleteBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams

		wantErr error
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucket",
				S3BucketName: "test-bucket",
			},

			wantErr: pgx.ErrNoRows,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			err = pdb.DeleteBucketFolder(ctx, newBucketFolder.ID)
			if err != nil {
				t.Fatal(err)
			}

			_, gotErr := queries.GetBucketFolderByID(ctx, newBucketFolder.ID)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

func TestPopHealthDB_DeleteTemplateByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
				DeletedAt:           sqltypes.ToValidNullTime(time.Now()),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			deletedTemplate, err := pdb.DeleteTemplateByID(ctx, newTemplate.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, deletedTemplate)
			testutils.MustMatch(t, test.want.DeletedAt.Valid, deletedTemplate.DeletedAt.Valid)
		})
	}
}

func TestPopHealthDB_DeleteTemplatesByChannelItemIDs(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name      string
		templates []pophealthsql.AddTemplateToBucketFolderParams

		want []*pophealthsql.Template
	}{
		{
			name: "success - base case",
			templates: []pophealthsql.AddTemplateToBucketFolderParams{
				{
					Name:                "TestTemplate1",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID,
					BucketFolderID:      baseID + 1,
					MarketID:            baseID + 2,
				},
				{
					Name:                "TestTemplate2",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID + 1,
					BucketFolderID:      baseID + 2,
					MarketID:            baseID + 3,
				},
			},

			want: []*pophealthsql.Template{
				{
					Name:                "TestTemplate1",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID,
					BucketFolderID:      baseID + 1,
					MarketID:            baseID + 2,
					DeletedAt:           sqltypes.ToValidNullTime(time.Now()),
				},
				{
					Name:                "TestTemplate2",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID + 1,
					BucketFolderID:      baseID + 2,
					MarketID:            baseID + 3,
					DeletedAt:           sqltypes.ToValidNullTime(time.Now()),
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			for _, template := range test.templates {
				_, err := queries.AddTemplateToBucketFolder(ctx, template)
				if err != nil {
					t.Fatal(err)
				}
			}

			deletedTemplates, err := pdb.DeleteTemplatesByChannelItemIDs(ctx, []int64{baseID, baseID + 1})
			if err != nil {
				t.Fatal(err)
			}

			deletedTemplatesMap := make(map[string]*pophealthsql.Template)
			for _, deleletedTemplate := range deletedTemplates {
				deletedTemplatesMap[deleletedTemplate.Name] = deleletedTemplate
			}

			for _, want := range test.want {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, want, deletedTemplatesMap[want.Name])
				testutils.MustMatch(t, want.DeletedAt.Valid, deletedTemplatesMap[want.Name].DeletedAt.Valid)
			}
		})
	}
}

func TestPopHealthDB_GetActiveTemplatesInBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want []*pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: []*pophealthsql.Template{
				{
					ID:                  baseID,
					Name:                "TestTemplate",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID,
					BucketFolderID:      baseID + 1,
					MarketID:            baseID + 2,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			gotTemplate, err := pdb.GetActiveTemplatesInBucketFolder(ctx, newTemplate.BucketFolderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotTemplate)
		})
	}
}

func TestPopHealthDB_GetBucketFolderByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucketFolder",
				S3BucketName: "test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				ID:           baseID,
				Name:         "TestBucketFolder",
				S3BucketName: "test-bucket",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			gotBucketFolder, err := pdb.GetBucketFolderByID(ctx, newBucketFolder.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolder)
		})
	}
}

func TestPopHealthDB_GetBucketFolderByS3BucketName(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucketFolder",
				S3BucketName: "test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				ID:           baseID,
				Name:         "TestBucketFolder",
				S3BucketName: "test-bucket",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			gotBucketFolder, err := pdb.GetBucketFolderByS3BucketName(ctx, newBucketFolder.S3BucketName)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolder)
		})
	}
}

func TestPopHealthDB_GetBucketFolders(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name          string
		bucketFolders []pophealthsql.AddBucketFolderParams

		want []*pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolders: []pophealthsql.AddBucketFolderParams{
				{
					Name:         "TestBucketFolder1",
					S3BucketName: "test-bucket1",
				},
				{
					Name:         "TestBucketFolder2",
					S3BucketName: "test-bucket2",
				},
			},

			want: []*pophealthsql.BucketFolder{
				{
					ID:           baseID,
					Name:         "TestBucketFolder1",
					S3BucketName: "test-bucket1",
				},
				{
					ID:           baseID + 1,
					Name:         "TestBucketFolder2",
					S3BucketName: "test-bucket2",
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolderIDs := make([]int64, len(test.bucketFolders))
			for i, bucketFolder := range test.bucketFolders {
				newBucketFolder, err := queries.AddBucketFolder(ctx, bucketFolder)
				newBucketFolderIDs[i] = newBucketFolder.ID
				if err != nil {
					t.Fatal(err)
				}
			}

			defer func() {
				for _, id := range newBucketFolderIDs {
					err := queries.DeleteBucketFolder(ctx, id)
					if err != nil {
						t.Fatal(err)
					}
				}
			}()

			gotBucketFolders, err := pdb.GetBucketFolders(ctx)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolders)
		})
	}
}

func TestPopHealthDB_GetFilesAndTemplatesCount(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		file     pophealthsql.AddFileParams
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.GetFilesAndTemplatesCountRow
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "test-file",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID,
				MarketID:            baseID + 1,
			},

			want: &pophealthsql.GetFilesAndTemplatesCountRow{
				NumFiles:     1,
				NumTemplates: 1,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			_, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			_, err = queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFilesAndTemplatesCount(ctx, baseID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetTemplateByBucketFolderAndName(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetTemplateByBucketFolderAndName(ctx, pophealthsql.GetTemplateByBucketFolderAndNameParams{
				BucketFolderID: newTemplate.BucketFolderID,
				Name:           newTemplate.Name,
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetTemplateByChannelItemID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetTemplateByChannelItemID(ctx, pophealthsql.GetTemplateByChannelItemIDParams{
				ChannelItemID: newTemplate.ChannelItemID,
			})
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetTemplateByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetTemplateByID(ctx, newTemplate.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetTemplatesInBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams

		want []*pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: []*pophealthsql.Template{
				{
					ID:                  baseID,
					Name:                "TestTemplate",
					FileType:            "txt",
					FileIdentifierType:  "test-type",
					FileIdentifierValue: "test-value",
					ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					ChannelItemID:       baseID,
					BucketFolderID:      baseID + 1,
					MarketID:            baseID + 2,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetTemplatesInBucketFolder(ctx, newTemplate.BucketFolderID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_UpdateBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name         string
		bucketFolder pophealthsql.AddBucketFolderParams
		params       pophealthsql.UpdateBucketFolderParams

		want *pophealthsql.BucketFolder
	}{
		{
			name: "success - base case",
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestBucketFolder",
				S3BucketName: "test-bucket",
			},
			params: pophealthsql.UpdateBucketFolderParams{
				Name:         "ModifiedTestBucketFolder",
				S3BucketName: "modified-test-bucket",
			},

			want: &pophealthsql.BucketFolder{
				ID:           baseID,
				Name:         "ModifiedTestBucketFolder",
				S3BucketName: "modified-test-bucket",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newBucketFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newBucketFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			test.params.ID = newBucketFolder.ID
			gotBucketFolder, err := pdb.UpdateBucketFolder(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotBucketFolder)
		})
	}
}

func TestPopHealthDB_UpdateTemplateByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		template pophealthsql.AddTemplateToBucketFolderParams
		params   pophealthsql.UpdateTemplateByIDParams

		want *pophealthsql.Template
	}{
		{
			name: "success - base case",
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
			params: pophealthsql.UpdateTemplateByIDParams{
				Name:                "ModifiedTestTemplate",
				FileType:            "csv",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.Template{
				ID:                  baseID,
				Name:                "ModifiedTestTemplate",
				FileType:            "csv",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				BucketFolderID:      baseID + 1,
				MarketID:            baseID + 2,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newTemplate.ID
			got, err := pdb.UpdateTemplateByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

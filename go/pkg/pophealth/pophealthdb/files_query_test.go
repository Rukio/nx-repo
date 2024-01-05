//go:build db_test

package pophealthdb_test

import (
	"strconv"
	"testing"
	"time"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgtype"
)

func TestPopHealthDB_AddFile(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		params pophealthsql.AddFileParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			gotFile, err := pdb.AddFile(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotFile)
		})
	}
}

func TestPopHealthDB_DeleteFileByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name string
		file pophealthsql.AddFileParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				DeletedAt:      sqltypes.ToValidNullTime(time.Now()),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			gotFile, err := pdb.DeleteFileByID(ctx, newFile.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.want, gotFile)
			testutils.MustMatch(t, test.want.DeletedAt.Valid, gotFile.DeletedAt.Valid)
		})
	}
}

func TestPopHealthDB_GetExpiredFiles(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name         string
		file         pophealthsql.AddFileParams
		bucketFolder pophealthsql.AddBucketFolderParams
		template     pophealthsql.AddTemplateToBucketFolderParams

		want []*pophealthsql.GetExpiredFilesRow
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestFolder",
				S3BucketName: "test-folder",
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID,
				MarketID:            baseID + 2,
			},

			want: []*pophealthsql.GetExpiredFilesRow{
				{
					ID:             baseID,
					Filename:       "TestFile",
					Status:         pophealthsql.FileStatusProcessing,
					FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					Name:           "TestFolder",
				},
			},
		},
		{
			name: "success - when file is a backfill",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				IsBackfill:     true,
			},
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestFolder",
				S3BucketName: "test-folder",
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				ChannelItemID:       baseID + 1,
				MarketID:            baseID + 2,
			},

			want: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			test.template.BucketFolderID = newFolder.ID
			test.file.BucketFolderID = newFolder.ID
			if len(test.want) > 0 {
				test.want[0].BucketFolderID = newFolder.ID
			}
			newTemplate, err := queries.AddTemplateToBucketFolder(ctx, test.template)
			if err != nil {
				t.Fatal(err)
			}

			test.file.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			if len(test.want) > 0 {
				test.want[0].TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			}
			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}
			defer func() {
				_, err := queries.DeleteFileByID(ctx, newFile.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			got, err := pdb.GetExpiredFiles(ctx, time.Now().Add(1*time.Hour))
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFileAndBucketFolderByFileID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	tests := []struct {
		name         string
		file         pophealthsql.AddFileParams
		bucketFolder pophealthsql.AddBucketFolderParams

		want *pophealthsql.GetFileAndBucketFolderByFileIDRow
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			bucketFolder: pophealthsql.AddBucketFolderParams{
				Name:         "TestFolder",
				S3BucketName: "test-folder",
			},

			want: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
				Filename:         "TestFile",
				Status:           pophealthsql.FileStatusNew,
				S3BucketName:     "test-folder",
				BucketFolderName: "TestFolder",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFolder, err := queries.AddBucketFolder(ctx, test.bucketFolder)
			if err != nil {
				t.Fatal(err)
			}

			defer func() {
				err := queries.DeleteBucketFolder(ctx, newFolder.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			test.file.BucketFolderID = newFolder.ID
			test.want.BucketFolderID = newFolder.ID
			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.want.FileID = newFile.ID
			got, err := pdb.GetFileAndBucketFolderByFileID(ctx, newFile.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFileByBucketAndObjectKey(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.GetFileByBucketAndObjectKeyParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				AwsObjectKey:   sqltypes.ToValidNullString("test-key"),
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.GetFileByBucketAndObjectKeyParams{
				BucketFolderID: baseID,
				AwsObjectKey:   sqltypes.ToValidNullString("test-key"),
				Status:         pophealthsql.FileStatusNew,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				AwsObjectKey:   sqltypes.ToValidNullString("test-key"),
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
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

			got, err := pdb.GetFileByBucketAndObjectKey(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFileByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name string
		file pophealthsql.AddFileParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			gotFile, err := pdb.GetFileByID(ctx, newFile.ID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, gotFile)
		})
	}
}

func TestPopHealthDB_GetFileByPrefectFlowRunID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	prefectFlowRunID := sqltypes.ToValidNullString(strconv.Itoa(int(baseID)))
	tests := []struct {
		name string
		file pophealthsql.AddFileParams

		want *pophealthsql.GetFileByPrefectFlowRunIDRow
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},

			want: &pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				SubmittedAt:    sqltypes.ToValidNullTime(time.Now()),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			_, err = queries.UpdateFileStartProcessingByID(ctx, pophealthsql.UpdateFileStartProcessingByIDParams{
				ID:               newFile.ID,
				PrefectFlowRunID: prefectFlowRunID,
				Status:           pophealthsql.FileStatusProcessing,
			})
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFileByPrefectFlowRunID(ctx, prefectFlowRunID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".SubmittedAt")(t, test.want, got)
			testutils.MustMatch(t, test.want.SubmittedAt.Valid, got.SubmittedAt.Valid)
		})
	}
}

func TestPopHealthDB_GetFileCountForBucketFolder(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.GetFileCountForBucketFolderParams

		want int64
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessed,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.GetFileCountForBucketFolderParams{
				BucketFolderID:      baseID,
				StatusFilterEnabled: true,
				SearchForProcessed:  true,
				StatusProcessed:     pophealthsql.FileStatusProcessed,
				SearchNameEnabled:   true,
				NameSearched:        "teStF",
			},

			want: 1,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			_, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFileCountForBucketFolder(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFilesByBucket(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		file     pophealthsql.AddFileParams
		template pophealthsql.AddTemplateToBucketFolderParams
		params   pophealthsql.GetFilesByBucketParams

		want []*pophealthsql.GetFilesByBucketRow
	}{
		{
			name: "success - base case for status and name filter",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessed,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:      baseID,
				ChannelItemID:       baseID + 1,
				MarketID:            baseID + 2,
			},
			params: pophealthsql.GetFilesByBucketParams{
				BucketFolderID:      baseID,
				StatusFilterEnabled: true,
				SearchForProcessed:  true,
				StatusProcessed:     pophealthsql.FileStatusProcessed,
				SearchNameEnabled:   true,
				NameSearched:        "teStF",
			},

			want: []*pophealthsql.GetFilesByBucketRow{
				{
					ID:             baseID,
					Filename:       "TestFile",
					Status:         pophealthsql.FileStatusProcessed,
					TemplateName:   sqltypes.ToValidNullString("TestTemplate"),
					FileType:       sqltypes.ToValidNullString("txt"),
					FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				},
			},
		},
		{
			name: "success - get file with FileParameters and IsBackfill",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile2",
				Status:         pophealthsql.FileStatusProcessed,
				BucketFolderID: baseID + 1,
				FileParameters: pgtype.JSONB{Bytes: []byte("{\"force_upload\": true, \"start_date\": \"2023-07-01\", \"end_date\": \"2023-07-01\"}"), Status: pgtype.Present},
				IsBackfill:     true,
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:      baseID + 1,
				ChannelItemID:       baseID + 3,
				MarketID:            baseID + 4,
			},
			params: pophealthsql.GetFilesByBucketParams{
				BucketFolderID:  baseID + 1,
				StatusProcessed: pophealthsql.FileStatusProcessed,
			},

			want: []*pophealthsql.GetFilesByBucketRow{
				{
					ID:             baseID + 1,
					Filename:       "TestFile2",
					Status:         pophealthsql.FileStatusProcessed,
					TemplateName:   sqltypes.ToValidNullString("TestTemplate"),
					FileType:       sqltypes.ToValidNullString("txt"),
					IsBackfill:     true,
					FileParameters: pgtype.JSONB{Bytes: []byte("{\"end_date\": \"2023-07-01\", \"start_date\": \"2023-07-01\", \"force_upload\": true}"), Status: pgtype.Present},
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

			test.file.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			_, err = queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFilesByBucket(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFilesByChannelItemAndBucketID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		file     pophealthsql.AddFileParams
		template pophealthsql.AddTemplateToBucketFolderParams
		params   pophealthsql.GetFilesByChannelItemAndBucketIDParams

		want []*pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
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
				BucketFolderID:      baseID,
				ChannelItemID:       baseID + 1,
				MarketID:            baseID + 2,
			},
			params: pophealthsql.GetFilesByChannelItemAndBucketIDParams{
				BucketFolderID: baseID,
				ChannelItemIds: []int64{baseID + 1},
			},

			want: []*pophealthsql.File{
				{
					ID:             baseID,
					Filename:       "TestFile",
					Status:         pophealthsql.FileStatusNew,
					FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
					BucketFolderID: baseID,
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

			test.file.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			test.want[0].TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			_, err = queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFilesByChannelItemAndBucketID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetOldestFileByStatusWithChannelItem(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		file     pophealthsql.AddFileParams
		template pophealthsql.AddTemplateToBucketFolderParams
		params   pophealthsql.GetOldestFileByStatusWithChannelItemParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				IsBackfill:     true,
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:      baseID,
				ChannelItemID:       baseID + 1,
				MarketID:            baseID + 2,
			},
			params: pophealthsql.GetOldestFileByStatusWithChannelItemParams{
				Status:        pophealthsql.FileStatusPreprocess,
				ChannelItemID: baseID + 1,
				IsBackfill:    true,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusPreprocess,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID: baseID,
				IsBackfill:     true,
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

			test.file.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			test.want.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			_, err = queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetOldestFileByStatusWithChannelItem(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetProcessingBackfillFileByChannelItemID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name     string
		file     pophealthsql.AddFileParams
		template pophealthsql.AddTemplateToBucketFolderParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				IsBackfill:     true,
			},
			template: pophealthsql.AddTemplateToBucketFolderParams{
				Name:                "TestTemplate",
				FileType:            "txt",
				FileIdentifierType:  "test-type",
				FileIdentifierValue: "test-value",
				ColumnMapping:       pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:      baseID,
				ChannelItemID:       baseID + 1,
				MarketID:            baseID + 2,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID: baseID,
				IsBackfill:     true,
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

			test.file.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			test.want.TemplateID = sqltypes.ToValidNullInt64(newTemplate.ID)
			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}
			defer func() {
				_, err := queries.DeleteFileByID(ctx, newFile.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			got, err := pdb.GetProcessingBackfillFileByChannelItemID(ctx, newTemplate.ChannelItemID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_UpdateAwsObjectKeyInFilesByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	updatedAwsObjectKey := sqltypes.ToValidNullString("updated-test-key")
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.UpdateAwsObjectKeyInFilesByIDParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				AwsObjectKey:   sqltypes.ToValidNullString("test-key"),
			},
			params: pophealthsql.UpdateAwsObjectKeyInFilesByIDParams{
				AwsObjectKey: updatedAwsObjectKey,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID: baseID,
				AwsObjectKey:   updatedAwsObjectKey,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newFile.ID
			got, err := pdb.UpdateAwsObjectKeyInFilesByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_UpdateFileByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	updatedNumberOfPatientsLoaded := int32(10)
	updatedPatientsUpdatedCount := int32(5)
	updatedPatientsDeletedCount := int32(3)
	updatedStatus := pophealthsql.FileStatusProcessed
	updatedProcessedAt := sqltypes.ToValidNullTime(time.Now())
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.UpdateFileByIDParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.UpdateFileByIDParams{
				NumberOfPatientsLoaded: updatedNumberOfPatientsLoaded,
				PatientsUpdatedCount:   updatedPatientsUpdatedCount,
				PatientsDeletedCount:   updatedPatientsDeletedCount,
				Status:                 updatedStatus,
				ProcessedAt:            updatedProcessedAt,
			},

			want: &pophealthsql.File{
				ID:                     baseID,
				Filename:               "TestFile",
				Status:                 updatedStatus,
				FileParameters:         pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:         baseID,
				NumberOfPatientsLoaded: updatedNumberOfPatientsLoaded,
				PatientsUpdatedCount:   updatedPatientsUpdatedCount,
				PatientsDeletedCount:   updatedPatientsDeletedCount,
				ProcessedAt:            updatedProcessedAt,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newFile.ID
			got, err := pdb.UpdateFileByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".ProcessedAt")(t, test.want, got)
			testutils.MustMatch(t, test.want.ProcessedAt.Valid, got.ProcessedAt.Valid)
		})
	}
}

func TestPopHealthDB_UpdateFileStartProcessingByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	updatedPrefectFlowRunID := sqltypes.ToValidNullString(strconv.Itoa(int(baseID)))
	updatedStatus := pophealthsql.FileStatusProcessing
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.UpdateFileStartProcessingByIDParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.UpdateFileStartProcessingByIDParams{
				PrefectFlowRunID: updatedPrefectFlowRunID,
				Status:           updatedStatus,
			},

			want: &pophealthsql.File{
				ID:               baseID,
				Filename:         "TestFile",
				Status:           updatedStatus,
				FileParameters:   pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID:   baseID,
				PrefectFlowRunID: updatedPrefectFlowRunID,
				SubmittedAt:      sqltypes.ToValidNullTime(time.Now()),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newFile.ID
			got, err := pdb.UpdateFileStartProcessingByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".SubmittedAt")(t, test.want, got)
			testutils.MustMatch(t, test.want.SubmittedAt.Valid, got.SubmittedAt.Valid)
		})
	}
}

func TestPopHealthDB_UpdateFileStatusByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	updatedProcessedAt := sqltypes.ToValidNullTime(time.Now())
	updatedStatus := pophealthsql.FileStatusProcessed
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.UpdateFileStatusByIDParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.UpdateFileStatusByIDParams{
				ProcessedAt: updatedProcessedAt,
				Status:      updatedStatus,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         updatedStatus,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID: baseID,
				ProcessedAt:    updatedProcessedAt,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newFile.ID
			got, err := pdb.UpdateFileStatusByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt", ".ProcessedAt")(t, test.want, got)
			testutils.MustMatch(t, test.want.ProcessedAt.Valid, got.ProcessedAt.Valid)
		})
	}
}

func TestPopHealthDB_UpdateTemplateInFileByID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	updatedTemplateID := sqltypes.ToValidNullInt64(6)
	tests := []struct {
		name   string
		file   pophealthsql.AddFileParams
		params pophealthsql.UpdateTemplateInFileByIDParams

		want *pophealthsql.File
	}{
		{
			name: "success - base case",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			},
			params: pophealthsql.UpdateTemplateInFileByIDParams{
				TemplateID: updatedTemplateID,
			},

			want: &pophealthsql.File{
				ID:             baseID,
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusNew,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				BucketFolderID: baseID,
				TemplateID:     updatedTemplateID,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}

			test.params.ID = newFile.ID
			got, err := pdb.UpdateTemplateInFileByID(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetNumberOfProcessingBackfillFiles(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name string
		file pophealthsql.AddFileParams

		want int64
	}{
		{
			name: "when there is a backfill file in processing state",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessing,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				IsBackfill:     true,
			},

			want: 1,
		},
		{
			name: "when there are no backfill files in processing state",
			file: pophealthsql.AddFileParams{
				Filename:       "TestFile",
				Status:         pophealthsql.FileStatusProcessed,
				BucketFolderID: baseID,
				FileParameters: pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
				IsBackfill:     true,
			},

			want: 0,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newFile, err := queries.AddFile(ctx, test.file)
			if err != nil {
				t.Fatal(err)
			}
			defer func() {
				_, err := queries.DeleteFileByID(ctx, newFile.ID)
				if err != nil {
					t.Fatal(err)
				}
			}()

			got, err := pdb.GetNumberOfProcessingBackfillFiles(ctx)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

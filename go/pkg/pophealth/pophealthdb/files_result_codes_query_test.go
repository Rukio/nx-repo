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
)

func TestPopHealthDB_AddFilesResultCodes(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		params pophealthsql.AddFilesResultCodesParams

		want *pophealthsql.FilesResultCode
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddFilesResultCodesParams{
				FileID:           baseID,
				ResultCodeID:     baseID + 1,
				Fields:           sqltypes.ToValidNullString("test-field"),
				ErrorDescription: sqltypes.ToValidNullString("test-error"),
			},

			want: &pophealthsql.FilesResultCode{
				FileID:              baseID,
				ResultCodeID:        baseID + 1,
				NumberOfOccurrences: 1,
				Fields:              sqltypes.ToValidNullString("test-field"),
				ErrorDescription:    sqltypes.ToValidNullString("test-error"),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			got, err := pdb.AddFilesResultCodes(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_AddFilesResultCodesWithOccurrences(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	tests := []struct {
		name   string
		params pophealthsql.AddFilesResultCodesWithOccurrencesParams

		want *pophealthsql.FilesResultCode
	}{
		{
			name: "success - base case",
			params: pophealthsql.AddFilesResultCodesWithOccurrencesParams{
				FileID:              baseID,
				ResultCodeID:        baseID + 1,
				Fields:              sqltypes.ToValidNullString("test-field"),
				NumberOfOccurrences: 4,
				FirstOccurrence:     sqltypes.ToValidNullInt32(2),
			},

			want: &pophealthsql.FilesResultCode{
				FileID:              baseID,
				ResultCodeID:        baseID + 1,
				NumberOfOccurrences: 4,
				FirstOccurrence:     sqltypes.ToValidNullInt32(2),
				Fields:              sqltypes.ToValidNullString("test-field"),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			got, err := pdb.AddFilesResultCodesWithOccurrences(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetFileResultCodesWithCodeDetailsByFileID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	code := strconv.Itoa(int(baseID))
	tests := []struct {
		name           string
		fileResultCode pophealthsql.AddFilesResultCodesWithOccurrencesParams
		resultCode     pophealthsql.CreateResultCodeParams

		want []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow
	}{
		{
			name: "success - base case",
			fileResultCode: pophealthsql.AddFilesResultCodesWithOccurrencesParams{
				FileID:              baseID,
				Fields:              sqltypes.ToValidNullString("test-field"),
				NumberOfOccurrences: 3,
				FirstOccurrence:     sqltypes.ToValidNullInt32(2),
			},
			resultCode: pophealthsql.CreateResultCodeParams{
				Code:            code,
				CodeDescription: sqltypes.ToValidNullString("test-code-description"),
				CodeLevel:       "test-code-level",
			},

			want: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					NumberOfOccurrences: 3,
					FirstOccurrence:     sqltypes.ToValidNullInt32(2),
					Fields:              sqltypes.ToValidNullString("test-field"),
					ResultCode:          code,
					CodeDescription:     sqltypes.ToValidNullString("test-code-description"),
					CodeLevel:           "test-code-level",
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			newCode, err := queries.CreateResultCode(ctx, test.resultCode)
			if err != nil {
				t.Fatal(err)
			}

			test.fileResultCode.ResultCodeID = newCode.ID
			newFileResultCode, err := queries.AddFilesResultCodesWithOccurrences(ctx, test.fileResultCode)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetFileResultCodesWithCodeDetailsByFileID(ctx, newFileResultCode.FileID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, test.want, got)
		})
	}
}

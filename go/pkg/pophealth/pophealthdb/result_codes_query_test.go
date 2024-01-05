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

func TestPopHealthDB_CreateResultCode(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	code := "Int-" + strconv.Itoa(int(baseID))
	tests := []struct {
		name   string
		params pophealthsql.CreateResultCodeParams

		want *pophealthsql.ResultCode
	}{
		{
			name: "success - base case",
			params: pophealthsql.CreateResultCodeParams{
				Code:            code,
				CodeDescription: sqltypes.ToValidNullString("TestCodeDescription"),
				CodeLevel:       "file",
			},

			want: &pophealthsql.ResultCode{
				ID:              baseID,
				Code:            code,
				CodeDescription: sqltypes.ToValidNullString("TestCodeDescription"),
				CodeLevel:       "file",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			got, err := pdb.CreateResultCode(ctx, test.params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

func TestPopHealthDB_GetResultCodeByCode(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseID := time.Now().UnixNano()
	code := "Int-" + strconv.Itoa(int(baseID))
	tests := []struct {
		name       string
		resultCode pophealthsql.CreateResultCodeParams

		want *pophealthsql.ResultCode
	}{
		{
			name: "success - base case",
			resultCode: pophealthsql.CreateResultCodeParams{
				Code:            code,
				CodeDescription: sqltypes.ToValidNullString("TestCodeDescription"),
				CodeLevel:       "file",
			},

			want: &pophealthsql.ResultCode{
				ID:              baseID,
				Code:            code,
				CodeDescription: sqltypes.ToValidNullString("TestCodeDescription"),
				CodeLevel:       "file",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			pdb := pophealthdb.NewPopHealthDB(db, nil)

			_, err := queries.CreateResultCode(ctx, test.resultCode)
			if err != nil {
				t.Fatal(err)
			}

			got, err := pdb.GetResultCodeByCode(ctx, code)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

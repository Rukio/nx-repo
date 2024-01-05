//go:build db_test

package insurancedb

import (
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v4"

	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestCreateInsurancePayer(t *testing.T) {
	baseID := time.Now().UnixNano()
	notes := sqltypes.ToValidNullString("some notes")

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	tcs := []struct {
		description string
		params      *insurancesql.CreateInsurancePayerParams
		want        *insurancesql.InsurancePayer

		error error
	}{
		{
			description: "success - creating payer with all data",
			params: &insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: baseID,
				IsActive:     true,
			},
			want: &insurancesql.InsurancePayer{
				Notes:        notes,
				IsActive:     true,
				PayerGroupID: baseID,
				ID:           baseID,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		},
		{
			description: "success - creating inactive payer",
			params: &insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: baseID,
				IsActive:     false,
			},
			want: &insurancesql.InsurancePayer{
				Notes:        notes,
				IsActive:     false,
				PayerGroupID: baseID,
				ID:           baseID,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		},
		{
			description: "success - creating payer without any notes",
			params: &insurancesql.CreateInsurancePayerParams{
				Notes:        sqltypes.ToNullString(nil),
				PayerGroupID: baseID,
				IsActive:     true,
			},
			want: &insurancesql.InsurancePayer{
				Notes:        sqltypes.ToNullString(nil),
				IsActive:     true,
				PayerGroupID: baseID,
				ID:           baseID,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		},
		{
			description: "failure - creating payer without name",
			params: &insurancesql.CreateInsurancePayerParams{
				PayerGroupID: baseID,
				IsActive:     true,
			},

			error: errors.New("invalid attempt to create InsurancePayer query without name"),
		},
	}

	for i, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			if tc.error == nil {
				tc.params.Name = fmt.Sprint(baseID + int64(i))
				tc.want.Name = fmt.Sprint(baseID + int64(i))
			}
			payer, err := insuranceDB.CreateInsurancePayer(ctx, *tc.params)

			testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, tc.want, payer)
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestDeleteInsurancePayer(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payerName := fmt.Sprintf("payer_name_%d", baseID)
	dbPayer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: payerName,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		payerID     int64

		deleted bool
	}{
		{
			description: "success - deletes insurance payer",
			payerID:     dbPayer.ID,

			deleted: true,
		},
		{
			description: "failure - trying to delete non existing insurance payer",
			payerID:     -1,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			got, err := insuranceDB.DeleteInsurancePayer(ctx, tc.payerID)

			if tc.deleted {
				testutils.MustMatch(t, tc.deleted, got.DeletedAt.Valid)
			} else {
				testutils.MustMatch(t, pgx.ErrNoRows.Error(), err.Error())
			}
		})
	}
}

func TestGetInsurancePayer(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)
	createdPayer, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name:         fmt.Sprint(baseID),
		Notes:        sqltypes.ToValidNullString("test notes"),
		PayerGroupID: baseID,
		IsActive:     true,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		payerID     int64

		error error
	}{
		{
			description: "success - payer with all data",
			payerID:     createdPayer.ID,
		},
		{
			description: "failure - not rows in result set",
			payerID:     createdPayer.ID + 1,

			error: errors.New("no rows in result set"),
		},
		{
			description: "failure - not existing payer",
			payerID:     0,

			error: errors.New("invalid attempt to get InsurancePayer without id"),
		},
		{
			description: "failure - get payer with the negative number as ID",
			payerID:     -5,

			error: errors.New("invalid attempt to get InsurancePayer without id"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			getPayer, err := insuranceDB.GetInsurancePayer(ctx, tc.payerID)
			if tc.error == nil {
				testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")(t, createdPayer, getPayer)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestGetInsurancePayersWithFilterAndOrder(t *testing.T) {
	baseID := time.Now().UnixNano()
	notes := sqltypes.ToValidNullString("some notes")

	const (
		ascOrder  = "asc"
		descOrder = "desc"
	)

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	_, err := insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: fmt.Sprintf("a payer for order check with lowercase %d", baseID),
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = insuranceDB.CreateInsurancePayer(ctx, insurancesql.CreateInsurancePayerParams{
		Name: fmt.Sprintf("A payer for order check with uppercase %d", baseID),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description       string
		createPayerParams insurancesql.CreateInsurancePayerParams
		searchString      string
		sortByField       string
		sortDirection     string

		want bool
	}{
		{
			description: "success - payer with all data",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},

			want: true,
		},
		{
			description: "success - not active payer",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     false,
			},

			want: true,
		},
		{
			description: "success - payer without any notes",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        sqltypes.ToNullString(nil),
				PayerGroupID: 1,
				IsActive:     true,
			},

			want: true,
		},
		{
			description: "success - search for payers with part of the name in search string",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			searchString: fmt.Sprint(baseID)[:len(fmt.Sprint(baseID))-2],

			want: true,
		},
		{
			description: "failure - no payer with given name in search string",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			searchString: "unexisting payer",

			want: false,
		},
		{
			description: "success - default ascending order by name with lowercase name",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			sortByField:   "name",
			sortDirection: ascOrder,

			want: true,
		},
		{
			description: "success - default ascending order by name with uppercase name",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			sortByField:   "name",
			sortDirection: ascOrder,

			want: true,
		},
		{
			description: "success - descending order by name",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			sortByField:   "name",
			sortDirection: descOrder,

			want: true,
		},
		{
			description: "success - ascending order by updated_at",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			sortByField:   "updated_at",
			sortDirection: ascOrder,

			want: true,
		},
		{
			description: "success - descending order by updated_at",
			createPayerParams: insurancesql.CreateInsurancePayerParams{
				Notes:        notes,
				PayerGroupID: 1,
				IsActive:     true,
			},
			sortByField:   "updated_at",
			sortDirection: descOrder,

			want: true,
		},
	}

	for i, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			tc.createPayerParams.Name = fmt.Sprintf("%d%d", baseID, i)
			createdPayer, err := insuranceDB.CreateInsurancePayer(ctx, tc.createPayerParams)
			if err != nil {
				t.Fatal(err)
			}

			params := insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				SearchString:  tc.searchString,
				SortDirection: tc.sortDirection,
				SortBy:        tc.sortByField,
			}
			payers, err := insuranceDB.GetInsurancePayersWithFilterAndOrder(ctx, params)
			if err != nil {
				t.Fatal(err)
			}

			found := false
			for _, payer := range payers {
				if payer.ID == createdPayer.ID {
					found = true
					break
				}
			}

			switch tc.sortByField {
			case "name":
				if tc.sortDirection == ascOrder {
					for i := 1; i < len(payers); i++ {
						if strings.ToLower(payers[i-1].Name) > strings.ToLower(payers[i].Name) {
							t.Fatalf("unexpected asc order by name: %v > %v", payers[i-1].Name, payers[i].Name)
						}
					}
				} else {
					for i := 1; i < len(payers); i++ {
						if strings.ToLower(payers[i-1].Name) < strings.ToLower(payers[i].Name) {
							t.Fatalf("unexpected desc order by name: %v < %v", payers[i-1].Name, payers[i].Name)
						}
					}
				}
			case "updated_at":
				if tc.sortDirection == ascOrder {
					if payers[0].UpdatedAt.After(payers[1].UpdatedAt) {
						t.Fatalf("unexpected asc order by updated_at: %v > %v", payers[0].UpdatedAt, payers[1].UpdatedAt)
					}
				} else {
					if payers[0].UpdatedAt.Before(payers[1].UpdatedAt) {
						t.Fatalf("unexpected desc order by updated_at: %v < %v", payers[0].UpdatedAt, payers[1].UpdatedAt)
					}
				}
			}

			if tc.want && !found {
				t.Fatalf("createdPayer not found in array of insurance payers")
			}
		})
	}
}

func TestUpdateInsurancePayer(t *testing.T) {
	baseID := time.Now().UnixNano()

	ctx, db, done := setupDBTest(t)
	defer done()

	insuranceDB := NewInsuranceDB(db)

	payerName := fmt.Sprintf("payer_to_update_%d", baseID)
	payerGroupID := baseID
	payerNotes := sqltypes.ToValidNullString("notes about this payer")
	isActive := false

	payerUpdatedName := fmt.Sprintf("payer_updated_%d", baseID)
	payerUpdatedGroupID := baseID + 1
	payerUpdatedNotes := sqltypes.ToNullString(nil)
	payerUpdatedIsActive := true

	input := insurancesql.CreateInsurancePayerParams{
		Name:         payerName,
		IsActive:     isActive,
		Notes:        payerNotes,
		PayerGroupID: payerGroupID,
	}
	dbPayer, err := insuranceDB.CreateInsurancePayer(ctx, input)
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		params      *insurancesql.UpdateInsurancePayerParams
		want        *insurancesql.InsurancePayer

		wantError bool
		error     error
	}{
		{
			description: "success - updates insurance payer",
			params: &insurancesql.UpdateInsurancePayerParams{
				ID:           dbPayer.ID,
				Name:         payerUpdatedName,
				PayerGroupID: payerUpdatedGroupID,
				Notes:        payerUpdatedNotes,
				IsActive:     payerUpdatedIsActive,
			},

			want: &insurancesql.InsurancePayer{
				ID:           dbPayer.ID,
				Name:         payerUpdatedName,
				PayerGroupID: payerUpdatedGroupID,
				Notes:        payerUpdatedNotes,
				IsActive:     payerUpdatedIsActive,
			},
		},
		{
			description: "failure - no such insurance payer",
			params:      &insurancesql.UpdateInsurancePayerParams{ID: 0, Name: payerUpdatedName},

			wantError: true,
			error:     pgx.ErrNoRows,
		},
		{
			description: "failure - invalid insurance name argument",
			params:      &insurancesql.UpdateInsurancePayerParams{ID: dbPayer.ID, Name: ""},

			wantError: true,
			error:     errors.New("payer.name can not be blank"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			updatedPayer, err := insuranceDB.UpdateInsurancePayer(ctx, *tc.params)
			if err != nil && !tc.wantError {
				t.Fatal(err)
			}

			if !tc.wantError {
				testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, updatedPayer, tc.want, "insurance payer didn't match")
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

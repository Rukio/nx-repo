//go:build db_test

package main

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName                = "patients"
	mustMatchPatientWithoutID = testutils.MustMatchFn(".ID", ".CreatedAt", ".UpdatedAt")
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *patientssql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, patientssql.New(db), func() {
		db.Close()
	}
}

func TestIsHealthy(t *testing.T) {
	tcs := []struct {
		name string
		db   *basedb.MockPingDBTX

		want bool
	}{
		{
			name: "DB is healthy",
			db:   &basedb.MockPingDBTX{},
			want: true,
		},
		{
			name: "DB is unhealthy",
			db:   &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			want: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			patientsDB := NewPatientsDB(tc.db)
			isHealthy := patientsDB.IsHealthy(context.Background())
			testutils.MustMatch(t, tc.want, isHealthy, "IsHealthy test failed")
		})
	}
}

func TestAddUnverifiedPatient(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()
	examplePhoneNumber := "+1-555-555-5555"
	anotherGenderIdentity := "another gender identity"
	exampleDOB := time.Date(2023, 5, 25, 0, 0, 0, 0, time.UTC)
	id1 := baseID + 1
	id2 := baseID + 2
	id3 := baseID + 3
	id4 := baseID + 4

	tcs := []struct {
		desc         string
		createParams patientssql.AddUnverifiedPatientParams

		want    *patientssql.UnverifiedPatient
		wantErr error
	}{
		{
			desc: "success - all fields",
			createParams: patientssql.AddUnverifiedPatientParams{
				AthenaID:              sqltypes.ToNullInt64(&id1),
				DateOfBirth:           exampleDOB,
				GivenName:             "examplegiven",
				FamilyName:            "examplefamily",
				PhoneNumber:           sqltypes.ToNullString(&examplePhoneNumber),
				LegalSex:              "m",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
				GenderIdentity:        patientssql.NullGenderIdentity{GenderIdentity: "other", Valid: true},
				GenderIdentityDetails: sqltypes.ToNullString(&anotherGenderIdentity),
			},

			want: &patientssql.UnverifiedPatient{
				AthenaID:              sqltypes.ToNullInt64(&id1),
				DateOfBirth:           exampleDOB,
				GivenName:             "examplegiven",
				FamilyName:            "examplefamily",
				PhoneNumber:           sqltypes.ToNullString(&examplePhoneNumber),
				LegalSex:              "m",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
				GenderIdentity:        patientssql.NullGenderIdentity{GenderIdentity: "other", Valid: true},
				GenderIdentityDetails: sqltypes.ToNullString(&anotherGenderIdentity),
			},
		},
		{
			desc: "success - required fields only",
			createParams: patientssql.AddUnverifiedPatientParams{
				AthenaID:    sqltypes.ToNullInt64(&id2),
				DateOfBirth: exampleDOB,
				GivenName:   "examplegiven",
				FamilyName:  "examplefamily",
				LegalSex:    "m",
			},

			want: &patientssql.UnverifiedPatient{
				AthenaID:    sqltypes.ToNullInt64(&id2),
				DateOfBirth: exampleDOB,
				GivenName:   "examplegiven",
				FamilyName:  "examplefamily",
				LegalSex:    "m",
			},
		},
		{
			desc: "error - missing given name",
			createParams: patientssql.AddUnverifiedPatientParams{
				AthenaID:    sqltypes.ToNullInt64(&id3),
				DateOfBirth: exampleDOB,
				FamilyName:  "examplefamily",
				LegalSex:    "m",
			},

			wantErr: errBlankGivenName,
		},
		{
			desc: "error - missing family name",
			createParams: patientssql.AddUnverifiedPatientParams{
				AthenaID:    sqltypes.ToNullInt64(&id4),
				DateOfBirth: exampleDOB,
				GivenName:   "examplegiven",
				LegalSex:    "m",
			},

			wantErr: errBlankFamilyName,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientsDB := NewPatientsDB(db)
			unverifiedPatient, err := patientsDB.AddUnverifiedPatient(ctx, tc.createParams)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchPatientWithoutID(t, tc.want, unverifiedPatient)
		})
	}
}

func TestListUnverifiedPatientsByIds(t *testing.T) {
	ctx, db, query, done := setupDBTest(t)
	defer done()
	exampleDOB := time.Date(2023, 5, 25, 0, 0, 0, 0, time.UTC)

	patientsDB := NewPatientsDB(db)
	unverifiedPatient, err := query.AddUnverifiedPatient(ctx, patientssql.AddUnverifiedPatientParams{
		AthenaID:    sqltypes.ToValidNullInt64(123),
		DateOfBirth: exampleDOB,
		GivenName:   "examplegiven",
		FamilyName:  "examplefamily",
		LegalSex:    "m",
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc   string
		params []int64

		want    []*patientssql.UnverifiedPatient
		wantErr error
	}{
		{
			desc:   "base case",
			params: []int64{unverifiedPatient.ID},

			want: []*patientssql.UnverifiedPatient{
				{
					DateOfBirth: exampleDOB,
					AthenaID:    sqltypes.ToValidNullInt64(123),
					GivenName:   "examplegiven",
					FamilyName:  "examplefamily",
					LegalSex:    "m",
				},
			},
		},
		{
			desc: "empty IDs",

			want: []*patientssql.UnverifiedPatient{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			unverifiedPatients, err := patientsDB.ListUnverifiedPatientsByIds(ctx, tc.params)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchPatientWithoutID(t, tc.want, unverifiedPatients)
		})
	}
}

func TestGetUnverifiedPatientByID(t *testing.T) {
	ctx, db, query, done := setupDBTest(t)
	defer done()
	exampleDOB := time.Date(2023, 5, 25, 0, 0, 0, 0, time.UTC)

	patientsDB := NewPatientsDB(db)
	unverifiedPatient, err := query.AddUnverifiedPatient(ctx, patientssql.AddUnverifiedPatientParams{
		AthenaID:    sqltypes.ToValidNullInt64(123),
		DateOfBirth: exampleDOB,
		GivenName:   "examplegiven",
		FamilyName:  "examplefamily",
		LegalSex:    "m",
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc string
		id   int64

		want    *patientssql.UnverifiedPatient
		wantErr error
	}{
		{
			desc: "base case",
			id:   unverifiedPatient.ID,

			want: &patientssql.UnverifiedPatient{
				DateOfBirth: exampleDOB,
				AthenaID:    sqltypes.ToValidNullInt64(123),
				GivenName:   "examplegiven",
				FamilyName:  "examplefamily",
				LegalSex:    "m",
			},
		},
		{
			desc: "invalid ID - less than zero",
			id:   -1,

			wantErr: errInvalidID,
		},
		{
			desc: "invalid ID - zero",

			wantErr: errInvalidID,
		},
		{
			desc: "patient not found",
			id:   unverifiedPatient.ID + 1,

			wantErr: errPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			unverifiedPatients, err := patientsDB.GetUnverifiedPatientByID(ctx, tc.id)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchPatientWithoutID(t, tc.want, unverifiedPatients)
		})
	}
}

func TestUpdateUnverifiedPatientByID(t *testing.T) {
	ctx, db, query, done := setupDBTest(t)
	defer done()
	exampleDOB := time.Date(2023, 5, 25, 0, 0, 0, 0, time.UTC)

	patientsDB := NewPatientsDB(db)
	unverifiedPatient, err := query.AddUnverifiedPatient(ctx, patientssql.AddUnverifiedPatientParams{
		AthenaID:    sqltypes.ToValidNullInt64(123),
		DateOfBirth: exampleDOB,
		GivenName:   "examplegiven",
		FamilyName:  "examplefamily",
		LegalSex:    "m",
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		input patientssql.UpdateUnverifiedPatientParams

		want    *patientssql.UnverifiedPatient
		wantErr error
	}{
		{
			desc: "base case",
			input: patientssql.UpdateUnverifiedPatientParams{
				AthenaID:              sqltypes.ToValidNullInt64(123),
				DateOfBirth:           exampleDOB,
				GivenName:             "examplegiven",
				FamilyName:            "examplefamily",
				LegalSex:              "f",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
				GenderIdentity:        ToNullGenderIdentity("f"),
				GenderIdentityDetails: sqltypes.ToValidNullString("text"),
				ID:                    unverifiedPatient.ID,
			},

			want: &patientssql.UnverifiedPatient{
				AthenaID:              sqltypes.ToValidNullInt64(123),
				DateOfBirth:           exampleDOB,
				GivenName:             "examplegiven",
				FamilyName:            "examplefamily",
				LegalSex:              "f",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
				GenderIdentity:        ToNullGenderIdentity("f"),
				GenderIdentityDetails: sqltypes.ToValidNullString("text"),
				ID:                    unverifiedPatient.ID,
			},
		},
		{
			desc:  "invalid ID - less than zero",
			input: patientssql.UpdateUnverifiedPatientParams{ID: -1},

			wantErr: errInvalidID,
		},
		{
			desc:  "invalid ID - zero",
			input: patientssql.UpdateUnverifiedPatientParams{ID: 0},

			wantErr: errInvalidID,
		},
		{
			desc: "patient not found",
			input: patientssql.UpdateUnverifiedPatientParams{
				AthenaID:              sqltypes.ToValidNullInt64(123),
				DateOfBirth:           exampleDOB,
				GivenName:             "examplegiven",
				FamilyName:            "examplefamily",
				LegalSex:              "f",
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
				GenderIdentity:        ToNullGenderIdentity("f"),
				GenderIdentityDetails: sqltypes.ToValidNullString("text"),
				ID:                    unverifiedPatient.ID + 1,
			},

			wantErr: errPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			unverifiedPatients, err := patientsDB.UpdateUnverifiedPatientByID(ctx, tc.input)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchPatientWithoutID(t, tc.want, unverifiedPatients)
		})
	}
}

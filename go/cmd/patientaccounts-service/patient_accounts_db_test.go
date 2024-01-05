//go:build db_test

package main

import (
	"context"
	"database/sql"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
	"google.golang.org/protobuf/proto"
)

var (
	testDBName = "patientaccounts"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, func() {
		db.Close()
	}
}

func TestIsHealthy(t *testing.T) {
	tcs := []struct {
		Name string
		DB   *basedb.MockPingDBTX

		WantHealthy bool
	}{
		{
			Name:        "DB is healthy",
			DB:          &basedb.MockPingDBTX{},
			WantHealthy: true,
		},
		{
			Name:        "DB is unhealthy",
			DB:          &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			WantHealthy: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(tc.DB)
			isHealthy := patientAccountsDB.IsHealthy(context.Background())
			testutils.MustMatch(t, tc.WantHealthy, isHealthy, "IsHealthy test failed")
		})
	}
}

func TestCreateAccount(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2
	id3 := baseID + 3
	id4 := baseID + 4

	tcs := []struct {
		desc         string
		createParams patientaccountssql.CreateAccountParams

		want    *patientaccountssql.Account
		wantErr error
	}{
		{
			desc: "success - all fields",
			createParams: patientaccountssql.CreateAccountParams{
				Auth0ID: strconv.FormatInt(id1, 10),
				Email:   testEmail(id1),
			},

			want: &patientaccountssql.Account{
				Auth0ID:     strconv.FormatInt(id1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToNullString(nil),
				FamilyName:  sqltypes.ToNullString(nil),
				PhoneNumber: sqltypes.ToNullString(nil),
			},
		},
		{
			desc: "success - required fields only",
			createParams: patientaccountssql.CreateAccountParams{
				Auth0ID: strconv.FormatInt(id2, 10),
				Email:   testEmail(id2),
			},

			want: &patientaccountssql.Account{
				Auth0ID:     strconv.FormatInt(id2, 10),
				Email:       testEmail(id2),
				GivenName:   sqltypes.ToNullString(nil),
				FamilyName:  sqltypes.ToNullString(nil),
				PhoneNumber: sqltypes.ToNullString(nil),
			},
		},
		{
			desc: "error - missing auth0 id",
			createParams: patientaccountssql.CreateAccountParams{
				Email: testEmail(id3),
			},

			wantErr: errBlankAuth0ID,
		},
		{
			desc: "error - missing email",
			createParams: patientaccountssql.CreateAccountParams{
				Auth0ID: strconv.FormatInt(id4, 10),
			},

			wantErr: errBlankEmail,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			account, err := patientAccountsDB.CreateAccount(ctx, tc.createParams)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, account)
		})
	}
}

func TestGetAccount(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.Account
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: account.ID,

			want: account,
		},
		{
			desc:  "error - not found",
			query: account.ID + 1,

			wantErr: errAccountNotFound,
		},
		{
			desc:  "error - invalid account id - zero",
			query: 0,

			wantErr: errInvalidAccountID,
		},
		{
			desc:  "error - invalid account id - less than zero",
			query: -1,

			wantErr: errInvalidAccountID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			account, err := patientAccountsDB.GetAccount(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, account)
		})
	}
}

func TestGetAccountByAuth0ID(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query string

		want    *patientaccountssql.Account
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: account.Auth0ID,

			want: account,
		},
		{
			desc:  "error - not found",
			query: "fake ID",

			wantErr: errAccountNotFound,
		},
		{
			desc:  "error - invalid auth0 id",
			query: "",

			wantErr: errBlankAuth0ID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			account, err := patientAccountsDB.GetAccountByAuth0ID(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, account)
		})
	}
}

func TestCreateAddress(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	patientAccountsDB := NewPatientAccountsDB(db)
	defer done()
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountWithMaxAddresses, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id2, 10),
		Email:   testEmail(id2),
	})
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < accountSavedAddressesMax; i++ {
		_, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
			AccountID:       accountWithMaxAddresses.ID,
			AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
			AddressLineTwo:  sqltypes.ToValidNullString("#2"),
			City:            sqltypes.ToValidNullString("springfield"),
			Zipcode:         sqltypes.ToValidNullString("90210"),
			LocationDetails: sqltypes.ToValidNullString("brick house"),
			StateCode:       sqltypes.ToValidNullString("CA"),
			LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
			LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
			FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	tcs := []struct {
		desc         string
		createParams patientaccountssql.CreateAccountAddressParams

		want    *patientaccountssql.Address
		wantErr error
	}{
		{
			desc: "success - all fields",
			createParams: patientaccountssql.CreateAccountAddressParams{
				AccountID:       account.ID,
				AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
				AddressLineTwo:  sqltypes.ToValidNullString("#2"),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				LocationDetails: sqltypes.ToValidNullString("brick house"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},

			want: &patientaccountssql.Address{
				ID:              id1,
				AccountID:       account.ID,
				AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
				AddressLineTwo:  sqltypes.ToValidNullString("#2"),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				LocationDetails: sqltypes.ToValidNullString("brick house"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},
		},
		{
			desc: "error - missing account id",
			createParams: patientaccountssql.CreateAccountAddressParams{
				AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
				AddressLineTwo:  sqltypes.ToValidNullString("#2"),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				LocationDetails: sqltypes.ToValidNullString("brick house"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},

			wantErr: errInvalidAccountID,
		},
		{
			desc: "error - maximum account addresses",
			createParams: patientaccountssql.CreateAccountAddressParams{
				AccountID:       accountWithMaxAddresses.ID,
				AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
				AddressLineTwo:  sqltypes.ToValidNullString("#2"),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				LocationDetails: sqltypes.ToValidNullString("brick house"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},

			wantErr: errMaxAddressCount,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			address, err := patientAccountsDB.CreateAddress(ctx, tc.createParams)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAddressWithoutID(t, tc.want, address)
		})
	}
}

func TestDeleteAccountPatient(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	patientAccountsDB := NewPatientAccountsDB(db)
	defer done()
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountPatient, err := patientAccountsDB.queries.AddAccountPatientLink(ctx, patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                account.ID,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(id1),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: accountPatient.ID,

			wantErr: nil,
		},
		{
			desc:  "error - invalid account patient id - zero",
			query: -1,

			wantErr: errInvalidAccountPatientID,
		},
		{
			desc:  "error - invalid account patient id - less than zero",
			query: -1,

			wantErr: errInvalidAccountPatientID,
		},
		{
			desc:  "error - not found",
			query: accountPatient.ID + 1,

			wantErr: errAccountPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			err := patientAccountsDB.DeleteAccountPatientLink(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
		})
	}
}

func TestDeleteAccountAddress(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	patientAccountsDB := NewPatientAccountsDB(db)
	defer done()
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountAddress, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:      account.ID,
		AddressLineOne: sqltypes.ToValidNullString("1234 Example Lane"),
		AddressLineTwo: sqltypes.ToValidNullString("Unit 12-34"),
		City:           sqltypes.ToValidNullString("Exampleville"),
		StateCode:      sqltypes.ToValidNullString("CO"),
		Zipcode:        sqltypes.ToValidNullString("80123"),
		FacilityTypeID: FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_LONG_TERM_CARE_FACILITY],
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.Address
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: accountAddress.ID,

			wantErr: nil,
		},
		{
			desc:  "error - invalid account address id - zero",
			query: 0,

			wantErr: errInvalidAccountAddressID,
		},
		{
			desc:  "error - invalid account address id - less than zero",
			query: -1,

			wantErr: errInvalidAccountAddressID,
		},
		{
			desc:  "error - not found",
			query: accountAddress.ID + 1,

			wantErr: errAccountAddressNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			err := patientAccountsDB.DeleteAccountAddress(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
		})
	}
}

func TestUpdateAccount(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc         string
		updateParams patientaccountssql.UpdateAccountParams
		accountID    int64
		givenName    *string
		familyName   *string

		want    *patientaccountssql.Account
		wantErr error
	}{
		{
			desc: "success - base case",
			updateParams: patientaccountssql.UpdateAccountParams{
				ID:         account.ID,
				GivenName:  sqltypes.ToValidNullString("given"),
				FamilyName: sqltypes.ToValidNullString("family"),
			},

			want: &patientaccountssql.Account{
				ID:          account.ID,
				Auth0ID:     strconv.FormatInt(id1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString("given"),
				FamilyName:  sqltypes.ToValidNullString("family"),
				PhoneNumber: sqltypes.ToNullString(nil),
			},
		},
		{
			desc: "success - fields coalesce",
			updateParams: patientaccountssql.UpdateAccountParams{
				ID:        account.ID,
				GivenName: sqltypes.ToValidNullString("given2"),
			},

			want: &patientaccountssql.Account{
				ID:          account.ID,
				Auth0ID:     strconv.FormatInt(id1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString("given2"),
				FamilyName:  sqltypes.ToValidNullString("family"),
				PhoneNumber: sqltypes.ToNullString(nil),
			},
		},
		{
			desc: "success - fields can be cleared",
			updateParams: patientaccountssql.UpdateAccountParams{
				ID:         account.ID,
				GivenName:  sqltypes.ToValidNullString(""),
				FamilyName: sqltypes.ToValidNullString(""),
			},

			want: &patientaccountssql.Account{
				ID:          account.ID,
				Auth0ID:     strconv.FormatInt(id1, 10),
				Email:       testEmail(id1),
				GivenName:   sqltypes.ToValidNullString(""),
				FamilyName:  sqltypes.ToValidNullString(""),
				PhoneNumber: sqltypes.ToNullString(nil),
			},
		},
		{
			desc: "error - account does not exist",
			updateParams: patientaccountssql.UpdateAccountParams{
				ID:         -1,
				GivenName:  sqltypes.ToValidNullString(""),
				FamilyName: sqltypes.ToValidNullString(""),
			},

			wantErr: errAccountNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			var originalAccount *patientaccountssql.Account
			if tc.want != nil {
				originalAccount, err = patientAccountsDB.GetAccount(ctx, tc.updateParams.ID)
			}
			got, err := patientAccountsDB.UpdateAccount(ctx, tc.updateParams)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, got)
			if originalAccount != nil {
				testutils.MustMatch(t, originalAccount.UpdatedAt != got.UpdatedAt, true, "updated_at expected to change")
			}
		})
	}
}

func TestListAddresses(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	address1, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:       account.ID,
		AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
		AddressLineTwo:  sqltypes.ToValidNullString("#2"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		LocationDetails: sqltypes.ToValidNullString("brick house"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	})
	if err != nil {
		t.Fatal(err)
	}

	address2, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:       account.ID,
		AddressLineOne:  sqltypes.ToValidNullString("5678 side st"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		LocationDetails: sqltypes.ToValidNullString("go around back"),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_SCHOOL],
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc      string
		accountID int64

		want    []*patientaccountssql.Address
		wantErr error
	}{
		{
			desc:      "success - base case",
			accountID: account.ID,

			want:    []*patientaccountssql.Address{address1, address2},
			wantErr: nil,
		},
		{
			desc:      "error - invalid account id - zero",
			accountID: 0,

			wantErr: errInvalidAccountID,
		},
		{
			desc:      "error - invalid account id - less than zero",
			accountID: -1,

			wantErr: errInvalidAccountID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			account, err := patientAccountsDB.ListAddresses(ctx, tc.accountID)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAddressWithoutID(t, tc.want, account)
		})
	}
}

func TestGetAddress(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	address, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:       account.ID,
		AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
		AddressLineTwo:  sqltypes.ToValidNullString("#2"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		LocationDetails: sqltypes.ToValidNullString("brick house"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.Address
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: address.ID,

			want: address,
		},
		{
			desc:  "error - not found",
			query: address.ID + 1,

			wantErr: errAccountAddressNotFound,
		},
		{
			desc:  "error - invalid address id - zero",
			query: 0,

			wantErr: errInvalidAccountAddressID,
		},
		{
			desc:  "error - invalid address id - less than zero",
			query: -1,

			wantErr: errInvalidAccountAddressID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			address, err := patientAccountsDB.GetAddress(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, address)
		})
	}
}

func TestListAccountPatientsDB(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	queries := patientaccountssql.New(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountPatient, err := queries.AddAccountPatientLink(ctx, patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                account.ID,
		PatientID:                sqltypes.ToValidNullInt64(id1),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    []*patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: account.ID,

			want: []*patientaccountssql.AccountPatientLink{
				accountPatient,
			},
		},
		{
			desc:  "error - invalid account id - zero",
			query: 0,

			wantErr: errInvalidAccountID,
		},
		{
			desc:  "error - invalid account id - less than zero",
			query: -1,

			wantErr: errInvalidAccountID,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			accountPatients, err := patientAccountsDB.ListAccountPatientLinks(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, accountPatients)
		})
	}
}

func TestUpdateAddressDB(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := patientAccountsDB.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	address, err := patientAccountsDB.CreateAddress(ctx, patientaccountssql.CreateAccountAddressParams{
		AccountID:       account.ID,
		AddressLineOne:  sqltypes.ToValidNullString("1234 main st"),
		AddressLineTwo:  sqltypes.ToValidNullString("#2"),
		City:            sqltypes.ToValidNullString("springfield"),
		Zipcode:         sqltypes.ToValidNullString("90210"),
		LocationDetails: sqltypes.ToValidNullString("brick house"),
		StateCode:       sqltypes.ToValidNullString("CA"),
		FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc            string
		updateParams    patientaccountssql.UpdateAddressParams
		addressID       int64
		addressLineOne  *string
		addressLineTwo  *string
		city            *string
		zipcode         *string
		locationDetails *string
		stateCode       *string

		want    *patientaccountssql.Address
		wantErr error
	}{
		{
			desc: "success - base case",
			updateParams: patientaccountssql.UpdateAddressParams{
				ID:              address.ID,
				AddressLineOne:  sqltypes.ToValidNullString("5678 side st"),
				AddressLineTwo:  sqltypes.ToNullString(nil),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				LocationDetails: sqltypes.ToValidNullString("go around back"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},

			want: &patientaccountssql.Address{
				AccountID:       account.ID,
				AddressLineOne:  sqltypes.ToValidNullString("5678 side st"),
				AddressLineTwo:  sqltypes.ToNullString(nil),
				City:            sqltypes.ToValidNullString("springfield"),
				Zipcode:         sqltypes.ToValidNullString("90210"),
				StateCode:       sqltypes.ToValidNullString("CA"),
				LocationDetails: sqltypes.ToValidNullString("go around back"),
				LatitudeE6:      sqltypes.ToNullInt32(proto.Int32(37422410)),
				LongitudeE6:     sqltypes.ToNullInt32(proto.Int32(-122084168)),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},
		},
		{
			desc: "success - fields are nullable",
			updateParams: patientaccountssql.UpdateAddressParams{
				ID:              address.ID,
				AddressLineOne:  sqltypes.ToNullString(nil),
				AddressLineTwo:  sqltypes.ToNullString(nil),
				LocationDetails: sqltypes.ToNullString(nil),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},

			want: &patientaccountssql.Address{
				AccountID:       account.ID,
				AddressLineOne:  sqltypes.ToNullString(nil),
				AddressLineTwo:  sqltypes.ToNullString(nil),
				City:            sqltypes.ToNullString(nil),
				Zipcode:         sqltypes.ToNullString(nil),
				LocationDetails: sqltypes.ToNullString(nil),
				StateCode:       sqltypes.ToNullString(nil),
				FacilityTypeID:  FacilityTypeProtoToID[patientaccountspb.FacilityType_FACILITY_TYPE_HOME],
			},
		},
		{
			desc: "error - address does not exist",
			updateParams: patientaccountssql.UpdateAddressParams{
				ID:             -1,
				AddressLineOne: sqltypes.ToValidNullString(""),
				Zipcode:        sqltypes.ToValidNullString(""),
			},

			wantErr: errAccountAddressNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			var originalAddress *patientaccountssql.Address
			if tc.want != nil {
				originalAddress, err = patientAccountsDB.GetAddress(ctx, tc.updateParams.ID)
				if err != nil {
					t.Fatal(err)
				}
			}
			got, err := patientAccountsDB.UpdateAddress(ctx, tc.updateParams)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAddressWithoutID(t, tc.want, got)
			if originalAddress != nil {
				testutils.MustMatch(t, originalAddress.UpdatedAt != got.UpdatedAt, true, "updated_at expected to change")
			}
		})
	}
}

func TestGetAccountPatient(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	queries := patientaccountssql.New(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountPatient, err := queries.AddAccountPatientLink(ctx, patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                account.ID,
		PatientID:                sqltypes.ToValidNullInt64(id1),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: accountPatient.ID,

			want: accountPatient,
		},
		{
			desc:  "error - invalid account patient id - zero",
			query: 0,

			wantErr: errInvalidAccountPatientID,
		},
		{
			desc:  "error - invalid account patient id - less than zero",
			query: -1,

			wantErr: errInvalidAccountPatientID,
		},
		{
			desc:  "error - not found",
			query: accountPatient.ID + 1,

			wantErr: errAccountPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			accountPatients, err := patientAccountsDB.GetAccountPatientLink(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, accountPatients)
		})
	}
}

func TestAddAccountPatientLink(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	patientAccountsDB := NewPatientAccountsDB(db)
	queries := patientaccountssql.New(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1
	id2 := baseID + 2

	account, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	exampleAccountPatient := &patientaccountssql.AccountPatientLink{
		ID:                       0,
		AccountID:                account.ID,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(baseID),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	}

	accountWithMaxLinks, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id2, 10),
		Email:   testEmail(id2),
	})
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < accountSavedPatientsMax; i++ {
		_, err := patientAccountsDB.AddAccountPatientLink(ctx, &patientaccountssql.AddAccountPatientLinkParams{
			AccountID:                accountWithMaxLinks.ID,
			UnverifiedPatientID:      sqltypes.ToValidNullInt64(baseID + int64(i+1)),
			AccessLevelID:            AccessLevelIDPrimary.Int64(),
			ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
		})
		if err != nil {
			t.Fatal(err)
		}
	}

	tcs := []struct {
		desc  string
		query *patientaccountssql.AddAccountPatientLinkParams

		want    *patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc: "success - base case",
			query: &patientaccountssql.AddAccountPatientLinkParams{
				AccountID:                account.ID,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(baseID),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			want: exampleAccountPatient,
		},
		{
			desc: "error - invalid account ID",
			query: &patientaccountssql.AddAccountPatientLinkParams{
				AccountID:                -1,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(id1),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			wantErr: errInvalidAccountID,
		},
		{
			desc: "error - invalid associated patient ID",
			query: &patientaccountssql.AddAccountPatientLinkParams{
				AccountID:                baseID,
				UnverifiedPatientID:      sql.NullInt64{Valid: false},
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			wantErr: errMissingAssociatedPatientID,
		},
		{
			desc: "error - maximum patient links",
			query: &patientaccountssql.AddAccountPatientLinkParams{
				AccountID:                accountWithMaxLinks.ID,
				UnverifiedPatientID:      sqltypes.ToValidNullInt64(baseID),
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			wantErr: errMaxPatientLinkCount,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			accountPatients, err := patientAccountsDB.AddAccountPatientLink(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, accountPatients)
		})
	}
}

func TestGetAccountPatientByUnverifiedPatientID(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	queries := patientaccountssql.New(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountPatient, err := queries.AddAccountPatientLink(ctx, patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                account.ID,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(id1),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query int64

		want    *patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc:  "success - base case",
			query: accountPatient.UnverifiedPatientID.Int64,

			want: accountPatient,
		},
		{
			desc:  "error - invalid unverified account patient id",
			query: -5,

			wantErr: errInvalidUnverifiedAccountPatientID,
		},
		{
			desc:  "error - not found",
			query: accountPatient.UnverifiedPatientID.Int64 + 1,

			wantErr: errAccountPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			accountPatients, err := patientAccountsDB.GetAccountPatientLinkByUnverifiedPatientID(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, accountPatients)
		})
	}
}

func TestUpdateAccountPatient(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()
	queries := patientaccountssql.New(db)
	baseID := time.Now().UnixNano()
	id1 := baseID + 1

	account, err := queries.CreateAccount(ctx, patientaccountssql.CreateAccountParams{
		Auth0ID: strconv.FormatInt(id1, 10),
		Email:   testEmail(id1),
	})
	if err != nil {
		t.Fatal(err)
	}

	accountPatient, err := queries.AddAccountPatientLink(ctx, patientaccountssql.AddAccountPatientLinkParams{
		AccountID:                account.ID,
		UnverifiedPatientID:      sqltypes.ToValidNullInt64(baseID),
		AccessLevelID:            AccessLevelIDPrimary.Int64(),
		ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		desc  string
		query *patientaccountssql.UpdateAccountPatientLinkParams

		want    *patientaccountssql.AccountPatientLink
		wantErr error
	}{
		{
			desc: "success - base case",
			query: &patientaccountssql.UpdateAccountPatientLinkParams{
				ID:                       accountPatient.ID,
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			want: &patientaccountssql.AccountPatientLink{
				ID:                       accountPatient.ID,
				AccountID:                account.ID,
				UnverifiedPatientID:      accountPatient.UnverifiedPatientID,
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},
		},
		{
			desc: "error - account patient not found",
			query: &patientaccountssql.UpdateAccountPatientLinkParams{
				ID:                       accountPatient.ID + 1,
				AccessLevelID:            AccessLevelIDPrimary.Int64(),
				ConsentingRelationshipID: ConsentingRelationshipIDSelf.Int64(),
			},

			wantErr: errAccountPatientNotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			patientAccountsDB := NewPatientAccountsDB(db)
			var originalPatientLink *patientaccountssql.AccountPatientLink
			if tc.want != nil {
				originalPatientLink, err = patientAccountsDB.GetAccountPatientLink(ctx, tc.query.ID)
			}
			got, err := patientAccountsDB.UpdateAccountPatientLink(ctx, tc.query)
			testutils.MustMatch(t, tc.wantErr, err)
			mustMatchAccountWithoutID(t, tc.want, got)
			if originalPatientLink != nil {
				testutils.MustMatch(t, originalPatientLink.UpdatedAt != got.UpdatedAt, true, "updated_at expected to change")
			}
		})
	}
}

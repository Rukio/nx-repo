package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
)

type PatientAccountsDB struct {
	db      basedb.DBTX
	queries *patientaccountssql.Queries
}

const (
	accountSavedAddressesMax = 30
	accountSavedPatientsMax  = 30
)

var (
	errBlankAuth0ID                      = errors.New("auth0 id cannot be blank")
	errBlankEmail                        = errors.New("email cannot be blank")
	errInvalidAccountID                  = errors.New("account id must be greater than 0")
	errGettingAddressCount               = errors.New("error retrieving count of addresses")
	errMaxAddressCount                   = fmt.Errorf("count of addresses is at the maximum of %d", accountSavedAddressesMax)
	errGettingPatientLinkCount           = errors.New("error retrieving count of patient links")
	errMaxPatientLinkCount               = fmt.Errorf("count of patient links is at the maximum of %d", accountSavedPatientsMax)
	errAccountNotFound                   = errors.New("account not found with given id")
	errInvalidAccountAddressID           = errors.New("account address id must be greater than 0")
	errAccountAddressNotFound            = errors.New("account address not found with given id")
	errInvalidAccountPatientID           = errors.New("account patient id must be greater than 0")
	errAccountPatientNotFound            = errors.New("account patient not found with given id")
	errMissingAssociatedPatientID        = errors.New("must provide a value for patient ID or unverified patient ID")
	errInvalidUnverifiedAccountPatientID = errors.New("invalid unverified account patient ID")
)

func NewPatientAccountsDB(db basedb.DBTX) *PatientAccountsDB {
	ddTraceDB := monitoring.NewDDTraceDB(db, monitoring.DataDogPatientAccountsServiceName)
	return &PatientAccountsDB{
		db:      db,
		queries: patientaccountssql.New(ddTraceDB),
	}
}

func (cdb *PatientAccountsDB) IsHealthy(ctx context.Context) bool {
	return cdb.db.Ping(ctx) == nil
}

func (cdb *PatientAccountsDB) CreateAccount(ctx context.Context, params patientaccountssql.CreateAccountParams) (*patientaccountssql.Account, error) {
	if params.Auth0ID == "" {
		return nil, errBlankAuth0ID
	}

	if params.Email == "" {
		return nil, errBlankEmail
	}

	return cdb.queries.CreateAccount(ctx, params)
}

func (cdb *PatientAccountsDB) GetAccount(ctx context.Context, accountID int64) (*patientaccountssql.Account, error) {
	if accountID <= 0 {
		return nil, errInvalidAccountID
	}

	account, err := cdb.queries.GetAccount(ctx, accountID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountNotFound
		}
		return nil, err
	}

	return account, nil
}

func (cdb *PatientAccountsDB) GetAccountByAuth0ID(ctx context.Context, auth0ID string) (*patientaccountssql.Account, error) {
	if auth0ID == "" {
		return nil, errBlankAuth0ID
	}

	account, err := cdb.queries.GetAccountByAuth0ID(ctx, auth0ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountNotFound
		}
		return nil, err
	}

	return account, nil
}

func (cdb *PatientAccountsDB) UpdateAccount(ctx context.Context, params patientaccountssql.UpdateAccountParams) (*patientaccountssql.Account, error) {
	account, err := cdb.queries.UpdateAccount(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountNotFound
		}
		return nil, err
	}

	return account, nil
}

func (cdb *PatientAccountsDB) DeleteAccountPatientLink(ctx context.Context, accountPatientLinkID int64) error {
	if accountPatientLinkID <= 0 {
		return errInvalidAccountPatientID
	}

	_, err := cdb.queries.DeleteAccountPatientLink(ctx, accountPatientLinkID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errAccountPatientNotFound
		}
		return err
	}

	return nil
}

func (cdb *PatientAccountsDB) CreateAddress(ctx context.Context, params patientaccountssql.CreateAccountAddressParams) (*patientaccountssql.Address, error) {
	if params.AccountID <= 0 {
		return nil, errInvalidAccountID
	}

	count, err := cdb.queries.CountAddressesByAccountId(ctx, params.AccountID)
	if err != nil {
		return nil, errGettingAddressCount
	}
	if count >= accountSavedAddressesMax {
		return nil, errMaxAddressCount
	}

	return cdb.queries.CreateAccountAddress(ctx, params)
}

func (cdb *PatientAccountsDB) DeleteAccountAddress(ctx context.Context, addressID int64) error {
	if addressID <= 0 {
		return errInvalidAccountAddressID
	}

	_, err := cdb.queries.DeleteAddress(ctx, addressID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errAccountAddressNotFound
		}
		return err
	}

	return nil
}

func (cdb *PatientAccountsDB) ListAddresses(ctx context.Context, accountID int64) ([]*patientaccountssql.Address, error) {
	if accountID <= 0 {
		return nil, errInvalidAccountID
	}

	return cdb.queries.GetAddressesByAccountId(ctx, accountID)
}

func (cdb *PatientAccountsDB) GetAddress(ctx context.Context, addressID int64) (*patientaccountssql.Address, error) {
	if addressID <= 0 {
		return nil, errInvalidAccountAddressID
	}

	address, err := cdb.queries.GetAccountAddress(ctx, addressID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountAddressNotFound
		}
		return nil, err
	}

	return address, nil
}

func (cdb *PatientAccountsDB) ListAccountPatientLinks(ctx context.Context, accountID int64) ([]*patientaccountssql.AccountPatientLink, error) {
	if accountID <= 0 {
		return nil, errInvalidAccountID
	}

	patients, err := cdb.queries.ListAccountPatientLinks(ctx, accountID)
	if err != nil {
		return nil, err
	}

	return patients, nil
}

func (cdb *PatientAccountsDB) UpdateAddress(ctx context.Context, params patientaccountssql.UpdateAddressParams) (*patientaccountssql.Address, error) {
	address, err := cdb.queries.UpdateAddress(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountAddressNotFound
		}
		return nil, err
	}

	return address, nil
}

func (cdb *PatientAccountsDB) GetAccountPatientLink(ctx context.Context, accountPatientLinkID int64) (*patientaccountssql.AccountPatientLink, error) {
	if accountPatientLinkID <= 0 {
		return nil, errInvalidAccountPatientID
	}

	patient, err := cdb.queries.GetAccountPatientLink(ctx, accountPatientLinkID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountPatientNotFound
		}
		return nil, err
	}

	return patient, nil
}

func (cdb *PatientAccountsDB) AddAccountPatientLink(ctx context.Context, params *patientaccountssql.AddAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error) {
	if params.AccountID <= 0 {
		return nil, errInvalidAccountID
	}

	if !params.PatientID.Valid && !params.UnverifiedPatientID.Valid {
		return nil, errMissingAssociatedPatientID
	}

	count, err := cdb.queries.CountAccountPatientLinks(ctx, params.AccountID)
	if err != nil {
		return nil, errGettingPatientLinkCount
	}
	if count >= accountSavedPatientsMax {
		return nil, errMaxPatientLinkCount
	}

	patientAccount, err := cdb.queries.AddAccountPatientLink(ctx, *params)
	if err != nil {
		return nil, err
	}

	return patientAccount, nil
}

func (cdb *PatientAccountsDB) GetAccountPatientLinkByUnverifiedPatientID(ctx context.Context, id int64) (*patientaccountssql.AccountPatientLink, error) {
	if id <= 0 {
		return nil, errInvalidUnverifiedAccountPatientID
	}

	patientAccount, err := cdb.queries.GetAccountPatientLinkByUnverifiedPatientId(ctx, sqltypes.ToNullInt64(&id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountPatientNotFound
		}
		return nil, err
	}

	return patientAccount, nil
}

func (cdb *PatientAccountsDB) UpdateAccountPatientLink(ctx context.Context, params *patientaccountssql.UpdateAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error) {
	patientAccount, err := cdb.queries.UpdateAccountPatientLink(ctx, *params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errAccountPatientNotFound
		}
		return nil, err
	}

	return patientAccount, nil
}

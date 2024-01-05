package main

import (
	"context"
	"errors"

	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type mockPatientAccountsDB struct {
	isHealthyResult                                  bool
	createAccountResult                              *patientaccountssql.Account
	createAccountErr                                 error
	getAccountResult                                 *patientaccountssql.Account
	getAccountErr                                    error
	updateAccountResult                              *patientaccountssql.Account
	updateAccountErr                                 error
	getAccountByAuth0IDResult                        *patientaccountssql.Account
	getAccountByAuth0IDErr                           error
	deleteAccountAddressErr                          error
	deleteAccountPatientErr                          error
	createAccountAddressResult                       *patientaccountssql.Address
	createAccountAddressErr                          error
	listAddressesResult                              []*patientaccountssql.Address
	listAddressesErr                                 error
	getAddressResult                                 *patientaccountssql.Address
	getAddressErr                                    error
	listAccountPatientLinksResult                    []*patientaccountssql.AccountPatientLink
	listAccountPatientLinksErr                       error
	updateAddressResult                              *patientaccountssql.Address
	updateAddressErr                                 error
	getAccountPatientLinkResult                      *patientaccountssql.AccountPatientLink
	getAccountPatientLinkErr                         error
	createAccountPatientLinkResult                   *patientaccountssql.AccountPatientLink
	createAccountPatientLinkErr                      error
	getAccountPatientLinkByUnverifiedPatientIDResult *patientaccountssql.AccountPatientLink
	GetAccountPatientLinkByUnverifiedPatientIDErr    error
	updateAccountPatientLinkResult                   *patientaccountssql.AccountPatientLink
	updateAccountPatientLinkErr                      error
}

func (m *mockPatientAccountsDB) IsHealthy(_ context.Context) bool {
	return m.isHealthyResult
}

func (m *mockPatientAccountsDB) CreateAccount(_ context.Context, params patientaccountssql.CreateAccountParams) (*patientaccountssql.Account, error) {
	return m.createAccountResult, m.createAccountErr
}

func (m *mockPatientAccountsDB) GetAccount(ctx context.Context, accountID int64) (*patientaccountssql.Account, error) {
	if accountID == 0 {
		return nil, status.Error(codes.InvalidArgument, "Account ID is missing")
	}
	if m.getAccountResult != nil && m.getAccountResult.ID != accountID {
		return nil, errors.New("unexpected account id")
	}
	return m.getAccountResult, m.getAccountErr
}

func (m *mockPatientAccountsDB) GetAccountByAuth0ID(ctx context.Context, auth0ID string) (*patientaccountssql.Account, error) {
	if m.getAccountByAuth0IDResult != nil && m.getAccountByAuth0IDResult.Auth0ID != auth0ID {
		return nil, errors.New("unexpected account auth0 id")
	}
	return m.getAccountByAuth0IDResult, m.getAccountByAuth0IDErr
}

func (m *mockPatientAccountsDB) UpdateAccount(ctx context.Context, params patientaccountssql.UpdateAccountParams) (*patientaccountssql.Account, error) {
	if params.ID == 0 {
		return nil, status.Error(codes.InvalidArgument, "Account ID is missing")
	}
	return m.updateAccountResult, m.updateAccountErr
}

func (m *mockPatientAccountsDB) DeleteAccountPatientLink(ctx context.Context, accountPatientID int64) error {
	return m.deleteAccountPatientErr
}

func (m *mockPatientAccountsDB) CreateAddress(_ context.Context, params patientaccountssql.CreateAccountAddressParams) (*patientaccountssql.Address, error) {
	if params.AccountID == 0 {
		return nil, status.Error(codes.InvalidArgument, "Account ID is missing")
	}
	return m.createAccountAddressResult, m.createAccountAddressErr
}

func (m *mockPatientAccountsDB) DeleteAccountAddress(ctx context.Context, addressID int64) error {
	if addressID == 0 {
		return status.Error(codes.InvalidArgument, "Address ID is missing")
	}
	return m.deleteAccountAddressErr
}

func (m *mockPatientAccountsDB) ListAddresses(ctx context.Context, accountID int64) ([]*patientaccountssql.Address, error) {
	if accountID == 0 {
		return nil, status.Error(codes.InvalidArgument, "Account ID is missing")
	}
	return m.listAddressesResult, m.listAddressesErr
}

func (m *mockPatientAccountsDB) GetAddress(ctx context.Context, addressID int64) (*patientaccountssql.Address, error) {
	if m.getAddressResult != nil && m.getAddressResult.ID != addressID {
		return nil, errors.New("unexpected address id")
	}
	return m.getAddressResult, m.getAddressErr
}

func (m *mockPatientAccountsDB) ListAccountPatientLinks(ctx context.Context, accountID int64) ([]*patientaccountssql.AccountPatientLink, error) {
	return m.listAccountPatientLinksResult, m.listAccountPatientLinksErr
}

func (m *mockPatientAccountsDB) UpdateAddress(_ context.Context, params patientaccountssql.UpdateAddressParams) (*patientaccountssql.Address, error) {
	if params.ID == 0 {
		return nil, status.Error(codes.InvalidArgument, "Address ID is missing")
	}
	return m.updateAddressResult, m.updateAddressErr
}

func (m *mockPatientAccountsDB) GetAccountPatientLink(ctx context.Context, accountPatientID int64) (*patientaccountssql.AccountPatientLink, error) {
	if m.getAccountPatientLinkResult != nil && m.getAccountPatientLinkResult.ID != accountPatientID {
		return nil, errors.New("unexpected account patient id")
	}
	return m.getAccountPatientLinkResult, m.getAccountPatientLinkErr
}

func (m *mockPatientAccountsDB) AddAccountPatientLink(ctx context.Context, params *patientaccountssql.AddAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error) {
	return m.createAccountPatientLinkResult, m.createAccountPatientLinkErr
}

func (m *mockPatientAccountsDB) GetAccountPatientLinkByUnverifiedPatientID(ctx context.Context, id int64) (*patientaccountssql.AccountPatientLink, error) {
	return m.getAccountPatientLinkByUnverifiedPatientIDResult, m.GetAccountPatientLinkByUnverifiedPatientIDErr
}

func (m *mockPatientAccountsDB) UpdateAccountPatientLink(ctx context.Context, params *patientaccountssql.UpdateAccountPatientLinkParams) (*patientaccountssql.AccountPatientLink, error) {
	return m.updateAccountPatientLinkResult, m.updateAccountPatientLinkErr
}

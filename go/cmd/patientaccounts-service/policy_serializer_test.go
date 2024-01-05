package main

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	patientaccountspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients/accounts"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestSerializeRequestWithAccountID(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	id1 := baseID + 1
	email := testEmail(id1)
	auth0ID := strconv.FormatInt(id1, 10)

	accountSQL := &patientaccountssql.Account{
		ID:          id1,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToNullString(nil),
		UpdatedAt:   now,
	}

	ctxWithAuth := contextWithAuth()
	ctxWithClaims := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  email,
		},
	})
	tests := []struct {
		name          string
		context       context.Context
		request       any
		mockDBService *mockPatientAccountsDB

		want     any
		wantCode codes.Code
	}{
		{
			name:    "success - base case",
			context: ctxWithClaims,
			request: &patientaccountspb.ListAddressesRequest{
				AccountId: id1,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
			},

			want: map[string]any{
				claimPropertyAccountIDKey: id1,
			},
			wantCode: codes.OK,
		},
		{
			name:    "error - bad request format",
			context: ctxWithClaims,
			request: &struct {
				AccountID int64
			}{
				AccountID: id1,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
			},

			wantCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &AccountIDRequestSerializer{}
		t.Run(tc.name, func(t *testing.T) {
			resp, err := testPolicyResourceSerializer.SerializePolicyResource(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestSerializeSingleAddressRequest(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	accountID := baseID + 1
	addressID := baseID + 2
	email := testEmail(accountID)
	auth0ID := strconv.FormatInt(accountID, 10)

	accountSQL := &patientaccountssql.Account{
		ID:          accountID,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToNullString(nil),
		UpdatedAt:   now,
	}
	addressSQLWithMatchingAccount := getExampleAddress(addressID, accountID, now)

	ctxWithAuth := contextWithAuth()
	ctxWithClaims := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  email,
		},
	})
	tests := []struct {
		name          string
		context       context.Context
		request       any
		mockDBService *mockPatientAccountsDB

		want     any
		wantCode codes.Code
	}{
		{
			name:    "success - base case",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAddressRequest{
				AddressId: addressID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAddressResult:          addressSQLWithMatchingAccount,
			},

			want: map[string]any{
				claimPropertyAccountIDKey: accountID,
			},
			wantCode: codes.OK,
		},
		{
			name:    "error - bad request format",
			context: ctxWithClaims,
			request: &struct {
				AccountID int64
			}{
				AccountID: accountID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAddressResult:          addressSQLWithMatchingAccount,
			},

			wantCode: codes.InvalidArgument,
		},
		{
			name:    "error - address not found",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAddressRequest{
				AddressId: addressID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAddressErr:             errAccountAddressNotFound,
			},

			wantCode: codes.NotFound,
		},
		{
			name:    "error - failed to get address",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAddressRequest{
				AddressId: addressID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAddressErr:             errors.New("error getting address"),
			},

			wantCode: codes.Internal,
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &PatientAccountsPolicyResourceSerializer{
			DBService: tc.mockDBService,
			Logger:    zap.NewNop().Sugar(),
		}
		testAddressRequestSerializer := &AddressRequestSerializer{*testPolicyResourceSerializer}
		t.Run(tc.name, func(t *testing.T) {
			resp, err := testAddressRequestSerializer.SerializePolicyResource(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestSerializeSingleAccountPatientRequest(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	accountID := baseID + 1
	accountPatientLinkID := baseID + 2
	email := testEmail(accountID)
	auth0ID := strconv.FormatInt(accountID, 10)

	accountSQL := &patientaccountssql.Account{
		ID:          accountID,
		Auth0ID:     auth0ID,
		Email:       email,
		GivenName:   sqltypes.ToNullString(nil),
		FamilyName:  sqltypes.ToNullString(nil),
		PhoneNumber: sqltypes.ToNullString(nil),
		UpdatedAt:   now,
	}
	accountPatientSQLWithMatchingAccountID := getExampleAccountPatient(accountPatientLinkID, accountID, now)

	ctxWithAuth := contextWithAuth()
	ctxWithClaims := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: auth0ID,
			claimPropertyEmailKey:                  email,
		},
	})
	tests := []struct {
		name          string
		context       context.Context
		request       any
		mockDBService *mockPatientAccountsDB

		want     any
		wantCode codes.Code
	}{
		{
			name:    "success - base case",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAccountPatientLinkRequest{
				AccountPatientLinkId: accountPatientLinkID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult:   accountSQL,
				getAccountPatientLinkResult: accountPatientSQLWithMatchingAccountID,
			},

			want: map[string]any{
				claimPropertyAccountIDKey: accountID,
			},
			wantCode: codes.OK,
		},
		{
			name:    "error - bad request format",
			context: ctxWithClaims,
			request: &struct {
				AccountID int64
			}{
				AccountID: accountID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult:   accountSQL,
				getAccountPatientLinkResult: accountPatientSQLWithMatchingAccountID,
			},

			wantCode: codes.InvalidArgument,
		},
		{
			name:    "error - account patient not found",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAccountPatientLinkRequest{
				AccountPatientLinkId: accountPatientLinkID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAccountPatientLinkErr:  errAccountPatientNotFound,
			},

			wantCode: codes.NotFound,
		},
		{
			name:    "error - failed to get account patient",
			context: ctxWithClaims,
			request: &patientaccountspb.GetAccountPatientLinkRequest{
				AccountPatientLinkId: accountPatientLinkID,
			},
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
				getAccountPatientLinkErr:  errors.New("error getting account patient"),
			},

			wantCode: codes.Internal,
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &PatientAccountsPolicyResourceSerializer{
			DBService: tc.mockDBService,
			Logger:    zap.NewNop().Sugar(),
		}
		testAccountPatientRequestSerializer := &AccountPatientLinkRequestSerializer{*testPolicyResourceSerializer}

		t.Run(tc.name, func(t *testing.T) {
			resp, err := testAccountPatientRequestSerializer.SerializePolicyResource(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.wantCode, reqStatus.Code())
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

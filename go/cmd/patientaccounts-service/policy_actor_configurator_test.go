package main

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	patientaccountssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patientaccounts"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
)

func TestConfigurePolicyActor(t *testing.T) {
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
	ctxWithNilAuth0ID := auth.ContextWithClaims(ctxWithAuth, &auth.CustomClaims{
		Properties: map[string]any{
			claimPropertyIdentityProviderUserIDKey: nil,
			claimPropertyEmailKey:                  email,
		},
	})

	tests := []struct {
		name          string
		context       context.Context
		mockDBService *mockPatientAccountsDB

		wantAccountID *int64
		wantErr       error
	}{
		{
			name:    "success - base case",
			context: ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
			},

			wantAccountID: &id1,
		},
		{
			name:    "error - no claims",
			context: ctxWithAuth,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
			},

			wantErr: errInvalidTokenClaims,
		},
		{
			name:    "error - bad claims",
			context: ctxWithNilAuth0ID,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDResult: accountSQL,
			},

			wantErr: errInvalidTokenClaims,
		},
		{
			name:    "success - account not found",
			context: ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDErr: errAccountNotFound,
			},

			wantAccountID: nil,
		},
		{
			name:    "error - get account failed",
			context: ctxWithClaims,
			mockDBService: &mockPatientAccountsDB{
				getAccountByAuth0IDErr: errors.New("uh oh, an error, boooo"),
			},

			wantErr: errFailedGetAccount,
		},
	}
	for _, tc := range tests {
		testActorConfigurator := &PolicyActorConfigurator{
			logger:    zap.NewNop().Sugar(),
			dbService: tc.mockDBService,
		}
		t.Run(tc.name, func(t *testing.T) {
			err := testActorConfigurator.ConfigurePolicyActor(tc.context)

			testutils.MustMatch(t, tc.wantErr, err)
			if tc.wantAccountID != nil {
				actor, err := auth.ActorFromContext(tc.context)
				if err != nil {
					t.Fatal("failed to parse custom claims from context")
				}
				testutils.MustMatch(t, tc.wantAccountID, actor.Properties[claimPropertyAccountIDKey])
			}
		})
	}
}

package secrets

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	vault "github.com/hashicorp/vault/api"
)

type mockValueEngine struct {
	err    error
	secret *vault.KVSecret
}

func (ve *mockValueEngine) Get(ctx context.Context, path string) (*vault.KVSecret, error) {
	if ve.err != nil {
		return nil, ve.err
	}
	return ve.secret, nil
}

// TestNewVaultProvider tests the NewVaultProvider function.
func TestNewVaultProvider(t *testing.T) {
	ctx := context.Background()
	tcs := []struct {
		Desc            string
		Address         string
		AppRoleID       string
		AppRoleSecretID string
		Path            string
		WantError       error
		IsNil           bool
	}{
		{
			Desc:            "No Server",
			Address:         "http://localhost:8200",
			AppRoleID:       "test_app_role_id",
			AppRoleSecretID: "test_app_role_secret_id",
			Path:            "secrets/testing",
			WantError:       errors.New("service unavailable"),
			IsNil:           true,
		},
		{
			Desc:            "Missing Address",
			Address:         "",
			AppRoleID:       "test_app_role_id",
			AppRoleSecretID: "test_app_role_secret_id",
			Path:            "secrets/testing",
			WantError:       NewRequiredOptionError("Address"),
			IsNil:           true,
		},
		{
			Desc:            "Missing AppRoleID",
			Address:         "http://localhost:8200",
			AppRoleID:       "",
			AppRoleSecretID: "test_app_role_secret_id",
			Path:            "secrets/testing",
			WantError:       NewRequiredOptionError("AppRoleID"),
			IsNil:           true,
		},
		{
			Desc:            "Missing AppRoleSecretID",
			Address:         "http://localhost:8200",
			AppRoleID:       "test_app_role_id",
			AppRoleSecretID: "",
			Path:            "secrets/testing",
			WantError:       NewRequiredOptionError("AppRoleSecretID"),
			IsNil:           true,
		},
		{
			Desc:            "Missing Path",
			Address:         "http://localhost:8200",
			AppRoleID:       "test_app_role_id",
			AppRoleSecretID: "test_app_role_secret_id",
			Path:            "",
			WantError:       NewRequiredOptionError("Path"),
			IsNil:           true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			vaultProvider, err := NewVaultProvider(ctx, VaultProviderOptions{
				Address:         tc.Address,
				AppRoleID:       tc.AppRoleID,
				AppRoleSecretID: tc.AppRoleSecretID,
				Path:            tc.Path,
			})

			if (vaultProvider == nil) != tc.IsNil {
				t.Errorf("Expected vaultProvider nilness (%t) to equal tc.IsNil (%t)", vaultProvider == nil, tc.IsNil)
			}

			testutils.MustMatch(t, tc.WantError, err)
		})
	}
}

// TestVaultProvider_Secret tests the Secret method of the VaultProvider.
func TestVaultProvider_Secret(t *testing.T) {
	tcs := []struct {
		Desc           string
		SecretName     string
		EngineErr      error
		EngineSecret   *vault.KVSecret
		HasError       bool
		ExpectedSecret string
	}{
		{
			Desc:       "Successful Secret Retrieval",
			SecretName: "mysecret",
			EngineErr:  nil,
			EngineSecret: &vault.KVSecret{
				Data: map[string]any{
					"mysecret": "mysecretvalue",
				},
			},
			HasError:       false,
			ExpectedSecret: "{\"mysecret\":\"mysecretvalue\"}",
		},
		{
			Desc:           "Secret Not Found",
			SecretName:     "mysecret",
			EngineErr:      errors.New("no secret error"),
			HasError:       true,
			ExpectedSecret: "{\"mysecret\":\"mysecretvalue\"}",
		},
		{
			Desc:           "Error Retrieving Secret",
			SecretName:     "mysecret",
			EngineErr:      errors.New("vault engine error"),
			HasError:       true,
			ExpectedSecret: "{\"mysecret\":\"mysecretvalue\"}",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			mockEngine := &mockValueEngine{
				err:    tc.EngineErr,
				secret: tc.EngineSecret,
			}
			vaultProvider := &VaultProvider{
				valueEngine: mockEngine,
			}

			secret, err := vaultProvider.Secret(context.Background(), tc.SecretName)

			if (err != nil) != tc.HasError {
				t.Errorf("Unexpected Error State: %s\nexpected: %v\ngot: %v", tc.Desc, tc.HasError, err != nil)
			}

			if tc.HasError {
				return
			}

			testutils.MustMatch(t, secret.Value(), tc.ExpectedSecret)
		})
	}
}

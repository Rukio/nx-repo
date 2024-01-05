package secrets

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	vault "github.com/hashicorp/vault/api"
	auth "github.com/hashicorp/vault/api/auth/approle"
)

type VaultProviderOptions struct {
	Address         string
	AppRoleID       string
	AppRoleSecretID string
	Path            string
}

type VaultProvider struct {
	valueEngine vaultValueEngine
}

type vaultValueEngine interface {
	Get(context.Context, string) (*vault.KVSecret, error)
}

type RequiredOptionError struct {
	Option string
	err    error
}

func (r *RequiredOptionError) Error() string {
	return r.err.Error()
}

func NewRequiredOptionError(option string) *RequiredOptionError {
	return &RequiredOptionError{
		Option: option,
		err:    fmt.Errorf(fmt.Sprintf("invalid option: %s required", option)),
	}
}

func validateVaultConfig(options VaultProviderOptions) *RequiredOptionError {
	if options.Address == "" {
		return NewRequiredOptionError("Address")
	}
	if options.AppRoleID == "" {
		return NewRequiredOptionError("AppRoleID")
	}
	if options.AppRoleSecretID == "" {
		return NewRequiredOptionError("AppRoleSecretID")
	}
	if options.Path == "" {
		return NewRequiredOptionError("Path")
	}
	return nil
}

func newVaultSecretsClient(options VaultProviderOptions) (*vault.Client, error) {
	if err := validateVaultConfig(options); err != nil {
		return nil, err
	}

	cfg := vault.DefaultConfig()
	cfg.Address = options.Address
	client, err := vault.NewClient(cfg)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func login(ctx context.Context, client *vault.Client, appRoleID string, appRoleSecretID string) error {
	roleID := appRoleID
	secretID := &auth.SecretID{FromString: appRoleSecretID}
	appRoleAuth, err := auth.NewAppRoleAuth(
		roleID,
		secretID,
		auth.WithWrappingToken(),
	)

	if err != nil {
		return err
	}

	_, err = client.Auth().Login(ctx, appRoleAuth)
	if err != nil {
		return errors.New("service unavailable")
	}

	return nil
}

// Secret implements the secrets.Provider interface Secret method.
func (p *VaultProvider) Secret(ctx context.Context, secretKey string) (*Secret, error) {
	secret, err := p.valueEngine.Get(ctx, secretKey)
	if err != nil {
		return nil, &UnavailableError{SecretName: secretKey, Reason: err}
	}

	data, err := json.Marshal(secret.Data)
	if err != nil {
		return nil, err
	}

	return NewSecret(string(data)), nil
}

func NewVaultProvider(ctx context.Context, options VaultProviderOptions) (*VaultProvider, error) {
	client, err := newVaultSecretsClient(options)
	if err != nil {
		return nil, err
	}

	err = login(ctx, client, options.AppRoleID, options.AppRoleSecretID)
	if err != nil {
		return nil, err
	}

	return &VaultProvider{
		valueEngine: client.KVv2(options.Path),
	}, nil
}

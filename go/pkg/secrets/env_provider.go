package secrets

import (
	"context"
	"errors"
	"os"
)

type EnvProvider struct {
}

// Secret implements the secrets.Provider interface.
func (p EnvProvider) Secret(_ context.Context, secretKey string) (*Secret, error) {
	value, ok := os.LookupEnv(secretKey)
	if !ok {
		return nil, &UnavailableError{SecretName: secretKey, Reason: errors.New("not found")}
	}
	return NewSecret(value), nil
}

func NewEnvProvider() *EnvProvider {
	return &EnvProvider{}
}

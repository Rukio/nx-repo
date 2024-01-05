package secrets

import "context"

// Provider provides secret values by key from a single source.
type Provider interface {
	Secret(ctx context.Context, secretKey string) (*Secret, error)
}

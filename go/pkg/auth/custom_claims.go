package auth

import (
	"context"
)

type customClaimsContextKey struct{}

// CustomClaims satisfying the validator.CustomClaims interface in order to populate JWT scope.
type CustomClaims struct {
	Email      string         `json:"email"`
	Scope      string         `json:"scope"`
	Type       string         `json:"https://*company-data-covered*.com/type"`
	Properties map[string]any `json:"https://*company-data-covered*.com/props"`
}

// Validate does nothing for this example, but we need
// it to satisfy validator.CustomClaims interface.
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

func addCustomClaims(ctx context.Context, customClaims *CustomClaims) context.Context {
	return context.WithValue(ctx, customClaimsContextKey{}, customClaims)
}

func CustomClaimsFromContext(ctx context.Context) (CustomClaims, bool) {
	customClaims := ctx.Value(customClaimsContextKey{})

	if customClaims == nil {
		return CustomClaims{}, false
	}

	return *customClaims.(*CustomClaims), true
}

func ContextWithClaims(ctx context.Context, claims *CustomClaims) context.Context {
	return addCustomClaims(ctx, claims)
}

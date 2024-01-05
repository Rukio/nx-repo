package auth

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	jwtProviderValidatorRefreshDuration  = 5 * time.Minute
	jwtProviderValidatorAllowedClockSkew = 1 * time.Minute
)

// Config contains configuration values for authentication of gRPC calls via Auth0.
type Config struct {
	// Auth0 audience for authenticating the gRPC request.
	Audience string
	// Base URL for issuing claims.
	IssuerURL string
	// If true, disables enforcement of authorization. Otherwise, requires all calls to be authorized.
	// Should always be false in a prod environment.
	AuthorizationDisabled bool
	// List of paths for which auth should be disabled.
	HTTPAuthorizationDisabledPaths []string
	// If set to true, this will allow comma-separated audiences to be passed to the Audience attribute.
	// Use of multiple audiences is discouraged, it should only be used for transition purposes.
	// TODO (CO-1415): Remove support for multiple audiences.
	AllowMultipleAudiences bool
}

func (c Config) Validate() error {
	if c.AuthorizationDisabled {
		return nil
	}

	if c.Audience == "" {
		return fmt.Errorf("audience cannot be empty if authorization is enabled")
	}

	if c.IssuerURL == "" {
		return fmt.Errorf("issuer url cannot be empty if authorization is enabled")
	}

	audiences := strings.Split(c.Audience, ",")
	if len(audiences) > 1 && !c.AllowMultipleAudiences {
		return fmt.Errorf("use of multiple audiences is not allowed")
	}

	return nil
}

var validateTokenWithValidator = func(jwtValidator *validator.Validator, ctx context.Context, tokenString string) (any, error) {
	return jwtValidator.ValidateToken(ctx, tokenString)
}

func validateToken(ctx context.Context, config Config, token string) (*CustomClaims, error) {
	issuerURL, err := url.Parse(config.IssuerURL)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "failed to parse the issuer url")
	}
	provider := jwks.NewCachingProvider(issuerURL, jwtProviderValidatorRefreshDuration)

	// TODO (CO-1415): Remove support for multiple audiences.
	audiences := strings.Split(config.Audience, ",")

	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuerURL.String(),
		audiences,
		validator.WithCustomClaims(
			func() validator.CustomClaims {
				// Empty CustomClaims struct that will be unmarshalled into by the JWT Validator
				return &CustomClaims{}
			},
		),
		validator.WithAllowedClockSkew(jwtProviderValidatorAllowedClockSkew),
	)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "failed to set up the JWT validator")
	}

	validatedClaims, err := validateTokenWithValidator(jwtValidator, ctx, token)
	if err != nil {
		return nil, status.Errorf(codes.PermissionDenied, "token could not be validated: %s", err)
	}

	// Obtain CustomClaims (with filled-out scope) from the ValidatedClaims object that
	// is the the output of jwtValidator.ValidateToken.
	claims := validatedClaims.(*validator.ValidatedClaims)
	customClaims := claims.CustomClaims.(*CustomClaims)
	return customClaims, nil
}

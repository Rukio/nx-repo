package auth

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestValidateToken(t *testing.T) {
	tcs := []struct {
		Desc           string
		Config         Config
		Auth0Error     bool
		ExpectedClaims *CustomClaims
		Token          string
		KeyFunc        func(context.Context) (any, error)
		Algorithm      string

		Want codes.Code
	}{
		{
			Desc:       "Should validate token",
			Config:     Config{IssuerURL: "https://staging-auth.*company-data-covered*.com/", Audience: "some-audience"},
			Auth0Error: false,
			ExpectedClaims: &CustomClaims{
				Email: "test@email.com",
				Scope: "read:patients",
				Type:  "user",
				Properties: map[string]any{
					"provider_type": "testProviderType",
					"groups":        []any{"testGroup"},
				},
			},
			Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N0YWdpbmctYXV0aC5kaXNwYXRjaGhlYWx0aC5jb20vIiwic3ViIjoiMTIzNDU2Nzg5MCIsImF1ZCI6WyJzb21lLWF1ZGllbmNlIl0sImVtYWlsIjoidGVzdEBlbWFpbC5jb20iLCJzY29wZSI6InJlYWQ6cGF0aWVudHMiLCJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS90eXBlIjoidXNlciIsImh0dHBzOi8vZGlzcGF0Y2hoZWFsdGguY29tL3Byb3BzIjp7InByb3ZpZGVyX3R5cGUiOiJ0ZXN0UHJvdmlkZXJUeXBlIiwiZ3JvdXBzIjpbInRlc3RHcm91cCJdfX0.3WWbEz3VnXYVxT2gI07gbyqQeQ-6MhzWXV-cNuCJfQ4",
			KeyFunc: func(context.Context) (any, error) {
				return []byte("secret"), nil
			},
			Algorithm: string(validator.HS256),

			Want: codes.OK,
		},
		{
			Desc:           "Bad Issuer URL",
			Config:         Config{IssuerURL: "https://test{bad}iss.com"},
			ExpectedClaims: &CustomClaims{},
			Token:          "faketoken",

			Want: codes.PermissionDenied,
		},
		{
			Desc:           "Empty Issuer URL",
			Config:         Config{IssuerURL: ""},
			ExpectedClaims: &CustomClaims{},
			Token:          "faketoken",

			Want: codes.PermissionDenied,
		},
		{
			Desc:           "Could not validate token",
			Config:         Config{IssuerURL: "validurl"},
			ExpectedClaims: &CustomClaims{},
			Token:          "faketoken",
			Auth0Error:     true,

			Want: codes.PermissionDenied,
		},
		{
			Desc:   "should work if a multi-audience string is used",
			Config: Config{IssuerURL: "https://staging-auth.*company-data-covered*.com/", Audience: "some-audience,another-audience"},
			ExpectedClaims: &CustomClaims{
				Email: "test@email.com",
				Scope: "read:shift_teams",
				Type:  "user",
				Properties: map[string]any{
					"provider_type": "testProviderType",
					"groups":        []any{"testGroup"},
				},
			},
			Auth0Error: false,
			Token:      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3N0YWdpbmctYXV0aC5kaXNwYXRjaGhlYWx0aC5jb20vIiwic3ViIjoiMTIzNDU2Nzg5MCIsImF1ZCI6WyJzb21lLWF1ZGllbmNlIl0sImVtYWlsIjoidGVzdEBlbWFpbC5jb20iLCJzY29wZSI6InJlYWQ6c2hpZnRfdGVhbXMiLCJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS90eXBlIjoidXNlciIsImh0dHBzOi8vZGlzcGF0Y2hoZWFsdGguY29tL3Byb3BzIjp7InByb3ZpZGVyX3R5cGUiOiJ0ZXN0UHJvdmlkZXJUeXBlIiwiZ3JvdXBzIjpbInRlc3RHcm91cCJdfX0.MMag6TZp3Z4ud1qTkLUqBCnvNJDvY_SAjDrIcZyHnIw",
			KeyFunc: func(context.Context) (any, error) {
				return []byte("secret"), nil
			},
			Algorithm: string(validator.HS256),

			Want: codes.OK,
		},
	}
	for _, tc := range tcs {
		validateTokenWithValidator = func(jwtValidator *validator.Validator, ctx context.Context, tokenString string) (any, error) {
			if tc.Auth0Error {
				return nil, status.Error(codes.PermissionDenied, "message")
			}
			audiences := strings.Split(tc.Config.Audience, ",")

			tValidator, err := validator.New(
				tc.KeyFunc,
				validator.SignatureAlgorithm(tc.Algorithm),
				tc.Config.IssuerURL,
				audiences,
				validator.WithCustomClaims(
					func() validator.CustomClaims {
						return &CustomClaims{}
					},
				),
				validator.WithAllowedClockSkew(time.Second),
			)
			if err != nil {
				return nil, err
			}

			return tValidator.ValidateToken(ctx, tokenString)
		}
		t.Run(tc.Desc, func(t *testing.T) {
			customClaims, err := validateToken(context.Background(), tc.Config, tc.Token)

			if tc.Want == codes.OK {
				testutils.MustMatch(t, tc.ExpectedClaims, customClaims, "Claims from context do not match")
			}

			if status.Convert(err).Code() != tc.Want {
				t.Errorf("Expected code %s but got %s", tc.Want, status.Convert(err).Code())
			}
		})
	}
}

package auth

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"

	"github.com/auth0/go-jwt-middleware/v2/validator"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func testFunction(rw http.ResponseWriter, req *http.Request) {
	rw.WriteHeader(http.StatusOK)
	rw.Write([]byte("OK"))
}

func TestWithAuth(t *testing.T) {
	tcs := []struct {
		Desc                  string
		Token                 string
		Auth0Error            bool
		AuthorizationDisabled bool

		Want int
	}{
		{
			Desc:                  "Should validate token",
			Token:                 "Bearer token",
			Auth0Error:            false,
			AuthorizationDisabled: false,

			Want: http.StatusOK,
		},
		{
			Desc:                  "Should skip validation",
			Token:                 "",
			Auth0Error:            false,
			AuthorizationDisabled: true,

			Want: http.StatusOK,
		},
		{
			Desc:                  "Should fail validation with empty token",
			Token:                 "",
			Auth0Error:            false,
			AuthorizationDisabled: false,

			Want: http.StatusUnauthorized,
		},
		{
			Desc:                  "Should fail validation with invalid token",
			Token:                 "token",
			Auth0Error:            false,
			AuthorizationDisabled: false,

			Want: http.StatusUnauthorized,
		},
		{
			Desc:                  "Should fail validation because of Auth0 error",
			Token:                 "Bearer token",
			Auth0Error:            true,
			AuthorizationDisabled: false,

			Want: http.StatusUnauthorized,
		},
	}

	for _, tc := range tcs {
		validateTokenWithValidator = func(jwtValidator *validator.Validator, ctx context.Context, tokenString string) (any, error) {
			if tc.Auth0Error {
				return nil, status.Error(codes.PermissionDenied, "message")
			}
			return &validator.ValidatedClaims{
				CustomClaims: &CustomClaims{},
			}, nil
		}
		t.Run(tc.Desc, func(t *testing.T) {
			httpAuthConfig := Config{
				AuthorizationDisabled: tc.AuthorizationDisabled,
				IssuerURL:             "iss",
				Audience:              "aud",
			}
			authHandler := HTTPHandler(context.Background(), http.HandlerFunc(testFunction), httpAuthConfig)
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.Header.Add("authorization", tc.Token)
			w := httptest.NewRecorder()
			authHandler.ServeHTTP(w, req)
			res := w.Result()
			defer res.Body.Close()

			testutils.MustMatch(t, tc.Want, res.StatusCode, fmt.Sprintf("Expected code %v but got %v", tc.Want, res.StatusCode))
		})
	}
}

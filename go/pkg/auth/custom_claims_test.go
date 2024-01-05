package auth

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestAddCustomClaims(t *testing.T) {
	testCases := []struct {
		Name   string
		Claims *CustomClaims
	}{
		{
			Name:   "works when receiving a nil pointer",
			Claims: nil,
		},
		{
			Name:   "works with empty claims",
			Claims: &CustomClaims{},
		},
		{
			Name: "works with one claim",
			Claims: &CustomClaims{
				Email: "test@example.com",
			},
		},
		{
			Name: "works with email and scope",
			Claims: &CustomClaims{
				Email: "test@example.com",
				Scope: "TestScope",
			},
		},
		{
			Name: "works with email, scope, type and properties",
			Claims: &CustomClaims{
				Email: "test@example.com",
				Scope: "TestScope",
				Type:  "user",
				Properties: map[string]any{
					"provider_type": "TestProviderType",
					"groups":        []string{"testGroup", "testGroup2"},
				},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			ctx := context.Background()
			ctxWithClaims := addCustomClaims(ctx, testCase.Claims)

			claimsFromContext := ctxWithClaims.Value(customClaimsContextKey{}).(*CustomClaims)

			if testCase.Claims == nil {
				testutils.MustMatch(t, testCase.Claims, claimsFromContext, "Expected to read a nil pointer from ctx")
			} else {
				testutils.MustMatch(t, *testCase.Claims, *claimsFromContext, "Claims read from context do not match")
			}
		})
	}
}

func TestCustomClaimsFromContext(t *testing.T) {
	testCases := []struct {
		Name    string
		Context context.Context

		ExpectedOk     bool
		ExpectedClaims *CustomClaims
	}{
		{
			Name: "works with email and scope",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
			}),

			ExpectedOk: true,
			ExpectedClaims: &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
			},
		},
		{
			Name: "works with provider type",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
				Type:  "user",
				Properties: map[string]any{
					"provider_type":             "TestProviderType",
					"groups":                    []string{"testGroup", "testGroup2"},
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			}),

			ExpectedOk: true,
			ExpectedClaims: &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
				Type:  "user",
				Properties: map[string]any{
					"provider_type":             "TestProviderType",
					"groups":                    []string{"testGroup", "testGroup2"},
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			},
		},
		{
			Name: "works",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
			}),

			ExpectedOk: true,
			ExpectedClaims: &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
			},
		},
		{
			Name:    "returns ok = false and empty claims if the claims pointer in context is nil",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, nil),

			ExpectedOk: false,
		},
		{
			Name:    "returns ok = false and empty claims if the context is empty",
			Context: context.Background(),

			ExpectedOk: false,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			claimsFromContext, ok := CustomClaimsFromContext(testCase.Context)

			testutils.MustMatch(t, testCase.ExpectedOk, ok, "Expected different ok value")

			if testCase.ExpectedOk {
				testutils.MustMatch(t, *testCase.ExpectedClaims, claimsFromContext, "Claims from context do not match")
			}
		})
	}
}

func TestContextWithClaims(t *testing.T) {
	testCases := []struct {
		name   string
		claims *CustomClaims

		wantCtx context.Context
	}{
		{
			name: "success - base case",
			claims: &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
				Properties: map[string]any{
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			},

			wantCtx: context.WithValue(context.Background(), customClaimsContextKey{}, &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
				Properties: map[string]any{
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			}),
		},
		{
			name:   "success - empty claims",
			claims: nil,

			wantCtx: context.WithValue(context.Background(), customClaimsContextKey{}, (*CustomClaims)(nil)),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			gotCtx := ContextWithClaims(context.Background(), testCase.claims)
			testutils.MustMatch(t, testCase.wantCtx, gotCtx)
		})
	}
}

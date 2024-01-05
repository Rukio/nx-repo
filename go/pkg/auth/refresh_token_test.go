package auth

import (
	"context"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestNewAutoRefreshToken(t *testing.T) {
	env := Auth0Env{
		ClientID:     "abc",
		ClientSecret: "123",
		Audience:     "aud",
		IssuerURL:    "url",
	}
	refreshInterval := 1 * time.Second

	tcs := []struct {
		Desc string
		Env  Auth0Env

		HasErr bool
		Want   *AutoRefreshToken
	}{
		{
			Desc: "base case",
			Env:  env,

			Want: &AutoRefreshToken{
				env:             env,
				refreshInterval: refreshInterval,
				fetchFunc:       env.FetchToken,
			},
		},
		{
			Desc: "bad auth0 env",
			Env:  Auth0Env{},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			token, err := NewAutoRefreshToken(tc.Env, refreshInterval)
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".fetchFunc")(t, tc.Want, token, "token doesn't match")
		})
	}
}

type mockFetchToken struct {
	errs []error

	i int
}

func (t *mockFetchToken) fetch(ctx context.Context) (*Token, error) {
	err := ctx.Err()
	if err != nil {
		return nil, err
	}

	token := t.i

	if len(t.errs) > t.i {
		err = t.errs[t.i]
	}

	t.i++

	return &Token{
		Info: &AccessTokenInfo{
			AccessToken: strconv.Itoa(token),
			TokenType:   "mock",
		},
	}, err
}

func TestAutoRefreshToken(t *testing.T) {
	tokenErr := errors.New("token err")

	tcs := []struct {
		Desc              string
		FetchTokenErrs    []error
		HasEarlyCtxCancel bool

		HasErr bool
		Values []string
	}{
		{
			Desc: "base case",

			Values: []string{"mock 0", "mock 1", "mock 2"},
		},
		{
			Desc:           "first fetch token error returns error",
			FetchTokenErrs: []error{tokenErr},

			HasErr: true,
		},
		{
			Desc:           "second fetch token error does not change values",
			FetchTokenErrs: []error{nil, tokenErr, nil},

			Values: []string{"mock 0", "mock 0", "mock 2"},
		},
		{
			Desc:              "early cancel stops changing values",
			HasEarlyCtxCancel: true,

			HasErr: false,
			Values: []string{"mock 0", "mock 0", "mock 0"},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tc := tc
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()

			mft := &mockFetchToken{
				errs: tc.FetchTokenErrs,
			}

			refreshInterval := 10 * time.Second

			token := &AutoRefreshToken{
				env:             Auth0Env{},
				refreshInterval: refreshInterval,
				fetchFunc:       mft.fetch,
			}

			err := token.Start(ctx)
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}

			if tc.HasErr {
				return
			}

			for i, val := range tc.Values {
				testutils.MustMatch(t, val, token.AuthorizationValue(), "auth values don't match")
				if tc.HasEarlyCtxCancel && i == 0 {
					cancel()
				}

				_ = token.refresh(ctx)
			}
		})
	}
}

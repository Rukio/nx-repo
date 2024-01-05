package auth

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const needURL = "tobeoverridden"

func TestAuth0Valid(t *testing.T) {
	tcs := []struct {
		Desc string
		Env  Auth0Env

		Want bool
	}{
		{
			Desc: "Base case",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakeclientsecret",
				Audience:     "fakeaudience",
				IssuerURL:    "fakeauthurl",
			},
			Want: true,
		},
		{
			Desc: "No client ID",
			Env: Auth0Env{
				ClientID:     "",
				ClientSecret: "fakeclientsecret",
				Audience:     "fakeaudience",
				IssuerURL:    "fakeauthurl",
			},
			Want: false,
		},
		{
			Desc: "No client secret",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "",
				Audience:     "fakeaudience",
				IssuerURL:    "fakeauthurl",
			},
			Want: false,
		},
		{
			Desc: "No issuer URL",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakeclientsecret",
				Audience:     "fakeaudience",
				IssuerURL:    "",
			},
			Want: false,
		},
		{
			Desc: "No audience",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakeclientsecret",
				Audience:     "",
				IssuerURL:    "fakeauthurl",
			},
			Want: false,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			if tc.Env.Valid() != tc.Want {
				t.Errorf("want %t, got %t", tc.Want, tc.Env.Valid())
			}
		})
	}
}

func TestFetchToken(t *testing.T) {
	tcs := []struct {
		Desc           string
		Env            Auth0Env
		HTTPStatusCode int
		JSONResponse   []byte

		HasErr    bool
		ErrorType error
		Want      *AccessTokenInfo
	}{
		{
			Desc: "Base case",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				Audience:     "fakeaudience",
				IssuerURL:    needURL,
			},
			HTTPStatusCode: 200,
			JSONResponse: []byte(`{
				"access_token": "blah",
				"scope": "all",
				"expires_in": 86400,
				"token_type": "m2m"
			}`),
			Want: &AccessTokenInfo{
				AccessToken: "blah",
				Scope:       "all",
				ExpiresIn:   86400,
				TokenType:   "m2m",
			},
		},
		{
			Desc: "Unparseable IssuerURL",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				Audience:     "fakeaudience",
				IssuerURL:    ":::::",
			},
			HasErr: true,
		},
		{
			Desc:           "Missing all env values",
			Env:            Auth0Env{},
			HTTPStatusCode: 200,
			HasErr:         true,
			ErrorType:      ErrAuth0MissingEnvVars,
		},
		{
			Desc: "Missing some env values",
			Env: Auth0Env{
				ClientID:  "fakeclientid",
				Audience:  "fakeaudience",
				IssuerURL: needURL,
			},
			HTTPStatusCode: 200,
			HasErr:         true,
			ErrorType:      ErrAuth0MissingEnvVars,
		},
		{
			Desc: "JSON unmarshaling error",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				Audience:     "fakeaudience",
				IssuerURL:    needURL,
			},
			JSONResponse:   []byte(`asdf`),
			HTTPStatusCode: 200,
			HasErr:         true,
			ErrorType:      ErrAuth0UnmarshalJSON,
		},
		{
			Desc: "HTTP POST error",
			Env: Auth0Env{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				Audience:     "fakeaudience",
				IssuerURL:    needURL,
			},
			HTTPStatusCode: 500,
			HasErr:         true,
			ErrorType:      Auth0StatusNotOKError{StatusCode: 500},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Content-Type") != "application/json" {
					t.Fatal("Content-Type must be application/json")
				}
				rw.WriteHeader(tc.HTTPStatusCode)
				rw.Write(tc.JSONResponse)
			}))
			defer server.Close()
			// Overwrite the server to be the mock server
			if tc.Env.IssuerURL == needURL {
				tc.Env.IssuerURL = server.URL
			}

			token, err := tc.Env.FetchToken(context.Background())
			if (err != nil) != tc.HasErr {
				t.Fatalf("HasErr does not match actual error response on request: %s\ntc:%+v", err, tc)
			}
			if tc.HasErr {
				if tc.ErrorType != nil && !errors.Is(err, tc.ErrorType) {
					t.Fatalf("error type does not match for test case %+v\ngot: %s, want: %s", tc, err, tc.ErrorType)
				}
				// We have an expected error
				return
			}

			testutils.MustMatch(t, tc.Want, token.Info, "access token JSON does not match")
		})
	}
}

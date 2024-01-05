package athenaauth

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const needURL = "tobeoverridden"

func TestAuthConfigValid(t *testing.T) {
	tcs := []struct {
		Desc string
		Env  Config

		Want bool
	}{
		{
			Desc: "Base case",
			Env: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakeclientsecret",
				AuthURL:      "fakeauthurl",
			},
			Want: true,
		},
		{
			Desc: "No client ID",
			Env: Config{
				ClientID:     "",
				ClientSecret: "fakeclientsecret",
				AuthURL:      "fakeauthurl",
			},
			Want: false,
		},
		{
			Desc: "No client secret",
			Env: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "",
				AuthURL:      "fakeauthurl",
			},
			Want: false,
		},
		{
			Desc: "No auth URL",
			Env: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakeclientsecret",
				AuthURL:      "",
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
		Config         Config
		HTTPStatusCode int
		JSONResponse   []byte

		HasErr    bool
		ErrorType error
		Want      *auth.AccessTokenInfo
	}{
		{
			Desc: "Base case",
			Config: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				AuthURL:      needURL,
			},
			HTTPStatusCode: 200,
			JSONResponse: []byte(`{
				"access_token": "blah",
				"scope": "athena/service/Athenanet.MDP.*",
				"expires_in": "86400",
				"token_type": "client_credentials"
			}`),
			Want: &auth.AccessTokenInfo{
				AccessToken: "blah",
				Scope:       "athena/service/Athenanet.MDP.*",
				ExpiresIn:   86400,
				TokenType:   "client_credentials",
			},
		},
		{
			Desc: "Unparseable URL",
			Config: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				AuthURL:      ":::::",
			},
			HasErr: true,
		},
		{
			Desc: "Missing some env values",
			Config: Config{
				ClientID: "fakeclientid",
				AuthURL:  needURL,
			},
			HTTPStatusCode: 200,
			HasErr:         true,
			ErrorType:      ErrMissingConfigVars,
		},
		{
			Desc: "JSON unmarshaling error",
			Config: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				AuthURL:      needURL,
			},
			JSONResponse:   []byte(`asdf`),
			HTTPStatusCode: 200,
			HasErr:         true,
			ErrorType:      ErrUnmarshalJSON,
		},
		{
			Desc: "Integer ExpiresIn returned",
			Config: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				AuthURL:      needURL,
			},
			HTTPStatusCode: 200,
			JSONResponse: []byte(`{
				"access_token": "blah",
				"scope": "athena/service/Athenanet.MDP.*",
				"expires_in": "just expire later lol",
				"token_type": "client_credentials"
			}`),
			HasErr:    true,
			ErrorType: ErrCannotConvertToInt,
		},
		{
			Desc: "HTTP POST error",
			Config: Config{
				ClientID:     "fakeclientid",
				ClientSecret: "fakesecret",
				AuthURL:      needURL,
			},
			HTTPStatusCode: 400,
			HasErr:         true,
			ErrorType:      AuthError{StatusCode: 400},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.HTTPStatusCode)
				rw.Write(tc.JSONResponse)
			}))
			defer server.Close()
			// Overwrite the server to be the mock server
			if tc.Config.AuthURL == needURL {
				tc.Config.AuthURL = server.URL
			}

			token, err := tc.Config.FetchToken(context.Background())
			if (err != nil) != tc.HasErr {
				t.Fatalf("HasErr does not match actual error response on request: %s\ntc:%+v", err, tc)
			}
			if tc.HasErr {
				if tc.ErrorType != nil && !errors.Is(err, tc.ErrorType) {
					t.Fatalf("error type does not match for test case %+v\ngot: %s, want: %s", tc, err, tc.ErrorType)
				}
			} else {
				testutils.MustMatch(t, tc.Want, token.Info, "access token JSON does not match")
			}
		})
	}
}

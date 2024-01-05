package cors

import (
	"net/http"
	"testing"
)

func TestValidateAllowedHTTPOrigins(t *testing.T) {
	var (
		tcs = []struct {
			Desc string

			Input []string

			WantResult string
			WantError  bool
		}{
			{
				Desc:  "correct URL one element",
				Input: []string{"localhost:*"},

				WantError: false,
			},
			{
				Desc:  "correct URL two elements",
				Input: []string{"localhost:1020", "localhost:1010"},

				WantError: false,
			},
			{
				Desc:  "broken URL one element",
				Input: []string{"test"},

				WantError: true,
			},
			{
				Desc:  "broken URL second element",
				Input: []string{"localhost:1020", "test"},

				WantError: true,
			},
		}
	)

	for _, tc := range tcs {
		err := validateAllowedHTTPOrigins(tc.Input)
		if (tc.WantError && err == nil) || (!tc.WantError && err != nil) {
			t.Fatalf("received unexpected error: %+v", tc)
		}
	}
}

func TestInitialize(t *testing.T) {
	var (
		tcs = []struct {
			Desc         string
			InputOrigins []string
			InputMethods []string
			InputHeaders []string

			WantResult string
			WantError  bool
		}{
			{
				Desc:         "correct URL one element",
				InputOrigins: []string{"localhost:*"},
				InputMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost},
				InputHeaders: []string{"*"},

				WantError: false,
			},
			{
				Desc:         "invalid allowed origins",
				InputOrigins: []string{"brokenURL"},
				InputMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost},
				InputHeaders: []string{"*"},

				WantError: true,
			},
		}
	)

	for _, tc := range tcs {
		config := Config{
			AllowedHTTPOrigins: tc.InputOrigins,
			AllowedHTTPMethods: tc.InputMethods,
			AllowedHTTPHeaders: tc.InputHeaders,
		}
		corsInstance, err := Initialize(config)
		if !tc.WantError && corsInstance == nil {
			t.Fatalf("received unexpected error: %+v", tc)
		}
		if (tc.WantError && err == nil) || (!tc.WantError && err != nil) {
			t.Fatalf("received unexpected error: %+v", tc)
		}
	}
}

package secrets

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
)

type setState = func(key string, value string)
type unsetState = func(key string)

func envState(key string, value string) {
	os.Setenv(key, value)
}
func unsetEnvState(key string) {
	os.Unsetenv(key)
}

func TestProvider_Secret(t *testing.T) {
	tcs := []struct {
		Desc       string
		Key        string
		Value      string
		Provider   Provider
		SetState   setState
		UnsetState unsetState

		HasError bool
	}{
		{
			Desc:       "Env Secret",
			Key:        "CUSTOM_VARIABLE",
			Value:      "custom_value",
			Provider:   NewEnvProvider(),
			SetState:   envState,
			UnsetState: unsetEnvState,

			HasError: false,
		},
		{
			Desc:     "Env Secret Not Found",
			Key:      "NOT_FOUND_VARIABLE",
			Value:    "custom_value",
			Provider: NewEnvProvider(),

			HasError: true,
		},
		{
			Desc:  "AWS Secret",
			Key:   "secretId",
			Value: "secretId-value",
			Provider: AWSProvider{client: mockAwsSecretsClient{
				err: nil,
			}},

			HasError: false,
		},
		{
			Desc:  "AWS Secret Not Found",
			Key:   "NOT_FOUND_VARIABLE",
			Value: "",
			Provider: AWSProvider{client: mockAwsSecretsClient{
				err: errors.New("internal error"),
			}},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			fmt.Println(tc.Provider)
			if tc.SetState != nil {
				tc.SetState(tc.Key, tc.Value)
				defer tc.UnsetState(tc.Key)
			}

			secret, err := tc.Provider.Secret(context.Background(), tc.Key)

			if (err != nil) != tc.HasError {
				t.Fatalf("Unexpected Error State: %s\nexpected: %v\ngot: %v", tc.Desc, tc.HasError, err != nil)
			}

			if tc.HasError {
				var unavailable *UnavailableError
				if !errors.As(err, &unavailable) {
					t.Errorf("Incorrect Error: expected UnavailableError")
				}
			}

			if err == nil && secret.Value() != tc.Value {
				t.Errorf("Incorrect Value: %s\nexpected: %s\ngot: %s", tc.Desc, tc.Value, secret.Value())
			}
		})
	}
}

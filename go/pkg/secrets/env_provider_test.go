package secrets

import (
	"context"
	"fmt"
	"os"
	"testing"
)

func TestEnvProvider_Secret(t *testing.T) {
	tcs := []struct {
		Desc  string
		Key   string
		Value string

		HasError bool
	}{
		{
			Desc:  "Secret is available",
			Key:   "CUSTOM_VARIABLE",
			Value: "custom_value",

			HasError: false,
		},
		{
			Desc:  "Secret is unavailable",
			Key:   "CUSTOM_VARIABLE",
			Value: "custom_value",

			HasError: true,
		},
	}

	envProvider := NewEnvProvider()
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			if !tc.HasError {
				os.Setenv(tc.Key, tc.Value)
				defer os.Unsetenv(tc.Key)
			}

			secret, err := envProvider.Secret(context.Background(), tc.Key)

			if (err != nil) != tc.HasError {
				t.Fatalf("Unexpected Error State: %s\nexpected: %v\ngot: %v", tc.Desc, tc.HasError, err != nil)
			}

			if tc.HasError {
				expectedError := fmt.Sprintf("secret %s unavailable: not found", tc.Key)
				if err.Error() != expectedError {
					t.Errorf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, err)
				}
			}

			if err == nil && secret.Value() != tc.Value {
				t.Errorf("Incorrect Value: %s\nexpected: %s\ngot: %s", tc.Desc, tc.Value, secret.Value())
			}
		})
	}
}

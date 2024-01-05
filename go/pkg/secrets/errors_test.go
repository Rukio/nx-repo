package secrets

import (
	"errors"
	"fmt"
	"testing"
)

func TestUnavailableError(t *testing.T) {
	tcs := []struct {
		Desc       string
		SecretName string
		Reason     error
	}{
		{
			Desc:       "Not Found",
			SecretName: "custom_value",
			Reason:     nil,
		},
		{
			Desc:       "Not Found with Cause",
			SecretName: "custom_value",
			Reason:     errors.New("service unavailable"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			secretError := &UnavailableError{SecretName: tc.SecretName, Reason: tc.Reason}

			expectedError := fmt.Sprintf("secret %s unavailable", tc.SecretName)
			if tc.Reason != nil {
				expectedError = fmt.Sprintf("%s: %s", expectedError, tc.Reason.Error())
			}
			if secretError.Error() != expectedError {
				t.Errorf("Incorrect Error: %s\nexpected: %s\ngot: %s", tc.Desc, expectedError, secretError.Error())
			}
		})
	}
}

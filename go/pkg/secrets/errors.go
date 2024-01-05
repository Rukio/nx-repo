package secrets

import "fmt"

type UnavailableError struct {
	SecretName string
	Reason     error
}

func (e UnavailableError) Error() string {
	if e.Reason != nil {
		return fmt.Sprintf("secret %s unavailable: %s", e.SecretName, e.Reason.Error())
	}
	return fmt.Sprintf("secret %s unavailable", e.SecretName)
}

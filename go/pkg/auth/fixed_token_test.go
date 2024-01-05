package auth

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestFixedToken(t *testing.T) {
	token := &FixedToken{
		TokenType:   "abc",
		AccessToken: "123",
	}

	testutils.MustMatch(t, "abc 123", token.AuthorizationValue(), "auth value doesn't match")
}

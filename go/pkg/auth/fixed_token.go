package auth

import "fmt"

const (
	BearerTokenType = "Bearer"
)

// FixedToken is a fixed token, used for shared secrets.
type FixedToken struct {
	TokenType   string
	AccessToken string
}

func (t FixedToken) AuthorizationValue() string {
	return fmt.Sprintf("%s %s", t.TokenType, t.AccessToken)
}

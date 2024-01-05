package athenaauth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
)

const (
	athenaScope     = "athena/service/Athenanet.MDP.*"
	athenaGrantType = "client_credentials"
)

var (
	ErrMissingConfigVars  = errors.New("failed to load athena config variables")
	ErrUnmarshalJSON      = errors.New("failed to unmarshal JSON for athena access token")
	ErrCannotConvertToInt = errors.New("ExpiresIn cannot convert to int")
)

type Config struct {
	ClientID     string
	ClientSecret string
	AuthURL      string
	Timeout      time.Duration
}

// This differs from auth.AccessTokenInfo because ExpiresIn is a string, not int.
type accessTokenInfo struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	ExpiresIn   string `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type AuthError struct {
	StatusCode int
}

func (e AuthError) Error() string {
	return fmt.Sprintf("Error code was not StatusOK but was: %d", e.StatusCode)
}

func (c Config) Valid() bool {
	return c.ClientID != "" && c.ClientSecret != "" && c.AuthURL != ""
}

func (c Config) FetchToken(ctx context.Context) (*auth.Token, error) {
	if !c.Valid() {
		return nil, ErrMissingConfigVars
	}

	data := url.Values{}
	data.Set("scope", athenaScope)
	data.Set("grant_type", athenaGrantType)
	encodedData := data.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.AuthURL, strings.NewReader(encodedData))
	if err != nil {
		return nil, err
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(c.ClientID, c.ClientSecret)

	client := &http.Client{
		Timeout: c.Timeout,
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, AuthError{StatusCode: resp.StatusCode}
	}

	var accessTokenInfo accessTokenInfo
	err = json.NewDecoder(resp.Body).Decode(&accessTokenInfo)
	if err != nil {
		return nil, ErrUnmarshalJSON
	}

	expiresIn, err := strconv.Atoi(accessTokenInfo.ExpiresIn)
	if err != nil {
		return nil, ErrCannotConvertToInt
	}

	return &auth.Token{
		Info: &auth.AccessTokenInfo{
			AccessToken: accessTokenInfo.AccessToken,
			Scope:       accessTokenInfo.Scope,
			ExpiresIn:   expiresIn,
			TokenType:   accessTokenInfo.TokenType,
		},
	}, nil
}

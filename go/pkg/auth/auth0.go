package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
)

const (
	LogicalAPIAudience = "internal.*company-data-covered*.com"
)

var (
	ErrAuth0MissingEnvVars = errors.New("failed to load auth0 env variables")
	ErrAuth0UnmarshalJSON  = errors.New("failed to unmarshal JSON for Auth0 access token")
)

type Auth0StatusNotOKError struct {
	StatusCode int
}

func (e Auth0StatusNotOKError) Error() string {
	return fmt.Sprintf("Error code was not StatusOK but was: %d", e.StatusCode)
}

type Valuer interface {
	// AuthorizationValue returns an HTTP Authorization value.
	AuthorizationValue() string
}

// TODO: Make this struct private after removing dependency in patient-service tests.
type AccessTokenInfo struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type Token struct {
	Info *AccessTokenInfo
}

func (t *Token) AuthorizationValue() string {
	return fmt.Sprintf("%s %s", t.Info.TokenType, t.Info.AccessToken)
}

type Auth0Env struct {
	ClientID     string
	ClientSecret string
	Audience     string
	IssuerURL    string
}

func (e Auth0Env) Valid() bool {
	return e.ClientID != "" && e.ClientSecret != "" && e.Audience != "" && e.IssuerURL != ""
}

func (e Auth0Env) FetchToken(ctx context.Context) (*Token, error) {
	if !e.Valid() {
		return nil, ErrAuth0MissingEnvVars
	}

	payloadBytes, err := json.Marshal(map[string]string{
		"client_id":     e.ClientID,
		"client_secret": e.ClientSecret,
		"audience":      e.Audience,
		"grant_type":    "client_credentials",
	})
	if err != nil {
		return nil, err
	}

	oauthTokenURL, err := url.JoinPath(e.IssuerURL, "oauth", "token")
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, oauthTokenURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req.Header.Add("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, Auth0StatusNotOKError{StatusCode: resp.StatusCode}
	}

	var accessTokenInfo AccessTokenInfo
	err = json.NewDecoder(resp.Body).Decode(&accessTokenInfo)
	if err != nil {
		return nil, ErrAuth0UnmarshalJSON
	}

	return &Token{
		Info: &accessTokenInfo,
	}, nil
}

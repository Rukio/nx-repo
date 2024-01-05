package station

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
)

var errMissingAuthToken = errors.New("missing \"Authorization\" header")

type Client struct {
	AuthToken    auth.Valuer
	HTTPClient   *http.Client
	StationURL   string
	AuthDisabled bool
}

type RequestConfig struct {
	Method      string
	Path        string
	ContentType httpclient.ContentType
	QueryParams url.Values
	ReqBody     any
	RespData    any
	ForwardAuth bool
}

func (sc *Client) Request(ctx context.Context, c *RequestConfig) error {
	if strings.Contains(c.Path, "?") {
		return status.Errorf(codes.Internal, "path cannot contain query params, use QueryParams in RequestConfig struct: %s", c.Path)
	}
	urlPath, err := url.JoinPath(sc.StationURL, c.Path)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to join URL path of %s and %s: %s", sc.StationURL, c.Path, err)
	}
	headers := httpclient.Headers{
		"Accept": "application/vnd.*company-data-covered*.com; version=1",
	}
	var authToken string
	if !sc.AuthDisabled {
		if c.ForwardAuth {
			authToken, err = sc.GetAuthorizationTokenFromContext(ctx)
			if err != nil {
				return status.Errorf(codes.Unauthenticated, "failed to obtain auth token from context: %s", err)
			}
		} else {
			authToken = sc.AuthToken.AuthorizationValue()
		}
		headers["Authorization"] = authToken
	}
	contentType := c.ContentType
	if c.ReqBody != nil && c.ContentType == httpclient.ContentTypeNotSpecified {
		contentType = httpclient.ContentTypeJSON
	}
	req := &httpclient.Request{
		Method:      c.Method,
		URL:         urlPath,
		ContentType: contentType,
		QueryParams: c.QueryParams,
		Request:     c.ReqBody,
		Response:    c.RespData,
		Headers:     headers,
		Client:      sc.HTTPClient,
	}
	return httpclient.Do(ctx, req)
}

func (sc *Client) GetAuthorizationTokenFromContext(context context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(context)
	if !ok {
		return "", errMissingAuthToken
	}
	authHeader := md.Get("authorization")
	if len(authHeader) == 0 {
		return "", errMissingAuthToken
	}

	return authHeader[0], nil
}

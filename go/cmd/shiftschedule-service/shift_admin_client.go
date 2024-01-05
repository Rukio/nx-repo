package main

import (
	"context"
	"encoding/base64"
	"net/http"
	"net/url"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/httpclient"
)

type ShiftAdminClient struct {
	UserName      string
	Password      string
	HTTPClient    *http.Client
	ShiftAdminURL string
}

type ShiftAdminRequestConfig struct {
	Method      string
	Path        string
	ContentType httpclient.ContentType
	QueryParams url.Values
	ReqBody     any
	RespData    any
}

func basicAuth(username, password string) string {
	auth := username + ":" + password
	return base64.StdEncoding.EncodeToString([]byte(auth))
}

func (sc *ShiftAdminClient) Request(ctx context.Context, c *ShiftAdminRequestConfig) error {
	if strings.Contains(c.Path, "?") {
		return status.Errorf(codes.Internal, "path cannot contain query params, use QueryParams in RequestConfig struct: %s", c.Path)
	}
	urlPath, err := url.JoinPath(sc.ShiftAdminURL, c.Path)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to join URL path of %s and %s: %s", sc.ShiftAdminURL, c.Path, err)
	}
	headers := httpclient.Headers{
		"Authorization": "Basic " + basicAuth(sc.UserName, sc.Password),
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

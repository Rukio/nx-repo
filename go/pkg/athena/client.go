package athena

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	fieldNameFromTagJSON               = "json"
	athenaRateLimitHeaderName          = "X-Ratelimit-Remaining"
	athenaRateLimitRemainingMetricName = "AthenaRateLimitRemaining"
)

type NewClientParams struct {
	AuthToken       auth.Valuer
	BaseURL         string
	PracticeID      string
	HTTPClient      *http.Client
	DataDogRecorder *monitoring.DataDogRecorder
	Logger          *zap.SugaredLogger
}

type Client struct {
	AuthToken       auth.Valuer
	AthenaBaseURL   string
	HTTPClient      *http.Client
	DataDogRecorder *monitoring.DataDogRecorder
	Logger          *zap.SugaredLogger
}

type healthcheckResponse struct {
	Pong string `json:"pong"`
}

func NewClient(params NewClientParams) (*Client, error) {
	client := new(Client)

	client.AuthToken = params.AuthToken
	athenaBaseURL, err := url.JoinPath(params.BaseURL, params.PracticeID)
	if err != nil {
		return nil, fmt.Errorf("could not build athena URL, err: %w", err)
	}
	client.AthenaBaseURL = athenaBaseURL

	if params.HTTPClient != nil {
		client.HTTPClient = params.HTTPClient
	} else {
		client.HTTPClient = &http.Client{}
	}

	client.DataDogRecorder = params.DataDogRecorder

	client.Logger = params.Logger
	if client.Logger == nil {
		client.Logger = zap.NewNop().Sugar()
	}

	return client, nil
}

type RequestOptions struct {
	Method      string
	Path        string
	ContentType httpclient.ContentType
	Request     any
	Response    any
	QueryParams url.Values
}

func (c *Client) request(ctx context.Context, options *RequestOptions) error {
	if strings.Contains(options.Path, "?") {
		return status.Errorf(codes.Internal, "path cannot contain query params, use QueryParams in RequestOptions struct: %s", options.Path)
	}
	urlString, err := url.JoinPath(c.AthenaBaseURL, options.Path)

	if err != nil {
		return status.Errorf(codes.Internal, "failed to build path with : '%s' and '%s'. err: %s", c.AthenaBaseURL, options.Path, err)
	}
	headers := map[string]string{
		"Authorization": c.AuthToken.AuthorizationValue(),
	}

	responseHeaders := httpclient.Headers{}

	params := httpclient.Request{
		Method:          options.Method,
		URL:             urlString,
		Request:         options.Request,
		ContentType:     options.ContentType,
		Response:        options.Response,
		QueryParams:     options.QueryParams,
		ResponseHeaders: &responseHeaders,
		Headers:         headers,
		Client:          c.HTTPClient,
	}

	err = httpclient.Do(ctx, &params)
	if err != nil {
		return err
	}

	if value, found := responseHeaders[athenaRateLimitHeaderName]; found && c.DataDogRecorder != nil {
		floatRateLimit, err := strconv.ParseFloat(value, 64)
		if err != nil {
			c.Logger.Errorw("failed to parse rate limit", zap.Error(err))
		} else {
			c.DataDogRecorder.Gauge(athenaRateLimitRemainingMetricName, floatRateLimit, nil)
		}
	}

	return nil
}

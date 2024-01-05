package httpclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type expectedResponse struct {
	ID int
}

func TestExecuteRequest(t *testing.T) {
	defaultResponse, err := json.Marshal(expectedResponse{
		ID: 1,
	})
	if err != nil {
		t.Fatal(err)
	}
	goodReqBody := struct{ testing bool }{
		testing: true,
	}
	badReqBody := make(chan int)
	defaultHeaders := Headers{"X-Whee": "Y-Whee"}
	defaultHeadersJSON := Headers{"X-Whee": "Y-Whee", "Content-Type": string(ContentTypeJSON)}
	defaultHeadersURLEncoded := Headers{"X-Whee": "Y-Whee", "Content-Type": string(ContentTypeFormURLEncoded)}
	goodQueryParams := url.Values{"jedi": []string{"yoda"}}

	tcs := []struct {
		Desc                string
		Method              string
		URL                 string
		Headers             Headers
		Client              *http.Client
		QueryParams         url.Values
		ContentType         ContentType
		Request             any
		RawJSONResponse     []byte
		HTTPStatus          int
		ServerIsUnavailable bool

		WantRespBody        *expectedResponse
		WantCode            codes.Code
		WantMessage         string
		WantResponseHeaders Headers
	}{
		{
			Desc:            "success - base case",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,

			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:            "success - query params",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,
			QueryParams:     goodQueryParams,

			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:            "success - request with no body has only provided headers",
			HTTPStatus:      http.StatusOK,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Headers:         defaultHeaders,
			QueryParams:     goodQueryParams,

			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:            "success - custom http client",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,
			Client:          &http.Client{},

			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:            "error - unable to marshal request body",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         badReqBody,

			WantCode: codes.Internal,
		},
		{
			Desc:        "error - unable to create HTTP request with body due to invalid url",
			Method:      http.MethodGet,
			ContentType: ContentTypeJSON,
			URL:         "::::::::::::::",
			Request:     goodReqBody,

			WantCode: codes.Internal,
		},
		{
			Desc:            "error - unable to create HTTP request without body due to invalid method",
			HTTPStatus:      http.StatusOK,
			RawJSONResponse: defaultResponse,
			Method:          "invalid method",

			WantCode: codes.Internal,
		},
		{
			Desc:                "error - server is unavailable",
			HTTPStatus:          http.StatusOK,
			ContentType:         ContentTypeJSON,
			RawJSONResponse:     defaultResponse,
			ServerIsUnavailable: true,
			Method:              http.MethodGet,
			Request:             goodReqBody,

			WantCode: codes.Unavailable,
		},
		{
			Desc:            "error - status error returns reason",
			Method:          http.MethodPost,
			ContentType:     ContentTypeJSON,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,
			HTTPStatus:      http.StatusInternalServerError,
			RawJSONResponse: []byte(`i failed because of reasons`),

			WantCode:    codes.Internal,
			WantMessage: "HTTP request had error response 500: i failed because of reasons",
		},
		{
			Desc:       "error - unable to parse HTTP status code to GRPC Code",
			Method:     http.MethodHead,
			HTTPStatus: http.StatusLoopDetected,

			WantCode: codes.Unknown,
		},
		{
			Desc:            "error - response status code is greater than HTTP Bad Request 400",
			Headers:         defaultHeadersJSON,
			ContentType:     ContentTypeJSON,
			HTTPStatus:      http.StatusUnauthorized,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,

			WantCode: codes.Unauthenticated,
		},
		{
			Desc:            "error - unable to marshal response body",
			Headers:         defaultHeadersJSON,
			ContentType:     ContentTypeJSON,
			HTTPStatus:      http.StatusOK,
			RawJSONResponse: []byte(`{"id":false}`),
			Method:          http.MethodGet,
			Request:         goodReqBody,

			WantCode: codes.Internal,
		},
		{
			Desc:            "success - check response headers",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,

			WantRespBody: &expectedResponse{ID: 1},
			WantResponseHeaders: Headers{
				"Content-Length": "8",
				"Content-Type":   "text/plain; charset=utf-8",
			},
			WantCode: codes.OK,
		},
		{
			Desc:            "success - makes a request with json content type",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeJSON,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodGet,
			Request:         goodReqBody,
			Headers:         defaultHeadersJSON,

			WantRespBody: &expectedResponse{ID: 1},
			WantResponseHeaders: Headers{
				"Content-Length": "8",
				"Content-Type":   "text/plain; charset=utf-8",
			},
			WantCode: codes.OK,
		},
		{
			Desc:            "success - makes a request form url encoded",
			HTTPStatus:      http.StatusOK,
			ContentType:     ContentTypeFormURLEncoded,
			RawJSONResponse: defaultResponse,
			Method:          http.MethodPost,
			Request: url.Values{
				"field": []string{"value"},
			},
			Headers: defaultHeadersURLEncoded,

			WantRespBody: &expectedResponse{ID: 1},
			WantResponseHeaders: Headers{
				"Content-Length": "8",
				"Content-Type":   "text/plain; charset=utf-8",
			},
			WantCode: codes.OK,
		},
		{
			Desc:        "error - provided contentType not supported",
			Method:      http.MethodPost,
			ContentType: "other",
			Request:     goodReqBody,

			WantCode: codes.InvalidArgument,
		},
		{
			Desc:    "error - contentType not provided in options",
			Method:  http.MethodPost,
			Request: goodReqBody,

			WantCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				for key, value := range tc.Headers {
					if req.Header.Get(key) != value {
						t.Errorf("For header %s, got %s, want %s", key, req.Header.Get(key), value)
					}
				}

				if tc.QueryParams != nil {
					for key, value := range tc.QueryParams {
						testutils.MustMatch(t, value[0], req.URL.Query().Get(key))
					}
				}

				rw.WriteHeader(tc.HTTPStatus)
				if tc.RawJSONResponse != nil {
					rw.Write(tc.RawJSONResponse)
				}
			}))

			if tc.ServerIsUnavailable {
				server.Close()
			}

			var respData expectedResponse
			var responseHeaders Headers
			url := tc.URL
			if tc.URL == "" {
				url = server.URL
			}
			req := &Request{
				Method:          tc.Method,
				URL:             url,
				QueryParams:     tc.QueryParams,
				ContentType:     tc.ContentType,
				Request:         tc.Request,
				Headers:         tc.Headers,
				Client:          tc.Client,
				Response:        &respData,
				ResponseHeaders: &responseHeaders,
			}
			err := Do(context.Background(), req)

			if tc.WantRespBody != nil {
				testutils.MustMatch(t, *tc.WantRespBody, respData, "unexpected response body")
			}

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.WantCode, reqStatus.Code(), "unexpected code")
			if tc.WantMessage != "" {
				testutils.MustMatch(t, tc.WantMessage, reqStatus.Message())
			}

			if tc.WantResponseHeaders != nil {
				delete(responseHeaders, "Date")
				testutils.MustMatch(t, tc.WantResponseHeaders, responseHeaders, "unexpected response headers")
			}
		})
	}
}

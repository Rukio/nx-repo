package station

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

const (
	acceptHeader = "application/vnd.*company-data-covered*.com; version=1"
)

type mockAuthValuer struct{}

func (v mockAuthValuer) AuthorizationValue() string {
	return "Bearer faketoken"
}

func getClient(stationURL string, httpClient *http.Client) *Client {
	return &Client{
		AuthToken:  mockAuthValuer{},
		HTTPClient: httpClient,
		StationURL: stationURL,
	}
}

type expectedResponse struct {
	ID int
}

func TestRequest(t *testing.T) {
	defaultContext := context.Background()
	defaultPath := "/testpath"
	pathWithQuery := "/testpath?key=value"
	defaultStationHTTPStatus := http.StatusOK
	defaultStationResponse, err := json.Marshal(expectedResponse{
		ID: 1,
	})
	if err != nil {
		t.Fatal(err)
	}
	goodReqBody := struct{ testing bool }{
		testing: true,
	}
	authContext := metadata.NewIncomingContext(context.Background(), metadata.Pairs("authorization", "Bearer faketoken"))
	noAuthContext := metadata.NewIncomingContext(context.Background(), metadata.Pairs("whee", "whoo"))
	defaultHeaders := map[string]string{
		"Accept":        acceptHeader,
		"Authorization": "Bearer faketoken",
	}
	goodQueryParams := url.Values{"jedi": []string{"yoda"}}

	tcs := []struct {
		Desc              string
		RawJSONResponse   []byte
		StationHTTPStatus int
		RequestConfig     *RequestConfig
		BaseURL           string
		Context           context.Context

		WantHeaders  map[string]string
		WantRespBody *expectedResponse
		WantCode     codes.Code
	}{
		{
			Desc:              "success - base case",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:  http.MethodGet,
				Path:    defaultPath,
				ReqBody: goodReqBody,
			},
			Context: defaultContext,

			WantHeaders:  defaultHeaders,
			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:              "success - query params",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:      http.MethodGet,
				Path:        defaultPath,
				ReqBody:     goodReqBody,
				QueryParams: goodQueryParams,
			},
			Context: defaultContext,

			WantHeaders:  defaultHeaders,
			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:              "success - forwardauth context metadata includes auth",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:      http.MethodGet,
				Path:        defaultPath,
				ReqBody:     goodReqBody,
				ForwardAuth: true,
			},
			Context: authContext,

			WantHeaders:  defaultHeaders,
			WantRespBody: &expectedResponse{ID: 1},
			WantCode:     codes.OK,
		},
		{
			Desc:              "error - path contains query params",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:  http.MethodGet,
				Path:    pathWithQuery,
				ReqBody: goodReqBody,
			},
			Context: defaultContext,

			WantCode: codes.Internal,
		},
		{
			Desc:              "error - forwardauth context metadata includes no auth",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:      http.MethodGet,
				Path:        defaultPath,
				ReqBody:     goodReqBody,
				ForwardAuth: true,
			},
			Context: noAuthContext,
			WantHeaders: map[string]string{
				"Accept":        "application/vnd.*company-data-covered*.com; version=1",
				"Authorization": "",
			},

			WantCode: codes.Unauthenticated,
		},
		{
			Desc:              "error - forwardauth context does not include metadata",
			StationHTTPStatus: defaultStationHTTPStatus,
			RawJSONResponse:   defaultStationResponse,
			RequestConfig: &RequestConfig{
				Method:      http.MethodGet,
				Path:        defaultPath,
				ReqBody:     goodReqBody,
				ForwardAuth: true,
			},
			Context: defaultContext,
			WantHeaders: map[string]string{
				"Accept": "application/vnd.*company-data-covered*.com; version=1",
			},

			WantCode: codes.Unauthenticated,
		},
		{
			Desc: "error - unable to create HTTP request with body due to invalid base url",
			RequestConfig: &RequestConfig{
				Method:  http.MethodGet,
				Path:    defaultPath,
				ReqBody: goodReqBody,
			},
			Context: defaultContext,
			BaseURL: ":::::::::::",

			WantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				for key, value := range tc.WantHeaders {
					if req.Header.Get(key) != value {
						t.Errorf("For header %s, got %s, want %s", key, req.Header.Get(key), value)
					}
				}

				if tc.RequestConfig.QueryParams != nil {
					for key, value := range tc.RequestConfig.QueryParams {
						testutils.MustMatch(t, value[0], req.URL.Query().Get(key))
					}
				}

				rw.WriteHeader(tc.StationHTTPStatus)
				if tc.RawJSONResponse != nil {
					rw.Write(tc.RawJSONResponse)
				}
			}))
			url := tc.BaseURL
			if tc.BaseURL == "" {
				url = stationServer.URL
			}
			client := getClient(url, http.DefaultClient)

			var respData expectedResponse
			tc.RequestConfig.RespData = &respData
			err := client.Request(tc.Context, tc.RequestConfig)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.WantCode, reqStatus.Code(), "unexpected code")
			if tc.WantRespBody != nil {
				testutils.MustMatch(t, *tc.WantRespBody, respData, "unexpected response body")
			}
		})
	}
}

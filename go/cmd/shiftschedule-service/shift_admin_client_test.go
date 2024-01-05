package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type shiftAdminResponse struct {
	ID int
}

func shiftAdminClient(userName string, password string, httpClient *http.Client, shiftAdminURL string) *ShiftAdminClient {
	return &ShiftAdminClient{
		UserName:      userName,
		Password:      password,
		HTTPClient:    httpClient,
		ShiftAdminURL: shiftAdminURL,
	}
}

func TestRequest(t *testing.T) {
	defaultContext := context.Background()
	defaultUserName := "username"
	defaultPassword := "password"
	defaultPath := "/testpath"
	pathWithQuery := "/testpath?key=value"
	defaultHTTPStatus := http.StatusOK
	defaultResponse, err := json.Marshal(shiftAdminResponse{
		ID: 1,
	})
	if err != nil {
		t.Fatal(err)
	}
	goodReqBody := struct{ testing bool }{
		testing: true,
	}
	defaultHeaders := map[string]string{
		"Authorization": "Basic " + base64.StdEncoding.EncodeToString([]byte(defaultUserName+":"+defaultPassword)),
	}
	goodQueryParams := url.Values{"jedi": []string{"yoda"}}

	tcs := []struct {
		desc                 string
		rawJSONResponse      []byte
		shiftAdminHTTPStatus int
		requestConfig        *ShiftAdminRequestConfig
		baseURL              string
		context              context.Context

		wantHeaders    map[string]string
		wantRespBody   *shiftAdminResponse
		wantStatusCode codes.Code
	}{
		{
			desc:                 "should work successfully",
			shiftAdminHTTPStatus: defaultHTTPStatus,
			rawJSONResponse:      defaultResponse,
			requestConfig: &ShiftAdminRequestConfig{
				Method:  http.MethodGet,
				Path:    defaultPath,
				ReqBody: goodReqBody,
			},
			context: defaultContext,

			wantHeaders:    defaultHeaders,
			wantRespBody:   &shiftAdminResponse{ID: 1},
			wantStatusCode: codes.OK,
		},
		{
			desc:                 "should work successfully with query params",
			shiftAdminHTTPStatus: defaultHTTPStatus,
			rawJSONResponse:      defaultResponse,
			requestConfig: &ShiftAdminRequestConfig{
				Method:      http.MethodGet,
				Path:        defaultPath,
				ReqBody:     goodReqBody,
				QueryParams: goodQueryParams,
			},
			context: defaultContext,

			wantHeaders:    defaultHeaders,
			wantRespBody:   &shiftAdminResponse{ID: 1},
			wantStatusCode: codes.OK,
		},
		{
			desc:                 "should return error when path contains query params",
			shiftAdminHTTPStatus: defaultHTTPStatus,
			rawJSONResponse:      defaultResponse,
			requestConfig: &ShiftAdminRequestConfig{
				Method:  http.MethodGet,
				Path:    pathWithQuery,
				ReqBody: goodReqBody,
			},
			context: defaultContext,

			wantStatusCode: codes.Internal,
		},
		{
			desc: "should return error when unable to create HTTP request with body due to invalid base url",
			requestConfig: &ShiftAdminRequestConfig{
				Method:  http.MethodGet,
				Path:    defaultPath,
				ReqBody: goodReqBody,
			},
			context: defaultContext,
			baseURL: ":::::::::::",

			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			shiftAdminServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				for key, value := range tc.wantHeaders {
					if req.Header.Get(key) != value {
						t.Errorf("For header %s, got %s, want %s", key, req.Header.Get(key), value)
					}
				}

				if tc.requestConfig.QueryParams != nil {
					for key, value := range tc.requestConfig.QueryParams {
						testutils.MustMatch(t, value[0], req.URL.Query().Get(key))
					}
				}

				rw.WriteHeader(tc.shiftAdminHTTPStatus)
				if tc.rawJSONResponse != nil {
					rw.Write(tc.rawJSONResponse)
				}
			}))
			serverURL := tc.baseURL
			if tc.baseURL == "" {
				serverURL = shiftAdminServer.URL
			}
			client := shiftAdminClient(defaultUserName, defaultPassword, http.DefaultClient, serverURL)

			var respData *shiftAdminResponse
			tc.requestConfig.RespData = &respData
			err := client.Request(tc.context, tc.requestConfig)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantStatusCode, reqStatus.Code())
			testutils.MustMatch(t, tc.wantRespBody, respData)
		})
	}
}

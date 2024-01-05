package athena

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

func TestClientRequest(t *testing.T) {
	type mockResponse struct {
		Recipientclasses []struct {
			Description string `json:"description"`
			Code        string `json:"code"`
		} `json:"recipientclasses"`
		Totalcount int `json:"totalcount"`
	}

	goodAthenaResponse := mockResponse{
		Recipientclasses: []struct {
			Description string `json:"description"`
			Code        string `json:"code"`
		}{
			{
				Description: "Description",
				Code:        "1234",
			},
		},
		Totalcount: 1,
	}
	goodRawAthenaResponse, _ := json.Marshal(goodAthenaResponse)
	badAthenaRawResponse := []byte(`{"id": 2`)

	var athenaResponse mockResponse

	options := &RequestOptions{
		Method:   http.MethodPost,
		Path:     "/chart/configuration/recipientclasses",
		Response: &athenaResponse,
	}

	pathWithQueryOptions := &RequestOptions{
		Method:   http.MethodPost,
		Path:     "testpath?key=value",
		Response: &athenaResponse,
	}

	type args struct {
		ctx     context.Context
		options *RequestOptions
	}
	tests := []struct {
		name            string
		args            args
		athenaServerURL string

		athenaRawResponse        []byte
		athenaHTTPStatus         int
		athenaRateLimitRemaining string

		wantErr      bool
		wantResponse *mockResponse
	}{
		{
			name: "success: should perform athena request",
			args: args{
				ctx:     context.Background(),
				options: options,
			},

			athenaRawResponse:        goodRawAthenaResponse,
			athenaHTTPStatus:         http.StatusOK,
			athenaRateLimitRemaining: "100",

			wantErr:      false,
			wantResponse: &goodAthenaResponse,
		},
		{
			name: "success: should add request body to athena request",
			args: args{
				ctx: context.Background(),
				options: &RequestOptions{
					Method:      http.MethodPost,
					Path:        "/chart/configuration/recipientclasses",
					ContentType: httpclient.ContentTypeJSON,
					Response:    &athenaResponse,
					Request: struct{ testing bool }{
						testing: true,
					},
				},
			},

			athenaRawResponse: goodRawAthenaResponse,
			athenaHTTPStatus:  http.StatusOK,

			wantErr:      false,
			wantResponse: &goodAthenaResponse,
		},
		{
			name: "failure: should return error if path has query params",
			args: args{
				ctx:     context.Background(),
				options: pathWithQueryOptions,
			},

			athenaRawResponse: goodRawAthenaResponse,
			athenaHTTPStatus:  http.StatusOK,

			wantErr: true,
		},
		{
			name: "failure: should return an error if the body can not be marshaled",
			args: args{
				ctx: context.Background(),
				options: &RequestOptions{
					Method:   http.MethodPost,
					Path:     "/chart/configuration/recipientclasses",
					Response: &athenaResponse,
					Request:  make(chan int),
				},
			},

			wantErr: true,
		},
		{
			name: "failure: failed to parse response",
			args: args{
				ctx:     context.Background(),
				options: options,
			},

			athenaRawResponse: badAthenaRawResponse,
			athenaHTTPStatus:  http.StatusOK,

			wantErr: true,
		},
		{
			name: "failure: athena responds with error code",
			args: args{
				ctx:     context.Background(),
				options: options,
			},

			athenaHTTPStatus: http.StatusBadRequest,

			wantErr: true,
		},
		{
			name: "failure: athena responds with unknown status code",
			args: args{
				ctx:     context.Background(),
				options: options,
			},

			athenaHTTPStatus: http.StatusTeapot,

			wantErr: true,
		},
		{
			name: "failure: client returns an error if fails to build the request",
			args: args{
				ctx:     context.Background(),
				options: options,
			},
			athenaServerURL: string(byte(0x7f)),

			wantErr: true,
		},
		{
			name: "failure: client returns an error if fails to build the request with body",
			args: args{
				ctx: context.Background(),
				options: &RequestOptions{
					Method:   http.MethodPost,
					Path:     "/chart/configuration/recipientclasses",
					Response: &athenaResponse,
					Request: struct{ testing bool }{
						testing: true,
					},
				},
			},
			athenaServerURL: string(byte(0x7f)),

			wantErr: true,
		},
		{
			name: "success: should perform athena request with failing at parsing rate limit",
			args: args{
				ctx:     context.Background(),
				options: options,
			},

			athenaRawResponse:        goodRawAthenaResponse,
			athenaHTTPStatus:         http.StatusOK,
			athenaRateLimitRemaining: "invalid value",

			wantErr:      false,
			wantResponse: &goodAthenaResponse,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.Header().Set(athenaRateLimitHeaderName, tt.athenaRateLimitRemaining)
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()

			athenaServerURL := athenaServer.URL
			if tt.athenaServerURL != "" {
				athenaServerURL = tt.athenaServerURL
			}

			sc := &Client{
				AuthToken:       mockAuthValuer{},
				AthenaBaseURL:   athenaServerURL,
				HTTPClient:      athenaServer.Client(),
				DataDogRecorder: &monitoring.DataDogRecorder{Client: &monitoring.MockStatsDClient{}},
				Logger:          zap.NewNop().Sugar(),
			}

			err := sc.request(tt.args.ctx, tt.args.options)
			if err != nil && !tt.wantErr {
				t.Errorf("request() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantResponse != nil {
				testutils.MustMatch(t, tt.wantResponse, tt.args.options.Response)
			}
		})
	}
}

func TestNewClient(t *testing.T) {
	type args struct {
		authToken       auth.Valuer
		athenaBaseURL   string
		practiceID      string
		datadogRecorder *monitoring.DataDogRecorder
		logger          *zap.SugaredLogger
	}
	tests := []struct {
		name string
		args args

		wantErr bool
		want    *Client
	}{
		{
			name: "should initialize a client",
			args: args{
				authToken:       mockAuthValuer{},
				athenaBaseURL:   "http://basepath/v1",
				practiceID:      "1234",
				datadogRecorder: &monitoring.DataDogRecorder{Client: &monitoring.MockStatsDClient{}},
				logger:          zap.NewNop().Sugar(),
			},
			wantErr: false,
			want: &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: "http://basepath/v1/1234",
				HTTPClient:    &http.Client{},
			},
		},
		{
			name: "fails to initialize a client with wrong params",
			args: args{
				authToken:     mockAuthValuer{},
				athenaBaseURL: "http://basepath|v1",
				practiceID:    "1234",
			},
			wantErr: true,
			want:    nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			params := NewClientParams{
				AuthToken:       tt.args.authToken,
				BaseURL:         tt.args.athenaBaseURL,
				PracticeID:      tt.args.practiceID,
				DataDogRecorder: tt.args.datadogRecorder,
				Logger:          tt.args.logger,
			}
			client, err := NewClient(params)
			if err != nil && !tt.wantErr {
				t.Errorf("NewClient() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.want != nil {
				testutils.MustMatch(t, tt.want.AthenaBaseURL, client.AthenaBaseURL)
				testutils.MustMatch(t, tt.want.AuthToken, client.AuthToken)
				testutils.MustMatch(t, tt.want.HTTPClient, client.HTTPClient)
			} else {
				testutils.MustMatch(t, (*Client)(nil), client)
			}
		})
	}
}

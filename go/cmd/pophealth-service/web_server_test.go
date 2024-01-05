package main

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"encoding/xml"
	"errors"
	"math/big"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/sns"
)

const (
	signingCertURLTest = "/test/cert"
	subscribeURLTest   = "/test/subscribe"
	topicArn           = "arn:aws:sns:us-east-1:000000000000:testTopic"
	goodEventMsg       = `{
    "Records": [
        {
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "us-east-1",
            "eventTime": "2022-06-08T00:41:02.625Z",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "AIDAJDPLRKLG7UEXAMPLE"
            },
            "requestParameters": {
                "sourceIPAddress": "127.0.0.1"
            },
            "responseElements": {
                "x-amz-request-id": "02a92679",
                "x-amz-id-2": "eftixk72aD6Ap51TnqcoF8eFidJG9Z/2"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "testConfigRule",
                "bucket": {
                    "name": "partner-bucket",
                    "ownerIdentity": {
                        "principalId": "A3NL1KOZZKExample"
                    },
                    "arn": "arn:aws:s3:::partner-bucket"
                },
                "object": {
                    "key": "load/file_1.csv",
                    "size": 4664,
                    "eTag": "\"87875841ffd06a480f7051b67b889359\"",
                    "versionId": null,
                    "sequencer": "0055AED6DCD90281E5"
                }
            }
        }
    ]
}`
	wrongNumberEvents = `{Records": [{"eventVersion": "2.1",},{"eventVersion": "2.1",}]}`
	invalidSNSMessage = "Invalid"
)

type mockAWSHTTPClient struct {
	err error
}

func (m *mockAWSHTTPClient) SubscribePartnerTopic(_ context.Context, _, _ string) error {
	return m.err
}

func (m *mockAWSHTTPClient) SubscribeResultsTopic(_ context.Context, _, _ string) error {
	return m.err
}

func (m *mockAWSHTTPClient) BucketExists(_ context.Context, _ string) bool {
	return m.err == nil
}

type mockHTTPServer struct {
	err error
}

func (m *mockHTTPServer) Shutdown(_ context.Context) error {
	return m.err
}

func (m *mockHTTPServer) ListenAndServe() error {
	return m.err
}

type mockFileBucketService struct {
	err         error
	isDBHealthy bool
}

func (m *mockFileBucketService) ProcessSourceFile(_ context.Context, _, _ string) error {
	return m.err
}

func (m *mockFileBucketService) ProcessResultsFileAsync(_ context.Context, _ string) {
}

func (m *mockFileBucketService) IsDBHealthy(_ context.Context) bool {
	return m.isDBHealthy
}

func TestCreateHTTPServer(t *testing.T) {
	t.Run("create server", func(t *testing.T) {
		s := createHTTPServer(HTTPVars{
			addr:         ":8080",
			popHealthURL: "url",
		}, nil, nil, zap.NewNop().Sugar(), nil)
		if s == nil {
			t.Fatal("server is nil")
		}
	})
}

func TestCreateRouter(t *testing.T) {
	t.Run("create router", func(t *testing.T) {
		r := createRouter(createHTTPServer(HTTPVars{
			addr:         ":8080",
			popHealthURL: "url",
		}, nil, nil, zap.NewNop().Sugar(), nil))
		if r == nil {
			t.Fatal("router is nil")
		}
	})
}

func TestHttpServerStartServer(t *testing.T) {
	goodURL := "http://localhost"
	badURL := ":localhost"
	tests := []struct {
		name       string
		url        string
		mockServer *mockHTTPServer
		mockAws    *mockAWSHTTPClient

		hasError bool
	}{
		{
			name:       "happy path",
			url:        goodURL,
			mockServer: &mockHTTPServer{},
			mockAws:    &mockAWSHTTPClient{},

			hasError: false,
		},
		{
			name:       "error bad url",
			url:        badURL,
			mockServer: &mockHTTPServer{},
			mockAws:    &mockAWSHTTPClient{},

			hasError: true,
		},
		{
			name:       "error subscribing topic",
			url:        goodURL,
			mockServer: &mockHTTPServer{},
			mockAws: &mockAWSHTTPClient{
				err: errInternalTest,
			},

			hasError: true,
		},
	}
	ctx := context.Background()
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := &HTTPServer{
				aws:    test.mockAws,
				server: test.mockServer,
				vars:   HTTPVars{popHealthURL: test.url},
			}
			err := s.StartServer(ctx)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestHttpServerShutdown(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name       string
		mockServer *mockHTTPServer
		hasError   bool
	}{
		{
			name:       "happy path",
			mockServer: &mockHTTPServer{},

			hasError: false,
		},
		{
			name:       "error shutdown",
			mockServer: &mockHTTPServer{},

			hasError: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := &HTTPServer{
				server: test.mockServer,
			}
			err := s.Shutdown(ctx)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestHttpServerAddress(t *testing.T) {
	tests := []struct {
		name    string
		address string

		expectedAddr string
	}{
		{
			name:    "happy path",
			address: "dummy:8080",

			expectedAddr: "dummy:8080",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := &HTTPServer{
				vars: HTTPVars{addr: test.address},
			}
			got := s.Address()
			if got != test.expectedAddr {
				t.Errorf("expeccted:  %s, but got: %s", test.expectedAddr, got)
			}
		})
	}
}

func TestHttpServerProcessPartnerFile(t *testing.T) {
	pKey, cert := generateTestCertificate(t)
	happyServer := createHappyTestHTTPServer(cert.Bytes())
	defer happyServer.Close()
	badServer := createBadTestHTTPServer()
	defer badServer.Close()
	tests := []struct {
		name        string
		payload     *sns.Payload
		keys        []string
		eventType   string
		httpMethod  string
		fileService mockFileBucketService
		logger      *zap.SugaredLogger

		expectedStatus int
	}{
		{
			name: "happy path, subscription",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusOK,
		},
		{
			name: "happy path, notification",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.NotificationKeys,
			eventType:  notification,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),
			fileService: mockFileBucketService{
				err: nil,
			},

			expectedStatus: http.StatusOK,
		},
		{
			name: "responds with bad request when sns message is invalid",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             invalidSNSMessage,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.NotificationKeys,
			eventType:  invalidSNSMessage,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),
			fileService: mockFileBucketService{
				err: nil,
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "error invalid http method",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodGet,

			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name: "error invalid message type",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             "x",
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  "unknown",
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "error subscription calling confirmation",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     badServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error subscription without subscribe URL",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     "",
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error subscription bad subscribe URL",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     "http://dummy.com/subscribe",
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error wrong number of events",
			payload: &sns.Payload{
				Message:          wrongNumberEvents,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.NotificationKeys,
			eventType:  notification,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error bad json events",
			payload: &sns.Payload{
				Message:          `{Records": [{"eventVersion": "2.1",}]`,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.NotificationKeys,
			eventType:  notification,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := signTestPayload(test.payload, test.keys, pKey.Bytes())
			if err != nil {
				t.Fatal(err)
			}
			body, err := json.Marshal(test.payload)
			if err != nil {
				t.Fatal(err)
			}
			request := httptest.NewRequest(test.httpMethod, partnerFilePath, bytes.NewReader(body))
			request.Header.Set(awsSnsHeader, test.eventType)

			writer := httptest.NewRecorder()
			s := &HTTPServer{
				processService: &test.fileService,
				logger:         test.logger,
			}
			s.partnerFileEndpoint(writer, request)
			resp := writer.Result()
			defer resp.Body.Close()
			if resp.StatusCode != test.expectedStatus {
				t.Errorf("expeccted status code:  %d, but got: %d", test.expectedStatus, resp.StatusCode)
			}
		})
	}
}

func TestHttpServerProcessResultsFiles(t *testing.T) {
	pKey, cert := generateTestCertificate(t)
	happyServer := createHappyTestHTTPServer(cert.Bytes())
	defer happyServer.Close()
	badServer := createBadTestHTTPServer()
	defer badServer.Close()
	tests := []struct {
		name        string
		payload     *sns.Payload
		keys        []string
		eventType   string
		httpMethod  string
		fileService *mockFileBucketService
		logger      *zap.SugaredLogger

		expectedStatus int
	}{
		{
			name: "happy path, subscription",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusOK,
		},
		{
			name: "happy path, notification",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:        sns.NotificationKeys,
			eventType:   notification,
			httpMethod:  http.MethodPost,
			logger:      zap.NewNop().Sugar(),
			fileService: &mockFileBucketService{},

			expectedStatus: http.StatusOK,
		},
		{
			name: "responds with bad request when sns message is invalid",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             invalidSNSMessage,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:           sns.NotificationKeys,
			eventType:      invalidSNSMessage,
			httpMethod:     http.MethodPost,
			logger:         zap.NewNop().Sugar(),
			fileService:    &mockFileBucketService{},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "error invalid http method",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodGet,

			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name: "error invalid message type",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             "unknown",
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  "unknown",
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "error subscription calling confirmation",
			payload: &sns.Payload{
				Message:          "hello",
				MessageId:        "1",
				SignatureVersion: "v1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     badServer.URL + subscribeURLTest,
				Subject:          "subscription",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:       sns.SubscriptionKeys,
			eventType:  subscriptionConfirmation,
			httpMethod: http.MethodPost,
			logger:     zap.NewNop().Sugar(),

			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error subscription without subscribe URL",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     "",
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:           sns.SubscriptionKeys,
			eventType:      subscriptionConfirmation,
			httpMethod:     http.MethodPost,
			logger:         zap.NewNop().Sugar(),
			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error subscription bad subscribe URL",
			payload: &sns.Payload{
				Message:          goodEventMsg,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     "http://dummy.com/subscribe",
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             subscriptionConfirmation,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:           sns.SubscriptionKeys,
			eventType:      subscriptionConfirmation,
			httpMethod:     http.MethodPost,
			logger:         zap.NewNop().Sugar(),
			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error wrong number of events",
			payload: &sns.Payload{
				Message:          wrongNumberEvents,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:           sns.NotificationKeys,
			eventType:      notification,
			httpMethod:     http.MethodPost,
			logger:         zap.NewNop().Sugar(),
			expectedStatus: http.StatusUnprocessableEntity,
		},
		{
			name: "error bad json events",
			payload: &sns.Payload{
				Message:          `{Records": [{"eventVersion": "2.1",}]`,
				MessageId:        "1",
				SignatureVersion: "1",
				SigningCertURL:   happyServer.URL + signingCertURLTest,
				SubscribeURL:     happyServer.URL + subscribeURLTest,
				Subject:          "Amazon S3 Notification",
				Timestamp:        "1",
				Token:            "12345",
				TopicArn:         topicArn,
				Type:             notification,
				UnsubscribeURL:   happyServer.URL,
			},
			keys:           sns.NotificationKeys,
			eventType:      notification,
			httpMethod:     http.MethodPost,
			logger:         zap.NewNop().Sugar(),
			expectedStatus: http.StatusUnprocessableEntity,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := signTestPayload(test.payload, test.keys, pKey.Bytes())
			if err != nil {
				t.Fatal(err)
			}
			body, err := json.Marshal(test.payload)
			if err != nil {
				t.Fatal(err)
			}
			request := httptest.NewRequest(test.httpMethod, resultsFilePath, bytes.NewReader(body))
			request.Header.Set(awsSnsHeader, test.eventType)

			writer := httptest.NewRecorder()
			s := &HTTPServer{
				processService: test.fileService,
				logger:         test.logger,
			}
			s.resultsFileEndpoint(writer, request)
			resp := writer.Result()
			defer resp.Body.Close()
			if resp.StatusCode != test.expectedStatus {
				t.Errorf("expeccted status code:  %d, but got: %d", test.expectedStatus, resp.StatusCode)
			}
		})
	}
}

func TestHttpServerHealthCheck(t *testing.T) {
	pKey, _ := generateTestCertificate(t)
	tests := []struct {
		name        string
		payload     *sns.Payload
		keys        []string
		eventType   string
		httpMethod  string
		fileService *mockFileBucketService
		awsService  *mockAWSHTTPClient

		expectedStatus int
	}{
		{
			name:       "server health ok",
			payload:    &sns.Payload{},
			keys:       sns.SubscriptionKeys,
			httpMethod: http.MethodGet,
			fileService: &mockFileBucketService{
				isDBHealthy: true,
			},
			awsService: &mockAWSHTTPClient{},

			expectedStatus: http.StatusOK,
		},
		{
			name:        "DB not healthy",
			payload:     &sns.Payload{},
			keys:        sns.SubscriptionKeys,
			eventType:   subscriptionConfirmation,
			httpMethod:  http.MethodGet,
			fileService: &mockFileBucketService{},
			awsService:  &mockAWSHTTPClient{},

			expectedStatus: http.StatusServiceUnavailable,
		},
		{
			name:       "fail AWS service nil",
			payload:    &sns.Payload{},
			keys:       sns.SubscriptionKeys,
			eventType:  "unknown",
			httpMethod: http.MethodPost,
			fileService: &mockFileBucketService{
				isDBHealthy: true,
			},
			awsService: nil,

			expectedStatus: http.StatusServiceUnavailable,
		},
		{
			name:       "fail AWS service fail",
			payload:    &sns.Payload{},
			keys:       sns.SubscriptionKeys,
			eventType:  "unknown",
			httpMethod: http.MethodPost,
			fileService: &mockFileBucketService{
				isDBHealthy: true,
			},
			awsService: &mockAWSHTTPClient{
				err: errInternalTest,
			},

			expectedStatus: http.StatusServiceUnavailable,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := signTestPayload(test.payload, test.keys, pKey.Bytes())
			if err != nil {
				t.Fatal(err)
			}
			body, err := json.Marshal(test.payload)
			if err != nil {
				t.Fatal(err)
			}
			request := httptest.NewRequest(test.httpMethod, healthCheckPath, bytes.NewReader(body))
			request.Header.Set(awsSnsHeader, test.eventType)

			writer := httptest.NewRecorder()
			s := &HTTPServer{
				aws:            test.awsService,
				processService: test.fileService,
			}
			s.healthCheckEndpoint(writer, request)
			resp := writer.Result()
			defer resp.Body.Close()
			if resp.StatusCode != test.expectedStatus {
				t.Errorf("expected status code:  %d, but got: %d", test.expectedStatus, resp.StatusCode)
			}
		})
	}
}

func signTestPayload(payload *sns.Payload, keys []string, privKey []byte) error {
	msg := buildSignature(*payload, keys)
	signed, err := signTestMsg(msg, privKey)
	if err != nil {
		return err
	}
	payload.Signature = base64.StdEncoding.EncodeToString(signed)
	return nil
}

func buildSignature(payload sns.Payload, keys []string) []byte {
	var builtSignature bytes.Buffer
	for _, key := range keys {
		reflectedStruct := reflect.ValueOf(payload)
		field := reflect.Indirect(reflectedStruct).FieldByName(key)
		value := field.String()
		if field.IsValid() && value != "" {
			builtSignature.WriteString(key + "\n")
			builtSignature.WriteString(value + "\n")
		}
	}
	return builtSignature.Bytes()
}

func signTestMsg(msg, privKey []byte) ([]byte, error) {
	pKeyDecodedPem, _ := pem.Decode(privKey)
	if pKeyDecodedPem == nil {
		return nil, errors.New("decoded private Key PEM file is empty")
	}
	privateKeyImported, err := x509.ParsePKCS1PrivateKey(pKeyDecodedPem.Bytes)
	if err != nil {
		return nil, err
	}
	hash := sha1.New()
	_, err = hash.Write(msg)
	if err != nil {
		return nil, err
	}
	hashSum := hash.Sum(nil)
	return rsa.SignPKCS1v15(rand.Reader, privateKeyImported, crypto.SHA1, hashSum)
}

func generateTestCertificate(t *testing.T) (*bytes.Buffer, *bytes.Buffer) {
	caPrivKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generating key error: %v", err)
	}

	ca := &x509.Certificate{
		SerialNumber: big.NewInt(2019),
		Subject: pkix.Name{
			Organization:  []string{"Dispatch Health."},
			Country:       []string{"US"},
			Province:      []string{""},
			Locality:      []string{""},
			StreetAddress: []string{"dummy address"},
			PostalCode:    []string{"12345"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(0, 0, 2),
		IsCA:                  false,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
		SignatureAlgorithm:    x509.SHA1WithRSA,
	}
	caBytes, err := x509.CreateCertificate(rand.Reader, ca, ca, &caPrivKey.PublicKey, caPrivKey)
	if err != nil {
		t.Fatalf("creating certificate error: %v", err)
	}

	cert := new(bytes.Buffer)
	_ = pem.Encode(cert, &pem.Block{
		Type:  "CERTIFICATE",
		Bytes: caBytes,
	})

	privateKey := new(bytes.Buffer)
	_ = pem.Encode(privateKey, &pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(caPrivKey),
	})
	return privateKey, cert
}

func createHappyTestHTTPServer(certificate []byte) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case signingCertURLTest:
			writer.WriteHeader(http.StatusOK)
			writer.Write(certificate)
		case subscribeURLTest:
			response := ConfirmSubscriptionResponse{
				SubscriptionArn: "arn:aws:sns:us-east-1:12345:MyTopic:guid",
				RequestID:       "1",
			}
			out, _ := xml.MarshalIndent(response, " ", "  ")
			writer.WriteHeader(http.StatusOK)
			writer.Write(out)
		default:
			writer.WriteHeader(http.StatusOK)
		}
	}))
}

func createBadTestHTTPServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusInternalServerError)
	}))
}

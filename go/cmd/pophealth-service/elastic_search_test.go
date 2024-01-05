package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/elastic/go-elasticsearch/v7/esapi"
	"github.com/elastic/go-elasticsearch/v7/esutil"
	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	esURL           = "http://testurl:9200/"
	esTimeOut       = 5 * time.Second
	patientESIndex  = "patientIndex"
	backfillESIndex = "backfillIndex"
	esWorkers       = 10
	esFlushBytes    = 1024
	esFlushInterval = 5 * time.Second
)

type mockESRequest struct {
	doResp *esapi.Response
	doErr  error
}

func (m *mockESRequest) Do(_ context.Context, _ esapi.Transport) (*esapi.Response, error) {
	return m.doResp, m.doErr
}

func TestGetElasticSearchClient(t *testing.T) {
	tests := []struct {
		name            string
		esURL           string
		esTimeOut       time.Duration
		esIndex         map[PopHealthIndexKey]string
		esWorkers       int
		esFlushBytes    int
		esFlushInterval time.Duration
		logger          *zap.SugaredLogger

		hasError bool
	}{
		{
			name:      "happy path creating client",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			esIndex: map[PopHealthIndexKey]string{
				PatientIndexKey:         patientESIndex,
				BackfillPatientIndexKey: backfillESIndex,
			},
			esWorkers:       esWorkers,
			esFlushBytes:    esFlushBytes,
			esFlushInterval: esFlushInterval,
			logger:          zap.NewNop().Sugar(),
		},
		{
			name:     "invalid elastic search url",
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name:     "invalid elastic search timeout",
			esURL:    esURL,
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name:      "invalid elastic search patient index",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			logger:    zap.NewNop().Sugar(),
			hasError:  true,
		},
		{
			name:      "invalid elastic search backfill index",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			esIndex: map[PopHealthIndexKey]string{
				PatientIndexKey: patientESIndex,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name:      "invalid elastic search workers",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			esIndex: map[PopHealthIndexKey]string{
				PatientIndexKey:         patientESIndex,
				BackfillPatientIndexKey: backfillESIndex,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name:      "invalid elastic search flush bytes",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			esIndex: map[PopHealthIndexKey]string{
				PatientIndexKey:         patientESIndex,
				BackfillPatientIndexKey: backfillESIndex,
			},
			esWorkers: esWorkers,
			logger:    zap.NewNop().Sugar(),
			hasError:  true,
		},
		{
			name:      "invalid elastic search flush interval",
			esURL:     esURL,
			esTimeOut: esTimeOut,
			esIndex: map[PopHealthIndexKey]string{
				PatientIndexKey:         patientESIndex,
				BackfillPatientIndexKey: backfillESIndex,
			},
			esWorkers:    esWorkers,
			esFlushBytes: esFlushBytes,
			logger:       zap.NewNop().Sugar(),
			hasError:     true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NewElasticSearchClient(ESClientParams{
				URL:           test.esURL,
				Timeout:       test.esTimeOut,
				Index:         test.esIndex,
				NumWorkers:    test.esWorkers,
				NumFlushBytes: test.esFlushBytes,
				FlushInterval: test.esFlushInterval,
			}, test.logger)
			if (err != nil) != test.hasError {
				t.Errorf("expected error: %v, but got error: %v", test.hasError, err)
			}
		})
	}
}

func TestMappingJSON(t *testing.T) {
	var parsedMapping any
	err := json.Unmarshal([]byte(indexMappingJSON), &parsedMapping)
	if err != nil {
		t.Error("got an error but expecting none")
	}
}

func TestESClientEnsureIndexExists(t *testing.T) {
	ctx := context.Background()
	indexes := map[PopHealthIndexKey]string{
		PatientIndexKey:         "test-patient",
		BackfillPatientIndexKey: "test-backfill",
	}
	indexExistsFn := esapi.IndicesExists(func(index []string, o ...func(*esapi.IndicesExistsRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			StatusCode: http.StatusFound,
			Body:       io.NopCloser(strings.NewReader("found")),
		}, nil
	})
	indexNotExistsFn := esapi.IndicesExists(func(index []string, o ...func(*esapi.IndicesExistsRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			StatusCode: http.StatusNotFound,
			Body:       io.NopCloser(strings.NewReader("not found")),
		}, nil
	})
	indexExistsErrorFn := esapi.IndicesExists(func(index []string, o ...func(*esapi.IndicesExistsRequest)) (*esapi.Response, error) {
		return nil, errInternalTest
	})
	indexCreateFn := esapi.IndicesCreate(func(index string, o ...func(*esapi.IndicesCreateRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			StatusCode: http.StatusCreated,
			Body:       io.NopCloser(strings.NewReader("created")),
		}, nil
	})
	indexCreateErrorFn := esapi.IndicesCreate(func(index string, o ...func(*esapi.IndicesCreateRequest)) (*esapi.Response, error) {
		return nil, errInternalTest
	})
	indexCreateBadResponseFn := esapi.IndicesCreate(func(index string, o ...func(*esapi.IndicesCreateRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			StatusCode: http.StatusForbidden,
			Body:       io.NopCloser(strings.NewReader("error")),
		}, nil
	})
	tests := []struct {
		name     string
		esClient ESClient

		hasError bool
	}{
		{
			name: "happy path checking for existing index",
			esClient: ESClient{
				params: ESClientParams{
					Index: indexes,
				},
				client: &elasticsearch.Client{
					API: &esapi.API{
						Indices: &esapi.Indices{
							Exists: indexExistsFn,
						},
					},
				},
			},
		},
		{
			name: "happy path creating index when not exists",
			esClient: ESClient{
				params: ESClientParams{
					Index: indexes,
				},
				client: &elasticsearch.Client{
					API: &esapi.API{
						Indices: &esapi.Indices{
							Exists: indexNotExistsFn,
							Create: indexCreateFn,
						},
					},
				},
			},
		},
		{
			name: "error checking if index exists",
			esClient: ESClient{
				params: ESClientParams{
					Index: indexes,
				},
				client: &elasticsearch.Client{
					API: &esapi.API{
						Indices: &esapi.Indices{
							Exists: indexExistsErrorFn,
						},
					},
				},
				logger: zap.NewNop().Sugar(),
			},
			hasError: true,
		},
		{
			name: "error creating index",
			esClient: ESClient{
				params: ESClientParams{
					Index: indexes,
				},
				client: &elasticsearch.Client{
					API: &esapi.API{
						Indices: &esapi.Indices{
							Exists: indexNotExistsFn,
							Create: indexCreateErrorFn,
						},
					},
				},
				logger: zap.NewNop().Sugar(),
			},
			hasError: true,
		},
		{
			name: "create index request has bad status",
			esClient: ESClient{
				params: ESClientParams{
					Index: indexes,
				},
				client: &elasticsearch.Client{
					API: &esapi.API{
						Indices: &esapi.Indices{
							Exists: indexNotExistsFn,
							Create: indexCreateBadResponseFn,
						},
					},
				},
				logger: zap.NewNop().Sugar(),
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := test.esClient.EnsureIndexExists(ctx)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}
		})
	}
}

func TestESClientRequests(t *testing.T) {
	tests := []struct {
		name    string
		reqType requestType
		docID   string
		data    []byte

		hasError bool
	}{
		{
			name:     "upsert request error connection refused response",
			reqType:  update,
			docID:    "1",
			data:     []byte("Test"),
			hasError: true,
		},
		{
			name:     "delete request error connection refused response",
			reqType:  remove,
			docID:    "1",
			hasError: true,
		},
	}
	ctx := context.Background()
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			es, err := NewElasticSearchClient(ESClientParams{
				URL:     esURL,
				Timeout: esTimeOut,
				Index: map[PopHealthIndexKey]string{
					PatientIndexKey:         "test-patient",
					BackfillPatientIndexKey: "test-backfill",
				},
				NumWorkers:    esWorkers,
				NumFlushBytes: esFlushBytes,
				FlushInterval: esFlushInterval,
			}, zap.NewNop().Sugar())
			if err != nil {
				t.Fatal(err)
			}
			if test.reqType == remove {
				_, err = es.DeleteDocument(ctx, PatientIndexKey, test.docID)
			} else {
				_, err = es.UpsertDocument(ctx, PatientIndexKey, test.docID, test.data)
			}
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

func TestESClientDeleteByChannelItemID(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name          string
		channelItemID int64

		hasError bool
	}{
		{
			name:          "delete by query request error connection refused response",
			channelItemID: 1,
			hasError:      true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			es, err := NewElasticSearchClient(ESClientParams{
				URL:     esURL,
				Timeout: esTimeOut,
				Index: map[PopHealthIndexKey]string{
					PatientIndexKey:         "test-patient",
					BackfillPatientIndexKey: "test-backfill",
				},
				NumWorkers:    esWorkers,
				NumFlushBytes: esFlushBytes,
				FlushInterval: esFlushInterval,
			}, zap.NewNop().Sugar())
			if err != nil {
				t.Fatal(err)
			}
			_, err = es.DeleteByChannelItemID(ctx, PatientIndexKey, test.channelItemID)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

func TestExecuteRequest(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name string
		req  esapi.Request

		hasError bool
	}{
		{
			name: "happy path executing request",
			req: &mockESRequest{
				doResp: &esapi.Response{
					Body: io.NopCloser(strings.NewReader("test")),
				},
			},
		},
		{
			name: "error executing request",
			req: &mockESRequest{
				doErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			es, err := NewElasticSearchClient(ESClientParams{
				URL:     esURL,
				Timeout: esTimeOut,
				Index: map[PopHealthIndexKey]string{
					PatientIndexKey:         "test-patient",
					BackfillPatientIndexKey: "test-backfill",
				},
				NumWorkers:    esWorkers,
				NumFlushBytes: esFlushBytes,
				FlushInterval: esFlushInterval,
			}, zap.NewNop().Sugar())
			if err != nil {
				t.Fatal(err)
			}

			_, err = es.executeRequest(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

func TestESClientNewBulkIndexer(t *testing.T) {
	client, err := NewElasticSearchClient(ESClientParams{
		URL:     esURL,
		Timeout: esTimeOut,
		Index: map[PopHealthIndexKey]string{
			PatientIndexKey:         "test-patient",
			BackfillPatientIndexKey: "test-backfill",
		},
		NumWorkers:    esWorkers,
		NumFlushBytes: esFlushBytes,
		FlushInterval: esFlushInterval,
	}, zap.NewNop().Sugar())
	if err != nil {
		t.Fatal(err)
	}
	_, err = client.NewBulkIndexer(PatientIndexKey)
	if err != nil {
		t.Error("got an error but didn't expect any")
	}
}

type mockBulkIndexer struct {
	addErr   error
	closeErr error
	stats    esutil.BulkIndexerStats
}

func (m mockBulkIndexer) Add(_ context.Context, _ esutil.BulkIndexerItem) error {
	return m.addErr
}

func (m mockBulkIndexer) Close(_ context.Context) error {
	return m.closeErr
}

func (m mockBulkIndexer) Stats() esutil.BulkIndexerStats {
	return m.stats
}

func TestExecuteBulkUpsert(t *testing.T) {
	ctx := context.Background()
	eligiblePatients := []*Patient{
		{
			PatientHash: "abc",
			FirstName:   "Juan",
			LastName:    "Lopez",
			DOB:         "1900-01-01",
		},
		{
			PatientHash: "def",
			FirstName:   "Luis",
			LastName:    "Perez",
			DOB:         "1950-01-01",
		},
	}
	validReqStats := esutil.BulkIndexerStats{
		NumFailed:  0,
		NumCreated: uint64(len(eligiblePatients)),
	}
	fileID := int64(1)
	tests := []struct {
		name    string
		indexer mockBulkIndexer
		logger  *zap.SugaredLogger

		hasError     bool
		expectedResp *ESBulkResponse
	}{
		{
			name: "happy path bulk create",
			indexer: mockBulkIndexer{
				stats: validReqStats,
			},
			logger:       zap.NewNop().Sugar(),
			expectedResp: &ESBulkResponse{Stats: validReqStats},
		},
		{
			name: "error adding indexer item",
			indexer: mockBulkIndexer{
				addErr: errInternalTest,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error closing indexer",
			indexer: mockBulkIndexer{
				closeErr: errInternalTest,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			res, err := executeBulkUpsert(ctx, test.indexer, eligiblePatients, fileID, test.logger)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp.Stats, res.Stats, "elastic search responses don't match")
		})
	}
}

func TestESClientBulkUpsert(t *testing.T) {
	ctx := context.Background()
	eligiblePatients := []*Patient{
		{
			PatientHash: "abc",
			FirstName:   "Juan",
			LastName:    "Lopez",
			DOB:         "1900-01-01",
		},
		{
			PatientHash: "def",
			FirstName:   "Luis",
			LastName:    "Perez",
			DOB:         "1950-01-01",
		},
	}
	fileID := int64(1)
	tests := []struct {
		name string

		expectedResp *ESBulkResponse
	}{
		{
			name: "failed to create requests",
			expectedResp: &ESBulkResponse{
				Stats: esutil.BulkIndexerStats{
					NumAdded:  2,
					NumFailed: 2,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			es, err := NewElasticSearchClient(ESClientParams{
				URL:     esURL,
				Timeout: esTimeOut,
				Index: map[PopHealthIndexKey]string{
					PatientIndexKey:         "test-patient",
					BackfillPatientIndexKey: "test-backfill",
				},
				NumWorkers:    esWorkers,
				NumFlushBytes: esFlushBytes,
				FlushInterval: esFlushInterval,
			}, zap.NewNop().Sugar())
			if err != nil {
				t.Fatal(err)
			}
			res, err := es.BulkUpsert(ctx, PatientIndexKey, eligiblePatients, fileID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".NumRequests")(t, test.expectedResp.Stats, res.Stats, "elastic search responses don't match")
		})
	}
}

func TestExecuteBulkDelete(t *testing.T) {
	ctx := context.Background()
	docIDs := []string{"1", "2", "3"}
	validReqStats := esutil.BulkIndexerStats{
		NumFailed:  0,
		NumDeleted: uint64(len(docIDs)),
	}
	fileID := int64(1)
	tests := []struct {
		name    string
		indexer mockBulkIndexer
		logger  *zap.SugaredLogger

		hasError     bool
		expectedResp *ESBulkResponse
	}{
		{
			name: "happy path bulk delete",
			indexer: mockBulkIndexer{
				stats: validReqStats,
			},
			logger:       zap.NewNop().Sugar(),
			expectedResp: &ESBulkResponse{Stats: validReqStats},
		},
		{
			name: "error adding indexer item",
			indexer: mockBulkIndexer{
				addErr: errInternalTest,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error closing indexer",
			indexer: mockBulkIndexer{
				closeErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			res, err := executeBulkDelete(ctx, test.indexer, docIDs, fileID, test.logger)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp.Stats, res.Stats, "elastic search responses don't match")
		})
	}
}

func TestESClientBulkDelete(t *testing.T) {
	ctx := context.Background()
	docIDs := []string{"1", "2", "3"}
	fileID := int64(1)
	tests := []struct {
		name string

		expectedResp *ESBulkResponse
	}{
		{
			name: "failed delete requests",
			expectedResp: &ESBulkResponse{
				Stats: esutil.BulkIndexerStats{
					NumAdded:  3,
					NumFailed: 3,
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			es, err := NewElasticSearchClient(ESClientParams{
				URL:     esURL,
				Timeout: esTimeOut,
				Index: map[PopHealthIndexKey]string{
					PatientIndexKey:         "test-patient",
					BackfillPatientIndexKey: "test-backfill",
				},
				NumWorkers:    esWorkers,
				NumFlushBytes: esFlushBytes,
				FlushInterval: esFlushInterval,
			}, zap.NewNop().Sugar())
			if err != nil {
				t.Fatal(err)
			}
			res, err := es.BulkDelete(ctx, PatientIndexKey, docIDs, fileID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".NumRequests")(t, test.expectedResp.Stats, res.Stats, "elastic search responses don't match")
		})
	}
}

func TestCreateBulkIndexerItem(t *testing.T) {
	ctx := context.Background()
	docID := "1"
	fileID := int64(1)
	body := strings.NewReader("Test")
	tests := []struct {
		name    string
		request requestType
		logger  *zap.SugaredLogger

		expectedResp esutil.BulkIndexerItem
	}{
		{
			name:    "indexer item with index action",
			request: index,
			logger:  zap.NewNop().Sugar(),
			expectedResp: esutil.BulkIndexerItem{
				Action: "index",
			},
		},
		{
			name:    "indexer item with delete action",
			request: remove,
			logger:  zap.NewNop().Sugar(),
			expectedResp: esutil.BulkIndexerItem{
				Action: "delete",
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			item := createBulkIndexerItem(test.request, fileID, docID, body, test.logger)
			item.OnFailure(ctx, esutil.BulkIndexerItem{}, esutil.BulkIndexerResponseItem{}, errInternalTest)
			item.OnFailure(ctx, esutil.BulkIndexerItem{}, esutil.BulkIndexerResponseItem{}, nil)
			if item.Action != test.expectedResp.Action {
				t.Errorf("expected %v but got %v", test.expectedResp.Action, item.Action)
			}
		})
	}
}

func TestESClientGetPatientCountByChannelItem(t *testing.T) {
	ctx := context.Background()
	channelItemID := int64(1)
	totalCount := int32(5)
	validBody, err := crateBodyForCountResp(totalCount)
	if err != nil {
		t.Fatal(err)
	}
	countFunc := func(o ...func(*esapi.CountRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: validBody,
		}, nil
	}
	errorCountFunc := func(o ...func(*esapi.CountRequest)) (*esapi.Response, error) {
		return nil, errInternalTest
	}

	tests := []struct {
		name      string
		countFunc func(o ...func(*esapi.CountRequest)) (*esapi.Response, error)

		expectedResp *ESTotalPatientsResponse
		hasError     bool
	}{
		{
			name:      "happy path counting patients",
			countFunc: countFunc,
			expectedResp: &ESTotalPatientsResponse{
				TotalCount:    totalCount,
				ChannelItemID: channelItemID,
			},
		},
		{
			name:      "error executing count",
			countFunc: errorCountFunc,
			hasError:  true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			esClient := ESClient{
				client: &elasticsearch.Client{
					API: &esapi.API{
						Count: test.countFunc,
					},
				},
				params: ESClientParams{
					URL:     esURL,
					Timeout: esTimeOut,
					Index: map[PopHealthIndexKey]string{
						PatientIndexKey:         "test-patient",
						BackfillPatientIndexKey: "test-backfill",
					},
					NumWorkers:    esWorkers,
					NumFlushBytes: esFlushBytes,
					FlushInterval: esFlushInterval,
				},
				logger: zap.NewNop().Sugar(),
			}
			resp, err := esClient.GetPatientCountByChannelItem(ctx, PatientIndexKey, channelItemID)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, *test.expectedResp, *resp, fmt.Sprintf("expected %v but got %v", *test.expectedResp, *resp))
			}
		})
	}
}

func TestExecuteCountQuery(t *testing.T) {
	ctx := context.Background()
	totalCount := int32(5)
	validQuery := strings.NewReader(`{"query": {"match": {"channel_item_id": 1}}}`)
	validBody, err := crateBodyForCountResp(totalCount)
	if err != nil {
		t.Fatal(err)
	}
	countFunc := func(o ...func(*esapi.CountRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: validBody,
		}, nil
	}
	errDecodeCountFunc := func(o ...func(*esapi.CountRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: io.NopCloser(strings.NewReader("test")),
		}, nil
	}
	tests := []struct {
		name      string
		query     *strings.Reader
		countFunc func(o ...func(*esapi.CountRequest)) (*esapi.Response, error)

		expectedResp int32
		hasError     bool
	}{
		{
			name:         "happy path counting patients",
			query:        validQuery,
			countFunc:    countFunc,
			expectedResp: totalCount,
		},
		{
			name:      "error decoding response body",
			query:     validQuery,
			countFunc: errDecodeCountFunc,
			hasError:  true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			esClient := ESClient{
				client: &elasticsearch.Client{
					API: &esapi.API{
						Count: test.countFunc,
					},
				},
				params: ESClientParams{
					URL:     esURL,
					Timeout: esTimeOut,
					Index: map[PopHealthIndexKey]string{
						PatientIndexKey:         "test-patient",
						BackfillPatientIndexKey: "test-backfill",
					},
					NumWorkers:    esWorkers,
					NumFlushBytes: esFlushBytes,
					FlushInterval: esFlushInterval,
				},
				logger: zap.NewNop().Sugar(),
			}
			resp, err := executeCountQuery(ctx, &esClient, PatientIndexKey, test.query)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp, fmt.Sprintf("expected %v but got %v", test.expectedResp, resp))
			}
		})
	}
}

func crateBodyForCountResp(count int32) (io.ReadCloser, error) {
	var buf bytes.Buffer
	err := json.NewEncoder(&buf).Encode(map[string]float64{"count": float64(count)})
	if err != nil {
		return nil, err
	}
	return io.NopCloser(&buf), nil
}

func TestBuildQuery(t *testing.T) {
	validQuery := `"match": {"channel_item_id": 1}`
	invalidQuery := `"match": {"channel_item_id": 1`
	tests := []struct {
		name  string
		query string
		size  int

		expectedResp *strings.Reader
		hasError     bool
	}{
		{
			name:         "happy path building query with size",
			query:        validQuery,
			size:         1,
			expectedResp: strings.NewReader(`{"query": {"match": {"channel_item_id": 1}}, "size": 1}`),
		},
		{
			name:         "happy path building query without size",
			query:        validQuery,
			size:         0,
			expectedResp: strings.NewReader(`{"query": {"match": {"channel_item_id": 1}}}`),
		},
		{
			name:     "error building query",
			query:    invalidQuery,
			size:     1,
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp, err := buildQuery(test.query, test.size)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, *test.expectedResp, *resp, fmt.Sprintf("expected %v but got %v", *test.expectedResp, *resp))
			}
		})
	}
}

func TestESClientSearchPatients(t *testing.T) {
	ctx := context.Background()
	numResults := 20
	patient1 := []Patient{
		{
			PatientHash:   "1",
			FirstName:     "luis",
			LastName:      "perez",
			DOB:           "01/01/1989",
			ChannelItemID: 1,
			MarketID:      2,
		},
	}
	patient2 := []Patient{
		{
			PatientHash:   "2",
			FirstName:     "diego",
			LastName:      "lopez",
			DOB:           "02/02/1990",
			ChannelItemID: 2,
			MarketID:      3,
		},
	}
	patient3 := []Patient{
		{
			PatientHash:   "3",
			FirstName:     "\tandrea  ",
			LastName:      "\ngutierrez  \t",
			DOB:           "1990-02-12",
			SSN:           "123-456-7899",
			ChannelItemID: 3,
			MarketID:      4,
		},
	}
	patient4 := []Patient{
		{
			PatientHash:   "4",
			FirstName:     "\tgabriela \"gaby\"\n",
			LastName:      "  \"guti\" gutierrez \t",
			DOB:           "1990-02-12",
			ChannelItemID: 3,
			MarketID:      4,
		},
	}
	search1Body, err := crateBodyForSearchResp(patient1)
	if err != nil {
		t.Fatal(err)
	}
	search2Body, err := crateBodyForSearchResp(patient2)
	if err != nil {
		t.Fatal(err)
	}
	search3Body, err := crateBodyForSearchResp(patient3)
	if err != nil {
		t.Fatal(err)
	}
	search4Body, err := crateBodyForSearchResp(patient1)
	if err != nil {
		t.Fatal(err)
	}
	search5Body, err := crateBodyForSearchResp(patient4)
	if err != nil {
		t.Fatal(err)
	}
	search1Func := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: search1Body,
		}, nil
	}
	search2Func := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: search2Body,
		}, nil
	}
	search3Func := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: search3Body,
		}, nil
	}
	search4Func := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: search4Body,
		}, nil
	}
	search5Func := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: search5Body,
		}, nil
	}
	errorSearchFunc := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return nil, errInternalTest
	}

	tests := []struct {
		name       string
		params     PatientSearchParams
		index      PopHealthIndexKey
		searchFunc func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error)

		expectedResp []Patient
		hasError     bool
	}{
		{
			name: "happy path searching patients using name search",
			params: PatientSearchParams{
				PatientName: patient1[0].FirstName,
			},
			index:        PatientIndexKey,
			searchFunc:   search1Func,
			expectedResp: patient1,
		},
		{
			name: "happy path searching patients with backfill index",
			params: PatientSearchParams{
				PatientName: patient1[0].FirstName,
			},
			index:        BackfillPatientIndexKey,
			searchFunc:   search4Func,
			expectedResp: patient1,
		},
		{
			name: "happy path searching patients using first and last name search",
			params: PatientSearchParams{
				PatientLastName: patient2[0].LastName,
			},
			index:        PatientIndexKey,
			searchFunc:   search2Func,
			expectedResp: patient2,
		},
		{
			name: "happy path searching patients using eligibility query with patient name with spaces and ssn with dashes",
			params: PatientSearchParams{
				PatientFirstName: patient3[0].FirstName,
				PatientLastName:  patient3[0].LastName,
				DOB:              patient3[0].DOB,
				SSN:              patient3[0].SSN,
			},
			index:        PatientIndexKey,
			searchFunc:   search3Func,
			expectedResp: patient3,
		},
		{
			name: "happy path searching patients using first and last name search with quotes and whitespace",
			params: PatientSearchParams{
				PatientFirstName: patient4[0].FirstName,
				PatientLastName:  patient4[0].LastName,
			},
			index:        PatientIndexKey,
			searchFunc:   search5Func,
			expectedResp: patient4,
		},
		{
			name:         "when search params don't include patient name",
			params:       PatientSearchParams{},
			index:        PatientIndexKey,
			expectedResp: []Patient{},
		},
		{
			name: "error executing search",
			params: PatientSearchParams{
				PatientFirstName: "test",
			},
			index:      PatientIndexKey,
			searchFunc: errorSearchFunc,
			hasError:   true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			esClient := ESClient{
				client: &elasticsearch.Client{
					API: &esapi.API{
						Search: test.searchFunc,
					},
				},
				params: ESClientParams{
					URL:     esURL,
					Timeout: esTimeOut,
					Index: map[PopHealthIndexKey]string{
						PatientIndexKey:         "test-patient",
						BackfillPatientIndexKey: "test-backfill",
					},
					NumWorkers:    esWorkers,
					NumFlushBytes: esFlushBytes,
					FlushInterval: esFlushInterval,
				},
				logger: zap.NewNop().Sugar(),
			}
			resp, err := esClient.SearchPatients(ctx, test.index, test.params, numResults)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp, fmt.Sprintf("expected %v but got %v", test.expectedResp, resp))
			}
		})
	}
}

func TestExecuteSearchQuery(t *testing.T) {
	ctx := context.Background()
	patients := []Patient{
		{
			PatientHash:   "1",
			FirstName:     "luis",
			LastName:      "perez",
			DOB:           "01/01/1989",
			ChannelItemID: 1,
			MarketID:      2,
		},
		{
			PatientHash:   "2",
			FirstName:     "diego",
			LastName:      "lopez",
			DOB:           "02/02/1990",
			ChannelItemID: 2,
			MarketID:      3,
		},
	}
	searchBody, err := crateBodyForSearchResp(patients)
	if err != nil {
		t.Fatal(err)
	}
	validQuery := strings.NewReader(`"bool": {"must": [{"wildcard": {"first_name": "luis*"}}]}`)
	if err != nil {
		t.Fatal(err)
	}
	searchFunc := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: searchBody,
		}, nil
	}
	errDecodeSearchFunc := func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error) {
		return &esapi.Response{
			Body: io.NopCloser(strings.NewReader("test")),
		}, nil
	}
	tests := []struct {
		name       string
		searchFunc func(o ...func(*esapi.SearchRequest)) (*esapi.Response, error)

		expectedResp []Patient
		hasError     bool
	}{
		{
			name:         "happy path searching patients",
			searchFunc:   searchFunc,
			expectedResp: patients,
		},
		{
			name:       "error decoding response body",
			searchFunc: errDecodeSearchFunc,
			hasError:   true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			esClient := ESClient{
				client: &elasticsearch.Client{
					API: &esapi.API{
						Search: test.searchFunc,
					},
				},
				params: ESClientParams{
					URL:     esURL,
					Timeout: esTimeOut,
					Index: map[PopHealthIndexKey]string{
						PatientIndexKey:         "test-patient",
						BackfillPatientIndexKey: "test-backfill",
					},
					NumWorkers:    esWorkers,
					NumFlushBytes: esFlushBytes,
					FlushInterval: esFlushInterval,
				},
				logger: zap.NewNop().Sugar(),
			}
			resp, err := executeSearchQuery(ctx, &esClient, PatientIndexKey, validQuery)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp, fmt.Sprintf("expected %v but got %v", test.expectedResp, resp))
			}
		})
	}
}

func TestDecodePatientSearchResult(t *testing.T) {
	patient := Patient{
		PatientHash:   "1",
		FirstName:     "luis",
		LastName:      "perez",
		DOB:           "01/01/1989",
		ChannelItemID: 1,
		MarketID:      2,
	}
	tests := []struct {
		name   string
		result map[string]any

		expectedResp []Patient
		hasError     bool
	}{
		{
			name: "happy path decoding result",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": []any{
						map[string]any{
							"_source": map[string]any{
								"patient_hash":    patient.PatientHash,
								"first_name":      patient.FirstName,
								"last_name":       patient.LastName,
								"dob":             patient.DOB,
								"channel_item_id": strconv.Itoa(patient.ChannelItemID),
								"market_id":       strconv.Itoa(patient.MarketID),
							},
						},
					},
				},
			},
			expectedResp: []Patient{patient},
		},
		{
			name: "when search doesn't find patients",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(0),
					},
				},
			},
			expectedResp: []Patient{},
		},
		{
			name: "error asserting hits",
			result: map[string]any{
				"hits": 1,
			},
			hasError: true,
		},
		{
			name: "error asserting total hits",
			result: map[string]any{
				"hits": map[string]any{
					"total": 1,
				},
			},
			hasError: true,
		},
		{
			name: "error asserting hits array",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": 1,
				},
			},
			hasError: true,
		},
		{
			name: "error asserting patient",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": []any{
						1,
					},
				},
			},
			hasError: true,
		},
		{
			name: "error asserting patient data",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": []any{
						map[string]any{
							"_source": 1,
						},
					},
				},
			},
			hasError: true,
		},
		{
			name: "error marshaling patient data",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": []any{
						map[string]any{
							"_source": map[string]any{
								"patient_hash": math.Inf(1),
							},
						},
					},
				},
			},
			hasError: true,
		},
		{
			name: "error unmarshaling patient data",
			result: map[string]any{
				"hits": map[string]any{
					"total": map[string]any{
						"value": float64(1),
					},
					"hits": []any{
						map[string]any{
							"_source": map[string]any{
								"patient_hash": 1,
							},
						},
					},
				},
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			resp, err := decodePatientSearchResult(test.result)
			if (err != nil) != test.hasError {
				t.Errorf("got %v response, but expected response is %v", err, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp, fmt.Sprintf("expected %v but got %v", test.expectedResp, resp))
			}
		})
	}
}

func crateBodyForSearchResp(patients []Patient) (io.ReadCloser, error) {
	hits := make([]any, len(patients))
	for i, patient := range patients {
		hits[i] = map[string]any{
			"_source": map[string]any{
				"patient_hash":    patient.PatientHash,
				"first_name":      patient.FirstName,
				"last_name":       patient.LastName,
				"dob":             patient.DOB,
				"ssn":             patient.SSN,
				"channel_item_id": strconv.Itoa(patient.ChannelItemID),
				"market_id":       strconv.Itoa(patient.MarketID),
			},
		}
	}
	body := map[string]any{
		"hits": map[string]any{
			"total": map[string]any{
				"value": float64(len(patients)),
			},
			"hits": hits,
		},
	}
	var buf bytes.Buffer
	err := json.NewEncoder(&buf).Encode(body)
	if err != nil {
		return nil, err
	}
	return io.NopCloser(&buf), nil
}

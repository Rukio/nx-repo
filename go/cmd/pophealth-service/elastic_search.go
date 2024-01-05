package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/elastic/go-elasticsearch/v7/esapi"
	"github.com/elastic/go-elasticsearch/v7/esutil"
	"go.uber.org/zap"
)

type requestType int
type PopHealthIndexKey string

const (
	ElasticSearchDateLayout = "2006-01-02"

	PatientIndexKey         PopHealthIndexKey = "patient_index"
	BackfillPatientIndexKey PopHealthIndexKey = "backfill_patient_index"
)

const (
	index requestType = iota + 1
	create
	update
	remove
)

var (
	requestTypeMap = map[requestType]string{
		index:  "index",
		create: "create",
		update: "update",
		remove: "delete",
	}
	indexMappingJSON = `{
		"mappings": {
			"properties": {
				"patient_hash": { "type": "keyword" },
				"row_hash": { "type": "keyword" },
				"first_name": {
					"type": "text",
					"fields": {
						"raw": { "type": "keyword" }
					}
				},
				"last_name": {
					"type": "text",
					"fields": {
						"raw": { "type": "keyword" }
					}
				},
				"dob": { "type": "date" },
				"gender": { "type": "text" },
				"ssn": { "type": "text" },
				"street_address_1": { "type": "text" },
				"street_address_2": { "type": "text" },
				"city": { "type": "text" },
				"state": { "type": "text" },
				"zipcode": { "type": "text" },
				"member_id": { "type": "text" },
				"email": { "type": "text" },
				"channel_item_id": { "type": "long" },
				"market_id": { "type": "long" }
			}
		}
	}`
)

type ESClient struct {
	client *elasticsearch.Client
	params ESClientParams
	logger *zap.SugaredLogger
}

type ESClientParams struct {
	URL           string
	Timeout       time.Duration
	Index         map[PopHealthIndexKey]string
	NumWorkers    int
	NumFlushBytes int
	FlushInterval time.Duration
}

func (p ESClientParams) Validate() error {
	// TODO: Investigate use of grouped errors, such as https://github.com/hashicorp/go-multierror.
	if p.URL == "" {
		return errors.New("unable to start service, missing elastic search url")
	}
	if p.Timeout < 1 {
		return errors.New("unable to start service, elastic search timeout is invalid")
	}
	if p.Index[PatientIndexKey] == "" {
		return errors.New("unable to start service, elastic search patient index is invalid")
	}
	if p.Index[BackfillPatientIndexKey] == "" {
		return errors.New("unable to start service, elastic search backfill patient index is invalid")
	}
	if p.NumWorkers < 1 {
		return errors.New("unable to start service, invalid number of workers for elastic search")
	}
	if p.NumFlushBytes < 1 {
		return errors.New("unable to start service, invalid number of flush bytes for elastic search")
	}
	if p.FlushInterval < 1 {
		return errors.New("unable to start service, invalid number of flush interval for elastic search")
	}

	return nil
}

type ESResponse struct {
	StatusCode int
	Status     string
}

type ESBulkResponse struct {
	Duration time.Duration
	Stats    esutil.BulkIndexerStats
}

type ESTotalPatientsResponse struct {
	TotalCount    int32
	ChannelItemID int64
}

func NewElasticSearchClient(params ESClientParams, logger *zap.SugaredLogger) (*ESClient, error) {
	err := params.Validate()
	if err != nil {
		logger.Errorw("error validating params",
			"URL", params.URL,
			"Timeout", params.Timeout,
			"Num Workers", params.NumWorkers,
			zap.Error(err))
		return nil, err
	}

	es, err := elasticsearch.NewDefaultClient()
	if err != nil {
		logger.Errorw("error creating new client", zap.Error(err))
		return nil, err
	}

	return &ESClient{
		client: es,
		params: params,
		logger: logger,
	}, nil
}

func (esc *ESClient) EnsureIndexExists(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, esc.params.Timeout)
	defer cancel()

	for _, indexName := range esc.params.Index {
		res, err := esc.client.Indices.Exists(
			[]string{indexName},
			esc.client.Indices.Exists.WithContext(ctx),
		)
		if err != nil {
			esc.logger.Errorw("error checking indices exists", "index", indexName, zap.Error(err))
			return err
		}
		res.Body.Close()

		if res.StatusCode == http.StatusNotFound {
			res, err := esc.client.Indices.Create(
				indexName,
				esc.client.Indices.Create.WithContext(ctx),
				esc.client.Indices.Create.WithBody(strings.NewReader(indexMappingJSON)),
			)
			if err != nil {
				esc.logger.Errorw("error creating indices",
					"index", indexName,
					zap.Error(err))
				return err
			}
			defer res.Body.Close()

			if res.IsError() {
				esc.logger.Errorw("error in response after creating indices",
					"index", indexName,
					zap.Error(err))
				return errors.New(res.String())
			}
		}
	}

	return nil
}

func (esc *ESClient) UpsertDocument(ctx context.Context, indexKey PopHealthIndexKey, docID string, data []byte) (*ESResponse, error) {
	req := esapi.IndexRequest{
		Index:      esc.params.Index[indexKey],
		DocumentID: docID,
		Body:       bytes.NewReader(data),
		Refresh:    "true",
	}

	res, err := esc.executeRequest(ctx, req)
	if err != nil {
		esc.logger.Errorw("error executing upsert request",
			"documentID", docID,
			zap.Error(err))
		return nil, err
	}

	esc.logger.Debug("Elastic-search: UpsertDocument success.")

	return res, nil
}

func (esc *ESClient) DeleteDocument(ctx context.Context, indexKey PopHealthIndexKey, docID string) (*ESResponse, error) {
	req := esapi.DeleteRequest{
		Index:      esc.params.Index[indexKey],
		DocumentID: docID,
		Refresh:    "true",
	}

	res, err := esc.executeRequest(ctx, req)
	if err != nil {
		esc.logger.Errorw("error executing delete request",
			"documentID", docID,
			zap.Error(err))
		return nil, err
	}

	esc.logger.Debug("Elastic-search: DeleteDocument success.")

	return res, nil
}

func (esc *ESClient) DeleteByChannelItemID(ctx context.Context, indexKey PopHealthIndexKey, channelItemID int64) (*ESResponse, error) {
	query := `"match": {"channel_item_id": ` + strconv.FormatInt(channelItemID, 10) + "}"
	esQuery, _ := buildQuery(query, 0)
	req := esapi.DeleteByQueryRequest{
		Index: []string{esc.params.Index[indexKey]},
		Body:  esQuery,
	}

	res, err := esc.executeRequest(ctx, req)
	if err != nil {
		esc.logger.Errorw("error executing delete by query request",
			"query", query,
			"source", "elastic search",
			zap.Error(err))
		return nil, err
	}

	esc.logger.Debugw("DeleteByChannelItemID success.", "channel item", channelItemID, "source", "elastic search")

	return res, nil
}

func (esc *ESClient) executeRequest(ctx context.Context, req esapi.Request) (*ESResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, esc.params.Timeout)
	defer cancel()

	res, err := req.Do(ctx, esc.client)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	return &ESResponse{
		StatusCode: res.StatusCode,
		Status:     res.Status(),
	}, nil
}

func (esc *ESClient) NewBulkIndexer(indexKey PopHealthIndexKey) (esutil.BulkIndexer, error) {
	return esutil.NewBulkIndexer(esutil.BulkIndexerConfig{
		Index:         esc.params.Index[indexKey],
		Client:        esc.client,
		NumWorkers:    esc.params.NumWorkers,
		FlushBytes:    esc.params.NumFlushBytes,
		FlushInterval: esc.params.FlushInterval,
	})
}

func (esc *ESClient) BulkUpsert(ctx context.Context, indexKey PopHealthIndexKey, eligiblePatients []*Patient, fileID int64) (*ESBulkResponse, error) {
	bulkIndexer, err := esc.NewBulkIndexer(indexKey)
	if err != nil {
		return nil, err
	}

	resp, err := executeBulkUpsert(ctx, bulkIndexer, eligiblePatients, fileID, esc.logger)
	if err != nil {
		esc.logger.Errorw("error executing bulk upsert", zap.Error(err))
		return nil, err
	}

	return resp, nil
}

func executeBulkUpsert(ctx context.Context, bulkIndexer esutil.BulkIndexer, eligiblePatients []*Patient, fileID int64, logger *zap.SugaredLogger) (*ESBulkResponse, error) {
	startTime := time.Now()
	for _, patient := range eligiblePatients {
		data, err := json.Marshal(patient)
		if err != nil {
			logger.Errorw("error marshal patient data", zap.Error(err))
			return nil, fmt.Errorf("failed to marshal json: %w", err)
		}
		if err = bulkIndexer.Add(
			ctx,
			createBulkIndexerItem(index, fileID, patient.PatientHash, bytes.NewReader(data), logger),
		); err != nil {
			logger.Errorw("error adding item",
				"fileID", fileID,
				zap.Error(err))
			return nil, err
		}
	}

	if err := bulkIndexer.Close(ctx); err != nil {
		logger.Errorw("error closing bulk", zap.Error(err))
		return nil, err
	}

	duration := time.Since(startTime)
	stats := bulkIndexer.Stats()

	logger.Debug("Elastic-search: executeBulkUpsert success.")

	return &ESBulkResponse{
		Duration: duration,
		Stats:    stats,
	}, nil
}

func (esc *ESClient) BulkDelete(ctx context.Context, indexKey PopHealthIndexKey, docIDs []string, fileID int64) (*ESBulkResponse, error) {
	bulkIndexer, err := esc.NewBulkIndexer(indexKey)
	if err != nil {
		return nil, err
	}

	resp, err := executeBulkDelete(ctx, bulkIndexer, docIDs, fileID, esc.logger)
	if err != nil {
		esc.logger.Errorw("error executing bulk delete", zap.Error(err))
		return nil, err
	}

	return resp, nil
}

func executeBulkDelete(ctx context.Context, bulkIndexer esutil.BulkIndexer, docIDs []string, fileID int64, logger *zap.SugaredLogger) (*ESBulkResponse, error) {
	startTime := time.Now()
	for _, docID := range docIDs {
		if err := bulkIndexer.Add(
			ctx,
			createBulkIndexerItem(remove, fileID, docID, nil, logger),
		); err != nil {
			return nil, err
		}
	}

	if err := bulkIndexer.Close(ctx); err != nil {
		return nil, err
	}

	duration := time.Since(startTime)
	stats := bulkIndexer.Stats()

	logger.Debug("Elastic-search: executeBulkDelete success.")

	return &ESBulkResponse{
		Duration: duration,
		Stats:    stats,
	}, nil
}

func createBulkIndexerItem(request requestType, fileID int64, docID string, body io.Reader, logger *zap.SugaredLogger) esutil.BulkIndexerItem {
	return esutil.BulkIndexerItem{
		Action:     requestTypeMap[request],
		DocumentID: docID,
		Body:       body,
		OnFailure: func(_ context.Context, item esutil.BulkIndexerItem, res esutil.BulkIndexerResponseItem, err error) {
			log := logger.With("request", requestTypeMap[request],
				"fileID", fileID)
			if err != nil {
				log.Errorw("error getting response when create bucket indexer item", zap.Error(err))
			} else {
				log.Errorw("error from response when creating bucket indexer item",
					"docID", res.DocumentID,
					"result", res.Result,
					"status", res.Status,
					"primary term", res.PrimTerm,
					"errorType", res.Error.Type,
					"errorReason", res.Error.Reason,
					"errorCauseType", res.Error.Cause.Type,
					"errorCauseReason", res.Error.Cause.Reason,
				)
			}
		},
	}
}

func (esc *ESClient) GetPatientCountByChannelItem(ctx context.Context, indexKey PopHealthIndexKey, channelItemID int64) (*ESTotalPatientsResponse, error) {
	log := esc.logger.With("channel_item_id", channelItemID)
	query := `"match": {"channel_item_id": ` + strconv.FormatInt(channelItemID, 10) + "}"
	esQuery, _ := buildQuery(query, 0)
	total, err := executeCountQuery(ctx, esc, indexKey, esQuery)
	if err != nil {
		log.Errorw("error getting total patients", zap.Error(err))
		return nil, err
	}

	return &ESTotalPatientsResponse{
		TotalCount:    total,
		ChannelItemID: channelItemID,
	}, nil
}

func (esc *ESClient) SearchPatients(ctx context.Context, indexKey PopHealthIndexKey, searchParams PatientSearchParams, maxNumResults int) ([]Patient, error) {
	searchParams.SanitizeParams()
	var query string
	switch {
	case len(searchParams.DOB) > 0 && len(searchParams.PatientFirstName) > 0 && len(searchParams.PatientLastName) > 0:
		query = EligibilitySearchQuery(searchParams)
	case len(searchParams.PatientName) > 0:
		query = NameSearchQuery(searchParams)
	case len(searchParams.PatientFirstName) > 0 || len(searchParams.PatientLastName) > 0:
		query = FirstAndLastNameSearchQuery(searchParams)
	default:
		return []Patient{}, nil
	}

	esQuery, err := buildQuery(query, maxNumResults)
	if err != nil {
		esc.logger.Errorw("error building query", zap.Error(err))
		return nil, err
	}

	patients, err := executeSearchQuery(ctx, esc, indexKey, esQuery)
	if err != nil {
		esc.logger.Errorw("error executing search query", zap.Error(err))
		return nil, err
	}

	return patients, nil
}

func executeCountQuery(ctx context.Context, es *ESClient, indexKey PopHealthIndexKey, query *strings.Reader) (int32, error) {
	response, err := es.client.Count(
		es.client.Count.WithIndex(es.params.Index[indexKey]),
		es.client.Count.WithContext(ctx),
		es.client.Count.WithBody(query))

	if err != nil {
		return 0, err
	}

	var result map[string]any
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return 0, fmt.Errorf("error decoding result. %w", err)
	}

	return int32(result["count"].(float64)), nil
}

func executeSearchQuery(ctx context.Context, es *ESClient, indexKey PopHealthIndexKey, query *strings.Reader) ([]Patient, error) {
	response, err := es.client.Search(
		es.client.Search.WithIndex(es.params.Index[indexKey]),
		es.client.Search.WithContext(ctx),
		es.client.Search.WithBody(query))

	if err != nil {
		return nil, err
	}

	var result map[string]any
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return nil, fmt.Errorf("error decoding result. %w", err)
	}

	return decodePatientSearchResult(result)
}

func buildQuery(query string, size int) (*strings.Reader, error) {
	var esQuery strings.Builder
	esQuery.WriteString(`{"query": {` + query + "}")
	if size > 0 {
		esQuery.WriteString(`, "size": ` + strconv.Itoa(size))
	}
	esQuery.WriteString("}")

	if isValid := json.Valid([]byte(esQuery.String())); !isValid {
		return nil, fmt.Errorf("invalid query. %s", esQuery.String())
	}

	return strings.NewReader(esQuery.String()), nil
}

func decodePatientSearchResult(result map[string]any) ([]Patient, error) {
	hits, ok := result["hits"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("error asserting hits. %v", result)
	}

	total, ok := hits["total"].(map[string]any)
	if !ok {
		return nil, fmt.Errorf("error asserting total hits. %v", result)
	}

	if total["value"].(float64) <= 0 {
		return []Patient{}, nil
	}

	patients := make([]Patient, int(total["value"].(float64)))
	fetchedPatients, ok := hits["hits"].([]any)
	if !ok {
		return nil, fmt.Errorf("error asserting hits array. %v", result)
	}

	for i, fetchedPatient := range fetchedPatients {
		patient, ok := fetchedPatient.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("error asserting patient. %v", result)
		}
		patientData, ok := patient["_source"].(map[string]any)
		if !ok {
			return nil, fmt.Errorf("error asserting patient data. %v", result)
		}

		newPatient, err := unmarshalPatient(patientData)
		if err != nil {
			return nil, err
		}

		patients[i] = newPatient
	}
	return patients, nil
}

func unmarshalPatient(patientData map[string]any) (Patient, error) {
	patientJSON, err := json.Marshal(patientData)
	if err != nil {
		return Patient{}, fmt.Errorf("error marshaling patient data: %w", err)
	}

	var patient Patient
	err = json.Unmarshal(patientJSON, &patient)
	if err != nil {
		return Patient{}, fmt.Errorf("error unmarshaling patient: %w", err)
	}

	return patient, nil
}

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgtype"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
)

const (
	ProcessFile                = "process_file"
	SyncPatients               = "sync_patients"
	DeactivateBucket           = "deactivate_bucket"
	destinationColumnNameField = "destination_column_name"
	dataTypeField              = "data_type"
	dateFormatField            = "date_format"
	destinationColumnPrefix    = "DH_COLUMN_NAME_"
	dataTypePrefix             = "DATA_TYPE_"
	sourceColumnNameField      = "source_column_name"
)

var (
	dateFormats = map[string]string{
		"DATE_FORMAT_DDMMYYYY_SLASH": "DD/MM/YYYY",
		"DATE_FORMAT_MMDDYYYY_SLASH": "MM/DD/YYYY",
		"DATE_FORMAT_YYYYMMDD_SLASH": "YYYY/MM/DD",
		"DATE_FORMAT_YYYYMMDD_DASH":  "YYYY-MM-DD",
		"DATE_FORMAT_YYYYMMDD":       "YYYYMMDD",
	}
)

type PopHealthConfig struct {
	PhConfig PrefectParams `json:"ph_config"`
}

type PrefectParams struct {
	IngestionFilePath  string       `json:"ingestion_filepath"`
	IsForce            bool         `json:"force,omitempty"`
	OnlyValidate       bool         `json:"only_validate,omitempty"`
	ColumnMappings     pgtype.JSONB `json:"column_mappings"`
	ChannelItemID      int64        `json:"channel_item_id"`
	MarketID           int64        `json:"market_id"`
	ChangePercentLimit int64        `json:"change_percent_limit"`
	ErrorPercentLimit  int64        `json:"error_percent_limit"`
}

type FlowID string

type PrefectResponse struct {
	Data struct {
		CreateFlowRun struct {
			ID FlowID `json:"id"`
		} `json:"create_flow_run"`
	} `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

type PrefectClient struct {
	mu                  sync.Mutex
	URL                 string
	Token               auth.Valuer
	VersionGroupIDs     map[string]string
	ChangePercentLimit  int
	ErrorPercentLimit   int
	WaitBetweenRequests time.Duration
	NumRetriesIfTimeout int
	RetryInterval       time.Duration
	client              *http.Client
}

const (
	prefectClientHTTPMethod              = http.MethodPost
	prefectMutationTemplate              = `mutation { create_flow_run( input: { version_group_id: "%s", parameters: %s } ) { id } }`
	prefectMutationTemplateForSync       = `mutation { create_flow_run( input: { version_group_id: "%s", parameters: "{ \"channel_item_id\": %d }" } ) { id } }`
	prefectMutationTemplateForDeactivate = `mutation { create_flow_run( input: { version_group_id: "%s", parameters: "{ \"bucket_folder_id\": %d, \"channel_item_ids\": %s }" } ) { id } }`
)

func NewPrefectClient(client *PrefectClient) (*PrefectClient, error) {
	if client.URL == "" {
		return nil, errors.New("error creating prefect client: URL is empty")
	}

	if client.Token == nil {
		return nil, errors.New("error creating prefect client: Token is empty")
	}

	if client.VersionGroupIDs[ProcessFile] == "" {
		return nil, errors.New("error creating prefect client: VersionGroupID for process file is empty")
	}

	if client.VersionGroupIDs[SyncPatients] == "" {
		return nil, errors.New("error creating prefect client: VersionGroupID for sync patients is empty")
	}

	if client.VersionGroupIDs[DeactivateBucket] == "" {
		return nil, errors.New("error creating prefect client: VersionGroupID for deactivate bucket is empty")
	}

	if client.WaitBetweenRequests < 1*time.Second {
		return nil, errors.New("error creating prefect client: WaitBetweenRequests invalid")
	}

	if client.NumRetriesIfTimeout < 0 {
		return nil, errors.New("error creating prefect client: NumRetriesIfTimeout invalid")
	}

	if client.client.Timeout < 1 {
		return nil, errors.New("error creating prefect client: Timeout invalid")
	}

	return client, nil
}

func (c *PrefectClient) BuildSyncPatientsPrefectRequest(channelItemID int64) ([]byte, error) {
	query := map[string]string{"query": fmt.Sprintf(prefectMutationTemplateForSync, c.VersionGroupIDs[SyncPatients], channelItemID)}
	request, err := json.Marshal(query)
	return request, err
}

func (c *PrefectClient) BuildDeactivateBucketPrefectRequest(bucketFolderID int64, channelItemIDs []int64) ([]byte, error) {
	jsonChannelItemIDs, _ := json.Marshal(channelItemIDs)
	query := map[string]string{"query": fmt.Sprintf(prefectMutationTemplateForDeactivate, c.VersionGroupIDs[DeactivateBucket], bucketFolderID, string(jsonChannelItemIDs))}
	return json.Marshal(query)
}

func (c *PrefectClient) BuildPrefectRequest(template pophealthsql.Template, file pophealthsql.File, bucket pophealthsql.BucketFolder) ([]byte, error) {
	ingestionFilePath := fmt.Sprintf("s3://%s/%s", bucket.S3BucketName, file.AwsObjectKey.String)
	columnMappings, err := c.transformColumnMapping(template.ColumnMapping)
	if err != nil {
		return nil, err
	}

	var fileParameters pophealthpb.FileParameters
	err = json.Unmarshal(file.FileParameters.Bytes, &fileParameters)
	if err != nil {
		return nil, err
	}

	prefectParams := PopHealthConfig{PhConfig: PrefectParams{
		IsForce:            file.IsBackfill || fileParameters.ForceUpload,
		OnlyValidate:       file.IsBackfill,
		IngestionFilePath:  ingestionFilePath,
		ColumnMappings:     columnMappings,
		ChannelItemID:      template.ChannelItemID,
		MarketID:           template.MarketID,
		ChangePercentLimit: int64(c.ChangePercentLimit),
		ErrorPercentLimit:  int64(c.ErrorPercentLimit),
	}}

	jsonParams, err := json.Marshal(prefectParams)
	if err != nil {
		return nil, err
	}
	query := map[string]string{"query": fmt.Sprintf(prefectMutationTemplate, c.VersionGroupIDs[ProcessFile], fmt.Sprintf("%q", string(jsonParams)))}
	request, err := json.Marshal(query)
	if err != nil {
		return nil, err
	}
	return request, nil
}

func (c *PrefectClient) transformColumnMapping(mapping pgtype.JSONB) (pgtype.JSONB, error) {
	if mapping.Status != pgtype.Present {
		return pgtype.JSONB{}, errors.New("missing columnMapping data")
	}
	var original []map[string]any
	err := mapping.AssignTo(&original)
	if err != nil {
		return pgtype.JSONB{}, err
	}
	var translated []map[string]any
	for _, columnMapping := range original {
		if columnMapping[sourceColumnNameField] == nil || columnMapping[sourceColumnNameField] == "" {
			continue
		}
		m := make(map[string]any)
		for k, v := range columnMapping {
			switch k {
			case destinationColumnNameField:
				if value, ok := v.(float64); ok {
					m[k] = strings.ToLower(strings.TrimPrefix(pophealthpb.DHColumnName_name[int32(value)], destinationColumnPrefix))
				} else {
					m[k] = v
				}
			case dataTypeField:
				if value, ok := v.(float64); ok {
					m[k] = strings.ToLower(strings.TrimPrefix(pophealthpb.DataType_name[int32(value)], dataTypePrefix))
				} else {
					m[k] = v
				}
			case dateFormatField:
				if value, ok := v.(float64); ok {
					m[k] = dateFormats[pophealthpb.ColumnMapping_DateFormat_name[int32(value)]]
				} else {
					m[k] = v
				}
			default:
				m[k] = v
			}
		}
		translated = append(translated, m)
	}
	j, err := json.Marshal(translated)
	if err != nil {
		return pgtype.JSONB{}, err
	}
	return pgtype.JSONB{Bytes: j, Status: pgtype.Present}, nil
}

func (c *PrefectClient) DoRequest(ctx context.Context, requestBody []byte) (FlowID, error) {
	retries := c.NumRetriesIfTimeout
	req, err := http.NewRequestWithContext(ctx, prefectClientHTTPMethod, c.URL, bytes.NewReader(requestBody))
	if err != nil {
		return "", err
	}

	req.Header.Add("Authorization", c.Token.AuthorizationValue())
	req.Header.Add("Content-Type", "application/json")
	c.mu.Lock()
	resp, err := c.client.Do(req)
	if err == nil {
		defer resp.Body.Close()
	}

	for err != nil && retries > 0 && IsTimeoutError(err) {
		time.Sleep(c.RetryInterval)
		resp, err = c.client.Do(req)
		if err == nil {
			defer resp.Body.Close()
		}
		retries--
	}
	go func() {
		time.Sleep(c.WaitBetweenRequests)
		c.mu.Unlock()
	}()
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("prefect request error, got %d status response", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)

	if err != nil {
		return "", err
	}
	var prefectResponse PrefectResponse
	err = json.Unmarshal(body, &prefectResponse)
	if err != nil {
		return "", err
	}

	numErrors := len(prefectResponse.Errors)

	if numErrors > 0 {
		messages := make([]string, numErrors)
		for i, v := range prefectResponse.Errors {
			messages[i] = v.Message
		}
		return "", errors.New(strings.Join(messages, ", "))
	}

	if prefectResponse.Data.CreateFlowRun.ID == "" {
		return "", errors.New("prefect response doesn't have a flow run ID")
	}

	return prefectResponse.Data.CreateFlowRun.ID, nil
}

func IsTimeoutError(err error) bool {
	if err == nil {
		return false
	}

	var urlErr *url.Error
	ok := errors.As(err, &urlErr)
	return ok && urlErr.Timeout()
}

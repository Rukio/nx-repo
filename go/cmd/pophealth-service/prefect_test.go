package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/jackc/pgtype"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestNewPrefectClient(t *testing.T) {
	tests := []struct {
		name          string
		prefectClient *PrefectClient

		hasError bool
	}{
		{
			name: "happy path",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "123",
					SyncPatients:     "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit:  80,
				ErrorPercentLimit:   20,
				WaitBetweenRequests: 1 * time.Second,
				NumRetriesIfTimeout: 1,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: false,
		},
		{
			name: "error missing URL",
			prefectClient: &PrefectClient{
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "123",
					SyncPatients:     "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error missing token",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: nil,
				VersionGroupIDs: map[string]string{
					ProcessFile:      "123",
					SyncPatients:     "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 70,
				ErrorPercentLimit:  10,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error missing timeout",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "123",
					SyncPatients:     "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Duration(0),
				},
			},
			hasError: true,
		},
		{
			name: "error missing version group ID for process file",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					SyncPatients:     "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error missing version group ID for sync patients",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "456",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error missing version group ID for deactivate bucket",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					SyncPatients: "123",
					ProcessFile:  "456",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error invalid WaitBetweenRequests",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "456",
					SyncPatients:     "789",
					DeactivateBucket: "789",
				},
				ChangePercentLimit: 60,
				ErrorPercentLimit:  40,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
		{
			name: "error invalid NumRetriesIfTimeout",
			prefectClient: &PrefectClient{
				URL:   "test",
				Token: auth.FixedToken{},
				VersionGroupIDs: map[string]string{
					ProcessFile:      "456",
					SyncPatients:     "789",
					DeactivateBucket: "789",
				},
				ChangePercentLimit:  60,
				ErrorPercentLimit:   40,
				WaitBetweenRequests: 1 * time.Second,
				NumRetriesIfTimeout: -1,
				client: &http.Client{
					Timeout: time.Second,
				},
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p, err := NewPrefectClient(test.prefectClient)
			if (err != nil) != test.hasError {
				t.Fatalf("expected error:  %v, but got: %v", test.hasError, err)
			}
			if test.hasError != (p == nil) {
				t.Fatal("expected prefect client to be not nil")
			}
		})
	}
}

func TestBuildSyncPatientsPrefectRequest(t *testing.T) {
	channelItemID := int64(1)
	versionGroupID := "abc123"
	tests := []struct {
		name string

		expectedResp string
		hasError     bool
	}{
		{
			name:         "happy path building request",
			expectedResp: fmt.Sprintf(`{"query":%q}`, fmt.Sprintf(prefectMutationTemplateForSync, versionGroupID, channelItemID)),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &PrefectClient{
				VersionGroupIDs: map[string]string{
					SyncPatients: versionGroupID,
				},
			}
			resp, err := service.BuildSyncPatientsPrefectRequest(channelItemID)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, string(resp))
			}
		})
	}
}

func TestBuildDeactivateBucketPrefectRequest(t *testing.T) {
	bucketFolderID := int64(1)
	channelItemIDs := []int64{1, 5, 7}
	jsonChannelItems, _ := json.Marshal(channelItemIDs)
	versionGroupID := "abc123"
	tests := []struct {
		name string

		expectedResp string
		hasError     bool
	}{
		{
			name:         "happy path building request",
			expectedResp: fmt.Sprintf(`{"query":%q}`, fmt.Sprintf(prefectMutationTemplateForDeactivate, versionGroupID, bucketFolderID, string(jsonChannelItems))),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &PrefectClient{
				VersionGroupIDs: map[string]string{
					DeactivateBucket: versionGroupID,
				},
			}
			resp, err := service.BuildDeactivateBucketPrefectRequest(bucketFolderID, channelItemIDs)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, string(resp))
			}
		})
	}
}

func TestBuildPrefectRequest(t *testing.T) {
	dateFormat := pophealthpb.ColumnMapping_DATE_FORMAT_MMDDYYYY_SLASH
	columMappingTest := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "dob",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_DOB,
			DataType:              pophealthpb.DataType_DATA_TYPE_DATE,
			DateFormat:            &dateFormat,
			IsRequired:            true,
		},
	}
	columnMappingMock, err := generateColumnMappingJSONBMock(columMappingTest)
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name                string
		templateReq         pophealthsql.Template
		fileReq             pophealthsql.File
		bucketReq           pophealthsql.BucketFolder
		processFileGroupID  string
		syncPatientsGroupID string
		changePercentLimit  int
		errorPercentLimit   int

		hasError     bool
		expectedResp string
	}{
		{
			name: "happy path building prefect request",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq: pophealthsql.File{
				AwsObjectKey:   sql.NullString{String: "load/foo_file_12345.csv", Valid: true},
				Filename:       "foo_file.csv",
				FileParameters: convertToJSONB(pophealthpb.FileParameters{}),
			},
			bucketReq: pophealthsql.BucketFolder{
				S3BucketName: "provider1234",
			},
			processFileGroupID:  "12345",
			syncPatientsGroupID: "43822",
			changePercentLimit:  90,
			errorPercentLimit:   10,
			hasError:            false,
			expectedResp:        createExpectedPrefectRequest("12345", `{"ph_config":{"ingestion_filepath":"s3://provider1234/load/foo_file_12345.csv","column_mappings":[{"data_type":"date","date_format":"MM/DD/YYYY","destination_column_name":"dob","is_required":true,"source_column_name":"dob"}],"channel_item_id":1,"market_id":1,"change_percent_limit":90,"error_percent_limit":10}}`),
		},
		{
			name: "happy path building prefect request with force upload",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq: pophealthsql.File{
				AwsObjectKey:   sql.NullString{String: "load/foo_file_12345.csv", Valid: true},
				Filename:       "foo_file.csv",
				FileParameters: convertToJSONB(pophealthpb.FileParameters{ForceUpload: true}),
			},
			bucketReq: pophealthsql.BucketFolder{
				S3BucketName: "provider1234",
			},
			processFileGroupID:  "684354",
			syncPatientsGroupID: "43822",
			changePercentLimit:  85,
			errorPercentLimit:   15,
			hasError:            false,
			expectedResp:        createExpectedPrefectRequest("684354", `{"ph_config":{"ingestion_filepath":"s3://provider1234/load/foo_file_12345.csv","force":true,"column_mappings":[{"data_type":"date","date_format":"MM/DD/YYYY","destination_column_name":"dob","is_required":true,"source_column_name":"dob"}],"channel_item_id":1,"market_id":1,"change_percent_limit":85,"error_percent_limit":15}}`),
		},
		{
			name: "happy path building prefect request with backfill file",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq: pophealthsql.File{
				AwsObjectKey: sql.NullString{String: "load/foo_file_12345.csv", Valid: true},
				Filename:     "foo_file.csv",
				FileParameters: convertToJSONB(pophealthpb.FileParameters{
					StartDate: &common.Date{
						Year:  1989,
						Month: 2,
						Day:   1,
					},
					EndDate: &common.Date{
						Year:  1989,
						Month: 2,
						Day:   28,
					},
				}),
				IsBackfill: true,
			},
			bucketReq: pophealthsql.BucketFolder{
				S3BucketName: "provider1234",
			},
			processFileGroupID:  "684354",
			syncPatientsGroupID: "43822",
			changePercentLimit:  85,
			errorPercentLimit:   15,
			hasError:            false,
			expectedResp:        createExpectedPrefectRequest("684354", `{"ph_config":{"ingestion_filepath":"s3://provider1234/load/foo_file_12345.csv","force":true,"only_validate":true,"column_mappings":[{"data_type":"date","date_format":"MM/DD/YYYY","destination_column_name":"dob","is_required":true,"source_column_name":"dob"}],"channel_item_id":1,"market_id":1,"change_percent_limit":85,"error_percent_limit":15}}`),
		},
		{
			name: "error marshalling file parameters",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq: pophealthsql.File{
				AwsObjectKey: sql.NullString{String: "load/foo_file_12345.csv", Valid: true},
				Filename:     "foo_file.csv",
			},
			bucketReq: pophealthsql.BucketFolder{
				S3BucketName: "provider1234",
			},
			hasError: true,
		},
		{
			name:        "error building prefect request with empty data",
			templateReq: pophealthsql.Template{},
			fileReq: pophealthsql.File{
				FileParameters: convertToJSONB(pophealthpb.FileParameters{}),
			},
			bucketReq: pophealthsql.BucketFolder{},
			hasError:  true,
		},
		{
			name: "error building prefect request with empty change percent limit",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq:             pophealthsql.File{},
			bucketReq:           pophealthsql.BucketFolder{},
			processFileGroupID:  "6789",
			syncPatientsGroupID: "43822",
			errorPercentLimit:   10,
			hasError:            true,
		},
		{
			name: "error building prefect request with empty error percent limit",
			templateReq: pophealthsql.Template{
				FileType:      pophealthpb.FileType_FILE_TYPE_CSV.String(),
				ColumnMapping: columnMappingMock,
				ChannelItemID: 1,
				MarketID:      1,
			},
			fileReq:             pophealthsql.File{},
			bucketReq:           pophealthsql.BucketFolder{},
			processFileGroupID:  "6789",
			syncPatientsGroupID: "43822",
			changePercentLimit:  90,
			hasError:            true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			service := &PrefectClient{
				VersionGroupIDs: map[string]string{
					ProcessFile:  test.processFileGroupID,
					SyncPatients: test.syncPatientsGroupID,
				},
				ChangePercentLimit: test.changePercentLimit,
				ErrorPercentLimit:  test.errorPercentLimit,
			}
			resp, err := service.BuildPrefectRequest(test.templateReq, test.fileReq, test.bucketReq)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			if string(resp) != test.expectedResp {
				t.Errorf("got response %s but expected json to be %s", resp, test.expectedResp)
			}
		})
	}
}

func createExpectedPrefectRequest(versionGroupID, jsonParameter string) string {
	return fmt.Sprintf(`{"query":%q}`, fmt.Sprintf(prefectMutationTemplate, versionGroupID, fmt.Sprintf("%q", jsonParameter)))
}

func TestPrefectClientDoRequest(t *testing.T) {
	var prefectToken auth.FixedToken

	request := `{"query":"mutation"}`
	prefectTimeout := time.Second
	tests := []struct {
		name        string
		request     []byte
		ctx         context.Context
		httpHandler http.HandlerFunc

		hasError       bool
		expectedResult FlowID
	}{
		{
			name:    "happy path",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				resp := PrefectResponse{Data: struct {
					CreateFlowRun struct {
						ID FlowID `json:"id"`
					} `json:"create_flow_run"`
				}{CreateFlowRun: struct {
					ID FlowID `json:"id"`
				}{"123"}}}
				b, _ := json.Marshal(resp)
				writer.Write(b)
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       false,
			expectedResult: "123",
		},
		{
			name:    "error, prefect returns error",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.Write([]byte(`{"errors":[{"path":["create_flow_run"],"message":"error message","extensions":{"code":"INTERNAL_SERVER_ERROR"}}],"data":{"create_flow_run":{"id":"123"}}}`))
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, prefect returns multiple error",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.Write([]byte(`{"errors":[{"path":["create_flow_run"],"message":"error message 1","extensions":{"code":"INTERNAL_SERVER_ERROR"}},{"path":["create_flow_run"],"message":"error message 2","extensions":{"code":"INTERNAL_SERVER_ERROR"}}],"data":{"create_flow_run":{"id":"123"}}}`))
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, forbidden status",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.WriteHeader(http.StatusForbidden)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, not found status",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.WriteHeader(http.StatusNotFound)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, timeout",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				time.Sleep(prefectTimeout + time.Second)
				resp := PrefectResponse{Data: struct {
					CreateFlowRun struct {
						ID FlowID `json:"id"`
					} `json:"create_flow_run"`
				}{CreateFlowRun: struct {
					ID FlowID `json:"id"`
				}{"123"}}}
				b, _ := json.Marshal(resp)
				writer.Write(b)
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, bad response",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.Write([]byte(`{"data":{"create_flow_run":{"id":"123"}}`))
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error, bad response structure",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.Write([]byte(`{"data":{"id":"123"}}`))
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error creating request, nil context",
			request: []byte(request),
			ctx:     nil,
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				resp := PrefectResponse{Data: struct {
					CreateFlowRun struct {
						ID FlowID `json:"id"`
					} `json:"create_flow_run"`
				}{CreateFlowRun: struct {
					ID FlowID `json:"id"`
				}{"123"}}}
				b, _ := json.Marshal(resp)
				writer.Write(b)
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       true,
			expectedResult: "",
		},
		{
			name:    "error reading response body",
			request: []byte(request),
			ctx:     context.Background(),
			httpHandler: func(writer http.ResponseWriter, request *http.Request) {
				writer.Header().Set("Content-Length", "1")
				writer.WriteHeader(http.StatusOK)
			},

			hasError:       true,
			expectedResult: "",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := httptest.NewServer(test.httpHandler)
			defer s.Close()
			prefectClient := &PrefectClient{
				URL:   s.URL,
				Token: prefectToken,
				VersionGroupIDs: map[string]string{
					ProcessFile:      "abcdef",
					SyncPatients:     "713nnf",
					DeactivateBucket: "234nht",
				},
				ChangePercentLimit:  80,
				ErrorPercentLimit:   20,
				WaitBetweenRequests: 5 * time.Second,
				NumRetriesIfTimeout: 1,
				RetryInterval:       1 * time.Millisecond,
				client: &http.Client{
					Timeout: prefectTimeout,
				},
			}
			c, err := NewPrefectClient(prefectClient)
			if err != nil {
				t.Fatalf("error creating prefect client: %v", err)
			}
			resp, err := c.DoRequest(test.ctx, test.request)
			if (err != nil) != test.hasError {
				t.Errorf("expected error:  %v, but got: %v", test.hasError, err)
			}
			if resp != "" && resp != test.expectedResult {
				t.Errorf("expected flow id:  %s, but got: %s", test.expectedResult, resp)
			}
		})
	}
}

func TestPrefectClientTransformColumnMapping(t *testing.T) {
	noFloatMappings := []map[string]any{
		{
			destinationColumnNameField: "date_of_birth",
			dataTypeField:              "DATE",
			dateFormatField:            "mm/dd/yyyy",
			sourceColumnNameField:      "dob",
			"another_field":            "test",
		},
	}

	tests := []struct {
		name    string
		mapping pgtype.JSONB

		result   pgtype.JSONB
		hasError bool
	}{
		{
			name: "happy path",
			mapping: convertToJSONB([]map[string]any{
				{
					destinationColumnNameField: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
					dataTypeField:              pophealthpb.DataType_DATA_TYPE_STRING,
					sourceColumnNameField:      "fname",
					"another_field":            "test",
				},
			}),
			result: convertToJSONB([]map[string]any{
				{
					destinationColumnNameField: "first_name",
					dataTypeField:              "string",
					sourceColumnNameField:      "fname",
					"another_field":            "test",
				},
			}),
			hasError: false,
		},
		{
			name: "removes mappings with undefined source columns",
			mapping: convertToJSONB([]map[string]any{
				{
					destinationColumnNameField: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
					dataTypeField:              pophealthpb.DataType_DATA_TYPE_STRING,
					sourceColumnNameField:      "fname",
					"another_field":            "test",
				},
				{
					destinationColumnNameField: pophealthpb.DHColumnName_DH_COLUMN_NAME_MEMBER_ID,
					dataTypeField:              pophealthpb.DataType_DATA_TYPE_STRING,
					"another_field":            "test",
				},
			}),
			result: convertToJSONB([]map[string]any{
				{
					destinationColumnNameField: "first_name",
					dataTypeField:              "string",
					sourceColumnNameField:      "fname",
					"another_field":            "test",
				},
			}),
			hasError: false,
		},
		{
			name: "error unmarshalling jsonb",
			mapping: convertToJSONB(map[string]any{
				destinationColumnNameField: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
				dataTypeField:              pophealthpb.DataType_DATA_TYPE_STRING,
				"another_field":            "test",
			}),

			hasError: true,
		},
		{
			name:     "transforming no float values",
			mapping:  convertToJSONB(noFloatMappings),
			result:   convertToJSONB(noFloatMappings),
			hasError: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := PrefectClient{}
			got, err := p.transformColumnMapping(test.mapping)
			if (err != nil) != test.hasError {
				t.Fatalf("expected error:  %v, but got: %v", test.hasError, err)
			}
			if !test.hasError {
				testutils.MustMatch(t, test.result, got, "mappings dont match")
			}
		})
	}
}

func TestIsTimeoutError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "when err is nil",
			err:      nil,
			expected: false,
		},
		{
			name:     "when err is not a url.Error",
			err:      errInternalTest,
			expected: false,
		},
		{
			name:     "when err is url.Error but not Timeout",
			err:      &url.Error{},
			expected: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := IsTimeoutError(test.err)
			testutils.MustMatch(t, test.expected, result)
		})
	}
}

func convertToJSONB(p any) pgtype.JSONB {
	j, err := json.Marshal(p)
	if err != nil {
		return pgtype.JSONB{Status: pgtype.Null}
	}

	return pgtype.JSONB{Bytes: j, Status: pgtype.Present}
}

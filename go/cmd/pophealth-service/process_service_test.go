package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/elastic/go-elasticsearch/v7/esutil"
	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/mailer"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

const (
	bucketExchange = "bucketExchange"
	successStatus  = "success"
	invalidStatus  = "invalid"
	errorStatus    = "error"
)

const (
	resultsFileWithoutErrorsTemplate = `{
		"flow_run_id": "%s",
		"processed_at":"2022-07-29T22:58:07+00:00",
		"status":"%s",
		"number_new": %d,
		"number_deleted": %d,
		"records":{
			"new": [
				{
					"patient_hash": "b6321cccfcbadf899802d17bcfe37f6",
					"row_hash": "964b3c9f363f3adbd0acd33ad01584dd",
					"first_name": "fa",
					"last_name": "la",
					"dob": "doba",
					"gender": "gendera",
					"ssn": "ssna",
					"street_address_1": "st1a",
					"street_address_2": "st2a",
					"city": "citya",
					"state": "statea",
					"zipcode": "zipcodea",
					"member_id": "ida",
					"email": "emaila",
					"market_id": "54321",
					"channel_item_id": "123456"
				},
				{
					"patient_hash": "5da1f1433f69292c30bbb4040011c71d",
					"row_hash": "6eb4b58be8d7a8454277f5eda15943e9",
					"first_name": "fb",
					"last_name": "lb",
					"dob": "19900518",
					"gender": "genderb",
					"ssn": "ssnb",
					"street_address_1": "st1b",
					"street_address_2": "st2b",
					"city": "cityb",
					"state": "stateb",
					"zipcode": "zipcodeb",
					"member_id": "idb",
					"email": "emailb",
					"market_id": "12345",
					"channel_item_id": "123457"
				}
			],
			"deleted": [
				"5c767c5744b44d03a76889ba2cfbd5db",
				"ca3cb8011628889237d108dd3350b4db"
			]
		}
	}`

	resultsFileSyncFlow = `{
		"flow_run_id": "%s",
		"processed_at":"2022-07-29T22:58:07+00:00",
		"status":"%s",
		"number_new": %d,
		"number_deleted": %d,
		"refresh": true,
		"records":{
			"new": [
				{
					"patient_hash": "b6321cccfcbadf899802d17bcfe37f6",
					"row_hash": "964b3c9f363f3adbd0acd33ad01584dd",
					"first_name": "fa",
					"last_name": "la",
					"dob": "doba",
					"gender": "gendera",
					"ssn": "ssna",
					"street_address_1": "st1a",
					"street_address_2": "st2a",
					"city": "citya",
					"state": "statea",
					"zipcode": "zipcodea",
					"member_id": "ida",
					"email": "emaila",
					"market_id": "54321",
					"channel_item_id": "123456"
				},
				{
					"patient_hash": "5da1f1433f69292c30bbb4040011c71d",
					"row_hash": "6eb4b58be8d7a8454277f5eda15943e9",
					"first_name": "fb",
					"last_name": "lb",
					"dob": "19900518",
					"gender": "genderb",
					"ssn": "ssnb",
					"street_address_1": "st1b",
					"street_address_2": "st2b",
					"city": "cityb",
					"state": "stateb",
					"zipcode": "zipcodeb",
					"member_id": "idb",
					"email": "emailb",
					"market_id": "12345",
					"channel_item_id": "123456"
				}
			],
			"deleted": []
		}
	}`
)

type mockAWSFileService struct {
	getS3FileResp   io.ReadCloser
	errCopyFile     error
	errDeleteS3File error
	errGetS3File    error
}

func (m *mockAWSFileService) CopyFile(_ context.Context, _ string, _ string, _ string) error {
	return m.errCopyFile
}

func (m *mockAWSFileService) DeleteS3File(_ context.Context, _ string, _ string) error {
	return m.errDeleteS3File
}

func (m *mockAWSFileService) GetS3File(_ context.Context, _, _ string) (io.ReadCloser, error) {
	return m.getS3FileResp, m.errGetS3File
}

type mockTemplateService struct {
	findTemplateByFileResp   pophealthsql.Template
	updateFileByTemplateResp pophealthsql.File
	buildPrefectRequestResp  []byte
	errFindTemplateByFile    error
	errUpdateFileByTemplate  error
	errBuildPrefectRequest   error
}

func (m *mockTemplateService) FindTemplateByFile(_ context.Context, _ UpdateFileByTemplateRequest) (*pophealthsql.Template, error) {
	return &m.findTemplateByFileResp, m.errFindTemplateByFile
}

func (m *mockTemplateService) UpdateFileByTemplate(_ context.Context, _, _ int64) (*pophealthsql.File, error) {
	return &m.updateFileByTemplateResp, m.errUpdateFileByTemplate
}

func (m *mockTemplateService) BuildPrefectRequest(_ pophealthsql.Template, _ pophealthsql.File, _ pophealthsql.BucketFolder) ([]byte, error) {
	return m.buildPrefectRequestResp, m.errBuildPrefectRequest
}

type mockDBFileService struct {
	getBucketFolderResp                           *pophealthsql.BucketFolder
	getBucketFolderByS3BucketNameResp             pophealthsql.BucketFolder
	addFileResp                                   pophealthsql.File
	updateFileStartProcessingByIDResp             pophealthsql.File
	updateFileStatusByIDResp                      pophealthsql.File
	updateAwsObjectKeyInFilesByIDResp             pophealthsql.File
	updateFileByIDResp                            pophealthsql.File
	getFileByPrefectFlowResp                      pophealthsql.GetFileByPrefectFlowRunIDRow
	getResultCodeByCodeResp                       pophealthsql.ResultCode
	createResultCodeResp                          pophealthsql.ResultCode
	addFilesResultCodesResp                       pophealthsql.FilesResultCode
	addFilesResultCodesWithOccResp                pophealthsql.FilesResultCode
	getExpiredFilesResp                           []*pophealthsql.GetExpiredFilesRow
	getFileByIDResp                               pophealthsql.File
	getFileResultCodesWithCodeDetailsByFileIDResp []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow
	getEmailNotificationsByBucketIDResp           []string
	getFileByBucketAndObjectKeyResp               pophealthsql.File
	getTemplateByIDResp                           []struct {
		pophealthsql.Template
		error
	}
	getTemplateByIDIndex                         int
	getOldestFileByStatusWithChannelItemResp     pophealthsql.File
	getFileAndBucketFolderByFileIDResp           pophealthsql.GetFileAndBucketFolderByFileIDRow
	activateBucketFolderResp                     pophealthsql.BucketFolder
	getTemplatesInBucketFolderResp               []*pophealthsql.Template
	getFilesByChannelItemAndBucketIDResp         []*pophealthsql.File
	deleteFileByIDResp                           *pophealthsql.File
	deleteFileByIDErr                            error
	deleteTemplatesByChannelItemIDsResp          []*pophealthsql.Template
	deleteTemplatesByChannelItemIDsErr           error
	errUpdateAwsObjectKeyInFilesID               error
	errGetBucketFolderByS3BucketName             error
	errAddFile                                   error
	errUpdateFileStartProcessingByID             error
	errUpdateFileStatusByID                      error
	errGetFileByPrefectFlowRunID                 error
	errUpdateFileByID                            error
	errGetResultCodeByCode                       error
	errCreateResultCode                          error
	errAddFilesResultCodes                       error
	errAddFilesResultCodesWithOcc                error
	errGetFileByID                               error
	errGetFileAndBucketFolderByFileID            error
	errGetFileResultCodesWithCodeDetailsByFileID error
	errGetEmailNotificationsByBucketID           error
	errGetFileByBucketAndObjectKey               error
	errActivateBucketFolder                      error
	errGetTemplatesInBucketFolder                error
	err                                          error
	getOldestFileByStatusWithChannelItemErr      error
	getExpiredFilesErr                           error
	errGetFilesByChannelItemAndBucketID          error
	isHealthyResp                                bool
}

func (m *mockDBFileService) GetBucketFolderByID(_ context.Context, _ int64) (*pophealthsql.BucketFolder, error) {
	return m.getBucketFolderResp, m.err
}

func (m *mockDBFileService) GetBucketFolderByS3BucketName(_ context.Context, _ string) (*pophealthsql.BucketFolder, error) {
	return &m.getBucketFolderByS3BucketNameResp, m.errGetBucketFolderByS3BucketName
}

func (m *mockDBFileService) AddFile(_ context.Context, _ pophealthsql.AddFileParams) (*pophealthsql.File, error) {
	return &m.addFileResp, m.errAddFile
}

func (m *mockDBFileService) UpdateFileStartProcessingByID(_ context.Context, _ pophealthsql.UpdateFileStartProcessingByIDParams) (*pophealthsql.File, error) {
	return &m.updateFileStartProcessingByIDResp, m.errUpdateFileStartProcessingByID
}

func (m *mockDBFileService) UpdateFileStatusByID(_ context.Context, _ pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error) {
	return &m.updateFileStatusByIDResp, m.errUpdateFileStatusByID
}

func (m *mockDBFileService) GetFileByPrefectFlowRunID(_ context.Context, _ sql.NullString) (*pophealthsql.GetFileByPrefectFlowRunIDRow, error) {
	return &m.getFileByPrefectFlowResp, m.errGetFileByPrefectFlowRunID
}

func (m *mockDBFileService) UpdateFileByID(_ context.Context, _ pophealthsql.UpdateFileByIDParams) (*pophealthsql.File, error) {
	return &m.updateFileByIDResp, m.errUpdateFileByID
}

func (m *mockDBFileService) UpdateAwsObjectKeyInFilesByID(_ context.Context, f pophealthsql.UpdateAwsObjectKeyInFilesByIDParams) (*pophealthsql.File, error) {
	m.updateAwsObjectKeyInFilesByIDResp.AwsObjectKey = f.AwsObjectKey
	return &m.updateAwsObjectKeyInFilesByIDResp, m.errUpdateAwsObjectKeyInFilesID
}

func (m *mockDBFileService) GetResultCodeByCode(_ context.Context, _ string) (*pophealthsql.ResultCode, error) {
	return &m.getResultCodeByCodeResp, m.errGetResultCodeByCode
}

func (m *mockDBFileService) CreateResultCode(_ context.Context, _ pophealthsql.CreateResultCodeParams) (*pophealthsql.ResultCode, error) {
	return &m.createResultCodeResp, m.errCreateResultCode
}

func (m *mockDBFileService) AddFilesResultCodes(_ context.Context, _ pophealthsql.AddFilesResultCodesParams) (*pophealthsql.FilesResultCode, error) {
	return &m.addFilesResultCodesResp, m.errAddFilesResultCodes
}

func (m *mockDBFileService) AddFilesResultCodesWithOccurrences(_ context.Context, _ pophealthsql.AddFilesResultCodesWithOccurrencesParams) (*pophealthsql.FilesResultCode, error) {
	return &m.addFilesResultCodesWithOccResp, m.errAddFilesResultCodesWithOcc
}

func (m *mockDBFileService) GetFileByID(_ context.Context, _ int64) (*pophealthsql.File, error) {
	return &m.getFileByIDResp, m.errGetFileByID
}

func (m *mockDBFileService) GetFileAndBucketFolderByFileID(_ context.Context, _ int64) (*pophealthsql.GetFileAndBucketFolderByFileIDRow, error) {
	return &m.getFileAndBucketFolderByFileIDResp, m.errGetFileAndBucketFolderByFileID
}

func (m *mockDBFileService) GetFileResultCodesWithCodeDetailsByFileID(_ context.Context, _ int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
	return m.getFileResultCodesWithCodeDetailsByFileIDResp, m.errGetFileResultCodesWithCodeDetailsByFileID
}

func (m *mockDBFileService) GetEmailNotificationsByBucketID(_ context.Context, _ int64) ([]string, error) {
	return m.getEmailNotificationsByBucketIDResp, m.errGetEmailNotificationsByBucketID
}

func (m *mockDBFileService) GetExpiredFiles(_ context.Context, _ time.Time) ([]*pophealthsql.GetExpiredFilesRow, error) {
	return m.getExpiredFilesResp, m.getExpiredFilesErr
}

func (m *mockDBFileService) GetFileByBucketAndObjectKey(_ context.Context, _ pophealthsql.GetFileByBucketAndObjectKeyParams) (*pophealthsql.File, error) {
	return &m.getFileByBucketAndObjectKeyResp, m.errGetFileByBucketAndObjectKey
}

func (m *mockDBFileService) GetTemplateByID(context.Context, int64) (*pophealthsql.Template, error) {
	if m.getTemplateByIDIndex < len(m.getTemplateByIDResp) {
		m.getTemplateByIDIndex++
	}
	return &m.getTemplateByIDResp[m.getTemplateByIDIndex-1].Template, m.getTemplateByIDResp[m.getTemplateByIDIndex-1].error
}

func (m *mockDBFileService) GetOldestFileByStatusWithChannelItem(_ context.Context, _ pophealthsql.GetOldestFileByStatusWithChannelItemParams) (*pophealthsql.File, error) {
	return &m.getOldestFileByStatusWithChannelItemResp, m.getOldestFileByStatusWithChannelItemErr
}

func (m *mockDBFileService) ActivateBucketFolder(_ context.Context, _ int64) (*pophealthsql.BucketFolder, error) {
	return &m.activateBucketFolderResp, m.errActivateBucketFolder
}

func (m *mockDBFileService) GetTemplatesInBucketFolder(_ context.Context, _ int64) ([]*pophealthsql.Template, error) {
	return m.getTemplatesInBucketFolderResp, m.errGetTemplatesInBucketFolder
}

func (m *mockDBFileService) GetFilesByChannelItemAndBucketID(_ context.Context, _ pophealthsql.GetFilesByChannelItemAndBucketIDParams) ([]*pophealthsql.File, error) {
	return m.getFilesByChannelItemAndBucketIDResp, m.errGetFilesByChannelItemAndBucketID
}

func (m *mockDBFileService) DeleteFileByID(_ context.Context, _ int64) (*pophealthsql.File, error) {
	return m.deleteFileByIDResp, m.deleteFileByIDErr
}

func (m *mockDBFileService) DeleteTemplatesByChannelItemIDs(context.Context, []int64) ([]*pophealthsql.Template, error) {
	return m.deleteTemplatesByChannelItemIDsResp, m.deleteTemplatesByChannelItemIDsErr
}

func (m *mockDBFileService) IsHealthy(context.Context) bool {
	return m.isHealthyResp
}

type mockPrefectClient struct {
	buildSyncPatientsPrefectRequestResp     []byte
	buildDeactivateBucketPrefectRequestResp []byte
	buildPrefectRequestResponse             []byte
	doRequestResponse                       FlowID
	buildSyncPatientsPrefectRequestErr      error
	buildDeactivateBucketPrefectRequestErr  error
	buildPrefectRequestErr                  error
	doRequestErr                            error
}

func (m *mockPrefectClient) BuildSyncPatientsPrefectRequest(_ int64) ([]byte, error) {
	return m.buildSyncPatientsPrefectRequestResp, m.buildSyncPatientsPrefectRequestErr
}

func (m *mockPrefectClient) BuildDeactivateBucketPrefectRequest(bucketFolderID int64, channelItemIDs []int64) ([]byte, error) {
	return m.buildDeactivateBucketPrefectRequestResp, m.buildDeactivateBucketPrefectRequestErr
}

func (m *mockPrefectClient) BuildPrefectRequest(_ pophealthsql.Template, _ pophealthsql.File, _ pophealthsql.BucketFolder) ([]byte, error) {
	return m.buildPrefectRequestResponse, m.buildPrefectRequestErr
}

func (m *mockPrefectClient) DoRequest(_ context.Context, _ []byte) (FlowID, error) {
	return m.doRequestResponse, m.doRequestErr
}

type mockElasticSearchService struct {
	deleteByChannelItemIDRespose ESResponse
	bulkUpsertResponse           ESBulkResponse
	bulkDeleteResponse           ESBulkResponse
	totalPatientsResponse        ESTotalPatientsResponse
	deleteByChannelItemIDErr     error
	bulkUpsertErr                error
	bulkDeleteErr                error
	totalPatientsErr             error
}

func (e *mockElasticSearchService) DeleteByChannelItemID(_ context.Context, _ PopHealthIndexKey, _ int64) (*ESResponse, error) {
	return &e.deleteByChannelItemIDRespose, e.deleteByChannelItemIDErr
}

func (e *mockElasticSearchService) BulkUpsert(_ context.Context, _ PopHealthIndexKey, _ []*Patient, _ int64) (*ESBulkResponse, error) {
	return &e.bulkUpsertResponse, e.bulkUpsertErr
}

func (e *mockElasticSearchService) BulkDelete(_ context.Context, _ PopHealthIndexKey, _ []string, _ int64) (*ESBulkResponse, error) {
	return &e.bulkDeleteResponse, e.bulkDeleteErr
}

func (e *mockElasticSearchService) NewBulkIndexer(_ PopHealthIndexKey) (esutil.BulkIndexer, error) {
	return nil, nil
}

func (e *mockElasticSearchService) GetPatientCountByChannelItem(_ context.Context, _ PopHealthIndexKey, _ int64) (*ESTotalPatientsResponse, error) {
	return &e.totalPatientsResponse, e.totalPatientsErr
}

type mockMailerService struct {
	sendProcessingReportErr error
	sendDeletedReportErr    error
}

func (s *mockMailerService) SendProcessingReport(_ context.Context, _ mailer.SendProcessingReportParams) error {
	return s.sendProcessingReportErr
}

func (s *mockMailerService) SendDeletedReport(_ context.Context, _ mailer.DeletedMailParams) error {
	return s.sendDeletedReportErr
}

type mockBackfillService struct {
	startBackfillResp partnerpb.StartBackfillResponse
	startBackfillErr  error
}

func (s *mockBackfillService) StartBackfill(context.Context, *partnerpb.StartBackfillRequest, ...grpc.CallOption) (*partnerpb.StartBackfillResponse, error) {
	return &s.startBackfillResp, s.startBackfillErr
}

func TestNewFileService(t *testing.T) {
	tests := []struct {
		name           string
		aws            *mockAWSFileService
		template       *mockTemplateService
		db             *mockDBFileService
		backfill       *mockBackfillService
		prefect        *mockPrefectClient
		elasticsearch  *mockElasticSearchService
		mailer         *mockMailerService
		exchangeBucket string
		logger         *zap.SugaredLogger
	}{
		{
			name:           "happy path",
			aws:            &mockAWSFileService{},
			template:       &mockTemplateService{},
			db:             &mockDBFileService{},
			backfill:       &mockBackfillService{},
			prefect:        &mockPrefectClient{},
			elasticsearch:  &mockElasticSearchService{},
			mailer:         &mockMailerService{},
			exchangeBucket: "bucket",
			logger:         zap.NewNop().Sugar(),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			process := NewProcessFileService(
				ProcessFileDependencies{
					Aws:              test.aws,
					TemplatesService: test.template,
					DBService:        test.db,
					BackfillService:  test.backfill,
					PrefectClient:    test.prefect,
					ElasticSearch:    test.elasticsearch,
					Mailer:           test.mailer,
				},
				test.exchangeBucket,
				test.logger,
			)
			if process == nil {
				t.Fatalf("process service is nil")
			}
		})
	}
}

func TestIsDBHealthy(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name     string
		template *mockTemplateService
		db       *mockDBFileService
		prefect  *mockPrefectClient
		aws      *mockAWSFileService

		expectedResp bool
	}{
		{
			name:     "DB status OK",
			template: &mockTemplateService{},
			db: &mockDBFileService{
				isHealthyResp: true,
			},
			prefect:      &mockPrefectClient{},
			aws:          &mockAWSFileService{},
			expectedResp: true,
		},
		{
			name:     "DB fail",
			template: &mockTemplateService{},
			db: &mockDBFileService{
				isHealthyResp: false,
			},
			prefect:      &mockPrefectClient{},
			aws:          &mockAWSFileService{},
			expectedResp: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:            test.aws,
				templates:      test.template,
				db:             test.db,
				prefectClient:  test.prefect,
				exchangeBucket: bucketExchange,
			}
			got := s.IsDBHealthy(ctx)
			testutils.MustMatch(t, test.expectedResp, got)
		})
	}
}

func TestFileServiceProcessSourceFile(t *testing.T) {
	ctx := context.Background()
	bucketName := "testBucket"
	objectKey := "load/test/file.csv"
	invalidObjectKey := "load/test/file%1.csv"
	blankSpaceObjectKey := "load/test/test file.csv"

	fileName := "file.csv"
	tests := []struct {
		name      string
		objectKey string
		template  *mockTemplateService
		db        *mockDBFileService
		prefect   *mockPrefectClient
		aws       *mockAWSFileService
		mailer    *mockMailerService

		hasError bool
	}{
		{
			name:      "happy path exists other file processing",
			objectKey: objectKey,
			template: &mockTemplateService{
				findTemplateByFileResp: pophealthsql.Template{
					ID: int64(1),
				},
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			aws:      &mockAWSFileService{},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:      "happy path not exists other file processing",
			objectKey: objectKey,
			template: &mockTemplateService{
				findTemplateByFileResp: pophealthsql.Template{
					ID: int64(1),
				},
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			aws:      &mockAWSFileService{},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:      "file name with blank space",
			objectKey: blankSpaceObjectKey,
			template: &mockTemplateService{
				findTemplateByFileResp: pophealthsql.Template{
					ID: int64(1),
				},
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			aws:      &mockAWSFileService{},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:      "error getting bucket from name",
			objectKey: objectKey,
			template:  &mockTemplateService{},
			db: &mockDBFileService{
				errGetBucketFolderByS3BucketName: errInternalTest,
			},
			prefect:  &mockPrefectClient{},
			aws:      &mockAWSFileService{},
			hasError: true,
		},
		{
			name:      "error bucket folder is not active",
			objectKey: objectKey,
			template:  &mockTemplateService{},
			db: &mockDBFileService{
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID:            int64(1),
					Name:          "Deactivated bucket",
					DeactivatedAt: sqltypes.ToValidNullTime(time.Now()),
				},
			},
			prefect:  &mockPrefectClient{},
			aws:      &mockAWSFileService{},
			hasError: true,
		},
		{
			name:      "notification not sent if there are no result codes",
			objectKey: objectKey,
			template: &mockTemplateService{
				findTemplateByFileResp: pophealthsql.Template{
					ID: int64(1),
				},
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getFileResultCodesWithCodeDetailsByFileIDResp: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			aws:      &mockAWSFileService{},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:      "notification not sent if there is an error recovering result codes",
			objectKey: objectKey,
			template: &mockTemplateService{
				findTemplateByFileResp: pophealthsql.Template{
					ID: int64(1),
				},
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				errGetFileResultCodesWithCodeDetailsByFileID: errInternalTest,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			aws:      &mockAWSFileService{},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:      "error escaping object key",
			objectKey: invalidObjectKey,
			db: &mockDBFileService{
				getBucketFolderByS3BucketNameResp: pophealthsql.BucketFolder{
					ID: int64(1),
				},
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:            test.aws,
				templates:      test.template,
				db:             test.db,
				prefectClient:  test.prefect,
				exchangeBucket: bucketExchange,
				mailer:         test.mailer,
				influxScope:    &monitoring.NoopScope{},
			}
			err := s.ProcessSourceFile(ctx, bucketName, test.objectKey)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestProcessFileService_CopyFileToExchangeBucket(t *testing.T) {
	testFile := &pophealthsql.File{
		ID:             int64(2),
		BucketFolderID: int64(10),
		AwsObjectKey:   sql.NullString{String: "testKey"},
		Filename:       "testfile.xls",
	}

	tests := []struct {
		name                string
		bucketFolderService *mockDBFileService
		awsService          *mockAWSFileService
		file                *pophealthsql.File

		hasError bool
	}{
		{
			name: "CopyFileToExchangeBucket success",
			bucketFolderService: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
			},
			awsService: &mockAWSFileService{},
			file:       testFile,
			hasError:   false,
		},
		{
			name: "CopyFileToExchangeBucket failure - bucket not found",
			bucketFolderService: &mockDBFileService{
				err: errInternalTest,
			},
			awsService: &mockAWSFileService{errCopyFile: errInternalTest},
			file:       testFile,
			hasError:   true,
		},
		{
			name: "CopyFileToExchangeBucket failure - aws copy file error",
			bucketFolderService: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
			},
			awsService: &mockAWSFileService{errCopyFile: errInternalTest},
			file:       testFile,
			hasError:   true,
		},
	}

	for _, test := range tests {
		t.Setenv("POP_HEALTH_FILE_EXCHANGE_BUCKET", "testBucket")
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			f := &ProcessFileService{
				db:  test.bucketFolderService,
				aws: test.awsService,
			}
			_, err := f.copyFileToExchangeBucket(ctx, test.file)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
		})
	}
}

func TestFileServiceProcessFile(t *testing.T) {
	ctx := context.Background()
	mockTemplate := pophealthsql.Template{
		ID: time.Now().UnixNano(),
	}
	mockFileWithTemplate := pophealthsql.File{
		ID: time.Now().UnixNano(),
		TemplateID: sql.NullInt64{
			Int64: time.Now().UnixNano(),
			Valid: true,
		},
	}
	fileName := "test_file.csv"
	tests := []struct {
		name      string
		aws       *mockAWSFileService
		template  *mockTemplateService
		db        *mockDBFileService
		prefect   *mockPrefectClient
		fileParam pophealthsql.File
		mailer    *mockMailerService

		hasError bool
	}{
		{
			name:     "happy path with file update",
			aws:      &mockAWSFileService{},
			template: &mockTemplateService{},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				getFileByBucketAndObjectKeyResp: mockFileWithTemplate,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{mockTemplate, nil}},
				updateFileStatusByIDResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
					TemplateID: sql.NullInt64{
						Int64: time.Now().UnixNano(),
						Valid: true,
					},
					Status: pophealthsql.FileStatusPreprocess,
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name: "happy path with file insert",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: false,
		},
		{
			name:     "error updating file in table",
			aws:      &mockAWSFileService{},
			template: &mockTemplateService{},
			db: &mockDBFileService{
				getFileByBucketAndObjectKeyResp: pophealthsql.File{
					ID: int64(1),
				},
				errUpdateFileStatusByID: errInternalTest,
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name:     "error adding file in table",
			aws:      &mockAWSFileService{},
			template: &mockTemplateService{},
			db: &mockDBFileService{
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				errAddFile:                     errInternalTest,
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name:     "error getting file by bucket and object key",
			aws:      &mockAWSFileService{},
			template: &mockTemplateService{},
			db: &mockDBFileService{
				errGetFileByBucketAndObjectKey: errInternalTest,
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name:     "error finding template with file update",
			aws:      &mockAWSFileService{},
			template: &mockTemplateService{},
			db: &mockDBFileService{
				getFileByBucketAndObjectKeyResp: mockFileWithTemplate,
				updateFileStatusByIDResp:        mockFileWithTemplate,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{}, errInternalTest}},
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error putting file in exchange bucket",
			aws: &mockAWSFileService{
				errCopyFile: errInternalTest,
			},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       int64(1),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error template not found",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				errFindTemplateByFile: ErrTemplateNotFound,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error template not found with error moving file to failed",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				errFindTemplateByFile: ErrTemplateNotFound,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				errUpdateAwsObjectKeyInFilesID: errInternalTest,
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error updating file with template",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp:  mockTemplate,
				errUpdateFileByTemplate: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
			},
			prefect: &mockPrefectClient{},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error creating prefect request",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       int64(1),
					Filename: fileName,
				},
				errBuildPrefectRequest: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestErr: errInternalTest,
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer: &mockMailerService{},
		},
		{
			name: "error calling prefect",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       int64(1),
					Filename: fileName,
				},
				errBuildPrefectRequest: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test requesr"),
				doRequestErr:                errInternalTest,
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer: &mockMailerService{},
		},
		{
			name: "error context deadline exceeded",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       int64(1),
					Filename: fileName,
				},
				errBuildPrefectRequest: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request timeout"),
				doRequestErr:                context.DeadlineExceeded,
			},
			fileParam: pophealthsql.File{
				ID:             2,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer: &mockMailerService{},
		},
		{
			name: "error updating file with preprocessing status",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       int64(1),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				errUpdateFileStartProcessingByID:        errInternalTest,
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer: &mockMailerService{},
		},
		{
			name: "error checking if exists other file processing",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				getOldestFileByStatusWithChannelItemErr: errInternalTest,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
		{
			name: "error updating file status",
			aws:  &mockAWSFileService{},
			template: &mockTemplateService{
				findTemplateByFileResp: mockTemplate,
				updateFileByTemplateResp: pophealthsql.File{
					ID:       time.Now().UnixNano(),
					Filename: fileName,
				},
			},
			db: &mockDBFileService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					S3BucketName: "Test",
				},
				errGetFileByBucketAndObjectKey: pgx.ErrNoRows,
				addFileResp: pophealthsql.File{
					ID: int64(1),
				},
				errUpdateFileStatusByID: errInternalTest,
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			fileParam: pophealthsql.File{
				ID:             0,
				Filename:       fileName,
				BucketFolderID: 1,
			},
			mailer:   &mockMailerService{},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:            test.aws,
				templates:      test.template,
				db:             test.db,
				prefectClient:  test.prefect,
				exchangeBucket: bucketExchange,
				mailer:         test.mailer,
				influxScope:    &monitoring.NoopScope{},
				logger:         zap.NewNop().Sugar(),
			}
			err := s.processFile(ctx, &test.fileParam)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestProcessFileService_moveFileInExchangeBucketByStatus(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name          string
		aws           *mockAWSFileService
		db            *mockDBFileService
		popHealthFile *pophealthsql.File
		mailer        *mockMailerService

		hasError bool
	}{
		{
			name: "happy path processed",
			aws:  &mockAWSFileService{},
			db:   &mockDBFileService{},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				AwsObjectKey: getAWSObjectKey(),
				Status:       pophealthsql.FileStatusProcessed,
			},
		},
		{
			name: "happy path failed",
			aws:  &mockAWSFileService{},
			db:   &mockDBFileService{},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				AwsObjectKey: getAWSObjectKey(),
				Status:       pophealthsql.FileStatusInvalid,
			},
		},
		{
			name: "error copying the file",
			aws: &mockAWSFileService{
				errCopyFile: errInternalTest,
			},
			db: &mockDBFileService{},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				AwsObjectKey: getAWSObjectKey(),
				Status:       pophealthsql.FileStatusInvalid,
			},
			hasError: true,
		},
		{
			name: "error updating the file in db",
			aws:  &mockAWSFileService{},
			db: &mockDBFileService{
				errUpdateAwsObjectKeyInFilesID: errInternalTest,
			},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				AwsObjectKey: getAWSObjectKey(),
				Status:       pophealthsql.FileStatusInvalid,
			},
			hasError: true,
		},
		{
			name: "error deleting the file",
			aws: &mockAWSFileService{
				errDeleteS3File: errInternalTest,
			},
			db: &mockDBFileService{},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				AwsObjectKey: getAWSObjectKey(),
				Status:       pophealthsql.FileStatusInvalid,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:            test.aws,
				db:             test.db,
				exchangeBucket: bucketExchange,
			}
			res, err := s.moveFileInExchangeBucketByStatus(ctx, test.popHealthFile)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
			if (res == nil) != test.hasError {
				t.Error("response is nil, but should not be nil")
			}
			if !test.hasError && (test.popHealthFile.Status == pophealthsql.FileStatusFailed ||
				test.popHealthFile.Status == pophealthsql.FileStatusInvalid) &&
				!strings.HasPrefix(res.AwsObjectKey.String, failedFolder) {
				t.Error("aws object key has invalid value")
			}
		})
	}
}

func TestProcessFileService_copyFileInPartnerBucketToFailedFolder(t *testing.T) {
	ctx := context.Background()
	bucketFolder := &pophealthsql.BucketFolder{
		ID:           1,
		Name:         "Test Bucket",
		S3BucketName: "test-bucket",
	}
	fileName := "test_file.csv"
	awsObjectKey := "load/" + fileName
	tests := []struct {
		name          string
		aws           *mockAWSFileService
		db            *mockDBFileService
		popHealthFile *pophealthsql.File

		hasError bool
	}{
		{
			name: "happy path",
			aws:  &mockAWSFileService{},
			db: &mockDBFileService{
				getBucketFolderResp: bucketFolder,
			},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				Filename:     fileName,
				AwsObjectKey: sqltypes.ToValidNullString(awsObjectKey),
			},
		},
		{
			name: "error getting bucket folder",
			db: &mockDBFileService{
				err: errInternalTest,
			},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				Filename:     fileName,
				AwsObjectKey: sqltypes.ToValidNullString(awsObjectKey),
			},
			hasError: true,
		},
		{
			name: "error copying the file",
			aws: &mockAWSFileService{
				errCopyFile: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp: bucketFolder,
			},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				Filename:     fileName,
				AwsObjectKey: sqltypes.ToValidNullString(awsObjectKey),
			},
			hasError: true,
		},
		{
			name: "error updating the file in db",
			aws:  &mockAWSFileService{},
			db: &mockDBFileService{
				getBucketFolderResp:            bucketFolder,
				errUpdateAwsObjectKeyInFilesID: errInternalTest,
			},
			popHealthFile: &pophealthsql.File{
				ID:           1,
				Filename:     fileName,
				AwsObjectKey: sqltypes.ToValidNullString(awsObjectKey),
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:            test.aws,
				db:             test.db,
				exchangeBucket: bucketExchange,
			}
			res, err := s.copyFileInPartnerBucketToFailedFolder(ctx, test.popHealthFile)
			if (err != nil) != test.hasError {
				t.Errorf("expected error:  %t, but got: %t", test.hasError, err != nil)
			}
			if !test.hasError {
				testutils.MustMatch(t, strings.Join([]string{failedFolder, bucketFolder.S3BucketName, fileName}, "/"), res.AwsObjectKey.String)
			}
		})
	}
}

func TestFileServiceProcessResultsFileAsync(t *testing.T) {
	ctx := context.Background()
	resultsFileWithErrorsTemplate := `{
	  "flow_run_id": "%s",
	  "processed_at":"2022-07-29T22:58:07+00:00",
	  "status":"%s",
	  "number_new": %d,
	  "number_deleted": %d,
	  "records":{
	  },
	  "row_errors": [
	      {
	          "field": "dob",
	          "error_code": "err-485",
	          "error":"invalid format",
				"number_failed":5,
				"first_occurrence":1
	      }
	  ],
	  "errors":[
	      {
			"error_code":"err-123",
			"error":"invalid file type",
			"fields": ["first_name","email","dob"]
		  }
	  ]
	}`

	resultsFileWithFileErrors := `{
		"flow_run_id": "%s",
		"processed_at": "2022-11-10T20:42:55.014167+00:00",
		"status":"%s",
		"number_new": %d,
		"number_deleted": %d,
		"records":{
			"new": [],
			"deleted": []
		},
		"row_errors": [],
		"file_errors": [
			{
				"error": "The field X were marked as required but were not present in the file",
				"error_code": "inv-31",
				"fields": [
					"X"
				]
			}
		]
	}`

	deleteResultsFileWithoutErrorsTemplate := `{
		"flow_run_id": "%s",
		"bucket_folder_id": 1,
		"status": "success",
		"number_deleted_by_channel_item_id": {%s},
		"errors": [],
		"processed_at": "2023-02-01T04:24:09.336563+00:00"
	}`

	deleteResultsFileWithErrorsTemplate := `{
		"flow_run_id": "%s",
		"bucket_folder_id": 1,
		"status": "error",
		"number_deleted_by_channel_item_id": {
			"12345MalformedChannelItemID": 0
		},
		"errors": [
			{
				"error": "ValueError(\"invalid literal for int() with base 10: '12345MalformedChannelItemID'\")",
				"error_code": "err-99",
				"fields": []
			}
		],
		"processed_at": "2023-02-01T19:23:26.740730+00:00"
	}`

	totalNewPatients := 2
	totalDeletedPatients := 2
	totalDeletedPatientsRefreshFlow := 0

	folder := &pophealthsql.BucketFolder{
		ID:   1,
		Name: "TestFolder",
	}
	templates := []*pophealthsql.Template{
		{
			ID:            1,
			Name:          "Template1",
			ChannelItemID: 16410,
		},
		{
			ID:            2,
			Name:          "Template2",
			ChannelItemID: 16411,
		},
		{
			ID:            3,
			Name:          "Template3",
			ChannelItemID: 16500,
		},
		{
			ID:            4,
			Name:          "Template4",
			ChannelItemID: 17000,
		},
	}
	duplicateChannelItemTemplates := []*pophealthsql.Template{
		{
			ID:            1,
			Name:          "Template1",
			ChannelItemID: 16410,
		},
		{
			ID:            2,
			Name:          "Template2",
			ChannelItemID: 16411,
		},
		{
			ID:            3,
			Name:          "Template3",
			ChannelItemID: 16500,
		},
		{
			ID:            4,
			Name:          "Template4",
			ChannelItemID: 16410,
		},
	}
	files := []*pophealthsql.File{
		{
			ID:           1,
			AwsObjectKey: sqltypes.ToValidNullString("test/file1.csv"),
		},
		{
			ID:           2,
			AwsObjectKey: sqltypes.ToValidNullString("test/file2.csv"),
		},
	}
	emailNotifications := []string{"test1@test.com", "test2@test.com"}
	tests := []struct {
		name                string
		aws                 *mockAWSFileService
		db                  *mockDBFileService
		mailer              *mockMailerService
		elasticsearch       *mockElasticSearchService
		prefect             *mockPrefectClient
		resultsAWSObjectKey string
		logger              *zap.SugaredLogger

		hasError bool
	}{
		{
			name: "happy path",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "happy path handling row errors",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithErrorsTemplate,
							"432-abc",
							invalidStatus,
							0,
							0,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp:        pophealthsql.File{ID: int64(1)},
				errGetResultCodeByCode: pgx.ErrNoRows,
				createResultCodeResp: pophealthsql.ResultCode{
					ID:              1,
					Code:            "err-485",
					CodeDescription: sql.NullString{String: "invalid format", Valid: true},
					CodeLevel:       CodeLevelRow,
				},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "happy path adding new result code to file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithErrorsTemplate,
							"432-abc",
							errorStatus,
							0,
							0,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "happy path processing results with file errors",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithFileErrors,
							"966be-bee5",
							errorStatus,
							0,
							0,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getResultCodeByCodeResp: pophealthsql.ResultCode{
					Code: "inv31",
				},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getFileAndBucketFolderByFileIDResp: pophealthsql.GetFileAndBucketFolderByFileIDRow{
					TemplateID: sql.NullInt64{Int64: 1, Valid: true},
				},
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name:                "error empty flow run id",
			resultsAWSObjectKey: "results/__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error getting file By Prefect flow run ID",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				errGetFileByPrefectFlowRunID: errInternalTest,
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error not found getting file By Prefect flow run ID",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				errGetFileByPrefectFlowRunID: pgx.ErrNoRows,
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error from common",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:              &mockMailerService{},
			elasticsearch:       &mockElasticSearchService{},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error pulling file from aws",
			aws: &mockAWSFileService{
				errGetS3File: errInternalTest,
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:              &mockMailerService{},
			elasticsearch:       &mockElasticSearchService{},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error unmarshalling json file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						`{"x":@}`,
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:              &mockMailerService{},
			elasticsearch:       &mockElasticSearchService{},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error recovering emails notifications, notification not send",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp:                    pophealthsql.File{ID: int64(1)},
				errGetEmailNotificationsByBucketID: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error recovering file data, notification not send",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				errGetFileAndBucketFolderByFileID: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error sending email",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{sendProcessingReportErr: errInternalTest},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error finding total number of patients in elastic search",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getFileAndBucketFolderByFileIDResp: pophealthsql.GetFileAndBucketFolderByFileIDRow{
					TemplateID: sql.NullInt64{Int64: 1, Valid: true},
				},
			},
			mailer: &mockMailerService{sendProcessingReportErr: errInternalTest},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
				totalPatientsErr: errInternalTest,
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error getting template to fetch number of patients",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithFileErrors,
							"966be-bee5",
							errorStatus,
							0,
							0,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getResultCodeByCodeResp: pophealthsql.ResultCode{
					Code: "inv31",
				},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{
					{pophealthsql.Template{ChannelItemID: 123}, nil},
					{pophealthsql.Template{}, errInternalTest},
				},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getFileAndBucketFolderByFileIDResp: pophealthsql.GetFileAndBucketFolderByFileIDRow{
					TemplateID: sql.NullInt64{Int64: 1, Valid: true},
				},
			},
			mailer:        &mockMailerService{},
			elasticsearch: &mockElasticSearchService{},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemResp: pophealthsql.File{TemplateID: sql.NullInt64{Int64: 1, Valid: true}},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - empty template ID",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - invalid template ID",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemResp: pophealthsql.File{TemplateID: sql.NullInt64{Int64: 2, Valid: true}},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - invalid template error getting template ID",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}, {pophealthsql.Template{}, pgx.ErrNoRows}},
				getOldestFileByStatusWithChannelItemResp: pophealthsql.File{TemplateID: sql.NullInt64{Int64: 2, Valid: true}},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - error pulling template",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{}, pgx.ErrNoRows}},
				getOldestFileByStatusWithChannelItemResp: pophealthsql.File{TemplateID: sql.NullInt64{Int64: 1, Valid: true}},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - error pulling oldest waiting file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: errInternalTest,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "process next waiting file - error calling prefect",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileWithoutErrorsTemplate,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatients,
						),
					),
				),
			},
			db: &mockDBFileService{
				getFileByPrefectFlowResp: pophealthsql.GetFileByPrefectFlowRunIDRow{
					ID:             1,
					Filename:       "testFile.csv",
					AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
					Status:         pophealthsql.FileStatusPreprocess,
					BucketFolderID: 1,
					TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				},
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemResp: pophealthsql.File{TemplateID: sql.NullInt64{Int64: 1, Valid: true}},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(totalDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestErr:                errInternalTest,
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "happy path for refresh flow",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							resultsFileSyncFlow,
							"432-abc",
							successStatus,
							totalNewPatients,
							totalDeletedPatientsRefreshFlow,
						),
					),
				),
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "success",
				},
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(totalNewPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error downloading file for refresh flow",
			aws: &mockAWSFileService{
				errGetS3File: errInternalTest,
			},
			db: &mockDBFileService{
				errGetFileByPrefectFlowRunID: pgx.ErrNoRows,
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error decoding results file for refresh flow",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader("test error decoding"),
				),
			},
			db: &mockDBFileService{
				errGetFileByPrefectFlowRunID: pgx.ErrNoRows,
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: happy path",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: happy path with errors in results file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithErrorsTemplate,
							"432-abc",
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				getTemplatesInBucketFolderResp:      templates,
				activateBucketFolderResp:            *folder,
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: happy path with no files found for bucket",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				getTemplatesInBucketFolderResp:      templates,
				errGetFilesByChannelItemAndBucketID: pgx.ErrNoRows,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: happy path with duplicate channel item in templates",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       duplicateChannelItemTemplates,
				getFilesByChannelItemAndBucketIDResp: files,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error parsing channel item id",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"abc": 964`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				getTemplatesInBucketFolderResp:      templates,
				activateBucketFolderResp:            *folder,
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error in elasticsearch delete flow",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				getTemplatesInBucketFolderResp:      templates,
				activateBucketFolderResp:            *folder,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDErr: errInternalTest,
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error parsing delete results file",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader("error results file"),
				),
			},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error getting bucket folder",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				err: errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error getting email notifications",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                folder,
				errGetEmailNotificationsByBucketID: errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error getting templates",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				errGetTemplatesInBucketFolder:       errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error activating bucket folder",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
				errActivateBucketFolder:              errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDErr: errInternalTest,
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error sending email report",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer: &mockMailerService{
				sendDeletedReportErr: errInternalTest,
			},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error getting files by channel item and bucket",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                 folder,
				getEmailNotificationsByBucketIDResp: emailNotifications,
				getTemplatesInBucketFolderResp:      templates,
				errGetFilesByChannelItemAndBucketID: errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error deleting file from s3",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
				errDeleteS3File: errInternalTest,
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error deleting file by id",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
				deleteFileByIDErr:                    errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "deactivate bucket: error deleting templates by channel item ids",
			aws: &mockAWSFileService{
				getS3FileResp: io.NopCloser(
					strings.NewReader(
						fmt.Sprintf(
							deleteResultsFileWithoutErrorsTemplate,
							"432-abc",
							`"16410": 59,"16411": 964,"16500": 0`,
						),
					),
				),
			},
			db: &mockDBFileService{
				getBucketFolderResp:                  folder,
				getEmailNotificationsByBucketIDResp:  emailNotifications,
				getTemplatesInBucketFolderResp:       templates,
				getFilesByChannelItemAndBucketIDResp: files,
				deleteTemplatesByChannelItemIDsErr:   errInternalTest,
			},
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{},
			},
			mailer:              &mockMailerService{},
			resultsAWSObjectKey: "results/432-abc__delete_results.json",
			logger:              zap.NewNop().Sugar(),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				db:            test.db,
				aws:           test.aws,
				elasticSearch: test.elasticsearch,
				mailer:        test.mailer,
				logger:        test.logger,
				influxScope:   &monitoring.NoopScope{},
				prefectClient: test.prefect,
			}
			s.ProcessResultsFileAsync(ctx, test.resultsAWSObjectKey)
		})
	}
}

func TestFileServiceCommonProcessResultsFile(t *testing.T) {
	countNewPatients := 1
	countDeletedPatients := 1
	ctx := context.Background()
	flowIDRun := "123456-abc"
	validFileParameters := pgtype.JSONB{
		Bytes:  []byte(`{"start_date": {"year": 2020, "month": 1, "day": 1}, "end_date": {"year": 2020, "month": 1, "day": 31}}`),
		Status: pgtype.Present,
	}
	invalidFileParameters := pgtype.JSONB{
		Bytes:  []byte("invalid"),
		Status: pgtype.Present,
	}
	tests := []struct {
		name                string
		results             Results
		popHealthFile       pophealthsql.GetFileByPrefectFlowRunIDRow
		aws                 *mockAWSFileService
		db                  *mockDBFileService
		backfillService     *mockBackfillService
		mailer              *mockMailerService
		elasticsearch       *mockElasticSearchService
		prefect             *mockPrefectClient
		resultsAWSObjectKey string
		logger              *zap.SugaredLogger

		hasError bool
	}{
		{
			name: "happy path",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getFileByIDResp:                         pophealthsql.File{ID: int64(1)},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            false,
		},
		{
			name: "happy path with backfill file",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: 0,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				IsBackfill:     true,
				FileParameters: validFileParameters,
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getFileByIDResp: pophealthsql.File{ID: int64(1), IsBackfill: true},
			},
			backfillService: &mockBackfillService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "OK",
				},
			},
			logger: zap.NewNop().Sugar(),
		},
		{
			name: "error unmarshalling file parameters to process backfill file",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: 0,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				IsBackfill:     true,
				FileParameters: invalidFileParameters,
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getFileByIDResp: pophealthsql.File{ID: int64(1), IsBackfill: true},
			},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "OK",
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error starting backfill process",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: 0,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
				IsBackfill:     true,
				FileParameters: validFileParameters,
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getFileByIDResp: pophealthsql.File{ID: int64(1), IsBackfill: true},
			},
			backfillService: &mockBackfillService{
				startBackfillErr: errors.New("error starting backfill"),
			},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "OK",
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "saving error details when uncaught error throws",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors: nil,
				FileErrors: []FileError{
					{
						Fields: []string{},
						ResultCode: ResultCode{
							Code:        "Err-99",
							Description: "An error occurred test description",
						},
					},
				},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getResultCodeByCodeResp: pophealthsql.ResultCode{
					Code: uncaughtErrorCode,
				},
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			prefect: &mockPrefectClient{
				buildPrefectRequestResponse: []byte("test request"),
				doRequestResponse:           "flow-id",
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            false,
		},
		{
			name: "error new patients doesn't match",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients + 1,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"def"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:              &mockMailerService{},
			elasticsearch:       &mockElasticSearchService{},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error deleted patients doesn't match",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients + 1,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"def"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer:              &mockMailerService{},
			elasticsearch:       &mockElasticSearchService{},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error updating file",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp:   pophealthsql.File{ID: int64(1)},
				errUpdateFileByID: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error getting result code by code",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors: nil,
				FileErrors: []FileError{
					{
						Fields: []string{"dob"},
						ResultCode: ResultCode{
							Code:        "test",
							Description: "test",
						},
					},
				},
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				errGetResultCodeByCode: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error adding new result code to db",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors: nil,
				FileErrors: []FileError{
					{
						Fields: []string{"dob"},
						ResultCode: ResultCode{
							Code:        "test",
							Description: "test",
						},
					},
				},
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp:        pophealthsql.File{ID: int64(1)},
				errGetResultCodeByCode: pgx.ErrNoRows,
				errCreateResultCode:    errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error adding result codes to a file",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors: nil,
				FileErrors: []FileError{
					{
						Fields: []string{"dob"},
						ResultCode: ResultCode{
							Code:        "test",
							Description: "test",
						},
					},
				},
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp:        pophealthsql.File{ID: int64(1)},
				errAddFilesResultCodes: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error adding result codes to a file with occurrences",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors: []RowError{
					{
						Field:           "dob",
						NumberFailed:    1,
						FirstOccurrence: 1,
						ResultCode: ResultCode{
							Code:        "test",
							Description: "test",
						},
					},
				},
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp:               pophealthsql.File{ID: int64(1)},
				errAddFilesResultCodesWithOcc: errInternalTest,
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
			hasError:            true,
		},
		{
			name: "error elastic search patients created don't match",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(0)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(countDeletedPatients)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
		{
			name: "error elastic search patients deleted don't match",
			results: Results{
				FlowRunID:     flowIDRun,
				ProcessedAt:   time.Now(),
				Status:        successStatus,
				NumberNew:     countNewPatients,
				NumberDeleted: countDeletedPatients,
				Records: ResultsRecords{
					New: []*Patient{{
						RowHash: "abc",
					}},
					Deleted: []string{"abc"},
				},
				RowErrors:  nil,
				FileErrors: nil,
			},
			popHealthFile: pophealthsql.GetFileByPrefectFlowRunIDRow{
				ID:             1,
				Filename:       "testFile.csv",
				AwsObjectKey:   sql.NullString{String: "load/testFile_123.csv", Valid: true},
				Status:         pophealthsql.FileStatusPreprocess,
				BucketFolderID: 1,
				TemplateID:     sql.NullInt64{Int64: 1, Valid: true},
			},
			aws: &mockAWSFileService{},
			db: &mockDBFileService{
				getFileByIDResp: pophealthsql.File{ID: int64(1)},
				getTemplateByIDResp: []struct {
					pophealthsql.Template
					error
				}{{pophealthsql.Template{ChannelItemID: 123}, nil}},
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
			},
			mailer: &mockMailerService{},
			elasticsearch: &mockElasticSearchService{
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(countNewPatients)},
				},
				bulkDeleteResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumDeleted: uint64(0)},
				},
			},
			resultsAWSObjectKey: "results/testFile_123__results.json",
			logger:              zap.NewNop().Sugar(),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				aws:           test.aws,
				db:            test.db,
				backfill:      test.backfillService,
				elasticSearch: test.elasticsearch,
				mailer:        test.mailer,
				logger:        test.logger,
				prefectClient: test.prefect,
				influxScope:   &monitoring.NoopScope{},
			}
			err := s.commonProcessResultsFile(ctx, test.results, &test.popHealthFile)
			if (err != nil) != test.hasError {
				t.Errorf("expeccted error:  %v, but got: %v", test.hasError, err)
			}
		})
	}
}

func TestFileServiceSyncPatientsProcessResultsFile(t *testing.T) {
	ctx := context.Background()
	invalidTotalNewPatients := 2
	totalDeletedPatients := 0
	patient := []*Patient{
		{
			PatientHash:   "abc",
			FirstName:     "Luis",
			LastName:      "Perez",
			DOB:           "1989-01-01",
			ChannelItemID: 1,
			MarketID:      2,
		},
	}
	tests := []struct {
		name          string
		elasticsearch *mockElasticSearchService
		results       Results

		hasError bool
	}{
		{
			name: "happy path",
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "success",
				},
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumIndexed: uint64(len(patient))},
				},
			},
			results: Results{
				NumberNew:     len(patient),
				NumberDeleted: totalDeletedPatients,
				Records: ResultsRecords{
					New: patient,
				},
			},
		},
		{
			name: "no new records in results file",
			results: Results{
				Records: ResultsRecords{
					New: []*Patient{},
				},
			},
			hasError: true,
		},
		{
			name: "error validating results",
			results: Results{
				NumberNew:     invalidTotalNewPatients,
				NumberDeleted: totalDeletedPatients,
				Records: ResultsRecords{
					New: patient,
				},
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				elasticSearch: test.elasticsearch,
				logger:        zap.NewNop().Sugar(),
			}
			err := s.syncPatientsProcessResultsFile(ctx, test.results)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

func TestFileServiceSyncPatientsByChannelItem(t *testing.T) {
	ctx := context.Background()
	channelItemID := int64(1)
	patientRecords := []*Patient{
		{
			PatientHash:   "abc",
			FirstName:     "Luis",
			LastName:      "Perez",
			DOB:           "1989-01-01",
			ChannelItemID: 1,
			MarketID:      2,
		},
	}
	tests := []struct {
		name          string
		elasticsearch *mockElasticSearchService

		hasError bool
	}{
		{
			name: "happy path",
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "success",
				},
				bulkUpsertResponse: ESBulkResponse{
					Stats: esutil.BulkIndexerStats{NumAdded: 1},
				},
			},
		},
		{
			name: "error deleting patients",
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error creating patients",
			elasticsearch: &mockElasticSearchService{
				deleteByChannelItemIDRespose: ESResponse{
					StatusCode: 200,
					Status:     "success",
				},
				bulkUpsertErr: errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			s := ProcessFileService{
				elasticSearch: test.elasticsearch,
				logger:        zap.NewNop().Sugar(),
			}
			err := s.syncPatientsByChannelItem(ctx, patientRecords, channelItemID, PatientIndexKey)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

func getAWSObjectKey() sql.NullString {
	return sql.NullString{String: "load/partner/file.csv", Valid: true}
}

func TestGetFlowRunIDFromObjectKey(t *testing.T) {
	tests := []struct {
		name         string
		objectKey    string
		isDeleteFlow bool

		expected string
	}{
		{
			name:      "happy path",
			objectKey: "results/002f115c-f570-4ab6-ab60-8eaf80fa18e1__results.json",
			expected:  "002f115c-f570-4ab6-ab60-8eaf80fa18e1",
		},
		{
			name:      "empty response",
			objectKey: "results/__results.json",
			expected:  "",
		},
		{
			name:      "happy path without path",
			objectKey: "002f115c-f570-4ab6-ab60-8eaf80fa18e1__results.json",
			expected:  "002f115c-f570-4ab6-ab60-8eaf80fa18e1",
		},
		{
			name:      "empty input empty response",
			objectKey: "",
			expected:  "",
		},
		{
			name:         "happy path with delete flow",
			objectKey:    "results/002f115c-f570-4ab6-ab60-8eaf80fa18e1__delete_results.json",
			isDeleteFlow: true,
			expected:     "002f115c-f570-4ab6-ab60-8eaf80fa18e1",
		},
		{
			name:         "empty response with delete flow",
			objectKey:    "results/__delete_results.json",
			isDeleteFlow: true,
			expected:     "",
		},
		{
			name:         "happy path without path with delete flow",
			objectKey:    "002f115c-f570-4ab6-ab60-8eaf80fa18e1__delete_results.json",
			isDeleteFlow: true,
			expected:     "002f115c-f570-4ab6-ab60-8eaf80fa18e1",
		},
		{
			name:         "empty input empty response with delete flow",
			objectKey:    "",
			isDeleteFlow: true,
			expected:     "",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := getFlowRunIDFromObjectKey(test.objectKey, test.isDeleteFlow)
			if got != test.expected {
				t.Errorf("expected %s but got %s", test.expected, got)
			}
		})
	}
}

func TestIsDeletedResultFile(t *testing.T) {
	tests := []struct {
		name      string
		objectKey string

		expected bool
	}{
		{
			name:      "match delete results regex",
			objectKey: "results/1738a-4612b__delete_results.json",
			expected:  true,
		},
		{
			name:      " no match, invalid folder",
			objectKey: "abc/1738a-4612b__delete_results.json",
		},
		{
			name:      " no match, invalid suffix",
			objectKey: "results/1738a-4612b_results.json",
		},
		{
			name:      " no match, invalid flow id",
			objectKey: "results/1738g-4612b__delete_results.json",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := isDeletedResultFile(test.objectKey)
			testutils.MustMatch(t, test.expected, got)
		})
	}
}

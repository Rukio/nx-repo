package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"

	"github.com/elastic/go-elasticsearch/v7/esutil"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/mailer"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

const (
	resultsSuccess  = "success"
	resultsInvalid  = "invalid"
	processedFolder = "processed"
	failedFolder    = "failed"
	loadFolder      = "load"
	importFolder    = "import"

	CodeLevelRow  = "row"
	CodeLevelFile = "file"

	exchangeBucketName = "exchange bucket"

	sourceFilePointName  = "sourceFile"
	resultsFilePointName = "resultsFile"
	awsBucketTag         = "aws_bucket"
	awsFileTag           = "aws_file"
	popHealthFileNameTag = "file_name"
	latencyFieldName     = "duration_ms"
	countFieldName       = "count"
	errorDescription     = "error"
	processServiceSource = "process_service"

	// Result Codes.
	templateNotFoundFailCode       = "Int-01"
	prefectBuildingRequestFailCode = "Int-02"
	prefectCallingFileFailCode     = "Int-03"
	elasticsearchAddFailCode       = "Int-04"
	elasticsearchDeleteFailCode    = "Int-05"
	movingToProcessedFailCode      = "Int-07"
	resultsFileInvalidCode         = "Int-08"
	otherFilesProcessingFailCode   = "Int-09"
	copyFileToExchangeBucketCode   = "Int-10"
	timeoutExceededCode            = "Int-11"
	gettingResultsFileCode         = "Int-12"
	unmarshallingResultsFileCode   = "Int-13"
	expiredFileCode                = "Int-14"
	startBackfillFailedCode        = "Int-15"
	uncaughtErrorCode              = "err-99"
)

type awsFileService interface {
	CopyFile(ctx context.Context, copySource string, destBucket string, destKey string) error
	GetS3File(ctx context.Context, bucketName, objectKey string) (io.ReadCloser, error)
	DeleteS3File(context.Context, string, string) error
}

type templateService interface {
	FindTemplateByFile(context.Context, UpdateFileByTemplateRequest) (*pophealthsql.Template, error)
	UpdateFileByTemplate(ctx context.Context, fileID, templateID int64) (*pophealthsql.File, error)
}

type dbFileService interface {
	GetBucketFolderByID(context.Context, int64) (*pophealthsql.BucketFolder, error)
	GetBucketFolderByS3BucketName(ctx context.Context, s3BucketName string) (*pophealthsql.BucketFolder, error)
	AddFile(ctx context.Context, arg pophealthsql.AddFileParams) (*pophealthsql.File, error)
	UpdateFileStartProcessingByID(ctx context.Context, arg pophealthsql.UpdateFileStartProcessingByIDParams) (*pophealthsql.File, error)
	UpdateFileStatusByID(ctx context.Context, arg pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error)
	UpdateAwsObjectKeyInFilesByID(context.Context, pophealthsql.UpdateAwsObjectKeyInFilesByIDParams) (*pophealthsql.File, error)
	GetFileByPrefectFlowRunID(ctx context.Context, prefectFlowRunID sql.NullString) (*pophealthsql.GetFileByPrefectFlowRunIDRow, error)
	UpdateFileByID(context.Context, pophealthsql.UpdateFileByIDParams) (*pophealthsql.File, error)
	GetResultCodeByCode(context.Context, string) (*pophealthsql.ResultCode, error)
	CreateResultCode(context.Context, pophealthsql.CreateResultCodeParams) (*pophealthsql.ResultCode, error)
	AddFilesResultCodes(context.Context, pophealthsql.AddFilesResultCodesParams) (*pophealthsql.FilesResultCode, error)
	AddFilesResultCodesWithOccurrences(ctx context.Context, arg pophealthsql.AddFilesResultCodesWithOccurrencesParams) (*pophealthsql.FilesResultCode, error)
	GetFileByID(context.Context, int64) (*pophealthsql.File, error)
	GetFileAndBucketFolderByFileID(context.Context, int64) (*pophealthsql.GetFileAndBucketFolderByFileIDRow, error)
	GetFileResultCodesWithCodeDetailsByFileID(context.Context, int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error)
	GetEmailNotificationsByBucketID(context.Context, int64) ([]string, error)
	IsHealthy(context.Context) bool
	GetFileByBucketAndObjectKey(context.Context, pophealthsql.GetFileByBucketAndObjectKeyParams) (*pophealthsql.File, error)
	GetTemplateByID(context.Context, int64) (*pophealthsql.Template, error)
	GetOldestFileByStatusWithChannelItem(context.Context, pophealthsql.GetOldestFileByStatusWithChannelItemParams) (*pophealthsql.File, error)
	GetExpiredFiles(context.Context, time.Time) ([]*pophealthsql.GetExpiredFilesRow, error)
	GetTemplatesInBucketFolder(context.Context, int64) ([]*pophealthsql.Template, error)
	ActivateBucketFolder(context.Context, int64) (*pophealthsql.BucketFolder, error)
	GetFilesByChannelItemAndBucketID(context.Context, pophealthsql.GetFilesByChannelItemAndBucketIDParams) ([]*pophealthsql.File, error)
	DeleteFileByID(context.Context, int64) (*pophealthsql.File, error)
	DeleteTemplatesByChannelItemIDs(context.Context, []int64) ([]*pophealthsql.Template, error)
}

type prefectService interface {
	BuildSyncPatientsPrefectRequest(int64) ([]byte, error)
	BuildDeactivateBucketPrefectRequest(int64, []int64) ([]byte, error)
	BuildPrefectRequest(pophealthsql.Template, pophealthsql.File, pophealthsql.BucketFolder) ([]byte, error)
	DoRequest(context.Context, []byte) (FlowID, error)
}

type elasticSearchService interface {
	DeleteByChannelItemID(context.Context, PopHealthIndexKey, int64) (*ESResponse, error)
	BulkUpsert(context.Context, PopHealthIndexKey, []*Patient, int64) (*ESBulkResponse, error)
	BulkDelete(context.Context, PopHealthIndexKey, []string, int64) (*ESBulkResponse, error)
	GetPatientCountByChannelItem(context.Context, PopHealthIndexKey, int64) (*ESTotalPatientsResponse, error)
	NewBulkIndexer(PopHealthIndexKey) (esutil.BulkIndexer, error)
}

type mailerService interface {
	SendProcessingReport(ctx context.Context, params mailer.SendProcessingReportParams) error
	SendDeletedReport(ctx context.Context, params mailer.DeletedMailParams) error
}

type backfillService interface {
	StartBackfill(context.Context, *partnerpb.StartBackfillRequest, ...grpc.CallOption) (*partnerpb.StartBackfillResponse, error)
}

type Results struct {
	FlowRunID     string         `json:"flow_run_id"`
	ProcessedAt   time.Time      `json:"processed_at"`
	Status        string         `json:"status"`
	Refresh       bool           `json:"refresh"`
	NumberNew     int            `json:"number_new"`
	NumberDeleted int            `json:"number_deleted"`
	NumberUpdated int            `json:"number_updated"`
	Records       ResultsRecords `json:"records"`
	RowErrors     []RowError     `json:"row_errors"`
	FileErrors    []FileError    `json:"file_errors"`
}

type ResultsRecords struct {
	New     []*Patient `json:"new"`
	Deleted []string   `json:"deleted"`
}

type Patient struct {
	PatientHash    string `json:"patient_hash"`
	RowHash        string `json:"row_hash"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	DOB            string `json:"dob"`
	Gender         string `json:"gender"`
	SSN            string `json:"ssn"`
	StreetAddress1 string `json:"street_address_1"`
	StreetAddress2 string `json:"street_address_2"`
	City           string `json:"city"`
	State          string `json:"state"`
	Zipcode        string `json:"zipcode"`
	MemberID       string `json:"member_id"`
	Email          string `json:"email"`
	ChannelItemID  int    `json:"channel_item_id,string"`
	MarketID       int    `json:"market_id,string"`
}

type RowError struct {
	Field           string `json:"field"`
	NumberFailed    int    `json:"number_failed"`
	FirstOccurrence int    `json:"first_occurrence"`
	ResultCode
}

type ResultCode struct {
	Code        string `json:"error_code"`
	Description string `json:"error"`
}

type FileError struct {
	Fields []string `json:"fields"`
	ResultCode
}

type ProcessFileDependencies struct {
	Aws              awsFileService
	TemplatesService templateService
	DBService        dbFileService
	BackfillService  backfillService
	PrefectClient    prefectService
	ElasticSearch    elasticSearchService
	Mailer           mailerService
	Scope            monitoring.Scope
}

type ProcessFileService struct {
	aws            awsFileService
	templates      templateService
	db             dbFileService
	backfill       backfillService
	prefectClient  prefectService
	elasticSearch  elasticSearchService
	mailer         mailerService
	exchangeBucket string
	logger         *zap.SugaredLogger
	influxScope    monitoring.Scope
}

func NewProcessFileService(
	dependencies ProcessFileDependencies,
	exchangeBucket string,
	logger *zap.SugaredLogger,
) *ProcessFileService {
	if dependencies.Scope == nil {
		dependencies.Scope = &monitoring.NoopScope{}
	}
	return &ProcessFileService{
		aws:            dependencies.Aws,
		templates:      dependencies.TemplatesService,
		db:             dependencies.DBService,
		backfill:       dependencies.BackfillService,
		prefectClient:  dependencies.PrefectClient,
		elasticSearch:  dependencies.ElasticSearch,
		mailer:         dependencies.Mailer,
		exchangeBucket: exchangeBucket,
		logger:         logger,
		influxScope:    dependencies.Scope,
	}
}

func (f *ProcessFileService) IsDBHealthy(ctx context.Context) bool {
	return f.db.IsHealthy(ctx)
}

func (f *ProcessFileService) ProcessSourceFile(
	ctx context.Context,
	s3BucketName, objectKey string,
) error {
	var err error
	startTime := time.Now()
	defer func() {
		f.influxScope.WritePoint(
			sourceFilePointName,
			monitoring.Tags{
				awsBucketTag:         s3BucketName,
				popHealthFileNameTag: getFileNameFromObjectKey(objectKey),
			},
			monitoring.Fields{
				latencyFieldName: time.Since(startTime).Milliseconds(),
				countFieldName:   1,
				errorDescription: err,
			},
		)
	}()
	bucket, err := f.db.GetBucketFolderByS3BucketName(ctx, s3BucketName)
	if err != nil {
		return fmt.Errorf(
			"error getting bucket folder by s3 bucket name. s3BucketName: %s. Error: %w",
			s3BucketName,
			err,
		)
	}

	if bucket.DeactivatedAt.Valid {
		return fmt.Errorf(
			"bucket folder %s is not active. s3BucketName: %s",
			bucket.Name,
			s3BucketName,
		)
	}

	unEscapedObjectKey, err := url.QueryUnescape(objectKey)
	if err != nil {
		return fmt.Errorf(
			"error unescaping object key. objectKey: %s. Error: %w",
			objectKey,
			err,
		)
	}

	fileParam := pophealthsql.File{
		Filename:       getFileNameFromObjectKey(unEscapedObjectKey),
		AwsObjectKey:   sqltypes.ToValidNullString(unEscapedObjectKey),
		BucketFolderID: bucket.ID,
	}
	err = f.processFile(ctx, &fileParam)
	return err
}

func (f *ProcessFileService) processFile(
	ctx context.Context,
	fileParam *pophealthsql.File,
) error {
	file, err := f.fileToUpdate(ctx, fileParam)
	if err != nil {
		return fmt.Errorf(
			"error finding file to update. fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			fileParam.Filename,
			fileParam.AwsObjectKey.String,
			fileParam.BucketFolderID,
			err,
		)
	}

	if file != nil {
		file, err = f.updateFile(ctx, file)
	} else {
		file, err = f.addFile(ctx, fileParam)
	}

	if err != nil {
		return fmt.Errorf(
			"error adding/updating file. fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			fileParam.Filename,
			fileParam.AwsObjectKey.String,
			fileParam.BucketFolderID,
			err,
		)
	}

	fileParam.ID = file.ID

	defer f.sendNotification(ctx, file.ID, mailer.PatientCount{Valid: false}, true)

	var template *pophealthsql.Template
	if file.TemplateID.Valid {
		template, err = f.findTemplate(ctx, file)
	} else {
		file, template, err = f.findAndUpdateFileTemplate(ctx, file)
	}
	if err != nil {
		return fmt.Errorf(
			"error finding/updating file template. fileID: %d, fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			fileParam.ID,
			fileParam.Filename,
			fileParam.AwsObjectKey.String,
			fileParam.BucketFolderID,
			err,
		)
	}

	file, err = f.copyFileToExchangeBucket(ctx, file)
	if err != nil {
		f.updateFileFailureByID(ctx, fileParam.ID)
		f.UpdateFileWithInternalResultCode(ctx, fileParam.ID, copyFileToExchangeBucketCode)
		return fmt.Errorf(
			"error copying s3 object to exchange bucket. fileID: %d, fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			fileParam.ID,
			fileParam.Filename,
			fileParam.AwsObjectKey.String,
			fileParam.BucketFolderID,
			err,
		)
	}

	existsOtherFileInProcess, err := f.existsFileInProcessStatus(ctx, template.ChannelItemID)
	if err != nil {
		f.updateFileFailureByID(ctx, file.ID)
		f.UpdateFileWithInternalResultCode(ctx, file.ID, otherFilesProcessingFailCode)
		return fmt.Errorf(
			"error checking if other files are processing. fileID: %d, fileName: %s, channelItemID: %d, bucketFolderID: %d. Error: %w",
			fileParam.ID,
			fileParam.Filename,
			template.ChannelItemID,
			fileParam.BucketFolderID,
			err,
		)
	}

	if file.IsBackfill || !existsOtherFileInProcess {
		go func() {
			err := f.performPrefectRequest(context.Background(), template, file)
			if err != nil {
				f.logger.Errorw("error calling prefect to process file",
					"file_id", file.ID,
					"channel_item_id", template.ChannelItemID,
					"source", processServiceSource,
					"type", "prefect",
					zap.Error(err),
				)
			}
		}()
	} else {
		_, err = f.updateFileStatus(ctx, file.ID, pophealthsql.FileStatusWaiting)
	}

	return err
}

func (f *ProcessFileService) findTemplate(
	ctx context.Context,
	file *pophealthsql.File,
) (*pophealthsql.Template, error) {
	template, err := f.db.GetTemplateByID(ctx, file.TemplateID.Int64)
	if err != nil {
		f.updateFileFailureByID(ctx, file.ID)
		f.UpdateFileWithInternalResultCode(ctx, file.ID, templateNotFoundFailCode)
		return nil, fmt.Errorf("error finding template for %s file with ID %d: %w", file.Filename, file.ID, err)
	}

	return template, nil
}

func (f *ProcessFileService) findAndUpdateFileTemplate(
	ctx context.Context,
	file *pophealthsql.File,
) (*pophealthsql.File, *pophealthsql.Template, error) {
	updateFileRequest := UpdateFileByTemplateRequest{
		fileName: file.Filename,
		bucketID: file.BucketFolderID,
	}
	template, err := f.templates.FindTemplateByFile(ctx, updateFileRequest)
	if err != nil {
		if errors.Is(err, ErrTemplateNotFound) {
			f.updateFileFailureByID(ctx, file.ID)
		}
		f.UpdateFileWithInternalResultCode(ctx, file.ID, templateNotFoundFailCode)
		if _, err := f.copyFileInPartnerBucketToFailedFolder(ctx, file); err != nil {
			f.logger.Errorw("error copying file to failed folder",
				"source", processServiceSource,
				"fileID", file.ID,
				"fileName", file.Filename,
				"fileObjectKey", file.AwsObjectKey,
				zap.Error(err),
			)
		}
		return nil, nil, fmt.Errorf("error finding template for %s file with ID %d: %w", file.Filename, file.ID, err)
	}

	file, err = f.templates.UpdateFileByTemplate(ctx, file.ID, template.ID)
	if err != nil {
		return nil, nil, fmt.Errorf("error updating file %s with template ID %d :%w", file.Filename, template.ID, err)
	}

	return file, template, nil
}

func (f *ProcessFileService) addFile(
	ctx context.Context,
	fileParam *pophealthsql.File,
) (*pophealthsql.File, error) {
	fileParametersJSON, err := json.Marshal(pophealthpb.FileParameters{})
	if err != nil {
		return nil, errors.New("error marshalling file parameters")
	}

	addFileArgs := pophealthsql.AddFileParams{
		Filename:       fileParam.Filename,
		Status:         pophealthsql.FileStatusPreprocess,
		BucketFolderID: fileParam.BucketFolderID,
		AwsObjectKey:   fileParam.AwsObjectKey,
		FileParameters: pgtype.JSONB{
			Bytes:  fileParametersJSON,
			Status: pgtype.Present,
		},
	}
	file, err := f.db.AddFile(ctx, addFileArgs)
	if err != nil {
		return nil, fmt.Errorf("error inserting %s file in db: %w", fileParam.Filename, err)
	}

	return file, nil
}

func (f *ProcessFileService) updateFile(
	ctx context.Context,
	fileParam *pophealthsql.File,
) (*pophealthsql.File, error) {
	file, err := f.updateFileStatus(ctx, fileParam.ID, pophealthsql.FileStatusPreprocess)
	if err != nil {
		return nil, fmt.Errorf("error updating %s file in db: %w", fileParam.Filename, err)
	}
	return file, nil
}

func (f *ProcessFileService) fileToUpdate(
	ctx context.Context,
	fileParam *pophealthsql.File,
) (*pophealthsql.File, error) {
	searchFileArgs := pophealthsql.GetFileByBucketAndObjectKeyParams{
		BucketFolderID: fileParam.BucketFolderID,
		AwsObjectKey:   fileParam.AwsObjectKey,
		Status:         pophealthsql.FileStatusNew,
	}
	file, err := f.db.GetFileByBucketAndObjectKey(ctx, searchFileArgs)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("error happened trying to get file by bucket and object key %w", err)
		}
		return nil, nil
	}

	return file, nil
}

func (f *ProcessFileService) ProcessResultsFileAsync(ctx context.Context, resultsAWSObjectKey string) {
	var err error
	var results Results
	var deleteResults DeleteResult
	var popHealthFile *pophealthsql.GetFileByPrefectFlowRunIDRow
	startTime := time.Now()
	isDeleteFlow := isDeletedResultFile(resultsAWSObjectKey)
	defer func() {
		var completeTimeTaken time.Duration
		if popHealthFile == nil {
			popHealthFile = &pophealthsql.GetFileByPrefectFlowRunIDRow{}
		} else {
			completeTimeTaken = time.Since(popHealthFile.CreatedAt)
			h := int64(completeTimeTaken.Round(time.Hour).Hours())
			m := int64((completeTimeTaken - (time.Duration(h) * time.Hour)).Round(time.Minute).Minutes())
			f.logger.Infow("time taken to process file since created",
				"file_name", popHealthFile.Filename,
				"time", fmt.Sprintf("%02d hours, %02d minutes", h, m))
		}
		f.influxScope.WritePoint(
			resultsFilePointName,
			monitoring.Tags{
				awsFileTag:           resultsAWSObjectKey,
				popHealthFileNameTag: popHealthFile.Filename,
				awsBucketTag:         f.exchangeBucket,
			},
			monitoring.Fields{
				"result_file_status":     results.Status,
				"total_new_records":      results.NumberNew,
				"total_deleted_records":  results.NumberDeleted,
				"time_since_created_sec": int64(completeTimeTaken.Round(time.Second).Seconds()),
				latencyFieldName:         time.Since(startTime).Milliseconds(),
				countFieldName:           1,
				errorDescription:         err,
			},
		)
	}()
	flowRunID := getFlowRunIDFromObjectKey(resultsAWSObjectKey, isDeleteFlow)
	if flowRunID == "" {
		err = fmt.Errorf("flow run id is empty in results file")
		f.logger.Errorw("error getting flow run id",
			"file_name", getFileNameFromObjectKey(resultsAWSObjectKey),
			zap.Error(err))
		return
	}

	awsDownloadFailure := false
	awsFile, err := f.aws.GetS3File(ctx, f.exchangeBucket, resultsAWSObjectKey)
	if err != nil {
		f.logger.Errorw("error downloading results file",
			"aws_object_key", resultsAWSObjectKey,
			"source", processServiceSource,
			zap.Error(err),
		)
		awsDownloadFailure = true
	}

	decodeResultsFileFailure := false
	if !awsDownloadFailure {
		defer awsFile.Close()

		if isDeleteFlow {
			err = json.NewDecoder(awsFile).Decode(&deleteResults)
		} else {
			err = json.NewDecoder(awsFile).Decode(&results)
		}
		if err != nil {
			f.logger.Errorw("error decoding results file",
				"file_name", getFileNameFromObjectKey(resultsAWSObjectKey),
				"source", processServiceSource,
				zap.Error(err))
			decodeResultsFileFailure = true
		}
	}

	if isDeleteFlow && (awsDownloadFailure || decodeResultsFileFailure) {
		f.logger.Errorw("error downloading or decoding results file",
			"source", processServiceSource,
			"delete", true,
			"flowRunID", flowRunID,
			zap.Error(err),
		)
		return
	}

	if isDeleteFlow {
		f.deactivateBucketProcessResultFile(ctx, flowRunID, deleteResults)
		return
	}

	if !awsDownloadFailure && !decodeResultsFileFailure && results.Refresh {
		if err := f.syncPatientsProcessResultsFile(ctx, results); err != nil {
			f.logger.Errorw("error syncing patients",
				"source", processServiceSource,
				"refresh", true,
				zap.Error(err),
			)
		}
		return
	}

	fileNotFound := false
	popHealthFile, err = f.db.GetFileByPrefectFlowRunID(ctx, sqltypes.ToValidNullString(flowRunID))
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			f.logger.Errorw("error pulling file data from db",
				" prefect_flow_run_id", flowRunID,
				"source", processServiceSource,
				zap.Error(err),
			)
			return
		}
		f.logger.Errorw("no file matched by Prefect flow run ID",
			"prefect_flow_run_id", flowRunID,
			"source", processServiceSource)
		fileNotFound = true
	}

	if fileNotFound && (awsDownloadFailure || decodeResultsFileFailure) {
		f.logger.Errorw("error downloading or decoding results file",
			"source", processServiceSource,
			"refresh", true,
			"awsDownloadFailure", awsDownloadFailure,
			"decodeResultsFileFailure", decodeResultsFileFailure,
		)
		return
	}

	if fileNotFound {
		return
	}

	validPatientCount := true
	currentPopulation, err := f.getCurrentPopulation(ctx, popHealthFile)
	if err != nil {
		f.logger.Errorw("error getting current population",
			"source", processServiceSource,
			zap.Error(err),
		)
		validPatientCount = false
	}
	defer f.sendNotification(ctx, popHealthFile.ID, mailer.PatientCount{Int32: currentPopulation, Valid: validPatientCount}, false)

	if !popHealthFile.IsBackfill {
		defer f.processNextWaitingFile(ctx, popHealthFile.TemplateID.Int64)
	}

	if awsDownloadFailure {
		f.updateFileFailureByID(ctx, popHealthFile.ID)
		f.UpdateFileWithInternalResultCode(ctx, popHealthFile.ID, gettingResultsFileCode)
		return
	}

	if decodeResultsFileFailure {
		f.updateFileFailureByID(ctx, popHealthFile.ID)
		f.UpdateFileWithInternalResultCode(ctx, popHealthFile.ID, unmarshallingResultsFileCode)
		return
	}

	err = f.commonProcessResultsFile(ctx, results, popHealthFile)
	if err != nil {
		f.logger.Errorw("error processing results file", zap.Error(err))
	}
}

func (f *ProcessFileService) syncPatientsProcessResultsFile(ctx context.Context, results Results) error {
	if results.Status == "error" || len(results.Records.New) == 0 {
		return fmt.Errorf("error in sync results file. flowID: %s status: %s newPatients: %d",
			results.FlowRunID,
			results.Status,
			results.NumberNew,
		)
	}

	channelItemID := results.Records.New[0].ChannelItemID
	errs := validateResults(results)
	if errs != nil {
		var errStrings []string
		for _, e := range errs {
			errStrings = append(errStrings, e.Error())
		}
		return fmt.Errorf("invalid result file on syncPatientsProcessResultsFile errors: %s channelItemID: %d",
			strings.Join(errStrings, "\n"),
			channelItemID,
		)
	}

	return f.syncPatientsByChannelItem(ctx, results.Records.New, int64(channelItemID), PatientIndexKey)
}

func (f *ProcessFileService) commonProcessResultsFile(ctx context.Context, results Results, popHealthFile *pophealthsql.GetFileByPrefectFlowRunIDRow) error {
	var err error
	defer func() {
		file, _ := f.db.GetFileByID(ctx, popHealthFile.ID)
		_, err := f.moveFileInExchangeBucketByStatus(ctx, file)
		if err != nil {
			f.updateFileFailureByID(ctx, popHealthFile.ID)
			f.UpdateFileWithInternalResultCode(ctx, popHealthFile.ID, movingToProcessedFailCode)
		}
	}()

	errs := validateResults(results)
	if errs != nil {
		var errStrings []string
		for _, e := range errs {
			errStrings = append(errStrings, e.Error())
		}
		f.updateFileFailureByID(ctx, popHealthFile.ID)
		f.UpdateFileWithInternalResultCode(ctx, popHealthFile.ID, resultsFileInvalidCode)
		return fmt.Errorf("invalid result file on fileID %d errors: %s", popHealthFile.ID, strings.Join(errStrings, "\n"))
	}

	var resultCodesCache sync.Map
	var channelItemID int64
	if len(results.Records.New) > 0 {
		channelItemID = int64(results.Records.New[0].ChannelItemID)
	}
	eg, egCtx := errgroup.WithContext(ctx)
	if popHealthFile.IsBackfill {
		eg.Go(func() error {
			return f.syncPatientsByChannelItem(egCtx, results.Records.New, channelItemID, BackfillPatientIndexKey)
		})
	} else {
		eg.Go(func() error {
			return f.performElasticsearchAsync(egCtx, popHealthFile.ID, results.Records)
		})
	}
	eg.Go(func() error {
		return f.addRowResultCodesAsync(egCtx, popHealthFile.ID, results.RowErrors, &resultCodesCache)
	})
	eg.Go(func() error {
		return f.addFileResultCodesAsync(egCtx, popHealthFile.ID, results.FileErrors, &resultCodesCache)
	})

	err = eg.Wait()
	if err != nil {
		f.updateFileFailureByID(ctx, popHealthFile.ID)
		return err
	}

	fileStatus := f.getFileStatusFromResults(results.Status)
	if fileStatus != pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED {
		_, err = f.db.UpdateFileStatusByID(ctx, pophealthsql.UpdateFileStatusByIDParams{
			ID: popHealthFile.ID,
			ProcessedAt: sql.NullTime{
				Time:  time.Now(),
				Valid: true,
			},
			Status: pophealthdb.FileStatusToEnum[fileStatus],
		})
		if err != nil {
			return fmt.Errorf("changing status on fileID %d : %w", popHealthFile.ID, err)
		}
		return nil
	}

	if popHealthFile.IsBackfill {
		var fileParameters pophealthpb.FileParameters
		err = json.Unmarshal(popHealthFile.FileParameters.Bytes, &fileParameters)
		if err != nil {
			f.logger.Errorw("error unmarshalling file parameters", zap.Error(err))
			f.updateFileFailureByID(ctx, popHealthFile.ID)
			return err
		}

		_, err = f.backfill.StartBackfill(ctx, &partnerpb.StartBackfillRequest{
			PartnerId:    channelItemID,
			BackfillType: partnerpb.BackfillType_BACKFILL_TYPE_POPHEALTH,
			StartDate:    fileParameters.StartDate,
			EndDate:      fileParameters.EndDate,
		})
		if err != nil {
			f.logger.Errorw("error starting backfill",
				"channelItemID", channelItemID,
				"startDate", fileParameters.StartDate,
				"endDate", fileParameters.EndDate,
				zap.Error(err),
			)
			f.updateFileFailureByID(ctx, popHealthFile.ID)
			f.UpdateFileWithInternalResultCode(ctx, popHealthFile.ID, startBackfillFailedCode)

			return err
		}

		f.logger.Infow("backfill started",
			"fileID", popHealthFile.ID,
			"channelItemID", channelItemID,
		)
		_, err = f.db.UpdateFileByID(ctx, pophealthsql.UpdateFileByIDParams{
			ID:                     popHealthFile.ID,
			NumberOfPatientsLoaded: int32(results.NumberNew),
			PatientsUpdatedCount:   int32(results.NumberUpdated),
			PatientsDeletedCount:   int32(results.NumberDeleted),
			Status:                 pophealthsql.FileStatusProcessing,
		})
	} else {
		_, err = f.db.UpdateFileByID(ctx, pophealthsql.UpdateFileByIDParams{
			ID:                     popHealthFile.ID,
			NumberOfPatientsLoaded: int32(results.NumberNew),
			PatientsUpdatedCount:   int32(results.NumberUpdated),
			PatientsDeletedCount:   int32(results.NumberDeleted),
			Status:                 pophealthdb.FileStatusToEnum[fileStatus],
			ProcessedAt:            sql.NullTime{Time: results.ProcessedAt, Valid: true},
		})
	}

	if err != nil {
		return fmt.Errorf("changing status on fileID %d : %w", popHealthFile.ID, err)
	}

	return nil
}

func (f *ProcessFileService) getOldestFileSameChannelByStatus(ctx context.Context, status pophealthsql.FileStatus, channelItemID int64) (*pophealthsql.File, error) {
	return f.db.GetOldestFileByStatusWithChannelItem(ctx, pophealthsql.GetOldestFileByStatusWithChannelItemParams{
		Status:        status,
		ChannelItemID: channelItemID,
	})
}

func (f *ProcessFileService) existsFileInProcessStatus(ctx context.Context, channelItemID int64) (bool, error) {
	_, err := f.getOldestFileSameChannelByStatus(ctx, pophealthsql.FileStatusProcessing, channelItemID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return false, err
		}
		return false, nil
	}
	return true, err
}

func (f *ProcessFileService) processNextWaitingFile(ctx context.Context, templateID int64) {
	if templateID <= 0 {
		f.logger.Errorf("invalid template id to process next waiting file template_id: %d", templateID)
		return
	}
	template, err := f.db.GetTemplateByID(ctx, templateID)
	if err != nil {
		f.logger.Errorw("error getting template to process next waiting file",
			"template_id", templateID,
			zap.Error(err),
		)
		return
	}

	file, err := f.getOldestFileSameChannelByStatus(ctx, pophealthsql.FileStatusWaiting, template.ChannelItemID)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			f.logger.Errorw("error getting next waiting file to process",
				"channel_item_id", template.ChannelItemID,
				zap.Error(err),
			)
		}
		return
	}
	defer f.sendNotification(ctx, file.ID, mailer.PatientCount{Valid: false}, true)

	if file.TemplateID.Int64 != templateID {
		template, err = f.db.GetTemplateByID(ctx, file.TemplateID.Int64)
		if err != nil {
			f.updateFileFailureByID(ctx, file.ID)
			f.UpdateFileWithInternalResultCode(ctx, file.ID, templateNotFoundFailCode)
			f.logger.Errorw("error getting template to process next waiting file",
				"file_id", file.ID,
				"template_id", file.TemplateID.Int64,
				zap.Error(err),
			)
			return
		}
	}

	go func() {
		// TODO: Use metrics.
		err := f.performPrefectRequest(ctx, template, file)
		if err != nil {
			f.logger.Errorw("error calling prefect to process next waiting file",
				"file_id", file.ID,
				"channel_item_id", template.ChannelItemID,
				"source", processServiceSource,
				"type", "prefect",
				zap.Error(err),
			)
		}
	}()
}

func (f *ProcessFileService) performPrefectRequest(ctx context.Context, template *pophealthsql.Template, file *pophealthsql.File) error {
	exchangeBucket := pophealthsql.BucketFolder{
		Name:         exchangeBucketName,
		S3BucketName: f.exchangeBucket,
	}
	req, err := f.prefectClient.BuildPrefectRequest(*template, *file, exchangeBucket)
	if err != nil {
		f.updateFileFailureByID(ctx, file.ID)
		f.UpdateFileWithInternalResultCode(ctx, file.ID, prefectBuildingRequestFailCode)
		return fmt.Errorf(
			"error building prefect request. fileID: %d, fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			file.ID,
			file.Filename,
			file.AwsObjectKey.String,
			file.BucketFolderID,
			err,
		)
	}

	startTime := time.Now()
	flowID, err := f.prefectClient.DoRequest(ctx, req)
	f.influxScope.With(sourceFilePointName, nil, nil).
		WritePoint(
			"prefectRequest",
			nil,
			monitoring.Fields{
				latencyFieldName:      time.Since(startTime).Milliseconds(),
				countFieldName:        1,
				"pophealth_file_id":   file.ID,
				"pophealth_file_name": file.Filename,
				"prefect_flow_id":     flowID,
				errorDescription:      err,
			},
		)
	if err != nil {
		f.updateFileFailureByID(ctx, file.ID)
		failErr := prefectCallingFileFailCode
		if errors.Is(err, context.DeadlineExceeded) || IsTimeoutError(err) {
			failErr = timeoutExceededCode
			f.logger.Errorf("prefect call context deadline exceeded",
				"fileID", file.ID,
				"source", processServiceSource,
				"type", "prefect",
				zap.Error(err),
			)
		}

		f.UpdateFileWithInternalResultCode(ctx, file.ID, failErr)
		return fmt.Errorf(
			"error calling prefect. fileID: %d, fileName: %s, awsObjectKey: %s, bucketFolderID: %d. Error: %w",
			file.ID,
			file.Filename,
			file.AwsObjectKey.String,
			file.BucketFolderID,
			err,
		)
	}
	_, err = f.db.UpdateFileStartProcessingByID(ctx, pophealthsql.UpdateFileStartProcessingByIDParams{
		ID:               file.ID,
		PrefectFlowRunID: sqltypes.ToValidNullString(string(flowID)),
		Status:           pophealthsql.FileStatusProcessing,
	})

	return err
}

func (f *ProcessFileService) updateFileStatus(ctx context.Context, fileID int64, status pophealthsql.FileStatus) (*pophealthsql.File, error) {
	return f.db.UpdateFileStatusByID(ctx, pophealthsql.UpdateFileStatusByIDParams{
		ID:     fileID,
		Status: status,
	})
}

func (f *ProcessFileService) updateFileFailureByID(ctx context.Context, id int64) {
	_, _ = f.db.UpdateFileStatusByID(ctx, pophealthsql.UpdateFileStatusByIDParams{
		ID: id,
		ProcessedAt: sql.NullTime{
			Time:  time.Now(),
			Valid: true,
		},
		Status: pophealthsql.FileStatusFailed,
	})
}

func (f *ProcessFileService) sendNotification(ctx context.Context, fileID int64, currentPopulation mailer.PatientCount, isPreProcess bool) {
	resultCodes, err := f.db.GetFileResultCodesWithCodeDetailsByFileID(ctx, fileID)
	if isPreProcess && (err != nil || len(resultCodes) == 0) {
		return
	}

	file, err := f.db.GetFileAndBucketFolderByFileID(ctx, fileID)
	if err != nil {
		f.logger.Errorw("error getting file data",
			"file_id", fileID,
			zap.Error(err))
		return
	}

	if file.IsBackfill && len(resultCodes) == 0 {
		return
	}

	emails, err := f.db.GetEmailNotificationsByBucketID(ctx, file.BucketFolderID)
	if err != nil {
		f.logger.Errorw("error getting email notification data",
			"bucket_file_id", file.BucketFolderID,
			zap.Error(err))
		return
	}

	totalPatients := mailer.PatientCount{
		Int32: currentPopulation.Int32 + file.NumberOfPatientsLoaded - file.PatientsDeletedCount,
		Valid: currentPopulation.Valid,
	}

	f.logger.Infow("file output data",
		"file", file.Filename,
		"status", file.Status,
		"patients added", file.NumberOfPatientsLoaded,
		"patients deleted", file.PatientsDeletedCount,
		"patients updated", file.PatientsUpdatedCount,
		"total patients", totalPatients.Int32,
		"error count", len(resultCodes),
		"bucket", file.BucketFolderID,
		"template", file.TemplateID)

	err = f.mailer.SendProcessingReport(ctx, mailer.SendProcessingReportParams{
		File:                  file,
		ResultCodes:           resultCodes,
		TotalNumberOfPatients: totalPatients,
		ToEmails:              emails,
	})
	if err != nil {
		f.logger.Errorw("error sending processing report",
			zap.Error(err))
		return
	}
}

func (f *ProcessFileService) getFileStatusFromResults(resultStatus string) pophealthpb.PopHealthFile_FileStatus {
	switch {
	case resultStatus == resultsSuccess:
		return pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED
	case resultStatus == resultsInvalid:
		return pophealthpb.PopHealthFile_FILE_STATUS_INVALID
	default:
		return pophealthpb.PopHealthFile_FILE_STATUS_FAILED
	}
}

func validateResults(results Results) []error {
	var errs []error
	if results.NumberNew != len(results.Records.New) {
		errs = append(errs, errors.New("number of new patients doesn't match with the length of the new records"))
	}

	if results.NumberDeleted != len(results.Records.Deleted) {
		errs = append(errs, errors.New("number of deleted patients doesn't match with the length of the deleted records"))
	}

	return errs
}

func (f *ProcessFileService) copyFileToExchangeBucket(ctx context.Context, file *pophealthsql.File) (*pophealthsql.File, error) {
	originalBucket, err := f.db.GetBucketFolderByID(ctx, file.BucketFolderID)
	if err != nil {
		return nil, fmt.Errorf("could not find associated BucketFolder for file ID: %d, fileName: %s", file.ID, file.Filename)
	}

	bucketLocation := strings.Join([]string{"load", originalBucket.S3BucketName}, "/")
	newFilename := strconv.FormatInt(time.Now().UnixNano(), 10) + filepath.Ext(file.Filename)
	copySource := originalBucket.S3BucketName + "/" + file.AwsObjectKey.String
	destKey := strings.Join([]string{bucketLocation, newFilename}, "/")
	err = f.aws.CopyFile(ctx, copySource, f.exchangeBucket, destKey)
	if err != nil {
		return nil, fmt.Errorf("could not copy s3 object to exchange bucket for file ID: %d, fileName: %s, error: %w", file.ID, file.Filename, err)
	}
	params := pophealthsql.UpdateAwsObjectKeyInFilesByIDParams{
		ID:           file.ID,
		AwsObjectKey: sqltypes.ToValidNullString(destKey),
	}

	dbResp, updateErr := f.db.UpdateAwsObjectKeyInFilesByID(ctx, params)

	if updateErr != nil {
		return nil, fmt.Errorf("could not update aws object key on pop health file Id: %d", file.ID)
	}

	return dbResp, nil
}

func (f *ProcessFileService) moveFileInExchangeBucketByStatus(ctx context.Context, popHealthFile *pophealthsql.File) (*pophealthsql.File, error) {
	originalAWSKey := popHealthFile.AwsObjectKey.String
	destFolder := processedFolder
	if popHealthFile.Status == pophealthsql.FileStatusFailed ||
		popHealthFile.Status == pophealthsql.FileStatusInvalid {
		destFolder = failedFolder
	}
	destKey := strings.Replace(originalAWSKey, loadFolder, destFolder, 1)
	return f.moveFile(ctx, popHealthFile, f.exchangeBucket, f.exchangeBucket, destKey)
}

func (f *ProcessFileService) copyFileInPartnerBucketToFailedFolder(ctx context.Context, popHealthFile *pophealthsql.File) (*pophealthsql.File, error) {
	partnerBucket, err := f.db.GetBucketFolderByID(ctx, popHealthFile.BucketFolderID)
	if err != nil {
		return nil, fmt.Errorf("could not find associated BucketFolder for file ID: %d, fileName: %s", popHealthFile.ID, popHealthFile.Filename)
	}

	destKey := strings.Join([]string{failedFolder, partnerBucket.S3BucketName, popHealthFile.Filename}, "/")
	return f.copyFile(ctx, popHealthFile, partnerBucket.S3BucketName, f.exchangeBucket, destKey)
}

func (f *ProcessFileService) copyFile(ctx context.Context, file *pophealthsql.File, sourceS3Bucket, destS3Bucket, destKey string) (*pophealthsql.File, error) {
	originalAWSKey := file.AwsObjectKey.String
	copySource := strings.Join([]string{sourceS3Bucket, originalAWSKey}, "/")
	err := f.aws.CopyFile(ctx, copySource, destS3Bucket, destKey)
	if err != nil {
		return nil, err
	}

	dbFile, err := f.db.UpdateAwsObjectKeyInFilesByID(ctx, pophealthsql.UpdateAwsObjectKeyInFilesByIDParams{
		ID:           file.ID,
		AwsObjectKey: sqltypes.ToValidNullString(destKey),
	})
	if err != nil {
		return nil, err
	}

	return dbFile, nil
}

func (f *ProcessFileService) moveFile(ctx context.Context, file *pophealthsql.File, sourceS3Bucket, destS3Bucket, destKey string) (*pophealthsql.File, error) {
	originalAWSKey := file.AwsObjectKey.String
	dbFile, err := f.copyFile(ctx, file, sourceS3Bucket, destS3Bucket, destKey)
	if err != nil {
		return nil, err
	}

	err = f.aws.DeleteS3File(ctx, sourceS3Bucket, originalAWSKey)
	if err != nil {
		return nil, err
	}

	return dbFile, nil
}

func getFlowRunIDFromObjectKey(objectKey string, isDeleteFlow bool) string {
	removeSuffix := "__results.json"
	if isDeleteFlow {
		removeSuffix = "__delete_results.json"
	}
	fileName := getFileNameFromObjectKey(objectKey)
	return strings.ReplaceAll(fileName, removeSuffix, "")
}

func getFileNameFromObjectKey(objectKey string) string {
	i := strings.LastIndex(objectKey, "/")
	return objectKey[i+1:]
}

func (f *ProcessFileService) addRowResultCodes(ctx context.Context, fileID int64, rowErrors []RowError, cache *sync.Map) error {
	for _, rowError := range rowErrors {
		if _, ok := cache.Load(rowError.Code); ok {
			continue
		}
		resultCode, err := f.getResultCodeFromDB(ctx, rowError.ResultCode, CodeLevelRow)
		if err != nil {
			return err
		}
		_, err = f.db.AddFilesResultCodesWithOccurrences(ctx, pophealthsql.AddFilesResultCodesWithOccurrencesParams{
			FileID:              fileID,
			ResultCodeID:        resultCode.ID,
			Fields:              sql.NullString{String: rowError.Field, Valid: true},
			NumberOfOccurrences: int32(rowError.NumberFailed),
			FirstOccurrence:     sql.NullInt32{Int32: int32(rowError.FirstOccurrence), Valid: true},
		})
		if err != nil {
			return err
		}
		cache.Store(resultCode.Code, true)
	}
	return nil
}

func (f *ProcessFileService) addFileResultCodes(ctx context.Context, fileID int64, fileErrors []FileError, cache *sync.Map) error {
	for _, fileError := range fileErrors {
		if _, ok := cache.Load(fileError.Code); ok {
			continue
		}

		resultCode, err := f.getResultCodeFromDB(ctx, fileError.ResultCode, CodeLevelFile)
		if err != nil {
			return err
		}

		fields := strings.Join(fileError.Fields, ", ")
		newFilesResultCodesParams := pophealthsql.AddFilesResultCodesParams{
			FileID:           fileID,
			ResultCodeID:     resultCode.ID,
			Fields:           sql.NullString{String: fields, Valid: fields != ""},
			ErrorDescription: sqltypes.ToNullString(&fileError.Description),
		}
		_, err = f.db.AddFilesResultCodes(ctx, newFilesResultCodesParams)
		if err != nil {
			return err
		}

		if strings.ToLower(resultCode.Code) == uncaughtErrorCode {
			f.logger.Errorw("unexpected result code",
				"source", processServiceSource,
				"description", fileError.Description)
		}
		cache.Store(resultCode.Code, true)
	}
	return nil
}

func (f *ProcessFileService) UpdateFileWithInternalResultCode(ctx context.Context, fileID int64, code string) {
	rs, err := f.db.GetResultCodeByCode(ctx, code)
	if err == nil {
		_, _ = f.db.AddFilesResultCodes(ctx, pophealthsql.AddFilesResultCodesParams{
			FileID:       fileID,
			ResultCodeID: rs.ID,
			Fields: sql.NullString{
				String: "",
				Valid:  false,
			},
		})
	}
}

func (f *ProcessFileService) getResultCodeFromDB(ctx context.Context, rs ResultCode, codeLevel string) (*pophealthsql.ResultCode, error) {
	resultCode, err := f.db.GetResultCodeByCode(ctx, rs.Code)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}

		resultCode, err = f.db.CreateResultCode(ctx, pophealthsql.CreateResultCodeParams{
			Code:            rs.Code,
			CodeDescription: sql.NullString{String: rs.Description, Valid: true},
			CodeLevel:       codeLevel,
		})
		if err != nil {
			return nil, err
		}
	}
	return resultCode, err
}

func (f *ProcessFileService) syncPatientsByChannelItem(ctx context.Context, patientRecords []*Patient, channelItemID int64, index PopHealthIndexKey) error {
	_, err := f.elasticSearch.DeleteByChannelItemID(ctx, index, channelItemID)
	if err != nil {
		return fmt.Errorf("error deleting patients for index %s. channelItemID: %d error: %w", index, channelItemID, err)
	}

	bulkResp, err := f.elasticSearch.BulkUpsert(ctx, index, patientRecords, 0)
	if err != nil {
		return fmt.Errorf("error creating patients for index %s. channelItemID: %d error: %w", index, channelItemID, err)
	}

	f.logger.Infow("sync patients succeeded", "response", bulkResp, "channelItemID", channelItemID, "index", index)
	return nil
}

func (f *ProcessFileService) performElasticsearchAsync(ctx context.Context, fileID int64, patientsRecords ResultsRecords) error {
	esResp, err := f.elasticSearch.BulkDelete(ctx, PatientIndexKey, patientsRecords.Deleted, fileID)
	if err != nil {
		f.UpdateFileWithInternalResultCode(ctx, fileID, elasticsearchDeleteFailCode)
		return fmt.Errorf("deleted %d patients of %d in elastic search on fileID %d : %w",
			esResp.Stats.NumDeleted,
			len(patientsRecords.Deleted),
			fileID,
			err,
		)
	} else if esResp.Stats.NumDeleted != uint64(len(patientsRecords.Deleted)) {
		f.logger.Warnw("unexpected number of deleted patients",
			"file id", fileID,
			"deleted", esResp.Stats.NumDeleted,
			"expected", len(patientsRecords.Deleted))
	}

	esResp, err = f.elasticSearch.BulkUpsert(ctx, PatientIndexKey, patientsRecords.New, fileID)
	if err != nil {
		f.UpdateFileWithInternalResultCode(ctx, fileID, elasticsearchAddFailCode)
		return fmt.Errorf("created %d new patients of %d in elastic search on fileID %d : %w",
			esResp.Stats.NumIndexed,
			len(patientsRecords.New),
			fileID,
			err,
		)
	} else if esResp.Stats.NumIndexed != uint64(len(patientsRecords.New)) {
		f.logger.Warnw("unexpected number of new patients",
			"file id", fileID,
			"new", esResp.Stats.NumIndexed,
			"expected", len(patientsRecords.New))
	}

	return nil
}

func (f *ProcessFileService) addRowResultCodesAsync(ctx context.Context, fileID int64, rowErrors []RowError, cache *sync.Map) error {
	err := f.addRowResultCodes(ctx, fileID, rowErrors, cache)
	if err != nil {
		return fmt.Errorf("adding row result codes on fileID %d : %w", fileID, err)
	}

	return nil
}

func (f *ProcessFileService) addFileResultCodesAsync(ctx context.Context, fileID int64, fileErrors []FileError, cache *sync.Map) error {
	err := f.addFileResultCodes(ctx, fileID, fileErrors, cache)
	if err != nil {
		return fmt.Errorf("adding file result codes on fileID %d : %w", fileID, err)
	}

	return nil
}

func (f *ProcessFileService) getCurrentPopulation(ctx context.Context, file *pophealthsql.GetFileByPrefectFlowRunIDRow) (int32, error) {
	if !file.TemplateID.Valid {
		return 0, fmt.Errorf("invalid template. fileID: %d", file.ID)
	}

	template, err := f.db.GetTemplateByID(ctx, file.TemplateID.Int64)
	if err != nil {
		return 0, fmt.Errorf("error getting template data. templateID: %d fileID: %d error: %w",
			file.TemplateID.Int64,
			file.ID,
			err,
		)
	}

	channelItemID := template.ChannelItemID
	numberOfPatientsResponse, err := f.elasticSearch.GetPatientCountByChannelItem(ctx, PatientIndexKey, channelItemID)
	if err != nil {
		return 0, fmt.Errorf("error getting total number of patients. channelItemID: %d fileID: %d error: %w",
			channelItemID,
			file.ID,
			err,
		)
	}

	return numberOfPatientsResponse.TotalCount, nil
}

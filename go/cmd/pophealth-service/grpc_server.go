package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/mail"
	"os"
	"strings"
	"text/template"
	"time"

	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/mailer"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

const (
	dataChunkSize            = 512 * 1024 // Send file in chunks of 512KB
	NotFoundTemplate         = "Not Found"
	maxNumberErrorsDisplayed = 10
)

var (
	fileErrorMsgTemplate = template.Must(template.New("").Parse(`type: {{.Type}}, {{.Description}}{{if ne .Fields "" }} on "{{.Fields}}" fields{{end}}`))
	rowErrorMsgTemplate  = template.Must(template.New("").Parse(`type: {{.Type}}, count: {{.Occurrences}}, {{.Description}}`))
)

type DBService interface {
	GetBucketFolders(context.Context) ([]*pophealthsql.BucketFolder, error)
	GetBucketFolderByID(context.Context, int64) (*pophealthsql.BucketFolder, error)
	UpdateBucketFolder(context.Context, pophealthsql.UpdateBucketFolderParams) (*pophealthsql.BucketFolder, error)
	AddBucketFolder(context.Context, pophealthsql.AddBucketFolderParams) (*pophealthsql.BucketFolder, error)
	GetTemplateByID(context.Context, int64) (*pophealthsql.Template, error)
	GetActiveTemplatesInBucketFolder(context.Context, int64) ([]*pophealthsql.Template, error)
	UpdateTemplateByID(context.Context, pophealthsql.UpdateTemplateByIDParams) (*pophealthsql.Template, error)
	AddTemplateToBucketFolder(context.Context, pophealthsql.AddTemplateToBucketFolderParams) (*pophealthsql.Template, error)
	GetFileByID(context.Context, int64) (*pophealthsql.File, error)
	DeleteFileByID(context.Context, int64) (*pophealthsql.File, error)
	GetFileAndBucketFolderByFileID(context.Context, int64) (*pophealthsql.GetFileAndBucketFolderByFileIDRow, error)
	GetFilesByBucket(context.Context, pophealthsql.GetFilesByBucketParams) ([]*pophealthsql.GetFilesByBucketRow, error)
	GetFileCountForBucketFolder(context.Context, pophealthsql.GetFileCountForBucketFolderParams) (int64, error)
	AddFile(context.Context, pophealthsql.AddFileParams) (*pophealthsql.File, error)
	AddBucketFolderEmailNotifications(context.Context, pophealthsql.AddBucketFolderEmailNotificationsParams) (*pophealthsql.BucketFolderEmailNotification, error)
	DeleteBucketFolderEmailNotifications(context.Context, int64) error
	GetEmailNotificationsByBucketID(context.Context, int64) ([]string, error)
	GetFileResultCodesWithCodeDetailsByFileID(context.Context, int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error)
	DeleteTemplateByID(context.Context, int64) (*pophealthsql.Template, error)
	DeleteBucketFolder(context.Context, int64) error
	GetFilesAndTemplatesCount(context.Context, int64) (*pophealthsql.GetFilesAndTemplatesCountRow, error)
	GetTemplatesInBucketFolder(context.Context, int64) ([]*pophealthsql.Template, error)
	DeactivateBucketFolder(context.Context, int64) (*pophealthsql.BucketFolder, error)
	GetOldestFileByStatusWithChannelItem(context.Context, pophealthsql.GetOldestFileByStatusWithChannelItemParams) (*pophealthsql.File, error)
	GetProcessingBackfillFileByChannelItemID(context.Context, int64) (*pophealthsql.File, error)
	UpdateFileStatusByID(context.Context, pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error)
	GetTemplateByChannelItemID(context.Context, pophealthsql.GetTemplateByChannelItemIDParams) (*pophealthsql.Template, error)
	GetTemplateByBucketFolderAndName(context.Context, pophealthsql.GetTemplateByBucketFolderAndNameParams) (*pophealthsql.Template, error)
	GetNumberOfProcessingBackfillFiles(context.Context) (int64, error)
}

type awsClient interface {
	BucketExists(context.Context, string) bool
	DeleteS3File(context.Context, string, string) error
	PutBucketNotification(context.Context, string, []string) error
	GetS3File(context.Context, string, string) (io.ReadCloser, error)
	AddS3File(context.Context, string, string, []byte) error
}

type fileTemplateService interface {
	FindTemplateByFile(context.Context, UpdateFileByTemplateRequest) (*pophealthsql.Template, error)
}

type GrpcServerDependencies struct {
	Aws                 awsClient
	Prefect             prefectService
	FileTemplateService fileTemplateService
	DBService           DBService
	Mailer              mailerService
}

type GrpcServer struct {
	pophealthpb.UnimplementedPopHealthServiceServer
	DBService                 DBService
	aws                       awsClient
	prefect                   prefectService
	templates                 fileTemplateService
	mailer                    mailerService
	exchangeBucket            string
	numberOfParallelBackfills int64
	logger                    *zap.SugaredLogger
}

func NewGRPCServer(
	dependencies GrpcServerDependencies,
	exchangeBucket string,
	numberOfParallelBackfills int64,
	logger *zap.SugaredLogger,
) *GrpcServer {
	return &GrpcServer{
		DBService:                 dependencies.DBService,
		aws:                       dependencies.Aws,
		prefect:                   dependencies.Prefect,
		templates:                 dependencies.FileTemplateService,
		mailer:                    dependencies.Mailer,
		exchangeBucket:            exchangeBucket,
		numberOfParallelBackfills: numberOfParallelBackfills,
		logger:                    logger,
	}
}

func (s *GrpcServer) ListBuckets(ctx context.Context, _ *pophealthpb.ListBucketsRequest) (*pophealthpb.ListBucketsResponse, error) {
	buckets, err := s.DBService.GetBucketFolders(ctx)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "bucket folders not found %v", err)
		}

		return nil, LogAndReturnErr(s.logger, codes.Internal, "error trying to get bucket folders", err)
	}

	protoBuckets := make([]*pophealthpb.PopHealthBucket, len(buckets))
	for i, bucket := range buckets {
		protoBuckets[i] = &pophealthpb.PopHealthBucket{
			Id:           &bucket.ID,
			DisplayName:  bucket.Name,
			S3BucketName: bucket.S3BucketName,
		}
	}

	return &pophealthpb.ListBucketsResponse{
		Buckets: protoBuckets,
	}, nil
}

func (s *GrpcServer) GetBucket(ctx context.Context, req *pophealthpb.GetBucketRequest) (*pophealthpb.GetBucketResponse, error) {
	bucket, err := s.DBService.GetBucketFolderByID(ctx, req.Id)
	log := s.logger.With("bucketID", req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "bucket folder with ID %v does not exist. Error: %v", req.Id, err)
		}
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to get bucket folder",
			err)
	}

	notificationList, err := s.DBService.GetEmailNotificationsByBucketID(ctx, bucket.ID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to recover bucket folder email notifications",
			err)
	}

	protoBucket := &pophealthpb.PopHealthBucket{
		Id:           &bucket.ID,
		DisplayName:  bucket.Name,
		S3BucketName: bucket.S3BucketName,
		EmailList:    notificationList,
	}

	s.logger.Debug("gRPC:GetBucket success.")

	return &pophealthpb.GetBucketResponse{
		Bucket: protoBucket,
	}, nil
}

func (s *GrpcServer) UpsertBucket(ctx context.Context, req *pophealthpb.UpsertBucketRequest) (*pophealthpb.UpsertBucketResponse, error) {
	var bucket *pophealthsql.BucketFolder
	var err error

	if req.Bucket == nil {
		return nil, status.Error(codes.InvalidArgument, "invalid request, bucket not present")
	}

	if req.Bucket.S3BucketName == "" || !s.aws.BucketExists(ctx, req.Bucket.S3BucketName) {
		return nil, status.Errorf(codes.NotFound, "invalid bucket name, %s does not exist", req.Bucket.S3BucketName)
	}

	log := s.logger.With("bucketName", req.Bucket.S3BucketName)
	err = s.aws.PutBucketNotification(ctx, req.Bucket.S3BucketName, []string{loadFolder, importFolder})
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to insert bucket folder",
			err)
	}
	if req.Bucket.Id != nil {
		bucket, err = s.DBService.UpdateBucketFolder(ctx, pophealthsql.UpdateBucketFolderParams{
			ID:           *req.Bucket.Id,
			Name:         req.Bucket.DisplayName,
			S3BucketName: req.Bucket.S3BucketName,
		})
		if err != nil {
			log = log.With("bucketID", req.Bucket.Id)
			return nil, LogAndReturnErr(log,
				codes.Internal,
				"error trying to update bucket folder",
				err)
		}
	} else {
		bucket, err = s.DBService.AddBucketFolder(ctx, pophealthsql.AddBucketFolderParams{
			Name:         req.Bucket.DisplayName,
			S3BucketName: req.Bucket.S3BucketName,
		})
		if err != nil {
			return nil, LogAndReturnErr(log,
				codes.Internal,
				"error trying to insert bucket folder",
				err)
		}
	}

	err = s.updateEmailNotifications(ctx, bucket.ID, req.Bucket.EmailList)
	if err != nil {
		return nil, err
	}

	s.logger.Debug("gRPC:UpsertBucket success.")

	return &pophealthpb.UpsertBucketResponse{
		Id: bucket.ID,
	}, nil
}

func (s *GrpcServer) DeleteBucket(ctx context.Context, req *pophealthpb.DeleteBucketRequest) (*pophealthpb.DeleteBucketResponse, error) {
	fileAndTemplateCount, err := s.DBService.GetFilesAndTemplatesCount(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "an error happened trying to get files and templates count for bucket %d %v", req.Id, err)
	}

	if fileAndTemplateCount.NumFiles > 0 || fileAndTemplateCount.NumTemplates > 0 {
		return nil, status.Errorf(codes.InvalidArgument, "cannot delete bucket, it contains %d files and %d templates", fileAndTemplateCount.NumFiles, fileAndTemplateCount.NumTemplates)
	}

	if err = s.DBService.DeleteBucketFolder(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "an error happened trying to delete bucket %d %v", req.Id, err)
	}

	s.logger.Infow(
		"bucket folder successfully deleted",
		"bucketFolderID", req.Id,
	)
	return &pophealthpb.DeleteBucketResponse{}, nil
}

func (s *GrpcServer) DeactivateBucket(ctx context.Context, req *pophealthpb.DeactivateBucketRequest) (*pophealthpb.DeactivateBucketResponse, error) {
	log := s.logger.With("bucketFolderID", req.Id, "source", "grpc_server")
	templates, err := s.DBService.GetTemplatesInBucketFolder(ctx, req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, LogAndReturnErr(log, codes.NotFound, "no templates found for bucket folder", err)
		}
		return nil, LogAndReturnErr(log, codes.Internal, "error getting templates for bucket folder", err)
	}

	channelItemIDs := []int64{}
	if len(req.ChannelItemIds) == 0 {
		for _, template := range templates {
			channelItemIDs = append(channelItemIDs, template.ChannelItemID)
		}
	} else {
		channelItemIDs = matchChannelItemsWithTemplates(templates, req.ChannelItemIds)
	}

	if len(req.ChannelItemIds) != 0 && len(req.ChannelItemIds) != len(channelItemIDs) {
		return nil, LogAndReturnErr(log, codes.InvalidArgument, "given channel item ids does not belong to given folder", nil,
			"folder", req.Id,
			"channelItemIDs", req.ChannelItemIds,
		)
	}

	prefectRequest, err := s.prefect.BuildDeactivateBucketPrefectRequest(req.Id, channelItemIDs)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error building delete prefect request", err, "channelItemIDs", channelItemIDs)
	}

	flowID, err := s.prefect.DoRequest(ctx, prefectRequest)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error executing delete prefect request", err,
			"type", "prefect",
			"request", string(prefectRequest),
		)
	}

	if len(req.ChannelItemIds) == 0 {
		_, err = s.DBService.DeactivateBucketFolder(ctx, req.Id)
		if err != nil {
			return nil, LogAndReturnErr(log, codes.Internal, "error deactivating bucket folder", err)
		}
	}

	log.Infow("delete patients prefect request success", "flowID", flowID, "channelItemIDs", channelItemIDs)
	return &pophealthpb.DeactivateBucketResponse{}, nil
}

func matchChannelItemsWithTemplates(templates []*pophealthsql.Template, channelItemIDs []int64) []int64 {
	resultChannelItemIDs := []int64{}
	matchedChannelItems := make(map[int64]bool)
	for _, template := range templates {
		matchedChannelItems[template.ChannelItemID] = false
	}
	for _, channelItemID := range channelItemIDs {
		if _, ok := matchedChannelItems[channelItemID]; ok {
			resultChannelItemIDs = append(resultChannelItemIDs, channelItemID)
		}
	}
	return resultChannelItemIDs
}

func (s *GrpcServer) updateEmailNotifications(ctx context.Context, bucketID int64, emailList []string) error {
	for _, email := range emailList {
		_, err := mail.ParseAddress(email)
		if err != nil {
			return status.Errorf(codes.InvalidArgument, "email invalid %v", err)
		}
	}

	err := s.DBService.DeleteBucketFolderEmailNotifications(ctx, bucketID)
	if err != nil {
		return status.Errorf(codes.Internal, "error trying to delete email notifications %v", err)
	}

	for _, email := range emailList {
		_, err = s.DBService.AddBucketFolderEmailNotifications(ctx, pophealthsql.AddBucketFolderEmailNotificationsParams{
			BucketFolderID: bucketID,
			Email:          email,
		})
		if err != nil {
			return status.Errorf(codes.Internal, "error trying to insert email list %v", err)
		}
	}

	return nil
}

func (s *GrpcServer) ListConfigurations(ctx context.Context, req *pophealthpb.ListConfigurationsRequest) (*pophealthpb.ListConfigurationsResponse, error) {
	templates, err := s.DBService.GetActiveTemplatesInBucketFolder(ctx, req.BucketFolderId)
	log := s.logger.With("bucketID", req.BucketFolderId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "template not found for bucket ID %d error %v", req.BucketFolderId, err)
		}

		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to get bucket configurations",
			err)
	}

	protoTemplates := make([]*pophealthpb.PopHealthConfiguration, len(templates))
	for i, template := range templates {
		popHealthConfig, err := translateTemplateToPopHealthConfig(template)
		if err != nil {
			return nil, LogAndReturnErr(log, codes.Internal, "error retrieving configuration", err)
		}
		protoTemplates[i] = popHealthConfig
	}

	s.logger.Debug("gRPC:ListConfigurations success.")

	return &pophealthpb.ListConfigurationsResponse{
		Configurations: protoTemplates,
	}, nil
}

func (s *GrpcServer) GetConfiguration(ctx context.Context, req *pophealthpb.GetConfigurationRequest) (*pophealthpb.GetConfigurationResponse, error) {
	template, err := s.DBService.GetTemplateByID(ctx, req.Id)
	log := s.logger.With("templateID", req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "not found configuration for ID %d error %v", req.Id, err)
		}
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to get bucket folder configuration",
			err)
	}

	popHealthConfig, err := translateTemplateToPopHealthConfig(template)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error retrieving configuraton", err)
	}

	s.logger.Debug("gRPC:GetConfiguration success.")

	return &pophealthpb.GetConfigurationResponse{
		Configuration: popHealthConfig,
	}, nil
}

func (s *GrpcServer) UpsertConfiguration(ctx context.Context, req *pophealthpb.UpsertConfigurationRequest) (*pophealthpb.UpsertConfigurationResponse, error) {
	var config *pophealthsql.Template
	log := s.logger.With("templateID", req.Configuration.Id,
		"templateName", req.Configuration.Name)
	fileTypeString := pophealthpb.FileType_name[int32(req.Configuration.FileType)]
	fileIdentifierTypeString := pophealthpb.FileIdentifier_FileIdentifierType_name[int32(req.Configuration.FileIdentifier.Type)]
	columnMappingValue, err := getColumnMappingValue(req.Configuration.ColumnMapping)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.NotFound,
			"error trying to recover column mapping",
			err)
	}

	if err = s.validateUpsertConfigurationParams(ctx, req); err != nil {
		return nil, err
	}

	if req.Configuration.Id != nil {
		config, err = s.DBService.UpdateTemplateByID(ctx, pophealthsql.UpdateTemplateByIDParams{
			ID:                  *req.Configuration.Id,
			Name:                req.Configuration.Name,
			FileType:            fileTypeString,
			FileIdentifierType:  fileIdentifierTypeString,
			FileIdentifierValue: req.Configuration.FileIdentifier.Value,
			ChannelItemID:       req.Configuration.ChannelItemId,
			BucketFolderID:      req.Configuration.BucketFolderId,
			ColumnMapping:       columnMappingValue,
			MarketID:            req.Configuration.MarketId,
		})
		if err != nil {
			return nil, LogAndReturnErr(log,
				codes.Internal,
				"update template: error happened trying to update template",
				err)
		}
	} else {
		config, err = s.DBService.AddTemplateToBucketFolder(ctx, pophealthsql.AddTemplateToBucketFolderParams{
			Name:                req.Configuration.Name,
			FileType:            fileTypeString,
			FileIdentifierType:  fileIdentifierTypeString,
			FileIdentifierValue: req.Configuration.FileIdentifier.Value,
			ChannelItemID:       req.Configuration.ChannelItemId,
			BucketFolderID:      req.Configuration.BucketFolderId,
			ColumnMapping:       columnMappingValue,
			MarketID:            req.Configuration.MarketId,
		})
		if err != nil {
			return nil, LogAndReturnErr(log,
				codes.Internal,
				"create template: error happened trying to insert template",
				err)
		}
	}

	s.logger.Debug("gRPC:UpsertConfiguration success.")

	return &pophealthpb.UpsertConfigurationResponse{
		Id: config.ID,
	}, nil
}

func (s *GrpcServer) validateUpsertConfigurationParams(ctx context.Context, req *pophealthpb.UpsertConfigurationRequest) error {
	log := s.logger.With("templateID", req.Configuration.Id, "templateName", req.Configuration.Name)
	var templateID int64
	if req.Configuration.Id != nil {
		templateID = *req.Configuration.Id
	}
	_, err := s.DBService.GetTemplateByChannelItemID(ctx, pophealthsql.GetTemplateByChannelItemIDParams{
		ID:                      templateID,
		ChannelItemID:           req.Configuration.ChannelItemId,
		TemplateIDFilterEnabled: req.Configuration.Id != nil,
	})
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return LogAndReturnErr(
			log,
			codes.Internal,
			"error getting template by channel item id",
			err)
	}

	if err == nil {
		return status.Errorf(
			codes.InvalidArgument,
			"template with channel item id %d already exists",
			req.Configuration.ChannelItemId)
	}

	_, err = s.DBService.GetTemplateByBucketFolderAndName(
		ctx,
		pophealthsql.GetTemplateByBucketFolderAndNameParams{
			ID:                      templateID,
			BucketFolderID:          req.Configuration.BucketFolderId,
			Name:                    req.Configuration.Name,
			TemplateIDFilterEnabled: req.Configuration.Id != nil,
		})
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return LogAndReturnErr(
			log,
			codes.Internal,
			"error getting template by bucket folder and name",
			err)
	}

	if err == nil {
		return status.Errorf(
			codes.InvalidArgument,
			"template with name %s already exists in bucket folder %d",
			req.Configuration.Name,
			req.Configuration.BucketFolderId)
	}

	return nil
}

func translateTemplateToPopHealthConfig(template *pophealthsql.Template) (*pophealthpb.PopHealthConfiguration, error) {
	fileIdentifier := pophealthpb.FileIdentifier{
		Type:  pophealthpb.FileIdentifier_FileIdentifierType(pophealthpb.FileIdentifier_FileIdentifierType_value[template.FileIdentifierType]),
		Value: template.FileIdentifierValue,
	}

	var columnsMapping []*pophealthpb.ColumnMapping
	err := json.Unmarshal(template.ColumnMapping.Bytes, &columnsMapping)
	if err != nil {
		return nil, err
	}

	return &pophealthpb.PopHealthConfiguration{
		Id:             &template.ID,
		Name:           template.Name,
		FileType:       pophealthpb.FileType(pophealthpb.FileType_value[template.FileType]),
		FileIdentifier: &fileIdentifier,
		BucketFolderId: template.BucketFolderID,
		ChannelItemId:  template.ChannelItemID,
		ColumnMapping:  columnsMapping,
		MarketId:       template.MarketID,
	}, nil
}

func getColumnMappingValue(columnsMapping []*pophealthpb.ColumnMapping) (pgtype.JSONB, error) {
	requiredColumns := []pophealthpb.DHColumnName{
		pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
		pophealthpb.DHColumnName_DH_COLUMN_NAME_LAST_NAME,
		pophealthpb.DHColumnName_DH_COLUMN_NAME_DOB,
	}
	var includedColumns []pophealthpb.DHColumnName
	for _, columnMapping := range columnsMapping {
		if columnMapping.DestinationColumnName == pophealthpb.DHColumnName_DH_COLUMN_NAME_DOB {
			if columnMapping.DateFormat == nil {
				return pgtype.JSONB{Status: pgtype.Null}, status.Errorf(codes.InvalidArgument, "column mapping: date format missing for dob column")
			}
			if columnMapping.DateFormat == pophealthpb.ColumnMapping_DateFormat.Enum(pophealthpb.ColumnMapping_DATE_FORMAT_UNSPECIFIED) {
				return pgtype.JSONB{Status: pgtype.Null}, status.Errorf(codes.InvalidArgument, "column mapping: dob column date format needs to be specified")
			}
		}
		if slices.Contains(requiredColumns, columnMapping.DestinationColumnName) {
			includedColumns = append(includedColumns, columnMapping.DestinationColumnName)
		}
	}

	if len(includedColumns) != len(requiredColumns) {
		for _, requiredColumn := range requiredColumns {
			if !slices.Contains(includedColumns, requiredColumn) {
				return pgtype.JSONB{Status: pgtype.Null}, status.Errorf(codes.InvalidArgument, "column mapping: %v is required", requiredColumn)
			}
		}
	}

	columnsMappingJSON, err := json.Marshal(columnsMapping)
	if err != nil {
		return pgtype.JSONB{Status: pgtype.Null}, status.Errorf(codes.Internal, "column mapping: error %v", err)
	}

	return pgtype.JSONB{Bytes: columnsMappingJSON, Status: pgtype.Present}, nil
}

func (s *GrpcServer) DeleteConfiguration(ctx context.Context, req *pophealthpb.DeleteConfigurationRequest) (*pophealthpb.DeleteConfigurationResponse, error) {
	log := s.logger.With("templateID", req.Id)
	result, err := s.DBService.GetTemplateByID(ctx, req.Id)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.NotFound,
			"Template not found",
			err)
	}

	_, err = s.DBService.DeleteTemplateByID(ctx, result.ID)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"Template could not be deleted",
			err)
	}

	return &pophealthpb.DeleteConfigurationResponse{}, nil
}

func (s *GrpcServer) DeleteFile(ctx context.Context, req *pophealthpb.DeleteFileRequest) (*pophealthpb.DeleteFileResponse, error) {
	result, err := s.DBService.GetFileAndBucketFolderByFileID(ctx, req.FileId)
	log := s.logger.With("fileID", req.FileId)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.NotFound,
			"File not found",
			err)
	}

	log = log.With("s3BucketName", result.S3BucketName,
		"fileName", result.Filename)

	err = s.aws.DeleteS3File(ctx, result.S3BucketName, result.Filename)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"Error deleting S3 object",
			err)
	}

	_, err = s.DBService.DeleteFileByID(ctx, result.FileID)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"File could not be deleted",
			err)
	}
	return &pophealthpb.DeleteFileResponse{}, nil
}

func (s *GrpcServer) ListFiles(ctx context.Context, req *pophealthpb.ListFilesRequest) (*pophealthpb.ListFilesResponse, error) {
	pageParameters, err := DecodePageToken(string(req.PageToken))
	log := s.logger.With("bucketFolderID", req.BucketFolderId)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error trying decoding pageToken", err)
	}

	countFilesQueryParameters, getFilesQueryParameters, lastPageVisited, err := getQueryParameters(req, pageParameters)
	if err != nil {
		return nil, err
	}

	filesCount, err := s.DBService.GetFileCountForBucketFolder(ctx, *countFilesQueryParameters)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to get files count",
			err)
	}

	files, err := s.DBService.GetFilesByBucket(ctx, *getFilesQueryParameters)
	if err != nil {
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to get files",
			err)
	}

	numberOfFiles := int32(len(files))
	if numberOfFiles == 0 {
		return &pophealthpb.ListFilesResponse{
			Files:         []*pophealthpb.PopHealthFile{},
			NextPageToken: nil,
			Data: &pophealthpb.PaginationData{
				TotalItems:  0,
				TotalPages:  0,
				CurrentPage: 0,
			},
		}, nil
	}

	paginationResult := GetPagination(PaginationRequest{
		PageNumber:      req.PageNumber,
		PageSize:        req.PageSize,
		LastPageVisited: lastPageVisited,
		TotalOfElements: int32(len(files)),
		LastPageSize:    pageParameters.LastPageSize,
	})
	filesInPage := files[paginationResult.Start:paginationResult.End]
	filesInPageLength := len(filesInPage)
	if filesInPageLength == 0 {
		return nil, status.Error(codes.NotFound, "no files found")
	}

	protoFiles := make([]*pophealthpb.PopHealthFile, filesInPageLength)
	lastIDReturned := filesInPage[filesInPageLength-1].ID

	for i, file := range filesInPage {
		fileData := &pophealthpb.PopHealthFile{
			Id:            file.ID,
			FileName:      file.Filename,
			Status:        pophealthdb.EnumToFileStatus[file.Status],
			ProcessedTime: timestamppb.New(file.ProcessedAt.Time),
			UploadedTime:  timestamppb.New(file.CreatedAt),
			IsBackfill:    file.IsBackfill,
		}

		if file.TemplateName.Valid {
			fileData.TemplateName = file.TemplateName.String
			fileData.FileType = pophealthpb.FileType(pophealthpb.FileType_value[file.FileType.String])
		} else {
			fileData.TemplateName = NotFoundTemplate
			fileData.FileType = pophealthpb.FileType_FILE_TYPE_UNSPECIFIED
		}
		resultsCodes, err := s.DBService.GetFileResultCodesWithCodeDetailsByFileID(ctx, file.ID)
		if err == nil {
			fileData.UserError = getListFilesUserError(resultsCodes)
		}

		if len(file.FileParameters.Bytes) > 0 {
			err = json.Unmarshal(file.FileParameters.Bytes, &fileData.FileParameters)
			if err != nil {
				return nil, LogAndReturnErr(
					log,
					codes.Internal,
					"error unmarshalling file parameters of backfill file",
					err,
					"fileID", file.ID)
			}
		}

		protoFiles[i] = fileData
	}

	nextPageToken, err := EncodePageToken(Pagination{
		LastID:       lastIDReturned,
		LastPage:     paginationResult.PageRequested,
		LastPageSize: paginationResult.Size,
	})
	if err != nil {
		log = log.With("page", paginationResult.PageRequested)
		return nil, LogAndReturnErr(log,
			codes.Internal,
			"error trying to generate new token",
			err)
	}

	s.logger.Debug("gRPC:ListFiles success.")

	return &pophealthpb.ListFilesResponse{
		Files:         protoFiles,
		NextPageToken: []byte(nextPageToken),
		Data:          GetPaginationData(filesCount, paginationResult.Size, paginationResult.PageRequested),
	}, nil
}

func getQueryParameters(req *pophealthpb.ListFilesRequest, pageParameters Pagination) (*pophealthsql.GetFileCountForBucketFolderParams, *pophealthsql.GetFilesByBucketParams, int32, error) {
	getFilesQueryParameters := pophealthsql.GetFilesByBucketParams{
		BucketFolderID:      req.BucketFolderId,
		LastIDFilterEnabled: false,
		IsPagingForward:     true,
		StatusFilterEnabled: false,
		SearchNameEnabled:   false,
	}

	countFilesQueryParameters := pophealthsql.GetFileCountForBucketFolderParams{
		BucketFolderID:      req.BucketFolderId,
		StatusFilterEnabled: false,
		SearchNameEnabled:   false,
	}

	var lastPageVisited int32
	requestedPage := uint32(startPage)
	if pageParameters.LastID != 0 {
		getFilesQueryParameters.LastIDFilterEnabled = true
		getFilesQueryParameters.LastIDSeen = pageParameters.LastID
		if pageParameters.LastPage == 0 {
			return nil, nil, lastPageVisited, status.Errorf(codes.InvalidArgument, "missing lastPage information in token")
		}
		lastPageVisited = pageParameters.LastPage
		if req.PageNumber != nil {
			requestedPage = *req.PageNumber
		}
		if int32(requestedPage) < lastPageVisited {
			getFilesQueryParameters.IsPagingForward = false
		}
	}

	if req.Filter != nil {
		getFilesQueryParameters.StatusFilterEnabled = true
		countFilesQueryParameters.StatusFilterEnabled = true
		getFilesQueryParameters.StatusProcessed = pophealthsql.FileStatusProcessed
		countFilesQueryParameters.StatusProcessed = pophealthsql.FileStatusProcessed

		switch *req.Filter {
		case pophealthpb.ListFilesRequest_FILTER_UNSPECIFIED:
			getFilesQueryParameters.StatusFilterEnabled = false
			countFilesQueryParameters.StatusFilterEnabled = false
		case pophealthpb.ListFilesRequest_FILTER_PROCESSED:
			getFilesQueryParameters.SearchForProcessed = true
			countFilesQueryParameters.SearchForProcessed = true
		case pophealthpb.ListFilesRequest_FILTER_UNPROCESSED:
			getFilesQueryParameters.SearchForProcessed = false
			countFilesQueryParameters.SearchForProcessed = false
		}
	}

	if req.SearchFileName != nil {
		getFilesQueryParameters.SearchNameEnabled = true
		countFilesQueryParameters.SearchNameEnabled = true
		getFilesQueryParameters.NameSearched = *req.SearchFileName
		countFilesQueryParameters.NameSearched = *req.SearchFileName
	}

	return &countFilesQueryParameters, &getFilesQueryParameters, lastPageVisited, nil
}

func (s *GrpcServer) DownloadFile(req *pophealthpb.DownloadFileRequest, stream pophealthpb.PopHealthService_DownloadFileServer) error {
	ctx := stream.Context()
	file, err := s.DBService.GetFileByID(ctx, req.FileId)
	log := s.logger.With("fileID", req.FileId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return status.Errorf(codes.NotFound, "file with ID %v does not exist. Error: %v", req.FileId, err)
		}
		return LogAndReturnErr(log,
			codes.Internal,
			"error trying to get file",
			err)
	}

	fileContent, err := s.aws.GetS3File(ctx, s.exchangeBucket, file.AwsObjectKey.String)
	if err != nil {
		log = log.With("bucketName", s.exchangeBucket)
		return LogAndReturnErr(log,
			codes.Internal,
			"could not get file from s3",
			err)
	}
	defer fileContent.Close()

	bufferSize := dataChunkSize
	buffer := make([]byte, bufferSize)
	for {
		bytesRead, err := fileContent.Read(buffer)
		resp := &pophealthpb.DownloadFileResponse{
			FileName:  file.Filename,
			DataChunk: buffer[:bytesRead],
		}
		if err := stream.Send(resp); err != nil {
			return LogAndReturnErr(log, codes.Internal, "error trying to send data chunk", err)
		}
		if errors.Is(err, io.EOF) {
			break
		}
	}
	return nil
}

func (s *GrpcServer) UploadFile(stream pophealthpb.PopHealthService_UploadFileServer) error {
	ctx := stream.Context()
	res := &pophealthpb.UploadFileResponse{}

	req, err := stream.Recv()
	if err != nil {
		return LogAndReturnErr(s.logger, codes.Internal, "file stream error", err)
	}

	if req.DataChunk == nil {
		return status.Errorf(codes.NotFound, "empty chunk can not be written")
	}

	bucketID := req.GetBucketFolderId()
	fileName := req.GetFileName()
	fileParameters := req.GetFileParameters()
	log := s.logger.With("fileName", fileName,
		"bucketID", bucketID)

	if fileParameters == nil {
		fileParameters = &pophealthpb.FileParameters{}
	}

	if err := validateFileParameters(fileParameters); err != nil {
		return LogAndReturnErr(log, codes.InvalidArgument, "invalid arguments", err, "fileParameters", fileParameters)
	}

	fileParametersJSON, err := json.Marshal(fileParameters)
	if err != nil {
		return LogAndReturnErr(log, codes.Internal, "error marshaling file parameters", err)
	}

	template, err := s.templates.FindTemplateByFile(ctx, UpdateFileByTemplateRequest{
		fileName: fileName,
		bucketID: bucketID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return status.Errorf(codes.NotFound, "there are no templates in bucket folder: %v", err)
		}
		return LogAndReturnErr(log,
			codes.Internal,
			"error finding template",
			err)
	}

	isBackfill := fileParameters.GetStartDate() != nil && fileParameters.GetEndDate() != nil
	if isBackfill {
		existsProcessingBackfill, err := s.existsBackfillFileInProcessStatus(ctx, template.ChannelItemID)
		if err != nil {
			return LogAndReturnErr(log, codes.Internal, "error trying to find backfill file in process status", err)
		}

		if existsProcessingBackfill {
			return status.Error(
				codes.FailedPrecondition,
				"there is already a backfill in progress for this partner")
		}

		numberOfBackfillsRunning, err := s.DBService.GetNumberOfProcessingBackfillFiles(ctx)
		if err != nil {
			return LogAndReturnErr(log, codes.Internal, "error getting number of processing backfill files", err)
		}

		if s.numberOfParallelBackfills <= numberOfBackfillsRunning {
			return status.Error(
				codes.FailedPrecondition,
				"maximum number of running backfills has been reached")
		}
	}

	tmpFileName, err := generateTmpFile(fileName)
	if err != nil {
		return LogAndReturnErr(log, codes.NotFound, "tmp file creation error", err)
	}

	for {
		err = fillingTmpFile(req.DataChunk, tmpFileName)
		if err != nil {
			return LogAndReturnErr(log, codes.NotFound, "tmp file creation error", err)
		}

		req, err = stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
	}

	fileData, err := s.DBService.GetBucketFolderByID(ctx, bucketID)
	if err != nil {
		return LogAndReturnErr(log, codes.NotFound, "bucket information not found", err)
	}

	file, err := readTmpFile(tmpFileName)
	if err != nil {
		return LogAndReturnErr(log, codes.NotFound, "tmp file read error", err)
	}
	awsObjectKey := fmt.Sprintf("%s/%d/%s", loadFolder, time.Now().Unix(), fileName)
	err = s.aws.AddS3File(ctx, fileData.S3BucketName, awsObjectKey, file)
	if err != nil {
		log = log.With("bucketName", fileData.S3BucketName)
		return LogAndReturnErr(log,
			codes.Internal,
			"file could not be Put on the S3",
			err)
	}

	addFileArgs := pophealthsql.AddFileParams{
		Filename:       fileName,
		Status:         pophealthsql.FileStatusNew,
		BucketFolderID: fileData.ID,
		AwsObjectKey:   sqltypes.ToValidNullString(awsObjectKey),
		TemplateID:     sqltypes.ToValidNullInt64(template.ID),
		FileParameters: pgtype.JSONB{
			Bytes:  fileParametersJSON,
			Status: pgtype.Present,
		},
		IsBackfill: isBackfill,
	}

	_, err = s.DBService.AddFile(ctx, addFileArgs)
	if err != nil {
		return LogAndReturnErr(log,
			codes.Internal,
			"error inserting file in DB",
			err)
	}

	return stream.SendAndClose(res)
}

func (s *GrpcServer) SyncPatients(ctx context.Context, req *pophealthpb.SyncPatientsRequest) (*pophealthpb.SyncPatientsResponse, error) {
	log := s.logger.With("channelItemID", req.ChannelItemId, "source", "grpc_server")
	prefectRequest, err := s.prefect.BuildSyncPatientsPrefectRequest(req.ChannelItemId)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error building prefect request", err)
	}

	flowID, err := s.prefect.DoRequest(ctx, prefectRequest)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error executing prefect request", err,
			"source", "grpc_server",
			"type", "prefect",
		)
	}

	log.Infow("sync patients prefect request success", "flowID", flowID)
	return &pophealthpb.SyncPatientsResponse{}, nil
}

func (s *GrpcServer) UpdateBackfillFileStatus(ctx context.Context, req *pophealthpb.UpdateBackfillFileStatusRequest) (*pophealthpb.UpdateBackfillFileStatusResponse, error) {
	log := s.logger.With("channelItemID", req.ChannelItemId, "source", "grpc_server", "status", req.Status, "numberOfMatches", req.NumberOfMatches)
	backfillFile, err := s.DBService.GetProcessingBackfillFileByChannelItemID(ctx, req.ChannelItemId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, LogAndReturnErr(log, codes.NotFound, "backfill file not found", err)
		}
		return nil, LogAndReturnErr(log, codes.Internal, "error getting processing backfill file", err)
	}

	status := pophealthsql.FileStatusProcessed
	if req.Status != pophealthpb.BackfillStatus_BACKFILL_STATUS_PROCESSED {
		status = pophealthsql.FileStatusFailed
	}
	_, err = s.DBService.UpdateFileStatusByID(ctx, pophealthsql.UpdateFileStatusByIDParams{
		ID:          backfillFile.ID,
		ProcessedAt: sqltypes.ToValidNullTime(time.Now()),
		Status:      status,
	})
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error updating backfill file status", err)
	}

	s.sendBackfillNotification(ctx, backfillFile.ID, req.NumberOfMatches)
	log.Info("successfully updated backfill file status")
	return &pophealthpb.UpdateBackfillFileStatusResponse{}, nil
}

func (s *GrpcServer) sendBackfillNotification(ctx context.Context, fileID int64, numberOfMatches int32) {
	log := s.logger.With("fileID", fileID, "source", "grpc_server")
	resultCodes, err := s.DBService.GetFileResultCodesWithCodeDetailsByFileID(ctx, fileID)
	if err != nil {
		log.Errorw("error getting file result codes", zap.Error(err))
		return
	}

	file, err := s.DBService.GetFileAndBucketFolderByFileID(ctx, fileID)
	if err != nil {
		log.Errorw("error getting file and bucket folder", zap.Error(err))
		return
	}

	emails, err := s.DBService.GetEmailNotificationsByBucketID(ctx, file.BucketFolderID)
	if err != nil {
		log.Errorw("error getting email notifications", zap.Error(err))
		return
	}

	if len(emails) > 0 {
		err = s.mailer.SendProcessingReport(ctx, mailer.SendProcessingReportParams{
			File:        file,
			ResultCodes: resultCodes,
			TotalNumberOfPatients: mailer.PatientCount{
				Int32: file.NumberOfPatientsLoaded,
				Valid: true,
			},
			ToEmails:                  emails,
			CareRequestPartnerMatches: numberOfMatches,
		})
		if err != nil {
			log.Errorw("error sending processing report", zap.Error(err))
		}
	}
}

func generateTmpFile(fileName string) (string, error) {
	file, err := os.CreateTemp("", fileName)
	if err != nil {
		return "", status.Errorf(codes.Internal, "error creating tmp file %v", err)
	}

	return file.Name(), nil
}

func fillingTmpFile(chunk []byte, filePath string) error {
	tmpFile, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, os.ModeAppend)
	if err != nil {
		return fmt.Errorf("could not open filepath %v error: %w", filePath, err)
	}
	defer tmpFile.Close()

	var fileData bytes.Buffer
	_, err = fileData.Write(chunk)
	if err != nil {
		return status.Errorf(codes.Internal, "file chunk can not be written %v", err)
	}

	_, err = tmpFile.Write(fileData.Bytes())
	if err != nil {
		return status.Errorf(codes.Internal, "error writing in tmp file %v", err)
	}

	return nil
}

func readTmpFile(filePath string) ([]byte, error) {
	upFile, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("could not open filepath %v error: %w", filePath, err)
	}
	defer upFile.Close()

	upFileInfo, _ := upFile.Stat()
	var fileSize = upFileInfo.Size()
	fileBuffer := make([]byte, fileSize)
	_, err = upFile.Read(fileBuffer)
	if err != nil {
		return nil, fmt.Errorf("could not read file error: %w", err)
	}

	defer os.Remove(filePath)

	return fileBuffer, nil
}

func getListFilesUserError(resultsCodes []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow) string {
	var fileErrs, rowErrs []string
	for _, resultCode := range resultsCodes {
		var buf bytes.Buffer
		errorDescription := resultCode.CodeDescription.String
		if resultCode.ErrorDescription.Valid {
			errorDescription = resultCode.ErrorDescription.String
		}
		switch resultCode.CodeLevel {
		case CodeLevelFile:
			_ = fileErrorMsgTemplate.Execute(&buf, struct {
				Type        string
				Fields      string
				Description string
			}{Type: "file", Fields: resultCode.Fields.String, Description: errorDescription})
			fileErrs = append(fileErrs, buf.String())
		case CodeLevelRow:
			_ = rowErrorMsgTemplate.Execute(&buf, struct {
				Type        string
				Occurrences int32
				Description string
			}{Type: "row", Occurrences: resultCode.NumberOfOccurrences, Description: errorDescription})
			rowErrs = append(rowErrs, buf.String())
		}
	}
	fileErrs = append(fileErrs, rowErrs...)
	maxErrs := maxNumberErrorsDisplayed
	if len(fileErrs) < maxNumberErrorsDisplayed {
		maxErrs = len(fileErrs)
	}
	errorsStr := make([]string, maxErrs)
	for i, errStr := range fileErrs[0:maxErrs] {
		errorsStr[i] = fmt.Sprintf("%d. %s", i+1, errStr)
	}

	return strings.Join(errorsStr, "\n")
}

func validateFileParameters(fileParameters *pophealthpb.FileParameters) error {
	if fileParameters.ForceUpload && (fileParameters.StartDate != nil || fileParameters.EndDate != nil) {
		return errors.New("file can't have force upload and start and end date")
	}

	if fileParameters.ForceUpload || (fileParameters.StartDate == nil && fileParameters.EndDate == nil) {
		return nil
	}

	if fileParameters.StartDate == nil || fileParameters.EndDate == nil {
		return errors.New("start date and end date are both required for backfill")
	}

	startDateTime := time.Date(
		int(fileParameters.StartDate.Year),
		time.Month(fileParameters.StartDate.Month),
		int(fileParameters.StartDate.Day),
		0, 0, 0, 0, time.UTC,
	)
	endDateTime := time.Date(
		int(fileParameters.EndDate.Year),
		time.Month(fileParameters.EndDate.Month),
		int(fileParameters.EndDate.Day),
		0, 0, 0, 0, time.UTC,
	)

	if startDateTime.After(endDateTime) {
		return errors.New("start date can't be after end date")
	}

	return nil
}

func (s *GrpcServer) existsBackfillFileInProcessStatus(ctx context.Context, channelItemID int64) (bool, error) {
	_, err := s.DBService.GetOldestFileByStatusWithChannelItem(ctx, pophealthsql.GetOldestFileByStatusWithChannelItemParams{
		Status:        pophealthsql.FileStatusProcessing,
		ChannelItemID: channelItemID,
		IsBackfill:    true,
	})
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return false, err
		}
		return false, nil
	}
	return true, nil
}

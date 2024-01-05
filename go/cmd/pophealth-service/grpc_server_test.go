package main

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"os"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgtype"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	errInternalTest = errors.New("internal error")
	GenerateTmpFile = generateTmpFile
	FillingTmpFile  = fillingTmpFile
	ReadTmpFile     = readTmpFile
)

type mockDBService struct {
	getBucketFoldersResp                          []*pophealthsql.BucketFolder
	getBucketFolderResp                           *pophealthsql.BucketFolder
	updateBucketFolderResp                        *pophealthsql.BucketFolder
	addBucketFolderResp                           *pophealthsql.BucketFolder
	getConfigurationsResp                         []*pophealthsql.Template
	getTemplateByIDResp                           *pophealthsql.Template
	updateTemplateNameResp                        *pophealthsql.Template
	addTemplateResp                               *pophealthsql.Template
	getFileResp                                   *pophealthsql.File
	deleteFileResp                                *pophealthsql.File
	getFileAndBucketFolderByFileIDResp            *pophealthsql.GetFileAndBucketFolderByFileIDRow
	getTemplatesInBucketFolderResp                []*pophealthsql.Template
	deactivateBucketFolderResp                    *pophealthsql.BucketFolder
	deleteFileErr                                 error
	getFilesByBucketResp                          []*pophealthsql.GetFilesByBucketRow
	getFileCountForBucketFolderResp               int64
	getFileCountForBucketFolderErr                error
	addFileResp                                   *pophealthsql.File
	addFileErr                                    error
	err                                           error
	addBucketFolderEmailNotificationsResp         *pophealthsql.BucketFolderEmailNotification
	addBucketFolderEmailNotificationsErr          error
	deleteBucketFolderEmailNotificationsResp      error
	getEmailNotificationsByBucketIDResp           []string
	getEmailNotificationsByBucketIDErr            error
	getFileResultCodesWithCodeDetailsByFileIDFunc func(int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error)
	deleteTemplateResp                            *pophealthsql.Template
	deleteTemplateErr                             error
	deleteBucketFolderErr                         error
	getFilesAndTemplatesCountResp                 *pophealthsql.GetFilesAndTemplatesCountRow
	getFilesAndTemplatesCountErr                  error
	getOldestFileByStatusWithChannelItemResp      *pophealthsql.File
	getOldestFileByStatusWithChannelItemErr       error
	getTemplatesInBucketFolderErr                 error
	deactivateBucketFolderErr                     error
	getProcessingBackfillFileByChannelItemIDResp  *pophealthsql.File
	getProcessingBackfillFileByChannelItemIDErr   error
	updateFileStatusByIDResp                      *pophealthsql.File
	updateFileStatusByIDErr                       error
	getTemplateByChannelItemIDResp                *pophealthsql.Template
	getTemplateByChannelItemIDErr                 error
	getTemplateByBucketFolderAndNameResp          *pophealthsql.Template
	getTemplateByBucketFolderAndNameErr           error
	getNumberOfProcessingBackfillFilesResp        int64
	getNumberOfProcessingBackfillFilesErr         error
}

func (s *mockDBService) GetBucketFolders(_ context.Context) ([]*pophealthsql.BucketFolder, error) {
	return s.getBucketFoldersResp, s.err
}

func (s *mockDBService) GetBucketFolderByID(_ context.Context, _ int64) (*pophealthsql.BucketFolder, error) {
	return s.getBucketFolderResp, s.err
}

func (s *mockDBService) UpdateBucketFolder(_ context.Context, _ pophealthsql.UpdateBucketFolderParams) (*pophealthsql.BucketFolder, error) {
	return s.updateBucketFolderResp, s.err
}

func (s *mockDBService) AddBucketFolder(_ context.Context, _ pophealthsql.AddBucketFolderParams) (*pophealthsql.BucketFolder, error) {
	return s.addBucketFolderResp, s.err
}

func (s *mockDBService) UpdateTemplateByID(_ context.Context, _ pophealthsql.UpdateTemplateByIDParams) (*pophealthsql.Template, error) {
	return s.updateTemplateNameResp, s.err
}

func (s *mockDBService) AddTemplateToBucketFolder(_ context.Context, _ pophealthsql.AddTemplateToBucketFolderParams) (*pophealthsql.Template, error) {
	return s.addTemplateResp, s.err
}

func (s *mockDBService) GetTemplateByID(_ context.Context, _ int64) (*pophealthsql.Template, error) {
	return s.getTemplateByIDResp, s.err
}

func (s *mockDBService) GetActiveTemplatesInBucketFolder(_ context.Context, _ int64) ([]*pophealthsql.Template, error) {
	return s.getConfigurationsResp, s.err
}

func (s *mockDBService) GetFileByID(_ context.Context, _ int64) (*pophealthsql.File, error) {
	return s.getFileResp, s.err
}

func (s *mockDBService) DeleteFileByID(_ context.Context, _ int64) (*pophealthsql.File, error) {
	return s.deleteFileResp, s.deleteFileErr
}

func (s *mockDBService) GetFileAndBucketFolderByFileID(_ context.Context, _ int64) (*pophealthsql.GetFileAndBucketFolderByFileIDRow, error) {
	return s.getFileAndBucketFolderByFileIDResp, s.err
}

func (s *mockDBService) GetFilesByBucket(_ context.Context, _ pophealthsql.GetFilesByBucketParams) ([]*pophealthsql.GetFilesByBucketRow, error) {
	return s.getFilesByBucketResp, s.err
}

func (s *mockDBService) GetFileCountForBucketFolder(_ context.Context, _ pophealthsql.GetFileCountForBucketFolderParams) (int64, error) {
	return s.getFileCountForBucketFolderResp, s.getFileCountForBucketFolderErr
}

func (s *mockDBService) AddFile(_ context.Context, _ pophealthsql.AddFileParams) (*pophealthsql.File, error) {
	return s.addFileResp, s.addFileErr
}

func (s *mockDBService) AddBucketFolderEmailNotifications(_ context.Context, _ pophealthsql.AddBucketFolderEmailNotificationsParams) (*pophealthsql.BucketFolderEmailNotification, error) {
	return s.addBucketFolderEmailNotificationsResp, s.addBucketFolderEmailNotificationsErr
}

func (s *mockDBService) DeleteBucketFolderEmailNotifications(_ context.Context, _ int64) error {
	return s.deleteBucketFolderEmailNotificationsResp
}

func (s *mockDBService) GetEmailNotificationsByBucketID(_ context.Context, _ int64) ([]string, error) {
	return s.getEmailNotificationsByBucketIDResp, s.getEmailNotificationsByBucketIDErr
}

func (s *mockDBService) GetFileResultCodesWithCodeDetailsByFileID(_ context.Context, id int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
	if s.getFileResultCodesWithCodeDetailsByFileIDFunc != nil {
		return s.getFileResultCodesWithCodeDetailsByFileIDFunc(id)
	}
	return nil, pgx.ErrNoRows
}

func (s *mockDBService) DeleteTemplateByID(_ context.Context, _ int64) (*pophealthsql.Template, error) {
	return s.deleteTemplateResp, s.deleteTemplateErr
}

func (s *mockDBService) DeleteBucketFolder(_ context.Context, _ int64) error {
	return s.deleteBucketFolderErr
}

func (s *mockDBService) GetFilesAndTemplatesCount(_ context.Context, _ int64) (*pophealthsql.GetFilesAndTemplatesCountRow, error) {
	return s.getFilesAndTemplatesCountResp, s.getFilesAndTemplatesCountErr
}

func (s *mockDBService) GetTemplatesInBucketFolder(_ context.Context, _ int64) ([]*pophealthsql.Template, error) {
	return s.getTemplatesInBucketFolderResp, s.getTemplatesInBucketFolderErr
}

func (s *mockDBService) DeactivateBucketFolder(_ context.Context, _ int64) (*pophealthsql.BucketFolder, error) {
	return s.deactivateBucketFolderResp, s.deactivateBucketFolderErr
}

func (s *mockDBService) GetOldestFileByStatusWithChannelItem(context.Context, pophealthsql.GetOldestFileByStatusWithChannelItemParams) (*pophealthsql.File, error) {
	return s.getOldestFileByStatusWithChannelItemResp, s.getOldestFileByStatusWithChannelItemErr
}

func (s *mockDBService) GetProcessingBackfillFileByChannelItemID(context.Context, int64) (*pophealthsql.File, error) {
	return s.getProcessingBackfillFileByChannelItemIDResp, s.getProcessingBackfillFileByChannelItemIDErr
}

func (s *mockDBService) UpdateFileStatusByID(context.Context, pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error) {
	return s.updateFileStatusByIDResp, s.updateFileStatusByIDErr
}

func (s *mockDBService) GetTemplateByChannelItemID(context.Context, pophealthsql.GetTemplateByChannelItemIDParams) (*pophealthsql.Template, error) {
	return s.getTemplateByChannelItemIDResp, s.getTemplateByChannelItemIDErr
}

func (s *mockDBService) GetTemplateByBucketFolderAndName(context.Context, pophealthsql.GetTemplateByBucketFolderAndNameParams) (*pophealthsql.Template, error) {
	return s.getTemplateByBucketFolderAndNameResp, s.getTemplateByBucketFolderAndNameErr
}

func (s *mockDBService) GetNumberOfProcessingBackfillFiles(context.Context) (int64, error) {
	return s.getNumberOfProcessingBackfillFilesResp, s.getNumberOfProcessingBackfillFilesErr
}

type mockAwsService struct {
	bucketExistsResp          bool
	deleteObjectResp          bool
	err                       error
	putBucketNotificationResp error
	getObjectResp             io.ReadCloser
	addS3FileResp             error
}

func (s mockAwsService) BucketExists(_ context.Context, _ string) bool {
	return s.bucketExistsResp
}

func (s *mockAwsService) DeleteS3File(_ context.Context, _ string, _ string) error {
	return s.err
}

func (s mockAwsService) PutBucketNotification(_ context.Context, _ string, _ []string) error {
	return s.putBucketNotificationResp
}

func (s mockAwsService) GetS3File(_ context.Context, _ string, _ string) (io.ReadCloser, error) {
	return s.getObjectResp, s.err
}

func (s *mockAwsService) AddS3File(_ context.Context, _ string, _ string, _ []byte) error {
	return s.addS3FileResp
}

type mockUpdateFileStream struct {
	grpc.ServerStream
	ctx            context.Context
	sentFromServer chan *pophealthpb.UploadFileResponse
	sentFromClient chan *pophealthpb.UploadFileRequest
	serverErr      chan error
}

func newUpdateFileStream() *mockUpdateFileStream {
	return &mockUpdateFileStream{
		ctx:            context.Background(),
		sentFromServer: make(chan *pophealthpb.UploadFileResponse),
		sentFromClient: make(chan *pophealthpb.UploadFileRequest),
		serverErr:      make(chan error),
	}
}

func (m *mockUpdateFileStream) Context() context.Context {
	return m.ctx
}

func (m *mockUpdateFileStream) SendAndClose(resp *pophealthpb.UploadFileResponse) error {
	m.sentFromServer <- resp
	close(m.sentFromServer)
	return nil
}

func (m *mockUpdateFileStream) Recv() (*pophealthpb.UploadFileRequest, error) {
	select {
	case request, ok := <-m.sentFromClient:
		if !ok {
			return nil, io.EOF
		}
		return request, nil
	case err := <-m.serverErr:
		return nil, err
	}
}

func (m *mockUpdateFileStream) Send(req *pophealthpb.UploadFileRequest, hasStreamErr bool) error {
	if hasStreamErr {
		return errors.New("unable to send UploadFileRequest request")
	}
	m.sentFromClient <- req
	return nil
}

type mockFileTemplateService struct {
	findTemplateByFileResp *pophealthsql.Template
	findTemplateByFileErr  error
}

func (m *mockFileTemplateService) FindTemplateByFile(_ context.Context, _ UpdateFileByTemplateRequest) (*pophealthsql.Template, error) {
	return m.findTemplateByFileResp, m.findTemplateByFileErr
}

func TestNewGRPCServer(t *testing.T) {
	s := NewGRPCServer(GrpcServerDependencies{
		DBService:           &mockDBService{},
		Aws:                 &mockAwsService{},
		FileTemplateService: &mockFileTemplateService{},
	}, "test-exchange", 2, zap.NewNop().Sugar())

	if s == nil {
		t.Error("expected server to be created")
	}
}

func TestPopHealthServerListBuckets(t *testing.T) {
	mockID1 := int64(10)
	mockName1 := "Name 10"
	mockS3BucketName1 := "S3 bucket name 10"

	mockID2 := int64(11)
	mockName2 := "Name 11"
	mockS3BucketName2 := "S3 bucket name 11"

	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.ListBucketsRequest
		logger    *zap.SugaredLogger

		expectedResp *pophealthpb.ListBucketsResponse
		hasError     bool
	}{
		{
			name: "happy path getting list buckets",
			dbService: &mockDBService{
				getBucketFoldersResp: []*pophealthsql.BucketFolder{
					{
						ID:           mockID1,
						Name:         mockName1,
						S3BucketName: mockS3BucketName1,
					},
					{
						ID:           mockID2,
						Name:         mockName2,
						S3BucketName: mockS3BucketName2,
					},
				},
			},
			req: &pophealthpb.ListBucketsRequest{},
			expectedResp: &pophealthpb.ListBucketsResponse{
				Buckets: []*pophealthpb.PopHealthBucket{
					{
						Id:           &mockID1,
						DisplayName:  mockName1,
						S3BucketName: mockS3BucketName1,
					},
					{
						Id:           &mockID2,
						DisplayName:  mockName2,
						S3BucketName: mockS3BucketName2,
					},
				},
			},
			hasError: false,
		},
		{
			name: "error getting list buckets",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req:      &pophealthpb.ListBucketsRequest{},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.ListBuckets(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}

			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "List buckets folders don't match")
		})
	}
}

func TestPopHealthServerGetBucket(t *testing.T) {
	mockBucket := &pophealthsql.BucketFolder{
		ID:           10,
		Name:         "Name 10",
		S3BucketName: "S3 bucket name 10",
	}
	mockInvalidID := int64(11)

	emailNotificationsMock := []string{
		"email-1@test.com",
		"email-2@test.com",
	}

	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.GetBucketRequest
		logger    *zap.SugaredLogger

		expectedResp *pophealthpb.GetBucketResponse
		hasError     bool
	}{
		{
			name: "happy path getting bucket",
			dbService: &mockDBService{
				getBucketFolderResp:                mockBucket,
				getEmailNotificationsByBucketIDErr: pgx.ErrNoRows,
			},
			req: &pophealthpb.GetBucketRequest{
				Id: mockBucket.ID,
			},

			expectedResp: &pophealthpb.GetBucketResponse{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockBucket.ID,
					DisplayName:  mockBucket.Name,
					S3BucketName: mockBucket.S3BucketName,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
		},
		{
			name: "happy path getting bucket with email notifications",
			dbService: &mockDBService{
				getBucketFolderResp:                 mockBucket,
				getEmailNotificationsByBucketIDResp: emailNotificationsMock,
			},
			req: &pophealthpb.GetBucketRequest{
				Id: mockBucket.ID,
			},

			expectedResp: &pophealthpb.GetBucketResponse{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockBucket.ID,
					DisplayName:  mockBucket.Name,
					S3BucketName: mockBucket.S3BucketName,
					EmailList:    emailNotificationsMock,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
		},
		{
			name: "error getting bucket",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req: &pophealthpb.GetBucketRequest{
				Id: mockBucket.ID,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "request bucket id does not exist",
			dbService: &mockDBService{
				err: pgx.ErrNoRows,
			},
			req: &pophealthpb.GetBucketRequest{
				Id: mockInvalidID,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error getting bucket email notifications",
			dbService: &mockDBService{
				getBucketFolderResp:                mockBucket,
				getEmailNotificationsByBucketIDErr: errInternalTest,
			},
			req: &pophealthpb.GetBucketRequest{
				Id: mockInvalidID,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()

			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.GetBucket(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp.Bucket, resp.Bucket, "bucket folders don't match")
		})
	}
}

func TestPopHealthServerUpsertBucket(t *testing.T) {
	mockID1 := int64(20)
	mockID2 := int64(21)
	mockName1 := "Name 20"
	mockName2 := "Name 21"
	mockS3BucketName := "S3 bucket name 21"

	tests := []struct {
		name       string
		dbService  *mockDBService
		awsService *mockAwsService
		req        *pophealthpb.UpsertBucketRequest
		logger     *zap.SugaredLogger

		hasError   bool
		idExpected int64
	}{
		{
			name: "happy path updating an old bucket folder",
			dbService: &mockDBService{
				updateBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID1,
					Name:         mockName1,
					S3BucketName: "S3 bucket name 20",
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockID1,
					DisplayName:  mockName1,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:     zap.NewNop().Sugar(),
			hasError:   false,
			idExpected: mockID1,
		},
		{
			name: "happy path updating an old bucket folder with email list",
			dbService: &mockDBService{
				updateBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID1,
					Name:         mockName1,
					S3BucketName: "S3 bucket name 20",
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockID1,
					DisplayName:  mockName1,
					S3BucketName: mockS3BucketName,
					EmailList: []string{
						"update1_email@test.com",
						"update2_email@test.com",
					},
				},
			},
			logger:     zap.NewNop().Sugar(),
			hasError:   false,
			idExpected: mockID1,
		},
		{
			name: "internal error updating an old bucket folder",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:          &mockID1,
					DisplayName: mockName1,
				},
			},
			hasError: true,
		},
		{
			name: "internal error updating email list from an old bucket folder",
			dbService: &mockDBService{
				updateBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID1,
					Name:         mockName1,
					S3BucketName: "S3 bucket name 20",
				},
				addBucketFolderEmailNotificationsErr: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockID1,
					DisplayName:  mockName1,
					S3BucketName: mockS3BucketName,
					EmailList: []string{
						"update3_email@test.com",
						"update4_email@test.com",
					},
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "happy path adding a new bucket folder",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:     zap.NewNop().Sugar(),
			hasError:   false,
			idExpected: mockID2,
		},
		{
			name: "happy path adding a new bucket folder with email list",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
					EmailList: []string{
						"add1_email@test.com",
						"add2_email@test.com",
					},
				},
			},
			logger:     zap.NewNop().Sugar(),
			hasError:   false,
			idExpected: mockID2,
		},
		{
			name:       "error adding a new bucket folder, no bucket in request",
			dbService:  &mockDBService{},
			awsService: &mockAwsService{},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: nil,
			},
			hasError: true,
		},
		{
			name: "error adding a new bucket folder",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error updating email list when adding a new bucket folder",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
				addBucketFolderEmailNotificationsErr: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
					EmailList: []string{
						"add3_email@test.com",
						"add4_email@test.com",
					},
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error creating bucket folder, it doesn't exists on aws",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: false},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			hasError: true,
		},
		{
			name: "error updating bucket folder in DB",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockID1,
					DisplayName:  mockName1,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error updating bucket folder, it doesn't exists on aws",
			dbService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID1,
					Name:         mockName1,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: false},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:           &mockID1,
					DisplayName:  mockName1,
					S3BucketName: mockS3BucketName,
				},
			},
			hasError: true,
		},
		{
			name: "error updating bucket, missing s3 bucket name",
			dbService: &mockDBService{
				updateBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID1,
					Name:         mockName1,
					S3BucketName: "S3 bucket name 20",
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					Id:          &mockID1,
					DisplayName: mockName1,
				},
			},
			hasError: true,
		},
		{
			name: "error creating bucket folder, unable to add notification configuration",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true, putBucketNotificationResp: errInternalTest},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error deleting bucket folder email notifications",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
				deleteBucketFolderEmailNotificationsResp: errInternalTest,
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error saving invalid email notification",
			dbService: &mockDBService{
				addBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockID2,
					Name:         mockName2,
					S3BucketName: mockS3BucketName,
				},
			},
			awsService: &mockAwsService{bucketExistsResp: true},
			req: &pophealthpb.UpsertBucketRequest{
				Bucket: &pophealthpb.PopHealthBucket{
					DisplayName:  mockName2,
					S3BucketName: mockS3BucketName,
					EmailList: []string{
						"email-bad-format",
					},
				},
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dbService,
				aws:       test.awsService,
				logger:    test.logger,
			}

			resp, err := server.UpsertBucket(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			if resp.Id != test.idExpected {
				t.Errorf("got ID %d but expected ID to be %d", resp.Id, test.idExpected)
			}
		})
	}
}

func TestPopHealthServerDeleteBucket(t *testing.T) {
	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.DeleteBucketRequest
		logger    *zap.SugaredLogger

		expectedResp *pophealthpb.DeleteBucketResponse
		hasError     bool
	}{
		{
			name: "happy path deleting bucket",
			dbService: &mockDBService{
				getFilesAndTemplatesCountResp: &pophealthsql.GetFilesAndTemplatesCountRow{},
			},
			req: &pophealthpb.DeleteBucketRequest{
				Id: time.Now().UnixNano(),
			},
			logger:       zap.NewNop().Sugar(),
			expectedResp: &pophealthpb.DeleteBucketResponse{},
			hasError:     false,
		},
		{
			name: "error getting files and templates count",
			dbService: &mockDBService{
				getFilesAndTemplatesCountErr: errInternalTest,
			},
			req: &pophealthpb.DeleteBucketRequest{
				Id: time.Now().UnixNano(),
			},
			hasError: true,
		},
		{
			name: "error deleting bucket, it contains files",
			dbService: &mockDBService{
				getFilesAndTemplatesCountResp: &pophealthsql.GetFilesAndTemplatesCountRow{
					NumFiles: 1,
				},
			},
			req: &pophealthpb.DeleteBucketRequest{
				Id: time.Now().UnixNano(),
			},
			hasError: true,
		},
		{
			name: "error deleting bucket, it contains templates",
			dbService: &mockDBService{
				getFilesAndTemplatesCountResp: &pophealthsql.GetFilesAndTemplatesCountRow{
					NumTemplates: 1,
				},
			},
			req: &pophealthpb.DeleteBucketRequest{
				Id: time.Now().UnixNano(),
			},
			hasError: true,
		},
		{
			name: "error deleting bucket",
			dbService: &mockDBService{
				getFilesAndTemplatesCountResp: &pophealthsql.GetFilesAndTemplatesCountRow{},
				deleteBucketFolderErr:         errInternalTest,
			},
			req: &pophealthpb.DeleteBucketRequest{
				Id: time.Now().UnixNano(),
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()

			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.DeleteBucket(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "delete bucket responses don't match")
		})
	}
}

func TestDeactivateBucket(t *testing.T) {
	ctx := context.Background()
	templates := []*pophealthsql.Template{
		{
			ID:            1,
			Name:          "Template1",
			ChannelItemID: 2,
		},
		{
			ID:            2,
			Name:          "Template2",
			ChannelItemID: 4,
		},
	}
	tests := []struct {
		name           string
		req            *pophealthpb.DeactivateBucketRequest
		dbService      *mockDBService
		prefectService *mockPrefectClient
		logger         *zap.SugaredLogger

		hasError     bool
		expectedResp *pophealthpb.DeactivateBucketResponse
	}{
		{
			name: "happy path deactivating bucket",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
				deactivateBucketFolderResp:     &pophealthsql.BucketFolder{},
			},
			prefectService: &mockPrefectClient{
				buildDeactivateBucketPrefectRequestResp: []byte("valid request"),
				doRequestResponse:                       FlowID("123-abc"),
			},
			expectedResp: &pophealthpb.DeactivateBucketResponse{},
		},
		{
			name: "happy path deactivating bucket with specific channel items",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{2, 4},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
			},
			prefectService: &mockPrefectClient{
				buildDeactivateBucketPrefectRequestResp: []byte("valid request"),
				doRequestResponse:                       FlowID("123-abc"),
			},
			expectedResp: &pophealthpb.DeactivateBucketResponse{},
		},
		{
			name: "error channel item ids do not belong to folder",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{7, 8},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
			},
			hasError: true,
		},
		{
			name: "error getting templates, templates not found",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderErr: pgx.ErrNoRows,
			},
			hasError: true,
		},
		{
			name: "error getting templates",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error building prefect request",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
			},
			prefectService: &mockPrefectClient{
				buildDeactivateBucketPrefectRequestErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error executing prefect request",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
			},
			prefectService: &mockPrefectClient{
				buildDeactivateBucketPrefectRequestResp: []byte("valid request"),
				doRequestErr:                            errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error deactivating bucket in db",
			req: &pophealthpb.DeactivateBucketRequest{
				Id:             1,
				ChannelItemIds: []int64{},
			},
			dbService: &mockDBService{
				getTemplatesInBucketFolderResp: templates,
				deactivateBucketFolderErr:      errInternalTest,
			},
			prefectService: &mockPrefectClient{
				buildDeactivateBucketPrefectRequestResp: []byte("valid request"),
				doRequestResponse:                       FlowID("123-abc"),
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := &GrpcServer{
				DBService: test.dbService,
				prefect:   test.prefectService,
				logger:    zap.NewNop().Sugar(),
			}
			resp, err := server.DeactivateBucket(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp)
			}
		})
	}
}

func TestPopHealthServerListConfigurations(t *testing.T) {
	bucketFolderIDMock := int64(40)
	templateIDMock1 := int64(41)
	templateNameMock1 := "Template Name 41"
	templateIDMock2 := int64(42)
	templateNameMock2 := "Template Name 42"
	columMappingTest1 := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "first_name",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            false,
		},
	}
	columnMappingMock1, err := generateColumnMappingJSONBMock(columMappingTest1)
	if err != nil {
		t.Fatal(err)
	}

	columMappingTest2 := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "email",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_EMAIL,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            false,
		},
	}
	columnMappingMock2, err := generateColumnMappingJSONBMock(columMappingTest2)
	if err != nil {
		t.Fatal(err)
	}

	invalidColumnMapingMock := pgtype.JSONB{Bytes: []byte("invalid"), Status: pgtype.Present}

	tests := []struct {
		name      string
		dbService *mockDBService
		logger    *zap.SugaredLogger
		req       *pophealthpb.ListConfigurationsRequest

		hasError     bool
		expectedResp *pophealthpb.ListConfigurationsResponse
	}{
		{
			name: "happy path getting list configurations in bucket",
			dbService: &mockDBService{
				getConfigurationsResp: []*pophealthsql.Template{
					{
						ID:                  templateIDMock1,
						Name:                "Template Name 41",
						FileType:            pophealthpb.FileType_FILE_TYPE_UNSPECIFIED.String(),
						FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
						FileIdentifierValue: "54565",
						BucketFolderID:      bucketFolderIDMock,
						ChannelItemID:       1,
						ColumnMapping:       columnMappingMock1,
					},
					{
						ID:                  templateIDMock2,
						Name:                "Template Name 42",
						FileType:            pophealthpb.FileType_FILE_TYPE_CSV.String(),
						FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX.String(),
						FileIdentifierValue: "15163",
						BucketFolderID:      bucketFolderIDMock,
						ChannelItemID:       2,
						ColumnMapping:       columnMappingMock2,
					},
				},
			},
			logger: zap.NewNop().Sugar(),
			req: &pophealthpb.ListConfigurationsRequest{
				BucketFolderId: bucketFolderIDMock,
			},
			hasError: false,
			expectedResp: &pophealthpb.ListConfigurationsResponse{
				Configurations: []*pophealthpb.PopHealthConfiguration{
					{
						Id:       &templateIDMock1,
						Name:     templateNameMock1,
						FileType: pophealthpb.FileType_FILE_TYPE_UNSPECIFIED,
						FileIdentifier: &pophealthpb.FileIdentifier{
							Type:  1,
							Value: "54565",
						},
						BucketFolderId: bucketFolderIDMock,
						ChannelItemId:  1,
						ColumnMapping:  columMappingTest1,
					},
					{
						Id:       &templateIDMock2,
						Name:     templateNameMock2,
						FileType: pophealthpb.FileType_FILE_TYPE_CSV,
						FileIdentifier: &pophealthpb.FileIdentifier{
							Type:  2,
							Value: "15163",
						},
						BucketFolderId: bucketFolderIDMock,
						ChannelItemId:  2,
						ColumnMapping:  columMappingTest2,
					},
				},
			},
		},
		{
			name: "error getting list configurations in bucket",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req: &pophealthpb.ListConfigurationsRequest{
				BucketFolderId: bucketFolderIDMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error translating template to pop health config",
			dbService: &mockDBService{
				getConfigurationsResp: []*pophealthsql.Template{
					{
						ID:                  templateIDMock1,
						Name:                "Template Name 41",
						FileType:            pophealthpb.FileType_FILE_TYPE_UNSPECIFIED.String(),
						FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
						FileIdentifierValue: "54565",
						BucketFolderID:      bucketFolderIDMock,
						ChannelItemID:       1,
						ColumnMapping:       invalidColumnMapingMock,
					},
				},
			},
			req: &pophealthpb.ListConfigurationsRequest{
				BucketFolderId: bucketFolderIDMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.ListConfigurations(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp.Configurations, resp.Configurations, "configurations list don't match")
		})
	}
}

func TestPopHealthServerGetConfiguration(t *testing.T) {
	columnMappingTest := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "dob",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_DOB,
			DataType:              pophealthpb.DataType_DATA_TYPE_DATE,
			DateFormat:            pophealthpb.ColumnMapping_DateFormat.Enum(pophealthpb.ColumnMapping_DATE_FORMAT_MMDDYYYY_SLASH),
			IsRequired:            true,
		},
		{
			SourceColumnName:      "first_name",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            false,
		},
		{
			SourceColumnName:      "zipcode",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_ZIPCODE,
			DataType:              pophealthpb.DataType_DATA_TYPE_INTEGER,
			IsRequired:            false,
		},
	}
	columnMappingMock, err := generateColumnMappingJSONBMock(columnMappingTest)
	if err != nil {
		t.Fatal(err)
	}

	templateNameMock := "Template 10"
	templateIDMock := int64(10)

	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.GetConfigurationRequest
		logger    *zap.SugaredLogger

		hasError     bool
		expectedResp *pophealthpb.GetConfigurationResponse
	}{
		{
			name: "happy path getting configuration",
			dbService: &mockDBService{
				getTemplateByIDResp: &pophealthsql.Template{
					ID:                  templateIDMock,
					Name:                templateNameMock,
					FileType:            pophealthpb.FileType_FILE_TYPE_UNSPECIFIED.String(),
					FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
					FileIdentifierValue: "04345",
					BucketFolderID:      1,
					ChannelItemID:       1,
					ColumnMapping:       columnMappingMock,
				},
			},
			req: &pophealthpb.GetConfigurationRequest{
				Id: templateIDMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.GetConfigurationResponse{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:       &templateIDMock,
					Name:     templateNameMock,
					FileType: pophealthpb.FileType_FILE_TYPE_UNSPECIFIED,
					FileIdentifier: &pophealthpb.FileIdentifier{
						Type:  1,
						Value: "04345",
					},
					BucketFolderId: 1,
					ChannelItemId:  1,
					ColumnMapping:  columnMappingTest,
				},
			},
		},
		{
			name: "error not found configuration",
			dbService: &mockDBService{
				err: pgx.ErrNoRows,
			},
			req:      &pophealthpb.GetConfigurationRequest{},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error getting configuration",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req:      &pophealthpb.GetConfigurationRequest{},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.GetConfiguration(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp.Configuration, resp.Configuration, "configuration don't match")
		})
	}
}

func TestPopHealthServerUpsertConfiguration(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	mockID1 := int64(30)
	mockName1 := "Configuration 30 name"
	prefixMock1 := "prefix-1"
	prefixMock2 := "prefix-2"
	mockID2 := int64(31)
	mockName2 := "Configuration 31 name"

	columnMappingInvalid := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "last_name",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_LAST_NAME,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            false,
		},
	}
	columnMappingInvalidJSONMock, err := generateColumnMappingJSONBMock(columnMappingInvalid)
	if err != nil {
		t.Fatal(err)
	}

	columnMappingValid := []*pophealthpb.ColumnMapping{
		{
			SourceColumnName:      "first_name",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_FIRST_NAME,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            false,
		},
		{
			SourceColumnName:      "last_name",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_LAST_NAME,
			DataType:              pophealthpb.DataType_DATA_TYPE_STRING,
			IsRequired:            true,
		},
		{
			SourceColumnName:      "zipcode",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_ZIPCODE,
			DataType:              pophealthpb.DataType_DATA_TYPE_INTEGER,
			IsRequired:            false,
		},
		{
			SourceColumnName:      "dob",
			DestinationColumnName: pophealthpb.DHColumnName_DH_COLUMN_NAME_DOB,
			DataType:              pophealthpb.DataType_DATA_TYPE_DATE,
			DateFormat:            pophealthpb.ColumnMapping_DateFormat.Enum(pophealthpb.ColumnMapping_DATE_FORMAT_MMDDYYYY_SLASH),
			IsRequired:            true,
		},
	}
	newConfigReq := &pophealthpb.UpsertConfigurationRequest{
		Configuration: &pophealthpb.PopHealthConfiguration{
			Name:     mockName2,
			FileType: pophealthpb.FileType_FILE_TYPE_CSV,
			FileIdentifier: &pophealthpb.FileIdentifier{
				Type:  1,
				Value: "prefix-value",
			},
			ColumnMapping:  columnMappingValid,
			ChannelItemId:  mockID2,
			BucketFolderId: mockID2,
		},
	}
	columnMappingValidJSONMock, err := generateColumnMappingJSONBMock(columnMappingValid)
	if err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.UpsertConfigurationRequest

		hasError   bool
		idExpected int64
	}{
		{
			name: "invalid argument columns mapping validation",
			dbService: &mockDBService{
				updateTemplateNameResp: &pophealthsql.Template{
					ID:                  mockID1,
					Name:                mockName1,
					FileType:            pophealthpb.FileType_FILE_TYPE_CSV.String(),
					FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
					FileIdentifierValue: prefixMock1,
					ColumnMapping:       columnMappingInvalidJSONMock,
					ChannelItemID:       mockID1,
					BucketFolderID:      mockID1,
				},
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:       &mockID1,
					Name:     mockName1,
					FileType: pophealthpb.FileType_FILE_TYPE_CSV,
					FileIdentifier: &pophealthpb.FileIdentifier{
						Type:  1,
						Value: prefixMock1,
					},
					ColumnMapping:  columnMappingInvalid,
					ChannelItemId:  mockID1,
					BucketFolderId: mockID1,
				},
			},
			hasError: true,
		},
		{
			name: "happy path updating an old configuration",
			dbService: &mockDBService{
				updateTemplateNameResp: &pophealthsql.Template{
					ID:                  mockID1,
					Name:                mockName1,
					FileType:            pophealthpb.FileType_FILE_TYPE_CSV.String(),
					FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
					FileIdentifierValue: prefixMock2,
					ColumnMapping:       columnMappingValidJSONMock,
					ChannelItemID:       mockID1,
					BucketFolderID:      mockID1,
				},
				getTemplateByChannelItemIDErr:       pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameErr: pgx.ErrNoRows,
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:       &mockID1,
					Name:     mockName1,
					FileType: pophealthpb.FileType_FILE_TYPE_CSV,
					FileIdentifier: &pophealthpb.FileIdentifier{
						Type:  1,
						Value: prefixMock2,
					},
					ColumnMapping:  columnMappingValid,
					ChannelItemId:  mockID1,
					BucketFolderId: mockID1,
				},
			},
			hasError:   false,
			idExpected: mockID1,
		},
		{
			name: "error updating a configuration with duplicate channel item",
			dbService: &mockDBService{
				getTemplateByChannelItemIDResp: &pophealthsql.Template{
					ID:            mockID2,
					ChannelItemID: mockID1,
				},
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:       &mockID1,
					Name:     mockName1,
					FileType: pophealthpb.FileType_FILE_TYPE_CSV,
					FileIdentifier: &pophealthpb.FileIdentifier{
						Type:  1,
						Value: prefixMock2,
					},
					ColumnMapping:  columnMappingValid,
					ChannelItemId:  mockID1,
					BucketFolderId: mockID1,
				},
			},
			hasError: true,
		},
		{
			name: "error updating configuration with duplicate name and folder",
			dbService: &mockDBService{
				getTemplateByChannelItemIDErr: pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameResp: &pophealthsql.Template{
					ID:             mockID2,
					BucketFolderID: mockID1,
					Name:           mockName1,
				},
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:       &mockID1,
					Name:     mockName1,
					FileType: pophealthpb.FileType_FILE_TYPE_CSV,
					FileIdentifier: &pophealthpb.FileIdentifier{
						Type:  1,
						Value: prefixMock2,
					},
					ColumnMapping:  columnMappingValid,
					ChannelItemId:  mockID1,
					BucketFolderId: mockID1,
				},
			},
			hasError: true,
		},
		{
			name: "internal error updating an old configuration",
			dbService: &mockDBService{
				err:                                 errInternalTest,
				getTemplateByChannelItemIDErr:       pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameErr: pgx.ErrNoRows,
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Id:             &mockID1,
					Name:           mockName1,
					FileType:       pophealthpb.FileType_FILE_TYPE_CSV,
					FileIdentifier: &pophealthpb.FileIdentifier{},
					ColumnMapping:  []*pophealthpb.ColumnMapping{},
					ChannelItemId:  mockID1,
					BucketFolderId: mockID1,
				},
			},
			hasError: true,
		},
		{
			name: "happy path adding a new configuration",
			dbService: &mockDBService{
				addTemplateResp: &pophealthsql.Template{
					ID:                  mockID2,
					Name:                mockName2,
					FileType:            pophealthpb.FileType_FILE_TYPE_CSV.String(),
					FileIdentifierType:  pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
					FileIdentifierValue: "prefix-value",
					ColumnMapping:       columnMappingValidJSONMock,
					ChannelItemID:       mockID2,
					BucketFolderID:      mockID2,
				},
				getTemplateByChannelItemIDErr:       pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameErr: pgx.ErrNoRows,
			},
			req:        newConfigReq,
			hasError:   false,
			idExpected: mockID2,
		},
		{
			name: "error adding a new configuration with duplicate channel item id",
			dbService: &mockDBService{
				getTemplateByChannelItemIDResp: &pophealthsql.Template{
					ID:            mockID1,
					ChannelItemID: mockID2,
				},
			},
			req:      newConfigReq,
			hasError: true,
		},
		{
			name: "error adding a new configuration with duplicate name and folder",
			dbService: &mockDBService{
				getTemplateByChannelItemIDErr: pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameResp: &pophealthsql.Template{
					ID:             mockID1,
					BucketFolderID: mockID2,
					Name:           mockName2,
				},
			},
			req:      newConfigReq,
			hasError: true,
		},
		{
			name: "error adding a new configuration",
			dbService: &mockDBService{
				err:                                 errInternalTest,
				getTemplateByChannelItemIDErr:       pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameErr: pgx.ErrNoRows,
			},
			req: &pophealthpb.UpsertConfigurationRequest{
				Configuration: &pophealthpb.PopHealthConfiguration{
					Name:           mockName2,
					FileType:       pophealthpb.FileType_FILE_TYPE_PIPE_DELIMITED,
					FileIdentifier: &pophealthpb.FileIdentifier{},
					ColumnMapping:  []*pophealthpb.ColumnMapping{},
					ChannelItemId:  mockID2,
					BucketFolderId: mockID2,
				},
			},
			hasError: true,
		},
		{
			name: "error getting template by channel item id",
			dbService: &mockDBService{
				getTemplateByChannelItemIDErr: pgx.ErrTxClosed,
			},
			req:      newConfigReq,
			hasError: true,
		},
		{
			name: "error getting template by bucket folder id and name",
			dbService: &mockDBService{
				getTemplateByChannelItemIDErr:       pgx.ErrNoRows,
				getTemplateByBucketFolderAndNameErr: pgx.ErrTxClosed,
			},
			req:      newConfigReq,
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := &GrpcServer{
				DBService: test.dbService,
				logger:    logger,
			}

			resp, err := server.UpsertConfiguration(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			if resp.Id != test.idExpected {
				t.Errorf("got ID %d but expected ID to be %d", resp.Id, test.idExpected)
			}
		})
	}
}

func TestDeleteConfiguration(t *testing.T) {
	testConfigurationID := int64(30)

	tests := []struct {
		name      string
		dBService *mockDBService
		req       *pophealthpb.DeleteConfigurationRequest
		logger    *zap.SugaredLogger

		expected *pophealthpb.DeleteConfigurationResponse
		hasError bool
	}{
		{
			name: "Configuration deleted success",
			dBService: &mockDBService{
				getTemplateByIDResp: &pophealthsql.Template{
					ID: testConfigurationID,
				},
			},
			req:      &pophealthpb.DeleteConfigurationRequest{Id: testConfigurationID},
			logger:   zap.NewNop().Sugar(),
			expected: &pophealthpb.DeleteConfigurationResponse{},
			hasError: false,
		},
		{
			name: "Configuration deleted failure - template not found",
			dBService: &mockDBService{
				err: errInternalTest,
			},
			req:      &pophealthpb.DeleteConfigurationRequest{Id: testConfigurationID},
			logger:   zap.NewNop().Sugar(),
			expected: nil,
			hasError: true,
		},
		{
			name: "Configuration deleted failure - delete template failure",
			dBService: &mockDBService{
				getTemplateByIDResp: &pophealthsql.Template{
					ID: testConfigurationID,
				},
				deleteTemplateErr: errInternalTest,
			},
			req:      &pophealthpb.DeleteConfigurationRequest{Id: testConfigurationID},
			logger:   zap.NewNop().Sugar(),
			expected: nil,
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dBService,
				logger:    test.logger,
			}

			resp, err := server.DeleteConfiguration(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expected, resp)
		})
	}
}

func generateColumnMappingJSONBMock(columnsMapping []*pophealthpb.ColumnMapping) (pgtype.JSONB, error) {
	mockJSON, err := json.Marshal(columnsMapping)
	if err != nil {
		return pgtype.JSONB{Status: pgtype.Null}, err
	}

	return pgtype.JSONB{Bytes: mockJSON, Status: pgtype.Present}, nil
}

func TestDeleteFile(t *testing.T) {
	testFileID := int64(10)
	testS3BucketName := "Test Bucket"
	testFileName := "Test File"

	tests := []struct {
		name       string
		dBService  *mockDBService
		awsService *mockAwsService
		req        *pophealthpb.DeleteFileRequest
		logger     *zap.SugaredLogger

		expected *pophealthpb.DeleteFileResponse
		hasError bool
	}{
		{
			name: "File deleted success",
			dBService: &mockDBService{
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:       testFileID,
					Filename:     testFileName,
					S3BucketName: testS3BucketName,
				},
			},
			awsService: &mockAwsService{deleteObjectResp: true},
			req:        &pophealthpb.DeleteFileRequest{FileId: testFileID},
			logger:     zap.NewNop().Sugar(),
			expected:   &pophealthpb.DeleteFileResponse{},
			hasError:   false,
		},
		{
			name: "File deleted failure - file not found",
			dBService: &mockDBService{
				err: errInternalTest,
			},
			req:      &pophealthpb.DeleteFileRequest{FileId: testFileID},
			logger:   zap.NewNop().Sugar(),
			expected: nil,
			hasError: true,
		},
		{
			name: "File deleted failure - delete S3 file error",
			dBService: &mockDBService{
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:       testFileID,
					Filename:     testFileName,
					S3BucketName: testS3BucketName,
				},
			},
			awsService: &mockAwsService{err: errInternalTest},
			req:        &pophealthpb.DeleteFileRequest{FileId: testFileID},
			logger:     zap.NewNop().Sugar(),
			expected:   nil,
			hasError:   true,
		},
		{
			name: "File deleted failure - delete file failure",
			dBService: &mockDBService{
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:       testFileID,
					Filename:     testFileName,
					S3BucketName: testS3BucketName,
				},
				deleteFileErr: errInternalTest,
			},
			awsService: &mockAwsService{deleteObjectResp: true},
			req:        &pophealthpb.DeleteFileRequest{FileId: testFileID},
			logger:     zap.NewNop().Sugar(),
			expected:   nil,
			hasError:   true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dBService,
				aws:       test.awsService,
				logger:    test.logger,
			}

			resp, err := server.DeleteFile(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expected, resp)
		})
	}
}

func TestPopHealthServerListFiles(t *testing.T) {
	fileIDWithResultCodes := int64(26)
	getFilesWithTemplateMockResp := []*pophealthsql.GetFilesByBucketRow{
		{
			ID:       fileIDWithResultCodes,
			Filename: "File Name 26",
			Status:   pophealthsql.FileStatusFailed,
			TemplateName: sql.NullString{
				Valid: false,
			},
			FileType: sql.NullString{
				Valid: false,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(8), 3, 20, 36, 52, 40, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(8), 3, 20, 36, 52, 40, time.UTC),
		},
		{
			ID:       int64(25),
			Filename: "File Name 25",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				String: "Template Name 25",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_CSV.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(8), 1, 0, 15, 30, 10, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(8), 1, 0, 15, 30, 10, time.UTC),
		},
		{
			ID:       int64(12),
			Filename: "File Name 12",
			Status:   pophealthsql.FileStatusPreprocess,
			TemplateName: sql.NullString{
				String: "Template Name 12",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_CSV.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(7), 28, 4, 16, 39, 47, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(7), 28, 4, 16, 39, 47, time.UTC),
		},
		{
			ID:       int64(10),
			Filename: "File Name 10",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				String: "Template Name 10",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_CSV.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(6), 1, 0, 15, 30, 10, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(6), 1, 0, 15, 30, 10, time.UTC),
		},
		{
			ID:       int64(8),
			Filename: "File Name 8",
			Status:   pophealthsql.FileStatusPreprocess,
			TemplateName: sql.NullString{
				String: "Template Name 8",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_CSV.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(5), 28, 4, 16, 39, 47, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(5), 28, 4, 16, 39, 47, time.UTC),
		},
		{
			ID:       int64(7),
			Filename: "File Name 7",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				String: "Template Name 7",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_EXCEL.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(5), 20, 12, 10, 45, 52, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(5), 20, 12, 10, 45, 52, time.UTC),
		},
		{
			ID:       int64(5),
			Filename: "File Name 5",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				String: "Template Name 5",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_CSV.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(5), 15, 2, 45, 14, 3, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(5), 15, 2, 45, 14, 3, time.UTC),
		},
		{
			ID:       int64(4),
			Filename: "File Name 4",
			Status:   pophealthsql.FileStatusPreprocess,
			TemplateName: sql.NullString{
				String: "Template Name 4",
				Valid:  true,
			},
			FileType: sql.NullString{
				String: pophealthpb.FileType_FILE_TYPE_EXCEL.String(),
				Valid:  true,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(5), 10, 16, 28, 60, 8, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(5), 10, 16, 28, 60, 8, time.UTC),
		},
		{
			ID:       int64(1),
			Filename: "File Name 1",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				Valid: false,
			},
			FileType: sql.NullString{
				Valid: false,
			},
			ProcessedAt: sql.NullTime{
				Time: time.Date(2022, time.Month(5), 3, 20, 36, 52, 40, time.UTC),
			},
			CreatedAt: time.Date(2022, time.Month(5), 3, 20, 36, 52, 40, time.UTC),
		},
		{
			ID:       int64(27),
			Filename: "File Name 27",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				Valid: false,
			},
			FileType: sql.NullString{
				Valid: false,
			},
			ProcessedAt: sql.NullTime{
				Valid: false,
			},
			CreatedAt:      time.Date(2022, time.Month(8), 3, 20, 36, 52, 40, time.UTC),
			IsBackfill:     true,
			FileParameters: pgtype.JSONB{Bytes: []byte("{\n  \"end_date\": {\n    \"year\": 2023,\n    \"month\": 7,\n    \"day\": 1\n  },\n  \"start_date\": {\n    \"year\": 2023,\n    \"month\": 7,\n    \"day\": 1\n  },\n  \"force_upload\": true\n}"), Status: pgtype.Present},
		},
		{
			ID:       int64(28),
			Filename: "File Name 28",
			Status:   pophealthsql.FileStatusProcessed,
			TemplateName: sql.NullString{
				Valid: false,
			},
			FileType: sql.NullString{
				Valid: false,
			},
			ProcessedAt: sql.NullTime{
				Valid: false,
			},
			CreatedAt:      time.Date(2022, time.Month(8), 3, 20, 36, 52, 40, time.UTC),
			IsBackfill:     true,
			FileParameters: pgtype.JSONB{Bytes: []byte("{"), Status: pgtype.Present},
		},
	}

	filesMockCount := int64(10)
	pagesCountWithSizeMock := int64(5)
	pagesCountWithDefaultSize := int64(1)
	page1NumberMock := uint32(1)
	page2NumberMock := uint32(2)
	lastPageNumberMock := uint32(4)
	outOfReachPageNumberMock := uint32(100)
	pageSizeMock := uint32(2)

	page1TokenMock, err := generateEncodeTokenMock(Pagination{
		LastID:       12,
		LastPage:     1,
		LastPageSize: 2,
	})
	if err != nil {
		t.Fatal(err)
	}
	page2TokenMock, err := generateEncodeTokenMock(Pagination{
		LastID:       8,
		LastPage:     2,
		LastPageSize: 2,
	})
	if err != nil {
		t.Fatal(err)
	}
	pageTokenDiffPageSizeMock, err := generateEncodeTokenMock(Pagination{
		LastID:       8,
		LastPage:     2,
		LastPageSize: 5,
	})
	if err != nil {
		t.Fatal(err)
	}
	pageTokenIncomplete, err := generateEncodeTokenMock(Pagination{
		LastID: 8,
	})
	if err != nil {
		t.Fatal(err)
	}
	pageTokenEmpty, err := generateEncodeTokenMock(Pagination{})
	if err != nil {
		t.Fatal(err)
	}

	statusProcessed := pophealthpb.ListFilesRequest_FILTER_PROCESSED
	statusUnspecified := pophealthpb.ListFilesRequest_FILTER_UNSPECIFIED
	statusUnprocessed := pophealthpb.ListFilesRequest_FILTER_UNPROCESSED
	searchNameMock := "File Name 1"

	resultsCodes := []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
		{
			CodeDescription: sql.NullString{String: "template not found", Valid: true},
			CodeLevel:       "file",
		},
		{
			Fields:          sql.NullString{String: "dob", Valid: true},
			CodeDescription: sql.NullString{String: "invalid date format", Valid: true},
			CodeLevel:       "row",
		},
	}

	filesMockResponse := []*pophealthpb.PopHealthFile{
		{
			Id:            getFilesWithTemplateMockResp[0].ID,
			FileName:      getFilesWithTemplateMockResp[0].Filename,
			TemplateName:  NotFoundTemplate,
			FileType:      pophealthpb.FileType_FILE_TYPE_UNSPECIFIED,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_FAILED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[0].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[0].CreatedAt),
			UserError:     getListFilesUserError(resultsCodes),
		},
		{
			Id:            getFilesWithTemplateMockResp[1].ID,
			FileName:      getFilesWithTemplateMockResp[1].Filename,
			TemplateName:  getFilesWithTemplateMockResp[1].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_CSV,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[1].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[1].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[2].ID,
			FileName:      getFilesWithTemplateMockResp[2].Filename,
			TemplateName:  getFilesWithTemplateMockResp[2].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_CSV,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PREPROCESS,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[2].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[2].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[3].ID,
			FileName:      getFilesWithTemplateMockResp[3].Filename,
			TemplateName:  getFilesWithTemplateMockResp[3].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_CSV,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[3].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[3].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[4].ID,
			FileName:      getFilesWithTemplateMockResp[4].Filename,
			TemplateName:  getFilesWithTemplateMockResp[4].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_CSV,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PREPROCESS,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[4].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[4].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[5].ID,
			FileName:      getFilesWithTemplateMockResp[5].Filename,
			TemplateName:  getFilesWithTemplateMockResp[5].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_EXCEL,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[5].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[5].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[6].ID,
			FileName:      getFilesWithTemplateMockResp[6].Filename,
			TemplateName:  getFilesWithTemplateMockResp[6].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_CSV,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[6].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[6].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[7].ID,
			FileName:      getFilesWithTemplateMockResp[7].Filename,
			TemplateName:  getFilesWithTemplateMockResp[7].TemplateName.String,
			FileType:      pophealthpb.FileType_FILE_TYPE_EXCEL,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PREPROCESS,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[7].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[7].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[8].ID,
			FileName:      getFilesWithTemplateMockResp[8].Filename,
			TemplateName:  NotFoundTemplate,
			FileType:      pophealthpb.FileType_FILE_TYPE_UNSPECIFIED,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[8].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[8].CreatedAt),
		},
		{
			Id:            getFilesWithTemplateMockResp[9].ID,
			FileName:      getFilesWithTemplateMockResp[9].Filename,
			TemplateName:  NotFoundTemplate,
			FileType:      pophealthpb.FileType_FILE_TYPE_UNSPECIFIED,
			Status:        pophealthpb.PopHealthFile_FILE_STATUS_PROCESSED,
			ProcessedTime: timestamppb.New(getFilesWithTemplateMockResp[9].ProcessedAt.Time),
			UploadedTime:  timestamppb.New(getFilesWithTemplateMockResp[9].CreatedAt),
			IsBackfill:    true,
			FileParameters: &pophealthpb.FileParameters{
				ForceUpload: true,
				StartDate: &common.Date{
					Year:  2023,
					Month: 7,
					Day:   1,
				},
				EndDate: &common.Date{
					Year:  2023,
					Month: 7,
					Day:   1,
				},
			},
		},
	}

	tests := []struct {
		name      string
		dbService *mockDBService
		req       *pophealthpb.ListFilesRequest
		logger    *zap.SugaredLogger

		hasError     bool
		expectedResp *pophealthpb.ListFilesResponse
	}{
		{
			name: "happy path getting list files",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp[2:8],
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:   &pageSizeMock,
				PageNumber: &page2NumberMock,
				PageToken:  page1TokenMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[2],
					filesMockResponse[3],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[3].Id, page2NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page2NumberMock),
				},
			},
		},
		{
			name: "success getting list files without page size in request using default",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &page1NumberMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files:         filesMockResponse,
				NextPageToken: generatePageTokenForTest(filesMockResponse[9].Id, page1NumberMock, uint32(paginationDefaultLimit)),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithDefaultSize,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting list files with page number in request",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp[2:8],
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  page1TokenMock,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[2],
					filesMockResponse[3],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[3].Id, page2NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page2NumberMock),
				},
			},
		},
		{
			name: "success getting list files with the last page in request",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp[4:8],
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  page2TokenMock,
				PageNumber: &lastPageNumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[6],
					filesMockResponse[7],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[7].Id, lastPageNumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(lastPageNumberMock),
				},
			},
		},
		{
			name: "success getting list files going backwards",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  page2TokenMock,
				PageNumber: &page1NumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[0],
					filesMockResponse[1],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[1].Id, page1NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting list files with empty values in token request",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[2],
					filesMockResponse[3],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[3].Id, page2NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page2NumberMock),
				},
			},
		},
		{
			name: "success getting list files with status processed in filter request",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[1],
					getFilesWithTemplateMockResp[3],
					getFilesWithTemplateMockResp[5],
					getFilesWithTemplateMockResp[6],
					getFilesWithTemplateMockResp[8],
				},
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
				Filter:     &statusProcessed,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[5],
					filesMockResponse[6],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[6].Id, page2NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page2NumberMock),
				},
			},
		},
		{
			name: "success getting list files with status unspecified in filter request",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
				Filter:     &statusUnspecified,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[2],
					filesMockResponse[3],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[3].Id, page2NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page2NumberMock),
				},
			},
		},
		{
			name: "success getting list files with status unprocessed in filter request",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[0],
					getFilesWithTemplateMockResp[2],
					getFilesWithTemplateMockResp[4],
					getFilesWithTemplateMockResp[7],
				},
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &page1NumberMock,
				PageSize:   &pageSizeMock,
				Filter:     &statusUnprocessed,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[0],
					filesMockResponse[2],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[2].Id, page1NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting list files with search name in request",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[2],
					getFilesWithTemplateMockResp[3],
					getFilesWithTemplateMockResp[8],
				},
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:      pageTokenEmpty,
				PageNumber:     &page1NumberMock,
				PageSize:       &pageSizeMock,
				SearchFileName: &searchNameMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[2],
					filesMockResponse[3],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[3].Id, page1NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting list files with search name and filter status in request",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[3],
					getFilesWithTemplateMockResp[8],
				},
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:      pageTokenEmpty,
				PageNumber:     &page1NumberMock,
				PageSize:       &pageSizeMock,
				Filter:         &statusProcessed,
				SearchFileName: &searchNameMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[3],
					filesMockResponse[8],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[8].Id, page1NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting first page list files when page size change between request",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					if i == fileIDWithResultCodes {
						return resultsCodes, nil
					}
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenDiffPageSizeMock,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[0],
					filesMockResponse[1],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[1].Id, uint32(startPage), pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "success getting an empty array when no files in response",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{},
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  page2TokenMock,
				PageNumber: &page2NumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files:         []*pophealthpb.PopHealthFile{},
				NextPageToken: nil,
				Data: &pophealthpb.PaginationData{
					TotalItems:  0,
					TotalPages:  0,
					CurrentPage: 0,
				},
			},
		},
		{
			name: "success getting files with FileParameters and IsBackfill",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[9],
				},
				getFileCountForBucketFolderResp: filesMockCount,
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:   &pageSizeMock,
				PageNumber: &page1NumberMock,
				PageToken:  page1TokenMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: false,
			expectedResp: &pophealthpb.ListFilesResponse{
				Files: []*pophealthpb.PopHealthFile{
					filesMockResponse[9],
				},
				NextPageToken: generatePageTokenForTest(filesMockResponse[9].Id, page1NumberMock, pageSizeMock),
				Data: &pophealthpb.PaginationData{
					TotalItems:  filesMockCount,
					TotalPages:  pagesCountWithSizeMock,
					CurrentPage: int32(page1NumberMock),
				},
			},
		},
		{
			name: "error getting files from a page out of reach",
			dbService: &mockDBService{
				getFilesByBucketResp:            getFilesWithTemplateMockResp,
				getFileCountForBucketFolderResp: filesMockCount,
			},
			req: &pophealthpb.ListFilesRequest{
				PageToken:  pageTokenEmpty,
				PageNumber: &outOfReachPageNumberMock,
				PageSize:   &pageSizeMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error getting list files",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:  &pageSizeMock,
				PageToken: page1TokenMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error getting count of files",
			dbService: &mockDBService{
				getFileCountForBucketFolderErr: errInternalTest,
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:  &pageSizeMock,
				PageToken: page1TokenMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error decoding bad token",
			dbService: &mockDBService{
				err: errInternalTest,
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:  &pageSizeMock,
				PageToken: []byte("54564386548754"),
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error invalid arguments in token request",
			dbService: &mockDBService{
				getFilesByBucketResp: getFilesWithTemplateMockResp,
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:  &pageSizeMock,
				PageToken: pageTokenIncomplete,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error - FileParameters can't be parsed",
			dbService: &mockDBService{
				getFilesByBucketResp: []*pophealthsql.GetFilesByBucketRow{
					getFilesWithTemplateMockResp[10],
				},
				getFileCountForBucketFolderResp: filesMockCount,
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(i int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					return nil, pgx.ErrNoRows
				},
			},
			req: &pophealthpb.ListFilesRequest{
				PageSize:   &pageSizeMock,
				PageNumber: &page1NumberMock,
				PageToken:  page1TokenMock,
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			server := &GrpcServer{
				DBService: test.dbService,
				logger:    test.logger,
			}

			resp, err := server.ListFiles(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "list files response don't match")
		})
	}
}

type mockDownloadFileStream struct {
	grpc.ServerStream
	ctx            context.Context
	sentFromServer chan *pophealthpb.DownloadFileResponse
	err            error
}

func (m *mockDownloadFileStream) Context() context.Context {
	return m.ctx
}

func (m *mockDownloadFileStream) Send(resp *pophealthpb.DownloadFileResponse) error {
	m.sentFromServer <- resp
	return m.err
}

func (m *mockDownloadFileStream) RecvToClient() *pophealthpb.DownloadFileResponse {
	return <-m.sentFromServer
}

func TestGrpcServer_DownloadFile(t *testing.T) {
	ctx := context.Background()
	testFile := &pophealthsql.File{
		ID:             int64(2),
		BucketFolderID: int64(10),
		AwsObjectKey:   sql.NullString{String: "testKey", Valid: true},
		Filename:       "testfile.xls",
	}
	testFileContent := "This is a test."
	tests := []struct {
		name        string
		fileService *mockDBService
		awsService  *mockAwsService
		req         *pophealthpb.DownloadFileRequest
		stream      *mockDownloadFileStream
		logger      *zap.SugaredLogger
		err         error

		hasError     bool
		expectedResp *pophealthpb.DownloadFileResponse
	}{
		{
			name: "Download File success",
			fileService: &mockDBService{
				getFileResp: testFile,
			},
			awsService: &mockAwsService{
				getObjectResp: io.NopCloser(strings.NewReader(testFileContent)),
			},
			req: &pophealthpb.DownloadFileRequest{
				FileId: testFile.ID,
			},
			stream: &mockDownloadFileStream{
				ctx:            ctx,
				sentFromServer: make(chan *pophealthpb.DownloadFileResponse),
			},
			logger: zap.NewNop().Sugar(),
			expectedResp: &pophealthpb.DownloadFileResponse{
				FileName:  testFile.Filename,
				DataChunk: []byte(testFileContent),
			},
		},
		{
			name: "no rows from files table",
			fileService: &mockDBService{
				err: pgx.ErrNoRows,
			},
			awsService: &mockAwsService{},
			req: &pophealthpb.DownloadFileRequest{
				FileId: testFile.ID,
			},
			stream: &mockDownloadFileStream{
				ctx:            ctx,
				sentFromServer: make(chan *pophealthpb.DownloadFileResponse),
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error when fetching file from db",
			fileService: &mockDBService{
				err: errInternalTest,
			},
			awsService: &mockAwsService{},
			req: &pophealthpb.DownloadFileRequest{
				FileId: testFile.ID,
			},
			stream: &mockDownloadFileStream{
				ctx:            ctx,
				sentFromServer: make(chan *pophealthpb.DownloadFileResponse),
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error getting file from aws",
			fileService: &mockDBService{
				getFileResp: testFile,
			},
			awsService: &mockAwsService{
				err: errInternalTest,
			},
			req: &pophealthpb.DownloadFileRequest{
				FileId: testFile.ID,
			},
			stream: &mockDownloadFileStream{
				ctx:            ctx,
				sentFromServer: make(chan *pophealthpb.DownloadFileResponse),
			},
			logger:   zap.NewNop().Sugar(),
			hasError: true,
		},
		{
			name: "error sending stream",
			fileService: &mockDBService{
				getFileResp: testFile,
			},
			awsService: &mockAwsService{
				getObjectResp: io.NopCloser(strings.NewReader(testFileContent)),
			},
			req: &pophealthpb.DownloadFileRequest{
				FileId: testFile.ID,
			},
			logger: zap.NewNop().Sugar(),
			stream: &mockDownloadFileStream{
				ctx:            ctx,
				sentFromServer: make(chan *pophealthpb.DownloadFileResponse),
				err:            errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Setenv("POP_HEALTH_FILE_EXCHANGE_BUCKET", "testBucket")
		t.Run(test.name, func(t *testing.T) {
			// If we directly use test.fileService inside the gofunc, we could have a data race.
			fileService := test.fileService
			awsService := test.awsService
			logger := test.logger
			req := test.req
			stream := test.stream
			hasError := test.hasError
			go func() {
				server := &GrpcServer{
					DBService: fileService,
					aws:       awsService,
					logger:    logger,
				}
				err := server.DownloadFile(req, stream)
				if (err != nil) != hasError {
					t.Errorf("expected error: %v, but got: %v", hasError, err)
				}
				close(stream.sentFromServer)
			}()

			streamResponse := test.stream.RecvToClient()
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, streamResponse, "download file response don't match")
		})
	}
}

func generateEncodeTokenMock(pagination Pagination) ([]byte, error) {
	paginationParametersMock, err := EncodePageToken(pagination)
	if err != nil {
		return []byte(nil), err
	}

	return []byte(paginationParametersMock), nil
}

func generatePageTokenForTest(lastID int64, lastPage, lastPageSize uint32) []byte {
	p := Pagination{
		LastID:       lastID,
		LastPage:     int32(lastPage),
		LastPageSize: int32(lastPageSize),
	}
	pageJSON, _ := json.Marshal(p)
	s := base64.URLEncoding.EncodeToString(pageJSON)
	return []byte(s)
}

func TestUploadFile(t *testing.T) {
	mockBucketFolder := &pophealthsql.BucketFolder{
		ID:           1,
		S3BucketName: "S3 bucket name 10",
	}
	mockBucketName := "Name 10"
	mockFileName := "test.csv"
	mockTemplate := &pophealthsql.Template{
		ID:   time.Now().UnixNano(),
		Name: "test_bucket",
	}
	mockFile := &pophealthsql.File{
		ID:       time.Now().UnixNano(),
		Filename: mockFileName,
	}

	tests := []struct {
		Name                string
		UploadFileRequest   []*pophealthpb.UploadFileRequest
		DBService           *mockDBService
		AWSService          *mockAwsService
		FileTemplateService *mockFileTemplateService

		Resp           *pophealthpb.UploadFileResponse
		HasStreamError bool
		WantGRPCCode   codes.Code
	}{
		{
			Name: "success uploading file",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockBucketFolder.ID,
					Name:         mockBucketName,
					S3BucketName: mockBucketFolder.S3BucketName,
				},
				addFileResp: mockFile,
			},
			AWSService: &mockAwsService{addS3FileResp: nil},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			Resp:         &pophealthpb.UploadFileResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Name: "success uploading file with force upload",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
						ForceUpload: true,
					},
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockBucketFolder.ID,
					Name:         mockBucketName,
					S3BucketName: mockBucketFolder.S3BucketName,
				},
				addFileResp: mockFile,
			},
			AWSService: &mockAwsService{addS3FileResp: nil},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			Resp:         &pophealthpb.UploadFileResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Name: "success uploading file with start and end date",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
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
					},
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockBucketFolder.ID,
					Name:         mockBucketName,
					S3BucketName: mockBucketFolder.S3BucketName,
				},
				addFileResp:                             mockFile,
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getNumberOfProcessingBackfillFilesResp:  0,
			},
			AWSService: &mockAwsService{addS3FileResp: nil},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			Resp:         &pophealthpb.UploadFileResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Name: "failure uploading file: force upload and dates provided",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
						ForceUpload: true,
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
					},
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name: "failure uploading file: start date is nil",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
						EndDate: &common.Date{
							Year:  1989,
							Month: 2,
							Day:   1,
						},
					},
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name: "failure uploading file: end date is nil",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
						StartDate: &common.Date{
							Year:  1989,
							Month: 2,
							Day:   1,
						},
					},
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name: "failure uploading file: start date is after end date",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
						StartDate: &common.Date{
							Year:  1989,
							Month: 2,
							Day:   28,
						},
						EndDate: &common.Date{
							Year:  1989,
							Month: 2,
							Day:   1,
						},
					},
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name: "failure uploading file: backfill file in processing status",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
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
					},
				},
			},
			DBService: &mockDBService{
				getOldestFileByStatusWithChannelItemResp: &pophealthsql.File{},
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.FailedPrecondition,
		},
		{
			Name: "failure uploading file: error trying to find backfill file",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
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
					},
				},
			},
			DBService: &mockDBService{
				getOldestFileByStatusWithChannelItemErr: pgx.ErrTxClosed,
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Name: "fail uploading file error in stream",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: 1,
					FileName:       mockFileName,
					DataChunk:      []byte(`fail file`),
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockBucketFolder.ID,
					Name:         mockBucketName,
					S3BucketName: mockBucketFolder.S3BucketName,
				},
			},
			AWSService: &mockAwsService{addS3FileResp: nil},

			HasStreamError: true,
			WantGRPCCode:   codes.Internal,
		},
		{
			Name: "fail generating file with empty data chunk",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: 1,
					FileName:       mockFileName,
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: &pophealthsql.BucketFolder{
					ID:           mockBucketFolder.ID,
					Name:         mockBucketName,
					S3BucketName: mockBucketFolder.S3BucketName,
				},
			},
			AWSService: &mockAwsService{addS3FileResp: nil},

			WantGRPCCode: codes.NotFound,
		},
		{
			Name: "fail uploading file, error finding template",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
				},
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileErr: errInternalTest,
			},

			Resp:         &pophealthpb.UploadFileResponse{},
			WantGRPCCode: codes.Internal,
		},
		{
			Name: "fail uploading file, no templates exists for bucket",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
				},
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileErr: pgx.ErrNoRows,
			},

			Resp:         &pophealthpb.UploadFileResponse{},
			WantGRPCCode: codes.NotFound,
		},
		{
			Name: "fail uploading file, error getting folder information",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: 1,
					FileName:       mockFileName,
					DataChunk:      []byte(`fail in data`),
				},
			},
			DBService: &mockDBService{
				err: pgx.ErrNoRows,
			},
			AWSService: &mockAwsService{addS3FileResp: nil},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileErr: errInternalTest,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Name: "fail uploading file, error in add s3 file to aws bucket",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: 1,
					FileName:       mockFileName,
					DataChunk:      []byte(`fail in the s3`),
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: mockBucketFolder,
			},
			AWSService: &mockAwsService{addS3FileResp: errInternalTest},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Name: "fail uploading file, error adding file information to database",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: 1,
					FileName:       mockFileName,
					DataChunk:      []byte(`fail when save`),
				},
			},
			DBService: &mockDBService{
				getBucketFolderResp: mockBucketFolder,
				addFileErr:          errInternalTest,
			},
			AWSService: &mockAwsService{addS3FileResp: nil},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Name: "fail uploading file, number of parallel backfills reached",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
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
					},
				},
			},
			DBService: &mockDBService{
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getNumberOfProcessingBackfillFilesResp:  1,
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.FailedPrecondition,
		},
		{
			Name: "fail uploading file, error getting number of processing backfill files",
			UploadFileRequest: []*pophealthpb.UploadFileRequest{
				{
					BucketFolderId: mockBucketFolder.ID,
					FileName:       mockFileName,
					DataChunk:      []byte(`success data chunk`),
					FileParameters: &pophealthpb.FileParameters{
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
					},
				},
			},
			DBService: &mockDBService{
				getOldestFileByStatusWithChannelItemErr: pgx.ErrNoRows,
				getNumberOfProcessingBackfillFilesErr:   pgx.ErrTxClosed,
			},
			FileTemplateService: &mockFileTemplateService{
				findTemplateByFileResp: mockTemplate,
			},

			WantGRPCCode: codes.Internal,
		},
	}

	for _, test := range tests {
		t.Run(test.Name, func(t *testing.T) {
			grpcServer := &GrpcServer{
				DBService:                 test.DBService,
				aws:                       test.AWSService,
				templates:                 test.FileTemplateService,
				numberOfParallelBackfills: 1,
				logger:                    zap.NewNop().Sugar(),
			}

			stream := newUpdateFileStream()

			go func() {
				err := grpcServer.UploadFile(stream)
				if err != nil {
					stream.serverErr <- err
				}
			}()

			for _, req := range test.UploadFileRequest {
				err := stream.Send(req, test.HasStreamError)
				if err != nil {
					stream.serverErr <- err
				}
			}
			close(stream.sentFromClient)

		response:
			for {
				select {
				case resp := <-stream.sentFromServer:
					testutils.MustMatch(t, test.Resp, resp, "response does not match")
					break response
				case err := <-stream.serverErr:
					respStatus, ok := status.FromError(err)
					if !ok {
						t.Fatal(err)
					}
					if respStatus.Code() != test.WantGRPCCode {
						t.Errorf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), test.WantGRPCCode)
					}
					break response
				}
			}
		})
	}
}

func TestGenerateTmpFile(t *testing.T) {
	tests := []struct {
		Name     string
		FileName string

		HasError         bool
		WantRespContains string
	}{
		{
			Name:             "happy path generating tmp file",
			FileName:         "test_file",
			HasError:         false,
			WantRespContains: "test_file",
		},
		{
			Name:     "failing creating tmp file name have path separator",
			FileName: "/test_file/",
			HasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.Name, func(t *testing.T) {
			resp, err := GenerateTmpFile(test.FileName)

			if (err != nil) != test.HasError {
				t.Errorf("expected error: %v, but got error: %v", test.HasError, err)
			}

			if test.HasError {
				return
			}

			if !strings.Contains(resp, test.WantRespContains) {
				t.Fatalf("Wanted response containing %s, got %s", test.WantRespContains, resp)
			}
		})
	}
}

func TestFillingTmpFile(t *testing.T) {
	tmpDir := os.TempDir()

	file, err := os.CreateTemp(tmpDir, "test.csv")
	if err != nil {
		t.Errorf("error creating test tmp file %v", err)
	}
	filePath := file.Name()

	err = FillingTmpFile([]byte(`file test`), filePath)

	if err != nil {
		t.Errorf("no expected error, but got error: %v", err)
	}
}

func TestReadTmpFile(t *testing.T) {
	tmpDir := os.TempDir()

	file, err := os.CreateTemp(tmpDir, "test.csv")
	if err != nil {
		t.Errorf("error creating test tmp file %v", err)
	}

	_, err = file.Write([]byte(`test`))
	if err != nil {
		t.Errorf("error writing in test tmp file %v", err)
	}

	emptyFile, err := os.CreateTemp(tmpDir, "test-empty.csv")
	if err != nil {
		t.Errorf("error creating test tmp file %v", err)
	}

	tests := []struct {
		Name     string
		FilePath string

		HasError bool
		Resp     []byte
	}{
		{
			Name:     "happy path reading tmp file",
			FilePath: file.Name(),
			HasError: false,
			Resp:     []byte(`test`),
		},
		{
			Name:     "reading empty file",
			FilePath: emptyFile.Name(),
			HasError: false,
			Resp:     []byte(``),
		},
		{
			Name:     "failing reading non-existent file",
			FilePath: "test/test-fail.csv",
			HasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.Name, func(t *testing.T) {
			resp, err := ReadTmpFile(test.FilePath)

			if (err != nil) != test.HasError {
				t.Errorf("expected error: %v, but got error: %v", test.HasError, err)
			}

			if test.HasError {
				return
			}

			testutils.MustMatch(t, test.Resp, resp, "response does not match")
		})
	}
}

func TestGetListFilesUserError(t *testing.T) {
	tests := []struct {
		name         string
		resultsCodes []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow

		expectedOutput string
	}{
		{
			name: "happy path",
			resultsCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					CodeDescription: sql.NullString{String: "template not found", Valid: true},
					CodeLevel:       "file",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "invalid date format", Valid: true},
					NumberOfOccurrences: int32(2),
					CodeLevel:           "row",
				},
			},
			expectedOutput: `1. type: file, template not found
2. type: row, count: 2, invalid date format`,
		},
		{
			name: "happy path with error description",
			resultsCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					CodeDescription:  sql.NullString{String: "unknown error", Valid: true},
					ErrorDescription: sql.NullString{String: "invalid file format", Valid: true},
					CodeLevel:        "file",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "invalid date format", Valid: true},
					NumberOfOccurrences: int32(2),
					CodeLevel:           "row",
				},
			},
			expectedOutput: `1. type: file, invalid file format
2. type: row, count: 2, invalid date format`,
		},
		{
			name:           "happy path no result codes",
			resultsCodes:   []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{},
			expectedOutput: "",
		},
		{
			name: "happy with limit results codes",
			resultsCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					CodeDescription: sql.NullString{String: "error1", Valid: true},
					CodeLevel:       "file",
					Fields:          sql.NullString{String: "dob, ssn", Valid: true},
				},
				{
					CodeDescription: sql.NullString{String: "error2", Valid: true},
					CodeLevel:       "file",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error6", Valid: true},
					NumberOfOccurrences: int32(2),
					CodeLevel:           "row",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error7", Valid: true},
					NumberOfOccurrences: int32(1),
					CodeLevel:           "row",
				},
				{
					CodeDescription: sql.NullString{String: "error3", Valid: true},
					CodeLevel:       "file",
				},
				{
					CodeDescription: sql.NullString{String: "error4", Valid: true},
					CodeLevel:       "file",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error8", Valid: true},
					NumberOfOccurrences: int32(10),
					CodeLevel:           "row",
				},
				{
					CodeDescription: sql.NullString{String: "error5", Valid: true},
					CodeLevel:       "file",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error9", Valid: true},
					NumberOfOccurrences: int32(3),
					CodeLevel:           "row",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error10", Valid: true},
					NumberOfOccurrences: int32(1),
					CodeLevel:           "row",
				},
				{
					Fields:              sql.NullString{String: "dob", Valid: true},
					CodeDescription:     sql.NullString{String: "error11", Valid: true},
					NumberOfOccurrences: int32(7),
					CodeLevel:           "row",
				},
			},
			expectedOutput: `1. type: file, error1 on "dob, ssn" fields
2. type: file, error2
3. type: file, error3
4. type: file, error4
5. type: file, error5
6. type: row, count: 2, error6
7. type: row, count: 1, error7
8. type: row, count: 10, error8
9. type: row, count: 3, error9
10. type: row, count: 1, error10`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := getListFilesUserError(test.resultsCodes)
			if got != test.expectedOutput {
				t.Errorf("expected %s: but got %s", test.expectedOutput, got)
			}
		})
	}
}

func TestPopHealthServerSyncPatients(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name           string
		prefectService *mockPrefectClient

		hasError     bool
		expectedResp *pophealthpb.SyncPatientsResponse
	}{
		{
			name: "happy path",
			prefectService: &mockPrefectClient{
				buildSyncPatientsPrefectRequestResp: []byte("test"),
				doRequestResponse:                   FlowID("test"),
			},
			expectedResp: &pophealthpb.SyncPatientsResponse{},
		},
		{
			name: "error building sync patients prefect request",
			prefectService: &mockPrefectClient{
				buildSyncPatientsPrefectRequestErr: errInternalTest,
			},
			hasError: true,
		},
		{
			name: "error executing prefect request",
			prefectService: &mockPrefectClient{
				buildSyncPatientsPrefectRequestResp: []byte("test"),
				doRequestErr:                        errInternalTest,
			},
			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := &GrpcServer{
				prefect: test.prefectService,
				logger:  zap.NewNop().Sugar(),
			}

			resp, err := server.SyncPatients(ctx, &pophealthpb.SyncPatientsRequest{
				ChannelItemId: 1234,
			})
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
			if !test.hasError {
				testutils.MustMatch(t, test.expectedResp, resp)
			}
		})
	}
}

func TestPopHealthServerUpdateBackfillFileStatus(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	successID := time.Now().UnixNano()
	failureID := time.Now().UnixNano()
	processedRequest := &pophealthpb.UpdateBackfillFileStatusRequest{
		ChannelItemId:   successID,
		Status:          pophealthpb.BackfillStatus_BACKFILL_STATUS_PROCESSED,
		NumberOfMatches: 5,
	}
	failedRequest := &pophealthpb.UpdateBackfillFileStatusRequest{
		ChannelItemId: failureID,
		Status:        pophealthpb.BackfillStatus_BACKFILL_STATUS_FAILED,
	}
	getFileResultCodesWithCodeDetailsFunc := func(int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
		return []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{}, nil
	}
	emails := []string{"test1@test.com", "test2@test.com"}
	tests := []struct {
		name      string
		dBService *mockDBService
		req       *pophealthpb.UpdateBackfillFileStatusRequest
		mailer    mailerService

		expectedResponse *pophealthpb.UpdateBackfillFileStatusResponse
		expectedError    error
	}{
		{
			name: "successful update with processed status",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 1,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: getFileResultCodesWithCodeDetailsFunc,
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:         baseID + 1,
					BucketFolderID: baseID + 2,
				},
				getEmailNotificationsByBucketIDResp: emails,
			},
			req:    processedRequest,
			mailer: &mockMailerService{},

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
		{
			name: "successful update with failure status",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 2,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: getFileResultCodesWithCodeDetailsFunc,
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:         baseID + 1,
					BucketFolderID: baseID + 2,
				},
				getEmailNotificationsByBucketIDResp: emails,
			},
			req:    failedRequest,
			mailer: &mockMailerService{},

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
		{
			name: "error getting processing backfill file, file not found",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDErr: pgx.ErrNoRows,
			},
			req: processedRequest,

			expectedError: status.Errorf(codes.NotFound, "backfill file not found %v", pgx.ErrNoRows),
		},
		{
			name: "error getting processing backfill file",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDErr: pgx.ErrTxClosed,
			},
			req: processedRequest,

			expectedError: status.Errorf(codes.Internal, "error getting processing backfill file %v", pgx.ErrTxClosed),
		},
		{
			name: "error updating backfill file status",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 3,
				},
				updateFileStatusByIDErr: pgx.ErrTxClosed,
			},
			req: processedRequest,

			expectedError: status.Errorf(codes.Internal, "error updating backfill file status %v", pgx.ErrTxClosed),
		},
		{
			name: "error getting file result codes with code details",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 1,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: func(int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
					return nil, errInternalTest
				},
			},
			req: processedRequest,

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
		{
			name: "error getting file and bucket folder",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 1,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: getFileResultCodesWithCodeDetailsFunc,
				err: errInternalTest,
			},
			req: processedRequest,

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
		{
			name: "error getting email notifications",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 1,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: getFileResultCodesWithCodeDetailsFunc,
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:         baseID + 1,
					BucketFolderID: baseID + 2,
				},
				getEmailNotificationsByBucketIDErr: errInternalTest,
			},
			req: processedRequest,

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
		{
			name: "error sending processing report",
			dBService: &mockDBService{
				getProcessingBackfillFileByChannelItemIDResp: &pophealthsql.File{
					ID: baseID + 1,
				},
				getFileResultCodesWithCodeDetailsByFileIDFunc: getFileResultCodesWithCodeDetailsFunc,
				getFileAndBucketFolderByFileIDResp: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
					FileID:         baseID + 1,
					BucketFolderID: baseID + 2,
				},
				getEmailNotificationsByBucketIDResp: emails,
			},
			req: processedRequest,
			mailer: &mockMailerService{
				sendProcessingReportErr: errInternalTest,
			},

			expectedResponse: &pophealthpb.UpdateBackfillFileStatusResponse{},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := &GrpcServer{
				DBService: test.dBService,
				mailer:    test.mailer,
				logger:    logger,
			}

			resp, err := server.UpdateBackfillFileStatus(ctx, test.req)

			testutils.MustMatch(t, test.expectedError, err)
			testutils.MustMatch(t, test.expectedResponse, resp)
		})
	}
}

func TestMatchChannelItemsWithTemplatest(t *testing.T) {
	templates := []*pophealthsql.Template{
		{ChannelItemID: 1},
		{ChannelItemID: 2},
		{ChannelItemID: 3},
	}
	tests := []struct {
		name           string
		templates      []*pophealthsql.Template
		channelItemIDs []int64

		expectedResp []int64
	}{
		{
			name:           "same elements in templates and channel items ids",
			templates:      templates,
			channelItemIDs: []int64{3, 1, 2},
			expectedResp:   []int64{1, 2, 3},
		},
		{
			name:           "no match in templates and channel item ids",
			templates:      templates,
			channelItemIDs: []int64{4, 5, 6},
			expectedResp:   []int64{},
		},
		{
			name:           "partial match in templates and channel item ids",
			templates:      templates,
			channelItemIDs: []int64{1, 5, 2},
			expectedResp:   []int64{1, 2},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			matchedChannels := matchChannelItemsWithTemplates(test.templates, test.channelItemIDs)
			sort.Slice(matchedChannels, func(i, j int) bool {
				return matchedChannels[i] < matchedChannels[j]
			})
			testutils.MustMatch(t, test.expectedResp, matchedChannels)
		})
	}
}

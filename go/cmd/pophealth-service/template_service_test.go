package main

import (
	"context"
	"database/sql"
	"testing"
	"time"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type mockTemplateDBService struct {
	getTemplatesInBucketFolderResp []*pophealthsql.Template
	updateFileStatusByIDResp       *pophealthsql.File
	updateTemplateInFileByIDResp   *pophealthsql.File
	err                            error
}

func (s *mockTemplateDBService) GetActiveTemplatesInBucketFolder(_ context.Context, _ int64) ([]*pophealthsql.Template, error) {
	return s.getTemplatesInBucketFolderResp, s.err
}

func (s *mockTemplateDBService) UpdateFileStatusByID(_ context.Context, _ pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error) {
	return s.updateFileStatusByIDResp, s.err
}

func (s *mockTemplateDBService) UpdateTemplateInFileByID(_ context.Context, _ pophealthsql.UpdateTemplateInFileByIDParams) (*pophealthsql.File, error) {
	return s.updateTemplateInFileByIDResp, s.err
}

func TestFindTemplateByFile(t *testing.T) {
	requestPrefixMock := UpdateFileByTemplateRequest{
		fileName: "ptest_4374856_pop_health.csv",
		bucketID: 10,
	}
	requestSuffixMock := UpdateFileByTemplateRequest{
		fileName: "2123132_pop_health_stest.xlsx",
		bucketID: 11,
	}
	requestPrefixWithoutUnderscoreMock := UpdateFileByTemplateRequest{
		fileName: "provider374856dfgfph.csv",
		bucketID: 50,
	}
	requestPrefixPrecedenceMock := UpdateFileByTemplateRequest{
		fileName: "one_something_ptest.csv",
		bucketID: 20,
	}
	requestSuffixPrecedenceMock := UpdateFileByTemplateRequest{
		fileName: "something_ptest.csv",
		bucketID: 30,
	}
	requestUnspecifiedMock := UpdateFileByTemplateRequest{
		fileName: "abc.csv",
		bucketID: 40,
	}

	templatesPrefixMock := []*pophealthsql.Template{
		{
			ID:                  2,
			Name:                "one_5466565",
			FileIdentifierValue: "one",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2022, time.Month(3), 2, 1, 00, 10, 0, time.UTC),
		},
		{
			ID:                  3,
			Name:                "test_4374856",
			FileIdentifierValue: "ptest",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2021, time.Month(2), 25, 12, 10, 8, 0, time.UTC),
		},
		{
			ID:                  1,
			Name:                "other_4fdfdfd4",
			FileIdentifierValue: "other",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2020, time.Month(1), 18, 21, 56, 23, 0, time.UTC),
		},
	}
	templatesSuffixMock := []*pophealthsql.Template{
		{
			ID:                  5,
			Name:                "4374856_stest",
			FileIdentifierValue: "stest",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_EXCEL)],
			UpdatedAt:           time.Date(2022, time.Month(3), 15, 1, 26, 9, 0, time.UTC),
		},
		{
			ID:                  4,
			Name:                "5466565_two",
			FileIdentifierValue: "two",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_EXCEL)],
			UpdatedAt:           time.Date(2021, time.Month(2), 20, 16, 15, 8, 0, time.UTC),
		},
		{
			ID:                  6,
			Name:                "4fdfdfd4_other",
			FileIdentifierValue: "other",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_EXCEL)],
			UpdatedAt:           time.Date(2020, time.Month(1), 10, 0, 41, 3, 0, time.UTC),
		},
	}
	templatesPrefixWithoutUnderscoreMock := []*pophealthsql.Template{
		{
			ID:                  9,
			Name:                "provider5466565",
			FileIdentifierValue: "provider",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2022, time.Month(3), 2, 1, 00, 10, 0, time.UTC),
		},
		{
			ID:                  10,
			Name:                "example4374856",
			FileIdentifierValue: "example",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2021, time.Month(2), 25, 12, 10, 8, 0, time.UTC),
		},
		{
			ID:                  15,
			Name:                "myprovider4fdfdfd4",
			FileIdentifierValue: "myprovider",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2020, time.Month(1), 18, 21, 56, 23, 0, time.UTC),
		},
	}
	templatesPrecedence := []*pophealthsql.Template{
		{
			ID:                  3,
			Name:                "test_4374856",
			FileIdentifierValue: "ptest",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2021, time.Month(2), 25, 12, 10, 8, 0, time.UTC),
		},
		{
			ID:                  2,
			Name:                "one_5466565",
			FileIdentifierValue: "one",
			FileIdentifierType:  pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX)],
			FileType:            pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:           time.Date(2022, time.Month(3), 2, 1, 00, 10, 0, time.UTC),
		},
		{
			ID:                 1,
			Name:               "other_4fdfdfd4",
			FileIdentifierType: pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_UNSPECIFIED)],
			FileType:           pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:          time.Date(2020, time.Month(1), 18, 21, 56, 23, 0, time.UTC),
		},
	}
	templatesUnspecifiedMostRecent := []*pophealthsql.Template{
		{
			ID:                 1,
			Name:               "unspecified_1",
			FileIdentifierType: pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_UNSPECIFIED)],
			FileType:           pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:          time.Date(2020, time.Month(1), 18, 21, 56, 23, 0, time.UTC),
		},
		{
			ID:                 2,
			Name:               "unspecified_2",
			FileIdentifierType: pophealthpb.FileIdentifier_FileIdentifierType_name[int32(pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_UNSPECIFIED)],
			FileType:           pophealthpb.FileType_name[int32(pophealthpb.FileType_FILE_TYPE_CSV)],
			UpdatedAt:          time.Date(2020, time.Month(3), 18, 21, 56, 23, 0, time.UTC),
		},
	}

	tests := []struct {
		name      string
		dbService *mockTemplateDBService
		req       UpdateFileByTemplateRequest

		hasError     bool
		expectedResp *pophealthsql.Template
	}{
		{
			name: "happy path finding template prefix type",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesPrefixMock,
			},
			req:          requestPrefixMock,
			hasError:     false,
			expectedResp: templatesPrefixMock[1],
		},
		{
			name: "happy path finding template suffix type",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesSuffixMock,
			},
			req:          requestSuffixMock,
			hasError:     false,
			expectedResp: templatesSuffixMock[0],
		},
		{
			name: "happy path finding template prefix without underscore type",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesPrefixWithoutUnderscoreMock,
			},
			req:          requestPrefixWithoutUnderscoreMock,
			hasError:     false,
			expectedResp: templatesPrefixWithoutUnderscoreMock[0],
		},
		{
			name: "happy path finding template prefix type when multiple templates match",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesPrecedence,
			},
			req:          requestPrefixPrecedenceMock,
			hasError:     false,
			expectedResp: templatesPrecedence[1],
		},
		{
			name: "happy path finding template suffix type when multiple templates match",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesPrecedence,
			},
			req:          requestSuffixPrecedenceMock,
			hasError:     false,
			expectedResp: templatesPrecedence[0],
		},
		{
			name: "happy path finding most recent template unspecified type",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesUnspecifiedMostRecent,
			},
			req:          requestUnspecifiedMock,
			hasError:     false,
			expectedResp: templatesUnspecifiedMostRecent[1],
		},
		{
			name: "error finding template when no template match",
			dbService: &mockTemplateDBService{
				getTemplatesInBucketFolderResp: templatesPrefixMock,
			},
			req:      requestUnspecifiedMock,
			hasError: true,
		},
		{
			name: "error finding template by file configuration",
			dbService: &mockTemplateDBService{
				err: errInternalTest,
			},
			req:      UpdateFileByTemplateRequest{},
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			service := &TemplatesService{
				DBService: test.dbService,
			}

			resp, err := service.FindTemplateByFile(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "template don't match")
		})
	}
}

func TestUpdateFileByTemplate(t *testing.T) {
	mockFile := &pophealthsql.File{
		ID:         1,
		TemplateID: sql.NullInt64{Int64: 3, Valid: true},
	}

	tests := []struct {
		name          string
		dbService     *mockTemplateDBService
		fileIDReq     int64
		templateIDReq sql.NullInt64

		hasError     bool
		expectedResp *pophealthsql.File
	}{
		{
			name: "happy path updating file by template",
			dbService: &mockTemplateDBService{
				updateTemplateInFileByIDResp: mockFile,
			},
			fileIDReq:     mockFile.ID,
			templateIDReq: mockFile.TemplateID,
			hasError:      false,
			expectedResp:  mockFile,
		},
		{
			name: "error updating file by template",
			dbService: &mockTemplateDBService{
				err: errInternalTest,
			},
			fileIDReq:     mockFile.ID,
			templateIDReq: mockFile.TemplateID,
			hasError:      true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			service := &TemplatesService{
				DBService: test.dbService,
			}

			resp, err := service.UpdateFileByTemplate(ctx, test.fileIDReq, test.templateIDReq.Int64)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "file don't match")
		})
	}
}

func TestUpdateFileStatus(t *testing.T) {
	mockFile := &pophealthsql.File{
		ID: 1,
		ProcessedAt: sql.NullTime{
			Time: time.Date(2022, time.Month(11), 10, 20, 23, 54, 0, time.UTC),
		},
		Status: pophealthsql.FileStatusInvalid,
	}

	tests := []struct {
		name      string
		dbService *mockTemplateDBService
		fileIDReq int64
		status    pophealthpb.PopHealthFile_FileStatus

		hasError     bool
		expectedResp *pophealthsql.File
	}{
		{
			name: "happy path updating file to new status",
			dbService: &mockTemplateDBService{
				updateFileStatusByIDResp: mockFile,
			},
			fileIDReq:    mockFile.ID,
			status:       pophealthpb.PopHealthFile_FILE_STATUS_NEW,
			hasError:     false,
			expectedResp: mockFile,
		},
		{
			name: "happy path updating file to invalid status",
			dbService: &mockTemplateDBService{
				updateFileStatusByIDResp: mockFile,
			},
			fileIDReq:    mockFile.ID,
			status:       pophealthpb.PopHealthFile_FILE_STATUS_INVALID,
			hasError:     false,
			expectedResp: mockFile,
		},
		{
			name: "error updating file by template",
			dbService: &mockTemplateDBService{
				err: errInternalTest,
			},
			fileIDReq: mockFile.ID,
			status:    pophealthpb.PopHealthFile_FILE_STATUS_INVALID,
			hasError:  true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			ctx := context.Background()
			service := &TemplatesService{
				DBService: test.dbService,
			}

			resp, err := service.UpdateFileStatus(ctx, test.fileIDReq, test.status)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
			testutils.MustMatch(t, test.expectedResp, resp, "file don't match")
		})
	}
}

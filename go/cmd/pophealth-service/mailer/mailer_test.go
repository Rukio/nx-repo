package mailer

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
)

type mockSender struct {
	mockSenderError error
}

func (s *mockSender) SendWithContext(ctx context.Context, email *mail.SGMailV3) (*rest.Response, error) {
	return nil, s.mockSenderError
}

func TestSendEmailNotification(t *testing.T) {
	fieldsString := "dob, first_name"
	fieldString := "dob"
	resultCode22 := "Err-22"
	descriptionResultCode22 := "MissingFieldError"
	resultCode21 := "Err-21"
	descriptionResultCode21 := "MissingDateFormatError"
	codeLevelFile := "file"
	codeLevelRow := "row"
	resultCode10 := "Row-10"
	descriptionResultCode10 := "InvalidDateError"

	mailer := &Mailer{client: &mockSender{}}
	context := context.Background()

	tests := []struct {
		name   string
		params *mailParams

		hasError bool
	}{
		{
			name: "happy path building template",
			params: &mailParams{
				SendProcessingReportParams: SendProcessingReportParams{
					File: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
						FileID:                 1,
						Status:                 pophealthsql.FileStatusProcessed,
						BucketFolderName:       "Test Health Partner 1",
						AwsObjectKey:           sql.NullString{String: "load", Valid: true},
						Filename:               "foo_file.csv",
						NumberOfPatientsLoaded: 10,
					},
					TotalNumberOfPatients: PatientCount{Int32: 65, Valid: true},
					ToEmails:              []string{"test@*company-data-covered*.com"},
				},
				template: processedTemplate,
				subject:  "Test",
			},
			hasError: false,
		},
		{
			name: "happy path building template with file errors",
			params: &mailParams{
				SendProcessingReportParams: SendProcessingReportParams{
					File: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
						FileID:                 1,
						Status:                 pophealthsql.FileStatusInvalid,
						BucketFolderName:       "Test Health Partner 2",
						AwsObjectKey:           sql.NullString{String: "load", Valid: true},
						Filename:               "foo_file.csv",
						NumberOfPatientsLoaded: 8,
						PatientsDeletedCount:   4,
						PatientsUpdatedCount:   2,
					},
					TotalNumberOfPatients: PatientCount{Int32: 65, Valid: true},
					ToEmails:              []string{"test@*company-data-covered*.com"},
					ResultCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
						{
							NumberOfOccurrences: 2,
							FirstOccurrence:     sql.NullInt32{Valid: true, Int32: 12},
							Fields:              sqltypes.ToNullString(&fieldsString),
							ResultCode:          resultCode22,
							CodeDescription:     sqltypes.ToNullString(&descriptionResultCode22),
							CodeLevel:           codeLevelFile,
						},
						{
							NumberOfOccurrences: 1,
							FirstOccurrence:     sql.NullInt32{Valid: true, Int32: 29},
							Fields:              sqltypes.ToNullString(&fieldsString),
							ResultCode:          resultCode21,
							CodeDescription:     sqltypes.ToNullString(&descriptionResultCode21),
							CodeLevel:           codeLevelFile,
						},
					},
				},
				template: processedTemplate,
				subject:  "Test",
			},
			hasError: false,
		},
		{
			name: "happy path building template with row errors",
			params: &mailParams{
				SendProcessingReportParams: SendProcessingReportParams{
					File: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
						FileID:                 1,
						Status:                 pophealthsql.FileStatusFailed,
						BucketFolderName:       "Test Health Partner 3",
						AwsObjectKey:           sql.NullString{String: "load", Valid: true},
						Filename:               "foo_file.csv",
						NumberOfPatientsLoaded: 10,
					},
					TotalNumberOfPatients: PatientCount{Int32: 65, Valid: true},
					ToEmails:              []string{"test@*company-data-covered*.com"},
					ResultCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
						{
							NumberOfOccurrences: 2,
							FirstOccurrence:     sql.NullInt32{Valid: true, Int32: 3},
							Fields:              sqltypes.ToNullString(&fieldString),
							ResultCode:          resultCode10,
							CodeDescription:     sqltypes.ToNullString(&descriptionResultCode10),
							CodeLevel:           codeLevelRow,
						},
					},
				},
				template: processedTemplate,
				subject:  "Test",
			},
			hasError: false,
		},
		{
			name: "file is missing",
			params: &mailParams{
				SendProcessingReportParams: SendProcessingReportParams{
					File:     nil,
					ToEmails: []string{"test@*company-data-covered*.com"},
				},
				template: processedTemplate,
				subject:  "Test",
			},

			hasError: true,
		},
		{
			name: "invalid template",
			params: &mailParams{
				SendProcessingReportParams: SendProcessingReportParams{
					File: &pophealthsql.GetFileAndBucketFolderByFileIDRow{
						FileID:   2,
						Status:   pophealthsql.FileStatusInvalid,
						Filename: "foo_file2.csv",
					},
					ToEmails: []string{"test@*company-data-covered*.com"},
				},
				template: "{{}}",
				subject:  "Test",
			},
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := mailer.sendEmailNotification(context, test.params)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
		})
	}
}

func TestNewMailer(t *testing.T) {
	tests := []struct {
		name           string
		sendgridAPIKey string
		logoImageURL   string

		hasError     bool
		expectedResp string
	}{
		{
			name:           "does not produce error",
			sendgridAPIKey: "TEST",
			logoImageURL:   "https://assets.*company-data-covered*.com/d7/28/ad84c23046c0b0867a1dd08d0f21/dh-logo-inline.svg",

			hasError: false,
		},
		{
			name:           "does not produce error when logo image empty",
			sendgridAPIKey: "TEST",
			logoImageURL:   "",

			hasError: false,
		},
		{
			name:           "fails without key",
			sendgridAPIKey: "",
			logoImageURL:   "https://assets.*company-data-covered*.com/d7/28/ad84c23046c0b0867a1dd08d0f21/dh-logo-inline.svg",

			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := New(test.sendgridAPIKey, test.logoImageURL)
			if (err != nil) != test.hasError {
				t.Fatal(err)
			}
			if test.hasError {
				return
			}
		})
	}
}

func TestSendProcessingReport(t *testing.T) {
	mailer := &Mailer{client: &mockSender{}}
	ctx := context.Background()

	file := pophealthsql.GetFileAndBucketFolderByFileIDRow{
		AwsObjectKey: sql.NullString{String: "load", Valid: true},
		Filename:     "foo_file.csv",
		FileID:       1,
		Status:       pophealthsql.FileStatusFailed,
	}

	tests := []struct {
		name                  string
		file                  *pophealthsql.GetFileAndBucketFolderByFileIDRow
		resultCodes           []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow
		totalNumberOfPatients PatientCount
		toEmails              []string
	}{
		{
			name: "happy path sending processing report",
			file: &file,
			resultCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					ResultCode:      "error123",
					CodeDescription: sql.NullString{String: "row error description 1", Valid: true},
					CodeLevel:       "row",
					Fields: sql.NullString{
						String: "dob",
						Valid:  true,
					},
					NumberOfOccurrences: 10,
					FirstOccurrence: sql.NullInt32{
						Int32: 5,
						Valid: true,
					},
				},
				{
					ResultCode:      "error456",
					CodeDescription: sql.NullString{String: "row error description 2", Valid: true},
					CodeLevel:       "row",
					Fields: sql.NullString{
						String: "first_name",
						Valid:  true,
					},
					NumberOfOccurrences: 3,
					FirstOccurrence: sql.NullInt32{
						Int32: 9,
						Valid: true,
					},
				},
				{
					ResultCode:          "error222",
					CodeDescription:     sql.NullString{String: "file error description 1", Valid: true},
					CodeLevel:           "file",
					NumberOfOccurrences: 1,
				},
			},
			totalNumberOfPatients: PatientCount{Int32: 100, Valid: true},
			toEmails:              []string{"test@*company-data-covered*.com"},
		},
		{
			name: "happy path sending processing report with invalid patient count",
			file: &file,
			resultCodes: []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow{
				{
					ResultCode:      "error123",
					CodeDescription: sql.NullString{String: "row error description 1", Valid: true},
					CodeLevel:       "row",
					Fields: sql.NullString{
						String: "dob",
						Valid:  true,
					},
					NumberOfOccurrences: 10,
					FirstOccurrence: sql.NullInt32{
						Int32: 5,
						Valid: true,
					},
				},
				{
					ResultCode:      "error456",
					CodeDescription: sql.NullString{String: "row error description 2", Valid: true},
					CodeLevel:       "row",
					Fields: sql.NullString{
						String: "first_name",
						Valid:  true,
					},
					NumberOfOccurrences: 3,
					FirstOccurrence: sql.NullInt32{
						Int32: 9,
						Valid: true,
					},
				},
				{
					ResultCode:          "error222",
					CodeDescription:     sql.NullString{String: "file error description 1", Valid: true},
					CodeLevel:           "file",
					NumberOfOccurrences: 1,
				},
			},
			totalNumberOfPatients: PatientCount{Valid: false},
			toEmails:              []string{"test@*company-data-covered*.com"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := mailer.SendProcessingReport(ctx, SendProcessingReportParams{
				File:                  test.file,
				ResultCodes:           test.resultCodes,
				TotalNumberOfPatients: test.totalNumberOfPatients,
				ToEmails:              test.toEmails,
			})
			if err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestSendDeletedReport(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name         string
		params       DeletedMailParams
		mailerClient *mockSender
		hasError     bool
	}{
		{
			name: "happy path sending successful deleted report",
			params: DeletedMailParams{
				IsSuccess:     true,
				FolderName:    "example",
				TemplateNames: []string{"template1", "template2"},
				ToEmails:      []string{"test@*company-data-covered*.com"},
			},
			mailerClient: &mockSender{},
		},
		{
			name: "happy path sending unsuccessful deleted report",
			params: DeletedMailParams{

				IsSuccess:     false,
				FolderName:    "example",
				TemplateNames: []string{"template1", "template2"},
				ToEmails:      []string{"test@*company-data-covered*.com"},
			},
			mailerClient: &mockSender{},
		},
		{
			name: "error during report submission",
			params: DeletedMailParams{
				IsSuccess:     true,
				FolderName:    "example",
				TemplateNames: []string{"template1", "template2"},
				ToEmails:      []string{"test@*company-data-covered*.com"},
			},
			mailerClient: &mockSender{
				mockSenderError: errors.New("an error"),
			},
			hasError: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			mailer := &Mailer{client: test.mailerClient}
			err := mailer.SendDeletedReport(ctx, test.params)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
		})
	}
}

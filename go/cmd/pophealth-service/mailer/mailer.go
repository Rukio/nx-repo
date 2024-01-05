package mailer

import (
	"bytes"
	"context"
	"errors"
	"html/template"
	"strings"
	"time"

	"github.com/sendgrid/rest"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
)

const (
	fromEmail        = "no-reply@*company-data-covered*.com"
	emailContentType = "text/html"
)

type emailSender interface {
	SendWithContext(ctx context.Context, email *mail.SGMailV3) (*rest.Response, error)
}

type Mailer struct {
	client       emailSender
	logoImageURL string
}

type SendProcessingReportParams struct {
	File                      *pophealthsql.GetFileAndBucketFolderByFileIDRow
	ResultCodes               []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow
	TotalNumberOfPatients     PatientCount
	ToEmails                  []string
	CareRequestPartnerMatches int32
}

type mailParams struct {
	SendProcessingReportParams
	subject  string
	template string
}

type processMailParams struct {
	LogoImageURL              string
	ID                        int64
	FileName                  string
	FolderName                string
	Status                    pophealthsql.FileStatus
	IsBackfill                bool
	NumberOfPatientsLoaded    int32
	NumberOfPatientsUpdated   int32
	NumberOfPatientsDeleted   int32
	TotalNumberOfPatients     PatientCount
	CareRequestPartnerMatches int32
	Errors                    []*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow
	SendingDate               string
}

type DeletedMailParams struct {
	IsSuccess     bool
	FolderName    string
	ErrorMessage  string
	TemplateNames []string
	ToEmails      []string
}

type deletedMailTemplateParams struct {
	LogoImageURL  string
	FolderName    string
	TemplateNames string
	SendingDate   string
	ErrorMessage  string
	IsSuccess     bool
}

type PatientCount struct {
	Int32 int32
	Valid bool
}

func New(sendgridAPIKey string, logoImageURL string) (*Mailer, error) {
	if sendgridAPIKey == "" {
		return nil, errors.New("sendgridAPIKey cannot be empty")
	}
	client := sendgrid.NewSendClient(sendgridAPIKey)
	m := &Mailer{
		client:       client,
		logoImageURL: logoImageURL,
	}
	return m, nil
}

func (mailer *Mailer) SendProcessingReport(ctx context.Context, params SendProcessingReportParams) error {
	p := &mailParams{
		SendProcessingReportParams: params,
		subject:                    "Pop Health Processing Report",
		template:                   processedTemplate,
	}
	return mailer.sendEmailNotification(ctx, p)
}

func (mailer *Mailer) sendEmailNotification(ctx context.Context, params *mailParams) error {
	if params.File == nil {
		return errors.New("file is missing")
	}

	template, err := template.New("").Parse(params.template)
	if err != nil {
		return err
	}

	templateParams := processMailParams{
		LogoImageURL:              mailer.logoImageURL,
		ID:                        params.File.FileID,
		FileName:                  params.File.Filename,
		FolderName:                params.File.BucketFolderName,
		Status:                    params.File.Status,
		IsBackfill:                params.File.IsBackfill,
		NumberOfPatientsLoaded:    params.File.NumberOfPatientsLoaded - params.File.PatientsUpdatedCount,
		NumberOfPatientsDeleted:   params.File.PatientsDeletedCount - params.File.PatientsUpdatedCount,
		NumberOfPatientsUpdated:   params.File.PatientsUpdatedCount,
		TotalNumberOfPatients:     params.TotalNumberOfPatients,
		CareRequestPartnerMatches: params.CareRequestPartnerMatches,
		Errors:                    params.ResultCodes,
		SendingDate:               time.Now().Format(time.RFC850),
	}

	var buf bytes.Buffer
	err = template.Execute(&buf, templateParams)
	if err != nil {
		return err
	}

	body := buf.String()

	message := mail.NewV3Mail()
	message.Subject = params.subject
	message.SetFrom(mail.NewEmail("", fromEmail))
	message.AddContent(mail.NewContent(emailContentType, body))
	var tos []*mail.Email
	for _, email := range params.ToEmails {
		tos = append(tos, mail.NewEmail("", email))
	}
	p := mail.NewPersonalization()
	p.AddTos(tos...)
	message.AddPersonalizations(p)
	_, err = mailer.client.SendWithContext(ctx, message)

	return err
}

func (mailer *Mailer) SendDeletedReport(ctx context.Context, params DeletedMailParams) error {
	templateNamesStr := strings.Join(params.TemplateNames, ", ")

	tpl, err := template.New("").Parse(deletedTemplate)
	if err != nil {
		return err
	}

	templateParams := deletedMailTemplateParams{
		LogoImageURL:  mailer.logoImageURL,
		FolderName:    params.FolderName,
		TemplateNames: templateNamesStr,
		SendingDate:   time.Now().Format(time.RFC850),
		ErrorMessage:  params.ErrorMessage,
		IsSuccess:     params.IsSuccess,
	}

	var buf bytes.Buffer
	err = tpl.Execute(&buf, templateParams)
	if err != nil {
		return err
	}

	body := buf.String()

	message := mail.NewV3Mail()
	message.Subject = "Pop Health Deactivation Report"
	message.SetFrom(mail.NewEmail("", fromEmail))
	message.AddContent(mail.NewContent(emailContentType, body))
	tos := make([]*mail.Email, len(params.ToEmails))
	for i, email := range params.ToEmails {
		tos[i] = mail.NewEmail("", email)
	}
	p := mail.NewPersonalization()
	p.AddTos(tos...)
	message.AddPersonalizations(p)
	_, err = mailer.client.SendWithContext(ctx, message)

	return err
}

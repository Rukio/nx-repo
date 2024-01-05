package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"time"

	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/pophealth/pophealthdb"
)

var (
	ErrTemplateNotFound = errors.New("template was not found")
	templatePrecedence  = []string{
		pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_PREFIX.String(),
		pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX.String(),
		pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_UNSPECIFIED.String(),
	}
)

type TemplateDBService interface {
	GetActiveTemplatesInBucketFolder(context.Context, int64) ([]*pophealthsql.Template, error)
	UpdateFileStatusByID(context.Context, pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error)
	UpdateTemplateInFileByID(context.Context, pophealthsql.UpdateTemplateInFileByIDParams) (*pophealthsql.File, error)
}

type TemplatesService struct {
	DBService TemplateDBService
}

type UpdateFileByTemplateRequest struct {
	fileName string
	bucketID int64
}

func NewTemplateService(db TemplateDBService) *TemplatesService {
	return &TemplatesService{DBService: db}
}

func (s TemplatesService) FindTemplateByFile(ctx context.Context, req UpdateFileByTemplateRequest) (*pophealthsql.Template, error) {
	templates, err := s.DBService.GetActiveTemplatesInBucketFolder(ctx, req.bucketID)
	if err != nil {
		return nil, err
	}

	matchedTemplates := make(map[string]*pophealthsql.Template)
	for _, template := range templates {
		if template.FileIdentifierType == pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_UNSPECIFIED.String() {
			if isMostRecentTemplate(matchedTemplates, template) {
				matchedTemplates[template.FileIdentifierType] = template
			}
			continue
		}

		regexToMatch := "^%s.*"
		if template.FileIdentifierType == pophealthpb.FileIdentifier_FILE_IDENTIFIER_TYPE_SUFFIX.String() {
			regexToMatch = ".*%s[.]([a-z]{3}|[a-z]{4})$"
		}

		re := regexp.MustCompile(fmt.Sprintf(regexToMatch, template.FileIdentifierValue))
		result := re.FindString(req.fileName)

		if result != "" && isMostSpecificTemplate(matchedTemplates, template) {
			matchedTemplates[template.FileIdentifierType] = template
		}
	}

	for _, templateType := range templatePrecedence {
		if template, ok := matchedTemplates[templateType]; ok {
			return template, nil
		}
	}

	return nil, ErrTemplateNotFound
}

func isMostRecentTemplate(templateMap map[string]*pophealthsql.Template, template *pophealthsql.Template) bool {
	matchedTemplate, ok := templateMap[template.FileIdentifierType]
	return !ok || matchedTemplate.UpdatedAt.Before(template.UpdatedAt)
}

func isMostSpecificTemplate(templateMap map[string]*pophealthsql.Template, template *pophealthsql.Template) bool {
	matchedTemplate, ok := templateMap[template.FileIdentifierType]
	return !ok || len(template.FileIdentifierValue) > len(matchedTemplate.FileIdentifierValue)
}

func (s TemplatesService) UpdateFileByTemplate(ctx context.Context, fileID, templateID int64) (*pophealthsql.File, error) {
	file, err := s.DBService.UpdateTemplateInFileByID(ctx, pophealthsql.UpdateTemplateInFileByIDParams{
		ID:         fileID,
		TemplateID: sql.NullInt64{Int64: templateID, Valid: true},
	})

	return file, err
}

func (s TemplatesService) UpdateFileStatus(ctx context.Context, fileID int64, status pophealthpb.PopHealthFile_FileStatus) (*pophealthsql.File, error) {
	file, err := s.DBService.UpdateFileStatusByID(ctx, pophealthsql.UpdateFileStatusByIDParams{
		ID: fileID,
		ProcessedAt: sql.NullTime{
			Time: time.Now(),
		},
		Status: pophealthdb.FileStatusToEnum[status],
	})

	return file, err
}

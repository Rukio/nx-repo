package pophealthdb

import (
	"context"
	"database/sql"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

type PopHealthDB struct {
	db      basedb.DBTX
	scope   monitoring.Scope
	queries *pophealthsql.Queries
}

func NewPopHealthDB(db basedb.DBTX, scope monitoring.Scope) *PopHealthDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}
	mdb := monitoring.NewDB(db, scope)
	return &PopHealthDB{
		db:      db,
		scope:   scope,
		queries: pophealthsql.New(mdb),
	}
}

func (pdb *PopHealthDB) ActivateBucketFolder(ctx context.Context, id int64) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.ActivateBucketFolder(ctx, id)
}

func (pdb *PopHealthDB) AddBucketFolder(ctx context.Context, arg pophealthsql.AddBucketFolderParams) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.AddBucketFolder(ctx, arg)
}

func (pdb *PopHealthDB) AddBucketFolderEmailNotifications(ctx context.Context, arg pophealthsql.AddBucketFolderEmailNotificationsParams) (*pophealthsql.BucketFolderEmailNotification, error) {
	return pdb.queries.AddBucketFolderEmailNotifications(ctx, arg)
}

func (pdb *PopHealthDB) AddFile(ctx context.Context, arg pophealthsql.AddFileParams) (*pophealthsql.File, error) {
	return pdb.queries.AddFile(ctx, arg)
}

func (pdb *PopHealthDB) AddFilesResultCodes(ctx context.Context, arg pophealthsql.AddFilesResultCodesParams) (*pophealthsql.FilesResultCode, error) {
	return pdb.queries.AddFilesResultCodes(ctx, arg)
}

func (pdb *PopHealthDB) AddFilesResultCodesWithOccurrences(ctx context.Context, arg pophealthsql.AddFilesResultCodesWithOccurrencesParams) (*pophealthsql.FilesResultCode, error) {
	return pdb.queries.AddFilesResultCodesWithOccurrences(ctx, arg)
}

func (pdb *PopHealthDB) AddTemplateToBucketFolder(ctx context.Context, arg pophealthsql.AddTemplateToBucketFolderParams) (*pophealthsql.Template, error) {
	return pdb.queries.AddTemplateToBucketFolder(ctx, arg)
}

func (pdb *PopHealthDB) CreateResultCode(ctx context.Context, arg pophealthsql.CreateResultCodeParams) (*pophealthsql.ResultCode, error) {
	return pdb.queries.CreateResultCode(ctx, arg)
}

func (pdb *PopHealthDB) DeactivateBucketFolder(ctx context.Context, id int64) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.DeactivateBucketFolder(ctx, id)
}

func (pdb *PopHealthDB) DeleteBucketFolder(ctx context.Context, id int64) error {
	return pdb.queries.DeleteBucketFolder(ctx, id)
}

func (pdb *PopHealthDB) DeleteBucketFolderEmailNotifications(ctx context.Context, id int64) error {
	return pdb.queries.DeleteBucketFolderEmailNotifications(ctx, id)
}

func (pdb *PopHealthDB) DeleteFileByID(ctx context.Context, id int64) (*pophealthsql.File, error) {
	return pdb.queries.DeleteFileByID(ctx, id)
}

func (pdb *PopHealthDB) DeleteTemplateByID(ctx context.Context, id int64) (*pophealthsql.Template, error) {
	return pdb.queries.DeleteTemplateByID(ctx, id)
}

func (pdb *PopHealthDB) DeleteTemplatesByChannelItemIDs(ctx context.Context, ids []int64) ([]*pophealthsql.Template, error) {
	return pdb.queries.DeleteTemplatesByChannelItemIDs(ctx, ids)
}

func (pdb *PopHealthDB) GetActiveTemplatesInBucketFolder(ctx context.Context, id int64) ([]*pophealthsql.Template, error) {
	return pdb.queries.GetActiveTemplatesInBucketFolder(ctx, id)
}

func (pdb *PopHealthDB) GetBucketFolderByID(ctx context.Context, id int64) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.GetBucketFolderByID(ctx, id)
}

func (pdb *PopHealthDB) GetBucketFolderByS3BucketName(ctx context.Context, s3BucketName string) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.GetBucketFolderByS3BucketName(ctx, s3BucketName)
}

func (pdb *PopHealthDB) GetBucketFolders(ctx context.Context) ([]*pophealthsql.BucketFolder, error) {
	return pdb.queries.GetBucketFolders(ctx)
}

func (pdb *PopHealthDB) GetEmailNotificationsByBucketID(ctx context.Context, id int64) ([]string, error) {
	return pdb.queries.GetEmailNotificationsByBucketID(ctx, id)
}

func (pdb *PopHealthDB) GetExpiredFiles(ctx context.Context, t time.Time) ([]*pophealthsql.GetExpiredFilesRow, error) {
	return pdb.queries.GetExpiredFiles(ctx, t)
}

func (pdb *PopHealthDB) GetFileAndBucketFolderByFileID(ctx context.Context, id int64) (*pophealthsql.GetFileAndBucketFolderByFileIDRow, error) {
	return pdb.queries.GetFileAndBucketFolderByFileID(ctx, id)
}

func (pdb *PopHealthDB) GetFileByBucketAndObjectKey(ctx context.Context, arg pophealthsql.GetFileByBucketAndObjectKeyParams) (*pophealthsql.File, error) {
	return pdb.queries.GetFileByBucketAndObjectKey(ctx, arg)
}

func (pdb *PopHealthDB) GetFileByID(ctx context.Context, id int64) (*pophealthsql.File, error) {
	return pdb.queries.GetFileByID(ctx, id)
}

func (pdb *PopHealthDB) GetFileByPrefectFlowRunID(ctx context.Context, prefectFlowRunID sql.NullString) (*pophealthsql.GetFileByPrefectFlowRunIDRow, error) {
	return pdb.queries.GetFileByPrefectFlowRunID(ctx, prefectFlowRunID)
}

func (pdb *PopHealthDB) GetFileCountForBucketFolder(ctx context.Context, arg pophealthsql.GetFileCountForBucketFolderParams) (int64, error) {
	return pdb.queries.GetFileCountForBucketFolder(ctx, arg)
}

func (pdb *PopHealthDB) GetFileResultCodesWithCodeDetailsByFileID(ctx context.Context, id int64) ([]*pophealthsql.GetFileResultCodesWithCodeDetailsByFileIDRow, error) {
	return pdb.queries.GetFileResultCodesWithCodeDetailsByFileID(ctx, id)
}

func (pdb *PopHealthDB) GetFilesAndTemplatesCount(ctx context.Context, id int64) (*pophealthsql.GetFilesAndTemplatesCountRow, error) {
	return pdb.queries.GetFilesAndTemplatesCount(ctx, id)
}

func (pdb *PopHealthDB) GetFilesByBucket(ctx context.Context, arg pophealthsql.GetFilesByBucketParams) ([]*pophealthsql.GetFilesByBucketRow, error) {
	return pdb.queries.GetFilesByBucket(ctx, arg)
}

func (pdb *PopHealthDB) GetFilesByChannelItemAndBucketID(ctx context.Context, arg pophealthsql.GetFilesByChannelItemAndBucketIDParams) ([]*pophealthsql.File, error) {
	return pdb.queries.GetFilesByChannelItemAndBucketID(ctx, arg)
}

func (pdb *PopHealthDB) GetNumberOfProcessingBackfillFiles(ctx context.Context) (int64, error) {
	return pdb.queries.GetNumberOfProcessingBackfillFiles(ctx)
}

func (pdb *PopHealthDB) GetOldestFileByStatusWithChannelItem(ctx context.Context, arg pophealthsql.GetOldestFileByStatusWithChannelItemParams) (*pophealthsql.File, error) {
	return pdb.queries.GetOldestFileByStatusWithChannelItem(ctx, arg)
}

func (pdb *PopHealthDB) GetProcessingBackfillFileByChannelItemID(ctx context.Context, id int64) (*pophealthsql.File, error) {
	return pdb.queries.GetProcessingBackfillFileByChannelItemID(ctx, id)
}

func (pdb *PopHealthDB) GetResultCodeByCode(ctx context.Context, code string) (*pophealthsql.ResultCode, error) {
	return pdb.queries.GetResultCodeByCode(ctx, code)
}

func (pdb *PopHealthDB) GetTemplateByBucketFolderAndName(ctx context.Context, arg pophealthsql.GetTemplateByBucketFolderAndNameParams) (*pophealthsql.Template, error) {
	return pdb.queries.GetTemplateByBucketFolderAndName(ctx, arg)
}

func (pdb *PopHealthDB) GetTemplateByChannelItemID(ctx context.Context, arg pophealthsql.GetTemplateByChannelItemIDParams) (*pophealthsql.Template, error) {
	return pdb.queries.GetTemplateByChannelItemID(ctx, arg)
}

func (pdb *PopHealthDB) GetTemplateByID(ctx context.Context, id int64) (*pophealthsql.Template, error) {
	return pdb.queries.GetTemplateByID(ctx, id)
}

func (pdb *PopHealthDB) GetTemplatesInBucketFolder(ctx context.Context, id int64) ([]*pophealthsql.Template, error) {
	return pdb.queries.GetTemplatesInBucketFolder(ctx, id)
}

func (pdb *PopHealthDB) IsHealthy(ctx context.Context) bool {
	return pdb.db.Ping(ctx) == nil
}

func (pdb *PopHealthDB) UpdateAwsObjectKeyInFilesByID(ctx context.Context, arg pophealthsql.UpdateAwsObjectKeyInFilesByIDParams) (*pophealthsql.File, error) {
	return pdb.queries.UpdateAwsObjectKeyInFilesByID(ctx, arg)
}

func (pdb *PopHealthDB) UpdateBucketFolder(ctx context.Context, arg pophealthsql.UpdateBucketFolderParams) (*pophealthsql.BucketFolder, error) {
	return pdb.queries.UpdateBucketFolder(ctx, arg)
}

func (pdb *PopHealthDB) UpdateFileByID(ctx context.Context, arg pophealthsql.UpdateFileByIDParams) (*pophealthsql.File, error) {
	return pdb.queries.UpdateFileByID(ctx, arg)
}

func (pdb *PopHealthDB) UpdateFileStartProcessingByID(ctx context.Context, arg pophealthsql.UpdateFileStartProcessingByIDParams) (*pophealthsql.File, error) {
	return pdb.queries.UpdateFileStartProcessingByID(ctx, arg)
}

func (pdb *PopHealthDB) UpdateFileStatusByID(ctx context.Context, arg pophealthsql.UpdateFileStatusByIDParams) (*pophealthsql.File, error) {
	return pdb.queries.UpdateFileStatusByID(ctx, arg)
}

func (pdb *PopHealthDB) UpdateTemplateByID(ctx context.Context, arg pophealthsql.UpdateTemplateByIDParams) (*pophealthsql.Template, error) {
	return pdb.queries.UpdateTemplateByID(ctx, arg)
}

func (pdb *PopHealthDB) UpdateTemplateInFileByID(ctx context.Context, arg pophealthsql.UpdateTemplateInFileByIDParams) (*pophealthsql.File, error) {
	return pdb.queries.UpdateTemplateInFileByID(ctx, arg)
}

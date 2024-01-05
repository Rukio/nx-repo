package main

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/pophealth-service/mailer"
	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

const deleteResultsRegex = `results\/[a-f0-9\-]+__delete_results\.json`

type DeleteResult struct {
	FlowRunID                    string           `json:"flow_run_id"`
	BucketFolderID               int64            `json:"bucket_folder_id"`
	ProcessedAt                  time.Time        `json:"processed_at"`
	Status                       string           `json:"status"`
	NumberDeletedByChannelItemID map[string]int64 `json:"number_deleted_by_channel_item_id"`
	Errors                       []DeleteError    `json:"errors"`
}

type DeleteError struct {
	Error     string   `json:"error"`
	ErrorCode string   `json:"error_code"`
	Fields    []string `json:"fields"`
}

type DeleteByChannelItemIDError struct {
	ChannelItemID int64
	ErrorMessage  error
}

func (d DeleteByChannelItemIDError) Error() string {
	return fmt.Sprintf("channelItemID: %d error: %v", d.ChannelItemID, d.ErrorMessage)
}

func (f *ProcessFileService) deactivateBucketProcessResultFile(ctx context.Context, flowID string, deleteResult DeleteResult) {
	log := f.logger.With(
		"source", "process_service",
		"deactivate", true,
		"flowRunID", flowID,
		"bucketFolderID", deleteResult.BucketFolderID,
		"deletedPatients", formatNumberOfDeletedPatients(deleteResult.NumberDeletedByChannelItemID),
	)
	sendEmail := true
	deleteEmailParams, err := f.getDeleteEmailParams(ctx, deleteResult)
	if err != nil {
		sendEmail = false
		log.Errorw("error getting delete email params", zap.Error(err))
	}

	err = f.deletePatientsFromBucket(ctx, deleteResult)
	if err != nil {
		deleteEmailParams.ErrorMessage = err.Error()
		log.Errorw("error deleting patients", zap.Error(err))
		_, err := f.db.ActivateBucketFolder(ctx, deleteResult.BucketFolderID)
		if err != nil {
			log.Errorw("error activating bucket folder", zap.Error(err))
		}
	} else {
		deleteEmailParams.IsSuccess = true
	}

	if sendEmail {
		err = f.mailer.SendDeletedReport(ctx, deleteEmailParams)
		if err != nil {
			log.Errorw("error sending email for delete report", zap.Error(err))
		}
	}

	log.Info("successfully processed delete results file")
}

func (f *ProcessFileService) deletePatientsFromBucket(ctx context.Context, result DeleteResult) error {
	if result.Status == "error" {
		return fmt.Errorf(
			"error in delete results file. status: %s errors: %s",
			result.Status,
			formatDeleteErrors(result.Errors),
		)
	}

	deletedChannelItemIDs, err := getChannelItemIDsFromResultMap(result.NumberDeletedByChannelItemID)
	if err != nil {
		return err
	}

	eg, egCtx := errgroup.WithContext(ctx)
	for _, channelItemID := range deletedChannelItemIDs {
		channelItemID := channelItemID
		for _, index := range []PopHealthIndexKey{PatientIndexKey, BackfillPatientIndexKey} {
			index := index
			eg.Go(func() error {
				_, err := f.elasticSearch.DeleteByChannelItemID(egCtx, index, channelItemID)
				if err != nil {
					return DeleteByChannelItemIDError{
						ChannelItemID: channelItemID,
						ErrorMessage:  err,
					}
				}
				return nil
			})
		}
	}

	err = eg.Wait()
	if err != nil {
		return fmt.Errorf("delete failed for channel item ids: %w", err)
	}

	return f.deleteBucketFilesAndTemplates(ctx, result.BucketFolderID, deletedChannelItemIDs)
}

func (f *ProcessFileService) deleteBucketFilesAndTemplates(ctx context.Context, bucketFolderID int64, channelItemIDs []int64) error {
	files, err := f.db.GetFilesByChannelItemAndBucketID(ctx, pophealthsql.GetFilesByChannelItemAndBucketIDParams{
		BucketFolderID: bucketFolderID,
		ChannelItemIds: channelItemIDs,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}

	errorMessage := strings.Builder{}
	for _, file := range files {
		if err := f.aws.DeleteS3File(ctx, f.exchangeBucket, file.AwsObjectKey.String); err != nil {
			errorMessage.WriteString(fmt.Sprintf("error deleting file from s3: fileID: %d. error: %s\n", file.ID, err.Error()))
			f.logger.Errorw("error deleting file from s3",
				"fileID", file.ID,
				"awsObjectKey", file.AwsObjectKey.String,
				zap.Error(err))
		} else {
			f.logger.Infow("successfully deleted file from s3",
				"fileID", file.ID,
				"fileName", file.Filename,
				"awsObjectKey", file.AwsObjectKey.String,
			)
		}

		_, err = f.db.DeleteFileByID(ctx, file.ID)
		if err != nil {
			errorMessage.WriteString(fmt.Sprintf("error deleting file from db: fileID: %d. error: %s\n", file.ID, err.Error()))
			f.logger.Errorw("error deleting file from db", "fileID", file.ID, zap.Error(err))
		}
	}
	if len(channelItemIDs) > 0 {
		_, err = f.db.DeleteTemplatesByChannelItemIDs(ctx, channelItemIDs)
		if err != nil {
			errorMessage.WriteString(fmt.Sprintf("error deleting templates by channel item ids: error: %s\n", err.Error()))
			f.logger.Errorw("error deleting templates by channel item ids", "channelItemIDs", channelItemIDs, zap.Error(err))
		}
	}

	if errorMessage.Len() > 0 {
		return errors.New(errorMessage.String())
	}

	return nil
}

func (f *ProcessFileService) getDeleteEmailParams(ctx context.Context, result DeleteResult) (mailer.DeletedMailParams, error) {
	bucketFolderID := result.BucketFolderID
	folder, err := f.db.GetBucketFolderByID(ctx, bucketFolderID)
	if err != nil {
		return mailer.DeletedMailParams{}, err
	}

	emailNotifications, err := f.db.GetEmailNotificationsByBucketID(ctx, bucketFolderID)
	if err != nil {
		return mailer.DeletedMailParams{}, err
	}

	templates, err := f.db.GetTemplatesInBucketFolder(ctx, bucketFolderID)
	if err != nil {
		return mailer.DeletedMailParams{
			FolderName: folder.Name,
			ToEmails:   emailNotifications,
		}, err
	}

	templateNames := make([]string, 0)
	for _, template := range templates {
		if _, isDeletedTemplate := result.NumberDeletedByChannelItemID[strconv.FormatInt(template.ChannelItemID, 10)]; isDeletedTemplate {
			templateNames = append(templateNames, template.Name)
		}
	}
	return mailer.DeletedMailParams{
		FolderName:    folder.Name,
		TemplateNames: templateNames,
		ToEmails:      emailNotifications,
	}, nil
}

func getChannelItemIDsFromResultMap(result map[string]int64) ([]int64, error) {
	i := 0
	deletedChannelItemIDs := make([]int64, len(result))
	for channelItemID := range result {
		deletedChannelItem, err := strconv.ParseInt(channelItemID, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("error parsing channel item id. channelItemID: %s error: %w", channelItemID, err)
		}

		deletedChannelItemIDs[i] = deletedChannelItem
		i++
	}
	return deletedChannelItemIDs, nil
}

func isDeletedResultFile(objectKey string) bool {
	match, _ := regexp.MatchString(deleteResultsRegex, objectKey)
	return match
}

func formatDeleteErrors(deleteErrors []DeleteError) string {
	var errorString strings.Builder
	for _, deleteError := range deleteErrors {
		errorString.WriteString(fmt.Sprintf("error code: %s error: %s\n", deleteError.ErrorCode, deleteError.Error))
	}
	return errorString.String()
}

func formatNumberOfDeletedPatients(numberDeletedByChannelItem map[string]int64) string {
	var deletedPatients strings.Builder
	for channelItemID, numberDeleted := range numberDeletedByChannelItem {
		deletedPatients.WriteString(fmt.Sprintf("%d patients deleted for channel item %s\n", numberDeleted, channelItemID))
	}
	return deletedPatients.String()
}

package main

import (
	"context"
	"time"

	"go.uber.org/zap"

	pophealthsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	expiredDuration      = -time.Hour * 12
	expiredFilePointName = "expiredFile"
	fileIDLogName        = "fileID"
)

type processService interface {
	UpdateFileWithInternalResultCode(ctx context.Context, fileID int64, code string)
	moveFileInExchangeBucketByStatus(ctx context.Context, popHealthFile *pophealthsql.File) (*pophealthsql.File, error)
	processNextWaitingFile(ctx context.Context, templateID int64)
}

type FileCheckerService struct {
	db             dbFileService
	processService processService
	logger         *zap.SugaredLogger
	influxScope    monitoring.Scope
	sleepDuration  time.Duration
}

func (f *FileCheckerService) Run(ctx context.Context) error {
	log := f.logger.With("source", "file_checker")
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		expiredTime := time.Now().Add(expiredDuration)

		expiredFiles, err := f.db.GetExpiredFiles(ctx, expiredTime)
		if err != nil {
			f.logger.Errorw("could not get expired files",
				"source", "file_checker",
				zap.Error(err))
			time.Sleep(f.sleepDuration)
			continue
		}

		var updatedFile *pophealthsql.File

		for _, file := range expiredFiles {
			updatedFile, err = f.db.UpdateFileByID(ctx, pophealthsql.UpdateFileByIDParams{
				ID:     file.ID,
				Status: pophealthsql.FileStatusFailed,
			})

			if err != nil {
				LogErrorw(log, "error updating status for file", err, fileIDLogName, file.ID)
				continue
			}

			f.processService.UpdateFileWithInternalResultCode(ctx, file.ID, expiredFileCode)

			_, err = f.processService.moveFileInExchangeBucketByStatus(ctx, updatedFile)

			if err != nil {
				LogErrorw(log, "error moving file", err, fileIDLogName, file.ID)
			}

			if !file.IsBackfill {
				f.processService.processNextWaitingFile(ctx, file.TemplateID.Int64)
			}

			LogErrorw(log, "file expired", nil, fileIDLogName, file.ID, "folder name", file.Name)

			f.recordMetric(file.Name)
		}

		time.Sleep(f.sleepDuration)
	}
}

func (f *FileCheckerService) recordMetric(folderName string) {
	f.influxScope.WritePoint(
		expiredFilePointName,
		monitoring.Tags{
			"folderName": folderName,
		},
		monitoring.Fields{
			"count": 1,
		},
	)
}

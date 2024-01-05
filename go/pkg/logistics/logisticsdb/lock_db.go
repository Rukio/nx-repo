package logisticsdb

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
)

func NewLockDB(db basedb.DBTX, logger *zap.SugaredLogger, scope monitoring.Scope) *LockDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}

	mdb := monitoring.NewDB(db, scope.With("LockDB", nil, nil))
	return &LockDB{
		db:     db,
		logger: logger,

		queries: logisticssql.New(mdb),
	}
}

type Lock interface {
	Lock(ctx context.Context, serviceRegionID int64, lockDate *common.Date) (*ServiceRegionDateLock, error)
}

type LockDB struct {
	db     basedb.DBTX
	logger *zap.SugaredLogger

	queries *logisticssql.Queries
}

func (lockDB *LockDB) Lock(ctx context.Context, serviceRegionID int64, lockDate *common.Date) (*ServiceRegionDateLock, error) {
	lockID, err := advisoryLockID(serviceRegionID, lockDate)
	if err != nil {
		return nil, err
	}

	tx, err := lockDB.db.Begin(ctx)
	if err != nil {
		return nil, err
	}

	err = lockDB.queries.WithTx(tx).LockServiceRegionDate(
		ctx,
		lockID,
	)
	if err != nil {
		return nil, err
	}

	return &ServiceRegionDateLock{
		tx:     tx,
		logger: lockDB.logger,
	}, nil
}

type ServiceRegionDateLock struct {
	tx     pgx.Tx
	logger *zap.SugaredLogger
}

func (lock *ServiceRegionDateLock) Release(ctx context.Context) {
	if lock == nil {
		return
	}
	err := lock.tx.Rollback(ctx)
	if err != nil {
		lock.logger.Errorw("failed to rollback advisory lock", zap.Error(err))
	}
}

func advisoryLockID(serviceRegionID int64, serviceDate *common.Date) (int64, error) {
	lockIDStr := fmt.Sprintf("%d%04d%02d%02d", serviceRegionID, int(serviceDate.Year), time.Month(serviceDate.Month), int(serviceDate.Day))
	lockID, err := strconv.ParseInt(lockIDStr, 10, 64)
	if err != nil {
		return 0, err
	}

	return lockID, nil
}

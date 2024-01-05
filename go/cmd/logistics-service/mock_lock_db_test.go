package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
)

type MockLockDB struct {
	LockResult *logisticsdb.ServiceRegionDateLock
	LockErr    error
}

func (lockDB *MockLockDB) Lock(ctx context.Context, serviceRegionID int64, lockDate *common.Date) (*logisticsdb.ServiceRegionDateLock, error) {
	return lockDB.LockResult, lockDB.LockErr
}

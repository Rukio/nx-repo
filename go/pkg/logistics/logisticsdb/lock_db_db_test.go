//go:build db_test

package logisticsdb

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
	"go.uber.org/zap"
)

var (
	testDBName = "logistics"
)

func TestLockDB(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	lockDB := NewLockDB(db, zap.NewNop().Sugar(), nil)
	defer done()

	serviceRegionID := time.Now().UnixNano() % 1000
	lockDate := &common.Date{
		Year:  2023,
		Month: 4,
		Day:   10,
	}

	lock, err := lockDB.Lock(ctx, serviceRegionID, lockDate)
	defer lock.Release(ctx)
	if err != nil {
		t.Fatal(err)
	}

	intChannel := make(chan int, 2)
	longDuration := 300 * time.Millisecond
	shortDuration := 50 * time.Millisecond
	time.AfterFunc(longDuration, func() {
		intChannel <- 1
		lock.Release(ctx)
	})

	ctxWithTimeout, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel()
	time.AfterFunc(shortDuration, func() {
		lock2, err := lockDB.Lock(ctxWithTimeout, serviceRegionID, lockDate)
		defer lock2.Release(ctxWithTimeout)
		if err != nil {
			t.Error(err)
		}
		intChannel <- 2
	})

	testutils.MustMatch(t, 1, <-intChannel)
	testutils.MustMatch(t, 2, <-intChannel)
	testutils.MustMatch(t, nil, ctxWithTimeout.Err())
}

func TestAdvisoryLockID(t *testing.T) {
	serviceRegionID := int64(4)
	lockDate := &common.Date{
		Year:  2023,
		Month: 1,
		Day:   10,
	}
	lockID, err := advisoryLockID(serviceRegionID, lockDate)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, int64(420230110), lockID)
}

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *logisticssql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, logisticssql.New(db), func() {
		db.Close()
	}
}

package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	athenasql "github.com/*company-data-covered*/services/go/pkg/generated/sql/athena"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

type AthenaDB struct {
	db      basedb.DBTX
	queries *athenasql.Queries
}

func NewAthenaDB(db basedb.DBTX) *AthenaDB {
	ddTraceDB := monitoring.NewDDTraceDB(db, monitoring.DataDogAthenaServiceName)
	return &AthenaDB{
		db:      db,
		queries: athenasql.New(ddTraceDB),
	}
}

func (adb *AthenaDB) IsHealthy(ctx context.Context) bool {
	return adb.db.Ping(ctx) == nil
}

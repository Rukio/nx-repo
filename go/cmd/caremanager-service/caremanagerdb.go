package main

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	caremanagersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

var (
	dataDogTraceServiceName = "postgres.caremanager"
)

var ErrVisitValueNotFound = errors.New("no value found for this visit")

type CaremanagerDB struct {
	db      basedb.DBTX
	queries *caremanagersql.Queries
}

func NewCaremanagerDB(db basedb.DBTX) *CaremanagerDB {
	ddTraceDB := monitoring.NewDDTraceDB(db, dataDogTraceServiceName)
	return &CaremanagerDB{
		db:      db,
		queries: caremanagersql.New(ddTraceDB),
	}
}

func (cdb *CaremanagerDB) GetLatestVisitValue(ctx context.Context, params caremanagersql.GetLatestVisitValueParams) (*caremanagersql.VisitValue, error) {
	visitValues, err := cdb.queries.GetLatestVisitValue(ctx, params)
	if err != nil {
		return nil, err
	}
	if len(visitValues) == 0 {
		return nil, ErrVisitValueNotFound
	}

	return visitValues[0], nil
}

func (cdb *CaremanagerDB) IsHealthy(ctx context.Context) bool {
	return cdb.db.Ping(ctx) == nil
}

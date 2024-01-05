package audit

import (
	"context"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	auditsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/audit"
	"github.com/jackc/pgtype"
)

type DB struct {
	db      basedb.DBTX
	queries *auditsql.Queries
}

func NewDB(db basedb.DBTX) *DB {
	return &DB{
		db:      db,
		queries: auditsql.New(db),
	}
}

type EventRecord struct {
	Source          string
	Agent           string
	EventType       string
	EventTimestamp  time.Time
	EventDataType   string
	EventData       map[string]any
	ContextMetadata map[string]any
}

func (adb *DB) CreateAuditEvent(ctx context.Context, eventRecord *EventRecord) (*auditsql.AuditEvent, error) {
	var eventData pgtype.JSON
	err := eventData.Set(eventRecord.EventData)
	if err != nil {
		return nil, err
	}

	var contextMetadata pgtype.JSON
	err = contextMetadata.Set(eventRecord.ContextMetadata)
	if err != nil {
		return nil, err
	}

	return adb.queries.AddAuditEvent(ctx, auditsql.AddAuditEventParams{
		Source:          eventRecord.Source,
		Agent:           eventRecord.Agent,
		EventType:       eventRecord.EventType,
		EventTimestamp:  eventRecord.EventTimestamp,
		EventDataType:   eventRecord.EventDataType,
		EventData:       eventData,
		ContextMetadata: contextMetadata,
	})
}

func (adb *DB) IsHealthy(ctx context.Context) bool {
	return adb.db.Ping(ctx) == nil
}

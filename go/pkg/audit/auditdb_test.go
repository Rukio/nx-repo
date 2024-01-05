//go:build db_test

package audit_test

import (
	"context"
	"errors"
	"math"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName = "audit"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, func() {
		db.Close()
	}
}

func TestAuditDB_IsHealthy(t *testing.T) {
	_, _, done := setupDBTest(t)
	defer done()

	adb := audit.NewDB(&basedb.MockPingDBTX{})
	isHealthy := adb.IsHealthy(context.Background())
	testutils.MustMatch(t, true, isHealthy, "database status is not the expected")

	adb = audit.NewDB(&basedb.MockPingDBTX{PingErr: errors.New("boo")})
	isHealthy = adb.IsHealthy(context.Background())
	testutils.MustMatch(t, false, isHealthy, "database status is healthy but database is null")
}

func TestAuditDB_CreateAuditEvent(t *testing.T) {
	ctx, db, done := setupDBTest(t)
	defer done()

	adb := audit.NewDB(db)

	tcs := []struct {
		Description string
		AuditRecord audit.EventRecord

		HasError bool
	}{
		{
			Description: "Create an Audit Event",
			AuditRecord: audit.EventRecord{
				Source:         "Station",
				Agent:          "test.person@gmail.com",
				EventType:      "CREATE",
				EventTimestamp: time.Now(),
				EventDataType:  "Patient",
				EventData: map[string]any{
					"id":      "1123",
					"name":    "Test Person",
					"email":   "test.persons@gmail.com",
					"address": "1234 Test Lane, Denver Colorado 80123",
				},
				ContextMetadata: map[string]any{
					"correlation_id": "4F934F02-CDF0-435B-AF4A-A51BEE4D18DB",
				},
			},
			HasError: false,
		},
		{
			Description: "Create an Audit Record with Empty Context Metadata",
			AuditRecord: audit.EventRecord{
				Source:         "Station",
				Agent:          "test.person@gmail.com",
				EventType:      "CREATE",
				EventTimestamp: time.Now(),
				EventDataType:  "Patient",
				EventData: map[string]any{
					"id":      "1123",
					"name":    "Test Person",
					"email":   "test.persons@gmail.com",
					"address": "1234 Test Lane, Denver Colorado 80123",
				},
			},
			HasError: false,
		},
		{
			Description: "Create an Audit Event with and Unsupported Event Data Value",
			AuditRecord: audit.EventRecord{
				Source:         "Station",
				Agent:          "test.person@gmail.com",
				EventType:      "CREATE",
				EventTimestamp: time.Now(),
				EventDataType:  "Patient",
				EventData: map[string]any{
					"id":             "1123",
					"name":           "Test Person",
					"email":          "test.persons@gmail.com",
					"address":        "1234 Test Lane, Denver Colorado 80123",
					"invalid_number": math.Inf(1),
				},
			},
			HasError: true,
		},
		{
			Description: "Create an Audit Event with and Unsupported Context Metadata Value",
			AuditRecord: audit.EventRecord{
				Source:         "Station",
				Agent:          "test.person@gmail.com",
				EventType:      "CREATE",
				EventTimestamp: time.Now(),
				EventDataType:  "Patient",
				EventData: map[string]any{
					"id":      "1123",
					"name":    "Test Person",
					"email":   "test.persons@gmail.com",
					"address": "1234 Test Lane, Denver Colorado 80123",
				},
				ContextMetadata: map[string]any{
					"invalid_number": math.Inf(1),
				},
			},
			HasError: true,
		},
		{
			Description: "Create an Audit Event with Empty Source",
			AuditRecord: audit.EventRecord{
				Agent:          "test.person@gmail.com",
				EventType:      "CREATE",
				EventTimestamp: time.Now(),
				EventDataType:  "Patient",
				EventData: map[string]any{
					"id":      "1123",
					"name":    "Test Person",
					"email":   "test.persons@gmail.com",
					"address": "1234 Test Lane, Denver Colorado 80123",
				},
			},
			HasError: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Description, func(t *testing.T) {
			_, err := adb.CreateAuditEvent(ctx, &tc.AuditRecord)
			if (err != nil) != tc.HasError {
				t.Fatal(err)
			}
		})
	}
}

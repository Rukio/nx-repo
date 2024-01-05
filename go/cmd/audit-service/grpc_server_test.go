//go:build db_test

package main_test

import (
	"context"
	"testing"
	"time"

	main "github.com/*company-data-covered*/services/go/cmd/audit-service"
	"github.com/*company-data-covered*/services/go/pkg/audit"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestCreateAuditEvent(t *testing.T) {
	db := testutils.GetDBConnPool(t, "audit")
	ctx := context.Background()
	defer db.Close()

	s := &main.GRPCServer{
		AuditDB: audit.NewDB(db),
		Logger:  baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}

	source := "Station"
	agent := "test.user@*company-data-covered*.com"
	eventType := "CREATE"
	eventDataType := "Patient"
	eventTimestamp := timestamppb.New(time.Date(2022, 1, 1, 12, 0, 0, 0, time.UTC))

	tcs := []struct {
		Desc   string
		Input  *auditpb.CreateAuditEventRequest
		Output *auditpb.CreateAuditEventResponse

		HasError bool
	}{
		{
			Desc: "Base case",
			Input: &auditpb.CreateAuditEventRequest{
				Source:          &source,
				Agent:           &agent,
				EventType:       &eventType,
				EventTimestamp:  eventTimestamp,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},

			Output: &auditpb.CreateAuditEventResponse{
				Source:          &source,
				Agent:           &agent,
				EventType:       &eventType,
				EventTimestamp:  eventTimestamp,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
		},
		{
			Desc: "Missing Source",
			Input: &auditpb.CreateAuditEventRequest{
				Agent:           &agent,
				EventType:       &eventType,
				EventTimestamp:  eventTimestamp,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
			Output:   nil,
			HasError: true,
		},
		{
			Desc: "Missing Agent",
			Input: &auditpb.CreateAuditEventRequest{
				Source:          &source,
				EventType:       &eventType,
				EventTimestamp:  eventTimestamp,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
			Output:   nil,
			HasError: true,
		},
		{
			Desc: "Missing Event Type",
			Input: &auditpb.CreateAuditEventRequest{
				Source:          &source,
				Agent:           &agent,
				EventTimestamp:  eventTimestamp,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
			Output:   nil,
			HasError: true,
		},
		{
			Desc: "Missing Event Timestamp",
			Input: &auditpb.CreateAuditEventRequest{
				Source:          &source,
				Agent:           &agent,
				EventType:       &eventType,
				EventDataType:   &eventDataType,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
			Output:   nil,
			HasError: true,
		},
		{
			Desc: "Missing Event Data Type",
			Input: &auditpb.CreateAuditEventRequest{
				Source:          &source,
				Agent:           &agent,
				EventType:       &eventType,
				EventTimestamp:  eventTimestamp,
				EventData:       &structpb.Struct{},
				ContextMetadata: &structpb.Struct{},
			},
			Output:   nil,
			HasError: true,
		},
		{
			Desc:     "nil request",
			Input:    nil,
			Output:   nil,
			HasError: true,
		},
	}

	auditEventMatchFn := testutils.MustMatchProtoFn("id", "created_at")
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			response, err := s.CreateAuditEvent(ctx, tc.Input)
			if tc.HasError != (err != nil) {
				t.Fatal(err)
			}

			if tc.Input != nil {
				auditEventMatchFn(t, response, tc.Output, "did not receive expected output")
			}
		})
	}
}

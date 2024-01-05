package main

import (
	"github.com/*company-data-covered*/services/go/pkg/audit"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	auditsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/audit"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
)

func auditEventToCreateResponse(auditEvent *auditsql.AuditEvent) (*auditpb.CreateAuditEventResponse, error) {
	eventData, err := protoconv.BytesToProtoStruct(auditEvent.EventData.Bytes)
	if err != nil {
		return nil, err
	}

	contextMetadata, err := protoconv.BytesToProtoStruct(auditEvent.ContextMetadata.Bytes)
	if err != nil {
		return nil, err
	}

	return &auditpb.CreateAuditEventResponse{
		Id:              &auditEvent.ID,
		Source:          &auditEvent.Source,
		Agent:           &auditEvent.Agent,
		EventType:       &auditEvent.EventType,
		EventTimestamp:  protoconv.TimeToProtoTimestamp(&auditEvent.EventTimestamp),
		EventDataType:   &auditEvent.EventDataType,
		EventData:       eventData,
		ContextMetadata: contextMetadata,
		CreatedAt:       protoconv.TimeToProtoTimestamp(&auditEvent.CreatedAt),
	}, nil
}

func auditEventFromCreateRequest(pb *auditpb.CreateAuditEventRequest) *audit.EventRecord {
	return &audit.EventRecord{
		Source:          *pb.Source,
		Agent:           *pb.Agent,
		EventType:       *pb.EventType,
		EventTimestamp:  *protoconv.ProtoTimestampToTime(pb.EventTimestamp),
		EventDataType:   *pb.EventDataType,
		EventData:       protoconv.ProtoStructToMap(pb.EventData),
		ContextMetadata: protoconv.ProtoStructToMap(pb.ContextMetadata),
	}
}

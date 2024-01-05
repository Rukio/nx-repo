package main

import (
	"context"
	"fmt"
	"testing"
	"time"

	eventstreaming "github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type mockConsumerMessage struct {
	topic     string
	value     []byte
	timestamp time.Time
}

func (cm mockConsumerMessage) Topic() string {
	return cm.topic
}
func (cm mockConsumerMessage) Value() []byte {
	return cm.value
}
func (cm mockConsumerMessage) Timestamp() time.Time {
	return cm.timestamp
}

func TestProcessMessage(t *testing.T) {
	goodResult := &athenapb.ListChangedLabResultsResult{
		DepartmentId: proto.String("2"),
		EncounterId:  proto.String("4"),
		LabResultId:  proto.String("6"),
		PatientId:    proto.String("8"),
	}
	goodValue, err := proto.Marshal(goodResult)

	if err != nil {
		t.Fatal("failed to Marshal goodResult from ListChangedLabResultsResult")
	}

	missingLabResultResult := &athenapb.ListChangedLabResultsResult{
		PatientId: proto.String("8"),
	}
	missingLabResultValue, err := proto.Marshal(missingLabResultResult)

	if err != nil {
		t.Fatal("failed to Marshal missingLabResultResult from ListChangedLabResultsResult")
	}

	missingPatientResult := &athenapb.ListChangedLabResultsResult{
		LabResultId: proto.String("8"),
	}
	missingPatientValue, err := proto.Marshal(missingPatientResult)

	if err != nil {
		t.Fatal("failed to Marshal missingPatientResult from ListChangedLabResultsResult")
	}

	goodDoc := []*athenapb.LabResultDocument{
		{
			DepartmentId:   proto.String("2"),
			DocumentRoute:  proto.String("INTERFACE"),
			DocumentSource: proto.String("INTERFACE"),
			DocumentTypeId: proto.String("3"),
			EncounterDate: &commonpb.Date{
				Year:  2018,
				Month: 8,
				Day:   30,
			},
			EncounterId:    proto.String("4"),
			FacilityId:     proto.String("5"),
			IsConfidential: proto.Bool(false),
			Id:             proto.String("6"),
			Loinc:          proto.String("7"),
			ObservationDateTime: &commonpb.DateTime{
				Year:    2018,
				Month:   8,
				Day:     30,
				Hours:   11,
				Minutes: 33,
				Seconds: 55,
			},
			Observations: []*athenapb.Analyte{
				{
					ObservationIdentifier: proto.String("55080400"),
					ResultStatus:          proto.String("final"),
					Name:                  proto.String("TSH"),
					Value:                 proto.String("tnp"),
					Units:                 proto.String("%"),
					Description:           proto.String("Description"),
					Loinc:                 proto.String("31234"),
					Note:                  proto.String("note"),
					Id:                    proto.String("1234"),
				},
			},
			ProviderId: proto.String("8"),
			OrderId:    proto.String("9"),
		},
	}
	badDoc := []*athenapb.LabResultDocument{
		{
			DocumentRoute: proto.String("OTHER"),
		},
	}

	tcs := []struct {
		Desc                            string
		Message                         eventstreaming.ConsumerMessage
		AthenaDiscussionNoteResponse    *athenapb.UpdatePatientDiscussionNotesResponse
		AthenaLabResultDocumentResponse *athenapb.GetPatientLabResultDocumentResponse
		AthenaPatientGoalsResponse      *athenapb.GetPatientGoalsResponse
		AthenaDiscussionNoteError       error
		AthenaLabResultDocumentError    error
		AthenaPatientGoalsError         error
		WantError                       bool
		WantResp                        bool
	}{
		{
			Desc: "success - base case",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaDiscussionNoteResponse: &athenapb.UpdatePatientDiscussionNotesResponse{},
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{},
			AthenaLabResultDocumentResponse: &athenapb.GetPatientLabResultDocumentResponse{
				Results: goodDoc,
			},
		},
		{
			Desc: "success - unrelated topic",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     "unrelated",
				timestamp: time.Now(),
			},
		},
		{
			Desc: "success - non-interface doc",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaDiscussionNoteResponse: &athenapb.UpdatePatientDiscussionNotesResponse{},
			AthenaLabResultDocumentResponse: &athenapb.GetPatientLabResultDocumentResponse{
				Results: badDoc,
			},
		},
		{
			Desc: "failure - missing PatientID in value",
			Message: mockConsumerMessage{
				value:     missingPatientValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			WantError: true,
		},
		{
			Desc: "failure - missing LabResultID in value",
			Message: mockConsumerMessage{
				value:     missingLabResultValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			WantError: true,
		},
		{
			Desc: "failure - missing Results in doc",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaLabResultDocumentResponse: &athenapb.GetPatientLabResultDocumentResponse{
				Results: []*athenapb.LabResultDocument{},
			},
			WantError: true,
		},
		{
			Desc: "failure - athena lab result document response error",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaLabResultDocumentError: status.Error(codes.NotFound, "Athena error getting lab result document"),
			WantError:                    true,
		},
		{
			Desc: "failure - athena update discussion notes error",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaDiscussionNoteError:    status.Error(codes.NotFound, "Athena error updating notes"),
			AthenaDiscussionNoteResponse: nil,
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{},
			AthenaPatientGoalsError:      status.Error(codes.NotFound, "Athena error getting goals"),
			AthenaLabResultDocumentResponse: &athenapb.GetPatientLabResultDocumentResponse{
				Results: goodDoc,
			},
			WantError: true,
		},
		{
			Desc: "failure - athena get goal notes error",
			Message: mockConsumerMessage{
				value:     goodValue,
				topic:     changedLabResultsTopicName,
				timestamp: time.Now(),
			},
			AthenaPatientGoalsResponse: nil,
			AthenaPatientGoalsError:    status.Error(codes.NotFound, "Athena error getting goals"),
			AthenaLabResultDocumentResponse: &athenapb.GetPatientLabResultDocumentResponse{
				Results: goodDoc,
			},
			WantError: true,
		},
	}

	for _, tc := range tcs {
		var auditClient auditpb.AuditServiceClient = &MockAuditServiceClient{}
		p := &LabResultProcessor{
			ctx: context.Background(),
			athenaClient: &AthenaClientMock{
				UpdatePatientDiscussionNotesHandler: func(ctx context.Context, in *athenapb.UpdatePatientDiscussionNotesRequest, opts ...grpc.CallOption) (*athenapb.UpdatePatientDiscussionNotesResponse, error) {
					return tc.AthenaDiscussionNoteResponse, tc.AthenaDiscussionNoteError
				},
				GetPatientLabResultDocumentHandler: func(ctx context.Context, in *athenapb.GetPatientLabResultDocumentRequest, opts ...grpc.CallOption) (*athenapb.GetPatientLabResultDocumentResponse, error) {
					return tc.AthenaLabResultDocumentResponse, tc.AthenaLabResultDocumentError
				},
				GetPatientGoalsHandler: func(ctx context.Context, in *athenapb.GetPatientGoalsRequest, opts ...grpc.CallOption) (*athenapb.GetPatientGoalsResponse, error) {
					return tc.AthenaPatientGoalsResponse, tc.AthenaPatientGoalsError
				},
			},
			redisClient: &redisclient.Client{
				Client:      MockRedis{},
				Source:      "test",
				AuditClient: &auditClient,
			},
			logger: zap.NewNop().Sugar(),
		}

		err := p.ProcessMessage(tc.Message)

		var errStr string
		if err != nil {
			errStr = err.Error()
		}

		testutils.MustMatch(t, tc.WantError, err != nil, fmt.Sprintf("%s: %s", tc.Desc, errStr))
	}
}

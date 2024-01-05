package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"testing"
	"time"

	riskstratificationdb "github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	riskstratificationpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/riskstratification"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/testutils"

	"github.com/google/uuid"
	"github.com/jackc/pgtype"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	defaultSurveyVersionID = "5a746af6-85fe-4123-8e75-5b09534e2430"
	defaultQuestionID      = "2e082708-7dc7-4a57-b23c-3a2b19e54866"
	defaultSearchTerm      = "Testicular Pain"
	defaultCareRequestID   = 42
	defaultSymptomAliasID  = "d91a4f32-a64a-4f3b-a4ff-586f453610f4"
	defaultSymptomID       = "86dd28ba-6f7b-4722-937c-d78f55527222"
)

type riskStratificationGRPCServerParams struct {
	mockedDB *mockRiskStratificationDB
}

func setup(params riskStratificationGRPCServerParams) *RiskStratificationGRPCServer {
	return &RiskStratificationGRPCServer{
		RiskStratificationDB: params.mockedDB,
		Logger:               baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}
}

func TestNewGRPCServer(t *testing.T) {
	tcs := []struct {
		name string
		want *RiskStratificationGRPCServer
	}{
		{
			name: "must instantiate a GRPCServer",
			want: &RiskStratificationGRPCServer{},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := &RiskStratificationGRPCServer{}
			testutils.MustMatch(t, tc.want, got, "GRPCServer doesn't match")
		})
	}
}

func TestListTimeSensitiveQuestions(t *testing.T) {
	surveyVersionID := defaultSurveyVersionID
	surveyVersionUUID, err := uuid.Parse(surveyVersionID)
	if err != nil {
		t.Fatal(err)
	}

	questionID := defaultQuestionID
	questionUUID, err := uuid.Parse(questionID)
	if err != nil {
		t.Fatal(err)
	}

	signsJSONB := convertToJSONB(map[string]any{
		"signs": "[\"test 1\", [\"test 2\"]]",
	})
	signsStruct, err := convertJSONBToStruct(signsJSONB)
	if err != nil {
		t.Fatal(err)
	}

	successfulResponse := &riskstratificationpb.ListTimeSensitiveQuestionsResponse{
		Questions: []*riskstratificationpb.TimeSensitiveQuestion{
			{
				Id:              questionUUID.String(),
				SurveyVersionId: surveyVersionUUID.String(),
				Question:        "Test",
				Signs:           signsStruct,
				DisplayOrder:    1,
			},
		},
	}

	tcs := []struct {
		name    string
		context context.Context
		request *riskstratificationpb.ListTimeSensitiveQuestionsRequest
		mockDB  *mockRiskStratificationDB

		want         *riskstratificationpb.ListTimeSensitiveQuestionsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - base case",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String(surveyVersionID)},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionsResult: []*riskstratificationsql.TimeSensitiveQuestion{
					{
						ID:              questionUUID,
						SurveyVersionID: surveyVersionUUID,
						Question:        "Test",
						Signs:           signsJSONB,
						DisplayOrder:    1,
					},
				},
			},

			want:         successfulResponse,
			wantGRPCCode: codes.OK,
		},
		{
			name:    "success - no rows",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String(surveyVersionID)},
			mockDB:  &mockRiskStratificationDB{},

			want:         &riskstratificationpb.ListTimeSensitiveQuestionsResponse{Questions: []*riskstratificationpb.TimeSensitiveQuestion{}},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "success - surveyVersionID is not provided",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String("")},
			mockDB: &mockRiskStratificationDB{
				getLatestTimeSensitiveQuestionsResult: []*riskstratificationsql.TimeSensitiveQuestion{
					{
						ID:              questionUUID,
						SurveyVersionID: surveyVersionUUID,
						Question:        "Test",
						Signs:           signsJSONB,
						DisplayOrder:    1,
					},
				},
			},

			want:         successfulResponse,
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - unable to get time sensitive questions with survey ID present",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String(surveyVersionID)},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionsResult: nil,
				getTimeSensitiveQuestionsError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - unable to get time sensitive questions without survey ID",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String("")},
			mockDB: &mockRiskStratificationDB{
				getLatestTimeSensitiveQuestionsResult: nil,
				getLatestTimeSensitiveQuestionsError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - invalid UUID string",
			context: context.Background(),
			request: &riskstratificationpb.ListTimeSensitiveQuestionsRequest{SurveyVersionId: proto.String("lala")},

			wantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.ListTimeSensitiveQuestions(tc.context, tc.request)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, resp, tc.want)
		})
	}
}

func TestListTimeSensitiveSurveyVersions(t *testing.T) {
	surveyVersionID := defaultSurveyVersionID
	surveyVersionUUID, err := uuid.Parse(surveyVersionID)
	if err != nil {
		t.Fatal(err)
	}

	createdAt := time.Date(2022, 1, 1, 12, 0, 0, 0, time.UTC)

	successfulResponse := &riskstratificationpb.ListTimeSensitiveSurveyVersionsResponse{
		Versions: []*riskstratificationpb.TimeSensitiveSurveyVersion{
			{
				Id:        surveyVersionID,
				CreatedAt: timestamppb.New(createdAt),
			},
		},
	}

	tcs := []struct {
		name    string
		context context.Context
		request *riskstratificationpb.ListTimeSensitiveSurveyVersionsRequest
		mockDB  *mockRiskStratificationDB

		want         *riskstratificationpb.ListTimeSensitiveSurveyVersionsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - base case",
			context: context.Background(),
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveSurveyVersionsResult: []*riskstratificationsql.TimeSensitiveSurveyVersion{
					{
						ID:        surveyVersionUUID,
						CreatedAt: createdAt,
					},
				},
			},

			want:         successfulResponse,
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - unable to get time sensitive survey versions",
			context: context.Background(),
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveSurveyVersionsResult: nil,
				getTimeSensitiveSurveyVersionsError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.ListTimeSensitiveSurveyVersions(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, resp, tc.want)
		})
	}
}

func TestPublishTimeSensitiveAnswerEvent(t *testing.T) {
	surveyVersionID := defaultSurveyVersionID
	surveyVersionUUID, err := uuid.Parse(surveyVersionID)
	if err != nil {
		t.Fatal(err)
	}

	questionID := defaultQuestionID
	questionUUID, err := uuid.Parse(questionID)
	if err != nil {
		t.Fatal(err)
	}

	signsJSONB := convertToJSONB(map[string]any{
		"signs": "[\"test 1\", [\"test 2\"]]",
	})

	tcs := []struct {
		name    string
		context context.Context
		request *riskstratificationpb.PublishTimeSensitiveAnswerEventRequest
		mockDB  *mockRiskStratificationDB

		want         bool
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - escalate",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          true,
				CareRequestId:   1,
			},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},

			want:         true,
			wantGRPCCode: codes.OK,
		},
		{
			name:    "success - do not escalate",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          false,
				CareRequestId:   1,
			},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},

			want:         false,
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - invalid question UUID",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      "invalid",
				SurveyVersionId: surveyVersionID,
				Answer:          false,
				CareRequestId:   1,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - invalid survey UUID",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: "invalid",
				Answer:          false,
				CareRequestId:   1,
			},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - unable to retrieve time sensitive question",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          true,
				CareRequestId:   1,
			},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: nil,
				getTimeSensitiveQuestionError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - unable to find time sensitive question",
			context: context.Background(),
			request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          true,
				CareRequestId:   1,
			},
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: nil,
				getTimeSensitiveQuestionError:  riskstratificationdb.ErrQuestionMissing,
			},

			wantGRPCCode: codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.PublishTimeSensitiveAnswerEvent(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, resp.GetEscalate(), tc.want)
		})
	}
}

func TestUpsertTimeSensitiveScreeningResult(t *testing.T) {
	tcs := []struct {
		name    string
		context context.Context
		request *riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest
		mockDB  *mockRiskStratificationDB

		want         *riskstratificationpb.UpsertTimeSensitiveScreeningResultResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - upsert",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:       1,
				Escalated:           true,
				EscalatedQuestionId: proto.String(defaultQuestionID),
				SurveyVersionId:     defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult: &riskstratificationsql.TimeSensitiveScreening{},
			},

			want:         &riskstratificationpb.UpsertTimeSensitiveScreeningResultResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "success - with secondary screening id",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:        1,
				SecondaryScreeningId: proto.Int64(1),
				Escalated:            true,
				EscalatedQuestionId:  proto.String(defaultQuestionID),
				SurveyVersionId:      defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResultWithSecondaryScreening: nil,
				upsertTimeSensitiveScreeningResultError:                  errors.New("invalid"),
			},

			want:         &riskstratificationpb.UpsertTimeSensitiveScreeningResultResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - unable to save with secondary screening id",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:        1,
				SecondaryScreeningId: proto.Int64(1),
				Escalated:            true,
				EscalatedQuestionId:  proto.String(defaultQuestionID),
				SurveyVersionId:      defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResultWithSecondaryScreening:      nil,
				upsertTimeSensitiveScreeningResultWithSecondaryScreeningError: errors.New("invalid"),
			},

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - invalid escalated question UUID",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:       1,
				Escalated:           true,
				EscalatedQuestionId: proto.String("UUID"),
				SurveyVersionId:     defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult: &riskstratificationsql.TimeSensitiveScreening{},
			},

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - escalated is true but escalated question UUID is not present",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:       1,
				Escalated:           true,
				EscalatedQuestionId: proto.String(""),
				SurveyVersionId:     defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult: &riskstratificationsql.TimeSensitiveScreening{},
			},

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - invalid survey version UUID",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:       1,
				Escalated:           true,
				EscalatedQuestionId: proto.String(defaultQuestionID),
				SurveyVersionId:     "UUID",
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult: &riskstratificationsql.TimeSensitiveScreening{},
			},

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - unable to upsert",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				CareRequestId:       1,
				Escalated:           true,
				EscalatedQuestionId: proto.String(defaultQuestionID),
				SurveyVersionId:     defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult:      nil,
				upsertTimeSensitiveScreeningResultError: errors.New("invalid"),
			},

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - missing care request id",
			context: context.Background(),
			request: &riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest{
				Escalated:           true,
				EscalatedQuestionId: proto.String(defaultQuestionID),
				SurveyVersionId:     defaultSurveyVersionID,
			},
			mockDB: &mockRiskStratificationDB{
				upsertTimeSensitiveScreeningResult: &riskstratificationsql.TimeSensitiveScreening{},
			},

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.UpsertTimeSensitiveScreeningResult(tc.context, tc.request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, resp, tc.want)
		})
	}
}

func Test_PublishTimeSensitiveAnswerEvent(t *testing.T) {
	surveyVersionID := defaultSurveyVersionID
	surveyVersionUUID, err := uuid.Parse(surveyVersionID)
	if err != nil {
		t.Fatal(err)
	}

	questionID := defaultQuestionID
	questionUUID, err := uuid.Parse(questionID)
	if err != nil {
		t.Fatal(err)
	}

	signsJSONB := convertToJSONB(map[string]any{
		"signs": "[\"test 1\", [\"test 2\"]]",
	})

	tcs := []struct {
		Name         string
		Context      context.Context
		Request      *riskstratificationpb.PublishTimeSensitiveAnswerEventRequest
		MockDB       *mockRiskStratificationDB
		Want         bool
		WantGRPCCode codes.Code
	}{
		{
			Name:    "success - escalate",
			Context: context.Background(),
			Request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          true,
				CareRequestId:   1,
			},
			MockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},
			Want:         true,
			WantGRPCCode: codes.OK,
		},
		{
			Name:    "success - do not escalate",
			Context: context.Background(),
			Request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          false,
				CareRequestId:   1,
			},
			MockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},
			Want:         false,
			WantGRPCCode: codes.OK,
		},
		{
			Name:    "failure - invalid question UUID",
			Context: context.Background(),
			Request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      "invalid",
				SurveyVersionId: surveyVersionID,
				Answer:          false,
				CareRequestId:   1,
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name:    "failure - invalid survey UUID",
			Context: context.Background(),
			Request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: "invalid",
				Answer:          false,
				CareRequestId:   1,
			},
			MockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: &riskstratificationsql.TimeSensitiveQuestion{
					ID:              questionUUID,
					SurveyVersionID: surveyVersionUUID,
					Question:        "Test",
					Signs:           signsJSONB,
					DisplayOrder:    1,
				},
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Name:    "failure - unable to retrieve time sensitive question",
			Context: context.Background(),
			Request: &riskstratificationpb.PublishTimeSensitiveAnswerEventRequest{
				QuestionId:      questionID,
				SurveyVersionId: surveyVersionID,
				Answer:          true,
				CareRequestId:   1,
			},
			MockDB: &mockRiskStratificationDB{
				getTimeSensitiveQuestionResult: nil,
				getTimeSensitiveQuestionError:  errors.New("invalid"),
			},
			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.MockDB,
			})

			resp, err := grpcServer.PublishTimeSensitiveAnswerEvent(tc.Context, tc.Request)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.WantGRPCCode)
			testutils.MustMatch(t, resp.GetEscalate(), tc.Want)
		})
	}
}

func convertToJSONB(p any) pgtype.JSONB {
	j, err := json.Marshal(p)
	if err != nil {
		return pgtype.JSONB{Status: pgtype.Null}
	}

	return pgtype.JSONB{Bytes: j, Status: pgtype.Present}
}

func TestGetTimeSensitiveScreeningResult(t *testing.T) {
	escalatedScreeningResult := &riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:       1,
		EscalatedQuestionID: uuid.NullUUID{UUID: uuid.MustParse(defaultQuestionID), Valid: true},
		Escalated:           true,
	}

	nonEscalatedScreeningResult := &riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:       1,
		EscalatedQuestionID: uuid.NullUUID{},
		Escalated:           false,
	}

	timeSensitiveQuestions := []*riskstratificationsql.TimeSensitiveQuestion{
		{
			ID:              uuid.MustParse(defaultQuestionID),
			SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
			Question:        "Test",
			Signs:           pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			DisplayOrder:    1,
		},
	}

	timeSensitiveQuestionsInvalidSigns := []*riskstratificationsql.TimeSensitiveQuestion{
		{
			ID:              uuid.MustParse(defaultQuestionID),
			SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
			Question:        "Test",
			Signs:           pgtype.JSONB{Bytes: []byte(""), Status: pgtype.Present},
			DisplayOrder:    1,
		},
	}

	tcs := []struct {
		name          string
		careRequestID int64
		mockDB        *mockRiskStratificationDB

		wantAnswer   bool
		wantGRPCCode codes.Code
		hasErr       bool
	}{
		{
			name:          "success - escalated screening result",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult:                 escalatedScreeningResult,
				getTimeSensitiveQuestionsFromDisplayOrderResult: timeSensitiveQuestions,
			},

			wantAnswer:   true,
			wantGRPCCode: codes.OK,
		},
		{
			name:          "success - non escalated screening result",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult: nonEscalatedScreeningResult,
				getTimeSensitiveQuestionsResult: timeSensitiveQuestions,
			},

			wantAnswer:   false,
			wantGRPCCode: codes.OK,
		},
		{
			name:          "failure - screening result not found",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult:      nil,
				getTimeSensitiveScreeningResultError: riskstratificationdb.ErrScreeningResultMissing,
			},

			wantGRPCCode: codes.NotFound,
			hasErr:       true,
		},
		{
			name:          "failure - screening result could not be retrieved",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult:      nil,
				getTimeSensitiveScreeningResultError: errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
			hasErr:       true,
		},
		{
			name:          "failure - could not retrieve time sensitive questions by display order",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult:                 escalatedScreeningResult,
				getTimeSensitiveQuestionsFromDisplayOrderResult: nil,
				getTimeSensitiveQuestionsFromDisplayOrderError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
			hasErr:       true,
		},
		{
			name:          "failure - could not retrieve time sensitive questions",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult: nonEscalatedScreeningResult,
				getTimeSensitiveQuestionsResult: nil,
				getTimeSensitiveQuestionsError:  errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
			hasErr:       true,
		},
		{
			name:          "failure - invalid signs from db",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreeningResult:                 escalatedScreeningResult,
				getTimeSensitiveQuestionsFromDisplayOrderResult: timeSensitiveQuestionsInvalidSigns,
			},

			wantGRPCCode: codes.Internal,
			hasErr:       true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.GetTimeSensitiveScreeningResult(
				context.Background(),
				&riskstratificationpb.GetTimeSensitiveScreeningResultRequest{
					CareRequestId: tc.careRequestID,
				},
			)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)

			if tc.hasErr {
				return
			}

			testutils.MustMatch(t, resp.Questions[0].Answer, tc.wantAnswer)
		})
	}
}

func TestGetTimeSensitiveScreenings(t *testing.T) {
	escalatedScreening := &riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:       1,
		EscalatedQuestionID: uuid.NullUUID{UUID: uuid.MustParse(defaultQuestionID), Valid: true},
		Escalated:           true,
	}

	nonEscalatedScreening := &riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:       1,
		EscalatedQuestionID: uuid.NullUUID{},
		Escalated:           false,
	}

	timeSensitiveQuestion := &riskstratificationsql.TimeSensitiveQuestion{
		ID:              uuid.MustParse(defaultQuestionID),
		SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
		Question:        "Test",
		Signs:           pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
		DisplayOrder:    1,
	}

	timeSensitiveQuestionInvalidSigns := &riskstratificationsql.TimeSensitiveQuestion{
		ID:              uuid.MustParse(defaultQuestionID),
		SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
		Question:        "Test",
		Signs:           pgtype.JSONB{Bytes: []byte(""), Status: pgtype.Present},
		DisplayOrder:    1,
	}

	escalatedRow := &riskstratificationsql.GetTimeSensitiveScreeningsRow{
		TimeSensitiveScreening: *escalatedScreening,
		TimeSensitiveQuestion:  *timeSensitiveQuestion,
	}

	nonEscalatedRow := &riskstratificationsql.GetTimeSensitiveScreeningsRow{
		TimeSensitiveScreening: *nonEscalatedScreening,
		TimeSensitiveQuestion:  riskstratificationsql.TimeSensitiveQuestion{},
	}

	rows := []*riskstratificationsql.GetTimeSensitiveScreeningsRow{
		escalatedRow,
		nonEscalatedRow,
	}

	invalidRows := []*riskstratificationsql.GetTimeSensitiveScreeningsRow{
		{
			TimeSensitiveScreening: *escalatedScreening,
			TimeSensitiveQuestion:  *timeSensitiveQuestionInvalidSigns,
		},
		nonEscalatedRow,
	}

	protoQuestion, err := buildProtoTimeSensitiveQuestion(timeSensitiveQuestion)
	if err != nil {
		t.Fatal(err)
	}
	successResponse := &riskstratificationpb.GetTimeSensitiveScreeningsResponse{
		Screenings: []*riskstratificationpb.GetTimeSensitiveScreeningsResponse_Response{
			{
				Screening: buildProtoTimeSensitiveScreening(escalatedScreening),
				Question:  protoQuestion,
			},
			{
				Screening: buildProtoTimeSensitiveScreening(nonEscalatedScreening),
				Question:  &riskstratificationpb.TimeSensitiveQuestion{},
			},
		},
	}

	tcs := []struct {
		name          string
		careRequestID int64
		mockDB        *mockRiskStratificationDB

		wantGRPCCode codes.Code
		want         *riskstratificationpb.GetTimeSensitiveScreeningsResponse
	}{
		{
			name:          "success - escalated screening result",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreenings: rows,
			},

			wantGRPCCode: codes.OK,
			want:         successResponse,
		},
		{
			name:          "success - no screenings",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreenings:      nil,
				getTimeSensitiveScreeningsError: nil,
			},

			wantGRPCCode: codes.OK,
			want: &riskstratificationpb.GetTimeSensitiveScreeningsResponse{
				Screenings: []*riskstratificationpb.GetTimeSensitiveScreeningsResponse_Response{},
			},
		},
		{
			name:          "failure - missing care request id",
			careRequestID: 0,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreenings:      nil,
				getTimeSensitiveScreeningsError: nil,
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:          "failure - screenings could not be retrieved",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreenings:      nil,
				getTimeSensitiveScreeningsError: errors.New("invalid"),
			},

			wantGRPCCode: codes.Internal,
		},
		{
			name:          "failure - invalid question signs",
			careRequestID: 1,
			mockDB: &mockRiskStratificationDB{
				getTimeSensitiveScreenings: invalidRows,
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.GetTimeSensitiveScreenings(
				context.Background(),
				&riskstratificationpb.GetTimeSensitiveScreeningsRequest{
					CareRequestId: tc.careRequestID,
				},
			)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestSearchSymptomAliases(t *testing.T) {
	symptomID := defaultSymptomID
	symptomUUID, err := uuid.Parse(symptomID)
	if err != nil {
		t.Fatal(err)
	}
	tcs := []struct {
		name         string
		context      context.Context
		request      *riskstratificationpb.SearchSymptomAliasesRequest
		mockDB       *mockRiskStratificationDB
		want         *riskstratificationpb.SearchSymptomAliasesResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - matching symptom aliases found",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String("headache"),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(10),
					Page:     proto.Int64(1),
				},
			},
			mockDB: &mockRiskStratificationDB{
				searchSymptomAliasesResult: []*riskstratificationsql.SearchSymptomAliasesRow{
					{
						SymptomID:              symptomUUID,
						Name:                   "headache",
						SymptomName:            "Head Pain",
						LegacyRiskProtocolName: sql.NullString{String: "Legacy Protocol 1"},
					},
					{
						SymptomID:              symptomUUID,
						Name:                   "migraine",
						SymptomName:            "Severe Headache",
						LegacyRiskProtocolName: sql.NullString{String: "Legacy Protocol 2"},
					},
				},
			},
			want: &riskstratificationpb.SearchSymptomAliasesResponse{
				Symptoms: []*riskstratificationpb.SymptomAliasesSearchResult{
					{
						Id:                     "00000000-0000-0000-0000-000000000000",
						SymptomId:              symptomUUID.String(),
						Name:                   "headache",
						SymptomName:            "Head Pain",
						LegacyRiskProtocolName: "Legacy Protocol 1",
					},
					{
						Id:                     "00000000-0000-0000-0000-000000000000",
						SymptomId:              symptomUUID.String(),
						Name:                   "migraine",
						SymptomName:            "Severe Headache",
						LegacyRiskProtocolName: "Legacy Protocol 2",
					},
				},
				Pagination: &riskstratificationpb.Pagination{
					PageSize:    int64(10),
					CurrentPage: 1,
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - database error",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String(defaultSearchTerm),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(10),
					Page:     proto.Int64(1),
				},
			},
			mockDB: &mockRiskStratificationDB{
				searchSymptomAliasesResult: nil,
				searchSymptomAliasesError:  errors.New("database error"),
			},
			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "success - search symptom aliases",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String(defaultSearchTerm),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(10),
					Page:     proto.Int64(1),
				},
			},
			mockDB: &mockRiskStratificationDB{
				searchSymptomAliasesResult: []*riskstratificationsql.SearchSymptomAliasesRow{},
			},
			want: &riskstratificationpb.SearchSymptomAliasesResponse{
				Symptoms: []*riskstratificationpb.SymptomAliasesSearchResult{},
				Pagination: &riskstratificationpb.Pagination{
					PageSize:    int64(10),
					CurrentPage: 1,
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - invalid page size",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String("headache"),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(-10),
					Page:     proto.Int64(1),
				},
			},
			mockDB:       &mockRiskStratificationDB{},
			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - invalid page",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String("headache"),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(10),
					Page:     proto.Int64(0),
				},
			},
			mockDB:       &mockRiskStratificationDB{},
			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - null pagination query",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search:          proto.String("headache"),
				PaginationQuery: nil,
			},
			mockDB:       &mockRiskStratificationDB{},
			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - error counting symptom aliases",
			context: context.Background(),
			request: &riskstratificationpb.SearchSymptomAliasesRequest{
				Search: proto.String("headache"),
				PaginationQuery: &riskstratificationpb.PaginationQuery{
					PageSize: proto.Int64(10),
					Page:     proto.Int64(1),
				},
			},
			mockDB: &mockRiskStratificationDB{
				searchSymptomAliasesResult: []*riskstratificationsql.SearchSymptomAliasesRow{},
				countSymptomAliasesError:   errors.New("error counting symptom aliases"),
			},
			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.SearchSymptomAliases(tc.context, tc.request)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

func TestUpsertCareRequestSymptoms(t *testing.T) {
	tcs := []struct {
		name         string
		context      context.Context
		request      *riskstratificationpb.UpsertCareRequestSymptomsRequest
		mockDB       *mockRiskStratificationDB
		want         *riskstratificationpb.UpsertCareRequestSymptomsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - new care request symptoms",
			context: context.Background(),
			request: &riskstratificationpb.UpsertCareRequestSymptomsRequest{
				CareRequestId:     defaultCareRequestID,
				SymptomAliasesIds: []string{defaultSymptomAliasID, defaultSymptomAliasID},
			},
			mockDB: &mockRiskStratificationDB{
				upsertCareRequestSymptomsResult: &riskstratificationsql.CareRequestSymptom{},
				checkSymptomAliasIDsExistResult: true,
			},
			want:         &riskstratificationpb.UpsertCareRequestSymptomsResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "error - database error during upsert",
			context: context.Background(),
			request: &riskstratificationpb.UpsertCareRequestSymptomsRequest{
				CareRequestId:     defaultCareRequestID,
				SymptomAliasesIds: []string{defaultSymptomAliasID},
			},
			mockDB: &mockRiskStratificationDB{
				upsertCareRequestSymptomsError:  errors.New("database error"),
				checkSymptomAliasIDsExistResult: true,
			},
			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "error - invalid SymptomAliasesId",
			context: context.Background(),
			request: &riskstratificationpb.UpsertCareRequestSymptomsRequest{
				CareRequestId:     defaultCareRequestID,
				SymptomAliasesIds: []string{"invalid_uuid", "another_invalid_uuid"},
			},
			mockDB:       &mockRiskStratificationDB{},
			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "error - database error during aliases existance checking",
			context: context.Background(),
			request: &riskstratificationpb.UpsertCareRequestSymptomsRequest{
				CareRequestId:     defaultCareRequestID,
				SymptomAliasesIds: []string{defaultSymptomAliasID},
			},
			mockDB: &mockRiskStratificationDB{
				checkSymptomAliasIDsExistError:  errors.New("Aliases not found"),
				checkSymptomAliasIDsExistResult: false,
			},
			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "error - aliases not found",
			context: context.Background(),
			request: &riskstratificationpb.UpsertCareRequestSymptomsRequest{
				CareRequestId:     defaultCareRequestID,
				SymptomAliasesIds: []string{defaultSymptomAliasID},
			},
			mockDB: &mockRiskStratificationDB{
				checkSymptomAliasIDsExistResult: false,
			},
			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := setup(riskStratificationGRPCServerParams{
				mockedDB: tc.mockDB,
			})

			resp, err := grpcServer.UpsertCareRequestSymptoms(tc.context, tc.request)

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, reqStatus.Code(), tc.wantGRPCCode)
			testutils.MustMatch(t, tc.want, resp)
		})
	}
}

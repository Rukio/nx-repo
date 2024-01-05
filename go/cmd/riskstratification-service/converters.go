package main

import (
	riskstratificationpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/riskstratification"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"

	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func createTimeSensitiveQuestionsResponse(timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion) (*riskstratificationpb.ListTimeSensitiveQuestionsResponse, error) {
	questions, err := buildProtoTimeSensitiveQuestions(timeSensitiveQuestions)
	if err != nil {
		return nil, err
	}

	return &riskstratificationpb.ListTimeSensitiveQuestionsResponse{
		Questions: questions,
	}, nil
}

func buildProtoTimeSensitiveQuestions(timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion) ([]*riskstratificationpb.TimeSensitiveQuestion, error) {
	questions := make([]*riskstratificationpb.TimeSensitiveQuestion, len(timeSensitiveQuestions))
	for i, tsq := range timeSensitiveQuestions {
		question, err := buildProtoTimeSensitiveQuestion(tsq)
		if err != nil {
			return nil, err
		}
		questions[i] = question
	}

	return questions, nil
}

func buildProtoTimeSensitiveQuestion(tsq *riskstratificationsql.TimeSensitiveQuestion) (*riskstratificationpb.TimeSensitiveQuestion, error) {
	signs, err := convertJSONBToStruct(tsq.Signs)
	if err != nil {
		return nil, err
	}

	return &riskstratificationpb.TimeSensitiveQuestion{
		Id:              tsq.ID.String(),
		SurveyVersionId: tsq.SurveyVersionID.String(),
		Question:        tsq.Question,
		Signs:           signs,
		DisplayOrder:    int32(tsq.DisplayOrder),
	}, nil
}

func convertJSONBToStruct(jsonb pgtype.JSONB) (*structpb.Struct, error) {
	val, err := sqltypes.JSONBToMap(&jsonb)
	if err != nil {
		return nil, err
	}

	return protoconv.MapToProtoStruct(val)
}

func buildProtoTimeSensitiveScreening(s *riskstratificationsql.TimeSensitiveScreening) *riskstratificationpb.TimeSensitiveScreening {
	return &riskstratificationpb.TimeSensitiveScreening{
		CareRequestId:        s.CareRequestID,
		SecondaryScreeningId: s.SecondaryScreeningID.Int64,
		SurveyVersionId:      s.SurveyVersionID.String(),
		EscalatedQuestionId:  proto.String(s.EscalatedQuestionID.UUID.String()),
		Escalated:            s.Escalated,
		CreatedAt:            protoconv.TimeToProtoTimestamp(&s.CreatedAt),
		UpdatedAt:            protoconv.TimeToProtoTimestamp(&s.UpdatedAt),
	}
}

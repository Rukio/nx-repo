package main

import (
	"testing"
	"time"

	riskstratificationpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/riskstratification"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"

	"github.com/google/uuid"
	"github.com/jackc/pgtype"
	"google.golang.org/protobuf/proto"
)

var (
	timeSensitiveQuestions = []*riskstratificationsql.TimeSensitiveQuestion{
		{
			ID:              uuid.MustParse(defaultQuestionID),
			SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
			Question:        "Test",
			Signs:           pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present},
			DisplayOrder:    1,
		},
	}

	timeSensitiveQuestionsInvalidSigns = []*riskstratificationsql.TimeSensitiveQuestion{
		{
			ID:              uuid.MustParse(defaultQuestionID),
			SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
			Question:        "Test",
			Signs:           pgtype.JSONB{Bytes: []byte(""), Status: pgtype.Present},
			DisplayOrder:    1,
		},
	}
)

func Test_buildProtoTimeSensitiveQuestions(t *testing.T) {
	signs, err := convertJSONBToStruct(pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		input       []*riskstratificationsql.TimeSensitiveQuestion
		want        []*riskstratificationpb.TimeSensitiveQuestion

		wantErr        bool
		wantErrMessage string
	}{
		{
			description: "success - with all data",
			input:       timeSensitiveQuestions,
			want: []*riskstratificationpb.TimeSensitiveQuestion{
				{
					Id:              defaultQuestionID,
					SurveyVersionId: defaultSurveyVersionID,
					Question:        "Test",
					Signs:           signs,
					DisplayOrder:    1,
				},
			},
		},
		{
			description: "failure - invalid signs JSON",
			input:       timeSensitiveQuestionsInvalidSigns,

			wantErr:        true,
			wantErrMessage: "failed to convert jsonb to map",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := buildProtoTimeSensitiveQuestions(tc.input)
			if err != nil && !tc.wantErr {
				t.Fatal(err)
			}

			if tc.wantErr {
				testutils.MustMatch(t, tc.wantErrMessage, err.Error(), "errors didn't match")
				return
			}

			testutils.MustMatch(t, tc.want, output, "values didn't match")
		})
	}
}

func Test_createTimeSensitiveQuestionsResponse(t *testing.T) {
	signs, err := convertJSONBToStruct(pgtype.JSONB{Bytes: []byte("{}"), Status: pgtype.Present})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		description string
		input       []*riskstratificationsql.TimeSensitiveQuestion
		want        *riskstratificationpb.ListTimeSensitiveQuestionsResponse

		wantErr        bool
		wantErrMessage string
	}{
		{
			description: "success - with all data",
			input:       timeSensitiveQuestions,
			want: &riskstratificationpb.ListTimeSensitiveQuestionsResponse{
				Questions: []*riskstratificationpb.TimeSensitiveQuestion{
					{
						Id:              defaultQuestionID,
						SurveyVersionId: defaultSurveyVersionID,
						Question:        "Test",
						Signs:           signs,
						DisplayOrder:    1,
					},
				},
			},
		},
		{
			description: "failure - invalid signs JSON",
			input:       timeSensitiveQuestionsInvalidSigns,

			wantErr:        true,
			wantErrMessage: "failed to convert jsonb to map",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := createTimeSensitiveQuestionsResponse(tc.input)
			if err != nil && !tc.wantErr {
				t.Fatal(err)
			}

			if tc.wantErr {
				testutils.MustMatch(t, tc.wantErrMessage, err.Error(), "errors didn't match")
				return
			}

			testutils.MustMatch(t, tc.want, output, "values didn't match")
		})
	}
}

func Test_buildProtoTimeSensitiveScreening(t *testing.T) {
	now := time.Now()

	timeSensitiveScreening := riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:        1,
		SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		EscalatedQuestionID:  uuid.NullUUID{UUID: uuid.MustParse(defaultQuestionID), Valid: true},
		Escalated:            true,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	timeSensitiveScreeningNullSecondaryScreeningID := riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:        1,
		SecondaryScreeningID: sqltypes.ToNullInt64(nil),
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		EscalatedQuestionID:  uuid.NullUUID{UUID: uuid.MustParse(defaultQuestionID), Valid: true},
		Escalated:            true,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	timeSensitiveScreeningNullQuestion := riskstratificationsql.TimeSensitiveScreening{
		CareRequestID:        1,
		SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		EscalatedQuestionID:  uuid.NullUUID{},
		Escalated:            false,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	tcs := []struct {
		description string
		input       *riskstratificationsql.TimeSensitiveScreening

		want *riskstratificationpb.TimeSensitiveScreening
	}{
		{
			description: "success - with all data",
			input:       &timeSensitiveScreening,
			want: &riskstratificationpb.TimeSensitiveScreening{
				CareRequestId:        1,
				SecondaryScreeningId: 1,
				SurveyVersionId:      defaultSurveyVersionID,
				EscalatedQuestionId:  proto.String(defaultQuestionID),
				Escalated:            true,
				CreatedAt:            protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:            protoconv.TimeToProtoTimestamp(&now),
			},
		},
		{
			description: "success - with a null question",
			input:       &timeSensitiveScreeningNullQuestion,
			want: &riskstratificationpb.TimeSensitiveScreening{
				CareRequestId:        1,
				SecondaryScreeningId: 1,
				SurveyVersionId:      defaultSurveyVersionID,
				EscalatedQuestionId:  proto.String(timeSensitiveScreeningNullQuestion.EscalatedQuestionID.UUID.String()),
				Escalated:            false,
				CreatedAt:            protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:            protoconv.TimeToProtoTimestamp(&now),
			},
		},
		{
			description: "success - with null secondary screening id",
			input:       &timeSensitiveScreeningNullSecondaryScreeningID,
			want: &riskstratificationpb.TimeSensitiveScreening{
				CareRequestId:        1,
				SecondaryScreeningId: 0,
				SurveyVersionId:      defaultSurveyVersionID,
				EscalatedQuestionId:  proto.String(defaultQuestionID),
				Escalated:            true,
				CreatedAt:            protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:            protoconv.TimeToProtoTimestamp(&now),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := buildProtoTimeSensitiveScreening(tc.input)

			testutils.MustMatch(t, tc.want, output, "values didn't match")
		})
	}
}

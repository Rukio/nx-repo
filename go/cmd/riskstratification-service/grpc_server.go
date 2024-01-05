package main

import (
	"context"
	"errors"
	"fmt"

	riskstratificationdb "github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"
	riskstratificationpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/riskstratification"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// RiskStratificationDB demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type RiskStratificationDB interface {
	GetTimeSensitiveQuestions(context.Context, uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error)
	GetTimeSensitiveQuestion(context.Context, uuid.UUID) (*riskstratificationsql.TimeSensitiveQuestion, error)
	GetLatestTimeSensitiveQuestions(context.Context) ([]*riskstratificationsql.TimeSensitiveQuestion, error)
	UpsertTimeSensitiveScreeningResult(context.Context, riskstratificationsql.UpsertTimeSensitiveScreeningResultParams) (*riskstratificationsql.TimeSensitiveScreening, error)
	GetTimeSensitiveSurveyVersions(context.Context) ([]*riskstratificationsql.TimeSensitiveSurveyVersion, error)
	GetTimeSensitiveScreeningResult(context.Context, int64) (*riskstratificationsql.TimeSensitiveScreening, error)
	GetTimeSensitiveQuestionsFromDisplayOrder(context.Context, uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error)
	IsHealthy(context.Context) bool
	UpsertTimeSensitiveScreeningResultWithSecondaryScreening(context.Context, riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error)
	GetTimeSensitiveScreenings(context.Context, int64) ([]*riskstratificationsql.GetTimeSensitiveScreeningsRow, error)
	GetTimeSensitiveScreening(context.Context, riskstratificationsql.GetTimeSensitiveScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error)
	SearchSymptomAliases(context.Context, riskstratificationsql.SearchSymptomAliasesParams) ([]*riskstratificationsql.SearchSymptomAliasesRow, error)
	CountSymptomAliases(context.Context, string) (int64, error)
	UpsertCareRequestSymptoms(context.Context, int64, []uuid.UUID) (*riskstratificationsql.CareRequestSymptom, error)
	CheckSymptomAliasIDsExist(ctx context.Context, symptomAliasesIds []uuid.UUID) (bool, error)
}

// a compile-time assertion that our assumed implementation satisfies the above interface.
var _ RiskStratificationDB = (*riskstratificationdb.RiskStratificationDB)(nil)

type RiskStratificationGRPCServer struct {
	riskstratificationpb.UnimplementedRiskStratificationServiceServer
	Logger               *zap.SugaredLogger
	RiskStratificationDB RiskStratificationDB
}

const (
	defaultPageNumber = int64(1)
)

func (s *RiskStratificationGRPCServer) ListTimeSensitiveQuestions(ctx context.Context, r *riskstratificationpb.ListTimeSensitiveQuestionsRequest) (*riskstratificationpb.ListTimeSensitiveQuestionsResponse, error) {
	var (
		surveyVersionUUID      uuid.UUID
		timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion
		err                    error
	)

	if r.GetSurveyVersionId() != "" {
		surveyVersionUUID, err = uuid.Parse(r.GetSurveyVersionId())
		if err != nil {
			s.Logger.Errorf("invalid survey version UUID: %s", err)
			return nil, status.Errorf(codes.InvalidArgument, err.Error())
		}

		timeSensitiveQuestions, err = s.RiskStratificationDB.GetTimeSensitiveQuestions(ctx, surveyVersionUUID)
	} else {
		timeSensitiveQuestions, err = s.RiskStratificationDB.GetLatestTimeSensitiveQuestions(ctx)
	}

	if err != nil {
		s.Logger.Errorf("failed to retrieve Time Sensitive Questions: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return createTimeSensitiveQuestionsResponse(timeSensitiveQuestions)
}

func (s *RiskStratificationGRPCServer) ListTimeSensitiveSurveyVersions(ctx context.Context, r *riskstratificationpb.ListTimeSensitiveSurveyVersionsRequest) (*riskstratificationpb.ListTimeSensitiveSurveyVersionsResponse, error) {
	surveyVersions, err := s.RiskStratificationDB.GetTimeSensitiveSurveyVersions(ctx)
	if err != nil {
		s.Logger.Errorf("failed to retrieve Time Sensitive Survey Versions: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	versions := make([]*riskstratificationpb.TimeSensitiveSurveyVersion, len(surveyVersions))
	for i, v := range surveyVersions {
		versions[i] = &riskstratificationpb.TimeSensitiveSurveyVersion{
			Id:        v.ID.String(),
			CreatedAt: protoconv.TimeToProtoTimestamp(&v.CreatedAt),
		}
	}

	return &riskstratificationpb.ListTimeSensitiveSurveyVersionsResponse{
		Versions: versions,
	}, nil
}

func (s *RiskStratificationGRPCServer) PublishTimeSensitiveAnswerEvent(ctx context.Context, r *riskstratificationpb.PublishTimeSensitiveAnswerEventRequest) (*riskstratificationpb.PublishTimeSensitiveAnswerEventResponse, error) {
	questionUUID, err := uuid.Parse(r.GetQuestionId())
	if err != nil {
		s.Logger.Errorf("invalid time sensitive question UUID: %s", err)
		return nil, status.Errorf(codes.InvalidArgument, err.Error())
	}

	question, err := s.RiskStratificationDB.GetTimeSensitiveQuestion(ctx, questionUUID)
	if err != nil {
		if errors.Is(err, riskstratificationdb.ErrQuestionMissing) {
			return nil, status.Errorf(codes.NotFound, err.Error())
		}

		s.Logger.Errorf("failed to retrieve Time Sensitive Question: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	if question.SurveyVersionID.String() != r.GetSurveyVersionId() {
		errorMessage := fmt.Sprintf("invalid time sensitive survey UUID: %s", r.GetSurveyVersionId())
		s.Logger.Errorf(errorMessage)
		return nil, status.Errorf(codes.InvalidArgument, errorMessage)
	}

	return &riskstratificationpb.PublishTimeSensitiveAnswerEventResponse{
		Escalate: r.GetAnswer(),
	}, nil
}

func (s *RiskStratificationGRPCServer) GetTimeSensitiveScreeningResult(ctx context.Context, r *riskstratificationpb.GetTimeSensitiveScreeningResultRequest) (*riskstratificationpb.GetTimeSensitiveScreeningResultResponse, error) {
	screeningResult, err := s.RiskStratificationDB.GetTimeSensitiveScreeningResult(ctx, r.GetCareRequestId())
	if err != nil {
		if errors.Is(err, riskstratificationdb.ErrScreeningResultMissing) {
			return nil, status.Errorf(codes.NotFound, err.Error())
		}

		s.Logger.Errorf("failed to retrieve Time Sensitive Screening Result: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	escalatedQuestionUUID := screeningResult.EscalatedQuestionID.UUID
	var timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion
	if escalatedQuestionUUID == uuid.Nil {
		timeSensitiveQuestions, err = s.RiskStratificationDB.GetTimeSensitiveQuestions(ctx, screeningResult.SurveyVersionID)
	} else {
		timeSensitiveQuestions, err = s.RiskStratificationDB.GetTimeSensitiveQuestionsFromDisplayOrder(ctx, escalatedQuestionUUID)
	}

	if err != nil {
		s.Logger.Errorf("failed to retrieve Time Sensitive Questions: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	resultQuestions := make([]*riskstratificationpb.TimeSensitiveScreeningResultQuestion, len(timeSensitiveQuestions))
	for i, tsq := range timeSensitiveQuestions {
		question, err := buildProtoTimeSensitiveQuestion(tsq)
		if err != nil {
			return nil, status.Errorf(codes.Internal, err.Error())
		}

		answer := false
		if tsq.ID == screeningResult.EscalatedQuestionID.UUID {
			answer = true
		}
		resultQuestion := &riskstratificationpb.TimeSensitiveScreeningResultQuestion{
			Question: question,
			Answer:   answer,
		}

		resultQuestions[i] = resultQuestion
	}

	return &riskstratificationpb.GetTimeSensitiveScreeningResultResponse{
		Questions: resultQuestions,
	}, nil
}

func (s *RiskStratificationGRPCServer) GetTimeSensitiveScreenings(ctx context.Context, r *riskstratificationpb.GetTimeSensitiveScreeningsRequest) (*riskstratificationpb.GetTimeSensitiveScreeningsResponse, error) {
	if r.CareRequestId <= 0 {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("invalid care_request_id %d", r.CareRequestId))
	}

	screenings, err := s.RiskStratificationDB.GetTimeSensitiveScreenings(ctx, r.GetCareRequestId())
	if err != nil {
		s.Logger.Errorf("failed to retrieve Time Sensitive Screenings: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	response := make([]*riskstratificationpb.GetTimeSensitiveScreeningsResponse_Response, len(screenings))
	for i, row := range screenings {
		screening := buildProtoTimeSensitiveScreening(&row.TimeSensitiveScreening)

		question := &riskstratificationpb.TimeSensitiveQuestion{}
		if row.TimeSensitiveScreening.EscalatedQuestionID.UUID != uuid.Nil {
			question, err = buildProtoTimeSensitiveQuestion(&row.TimeSensitiveQuestion)
			if err != nil {
				return nil, status.Errorf(codes.Internal, err.Error())
			}
		}

		response[i] = &riskstratificationpb.GetTimeSensitiveScreeningsResponse_Response{
			Screening: screening,
			Question:  question,
		}
	}

	return &riskstratificationpb.GetTimeSensitiveScreeningsResponse{
		Screenings: response,
	}, nil
}

type upsertScreeningUUIDParams struct {
	EscalatedQuestionUUID uuid.NullUUID
	SurveyVersionUUID     uuid.UUID
}

func (s *RiskStratificationGRPCServer) UpsertTimeSensitiveScreeningResult(ctx context.Context, r *riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest) (*riskstratificationpb.UpsertTimeSensitiveScreeningResultResponse, error) {
	uuidParams, err := validateUpsertScreeningParams(r)
	if err != nil {
		s.Logger.Errorf("invalid params: %s", err)
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	if r.GetSecondaryScreeningId() > 0 {
		params := riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
			CareRequestID:        r.GetCareRequestId(),
			SecondaryScreeningID: sqltypes.ToValidNullInt64(r.GetSecondaryScreeningId()),
			Escalated:            r.GetEscalated(),
			EscalatedQuestionID:  uuidParams.EscalatedQuestionUUID,
			SurveyVersionID:      uuidParams.SurveyVersionUUID,
		}

		_, err = s.RiskStratificationDB.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, params)
	} else {
		params := riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
			CareRequestID:       r.GetCareRequestId(),
			Escalated:           r.GetEscalated(),
			EscalatedQuestionID: uuidParams.EscalatedQuestionUUID,
			SurveyVersionID:     uuidParams.SurveyVersionUUID,
		}

		_, err = s.RiskStratificationDB.UpsertTimeSensitiveScreeningResult(ctx, params)
	}

	if err != nil {
		s.Logger.Errorf("could not upsert Time Sensitive Screening Result: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &riskstratificationpb.UpsertTimeSensitiveScreeningResultResponse{}, nil
}

func validateUpsertScreeningParams(r *riskstratificationpb.UpsertTimeSensitiveScreeningResultRequest) (*upsertScreeningUUIDParams, error) {
	if r.GetCareRequestId() <= 0 {
		return nil, fmt.Errorf("invalid care_request_id %d", r.GetCareRequestId())
	}

	escalatedQuestionID := r.GetEscalatedQuestionId()

	// The Escalated Question can be null, so we use the uuid.NullUUID struct to represent it.
	escalatedQuestionUUID := uuid.NullUUID{}
	if escalatedQuestionID != "" {
		parsedUUID, err := uuid.Parse(escalatedQuestionID)
		if err != nil {
			return nil, err
		}
		escalatedQuestionUUID = uuid.NullUUID{UUID: parsedUUID, Valid: true}
	}

	if r.GetEscalated() && !escalatedQuestionUUID.Valid {
		errorMessage := fmt.Sprintf("escalated secondary screening missing escalated question id for care request: %d", r.GetCareRequestId())
		return nil, errors.New(errorMessage)
	}

	surveyVersionUUID, err := uuid.Parse(r.GetSurveyVersionId())
	if err != nil {
		return nil, err
	}

	return &upsertScreeningUUIDParams{EscalatedQuestionUUID: escalatedQuestionUUID, SurveyVersionUUID: surveyVersionUUID}, nil
}

func (s *RiskStratificationGRPCServer) SearchSymptomAliases(ctx context.Context, r *riskstratificationpb.SearchSymptomAliasesRequest) (*riskstratificationpb.SearchSymptomAliasesResponse, error) {
	if r.PaginationQuery == nil {
		s.Logger.Error("Pagination must be specified")
		return nil, status.Errorf(codes.InvalidArgument, "Pagination must be specified")
	}
	pageSize := *r.PaginationQuery.PageSize
	if pageSize <= 0 {
		return nil, status.Error(codes.InvalidArgument, "Page size must be greater than zero")
	}

	pageNumber := defaultPageNumber
	if r.PaginationQuery.Page != nil {
		if r.PaginationQuery.GetPage() < 1 {
			return nil, status.Error(codes.InvalidArgument, "page number must be greater than 0")
		}
		pageNumber = r.PaginationQuery.GetPage()
	}

	pageOffset := (pageNumber - 1) * pageSize
	params := riskstratificationsql.SearchSymptomAliasesParams{
		SearchTerm: *r.Search,
		PageOffset: pageOffset,
		PageSize:   pageSize,
	}

	symptoms, err := s.RiskStratificationDB.SearchSymptomAliases(ctx, params)
	if err != nil {
		s.Logger.Error("Error searching symptom aliases: ", zap.Error(err))
		return nil, status.Errorf(codes.Internal, "an error occurred while searching symptom aliases: %s", err.Error())
	}

	resultSymptomAliases := make([]*riskstratificationpb.SymptomAliasesSearchResult, len(symptoms))
	for i, symptom := range symptoms {
		resultSymptomAliases[i] = &riskstratificationpb.SymptomAliasesSearchResult{
			Id:                     symptom.ID.String(),
			SymptomId:              symptom.SymptomID.String(),
			SymptomName:            symptom.SymptomName,
			Name:                   symptom.Name,
			LegacyRiskProtocolName: symptom.LegacyRiskProtocolName.String,
		}
	}

	totalResults, err := s.RiskStratificationDB.CountSymptomAliases(ctx, *r.Search)
	if err != nil {
		s.Logger.Error("Error counting symptom aliases: ", zap.Error(err))
		return nil, status.Errorf(codes.Internal, "an error occurred while counting symptom aliases: %s", err.Error())
	}

	totalPages := totalResults / pageSize
	if totalResults%pageSize > 0 {
		totalPages++
	}

	pagination := &riskstratificationpb.Pagination{
		PageSize:     pageSize,
		TotalResults: totalResults,
		TotalPages:   totalPages,
		CurrentPage:  *r.PaginationQuery.Page,
	}

	return &riskstratificationpb.SearchSymptomAliasesResponse{
		Symptoms:   resultSymptomAliases,
		Pagination: pagination,
	}, nil
}

func (s *RiskStratificationGRPCServer) UpsertCareRequestSymptoms(
	ctx context.Context,
	r *riskstratificationpb.UpsertCareRequestSymptomsRequest,
) (*riskstratificationpb.UpsertCareRequestSymptomsResponse, error) {
	uuidSymptomAliasesIds, err := parseSymptomAliasesIds(r.SymptomAliasesIds)
	if err != nil {
		s.Logger.Errorf("could not parse parseSymptomAliasesIds: %s", err)
		return nil, status.Errorf(codes.InvalidArgument, err.Error())
	}

	aliasesExist, err := s.RiskStratificationDB.CheckSymptomAliasIDsExist(ctx, uuidSymptomAliasesIds)
	if err != nil {
		s.Logger.Errorf("error checking symptom alias IDs existence: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	if !aliasesExist {
		s.Logger.Errorf("one or more symptom alias IDs do not exist")
		return nil, status.Errorf(codes.InvalidArgument, "one or more symptom alias IDs do not exist")
	}

	if _, err = s.RiskStratificationDB.UpsertCareRequestSymptoms(ctx, r.CareRequestId, uuidSymptomAliasesIds); err != nil {
		s.Logger.Errorf("error upserting care request symptoms: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &riskstratificationpb.UpsertCareRequestSymptomsResponse{}, nil
}

func parseSymptomAliasesIds(ids []string) ([]uuid.UUID, error) {
	uuidSymptomAliasesIds := make([]uuid.UUID, len(ids))
	for i, idStr := range ids {
		id, err := uuid.Parse(idStr)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, err.Error())
		}
		uuidSymptomAliasesIds[i] = id
	}
	return uuidSymptomAliasesIds, nil
}

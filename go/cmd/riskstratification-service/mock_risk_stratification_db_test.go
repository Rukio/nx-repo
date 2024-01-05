package main

import (
	"context"

	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"

	"github.com/google/uuid"
)

type mockRiskStratificationDB struct {
	isHealthyResult                                               bool
	getTimeSensitiveQuestionsResult                               []*riskstratificationsql.TimeSensitiveQuestion
	getTimeSensitiveQuestionsError                                error
	getTimeSensitiveQuestionResult                                *riskstratificationsql.TimeSensitiveQuestion
	getTimeSensitiveQuestionError                                 error
	getLatestTimeSensitiveQuestionsResult                         []*riskstratificationsql.TimeSensitiveQuestion
	getLatestTimeSensitiveQuestionsError                          error
	upsertTimeSensitiveScreeningResult                            *riskstratificationsql.TimeSensitiveScreening
	upsertTimeSensitiveScreeningResultError                       error
	getTimeSensitiveSurveyVersionsResult                          []*riskstratificationsql.TimeSensitiveSurveyVersion
	getTimeSensitiveSurveyVersionsError                           error
	getTimeSensitiveScreeningResult                               *riskstratificationsql.TimeSensitiveScreening
	getTimeSensitiveScreeningResultError                          error
	getTimeSensitiveQuestionsFromDisplayOrderResult               []*riskstratificationsql.TimeSensitiveQuestion
	getTimeSensitiveQuestionsFromDisplayOrderError                error
	upsertTimeSensitiveScreeningResultWithSecondaryScreening      *riskstratificationsql.TimeSensitiveScreening
	upsertTimeSensitiveScreeningResultWithSecondaryScreeningError error
	getTimeSensitiveScreenings                                    []*riskstratificationsql.GetTimeSensitiveScreeningsRow
	getTimeSensitiveScreeningsError                               error
	getTimeSensitiveScreening                                     *riskstratificationsql.TimeSensitiveScreening
	getTimeSensitiveScreeningError                                error
	searchSymptomAliasesResult                                    []*riskstratificationsql.SearchSymptomAliasesRow
	searchSymptomAliasesError                                     error
	countSymptomAliasesResult                                     int64
	countSymptomAliasesError                                      error
	upsertCareRequestSymptomsResult                               *riskstratificationsql.CareRequestSymptom
	upsertCareRequestSymptomsError                                error
	checkSymptomAliasIDsExistResult                               bool
	checkSymptomAliasIDsExistError                                error
}

func (m *mockRiskStratificationDB) IsHealthy(_ context.Context) bool {
	return m.isHealthyResult
}

func (m *mockRiskStratificationDB) GetTimeSensitiveQuestions(ctx context.Context, surveyVersionID uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	return m.getTimeSensitiveQuestionsResult, m.getTimeSensitiveQuestionsError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveQuestion(ctx context.Context, questionID uuid.UUID) (*riskstratificationsql.TimeSensitiveQuestion, error) {
	return m.getTimeSensitiveQuestionResult, m.getTimeSensitiveQuestionError
}

func (m *mockRiskStratificationDB) GetLatestTimeSensitiveQuestions(ctx context.Context) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	return m.getLatestTimeSensitiveQuestionsResult, m.getLatestTimeSensitiveQuestionsError
}

func (m *mockRiskStratificationDB) UpsertTimeSensitiveScreeningResult(ctx context.Context, args riskstratificationsql.UpsertTimeSensitiveScreeningResultParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return m.upsertTimeSensitiveScreeningResult, m.upsertTimeSensitiveScreeningResultError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveSurveyVersions(ctx context.Context) ([]*riskstratificationsql.TimeSensitiveSurveyVersion, error) {
	return m.getTimeSensitiveSurveyVersionsResult, m.getTimeSensitiveSurveyVersionsError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveScreeningResult(context.Context, int64) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return m.getTimeSensitiveScreeningResult, m.getTimeSensitiveScreeningResultError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveQuestionsFromDisplayOrder(context.Context, uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	return m.getTimeSensitiveQuestionsFromDisplayOrderResult, m.getTimeSensitiveQuestionsFromDisplayOrderError
}

func (m *mockRiskStratificationDB) UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx context.Context, args riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return m.upsertTimeSensitiveScreeningResultWithSecondaryScreening, m.upsertTimeSensitiveScreeningResultWithSecondaryScreeningError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveScreenings(ctx context.Context, careRequestID int64) ([]*riskstratificationsql.GetTimeSensitiveScreeningsRow, error) {
	return m.getTimeSensitiveScreenings, m.getTimeSensitiveScreeningsError
}

func (m *mockRiskStratificationDB) GetTimeSensitiveScreening(ctx context.Context, args riskstratificationsql.GetTimeSensitiveScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return m.getTimeSensitiveScreening, m.getTimeSensitiveScreeningError
}

func (m *mockRiskStratificationDB) SearchSymptomAliases(ctx context.Context, args riskstratificationsql.SearchSymptomAliasesParams) ([]*riskstratificationsql.SearchSymptomAliasesRow, error) {
	return m.searchSymptomAliasesResult, m.searchSymptomAliasesError
}

func (m *mockRiskStratificationDB) CountSymptomAliases(context.Context, string) (int64, error) {
	return m.countSymptomAliasesResult, m.countSymptomAliasesError
}

func (m *mockRiskStratificationDB) UpsertCareRequestSymptoms(ctx context.Context, careRequestID int64, uuidSymptomAliasesIds []uuid.UUID) (*riskstratificationsql.CareRequestSymptom, error) {
	return m.upsertCareRequestSymptomsResult, m.upsertCareRequestSymptomsError
}

func (m *mockRiskStratificationDB) CheckSymptomAliasIDsExist(ctx context.Context, symptomAliasesIds []uuid.UUID) (bool, error) {
	return m.checkSymptomAliasIDsExistResult, m.checkSymptomAliasIDsExistError
}

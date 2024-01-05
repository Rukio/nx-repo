package riskstratificationdb

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4"
)

type RiskStratificationDB struct {
	db              basedb.DBTX
	scope           monitoring.Scope
	queries         *riskstratificationsql.Queries
	datadogRecorder *monitoring.DataDogRecorder
}

var (
	ErrScreeningResultMissing = errors.New("time sensitive screening result not found for care_request_id")
	ErrScreeningMissing       = errors.New("time sensitive screening not found for provided care_request_id and secondary_screening_id")
	ErrQuestionMissing        = errors.New("time sensitive question not found")
	ErrSymptomMissing         = errors.New("symptom not found")
)

func NewRiskStratificationDB(db basedb.DBTX, scope monitoring.Scope, ddr *monitoring.DataDogRecorder) *RiskStratificationDB {
	if scope == nil {
		scope = &monitoring.NoopScope{}
	}
	mdb := monitoring.NewDB(db, scope)
	return &RiskStratificationDB{
		db:              db,
		scope:           scope,
		queries:         riskstratificationsql.New(mdb),
		datadogRecorder: ddr,
	}
}

func (db *RiskStratificationDB) IsHealthy(ctx context.Context) bool {
	return db.db.Ping(ctx) == nil
}

func (db *RiskStratificationDB) GetTimeSensitiveQuestions(ctx context.Context, surveyVersionID uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	return db.queries.GetTimeSensitiveQuestions(ctx, surveyVersionID)
}

func (db *RiskStratificationDB) GetLatestTimeSensitiveQuestions(ctx context.Context) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	timeSensitiveQuestions, err := db.queries.GetLatestTimeSensitiveQuestions(ctx)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}

	return timeSensitiveQuestions, err
}

func (db *RiskStratificationDB) UpsertTimeSensitiveScreeningResult(ctx context.Context, args riskstratificationsql.UpsertTimeSensitiveScreeningResultParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return db.queries.UpsertTimeSensitiveScreeningResult(ctx, args)
}

func (db *RiskStratificationDB) GetTimeSensitiveSurveyVersions(ctx context.Context) ([]*riskstratificationsql.TimeSensitiveSurveyVersion, error) {
	return db.queries.GetTimeSensitiveSurveyVersions(ctx)
}

func (db *RiskStratificationDB) GetTimeSensitiveQuestion(ctx context.Context, questionID uuid.UUID) (*riskstratificationsql.TimeSensitiveQuestion, error) {
	question, err := db.queries.GetTimeSensitiveQuestion(ctx, questionID)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrQuestionMissing
	}

	return question, err
}

func (db *RiskStratificationDB) GetTimeSensitiveScreeningResult(ctx context.Context, careRequestID int64) (*riskstratificationsql.TimeSensitiveScreening, error) {
	result, err := db.queries.GetTimeSensitiveScreeningResult(ctx, careRequestID)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrScreeningResultMissing
	}

	return result, err
}

func (db *RiskStratificationDB) GetTimeSensitiveQuestionsFromDisplayOrder(ctx context.Context, escalatedQuestionUUID uuid.UUID) ([]*riskstratificationsql.TimeSensitiveQuestion, error) {
	return db.queries.GetTimeSensitiveQuestionsFromDisplayOrder(ctx, escalatedQuestionUUID)
}

func (db *RiskStratificationDB) UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx context.Context, args riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	return db.queries.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, args)
}

func (db *RiskStratificationDB) GetTimeSensitiveScreenings(ctx context.Context, careRequestID int64) ([]*riskstratificationsql.GetTimeSensitiveScreeningsRow, error) {
	return db.queries.GetTimeSensitiveScreenings(ctx, careRequestID)
}

func (db *RiskStratificationDB) GetTimeSensitiveScreening(ctx context.Context, args riskstratificationsql.GetTimeSensitiveScreeningParams) (*riskstratificationsql.TimeSensitiveScreening, error) {
	screening, err := db.queries.GetTimeSensitiveScreening(ctx, args)
	if err != nil && errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrScreeningMissing
	}

	return screening, err
}

func (db *RiskStratificationDB) SearchSymptomAliases(ctx context.Context, args riskstratificationsql.SearchSymptomAliasesParams) ([]*riskstratificationsql.SearchSymptomAliasesRow, error) {
	return db.queries.SearchSymptomAliases(ctx, args)
}

func (db *RiskStratificationDB) CountSymptomAliases(ctx context.Context, searchTerm string) (int64, error) {
	return db.queries.CountSymptomAliases(ctx, searchTerm)
}

func (db *RiskStratificationDB) UpsertCareRequestSymptoms(ctx context.Context, careRequestID int64, uuidSymptomAliasesIds []uuid.UUID) (*riskstratificationsql.CareRequestSymptom, error) {
	symptomData, err := db.queries.GenerateSymptomData(ctx, uuidSymptomAliasesIds)
	if err != nil {
		return nil, err
	}

	args := riskstratificationsql.UpsertCareRequestSymptomsParams{
		CareRequestID: careRequestID,
		SymptomData:   symptomData,
	}
	return db.queries.UpsertCareRequestSymptoms(ctx, args)
}

func (db *RiskStratificationDB) CheckSymptomAliasIDsExist(ctx context.Context, symptomAliasesIds []uuid.UUID) (bool, error) {
	return db.queries.CheckSymptomAliasIDsExist(ctx, symptomAliasesIds)
}

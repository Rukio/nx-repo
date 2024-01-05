//go:build db_test

package riskstratificationdb_test

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/cmd/riskstratification-service/riskstratificationdb"
	"github.com/*company-data-covered*/services/go/pkg/basedb"
	riskstratificationsql "github.com/*company-data-covered*/services/go/pkg/generated/sql/riskstratification"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v4/pgxpool"
)

var (
	testDBName             = "riskstratification"
	defaultSurveyVersionID = "5a746af6-85fe-4123-8e75-5b09534e2430"
	defaultQuestionID      = "2e082708-7dc7-4a57-b23c-3a2b19e54866"
)

func setupDBTest(t testutils.GetDBConnPooler) (context.Context, *pgxpool.Pool, *riskstratificationsql.Queries, func()) {
	db := testutils.GetDBConnPool(t, testDBName)
	return context.Background(), db, riskstratificationsql.New(db), func() {
		db.Close()
	}
}

func TestIsHealthy(t *testing.T) {
	ctx, _, _, done := setupDBTest(t)
	defer done()

	tcs := []struct {
		Name           string
		DB             *basedb.MockPingDBTX
		ExpectedOutput bool
	}{
		{
			Name:           "DB is healthy",
			DB:             &basedb.MockPingDBTX{},
			ExpectedOutput: true,
		},
		{
			Name:           "DB is unhealthy",
			DB:             &basedb.MockPingDBTX{PingErr: errors.New("boo")},
			ExpectedOutput: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			riskstratificationdb := riskstratificationdb.NewRiskStratificationDB(tc.DB, nil, nil)
			isHealthy := riskstratificationdb.IsHealthy(ctx)

			if isHealthy != tc.ExpectedOutput {
				testutils.MustMatch(t, tc.ExpectedOutput, isHealthy, "IsHealthy test failed")
			}
		})
	}
}

func TestRDB_GetTimeSensitiveQuestions(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	tcs := []struct {
		Name            string
		SurveyVersionID uuid.UUID
		Want            int
	}{
		{
			Name:            "retrieves all questions",
			SurveyVersionID: surveyVersionID(t),
			Want:            8,
		},
		{
			Name:            "retrieves zero questions",
			SurveyVersionID: uuid.New(),
			Want:            0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

			timeSensitiveQuestions, err := rdb.GetTimeSensitiveQuestions(ctx, tc.SurveyVersionID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.Want, len(timeSensitiveQuestions), "incorrect number of time sensitive questions")
		})
	}
}

func TestRDB_GetLatestTimeSensitiveQuestions(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	timeSensitiveQuestions, err := rdb.GetLatestTimeSensitiveQuestions(ctx)
	if err != nil {
		t.Fatal(err)
	}

	for _, question := range timeSensitiveQuestions {
		testutils.MustMatch(t, surveyVersionID(t), question.SurveyVersionID, "invalid survey version id")
	}
}

func TestRDB_GetLatestTimeSensitiveQuestions_NoQuestions(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	var (
		err                    error
		timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion
	)

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	_, err = queries.AddSurveyVersion(ctx)
	if err != nil {
		t.Fatal(err)
	}

	timeSensitiveQuestions, err = rdb.GetLatestTimeSensitiveQuestions(ctx)
	if err != nil {
		t.Fatal(err)
	}

	t.Log(timeSensitiveQuestions)

	testutils.MustMatch(t, []*riskstratificationsql.TimeSensitiveQuestion(nil), timeSensitiveQuestions, "returned time sensitive questions should be nil")
	testutils.MustMatch(t, nil, err, "err should be nil")
}

func TestRDB_UpsertTimeSensitiveScreeningResult(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	var (
		err                    error
		timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion
	)

	timeSensitiveQuestions, err = queries.GetTimeSensitiveQuestions(ctx, surveyVersionID(t))
	if err != nil {
		t.Fatal(err)
	}
	_, err = rdb.UpsertTimeSensitiveScreeningResult(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
		CareRequestID:       1,
		Escalated:           true,
		EscalatedQuestionID: uuid.NullUUID{UUID: timeSensitiveQuestions[0].ID, Valid: true},
		SurveyVersionID:     uuid.MustParse(defaultSurveyVersionID),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Name   string
		Params riskstratificationsql.UpsertTimeSensitiveScreeningResultParams
	}{
		{
			Name: "Existing screening result",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
				CareRequestID:       1,
				Escalated:           false,
				EscalatedQuestionID: uuid.NullUUID{UUID: timeSensitiveQuestions[1].ID, Valid: true},
				SurveyVersionID:     uuid.MustParse(defaultSurveyVersionID),
			},
		},
		{
			Name: "New screening result",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
				CareRequestID:       2,
				Escalated:           true,
				EscalatedQuestionID: uuid.NullUUID{UUID: timeSensitiveQuestions[0].ID, Valid: true},
				SurveyVersionID:     uuid.MustParse(defaultSurveyVersionID),
			},
		},
		{
			Name: "Escalated question id is optional",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
				CareRequestID:   2,
				Escalated:       true,
				SurveyVersionID: uuid.MustParse(defaultSurveyVersionID),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			result, err := rdb.UpsertTimeSensitiveScreeningResult(ctx, tc.Params)

			if err != nil {
				t.Fatal(err)
			}

			if result == nil {
				t.Fatal("Screening result is nil")
			}
		})
	}
}

func TestRDB_GetTimeSensitiveSurveyVersions(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	surveyVersions, err := rdb.GetTimeSensitiveSurveyVersions(ctx)
	if err != nil {
		t.Fatal(err)
	}

	version := surveyVersions[len(surveyVersions)-1]
	testutils.MustMatch(t, surveyVersionID(t), version.ID, "invalid survey version id")
}

func TestRDB_GetTimeSensitiveQuestion(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	questionID, err := uuid.Parse(defaultQuestionID)
	if err != nil {
		t.Fatal(err)
	}

	invalidQuestionID, err := uuid.Parse("ff082708-7dc7-4a57-b23c-3a2b19e54866")
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name       string
		questionID uuid.UUID

		wantErr bool
	}{
		{
			name:       "question id exists",
			questionID: questionID,
		},
		{
			name:       "question id does not exist",
			questionID: invalidQuestionID,

			wantErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			question, err := rdb.GetTimeSensitiveQuestion(ctx, tc.questionID)

			if (err != nil) != tc.wantErr {
				testutils.MustMatch(t, riskstratificationdb.ErrQuestionMissing, err.Error())
			}

			if tc.wantErr {
				return
			}

			testutils.MustMatch(t, true, question != nil)
			testutils.MustMatch(t, defaultQuestionID, question.ID.String(), "invalid question id")
			testutils.MustMatch(t, defaultSurveyVersionID, question.SurveyVersionID.String(), "invalid survey version id")
		})
	}
}

func surveyVersionID(t *testing.T) uuid.UUID {
	surveyVersionID, err := uuid.Parse(defaultSurveyVersionID)
	if err != nil {
		t.Fatal(err)
	}

	return surveyVersionID
}

func TestRDB_GetTimeSensitiveScreeningResult(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	questionUUID, err := uuid.Parse(defaultQuestionID)
	if err != nil {
		t.Fatal(err)
	}

	_, err = rdb.UpsertTimeSensitiveScreeningResult(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultParams{
		CareRequestID:       12345,
		Escalated:           true,
		EscalatedQuestionID: uuid.NullUUID{UUID: questionUUID, Valid: true},
		SurveyVersionID:     uuid.MustParse(defaultSurveyVersionID),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name          string
		careRequestID int64

		wantErr bool
	}{
		{
			name:          "care request id exists",
			careRequestID: 12345,
		},
		{
			name:          "care request id does not exist",
			careRequestID: 0,

			wantErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			result, err := rdb.GetTimeSensitiveScreeningResult(ctx, tc.careRequestID)

			if (err != nil) != tc.wantErr {
				testutils.MustMatch(t, riskstratificationdb.ErrScreeningResultMissing, err.Error())
			}

			if tc.wantErr {
				return
			}

			testutils.MustMatch(t, result != nil, true)
		})
	}
}

func TestRDB_GetTimeSensitiveQuestionsFromDisplayOrder(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()
	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	tcs := []struct {
		name                string
		escalatedQuestionID string

		wantQuestionsLength int
	}{
		{
			name:                "escalated question does not exist",
			escalatedQuestionID: "11e6b3d8-f2bb-4db5-a3ea-9a38f09d0000",
		},
		{
			name:                "fourth escalated question",
			escalatedQuestionID: "11e6b3d8-f2bb-4db5-a3ea-9a38f09d7174",

			wantQuestionsLength: 4,
		},
		{
			name:                "first escalated question",
			escalatedQuestionID: "2e082708-7dc7-4a57-b23c-3a2b19e54866",

			wantQuestionsLength: 1,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			escalatedQuestionUUID, err := uuid.Parse(tc.escalatedQuestionID)
			if err != nil {
				t.Fatal(err)
			}

			questions, err := rdb.GetTimeSensitiveQuestionsFromDisplayOrder(ctx, escalatedQuestionUUID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantQuestionsLength, len(questions))
		})
	}
}

func TestRDB_UpsertTimeSensitiveScreeningResultWithSecondaryScreening(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	var (
		err                    error
		timeSensitiveQuestions []*riskstratificationsql.TimeSensitiveQuestion
	)

	timeSensitiveQuestions, err = queries.GetTimeSensitiveQuestions(ctx, surveyVersionID(t))
	if err != nil {
		t.Fatal(err)
	}
	_, err = rdb.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
		CareRequestID:        1,
		Escalated:            true,
		EscalatedQuestionID:  uuid.NullUUID{UUID: timeSensitiveQuestions[0].ID, Valid: true},
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		Name   string
		Params riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams
	}{
		{
			Name: "Existing screening result",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
				CareRequestID:        1,
				Escalated:            false,
				EscalatedQuestionID:  uuid.NullUUID{UUID: timeSensitiveQuestions[1].ID, Valid: true},
				SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
				SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
			},
		},
		{
			Name: "New screening result",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
				CareRequestID:        2,
				Escalated:            true,
				EscalatedQuestionID:  uuid.NullUUID{UUID: timeSensitiveQuestions[0].ID, Valid: true},
				SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
				SecondaryScreeningID: sqltypes.ToValidNullInt64(2),
			},
		},
		{
			Name: "Escalated question id is optional",
			Params: riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
				CareRequestID:        2,
				Escalated:            true,
				SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
				SecondaryScreeningID: sqltypes.ToValidNullInt64(2),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			result, err := rdb.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, tc.Params)

			if err != nil {
				t.Fatal(err)
			}

			if result == nil {
				t.Fatal("Screening result is nil")
			}
		})
	}
}

func TestRDB_GetTimeSensitiveScreening(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	questionUUID, err := uuid.Parse(defaultQuestionID)
	if err != nil {
		t.Fatal(err)
	}

	_, err = rdb.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
		CareRequestID:        12345,
		Escalated:            true,
		EscalatedQuestionID:  uuid.NullUUID{UUID: questionUUID, Valid: true},
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name                 string
		careRequestID        int64
		secondaryScreeningID int64

		wantErr bool
	}{
		{
			name:                 "care request id exists",
			careRequestID:        12345,
			secondaryScreeningID: 1,
		},
		{
			name:                 "care request id does not exist",
			careRequestID:        0,
			secondaryScreeningID: 1,

			wantErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			result, err := rdb.GetTimeSensitiveScreening(ctx, riskstratificationsql.GetTimeSensitiveScreeningParams{CareRequestID: tc.careRequestID, SecondaryScreeningID: sqltypes.ToValidNullInt64(tc.secondaryScreeningID)})

			if (err != nil) != tc.wantErr {
				testutils.MustMatch(t, riskstratificationdb.ErrScreeningMissing, err.Error())
			}

			if tc.wantErr {
				return
			}

			testutils.MustMatch(t, true, result != nil)
		})
	}
}

func TestRDB_GetTimeSensitiveScreenings(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	questionUUID, err := uuid.Parse(defaultQuestionID)
	if err != nil {
		t.Fatal(err)
	}

	_, err = rdb.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
		CareRequestID:        1337,
		Escalated:            true,
		EscalatedQuestionID:  uuid.NullUUID{UUID: questionUUID, Valid: true},
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		SecondaryScreeningID: sqltypes.ToValidNullInt64(1),
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = rdb.UpsertTimeSensitiveScreeningResultWithSecondaryScreening(ctx, riskstratificationsql.UpsertTimeSensitiveScreeningResultWithSecondaryScreeningParams{
		CareRequestID:        1337,
		Escalated:            false,
		EscalatedQuestionID:  uuid.NullUUID{UUID: questionUUID, Valid: true},
		SurveyVersionID:      uuid.MustParse(defaultSurveyVersionID),
		SecondaryScreeningID: sqltypes.ToValidNullInt64(2),
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name          string
		careRequestID int64

		wantScreeningsLength int
	}{
		{
			name:          "care request id exists",
			careRequestID: 1337,

			wantScreeningsLength: 2,
		},
		{
			name:          "care request id does not exist",
			careRequestID: 0,

			wantScreeningsLength: 0,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			result, err := rdb.GetTimeSensitiveScreenings(ctx, tc.careRequestID)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantScreeningsLength, len(result))
		})
	}
}

func TestRDB_UpsertCareRequestSymptoms(t *testing.T) {
	ctx, db, _, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	tcs := []struct {
		Name              string
		careRequestID     int64
		symptomAliasUUIDs []uuid.UUID
	}{
		{
			Name:              "New care request result",
			careRequestID:     42,
			symptomAliasUUIDs: []uuid.UUID{uuid.New(), uuid.New()},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			result, err := rdb.UpsertCareRequestSymptoms(ctx, tc.careRequestID, tc.symptomAliasUUIDs)

			if err != nil {
				t.Fatal(err)
			}

			if result == nil {
				t.Fatal("Care request symptoms result is nil")
			}
		})
	}
}

func TestRDB_SearchSymptomAliases(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	bronchitisSymptom, err := queries.UpsertSymptom(ctx, "bronchitis")
	if err != nil {
		t.Fatal(err)
	}

	bruiseSymptom, err := queries.UpsertSymptom(ctx, "bruise")
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name       string
		searchTerm string

		want []string
	}{
		{
			name:       "order by similarity",
			searchTerm: "br",

			want: []string{bruiseSymptom.Name, bronchitisSymptom.Name},
		},
		{
			name:       "order by similarity - more specific",
			searchTerm: "bru",

			want: []string{bruiseSymptom.Name},
		},
		{
			name:       "not found",
			searchTerm: "ddd",

			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			result, err := rdb.SearchSymptomAliases(ctx, riskstratificationsql.SearchSymptomAliasesParams{
				SearchTerm: tc.searchTerm,
				PageOffset: 0,
				PageSize:   10,
			})

			if err != nil {
				t.Fatal(err)
			}

			var symptomNames []string
			for _, x := range result {
				symptomNames = append(symptomNames, x.Name)
			}

			testutils.MustMatch(t, tc.want, symptomNames)
		})
	}
}

func TestRDB_CheckSymptomAliasIDsExist(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	rdb := riskstratificationdb.NewRiskStratificationDB(db, nil, nil)

	bronchitisSymptom, err := queries.UpsertSymptom(ctx, "bronchitis")
	if err != nil {
		t.Fatal(err)
	}

	bruiseSymptom, err := queries.UpsertSymptom(ctx, "bruise")
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name              string
		symptomAliasesIds []uuid.UUID
		wantAllExist      bool
		wantError         error
	}{
		{
			name:              "All IDs exist",
			symptomAliasesIds: []uuid.UUID{bronchitisSymptom.ID, bruiseSymptom.ID},
			wantAllExist:      true,
		},
		{
			name:              "Some IDs do not exist",
			symptomAliasesIds: []uuid.UUID{bruiseSymptom.ID, uuid.New()},
			wantAllExist:      false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			allExist, _ := rdb.CheckSymptomAliasIDsExist(ctx, tc.symptomAliasesIds)

			testutils.MustMatch(t, tc.wantAllExist, allExist)
		})
	}
}

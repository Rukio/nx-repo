//go:build db_test

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	addresspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/address"
	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

var (
	mustMatchEpisodeResponse         = testutils.MustMatchFn(".Id", ".AdmittedAt", ".DischargedAt", ".CreatedAt", ".UpdatedAt", ".TaskableId")
	mustMatchNoteResponse            = testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")
	mustMatchPatientResponse         = testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")
	mustMatchTemplateResponse        = testutils.MustMatchFn(".Id", ".Name", ".CreatedAt", ".UpdatedAt")
	mustMatchUpdateCallVisitResponse = testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")
	mustMatchVisitResponse           = testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt", ".VisitId")

	defaultCarePhase   *caremanagerdb.CarePhase
	defaultServiceLine *caremanagerdb.ServiceLine
	defaultMarket      = &marketpb.Market{
		Id:               159,
		Name:             proto.String("the best name"),
		ShortName:        proto.String("thebest"),
		IanaTimeZoneName: proto.String("Denver"),
	}
	defaultTaskType               *caremanagerdb.TaskType
	defaultServiceRequestStatus   *caremanagerdb.ServiceRequestStatus
	defaultServiceRequestCategory *caremanagerdb.ServiceRequestCategory

	visitTypeDailyUpdateName  = "Daily Update"
	visitTypeTuckInCall       = "Tuck-in Call"
	visitTypeExtendedCareName = "Extended Care"

	mockedMarkets = []*marketpb.Market{
		defaultMarket,
	}
)

type getGRPCServerParams struct {
	stationURL                 string
	httpClient                 *http.Client
	db                         *CaremanagerDB
	mockMarketServiceClient    *MockMarketServiceClient
	mockUserServiceClient      *MockUserServiceClient
	mockAddressServiceClient   *MockAddressServiceClient
	mockShiftTeamServiceClient *MockShiftTeamServiceClient
	mockLogisticsServiceClient *MockLogisticsServiceClient
	mockEpisodeServiceClient   *MockEpisodeServiceClient
	statsigProvider            *providers.StatsigProvider
	segmentClient              *SegmentClient
}

func getGRPCServer(params getGRPCServerParams) *CaremanagerGRPCServer {
	return &CaremanagerGRPCServer{
		CaremanagerDB:   params.db,
		LogisticsClient: NewLogisticsClient(params.mockLogisticsServiceClient),
		StationClient: NewStationClient(NewStationClientParams{
			AuthEnabled:      true,
			StationURL:       params.stationURL,
			HTTPClient:       params.httpClient,
			MarketService:    params.mockMarketServiceClient,
			UserService:      params.mockUserServiceClient,
			AddressService:   params.mockAddressServiceClient,
			ShiftTeamService: params.mockShiftTeamServiceClient,
			EpisodeService:   params.mockEpisodeServiceClient,
		}),
		StatsigProvider: params.statsigProvider,
		SegmentClient:   params.segmentClient,
	}
}

func getDefaultCarePhase(ctx context.Context, db *CaremanagerDB) (*caremanagerdb.CarePhase, error) {
	if defaultCarePhase != nil {
		return defaultCarePhase, nil
	}
	carePhases, err := db.queries.GetCarePhases(ctx)
	defaultCarePhase = carePhases[0]

	return defaultCarePhase, err
}

func getDefaultServiceLine(ctx context.Context, db *CaremanagerDB) (*caremanagerdb.ServiceLine, error) {
	if defaultServiceLine != nil {
		return defaultServiceLine, nil
	}
	serviceLines, err := db.queries.GetServiceLines(ctx)
	defaultServiceLine = serviceLines[0]

	return defaultServiceLine, err
}

func getDefaultMarket() *marketpb.Market {
	return defaultMarket
}

func getDefaultTaskType(ctx context.Context, db *CaremanagerDB) (*caremanagerdb.TaskType, error) {
	if defaultTaskType != nil {
		return defaultTaskType, nil
	}
	taskTypes, err := db.queries.GetAllTaskTypes(ctx)
	defaultTaskType = taskTypes[0]

	return defaultTaskType, err
}

func getDefaultServiceRequestStatus(ctx context.Context, t *testing.T, db *CaremanagerDB) *caremanagerdb.ServiceRequestStatus {
	if defaultServiceRequestStatus != nil {
		return defaultServiceRequestStatus
	}

	serviceRequestStatuses, err := db.queries.GetAllServiceRequestStatus(ctx)
	if err != nil {
		t.Fatal(err)
	}

	defaultServiceRequestStatus = serviceRequestStatuses[0]

	return defaultServiceRequestStatus
}

func getServiceRequestStatusByName(ctx context.Context, t *testing.T, db *CaremanagerDB, statusName string) *caremanagerdb.ServiceRequestStatus {
	serviceRequestStatus, err := db.queries.GetServiceRequestStatusByName(ctx, statusName)
	if err != nil {
		t.Fatal(err)
	}

	return serviceRequestStatus
}

func getDefaultServiceRequestCategory(ctx context.Context, t *testing.T, db *CaremanagerDB) *caremanagerdb.ServiceRequestCategory {
	if defaultServiceRequestCategory != nil {
		return defaultServiceRequestCategory
	}

	serviceRequestCategories, err := db.queries.GetAllServiceRequestCategories(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defaultServiceRequestCategory = serviceRequestCategories[0]

	return defaultServiceRequestCategory
}

func getMockedMarket(marketID int64) *marketpb.Market {
	return &marketpb.Market{
		Id:               marketID,
		Name:             proto.String(fmt.Sprintf("market number %d", marketID)),
		ShortName:        proto.String(fmt.Sprintf("mrkt%d", marketID)),
		IanaTimeZoneName: proto.String("Denver"),
	}
}

func getCurrentConfig(
	ctx context.Context,
	t *testing.T,
	db *CaremanagerDB,
) ([]*marketpb.Market, []*caremanagerdb.CarePhase, []*caremanagerdb.ServiceLine) {
	carePhases, err := db.queries.GetCarePhases(ctx)
	if err != nil {
		t.Fatalf("could not retrieve care phases: %s", err)
	}
	serviceLines, err := db.queries.GetServiceLines(ctx)
	if err != nil {
		t.Fatalf("could no retrieve service lines: %s", err)
	}

	return mockedMarkets, carePhases, serviceLines
}

type createTestPatientParams struct {
	customFirstName             string
	customLastName              string
	customAthenaID              string
	withoutMedicalDecisionMaker bool
	withoutInsurance            bool
	withoutPharmacy             bool
	withoutExternalDoctor       bool
	withoutExternalReferrer     bool
}

func createTestPatient(ctx context.Context, db *CaremanagerDB, params createTestPatientParams) (*caremanagerdb.Patient, error) {
	firstName := params.customFirstName

	if firstName == "" {
		firstName = "John"
	}

	lastName := params.customLastName
	if lastName == "" {
		lastName = "Doe"
	}

	patient, err := db.queries.CreatePatient(ctx, caremanagerdb.CreatePatientParams{
		FirstName:                 firstName,
		LastName:                  lastName,
		Sex:                       "Male",
		DateOfBirth:               time.Now(),
		MiddleName:                sql.NullString{String: "Dean", Valid: true},
		AthenaMedicalRecordNumber: sql.NullString{String: params.customAthenaID, Valid: params.customAthenaID != ""},
	})
	if err != nil {
		return nil, err
	}

	if !params.withoutMedicalDecisionMaker {
		_, err = db.queries.CreateMedicalDecisionMaker(ctx, caremanagerdb.CreateMedicalDecisionMakerParams{
			FirstName: "Doctor",
			PatientID: patient.ID,
		})
		if err != nil {
			return nil, err
		}
	}
	if !params.withoutInsurance {
		_, err = db.queries.CreateInsurance(ctx, caremanagerdb.CreateInsuranceParams{
			Name:      "Insurance",
			PatientID: patient.ID,
		})
		if err != nil {
			return nil, err
		}
	}
	if !params.withoutPharmacy {
		_, err = db.queries.CreatePharmacy(ctx, caremanagerdb.CreatePharmacyParams{
			Name:      "Pharmacy",
			PatientID: patient.ID,
		})
		if err != nil {
			return nil, err
		}
	}
	if !params.withoutExternalDoctor {
		_, err = db.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
			Name:             "External Doctor",
			ProviderTypeName: "Doctor",
			PatientID:        patient.ID,
		})
		if err != nil {
			return nil, err
		}
	}
	if !params.withoutExternalReferrer {
		_, err = db.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
			Name:             "External Referrer",
			ProviderTypeName: "Referrer",
			PatientID:        patient.ID,
		})
		if err != nil {
			return nil, err
		}
	}

	return patient, nil
}

type createTestInsuranceParams struct {
	name      string
	memberID  *string
	priority  int32
	patientID int64
}

type createTestPharmacyParams struct {
	name        string
	phoneNumber *string
	faxNumber   *string
	address     *string
	patientID   int64
}

func createTestInsurance(ctx context.Context, t *testing.T, db *CaremanagerDB, params createTestInsuranceParams) *caremanagerdb.Insurance {
	if params.name == "" {
		params.name = "default_insurance"
	}

	if params.priority == 0 {
		params.priority = 1
	}

	if params.patientID == 0 {
		patient, err := createTestPatient(ctx, db, createTestPatientParams{
			withoutInsurance: true,
		})
		if err != nil {
			t.Fatal(err)
		}
		params.patientID = patient.ID
	}
	insurance, err := db.queries.CreateInsurance(ctx, caremanagerdb.CreateInsuranceParams{
		MemberID:  sqltypes.ToNullString(params.memberID),
		Priority:  params.priority,
		Name:      params.name,
		PatientID: params.patientID,
	})
	if err != nil {
		t.Fatal(err)
	}

	return insurance
}

type createTestMedicalDecisionMakerParams struct {
	firstName    string
	lastName     string
	address      *string
	relationship string
	phoneNumber  string
	patientID    int64
}

func createTestMedicalDecisionMaker(ctx context.Context, t *testing.T, db *CaremanagerDB, params createTestMedicalDecisionMakerParams) *caremanagerdb.MedicalDecisionMaker {
	if params.firstName == "" {
		params.firstName = "John"
	}

	if params.lastName == "" {
		params.lastName = "Mauchly"
	}

	if params.address == nil {
		address := "address"
		params.address = &address
	}

	if params.phoneNumber == "" {
		params.phoneNumber = "999-999-999"
	}

	if params.relationship == "" {
		params.relationship = "relationship"
	}

	if params.patientID == 0 {
		patient, err := createTestPatient(ctx, db, createTestPatientParams{withoutMedicalDecisionMaker: true})
		if err != nil {
			t.Fatal(err)
		}
		params.patientID = patient.ID
	}

	medicalDecisionMaker, err := db.queries.CreateMedicalDecisionMaker(ctx, caremanagerdb.CreateMedicalDecisionMakerParams{
		PatientID:    params.patientID,
		FirstName:    params.firstName,
		LastName:     params.lastName,
		PhoneNumber:  sqltypes.ToNullString(&params.phoneNumber),
		Relationship: sqltypes.ToNullString(&params.relationship),
		Address:      sqltypes.ToNullString(params.address),
	})
	if err != nil {
		t.Fatal(err)
	}

	return medicalDecisionMaker
}

func createTestPharmacy(ctx context.Context, t *testing.T, db *CaremanagerDB, params createTestPharmacyParams) caremanagerdb.Pharmacy {
	if params.name == "" {
		params.name = "default_pharmacy"
	}

	if params.patientID == 0 {
		patient, err := createTestPatient(ctx, db, createTestPatientParams{})
		if err != nil {
			t.Fatal(err)
		}
		params.patientID = patient.ID
	}
	pharmacy, err := db.queries.CreatePharmacy(ctx, caremanagerdb.CreatePharmacyParams{
		Name:        params.name,
		PhoneNumber: sqltypes.ToNullString(params.phoneNumber),
		FaxNumber:   sqltypes.ToNullString(params.faxNumber),
		Address:     sqltypes.ToNullString(params.address),
		PatientID:   params.patientID,
	})
	if err != nil {
		t.Fatal(err)
	}
	return *pharmacy
}

type createTestExternalCareProviderParams struct {
	name           string
	phoneNumber    *string
	faxNumber      *string
	address        *string
	patientID      int64
	providerTypeID int64
}

func createTestExternalCareProvider(
	ctx context.Context,
	t *testing.T,
	db *CaremanagerDB,
	params createTestExternalCareProviderParams,
) caremanagerdb.ExternalCareProvider {
	if params.name == "" {
		params.name = "default_external_care_provider"
	}
	if params.patientID == 0 {
		patient, err := createTestPatient(ctx, db, createTestPatientParams{})
		if err != nil {
			t.Fatal(err)
		}
		params.patientID = patient.ID
	}
	if params.providerTypeID == 0 {
		params.providerTypeID = int64(1)
	}
	createdExternalCareProvider, err := db.queries.CreateExternalCareProvider(ctx, caremanagerdb.CreateExternalCareProviderParams{
		Name:           params.name,
		PhoneNumber:    sqltypes.ToNullString(params.phoneNumber),
		FaxNumber:      sqltypes.ToNullString(params.faxNumber),
		Address:        sqltypes.ToNullString(params.address),
		ProviderTypeID: params.providerTypeID,
		PatientID:      params.patientID,
	})
	if err != nil {
		t.Fatal(err)
	}
	return *createdExternalCareProvider
}

type createTestSummaryParams struct {
	visitID         int64
	body            string
	createdByUserID *int64
}

func createTestSummary(ctx context.Context, db *CaremanagerDB, params *createTestSummaryParams) (*caremanagerdb.VisitSummary, error) {
	return db.queries.CreateVisitSummary(ctx, caremanagerdb.CreateVisitSummaryParams{
		VisitID:         params.visitID,
		Body:            params.body,
		CreatedByUserID: sqltypes.ToNullInt64(params.createdByUserID),
	})
}

type createTestVisitParams struct {
	episodeID                int64
	careRequestID            *int64
	visitTypeID              *int64
	createdByUserID          *int64
	status                   *string
	statusUpdatedAt          *string
	addressID                *int64
	patientAvailabilityStart *string
	patientAvailabilityEnd   *string
	carName                  *string
	providerUserIds          []int64
	virtualAPPID             *int64

	withSummary bool
	summary     *string
}

type createTestVisitResult struct {
	visit   *caremanagerdb.Visit
	summary *caremanagerdb.VisitSummary
}

func createTestVisit(ctx context.Context, t *testing.T, db *CaremanagerDB, params *createTestVisitParams) *createTestVisitResult {
	if params.episodeID == 0 {
		episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
		if err != nil {
			t.Fatal(err)
		}

		params.episodeID = episode.episode.ID
	}

	visitResult := &createTestVisitResult{}

	visit, err := db.queries.CreateVisit(ctx, caremanagerdb.CreateVisitParams{
		EpisodeID:                params.episodeID,
		CareRequestID:            sqltypes.ToNullInt64(params.careRequestID),
		VisitTypeID:              sqltypes.ToNullInt64(params.visitTypeID),
		CreatedByUserID:          sqltypes.ToNullInt64(params.createdByUserID),
		Status:                   sqltypes.ToNullString(params.status),
		StatusUpdatedAt:          sqltypes.StringToNullTime(params.statusUpdatedAt),
		AddressID:                sqltypes.ToNullInt64(params.addressID),
		PatientAvailabilityStart: sqltypes.StringToNullTime(params.patientAvailabilityStart),
		PatientAvailabilityEnd:   sqltypes.StringToNullTime(params.patientAvailabilityEnd),
		CarName:                  sqltypes.ToNullString(params.carName),
		ProviderUserIds:          params.providerUserIds,
		VirtualAppID:             sqltypes.ToNullInt64(params.virtualAPPID),
	})
	if err != nil {
		t.Fatal(err)
	}

	visitResult.visit = visit

	if params.withSummary {
		summary := "default summary"
		if params.summary != nil {
			summary = *params.summary
		}
		visitSummary, err := createTestSummary(ctx, db, &createTestSummaryParams{
			visitID:         visit.ID,
			body:            summary,
			createdByUserID: params.createdByUserID,
		})
		if err != nil {
			t.Fatal(err)
		}

		visitResult.summary = visitSummary
	}

	return visitResult
}

type createTestEpisodeParams struct {
	customPatient     *caremanagerdb.Patient
	customCarePhase   *caremanagerdb.CarePhase
	customMarket      *marketpb.Market
	customServiceLine *caremanagerdb.ServiceLine
}

type createTestEpisodeResult struct {
	episode     *caremanagerdb.Episode
	patient     *caremanagerdb.Patient
	carePhase   *caremanagerdb.CarePhase
	serviceLine *caremanagerdb.ServiceLine
	market      *marketpb.Market
}

func createTestEpisode(
	ctx context.Context,
	db *CaremanagerDB,
	params *createTestEpisodeParams,
) (*createTestEpisodeResult, error) {
	var (
		patient     *caremanagerdb.Patient
		carePhase   *caremanagerdb.CarePhase
		market      *marketpb.Market
		serviceLine *caremanagerdb.ServiceLine
		err         error
	)

	if params == nil {
		return nil, errors.New("Error")
	}

	carePhase = params.customCarePhase
	if carePhase == nil {
		if carePhase, err = getDefaultCarePhase(ctx, db); err != nil {
			return nil, err
		}
	}
	serviceLine = params.customServiceLine
	if serviceLine == nil {
		if serviceLine, err = getDefaultServiceLine(ctx, db); err != nil {
			return nil, err
		}
	}
	market = params.customMarket
	if market == nil {
		market = getDefaultMarket()
	}

	patient = params.customPatient
	if patient == nil {
		patient, err = createTestPatient(ctx, db, createTestPatientParams{})
		if err != nil {
			return nil, err
		}
	}

	episode, err := db.queries.CreateEpisode(ctx, caremanagerdb.CreateEpisodeParams{
		PatientSummary: "Summary",
		PatientID:      patient.ID,
		AdmittedAt:     time.Now(),
		CarePhaseID:    carePhase.ID,
		ServiceLineID:  serviceLine.ID,
		MarketID:       market.Id,
	})
	if err != nil {
		return nil, err
	}

	return &createTestEpisodeResult{
		episode,
		patient,
		carePhase,
		serviceLine,
		market,
	}, nil
}

func createTestTaskTemplate(
	ctx context.Context,
	db *CaremanagerDB,
	serviceLine *caremanagerdb.ServiceLine,
) (*caremanagerdb.TaskTemplate, *caremanagerdb.TaskTemplateTask, error) {
	template, err := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{
		Name:            "Testing Template" + strconv.Itoa(int(time.Now().UnixNano())),
		ServiceLineID:   serviceLine.ID,
		CreatedByUserID: time.Now().UnixNano(),
	})
	if err != nil {
		return nil, nil, err
	}

	task, err := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{
		Body:       "Task body",
		TypeID:     4,
		TemplateID: template.ID,
	})
	if err != nil {
		return nil, nil, err
	}

	return template, task, nil
}

func createTestTaskTemplateTasks(
	ctx context.Context,
	db *CaremanagerDB,
	count int,
	taskTemplateID int64,
) ([]*caremanagerdb.TaskTemplateTask, error) {
	var templateTasksArray []*caremanagerdb.TaskTemplateTask

	for i := 0; i < count; i++ {
		task, err := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{
			Body:       "Task body " + strconv.Itoa(int(time.Now().UnixNano())),
			TypeID:     4,
			TemplateID: taskTemplateID,
		})
		if err != nil {
			return nil, err
		}

		templateTasksArray = append(templateTasksArray, task)
	}

	return templateTasksArray, nil
}

func getTasksFromTaskTemplateTasks(
	templateTasks []*caremanagerdb.TaskTemplateTask,
) []*caremanagerdb.Task {
	var tasksArray []*caremanagerdb.Task
	for _, task := range templateTasks {
		tasksArray = append(tasksArray, &caremanagerdb.Task{
			Description: task.Body,
			IsCompleted: false,
			TaskTypeID:  4,
		})
	}

	return tasksArray
}

func createTaskTemplatesAndTasks(
	ctx context.Context,
	db *CaremanagerDB,
	serviceLine *caremanagerdb.ServiceLine,
) (
	*caremanagerdb.TaskTemplate,
	*caremanagerdb.TaskTemplate,
	[]*caremanagerdb.TaskTemplateTask,
	[]*caremanagerpb.Task,
	error,
) {
	var (
		taskTemplateTasks1   []*caremanagerdb.TaskTemplateTask
		taskTemplateTasks2   []*caremanagerdb.TaskTemplateTask
		allTaskTemplateTasks []*caremanagerdb.TaskTemplateTask
	)
	// First Task Template Creation block
	taskTemplate1, task, _ := createTestTaskTemplate(ctx, db, serviceLine)
	taskTemplateTasks1 = append(taskTemplateTasks1, task)
	tasksArray1, err := createTestTaskTemplateTasks(ctx, db, 2, taskTemplate1.ID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	taskTemplateTasks1 = append(taskTemplateTasks1, tasksArray1...)

	// Second Task Template Creation Block
	taskTemplate2, task, _ := createTestTaskTemplate(ctx, db, serviceLine)
	taskTemplateTasks2 = append(taskTemplateTasks2, task)
	tasksArray2, err := createTestTaskTemplateTasks(ctx, db, 2, taskTemplate2.ID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	taskTemplateTasks2 = append(taskTemplateTasks2, tasksArray2...)

	// Grouping all tasks in one array
	allTaskTemplateTasks = append(allTaskTemplateTasks, taskTemplateTasks2...)
	allTaskTemplateTasks = append(allTaskTemplateTasks, taskTemplateTasks1...)
	// Converting into Tasks
	tasksArray := getTasksFromTaskTemplateTasks(allTaskTemplateTasks)
	// Converting into Tasks Protos
	var tasksProtosArray []*caremanagerpb.Task
	for _, task := range tasksArray {
		tasksProtosArray = append(tasksProtosArray, TaskProtoFromTaskSQL(task, &caremanagerdb.TaskType{ID: 4, Slug: "nurse_navigator"}))
	}

	return taskTemplate1, taskTemplate2, allTaskTemplateTasks, tasksProtosArray, nil
}

type testNoteParams struct {
	episode           *caremanagerdb.Episode
	pinned            bool
	createdByUser     *caremanagerpb.User
	lastUpdatedByUser *caremanagerpb.User
}

func createTestNote(
	ctx context.Context,
	db *CaremanagerDB,
	params *testNoteParams,
) (*caremanagerdb.Note, error) {
	var (
		err             error
		episodeID       = sql.NullInt64{}
		createdByUserID = sql.NullInt64{}
	)

	if params.episode != nil {
		episodeID = sqltypes.ToNullInt64(&params.episode.ID)
	}

	if params.createdByUser != nil {
		createdByUserID = sqltypes.ToNullInt64(&params.createdByUser.Id)
	}

	note, err := db.queries.CreateNote(ctx, caremanagerdb.CreateNoteParams{
		Body:            "The best Note",
		Kind:            0,
		EpisodeID:       episodeID,
		CreatedByUserID: createdByUserID,
	})
	if err != nil {
		return nil, err
	}

	if params.pinned {
		note, err = db.queries.PinNote(ctx, note.ID)
		if err != nil {
			return nil, err
		}
	}

	if params.lastUpdatedByUser != nil {
		note, err = db.queries.UpdateNote(ctx, caremanagerdb.UpdateNoteParams{
			ID:                  note.ID,
			LastUpdatedByUserID: sqltypes.ToNullInt64(&params.lastUpdatedByUser.Id),
		})
		if err != nil {
			return nil, err
		}
	}

	return note, nil
}

func createTestServiceRequestNote(ctx context.Context, t *testing.T, db *CaremanagerDB, serviceRequestID int64) *caremanagerdb.Note {
	note, err := createTestNote(ctx, db, &testNoteParams{})
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.queries.CreateServiceRequestNote(ctx, caremanagerdb.CreateServiceRequestNoteParams{
		ServiceRequestID: serviceRequestID,
		NoteID:           note.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	return note
}

type testTaskParams struct {
	isCompleted *bool
	episode     *caremanagerdb.Episode
	user        *caremanagerpb.User
}

func createTestTask(
	ctx context.Context,
	db *CaremanagerDB,
	params *testTaskParams,
) (*caremanagerdb.Task, *caremanagerdb.TaskType, error) {
	var (
		err         error
		episode     = params.episode
		isCompleted = params.isCompleted
	)
	if episode == nil {
		result, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
		if err != nil {
			return nil, nil, err
		}
		episode = result.episode
	}
	if isCompleted == nil {
		isCompleted = proto.Bool(false)
	}
	taskTypes, err := db.queries.GetAllTaskTypes(ctx)
	if err != nil {
		return nil, nil, err
	}
	taskType := taskTypes[0]

	tasks, err := db.queries.CreateTasks(ctx, caremanagerdb.CreateTasksParams{
		Descriptions:      []string{"the best task"},
		TaskTypeIds:       []int64{taskType.ID},
		EpisodeIds:        []int64{episode.ID},
		AreTasksCompleted: []bool{*isCompleted},
	})
	if err != nil {
		return nil, nil, err
	}

	resultingTask := tasks[0]

	if params.user != nil {
		resultingTask, err = db.queries.UpdateTask(ctx, caremanagerdb.UpdateTaskParams{
			ID:                tasks[0].ID,
			Description:       tasks[0].Description,
			TaskTypeID:        taskType.ID,
			CompletedByUserID: sql.NullInt64{Valid: true, Int64: params.user.Id},
		})
		if err != nil {
			return nil, nil, err
		}
	}

	return resultingTask, taskType, nil
}

type createTestServiceRequestParams struct {
	statusID  *int64
	cmsNumber *string
}

func createTestServiceRequest(
	ctx context.Context,
	t *testing.T,
	db *CaremanagerDB,
	params *createTestServiceRequestParams,
) *caremanagerdb.ServiceRequest {
	careRequestIDMock := time.Now().UnixNano()
	defaultStatus := getDefaultServiceRequestStatus(ctx, t, db)
	defaultCategory := getDefaultServiceRequestCategory(ctx, t, db)

	statusID := defaultStatus.ID
	if params != nil && params.statusID != nil {
		statusID = *params.statusID
	}

	cmsNumber := sql.NullString{}
	if params != nil && params.cmsNumber != nil {
		cmsNumber = sqltypes.ToNullString(params.cmsNumber)
	}

	serviceRequest, err := db.queries.CreateServiceRequest(
		ctx,
		caremanagerdb.CreateServiceRequestParams{
			CareRequestID:       careRequestIDMock,
			MarketID:            getDefaultMarket().Id,
			StatusID:            statusID,
			CategoryID:          defaultCategory.ID,
			CmsNumber:           cmsNumber,
			IsInsuranceVerified: true,
		},
	)
	if err != nil {
		t.Fatal(err)
	}

	return serviceRequest
}

func mustContain(t testutils.Tester, want, got string) {
	if !strings.Contains(got, want) {
		t.Fatalf("Expected %s to be contained in %s", want, got)
	}
}

func TestGetConfig(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	currentMarkets, currentCarePhases, _ := getCurrentConfig(ctx, t, db)

	testCases := []struct {
		name    string
		context context.Context

		wantServiceLineIDs []int64
		wantErr            bool
	}{
		{
			name:    "works",
			context: ctxWithAuth,

			wantServiceLineIDs: CareManagerServiceLineIDsDisplayList,
			wantErr:            false,
		},
		{
			name:    "fails due to missing auth",
			context: ctxWithoutAuth,

			wantErr: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: currentMarkets,
					},
				},
			})

			resp, err := grpcServer.GetConfig(testCase.context, &caremanagerpb.GetConfigRequest{})

			if testCase.wantErr && err != nil {
				return
			}

			if err != nil {
				t.Fatalf("Could not fulfill the get config request: %s", err)
			}

			testutils.MustMatch(
				t,
				[]int{len(resp.Markets), len(resp.CarePhases), len(resp.ServiceLines)},
				[]int{len(currentMarkets), len(currentCarePhases), len(CareManagerServiceLineIDsDisplayList)},
				"GetConfig returned a bad response",
			)

			if testCase.wantServiceLineIDs != nil {
				gotServiceLineIDs := make([]int64, len(resp.ServiceLines))
				for i, serviceLine := range resp.ServiceLines {
					gotServiceLineIDs[i] = serviceLine.Id
				}
				testutils.MustMatch(t, testCase.wantServiceLineIDs, gotServiceLineIDs)
			}
		})
	}
}

func TestCreateEpisode(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	carePhase, _ := getDefaultCarePhase(ctx, db)
	serviceLine, _ := getDefaultServiceLine(ctx, db)
	market := getDefaultMarket()
	taskTemplate1, taskTemplate2, allTaskTemplateTasks, tasksProtosArray, err := createTaskTemplatesAndTasks(ctx, db, serviceLine)
	if err != nil {
		t.Fatal(err.Error())
	}

	createdPatient, err := createTestPatient(ctx, db, createTestPatientParams{})
	if err != nil {
		t.Fatalf(err.Error())
	}
	mockStatsigProvider := providers.StartMockStatsigProvider(t)

	testCases := []struct {
		name                string
		request             *caremanagerpb.CreateEpisodeRequest
		useAuth             bool
		useTaskTemplatesIDs bool
		isFeatureEnabled    bool

		wantTasksOrder []*caremanagerdb.TaskTemplateTask
		wantErrMsg     string
		want           *caremanagerpb.CreateEpisodeResponse
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      createdPatient.ID,
				MarketId:       market.Id,
				CarePhaseId:    carePhase.ID,
				ServiceLineId:  serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			want: &caremanagerpb.CreateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Summary",
					ServiceLineId:  serviceLine.ID,
					Patient:        PatientProtoFromPatientSQL(createdPatient, PatientProtoFromPatientSQLParams{}),
					PatientId:      createdPatient.ID,
					CarePhase:      CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market: &caremanagerpb.Market{
						Id:        market.Id,
						Name:      *market.Name,
						ShortName: *market.ShortName,
						TzName:    *market.IanaTimeZoneName,
					},
					MarketId: market.Id,
				},
			},
		},
		{
			name: "works with the visits feature gate enabled",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      createdPatient.ID,
				MarketId:       market.Id,
				CarePhaseId:    carePhase.ID,
				ServiceLineId:  serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: true,

			want: &caremanagerpb.CreateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: defaultSummary,
					ServiceLineId:  serviceLine.ID,
					Patient:        PatientProtoFromPatientSQL(createdPatient, PatientProtoFromPatientSQLParams{}),
					PatientId:      createdPatient.ID,
					CarePhase:      CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market: &caremanagerpb.Market{
						Id:        market.Id,
						Name:      *market.Name,
						ShortName: *market.ShortName,
						TzName:    *market.IanaTimeZoneName,
					},
					MarketId: market.Id,
				},
			},
		},
		{
			name: "works applying a task template",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary:   "Summary",
				PatientId:        createdPatient.ID,
				MarketId:         market.Id,
				CarePhaseId:      carePhase.ID,
				ServiceLineId:    serviceLine.ID,
				ApplyTemplateIds: []int64{taskTemplate2.ID, taskTemplate1.ID},
			},
			useAuth:             true,
			useTaskTemplatesIDs: true,
			isFeatureEnabled:    false,

			want: &caremanagerpb.CreateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Summary",
					ServiceLineId:  serviceLine.ID,
					Patient:        PatientProtoFromPatientSQL(createdPatient, PatientProtoFromPatientSQLParams{}),
					PatientId:      createdPatient.ID,
					CarePhase:      CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market: &caremanagerpb.Market{
						Id:        market.Id,
						Name:      *market.Name,
						ShortName: *market.ShortName,
						TzName:    *market.IanaTimeZoneName,
					},
					MarketId: market.Id,
					Tasks:    tasksProtosArray,
					TaskTemplates: []*caremanagerpb.TaskTemplate{
						{
							Id:              taskTemplate1.ID,
							CreatedAt:       taskTemplate1.CreatedAt.Format(timestampLayout),
							UpdatedAt:       taskTemplate1.UpdatedAt.Format(timestampLayout),
							Name:            taskTemplate1.Name,
							TasksCount:      3,
							ServiceLineId:   serviceLine.ID,
							UpdatedByUserId: taskTemplate1.LastUpdatedByUserID,
						},
						{
							Id:              taskTemplate2.ID,
							CreatedAt:       taskTemplate2.CreatedAt.Format(timestampLayout),
							UpdatedAt:       taskTemplate2.UpdatedAt.Format(timestampLayout),
							Name:            taskTemplate2.Name,
							TasksCount:      3,
							ServiceLineId:   serviceLine.ID,
							UpdatedByUserId: taskTemplate2.LastUpdatedByUserID,
						},
					},
				},
			},

			wantTasksOrder: allTaskTemplateTasks,
		},
		{
			name: "fails if Patient Summary is missing",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientId:     createdPatient.ID,
				MarketId:      market.Id,
				CarePhaseId:   carePhase.ID,
				ServiceLineId: serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.patient_summary cannot be empty",
		},
		{
			name: "fails if PatientId is missing",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				MarketId:       market.Id,
				CarePhaseId:    carePhase.ID,
				ServiceLineId:  serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			wantErrMsg: "rpc error: code = Internal desc = could not find the patient assigned to this episode, patient_id: 0",
		},
		{
			name: "fails if CarePhaseId is missing",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      createdPatient.ID,
				MarketId:       market.Id,
				ServiceLineId:  serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.care_phase_id cannot be empty",
		},
		{
			name: "fails if ServiceLineId is missing",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      createdPatient.ID,
				MarketId:       market.Id,
				CarePhaseId:    carePhase.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			wantErrMsg: "episode.service_line_id cannot be empty",
		},
		{
			name: "fails if MarketId is missing",
			request: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      createdPatient.ID,
				CarePhaseId:    carePhase.ID,
				ServiceLineId:  serviceLine.ID,
			},
			useAuth:          true,
			isFeatureEnabled: false,

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.market_id cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			mockStatsigProvider.OverrideGate(VisitsV1StatsigFlag, testCase.isFeatureEnabled)
			grpcServer := getGRPCServer(getGRPCServerParams{
				db:              db,
				statsigProvider: mockStatsigProvider,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetMarketResult: &marketpb.GetMarketResponse{
						Market: market,
					},
				},
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.CreateEpisode(
				testCtx,
				testCase.request,
			)

			if testCase.useTaskTemplatesIDs {
				for _, task := range testCase.want.Episode.Tasks {
					task.TaskableId = resp.Episode.Id
				}
			}

			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("CreateEpisode returned an error %s", err.Error())
			}

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchEpisodeResponse(t, testCase.want, resp)
			if testCase.wantTasksOrder != nil {
				for i, task := range resp.Episode.Tasks {
					testutils.MustMatch(t, testCase.wantTasksOrder[i].Body, task.Task, "Tasks response is in the incorrect order.")
				}
			}
		})
	}
}

func TestGetEpisodes(t *testing.T) { //nolint: gocyclo,cyclop
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	now := time.Now().UnixNano()
	user := &caremanagerpb.User{Id: time.Now().UnixNano()}
	patientNameSuffix := strconv.Itoa(int(time.Now().UnixNano()))
	uniquePatientName := "episodeListTest" + patientNameSuffix

	numberOfPatientsToCreate := 5
	var patients []*caremanagerdb.Patient
	for i := 0; i < numberOfPatientsToCreate; i++ {
		patient, err := createTestPatient(ctx, db, createTestPatientParams{
			customFirstName: fmt.Sprintf("episodeListTest%s%d", patientNameSuffix, i),
		})
		if err != nil {
			t.Fatal(err.Error())
		}
		patients = append(patients, patient)
	}

	patient1 := patients[0]
	patient2 := patients[1]
	patient3 := patients[2]
	patient4 := patients[3]
	patient5 := patients[4]

	highAcuityCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "High Acuity")
	transitionHighCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "Transition - High")
	activeCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "Active")
	dischargedCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "Discharged")
	pendingCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "Pending")

	serviceLines, err := db.queries.GetServiceLines(ctx)
	if err != nil {
		t.Fatal(err)
	}

	markets := []*marketpb.Market{getMockedMarket(now), getMockedMarket(now + 1), getMockedMarket(now + 2), getMockedMarket(now + 3)}

	episode1, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient1,
		customCarePhase:   highAcuityCarePhase,
		customMarket:      markets[0],
		customServiceLine: serviceLines[0],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode2, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient2,
		customCarePhase:   transitionHighCarePhase,
		customMarket:      markets[0],
		customServiceLine: serviceLines[1],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode3, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient3,
		customCarePhase:   activeCarePhase,
		customMarket:      markets[1],
		customServiceLine: serviceLines[2],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode4, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient4,
		customCarePhase:   dischargedCarePhase,
		customMarket:      markets[2],
		customServiceLine: serviceLines[0],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode5, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient5,
		customCarePhase:   pendingCarePhase,
		customMarket:      markets[1],
		customServiceLine: serviceLines[1],
	})
	if err != nil {
		t.Fatal(err.Error())
	}

	episode1ID := episode1.episode.ID
	episode2ID := episode2.episode.ID
	episode3ID := episode3.episode.ID
	episode4ID := episode4.episode.ID
	episode5ID := episode5.episode.ID

	_, _, err = createTestTask(ctx, db, &testTaskParams{
		isCompleted: proto.Bool(true),
		episode:     episode1.episode,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, _, err = createTestTask(ctx, db, &testTaskParams{
		isCompleted: proto.Bool(true),
		episode:     episode2.episode,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, _, err = createTestTask(ctx, db, &testTaskParams{
		isCompleted: proto.Bool(false),
		episode:     episode3.episode,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, _, err = createTestTask(ctx, db, &testTaskParams{
		isCompleted: proto.Bool(false),
		episode:     episode4.episode,
	})
	if err != nil {
		t.Fatal(err)
	}
	taskForEpisode5, _, err := createTestTask(ctx, db, &testTaskParams{
		isCompleted: proto.Bool(false),
		episode:     episode5.episode,
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.queries.DeleteTask(ctx, taskForEpisode5.ID)
	if err != nil {
		t.Fatal(err)
	}

	// Used for the ordering test case
	episode6, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient1,
		customCarePhase:   activeCarePhase,
		customMarket:      markets[3],
		customServiceLine: serviceLines[0],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode7, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient2,
		customCarePhase:   activeCarePhase,
		customMarket:      markets[3],
		customServiceLine: serviceLines[1],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode8, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient3,
		customCarePhase:   activeCarePhase,
		customMarket:      markets[3],
		customServiceLine: serviceLines[2],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode9, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient4,
		customCarePhase:   transitionHighCarePhase,
		customMarket:      markets[3],
		customServiceLine: serviceLines[0],
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode10, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:     patient5,
		customCarePhase:   pendingCarePhase,
		customMarket:      markets[3],
		customServiceLine: serviceLines[1],
	})
	if err != nil {
		t.Fatal(err.Error())
	}

	episode6ID := episode6.episode.ID
	episode7ID := episode7.episode.ID
	episode8ID := episode8.episode.ID
	episode9ID := episode9.episode.ID
	episode10ID := episode10.episode.ID

	_, _ = db.queries.UpdateEpisode(ctx, caremanagerdb.UpdateEpisodeParams{
		ID:         episode6ID,
		AdmittedAt: sql.NullTime{Valid: true, Time: time.Now().Add(time.Hour * -24)}, // 2
	})
	_, _ = db.queries.UpdateEpisode(ctx, caremanagerdb.UpdateEpisodeParams{
		ID:           episode7ID,
		AdmittedAt:   sql.NullTime{Valid: true, Time: time.Now().Add(time.Hour * -24 * 10)},
		DischargedAt: sql.NullTime{Valid: true, Time: time.Now().Add(time.Hour * -24 * 4)}, // 6
	})
	_, _ = db.queries.UpdateEpisode(ctx, caremanagerdb.UpdateEpisodeParams{
		ID:         episode8ID,
		AdmittedAt: sql.NullTime{Valid: true, Time: time.Now().Add(time.Hour * -24 * 3)}, // 3
	})

	_, _, err = createTestTask(ctx, db, &testTaskParams{episode: episode1.episode})
	if err != nil {
		t.Fatal(err.Error())
	}
	_, err = createTestNote(ctx, db, &testNoteParams{episode: episode1.episode})
	if err != nil {
		t.Fatal(err.Error())
	}
	mostRelevantNote, err := createTestNote(ctx, db, &testNoteParams{episode: episode1.episode, createdByUser: user, lastUpdatedByUser: user})
	if err != nil {
		t.Fatal(err.Error())
	}

	testCases := []struct {
		name        string
		request     *caremanagerpb.GetEpisodesRequest
		useAuth     bool
		userMarkets []*marketpb.Market

		userMarketsError     error
		wantErrMsg           string
		wantLength           int
		wantIDs              []int64
		wantIDsOrder         []int64
		wantPaginationValues *caremanagerpb.PageInfo
		wantEpisodesResponse []*caremanagerpb.Episode
	}{
		{
			name: "works",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				PatientName: &uniquePatientName,
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 5,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 5,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "returns all the necessary relations for each episode",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				PatientName: proto.String(patient1.FirstName),
			},
			useAuth:     true,
			userMarkets: markets,

			wantEpisodesResponse: []*caremanagerpb.Episode{
				{
					PatientSummary: "Summary",
					ServiceLineId:  serviceLines[0].ID,
					Patient: &caremanagerpb.Patient{
						FirstName:      patient1.FirstName,
						MiddleName:     &patient1.MiddleName.String,
						LastName:       patient1.LastName,
						Sex:            patient1.Sex,
						PhoneNumber:    proto.String(""),
						DateOfBirth:    time.Now().Format(dateLayout),
						AddressStreet:  proto.String(""),
						AddressCity:    proto.String(""),
						AddressState:   proto.String(""),
						AddressZipcode: proto.String(""),
					},
					PatientId:        patient1.ID,
					CarePhase:        CarePhaseProtoFromCarePhaseSQL(highAcuityCarePhase),
					IncompleteTasks:  &caremanagerpb.IncompleteTasks{NurseNavigator: 1},
					LastNote:         NoteProtoFromNoteSQL(mostRelevantNote),
					MostRelevantNote: NoteProtoFromNoteSQL(mostRelevantNote),
				},
			},
			wantLength:           1,
			wantPaginationValues: &caremanagerpb.PageInfo{PageSize: 5, TotalResults: 1, TotalPages: 1, CurrentPage: 1, FirstPage: proto.Bool(true), LastPage: proto.Bool(true)},
		},
		{
			name: "supports returning an empty list",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				PatientName: proto.String("nonexistent"),
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 0,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				TotalResults: 0,
				TotalPages:   1,
				CurrentPage:  1,
				NextPage:     nil,
				PreviousPage: nil,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With different page size)",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				PatientName: &uniquePatientName,
				PageSize:    proto.Int64(10),
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 5,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     10,
				CurrentPage:  1,
				TotalResults: 5,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With different starting page)",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				PatientName: &uniquePatientName,
				PageSize:    proto.Int64(2),
				Page:        proto.Int64(2),
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 2,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     2,
				CurrentPage:  2,
				TotalResults: 5,
				TotalPages:   3,
				NextPage:     proto.Int64(3),
				PreviousPage: proto.Int64(1),
				FirstPage:    proto.Bool(false),
				LastPage:     proto.Bool(false),
			},
		},
		{
			name: "filters episodes by market IDs",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId: []int64{markets[0].Id, markets[2].Id},
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 3,
			wantIDs:    []int64{episode1.episode.ID, episode2.episode.ID, episode4.episode.ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 3,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "filters episodes by care phase IDs",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:    []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				CarePhaseId: []int64{activeCarePhase.ID, dischargedCarePhase.ID},
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 2,
			wantIDs:    []int64{episode3ID, episode4ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 2,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "filters episodes by service line IDs",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:      []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				ServiceLineId: []int64{serviceLines[0].ID, serviceLines[1].ID},
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 4,
			wantIDs:    []int64{episode1ID, episode2ID, episode4ID, episode5ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 4,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "filters episodes with incomplete tasks",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId:       []int64{markets[0].Id, markets[1].Id, markets[2].Id},
				IncompleteTask: proto.Bool(true),
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength: 3,
			wantIDs:    []int64{episode3ID, episode4ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 3,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "sorts episodes by care phase and discharged_at/admitted_at",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId: []int64{markets[3].Id},
			},
			useAuth:     true,
			userMarkets: markets,

			wantLength:   5,
			wantIDsOrder: []int64{episode9ID, episode6ID, episode8ID, episode7ID, episode10ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 5,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "returns only episodes from markets assigned to the user",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId: []int64{markets[0].Id, markets[1].Id, markets[2].Id, markets[3].Id},
			},
			useAuth:     true,
			userMarkets: []*marketpb.Market{markets[0], markets[1], markets[2]},

			wantLength: 5,
			wantIDs:    []int64{episode1ID, episode2ID, episode4ID, episode5ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 5,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name:        "returns episodes from all markets assigned to the user if no market_id filter is provided",
			request:     &caremanagerpb.GetEpisodesRequest{},
			useAuth:     true,
			userMarkets: []*marketpb.Market{markets[0], markets[2]},

			wantLength: 3,
			wantIDs:    []int64{episode1ID, episode2ID, episode4ID},
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 3,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name:        "returns no episodes if user has no markets assigned",
			request:     &caremanagerpb.GetEpisodesRequest{},
			useAuth:     true,
			userMarkets: []*marketpb.Market{},

			wantLength: 0,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 0,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "returns no episodes if user has no markets assigned (even if requested)",
			request: &caremanagerpb.GetEpisodesRequest{
				MarketId: []int64{markets[0].Id, markets[1].Id, markets[2].Id, markets[3].Id},
			},
			useAuth:     true,
			userMarkets: []*marketpb.Market{},

			wantLength: 0,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 0,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name:             "fails because the market service returns an error",
			request:          &caremanagerpb.GetEpisodesRequest{},
			useAuth:          true,
			userMarketsError: errors.New("market service err"),

			wantErrMsg: "market service err",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: testCase.userMarkets,
					},
					GetAuthenticatedUserMarketsErr: testCase.userMarketsError,
				},
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}
			resp, err := grpcServer.GetEpisodes(testCtx, testCase.request)
			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("GetEpisodes returned an error %s", err.Error())
			}
			if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			} else if testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			}

			if testCase.wantEpisodesResponse != nil {
				mustMatchEpisodeResponse(t, testCase.wantEpisodesResponse, resp.Episodes)
			}

			if resp != nil {
				testutils.MustMatch(t, testCase.wantLength, len(resp.Episodes))
				testutils.MustMatch(t, testCase.wantPaginationValues, resp.Meta)
			}
		})
	}
}

func CreateTestTaskTemplates(
	t *testing.T, numberOfNeededTemplates int,
	testPrefix string,
	serviceLine *caremanagerdb.ServiceLine,
	carePhase *caremanagerdb.CarePhase,
	userID int64,
) []*caremanagerdb.TaskTemplate {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	taskType, err := getDefaultTaskType(ctx, db)
	if err != nil {
		t.Fatal(err)
	}

	var createdTaskTemplates []*caremanagerdb.TaskTemplate
	for i := 0; i < numberOfNeededTemplates; i++ {
		taskTemplate, err := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{
			Name:            "Testing Template" + testPrefix + strconv.Itoa(i),
			ServiceLineID:   serviceLine.ID,
			CarePhaseID:     sqltypes.ToNullInt64(&carePhase.ID),
			CreatedByUserID: userID,
		})
		if err != nil {
			t.Fatalf("CreateEpisode returned an error %s", err.Error())
		}
		createdTaskTemplates = append(createdTaskTemplates, taskTemplate)
		_, err = db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{
			Body:       "Task test",
			TypeID:     taskType.ID,
			TemplateID: taskTemplate.ID,
		})
		if err != nil {
			t.Fatalf("CreateTemplateTask returned an error %s", err.Error())
		}
	}
	return createdTaskTemplates
}

func TestGetTaskTemplates(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	testPrefix := strconv.FormatInt(time.Now().UnixNano(), 10)
	templatesToCreate := 6

	highAcuityCarePhase, err := db.queries.GetCarePhaseByName(ctx, "High Acuity")
	if err != nil {
		t.Fatal(err)
	}
	transitionHighCarePhase, err := db.queries.GetCarePhaseByName(ctx, "Transition - High")
	if err != nil {
		t.Fatal(err)
	}
	serviceLines, err := db.queries.GetServiceLines(ctx)
	if err != nil {
		t.Fatal(err)
	}

	user := &caremanagerpb.User{Id: time.Now().UnixNano()}

	CreateTestTaskTemplates(t, templatesToCreate/2, testPrefix, serviceLines[0], highAcuityCarePhase, user.Id)
	CreateTestTaskTemplates(t, templatesToCreate/2, testPrefix, serviceLines[1], transitionHighCarePhase, user.Id)

	var wantTemplatesResponse []*caremanagerpb.TaskTemplate
	var wantTemplatesResponseAmount = templatesToCreate - 1
	for i := 0; i < wantTemplatesResponseAmount; i++ {
		carePhase := highAcuityCarePhase
		serviceLine := serviceLines[0]
		if i >= templatesToCreate/2 {
			carePhase = transitionHighCarePhase
			serviceLine = serviceLines[1]
		}
		wantTemplatesResponse = append(wantTemplatesResponse, &caremanagerpb.TaskTemplate{
			ServiceLineId:   serviceLine.ID,
			CarePhase:       CarePhaseProtoFromCarePhaseSQL(carePhase),
			TasksCount:      1,
			UpdatedByUserId: user.Id,
		})
	}

	templateToDelete := CreateTestTaskTemplates(t, 1, testPrefix, serviceLines[1], transitionHighCarePhase, user.Id)
	if _, err := db.queries.DeleteTaskTemplate(ctx, templateToDelete[0].ID); err != nil {
		t.Fatalf("DeleteTaskTemplate returned an error %s", err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.GetTaskTemplatesRequest
		useAuth bool

		wantErrMsg            string
		wantReturnLength      int
		wantPaginationValues  *caremanagerpb.PageInfo
		wantTemplatesResponse []*caremanagerpb.TaskTemplate
	}{
		{
			name: "works (with ordering)",
			request: &caremanagerpb.GetTaskTemplatesRequest{
				Name:          &testPrefix,
				SortBy:        proto.String("updated_at"),
				SortDirection: proto.String("asc"),
			},
			useAuth: true,

			wantReturnLength: 5,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 6,
				TotalPages:   2,
				NextPage:     proto.Int64(2),
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(false),
			},

			wantTemplatesResponse: wantTemplatesResponse,
		},
		{
			name: "works (with different page size)",
			request: &caremanagerpb.GetTaskTemplatesRequest{
				Name:     &testPrefix,
				PageSize: proto.Int64(10),
			},
			useAuth: true,

			wantReturnLength: 6,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     10,
				CurrentPage:  1,
				TotalResults: 6,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (with different starting page)",
			request: &caremanagerpb.GetTaskTemplatesRequest{
				Name: &testPrefix,
				Page: proto.Int64(2),
			},
			useAuth: true,

			wantReturnLength: 1,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  2,
				TotalResults: 6,
				TotalPages:   2,
				PreviousPage: proto.Int64(1),
				FirstPage:    proto.Bool(false),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (filters by care_phase_id)",
			request: &caremanagerpb.GetTaskTemplatesRequest{
				Name:        &testPrefix,
				CarePhaseId: []int64{highAcuityCarePhase.ID},
			},
			useAuth: true,

			wantReturnLength: 3,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 3,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (filters by service_line_id)",
			request: &caremanagerpb.GetTaskTemplatesRequest{
				Name:          &testPrefix,
				ServiceLineId: []int64{serviceLines[1].ID},
			},
			useAuth: true,

			wantReturnLength: 3,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 3,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.GetTaskTemplates(testCtx, testCase.request)
			if testCase.wantErrMsg == "" && resp.TaskTemplates == nil {
				t.Fatalf("GetTaskTemplates returned a bad response")
			}

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			if testCase.wantTemplatesResponse != nil {
				mustMatchTemplateResponse(t, testCase.wantTemplatesResponse, resp.TaskTemplates, "GetTaskTemplates response does not match the expected response")
			}

			if resp != nil {
				testutils.MustMatch(
					t,
					testCase.wantReturnLength,
					len(resp.TaskTemplates),
					"GetTaskTemplates returned a different expected number of templates",
				)
				testutils.MustMatch(t, testCase.wantPaginationValues, resp.Meta, "GetTaskTemplates returned a different expected PageInfo data")
			}
		})
	}
}

func TestGetEpisode(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := metadata.NewIncomingContext(
		ctx,
		metadata.Pairs("authorization", "Bearer faketoken"),
	)

	nonExistentEpisodeID := time.Now().UnixNano()
	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	createdEpisode := createTestEpisodeResult.episode
	patient := createTestEpisodeResult.patient
	carePhase := createTestEpisodeResult.carePhase
	serviceLine := createTestEpisodeResult.serviceLine
	market := createTestEpisodeResult.market

	createTestEpisodeResult, err = createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	patientEpisodeWithAllRelations := createTestEpisodeResult.patient
	episodeWithAllRelations := createTestEpisodeResult.episode
	user := &caremanagerpb.User{Id: time.Now().UnixNano()}
	task, taskType, err := createTestTask(ctx, db, &testTaskParams{episode: episodeWithAllRelations, user: user})
	if err != nil {
		t.Fatal(err.Error())
	}
	taskWithoutUser, _, err := createTestTask(ctx, db, &testTaskParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	oldestAndPinnedNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations, pinned: true})
	if err != nil {
		t.Fatal(err.Error())
	}
	oldNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	recentNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	noteWithUser, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations, createdByUser: user, lastUpdatedByUser: user})
	if err != nil {
		t.Fatal(err.Error())
	}
	taskTemplate, _, err := createTestTaskTemplate(ctx, db, serviceLine)
	if err != nil {
		t.Fatal(err.Error())
	}
	_, err = db.queries.CreateEpisodeTaskTemplate(ctx, caremanagerdb.CreateEpisodeTaskTemplateParams{
		EpisodeID:      episodeWithAllRelations.ID,
		TaskTemplateID: taskTemplate.ID,
	})
	if err != nil {
		t.Fatal(err.Error())
	}

	testCases := []struct {
		name             string
		request          *caremanagerpb.GetEpisodeRequest
		mockGetUserError error
		context          context.Context

		wantErrMsg     string
		want           *caremanagerpb.GetEpisodeResponse
		wantNotesOrder []int64
	}{
		{
			name: "works",
			request: &caremanagerpb.GetEpisodeRequest{
				EpisodeId: createdEpisode.ID,
			},
			context: ctxWithAuth,

			want: &caremanagerpb.GetEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: createdEpisode.PatientSummary,
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
				},
			},
		},
		{
			name: "works for episode with all its optional related entities",
			request: &caremanagerpb.GetEpisodeRequest{
				EpisodeId: episodeWithAllRelations.ID,
			},
			context: ctxWithAuth,

			want: &caremanagerpb.GetEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: episodeWithAllRelations.PatientSummary,
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patientEpisodeWithAllRelations.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
					Tasks: []*caremanagerpb.Task{
						TaskProtoFromTaskSQL(task, taskType),
						TaskProtoFromTaskSQL(taskWithoutUser, taskType),
					},
					Notes: []*caremanagerpb.Note{
						NoteProtoFromNoteSQL(oldestAndPinnedNote),
						NoteProtoFromNoteSQL(noteWithUser),
						NoteProtoFromNoteSQL(recentNote),
						NoteProtoFromNoteSQL(oldNote),
					},
					TaskTemplates: []*caremanagerpb.TaskTemplate{
						{
							Id:              taskTemplate.ID,
							Name:            taskTemplate.Name,
							TasksCount:      1,
							ServiceLineId:   serviceLine.ID,
							UpdatedByUserId: taskTemplate.LastUpdatedByUserID,
						},
					},
				},
			},
			wantNotesOrder: []int64{
				oldestAndPinnedNote.ID,
				noteWithUser.ID,
				recentNote.ID,
				oldNote.ID,
			},
		},
		{
			name: "fails due to not found episode",
			request: &caremanagerpb.GetEpisodeRequest{
				EpisodeId: nonExistentEpisodeID,
			},
			context: ctxWithAuth,

			wantErrMsg: "no rows in result set",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetMarketResult: &marketpb.GetMarketResponse{
						Market: mockedMarkets[0],
					},
				},
			})

			resp, err := grpcServer.GetEpisode(testCase.context, testCase.request)

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchEpisodeResponse(t, testCase.want, resp)

			if testCase.wantNotesOrder != nil {
				for i, n := range resp.Episode.Notes {
					testutils.MustMatch(t, testCase.wantNotesOrder[i], n.Id, "Notes response is in the incorrect order.")
				}
			}
		})
	}
}

func TestUpdateEpisode(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	ctxWithAuth := metadata.NewIncomingContext(
		ctx,
		metadata.Pairs("authorization", "Bearer faketoken"),
	)

	mockedMarketID := time.Now().UnixNano()
	defaultMarket := getDefaultMarket()
	carePhases, err := db.queries.GetCarePhases(ctx)
	if err != nil {
		t.Fatal(err.Error())
	}
	var pendingCarePhase *caremanagerdb.CarePhase
	var dischargedCarePhase *caremanagerdb.CarePhase
	var closedCarePhase *caremanagerdb.CarePhase
	for _, cp := range carePhases {
		if cp.Name == "Pending" {
			pendingCarePhase = cp
		}
		if cp.Name == "Discharged" {
			dischargedCarePhase = cp
		}
		if cp.Name == "Closed" {
			closedCarePhase = cp
		}
	}
	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatalf("Failed to create episode to test update: %s", err.Error())
	}
	episode, patient, carePhase, serviceLine, market := createTestEpisodeResult.episode, createTestEpisodeResult.patient, createTestEpisodeResult.carePhase, createTestEpisodeResult.serviceLine, createTestEpisodeResult.market
	createTestEpisodeResult, err = createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient: patient,
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episodeWithAllRelations := createTestEpisodeResult.episode
	user := &caremanagerpb.User{Id: time.Now().UnixNano()}
	task, taskType, err := createTestTask(ctx, db, &testTaskParams{episode: episodeWithAllRelations, user: user})
	if err != nil {
		t.Fatal(err.Error())
	}
	taskWithoutUser, _, err := createTestTask(ctx, db, &testTaskParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	oldestAndPinnedNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations, pinned: true})
	if err != nil {
		t.Fatal(err.Error())
	}
	oldNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	recentNote, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations})
	if err != nil {
		t.Fatal(err.Error())
	}
	noteWithUser, err := createTestNote(ctx, db, &testNoteParams{episode: episodeWithAllRelations, createdByUser: user, lastUpdatedByUser: user})
	if err != nil {
		t.Fatal(err.Error())
	}

	taskTemplate1, taskTemplate2, allTaskTemplateTasks, tasksProtosArray, err := createTaskTemplatesAndTasks(ctx, db, serviceLine)
	if err != nil {
		t.Fatal(err.Error())
	}
	taskTemplateIDs := []int64{taskTemplate2.ID, taskTemplate1.ID}

	testCases := []struct {
		name                        string
		request                     *caremanagerpb.UpdateEpisodeRequest
		shouldDischargedAtHaveValue bool
		getMarketErr                error
		useTaskTemplatesIDs         bool

		want           *caremanagerpb.UpdateEpisodeResponse
		wantErr        error
		wantErrMsg     string
		wantNotesOrder []int64
		wantTasksOrder []*caremanagerdb.TaskTemplateTask
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      episode.ID,
				PatientSummary: proto.String("Updated Summary"),
			},

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
				},
			},
		},
		{
			name: "works and returns the extra relations data when available",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      episodeWithAllRelations.ID,
				PatientSummary: proto.String("Updated Summary"),
			},

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(carePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
					Tasks: []*caremanagerpb.Task{
						TaskProtoFromTaskSQL(task, taskType),
						TaskProtoFromTaskSQL(taskWithoutUser, taskType),
					},
					Notes: []*caremanagerpb.Note{
						NoteProtoFromNoteSQL(oldestAndPinnedNote),
						NoteProtoFromNoteSQL(noteWithUser),
						NoteProtoFromNoteSQL(recentNote),
						NoteProtoFromNoteSQL(oldNote),
					},
				},
			},
			wantNotesOrder: []int64{
				oldestAndPinnedNote.ID,
				noteWithUser.ID,
				recentNote.ID,
				oldNote.ID,
			},
		},
		{
			name: "works: update carePhase to any other than discharged or closed",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      episode.ID,
				PatientSummary: proto.String("Updated Summary"),
				CarePhaseId:    &pendingCarePhase.ID,
			},

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(pendingCarePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
				},
			},
		},
		{
			name: "works: updates correctly discharged at when carePhase is Discharged",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      episode.ID,
				PatientSummary: proto.String("Updated Summary"),
				CarePhaseId:    &dischargedCarePhase.ID,
			},
			shouldDischargedAtHaveValue: true,

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(dischargedCarePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
				},
			},
		},
		{
			name: "works: unsets discharged at when carePhase is changed",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:   episode.ID,
				CarePhaseId: &pendingCarePhase.ID,
			},
			shouldDischargedAtHaveValue: false,

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId:    patient.ID,
					CarePhase:    CarePhaseProtoFromCarePhaseSQL(pendingCarePhase),
					Market:       &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:     market.Id,
					DischargedAt: nil,
				},
			},
		},
		{
			name: "works: updates correctly discharged at when carePhase is Closed",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      episode.ID,
				PatientSummary: proto.String("Updated Summary"),
				CarePhaseId:    &closedCarePhase.ID,
			},
			shouldDischargedAtHaveValue: true,

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(closedCarePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
				},
			},
		},
		{
			name: "works applying a task template",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:        episode.ID,
				ApplyTemplateIds: taskTemplateIDs,
			},
			shouldDischargedAtHaveValue: true,
			useTaskTemplatesIDs:         true,

			want: &caremanagerpb.UpdateEpisodeResponse{
				Episode: &caremanagerpb.Episode{
					PatientSummary: "Updated Summary",
					ServiceLineId:  serviceLine.ID,
					Patient: PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{
						medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
						insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
						pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
						externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
						externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
					}),
					PatientId: patient.ID,
					CarePhase: CarePhaseProtoFromCarePhaseSQL(closedCarePhase),
					Market:    &caremanagerpb.Market{Name: *market.Name, ShortName: *market.ShortName, TzName: *market.IanaTimeZoneName},
					MarketId:  market.Id,
					Tasks:     tasksProtosArray,
					TaskTemplates: []*caremanagerpb.TaskTemplate{
						{
							Id:              taskTemplate1.ID,
							CreatedAt:       taskTemplate1.CreatedAt.Format(timestampLayout),
							UpdatedAt:       taskTemplate1.UpdatedAt.Format(timestampLayout),
							Name:            taskTemplate1.Name,
							TasksCount:      3,
							ServiceLineId:   serviceLine.ID,
							UpdatedByUserId: taskTemplate1.LastUpdatedByUserID,
						},
						{
							Id:              taskTemplate2.ID,
							CreatedAt:       taskTemplate2.CreatedAt.Format(timestampLayout),
							UpdatedAt:       taskTemplate2.UpdatedAt.Format(timestampLayout),
							Name:            taskTemplate2.Name,
							TasksCount:      3,
							ServiceLineId:   serviceLine.ID,
							UpdatedByUserId: taskTemplate2.LastUpdatedByUserID,
						},
					},
				},
			},

			wantTasksOrder: allTaskTemplateTasks,
		},
		{
			name:    "fails: missing Episode ID",
			request: &caremanagerpb.UpdateEpisodeRequest{},

			wantErr: status.Error(codes.NotFound, "no Episode was found"),
		},
		{
			name: "fails: Episode does not exist",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId: -1,
			},

			wantErr: status.Error(codes.NotFound, "no Episode was found"),
		},
		{
			name: "fails if Care Phase does not exists",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:   episode.ID,
				CarePhaseId: proto.Int64(-1),
			},

			wantErrMsg: "insert or update on table \"episodes\" violates foreign key constraint \"episodes_care_phase_id_fkey\"",
		},
		{
			name: "fails if Service Line does not exists",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:     episode.ID,
				ServiceLineId: proto.Int64(-1),
			},

			wantErrMsg: "insert or update on table \"episodes\" violates foreign key constraint \"episodes_service_line_id_fkey\"",
		},
		{
			name: "fails if Market does not exists",
			request: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId: episode.ID,
				MarketId:  proto.Int64(mockedMarketID),
			},
			getMarketErr: errors.New("market does not exist"),
			wantErr:      status.Error(codes.NotFound, fmt.Sprintf("market not found, market_id: %d, error: market does not exist", mockedMarketID)),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetMarketResult: &marketpb.GetMarketResponse{
						Market: defaultMarket,
					},
					GetMarketErr: testCase.getMarketErr,
				},
			})

			resp, err := grpcServer.UpdateEpisode(ctxWithAuth, testCase.request)

			mustMatchEpisodeResponse(t, testCase.want, resp)
			if testCase.wantErrMsg != "" {
				mustContain(t, testCase.wantErrMsg, err.Error())
			} else {
				testutils.MustMatch(t, testCase.wantErr, err)
			}

			if testCase.useTaskTemplatesIDs {
				for _, task := range testCase.want.Episode.Tasks {
					task.TaskableId = resp.Episode.Id
				}
			}

			if testCase.wantNotesOrder != nil {
				for i, n := range resp.Episode.Notes {
					testutils.MustMatch(t, testCase.wantNotesOrder[i], n.Id, "Notes response is in the incorrect order.")
				}
			}
			if testCase.wantTasksOrder != nil && len(testCase.wantTasksOrder) > 0 {
				for i, task := range resp.Episode.Tasks {
					testutils.MustMatch(t, testCase.wantTasksOrder[i].Body, task.Task, "Tasks response is in the incorrect order.")
				}
			}
			if testCase.shouldDischargedAtHaveValue {
				if resp.Episode.DischargedAt == nil || resp.Episode.DischargedAt == proto.String("") {
					t.Fatal("discharged_at should have a value")
				}
			} else if resp != nil && resp.Episode.DischargedAt != nil {
				t.Fatal("discharged_at should be empty")
			}
		})
	}
}

func TestCreateEpisodeTasks(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctx = metadata.NewIncomingContext(
		ctx,
		metadata.Pairs("authorization", "Bearer faketoken"),
	)

	taskTypes, err := db.queries.GetAllTaskTypes(ctx)
	if err != nil {
		t.Fatal(err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateEpisodeTasksRequest

		want       *caremanagerpb.CreateEpisodeTasksResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "one", TaskType: taskTypes[0].Slug},
					{Task: "two", TaskType: taskTypes[1].Slug},
					{Task: "tree", TaskType: taskTypes[1].Slug},
				},
			},

			want: &caremanagerpb.CreateEpisodeTasksResponse{
				Tasks: []*caremanagerpb.Task{
					{Task: "one", TaskType: taskTypes[0].Slug, Status: legacyTaskStatusPending},
					{Task: "two", TaskType: taskTypes[1].Slug, Status: legacyTaskStatusPending},
					{Task: "tree", TaskType: taskTypes[1].Slug, Status: legacyTaskStatusPending},
				},
			},
		},
		{
			name: "correctly sets status as completed",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "the best task", TaskType: taskTypes[0].Slug, Status: proto.String(legacyTaskStatusCompleted)},
				},
			},

			want: &caremanagerpb.CreateEpisodeTasksResponse{
				Tasks: []*caremanagerpb.Task{
					{Task: "the best task", TaskType: taskTypes[0].Slug, Status: legacyTaskStatusCompleted},
				},
			},
		},
		{
			name: "sets status as pending if incorrect value is used",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "the best task", TaskType: taskTypes[0].Slug, Status: proto.String("nonexistent status")},
				},
			},

			want: &caremanagerpb.CreateEpisodeTasksResponse{
				Tasks: []*caremanagerpb.Task{
					{Task: "the best task", TaskType: taskTypes[0].Slug, Status: legacyTaskStatusPending},
				},
			},
		},
		{
			name: "fails if a nonexistent episode ID is provided",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				EpisodeId: -1,
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "the best task", TaskType: taskTypes[0].Slug},
				},
			},

			wantErrMsg: "ERROR: insert or update on table \"tasks\" violates foreign key constraint \"tasks_episode_id_fkey\" (SQLSTATE 23503)",
		},
		{
			name: "fails if description is empty",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "", TaskType: taskTypes[0].Slug},
				},
			},

			wantErrMsg: "task description can't be empty",
		},
		{
			name: "fails if nonexistent type is used",
			request: &caremanagerpb.CreateEpisodeTasksRequest{
				Tasks: []*caremanagerpb.CreateEpisodeTasksRequest_CreateEpisodeTask{
					{Task: "the best task", TaskType: "nonexistent type"},
				},
			},

			wantErrMsg: "task type not found: nonexistent type",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			if testCase.request.EpisodeId == 0 {
				createTestEpisode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
				if err != nil {
					t.Fatal(err.Error())
				}
				episode := createTestEpisode.episode
				testCase.request.EpisodeId = episode.ID

				if testCase.want != nil && testCase.want.Tasks != nil {
					for _, task := range testCase.want.Tasks {
						task.TaskableId = episode.ID
					}
				}
			}

			resp, err := grpcServer.CreateEpisodeTasks(
				ctx,
				testCase.request,
			)

			if err != nil {
				if testCase.wantErrMsg == "" {
					t.Fatalf("Could not fulfill the CreateEpisodeTasks request: %s", err)
				}
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchEpisodeResponse(t, testCase.want, resp)
		})
	}
}

func TestCreateEpisodeNote(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode := createTestEpisodeResult.episode

	mockUser := userpb.User{Id: time.Now().UnixNano()}

	testCases := []struct {
		name        string
		requestBody *caremanagerpb.CreateEpisodeNoteRequest
		useAuth     bool

		want       *caremanagerpb.CreateEpisodeNoteResponse
		wantErrMsg string
	}{
		{
			name: "works",
			requestBody: &caremanagerpb.CreateEpisodeNoteRequest{
				EpisodeId: episode.ID,
				Note: &caremanagerpb.CreateEpisodeNoteRequest_CreateEpisodeNote{
					Details:  "the best note",
					NoteKind: "general",
				},
			},
			useAuth: true,

			want: &caremanagerpb.CreateEpisodeNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "the best note",
					NoteKind:        "general",
					Pinned:          proto.Bool(false),
					NoteableId:      episode.ID,
					EpisodeId:       episode.ID,
					CreatedByUserId: proto.Int64(mockUser.Id),
				},
			},
		},
		{
			name: "fails because request has missing required fields (e.g. note_kind)",
			requestBody: &caremanagerpb.CreateEpisodeNoteRequest{
				EpisodeId: episode.ID,
				Note: &caremanagerpb.CreateEpisodeNoteRequest_CreateEpisodeNote{
					Details: "the best note",
				},
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = note.note_kind cannot be empty",
		},
		{
			name: "fails because note_kind is not a valid value",
			requestBody: &caremanagerpb.CreateEpisodeNoteRequest{
				EpisodeId: episode.ID,
				Note: &caremanagerpb.CreateEpisodeNoteRequest_CreateEpisodeNote{
					Details:  "the best note",
					NoteKind: "wrongkind",
				},
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = note kind wrongkind is not valid, use one of these options: general, daily_update, clinical, navigator",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &mockUser,
					},
				},
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.CreateEpisodeNote(
				testCtx,
				testCase.requestBody,
			)

			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("CreateEpisodeNote returned an error %s", err.Error())
			}

			mustMatchEpisodeResponse(t, testCase.want, resp)

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}
		})
	}
}

func TestCreatePatient(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	testCases := []struct {
		name    string
		request *caremanagerpb.CreatePatientRequest
		useAuth bool

		want       *caremanagerpb.CreatePatientResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "Male",
				DateOfBirth: "1998-01-30",
			},
			useAuth: true,

			want: &caremanagerpb.CreatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:      "John",
					LastName:       "Doe",
					Sex:            "Male",
					DateOfBirth:    "1998-01-30",
					PhoneNumber:    proto.String(""),
					AddressStreet:  proto.String(""),
					AddressCity:    proto.String(""),
					AddressState:   proto.String(""),
					AddressZipcode: proto.String(""),
				},
			},
		},
		{
			name: "works with optional request fields",
			request: &caremanagerpb.CreatePatientRequest{
				FirstName:                     "John",
				MiddleName:                    proto.String("Dean"),
				LastName:                      "Doe",
				Sex:                           "Male",
				DateOfBirth:                   "1998-01-30",
				PhoneNumber:                   proto.String("+523323844908"),
				AthenaMedicalRecordNumber:     proto.String("123"),
				MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
				Payer:                         proto.String("Insurance"),
				PreferredPharmacyDetails:      proto.String("Pharmacy"),
				DoctorDetails:                 proto.String("Doctor Details"),
				Referrer:                      proto.String("Referrer"),
				AddressStreet:                 proto.String("a street"),
				AddressStreet_2:               proto.String("a street 2"),
				AddressCity:                   proto.String("a city"),
				AddressState:                  proto.String("a state"),
				AddressZipcode:                proto.String("a zipcode"),
				AddressNotes:                  proto.String("patient notes"),
			},
			useAuth: true,

			want: &caremanagerpb.CreatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "John",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Male",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String("+523323844908"),
					AthenaMedicalRecordNumber:     proto.String("123"),
					AthenaId:                      proto.String("123"),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("Doctor Details"),
					Referrer:                      proto.String("Referrer"),
					AddressStreet:                 proto.String("a street"),
					AddressStreet_2:               proto.String("a street 2"),
					AddressCity:                   proto.String("a city"),
					AddressState:                  proto.String("a state"),
					AddressZipcode:                proto.String("a zipcode"),
					AddressNotes:                  proto.String("patient notes"),
				},
			},
		},
		{
			name: "allows date of birth as timestamp",
			request: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "Male",
				DateOfBirth: "1998-01-30T16:46:31.000Z",
			},
			useAuth: true,

			want: &caremanagerpb.CreatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:      "John",
					LastName:       "Doe",
					Sex:            "Male",
					DateOfBirth:    "1998-01-30",
					PhoneNumber:    proto.String(""),
					AddressStreet:  proto.String(""),
					AddressCity:    proto.String(""),
					AddressState:   proto.String(""),
					AddressZipcode: proto.String(""),
				},
			},
		},
		{
			name: "fails because request has missing required fields (e.g. last_name)",
			request: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "",
				Sex:         "Male",
				DateOfBirth: "1998-01-30T16:46:31.000Z",
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.last_name cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.CreatePatient(testCtx, testCase.request)

			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("CreatePatient returned an error %s", err.Error())
			}

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchPatientResponse(t, testCase.want, resp)
		})
	}
}

func TestGetPatient(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	patient, err := createTestPatient(ctx, db, createTestPatientParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	patientWithoutDependencies, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutMedicalDecisionMaker: true,
		withoutInsurance:            true,
		withoutPharmacy:             true,
		withoutExternalDoctor:       true,
		withoutExternalReferrer:     true,
	})
	if err != nil {
		t.Fatal(err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.GetPatientRequest

		want       *caremanagerpb.GetPatientResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.GetPatientRequest{
				PatientId: patient.ID,
			},

			want: &caremanagerpb.GetPatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:      "John",
					MiddleName:     proto.String("Dean"),
					LastName:       "Doe",
					DateOfBirth:    time.Now().Format(dateLayout),
					Sex:            "Male",
					PhoneNumber:    proto.String(""),
					AddressStreet:  proto.String(""),
					AddressCity:    proto.String(""),
					AddressState:   proto.String(""),
					AddressZipcode: proto.String(""),
				},
				MedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{
					{FirstName: "Doctor", PatientId: patient.ID},
				},
				Insurances: []*caremanagerpb.Insurance{
					{Name: "Insurance", PatientId: patient.ID},
				},
				Pharmacies: []*caremanagerpb.Pharmacy{
					{Name: "Pharmacy", PatientId: patient.ID},
				},
				ExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{Name: "External Doctor", ProviderTypeId: 2, PatientId: patient.ID},
					{Name: "External Referrer", ProviderTypeId: 3, PatientId: patient.ID},
				},
			},
		},
		{
			name: "works for a patient without dependencies",
			request: &caremanagerpb.GetPatientRequest{
				PatientId: patientWithoutDependencies.ID,
			},

			want: &caremanagerpb.GetPatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:      "John",
					MiddleName:     proto.String("Dean"),
					LastName:       "Doe",
					DateOfBirth:    time.Now().Format(dateLayout),
					Sex:            "Male",
					PhoneNumber:    proto.String(""),
					AddressStreet:  proto.String(""),
					AddressCity:    proto.String(""),
					AddressState:   proto.String(""),
					AddressZipcode: proto.String(""),
				},
				MedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{},
				Insurances:            []*caremanagerpb.Insurance{},
				Pharmacies:            []*caremanagerpb.Pharmacy{},
				ExternalCareProviders: []*caremanagerpb.ExternalCareProvider{},
			},
		},
		{
			name: "fails if patient doesn't exists",
			request: &caremanagerpb.GetPatientRequest{
				PatientId: 0,
			},

			wantErrMsg: "no rows in result set",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.GetPatient(ctx, testCase.request)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchPatientResponse(t, testCase.want, resp)
		})
	}
}

func TestGetPatients(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	nameSuffix := strconv.FormatInt(time.Now().UnixNano(), 10)

	patientsToCreate := 6
	for i := 0; i < patientsToCreate; i++ {
		_, err := createTestPatient(ctx, db, createTestPatientParams{
			customFirstName: "John" + nameSuffix + strconv.Itoa(i),
			customLastName:  "Doe" + nameSuffix + strconv.Itoa(i),
		})
		if err != nil {
			t.Fatal(err.Error())
		}
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.GetPatientsRequest
		useAuth bool

		wantErrMsg           string
		wantReturnLength     int
		wantPaginationValues *caremanagerpb.PageInfo
	}{
		{
			name: "works",
			request: &caremanagerpb.GetPatientsRequest{
				Name: "John" + nameSuffix,
			},

			wantReturnLength: 5,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 6,
				TotalPages:   2,
				NextPage:     proto.Int64(2),
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(false),
			},
		},
		{
			name: "works (With a existing name)",
			request: &caremanagerpb.GetPatientsRequest{
				Name: "John" + nameSuffix + "1",
			},
			useAuth: true,

			wantReturnLength: 1,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 1,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With a existing lastname)",
			request: &caremanagerpb.GetPatientsRequest{
				Name: "Doe" + nameSuffix + "1",
			},
			useAuth: true,

			wantReturnLength: 1,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 1,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With a non-existing name)",
			request: &caremanagerpb.GetPatientsRequest{
				Name: "Name",
			},
			useAuth: true,

			wantReturnLength: 0,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  1,
				TotalResults: 0,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With different page size)",
			request: &caremanagerpb.GetPatientsRequest{
				Name:     "John" + nameSuffix,
				PageSize: proto.Int64(10),
			},
			useAuth: true,

			wantReturnLength: 6,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     10,
				CurrentPage:  1,
				TotalResults: 6,
				TotalPages:   1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name: "works (With different starting page)",
			request: &caremanagerpb.GetPatientsRequest{
				Name: "John" + nameSuffix,
				Page: proto.Int64(2),
			},
			useAuth: true,

			wantReturnLength: 1,
			wantPaginationValues: &caremanagerpb.PageInfo{
				PageSize:     5,
				CurrentPage:  2,
				TotalResults: 6,
				TotalPages:   2,
				PreviousPage: proto.Int64(1),
				FirstPage:    proto.Bool(false),
				LastPage:     proto.Bool(true),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}
			resp, err := grpcServer.GetPatients(testCtx, testCase.request)
			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("GetPatients returned an error %s", err.Error())
			}

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			if resp != nil {
				testutils.MustMatch(
					t,
					len(resp.Patients),
					testCase.wantReturnLength,
					"GetPatients return a different expected number of patients",
				)
				testutils.MustMatch(t, resp.Meta, testCase.wantPaginationValues, "GetPatients return a different PageInfo data")
			}
		})
	}
}

func TestGetProviderTypes(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	testCases := []struct {
		name    string
		request *caremanagerpb.GetProviderTypesRequest

		wantFirstElement *caremanagerpb.ProviderType
		wantLength       int
		wantErrMsg       string
	}{
		{
			name:    "should work",
			request: &caremanagerpb.GetProviderTypesRequest{},

			wantFirstElement: &caremanagerpb.ProviderType{
				Id:   1,
				Name: "Other",
			},
			wantLength: 4,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.GetProviderTypes(ctx, testCase.request)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error())
			}

			testutils.MustMatch(t, testCase.wantFirstElement, resp.ProviderTypes[0])
			testutils.MustMatch(t, testCase.wantLength, len(resp.ProviderTypes))
		})
	}
}

func TestUpdateTask(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	mustMatchResponse := testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")

	taskTypes, _ := db.queries.GetAllTaskTypes(ctx)
	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatalf(err.Error())
	}
	episode := createTestEpisodeResult.episode

	testCases := []struct {
		name                      string
		request                   *caremanagerpb.UpdateTaskRequest
		testTaskShouldBeCompleted bool
		useAuth                   bool
		deletedTask               bool

		want       *caremanagerpb.UpdateTaskResponse
		wantErrMsg string
	}{
		{
			name: "updates task description and completed status",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "changed to a completed task",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusCompleted,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskResponse{
				Task: &caremanagerpb.Task{
					Task:              "changed to a completed task",
					TaskType:          taskTypes[1].Slug,
					TaskableId:        episode.ID,
					Status:            legacyTaskStatusCompleted,
					CompletedByUserId: proto.Int64(0),
				},
			},
		},
		{
			name: "updates a task description and pending status",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "changed to a pending task",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusPending,
			},
			testTaskShouldBeCompleted: true,
			useAuth:                   true,

			want: &caremanagerpb.UpdateTaskResponse{
				Task: &caremanagerpb.Task{
					Task:          "changed to a pending task",
					TaskType:      taskTypes[1].Slug,
					TaskableId:    episode.ID,
					Status:        legacyTaskStatusPending,
					LastUpdatedBy: nil,
				},
			},
		},
		{
			name: "updates task status as pending when invalid status is passed",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "changed to pending again",
				TaskType: taskTypes[1].Slug,
				Status:   "invalid",
			},
			testTaskShouldBeCompleted: true,
			useAuth:                   true,

			want: &caremanagerpb.UpdateTaskResponse{
				Task: &caremanagerpb.Task{
					Task:          "changed to pending again",
					TaskType:      taskTypes[1].Slug,
					TaskableId:    episode.ID,
					Status:        legacyTaskStatusPending,
					LastUpdatedBy: nil,
				},
			},
		},
		{
			name: "returns 'CompletedByUserId' as nil for a pending task",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "task that only the description got changed",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusPending,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskResponse{
				Task: &caremanagerpb.Task{
					Task:       "task that only the description got changed",
					TaskType:   taskTypes[1].Slug,
					TaskableId: episode.ID,
					Status:     legacyTaskStatusPending,
				},
			},
		},
		{
			name: "returns a valid 'CompletedByUserId' for a completed task",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "task that only the description got changed",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusCompleted,
			},
			testTaskShouldBeCompleted: true,
			useAuth:                   true,

			want: &caremanagerpb.UpdateTaskResponse{
				Task: &caremanagerpb.Task{
					Task:              "task that only the description got changed",
					TaskType:          taskTypes[1].Slug,
					TaskableId:        episode.ID,
					Status:            legacyTaskStatusCompleted,
					CompletedByUserId: proto.Int64(5),
				},
			},
		},
		{
			name: "fails if task description is empty",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusPending,
			},
			useAuth: true,

			wantErrMsg: `task description cannot be empty`,
		},
		{
			name: "fails if task type does not exist",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "",
				TaskType: "invalid",
				Status:   legacyTaskStatusPending,
			},
			useAuth: true,

			wantErrMsg: `could not find task type invalid`,
		},
		{
			name: "fails if task does not exist",
			request: &caremanagerpb.UpdateTaskRequest{
				TaskId:   -1,
				Task:     "task",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusPending,
			},
			useAuth: true,

			wantErrMsg: `no rows in result set`,
		},
		{
			name: "fails because the task is deleted",
			request: &caremanagerpb.UpdateTaskRequest{
				Task:     "changed to a completed task",
				TaskType: taskTypes[1].Slug,
				Status:   legacyTaskStatusCompleted,
			},
			useAuth:     true,
			deletedTask: true,

			wantErrMsg: "no rows in result set",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{},
					},
				},
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			var task *caremanagerdb.Task
			if testCase.request.TaskId == 0 {
				tasks, err := db.queries.CreateTasks(ctx, caremanagerdb.CreateTasksParams{
					Descriptions:      []string{"the best task"},
					AreTasksCompleted: []bool{testCase.testTaskShouldBeCompleted},
					EpisodeIds:        []int64{episode.ID},
					TaskTypeIds:       []int64{taskTypes[0].ID},
				})
				if err != nil {
					t.Fatal(err.Error())
				}
				task = tasks[0]
				testCase.request.TaskId = task.ID

				if testCase.testTaskShouldBeCompleted {
					_, err = db.queries.UpdateTask(ctx, caremanagerdb.UpdateTaskParams{
						ID:                task.ID,
						Description:       task.Description,
						IsCompleted:       true,
						TaskTypeID:        task.TaskTypeID,
						CompletedByUserID: sql.NullInt64{Int64: 5, Valid: true},
					})
					if err != nil {
						t.Fatal(err.Error())
					}
				}
			}
			if testCase.deletedTask {
				_, err = db.queries.DeleteTask(ctx, testCase.request.TaskId)
				if err != nil {
					t.Fatal(err.Error())
				}
			}

			resp, err := grpcServer.UpdateTask(testCtx, testCase.request)

			if testCase.wantErrMsg == "" {
				if resp == nil {
					t.Fatalf("Update task returned a bad response: %s", err.Error())
				}
			} else if err == nil {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			}
			mustMatchResponse(t, testCase.want, resp)
		})
	}
}

func TestUpdateTaskTemplate(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	_, carePhases, serviceLines := getCurrentConfig(ctx, t, db)
	taskTemplate, _ := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{
		Name: "old name",
		Summary: sql.NullString{
			String: "old summary",
			Valid:  true,
		},
		ServiceLineID: serviceLines[0].ID,
		CarePhaseID: sql.NullInt64{
			Int64: carePhases[0].ID,
			Valid: true,
		},
	})
	deletedTaskTemplate, _ := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{
		Name: "deleted task template",
		Summary: sql.NullString{
			String: "deleted summary",
			Valid:  true,
		},
		ServiceLineID: serviceLines[0].ID,
		CarePhaseID: sql.NullInt64{
			Int64: carePhases[0].ID,
			Valid: true,
		},
	})
	_, _ = db.queries.DeleteTaskTemplate(ctx, deletedTaskTemplate.ID)
	taskTypes, _ := db.queries.GetTaskTypesBySlug(ctx, []string{"nurse_navigator"})
	taskType := taskTypes[0]
	task, _ := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{
		Body:       "task body",
		TypeID:     taskType.ID,
		TemplateID: taskTemplate.ID,
	})

	taskToDelete, _ := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{
		Body:       "deleted task body",
		TypeID:     taskType.ID,
		TemplateID: taskTemplate.ID,
	})
	_, _ = db.queries.DeleteTaskTemplateTask(ctx, caremanagerdb.DeleteTaskTemplateTaskParams{
		ID:         taskToDelete.ID,
		TemplateID: taskTemplate.ID,
	})
	newTaskBody := "a newly created task body"
	newTask := []*caremanagerpb.UpdateTaskTemplateRequest_UpdateTaskTemplateTask{
		{
			Body:       &newTaskBody,
			TaskTypeId: &taskType.ID,
		},
	}
	updatedTaskBody := "a newly updated task body"
	updateTask := []*caremanagerpb.UpdateTaskTemplateRequest_UpdateTaskTemplateTask{
		{
			Id:         &task.ID,
			Body:       &updatedTaskBody,
			TaskTypeId: &taskType.ID,
		},
	}
	updateDeleteTask := []*caremanagerpb.UpdateTaskTemplateRequest_UpdateTaskTemplateTask{
		{
			Id:         &taskToDelete.ID,
			Body:       &updatedTaskBody,
			TaskTypeId: &taskType.ID,
		},
	}
	destroyTask := true
	deleteTask := []*caremanagerpb.UpdateTaskTemplateRequest_UpdateTaskTemplateTask{
		{
			Id:      &task.ID,
			Destroy: &destroyTask,
		},
	}
	updatedSummary := "new summary"
	updatedName := "new name"

	mockedLastUpdatedByUserID := time.Now().UnixNano()

	testCases := []struct {
		name             string
		request          *caremanagerpb.UpdateTaskTemplateRequest
		useAuth          bool
		userServiceError error

		want       *caremanagerpb.UpdateTaskTemplateResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				TemplateId:    taskTemplate.ID,
				Name:          &updatedName,
				Summary:       &updatedSummary,
				ServiceLineId: &serviceLines[1].ID,
				CarePhaseId:   &carePhases[1].ID,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Id:              taskTemplate.ID,
					CreatedAt:       "1/1/2021",
					UpdatedAt:       "1/1/2021",
					Name:            updatedName,
					TasksCount:      1,
					Summary:         &updatedSummary,
					ServiceLineId:   serviceLines[1].ID,
					CarePhase:       CarePhaseProtoFromCarePhaseSQL(carePhases[1]),
					UpdatedByUserId: mockedLastUpdatedByUserID,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Id:   task.ID,
							Body: task.Body,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "works with minimal data",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				TemplateId:    taskTemplate.ID,
				Name:          &updatedName,
				ServiceLineId: &serviceLines[0].ID,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Id:              taskTemplate.ID,
					CreatedAt:       "1/1/2021",
					UpdatedAt:       "1/1/2021",
					Name:            updatedName,
					TasksCount:      1,
					ServiceLineId:   serviceLines[0].ID,
					CarePhase:       CarePhaseProtoFromCarePhaseSQL(carePhases[1]),
					UpdatedByUserId: mockedLastUpdatedByUserID,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Id:   task.ID,
							Body: task.Body,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "fails updating a deleted task template task",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				Name:          &updatedName,
				ServiceLineId: &serviceLines[1].ID,
				Tasks:         updateDeleteTask,
				TemplateId:    taskTemplate.ID,
			},
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
		{
			name: "fails because is a deleted task template",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				TemplateId:    deletedTaskTemplate.ID,
				Name:          &updatedName,
				ServiceLineId: &serviceLines[0].ID,
			},
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
		{
			name: "works creating a new task",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				Name:          &updatedName,
				ServiceLineId: &serviceLines[1].ID,
				Tasks:         newTask,
				TemplateId:    taskTemplate.ID,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Id:              taskTemplate.ID,
					CreatedAt:       "1/1/2021",
					UpdatedAt:       "1/1/2021",
					Name:            updatedName,
					TasksCount:      2,
					ServiceLineId:   serviceLines[1].ID,
					UpdatedByUserId: mockedLastUpdatedByUserID,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Id:   task.ID,
							Body: task.Body,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
						{
							Id:   task.ID + 2,
							Body: newTaskBody,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "works updating a task",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				Name:          &updatedName,
				ServiceLineId: &serviceLines[1].ID,
				Tasks:         updateTask,
				TemplateId:    taskTemplate.ID,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Id:              taskTemplate.ID,
					CreatedAt:       "1/1/2021",
					UpdatedAt:       "1/1/2021",
					Name:            updatedName,
					TasksCount:      2,
					ServiceLineId:   serviceLines[1].ID,
					UpdatedByUserId: mockedLastUpdatedByUserID,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Id:   task.ID,
							Body: updatedTaskBody,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
						{
							Id:   task.ID + 2,
							Body: newTaskBody,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "works deleting a task",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				Name:          &updatedName,
				ServiceLineId: &serviceLines[1].ID,
				Tasks:         deleteTask,
				TemplateId:    taskTemplate.ID,
			},
			useAuth: true,

			want: &caremanagerpb.UpdateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Id:              taskTemplate.ID,
					CreatedAt:       "1/1/2021",
					UpdatedAt:       "1/1/2021",
					Name:            updatedName,
					TasksCount:      1,
					ServiceLineId:   serviceLines[1].ID,
					UpdatedByUserId: mockedLastUpdatedByUserID,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Id:   task.ID + 2,
							Body: newTaskBody,
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "fails because request has missing required fields (e.g. service line)",
			request: &caremanagerpb.UpdateTaskTemplateRequest{
				TemplateId:  taskTemplate.ID,
				Name:        &updatedName,
				Summary:     &updatedSummary,
				CarePhaseId: &carePhases[1].ID,
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = task_template.service_line_id cannot be empty",
		},
		{
			name:             "fails because the user service errors",
			request:          &caremanagerpb.UpdateTaskTemplateRequest{},
			useAuth:          true,
			userServiceError: errors.New("user service error"),

			wantErrMsg: "user service error",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{Id: mockedLastUpdatedByUserID},
					},
					GetAuthenticatedUserErr: testCase.userServiceError,
				},
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}
			resp, err := grpcServer.UpdateTaskTemplate(
				testCtx,
				testCase.request,
			)

			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("UpdateTaskTemplate returned an error %s", err.Error())
			}
			if err == nil {
				if testCase.wantErrMsg != "" {
					t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
				}
				if testCase.want != nil {
					testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, testCase.want.TaskTemplate, resp.TaskTemplate, "Response did not match expected result")
				}
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}
		})
	}
}

func TestUpdateNote(t *testing.T) {
	matcherWithoutTimestamps := testutils.MustMatchProtoFn("created_at", "updated_at", "noteable_id", "episode_id", "id")
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatalf("Failed creating test episode: %s", err)
	}
	createdEpisode := createTestEpisodeResult.episode

	mockCreatedByUserID := time.Now().UnixNano()
	mockUpdatedByUserID := mockCreatedByUserID + 1

	defaultPinned := false

	testCases := []struct {
		name                      string
		request                   *caremanagerpb.UpdateNoteRequest
		deleted                   bool
		useAuth                   bool
		getAuthenticatedUserError error

		want       *caremanagerpb.UpdateNoteResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String("Some details for a note"),
				NoteKind: proto.String("general"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdateNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "Some details for a note",
					NoteKind:        "general",
					NoteableId:      0,
					EpisodeId:       0,
					Pinned:          &defaultPinned,
					CreatedByUserId: proto.Int64(5),
					UpdatedByUserId: &mockUpdatedByUserID,
				},
			},
		},
		{
			name: "returns previous value for details if empty string is passed",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String(""),
				NoteKind: proto.String("general"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdateNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "defaultBody",
					NoteKind:        "general",
					NoteableId:      0,
					EpisodeId:       0,
					Pinned:          &defaultPinned,
					CreatedByUserId: proto.Int64(5),
					UpdatedByUserId: &mockUpdatedByUserID,
				},
			},
		},
		{
			name: "returns previous value for kind if empty string is passed",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String("details"),
				NoteKind: proto.String(""),
			},
			useAuth: true,

			want: &caremanagerpb.UpdateNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "details",
					NoteKind:        "navigator",
					NoteableId:      0,
					EpisodeId:       0,
					Pinned:          &defaultPinned,
					CreatedByUserId: proto.Int64(5),
					UpdatedByUserId: &mockUpdatedByUserID,
				},
			},
		},
		{
			name:    "returns previous values if optional fields are not passed",
			request: &caremanagerpb.UpdateNoteRequest{},
			useAuth: true,

			want: &caremanagerpb.UpdateNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "defaultBody",
					NoteKind:        "navigator",
					NoteableId:      0,
					EpisodeId:       0,
					Pinned:          &defaultPinned,
					CreatedByUserId: proto.Int64(5),
					UpdatedByUserId: &mockUpdatedByUserID,
				},
			},
		},
		{
			name: "fails if request has a non-valid kind",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String("details"),
				NoteKind: proto.String("not_found"),
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = note kind not_found is not valid, use one of these options: general, daily_update, clinical, navigator",
		},
		{
			name: "fails if note has been deleted",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String("Deleted note"),
				NoteKind: proto.String("general"),
			},
			deleted: true,
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
		{
			name: "fails if the user service errors",
			request: &caremanagerpb.UpdateNoteRequest{
				Details:  proto.String("details"),
				NoteKind: proto.String("general"),
			},
			useAuth:                   true,
			getAuthenticatedUserError: errors.New("user service error"),

			wantErrMsg: "user service error",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{Id: mockUpdatedByUserID},
					},
					GetAuthenticatedUserErr: testCase.getAuthenticatedUserError,
				},
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			defaultNote := caremanagerdb.CreateNoteParams{
				Body:      "defaultBody",
				Kind:      3,
				EpisodeID: sqltypes.ToValidNullInt64(createdEpisode.ID),
				CreatedByUserID: sql.NullInt64{
					Int64: 5,
					Valid: true,
				},
			}
			createdNote, err := grpcServer.CaremanagerDB.queries.CreateNote(testCtx, defaultNote)
			if err != nil {
				t.Fatalf("Failed creating test note: %s", err)
			}

			if testCase.deleted {
				_, err := grpcServer.CaremanagerDB.queries.DeleteNote(testCtx, createdNote.ID)

				if err != nil {
					t.Fatalf("Failed deleting test note: %s", err)
				}
			}

			testCase.request.NoteId = createdNote.ID
			resp, err := grpcServer.UpdateNote(
				testCtx,
				testCase.request,
			)

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			}
			if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}
			if resp != nil {
				if resp.Note == nil {
					t.Fatal("UpdateNote returned a bad response")
				}
				if resp.Note.Id != testCase.request.NoteId {
					t.Fatalf("UpdateNote passed the wrong id: %d", resp.Note.Id)
				}
				if testCase.want != nil {
					matcherWithoutTimestamps(t, resp.Note, testCase.want.Note, "Expected Response did not match")
				}
			}
		})
	}
}

func TestUpdatePatient(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	testCases := []struct {
		name                        string
		request                     *caremanagerpb.UpdatePatientRequest
		withoutMedicalDecisionMaker bool
		withoutInsurance            bool
		withoutPharmacy             bool
		withoutExternalDoctor       bool
		withoutExternalReferrer     bool
		useAuth                     bool

		want       *caremanagerpb.UpdatePatientResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "Jane",
				LastName:    "Doe",
				Sex:         "Female",
				DateOfBirth: "1998-01-30",
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "creates new medical decision maker",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:                     "Jane",
				LastName:                      "Doe",
				Sex:                           "Female",
				DateOfBirth:                   "1998-01-30",
				MedicalPowerOfAttorneyDetails: proto.String("created"),
			},
			withoutMedicalDecisionMaker: true,
			useAuth:                     true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("created"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "updates the existing medical decision maker",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:                     "Jane",
				LastName:                      "Doe",
				Sex:                           "Female",
				DateOfBirth:                   "1998-01-30",
				MedicalPowerOfAttorneyDetails: proto.String("updated"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("updated"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "creates new insurance",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "Jane",
				LastName:    "Doe",
				Sex:         "Female",
				DateOfBirth: "1998-01-30",
				Payer:       proto.String("created"),
			},
			withoutInsurance: true,
			useAuth:          true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("created"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "updates the existing insurance",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "Jane",
				LastName:    "Doe",
				Sex:         "Female",
				DateOfBirth: "1998-01-30",
				Payer:       proto.String("updated"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("updated"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "creates new pharmacy",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:                "Jane",
				LastName:                 "Doe",
				Sex:                      "Female",
				DateOfBirth:              "1998-01-30",
				PreferredPharmacyDetails: proto.String("created"),
			},
			withoutPharmacy: true,
			useAuth:         true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("created"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "updates the existing pharmacy",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:                "Jane",
				LastName:                 "Doe",
				Sex:                      "Female",
				DateOfBirth:              "1998-01-30",
				PreferredPharmacyDetails: proto.String("updated"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("updated"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "creates new external doctor",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:     "Jane",
				LastName:      "Doe",
				Sex:           "Female",
				DateOfBirth:   "1998-01-30",
				DoctorDetails: proto.String("created"),
			},
			withoutExternalDoctor: true,
			useAuth:               true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("created"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "updates the existing external doctor",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:     "Jane",
				LastName:      "Doe",
				Sex:           "Female",
				DateOfBirth:   "1998-01-30",
				DoctorDetails: proto.String("updated"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("updated"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "creates new external referrer",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "Jane",
				LastName:    "Doe",
				Sex:         "Female",
				DateOfBirth: "1998-01-30",
				Referrer:    proto.String("created"),
			},
			withoutExternalReferrer: true,
			useAuth:                 true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("created"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "updates the existing external referrer",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "Jane",
				LastName:    "Doe",
				Sex:         "Female",
				DateOfBirth: "1998-01-30",
				Referrer:    proto.String("updated"),
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "Jane",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Female",
					DateOfBirth:                   "1998-01-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("updated"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "allows date of birth as timestamp",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "Male",
				DateOfBirth: "1998-07-30T16:46:31.000Z",
			},
			useAuth: true,

			want: &caremanagerpb.UpdatePatientResponse{
				Patient: &caremanagerpb.Patient{
					FirstName:                     "John",
					MiddleName:                    proto.String("Dean"),
					LastName:                      "Doe",
					Sex:                           "Male",
					DateOfBirth:                   "1998-07-30",
					PhoneNumber:                   proto.String(""),
					MedicalPowerOfAttorneyDetails: proto.String("Doctor"),
					Payer:                         proto.String("Insurance"),
					PreferredPharmacyDetails:      proto.String("Pharmacy"),
					DoctorDetails:                 proto.String("External Doctor"),
					Referrer:                      proto.String("External Referrer"),
					AddressStreet:                 proto.String(""),
					AddressCity:                   proto.String(""),
					AddressState:                  proto.String(""),
					AddressZipcode:                proto.String(""),
				},
			},
		},
		{
			name: "fails because request has missing required fields (e.g. last_name)",
			request: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "John",
				LastName:    "",
				Sex:         "Male",
				DateOfBirth: "1998-01-30T16:46:31.000Z",
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.last_name cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			// Create patient in db to test update function
			createdPatient, err := createTestPatient(ctx, db, createTestPatientParams{
				withoutMedicalDecisionMaker: testCase.withoutMedicalDecisionMaker,
				withoutInsurance:            testCase.withoutInsurance,
				withoutPharmacy:             testCase.withoutPharmacy,
				withoutExternalDoctor:       testCase.withoutExternalDoctor,
				withoutExternalReferrer:     testCase.withoutExternalReferrer,
			})
			if err != nil {
				t.Fatalf(err.Error())
			}
			testCase.request.PatientId = createdPatient.ID

			resp, err := grpcServer.UpdatePatient(
				testCtx,
				testCase.request,
			)

			if testCase.wantErrMsg == "" {
				if err != nil {
					t.Fatalf("UpdatePatient failed: %s", err)
				}
			} else if testCase.wantErrMsg != "" && err == nil {
				t.Fatalf("No error thrown, expected: %s", testCase.wantErrMsg)
			}

			mustMatchPatientResponse(t, testCase.want, resp)
		})
	}
}

func TestDeleteTask(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	mockedTaskID := time.Now().UnixNano()

	task, _, err := createTestTask(ctx, db, &testTaskParams{})
	if err != nil {
		t.Fatal(err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.DeleteTaskRequest
		useAuth bool

		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.DeleteTaskRequest{
				TaskId: task.ID,
			},
			useAuth: true,
		},
		{
			name: "fails: Task does not exist",
			request: &caremanagerpb.DeleteTaskRequest{
				TaskId: mockedTaskID,
			},
			useAuth: true,

			wantErrMsg: `no rows in result set`,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.DeleteTask(testCtx, testCase.request)

			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("DeleteTask returned a bad response")
			}
			if testCase.wantErrMsg != "" {
				if err != nil {
					mustContain(t, testCase.wantErrMsg, err.Error())
				} else {
					t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
				}
			}
		})
	}
}

func TestDeleteTaskTemplate(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	_, carePhases, serviceLines := getCurrentConfig(ctx, t, db)

	createdTemplates := CreateTestTaskTemplates(t, 2, "to-delete", serviceLines[0], carePhases[0], time.Now().Unix())
	createdTemplate := createdTemplates[0]
	deletedTemplate := createdTemplates[1]
	if _, err := db.queries.DeleteTaskTemplate(ctx, deletedTemplate.ID); err != nil {
		t.Fatalf("DeleteTaskTemplate returned an error %s", err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.DeleteTaskTemplateRequest
		useAuth bool

		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.DeleteTaskTemplateRequest{
				TemplateId: createdTemplate.ID,
			},
			useAuth: true,
		},
		{
			name:    "fails: template has been deleted",
			request: &caremanagerpb.DeleteTaskTemplateRequest{TemplateId: deletedTemplate.ID},
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			_, err := grpcServer.DeleteTaskTemplate(testCtx, testCase.request)

			if testCase.wantErrMsg == "" && err != nil {
				t.Fatalf("DeleteTasktemplate failed")
			}
			if testCase.wantErrMsg != "" {
				if err != nil {
					mustContain(t, testCase.wantErrMsg, err.Error())
				} else {
					t.Fatalf("No error thrown, expected: %s", testCase.wantErrMsg)
				}
			}
		})
	}
}

func TestDeleteNote(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}
	note, err := createTestNote(ctx, db, &testNoteParams{episode: createTestEpisodeResult.episode})
	if err != nil {
		t.Fatal(err)
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.DeleteNoteRequest
		deleted bool
		useAuth bool

		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.DeleteNoteRequest{
				NoteId: note.ID,
			},
			useAuth: true,
		},
		{
			name: "fails: Note does not exist",
			request: &caremanagerpb.DeleteNoteRequest{
				NoteId: -1,
			},
			useAuth: true,

			wantErrMsg: `no rows in result set`,
		},
		{
			name: "works: note already deleted",
			request: &caremanagerpb.DeleteNoteRequest{
				NoteId: note.ID,
			},
			deleted: true,
			useAuth: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.DeleteNote(testCtx, testCase.request)
			if testCase.wantErrMsg == "" && resp == nil {
				t.Fatalf("DeleteNote returned a bad response")
			}
			if testCase.wantErrMsg != "" {
				if err != nil {
					mustContain(t, testCase.wantErrMsg, err.Error())
				} else {
					t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
				}
			}
		})
	}
}

func TestPinNote(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	patient, err := createTestPatient(ctx, db, createTestPatientParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient: patient,
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	baseEpisode := createTestEpisodeResult.episode
	note1, _ := createTestNote(ctx, db, &testNoteParams{episode: baseEpisode})

	createTestEpisodeResult, err = createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient: patient,
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	episodeWithMaxPinnedNotes := createTestEpisodeResult.episode

	_, _ = createTestNote(ctx, db, &testNoteParams{episode: episodeWithMaxPinnedNotes, pinned: true})
	_, _ = createTestNote(ctx, db, &testNoteParams{episode: episodeWithMaxPinnedNotes, pinned: true})
	note4, _ := createTestNote(ctx, db, &testNoteParams{episode: episodeWithMaxPinnedNotes, pinned: true})
	note5, _ := createTestNote(ctx, db, &testNoteParams{episode: episodeWithMaxPinnedNotes})

	mockCreatedByUser := &caremanagerpb.User{Id: time.Now().UnixNano()}
	mockLastUpdatedByUser := &caremanagerpb.User{Id: mockCreatedByUser.Id + 1}
	noteWithUser, _ := createTestNote(ctx, db, &testNoteParams{baseEpisode, false, mockCreatedByUser, mockLastUpdatedByUser})

	testCases := []struct {
		name    string
		request *caremanagerpb.PinNoteRequest
		useAuth bool
		deleted bool

		wantErrMsg string
		want       *caremanagerpb.PinNoteResponse
	}{
		{
			name: "works",
			request: &caremanagerpb.PinNoteRequest{
				NoteId: note1.ID,
			},
			useAuth: true,

			want: &caremanagerpb.PinNoteResponse{
				Note: &caremanagerpb.Note{
					Details:    note1.Body,
					NoteKind:   "general",
					NoteableId: note1.EpisodeID.Int64,
					EpisodeId:  note1.EpisodeID.Int64,
					Pinned:     proto.Bool(true),
				},
			},
		},
		{
			name: "works with note user",
			request: &caremanagerpb.PinNoteRequest{
				NoteId: noteWithUser.ID,
			},
			useAuth: true,

			want: &caremanagerpb.PinNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         noteWithUser.Body,
					NoteKind:        "general",
					NoteableId:      noteWithUser.EpisodeID.Int64,
					EpisodeId:       noteWithUser.EpisodeID.Int64,
					Pinned:          proto.Bool(true),
					CreatedByUserId: &mockCreatedByUser.Id,
					UpdatedByUserId: &mockLastUpdatedByUser.Id,
				},
			},
		},
		{
			name: "works with note already pinned",
			request: &caremanagerpb.PinNoteRequest{
				NoteId: note4.ID,
			},
			useAuth: true,

			want: &caremanagerpb.PinNoteResponse{
				Note: &caremanagerpb.Note{
					Details:    note4.Body,
					NoteKind:   "general",
					NoteableId: note4.EpisodeID.Int64,
					EpisodeId:  note4.EpisodeID.Int64,
					Pinned:     proto.Bool(true),
				},
			},
		},
		{
			name: "fails due to exceeding max pinned notes per episode",
			request: &caremanagerpb.PinNoteRequest{
				NoteId: note5.ID,
			},
			useAuth: true,

			wantErrMsg: "exceeded maximum of 3 pinned notes",
		},
		{
			name: "fails cannot pin deleted note",
			request: &caremanagerpb.PinNoteRequest{
				NoteId: note5.ID,
			},
			deleted: true,
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			if testCase.deleted {
				_, err := grpcServer.CaremanagerDB.queries.DeleteNote(testCtx, testCase.request.NoteId)

				if err != nil {
					t.Fatalf("Failed deleting test note: %s", err)
				}
			}

			resp, err := grpcServer.PinNote(
				testCtx,
				testCase.request,
			)

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}
			if resp != nil {
				mustMatchEpisodeResponse(t, testCase.want, resp)
			}
		})
	}
}

func TestUnpinNote(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	mockedFakeNoteID := time.Now().UnixNano()

	testNote, err := createTestNote(ctx, db, &testNoteParams{pinned: true})
	if err != nil {
		t.Fatalf(err.Error())
	}
	createdByUserID := &caremanagerpb.User{Id: time.Now().UnixNano()}
	lastUpdatedByUserID := &caremanagerpb.User{Id: createdByUserID.Id + 1}
	createTestEpisodeResult1, _ := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	testNoteWithUser, _ := createTestNote(ctx, db, &testNoteParams{episode: createTestEpisodeResult1.episode, pinned: true, createdByUser: createdByUserID, lastUpdatedByUser: lastUpdatedByUserID})
	createTestEpisodeResult2, _ := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	testDeletedNote, _ := createTestNote(ctx, db, &testNoteParams{episode: createTestEpisodeResult2.episode, createdByUser: createdByUserID, lastUpdatedByUser: lastUpdatedByUserID})

	_, _ = db.queries.DeleteNote(ctx, testDeletedNote.ID)

	testCases := []struct {
		name        string
		requestBody *caremanagerpb.UnpinNoteRequest
		deleted     bool
		useAuth     bool

		wantNoteID int64
		wantErrMsg string
		want       *caremanagerpb.UnpinNoteResponse
	}{
		{
			name: "works",
			requestBody: &caremanagerpb.UnpinNoteRequest{
				NoteId: testNote.ID,
			},
			useAuth: true,

			want: &caremanagerpb.UnpinNoteResponse{
				Note: &caremanagerpb.Note{
					Details:    testNote.Body,
					NoteKind:   "general",
					NoteableId: testNote.EpisodeID.Int64,
					EpisodeId:  testNote.EpisodeID.Int64,
					Pinned:     proto.Bool(false),
				},
			},
		},
		{
			name: "works with note user",
			requestBody: &caremanagerpb.UnpinNoteRequest{
				NoteId: testNoteWithUser.ID,
			},
			useAuth: true,

			wantNoteID: testNoteWithUser.ID,
			want: &caremanagerpb.UnpinNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         testNoteWithUser.Body,
					NoteKind:        "general",
					NoteableId:      testNoteWithUser.EpisodeID.Int64,
					EpisodeId:       testNoteWithUser.EpisodeID.Int64,
					Pinned:          proto.Bool(false),
					CreatedByUserId: &createdByUserID.Id,
					UpdatedByUserId: &lastUpdatedByUserID.Id,
				},
			},
		},
		{
			name: "fails if note doesn't exists",
			requestBody: &caremanagerpb.UnpinNoteRequest{
				NoteId: mockedFakeNoteID,
			},
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
		{
			name: "fails if the note is deleted",
			requestBody: &caremanagerpb.UnpinNoteRequest{
				NoteId: testDeletedNote.ID,
			},
			useAuth: true,

			wantErrMsg: "no rows in result set",
		},
		{
			name: "fails if cannot unpin deleted note",
			requestBody: &caremanagerpb.UnpinNoteRequest{
				NoteId: testDeletedNote.ID,
			},
			useAuth: true,

			wantErrMsg: `no rows in result set`,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			if testCase.deleted {
				_, err := grpcServer.CaremanagerDB.queries.DeleteNote(testCtx, testCase.requestBody.NoteId)

				if err != nil {
					t.Fatalf("Failed deleting test note: %s", err)
				}
			}

			resp, err := grpcServer.UnpinNote(
				testCtx,
				testCase.requestBody,
			)

			if err != nil && testCase.wantErrMsg == "" {
				t.Fatalf("Could not fulfill the UnpinNote request: %s", err)
			}
			if resp != nil {
				mustMatchEpisodeResponse(t, testCase.want, resp)
			}
		})
	}
}

func TestCreateTaskTemplate(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	carePhase, err := getDefaultCarePhase(ctx, db)
	if err != nil {
		t.Fatalf("Could not get default care_phase: %s", err)
	}
	serviceLine, err := getDefaultServiceLine(ctx, db)
	if err != nil {
		t.Fatalf("Could not get default service_line: %s", err)
	}

	taskType, _ := db.queries.GetTaskType(ctx, int64(4))

	mockedUser := userpb.User{
		Id:        1,
		FirstName: "User",
		LastName:  "McUser",
		Email:     "user@email.com",
		JobTitle:  proto.String("RN"),
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateTaskTemplateRequest
		useAuth bool

		want       *caremanagerpb.CreateTaskTemplateResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateTaskTemplateRequest{
				Name:          *proto.String("My Template"),
				Summary:       *proto.String("Summary"),
				ServiceLineId: serviceLine.ID,
				CarePhaseId:   &carePhase.ID,
				Tasks: []*caremanagerpb.CreateTemplateTask{
					{
						Body:       *proto.String("My Task"),
						TaskTypeId: taskType.ID,
					},
				},
			},
			useAuth: true,

			want: &caremanagerpb.CreateTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					CreatedAt:     "1/1/2021",
					UpdatedAt:     "1/1/2021",
					Name:          *proto.String("My Template"),
					TasksCount:    1,
					Summary:       proto.String("Summary"),
					ServiceLineId: serviceLine.ID,
					CarePhase: &caremanagerpb.CarePhase{
						Id:        carePhase.ID,
						Name:      carePhase.Name,
						PhaseType: "inactive",
					},
					UpdatedByUserId: mockedUser.Id,
					Tasks: []*caremanagerpb.TaskTemplateTask{
						{
							Body: *proto.String("My Task"),
							Type: &caremanagerpb.TaskType{
								Id:   taskType.ID,
								Slug: taskType.Slug,
							},
						},
					},
				},
			},
		},
		{
			name: "fails because request has missing required fields (e.g. service line)",
			request: &caremanagerpb.CreateTaskTemplateRequest{
				Name:    *proto.String("My Template"),
				Summary: *proto.String("Summary"),
			},
			useAuth: true,

			wantErrMsg: "rpc error: code = InvalidArgument desc = task_template.service_line_id cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &mockedUser,
					},
				},
			})
			testCtx := ctx
			if testCase.useAuth {
				testCtx = metadata.NewIncomingContext(
					ctx,
					metadata.Pairs("authorization", "Bearer faketoken"),
				)
			}

			resp, err := grpcServer.CreateTaskTemplate(
				testCtx,
				testCase.request,
			)

			if testCase.wantErrMsg != "" {
				if err != nil {
					mustContain(t, testCase.wantErrMsg, err.Error())
				} else {
					t.Fatalf("No error thrown, expected: %s", testCase.wantErrMsg)
				}
			}
			if testCase.wantErrMsg == "" {
				if err != nil {
					t.Fatalf("CreateTaskTemplate failed: %s", err.Error())
				} else {
					testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")(
						t,
						resp.TaskTemplate,
						testCase.want.TaskTemplate,
						"Unexpected response",
					)
				}
			}
		})
	}
}

func TestGetTaskTemplate(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()

	carePhase, err := getDefaultCarePhase(ctx, db)
	if err != nil {
		t.Fatal(err)
	}
	serviceLine, err := getDefaultServiceLine(ctx, db)
	if err != nil {
		t.Fatal(err)
	}
	taskType, err := getDefaultTaskType(ctx, db)
	if err != nil {
		t.Fatal(err)
	}

	testTemplate, err := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{Name: "test", ServiceLineID: serviceLine.ID, CarePhaseID: sql.NullInt64{Int64: carePhase.ID, Valid: true}})
	if err != nil {
		t.Fatal(err)
	}
	testTemplateTask1, err := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{Body: "test1", TypeID: taskType.ID, TemplateID: testTemplate.ID})
	if err != nil {
		t.Fatal(err)
	}

	var expectedTaskTypes = map[int64]*caremanagerdb.TaskType{}
	expectedTaskTypes[taskType.ID], err = db.queries.GetTaskType(ctx, taskType.ID)
	if err != nil {
		t.Fatal(err)
	}
	convertedTaskTemplate, err := TemplateTaskProtoFromTemplateTaskSQL(testTemplateTask1, expectedTaskTypes)
	if err != nil {
		t.Fatal(err)
	}
	expectedTasks := []*caremanagerpb.TaskTemplateTask{convertedTaskTemplate}

	testTemplateNoCarePhase, err := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{Name: "test", ServiceLineID: serviceLine.ID})
	if err != nil {
		t.Fatal(err)
	}
	testTemplateTask2, err := db.queries.CreateTemplateTask(ctx, caremanagerdb.CreateTemplateTaskParams{Body: "test1", TypeID: taskType.ID, TemplateID: testTemplateNoCarePhase.ID})
	if err != nil {
		t.Fatal(err)
	}

	var expectedTaskTypesNoCarePhase = map[int64]*caremanagerdb.TaskType{}
	expectedTaskTypesNoCarePhase[taskType.ID], err = db.queries.GetTaskType(ctx, taskType.ID)
	if err != nil {
		t.Fatal(err)
	}
	convertedTaskTemplateNoCarePhase, err := TemplateTaskProtoFromTemplateTaskSQL(testTemplateTask2, expectedTaskTypesNoCarePhase)
	if err != nil {
		t.Fatal(err)
	}
	expectedTasksNoCarePhase := []*caremanagerpb.TaskTemplateTask{convertedTaskTemplateNoCarePhase}

	testTemplateToDelete, err := db.queries.CreateTaskTemplate(ctx, caremanagerdb.CreateTaskTemplateParams{Name: "to delete", ServiceLineID: serviceLine.ID, CarePhaseID: sql.NullInt64{Int64: carePhase.ID, Valid: true}})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := db.queries.DeleteTaskTemplate(ctx, testTemplateToDelete.ID); err != nil {
		t.Fatalf("DeleteTaskTemplate returned an error %s", err.Error())
	}

	testCases := []struct {
		name               string
		context            context.Context
		testTemplateID     int64
		testTemplateTaskID int64

		want       *caremanagerpb.GetTaskTemplateResponse
		wantErrMsg string
	}{
		{
			name:           "works",
			context:        ctxWithAuth,
			testTemplateID: testTemplate.ID,

			want: &caremanagerpb.GetTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Name:            "test",
					Id:              testTemplate.ID,
					TasksCount:      1,
					ServiceLineId:   serviceLine.ID,
					CarePhase:       CarePhaseProtoFromCarePhaseSQL(carePhase),
					Tasks:           expectedTasks,
					UpdatedByUserId: 0,
				},
			},
		},
		{
			name:           "works without care phase",
			context:        ctxWithAuth,
			testTemplateID: testTemplateNoCarePhase.ID,

			want: &caremanagerpb.GetTaskTemplateResponse{
				TaskTemplate: &caremanagerpb.TaskTemplate{
					Name:            testTemplateNoCarePhase.Name,
					Id:              testTemplateNoCarePhase.ID,
					TasksCount:      1,
					ServiceLineId:   serviceLine.ID,
					Tasks:           expectedTasksNoCarePhase,
					UpdatedByUserId: 0,
				},
			},
		},
		{
			name:           "fails because template has been deleted",
			context:        ctxWithAuth,
			wantErrMsg:     "no rows in result set",
			testTemplateID: testTemplateToDelete.ID,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			requestBody := caremanagerpb.GetTaskTemplateRequest{
				TaskTemplateId: testCase.testTemplateID,
			}

			resp, err := grpcServer.GetTaskTemplate(testCase.context, &requestBody)

			if testCase.wantErrMsg == "" && resp.TaskTemplate == nil {
				t.Fatalf("GetTaskTemplate returned a bad response")
			}

			if err == nil && testCase.wantErrMsg != "" {
				t.Fatalf("No error thrown, but expected: %s", testCase.wantErrMsg)
			} else if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			mustMatchTemplateResponse(t, testCase.want, resp)
		})
	}
}

func TestGetActivePatients(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	nameSuffix := strconv.FormatInt(time.Now().UnixNano(), 10)

	activeCarePhase, _ := db.queries.GetCarePhaseByName(ctx, "Active")
	serviceLines, _ := db.queries.GetServiceLines(ctx)

	now := time.Now().UnixNano()

	patientsToCreate := 6
	var createdActivePatients []*caremanagerdb.Patient
	var patientAthenaIds []string
	for i := 0; i < patientsToCreate; i++ {
		athenaID := "athena_id_" + nameSuffix + strconv.Itoa(i)
		p, err := createTestPatient(ctx, db, createTestPatientParams{
			customFirstName: "Active Pietr" + nameSuffix + strconv.Itoa(i),
			customLastName:  "Wozniak" + nameSuffix + strconv.Itoa(i),
			customAthenaID:  athenaID,
		})

		if err != nil {
			t.Fatalf("error while running createTestPatient in TestGetActivePatients: %s", err.Error())
		}

		createdActivePatients = append(createdActivePatients, p)
		// We will use the created patients Athena IDs to narrow search
		// to patients created for this test.
		patientAthenaIds = append(patientAthenaIds, athenaID)

		market := getMockedMarket(now + int64(i))

		_, err = createTestEpisode(ctx, db, &createTestEpisodeParams{
			customPatient:     p,
			customCarePhase:   activeCarePhase,
			customMarket:      market,
			customServiceLine: serviceLines[1],
		})

		if err != nil {
			t.Fatalf("error while running createTestEpisode in TestGetActivePatients: %s", err.Error())
		}
	}

	var createdPatientsProto []*caremanagerpb.Patient
	for _, createdPatient := range createdActivePatients {
		p := PatientProtoFromPatientSQL(createdPatient, PatientProtoFromPatientSQLParams{
			medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{FirstName: "Doctor"},
			insurance:            &caremanagerdb.Insurance{Name: "Insurance"},
			pharmacy:             &caremanagerdb.Pharmacy{Name: "Pharmacy"},
			externalDoctor:       &caremanagerdb.ExternalCareProvider{Name: "External Doctor"},
			externalReferrer:     &caremanagerdb.ExternalCareProvider{Name: "External Referrer"},
		})
		createdPatientsProto = append(createdPatientsProto, p)
	}

	defaultPage := int64(1)
	defaultPageSize := int64(5)

	errorPageSize := int64(0)
	errorPage := int64(0)

	retrievedPatients, err := db.queries.GetActivePatients(ctx, caremanagerdb.GetActivePatientsParams{
		PageOffset: 0,
		PageSize:   defaultPageSize,
		AthenaIds:  patientAthenaIds,
	})
	if err != nil {
		t.Fatalf("error while running GetActivePatients in TestGetActivePatients: %s", err.Error())
	}

	retrievedCount := retrievedPatients[0].Count

	var retrievedPatientsProto []*caremanagerpb.Patient
	for _, retrievedPatient := range retrievedPatients {
		medicalDecisionMakers, err := db.queries.GetPatientMedicalDecisionMakers(ctx, retrievedPatient.ID)
		if err != nil {
			t.Fatal(err.Error())
		}
		var medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
		if len(medicalDecisionMakers) > 0 {
			medicalDecisionMaker = medicalDecisionMakers[0]
		}
		insurances, err := db.queries.GetPatientInsurances(ctx, retrievedPatient.ID)
		if err != nil {
			t.Fatal(err.Error())
		}
		var insurance *caremanagerdb.Insurance
		if len(insurances) > 0 {
			insurance = insurances[0]
		}
		pharmacies, err := db.queries.GetPatientPharmacies(ctx, retrievedPatient.ID)
		if err != nil {
			t.Fatal(err.Error())
		}
		var pharmacy *caremanagerdb.Pharmacy
		if len(pharmacies) > 0 {
			pharmacy = pharmacies[0]
		}
		externalCareProviders, err := db.queries.GetPatientExternalCareProviders(ctx, retrievedPatient.ID)
		if err != nil {
			t.Fatal(err.Error())
		}
		providerTypes, err := db.queries.GetProviderTypes(ctx)
		if err != nil {
			t.Fatal(err.Error())
		}
		providerTypesByNameMap := map[string]caremanagerdb.ProviderType{}
		for _, pt := range providerTypes {
			providerTypesByNameMap[pt.Name.String] = *pt
		}

		var externalDoctor *caremanagerdb.ExternalCareProvider
		var externalReferrer *caremanagerdb.ExternalCareProvider
		for _, ecp := range externalCareProviders {
			if ecp.ProviderTypeID == providerTypesByNameMap["Doctor"].ID {
				externalDoctor = ecp
				continue
			} else if ecp.ProviderTypeID == providerTypesByNameMap["Referrer"].ID {
				externalReferrer = ecp
				continue
			}
		}

		p := PatientProtoFromGetActivePatientSQLRow(retrievedPatient, PatientProtoFromGetActivePatientSQLRowParams{
			medicalDecisionMaker: medicalDecisionMaker,
			insurance:            insurance,
			pharmacy:             pharmacy,
			externalDoctor:       externalDoctor,
			externalReferrer:     externalReferrer,
		})
		retrievedPatientsProto = append(retrievedPatientsProto, p)
	}

	totalPageBaseCase := retrievedCount / 5
	if retrievedCount%5 != 0 {
		totalPageBaseCase++
	}
	nextPageBaseCase := int64(2)

	patientWithClosingWithoutAdmittingEpisodeAthenaID := "closed_without_admitting_" + fmt.Sprint(now)
	patientWithClosedWithoutAdmittingEpisode, err := createTestPatient(ctx, db, createTestPatientParams{
		customFirstName: "Kurt" + nameSuffix + fmt.Sprint(now),
		customLastName:  "Godel" + nameSuffix + fmt.Sprint(now),
		customAthenaID:  patientWithClosingWithoutAdmittingEpisodeAthenaID,
	})
	if err != nil {
		t.Fatal(err)
	}

	closedWithoutAdmittingCarePhase, err := db.queries.GetCarePhaseByName(ctx, "Closed Without Admitting")
	if err != nil {
		t.Fatal(err)
	}

	_, err = createTestEpisode(ctx, db, &createTestEpisodeParams{
		customPatient:   patientWithClosedWithoutAdmittingEpisode,
		customCarePhase: closedWithoutAdmittingCarePhase,
	})
	if err != nil {
		t.Fatal(err)
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.GetActivePatientsRequest

		want       *caremanagerpb.GetActivePatientsResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.GetActivePatientsRequest{
				AthenaIds: patientAthenaIds,
			},

			want: &caremanagerpb.GetActivePatientsResponse{
				Patients: retrievedPatientsProto,
				Meta: &caremanagerpb.PageInfo{
					PageSize:     5,
					CurrentPage:  1,
					TotalResults: retrievedCount,
					TotalPages:   totalPageBaseCase,
					FirstPage:    proto.Bool(true),
					LastPage:     proto.Bool(false),
					NextPage:     &nextPageBaseCase,
				},
			},
		},
		{
			name: "returns an empty list if no results are found",
			request: &caremanagerpb.GetActivePatientsRequest{
				AthenaIds: []string{strconv.Itoa(time.Now().Nanosecond())},
			},

			want: &caremanagerpb.GetActivePatientsResponse{
				Patients: []*caremanagerpb.Patient{},
				Meta: &caremanagerpb.PageInfo{
					PageSize:     5,
					CurrentPage:  1,
					TotalResults: 0,
					TotalPages:   1,
					FirstPage:    proto.Bool(true),
					LastPage:     proto.Bool(true),
				},
			},
		},
		{
			name: "returns the exact same active patients that were inserted when searching them",
			request: &caremanagerpb.GetActivePatientsRequest{
				Page:      &defaultPage,
				PageSize:  proto.Int64(int64(patientsToCreate)),
				AthenaIds: patientAthenaIds,
			},

			want: &caremanagerpb.GetActivePatientsResponse{
				Patients: createdPatientsProto,
				Meta: &caremanagerpb.PageInfo{
					PageSize:     int64(len(createdPatientsProto)),
					CurrentPage:  1,
					TotalResults: int64(len(createdPatientsProto)),
					TotalPages:   1,
					FirstPage:    proto.Bool(true),
					LastPage:     proto.Bool(true),
				},
			},
		},
		{
			name: "fails if page offset is zero",
			request: &caremanagerpb.GetActivePatientsRequest{
				Page:     &errorPage,
				PageSize: &defaultPageSize,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = page should be greater than zero",
		},
		{
			name: "fails if page size is zero",
			request: &caremanagerpb.GetActivePatientsRequest{
				Page:     &defaultPage,
				PageSize: &errorPageSize,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = page size should be greater than zero",
		},
		{
			name: "should not return patient if its only Episode is in 'Closed Without Admitting' phase",
			request: &caremanagerpb.GetActivePatientsRequest{
				AthenaIds: []string{patientWithClosingWithoutAdmittingEpisodeAthenaID},
			},

			want: &caremanagerpb.GetActivePatientsResponse{
				Patients: []*caremanagerpb.Patient{},
				Meta: &caremanagerpb.PageInfo{
					PageSize:     defaultPageSize,
					TotalResults: 0,
					TotalPages:   1,
					CurrentPage:  1,
					FirstPage:    proto.Bool(true),
					LastPage:     proto.Bool(true),
				},
			},
		},
	}

	grpcServer := getGRPCServer(getGRPCServerParams{
		db: db,
		mockMarketServiceClient: &MockMarketServiceClient{
			GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
				Markets: []*marketpb.Market{getMockedMarket(now)},
			},
		},
	})

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testCtx := ctx
			resp, err := grpcServer.GetActivePatients(testCtx, testCase.request)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "GetActivePatients returned unexpected error.")
			}

			testutils.MustMatch(t, testCase.want, resp, "GetActivePatients returned unexpected output.")
		})
	}
}

func TestGetUsersByID(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		name             string
		context          context.Context
		request          *caremanagerpb.GetUsersByIDRequest
		userServiceError error

		wantErr bool
		want    *caremanagerpb.GetUsersByIDResponse
	}{
		{
			name:    "works",
			context: ctxWithAuth,
			request: &caremanagerpb.GetUsersByIDRequest{UserIds: []int64{1, 2}},

			want: &caremanagerpb.GetUsersByIDResponse{
				Users: []*caremanagerpb.User{{Id: 1}, {Id: 2}},
			},
		},
		{
			name:             "fails if station returns an error",
			context:          ctxWithAuth,
			userServiceError: errors.New("Station error"),
			request:          &caremanagerpb.GetUsersByIDRequest{UserIds: []int64{1, 2}},

			wantErr: true,
		},
		{
			name:    "fails due to missing authentication",
			context: ctxWithoutAuth,
			request: &caremanagerpb.GetUsersByIDRequest{UserIds: []int64{1, 2}},

			wantErr: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			mockUsers := []*userpb.User{}
			if testCase.request != nil {
				for _, v := range testCase.request.UserIds {
					mockUsers = append(mockUsers, &userpb.User{Id: v})
				}
			}

			grpcServer := getGRPCServer(getGRPCServerParams{
				mockUserServiceClient: &MockUserServiceClient{
					GetUsersByIDResult: &userpb.GetUsersByIDResponse{
						Users: mockUsers,
					},
					GetUsersByIDErr: testCase.userServiceError,
				},
			})

			resp, err := grpcServer.GetUsersByID(testCase.context, testCase.request)

			if err != nil && !testCase.wantErr {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatchProto(t, testCase.want, resp)
		})
	}
}

func TestUpdateVisitFromStationCR(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	mockedUserID := time.Now().UnixNano()
	mockCareRequestID := mockedUserID + 1
	mockedOriginalCareRequestID := mockCareRequestID + 2

	now := time.Now()
	nowString := now.Format(timestampLayout)
	tomorrowString := now.Add(24 * time.Hour).Format(timestampLayout)

	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err.Error())
	}
	episode := createTestEpisodeResult.episode
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: proto.Int64(mockCareRequestID),
		episodeID:     episode.ID,
	})

	visit := visitResult.visit

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateVisitFromStationCRRequest

		want       *caremanagerpb.UpdateVisitFromStationCRResponse
		wantErrMsg string
	}{
		{
			name: "should work with a single field",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId: visit.CareRequestID.Int64,
				CarName:       proto.String("Mustang"),
			},

			want: &caremanagerpb.UpdateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:     episode.ID,
					StatusGroup:   caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
					CarName:       proto.String("Mustang"),
					CareRequestId: &mockCareRequestID,
				},
			},
		},
		{
			name: "should work with all fields",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId:            visit.CareRequestID.Int64,
				UpdatedByUserId:          proto.Int64(mockedUserID),
				ServiceLineId:            proto.Int64(4),
				Status:                   proto.String("on_route"),
				StatusUpdatedAt:          proto.String(nowString),
				PatientAvailabilityStart: proto.String(nowString),
				PatientAvailabilityEnd:   proto.String(tomorrowString),
				CarName:                  proto.String("Ferrari"),
				ProviderUserIds:          []int64{10, 11, 12},
				AddressId:                proto.Int64(13),
				OriginalCareRequestId:    proto.Int64(mockedOriginalCareRequestID),
			},

			want: &caremanagerpb.UpdateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:                episode.ID,
					Status:                   proto.String("on_route"),
					StatusGroup:              caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
					UpdatedByUserId:          &mockedUserID,
					PatientAvailabilityStart: &nowString,
					PatientAvailabilityEnd:   &tomorrowString,
					CarName:                  proto.String("Ferrari"),
					ProviderUserIds:          []int64{10, 11, 12},
					AddressId:                proto.Int64(13),
					CareRequestId:            &mockCareRequestID,
				},
			},
		},
		{
			name: "should remove nullable fields",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId:            visit.CareRequestID.Int64,
				UpdatedByUserId:          proto.Int64(mockedUserID),
				PatientAvailabilityStart: nil,
				PatientAvailabilityEnd:   nil,
				CarName:                  nil,
				ProviderUserIds:          nil,
			},

			want: &caremanagerpb.UpdateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:                episode.ID,
					Status:                   proto.String("on_route"),
					StatusGroup:              caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
					UpdatedByUserId:          &mockedUserID,
					PatientAvailabilityStart: nil,
					PatientAvailabilityEnd:   nil,
					CarName:                  nil,
					ProviderUserIds:          nil,
					AddressId:                proto.Int64(13),
					CareRequestId:            &mockCareRequestID,
				},
			},
		},
		{
			name: "fails if care_request_id does not belong to any visit",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId: -1,
				CarName:       proto.String("Bugatti"),
			},

			wantErrMsg: "rpc error: code = NotFound desc = no visit was found with the care_request_id: -1",
		},
		{
			name: "fails if an invalid user id is provided for updated_by_user_id",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId:   mockedUserID,
				UpdatedByUserId: proto.Int64(0),
				CarName:         proto.String("Bugatti"),
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = UpdatedByUserId: 0 must be a valid UserId",
		},
		{
			name: "fails if a service line is provided, but an invalid care_request_id is provided",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId: -1,
				ServiceLineId: proto.Int64(2),
			},

			wantErrMsg: "rpc error: code = NotFound desc = no visit was found with the care_request_id: -1",
		},
		{
			name: "fails if a service line is is invalid",
			request: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId: visit.CareRequestID.Int64,
				ServiceLineId: proto.Int64(-2),
			},

			wantErrMsg: "insert or update on table \"episodes\" violates foreign key constraint \"episodes_service_line_id_fkey\"",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.UpdateVisitFromStationCR(ctx, testCase.request)

			if err != nil {
				mustContain(t, testCase.wantErrMsg, err.Error())
			}

			if (testCase.request.ServiceLineId != nil || testCase.request.OriginalCareRequestId != nil) && err == nil {
				episode, err := db.queries.GetEpisode(ctx, visit.EpisodeID)
				if err != nil {
					t.Fatal(err.Error())
				}

				testutils.MustMatch(t, *testCase.request.ServiceLineId, episode.ServiceLineID)
				testutils.MustMatch(t, sqltypes.ToNullInt64(testCase.request.OriginalCareRequestId), episode.OriginalCareRequestID)
			}

			mustMatchVisitResponse(t, testCase.want, resp)
		})
	}
}

func TestGetVisit(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	userID := int64(1234)
	careRequestID := time.Now().UnixNano()

	visitWithNoTypeOrSummaryResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:       createTestEpisodeResult.episode.ID,
		providerUserIds: []int64{1, 2, 3},
		createdByUserID: &userID,
		careRequestID:   &careRequestID,
	})

	visitWithNoTypeOrSummary := visitWithNoTypeOrSummaryResult.visit

	extendedCareType, err := db.queries.GetVisitTypeByName(ctx, visitTypeExtendedCareName)
	if err != nil {
		t.Fatal(err)
	}

	visitWithSummaryAndTypeResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:       createTestEpisodeResult.episode.ID,
		providerUserIds: []int64{1, 2, 3},
		visitTypeID:     &extendedCareType.ID,
		createdByUserID: &userID,
	})

	visitWithSummaryAndType := visitWithSummaryAndTypeResult.visit

	visitSummary, err := createTestSummary(ctx, db, &createTestSummaryParams{
		body:            "regular summary here",
		visitID:         visitWithSummaryAndType.ID,
		createdByUserID: &userID,
	})
	if err != nil {
		t.Fatal(err)
	}

	currentMarkets, _, _ := getCurrentConfig(ctx, t, db)
	grpcServer := getGRPCServer(getGRPCServerParams{
		db: db,
		mockMarketServiceClient: &MockMarketServiceClient{
			GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
				Markets: currentMarkets,
			},
		},
	})

	testCases := []struct {
		name       string
		request    *caremanagerpb.GetVisitRequest
		want       *caremanagerpb.GetVisitResponse
		wantErrMsg string
	}{
		{
			name: "works (it should not include type nor summary in response)",
			request: &caremanagerpb.GetVisitRequest{
				VisitId: visitWithNoTypeOrSummary.ID,
			},
			want: &caremanagerpb.GetVisitResponse{
				Visit: VisitProtoFromVisitSQL(&caremanagerdb.Visit{
					ID:                       visitWithNoTypeOrSummary.ID,
					EpisodeID:                visitWithNoTypeOrSummary.EpisodeID,
					CreatedAt:                visitWithNoTypeOrSummary.CreatedAt,
					UpdatedAt:                visitWithNoTypeOrSummary.UpdatedAt,
					Status:                   visitWithNoTypeOrSummary.Status,
					CarName:                  visitWithNoTypeOrSummary.CarName,
					ProviderUserIds:          visitWithNoTypeOrSummary.ProviderUserIds,
					CreatedByUserID:          visitWithNoTypeOrSummary.CreatedByUserID,
					UpdatedByUserID:          visitWithNoTypeOrSummary.UpdatedByUserID,
					AddressID:                visitWithNoTypeOrSummary.AddressID,
					PatientAvailabilityStart: visitWithNoTypeOrSummary.PatientAvailabilityStart,
					PatientAvailabilityEnd:   visitWithNoTypeOrSummary.PatientAvailabilityEnd,
					CareRequestID:            visitWithNoTypeOrSummary.CareRequestID,
				}),
				Summary: nil,
			},
		},
		{
			name: "works (it should include summary and type in response)",
			request: &caremanagerpb.GetVisitRequest{
				VisitId: visitWithSummaryAndType.ID,
			},
			want: &caremanagerpb.GetVisitResponse{
				Visit: &caremanagerpb.Visit{
					Id:                       visitWithSummaryAndType.ID,
					EpisodeId:                visitWithSummaryAndType.EpisodeID,
					CreatedAt:                visitWithSummaryAndType.CreatedAt.Format(timestampLayout),
					UpdatedAt:                visitWithSummaryAndType.UpdatedAt.Format(timestampLayout),
					Status:                   nil,
					CarName:                  nil,
					ProviderUserIds:          visitWithSummaryAndType.ProviderUserIds,
					CreatedByUserId:          &visitWithSummaryAndType.CreatedByUserID.Int64,
					UpdatedByUserId:          &visitWithSummaryAndType.UpdatedByUserID.Int64,
					AddressId:                nil,
					PatientAvailabilityStart: nil,
					PatientAvailabilityEnd:   nil,
					TypeId:                   proto.Int64(extendedCareType.ID),
					StatusGroup:              caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				},
				Summary: VisitSummaryProtoFromVisitSummaryRow(&caremanagerdb.VisitSummary{
					VisitID:         visitSummary.VisitID,
					Body:            visitSummary.Body,
					CreatedAt:       visitSummary.CreatedAt,
					UpdatedAt:       visitSummary.UpdatedAt,
					CreatedByUserID: visitSummary.CreatedByUserID,
					UpdatedByUserID: visitSummary.UpdatedByUserID,
				}),
			},
		},
		{
			name: "it should return an error if the Visit doesn't exist",
			request: &caremanagerpb.GetVisitRequest{
				VisitId: visitWithSummaryAndType.ID + int64(100),
			},
			want:       nil,
			wantErrMsg: "rpc error: code = NotFound desc = Visit not found",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			response, err := grpcServer.GetVisit(ctx, testCase.request)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "error while running test:"+testCase.name+" in TestGetVisit, error strings should match")
			}

			testutils.MustMatch(t, testCase.want, response, "error while running test:"+testCase.name+" in TestGetVisit, responses should match")
		})
	}
}

func TestGetVisitTypes(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	grpcServer := getGRPCServer(getGRPCServerParams{
		db: db,
	})

	testCases := []struct {
		name string
		want *caremanagerpb.GetVisitTypesResponse
	}{
		{
			name: "should return a list of visit types ordered alphabetically by name asc",
			want: &caremanagerpb.GetVisitTypesResponse{
				VisitTypes: []*caremanagerpb.VisitType{
					{
						Id:         1,
						Name:       "Acute Care",
						IsCallType: false,
					},
					{
						Id:         2,
						Name:       "Bridge Care Plus",
						IsCallType: false,
					},
					{
						Id:         3,
						Name:       "Daily Update",
						IsCallType: true,
					},
					{
						Id:         4,
						Name:       "Discharge",
						IsCallType: false,
					},
					{
						Id:         5,
						Name:       "Evaluation",
						IsCallType: false,
					},
					{
						Id:         6,
						Name:       "Extended Care",
						IsCallType: false,
					},
					{
						Id:         7,
						Name:       "High Acuity",
						IsCallType: false,
					},
					{
						Id:         8,
						Name:       "Remote Evaluation",
						IsCallType: true,
					},
					{
						Id:         9,
						Name:       "Transition Call",
						IsCallType: true,
					},
					{
						Id:         10,
						Name:       "Tuck-in Call",
						IsCallType: true,
					},
				},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			response, err := grpcServer.GetVisitTypes(ctx, &caremanagerpb.GetVisitTypesRequest{})

			if err != nil {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatchFn(".Id")(t, testCase.want, response, "error while running test:"+testCase.name+" in TestGetVisitTypes, responses should match")
		})
	}
}

func TestGetAddressesByID(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	mockID1 := time.Now().UnixNano()
	mockID2 := mockID1 + 1

	testCases := []struct {
		name                string
		context             context.Context
		request             *caremanagerpb.GetAddressesByIDRequest
		addressServiceError error

		wantErr bool
		want    *caremanagerpb.GetAddressesByIDResponse
	}{
		{
			name:    "it should work",
			context: ctxWithAuth,
			request: &caremanagerpb.GetAddressesByIDRequest{AddressIds: []int64{mockID1, mockID2}},

			want: &caremanagerpb.GetAddressesByIDResponse{
				Addresses: []*caremanagerpb.Address{{Id: mockID1}, {Id: mockID2}},
			},
		},
		{
			name:                "it should fail if station returns an error",
			context:             ctxWithAuth,
			addressServiceError: errors.New("Station error"),
			request:             &caremanagerpb.GetAddressesByIDRequest{AddressIds: []int64{mockID1, mockID2}},

			wantErr: true,
		},
		{
			name:    "it should fail due to missing authentication",
			context: ctxWithoutAuth,
			request: &caremanagerpb.GetAddressesByIDRequest{AddressIds: []int64{mockID1, mockID2}},

			wantErr: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			mockAddresses := []*addresspb.Address{}
			if testCase.request != nil {
				for _, v := range testCase.request.AddressIds {
					mockAddresses = append(mockAddresses, &addresspb.Address{Id: v})
				}
			}

			grpcServer := getGRPCServer(getGRPCServerParams{
				mockAddressServiceClient: &MockAddressServiceClient{
					GetAddressesByIDResult: &addresspb.GetAddressesByIDResponse{
						Addresses: mockAddresses,
					},
					GetAddressesByIDErr: testCase.addressServiceError,
				},
			})

			resp, err := grpcServer.GetAddressesByID(testCase.context, testCase.request)

			if err != nil && !testCase.wantErr {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatchProto(t, testCase.want, resp)
		})
	}
}

func TestGetEpisodeVisits(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	now := time.Now().UnixNano()

	markets := []*marketpb.Market{getMockedMarket(now), getMockedMarket(now + 1)}

	episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customMarket: markets[0],
	})
	if err != nil {
		t.Fatal(err)
	}

	episodeID := episode.episode.ID

	visit1CareRequestID := now + 1000
	visit1ETA := now + 10000
	formattedVisit1ETA := time.Unix(visit1ETA, 0).UTC().Format(timestampLayout)
	visit1, err := db.queries.CreateVisit(ctx, caremanagerdb.CreateVisitParams{
		EpisodeID:     episode.episode.ID,
		CareRequestID: sqltypes.ToNullInt64(&visit1CareRequestID),
	})
	if err != nil {
		t.Fatal(err)
	}

	visit2CareRequestID := now + 2000
	visit2ETA := now + 20000
	formattedVisit2ETA := time.Unix(visit2ETA, 0).UTC().Format(timestampLayout)
	visit2, err := db.queries.CreateVisit(ctx, caremanagerdb.CreateVisitParams{
		EpisodeID:     episode.episode.ID,
		CareRequestID: sqltypes.ToNullInt64(&visit2CareRequestID),
	})
	if err != nil {
		t.Fatal(err)
	}
	visit3, err := db.queries.CreateVisit(ctx, caremanagerdb.CreateVisitParams{
		EpisodeID: episode.episode.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	tcs := []struct {
		name               string
		request            *caremanagerpb.GetEpisodeVisitsRequest
		userMarkets        []*marketpb.Market
		marketServiceError error
		logisticsClient    *MockLogisticsServiceClient

		want    *caremanagerpb.GetEpisodeVisitsResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: episodeID,
			},
			userMarkets: markets,
			logisticsClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResponse: &logisticspb.GetServiceRegionScheduleResponse{},
			},

			want: &caremanagerpb.GetEpisodeVisitsResponse{
				Visits: []*caremanagerpb.VisitListElement{
					{
						Id:          visit3.ID,
						EpisodeId:   episodeID,
						StatusGroup: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
					},
					{
						Id:                    visit2.ID,
						EpisodeId:             episodeID,
						StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
						CareRequestId:         &visit2CareRequestID,
						IsSchedulingInProcess: true,
					},
					{
						Id:                    visit1.ID,
						EpisodeId:             episodeID,
						StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
						CareRequestId:         &visit1CareRequestID,
						IsSchedulingInProcess: true,
					},
				},
			},
		},
		{
			name: "it should populate ETA in Visits when logistics returns schedules",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: episodeID,
			},
			userMarkets: markets,
			logisticsClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResponse: &logisticspb.GetServiceRegionScheduleResponse{
					DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
						{
							ServiceDate: &common.Date{
								Year:  1879,
								Day:   14,
								Month: 3,
							},
							Schedules: []*logisticspb.ShiftTeamSchedule{
								{
									ShiftTeamId: 1,
									Route: &logisticspb.ShiftTeamRoute{
										Stops: []*logisticspb.ShiftTeamRouteStop{
											{
												Stop: &logisticspb.ShiftTeamRouteStop_Visit{
													Visit: &logisticspb.ShiftTeamVisit{
														CareRequestId:       &visit1CareRequestID,
														ArrivalTimestampSec: &visit1ETA,
													},
												},
											},
											{
												Stop: &logisticspb.ShiftTeamRouteStop_Visit{
													Visit: &logisticspb.ShiftTeamVisit{
														CareRequestId:       &visit2CareRequestID,
														ArrivalTimestampSec: &visit2ETA,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},

			want: &caremanagerpb.GetEpisodeVisitsResponse{
				Visits: []*caremanagerpb.VisitListElement{
					{
						Id:          visit3.ID,
						EpisodeId:   episodeID,
						StatusGroup: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
					},
					{
						Id:                    visit2.ID,
						EpisodeId:             episodeID,
						StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
						Eta:                   &formattedVisit2ETA,
						CareRequestId:         &visit2CareRequestID,
						IsSchedulingInProcess: true,
					},
					{
						Id:                    visit1.ID,
						EpisodeId:             episodeID,
						StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
						Eta:                   &formattedVisit1ETA,
						CareRequestId:         &visit1CareRequestID,
						IsSchedulingInProcess: true,
					},
				},
			},
		},
		{
			name: "should fail if Episode does not exist",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: 0,
			},
			userMarkets: markets,

			wantErr: errors.New("no rows in result set"),
		},
		{
			name: "should fail if Market service errors",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: episodeID,
			},
			marketServiceError: errors.New("some err"),

			wantErr: errors.New("some err"),
		},
		{
			name: "should fail if User has no access to the Episode Market",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: episodeID,
			},
			userMarkets: []*marketpb.Market{markets[1]},

			wantErr: status.Errorf(codes.PermissionDenied, "market unavailable for user"),
		},
		{
			name: "should fail if Logistics returns an error",
			request: &caremanagerpb.GetEpisodeVisitsRequest{
				EpisodeId: episodeID,
			},
			userMarkets: markets,
			logisticsClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleErr: errors.New("an error occurred while calling Logistics"),
			},

			wantErr: errors.New("an error occurred while calling Logistics"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: tc.userMarkets,
					},
					GetAuthenticatedUserMarketsErr: tc.marketServiceError,
				},
				mockLogisticsServiceClient: tc.logisticsClient,
			})

			ctxWithAuth := getContextWithAuth()

			resp, err := grpcServer.GetEpisodeVisits(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, tc.want, resp)
		})
	}
}

func TestCreateCallVisit(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	ctxWithAuth := metadata.NewIncomingContext(
		ctx,
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
	defer done()
	db := NewCaremanagerDB(pool)
	createTestEpisodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	dailyUpdateType, err := db.queries.GetVisitTypeByName(ctx, visitTypeDailyUpdateName)
	if err != nil {
		t.Fatal(err)
	}

	extendedCareType, err := db.queries.GetVisitTypeByName(ctx, visitTypeExtendedCareName)
	if err != nil {
		t.Fatal(err)
	}

	userID := time.Now().UnixNano()

	currentMarkets, _, _ := getCurrentConfig(ctxWithAuth, t, db)
	testCases := []struct {
		name    string
		request *caremanagerpb.CreateCallVisitRequest
		want    *caremanagerpb.CreateCallVisitResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateCallVisitRequest{
				EpisodeId:   createTestEpisodeResult.episode.ID,
				VisitTypeId: dailyUpdateType.ID,
				Summary:     "summary that works",
			},
			want: &caremanagerpb.CreateCallVisitResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:       createTestEpisodeResult.episode.ID,
					StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
					CreatedByUserId: &userID,
					UpdatedByUserId: &userID,
					TypeId:          proto.Int64(dailyUpdateType.ID),
				},
				Summary: &caremanagerpb.VisitSummary{
					Body:            "summary that works",
					CreatedByUserId: &userID,
					UpdatedByUserId: &userID,
				},
			},
			wantErr: nil,
		},
		{
			name: "it should return error if the Episode doesn't exist",
			request: &caremanagerpb.CreateCallVisitRequest{
				EpisodeId:   0,
				VisitTypeId: dailyUpdateType.ID,
				Summary:     "summary that works",
			},
			want:    nil,
			wantErr: status.Errorf(codes.InvalidArgument, "Episode doesn't exist"),
		},
		{
			name: "it should return error if the VisitType doesn't exist",
			request: &caremanagerpb.CreateCallVisitRequest{
				EpisodeId:   createTestEpisodeResult.episode.ID,
				VisitTypeId: 0,
				Summary:     "summary that works",
			},
			want:    nil,
			wantErr: status.Errorf(codes.InvalidArgument, "VisitType doesn't exist"),
		},
		{
			name: "it should return error if the VisitType is not a CallVisit type",
			request: &caremanagerpb.CreateCallVisitRequest{
				EpisodeId:   createTestEpisodeResult.episode.ID,
				VisitTypeId: extendedCareType.ID,
				Summary:     "summary that works",
			},
			want:    nil,
			wantErr: status.Errorf(codes.InvalidArgument, "can't assign a non-call VisitType to this Visit")},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: currentMarkets,
					},
				},
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{
							Id: userID,
						},
					},
				},
			})
			response, err := grpcServer.CreateCallVisit(ctxWithAuth, testCase.request)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
			mustMatchVisitResponse(t, testCase.want, response, "unpexected problem, expected response and actual response don't match")
		})
	}
}

func TestUpdateCallVisit(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	ctxWithAuth := metadata.NewIncomingContext(
		ctx,
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
	defer done()
	db := NewCaremanagerDB(pool)

	userID := time.Now().UnixNano()
	currentMarkets, _, _ := getCurrentConfig(ctxWithAuth, t, db)

	tuckInCallType, err := db.queries.GetVisitTypeByName(ctx, visitTypeTuckInCall)
	if err != nil {
		t.Fatal(err)
	}

	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		withSummary: true,
	})
	visit := visitResult.visit

	statusGroup := VisitStatusGroupFromVisitStatusSQLString(visit.Status)

	extendedCareType, err := db.queries.GetVisitTypeByName(ctx, visitTypeExtendedCareName)
	if err != nil {
		t.Fatal(err)
	}

	visitWithNoSummaryResult := createTestVisit(ctx, t, db, &createTestVisitParams{})
	visitWithNoSummary := visitWithNoSummaryResult.visit

	visitWithNoChangesResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		withSummary: true,
		summary:     proto.String("summary is"),
	})
	visitWithNoChanges := visitWithNoChangesResult.visit
	statusGroupVisitNoChange := VisitStatusGroupFromVisitStatusSQLString(visitWithNoChanges.Status)

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateCallVisitRequest
		want    *caremanagerpb.UpdateCallVisitResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId:     visit.ID,
				Summary:     proto.String("new summary"),
				VisitTypeId: proto.Int64(tuckInCallType.ID),
			},

			want: &caremanagerpb.UpdateCallVisitResponse{
				Visit: &caremanagerpb.Visit{
					Id:                       visit.ID,
					EpisodeId:                visit.EpisodeID,
					Status:                   sqltypes.ToProtoString(visit.Status),
					CarName:                  sqltypes.ToProtoString(visit.CarName),
					ProviderUserIds:          visit.ProviderUserIds,
					CreatedByUserId:          sqltypes.ToProtoInt64(visit.CreatedByUserID),
					UpdatedByUserId:          &userID,
					AddressId:                sqltypes.ToProtoInt64(visit.AddressID),
					PatientAvailabilityStart: sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityStart),
					PatientAvailabilityEnd:   sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityEnd),
					StatusGroup:              statusGroup,
					TypeId:                   &tuckInCallType.ID,
				},
				Summary: &caremanagerpb.VisitSummary{
					Body:            "new summary",
					UpdatedByUserId: &userID,
					VisitId:         visit.ID,
				},
			},
		},
		{
			name: "works (no changes if request fields are nil)",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId: visitWithNoChanges.ID,
			},
			want: &caremanagerpb.UpdateCallVisitResponse{
				Visit: &caremanagerpb.Visit{
					Id:                       visitWithNoChanges.ID,
					EpisodeId:                visitWithNoChanges.EpisodeID,
					Status:                   sqltypes.ToProtoString(visitWithNoChanges.Status),
					CarName:                  sqltypes.ToProtoString(visitWithNoChanges.CarName),
					ProviderUserIds:          visitWithNoChanges.ProviderUserIds,
					CreatedByUserId:          sqltypes.ToProtoInt64(visitWithNoChanges.CreatedByUserID),
					AddressId:                sqltypes.ToProtoInt64(visitWithNoChanges.AddressID),
					PatientAvailabilityStart: sqltypes.ToProtoStringTimestamp(visitWithNoChanges.PatientAvailabilityStart),
					PatientAvailabilityEnd:   sqltypes.ToProtoStringTimestamp(visitWithNoChanges.PatientAvailabilityEnd),
					StatusGroup:              statusGroupVisitNoChange,
				},
				Summary: &caremanagerpb.VisitSummary{
					Body:    "summary is",
					VisitId: visitWithNoChanges.ID,
				},
			},
		},
		{
			name: "it should return error if call visit does not exist",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId: 0,
			},

			wantErr: status.Error(codes.NotFound, ErrVisitNotFoundMessage),
		},
		{
			name: "it should return error if visit type does not exist",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId:     visit.ID,
				VisitTypeId: proto.Int64(0),
			},

			wantErr: status.Error(codes.InvalidArgument, ErrVisitTypeDoesNotExistMessage),
		},
		{
			name: "it should return error if visit type is not call type",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId:     visit.ID,
				VisitTypeId: &extendedCareType.ID,
			},

			wantErr: status.Error(codes.InvalidArgument, "can't assign a non-call VisitType to this Visit"),
		},
		{
			name: "it should return error if summary doesn't exist",
			request: &caremanagerpb.UpdateCallVisitRequest{
				VisitId: visitWithNoSummary.ID,
			},

			wantErr: status.Error(codes.InvalidArgument, ErrVisitSummaryDoesNotExistMessage),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: currentMarkets,
					},
				},
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{
							Id: userID,
						},
					},
				},
			})

			response, err := grpcServer.UpdateCallVisit(ctxWithAuth, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			mustMatchUpdateCallVisitResponse(t, testCase.want, response)
		})
	}
}

func TestCreateVisitSummary(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	mockedUser := userpb.User{
		Id:        1,
		FirstName: "User",
		LastName:  "McUser",
		Email:     "user@email.com",
		JobTitle:  proto.String("RN"),
	}
	now := time.Now().UnixNano()
	visitSummaryBody := "test visit summary"

	episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customMarket: getMockedMarket(now),
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID: episode.episode.ID,
	})
	visit := visitResult.visit

	tcs := []struct {
		name              string
		request           *caremanagerpb.CreateVisitSummaryRequest
		userServiceClient MockUserServiceClient

		want       *caremanagerpb.CreateVisitSummaryResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateVisitSummaryRequest{
				VisitId: visit.ID,
				Body:    visitSummaryBody,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &mockedUser,
				},
			},

			want: &caremanagerpb.CreateVisitSummaryResponse{
				Summary: &caremanagerpb.VisitSummary{
					VisitId:         visit.ID,
					Body:            visitSummaryBody,
					CreatedByUserId: proto.Int64(mockedUser.Id),
					UpdatedByUserId: proto.Int64(mockedUser.Id),
				},
			},
		},
		{
			name: "fails because the Visit already has a VisitSummary",
			request: &caremanagerpb.CreateVisitSummaryRequest{
				VisitId: visit.ID,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &mockedUser,
				},
			},

			wantErrMsg: fmt.Sprintf(
				"rpc error: code = AlreadyExists desc = a VisitSummary for Visit %d already exists",
				visit.ID,
			),
		},
		{
			name: "fails because the UserServices returned an error",
			request: &caremanagerpb.CreateVisitSummaryRequest{
				VisitId: visit.ID,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUserErr: errors.New("get user error"),
			},

			wantErrMsg: "get user error",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db:                    db,
				mockUserServiceClient: &tc.userServiceClient,
			})

			ctxWithAuth := getContextWithAuth()

			resp, err := grpcServer.CreateVisitSummary(ctxWithAuth, tc.request)

			if err != nil {
				testutils.MustMatch(t, tc.wantErrMsg, err.Error())
			}

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, tc.want, resp)
		})
	}
}

func TestUpdateVisitSummary(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	now := time.Now().UnixNano()
	createdByUserID := now
	updatedByUserID := now + 1
	mockedUser := userpb.User{
		Id:        updatedByUserID,
		FirstName: "User",
		LastName:  "McUser",
		Email:     "user@email.com",
		JobTitle:  proto.String("RN"),
	}
	newVisitSummaryBody := "new visit summary"

	episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{
		customMarket: getMockedMarket(now),
	})
	if err != nil {
		t.Fatal(err.Error())
	}
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:       episode.episode.ID,
		createdByUserID: &createdByUserID,
	})
	visit := visitResult.visit

	_, err = db.queries.CreateVisitSummary(ctx, caremanagerdb.CreateVisitSummaryParams{
		VisitID:         visit.ID,
		Body:            "some summary",
		CreatedByUserID: sqltypes.ToNullInt64(&createdByUserID),
	})
	if err != nil {
		t.Fatal(err.Error())
	}

	tcs := []struct {
		name              string
		request           *caremanagerpb.UpdateVisitSummaryRequest
		userServiceClient MockUserServiceClient

		want       *caremanagerpb.UpdateVisitSummaryResponse
		wantErrMsg string
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateVisitSummaryRequest{
				Body:    newVisitSummaryBody,
				VisitId: visit.ID,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &mockedUser,
				},
			},

			want: &caremanagerpb.UpdateVisitSummaryResponse{
				Summary: &caremanagerpb.VisitSummary{
					VisitId:         visit.ID,
					Body:            newVisitSummaryBody,
					CreatedByUserId: proto.Int64(createdByUserID),
					UpdatedByUserId: proto.Int64(updatedByUserID),
				},
			},
		},
		{
			name: "fails because summary body is empty",
			request: &caremanagerpb.UpdateVisitSummaryRequest{
				Body:    "",
				VisitId: visit.ID,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &mockedUser,
				},
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = new visit summary body cannot be empty",
		},
		{
			name: "fails because visit does not exist",
			request: &caremanagerpb.UpdateVisitSummaryRequest{
				Body:    newVisitSummaryBody,
				VisitId: now,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &mockedUser,
				},
			},

			wantErrMsg: fmt.Sprintf("rpc error: code = NotFound desc = the visit with ID %d does not have a summary", now),
		},
		{
			name: "fails because the UserServices returned an error",
			request: &caremanagerpb.UpdateVisitSummaryRequest{
				Body:    newVisitSummaryBody,
				VisitId: visit.ID,
			},
			userServiceClient: MockUserServiceClient{
				GetAuthenticatedUserErr: errors.New("get user error"),
			},

			wantErrMsg: "get user error",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db:                    db,
				mockUserServiceClient: &tc.userServiceClient,
			})

			ctxWithAuth := getContextWithAuth()

			resp, err := grpcServer.UpdateVisitSummary(ctxWithAuth, tc.request)

			if err != nil {
				testutils.MustMatch(t, tc.wantErrMsg, err.Error())
			}

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, tc.want, resp)
		})
	}
}

func TestUpdateVisitStatus(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	ctxWithAuth := getContextWithAuth()

	mockCareRequestID := time.Now().UnixNano()
	mockCareRequestID2 := mockCareRequestID + 1
	mockUser := userpb.User{Id: time.Now().UnixNano()}
	activeStatusString := "active"
	onRouteStatusString := "on_route"
	committedStatusString := "committed"
	onRouteStatus := caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_ROUTE
	committedStatus := caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_COMMITTED

	successfulLogisticsClientResponse := logisticspb.GetServiceRegionScheduleResponse{
		DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
			{
				Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: 1,
						Route: &logisticspb.ShiftTeamRoute{
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{
									Stop: &logisticspb.ShiftTeamRouteStop_Visit{
										Visit: &logisticspb.ShiftTeamVisit{CareRequestId: &mockCareRequestID2},
									},
								},
							},
						},
					},
				},
			},
		},
	}
	emptyLogisticsClientResponse := logisticspb.GetServiceRegionScheduleResponse{}

	episodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	committedVisitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:     episodeResult.episode.ID,
		careRequestID: &mockCareRequestID,
		status:        &committedStatusString,
	})

	activeVisitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:     episodeResult.episode.ID,
		careRequestID: &mockCareRequestID2,
		status:        &activeStatusString,
	})

	visitWithoutCRResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID: episodeResult.episode.ID,
		status:    &committedStatusString,
	})

	testCases := []struct {
		name                    string
		request                 *caremanagerpb.UpdateVisitStatusRequest
		logisticsClientResponse *logisticspb.GetServiceRegionScheduleResponse

		shouldHTTPServerFail bool
		want                 *caremanagerpb.UpdateVisitStatusResponse
		wantErr              error
	}{
		{
			name: "should update a visit status correctly",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: committedVisitResult.visit.ID,
				Status:  onRouteStatus,
			},
			logisticsClientResponse: &emptyLogisticsClientResponse,

			want: &caremanagerpb.UpdateVisitStatusResponse{
				Visit: &caremanagerpb.Visit{
					Id:              committedVisitResult.visit.ID,
					EpisodeId:       episodeResult.episode.ID,
					StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
					Status:          &onRouteStatusString,
					UpdatedByUserId: &mockUser.Id,
					CareRequestId:   &mockCareRequestID,
				},
			},
		},
		{
			name: "should retrieve and use shift team id when transitioning to committed status",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: activeVisitResult.visit.ID,
				Status:  committedStatus,
			},
			logisticsClientResponse: &successfulLogisticsClientResponse,

			want: &caremanagerpb.UpdateVisitStatusResponse{
				Visit: &caremanagerpb.Visit{
					Id:              activeVisitResult.visit.ID,
					EpisodeId:       episodeResult.episode.ID,
					StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
					Status:          &committedStatusString,
					ProviderUserIds: []int64{66, 77},
					UpdatedByUserId: &mockUser.Id,
					CareRequestId:   &mockCareRequestID2,
				},
			},
		},
		{
			name: "should return an error when there isn't an available shift team",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: activeVisitResult.visit.ID,
				Status:  committedStatus,
			},
			logisticsClientResponse: &emptyLogisticsClientResponse,

			wantErr: status.Error(codes.FailedPrecondition, "could not find an available shift team for that visit"),
		},
		{
			name: "should return error when the visit does not exist",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: visitWithoutCRResult.visit.ID + 1,
				Status:  onRouteStatus,
			},

			wantErr: status.Error(codes.NotFound, ErrVisitNotFoundMessage),
		},
		{
			name: "should return error when the visit does not have a care request associated",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: visitWithoutCRResult.visit.ID,
				Status:  onRouteStatus,
			},

			wantErr: status.Error(codes.FailedPrecondition, "the visit doesn't have a reference to a care request"),
		},
		{
			name: "should forward errors from the station client",
			request: &caremanagerpb.UpdateVisitStatusRequest{
				VisitId: committedVisitResult.visit.ID,
				Status:  onRouteStatus,
			},
			logisticsClientResponse: &emptyLogisticsClientResponse,

			shouldHTTPServerFail: true,
			wantErr:              status.Error(codes.InvalidArgument, "HTTP request had error response 422: unprocessable entity"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, t *http.Request) {
				if tc.shouldHTTPServerFail {
					rw.WriteHeader(http.StatusUnprocessableEntity)
					rw.Write([]byte("unprocessable entity"))
				} else {
					rw.WriteHeader(http.StatusOK)
				}
			}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				db:         db,
				stationURL: testServer.URL,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &mockUser,
					},
				},
				mockShiftTeamServiceClient: &MockShiftTeamServiceClient{
					GetShiftTeamResult: &shiftteampb.GetShiftTeamResponse{
						ShiftTeam: &shiftteampb.ShiftTeam{
							MemberIds: []int64{66, 77},
						},
					},
				},
				mockLogisticsServiceClient: &MockLogisticsServiceClient{
					GetServiceRegionScheduleResponse: tc.logisticsClientResponse,
				},
			})

			response, err := grpcServer.UpdateVisitStatus(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err, "update visit status error does not match")

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, tc.want, response, "update visit status response does not match")
		})
	}
}

func TestUpdateVisit(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	ctxWithAuth := getContextWithAuth()

	mockUser := userpb.User{Id: time.Now().UnixNano()}

	episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	dailyUpdateType, err := db.queries.GetVisitTypeByName(ctx, visitTypeDailyUpdateName)
	if err != nil {
		t.Fatal(err)
	}

	extendedCareType, err := db.queries.GetVisitTypeByName(ctx, visitTypeExtendedCareName)
	if err != nil {
		t.Fatal(err)
	}

	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:       episode.episode.ID,
		visitTypeID:     &dailyUpdateType.ID,
		createdByUserID: &mockUser.Id,
	})
	visit := visitResult.visit

	visit.VisitTypeID = sqltypes.ToNullInt64(&extendedCareType.ID)

	currentMarkets, _, _ := getCurrentConfig(ctxWithAuth, t, db)

	failedVisitTypeID := int64(0)

	createdAt := visit.CreatedAt.Format(timestampLayout)

	statusGroup := VisitStatusGroupFromVisitStatusSQLString(visit.Status)

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateVisitRequest
		context context.Context

		want    *caremanagerpb.UpdateVisitResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateVisitRequest{
				VisitId:     visit.ID,
				VisitTypeId: &extendedCareType.ID,
			},
			context: ctxWithAuth,

			want: &caremanagerpb.UpdateVisitResponse{
				Visit: &caremanagerpb.Visit{
					Id:                       visit.ID,
					EpisodeId:                visit.EpisodeID,
					CreatedAt:                createdAt,
					Status:                   sqltypes.ToProtoString(visit.Status),
					CarName:                  sqltypes.ToProtoString(visit.CarName),
					ProviderUserIds:          visit.ProviderUserIds,
					CreatedByUserId:          sqltypes.ToProtoInt64(visit.CreatedByUserID),
					UpdatedByUserId:          sqltypes.ToProtoInt64(visit.UpdatedByUserID),
					AddressId:                sqltypes.ToProtoInt64(visit.AddressID),
					PatientAvailabilityStart: sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityStart),
					PatientAvailabilityEnd:   sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityEnd),
					StatusGroup:              statusGroup,
					TypeId:                   &extendedCareType.ID,
				},
			},
		},
		{
			name: "it should throw error if Visit doesn't exist",
			request: &caremanagerpb.UpdateVisitRequest{
				VisitId: 0,
			},
			context: ctxWithAuth,

			wantErr: status.Error(codes.NotFound, ErrVisitNotFoundMessage),
		},
		{
			name: "it should throw error if VisitType id doesn't exist",
			request: &caremanagerpb.UpdateVisitRequest{
				VisitId:     visit.ID,
				VisitTypeId: &failedVisitTypeID,
			},
			context: ctxWithAuth,

			wantErr: status.Errorf(codes.InvalidArgument, "VisitType doesn't exist"),
		},
		{
			name: "it should fail if the request doesn't include authentication",
			request: &caremanagerpb.UpdateVisitRequest{
				VisitId:     visit.ID,
				VisitTypeId: &extendedCareType.ID,
			},
			context: ctx,

			wantErr: errors.New(`missing "Authorization" header`),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockMarketServiceClient: &MockMarketServiceClient{
					GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
						Markets: currentMarkets,
					},
				},
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{
							Id: mockUser.Id,
						},
					},
				},
			})

			response, err := grpcServer.UpdateVisit(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err, "expected error and actual error don't match")
			testutils.MustMatchFn(".UpdatedAt")(t, testCase.want, response, "expected response and actual response don't match")
		})
	}
}

func TestCreatePatientEpisodeAndVisit(t *testing.T) {
	_, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	mustMatchResponse := testutils.MustMatchFn(".Id", ".EpisodeId", ".Episode", ".Patient", ".CreatedAt", ".StatusGroup", ".UpdatedAt", ".Type", ".UpdatedByUserId")
	mustMatchPatientResponse := testutils.MustMatchFn(".Id", ".AthenaMedicalRecordNumber", ".CreatedAt", ".UpdatedAt", ".DateOfBirth")
	mustMatchEpisodeResponse := testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt", ".AdmittedAt", ".CarePhase", ".Patient", ".Source", ".PatientId")
	nowTime := time.Now().Format(timestampLayout)

	ctxWithAuth := getContextWithAuth()
	athenaMedicalRecordNumber := strconv.FormatInt(time.Now().UnixNano(), 10)
	careRequestID := time.Now().UnixNano()
	createdByUserID := careRequestID + 1
	addressID := createdByUserID + 2
	careRequestID2 := careRequestID + 3
	careRequestID3 := careRequestID + 4
	patient := &caremanagerpb.CreatePatientFromStationCRRequest{
		FirstName:                 "John",
		MiddleName:                nil,
		LastName:                  "Doe",
		DateOfBirth:               "1998-01-30",
		Sex:                       "Male",
		PhoneNumber:               "+523323844908",
		AthenaMedicalRecordNumber: athenaMedicalRecordNumber,
		MedicalDecisionMaker: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
			FirstName:    "Johny Cash",
			LastName:     nil,
			PhoneNumber:  nil,
			Address:      nil,
			Relationship: nil,
		},
		Insurances: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
			{
				Name:     "Humana lower priority",
				MemberId: proto.String("12345"),
				Priority: proto.Int32(int32(2)),
			},
			{
				Name:     "Humana higher priority",
				MemberId: proto.String("1234"),
				Priority: proto.Int32(int32(1)),
			},
		},
		AddressStreet:   proto.String("Address street"),
		AddressStreet_2: nil,
		AddressCity:     proto.String("Las Vegas"),
		AddressState:    proto.String("Nevada"),
		AddressZipcode:  proto.String("12345"),
		AddressId:       proto.Int64(int64(123)),
	}
	payer := "Payer"
	source := "Source"
	wantStatus := "status"
	carName := "LAS01"
	carID := int64(1)
	marketID := int64(1)
	providerUserIds := []int64{1234}

	mockStatsigProvider := providers.StartMockStatsigProvider(t)

	testCases := []struct {
		name             string
		isFeatureEnabled bool
		context          context.Context
		request          *caremanagerpb.CreateVisitFromStationCRRequest
		newEpisode       bool
		newPatient       bool

		wantErr error
		want    *caremanagerpb.CreateVisitFromStationCRResponse
	}{
		{
			name:             "works creating visit, episode and patient",
			isFeatureEnabled: true,
			context:          ctxWithAuth,
			request: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient:                  patient,
				CareRequestId:            careRequestID,
				ServiceLineId:            4,
				MarketId:                 marketID,
				PatientSummary:           nil,
				Payer:                    &payer,
				Source:                   &source,
				OriginalCareRequestId:    careRequestID,
				CreatedByUserId:          &createdByUserID,
				Status:                   wantStatus,
				StatusUpdatedAt:          nowTime,
				AddressId:                addressID,
				PatientAvailabilityStart: nowTime,
				PatientAvailabilityEnd:   nowTime,
				CarName:                  carName,
				CarId:                    &carID,
				ProviderUserIds:          providerUserIds,
			},
			newEpisode: true,
			newPatient: true,

			want: &caremanagerpb.CreateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					Status:                   &wantStatus,
					CarName:                  &carName,
					CarId:                    &carID,
					ProviderUserIds:          providerUserIds,
					CreatedByUserId:          &createdByUserID,
					AddressId:                &addressID,
					PatientAvailabilityStart: &nowTime,
					PatientAvailabilityEnd:   &nowTime,
					Summary:                  nil,
					CareRequestId:            &careRequestID,
				},
				Episode: nil,
				Patient: nil,
			},
		},
		{
			name:             "fails when trying to create an already created care request",
			isFeatureEnabled: true,
			context:          ctxWithAuth,
			request: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient:                  patient,
				CareRequestId:            careRequestID,
				ServiceLineId:            4,
				MarketId:                 marketID,
				PatientSummary:           nil,
				Payer:                    &payer,
				Source:                   &source,
				OriginalCareRequestId:    careRequestID,
				CreatedByUserId:          &createdByUserID,
				Status:                   wantStatus,
				StatusUpdatedAt:          nowTime,
				AddressId:                addressID,
				PatientAvailabilityStart: nowTime,
				PatientAvailabilityEnd:   nowTime,
				CarName:                  carName,
				CarId:                    &carID,
				ProviderUserIds:          providerUserIds,
			},
			newEpisode: false,
			newPatient: false,

			wantErr: status.Errorf(codes.AlreadyExists, "the requested care request already exists"),
		},
		{
			name:             "works creating only a visit",
			isFeatureEnabled: true,
			context:          ctxWithAuth,
			request: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient:                  patient,
				CareRequestId:            careRequestID2,
				ServiceLineId:            4,
				MarketId:                 marketID,
				PatientSummary:           nil,
				Payer:                    &payer,
				Source:                   &source,
				CreatedByUserId:          &createdByUserID,
				Status:                   wantStatus,
				StatusUpdatedAt:          nowTime,
				AddressId:                addressID,
				PatientAvailabilityStart: nowTime,
				PatientAvailabilityEnd:   nowTime,
				CarName:                  carName,
				CarId:                    &carID,
				ProviderUserIds:          providerUserIds,
				OriginalCareRequestId:    careRequestID,
			},
			newEpisode: false,
			newPatient: false,

			want: &caremanagerpb.CreateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					Status:                   &wantStatus,
					CarName:                  &carName,
					CarId:                    &carID,
					ProviderUserIds:          providerUserIds,
					CreatedByUserId:          &createdByUserID,
					AddressId:                &addressID,
					PatientAvailabilityStart: &nowTime,
					PatientAvailabilityEnd:   &nowTime,
					Summary:                  nil,
					CareRequestId:            &careRequestID2,
				},
				Episode: nil,
				Patient: nil,
			},
		},
		{
			name:             "works creating a visit and episode reusing patient",
			isFeatureEnabled: true,
			context:          ctxWithAuth,
			request: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient:                  patient,
				CareRequestId:            careRequestID3,
				ServiceLineId:            4,
				MarketId:                 marketID,
				PatientSummary:           nil,
				Payer:                    &payer,
				Source:                   &source,
				CreatedByUserId:          &createdByUserID,
				Status:                   wantStatus,
				StatusUpdatedAt:          nowTime,
				AddressId:                addressID,
				PatientAvailabilityStart: nowTime,
				PatientAvailabilityEnd:   nowTime,
				CarName:                  carName,
				CarId:                    &carID,
				ProviderUserIds:          providerUserIds,
				OriginalCareRequestId:    careRequestID3,
			},
			newEpisode: true,
			newPatient: false,

			want: &caremanagerpb.CreateVisitFromStationCRResponse{
				Visit: &caremanagerpb.Visit{
					Status:                   &wantStatus,
					CarName:                  &carName,
					CarId:                    &carID,
					ProviderUserIds:          providerUserIds,
					CreatedByUserId:          &createdByUserID,
					AddressId:                &addressID,
					PatientAvailabilityStart: &nowTime,
					PatientAvailabilityEnd:   &nowTime,
					Summary:                  nil,
					CareRequestId:            &careRequestID3,
				},
				Episode: nil,
				Patient: nil,
			},
		},
		{
			name:             "fails because feature gate is not enabled",
			isFeatureEnabled: false,
			context:          ctxWithAuth,
			request: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient:                  patient,
				CareRequestId:            careRequestID,
				ServiceLineId:            4,
				MarketId:                 marketID,
				PatientSummary:           nil,
				Payer:                    &payer,
				Source:                   &source,
				OriginalCareRequestId:    careRequestID,
				CreatedByUserId:          &createdByUserID,
				Status:                   wantStatus,
				StatusUpdatedAt:          nowTime,
				AddressId:                addressID,
				PatientAvailabilityStart: nowTime,
				PatientAvailabilityEnd:   nowTime,
				CarName:                  carName,
				CarId:                    &carID,
				ProviderUserIds:          providerUserIds,
			},
			newEpisode: false,
			newPatient: false,

			wantErr: status.Errorf(codes.PermissionDenied, "this feature is still not enabled"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, t *http.Request) {
				rw.WriteHeader(http.StatusOK)
			}))
			defer testServer.Close()
			mockSegmentProvider := NewSegmentClient(&NewSegmentClientParameters{
				URL: testServer.URL,
			})
			mockStatsigProvider.OverrideGate(VisitsV1StatsigFlag, testCase.isFeatureEnabled)
			grpcServer := getGRPCServer(getGRPCServerParams{
				db:              db,
				statsigProvider: mockStatsigProvider,
				segmentClient:   mockSegmentProvider,
			})

			resp, err := grpcServer.CreateVisitFromStationCR(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")

			if testCase.newEpisode {
				if testCase.newPatient {
					mustMatchResponse(t, testCase.want, resp)
					mustMatchPatientResponse(t, &caremanagerpb.Patient{
						FirstName:                     patient.FirstName,
						MiddleName:                    patient.MiddleName,
						LastName:                      patient.LastName,
						Sex:                           patient.Sex,
						PhoneNumber:                   proto.String(patient.PhoneNumber),
						MedicalPowerOfAttorneyDetails: proto.String(patient.MedicalDecisionMaker.FirstName),
						Payer:                         proto.String(patient.Insurances[1].Name),
						AddressStreet:                 patient.AddressStreet,
						AddressState:                  patient.AddressState,
						AddressZipcode:                patient.AddressZipcode,
						AddressCity:                   patient.AddressCity,
						AthenaId:                      proto.String(patient.AthenaMedicalRecordNumber),
					}, resp.Patient)
				} else {
					mustMatchResponse(t, testCase.want, resp)
					mustMatchEpisodeResponse(t, &caremanagerpb.Episode{
						Payer:          testCase.request.Payer,
						ServiceLineId:  testCase.request.ServiceLineId,
						MarketId:       marketID,
						PatientSummary: defaultSummary,
					}, resp.Episode)
				}
			} else if testCase.wantErr == nil {
				mustMatchResponse(t, testCase.want, resp)
				testutils.MustMatch(t, &caremanagerpb.Patient{}, resp.Patient)
				testutils.MustMatch(t, &caremanagerpb.Episode{}, resp.Episode)
			}
		})
	}
}

func TestCreateInsurance(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createdPatient, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutInsurance: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	createdPatientWithTwoInsurances, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutInsurance: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:      "insurance_1",
		priority:  1,
		patientID: createdPatientWithTwoInsurances.ID,
	})

	createdPatientWithThreeInsurances, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutInsurance: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:      "insurance_1",
		priority:  1,
		patientID: createdPatientWithThreeInsurances.ID,
	})

	createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:      "insurance_2",
		priority:  2,
		patientID: createdPatientWithThreeInsurances.ID,
	})

	createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:      "insurance_3",
		priority:  3,
		patientID: createdPatientWithThreeInsurances.ID,
	})

	createdPatientWithInsuranceOutOfRange, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutInsurance: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:      "insurance_3",
		priority:  3,
		patientID: createdPatientWithInsuranceOutOfRange.ID,
	})

	mockMemberID := "member_id"

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateInsuranceRequest

		want    *caremanagerpb.CreateInsuranceResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateInsuranceRequest{
				PatientId: createdPatient.ID,
				Name:      "insurance_1",
				MemberId:  &mockMemberID,
			},

			want: &caremanagerpb.CreateInsuranceResponse{
				Insurance: &caremanagerpb.Insurance{
					Name:      "insurance_1",
					MemberId:  &mockMemberID,
					Priority:  1,
					PatientId: createdPatient.ID,
				},
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Name:      "insurance_1",
						MemberId:  &mockMemberID,
						Priority:  1,
						PatientId: createdPatient.ID,
					},
				},
			},
		},
		{
			name: "works (it should append the insurance to current patient insurances, priority must be incremental)",
			request: &caremanagerpb.CreateInsuranceRequest{
				PatientId: createdPatientWithTwoInsurances.ID,
				Name:      "insurance_2",
			},

			want: &caremanagerpb.CreateInsuranceResponse{
				Insurance: &caremanagerpb.Insurance{
					Name:      "insurance_2",
					Priority:  2,
					PatientId: createdPatientWithTwoInsurances.ID,
				},
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Name:      "insurance_1",
						PatientId: createdPatientWithTwoInsurances.ID,

						Priority: 1,
					},
					{
						Name:      "insurance_2",
						PatientId: createdPatientWithTwoInsurances.ID,

						Priority: 2,
					},
				},
			},
		},
		{
			name: "it should return error if the insurance name is empty",
			request: &caremanagerpb.CreateInsuranceRequest{
				Name: "",
			},

			wantErr: status.Errorf(codes.InvalidArgument, "name cannot be empty"),
		},
		{
			name: "it should return error if the patient does not exist",
			request: &caremanagerpb.CreateInsuranceRequest{
				Name:      "insurance_gg",
				PatientId: 0,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "patient not found"),
		},
		{
			name: "it should return error when trying to create more than three insurances per patient",
			request: &caremanagerpb.CreateInsuranceRequest{
				Name:      "insurance_4",
				PatientId: createdPatientWithThreeInsurances.ID,
			},

			wantErr: status.Errorf(codes.FailedPrecondition, "cannot create more than three insurances per patient"),
		},
		{
			name: "it should return error when trying to create an insurance whose calculated priority is greater than the allowed priority",
			request: &caremanagerpb.CreateInsuranceRequest{
				Name:      "insurance_4",
				PatientId: createdPatientWithInsuranceOutOfRange.ID,
			},

			wantErr: status.Errorf(codes.FailedPrecondition, "cannot assign priority to insurance, priority is out of range"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.CreateInsurance(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)
		})
	}
}

func TestUpdateInsurance(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	currentMemberID := "1"

	insuranceToUpdate := createTestInsurance(ctx, t, db, createTestInsuranceParams{
		name:     "insurance_name",
		memberID: &currentMemberID,
	})

	newInsuranceName := "new_insurance_name"
	newMemberID := "2"

	emptyInsuranceName := ""
	emptyMemberID := ""

	insuranceToUpdateWithEmptyRequest := createTestInsurance(ctx, t, db, createTestInsuranceParams{})

	insuranceToUpdateWithEmptyMemberID := createTestInsurance(ctx, t, db, createTestInsuranceParams{})

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateInsuranceRequest

		want    *caremanagerpb.UpdateInsuranceResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateInsuranceRequest{
				InsuranceId: insuranceToUpdate.ID,
				Name:        &newInsuranceName,
				MemberId:    &newMemberID,
			},

			want: &caremanagerpb.UpdateInsuranceResponse{
				Insurance: &caremanagerpb.Insurance{
					Id:        insuranceToUpdate.ID,
					Name:      newInsuranceName,
					MemberId:  &newMemberID,
					Priority:  insuranceToUpdate.Priority,
					PatientId: insuranceToUpdate.PatientID,
				},
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Id:        insuranceToUpdate.ID,
						Name:      newInsuranceName,
						MemberId:  &newMemberID,
						Priority:  insuranceToUpdate.Priority,
						PatientId: insuranceToUpdate.PatientID,
					},
				},
			},
		},
		{
			name: "works (if member id is empty string, then replace it with null)",
			request: &caremanagerpb.UpdateInsuranceRequest{
				InsuranceId: insuranceToUpdateWithEmptyMemberID.ID,
				MemberId:    &emptyMemberID,
			},

			want: &caremanagerpb.UpdateInsuranceResponse{
				Insurance: &caremanagerpb.Insurance{
					Id:        insuranceToUpdateWithEmptyMemberID.ID,
					Name:      insuranceToUpdateWithEmptyMemberID.Name,
					MemberId:  nil,
					Priority:  insuranceToUpdateWithEmptyMemberID.Priority,
					PatientId: insuranceToUpdateWithEmptyMemberID.PatientID,
				},
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Id:        insuranceToUpdateWithEmptyMemberID.ID,
						Name:      insuranceToUpdateWithEmptyMemberID.Name,
						MemberId:  nil,
						Priority:  insuranceToUpdateWithEmptyMemberID.Priority,
						PatientId: insuranceToUpdateWithEmptyMemberID.PatientID,
					},
				},
			},
		},
		{
			name: "works (nothing is changed if request is empty)",
			request: &caremanagerpb.UpdateInsuranceRequest{
				InsuranceId: insuranceToUpdateWithEmptyRequest.ID,
			},
			want: &caremanagerpb.UpdateInsuranceResponse{
				Insurance: &caremanagerpb.Insurance{
					Id:        insuranceToUpdateWithEmptyRequest.ID,
					Name:      insuranceToUpdateWithEmptyRequest.Name,
					Priority:  insuranceToUpdateWithEmptyRequest.Priority,
					PatientId: insuranceToUpdateWithEmptyRequest.PatientID,
				},
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Id:        insuranceToUpdateWithEmptyRequest.ID,
						Name:      insuranceToUpdateWithEmptyRequest.Name,
						Priority:  insuranceToUpdateWithEmptyRequest.Priority,
						PatientId: insuranceToUpdateWithEmptyRequest.PatientID,
					},
				},
			},
		},
		{
			name: "it should return error if the insurance doesn't exist",
			request: &caremanagerpb.UpdateInsuranceRequest{
				InsuranceId: 0,
			},
			wantErr: status.Errorf(codes.NotFound, "Insurance not found"),
		},
		{
			name: "it should return error if the name is included but it's empty",
			request: &caremanagerpb.UpdateInsuranceRequest{
				InsuranceId: insuranceToUpdate.ID,
				Name:        &emptyInsuranceName,
			},
			wantErr: status.Errorf(codes.InvalidArgument, "name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.UpdateInsurance(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, testCase.want, response)
		})
	}
}

func TestDeleteInsurance(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	insuranceToDelete := createTestInsurance(ctx, t, db, createTestInsuranceParams{})

	firstInsuranceFromPatientWithThreeInsurances := createTestInsurance(ctx, t, db, createTestInsuranceParams{
		priority: 1,
	})

	secondInsuranceFromPatientWithThreeInsurances := createTestInsurance(ctx, t, db, createTestInsuranceParams{
		patientID: firstInsuranceFromPatientWithThreeInsurances.PatientID,
		priority:  2,
	})

	thirdInsuranceFromPatientWithThreeInsurances := createTestInsurance(ctx, t, db, createTestInsuranceParams{
		patientID: firstInsuranceFromPatientWithThreeInsurances.PatientID,
		priority:  3,
	})

	testCases := []struct {
		name    string
		request *caremanagerpb.DeleteInsuranceRequest

		wantRemainingInsurances []*caremanagerdb.Insurance
		want                    *caremanagerpb.DeleteInsuranceResponse
		wantErr                 error
	}{
		{
			name: "works",
			request: &caremanagerpb.DeleteInsuranceRequest{
				InsuranceId: insuranceToDelete.ID,
			},

			want: &caremanagerpb.DeleteInsuranceResponse{},
		},
		{
			name: "works (when deleting an insurance, priority order should be updated for all remaining insurances from patient)",
			request: &caremanagerpb.DeleteInsuranceRequest{
				InsuranceId: firstInsuranceFromPatientWithThreeInsurances.ID,
			},

			want: &caremanagerpb.DeleteInsuranceResponse{
				PatientInsurances: []*caremanagerpb.Insurance{
					{
						Id:        secondInsuranceFromPatientWithThreeInsurances.ID,
						Name:      secondInsuranceFromPatientWithThreeInsurances.Name,
						MemberId:  sqltypes.ToProtoString(secondInsuranceFromPatientWithThreeInsurances.MemberID),
						PatientId: secondInsuranceFromPatientWithThreeInsurances.PatientID,
						Priority:  1,
					},
					{
						Id:        thirdInsuranceFromPatientWithThreeInsurances.ID,
						Name:      thirdInsuranceFromPatientWithThreeInsurances.Name,
						MemberId:  sqltypes.ToProtoString(thirdInsuranceFromPatientWithThreeInsurances.MemberID),
						PatientId: thirdInsuranceFromPatientWithThreeInsurances.PatientID,
						Priority:  2,
					},
				},
			},
			wantRemainingInsurances: []*caremanagerdb.Insurance{
				{
					ID:        secondInsuranceFromPatientWithThreeInsurances.ID,
					Name:      secondInsuranceFromPatientWithThreeInsurances.Name,
					MemberID:  secondInsuranceFromPatientWithThreeInsurances.MemberID,
					PatientID: secondInsuranceFromPatientWithThreeInsurances.PatientID,
					CreatedAt: secondInsuranceFromPatientWithThreeInsurances.CreatedAt,
					UpdatedAt: secondInsuranceFromPatientWithThreeInsurances.UpdatedAt,
					DeletedAt: secondInsuranceFromPatientWithThreeInsurances.DeletedAt,
					Priority:  1,
				},
				{
					ID:        thirdInsuranceFromPatientWithThreeInsurances.ID,
					Name:      thirdInsuranceFromPatientWithThreeInsurances.Name,
					MemberID:  thirdInsuranceFromPatientWithThreeInsurances.MemberID,
					PatientID: thirdInsuranceFromPatientWithThreeInsurances.PatientID,
					CreatedAt: thirdInsuranceFromPatientWithThreeInsurances.CreatedAt,
					UpdatedAt: thirdInsuranceFromPatientWithThreeInsurances.UpdatedAt,
					DeletedAt: thirdInsuranceFromPatientWithThreeInsurances.DeletedAt,
					Priority:  2,
				},
			},
		},
		{
			name: "it should return error if insurance doesn't exist",
			request: &caremanagerpb.DeleteInsuranceRequest{
				InsuranceId: 0,
			},

			wantErr: status.Errorf(codes.NotFound, "Insurance not found"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.DeleteInsurance(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, testCase.want, response)
		})
	}
}

func TestCreateExternalCareProvider(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	providerTypeID := int64(1)

	patient, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutExternalReferrer: true,
		withoutExternalDoctor:   true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateExternalCareProviderRequest

		want    *caremanagerpb.CreateExternalCareProviderResponse
		wantErr error
	}{
		{
			name: "works setting all fields",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId:      patient.ID,
				Name:           "doctor_details",
				PhoneNumber:    proto.String("1234567890"),
				FaxNumber:      proto.String("0987654321"),
				Address:        proto.String("South East Ave North West corner"),
				ProviderTypeId: providerTypeID,
			},

			want: &caremanagerpb.CreateExternalCareProviderResponse{
				ExternalCareProvider: &caremanagerpb.ExternalCareProvider{
					Name:           "doctor_details",
					PhoneNumber:    proto.String("1234567890"),
					FaxNumber:      proto.String("0987654321"),
					Address:        proto.String("South East Ave North West corner"),
					ProviderTypeId: providerTypeID,
					PatientId:      patient.ID,
				},
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "doctor_details",
						PhoneNumber:    proto.String("1234567890"),
						FaxNumber:      proto.String("0987654321"),
						Address:        proto.String("South East Ave North West corner"),
						ProviderTypeId: providerTypeID,
						PatientId:      patient.ID,
					},
				},
			},
		},
		{
			name: "works with nullable data",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId:      patient.ID,
				Name:           "other_details",
				ProviderTypeId: providerTypeID,
			},

			want: &caremanagerpb.CreateExternalCareProviderResponse{
				ExternalCareProvider: &caremanagerpb.ExternalCareProvider{
					Name:           "other_details",
					ProviderTypeId: providerTypeID,
					PatientId:      patient.ID,
				},
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "doctor_details",
						PhoneNumber:    proto.String("1234567890"),
						FaxNumber:      proto.String("0987654321"),
						Address:        proto.String("South East Ave North West corner"),
						ProviderTypeId: providerTypeID,
						PatientId:      patient.ID,
					},
					{
						Name:           "other_details",
						ProviderTypeId: providerTypeID,
						PatientId:      patient.ID,
					},
				},
			},
		},
		{
			name: "it should return error if the external care provider name is empty",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId: patient.ID,
				Name:      "",
			},

			wantErr: status.Errorf(codes.InvalidArgument, nameCannotBeEmpty),
		},
		{
			name: "it should return error if the Patient does not exist",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId: 0,
				Name:      "doctor_details",
			},

			wantErr: status.Errorf(codes.InvalidArgument, "Patient not found"),
		},
	}

	for _, testCase := range testCases {
		grpcServer := getGRPCServer(getGRPCServerParams{
			db: db,
		})

		response, err := grpcServer.CreateExternalCareProvider(ctx, testCase.request)

		testutils.MustMatch(t, testCase.wantErr, err)
		testutils.MustMatchFn(".Id")(t, testCase.want, response)
	}
}

func TestCreatePharmacy(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	noPharmacyPatient, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutPharmacy: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}
	onePharmacyPatient, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutPharmacy: false,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	createTestPharmacy(ctx, t, db, createTestPharmacyParams{
		name:      "previously_created_pharmacy",
		patientID: onePharmacyPatient.ID,
	})

	testCases := []struct {
		name    string
		request *caremanagerpb.CreatePharmacyRequest

		want    *caremanagerpb.CreatePharmacyResponse
		wantErr error
	}{
		{
			name: "works with a Patient without Pharmacies",
			request: &caremanagerpb.CreatePharmacyRequest{
				PatientId:   noPharmacyPatient.ID,
				Name:        "newly_created_pharmacy",
				PhoneNumber: proto.String("1234567890"),
				FaxNumber:   proto.String("0987654321"),
				Address:     proto.String("South West Ave. North East corner"),
			},

			want: &caremanagerpb.CreatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Name:        "newly_created_pharmacy",
					PhoneNumber: proto.String("1234567890"),
					FaxNumber:   proto.String("0987654321"),
					Address:     proto.String("South West Ave. North East corner"),
					PatientId:   noPharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Name:        "newly_created_pharmacy",
						PhoneNumber: proto.String("1234567890"),
						FaxNumber:   proto.String("0987654321"),
						Address:     proto.String("South West Ave. North East corner"),
						PatientId:   noPharmacyPatient.ID,
					},
				},
			},
		}, {
			name: "works when a Patient has a Pharmacy already assigned and nullable fields",
			request: &caremanagerpb.CreatePharmacyRequest{
				PatientId: onePharmacyPatient.ID,
				Name:      "newly_created_pharmacy_2",
			},

			want: &caremanagerpb.CreatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Name:      "newly_created_pharmacy_2",
					PatientId: onePharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Name:      "Pharmacy",
						PatientId: onePharmacyPatient.ID,
					},
					{
						Name:      "previously_created_pharmacy",
						PatientId: onePharmacyPatient.ID,
					},
					{
						Name:      "newly_created_pharmacy_2",
						PatientId: onePharmacyPatient.ID,
					},
				},
			},
		}, {
			name: "it should return error if the Pharmacy name is empty",
			request: &caremanagerpb.CreatePharmacyRequest{
				Name:      "",
				PatientId: onePharmacyPatient.ID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "name cannot be empty"),
		}, {
			name: "it should return error if the patient does not exist",
			request: &caremanagerpb.CreatePharmacyRequest{
				Name:      "this is not the way",
				PatientId: 0,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "Patient not found"),
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.CreatePharmacy(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)
		})
	}
}

func TestUpdatePharmacy(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	onePharmacyPatient, err := createTestPatient(ctx, db, createTestPatientParams{
		withoutPharmacy: true,
	})
	if err != nil {
		t.Fatalf(err.Error())
	}

	pharmacyToUpdate := createTestPharmacy(ctx, t, db, createTestPharmacyParams{
		name:        "previously_created_pharmacy",
		faxNumber:   proto.String("1234567890"),
		address:     proto.String("South West Ave. North East corner"),
		phoneNumber: proto.String("0987654321"),
		patientID:   onePharmacyPatient.ID,
	})

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdatePharmacyRequest

		want    *caremanagerpb.UpdatePharmacyResponse
		wantErr error
	}{
		{
			name: "works updating all fields",
			request: &caremanagerpb.UpdatePharmacyRequest{
				PharmacyId:  pharmacyToUpdate.ID,
				Name:        proto.String("newly_updated_pharmacy"),
				PhoneNumber: proto.String("5555555555"),
				FaxNumber:   proto.String("6666666666"),
				Address:     proto.String("South West Ave. North East corner"),
			},

			want: &caremanagerpb.UpdatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Id:          pharmacyToUpdate.ID,
					Name:        "newly_updated_pharmacy",
					PhoneNumber: proto.String("5555555555"),
					FaxNumber:   proto.String("6666666666"),
					Address:     proto.String("South West Ave. North East corner"),
					PatientId:   onePharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Id:          pharmacyToUpdate.ID,
						Name:        "newly_updated_pharmacy",
						PhoneNumber: proto.String("5555555555"),
						FaxNumber:   proto.String("6666666666"),
						Address:     proto.String("South West Ave. North East corner"),
						PatientId:   onePharmacyPatient.ID,
					},
				},
			},
		},
		{
			name: "works updating only name",
			request: &caremanagerpb.UpdatePharmacyRequest{
				PharmacyId: pharmacyToUpdate.ID,
				Name:       proto.String("newly_updated_pharmacy but with missing details"),
			},

			want: &caremanagerpb.UpdatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Id:          pharmacyToUpdate.ID,
					Name:        "newly_updated_pharmacy but with missing details",
					PhoneNumber: proto.String("5555555555"),
					FaxNumber:   proto.String("6666666666"),
					Address:     proto.String("South West Ave. North East corner"),
					PatientId:   onePharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Id:          pharmacyToUpdate.ID,
						Name:        "newly_updated_pharmacy but with missing details",
						PhoneNumber: proto.String("5555555555"),
						FaxNumber:   proto.String("6666666666"),
						Address:     proto.String("South West Ave. North East corner"),
						PatientId:   onePharmacyPatient.ID,
					},
				},
			},
		},
		{
			name: "works updating only address",
			request: &caremanagerpb.UpdatePharmacyRequest{
				PharmacyId: pharmacyToUpdate.ID,
				Address:    proto.String("South West Ave. North East corner Ste. A"),
			},

			want: &caremanagerpb.UpdatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Id:          pharmacyToUpdate.ID,
					Name:        "newly_updated_pharmacy but with missing details",
					PhoneNumber: proto.String("5555555555"),
					FaxNumber:   proto.String("6666666666"),
					Address:     proto.String("South West Ave. North East corner Ste. A"),
					PatientId:   onePharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Id:          pharmacyToUpdate.ID,
						Name:        "newly_updated_pharmacy but with missing details",
						PhoneNumber: proto.String("5555555555"),
						FaxNumber:   proto.String("6666666666"),
						Address:     proto.String("South West Ave. North East corner Ste. A"),
						PatientId:   onePharmacyPatient.ID,
					},
				},
			},
		},
		{
			name: "works updating only phone numbers",
			request: &caremanagerpb.UpdatePharmacyRequest{
				PharmacyId:  pharmacyToUpdate.ID,
				PhoneNumber: proto.String("1111111111"),
				FaxNumber:   proto.String("2222222222"),
			},

			want: &caremanagerpb.UpdatePharmacyResponse{
				Pharmacy: &caremanagerpb.Pharmacy{
					Id:          pharmacyToUpdate.ID,
					Name:        "newly_updated_pharmacy but with missing details",
					PhoneNumber: proto.String("1111111111"),
					FaxNumber:   proto.String("2222222222"),
					Address:     proto.String("South West Ave. North East corner Ste. A"),
					PatientId:   onePharmacyPatient.ID,
				},
				PatientPharmacies: []*caremanagerpb.Pharmacy{
					{
						Id:          pharmacyToUpdate.ID,
						Name:        "newly_updated_pharmacy but with missing details",
						PhoneNumber: proto.String("1111111111"),
						FaxNumber:   proto.String("2222222222"),
						Address:     proto.String("South West Ave. North East corner Ste. A"),
						PatientId:   onePharmacyPatient.ID,
					},
				},
			},
		},
		{
			name: "it should return error if the Pharmacy name is empty",
			request: &caremanagerpb.UpdatePharmacyRequest{
				Name:       proto.String(""),
				PharmacyId: pharmacyToUpdate.ID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "name cannot be empty"),
		},
		{
			name: "it should return error if the Pharmacy is not found",
			request: &caremanagerpb.UpdatePharmacyRequest{
				Name:       proto.String("new name"),
				PharmacyId: time.Now().UnixNano(),
			},

			wantErr: status.Errorf(codes.InvalidArgument, "Pharmacy not found"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.UpdatePharmacy(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)
		})
	}
}

func TestCreateMedicalDecisionMaker(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	testPatient, err := createTestPatient(ctx, db, createTestPatientParams{withoutMedicalDecisionMaker: true})
	if err != nil {
		t.Fatal(err)
	}

	address := "test address"
	phoneNumer := "111-111-111"
	relationship := "relationship"

	createdMedicalDecisionMaker := createTestMedicalDecisionMaker(ctx, t, db, createTestMedicalDecisionMakerParams{})

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateMedicalDecisionMakerRequest

		want    *caremanagerpb.CreateMedicalDecisionMakerResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    testPatient.ID,
				FirstName:    "John",
				LastName:     "Eckert",
				PhoneNumber:  &phoneNumer,
				Address:      &address,
				Relationship: &relationship,
			},
			want: &caremanagerpb.CreateMedicalDecisionMakerResponse{
				MedicalDecisionMaker: &caremanagerpb.MedicalDecisionMaker{
					FirstName:    "John",
					LastName:     "Eckert",
					PhoneNumber:  &phoneNumer,
					Address:      &address,
					Relationship: &relationship,
					PatientId:    testPatient.ID,
				},
				PatientMedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{
					{
						FirstName:    "John",
						LastName:     "Eckert",
						PhoneNumber:  &phoneNumer,
						Address:      &address,
						Relationship: &relationship,
						PatientId:    testPatient.ID,
					},
				},
			},
		},
		{
			name: "works (it returns mdm from patient if there is already one created)",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    createdMedicalDecisionMaker.PatientID,
				FirstName:    "John",
				LastName:     "Eckert",
				PhoneNumber:  &phoneNumer,
				Address:      &address,
				Relationship: &relationship,
			},
			want: &caremanagerpb.CreateMedicalDecisionMakerResponse{
				MedicalDecisionMaker: &caremanagerpb.MedicalDecisionMaker{
					FirstName:    "John",
					LastName:     "Eckert",
					PhoneNumber:  &phoneNumer,
					Address:      &address,
					Relationship: &relationship,
					PatientId:    createdMedicalDecisionMaker.PatientID,
				},
				PatientMedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{
					{
						FirstName:    createdMedicalDecisionMaker.FirstName,
						LastName:     createdMedicalDecisionMaker.LastName,
						PhoneNumber:  sqltypes.ToProtoString(createdMedicalDecisionMaker.PhoneNumber),
						Address:      sqltypes.ToProtoString(createdMedicalDecisionMaker.Address),
						Relationship: sqltypes.ToProtoString(createdMedicalDecisionMaker.Relationship),
						PatientId:    createdMedicalDecisionMaker.PatientID,
					},
					{
						FirstName:    "John",
						LastName:     "Eckert",
						PhoneNumber:  &phoneNumer,
						Address:      &address,
						Relationship: &relationship,
						PatientId:    createdMedicalDecisionMaker.PatientID,
					},
				},
			},
		},
		{
			name: "it should return error if patient is not found",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId: 0,
			},
			wantErr: status.Errorf(codes.InvalidArgument, "Patient not found"),
		},
		{
			name: "it should return error if first name is empty",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    testPatient.ID,
				FirstName:    "",
				LastName:     "Eckert",
				PhoneNumber:  &phoneNumer,
				Address:      &address,
				Relationship: &relationship,
			},
			wantErr: status.Error(codes.InvalidArgument, "first_name cannot be empty"),
		},
		{
			name: "it should return error if last name is empty",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    testPatient.ID,
				FirstName:    "John",
				LastName:     "",
				PhoneNumber:  &phoneNumer,
				Address:      &address,
				Relationship: &relationship,
			},
			wantErr: status.Error(codes.InvalidArgument, "last_name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})
			response, err := grpcServer.CreateMedicalDecisionMaker(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)
		})
	}
}

func TestUpdateMedicalDecisionMaker(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	createdMaker := createTestMedicalDecisionMaker(ctx, t, db, createTestMedicalDecisionMakerParams{})

	newPhoneNumber := "new_phone_number"
	newAddress := "new_address"
	newRelationship := "new_relationship"
	newFirstName := "new_first_name"
	newLastName := "new_last_name"

	makerToEmptyUpdate := createTestMedicalDecisionMaker(ctx, t, db, createTestMedicalDecisionMakerParams{})

	emptyFirstName := ""
	emptyLastName := ""

	testCases := []struct {
		name string

		request *caremanagerpb.UpdateMedicalDecisionMakerRequest

		want    *caremanagerpb.UpdateMedicalDecisionMakerResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				MedicalDecisionMakerId: createdMaker.ID,
				FirstName:              &newFirstName,
				LastName:               &newLastName,
				PhoneNumber:            &newPhoneNumber,
				Relationship:           &newRelationship,
				Address:                &newAddress,
			},

			want: &caremanagerpb.UpdateMedicalDecisionMakerResponse{
				MedicalDecisionMaker: &caremanagerpb.MedicalDecisionMaker{
					Id:           createdMaker.ID,
					FirstName:    newFirstName,
					LastName:     newLastName,
					PhoneNumber:  &newPhoneNumber,
					Relationship: &newRelationship,
					Address:      &newAddress,
					PatientId:    createdMaker.PatientID,
				},
				PatientMedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{
					{
						Id:           createdMaker.ID,
						FirstName:    newFirstName,
						LastName:     newLastName,
						PhoneNumber:  &newPhoneNumber,
						Relationship: &newRelationship,
						Address:      &newAddress,
						PatientId:    createdMaker.PatientID,
					},
				},
			},
		},
		{
			name: "works (it should not update if values are not included in request)",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				MedicalDecisionMakerId: makerToEmptyUpdate.ID,
			},

			want: &caremanagerpb.UpdateMedicalDecisionMakerResponse{
				MedicalDecisionMaker: &caremanagerpb.MedicalDecisionMaker{
					Id:           makerToEmptyUpdate.ID,
					FirstName:    makerToEmptyUpdate.FirstName,
					LastName:     makerToEmptyUpdate.LastName,
					PhoneNumber:  sqltypes.ToProtoString(makerToEmptyUpdate.PhoneNumber),
					Relationship: sqltypes.ToProtoString(makerToEmptyUpdate.Relationship),
					Address:      sqltypes.ToProtoString(makerToEmptyUpdate.Address),
					PatientId:    makerToEmptyUpdate.PatientID,
				},
				PatientMedicalDecisionMakers: []*caremanagerpb.MedicalDecisionMaker{
					{
						Id:           makerToEmptyUpdate.ID,
						FirstName:    makerToEmptyUpdate.FirstName,
						LastName:     makerToEmptyUpdate.LastName,
						PhoneNumber:  sqltypes.ToProtoString(makerToEmptyUpdate.PhoneNumber),
						Relationship: sqltypes.ToProtoString(makerToEmptyUpdate.Relationship),
						Address:      sqltypes.ToProtoString(makerToEmptyUpdate.Address),
						PatientId:    makerToEmptyUpdate.PatientID,
					},
				},
			},
		},
		{
			name: "it should return error when first name is empty string",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				MedicalDecisionMakerId: makerToEmptyUpdate.ID,
				FirstName:              &emptyFirstName,
			},

			wantErr: status.Error(codes.InvalidArgument, "first_name cannot be empty"),
		},
		{
			name: "it should return error when last name is empty string",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				MedicalDecisionMakerId: makerToEmptyUpdate.ID,
				LastName:               &emptyLastName,
			},

			wantErr: status.Error(codes.InvalidArgument, "last_name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.UpdateMedicalDecisionMaker(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, testCase.want, response)
		})
	}
}

func TestUpdateExternalCareProvider(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	providerTypeID1 := int64(1)
	providerTypeID2 := int64(2)
	providerTypeID3 := int64(3)
	oldPhoneNumber := "1234567890"
	oldFaxNumber := "0987654321"
	oldAddress := "Old address"

	externalCareProviderToUpdate := createTestExternalCareProvider(ctx, t, db, createTestExternalCareProviderParams{
		name:           "old name",
		phoneNumber:    &oldPhoneNumber,
		faxNumber:      &oldFaxNumber,
		address:        &oldAddress,
		patientID:      0,
		providerTypeID: providerTypeID1,
	})
	deletedCareProvider := createTestExternalCareProvider(ctx, t, db, createTestExternalCareProviderParams{})
	_, err := db.queries.DeleteExternalCareProvider(ctx, deletedCareProvider.ID)
	if err != nil {
		t.Fatalf(err.Error())
	}

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateExternalCareProviderRequest

		want    *caremanagerpb.UpdateExternalCareProviderResponse
		wantErr error
	}{
		{
			name: "works updating all fields",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProviderToUpdate.ID,
				Name:                   proto.String("new name"),
				PhoneNumber:            proto.String("1111111111"),
				FaxNumber:              proto.String("2222222222"),
				Address:                proto.String("new address"),
				ProviderTypeId:         proto.Int64(providerTypeID2),
			},

			want: &caremanagerpb.UpdateExternalCareProviderResponse{
				ExternalCareProvider: &caremanagerpb.ExternalCareProvider{
					Name:           "new name",
					PhoneNumber:    proto.String("1111111111"),
					FaxNumber:      proto.String("2222222222"),
					Address:        proto.String("new address"),
					ProviderTypeId: providerTypeID2,
					PatientId:      externalCareProviderToUpdate.PatientID,
				},
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "External Doctor",
						ProviderTypeId: providerTypeID2,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "External Referrer",
						ProviderTypeId: providerTypeID3,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "new name",
						PhoneNumber:    proto.String("1111111111"),
						FaxNumber:      proto.String("2222222222"),
						Address:        proto.String("new address"),
						ProviderTypeId: providerTypeID2,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
				},
			},
		},
		{
			name: "works with nullable data",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProviderToUpdate.ID,
				Name:                   proto.String("newer name"),
			},

			want: &caremanagerpb.UpdateExternalCareProviderResponse{
				ExternalCareProvider: &caremanagerpb.ExternalCareProvider{
					Name:           "newer name",
					PhoneNumber:    proto.String("1111111111"),
					FaxNumber:      proto.String("2222222222"),
					Address:        proto.String("new address"),
					ProviderTypeId: providerTypeID2,
					PatientId:      externalCareProviderToUpdate.PatientID,
				},
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "External Doctor",
						ProviderTypeId: providerTypeID2,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "External Referrer",
						ProviderTypeId: providerTypeID3,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "newer name",
						PhoneNumber:    proto.String("1111111111"),
						FaxNumber:      proto.String("2222222222"),
						Address:        proto.String("new address"),
						ProviderTypeId: providerTypeID2,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
				},
			},
		}, {
			name: "works with other nullable data",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProviderToUpdate.ID,
				PhoneNumber:            proto.String("3333333333"),
				FaxNumber:              proto.String("4444444444"),
				Address:                proto.String("newer address"),
				ProviderTypeId:         proto.Int64(providerTypeID3),
			},

			want: &caremanagerpb.UpdateExternalCareProviderResponse{
				ExternalCareProvider: &caremanagerpb.ExternalCareProvider{
					Name:           "newer name",
					PhoneNumber:    proto.String("3333333333"),
					FaxNumber:      proto.String("4444444444"),
					Address:        proto.String("newer address"),
					ProviderTypeId: providerTypeID3,
					PatientId:      externalCareProviderToUpdate.PatientID,
				},
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "External Doctor",
						ProviderTypeId: providerTypeID2,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "External Referrer",
						ProviderTypeId: providerTypeID3,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
					{
						Name:           "newer name",
						PhoneNumber:    proto.String("3333333333"),
						FaxNumber:      proto.String("4444444444"),
						Address:        proto.String("newer address"),
						ProviderTypeId: providerTypeID3,
						PatientId:      externalCareProviderToUpdate.PatientID,
					},
				},
			},
		}, {
			name: "it should return error if the External Care Provider name is empty",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProviderToUpdate.ID,
				Name:                   proto.String(""),
			},

			wantErr: status.Errorf(codes.InvalidArgument, nameCannotBeEmpty),
		}, {
			name: "it should return error if the External Care Provider has been deleted",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				ExternalCareProviderId: deletedCareProvider.ID,
				Name:                   proto.String("new name"),
			},

			wantErr: status.Errorf(codes.NotFound, "ExternalCareProvider not found"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			response, err := grpcServer.UpdateExternalCareProvider(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)
		})
	}
}

func TestDeleteExternalCareProvider(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)
	externalDoctorProviderID := int64(2)
	externalReferrerProviderID := int64(3)

	patient, err := createTestPatient(ctx, db, createTestPatientParams{})
	if err != nil {
		t.Fatal(err)
	}
	externalCareProvider := createTestExternalCareProvider(
		ctx,
		t,
		db,
		createTestExternalCareProviderParams{
			name:      "delete",
			patientID: patient.ID,
		},
	)
	createTestExternalCareProvider(
		ctx,
		t,
		db,
		createTestExternalCareProviderParams{
			name:           "do not delete",
			patientID:      patient.ID,
			providerTypeID: externalDoctorProviderID,
		},
	)

	testCases := []struct {
		name    string
		request *caremanagerpb.DeleteExternalCareProviderRequest

		want    *caremanagerpb.DeleteExternalCareProviderResponse
		wantErr error
	}{
		{
			name: "works",
			request: &caremanagerpb.DeleteExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProvider.ID,
			},
			want: &caremanagerpb.DeleteExternalCareProviderResponse{
				PatientExternalCareProviders: []*caremanagerpb.ExternalCareProvider{
					{
						Name:           "External Doctor",
						ProviderTypeId: externalDoctorProviderID,
						PatientId:      patient.ID,
					},
					{
						Name:           "External Referrer",
						ProviderTypeId: externalReferrerProviderID,
						PatientId:      patient.ID,
					},
					{
						Name:           "do not delete",
						ProviderTypeId: externalDoctorProviderID,
						PatientId:      patient.ID,
					},
				},
			},
		},
		{
			name: "fails: External Care Provider does not exist",
			request: &caremanagerpb.DeleteExternalCareProviderRequest{
				ExternalCareProviderId: time.Now().UnixNano(),
			},

			wantErr: status.Errorf(codes.NotFound, "ExternalCareProvider not found"),
		},
		{
			name: "fails: External Care Provider already deleted",
			request: &caremanagerpb.DeleteExternalCareProviderRequest{
				ExternalCareProviderId: externalCareProvider.ID,
			},

			wantErr: status.Errorf(codes.NotFound, "ExternalCareProvider not found"),
		},
		{
			name:    "fails: ExternalCareProviderId is zero",
			request: &caremanagerpb.DeleteExternalCareProviderRequest{},

			wantErr: status.Errorf(codes.InvalidArgument, "ExternalCareProviderId cannot be zero"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})
			response, err := grpcServer.DeleteExternalCareProvider(ctx, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".Id")(t, testCase.want, response)

			_, err = db.queries.GetPatientExternalCareProvider(ctx, testCase.request.ExternalCareProviderId)

			testutils.MustMatch(t, errors.New("no rows in result set"), err)
		})
	}
}

func TestUpdateVisitEpisode(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	episode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	newEpisode, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID: episode.episode.ID,
	})
	visit := visitResult.visit

	tcs := []struct {
		name string
		req  *caremanagerpb.UpdateVisitEpisodeRequest

		want    *caremanagerpb.UpdateVisitEpisodeResponse
		wantErr error
	}{
		{
			name: "works",
			req: &caremanagerpb.UpdateVisitEpisodeRequest{
				VisitId:   visit.ID,
				EpisodeId: newEpisode.episode.ID,
			},

			want: &caremanagerpb.UpdateVisitEpisodeResponse{
				Visit: &caremanagerpb.Visit{
					Id:          visit.ID,
					EpisodeId:   newEpisode.episode.ID,
					StatusGroup: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				},
			},
		},
		{
			name: "fails - Visit does not exist",
			req: &caremanagerpb.UpdateVisitEpisodeRequest{
				VisitId:   time.Now().UnixNano(),
				EpisodeId: newEpisode.episode.ID,
			},

			wantErr: status.Error(codes.NotFound, "Visit not found"),
		},
		{
			name: "fails - Episode does not exist",
			req: &caremanagerpb.UpdateVisitEpisodeRequest{
				VisitId:   visit.ID,
				EpisodeId: time.Now().UnixNano(),
			},

			wantErr: status.Error(codes.InvalidArgument, "Episode not found"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.UpdateVisitEpisode(ctx, tc.req)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, tc.want, resp)
			testutils.MustMatch(t, tc.wantErr, err)
		})
	}
}

func TestDuplicateEpisodeLatestVisit(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	mockCareRequestID := time.Now().UnixNano()
	mockedDuplicatedCareRequestID := mockCareRequestID + 1

	episodeWithVisits, err := createTestEpisode(
		ctx,
		db, &createTestEpisodeParams{},
	)
	if err != nil {
		t.Fatal(err)
	}

	episodeWithVisitsID := episodeWithVisits.episode.ID

	createTestVisit(ctx, t, db, &createTestVisitParams{
		episodeID:     episodeWithVisitsID,
		careRequestID: &mockCareRequestID,
	})

	episodeWithoutVisits, err := createTestEpisode(
		ctx,
		db, &createTestEpisodeParams{},
	)
	if err != nil {
		t.Fatal(err)
	}

	nonStationVisit := createTestVisit(ctx, t, db, &createTestVisitParams{})

	testCases := []struct {
		name    string
		request *caremanagerpb.DuplicateEpisodeLatestVisitRequest

		wantEpisodeServiceResponse *episodepb.DuplicateVisitResponse
		want                       *caremanagerpb.DuplicateEpisodeLatestVisitResponse
		wantErr                    error
	}{
		{
			name: "should duplicate the most recent visit when provided with a valid episode",
			request: &caremanagerpb.DuplicateEpisodeLatestVisitRequest{
				EpisodeId: episodeWithVisitsID,
			},

			wantEpisodeServiceResponse: &episodepb.DuplicateVisitResponse{
				CareRequest: &common.CareRequestInfo{
					Id: mockedDuplicatedCareRequestID,
				},
			},
			want: &caremanagerpb.DuplicateEpisodeLatestVisitResponse{
				CareRequestId: mockedDuplicatedCareRequestID,
			},
		},
		{
			name: "should fail with an episode without visits",
			request: &caremanagerpb.DuplicateEpisodeLatestVisitRequest{
				EpisodeId: episodeWithoutVisits.episode.ID,
			},

			wantErr: errors.New("no rows in result set"),
		},
		{
			name: "should fail with an invalid episode ID",
			request: &caremanagerpb.DuplicateEpisodeLatestVisitRequest{
				EpisodeId: 0,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "invalid episode_id %d", 0),
		},
		{
			name: "should fail if the episode service encounters an error",
			request: &caremanagerpb.DuplicateEpisodeLatestVisitRequest{
				EpisodeId: episodeWithVisitsID,
			},

			wantErr: status.Error(codes.Internal, "something went wrong"),
		},
		{
			name: "should fail if the latest visit does not have a care request",
			request: &caremanagerpb.DuplicateEpisodeLatestVisitRequest{
				EpisodeId: nonStationVisit.visit.EpisodeID,
			},

			wantErr: errors.New("no rows in result set"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockEpisodeServiceClient: &MockEpisodeServiceClient{
					DuplicateVisitResult: testCase.wantEpisodeServiceResponse,
					DuplicateVisitErr:    testCase.wantErr,
				},
			})

			ctxWithAuth := getContextWithAuth()

			resp, err := grpcServer.DuplicateEpisodeLatestVisit(
				ctxWithAuth,
				testCase.request,
			)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, resp, testCase.want)
		})
	}
}

func TestScheduleVisit(t *testing.T) {
	mockDate := time.Now()
	mockUserID := time.Now().Unix()

	timeZone := "America/New_York"
	marketName := "Las Vegas"
	marketShortName := "LAS"

	mockCareRequestID := time.Now().Unix()
	mockMarketID := mockCareRequestID + 1

	mockLatitude := mockCareRequestID - 2
	mockLongitude := mockCareRequestID - 3

	mockStatusID := time.Now().Unix()

	ctxWithAuth := getContextWithAuth()

	jobTitle := "programmer"

	requestStatusName := "requested"

	requestStatusCreatedAtDate := time.Now()
	requestStatusCreatedAtDateSec := requestStatusCreatedAtDate.Unix()

	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	episodeResult, err := createTestEpisode(ctx, db, &createTestEpisodeParams{})
	if err != nil {
		t.Fatal(err)
	}

	alreadyExistantCR := mockCareRequestID + 100

	alreadyCreatedVisit := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID:   &alreadyExistantCR,
		createdByUserID: &mockUserID,
		status:          &requestStatusName,
	})

	testCases := []struct {
		name    string
		request *caremanagerpb.ScheduleVisitRequest

		episodeClient             *MockEpisodeServiceClient
		marketClient              *MockMarketServiceClient
		userClient                *MockUserServiceClient
		checkAvailabilityResponse *AvailabilityResponse

		checkAvailabilityErr error
		updateServiceLineErr error
		updateCareRequestErr error

		wantResponse    *caremanagerpb.ScheduleVisitResponse
		wantResponseErr error
	}{
		{
			name: "works (all external services return valid responses)",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
				EpisodeId:                    episodeResult.episode.ID,
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},

				UpsertVisitETARangeResult: &episodepb.UpsertVisitETARangeResponse{},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: mockUserID, JobTitle: &jobTitle},
				},
			},

			wantResponse: &caremanagerpb.ScheduleVisitResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:       episodeResult.episode.ID,
					StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
					Status:          &requestStatusName,
					CareRequestId:   &mockCareRequestID,
					CreatedByUserId: &mockUserID,
					UpdatedByUserId: &mockUserID,
				},
			},
		},
		{
			name: "works (if the visit was already created in CareManager)",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                alreadyCreatedVisit.visit.CareRequestID.Int64,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
				EpisodeId:                    alreadyCreatedVisit.visit.EpisodeID,
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       alreadyCreatedVisit.visit.CareRequestID.Int64,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},

				UpsertVisitETARangeResult: &episodepb.UpsertVisitETARangeResponse{},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: mockUserID, JobTitle: &jobTitle},
				},
			},

			wantResponse: &caremanagerpb.ScheduleVisitResponse{
				Visit: &caremanagerpb.Visit{
					EpisodeId:       alreadyCreatedVisit.visit.EpisodeID,
					StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
					Status:          &requestStatusName,
					CareRequestId:   &alreadyCreatedVisit.visit.CareRequestID.Int64,
					CreatedByUserId: &mockUserID,
					UpdatedByUserId: &mockUserID,
				},
			},
		},
		{
			name: "fails if GetVisit fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},
			episodeClient: &MockEpisodeServiceClient{
				GetVisitErr: errors.New("unexpected error"),
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			wantResponseErr: errors.New("unexpected error"),
		},
		{
			name: "fails if GetMarket fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},
			},

			marketClient: &MockMarketServiceClient{
				GetMarketErr: errors.New("unexpected error"),
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			wantResponseErr: status.Errorf(codes.NotFound, "market not found, market_id: %d, error: %s", mockMarketID, errors.New("unexpected error")),
		},
		{
			name: "fails if GetPossibleServiceLines fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesErr: errors.New("unexpected error"),
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			wantResponseErr: errors.New("unexpected error"),
		},
		{
			name: "fails if there is no available advanced care service line",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{},
				},

				UpsertVisitETARangeResult: &episodepb.UpsertVisitETARangeResponse{},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			wantResponseErr: ErrAdvancedCareNotElegible,
		},
		{
			name: "fails if UpdateServiceLine fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			updateServiceLineErr: errors.New("unexpected error"),

			wantResponseErr: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: error updating status",
			),
		},

		{
			name: "fails if UpdateCareRequest fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			updateCareRequestErr: errors.New("unexpected error"),

			wantResponseErr: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: error updating care request",
			),
		},

		{
			name: "fails if CheckFeasibility fails",
			request: &caremanagerpb.ScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: mockDate.Unix(),
				PatientAvailabilityEndTime:   mockDate.Add(4 * time.Hour).Unix(),
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
						RequestStatus: &common.CareRequestStatus{
							Id:           &mockStatusID,
							Name:         &requestStatusName,
							CreatedAtSec: &requestStatusCreatedAtDateSec,
						},
					},
				},

				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},

			checkAvailabilityResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},

			marketClient: &MockMarketServiceClient{
				GetMarketResult: &marketpb.GetMarketResponse{
					Market: &marketpb.Market{
						Id:               1,
						IanaTimeZoneName: &timeZone,
						Name:             &marketName,
						ShortName:        &marketShortName,
					},
				},
			},

			userClient: &MockUserServiceClient{
				GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
					User: &userpb.User{Id: 123321},
				},
			},

			checkAvailabilityErr: errors.New("unexpected error"),

			wantResponseErr: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: error checking availability",
			),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if strings.Contains(r.URL.String(), "update_status") {
						if testCase.updateServiceLineErr != nil {
							rw.WriteHeader(http.StatusUnprocessableEntity)
							rw.Write([]byte("error updating status"))
						} else {
							rw.WriteHeader(http.StatusOK)
							serializedResponse, _ := json.Marshal([]byte{})
							rw.Write(serializedResponse)
						}
						return
					}

					if strings.Contains(r.URL.String(), "care_requests") {
						if testCase.updateCareRequestErr != nil {
							rw.WriteHeader(http.StatusUnprocessableEntity)
							rw.Write([]byte("error updating care request"))
						} else {
							rw.WriteHeader(http.StatusOK)
							serializedResponse, _ := json.Marshal([]byte{})
							rw.Write(serializedResponse)
						}
					}

					if strings.Contains(r.URL.String(), "check_availability") {
						if testCase.checkAvailabilityErr != nil {
							rw.WriteHeader(http.StatusUnprocessableEntity)
							rw.Write([]byte("error checking availability"))
						} else {
							rw.WriteHeader(http.StatusOK)
							serializedResponse, _ := json.Marshal(testCase.checkAvailabilityResponse)
							rw.Write(serializedResponse)
						}
					}
				}),
			)
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,

				mockEpisodeServiceClient: testCase.episodeClient,

				mockMarketServiceClient: testCase.marketClient,

				mockUserServiceClient: testCase.userClient,

				db: db,
			})

			response, err := grpcServer.ScheduleVisit(ctxWithAuth, testCase.request)

			testutils.MustMatch(t, testCase.wantResponseErr, err)
			testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")(t, testCase.wantResponse, response)
		})
	}
}

func TestGetVisitAvailability(t *testing.T) {
	dateLayout := "01-02-2006"
	mockDate := time.Now()

	mockCareRequestID := mockDate.Unix()
	mockMarketID := mockCareRequestID + 1

	mockLatitude := mockCareRequestID - 2
	mockLongitude := mockCareRequestID - 3

	ctxWithAuth := getContextWithAuth()

	testCases := []struct {
		name    string
		request *caremanagerpb.GetVisitAvailabilityRequest

		wantEpisodeSvcGetVisit                *episodepb.GetVisitResponse
		wantEpisodeSvcGetVisitErr             error
		wantEpisodeSvcPossibleServiceLines    *episodepb.GetVisitPossibleServiceLinesResponse
		wantEpisodeSvcPossibleServiceLinesErr error
		wantCheckAvailability                 *AvailabilityResponse
		wantCheckAvailabilityErr              error
		wantResponse                          *caremanagerpb.GetVisitAvailabilityResponse
		wantResponseErr                       error
	}{
		{
			name: "should return availabily with valid params",
			request: &caremanagerpb.GetVisitAvailabilityRequest{
				CareRequestId: mockCareRequestID,
				RequestedDates: []string{
					mockDate.Format(dateLayout),
					mockDate.AddDate(0, 0, 1).Format(dateLayout),
					mockDate.AddDate(0, 0, 2).Format(dateLayout),
				},
			},
			wantEpisodeSvcGetVisit: &episodepb.GetVisitResponse{
				CareRequest: &common.CareRequestInfo{
					Id:       mockCareRequestID,
					MarketId: &mockMarketID,
					Location: &common.Location{
						LatitudeE6:  int32(mockLatitude),
						LongitudeE6: int32(mockLongitude),
					},
				},
			},
			wantEpisodeSvcPossibleServiceLines: &episodepb.GetVisitPossibleServiceLinesResponse{
				ServiceLines: []*episodepb.ServiceLine{
					{Id: 9, Name: "Advanced Care"},
				},
			},
			wantCheckAvailability: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},
			wantResponse: &caremanagerpb.GetVisitAvailabilityResponse{
				Availability: []*caremanagerpb.DateAvailability{
					{Date: mockDate.Format(dateLayout), IsAvailable: true},
					{Date: mockDate.AddDate(0, 0, 1).Format(dateLayout), IsAvailable: true},
					{Date: mockDate.AddDate(0, 0, 2).Format(dateLayout), IsAvailable: true},
				},
			},
		},
		{
			name: "should fail with an invalid Care Request ID",
			request: &caremanagerpb.GetVisitAvailabilityRequest{
				CareRequestId: -1,
			},
			wantResponseErr: status.Errorf(codes.InvalidArgument, "invalid care_request_id -1"),
		},
		{
			name: "should fail when the visit is not found",
			request: &caremanagerpb.GetVisitAvailabilityRequest{
				CareRequestId: mockCareRequestID,
			},
			wantEpisodeSvcGetVisitErr: status.Error(codes.NotFound, ""),
			wantResponseErr:           status.Error(codes.NotFound, ""),
		},
		{
			name: "should due the given CR is has not AC as possible service line",
			request: &caremanagerpb.GetVisitAvailabilityRequest{
				CareRequestId: mockCareRequestID,
			},
			wantEpisodeSvcGetVisit: &episodepb.GetVisitResponse{
				CareRequest: &common.CareRequestInfo{
					Id:       mockCareRequestID,
					MarketId: &mockMarketID,
					Location: &common.Location{
						LatitudeE6:  int32(mockLatitude),
						LongitudeE6: int32(mockLongitude),
					},
				},
			},
			wantEpisodeSvcPossibleServiceLines: &episodepb.GetVisitPossibleServiceLinesResponse{
				ServiceLines: []*episodepb.ServiceLine{
					{Id: 1, Name: "Acute Care"},
				},
			},
			wantResponseErr: status.Errorf(
				codes.FailedPrecondition,
				"care request %d is not eligible for Advanced Care",
				mockCareRequestID,
			),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.GetVisitAvailabilityRequest{
				CareRequestId: mockCareRequestID,
				RequestedDates: []string{
					mockDate.Format(dateLayout),
					mockDate.AddDate(0, 0, 1).Format(dateLayout),
					mockDate.AddDate(0, 0, 2).Format(dateLayout),
				},
			},
			wantEpisodeSvcGetVisit: &episodepb.GetVisitResponse{
				CareRequest: &common.CareRequestInfo{
					Id:       mockCareRequestID,
					MarketId: &mockMarketID,
					Location: &common.Location{
						LatitudeE6:  int32(mockLatitude),
						LongitudeE6: int32(mockLongitude),
					},
				},
			},
			wantEpisodeSvcPossibleServiceLines: &episodepb.GetVisitPossibleServiceLinesResponse{
				ServiceLines: []*episodepb.ServiceLine{
					{Id: 9, Name: "Advanced Care"},
				},
			},
			wantCheckAvailabilityErr: status.Error(codes.InvalidArgument, ""),
			wantResponseErr: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: unprocessable entity",
			),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if testCase.wantCheckAvailabilityErr != nil {
						rw.WriteHeader(http.StatusUnprocessableEntity)
						rw.Write([]byte("unprocessable entity"))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(testCase.wantCheckAvailability)
						rw.Write(serializedResponse)
					}
				}),
			)
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,

				mockEpisodeServiceClient: &MockEpisodeServiceClient{
					GetVisitResult: testCase.wantEpisodeSvcGetVisit,
					GetVisitErr:    testCase.wantEpisodeSvcGetVisitErr,

					GetVisitPossibleServiceLinesResult: testCase.wantEpisodeSvcPossibleServiceLines,
					GetVisitPossibleServiceLinesErr:    testCase.wantEpisodeSvcPossibleServiceLinesErr,
				},
			})

			response, err := grpcServer.GetVisitAvailability(ctxWithAuth, testCase.request)

			testutils.MustMatch(t, testCase.wantResponseErr, err)
			testutils.MustMatch(t, testCase.wantResponse, response)
		})
	}
}

func TestCanScheduleVisit(t *testing.T) {
	mockCareRequestID := time.Now().Unix()
	mockMarketID := mockCareRequestID - 1

	mockLatitude := mockCareRequestID - 2
	mockLongitude := mockCareRequestID - 3

	ctxWithAuth := getContextWithAuth()

	testCases := []struct {
		name    string
		request *caremanagerpb.CanScheduleVisitRequest

		episodeService *MockEpisodeServiceClient

		wantCheckAvailability    *AvailabilityResponse
		wantCheckAvailabilityErr error
		wantResponse             *caremanagerpb.CanScheduleVisitResponse
		wantResponseErr          error
	}{
		{
			name: "should return true when there is availability",
			request: &caremanagerpb.CanScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: time.Now().Unix(),
				PatientAvailabilityEndTime:   time.Now().AddDate(0, 0, 1).Unix(),
			},

			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
					},
				},
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},
			wantCheckAvailability: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},
			wantResponse: &caremanagerpb.CanScheduleVisitResponse{
				CanScheduleVisit: true,
			},
		},
		{
			name: "should fail when there are not available slots to schedule",
			request: &caremanagerpb.CanScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: time.Now().Unix(),
				PatientAvailabilityEndTime:   time.Now().AddDate(0, 0, 1).Unix(),
			},
			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
					},
				},
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},
			wantCheckAvailability: &AvailabilityResponse{
				Availability: availabilityStatusUnavailable,
			},
			wantResponse: &caremanagerpb.CanScheduleVisitResponse{
				CanScheduleVisit: false,
				Reason:           caremanagerpb.UnableToScheduleReason_UNABLE_TO_SCHEDULE_REASON_VISIT_TIME_SLOT_UNAVAILABLE,
			},
		},
		{
			name: "should fail due an invalid Care Request ID",
			request: &caremanagerpb.CanScheduleVisitRequest{
				CareRequestId: -1,
			},
			wantResponseErr: status.Error(
				codes.InvalidArgument,
				fmt.Sprintf("invalid care_request_id %d", -1),
			),
		},
		{
			name: "should fail due the given CR is has not AC as possible service line",
			request: &caremanagerpb.CanScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: time.Now().Unix(),
				PatientAvailabilityEndTime:   time.Now().AddDate(0, 0, 1).Unix(),
			},
			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
					},
				},
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 1, Name: "Acute Care"},
					},
				},
			},
			wantResponse: &caremanagerpb.CanScheduleVisitResponse{
				CanScheduleVisit: false,
				Reason:           caremanagerpb.UnableToScheduleReason_UNABLE_TO_SCHEDULE_REASON_ADVANCED_CARE_UNAVAILABLE,
			},
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.CanScheduleVisitRequest{
				CareRequestId:                mockCareRequestID,
				PatientAvailabilityStartTime: time.Now().Unix(),
				PatientAvailabilityEndTime:   time.Now().AddDate(0, 0, 1).Unix(),
			},
			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:       mockCareRequestID,
						MarketId: &mockMarketID,
						Location: &common.Location{
							LatitudeE6:  int32(mockLatitude),
							LongitudeE6: int32(mockLongitude),
						},
					},
				},
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{Id: 9, Name: "Advanced Care"},
					},
				},
			},
			wantCheckAvailabilityErr: status.Error(codes.InvalidArgument, ""),
			wantResponseErr: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: unprocessable entity",
			),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if testCase.wantCheckAvailabilityErr != nil {
						rw.WriteHeader(http.StatusUnprocessableEntity)
						rw.Write([]byte("unprocessable entity"))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(testCase.wantCheckAvailability)
						rw.Write(serializedResponse)
					}
				}),
			)
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,

				mockEpisodeServiceClient: testCase.episodeService,
			})

			response, err := grpcServer.CanScheduleVisit(ctxWithAuth, testCase.request)

			testutils.MustMatch(t, testCase.wantResponseErr, err)
			testutils.MustMatch(t, testCase.wantResponse, response)
		})
	}
}

func TestCancelVisit(t *testing.T) {
	mockCareRequestID := time.Now().Unix()
	ctxWithAuth := getContextWithAuth()

	testCases := []struct {
		name                   string
		request                *caremanagerpb.CancelVisitRequest
		updateCareRequestError error

		wantResponseError error
		wantResponse      *caremanagerpb.CancelVisitResponse
	}{
		{
			name: "should work with a valid CareRequestID",
			request: &caremanagerpb.CancelVisitRequest{
				CareRequestId: mockCareRequestID,
			},

			wantResponse: &caremanagerpb.CancelVisitResponse{},
		},
		{
			name: "should fail if the UpdateCareRequestStatus operation fails in Station",
			request: &caremanagerpb.CancelVisitRequest{
				CareRequestId: mockCareRequestID,
			},
			updateCareRequestError: status.Error(codes.Internal, "something went wrong"),

			wantResponseError: status.Error(
				codes.InvalidArgument,
				"HTTP request had error response 422: unprocessable entity",
			),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if testCase.updateCareRequestError != nil {
						rw.WriteHeader(http.StatusUnprocessableEntity)
						rw.Write([]byte("unprocessable entity"))
					} else {
						rw.WriteHeader(http.StatusOK)
					}
				}),
			)
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
			})

			response, err := grpcServer.CancelVisit(ctxWithAuth, testCase.request)

			testutils.MustMatch(t, testCase.wantResponseError, err)
			testutils.MustMatch(t, testCase.wantResponse, response)
		})
	}
}

func TestSearchUsers(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	testCases := []struct {
		name        string
		context     context.Context
		request     *caremanagerpb.SearchUsersRequest
		userService *MockUserServiceClient

		wantResponse *caremanagerpb.SearchUsersResponse
		wantErr      error
	}{
		{
			name:    "should work with a valid search term",
			context: ctxWithAuth,
			request: &caremanagerpb.SearchUsersRequest{
				SearchTerm: "test.email@test.com",
			},
			userService: &MockUserServiceClient{
				SearchUsersResult: &userpb.SearchUsersResponse{
					Users: []*userpb.User{
						{Id: 1},
						{Id: 2},
					},
				},
			},

			wantResponse: &caremanagerpb.SearchUsersResponse{
				Users: []*caremanagerpb.User{{Id: 1}, {Id: 2}},
				Meta: &caremanagerpb.PageInfo{
					TotalPages:  1,
					PageSize:    5,
					CurrentPage: 1,
					FirstPage:   proto.Bool(true),
					LastPage:    proto.Bool(true),
				},
			},
		},
		{
			name:    "should work with valid page and page size",
			context: ctxWithAuth,
			request: &caremanagerpb.SearchUsersRequest{
				SearchTerm: "test.email@test.com",
				Page:       proto.Int64(2),
				PageSize:   proto.Int64(3),
			},
			userService: &MockUserServiceClient{
				SearchUsersResult: &userpb.SearchUsersResponse{
					Users: []*userpb.User{
						{Id: 1},
						{Id: 2},
						{Id: 3},
					},
				},
			},

			wantResponse: &caremanagerpb.SearchUsersResponse{
				Users: []*caremanagerpb.User{{Id: 1}, {Id: 2}, {Id: 3}},
				Meta: &caremanagerpb.PageInfo{
					TotalPages:   1,
					PageSize:     3,
					CurrentPage:  2,
					FirstPage:    proto.Bool(false),
					LastPage:     proto.Bool(true),
					PreviousPage: proto.Int64(1),
				},
			},
		},
		{
			name:    "should fail when user service fails",
			context: ctxWithAuth,
			request: &caremanagerpb.SearchUsersRequest{
				SearchTerm: "test.email@test.com",
				Page:       proto.Int64(2),
				PageSize:   proto.Int64(3),
			},
			userService: &MockUserServiceClient{
				SearchUsersErr: errors.New("something went wrong"),
			},

			wantErr: errors.New("something went wrong"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockUserServiceClient: testCase.userService,
			})

			resp, err := grpcServer.SearchUsers(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, testCase.wantResponse, resp)
		})
	}
}

func TestCreateServiceRequestNote(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()
	serviceRequest := createTestServiceRequest(ctx, t, db, nil)
	invalidServiceRequestID := time.Now().UnixNano()

	testCases := []struct {
		name             string
		context          context.Context
		request          *caremanagerpb.CreateServiceRequestNoteRequest
		userServiceError error

		wantResponse *caremanagerpb.CreateServiceRequestNoteResponse
		wantErr      error
	}{
		{
			name:    "should work with a valid request",
			context: ctxWithAuth,
			request: &caremanagerpb.CreateServiceRequestNoteRequest{
				ServiceRequestId: serviceRequest.ID,
				Details:          "test note",
			},

			wantResponse: &caremanagerpb.CreateServiceRequestNoteResponse{
				Note: &caremanagerpb.Note{
					Details:         "test note",
					NoteKind:        "general",
					Pinned:          proto.Bool(false),
					CreatedByUserId: proto.Int64(1),
				},
			},
		},
		{
			name:    "should fail when user service fails",
			context: ctxWithAuth,
			request: &caremanagerpb.CreateServiceRequestNoteRequest{
				ServiceRequestId: serviceRequest.ID,
				Details:          "test note",
			},
			userServiceError: errors.New("mocked error"),

			wantErr: errors.New("mocked error"),
		},
		{
			name:    "should fail when service request is not found",
			context: ctxWithAuth,
			request: &caremanagerpb.CreateServiceRequestNoteRequest{
				ServiceRequestId: invalidServiceRequestID,
				Details:          "test note",
			},

			wantErr: status.Errorf(codes.InvalidArgument, "ServiceRequest id %d does not exist", invalidServiceRequestID),
		},
		{
			name:    "should fail when service request id is not provided",
			context: ctxWithAuth,
			request: &caremanagerpb.CreateServiceRequestNoteRequest{
				Details: "test note",
			},

			wantErr: status.Error(codes.InvalidArgument, "ServiceRequest id 0 does not exist"),
		},
		{
			name:    "should fail when details is not provided",
			context: ctxWithAuth,
			request: &caremanagerpb.CreateServiceRequestNoteRequest{
				ServiceRequestId: serviceRequest.ID,
			},

			wantErr: status.Error(codes.InvalidArgument, "note.details cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &userpb.User{Id: 1},
					},
					GetAuthenticatedUserErr: testCase.userServiceError,
				},
				db: db,
			})

			resp, err := grpcServer.CreateServiceRequestNote(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			mustMatchNoteResponse(t, testCase.wantResponse, resp)
		})
	}
}

func TestGetServiceRequestNotes(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()
	serviceRequest := createTestServiceRequest(ctx, t, db, nil)

	note1 := createTestServiceRequestNote(ctx, t, db, serviceRequest.ID)
	note2 := createTestServiceRequestNote(ctx, t, db, serviceRequest.ID)
	note3 := createTestServiceRequestNote(ctx, t, db, serviceRequest.ID)
	note4 := createTestServiceRequestNote(ctx, t, db, serviceRequest.ID)
	note5 := createTestServiceRequestNote(ctx, t, db, serviceRequest.ID)

	testCases := []struct {
		name    string
		context context.Context
		request *caremanagerpb.GetServiceRequestNotesRequest

		wantResponse *caremanagerpb.GetServiceRequestNotesResponse
		wantErr      error
	}{
		{
			name:    "should work with a valid request",
			context: ctxWithAuth,
			request: &caremanagerpb.GetServiceRequestNotesRequest{
				ServiceRequestId: serviceRequest.ID,
			},

			wantResponse: &caremanagerpb.GetServiceRequestNotesResponse{
				Notes: []*caremanagerpb.Note{
					NoteProtoFromNoteSQL(note5),
					NoteProtoFromNoteSQL(note4),
					NoteProtoFromNoteSQL(note3),
					NoteProtoFromNoteSQL(note2),
					NoteProtoFromNoteSQL(note1),
				},
			},
		},
		{
			name:    "should return an empty list when service request is not found",
			context: ctxWithAuth,
			request: &caremanagerpb.GetServiceRequestNotesRequest{
				ServiceRequestId: time.Now().UnixNano(),
			},

			wantResponse: &caremanagerpb.GetServiceRequestNotesResponse{
				Notes: []*caremanagerpb.Note{},
			},
		},
		{
			name:    "should return an empty list when service request id is not provided",
			context: ctxWithAuth,
			request: &caremanagerpb.GetServiceRequestNotesRequest{},

			wantResponse: &caremanagerpb.GetServiceRequestNotesResponse{
				Notes: []*caremanagerpb.Note{},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.GetServiceRequestNotes(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatch(t, testCase.wantResponse, resp)
		})
	}
}

func TestUpdateServiceRequest(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()
	defaultStatus := getDefaultServiceRequestStatus(ctx, t, db)
	notActiveStatus := getServiceRequestStatusByName(ctx, t, db, "Resolved")
	serviceRequest := createTestServiceRequest(ctx, t, db, nil)
	serviceRequestWithNonActiveStatus := createTestServiceRequest(
		ctx, t, db, &createTestServiceRequestParams{statusID: &notActiveStatus.ID},
	)
	serviceRequestWithCMSNumber := createTestServiceRequest(
		ctx, t, db, &createTestServiceRequestParams{cmsNumber: proto.String("123456789")},
	)
	mockUser := userpb.User{Id: time.Now().UnixNano()}

	testCases := []struct {
		name    string
		context context.Context
		request *caremanagerpb.UpdateServiceRequestRequest

		wantResponse *caremanagerpb.UpdateServiceRequestResponse
		wantErr      error
	}{
		{
			name:    "should work with a valid basic request",
			context: ctxWithAuth,
			request: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId:    serviceRequest.ID,
				StatusId:            &notActiveStatus.ID,
				IsInsuranceVerified: proto.Bool(true),
				CmsNumber:           proto.String("abc"),
			},

			wantResponse: &caremanagerpb.UpdateServiceRequestResponse{
				ServiceRequest: &caremanagerpb.ServiceRequest{
					Id:                  serviceRequest.ID,
					CreatedAt:           serviceRequest.CreatedAt.Format(timestampLayout),
					MarketId:            serviceRequest.MarketID,
					StatusId:            notActiveStatus.ID,
					IsInsuranceVerified: true,
					CmsNumber:           proto.String("abc"),
					UpdatedByUserId:     &mockUser.Id,
				},
			},
		},
		{
			name:    "should keep previous cms_number if is_insurance_verified is not set",
			context: ctxWithAuth,
			request: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId: serviceRequestWithCMSNumber.ID,
				StatusId:         &defaultStatus.ID,
			},

			wantResponse: &caremanagerpb.UpdateServiceRequestResponse{
				ServiceRequest: &caremanagerpb.ServiceRequest{
					Id:                  serviceRequestWithCMSNumber.ID,
					CreatedAt:           serviceRequestWithCMSNumber.CreatedAt.Format(timestampLayout),
					MarketId:            serviceRequestWithCMSNumber.MarketID,
					StatusId:            serviceRequest.StatusID,
					IsInsuranceVerified: serviceRequestWithCMSNumber.IsInsuranceVerified,
					CmsNumber:           &serviceRequestWithCMSNumber.CmsNumber.String,
					UpdatedByUserId:     &mockUser.Id,
				},
			},
		},
		{
			name:    "should wipe the cms_number if the insurance is set to not verified",
			context: ctxWithAuth,
			request: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId:    serviceRequestWithCMSNumber.ID,
				StatusId:            &defaultStatus.ID,
				IsInsuranceVerified: proto.Bool(false),
			},

			wantResponse: &caremanagerpb.UpdateServiceRequestResponse{
				ServiceRequest: &caremanagerpb.ServiceRequest{
					Id:                  serviceRequestWithCMSNumber.ID,
					CreatedAt:           serviceRequestWithCMSNumber.CreatedAt.Format(timestampLayout),
					MarketId:            serviceRequestWithCMSNumber.MarketID,
					StatusId:            defaultStatus.ID,
					IsInsuranceVerified: false,
					CmsNumber:           proto.String(""),
					UpdatedByUserId:     &mockUser.Id,
				},
			},
		},
		{
			name:    "should return an error when no Service Request is found",
			context: ctxWithAuth,
			request: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId: time.Now().UnixNano(),
			},

			wantErr: status.Error(codes.NotFound, "no ServiceRequest was found"),
		},
		{
			name:    "should return an error when the Status is not longer active",
			context: ctxWithAuth,
			request: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId: serviceRequestWithNonActiveStatus.ID,
				StatusId:         &defaultStatus.ID,
			},

			wantErr: status.Error(codes.InvalidArgument, "ServiceRequest status is not active anymore"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &mockUser,
					},
				},
			})

			resp, err := grpcServer.UpdateServiceRequest(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".UpdatedAt")(t, testCase.wantResponse, resp)
		})
	}
}

func TestRejectServiceRequest(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	ctxWithAuth := getContextWithAuth()
	rejectedStatus := getServiceRequestStatusByName(ctx, t, db, "Rejected")
	serviceRequest := createTestServiceRequest(ctx, t, db, nil)
	serviceRequestWithNonActiveStatus := createTestServiceRequest(
		ctx, t, db, &createTestServiceRequestParams{statusID: &rejectedStatus.ID},
	)
	mockUser := userpb.User{Id: time.Now().UnixNano()}
	mustMatchResponse := testutils.MustMatchFn(".UpdatedAt")

	testCases := []struct {
		name    string
		context context.Context
		request *caremanagerpb.RejectServiceRequestRequest

		wantResponse *caremanagerpb.RejectServiceRequestResponse
		wantErr      error
	}{
		{
			name:    "should work",
			context: ctxWithAuth,
			request: &caremanagerpb.RejectServiceRequestRequest{
				ServiceRequestId: serviceRequest.ID,
				RejectReason:     "Insurance expired",
			},

			wantResponse: &caremanagerpb.RejectServiceRequestResponse{
				ServiceRequest: &caremanagerpb.ServiceRequest{
					Id:                  serviceRequest.ID,
					CreatedAt:           serviceRequest.CreatedAt.Format(timestampLayout),
					MarketId:            serviceRequest.MarketID,
					StatusId:            rejectedStatus.ID,
					IsInsuranceVerified: serviceRequest.IsInsuranceVerified,
					UpdatedByUserId:     &mockUser.Id,
					RejectReason:        proto.String("Insurance expired"),
				},
			},
		},
		{
			name:    "should return an error when no Service Request is found",
			context: ctxWithAuth,
			request: &caremanagerpb.RejectServiceRequestRequest{
				ServiceRequestId: time.Now().UnixNano(),
			},

			wantErr: status.Error(codes.NotFound, "no ServiceRequest was found"),
		},
		{
			name:    "should return an error when the Status is not longer active",
			context: ctxWithAuth,
			request: &caremanagerpb.RejectServiceRequestRequest{
				ServiceRequestId: serviceRequestWithNonActiveStatus.ID,
				RejectReason:     "Insurance expired",
			},

			wantErr: status.Error(codes.InvalidArgument, "ServiceRequest status is not active anymore"),
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockUserServiceClient: &MockUserServiceClient{
					GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
						User: &mockUser,
					},
				},
			})

			resp, err := grpcServer.RejectServiceRequest(testCase.context, testCase.request)

			testutils.MustMatch(t, testCase.wantErr, err)
			mustMatchResponse(t, testCase.wantResponse, resp)
		})
	}
}

func TestCreateEHRAppointment(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name            string
		request         *caremanagerpb.CreateEHRAppointmentRequest
		stationResponse stationCreateEHRAppointmentResponse
		stationError    error

		want    *caremanagerpb.CreateEHRAppointmentResponse
		wantErr error
	}{
		{
			name: "should return appointment ID with valid params",
			request: &caremanagerpb.CreateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					StartTime:       "10:00:00",
					Date:            "08-25-2023",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationCreateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			want: &caremanagerpb.CreateEHRAppointmentResponse{
				AppointmentId: proto.String("1"),
			},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.CreateEHRAppointmentRequest{
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					StartTime:       "10:00:00",
					Date:            "08-25-2023",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationCreateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.CreateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					StartTime:       "10:00:00",
					Date:            "08-25-2023",
					PlaceOfService:  "Home",
				},
			},
			stationError: errors.New("something went wrong"),

			wantErr: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.CreateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID + 1,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					StartTime:       "10:00:00",
					Date:            "08-25-2023",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationCreateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
				db:         db,
			})

			response, err := grpcServer.CreateEHRAppointment(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestUpdateEHRAppointment(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name            string
		request         *caremanagerpb.UpdateEHRAppointmentRequest
		stationResponse stationUpdateEHRAppointmentResponse
		stationError    error

		want    *caremanagerpb.UpdateEHRAppointmentResponse
		wantErr error
	}{
		{
			name: "should return appointment ID with valid params",
			request: &caremanagerpb.UpdateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationUpdateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			want: &caremanagerpb.UpdateEHRAppointmentResponse{
				AppointmentId: proto.String("1"),
			},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.UpdateEHRAppointmentRequest{
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationUpdateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.UpdateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					PlaceOfService:  "Home",
				},
			},
			stationError: errors.New("something went wrong"),

			wantErr: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.UpdateEHRAppointmentRequest{
				VisitId: visitResult.visit.ID + 1,
				Appointment: &caremanagerpb.EHRAppointment{
					AppointmentType: "some type",
					PlaceOfService:  "Home",
				},
			},
			stationResponse: stationUpdateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
				db:         db,
			})

			response, err := grpcServer.UpdateEHRAppointment(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestAssignVirtualAPP(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name           string
		request        *caremanagerpb.AssignVirtualAPPRequest
		episodeService *MockEpisodeServiceClient

		want    *caremanagerpb.AssignVirtualAPPResponse
		wantErr error
	}{
		{
			name: "should assign without errors",
			request: &caremanagerpb.AssignVirtualAPPRequest{
				VisitId: visitResult.visit.ID,
			},
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitResult: &episodepb.AssignVirtualAPPToVisitResponse{},
			},

			want: &caremanagerpb.AssignVirtualAPPResponse{},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.AssignVirtualAPPRequest{
				VisitId: 0,
			},
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitResult: &episodepb.AssignVirtualAPPToVisitResponse{},
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name:    "should fail if visit ID is not specified",
			request: &caremanagerpb.AssignVirtualAPPRequest{},
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitResult: &episodepb.AssignVirtualAPPToVisitResponse{},
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.AssignVirtualAPPRequest{
				VisitId: visitResult.visit.ID,
			},
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantErr: status.Error(codes.Internal, "something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.AssignVirtualAPPRequest{
				VisitId: visitResult.visit.ID + 1,
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockEpisodeServiceClient: tc.episodeService,
				db:                       db,
			})

			response, err := grpcServer.AssignVirtualAPP(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestUnassignVirtualAPP(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name           string
		request        *caremanagerpb.UnassignVirtualAPPRequest
		episodeService *MockEpisodeServiceClient

		want    *caremanagerpb.UnassignVirtualAPPResponse
		wantErr error
	}{
		{
			name: "should unassign without errors",
			request: &caremanagerpb.UnassignVirtualAPPRequest{
				VisitId: visitResult.visit.ID,
			},
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitResult: &episodepb.UnassignVirtualAPPFromVisitResponse{},
			},

			want: &caremanagerpb.UnassignVirtualAPPResponse{},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.UnassignVirtualAPPRequest{
				VisitId: 0,
			},
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitResult: &episodepb.UnassignVirtualAPPFromVisitResponse{},
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name:    "should fail if visit ID is not specified",
			request: &caremanagerpb.UnassignVirtualAPPRequest{},
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitResult: &episodepb.UnassignVirtualAPPFromVisitResponse{},
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.UnassignVirtualAPPRequest{
				VisitId: visitResult.visit.ID,
			},
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantErr: status.Error(codes.Internal, "something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.UnassignVirtualAPPRequest{
				VisitId: visitResult.visit.ID + 1,
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockEpisodeServiceClient: tc.episodeService,
				db:                       db,
			})

			response, err := grpcServer.UnassignVirtualAPP(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestGetServiceRequestStatus(t *testing.T) {
	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	testCases := []struct {
		name    string
		request *caremanagerpb.GetServiceRequestStatusRequest

		wantFirstElement *caremanagerpb.ServiceRequestStatus
		wantLength       int
		wantErrMsg       string
	}{
		{
			name:    "should work",
			request: &caremanagerpb.GetServiceRequestStatusRequest{},

			wantFirstElement: &caremanagerpb.ServiceRequestStatus{
				Id:       1,
				Name:     "Requested",
				IsActive: true,
				Slug:     "requested",
			},
			wantLength: 6,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
			})

			resp, err := grpcServer.GetServiceRequestStatus(ctx, testCase.request)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error())
			}

			testutils.MustMatch(t, testCase.wantFirstElement, resp.ServiceRequestStatus[0])
			testutils.MustMatch(t, testCase.wantLength, len(resp.ServiceRequestStatus))
		})
	}
}

func TestCreateVisitNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	now := time.Now()
	nowString := proto.String(now.Format(timestampLayout))

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := now.UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name            string
		request         *caremanagerpb.CreateVisitNoteRequest
		stationResponse StationNote
		stationError    error

		want    *caremanagerpb.CreateVisitNoteResponse
		wantErr error
	}{
		{
			name: "should return note with valid params",
			request: &caremanagerpb.CreateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				Details: "some note",
			},
			stationResponse: StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
			},

			want: &caremanagerpb.CreateVisitNoteResponse{
				Note: &caremanagerpb.Note{
					Id:              1,
					Details:         "some note",
					NoteKind:        "regular",
					CreatedByUserId: proto.Int64(1),
					CreatedAt:       nowString,
					UpdatedAt:       nowString,
					Pinned:          proto.Bool(false),
				},
			},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.CreateVisitNoteRequest{
				Details: "some note",
			},
			stationResponse: StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.CreateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				Details: "some note",
			},
			stationError: errors.New("something went wrong"),

			wantErr: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.CreateVisitNoteRequest{
				VisitId: visitResult.visit.ID + 1,
				Details: "some note",
			},
			stationResponse: StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
				db:         db,
			})

			response, err := grpcServer.CreateVisitNote(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestUpdateVisitNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	now := time.Now()
	nowString := proto.String(now.Format(timestampLayout))

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := now.UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name            string
		request         *caremanagerpb.UpdateVisitNoteRequest
		stationResponse []StationNote
		stationError    error

		want    *caremanagerpb.UpdateVisitNoteResponse
		wantErr error
	}{
		{
			name: "should return note with valid params",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
				Details: proto.String("edited note"),
				Pinned:  proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			want: &caremanagerpb.UpdateVisitNoteResponse{
				Note: &caremanagerpb.Note{
					Id:              1,
					Details:         "edited note",
					NoteKind:        "regular",
					CreatedByUserId: proto.Int64(1),
					CreatedAt:       nowString,
					UpdatedAt:       nowString,
					Pinned:          proto.Bool(true),
				},
			},
		},
		{
			name: "should update note details",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
				Details: proto.String("edited note"),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          false,
			}},

			want: &caremanagerpb.UpdateVisitNoteResponse{
				Note: &caremanagerpb.Note{
					Id:              1,
					Details:         "edited note",
					NoteKind:        "regular",
					CreatedByUserId: proto.Int64(1),
					CreatedAt:       nowString,
					UpdatedAt:       nowString,
					Pinned:          proto.Bool(false),
				},
			},
		},
		{
			name: "should make note featured",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
				Pinned:  proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			want: &caremanagerpb.UpdateVisitNoteResponse{
				Note: &caremanagerpb.Note{
					Id:              1,
					Details:         "some note",
					NoteKind:        "regular",
					CreatedByUserId: proto.Int64(1),
					CreatedAt:       nowString,
					UpdatedAt:       nowString,
					Pinned:          proto.Bool(true),
				},
			},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				NoteId:  1,
				Details: proto.String("edited note"),
				Pinned:  proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail if note ID is invalid",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				Details: proto.String("edited note"),
				Pinned:  proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			wantErr: status.Error(codes.InvalidArgument, "invalid Note ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
				Details: proto.String("edited note"),
				Pinned:  proto.Bool(true),
			},
			stationError: errors.New("something went wrong"),

			wantErr: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.UpdateVisitNoteRequest{
				VisitId: visitResult.visit.ID + 1,
				NoteId:  1,
				Details: proto.String("edited note"),
				Pinned:  proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
				db:         db,
			})

			response, err := grpcServer.UpdateVisitNote(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestDeleteVisitNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	baseID := time.Now().UnixNano()
	careRequestID := baseID + 1
	visitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &careRequestID,
	})

	testCases := []struct {
		name         string
		request      *caremanagerpb.DeleteVisitNoteRequest
		stationError error

		want    *caremanagerpb.DeleteVisitNoteResponse
		wantErr error
	}{
		{
			name: "should work with valid params",
			request: &caremanagerpb.DeleteVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
			},

			want: &caremanagerpb.DeleteVisitNoteResponse{},
		},
		{
			name: "should fail if visit ID is invalid",
			request: &caremanagerpb.DeleteVisitNoteRequest{
				NoteId: 1,
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Visit ID"),
		},
		{
			name: "should fail if note ID is invalid",
			request: &caremanagerpb.DeleteVisitNoteRequest{
				VisitId: visitResult.visit.ID,
			},

			wantErr: status.Error(codes.InvalidArgument, "invalid Note ID"),
		},
		{
			name: "should fail when HTTP station client returns an error",
			request: &caremanagerpb.DeleteVisitNoteRequest{
				VisitId: visitResult.visit.ID,
				NoteId:  1,
			},
			stationError: errors.New("something went wrong"),

			wantErr: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
		{
			name: "should fail if there is no visit in DB",
			request: &caremanagerpb.DeleteVisitNoteRequest{
				VisitId: visitResult.visit.ID + 1,
				NoteId:  1,
			},

			wantErr: status.Error(codes.Internal, "no rows in result set"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
					}
				}))
			defer testServer.Close()

			grpcServer := getGRPCServer(getGRPCServerParams{
				stationURL: testServer.URL,
				db:         db,
			})

			response, err := grpcServer.DeleteVisitNote(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestGetVirtualAPPVisitsQueue(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	ctx, pool, done := setupDBTest(t)
	defer done()
	db := NewCaremanagerDB(pool)

	timeNow := time.Now()
	timeTomorrow := timeNow.Add(24 * time.Hour)
	todayDate := protoconv.TimeToProtoDate(&timeNow)
	tomorrowDate := protoconv.TimeToProtoDate(&timeTomorrow)

	baseID := timeNow.UnixNano()
	shiftTeamID := baseID
	userID := baseID
	assignableCareRequestID := baseID + 1
	assignableVisitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &assignableCareRequestID,
	})
	protoAssignableVisit := VisitProtoFromVisitSQL(assignableVisitResult.visit)

	scheduledCareRequestID := baseID + 2
	scheduledVisitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &scheduledCareRequestID,
	})
	protoScheduledVisit := VisitProtoFromVisitSQL(scheduledVisitResult.visit)

	assignedCareRequestID := baseID + 3
	assignedVisitResult := createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &assignedCareRequestID,
		virtualAPPID:  &userID,
	})
	protoAssignedVisit := VisitProtoFromVisitSQL(assignedVisitResult.visit)

	scheduledForTomorrowCareRequestID := baseID + 4
	createTestVisit(ctx, t, db, &createTestVisitParams{
		careRequestID: &scheduledForTomorrowCareRequestID,
	})

	scheduledShiftTeamID := int64(1)
	successRequest := &caremanagerpb.GetVirtualAPPVisitsQueueRequest{
		ShiftTeamId: shiftTeamID,
		UserId:      userID,
		MarketIds:   []int64{1, 2},
	}
	successGetAssignableVisitsResponse := &logisticspb.GetAssignableVisitsResponse{
		Visits: []*logisticspb.AssignableVisitResult{
			{CareRequestId: assignableCareRequestID},
			{CareRequestId: assignedCareRequestID},
		},
	}
	successGetServiceRegionScheduleResponse := &logisticspb.GetServiceRegionScheduleResponse{
		DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
			{
				Meta: &logisticspb.ScheduleMetadata{ServiceDate: todayDate},
				Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: scheduledShiftTeamID,
						Route: &logisticspb.ShiftTeamRoute{
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
									Visit: &logisticspb.ShiftTeamVisit{
										CareRequestId: &scheduledCareRequestID,
									},
								}},
							},
						},
					},
				},
			},
			{
				Meta: &logisticspb.ScheduleMetadata{ServiceDate: tomorrowDate},
				Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: scheduledShiftTeamID,
						Route: &logisticspb.ShiftTeamRoute{
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
									Visit: &logisticspb.ShiftTeamVisit{
										CareRequestId: &scheduledForTomorrowCareRequestID,
									},
								}},
							},
						},
					},
				},
			},
		},
	}
	successGetShiftTeamResult := &shiftteampb.GetShiftTeamResponse{
		ShiftTeam: &shiftteampb.ShiftTeam{},
	}
	successListSoloDHMTShiftTeamsResult := &shiftteampb.ListSoloDHMTShiftTeamsResponse{
		ShiftTeams: []*shiftteampb.ShiftTeam{{
			Id: scheduledShiftTeamID,
		}},
	}

	testCases := []struct {
		name                             string
		request                          *caremanagerpb.GetVirtualAPPVisitsQueueRequest
		getAssignableVisitsResponse      *logisticspb.GetAssignableVisitsResponse
		getAssignableVisitsErr           error
		getServiceRegionScheduleResponse *logisticspb.GetServiceRegionScheduleResponse
		getServiceRegionScheduleErr      error
		getShiftTeamResult               *shiftteampb.GetShiftTeamResponse
		getShiftTeamErr                  error
		listSoloDHMTShiftTeamsResult     *shiftteampb.ListSoloDHMTShiftTeamsResponse
		listSoloDHMTShiftTeamsErr        error

		want    *caremanagerpb.GetVirtualAPPVisitsQueueResponse
		wantErr error
	}{
		{
			name:                             "should work with valid params",
			request:                          successRequest,
			getAssignableVisitsResponse:      successGetAssignableVisitsResponse,
			getServiceRegionScheduleResponse: successGetServiceRegionScheduleResponse,
			getShiftTeamResult:               successGetShiftTeamResult,
			listSoloDHMTShiftTeamsResult:     successListSoloDHMTShiftTeamsResult,

			want: &caremanagerpb.GetVirtualAPPVisitsQueueResponse{
				Scheduled: []*caremanagerpb.VirtualAPPVisit{{Visit: protoScheduledVisit}},
				Available: []*caremanagerpb.VirtualAPPVisit{{Visit: protoAssignableVisit}},
				Assigned:  []*caremanagerpb.VirtualAPPVisit{{Visit: protoAssignedVisit}},
			},
		},
		{
			name:                             "should fail if logistics service responded with error on assignable request",
			request:                          successRequest,
			getAssignableVisitsErr:           errors.New("something went wrong"),
			getServiceRegionScheduleResponse: successGetServiceRegionScheduleResponse,
			getShiftTeamResult:               successGetShiftTeamResult,
			listSoloDHMTShiftTeamsResult:     successListSoloDHMTShiftTeamsResult,

			wantErr: errors.New("something went wrong"),
		},
		{
			name:                         "should fail if logistics service responded with error on schedules request",
			request:                      successRequest,
			getAssignableVisitsResponse:  successGetAssignableVisitsResponse,
			getServiceRegionScheduleErr:  errors.New("something went wrong"),
			getShiftTeamResult:           successGetShiftTeamResult,
			listSoloDHMTShiftTeamsResult: successListSoloDHMTShiftTeamsResult,

			wantErr: errors.New("something went wrong"),
		},
		{
			name:                             "should fail if shift team service responded with error on shift team request",
			request:                          successRequest,
			getAssignableVisitsResponse:      successGetAssignableVisitsResponse,
			getServiceRegionScheduleResponse: successGetServiceRegionScheduleResponse,
			getShiftTeamErr:                  errors.New("something went wrong"),
			listSoloDHMTShiftTeamsResult:     successListSoloDHMTShiftTeamsResult,

			wantErr: errors.New("something went wrong"),
		},
		{
			name:                             "should fail if shift team service responded with error on solo dhmt shift teams request",
			request:                          successRequest,
			getAssignableVisitsResponse:      successGetAssignableVisitsResponse,
			getServiceRegionScheduleResponse: successGetServiceRegionScheduleResponse,
			getShiftTeamResult:               successGetShiftTeamResult,
			listSoloDHMTShiftTeamsErr:        errors.New("something went wrong"),

			wantErr: errors.New("something went wrong"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				db: db,
				mockLogisticsServiceClient: &MockLogisticsServiceClient{
					GetAssignableVisitsResponse:      tc.getAssignableVisitsResponse,
					GetAssignableVisitsErr:           tc.getAssignableVisitsErr,
					GetServiceRegionScheduleResponse: tc.getServiceRegionScheduleResponse,
					GetServiceRegionScheduleErr:      tc.getServiceRegionScheduleErr,
				},
				mockShiftTeamServiceClient: &MockShiftTeamServiceClient{
					GetShiftTeamResult:           tc.getShiftTeamResult,
					GetShiftTeamErr:              tc.getShiftTeamErr,
					ListSoloDHMTShiftTeamsResult: tc.listSoloDHMTShiftTeamsResult,
					ListSoloDHMTShiftTeamsErr:    tc.listSoloDHMTShiftTeamsErr,
				},
			})

			response, err := grpcServer.GetVirtualAPPVisitsQueue(ctxWithAuth, tc.request)

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestGetServiceRequest(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	mockCareRequestID := time.Now().Unix()
	mockChiefComplaint := "More OUCH"

	ctx, pool, done := setupDBTest(t)
	defer done()

	db := NewCaremanagerDB(pool)

	serviceRequest := createTestServiceRequest(ctx, t, db, nil)
	protoServiceRequest := ServiceRequestProtoFromServiceRequestSQL(serviceRequest)

	testCases := []struct {
		name    string
		request *caremanagerpb.GetServiceRequestRequest

		episodeClient *MockEpisodeServiceClient

		want    *caremanagerpb.GetServiceRequestResponse
		wantErr error
	}{
		{
			name: "should return the ServiceRequest given its ID",
			request: &caremanagerpb.GetServiceRequestRequest{
				ServiceRequestId: serviceRequest.ID,
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &common.CareRequestInfo{
						Id:             mockCareRequestID,
						ChiefComplaint: proto.String(mockChiefComplaint),
					},
				},
			},

			want: &caremanagerpb.GetServiceRequestResponse{
				ServiceRequest: &protoServiceRequest,
				StationPatient: &caremanagerpb.StationPatient{},
				StationCareRequest: &caremanagerpb.StationCareRequest{
					Id:             mockCareRequestID,
					ChiefComplaint: mockChiefComplaint,
				},
			},
		},
		{
			name: "should fail when EpisodeService fails",
			request: &caremanagerpb.GetServiceRequestRequest{
				ServiceRequestId: serviceRequest.ID,
			},

			episodeClient: &MockEpisodeServiceClient{
				GetVisitErr: errors.New("Something went wrong"),
			},

			wantErr: errors.New("Something went wrong"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockEpisodeServiceClient: testCase.episodeClient,
				db:                       db,
			})

			response, err := grpcServer.GetServiceRequest(
				ctxWithAuth,
				testCase.request,
			)

			testutils.MustMatch(t, testCase.want, response)
			testutils.MustMatch(t, testCase.wantErr, err)
		})
	}
}

func TestListCarsByIDs(t *testing.T) {
	ctxWithAuth := getContextWithAuth()

	tcs := []struct {
		name             string
		shiftTeamService *MockShiftTeamServiceClient
		request          *caremanagerpb.ListCarsByIDsRequest

		wantErr error
		want    *caremanagerpb.ListCarsByIDsResponse
	}{
		{
			name:    "should work with a valid search term",
			request: &caremanagerpb.ListCarsByIDsRequest{CarIds: []int64{1}},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListCarsByIDsResult: &shiftteampb.ListCarsByIDsResponse{
					Cars: []*common.Car{{Id: 1}},
				},
			},

			want: &caremanagerpb.ListCarsByIDsResponse{Cars: []*common.Car{{Id: 1}}},
		},
		{
			name:    "should fail if Car IDs list is empty",
			request: &caremanagerpb.ListCarsByIDsRequest{},

			wantErr: status.Error(codes.InvalidArgument, "CarIDs can not be empty"),
		},
		{
			name:    "should fail when station client returns an error",
			request: &caremanagerpb.ListCarsByIDsRequest{CarIds: []int64{1}},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListCarsByIDsErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantErr: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, testCase := range tcs {
		t.Run(testCase.name, func(t *testing.T) {
			grpcServer := getGRPCServer(getGRPCServerParams{
				mockShiftTeamServiceClient: testCase.shiftTeamService,
			})

			response, err := grpcServer.ListCarsByIDs(
				ctxWithAuth,
				testCase.request,
			)

			testutils.MustMatch(t, testCase.want, response)
			testutils.MustMatch(t, testCase.wantErr, err)
		})
	}
}

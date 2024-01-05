package main

import (
	"database/sql"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"time"

	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/nyaruka/phonenumbers"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	// Pagination default settings.
	defaultPageSize = 5
	defaultOffset   = 0
	defaultPage     = 1

	// Date format layouts.
	dateLayout      = "2006-01-02"
	timestampLayout = "2006-01-02T15:04:05.999Z"

	usPhoneNumberRegionCode = "US"

	// Status name strings used on the legacy Station API for Task status, the current column uses a boolean instead.
	legacyTaskStatusPending   = "pending"
	legacyTaskStatusCompleted = "completed"

	// Type name strings used in the legacy Station API for CarePhase type, the current column uses a boolean instead.
	legacyCarePhaseTypeInactive = "inactive"
	legacyCarePhaseTypeActive   = "active"

	// IDs of the corresponding CarePhases from the `care_phases` reference table.
	carePhasePendingID            = 1
	carePhaseNurseNavigatorID     = 4
	carePhaseDailyAndOnboardingID = 6
	carePhaseT1ID                 = 7
	carePhaseT2ID                 = 8

	// Default Episode summary when feature flag `care_manager_visits_v1_be` is on.
	defaultSummary = "Primary Dx:\n(WA Waiver Hosp Admit Date:)\nHA Admit Date:\nNumber of HA visits per day:\nAnticipated T1 date:\nActual T1 date:\nT2 date:\nClinical Summary:\nBarriers to T1:\nTuck-in call discussion:\nBarriers to T2:\nTransition call discussion:\nHome health scheduled:\nAncillary services in transition:\nAppointments:\nNN follow-ups:"

	nameCannotBeEmpty = "name cannot be empty"
)

var (
	noteKindMap = map[int16]string{
		0: "general",
		1: "daily_update",
		2: "clinical",
		3: "navigator",
	}

	// Definition of which Visit statuses map to a Visit statusGroup.
	visitStatusGroupStatusesActive   = []string{"committed", "on_route", "on_scene"}
	visitStatusGroupStatusesUpcoming = []string{"accepted", "scheduled", "requested"}
	visitStatusGroupStatusesPast     = []string{"archived", "completed"}

	// Supported priorities.
	supportedInsurancePriorities = []int32{1, 2, 3}

	// Definition of how Visit status options map to status strings for UpdateVisitStatus converter.
	updateVisitStatusOptionStrings = map[caremanagerpb.UpdateVisitStatusRequest_UpdateVisitStatusOption]string{
		caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_ROUTE:  "on_route",
		caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_SCENE:  "on_scene",
		caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_COMPLETE:  "complete",
		caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_COMMITTED: "committed",
		caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ARCHIVED:  "archived",
	}
)

func getMapKeyFromValue(m map[int16]string, value string) (int16, string, bool) {
	var (
		valuesDescription string
		keys              []int
		foundKey          int16
		found             bool
	)

	keys = make([]int, 0)
	for k := range m {
		keys = append(keys, int(k))
	}
	sort.Ints(keys)

	for _, k := range keys {
		v := m[int16(k)]
		if valuesDescription == "" {
			valuesDescription += v
		} else {
			valuesDescription += ", " + v
		}
		if v == value {
			foundKey = int16(k)
			found = true
		}
	}

	return foundKey, valuesDescription, found
}

func getNoteKindIDFromNoteKindString(noteKind string) (*int16, error) {
	noteKindIndex, validValues, found := getMapKeyFromValue(noteKindMap, noteKind)
	if !found {
		return nil, fmt.Errorf("note kind %v is not valid, use one of these options: %v", noteKind, validValues)
	}

	return &noteKindIndex, nil
}

func GetPageInfo(totalRecords, pageSize, pageOffset int64) *caremanagerpb.PageInfo {
	var page int64
	if pageOffset == defaultOffset {
		page = defaultPage
	} else {
		page = (pageOffset / pageSize) + 1
	}
	pageInfo := &caremanagerpb.PageInfo{
		PageSize:     pageSize,
		TotalResults: totalRecords,
		CurrentPage:  page,
	}
	totalPages := totalRecords / pageSize
	switch {
	case totalPages <= 0:
		pageInfo.TotalPages = 1
	case totalRecords%pageSize != 0:
		pageInfo.TotalPages = totalPages + 1
	default:
		pageInfo.TotalPages = totalPages
	}

	if pageInfo.CurrentPage == 1 {
		pageInfo.FirstPage = proto.Bool(true)
	} else {
		pageInfo.FirstPage = proto.Bool(false)
		pageInfo.PreviousPage = proto.Int64(page - 1)
	}
	if pageInfo.CurrentPage*pageSize >= totalRecords {
		pageInfo.LastPage = proto.Bool(true)
	} else {
		pageInfo.LastPage = proto.Bool(false)
		pageInfo.NextPage = proto.Int64(page + 1)
	}

	return pageInfo
}

func CreateEpisodeSQLParamsFromCreateEpisodeProtoRequest(req *caremanagerpb.CreateEpisodeRequest) (*caremanagerdb.CreateEpisodeParams, error) {
	if req.PatientSummary == "" {
		return nil, status.Error(codes.InvalidArgument, "episode.patient_summary cannot be empty")
	}
	if req.PatientId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.patient_id cannot be empty")
	}
	if req.CarePhaseId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.care_phase_id cannot be empty")
	}
	if req.ServiceLineId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.service_line_id cannot be empty")
	}
	if req.MarketId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.market_id cannot be empty")
	}

	return &caremanagerdb.CreateEpisodeParams{
		PatientID:          req.PatientId,
		PatientSummary:     req.PatientSummary,
		AdmittedAt:         time.Now(),
		ServiceLineID:      req.ServiceLineId,
		CarePhaseID:        req.CarePhaseId,
		MarketID:           req.MarketId,
		CareDay:            sqltypes.ToNullInt64(req.CareDay),
		Source:             sqltypes.ToNullString(req.Source),
		PrimaryDiagnosis:   sqltypes.ToNullString(req.PrimaryDiagnosis),
		Payer:              sqltypes.ToNullString(req.Payer),
		DoctorsPrimaryCare: sqltypes.ToNullString(req.DoctorsPrimaryCare),
	}, nil
}

func CreateEpisodeSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req *caremanagerpb.CreateVisitFromStationCRRequest,
	patientID int64,
) (*caremanagerdb.CreateEpisodeParams, error) {
	if patientID == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.patient_id cannot be empty")
	}
	if req.ServiceLineId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.service_line_id cannot be empty")
	}
	if req.MarketId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.market_id cannot be empty")
	}
	admittedAt, err := time.Parse(timestampLayout, req.StatusUpdatedAt)
	if err != nil {
		return nil, err
	}
	var originalCareRequestID *int64
	if req.OriginalCareRequestId > 0 {
		originalCareRequestID = &req.OriginalCareRequestId
	}

	return &caremanagerdb.CreateEpisodeParams{
		PatientID:             patientID,
		PatientSummary:        defaultSummary,
		AdmittedAt:            admittedAt,
		ServiceLineID:         req.ServiceLineId,
		CarePhaseID:           carePhasePendingID,
		MarketID:              req.MarketId,
		Source:                sqltypes.ToNullString(req.Source),
		Payer:                 sqltypes.ToNullString(req.Payer),
		OriginalCareRequestID: sqltypes.ToNullInt64(originalCareRequestID),
	}, nil
}

func CreateVisitSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req *caremanagerpb.CreateVisitFromStationCRRequest, episodeID int64,
) (*caremanagerdb.CreateVisitParams, error) {
	if req.CarName == "" {
		return nil, status.Error(codes.InvalidArgument, "visit.car_name cannot be empty")
	}
	if req.PatientAvailabilityStart == "" {
		return nil, status.Error(codes.InvalidArgument, "visit.patient_availability_start cannot be empty")
	}
	if req.PatientAvailabilityEnd == "" {
		return nil, status.Error(codes.InvalidArgument, "visit.patient_availability_end cannot be empty")
	}
	if req.Status == "" {
		return nil, status.Error(codes.InvalidArgument, "visit.status cannot be empty")
	}
	if req.StatusUpdatedAt == "" {
		return nil, status.Error(codes.InvalidArgument, "visit.status_updated_at cannot be empty")
	}
	if req.AddressId == 0 {
		return nil, status.Error(codes.InvalidArgument, "visit.address_id cannot be empty")
	}

	return &caremanagerdb.CreateVisitParams{
		CareRequestID:            sqltypes.ToNullInt64(&req.CareRequestId),
		EpisodeID:                episodeID,
		VisitTypeID:              sqltypes.ToNullInt64(nil),
		CreatedByUserID:          sqltypes.ToNullInt64(req.CreatedByUserId),
		Status:                   sqltypes.ToNullString(&req.Status),
		StatusUpdatedAt:          sqltypes.StringToValidNullTime(req.StatusUpdatedAt),
		AddressID:                sqltypes.ToNullInt64(&req.AddressId),
		PatientAvailabilityStart: sqltypes.StringToValidNullTime(req.PatientAvailabilityStart),
		PatientAvailabilityEnd:   sqltypes.StringToValidNullTime(req.PatientAvailabilityEnd),
		CarName:                  sqltypes.ToNullString(&req.CarName),
		CarID:                    sqltypes.ToNullInt64(req.CarId),
		ProviderUserIds:          req.ProviderUserIds,
	}, nil
}

func GetVisitByCareRequestIDSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) (int64, error) {
	if req.CareRequestId <= 0 {
		return 0, status.Error(codes.InvalidArgument, "visit.care_request_id cannot be 0")
	}
	return req.CareRequestId, nil
}

type EpisodeProtoFromEpisodeSQLParams struct {
	patient               *caremanagerdb.Patient
	carePhases            []*caremanagerdb.CarePhase
	market                *caremanagerpb.Market
	tasks                 []*caremanagerdb.Task
	taskTypes             []*caremanagerdb.TaskType
	notes                 []*caremanagerdb.Note
	taskTemplates         []*caremanagerdb.GetTaskTemplatesByIDRow
	medicalDecisionMakers []*caremanagerdb.MedicalDecisionMaker
	insurances            []*caremanagerdb.Insurance
	pharmacies            []*caremanagerdb.Pharmacy
	externalDoctor        *caremanagerdb.ExternalCareProvider
	externalReferrer      *caremanagerdb.ExternalCareProvider
}

func EpisodeProtoFromEpisodeSQL(
	episode *caremanagerdb.Episode,
	params EpisodeProtoFromEpisodeSQLParams,
) *caremanagerpb.Episode {
	var (
		admittedAt    = episode.AdmittedAt.Format(timestampLayout)
		createdAt     = episode.CreatedAt.Format(timestampLayout)
		updatedAt     = episode.UpdatedAt.Format(timestampLayout)
		taskTypesMap  = map[int64]*caremanagerdb.TaskType{}
		carePhasesMap = map[int64]*caremanagerdb.CarePhase{}

		taskProtos          []*caremanagerpb.Task
		noteProtos          []*caremanagerpb.Note
		taskTemplatesProtos []*caremanagerpb.TaskTemplate
	)

	for _, tt := range params.taskTypes {
		taskTypesMap[tt.ID] = tt
	}
	for _, t := range params.tasks {
		taskProtos = append(taskProtos, TaskProtoFromTaskSQL(t, taskTypesMap[t.TaskTypeID]))
	}
	for _, n := range params.notes {
		noteProtos = append(noteProtos, NoteProtoFromNoteSQL(n))
	}
	for _, cp := range params.carePhases {
		carePhasesMap[cp.ID] = cp
	}
	for _, tt := range params.taskTemplates {
		taskTemplatesProtos = append(taskTemplatesProtos, TaskTemplateProtoFromGetTaskTemplatesFromEpisodeSQLRow(
			tt,
			carePhasesMap[tt.CarePhaseID.Int64],
		),
		)
	}

	var patientMedicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	if len(params.medicalDecisionMakers) > 0 {
		patientMedicalDecisionMaker = params.medicalDecisionMakers[0]
	}

	var patientInsurance *caremanagerdb.Insurance
	if len(params.insurances) > 0 {
		patientInsurance = params.insurances[0]
	}

	var patientPharmacy *caremanagerdb.Pharmacy
	if len(params.pharmacies) > 0 {
		patientPharmacy = params.pharmacies[0]
	}

	return &caremanagerpb.Episode{
		Id:                 episode.ID,
		AdmittedAt:         admittedAt,
		PatientSummary:     episode.PatientSummary,
		CareDay:            sqltypes.ToProtoInt64(episode.CareDay),
		DischargedAt:       sqltypes.ToProtoStringTimestamp(episode.DischargedAt),
		Source:             sqltypes.ToProtoString(episode.Source),
		PrimaryDiagnosis:   sqltypes.ToProtoString(episode.PrimaryDiagnosis),
		Payer:              sqltypes.ToProtoString(episode.Payer),
		DoctorsPrimaryCare: sqltypes.ToProtoString(episode.DoctorsPrimaryCare),
		ServiceLineId:      episode.ServiceLineID,
		CreatedAt:          proto.String(createdAt),
		UpdatedAt:          proto.String(updatedAt),

		Patient: PatientProtoFromPatientSQL(params.patient, PatientProtoFromPatientSQLParams{
			medicalDecisionMaker: patientMedicalDecisionMaker,
			insurance:            patientInsurance,
			pharmacy:             patientPharmacy,
			externalDoctor:       params.externalDoctor,
			externalReferrer:     params.externalReferrer,
		}),
		PatientId:     episode.PatientID,
		CarePhase:     CarePhaseProtoFromCarePhaseSQL(carePhasesMap[episode.CarePhaseID]),
		Market:        params.market,
		MarketId:      episode.MarketID,
		Tasks:         taskProtos,
		Notes:         noteProtos,
		TaskTemplates: taskTemplatesProtos,
		IsWaiver:      episode.IsWaiver,
	}
}

func GetTaskTemplatesSQLParamsFromGetTaskTemplateRequest(req *caremanagerpb.GetTaskTemplatesRequest) *caremanagerdb.GetTaskTemplatesParams {
	var (
		pageSize      int64 = defaultPageSize
		pageOffset    int64 = defaultOffset
		sortDirection       = "asc"
		sortBy              = "name"
	)

	if req.PageSize != nil {
		pageSize = *req.PageSize
	}

	if req.Page != nil {
		pageOffset = (pageSize * *req.Page) - pageSize
	}

	if req.SortDirection != nil {
		sortDirection = *req.SortDirection
	}

	if req.SortBy != nil {
		sortBy = *req.SortBy
	}

	return &caremanagerdb.GetTaskTemplatesParams{
		CarePhaseID:   req.CarePhaseId,
		PageSize:      pageSize,
		PageOffset:    pageOffset,
		TemplateName:  sqltypes.ToNullString(req.Name),
		ServiceLineID: req.ServiceLineId,
		SortBy:        sqltypes.ToNullString(&sortBy),
		SortDirection: sqltypes.ToNullString(&sortDirection),
	}
}

func CreateNoteSQLParamsFromCreateEpisodeNoteProtoRequest(
	req *caremanagerpb.CreateEpisodeNoteRequest,
	createdByUserID *int64,
) (*caremanagerdb.CreateNoteParams, error) {
	noteKindIndex, err := validateAndParseNoteProtoRequest(req.Note.Details, req.Note.NoteKind)
	if err != nil {
		return nil, err
	}
	return &caremanagerdb.CreateNoteParams{
		Body:            req.Note.Details,
		Kind:            noteKindIndex,
		EpisodeID:       sqltypes.ToValidNullInt64(req.EpisodeId),
		CreatedByUserID: sqltypes.ToNullInt64(createdByUserID),
	}, nil
}

func CreateNoteSQLParamsFromCreateServiceRequestNoteProtoRequest(
	req *caremanagerpb.CreateServiceRequestNoteRequest,
	createdByUserID *int64,
) (*caremanagerdb.CreateNoteParams, error) {
	noteKindIndex, err := validateAndParseNoteProtoRequest(req.Details, "general")
	if err != nil {
		return nil, err
	}

	return &caremanagerdb.CreateNoteParams{
		Body:            req.Details,
		Kind:            noteKindIndex,
		CreatedByUserID: sqltypes.ToNullInt64(createdByUserID),
	}, nil
}

func GetEpisodesSQLParamsFromGetEpisodesProtoRequest(req *caremanagerpb.GetEpisodesRequest, marketIDs []int64) *caremanagerdb.GetEpisodesParams {
	var pageSize, pageOffset int64
	if req.PageSize == nil {
		pageSize = defaultPageSize
	} else {
		pageSize = *req.PageSize
	}

	if req.Page == nil {
		pageOffset = defaultOffset
	} else {
		pageOffset = (pageSize * *req.Page) - pageSize
	}

	incompleteTasks := false
	if req.IncompleteTask != nil {
		incompleteTasks = *req.IncompleteTask
	}

	return &caremanagerdb.GetEpisodesParams{
		PatientName:     sqltypes.ToNullString(req.PatientName),
		PageSize:        pageSize,
		PageOffset:      pageOffset,
		CarePhaseIds:    req.CarePhaseId,
		MarketIds:       marketIDs,
		IncompleteTasks: incompleteTasks,
		ServiceLineIds:  req.ServiceLineId,
	}
}

func GetPatientsSQLParamsFromGetPatientsProtoRequest(req *caremanagerpb.GetPatientsRequest) *caremanagerdb.GetPatientsParams {
	var pageSize, pageOffset int64
	if req.PageSize == nil {
		pageSize = defaultPageSize
	} else {
		pageSize = *req.PageSize
	}

	if req.Page == nil {
		pageOffset = defaultOffset
	} else {
		pageOffset = (pageSize * *req.Page) - pageSize
	}

	return &caremanagerdb.GetPatientsParams{
		PageSize:     pageSize,
		PageOffset:   pageOffset,
		CompleteName: sqltypes.ToNullString(&req.Name),
	}
}

func UpdateEpisodeSQLParamsFromUpdateEpisodeProtoRequest(
	req *caremanagerpb.UpdateEpisodeRequest,
	isDischarged bool,
) (*caremanagerdb.UpdateEpisodeParams, error) {
	if req.EpisodeId == 0 {
		return nil, status.Error(codes.InvalidArgument, "episode.id cannot be empty")
	}

	dischargedAt := sqltypes.StringToNullTime(nil)
	if isDischarged {
		nowDateString := time.Now().Format(timestampLayout)
		dischargedAt = sqltypes.StringToNullTime(&nowDateString)
	}

	return &caremanagerdb.UpdateEpisodeParams{
		ID:             req.EpisodeId,
		PatientSummary: sqltypes.ToNullString(req.PatientSummary),
		AdmittedAt:     sqltypes.StringToNullTime(req.AdmittedAt),
		CarePhaseID:    sqltypes.ToNullInt64(req.CarePhaseId),
		ServiceLineID:  sqltypes.ToNullInt64(req.ServiceLineId),
		MarketID:       sqltypes.ToNullInt64(req.MarketId),
		IsWaiver:       sqltypes.ToNullBool(req.IsWaiver),
		DischargedAt:   dischargedAt,
	}, nil
}

func StructValueFromProtoOptionalString(strptr *string) *structpb.Value {
	if strptr == nil {
		return structpb.NewNullValue()
	}

	return structpb.NewStringValue(*strptr)
}

func validateAndParsePatientProtoRequest(
	firstName string,
	lastName string,
	sex string,
	dateOfBirth string,
	phoneNumber *string,
) (*time.Time, *string, error) {
	if firstName == "" {
		return nil, nil, status.Error(codes.InvalidArgument, "patient.first_name cannot be empty")
	}
	if lastName == "" {
		return nil, nil, status.Error(codes.InvalidArgument, "patient.last_name cannot be empty")
	}
	if sex == "" {
		return nil, nil, status.Error(codes.InvalidArgument, "patient.sex cannot be empty")
	}
	if dateOfBirth == "" {
		return nil, nil, status.Error(codes.InvalidArgument, "patient.date_of_birth cannot be empty")
	}
	validDOB, err := time.Parse(dateLayout, dateOfBirth)
	if err != nil {
		validDOB, err = time.Parse(time.RFC3339, dateOfBirth)
		if err != nil {
			return nil, nil, status.Error(codes.InvalidArgument, "patient.date_of_birth is malformed")
		}
	}

	var formattedPhoneNumber *string
	if phoneNumber != nil {
		num, err := phonenumbers.Parse(*phoneNumber, usPhoneNumberRegionCode)
		if err != nil {
			return nil, nil, status.Error(codes.InvalidArgument, "patient.phone_number "+err.Error())
		} else if !phonenumbers.IsValidNumber(num) {
			return nil, nil, status.Error(codes.InvalidArgument, "patient.phone_number is not valid")
		}
		formatted := phonenumbers.Format(num, phonenumbers.E164)
		formattedPhoneNumber = &formatted
	}

	return &validDOB, formattedPhoneNumber, nil
}

func validateAndParseMedicalDecisionMakerProtoRequest(
	firstName string,
	phoneNumber *string,
) (*string, error) {
	if firstName == "" {
		return nil, status.Error(codes.InvalidArgument, "medical_decision_maker.first_name cannot be empty")
	}
	var formattedPhoneNumber *string
	if phoneNumber != nil {
		num, err := phonenumbers.Parse(*phoneNumber, usPhoneNumberRegionCode)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "medical_decision_maker.phone_number %s", err.Error())
		} else if !phonenumbers.IsValidNumber(num) {
			return nil, status.Error(codes.InvalidArgument, "medical_decision_maker.phone_number is not valid")
		}
		formatted := phonenumbers.Format(num, phonenumbers.E164)
		formattedPhoneNumber = &formatted
	}

	return formattedPhoneNumber, nil
}

func validateAndParseNoteProtoRequest(details string, kind string) (int16, error) {
	if details == "" {
		return 0, status.Error(codes.InvalidArgument, "note.details cannot be empty")
	}

	if kind == "" {
		return 0, status.Error(codes.InvalidArgument, "note.note_kind cannot be empty")
	}

	noteKindIndex, err := getNoteKindIDFromNoteKindString(kind)
	if err != nil {
		return 0, status.Error(codes.InvalidArgument, err.Error())
	}

	return *noteKindIndex, nil
}

func validateTaskTemplateUpdateProtoRequest(req *caremanagerpb.UpdateTaskTemplateRequest) error {
	if req.Name == nil || *req.Name == "" {
		return status.Error(codes.InvalidArgument, "task_template.name cannot be empty")
	}
	if req.ServiceLineId == nil || *req.ServiceLineId == 0 {
		return status.Error(codes.InvalidArgument, "task_template.service_line_id cannot be empty")
	}
	return nil
}
func validateTaskTemplateTaskUpdate(task *caremanagerpb.UpdateTaskTemplateRequest_UpdateTaskTemplateTask) error {
	if task.TaskTypeId == nil {
		return status.Error(codes.InvalidArgument, "task_template.task.task_type_id cannot be empty")
	}
	if task.Body == nil {
		return status.Error(codes.InvalidArgument, "task_template.task.body cannot be empty")
	}
	return nil
}

func CreatePatientSQLParamsFromCreatePatientProtoRequest(
	req *caremanagerpb.CreatePatientRequest,
) (*caremanagerdb.CreatePatientParams, error) {
	dateOfBirth, formattedPhoneNumber, err := validateAndParsePatientProtoRequest(
		req.FirstName,
		req.LastName,
		req.Sex,
		req.DateOfBirth,
		req.PhoneNumber,
	)
	if err != nil {
		return nil, err
	}

	var phoneNumber string
	if formattedPhoneNumber != nil {
		phoneNumber = *formattedPhoneNumber
	}
	var addressStreet string
	if req.AddressStreet != nil {
		addressStreet = *req.AddressStreet
	}
	var addressCity string
	if req.AddressCity != nil {
		addressCity = *req.AddressCity
	}
	var addressState string
	if req.AddressState != nil {
		addressState = *req.AddressState
	}
	var addressZipcode string
	if req.AddressZipcode != nil {
		addressZipcode = *req.AddressZipcode
	}

	return &caremanagerdb.CreatePatientParams{
		FirstName:                     req.FirstName,
		LastName:                      req.LastName,
		Sex:                           req.Sex,
		DateOfBirth:                   *dateOfBirth,
		PhoneNumber:                   phoneNumber,
		MiddleName:                    sqltypes.ToNullString(req.MiddleName),
		AthenaMedicalRecordNumber:     sqltypes.ToNullString(req.AthenaMedicalRecordNumber),
		MedicalPowerOfAttorneyDetails: sqltypes.ToNullString(req.MedicalPowerOfAttorneyDetails),
		Payer:                         sqltypes.ToNullString(req.Payer),
		PreferredPharmacyDetails:      sqltypes.ToNullString(req.PreferredPharmacyDetails),
		DoctorDetails:                 sqltypes.ToNullString(req.DoctorDetails),
		Referrer:                      sqltypes.ToNullString(req.Referrer),
		AddressStreet:                 addressStreet,
		AddressStreet2:                sqltypes.ToNullString(req.AddressStreet_2),
		AddressCity:                   addressCity,
		AddressState:                  addressState,
		AddressZipcode:                addressZipcode,
		AddressNotes:                  sqltypes.ToNullString(req.AddressNotes),
	}, nil
}

func CreatePatientSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) (*caremanagerdb.CreatePatientParams, error) {
	patient := req.Patient
	dateOfBirth, phoneNumber, err := validateAndParsePatientProtoRequest(
		patient.FirstName,
		patient.LastName,
		patient.Sex,
		patient.DateOfBirth,
		&patient.PhoneNumber,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerdb.CreatePatientParams{
		FirstName:                 patient.FirstName,
		LastName:                  patient.LastName,
		Sex:                       patient.Sex,
		DateOfBirth:               *dateOfBirth,
		PhoneNumber:               *phoneNumber,
		MiddleName:                sqltypes.ToNullString(patient.MiddleName),
		AthenaMedicalRecordNumber: sqltypes.ToNullString(&patient.AthenaMedicalRecordNumber),
		Payer:                     sqltypes.ToNullString(req.Payer),
		AddressStreet:             *patient.AddressStreet,
		AddressID:                 sqltypes.ToNullInt64(patient.AddressId),
		AddressStreet2:            sqltypes.ToNullString(patient.AddressStreet_2),
		AddressCity:               *patient.AddressCity,
		AddressState:              *patient.AddressState,
		AddressZipcode:            *patient.AddressZipcode,
	}, nil
}

func CreateMedicalDecisionMakerSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req *caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR,
	patientID int64,
) (*caremanagerdb.CreateMedicalDecisionMakerParams, error) {
	pn, err := validateAndParseMedicalDecisionMakerProtoRequest(
		req.FirstName,
		req.PhoneNumber,
	)
	if err != nil {
		return nil, err
	}
	lastName := ""
	if req.LastName != nil {
		lastName = *req.LastName
	}
	var phoneNumber *string
	if pn != nil {
		phoneNumber = pn
	}

	return &caremanagerdb.CreateMedicalDecisionMakerParams{
		FirstName:    req.FirstName,
		LastName:     lastName,
		PhoneNumber:  sqltypes.ToNullString(phoneNumber),
		Address:      sqltypes.ToNullString(req.Address),
		Relationship: sqltypes.ToNullString(req.Relationship),
		PatientID:    patientID,
	}, nil
}

func CreateInsuranceSQLParamsFromCreateVisitFromStationCRProtoRequest(
	req []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR,
	patientID int64,
) (*caremanagerdb.CreateInsurancesParams, error) {
	var names, memberIDs []string
	var patientIds []int64
	var priorities []int32
	for _, r := range req {
		if !slices.Contains(supportedInsurancePriorities, *r.Priority) {
			return nil, status.Errorf(codes.InvalidArgument, "insurances.priority %d is invalid", *r.Priority)
		}
		var memberID string
		if r.MemberId != nil {
			memberID = *r.MemberId
		}
		names = append(names, r.Name)
		memberIDs = append(memberIDs, memberID)
		priorities = append(priorities, *r.Priority)
		patientIds = append(patientIds, patientID)
	}

	return &caremanagerdb.CreateInsurancesParams{
		Name:      names,
		PatientID: patientIds,
		MemberID:  memberIDs,
		Priority:  priorities,
	}, nil
}

func TaskTemplateProtoFromTaskTemplateSQL(
	taskTemplate *caremanagerdb.TaskTemplate,
	carePhase *caremanagerdb.CarePhase,
	tasks []*caremanagerdb.TaskTemplateTask,
	taskTypeByIDMap map[int64]*caremanagerdb.TaskType,
) (*caremanagerpb.TaskTemplate, error) {
	createdAt := taskTemplate.CreatedAt.Format(timestampLayout)
	updatedAt := taskTemplate.UpdatedAt.Format(timestampLayout)

	var tasksProto []*caremanagerpb.TaskTemplateTask
	for _, t := range tasks {
		taskProto, err := TemplateTaskProtoFromTemplateTaskSQL(t, taskTypeByIDMap)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Cannot convert task sql to task proto: task_template_task.id: %d", t.ID)
		}
		tasksProto = append(tasksProto, taskProto)
	}
	var carePhaseProto *caremanagerpb.CarePhase
	if carePhase != nil {
		carePhaseProto = CarePhaseProtoFromCarePhaseSQL(carePhase)
	}

	return &caremanagerpb.TaskTemplate{
		Id:              taskTemplate.ID,
		Name:            taskTemplate.Name,
		Summary:         sqltypes.ToProtoString(taskTemplate.Summary),
		TasksCount:      int64(len(tasks)),
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
		ServiceLineId:   taskTemplate.ServiceLineID,
		UpdatedByUserId: taskTemplate.LastUpdatedByUserID,

		CarePhase: carePhaseProto,
		Tasks:     tasksProto,
	}, nil
}

func CreateTaskTemplateParamsFromCreateTaskTemplateProtoRequest(req *caremanagerpb.CreateTaskTemplateRequest, userID int64) (*caremanagerdb.CreateTaskTemplateParams, error) {
	if userID == 0 {
		return nil, status.Error(codes.InvalidArgument, "user_id cannot be empty")
	}
	if req.ServiceLineId == 0 {
		return nil, status.Error(codes.InvalidArgument, "task_template.service_line_id cannot be empty")
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "task_template.name cannot be empty")
	}
	return &caremanagerdb.CreateTaskTemplateParams{
		Name:            req.Name,
		Summary:         sqltypes.ToNullString(&req.Summary),
		ServiceLineID:   req.ServiceLineId,
		CarePhaseID:     sqltypes.ToNullInt64(req.CarePhaseId),
		CreatedByUserID: userID,
	}, nil
}

func CreateTemplateTaskParamsFromCreateTemplateTaskProto(templateTaskProto *caremanagerpb.CreateTemplateTask, templateID int64) *caremanagerdb.CreateTemplateTaskParams {
	return &caremanagerdb.CreateTemplateTaskParams{
		Body:       templateTaskProto.Body,
		TemplateID: templateID,
		TypeID:     templateTaskProto.TaskTypeId,
	}
}

func CreateTemplateTasksParamsFromCreateTemplateTasksProto(
	templateTasks []*caremanagerpb.CreateTemplateTask,
	templateID int64,
	taskTypesMap map[int64]*caremanagerdb.TaskType,
) (*caremanagerdb.CreateTemplateTasksParams, error) {
	params := &caremanagerdb.CreateTemplateTasksParams{}

	if templateID == 0 {
		return nil, status.Error(codes.InvalidArgument, "template_id cannot be empty")
	}

	for _, templateTask := range templateTasks {
		if templateTask.Body == "" {
			return nil, status.Error(codes.InvalidArgument, "task_template_task.body cannot be empty")
		}
		_, ok := taskTypesMap[templateTask.TaskTypeId]
		if !ok {
			return nil, fmt.Errorf("task type not found: %d", templateTask.TaskTypeId)
		}

		params.Bodies = append(params.Bodies, templateTask.Body)
		params.TypeIds = append(params.TypeIds, templateTask.TaskTypeId)
		params.TemplateIds = append(params.TemplateIds, templateID)
	}
	return params, nil
}

func UpdateNoteSQLParamsFromUpdateNoteProtoRequest(
	req *caremanagerpb.UpdateNoteRequest,
	lastUpdatedByUserID *int64,
) (*caremanagerdb.UpdateNoteParams, error) {
	if req.NoteId == 0 {
		return nil, status.Error(codes.InvalidArgument, "update_note_request.id cannot be empty")
	}

	kind := sql.NullInt16{}
	if req.NoteKind != nil && *req.NoteKind != "" {
		noteKindIndex, err := getNoteKindIDFromNoteKindString(*req.NoteKind)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, err.Error())
		}

		kind = sql.NullInt16{Int16: *noteKindIndex, Valid: true}
	}

	body := sql.NullString{}
	if req.Details != nil && *req.Details != "" {
		body = sqltypes.ToNullString(req.Details)
	}

	return &caremanagerdb.UpdateNoteParams{
		ID:                  req.NoteId,
		Body:                body,
		Kind:                kind,
		LastUpdatedByUserID: sqltypes.ToNullInt64(lastUpdatedByUserID),
	}, nil
}

func UpdatePatientSQLParamsFromUpdatePatientProtoRequest(
	req *caremanagerpb.UpdatePatientRequest,
) (*caremanagerdb.UpdatePatientParams, error) {
	if req.PatientId == 0 {
		return nil, status.Error(codes.InvalidArgument, "update_patient_request.id cannot be empty")
	}
	dateOfBirth, phoneNumber, err := validateAndParsePatientProtoRequest(
		req.FirstName,
		req.LastName,
		req.Sex,
		req.DateOfBirth,
		req.PhoneNumber,
	)
	if err != nil {
		return nil, err
	}
	return &caremanagerdb.UpdatePatientParams{
		ID:                            req.PatientId,
		FirstName:                     req.FirstName,
		LastName:                      req.LastName,
		Sex:                           req.Sex,
		DateOfBirth:                   *dateOfBirth,
		MiddleName:                    sqltypes.ToNullString(req.MiddleName),
		PhoneNumber:                   sqltypes.ToNullString(phoneNumber),
		AthenaMedicalRecordNumber:     sqltypes.ToNullString(req.AthenaMedicalRecordNumber),
		MedicalPowerOfAttorneyDetails: sqltypes.ToNullString(req.MedicalPowerOfAttorneyDetails),
		Payer:                         sqltypes.ToNullString(req.Payer),
		PreferredPharmacyDetails:      sqltypes.ToNullString(req.PreferredPharmacyDetails),
		DoctorDetails:                 sqltypes.ToNullString(req.DoctorDetails),
		Referrer:                      sqltypes.ToNullString(req.Referrer),
		AddressStreet:                 sqltypes.ToNullString(req.AddressStreet),
		AddressStreet2:                sqltypes.ToNullString(req.AddressStreet_2),
		AddressCity:                   sqltypes.ToNullString(req.AddressCity),
		AddressState:                  sqltypes.ToNullString(req.AddressState),
		AddressZipcode:                sqltypes.ToNullString(req.AddressZipcode),
		AddressNotes:                  sqltypes.ToNullString(req.AddressNotes),
	}, nil
}

func UpdateTaskTemplateSQLParamsFromUpdateTaskTemplateProtoRequest(
	req *caremanagerpb.UpdateTaskTemplateRequest,
	userID int64,
) (*caremanagerdb.UpdateTaskTemplateParams, error) {
	if req.TemplateId == 0 {
		return nil, status.Error(codes.InvalidArgument, "update_task_template_request.id cannot be empty")
	}
	err := validateTaskTemplateUpdateProtoRequest(req)
	if err != nil {
		return nil, err
	}
	return &caremanagerdb.UpdateTaskTemplateParams{
		ID:                  req.TemplateId,
		Name:                sqltypes.ToNullString(req.Name),
		Summary:             sqltypes.ToNullString(req.Summary),
		ServiceLineID:       sqltypes.ToNullInt64(req.ServiceLineId),
		CarePhaseID:         sqltypes.ToNullInt64(req.CarePhaseId),
		LastUpdatedByUserID: userID,
	}, nil
}

func UpdateTaskTemplateTasksSQLParamsFromUpdateTaskTemplateProtoRequest(
	req *caremanagerpb.UpdateTaskTemplateRequest,
) ([]*caremanagerdb.CreateTemplateTaskParams, []*caremanagerdb.UpdateTaskTemplateTaskParams, []*caremanagerdb.DeleteTaskTemplateTaskParams, error) {
	var tasksToCreate []*caremanagerdb.CreateTemplateTaskParams
	var tasksToUpdate []*caremanagerdb.UpdateTaskTemplateTaskParams
	var tasksToDelete []*caremanagerdb.DeleteTaskTemplateTaskParams
	for _, task := range req.Tasks {
		switch {
		case task.Id == nil:
			err := validateTaskTemplateTaskUpdate(task)
			if err != nil {
				return nil, nil, nil, err
			}
			tasksToCreate = append(tasksToCreate, &caremanagerdb.CreateTemplateTaskParams{
				Body:       *task.Body,
				TypeID:     *task.TaskTypeId,
				TemplateID: req.TemplateId,
			})
		case task.Destroy != nil && *task.Destroy:
			tasksToDelete = append(tasksToDelete, &caremanagerdb.DeleteTaskTemplateTaskParams{
				ID:         *task.Id,
				TemplateID: req.TemplateId,
			})
		default:
			err := validateTaskTemplateTaskUpdate(task)
			if err != nil {
				return nil, nil, nil, err
			}
			tasksToUpdate = append(tasksToUpdate, &caremanagerdb.UpdateTaskTemplateTaskParams{
				Body:       sqltypes.ToNullString(task.Body),
				TypeID:     sqltypes.ToNullInt64(task.TaskTypeId),
				ID:         *task.Id,
				TemplateID: req.TemplateId,
			})
		}
	}
	return tasksToCreate, tasksToUpdate, tasksToDelete, nil
}

func CreateTaskSQLParamsFromCreateEpisodeTasksRequest(
	req *caremanagerpb.CreateEpisodeTasksRequest,
	taskTypesMap map[string]*caremanagerdb.TaskType,
) (*caremanagerdb.CreateTasksParams, error) {
	var (
		params = &caremanagerdb.CreateTasksParams{}
	)

	for _, taskInput := range req.Tasks {
		if taskInput.Task == "" {
			return nil, errors.New("task description can't be empty")
		}
		taskType, ok := taskTypesMap[taskInput.TaskType]
		if !ok {
			return nil, fmt.Errorf("task type not found: %s", taskInput.TaskType)
		}

		var isCompleted = false
		if taskInput.Status != nil && *taskInput.Status == legacyTaskStatusCompleted {
			isCompleted = true
		}

		params.Descriptions = append(params.Descriptions, taskInput.Task)
		params.AreTasksCompleted = append(params.AreTasksCompleted, isCompleted)
		params.EpisodeIds = append(params.EpisodeIds, req.EpisodeId)
		params.TaskTypeIds = append(params.TaskTypeIds, taskType.ID)
	}

	return params, nil
}

func CreateMedicalDecisionMakerParamsFromCreatePatientRequest(patientID int64, req *caremanagerpb.CreatePatientRequest) *caremanagerdb.CreateMedicalDecisionMakerParams {
	return &caremanagerdb.CreateMedicalDecisionMakerParams{
		FirstName: *req.MedicalPowerOfAttorneyDetails,
		PatientID: patientID,
	}
}

func CreateMedicalDecisionMakerParamsFromUpdatePatientRequest(patientID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.CreateMedicalDecisionMakerParams {
	return &caremanagerdb.CreateMedicalDecisionMakerParams{
		FirstName: *req.MedicalPowerOfAttorneyDetails,
		PatientID: patientID,
	}
}

func UpdateMedicalDecisionMakerParamsFromUpdatePatientRequest(medicalDecisionMakerID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.UpdateMedicalDecisionMakerParams {
	return &caremanagerdb.UpdateMedicalDecisionMakerParams{
		ID:        medicalDecisionMakerID,
		FirstName: sqltypes.ToNullString(req.MedicalPowerOfAttorneyDetails),
	}
}

func CreateInsuranceParamsFromCreatePatientRequest(patientID int64, req *caremanagerpb.CreatePatientRequest) *caremanagerdb.CreateInsuranceParams {
	return &caremanagerdb.CreateInsuranceParams{
		Name:      *req.Payer,
		PatientID: patientID,
	}
}

func CreateInsuranceParamsFromUpdatePatientRequest(patientID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.CreateInsuranceParams {
	return &caremanagerdb.CreateInsuranceParams{
		Name:      *req.Payer,
		PatientID: patientID,
	}
}

func UpdateInsuranceParamsFromUpdatePatientRequest(insuranceID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.UpdateInsuranceParams {
	return &caremanagerdb.UpdateInsuranceParams{
		ID:   insuranceID,
		Name: sqltypes.ToNullString(req.Payer),
	}
}

func CreatePharmacyParamsFromCreatePatientRequest(patientID int64, req *caremanagerpb.CreatePatientRequest) *caremanagerdb.CreatePharmacyParams {
	return &caremanagerdb.CreatePharmacyParams{
		Name:      *req.PreferredPharmacyDetails,
		PatientID: patientID,
	}
}

func CreatePharmacyParamsFromUpdatePatientRequest(patientID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.CreatePharmacyParams {
	return &caremanagerdb.CreatePharmacyParams{
		Name:      *req.PreferredPharmacyDetails,
		PatientID: patientID,
	}
}

func UpdatePharmacyParamsFromUpdatePatientRequest(pharmacyID int64, req *caremanagerpb.UpdatePatientRequest) *caremanagerdb.UpdatePharmacyParams {
	return &caremanagerdb.UpdatePharmacyParams{
		ID:   pharmacyID,
		Name: sqltypes.ToNullString(req.PreferredPharmacyDetails),
	}
}

func emptyStringPointerToNil(value *string) *string {
	if value == nil || *value == "" {
		return nil
	}
	return value
}

func UpdateVisitByCareRequestIDParamsFromUpdateVisitFromStationCRRequest(req *caremanagerpb.UpdateVisitFromStationCRRequest) (*caremanagerdb.UpdateVisitByCareRequestIDParams, error) {
	if req.UpdatedByUserId != nil && *req.UpdatedByUserId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "UpdatedByUserId: %d must be a valid UserId", *req.UpdatedByUserId)
	}

	return &caremanagerdb.UpdateVisitByCareRequestIDParams{
		CareRequestID:            req.CareRequestId,
		UpdatedByUserID:          sqltypes.ToNullInt64(req.UpdatedByUserId),
		Status:                   sqltypes.ToNullString(req.Status),
		StatusUpdatedAt:          sqltypes.StringToNullTime(req.StatusUpdatedAt),
		PatientAvailabilityStart: sqltypes.StringToNullTime(emptyStringPointerToNil(req.PatientAvailabilityStart)),
		PatientAvailabilityEnd:   sqltypes.StringToNullTime(emptyStringPointerToNil(req.PatientAvailabilityEnd)),
		CarName:                  sqltypes.ToNullString(emptyStringPointerToNil(req.CarName)),
		CarID:                    sqltypes.ToNullInt64(req.CarId),
		VirtualAppID:             sqltypes.ToNullInt64(req.VirtualAppId),
		ProviderUserIds:          req.ProviderUserIds,
		AddressID:                sqltypes.ToNullInt64(req.AddressId),
	}, nil
}

func UpdateEpisodeParamsFromUpdateVisitFromStationCRRequest(
	req *caremanagerpb.UpdateVisitFromStationCRRequest,
	visit *caremanagerdb.Visit,
) *caremanagerdb.UpdateEpisodeParams {
	return &caremanagerdb.UpdateEpisodeParams{
		ID:                    visit.EpisodeID,
		ServiceLineID:         sqltypes.ToNullInt64(req.ServiceLineId),
		OriginalCareRequestID: sqltypes.ToNullInt64(req.OriginalCareRequestId),
	}
}

// Entity converters

func CarePhaseProtoFromCarePhaseSQL(carePhase *caremanagerdb.CarePhase) *caremanagerpb.CarePhase {
	var phaseType string
	if carePhase.IsActive {
		phaseType = legacyCarePhaseTypeActive
	} else {
		phaseType = legacyCarePhaseTypeInactive
	}

	return &caremanagerpb.CarePhase{
		Id:        carePhase.ID,
		Name:      carePhase.Name,
		PhaseType: phaseType,
	}
}

func ExternalCareProviderProtoFromExternalCareProviderSQL(externalCareProvider *caremanagerdb.ExternalCareProvider) *caremanagerpb.ExternalCareProvider {
	var phoneNumber *string
	if externalCareProvider.PhoneNumber.Valid {
		phoneNumber = &externalCareProvider.PhoneNumber.String
	}
	var faxNumber *string
	if externalCareProvider.FaxNumber.Valid {
		faxNumber = &externalCareProvider.FaxNumber.String
	}
	var address *string
	if externalCareProvider.Address.Valid {
		address = &externalCareProvider.Address.String
	}

	return &caremanagerpb.ExternalCareProvider{
		Id:             externalCareProvider.ID,
		Name:           externalCareProvider.Name,
		PhoneNumber:    phoneNumber,
		FaxNumber:      faxNumber,
		Address:        address,
		ProviderTypeId: externalCareProvider.ProviderTypeID,
		PatientId:      externalCareProvider.PatientID,
	}
}

type EpisodeProtoFromEpisodeRowSQLParams struct {
	patient          *caremanagerdb.Patient
	carePhase        *caremanagerdb.CarePhase
	tasks            []*caremanagerdb.Task
	mostRelevantNote *caremanagerdb.Note
}

func EpisodeProtoFromEpisodeRowSQL(
	episode *caremanagerdb.GetEpisodesRow,
	params *EpisodeProtoFromEpisodeRowSQLParams,
) *caremanagerpb.Episode {
	var (
		admittedAt = episode.AdmittedAt.Format(timestampLayout)
		createdAt  = episode.CreatedAt.Format(timestampLayout)
		updatedAt  = episode.UpdatedAt.Format(timestampLayout)
	)

	incompleteTasksCountPerType := map[int64]int{}
	for _, t := range params.tasks {
		if t.IsCompleted {
			continue
		}
		incompleteTasksCountPerType[t.TaskTypeID]++
	}

	var noteProto *caremanagerpb.Note
	if params.mostRelevantNote != nil {
		noteProto = NoteProtoFromNoteSQL(
			params.mostRelevantNote,
		)
	}

	return &caremanagerpb.Episode{
		Id:                 episode.ID,
		AdmittedAt:         admittedAt,
		PatientSummary:     episode.PatientSummary,
		CareDay:            sqltypes.ToProtoInt64(episode.CareDay),
		DischargedAt:       sqltypes.ToProtoStringTimestamp(episode.DischargedAt),
		Source:             sqltypes.ToProtoString(episode.Source),
		PrimaryDiagnosis:   sqltypes.ToProtoString(episode.PrimaryDiagnosis),
		Payer:              sqltypes.ToProtoString(episode.Payer),
		DoctorsPrimaryCare: sqltypes.ToProtoString(episode.DoctorsPrimaryCare),
		ServiceLineId:      episode.ServiceLineID,
		CreatedAt:          proto.String(createdAt),
		UpdatedAt:          proto.String(updatedAt),

		Patient:          PatientProtoFromPatientSQL(params.patient, PatientProtoFromPatientSQLParams{}),
		PatientId:        episode.PatientID,
		CarePhase:        CarePhaseProtoFromCarePhaseSQL(params.carePhase),
		MostRelevantNote: noteProto,
		LastNote:         noteProto,
		IncompleteTasks: &caremanagerpb.IncompleteTasks{
			NurseNavigator:     int64(incompleteTasksCountPerType[carePhaseNurseNavigatorID]),
			DailyAndOnboarding: int64(incompleteTasksCountPerType[carePhaseDailyAndOnboardingID]),
			T1:                 int64(incompleteTasksCountPerType[carePhaseT1ID]),
			T2:                 int64(incompleteTasksCountPerType[carePhaseT2ID]),
		},
		IsWaiver: episode.IsWaiver,
	}
}

func InsuranceProtoFromInsuranceSQL(insurance *caremanagerdb.Insurance) *caremanagerpb.Insurance {
	var memberID *string
	if insurance.MemberID.Valid {
		memberID = &insurance.MemberID.String
	}

	return &caremanagerpb.Insurance{
		Id:        insurance.ID,
		Name:      insurance.Name,
		MemberId:  memberID,
		Priority:  insurance.Priority,
		PatientId: insurance.PatientID,
	}
}

func MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker) *caremanagerpb.MedicalDecisionMaker {
	var address *string
	if medicalDecisionMaker.Address.Valid {
		address = &medicalDecisionMaker.Address.String
	}
	var phoneNumber *string
	if medicalDecisionMaker.PhoneNumber.Valid {
		phoneNumber = &medicalDecisionMaker.PhoneNumber.String
	}
	var relationship *string
	if medicalDecisionMaker.Relationship.Valid {
		relationship = &medicalDecisionMaker.Relationship.String
	}

	return &caremanagerpb.MedicalDecisionMaker{
		Id:           medicalDecisionMaker.ID,
		FirstName:    medicalDecisionMaker.FirstName,
		LastName:     medicalDecisionMaker.LastName,
		PhoneNumber:  phoneNumber,
		Address:      address,
		Relationship: relationship,
		PatientId:    medicalDecisionMaker.PatientID,
	}
}

func NoteProtoFromNoteSQL(
	note *caremanagerdb.Note,
) *caremanagerpb.Note {
	createdAt := note.CreatedAt.Format(timestampLayout)
	updatedAt := note.UpdatedAt.Format(timestampLayout)

	var createdByUserID *int64
	if note.CreatedByUserID.Valid {
		createdByUserID = &note.CreatedByUserID.Int64
	}
	var updatedByUserID *int64
	if note.LastUpdatedByUserID.Valid {
		updatedByUserID = &note.LastUpdatedByUserID.Int64
	}

	return &caremanagerpb.Note{
		Id:              note.ID,
		Details:         note.Body,
		NoteKind:        noteKindMap[note.Kind],
		NoteableId:      note.EpisodeID.Int64,
		EpisodeId:       note.EpisodeID.Int64,
		Pinned:          proto.Bool(note.Pinned),
		CreatedByUserId: createdByUserID,
		UpdatedByUserId: updatedByUserID,
		CreatedAt:       proto.String(createdAt),
		UpdatedAt:       proto.String(updatedAt),
	}
}

func VisitNoteProtoFromStationNote(
	note *StationNote,
) *caremanagerpb.Note {
	createdAt := note.CreatedAt.Format(timestampLayout)
	updatedAt := note.UpdatedAt.Format(timestampLayout)

	return &caremanagerpb.Note{
		Id:              note.ID,
		Details:         note.Details,
		NoteKind:        note.NoteKind,
		CreatedByUserId: note.CreatedByUserID,
		CreatedAt:       proto.String(createdAt),
		UpdatedAt:       proto.String(updatedAt),
		Pinned:          proto.Bool(note.Pinned),
	}
}

type PatientProtoFromPatientSQLParams struct {
	medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	insurance            *caremanagerdb.Insurance
	pharmacy             *caremanagerdb.Pharmacy
	externalDoctor       *caremanagerdb.ExternalCareProvider
	externalReferrer     *caremanagerdb.ExternalCareProvider
}

func PatientProtoFromPatientSQL(
	patient *caremanagerdb.Patient,
	params PatientProtoFromPatientSQLParams,
) *caremanagerpb.Patient {
	dateOfBirth := patient.DateOfBirth.Format(dateLayout)
	createdAt := patient.CreatedAt.Format(timestampLayout)
	updatedAt := patient.UpdatedAt.Format(timestampLayout)

	var medicalPowerOfAttorneyDetails *string
	if params.medicalDecisionMaker != nil {
		medicalPowerOfAttorneyDetails = &params.medicalDecisionMaker.FirstName
	}
	var payer *string
	if params.insurance != nil {
		payer = &params.insurance.Name
	}
	var preferredPharmacyDetails *string
	if params.pharmacy != nil {
		preferredPharmacyDetails = &params.pharmacy.Name
	}
	var doctorDetails *string
	if params.externalDoctor != nil {
		doctorDetails = &params.externalDoctor.Name
	}
	var referrer *string
	if params.externalReferrer != nil {
		referrer = &params.externalReferrer.Name
	}

	return &caremanagerpb.Patient{
		Id:                            patient.ID,
		FirstName:                     patient.FirstName,
		LastName:                      patient.LastName,
		Sex:                           patient.Sex,
		DateOfBirth:                   dateOfBirth,
		PhoneNumber:                   &patient.PhoneNumber,
		MiddleName:                    sqltypes.ToProtoString(patient.MiddleName),
		AthenaMedicalRecordNumber:     sqltypes.ToProtoString(patient.AthenaMedicalRecordNumber),
		MedicalPowerOfAttorneyDetails: medicalPowerOfAttorneyDetails,
		Payer:                         payer,
		PreferredPharmacyDetails:      preferredPharmacyDetails,
		DoctorDetails:                 doctorDetails,
		Referrer:                      referrer,
		AddressStreet:                 &patient.AddressStreet,
		AddressStreet_2:               sqltypes.ToProtoString(patient.AddressStreet2),
		AddressCity:                   &patient.AddressCity,
		AddressState:                  &patient.AddressState,
		AddressZipcode:                &patient.AddressZipcode,
		AddressNotes:                  sqltypes.ToProtoString(patient.AddressNotes),
		CreatedAt:                     proto.String(createdAt),
		UpdatedAt:                     proto.String(updatedAt),
		AthenaId:                      sqltypes.ToProtoString(patient.AthenaMedicalRecordNumber),
	}
}

type PatientProtoFromGetPatientSQLRowParams struct {
	medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	insurance            *caremanagerdb.Insurance
	pharmacy             *caremanagerdb.Pharmacy
	externalDoctor       *caremanagerdb.ExternalCareProvider
	externalReferrer     *caremanagerdb.ExternalCareProvider
}

func PatientProtoFromGetPatientSQLRow(
	patient *caremanagerdb.GetPatientsRow,
	params PatientProtoFromGetPatientSQLRowParams,
) *caremanagerpb.Patient {
	dateOfBirth := patient.DateOfBirth.Format(dateLayout)
	createdAt := patient.CreatedAt.Format(timestampLayout)
	updatedAt := patient.UpdatedAt.Format(timestampLayout)

	var medicalPowerOfAttorneyDetails *string
	if params.medicalDecisionMaker != nil {
		medicalPowerOfAttorneyDetails = &params.medicalDecisionMaker.FirstName
	}
	var payer *string
	if params.insurance != nil {
		payer = &params.insurance.Name
	}
	var preferredPharmacyDetails *string
	if params.pharmacy != nil {
		preferredPharmacyDetails = &params.pharmacy.Name
	}
	var doctorDetails *string
	if params.externalDoctor != nil {
		doctorDetails = &params.externalDoctor.Name
	}
	var referrer *string
	if params.externalReferrer != nil {
		referrer = &params.externalReferrer.Name
	}

	return &caremanagerpb.Patient{
		Id:                            patient.ID,
		FirstName:                     patient.FirstName,
		LastName:                      patient.LastName,
		Sex:                           patient.Sex,
		DateOfBirth:                   dateOfBirth,
		PhoneNumber:                   &patient.PhoneNumber,
		MiddleName:                    sqltypes.ToProtoString(patient.MiddleName),
		AthenaMedicalRecordNumber:     sqltypes.ToProtoString(patient.AthenaMedicalRecordNumber),
		MedicalPowerOfAttorneyDetails: medicalPowerOfAttorneyDetails,
		Payer:                         payer,
		PreferredPharmacyDetails:      preferredPharmacyDetails,
		DoctorDetails:                 doctorDetails,
		Referrer:                      referrer,
		AddressStreet:                 &patient.AddressStreet,
		AddressStreet_2:               sqltypes.ToProtoString(patient.AddressStreet2),
		AddressCity:                   &patient.AddressCity,
		AddressState:                  &patient.AddressState,
		AddressZipcode:                &patient.AddressZipcode,
		AddressNotes:                  sqltypes.ToProtoString(patient.AddressNotes),
		CreatedAt:                     proto.String(createdAt),
		UpdatedAt:                     proto.String(updatedAt),
	}
}

func PharmacyProtoFromPharmacySQL(pharmacy *caremanagerdb.Pharmacy) *caremanagerpb.Pharmacy {
	var phoneNumber *string
	if pharmacy.PhoneNumber.Valid {
		phoneNumber = &pharmacy.PhoneNumber.String
	}
	var faxNumber *string
	if pharmacy.FaxNumber.Valid {
		faxNumber = &pharmacy.FaxNumber.String
	}
	var address *string
	if pharmacy.Address.Valid {
		address = &pharmacy.Address.String
	}

	return &caremanagerpb.Pharmacy{
		Id:          pharmacy.ID,
		Name:        pharmacy.Name,
		PhoneNumber: phoneNumber,
		FaxNumber:   faxNumber,
		Address:     address,
		PatientId:   pharmacy.PatientID,
	}
}

func ProviderTypeProtoFromProviderTypeSQL(providerType *caremanagerdb.ProviderType) *caremanagerpb.ProviderType {
	return &caremanagerpb.ProviderType{
		Id:   providerType.ID,
		Name: providerType.Name.String,
	}
}

func ServiceLineProtoFromServiceLineSQL(serviceLine *caremanagerdb.ServiceLine) *caremanagerpb.ServiceLine {
	return &caremanagerpb.ServiceLine{
		Id:        serviceLine.ID,
		Name:      serviceLine.Name,
		ShortName: serviceLine.ShortName.String,
	}
}

func TemplateTaskProtoFromTemplateTaskSQL(
	templateTask *caremanagerdb.TaskTemplateTask,
	taskTypeByIDMap map[int64]*caremanagerdb.TaskType,
) (*caremanagerpb.TaskTemplateTask, error) {
	if taskTypeByIDMap[templateTask.TypeID] == nil {
		return nil, status.Errorf(codes.Internal, "could not find the task_type assigned to this template task, task_id: %d", templateTask.ID)
	}
	return &caremanagerpb.TaskTemplateTask{
		Id:   templateTask.ID,
		Body: templateTask.Body,
		Type: TaskTypeProtoFromTaskTypeSQL(taskTypeByIDMap[templateTask.TypeID]),
	}, nil
}

func TaskProtoFromTaskSQL(task *caremanagerdb.Task, taskType *caremanagerdb.TaskType) *caremanagerpb.Task {
	createdAt := task.CreatedAt.Format(timestampLayout)
	updatedAt := task.UpdatedAt.Format(timestampLayout)
	var taskStatus string

	// This attribute gets converted to string for legacy reasons, should get refactored in a later revision to not
	// affect clients already using it.
	if task.IsCompleted {
		taskStatus = legacyTaskStatusCompleted
	} else {
		taskStatus = legacyTaskStatusPending
	}

	var completedByUserID *int64
	if task.CompletedByUserID.Valid {
		completedByUserID = &task.CompletedByUserID.Int64
	}

	return &caremanagerpb.Task{
		Id:                task.ID,
		Task:              task.Description,
		Status:            taskStatus,
		TaskType:          taskType.Slug,
		TaskableId:        task.EpisodeID,
		CompletedByUserId: completedByUserID,
		CreatedAt:         &createdAt,
		UpdatedAt:         &updatedAt,
	}
}

func TaskTypeProtoFromTaskTypeSQL(taskType *caremanagerdb.TaskType) *caremanagerpb.TaskType {
	return &caremanagerpb.TaskType{
		Id:   taskType.ID,
		Slug: taskType.Slug,
	}
}

func TaskTemplateProtoFromGetTaskTemplateSQLRow(
	taskTemplate *caremanagerdb.GetTaskTemplatesRow,
	carePhase *caremanagerdb.CarePhase,
) *caremanagerpb.TaskTemplate {
	var carePhaseProto *caremanagerpb.CarePhase
	if carePhase != nil {
		carePhaseProto = CarePhaseProtoFromCarePhaseSQL(carePhase)
	}
	return &caremanagerpb.TaskTemplate{
		Id:              taskTemplate.ID,
		CreatedAt:       taskTemplate.CreatedAt.Format(timestampLayout),
		UpdatedAt:       taskTemplate.UpdatedAt.Format(timestampLayout),
		Name:            taskTemplate.Name,
		Summary:         sqltypes.ToProtoString(taskTemplate.Summary),
		TasksCount:      taskTemplate.TasksCount,
		ServiceLineId:   taskTemplate.ServiceLineID,
		UpdatedByUserId: taskTemplate.LastUpdatedByUserID,

		CarePhase: carePhaseProto,
	}
}

func TaskTemplateProtoFromGetTaskTemplatesFromEpisodeSQLRow(
	taskTemplate *caremanagerdb.GetTaskTemplatesByIDRow,
	carePhase *caremanagerdb.CarePhase,
) *caremanagerpb.TaskTemplate {
	var carePhaseProto *caremanagerpb.CarePhase
	if carePhase != nil {
		carePhaseProto = CarePhaseProtoFromCarePhaseSQL(carePhase)
	}
	return &caremanagerpb.TaskTemplate{
		Id:              taskTemplate.ID,
		CreatedAt:       taskTemplate.CreatedAt.Format(timestampLayout),
		UpdatedAt:       taskTemplate.UpdatedAt.Format(timestampLayout),
		Name:            taskTemplate.Name,
		Summary:         sqltypes.ToProtoString(taskTemplate.Summary),
		TasksCount:      taskTemplate.TasksCount,
		ServiceLineId:   taskTemplate.ServiceLineID,
		UpdatedByUserId: taskTemplate.LastUpdatedByUserID,

		CarePhase: carePhaseProto,
	}
}

func validateTaskProtoRequest(description string) error {
	if description == "" {
		return status.Errorf(codes.InvalidArgument, "task description cannot be empty")
	}

	return nil
}

func UpdateTaskSQLParamsFromUpdateTaskProtoRequest(
	req *caremanagerpb.UpdateTaskRequest,
	taskType *caremanagerdb.TaskType,
	completedByUserID *int64,
) (*caremanagerdb.UpdateTaskParams, error) {
	if err := validateTaskProtoRequest(req.Task); err != nil {
		return nil, err
	}

	return &caremanagerdb.UpdateTaskParams{
		ID:                req.TaskId,
		Description:       req.Task,
		IsCompleted:       req.Status == legacyTaskStatusCompleted,
		TaskTypeID:        taskType.ID,
		CompletedByUserID: sqltypes.ToNullInt64(completedByUserID),
	}, nil
}

func GetActivePatientSQLParamsFromGetPatientsProtoRequest(
	req *caremanagerpb.GetActivePatientsRequest,
) (*caremanagerdb.GetActivePatientsParams, error) {
	pageSize := int64(defaultPageSize)
	pageOffset := int64(defaultOffset)

	if req.PageSize != nil {
		if *req.PageSize <= 0 {
			return nil, status.Error(codes.InvalidArgument, "page size should be greater than zero")
		}
		pageSize = *req.PageSize
	}

	if req.Page != nil {
		if *req.Page <= 0 {
			return nil, status.Error(codes.InvalidArgument, "page should be greater than zero")
		}
		pageOffset = (pageSize * *req.Page) - pageSize
	}

	return &caremanagerdb.GetActivePatientsParams{
		PageOffset: pageOffset,
		PageSize:   pageSize,
		AthenaIds:  req.AthenaIds,
	}, nil
}

type PatientProtoFromGetActivePatientSQLRowParams struct {
	medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	insurance            *caremanagerdb.Insurance
	pharmacy             *caremanagerdb.Pharmacy
	externalDoctor       *caremanagerdb.ExternalCareProvider
	externalReferrer     *caremanagerdb.ExternalCareProvider
}

func PatientProtoFromGetActivePatientSQLRow(
	patient *caremanagerdb.GetActivePatientsRow,
	params PatientProtoFromGetActivePatientSQLRowParams,
) *caremanagerpb.Patient {
	dateOfBirth := patient.DateOfBirth.Format(dateLayout)
	createdAt := patient.CreatedAt.Format(timestampLayout)
	updatedAt := patient.UpdatedAt.Format(timestampLayout)

	var medicalPowerOfAttorneyDetails *string
	if params.medicalDecisionMaker != nil {
		medicalPowerOfAttorneyDetails = &params.medicalDecisionMaker.FirstName
	}
	var payer *string
	if params.insurance != nil {
		payer = &params.insurance.Name
	}
	var preferredPharmacyDetails *string
	if params.pharmacy != nil {
		preferredPharmacyDetails = &params.pharmacy.Name
	}
	var doctorDetails *string
	if params.externalDoctor != nil {
		doctorDetails = &params.externalDoctor.Name
	}
	var referrer *string
	if params.externalReferrer != nil {
		referrer = &params.externalReferrer.Name
	}

	return &caremanagerpb.Patient{
		Id:                            patient.ID,
		FirstName:                     patient.FirstName,
		LastName:                      patient.LastName,
		Sex:                           patient.Sex,
		DateOfBirth:                   dateOfBirth,
		PhoneNumber:                   &patient.PhoneNumber,
		MiddleName:                    sqltypes.ToProtoString(patient.MiddleName),
		AthenaMedicalRecordNumber:     sqltypes.ToProtoString(patient.AthenaMedicalRecordNumber),
		MedicalPowerOfAttorneyDetails: medicalPowerOfAttorneyDetails,
		Payer:                         payer,
		PreferredPharmacyDetails:      preferredPharmacyDetails,
		DoctorDetails:                 doctorDetails,
		Referrer:                      referrer,
		AddressStreet:                 &patient.AddressStreet,
		AddressStreet_2:               sqltypes.ToProtoString(patient.AddressStreet2),
		AddressCity:                   &patient.AddressCity,
		AddressState:                  &patient.AddressState,
		AddressZipcode:                &patient.AddressZipcode,
		AddressNotes:                  sqltypes.ToProtoString(patient.AddressNotes),
		CreatedAt:                     proto.String(createdAt),
		UpdatedAt:                     proto.String(updatedAt),
		AthenaId:                      sqltypes.ToProtoString(patient.AthenaMedicalRecordNumber),
	}
}

func VisitProtoFromVisitSQL(
	visit *caremanagerdb.Visit,
) *caremanagerpb.Visit {
	createdAt := visit.CreatedAt.Format(timestampLayout)
	updatedAt := visit.UpdatedAt.Format(timestampLayout)

	statusGroup := VisitStatusGroupFromVisitStatusSQLString(visit.Status)

	visitProto := &caremanagerpb.Visit{
		Id:                       visit.ID,
		EpisodeId:                visit.EpisodeID,
		CreatedAt:                createdAt,
		UpdatedAt:                updatedAt,
		Status:                   sqltypes.ToProtoString(visit.Status),
		CarName:                  sqltypes.ToProtoString(visit.CarName),
		ProviderUserIds:          visit.ProviderUserIds,
		CreatedByUserId:          sqltypes.ToProtoInt64(visit.CreatedByUserID),
		UpdatedByUserId:          sqltypes.ToProtoInt64(visit.UpdatedByUserID),
		AddressId:                sqltypes.ToProtoInt64(visit.AddressID),
		PatientAvailabilityStart: sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityStart),
		PatientAvailabilityEnd:   sqltypes.ToProtoStringTimestamp(visit.PatientAvailabilityEnd),
		StatusGroup:              statusGroup,
		CareRequestId:            sqltypes.ToProtoInt64(visit.CareRequestID),
		TypeId:                   sqltypes.ToProtoInt64(visit.VisitTypeID),
		CarId:                    sqltypes.ToProtoInt64(visit.CarID),
		VirtualAppId:             sqltypes.ToProtoInt64(visit.VirtualAppID),
	}

	return visitProto
}

func VisitSummaryProtoFromVisitSummaryRow(row *caremanagerdb.VisitSummary) *caremanagerpb.VisitSummary {
	if row.VisitID == 0 {
		return nil
	}
	createdAt := row.CreatedAt.Format(timestampLayout)
	updatedAt := row.UpdatedAt.Format(timestampLayout)

	return &caremanagerpb.VisitSummary{
		VisitId:         row.VisitID,
		Body:            row.Body,
		CreatedAt:       createdAt,
		UpdatedAt:       updatedAt,
		CreatedByUserId: sqltypes.ToProtoInt64(row.CreatedByUserID),
		UpdatedByUserId: sqltypes.ToProtoInt64(row.UpdatedByUserID),
	}
}

func VisitListElementFromEpisodeVisitsSQLRow(
	episodeVisit *caremanagerdb.GetEpisodeVisitsRow,
	scheduleMap map[int64]*CareRequestSchedule,
) *caremanagerpb.VisitListElement {
	statusGroup := VisitStatusGroupFromVisitStatusSQLString(episodeVisit.Status)
	createdAt := episodeVisit.CreatedAt.Format(timestampLayout)
	updatedAt := episodeVisit.UpdatedAt.Format(timestampLayout)

	isSchedulingInProgress := false
	if episodeVisit.CareRequestID.Valid && episodeVisit.Status.String != careRequestStatusArchived {
		isSchedulingInProgress = !(episodeVisit.PatientAvailabilityStart.Valid && episodeVisit.PatientAvailabilityEnd.Valid)
	}

	var statusUpdatedAt *string
	if episodeVisit.StatusUpdatedAt.Valid {
		formattedStatusUpdatedAt := episodeVisit.StatusUpdatedAt.Time.UTC().Format(timestampLayout)
		statusUpdatedAt = &formattedStatusUpdatedAt
	}

	var eta *string
	careRequestID := sqltypes.ToProtoInt64(episodeVisit.CareRequestID)
	if scheduleMap != nil && careRequestID != nil && scheduleMap[*careRequestID] != nil && scheduleMap[*careRequestID].EstimatedTimeOfArrival != nil {
		etaTimestamp := scheduleMap[episodeVisit.CareRequestID.Int64].EstimatedTimeOfArrival
		unformattedETA := time.Unix(*etaTimestamp, 0)
		formattedETA := unformattedETA.UTC().Format(timestampLayout)
		eta = &formattedETA
	}

	return &caremanagerpb.VisitListElement{
		Id:                    episodeVisit.ID,
		EpisodeId:             episodeVisit.EpisodeID,
		StatusGroup:           statusGroup,
		CreatedAt:             createdAt,
		UpdatedAt:             updatedAt,
		Type:                  sqltypes.ToProtoString(episodeVisit.Type),
		TypeId:                sqltypes.ToProtoInt64(episodeVisit.TypeID),
		Status:                sqltypes.ToProtoString(episodeVisit.Status),
		Summary:               sqltypes.ToProtoString(episodeVisit.Summary),
		CarName:               sqltypes.ToProtoString(episodeVisit.CarName),
		ProviderUserIds:       episodeVisit.ProviderUserIds,
		CareRequestId:         careRequestID,
		CreatedByUserId:       sqltypes.ToProtoInt64(episodeVisit.CreatedByUserID),
		IsSchedulingInProcess: isSchedulingInProgress,
		StatusUpdatedAt:       statusUpdatedAt,
		Eta:                   eta,
	}
}

func VisitStatusGroupFromVisitStatusSQLString(visitStatus sql.NullString) caremanagerpb.VisitStatusGroup {
	if !visitStatus.Valid {
		return caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST
	}

	if slices.Contains(visitStatusGroupStatusesActive, visitStatus.String) {
		return caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE
	}

	if slices.Contains(visitStatusGroupStatusesUpcoming, visitStatus.String) {
		return caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING
	}

	if slices.Contains(visitStatusGroupStatusesPast, visitStatus.String) {
		return caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST
	}

	return caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST
}

func CreateVisitSQLParamsFromCreateCallVisitRequest(req *caremanagerpb.CreateCallVisitRequest, userID int64) caremanagerdb.CreateVisitParams {
	return caremanagerdb.CreateVisitParams{
		EpisodeID:       req.EpisodeId,
		VisitTypeID:     sqltypes.ToNullInt64(&req.VisitTypeId),
		CreatedByUserID: sqltypes.ToNullInt64(&userID),
	}
}

func CreateVisitSummarySQLParamsFromCreateVisitRequest(req *caremanagerpb.CreateCallVisitRequest, visitID int64, userID int64) caremanagerdb.CreateVisitSummaryParams {
	return caremanagerdb.CreateVisitSummaryParams{
		VisitID:         visitID,
		Body:            req.Summary,
		CreatedByUserID: sqltypes.ToNullInt64(&userID),
	}
}

func CreateVisitSummarySQLParamsFromCreateVisitSummaryProtoRequest(
	req *caremanagerpb.CreateVisitSummaryRequest,
	createdByUserID int64,
) *caremanagerdb.CreateVisitSummaryParams {
	return &caremanagerdb.CreateVisitSummaryParams{
		VisitID:         req.VisitId,
		Body:            req.Body,
		CreatedByUserID: sqltypes.ToNullInt64(&createdByUserID),
	}
}

func UpdateVisitSummarySQLParamsFromUpdateVisitSummaryProtoRequest(
	req *caremanagerpb.UpdateVisitSummaryRequest,
	updatedByUserID int64,
) (*caremanagerdb.UpdateVisitSummaryParams, error) {
	if req.Body == "" {
		return nil, status.Error(codes.InvalidArgument, "new visit summary body cannot be empty")
	}

	return &caremanagerdb.UpdateVisitSummaryParams{
		Body:            sqltypes.ToNullString(&req.Body),
		UpdatedByUserID: sqltypes.ToNullInt64(&updatedByUserID),
		VisitID:         req.VisitId,
	}, nil
}

func UpdateVisitStatusAndProvidersSQLParamsFromUpdateVisitStatusProtoRequest(
	req *caremanagerpb.UpdateVisitStatusRequest,
	providerUserIDs []int64,
	updatedByUserID *int64,
) (*caremanagerdb.UpdateVisitStatusAndProvidersParams, error) {
	if req.VisitId == 0 {
		return nil, status.Error(codes.InvalidArgument, "visit id cannot be empty")
	}

	if req.Status == caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_UNSPECIFIED {
		return nil, status.Error(codes.InvalidArgument, "visit status cannot be empty or unspecified")
	}

	statusString, ok := updateVisitStatusOptionStrings[req.Status]
	if !ok {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("visit status %s does not exist", req.Status))
	}

	return &caremanagerdb.UpdateVisitStatusAndProvidersParams{
		ID:              req.VisitId,
		Status:          sql.NullString{String: statusString, Valid: true},
		ProviderUserIds: providerUserIDs,
		UpdatedByUserID: sqltypes.ToNullInt64(updatedByUserID),
	}, nil
}

func UpdateVisitSQLParamsFromUpdateVisitRequest(req *caremanagerpb.UpdateVisitRequest, userID int64) caremanagerdb.UpdateVisitParams {
	return caremanagerdb.UpdateVisitParams{
		ID:              req.VisitId,
		VisitTypeID:     sqltypes.ToNullInt64(req.VisitTypeId),
		UpdatedByUserID: sqltypes.ToNullInt64(&userID),
	}
}

func VisitTypeFromVisitTypeSQLRow(
	visitTypeRow *caremanagerdb.VisitType,
) *caremanagerpb.VisitType {
	return &caremanagerpb.VisitType{
		Id:         visitTypeRow.ID,
		Name:       visitTypeRow.Name,
		IsCallType: visitTypeRow.IsCallType,
	}
}

func GetInsuranceWithHighestPriority(insurances []*caremanagerdb.Insurance) *caremanagerdb.Insurance {
	var insurance *caremanagerdb.Insurance
	for _, i := range insurances {
		if i.Priority == 1 {
			insurance = i
			break
		} else if insurance == nil || i.Priority < insurance.Priority {
			insurance = i
		}
	}
	return insurance
}

func CreateInsuranceSQLParamsFromCreateInsuranceRequestProto(req *caremanagerpb.CreateInsuranceRequest, priority int32) caremanagerdb.CreateInsuranceParams {
	return caremanagerdb.CreateInsuranceParams{
		Name:      req.Name,
		PatientID: req.PatientId,
		MemberID:  sqltypes.ToNullString(req.MemberId),
		Priority:  priority,
	}
}

func UpdateInsuranceSQLParamsFromUpdateInsuranceRequest(req *caremanagerpb.UpdateInsuranceRequest) (*caremanagerdb.UpdateInsuranceParams, error) {
	if req.Name != nil && *req.Name == "" {
		return nil, status.Errorf(codes.InvalidArgument, nameCannotBeEmpty)
	}

	return &caremanagerdb.UpdateInsuranceParams{
		ID:       req.InsuranceId,
		MemberID: sqltypes.ToNullString(req.MemberId),
		Name:     sqltypes.ToNullString(req.Name),
	}, nil
}

func CreateExternalCareProviderSQLParamsFromCreateExternalCareProviderRequestProto(
	req *caremanagerpb.CreateExternalCareProviderRequest,
) (*caremanagerdb.CreateExternalCareProviderParams, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, nameCannotBeEmpty)
	}
	return &caremanagerdb.CreateExternalCareProviderParams{
		Name:           req.Name,
		PhoneNumber:    sqltypes.ToNullString(req.PhoneNumber),
		FaxNumber:      sqltypes.ToNullString(req.FaxNumber),
		Address:        sqltypes.ToNullString(req.Address),
		PatientID:      req.PatientId,
		ProviderTypeID: req.ProviderTypeId,
	}, nil
}

func UpdateExternalCareProviderSQLParamsFromUpdateExternalCareProviderRequestProto(req *caremanagerpb.UpdateExternalCareProviderRequest) (*caremanagerdb.UpdateExternalCareProviderParams, error) {
	if req.Name != nil && *req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, nameCannotBeEmpty)
	}
	return &caremanagerdb.UpdateExternalCareProviderParams{
		ID:             req.ExternalCareProviderId,
		Name:           sqltypes.ToNullString(req.Name),
		PhoneNumber:    sqltypes.ToNullString(req.PhoneNumber),
		FaxNumber:      sqltypes.ToNullString(req.FaxNumber),
		Address:        sqltypes.ToNullString(req.Address),
		ProviderTypeID: sqltypes.ToNullInt64(req.ProviderTypeId),
	}, nil
}

func CreatePharmacySQLParamsFromCreatePharmacyRequestProto(req *caremanagerpb.CreatePharmacyRequest) (*caremanagerdb.CreatePharmacyParams, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, nameCannotBeEmpty)
	}
	return &caremanagerdb.CreatePharmacyParams{
		Name:        req.Name,
		PhoneNumber: sqltypes.ToNullString(req.PhoneNumber),
		FaxNumber:   sqltypes.ToNullString(req.FaxNumber),
		Address:     sqltypes.ToNullString(req.Address),
		PatientID:   req.PatientId,
	}, nil
}

func UpdatePharmacySQLParamsFromUpdatePharmacyRequestProto(req *caremanagerpb.UpdatePharmacyRequest) (*caremanagerdb.UpdatePharmacyParams, error) {
	if req.Name != nil && *req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, nameCannotBeEmpty)
	}
	return &caremanagerdb.UpdatePharmacyParams{
		ID:          req.PharmacyId,
		Name:        sqltypes.ToNullString(req.Name),
		PhoneNumber: sqltypes.ToNullString(req.PhoneNumber),
		FaxNumber:   sqltypes.ToNullString(req.FaxNumber),
		Address:     sqltypes.ToNullString(req.Address),
	}, nil
}

func CreateMedicalDecisionMakerSQLParamsFromCreateMedicalDecisionMakerRequestProto(req *caremanagerpb.CreateMedicalDecisionMakerRequest) (*caremanagerdb.CreateMedicalDecisionMakerParams, error) {
	if req.FirstName == "" {
		return nil, status.Error(codes.InvalidArgument, "first_name cannot be empty")
	}

	if req.LastName == "" {
		return nil, status.Error(codes.InvalidArgument, "last_name cannot be empty")
	}

	return &caremanagerdb.CreateMedicalDecisionMakerParams{
		PatientID:    req.PatientId,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PhoneNumber:  sqltypes.ToNullString(req.PhoneNumber),
		Relationship: sqltypes.ToNullString(req.Relationship),
		Address:      sqltypes.ToNullString(req.Address),
	}, nil
}

func UpdateMedicalDecisionMakerSQLParamsFromUpdateMedicalDecisionMakerRequestProto(req *caremanagerpb.UpdateMedicalDecisionMakerRequest) (*caremanagerdb.UpdateMedicalDecisionMakerParams, error) {
	if req.FirstName != nil && *req.FirstName == "" {
		return nil, status.Error(codes.InvalidArgument, "first_name cannot be empty")
	}

	if req.LastName != nil && *req.LastName == "" {
		return nil, status.Error(codes.InvalidArgument, "last_name cannot be empty")
	}

	return &caremanagerdb.UpdateMedicalDecisionMakerParams{
		ID:           req.MedicalDecisionMakerId,
		FirstName:    sqltypes.ToNullString(req.FirstName),
		LastName:     sqltypes.ToNullString(req.LastName),
		PhoneNumber:  sqltypes.ToNullString(req.PhoneNumber),
		Relationship: sqltypes.ToNullString(req.Relationship),
		Address:      sqltypes.ToNullString(req.Address),
	}, nil
}

func UpdateVisitSQLParamsFromUpdateCallVisitRequest(req *caremanagerpb.UpdateCallVisitRequest, userID *int64) caremanagerdb.UpdateVisitParams {
	return caremanagerdb.UpdateVisitParams{
		ID:              req.VisitId,
		VisitTypeID:     sqltypes.ToNullInt64(req.VisitTypeId),
		UpdatedByUserID: sqltypes.ToNullInt64(userID),
	}
}

func UpdateVisitSummarySQLParamsFromUpdateCallVisitRequest(req *caremanagerpb.UpdateCallVisitRequest, userID *int64) (*caremanagerdb.UpdateVisitSummaryParams, error) {
	if req.Summary != nil && *req.Summary == "" {
		return nil, status.Error(codes.InvalidArgument, "summary cannot be empty")
	}

	return &caremanagerdb.UpdateVisitSummaryParams{
		VisitID:         req.VisitId,
		Body:            sqltypes.ToNullString(req.Summary),
		UpdatedByUserID: sqltypes.ToNullInt64(userID),
	}, nil
}

type CreateVisitSegmentEvent struct {
	EpisodeID     int64 `json:"episode_id"`
	CareRequestID int64 `json:"careRequest_id"`
	MarketID      int64 `json:"market_id"`
	ServiceLineID int64 `json:"service_line_id"`
	CarePhaseID   int64 `json:"care_phase_id"`
}

func CreateVisitSegmentEventFromCreateVisitProtoRequest(
	visit *caremanagerpb.Visit,
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) CreateVisitSegmentEvent {
	return CreateVisitSegmentEvent{
		EpisodeID:     visit.EpisodeId,
		CareRequestID: *visit.CareRequestId,
		MarketID:      req.MarketId,
		ServiceLineID: req.ServiceLineId,
		CarePhaseID:   carePhasePendingID,
	}
}

func TimeWindowFromTimeInterval(startTime, endTime time.Time) *commonpb.TimeWindow {
	return &commonpb.TimeWindow{
		StartDatetime: protoconv.TimeToProtoDateTime(&startTime),
		EndDatetime:   protoconv.TimeToProtoDateTime(&endTime),
	}
}

func GetUsersSearchUsersRequestFromCareManagerSearchUsersRequest(
	req *caremanagerpb.SearchUsersRequest,
) userpb.SearchUsersRequest {
	page := int64(defaultPage)
	pageSize := int64(defaultPageSize)

	if req.GetPage() > 0 {
		page = *req.Page
	}

	if req.GetPageSize() > 0 {
		pageSize = *req.PageSize
	}

	return userpb.SearchUsersRequest{
		SearchTerm: req.SearchTerm,
		Page:       &page,
		PageSize:   &pageSize,
	}
}

func ServiceRequestStatusProtoFromServiceRequestStatusSQL(serviceRequest *caremanagerdb.ServiceRequestStatus) *caremanagerpb.ServiceRequestStatus {
	return &caremanagerpb.ServiceRequestStatus{
		Id:       serviceRequest.ID,
		Name:     serviceRequest.Name,
		Slug:     serviceRequest.Slug,
		IsActive: serviceRequest.IsActive,
	}
}

func UpdateServiceRequestSQLParamsFromUpdateServiceRequestProto(
	req *caremanagerpb.UpdateServiceRequestRequest,
	userID int64,
) caremanagerdb.UpdateServiceRequestParams {
	return caremanagerdb.UpdateServiceRequestParams{
		ID:                  req.ServiceRequestId,
		StatusID:            sqltypes.ToNullInt64(req.StatusId),
		IsInsuranceVerified: sqltypes.ToNullBool(req.IsInsuranceVerified),
		CmsNumber:           sqltypes.ToNullString(req.CmsNumber),
		AssignedToUserID:    sqltypes.ToNullInt64(req.AssignedUserId),
		LastUpdatedByUserID: sqltypes.ToNullInt64(&userID),
	}
}

func RejectServiceRequestSQLParamsFromRejectServiceRequestProto(
	req *caremanagerpb.RejectServiceRequestRequest,
	userID int64,
	rejectStatusID int64,
) caremanagerdb.UpdateServiceRequestParams {
	now := time.Now().Format(timestampLayout)

	return caremanagerdb.UpdateServiceRequestParams{
		ID:                  req.ServiceRequestId,
		StatusID:            sqltypes.ToNullInt64(&rejectStatusID),
		LastUpdatedByUserID: sqltypes.ToNullInt64(&userID),
		RejectReason:        sqltypes.ToNullString(&req.RejectReason),
		RejectedAt:          sqltypes.StringToNullTime(&now),
	}
}

func ServiceRequestProtoFromServiceRequestSQL(serviceRequest *caremanagerdb.ServiceRequest) caremanagerpb.ServiceRequest {
	createdAt := serviceRequest.CreatedAt.Format(timestampLayout)
	updatedAt := serviceRequest.UpdatedAt.Format(timestampLayout)

	return caremanagerpb.ServiceRequest{
		Id:                  serviceRequest.ID,
		CreatedAt:           createdAt,
		UpdatedAt:           updatedAt,
		MarketId:            serviceRequest.MarketID,
		StatusId:            serviceRequest.StatusID,
		IsInsuranceVerified: serviceRequest.IsInsuranceVerified,
		CmsNumber:           sqltypes.ToProtoString(serviceRequest.CmsNumber),
		AssignedUserId:      sqltypes.ToProtoInt64(serviceRequest.AssignedToUserID),
		UpdatedByUserId:     sqltypes.ToProtoInt64(serviceRequest.LastUpdatedByUserID),
		RejectReason:        sqltypes.ToProtoString(serviceRequest.RejectReason),
	}
}

func GetVisitRequestFromServiceRequestSQL(
	serviceRequest *caremanagerdb.ServiceRequest,
) *episodepb.GetVisitRequest {
	return &episodepb.GetVisitRequest{
		CareRequestId:              serviceRequest.CareRequestID,
		IncludePatient:             proto.Bool(true),
		IncludeShiftTeam:           proto.Bool(true),
		IncludeSecondaryScreening:  proto.Bool(true),
		IncludeCaller:              proto.Bool(true),
		IncludeInsurance:           proto.Bool(true),
		IncludeVisitsInLast_90Days: proto.Bool(true),
	}
}

func StationCareRequestFromStationVisitResponse(
	visitResponse *episodepb.GetVisitResponse,
) *caremanagerpb.StationCareRequest {
	stationCareRequest := &caremanagerpb.StationCareRequest{}

	if visitResponse == nil || visitResponse.CareRequest == nil {
		return stationCareRequest
	}

	careRequest := visitResponse.CareRequest

	stationCareRequest.Id = careRequest.Id
	stationCareRequest.ChiefComplaint = *careRequest.ChiefComplaint

	if shiftTeam := careRequest.ShiftTeam; shiftTeam != nil {
		stationCareRequest.ProviderUserIds = shiftTeam.MemberIds
		if baseLocation := shiftTeam.BaseLocation; baseLocation != nil {
			stationCareRequest.CarName = &baseLocation.Name
		}
	}

	if secondaryScreen := careRequest.SecondaryScreening; secondaryScreen != nil {
		stationCareRequest.SecondaryScreeningProviderId = &secondaryScreen.ProviderId
		stationCareRequest.SecondaryScreeningNote = &secondaryScreen.Note
	}

	if caller := careRequest.Caller; caller != nil {
		stationCareRequest.RequesterName = &caller.FirstName
		stationCareRequest.RequesterOrganizationName = &caller.OrganizationName
		stationCareRequest.RequesterPhoneNumber = &caller.OriginPhone
		stationCareRequest.RequesterType = &caller.RelationshipToPatient
	}

	return stationCareRequest
}

func StationPatientFromStationVisitResponse(
	visitResponse *episodepb.GetVisitResponse,
) *caremanagerpb.StationPatient {
	stationPatient := &caremanagerpb.StationPatient{}

	if visitResponse == nil || visitResponse.CareRequest == nil || visitResponse.CareRequest.Patient == nil {
		return stationPatient
	}

	patient := visitResponse.CareRequest.Patient

	patientID, _ := strconv.Atoi(*patient.Id)
	stationPatient.Id = int64(patientID)

	if patientName := patient.Name; patientName != nil {
		stationPatient.FirstName = patientName.GivenName
		stationPatient.LastName = patientName.FamilyName
	}

	if patient.PrimaryIdentifier != nil {
		stationPatient.EhrId = patient.PrimaryIdentifier.RecordId
	}
	dateOfBirth := patient.DateOfBirth
	stationPatient.DateOfBirth = time.Date(
		int(dateOfBirth.Year),
		time.Month(dateOfBirth.Month),
		int(dateOfBirth.Day),
		0,
		0,
		0,
		0,
		time.UTC,
	).Format(dateLayout)

	sex := patient.Sex.String()
	stationPatient.Sex = &sex

	if insurance := visitResponse.CareRequest.Insurance; insurance != nil {
		stationPatient.InsurancePlanId = &insurance.Id
		stationPatient.InsuranceNetworkName = &insurance.NetworkName

		memberID := strconv.FormatInt(insurance.MemberId, 10)
		stationPatient.InsuranceMemberId = &memberID

		if insurancePlan := insurance.InsurancePlan; insurancePlan != nil {
			stationPatient.InsurancePlanName = &insurancePlan.Name
		}
	}

	if visitResponse.CareRequest.VisitsInLast_90Days != nil {
		stationPatient.VisitsInPast_90Days = int32(*visitResponse.CareRequest.VisitsInLast_90Days)
	}

	return stationPatient
}

func SearchVisitRequestFromSearchCareRequestsParams(
	searchVisitsParams SearchCareRequestsParams,
) *episodepb.SearchVisitsRequest {
	var searchTerm string

	if searchVisitsParams.SearchTerm != nil {
		searchTerm = *searchVisitsParams.SearchTerm
	}

	return &episodepb.SearchVisitsRequest{
		CareRequestIds: searchVisitsParams.CareRequestIDs,
		SearchTerm:     searchTerm,
	}
}

func StationCareRequestListElementFromCareRequest(
	careRequest *commonpb.CareRequestInfo,
) *caremanagerpb.StationCareRequestListElement {
	if careRequest == nil {
		return nil
	}

	return &caremanagerpb.StationCareRequestListElement{
		Id:             careRequest.Id,
		ChiefComplaint: *careRequest.ChiefComplaint,
	}
}

func StationPatientListElementFromCareRequest(
	careRequest *commonpb.CareRequestInfo,
) *caremanagerpb.StationPatientListElement {
	if careRequest.Patient == nil {
		return nil
	}

	var ehrID string
	if careRequest.Patient.PrimaryIdentifier != nil {
		ehrID = careRequest.Patient.PrimaryIdentifier.RecordId
	}

	var insuranceName string
	if careRequest.Insurance != nil && careRequest.Insurance.InsurancePlan != nil {
		insuranceName = careRequest.Insurance.InsurancePlan.Name
	}

	patientID, _ := strconv.ParseInt(*careRequest.Patient.Id, 10, 64)

	var dateOfBirth string
	if careRequest.Patient.DateOfBirth != nil {
		dateOfBirth = time.Date(
			int(careRequest.Patient.DateOfBirth.Year),
			time.Month(careRequest.Patient.DateOfBirth.Month),
			int(careRequest.Patient.DateOfBirth.Day),
			0,
			0,
			0,
			0,
			time.UTC,
		).Format(dateLayout)
	}

	return &caremanagerpb.StationPatientListElement{
		Id:            patientID,
		FirstName:     careRequest.Patient.Name.GivenName,
		LastName:      careRequest.Patient.Name.FamilyName,
		EhrId:         ehrID,
		InsuranceName: insuranceName,
		DateOfBirth:   dateOfBirth,
	}
}

func UserProtoFromStationUserProto(
	stationUser *userpb.User,
) *caremanagerpb.User {
	return &caremanagerpb.User{
		Id:          stationUser.Id,
		FirstName:   stationUser.FirstName,
		LastName:    stationUser.LastName,
		Email:       stationUser.Email,
		PhoneNumber: stationUser.PhoneNumber,
		JobTitle:    stationUser.JobTitle,
		AvatarUrl:   stationUser.AvatarUrl,
	}
}

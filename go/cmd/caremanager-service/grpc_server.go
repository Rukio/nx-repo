package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const maxPinnedNotes = 3

const (
	ErrPatientNotFoundMessage          = "Patient not found"
	ErrVisitNotFoundMessage            = "Visit not found"
	ErrVisitSummaryDoesNotExistMessage = "Summary doesn't exist"
	ErrVisitTypeDoesNotExistMessage    = "VisitType doesn't exist"
	ErrServiceRequestNotFoundMessage   = "ServiceRequest not found"
	ErrInvalidVisitID                  = "invalid Visit ID"
	ErrInvalidNoteID                   = "invalid Note ID"

	sqlForeignKeyConstraintError = "violates foreign key constraint"

	AllowedNumberOfInsurancesPerPatient = 3

	VisitsV1StatsigFlag = "care_manager_visits_v1_be"

	SegmentTrackCreateVisit = "cm_create_episode"
)

var CareManagerServiceLineIDsDisplayList = []int64{1, 2, 3, 4, 5, 6}

var (
	ErrAdvancedCareNotElegible = status.Error(codes.FailedPrecondition, "advanced care not elegible for this care request")
	ErrVisitScheduling         = status.Error(codes.FailedPrecondition, "cannot schedule this care request")
)

type CaremanagerGRPCServer struct {
	caremanagerpb.UnimplementedCareManagerServiceServer

	CaremanagerDB   *CaremanagerDB
	LogisticsClient *LogisticsClient
	StationClient   *StationClient
	StatsigProvider *providers.StatsigProvider
	SegmentClient   *SegmentClient
	Logger          *zap.SugaredLogger
}

func (server *CaremanagerGRPCServer) GetConfig(
	ctx context.Context,
	req *caremanagerpb.GetConfigRequest,
) (*caremanagerpb.GetConfigResponse, error) {
	carePhases, err := server.CaremanagerDB.queries.GetCarePhases(ctx)
	if err != nil {
		return nil, err
	}
	carePhasesResponse := []*caremanagerpb.CarePhase{}
	for _, cp := range carePhases {
		carePhasesResponse = append(carePhasesResponse, CarePhaseProtoFromCarePhaseSQL(cp))
	}

	serviceLines, err := server.CaremanagerDB.queries.GetServiceLines(ctx)
	if err != nil {
		return nil, err
	}
	serviceLinesResponse := []*caremanagerpb.ServiceLine{}
	for _, sl := range serviceLines {
		if slices.Contains(CareManagerServiceLineIDsDisplayList, sl.ID) {
			serviceLinesResponse = append(serviceLinesResponse, ServiceLineProtoFromServiceLineSQL(sl))
		}
	}

	marketsResponse, err := server.StationClient.GetAuthenticatedUserMarkets(ctx)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.GetConfigResponse{
		CarePhases:   carePhasesResponse,
		ServiceLines: serviceLinesResponse,
		Markets:      marketsResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) GetPatient(
	ctx context.Context,
	req *caremanagerpb.GetPatientRequest,
) (*caremanagerpb.GetPatientResponse, error) {
	patient, err := server.CaremanagerDB.queries.GetPatient(ctx, req.PatientId)
	if err != nil {
		return nil, err
	}

	relatedEntities, err := server.getPatientRelatedEntities(ctx, getPatientRelatedEntitiesParams{patientID: req.PatientId})
	if err != nil {
		return nil, err
	}
	medicalDecisionMakerProtos := make([]*caremanagerpb.MedicalDecisionMaker, len(relatedEntities.medicalDecisionMakers))
	for i, mdm := range relatedEntities.medicalDecisionMakers {
		medicalDecisionMakerProtos[i] = MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(mdm)
	}
	insuranceProtos := make([]*caremanagerpb.Insurance, len(relatedEntities.insurances))
	for i, insurance := range relatedEntities.insurances {
		insuranceProtos[i] = InsuranceProtoFromInsuranceSQL(insurance)
	}
	pharmacyProtos := make([]*caremanagerpb.Pharmacy, len(relatedEntities.pharmacies))
	for i, pharmacy := range relatedEntities.pharmacies {
		pharmacyProtos[i] = PharmacyProtoFromPharmacySQL(pharmacy)
	}
	externalCareProviderProtos := make([]*caremanagerpb.ExternalCareProvider, len(relatedEntities.externalCareProviders))
	for i, ecp := range relatedEntities.externalCareProviders {
		externalCareProviderProtos[i] = ExternalCareProviderProtoFromExternalCareProviderSQL(ecp)
	}

	return &caremanagerpb.GetPatientResponse{
		Patient:               PatientProtoFromPatientSQL(patient, PatientProtoFromPatientSQLParams{}),
		MedicalDecisionMakers: medicalDecisionMakerProtos,
		Insurances:            insuranceProtos,
		Pharmacies:            pharmacyProtos,
		ExternalCareProviders: externalCareProviderProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) GetPatients(
	ctx context.Context,
	req *caremanagerpb.GetPatientsRequest,
) (*caremanagerpb.GetPatientsResponse, error) {
	patientParams := GetPatientsSQLParamsFromGetPatientsProtoRequest(req)
	patients, err := server.CaremanagerDB.queries.GetPatients(ctx, *patientParams)
	if err != nil {
		return nil, err
	}

	var totalPatientsCount int64
	if len(patients) > 0 {
		totalPatientsCount = patients[0].Count
	} else {
		totalPatientsCount = 0
	}

	patientsIDs := make([]int64, len(patients))
	for i, patient := range patients {
		patientsIDs[i] = patient.ID
	}

	medicalDecisionMakersMap, err := server.getMedicalDecisionMakersByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	insurancesMap, err := server.getInsurancesByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	pharmaciesMap, err := server.getPharmaciesByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	externalCareProvidersMap, err := server.getExternalCareProvidersByPatientIDAndTypeNameMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}

	var patientProtoSlice []*caremanagerpb.Patient
	for _, patient := range patients {
		patientProtoSlice = append(patientProtoSlice, PatientProtoFromGetPatientSQLRow(patient, PatientProtoFromGetPatientSQLRowParams{
			medicalDecisionMaker: medicalDecisionMakersMap[patient.ID],
			insurance:            insurancesMap[patient.ID],
			pharmacy:             pharmaciesMap[patient.ID],
			externalDoctor:       externalCareProvidersMap[patient.ID]["Doctor"],
			externalReferrer:     externalCareProvidersMap[patient.ID]["Referrer"],
		}))
	}

	metaResponse := GetPageInfo(totalPatientsCount, patientParams.PageSize, patientParams.PageOffset)

	return &caremanagerpb.GetPatientsResponse{Patients: patientProtoSlice, Meta: metaResponse}, nil
}

func (server *CaremanagerGRPCServer) GetTaskTemplates(
	ctx context.Context,
	req *caremanagerpb.GetTaskTemplatesRequest,
) (*caremanagerpb.GetTaskTemplatesResponse, error) {
	getTaskTemplatesParams := GetTaskTemplatesSQLParamsFromGetTaskTemplateRequest(req)
	taskTemplates, err := server.CaremanagerDB.queries.GetTaskTemplates(ctx, *getTaskTemplatesParams)
	if err != nil {
		return nil, err
	}

	var totalTaskTemplatesCount int64
	if len(taskTemplates) > 0 {
		totalTaskTemplatesCount = taskTemplates[0].Count
	} else {
		totalTaskTemplatesCount = 0
	}

	var (
		carePhaseIds []int64
	)
	for _, taskTemplate := range taskTemplates {
		if taskTemplate.CarePhaseID.Valid {
			carePhaseIds = append(carePhaseIds, taskTemplate.CarePhaseID.Int64)
		}
	}

	carePhasesMap, err := server.getCarePhasesMap(ctx, carePhaseIds)
	if err != nil {
		return nil, err
	}

	var taskTemplatesSlice []*caremanagerpb.TaskTemplate
	for _, taskTemplate := range taskTemplates {
		var carePhase *caremanagerdb.CarePhase
		if taskTemplate.CarePhaseID.Valid {
			carePhase = carePhasesMap[taskTemplate.CarePhaseID.Int64]
		}
		taskTemplatesSlice = append(
			taskTemplatesSlice,
			TaskTemplateProtoFromGetTaskTemplateSQLRow(
				taskTemplate,
				carePhase,
			),
		)
	}

	metaResponse := GetPageInfo(totalTaskTemplatesCount, getTaskTemplatesParams.PageSize, getTaskTemplatesParams.PageOffset)

	return &caremanagerpb.GetTaskTemplatesResponse{TaskTemplates: taskTemplatesSlice, Meta: metaResponse}, nil
}

func (server *CaremanagerGRPCServer) CreateEpisode(
	ctx context.Context,
	req *caremanagerpb.CreateEpisodeRequest,
) (*caremanagerpb.CreateEpisodeResponse, error) {
	isVisitCreationEnabled := server.StatsigProvider.Bool(VisitsV1StatsigFlag, false)
	market, err := server.StationClient.GetMarket(ctx, req.MarketId)
	if err != nil {
		return nil, err
	}
	relatedEntities, err := server.getEpisodeRelatedEntities(ctx, &GetEpisodeRelatedEntitiesParams{
		PatientID:        req.PatientId,
		CarePhaseID:      req.CarePhaseId,
		TaskTemplatesIDs: req.ApplyTemplateIds,
	})
	if err != nil {
		return nil, err
	}

	newEpisodeParams, err := CreateEpisodeSQLParamsFromCreateEpisodeProtoRequest(req)
	if err != nil {
		return nil, err
	}

	if isVisitCreationEnabled {
		// TODO(CO-1444): when removing the feature flag, move the following line to the
		// CreateEpisodeSQLParamsFromCreateEpisodeProtoRequest converter and change the proto accordingly.
		newEpisodeParams.PatientSummary = defaultSummary
	}
	newEpisode, err := server.CaremanagerDB.queries.CreateEpisode(
		ctx,
		*newEpisodeParams,
	)
	if err != nil {
		return nil, err
	}

	if req.ApplyTemplateIds != nil {
		templatesIDSToApply := req.ApplyTemplateIds
		err := server.applyTaskTemplatesToEpisode(ctx, templatesIDSToApply, newEpisode.ID)
		if err != nil {
			return nil, err
		}
	}
	tasks, err := server.CaremanagerDB.queries.GetTasksByEpisodeID(ctx, caremanagerdb.GetTasksByEpisodeIDParams{Ids: []int64{newEpisode.ID}})
	if err != nil {
		return nil, err
	}

	taskTypes, err := server.CaremanagerDB.queries.GetAllTaskTypes(ctx)
	if err != nil {
		return nil, err
	}
	newEpisodeResponse := EpisodeProtoFromEpisodeSQL(newEpisode, EpisodeProtoFromEpisodeSQLParams{
		patient:       relatedEntities.patient,
		carePhases:    relatedEntities.carePhases,
		market:        market,
		tasks:         tasks,
		taskTypes:     taskTypes,
		taskTemplates: relatedEntities.taskTemplates,
	})
	return &caremanagerpb.CreateEpisodeResponse{
		Episode: newEpisodeResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) GetEpisodes(
	ctx context.Context,
	req *caremanagerpb.GetEpisodesRequest,
) (*caremanagerpb.GetEpisodesResponse, error) {
	marketIDsToFilter, err := server.getMarketIDsForAuthenticatedUser(ctx, req.MarketId)
	if err != nil {
		return nil, err
	}

	episodesParams := GetEpisodesSQLParamsFromGetEpisodesProtoRequest(req, marketIDsToFilter)

	episodeRows, err := server.CaremanagerDB.queries.GetEpisodes(ctx, *episodesParams)
	if err != nil {
		return nil, err
	}

	var totalEpisodesNumber int64
	if len(episodeRows) > 0 {
		totalEpisodesNumber = episodeRows[0].Count
	} else {
		totalEpisodesNumber = 0
	}

	var (
		episodeIDs          []int64
		episodePatientIDs   []int64
		episodeCarePhaseIds []int64
	)
	for _, episode := range episodeRows {
		episodeIDs = append(episodeIDs, episode.ID)
		episodePatientIDs = append(episodePatientIDs, episode.PatientID)
		episodeCarePhaseIds = append(episodeCarePhaseIds, episode.CarePhaseID)
	}

	patientsMap, err := server.getPatientsMap(ctx, episodePatientIDs)
	if err != nil {
		return nil, err
	}
	carePhasesMap, err := server.getCarePhasesMap(ctx, episodeCarePhaseIds)
	if err != nil {
		return nil, err
	}
	tasksByEpisodeMap, err := server.getTasksByEpisodeMap(ctx, getTasksByEpisodeFilters{episodeIDs: episodeIDs, areTasksCompleted: proto.Bool(false)})
	if err != nil {
		return nil, err
	}
	notes, err := server.CaremanagerDB.queries.GetMostRelevantNotePerEpisodeID(ctx, episodeIDs)
	if err != nil {
		return nil, err
	}
	mostRelevantNoteByEpisodeMap := map[int64]*caremanagerdb.Note{}
	for _, n := range notes {
		mostRelevantNoteByEpisodeMap[n.EpisodeID.Int64] = n
	}

	var episodeProtoSlice []*caremanagerpb.Episode
	for _, episode := range episodeRows {
		episodeProtoSlice = append(
			episodeProtoSlice,
			EpisodeProtoFromEpisodeRowSQL(
				episode,
				&EpisodeProtoFromEpisodeRowSQLParams{
					patient:          patientsMap[episode.PatientID],
					carePhase:        carePhasesMap[episode.CarePhaseID],
					tasks:            tasksByEpisodeMap[episode.ID],
					mostRelevantNote: mostRelevantNoteByEpisodeMap[episode.ID],
				},
			),
		)
	}

	metaResponse := GetPageInfo(totalEpisodesNumber, episodesParams.PageSize, episodesParams.PageOffset)

	return &caremanagerpb.GetEpisodesResponse{
		Episodes: episodeProtoSlice,
		Meta:     metaResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) applyTaskTemplatesToEpisode(ctx context.Context, templateIDs []int64, episodeID int64) error {
	for _, templateID := range templateIDs {
		_, err := server.CaremanagerDB.queries.CreateEpisodeTaskTemplate(
			ctx,
			caremanagerdb.CreateEpisodeTaskTemplateParams{
				EpisodeID:      episodeID,
				TaskTemplateID: templateID,
			},
		)
		if err != nil {
			return err
		}

		err = server.createTasksFromTemplate(ctx, templateID, episodeID)
		if err != nil {
			return err
		}
	}

	return nil
}

func (server *CaremanagerGRPCServer) getMissingTemplatesToApply(ctx context.Context, episodeID int64, templatesToApply []int64) ([]int64, error) {
	appliedTaskTemplates, err := server.CaremanagerDB.queries.GetEpisodeTaskTemplatesIDs(ctx, episodeID)
	if err != nil {
		return nil, err
	}

	var missingTemplateIDs []int64
	m := make(map[int64]bool)
	for _, template := range appliedTaskTemplates {
		m[template] = true
	}
	for _, template := range templatesToApply {
		if _, ok := m[template]; !ok {
			missingTemplateIDs = append(missingTemplateIDs, template)
		}
	}

	return missingTemplateIDs, nil
}

func (server *CaremanagerGRPCServer) createTasksFromTemplate(ctx context.Context, templateID, episodeID int64) error {
	tasks, err := server.CaremanagerDB.queries.GetTasksForTemplates(ctx, templateID)
	if err != nil {
		return err
	}
	if len(tasks) == 0 {
		return nil
	}

	var descriptions []string
	var areTasksCompleted []bool
	var episodeIDs []int64
	var taskTypeIDs []int64
	for _, task := range tasks {
		descriptions = append(descriptions, task.Body)
		areTasksCompleted = append(areTasksCompleted, false)
		episodeIDs = append(episodeIDs, episodeID)
		taskTypeIDs = append(taskTypeIDs, task.TypeID)
	}

	_, err = server.CaremanagerDB.queries.CreateTasks(ctx, caremanagerdb.CreateTasksParams{
		Descriptions:      descriptions,
		AreTasksCompleted: areTasksCompleted,
		EpisodeIds:        episodeIDs,
		TaskTypeIds:       taskTypeIDs,
	})

	if err != nil {
		return err
	}

	return nil
}

func (server *CaremanagerGRPCServer) GetEpisode(
	ctx context.Context,
	req *caremanagerpb.GetEpisodeRequest,
) (*caremanagerpb.GetEpisodeResponse, error) {
	episode, err := server.CaremanagerDB.queries.GetEpisode(
		ctx,
		req.EpisodeId,
	)
	if err != nil {
		return nil, err
	}

	market, err := server.StationClient.GetMarket(ctx, episode.MarketID)
	if err != nil {
		return nil, err
	}
	relatedEntities, err := server.getEpisodeRelatedEntities(ctx, &GetEpisodeRelatedEntitiesParams{
		EpisodeID:   episode.ID,
		PatientID:   episode.PatientID,
		CarePhaseID: episode.CarePhaseID,
	})
	if err != nil {
		return nil, err
	}
	taskTypes, err := server.CaremanagerDB.queries.GetAllTaskTypes(ctx)
	if err != nil {
		return nil, err
	}
	patientRelatedEntities, err := server.getPatientRelatedEntities(ctx, getPatientRelatedEntitiesParams{
		patientID:               episode.PatientID,
		withLegacyCareProviders: true,
	})
	if err != nil {
		return nil, err
	}

	episodeResponse := EpisodeProtoFromEpisodeSQL(episode, EpisodeProtoFromEpisodeSQLParams{
		patient:               relatedEntities.patient,
		carePhases:            relatedEntities.carePhases,
		market:                market,
		tasks:                 relatedEntities.tasks,
		taskTypes:             taskTypes,
		notes:                 relatedEntities.notes,
		taskTemplates:         relatedEntities.taskTemplates,
		medicalDecisionMakers: patientRelatedEntities.medicalDecisionMakers,
		insurances:            patientRelatedEntities.insurances,
		pharmacies:            patientRelatedEntities.pharmacies,
		externalDoctor:        patientRelatedEntities.externalDoctor,
		externalReferrer:      patientRelatedEntities.externalReferrer,
	})

	return &caremanagerpb.GetEpisodeResponse{
		Episode: episodeResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateEpisode(
	ctx context.Context,
	req *caremanagerpb.UpdateEpisodeRequest,
) (*caremanagerpb.UpdateEpisodeResponse, error) {
	var (
		marketID    = req.MarketId
		carePhaseID = req.CarePhaseId
	)

	episode, err := server.CaremanagerDB.queries.GetEpisode(ctx, req.EpisodeId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "no Episode was found")
		}
		return nil, err
	}

	if marketID == nil {
		marketID = &episode.MarketID
	}
	if carePhaseID == nil {
		carePhaseID = &episode.CarePhaseID
	}
	if req.ApplyTemplateIds != nil {
		missingTemplateIDs, err := server.getMissingTemplatesToApply(ctx, episode.ID, req.ApplyTemplateIds)
		if err != nil {
			return nil, err
		}
		err = server.applyTaskTemplatesToEpisode(ctx, missingTemplateIDs, episode.ID)
		if err != nil {
			return nil, err
		}
	}

	market, err := server.StationClient.GetMarket(ctx, *marketID)
	if err != nil {
		return nil, err
	}
	relatedEntities, err := server.getEpisodeRelatedEntities(ctx, &GetEpisodeRelatedEntitiesParams{
		EpisodeID:   episode.ID,
		PatientID:   episode.PatientID,
		CarePhaseID: *carePhaseID,
	})
	if err != nil {
		return nil, err
	}
	patientRelatedEntities, err := server.getPatientRelatedEntities(ctx, getPatientRelatedEntitiesParams{
		patientID:               episode.PatientID,
		withLegacyCareProviders: true,
	})
	if err != nil {
		return nil, err
	}

	taskTypes, err := server.CaremanagerDB.queries.GetAllTaskTypes(ctx)
	if err != nil {
		return nil, err
	}

	isDischarged := false
	for _, cp := range relatedEntities.carePhases {
		if cp.ID == *carePhaseID {
			isDischarged = cp.Name == "Discharged" || cp.Name == "Closed"
		}
	}

	updateEpisodeParams, err := UpdateEpisodeSQLParamsFromUpdateEpisodeProtoRequest(req, isDischarged)
	if err != nil {
		return nil, err
	}
	updatedEpisode, err := server.CaremanagerDB.queries.UpdateEpisode(
		ctx,
		*updateEpisodeParams,
	)
	if err != nil {
		return nil, err
	}

	updateEpisodeResponse := EpisodeProtoFromEpisodeSQL(updatedEpisode, EpisodeProtoFromEpisodeSQLParams{
		patient:               relatedEntities.patient,
		carePhases:            relatedEntities.carePhases,
		market:                market,
		tasks:                 relatedEntities.tasks,
		taskTypes:             taskTypes,
		notes:                 relatedEntities.notes,
		taskTemplates:         relatedEntities.taskTemplates,
		medicalDecisionMakers: patientRelatedEntities.medicalDecisionMakers,
		insurances:            patientRelatedEntities.insurances,
		pharmacies:            patientRelatedEntities.pharmacies,
		externalDoctor:        patientRelatedEntities.externalDoctor,
		externalReferrer:      patientRelatedEntities.externalReferrer,
	})

	return &caremanagerpb.UpdateEpisodeResponse{
		Episode: updateEpisodeResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateEpisodeTasks(
	ctx context.Context,
	req *caremanagerpb.CreateEpisodeTasksRequest,
) (*caremanagerpb.CreateEpisodeTasksResponse, error) {
	var (
		neededTaskTypeSlugs []string
		newTasksResponse    []*caremanagerpb.Task

		taskTypesMapBySlug = map[string]*caremanagerdb.TaskType{}
		taskTypesMapByID   = map[int64]*caremanagerdb.TaskType{}
	)

	for _, taskInput := range req.Tasks {
		neededTaskTypeSlugs = append(neededTaskTypeSlugs, taskInput.TaskType)
	}
	taskTypes, err := server.CaremanagerDB.queries.GetTaskTypesBySlug(ctx, neededTaskTypeSlugs)
	if err != nil {
		return nil, err
	}
	for _, tt := range taskTypes {
		taskTypesMapBySlug[tt.Slug] = tt
		taskTypesMapByID[tt.ID] = tt
	}

	params, err := CreateTaskSQLParamsFromCreateEpisodeTasksRequest(req, taskTypesMapBySlug)
	if err != nil {
		return nil, err
	}
	newTasks, err := server.CaremanagerDB.queries.CreateTasks(ctx, *params)
	if err != nil {
		return nil, err
	}

	for _, t := range newTasks {
		taskProto := TaskProtoFromTaskSQL(t, taskTypesMapByID[t.TaskTypeID])
		newTasksResponse = append(newTasksResponse, taskProto)
	}

	return &caremanagerpb.CreateEpisodeTasksResponse{
		Tasks: newTasksResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateEpisodeNote(
	ctx context.Context,
	req *caremanagerpb.CreateEpisodeNoteRequest,
) (*caremanagerpb.CreateEpisodeNoteResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	newNoteParams, err := CreateNoteSQLParamsFromCreateEpisodeNoteProtoRequest(req, &user.Id)
	if err != nil {
		return nil, err
	}

	newNote, err := server.CaremanagerDB.queries.CreateNote(
		ctx,
		*newNoteParams,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.CreateEpisodeNoteResponse{
		Note: NoteProtoFromNoteSQL(newNote),
	}, nil
}

func (server *CaremanagerGRPCServer) CreateServiceRequestNote(
	ctx context.Context,
	req *caremanagerpb.CreateServiceRequestNoteRequest,
) (*caremanagerpb.CreateServiceRequestNoteResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	newNoteParams, err := CreateNoteSQLParamsFromCreateServiceRequestNoteProtoRequest(req, &user.Id)
	if err != nil {
		return nil, err
	}

	var newNote *caremanagerdb.Note
	err = server.CaremanagerDB.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := server.CaremanagerDB.queries.WithTx(tx)

		newNote, err = qtx.CreateNote(ctx, *newNoteParams)
		if err != nil {
			return err
		}

		_, err = qtx.CreateServiceRequestNote(ctx, caremanagerdb.CreateServiceRequestNoteParams{
			ServiceRequestID: req.ServiceRequestId,
			NoteID:           newNote.ID,
		})
		if err != nil {
			if strings.Contains(err.Error(), sqlForeignKeyConstraintError) {
				return status.Errorf(codes.InvalidArgument, "ServiceRequest id %d does not exist", req.ServiceRequestId)
			}
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.CreateServiceRequestNoteResponse{
		Note: NoteProtoFromNoteSQL(newNote),
	}, nil
}

func (server *CaremanagerGRPCServer) GetServiceRequestNotes(
	ctx context.Context,
	req *caremanagerpb.GetServiceRequestNotesRequest,
) (*caremanagerpb.GetServiceRequestNotesResponse, error) {
	notes, err := server.CaremanagerDB.queries.GetServiceRequestNotesSortedByRelevance(ctx, req.ServiceRequestId)
	if err != nil {
		return nil, err
	}

	noteProtoSlice := make([]*caremanagerpb.Note, len(notes))
	for i, note := range notes {
		noteProtoSlice[i] = NoteProtoFromNoteSQL(note)
	}

	return &caremanagerpb.GetServiceRequestNotesResponse{
		Notes: noteProtoSlice,
	}, nil
}

func (server *CaremanagerGRPCServer) CreatePatient(
	ctx context.Context,
	req *caremanagerpb.CreatePatientRequest,
) (*caremanagerpb.CreatePatientResponse, error) {
	newPatientParams, err := CreatePatientSQLParamsFromCreatePatientProtoRequest(req)
	if err != nil {
		return nil, err
	}

	newPatient, err := server.CaremanagerDB.queries.CreatePatient(
		ctx,
		*newPatientParams,
	)
	if err != nil {
		return nil, err
	}

	var medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	if req.MedicalPowerOfAttorneyDetails != nil && *req.MedicalPowerOfAttorneyDetails != "" {
		createMDMParams := CreateMedicalDecisionMakerParamsFromCreatePatientRequest(newPatient.ID, req)
		medicalDecisionMaker, err = server.CaremanagerDB.queries.CreateMedicalDecisionMaker(ctx, *createMDMParams)
		if err != nil {
			return nil, err
		}
	}
	var insurance *caremanagerdb.Insurance
	if req.Payer != nil && *req.Payer != "" {
		createInsuranceParams := CreateInsuranceParamsFromCreatePatientRequest(newPatient.ID, req)
		insurance, err = server.CaremanagerDB.queries.CreateInsurance(ctx, *createInsuranceParams)
		if err != nil {
			return nil, err
		}
	}
	var pharmacy *caremanagerdb.Pharmacy
	if req.PreferredPharmacyDetails != nil && *req.PreferredPharmacyDetails != "" {
		createPharmacyParams := CreatePharmacyParamsFromCreatePatientRequest(newPatient.ID, req)
		pharmacy, err = server.CaremanagerDB.queries.CreatePharmacy(ctx, *createPharmacyParams)
		if err != nil {
			return nil, err
		}
	}
	var externalDoctor *caremanagerdb.ExternalCareProvider
	if req.DoctorDetails != nil && *req.DoctorDetails != "" {
		externalDoctor, err = server.CaremanagerDB.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
			Name:             *req.DoctorDetails,
			ProviderTypeName: "Doctor",
			PatientID:        newPatient.ID,
		})
		if err != nil {
			return nil, err
		}
	}
	var externalReferrer *caremanagerdb.ExternalCareProvider
	if req.Referrer != nil && *req.Referrer != "" {
		externalReferrer, err = server.CaremanagerDB.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
			Name:             *req.Referrer,
			ProviderTypeName: "Referrer",
			PatientID:        newPatient.ID,
		})
		if err != nil {
			return nil, err
		}
	}

	newPatientResponse := PatientProtoFromPatientSQL(newPatient, PatientProtoFromPatientSQLParams{
		medicalDecisionMaker: medicalDecisionMaker,
		insurance:            insurance,
		pharmacy:             pharmacy,
		externalDoctor:       externalDoctor,
		externalReferrer:     externalReferrer,
	})

	return &caremanagerpb.CreatePatientResponse{
		Patient: newPatientResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateTask(
	ctx context.Context,
	req *caremanagerpb.UpdateTaskRequest,
) (*caremanagerpb.UpdateTaskResponse, error) {
	var (
		completedByUserID *int64
		user              *caremanagerpb.User
	)

	currentTask, err := server.CaremanagerDB.queries.GetTask(ctx, req.TaskId)
	if err != nil {
		return nil, err
	}

	neededTaskTypeSlugs := []string{req.TaskType}
	taskTypes, err := server.CaremanagerDB.queries.GetTaskTypesBySlug(ctx, neededTaskTypeSlugs)
	if len(taskTypes) != 1 {
		return nil, fmt.Errorf("could not find task type " + req.TaskType)
	}
	if err != nil {
		return nil, err
	}
	taskType := taskTypes[0]

	switch {
	case req.Status == legacyTaskStatusCompleted && !currentTask.IsCompleted:
		user, err = server.StationClient.GetAuthenticatedUser(ctx)
		if err != nil {
			return nil, err
		}
		completedByUserID = &user.Id
	case req.Status != legacyTaskStatusCompleted && currentTask.IsCompleted:
		completedByUserID = nil
	default:
		if !currentTask.CompletedByUserID.Valid {
			break
		}

		completedByUserID = &currentTask.CompletedByUserID.Int64
	}

	updateTaskParams, err := UpdateTaskSQLParamsFromUpdateTaskProtoRequest(req, taskType, completedByUserID)
	if err != nil {
		return nil, err
	}

	updatedTask, err := server.CaremanagerDB.queries.UpdateTask(
		ctx,
		*updateTaskParams,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UpdateTaskResponse{
		Task: TaskProtoFromTaskSQL(updatedTask, taskType),
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateNote(
	ctx context.Context,
	req *caremanagerpb.UpdateNoteRequest,
) (*caremanagerpb.UpdateNoteResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	updateNoteParams, err := UpdateNoteSQLParamsFromUpdateNoteProtoRequest(req, &user.Id)
	if err != nil {
		return nil, err
	}

	updateNote, err := server.CaremanagerDB.queries.UpdateNote(
		ctx,
		*updateNoteParams,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UpdateNoteResponse{
		Note: NoteProtoFromNoteSQL(updateNote),
	}, nil
}

func (server *CaremanagerGRPCServer) UpdatePatient(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
) (*caremanagerpb.UpdatePatientResponse, error) {
	updatePatientParams, err := UpdatePatientSQLParamsFromUpdatePatientProtoRequest(req)
	if err != nil {
		return nil, err
	}

	relatedEntities, err := server.getPatientRelatedEntities(ctx, getPatientRelatedEntitiesParams{
		patientID:               req.PatientId,
		withLegacyCareProviders: true,
	})
	if err != nil {
		return nil, err
	}

	var medicalDecisionMaker *caremanagerdb.MedicalDecisionMaker
	if len(relatedEntities.medicalDecisionMakers) > 0 {
		medicalDecisionMaker = relatedEntities.medicalDecisionMakers[0]
	}
	if req.MedicalPowerOfAttorneyDetails != nil {
		medicalDecisionMaker, err = server.upsertMedicalDecisionMakerFromUpdatePatientRequest(ctx, req, medicalDecisionMaker)
		if err != nil {
			return nil, err
		}
	}
	var insurance *caremanagerdb.Insurance
	if len(relatedEntities.insurances) > 0 {
		insurance = relatedEntities.insurances[0]
	}
	if req.Payer != nil {
		insurance, err = server.upsertInsuranceFromUpdatePatientRequest(ctx, req, insurance)
		if err != nil {
			return nil, err
		}
	}
	var pharmacy *caremanagerdb.Pharmacy
	if len(relatedEntities.pharmacies) > 0 {
		pharmacy = relatedEntities.pharmacies[0]
	}
	if req.PreferredPharmacyDetails != nil {
		pharmacy, err = server.upsertPharmacyFromUpdatePatientRequest(ctx, req, pharmacy)
		if err != nil {
			return nil, err
		}
	}
	externalDoctor := relatedEntities.externalDoctor
	if req.DoctorDetails != nil {
		externalDoctor, err = server.upsertExternalDoctorFromUpdatePatientRequest(ctx, req, externalDoctor)
		if err != nil {
			return nil, err
		}
	}
	externalReferrer := relatedEntities.externalReferrer
	if req.Referrer != nil {
		externalReferrer, err = server.upsertExternalReferrerFromUpdatePatientRequest(ctx, req, externalReferrer)
		if err != nil {
			return nil, err
		}
	}

	updatePatient, err := server.CaremanagerDB.queries.UpdatePatient(
		ctx,
		*updatePatientParams,
	)
	if err != nil {
		return nil, err
	}

	updatePatientResponse := PatientProtoFromPatientSQL(updatePatient, PatientProtoFromPatientSQLParams{
		medicalDecisionMaker: medicalDecisionMaker,
		insurance:            insurance,
		pharmacy:             pharmacy,
		externalDoctor:       externalDoctor,
		externalReferrer:     externalReferrer,
	})

	return &caremanagerpb.UpdatePatientResponse{
		Patient: updatePatientResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) upsertMedicalDecisionMakerFromUpdatePatientRequest(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
	existingMedicalDecisionMaker *caremanagerdb.MedicalDecisionMaker,
) (*caremanagerdb.MedicalDecisionMaker, error) {
	if existingMedicalDecisionMaker != nil {
		params := UpdateMedicalDecisionMakerParamsFromUpdatePatientRequest(existingMedicalDecisionMaker.ID, req)

		return server.CaremanagerDB.queries.UpdateMedicalDecisionMaker(ctx, *params)
	}

	params := CreateMedicalDecisionMakerParamsFromUpdatePatientRequest(req.PatientId, req)

	return server.CaremanagerDB.queries.CreateMedicalDecisionMaker(ctx, *params)
}

func (server *CaremanagerGRPCServer) upsertInsuranceFromUpdatePatientRequest(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
	existingInsurance *caremanagerdb.Insurance,
) (*caremanagerdb.Insurance, error) {
	if existingInsurance != nil {
		params := UpdateInsuranceParamsFromUpdatePatientRequest(existingInsurance.ID, req)

		return server.CaremanagerDB.queries.UpdateInsurance(ctx, *params)
	}

	params := CreateInsuranceParamsFromUpdatePatientRequest(req.PatientId, req)

	return server.CaremanagerDB.queries.CreateInsurance(ctx, *params)
}

func (server *CaremanagerGRPCServer) upsertPharmacyFromUpdatePatientRequest(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
	existingPharmacy *caremanagerdb.Pharmacy,
) (*caremanagerdb.Pharmacy, error) {
	if existingPharmacy != nil {
		params := UpdatePharmacyParamsFromUpdatePatientRequest(existingPharmacy.ID, req)

		return server.CaremanagerDB.queries.UpdatePharmacy(ctx, *params)
	}

	params := CreatePharmacyParamsFromUpdatePatientRequest(req.PatientId, req)

	return server.CaremanagerDB.queries.CreatePharmacy(ctx, *params)
}

func (server *CaremanagerGRPCServer) upsertExternalDoctorFromUpdatePatientRequest(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
	existingDoctor *caremanagerdb.ExternalCareProvider,
) (*caremanagerdb.ExternalCareProvider, error) {
	if existingDoctor != nil {
		return server.CaremanagerDB.queries.UpdateExternalCareProvider(ctx, caremanagerdb.UpdateExternalCareProviderParams{
			ID:   existingDoctor.ID,
			Name: sqltypes.ToNullString(req.DoctorDetails),
		})
	}

	return server.CaremanagerDB.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
		Name:             *req.DoctorDetails,
		ProviderTypeName: "Doctor",
		PatientID:        req.PatientId,
	})
}

func (server *CaremanagerGRPCServer) upsertExternalReferrerFromUpdatePatientRequest(
	ctx context.Context,
	req *caremanagerpb.UpdatePatientRequest,
	existingReferrer *caremanagerdb.ExternalCareProvider,
) (*caremanagerdb.ExternalCareProvider, error) {
	if existingReferrer != nil {
		return server.CaremanagerDB.queries.UpdateExternalCareProvider(ctx, caremanagerdb.UpdateExternalCareProviderParams{
			ID:   existingReferrer.ID,
			Name: sqltypes.ToNullString(req.Referrer),
		})
	}

	return server.CaremanagerDB.queries.CreateExternalCareProviderWithProviderTypeName(ctx, caremanagerdb.CreateExternalCareProviderWithProviderTypeNameParams{
		Name:             *req.Referrer,
		ProviderTypeName: "Referrer",
		PatientID:        req.PatientId,
	})
}

func (server *CaremanagerGRPCServer) UpdateTaskTemplate(
	ctx context.Context,
	req *caremanagerpb.UpdateTaskTemplateRequest,
) (*caremanagerpb.UpdateTaskTemplateResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	updateTaskTemplateParams, err := UpdateTaskTemplateSQLParamsFromUpdateTaskTemplateProtoRequest(req, user.Id)
	if err != nil {
		return nil, err
	}

	tasksToCreate, tasksToUpdate, tasksToDelete, err := UpdateTaskTemplateTasksSQLParamsFromUpdateTaskTemplateProtoRequest(req)
	if err != nil {
		return nil, err
	}
	for _, task := range tasksToCreate {
		_, err = server.CaremanagerDB.queries.CreateTemplateTask(ctx, *task)
		if err != nil {
			return nil, err
		}
	}
	for _, task := range tasksToUpdate {
		_, err = server.CaremanagerDB.queries.UpdateTaskTemplateTask(ctx, *task)
		if err != nil {
			return nil, err
		}
	}
	for _, task := range tasksToDelete {
		_, err = server.CaremanagerDB.queries.DeleteTaskTemplateTask(ctx, *task)
		if err != nil {
			return nil, err
		}
	}

	taskTemplate, err := server.CaremanagerDB.queries.GetTaskTemplate(ctx, req.TemplateId)
	if err != nil {
		return nil, err
	}

	var carePhaseID *int64
	if req.CarePhaseId != nil {
		carePhaseID = req.CarePhaseId
	} else if taskTemplate.CarePhaseID.Valid {
		carePhaseID = &taskTemplate.CarePhaseID.Int64
	}

	var carePhase *caremanagerdb.CarePhase
	if carePhaseID != nil {
		carePhase, err = server.CaremanagerDB.queries.GetCarePhase(ctx, *carePhaseID)
		if err != nil || carePhase == nil {
			return nil, status.Errorf(codes.Internal, "could not find the care_phase assigned to this task template, care_phase_id: %d", *carePhaseID)
		}
	}
	taskTypesMapByID, err := server.getTaskTypesMapByID(ctx)
	if err != nil {
		return nil, err
	}

	updatedTaskTemplate, err := server.CaremanagerDB.queries.UpdateTaskTemplate(
		ctx,
		*updateTaskTemplateParams,
	)
	if err != nil {
		return nil, err
	}
	tasks, err := server.CaremanagerDB.queries.GetTasksForTemplates(ctx, updatedTaskTemplate.ID)
	if err != nil || tasks == nil {
		return nil, status.Errorf(codes.Internal, "could not find tasks assigned to this task template, task_template_id: %d", updatedTaskTemplate.ID)
	}

	updatedTaskTemplateResponse, err := TaskTemplateProtoFromTaskTemplateSQL(
		updatedTaskTemplate,
		carePhase,
		tasks,
		taskTypesMapByID,
	)
	if err != nil {
		return nil, err
	}
	return &caremanagerpb.UpdateTaskTemplateResponse{
		TaskTemplate: updatedTaskTemplateResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) DeleteTaskTemplate(
	ctx context.Context,
	req *caremanagerpb.DeleteTaskTemplateRequest,
) (*caremanagerpb.DeleteTaskTemplateResponse, error) {
	// TODO: wrap both queries in single transaction
	if err := server.CaremanagerDB.queries.DeleteTaskTemplateTasks(ctx, req.TemplateId); err != nil {
		return nil, err
	}
	if _, err := server.CaremanagerDB.queries.DeleteTaskTemplate(ctx, req.TemplateId); err != nil {
		return nil, err
	}

	return &caremanagerpb.DeleteTaskTemplateResponse{}, nil
}

func (server *CaremanagerGRPCServer) DeleteTask(
	ctx context.Context,
	req *caremanagerpb.DeleteTaskRequest,
) (*caremanagerpb.DeleteTaskResponse, error) {
	_, err := server.CaremanagerDB.queries.DeleteTask(ctx, req.TaskId)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.DeleteTaskResponse{}, nil
}

func (server *CaremanagerGRPCServer) DeleteNote(
	ctx context.Context,
	req *caremanagerpb.DeleteNoteRequest,
) (*caremanagerpb.DeleteNoteResponse, error) {
	_, err := server.CaremanagerDB.queries.DeleteNote(ctx, req.NoteId)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.DeleteNoteResponse{}, nil
}

func (server *CaremanagerGRPCServer) PinNote(
	ctx context.Context,
	req *caremanagerpb.PinNoteRequest,
) (*caremanagerpb.PinNoteResponse, error) {
	currentNote, err := server.CaremanagerDB.queries.GetNote(ctx, req.NoteId)
	if err != nil {
		return nil, err
	}

	if !currentNote.EpisodeID.Valid {
		return nil, status.Errorf(codes.Internal, "pinning notes is only supported for episode notes")
	}

	if currentNote.Pinned {
		return &caremanagerpb.PinNoteResponse{
			Note: NoteProtoFromNoteSQL(currentNote),
		}, nil
	}

	pinnedNotesCount, _ := server.CaremanagerDB.queries.GetEpisodePinnedNotesCount(ctx, currentNote.EpisodeID.Int64)

	if pinnedNotesCount >= int64(maxPinnedNotes) {
		return nil, fmt.Errorf("exceeded maximum of %d pinned notes", maxPinnedNotes)
	}

	note, err := server.CaremanagerDB.queries.PinNote(ctx, req.NoteId)

	if err != nil {
		return nil, err
	}

	return &caremanagerpb.PinNoteResponse{
		Note: NoteProtoFromNoteSQL(note),
	}, err
}

func (server *CaremanagerGRPCServer) UnpinNote(
	ctx context.Context,
	req *caremanagerpb.UnpinNoteRequest,
) (*caremanagerpb.UnpinNoteResponse, error) {
	updatedNote, err := server.CaremanagerDB.queries.UnpinNote(
		ctx,
		req.NoteId,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UnpinNoteResponse{
		Note: NoteProtoFromNoteSQL(updatedNote),
	}, nil
}

func (server *CaremanagerGRPCServer) getTaskTypesMapByID(ctx context.Context) (map[int64]*caremanagerdb.TaskType, error) {
	var taskTypesMapByID = map[int64]*caremanagerdb.TaskType{}
	taskTypes, err := server.CaremanagerDB.queries.GetAllTaskTypes(ctx)
	if err != nil {
		return nil, err
	}
	for _, tt := range taskTypes {
		taskTypesMapByID[tt.ID] = tt
	}
	return taskTypesMapByID, nil
}

func (server *CaremanagerGRPCServer) CreateTaskTemplate(
	ctx context.Context,
	req *caremanagerpb.CreateTaskTemplateRequest,
) (*caremanagerpb.CreateTaskTemplateResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	createTaskTemplateParams, err := CreateTaskTemplateParamsFromCreateTaskTemplateProtoRequest(req, user.Id)
	if err != nil {
		return nil, err
	}

	createdTaskTemplate, err := server.CaremanagerDB.queries.CreateTaskTemplate(
		ctx,
		*createTaskTemplateParams,
	)
	if err != nil {
		return nil, err
	}

	var carePhase *caremanagerdb.CarePhase
	if createdTaskTemplate.CarePhaseID.Valid {
		carePhase, err = server.CaremanagerDB.queries.GetCarePhase(ctx, createdTaskTemplate.CarePhaseID.Int64)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to get care_phase assigned to task template, care_phase_id: %d", createdTaskTemplate.CarePhaseID.Int64)
		}
	}

	taskTypesMapByID, err := server.getTaskTypesMapByID(ctx)
	if err != nil {
		return nil, err
	}
	tasksParams, err := CreateTemplateTasksParamsFromCreateTemplateTasksProto(req.Tasks, createdTaskTemplate.ID, taskTypesMapByID)
	if err != nil {
		return nil, err
	}
	createdTasks, err := server.CaremanagerDB.queries.CreateTemplateTasks(ctx, *tasksParams)
	if err != nil {
		return nil, err
	}

	taskTemplate, err := TaskTemplateProtoFromTaskTemplateSQL(
		createdTaskTemplate,
		carePhase,
		createdTasks,
		taskTypesMapByID,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.CreateTaskTemplateResponse{
		TaskTemplate: taskTemplate,
	}, nil
}

func (server *CaremanagerGRPCServer) GetTaskTemplate(
	ctx context.Context,
	req *caremanagerpb.GetTaskTemplateRequest,
) (*caremanagerpb.GetTaskTemplateResponse, error) {
	taskTemplate, err := server.CaremanagerDB.queries.GetTaskTemplate(ctx, req.TaskTemplateId)
	if err != nil {
		return nil, err
	}

	taskTemplateTasks, _ := server.CaremanagerDB.queries.GetTasksForTemplates(ctx, req.TaskTemplateId)

	taskTypesMapByID, err := server.getTaskTypesMapByID(ctx)
	if err != nil {
		return nil, err
	}

	var carePhase *caremanagerdb.CarePhase
	if taskTemplate.CarePhaseID.Valid {
		carePhase, _ = server.CaremanagerDB.queries.GetCarePhase(ctx, taskTemplate.CarePhaseID.Int64)
	}

	taskTemplateProto, err := TaskTemplateProtoFromTaskTemplateSQL(
		taskTemplate,
		carePhase,
		taskTemplateTasks,
		taskTypesMapByID,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.GetTaskTemplateResponse{TaskTemplate: taskTemplateProto}, err
}

func (server *CaremanagerGRPCServer) GetUsersByID(
	ctx context.Context,
	req *caremanagerpb.GetUsersByIDRequest,
) (*caremanagerpb.GetUsersByIDResponse, error) {
	users, err := server.StationClient.GetUsersByID(ctx, req.UserIds)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.GetUsersByIDResponse{
		Users: users,
	}, nil
}

func (server *CaremanagerGRPCServer) SearchUsers(
	ctx context.Context,
	req *caremanagerpb.SearchUsersRequest,
) (*caremanagerpb.SearchUsersResponse, error) {
	searchUsersRequest := GetUsersSearchUsersRequestFromCareManagerSearchUsersRequest(req)

	users, totalCount, err := server.StationClient.SearchUsers(ctx, &searchUsersRequest)
	if err != nil {
		return nil, err
	}

	meta := GetPageInfo(totalCount, *searchUsersRequest.PageSize, (*searchUsersRequest.Page-1)*(*searchUsersRequest.PageSize))

	return &caremanagerpb.SearchUsersResponse{
		Users: users,
		Meta:  meta,
	}, nil
}

func (server *CaremanagerGRPCServer) GetAddressesByID(
	ctx context.Context,
	req *caremanagerpb.GetAddressesByIDRequest,
) (*caremanagerpb.GetAddressesByIDResponse, error) {
	addresses, err := server.StationClient.GetAddressesByID(ctx, req.AddressIds)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.GetAddressesByIDResponse{
		Addresses: addresses,
	}, nil
}

func (server *CaremanagerGRPCServer) GetProviderTypes(
	ctx context.Context,
	req *caremanagerpb.GetProviderTypesRequest,
) (*caremanagerpb.GetProviderTypesResponse, error) {
	providerTypes, err := server.CaremanagerDB.queries.GetProviderTypes(ctx)
	if err != nil {
		return nil, err
	}

	providerTypeProtos := make([]*caremanagerpb.ProviderType, len(providerTypes))
	for i, pt := range providerTypes {
		providerTypeProtos[i] = ProviderTypeProtoFromProviderTypeSQL(pt)
	}

	return &caremanagerpb.GetProviderTypesResponse{
		ProviderTypes: providerTypeProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisitFromStationCR(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitFromStationCRRequest,
) (*caremanagerpb.UpdateVisitFromStationCRResponse, error) {
	if req.ServiceLineId != nil {
		visit, err := server.CaremanagerDB.queries.GetVisitByCareRequestId(ctx, req.CareRequestId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, status.Errorf(codes.NotFound, "no visit was found with the care_request_id: %d", req.CareRequestId)
			}
			return nil, err
		}

		params := UpdateEpisodeParamsFromUpdateVisitFromStationCRRequest(req, visit)
		_, err = server.CaremanagerDB.queries.UpdateEpisode(ctx, *params)
		if err != nil {
			return nil, err
		}
	}

	params, err := UpdateVisitByCareRequestIDParamsFromUpdateVisitFromStationCRRequest(req)
	if err != nil {
		return nil, err
	}
	updatedVisit, err := server.CaremanagerDB.queries.UpdateVisitByCareRequestID(ctx, *params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "no visit was found with the care_request_id: %d", req.CareRequestId)
		}
		return nil, err
	}

	return &caremanagerpb.UpdateVisitFromStationCRResponse{
		Visit: VisitProtoFromVisitSQL(updatedVisit),
	}, nil
}

type GetEpisodeRelatedEntitiesParams struct {
	EpisodeID        int64
	PatientID        int64
	CarePhaseID      int64
	TaskTemplatesIDs []int64
}

type getEpisodeRelatedEntitiesResult struct {
	patient       *caremanagerdb.Patient
	carePhases    []*caremanagerdb.CarePhase
	tasks         []*caremanagerdb.Task
	notes         []*caremanagerdb.Note
	taskTemplates []*caremanagerdb.GetTaskTemplatesByIDRow
}

func (server *CaremanagerGRPCServer) getEpisodeRelatedEntities(
	ctx context.Context,
	params *GetEpisodeRelatedEntitiesParams,
) (*getEpisodeRelatedEntitiesResult, error) {
	tasks, err := server.CaremanagerDB.queries.GetTasksByEpisodeID(ctx, caremanagerdb.GetTasksByEpisodeIDParams{Ids: []int64{params.EpisodeID}})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "an error ocurred while getting the episode tasks: %s", err.Error())
	}
	notes, err := server.CaremanagerDB.queries.GetEpisodeNotesSortedByRelevance(ctx, params.EpisodeID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "an error ocurred while getting the episode notes: %s", err.Error())
	}
	patient, err := server.CaremanagerDB.queries.GetPatient(ctx, params.PatientID)
	if err != nil || patient == nil {
		return nil, status.Errorf(codes.Internal, "could not find the patient assigned to this episode, patient_id: %d", params.PatientID)
	}
	var taskTemplatesIDs []int64
	if len(params.TaskTemplatesIDs) == 0 {
		taskTemplatesIDs, err = server.CaremanagerDB.queries.GetEpisodeTaskTemplatesIDs(ctx, params.EpisodeID)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "an error ocurred while getting the task templates IDs for the episode: %d", params.EpisodeID)
		}
	} else {
		taskTemplatesIDs = params.TaskTemplatesIDs
	}
	taskTemplates, err := server.CaremanagerDB.queries.GetTaskTemplatesByID(ctx, taskTemplatesIDs)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "an error ocurred while getting the task templates for the episode: %d", params.EpisodeID)
	}
	carePhasesIDs := []int64{params.CarePhaseID}
	for _, tt := range taskTemplates {
		if tt.CarePhaseID.Valid {
			carePhasesIDs = append(carePhasesIDs, tt.CarePhaseID.Int64)
		}
	}
	carePhases, err := server.CaremanagerDB.queries.GetCarePhasesByID(ctx, carePhasesIDs)
	if err != nil {
		return nil, err
	}

	return &getEpisodeRelatedEntitiesResult{
		patient:       patient,
		carePhases:    carePhases,
		tasks:         tasks,
		notes:         notes,
		taskTemplates: taskTemplates,
	}, nil
}

type getPatientRelatedEntitiesParams struct {
	patientID               int64
	withLegacyCareProviders bool
}

type getPatientRelatedEntitiesResult struct {
	medicalDecisionMakers []*caremanagerdb.MedicalDecisionMaker
	insurances            []*caremanagerdb.Insurance
	pharmacies            []*caremanagerdb.Pharmacy
	externalCareProviders []*caremanagerdb.ExternalCareProvider
	externalDoctor        *caremanagerdb.ExternalCareProvider
	externalReferrer      *caremanagerdb.ExternalCareProvider
}

func (server *CaremanagerGRPCServer) getPatientRelatedEntities(
	ctx context.Context,
	params getPatientRelatedEntitiesParams,
) (*getPatientRelatedEntitiesResult, error) {
	medicalDecisionMakers, err := server.CaremanagerDB.queries.GetPatientMedicalDecisionMakers(ctx, params.patientID)
	if err != nil {
		return nil, err
	} else if len(medicalDecisionMakers) == 0 {
		medicalDecisionMakers = []*caremanagerdb.MedicalDecisionMaker{}
	}
	insurances, err := server.CaremanagerDB.queries.GetPatientInsurances(ctx, params.patientID)
	if err != nil {
		return nil, err
	} else if len(insurances) == 0 {
		insurances = []*caremanagerdb.Insurance{}
	}
	pharmacies, err := server.CaremanagerDB.queries.GetPatientPharmacies(ctx, params.patientID)
	if err != nil {
		return nil, err
	} else if len(pharmacies) == 0 {
		pharmacies = []*caremanagerdb.Pharmacy{}
	}
	externalCareProviders, err := server.CaremanagerDB.queries.GetPatientExternalCareProviders(ctx, params.patientID)
	if err != nil {
		return nil, err
	} else if len(externalCareProviders) == 0 {
		externalCareProviders = []*caremanagerdb.ExternalCareProvider{}
	}

	var externalDoctor *caremanagerdb.ExternalCareProvider
	var externalReferrer *caremanagerdb.ExternalCareProvider
	if params.withLegacyCareProviders {
		providerTypes, err := server.CaremanagerDB.queries.GetProviderTypes(ctx)
		if err != nil {
			return nil, err
		}
		providerTypesByNameMap := map[string]caremanagerdb.ProviderType{}
		for _, pt := range providerTypes {
			providerTypesByNameMap[pt.Name.String] = *pt
		}
		for _, ecp := range externalCareProviders {
			if ecp.ProviderTypeID == providerTypesByNameMap["Doctor"].ID {
				externalDoctor = ecp
				continue
			} else if ecp.ProviderTypeID == providerTypesByNameMap["Referrer"].ID {
				externalReferrer = ecp
				continue
			}
		}
	}

	return &getPatientRelatedEntitiesResult{
		medicalDecisionMakers: medicalDecisionMakers,
		insurances:            insurances,
		pharmacies:            pharmacies,
		externalCareProviders: externalCareProviders,
		externalDoctor:        externalDoctor,
		externalReferrer:      externalReferrer,
	}, nil
}

func (server *CaremanagerGRPCServer) getPatientsMap(ctx context.Context, ids []int64) (map[int64]*caremanagerdb.Patient, error) {
	patients, err := server.CaremanagerDB.queries.GetPatientsByID(ctx, ids)
	if err != nil {
		return nil, err
	}

	patientMap := map[int64]*caremanagerdb.Patient{}
	for _, p := range patients {
		patientMap[p.ID] = p
	}

	return patientMap, nil
}

func (server *CaremanagerGRPCServer) getCarePhasesMap(ctx context.Context, ids []int64) (map[int64]*caremanagerdb.CarePhase, error) {
	carePhases, err := server.CaremanagerDB.queries.GetCarePhasesByID(ctx, ids)
	if err != nil {
		return nil, err
	}

	carePhaseMap := map[int64]*caremanagerdb.CarePhase{}
	for _, cp := range carePhases {
		carePhaseMap[cp.ID] = cp
	}

	return carePhaseMap, nil
}

type getTasksByEpisodeFilters struct {
	episodeIDs        []int64
	areTasksCompleted *bool
}

func (server *CaremanagerGRPCServer) getTasksByEpisodeMap(ctx context.Context, filters getTasksByEpisodeFilters) (map[int64][]*caremanagerdb.Task, error) {
	areTasksCompleted := sql.NullBool{}
	if filters.areTasksCompleted != nil {
		areTasksCompleted.Valid = true
		areTasksCompleted.Bool = *filters.areTasksCompleted
	}

	tasks, err := server.CaremanagerDB.queries.GetTasksByEpisodeID(ctx, caremanagerdb.GetTasksByEpisodeIDParams{
		Ids:               filters.episodeIDs,
		AreTasksCompleted: areTasksCompleted,
	})
	if err != nil {
		return nil, err
	}

	taskByEpisodeMap := map[int64][]*caremanagerdb.Task{}
	for _, t := range tasks {
		taskByEpisodeMap[t.EpisodeID] = append(taskByEpisodeMap[t.EpisodeID], t)
	}

	return taskByEpisodeMap, nil
}

func (server *CaremanagerGRPCServer) getMedicalDecisionMakersByPatientIDMap(ctx context.Context, patientsIDs []int64) (map[int64]*caremanagerdb.MedicalDecisionMaker, error) {
	medicalDecisionMakers, err := server.CaremanagerDB.queries.GetMedicalDecisionMakersByPatientIDs(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}

	medicalDecisionMakerMap := map[int64]*caremanagerdb.MedicalDecisionMaker{}
	for _, mdm := range medicalDecisionMakers {
		medicalDecisionMakerMap[mdm.PatientID] = mdm
	}

	return medicalDecisionMakerMap, nil
}

func (server *CaremanagerGRPCServer) getInsurancesByPatientIDMap(ctx context.Context, patientsIDs []int64) (map[int64]*caremanagerdb.Insurance, error) {
	insurances, err := server.CaremanagerDB.queries.GetInsurancesByPatientIDs(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}

	insuranceMap := map[int64]*caremanagerdb.Insurance{}
	for _, insurance := range insurances {
		insuranceMap[insurance.PatientID] = insurance
	}

	return insuranceMap, nil
}

func (server *CaremanagerGRPCServer) getPharmaciesByPatientIDMap(ctx context.Context, patientsIDs []int64) (map[int64]*caremanagerdb.Pharmacy, error) {
	pharmacies, err := server.CaremanagerDB.queries.GetPharmaciesByPatientIDs(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}

	pharmacyMap := map[int64]*caremanagerdb.Pharmacy{}
	for _, pharmacy := range pharmacies {
		pharmacyMap[pharmacy.PatientID] = pharmacy
	}

	return pharmacyMap, nil
}

func (server *CaremanagerGRPCServer) getExternalCareProvidersByPatientIDAndTypeNameMap(
	ctx context.Context,
	patientsIDs []int64,
) (map[int64]map[string]*caremanagerdb.ExternalCareProvider, error) {
	externalCareProviders, err := server.CaremanagerDB.queries.GetExternalCareProvidersByPatientIDs(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	providerTypes, err := server.CaremanagerDB.queries.GetProviderTypes(ctx)
	if err != nil {
		return nil, err
	}
	providerTypesMap := map[int64]caremanagerdb.ProviderType{}
	for _, pt := range providerTypes {
		providerTypesMap[pt.ID] = *pt
	}

	externalCareProvidersMap := map[int64]map[string]*caremanagerdb.ExternalCareProvider{}
	for _, ecp := range externalCareProviders {
		if externalCareProvidersMap[ecp.PatientID] == nil {
			externalCareProvidersMap[ecp.PatientID] = map[string]*caremanagerdb.ExternalCareProvider{}
		}
		externalCareProvidersMap[ecp.PatientID][providerTypesMap[ecp.ProviderTypeID].Name.String] = ecp
	}

	return externalCareProvidersMap, nil
}

func (server *CaremanagerGRPCServer) getMarketIDsForAuthenticatedUser(
	ctx context.Context,
	requestedMarketIDs []int64,
) ([]int64, error) {
	userMarkets, err := server.StationClient.GetAuthenticatedUserMarkets(ctx)
	if err != nil {
		return nil, err
	}

	userMarketIDsSet := collections.NewLinkedInt64Set(len(userMarkets))

	for _, userMarket := range userMarkets {
		userMarketIDsSet.Add(userMarket.Id)
	}

	if len(requestedMarketIDs) == 0 {
		return userMarketIDsSet.Elems(), nil
	}

	var marketIDsToFilter []int64
	for _, requestedMarketID := range requestedMarketIDs {
		if userMarketIDsSet.Has(requestedMarketID) {
			marketIDsToFilter = append(marketIDsToFilter, requestedMarketID)
		}
	}

	return marketIDsToFilter, nil
}

func (server *CaremanagerGRPCServer) GetActivePatients(
	ctx context.Context,
	req *caremanagerpb.GetActivePatientsRequest,
) (*caremanagerpb.GetActivePatientsResponse, error) {
	params, err := GetActivePatientSQLParamsFromGetPatientsProtoRequest(req)
	if err != nil {
		return nil, err
	}

	rows, err := server.CaremanagerDB.queries.GetActivePatients(ctx, *params)
	if err != nil {
		return nil, err
	}

	totalPatientsCount := int64(0)
	if len(rows) > 0 {
		totalPatientsCount = rows[0].Count
	}

	patientsIDs := make([]int64, len(rows))
	for i, patient := range rows {
		patientsIDs[i] = patient.ID
	}

	medicalDecisionMakersMap, err := server.getMedicalDecisionMakersByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	insurancesMap, err := server.getInsurancesByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	pharmaciesMap, err := server.getPharmaciesByPatientIDMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}
	externalCareProvidersMap, err := server.getExternalCareProvidersByPatientIDAndTypeNameMap(ctx, patientsIDs)
	if err != nil {
		return nil, err
	}

	patients := make([]*caremanagerpb.Patient, len(rows))
	for i, row := range rows {
		patients[i] = PatientProtoFromGetActivePatientSQLRow(row, PatientProtoFromGetActivePatientSQLRowParams{
			medicalDecisionMaker: medicalDecisionMakersMap[row.ID],
			insurance:            insurancesMap[row.ID],
			pharmacy:             pharmaciesMap[row.ID],
			externalDoctor:       externalCareProvidersMap[row.ID]["Doctor"],
			externalReferrer:     externalCareProvidersMap[row.ID]["Referrer"],
		})
	}

	metaResponse := GetPageInfo(totalPatientsCount, params.PageSize, params.PageOffset)

	return &caremanagerpb.GetActivePatientsResponse{
		Patients: patients,
		Meta:     metaResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) GetVisit(ctx context.Context, req *caremanagerpb.GetVisitRequest) (*caremanagerpb.GetVisitResponse, error) {
	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, ErrVisitNotFoundMessage)
		}
		return nil, err
	}

	visitProto := VisitProtoFromVisitSQL(visit)

	summaryRow, err := server.CaremanagerDB.queries.GetVisitSummaryByVisitId(ctx, req.VisitId)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	visitSummary := VisitSummaryProtoFromVisitSummaryRow(summaryRow)

	return &caremanagerpb.GetVisitResponse{
		Visit:   visitProto,
		Summary: visitSummary,
	}, nil
}

func (server *CaremanagerGRPCServer) GetVisitTypes(
	ctx context.Context,
	req *caremanagerpb.GetVisitTypesRequest,
) (*caremanagerpb.GetVisitTypesResponse, error) {
	visitTypesRows, err := server.CaremanagerDB.queries.GetVisitTypes(ctx)
	if err != nil {
		return nil, err
	}

	visitTypes := make([]*caremanagerpb.VisitType, len(visitTypesRows))
	for i, visitTypesRows := range visitTypesRows {
		visitTypes[i] = VisitTypeFromVisitTypeSQLRow(visitTypesRows)
	}

	return &caremanagerpb.GetVisitTypesResponse{
		VisitTypes: visitTypes,
	}, nil
}

func (server *CaremanagerGRPCServer) GetEpisodeVisits(
	ctx context.Context,
	req *caremanagerpb.GetEpisodeVisitsRequest,
) (*caremanagerpb.GetEpisodeVisitsResponse, error) {
	authenticatedUserMarkets, err := server.StationClient.GetAuthenticatedUserMarkets(ctx)
	if err != nil {
		return nil, err
	}

	authenticatedUserMarketsIDs := make([]int64, len(authenticatedUserMarkets))
	for i, market := range authenticatedUserMarkets {
		authenticatedUserMarketsIDs[i] = market.Id
	}

	episode, err := server.CaremanagerDB.queries.GetEpisode(ctx, req.EpisodeId)
	if err != nil {
		return nil, err
	}

	if !slices.Contains(authenticatedUserMarketsIDs, episode.MarketID) {
		return nil, status.Error(codes.PermissionDenied, "market unavailable for user")
	}

	episodeVisitsSQLRows, err := server.CaremanagerDB.queries.GetEpisodeVisits(
		ctx,
		req.EpisodeId,
	)
	if err != nil {
		return nil, err
	}

	var careRequestIDs []int64
	for _, visitRow := range episodeVisitsSQLRows {
		if visitRow.CareRequestID.Valid {
			careRequestIDs = append(careRequestIDs, visitRow.CareRequestID.Int64)
		}
	}

	scheduleCareRequestsMap, err := server.LogisticsClient.GetSchedulesForCareRequests(ctx, careRequestIDs, episode.MarketID)
	if err != nil {
		return nil, err
	}

	visits := make([]*caremanagerpb.VisitListElement, len(episodeVisitsSQLRows))
	for i, episodeVisitsSQLRow := range episodeVisitsSQLRows {
		visits[i] = VisitListElementFromEpisodeVisitsSQLRow(episodeVisitsSQLRow, scheduleCareRequestsMap)
	}

	return &caremanagerpb.GetEpisodeVisitsResponse{
		Visits: visits,
	}, nil
}

func (server *CaremanagerGRPCServer) validateCallVisitType(ctx context.Context, visitTypeID int64) error {
	visitTypeRow, err := server.CaremanagerDB.queries.GetVisitType(ctx, visitTypeID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return status.Errorf(codes.InvalidArgument, ErrVisitTypeDoesNotExistMessage)
		}
		return err
	}

	if !visitTypeRow.IsCallType {
		return status.Errorf(codes.InvalidArgument, "can't assign a non-call VisitType to this Visit")
	}

	return nil
}

func (server *CaremanagerGRPCServer) CreateCallVisit(ctx context.Context, req *caremanagerpb.CreateCallVisitRequest) (*caremanagerpb.CreateCallVisitResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	_, err = server.CaremanagerDB.queries.GetEpisode(ctx, req.EpisodeId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, "Episode doesn't exist")
		}

		return nil, err
	}

	if err := server.validateCallVisitType(ctx, req.VisitTypeId); err != nil {
		return nil, err
	}

	response := &caremanagerpb.CreateCallVisitResponse{}
	err = server.CaremanagerDB.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := server.CaremanagerDB.queries.WithTx(tx)

		visitParams := CreateVisitSQLParamsFromCreateCallVisitRequest(req, user.Id)
		visit, err := qtx.CreateVisit(ctx, visitParams)
		if err != nil {
			return err
		}

		visitSummaryParams := CreateVisitSummarySQLParamsFromCreateVisitRequest(req, visit.ID, user.Id)
		summary, err := qtx.CreateVisitSummary(ctx, visitSummaryParams)
		if err != nil {
			return err
		}

		response.Visit = VisitProtoFromVisitSQL(visit)
		response.Summary = VisitSummaryProtoFromVisitSummaryRow(summary)

		return nil
	})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (server *CaremanagerGRPCServer) UpdateCallVisit(ctx context.Context, req *caremanagerpb.UpdateCallVisitRequest) (*caremanagerpb.UpdateCallVisitResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	var visitRow *caremanagerdb.Visit
	if req.VisitTypeId != nil {
		if err := server.validateCallVisitType(ctx, *req.VisitTypeId); err != nil {
			return nil, err
		}

		sqlVisitParams := UpdateVisitSQLParamsFromUpdateCallVisitRequest(req, &user.Id)

		visitRow, err = server.CaremanagerDB.queries.UpdateVisit(ctx, sqlVisitParams)
	} else {
		visitRow, err = server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	}

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, ErrVisitNotFoundMessage)
		}
		return nil, err
	}

	visit := VisitProtoFromVisitSQL(visitRow)

	var summaryRow *caremanagerdb.VisitSummary
	if req.Summary != nil {
		var sqlSummaryParams *caremanagerdb.UpdateVisitSummaryParams
		sqlSummaryParams, err = UpdateVisitSummarySQLParamsFromUpdateCallVisitRequest(req, &user.Id)
		if err != nil {
			return nil, err
		}
		summaryRow, err = server.CaremanagerDB.queries.UpdateVisitSummary(ctx, *sqlSummaryParams)
	} else {
		summaryRow, err = server.CaremanagerDB.queries.GetVisitSummaryByVisitId(ctx, req.VisitId)
	}

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.InvalidArgument, ErrVisitSummaryDoesNotExistMessage)
		}
		return nil, err
	}

	summary := VisitSummaryProtoFromVisitSummaryRow(summaryRow)

	return &caremanagerpb.UpdateCallVisitResponse{
		Visit:   visit,
		Summary: summary,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateVisitSummary(
	ctx context.Context,
	req *caremanagerpb.CreateVisitSummaryRequest,
) (*caremanagerpb.CreateVisitSummaryResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	newVisitSummaryParams := CreateVisitSummarySQLParamsFromCreateVisitSummaryProtoRequest(
		req,
		user.Id,
	)

	newVisitSummary, err := server.CaremanagerDB.queries.CreateVisitSummary(
		ctx,
		*newVisitSummaryParams,
	)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, status.Errorf(
				codes.AlreadyExists,
				"a VisitSummary for Visit %d already exists",
				req.VisitId,
			)
		}
		return nil, err
	}

	return &caremanagerpb.CreateVisitSummaryResponse{
		Summary: VisitSummaryProtoFromVisitSummaryRow(newVisitSummary),
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisitSummary(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitSummaryRequest,
) (*caremanagerpb.UpdateVisitSummaryResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	updateVisitParams, err := UpdateVisitSummarySQLParamsFromUpdateVisitSummaryProtoRequest(
		req,
		user.Id,
	)
	if err != nil {
		return nil, err
	}

	visitSummary, err := server.CaremanagerDB.queries.UpdateVisitSummary(
		ctx,
		*updateVisitParams,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(
				codes.NotFound, "the visit with ID %d does not have a summary", req.VisitId,
			)
		}
		return nil, err
	}

	return &caremanagerpb.UpdateVisitSummaryResponse{
		Summary: VisitSummaryProtoFromVisitSummaryRow(visitSummary),
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisitStatus(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitStatusRequest,
) (*caremanagerpb.UpdateVisitStatusResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	visitRow, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, ErrVisitNotFoundMessage)
		}
		return nil, err
	}

	if !visitRow.CareRequestID.Valid {
		return nil, status.Error(codes.FailedPrecondition, "the visit doesn't have a reference to a care request")
	}
	careRequestID := visitRow.CareRequestID.Int64

	episodeRow, err := server.CaremanagerDB.queries.GetEpisode(ctx, visitRow.EpisodeID)
	if err != nil {
		return nil, err
	}

	shiftTeamID, err := server.LogisticsClient.GetFirstScheduledShiftTeamIDForCareRequest(ctx, careRequestID, episodeRow.MarketID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "unable to retrieve region schedule from logistics, %v", err)
	}

	var providerUserIDs []int64
	if req.Status == caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_COMMITTED {
		if shiftTeamID == nil {
			return nil, status.Errorf(codes.FailedPrecondition, "could not find an available shift team for that visit")
		}
		providerUserIDs, err = server.StationClient.GetShiftTeamMemberIds(ctx, *shiftTeamID)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "unable to retrieve shift team members, %v", err)
		}
	}

	updateVisitStatusAndProvidersParams, err := UpdateVisitStatusAndProvidersSQLParamsFromUpdateVisitStatusProtoRequest(req, providerUserIDs, &user.Id)
	if err != nil {
		return nil, err
	}

	err = server.StationClient.UpdateCareRequestStatus(ctx, careRequestID, updateVisitStatusAndProvidersParams.Status.String, shiftTeamID)
	if err != nil {
		return nil, err
	}

	updatedVisitRow, err := server.CaremanagerDB.queries.UpdateVisitStatusAndProviders(ctx, *updateVisitStatusAndProvidersParams)
	if err != nil {
		return nil, err
	}

	updatedVisit := VisitProtoFromVisitSQL(updatedVisitRow)

	return &caremanagerpb.UpdateVisitStatusResponse{
		Visit: updatedVisit,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisit(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitRequest,
) (*caremanagerpb.UpdateVisitResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	visitRow, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, ErrVisitNotFoundMessage)
		}
		return nil, err
	}

	if req.VisitTypeId != nil {
		_, err := server.CaremanagerDB.queries.GetVisitType(ctx, *req.VisitTypeId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, status.Errorf(codes.InvalidArgument, "VisitType doesn't exist")
			}
			return nil, err
		}

		params := UpdateVisitSQLParamsFromUpdateVisitRequest(req, user.Id)
		visitRow, err = server.CaremanagerDB.queries.UpdateVisit(ctx, params)
		if err != nil {
			return nil, err
		}
	}

	visit := VisitProtoFromVisitSQL(visitRow)

	return &caremanagerpb.UpdateVisitResponse{
		Visit: visit,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisitEpisode(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitEpisodeRequest,
) (*caremanagerpb.UpdateVisitEpisodeResponse, error) {
	_, err := server.CaremanagerDB.queries.GetEpisode(ctx, req.EpisodeId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.InvalidArgument, "Episode not found")
		}
		return nil, err
	}

	visit, err := server.CaremanagerDB.queries.UpdateVisitEpisode(ctx, caremanagerdb.UpdateVisitEpisodeParams{
		ID:        req.VisitId,
		EpisodeID: req.EpisodeId,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "Visit not found")
		}
		return nil, err
	}

	return &caremanagerpb.UpdateVisitEpisodeResponse{
		Visit: VisitProtoFromVisitSQL(visit),
	}, nil
}

func (server *CaremanagerGRPCServer) createMedicalDecisionMakerFromStationRequest(
	ctx context.Context,
	qtx *caremanagerdb.Queries,
	req *caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR,
	patientID int64,
) (*caremanagerdb.MedicalDecisionMaker, error) {
	mdmParams, err := CreateMedicalDecisionMakerSQLParamsFromCreateVisitFromStationCRProtoRequest(
		req,
		patientID,
	)
	if err != nil {
		return nil, err
	}
	return qtx.CreateMedicalDecisionMaker(ctx, *mdmParams)
}

func (server *CaremanagerGRPCServer) createInsurancesFromStationRequest(
	ctx context.Context,
	qtx *caremanagerdb.Queries,
	req []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR,
	patientID int64,
) ([]*caremanagerdb.Insurance, error) {
	insuranceParams, err := CreateInsuranceSQLParamsFromCreateVisitFromStationCRProtoRequest(
		req,
		patientID,
	)
	if err != nil {
		return nil, err
	}
	return qtx.CreateInsurances(ctx, *insuranceParams)
}

func (server *CaremanagerGRPCServer) findOrCreatePatientByAthenaID(
	ctx context.Context,
	qtx *caremanagerdb.Queries,
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) (*caremanagerdb.Patient, *PatientProtoFromPatientSQLParams, error) {
	patientParams := PatientProtoFromPatientSQLParams{}
	foundPatient, err := server.CaremanagerDB.queries.GetPatientByAthenaID(
		ctx,
		sqltypes.ToNullString(&req.Patient.AthenaMedicalRecordNumber),
	)
	if err == nil {
		return foundPatient, &patientParams, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, err
	}

	newPatientParams, err := CreatePatientSQLParamsFromCreateVisitFromStationCRProtoRequest(req)
	if err != nil {
		return nil, nil, err
	}
	newPatient, err := server.CaremanagerDB.queries.CreatePatient(
		ctx,
		*newPatientParams,
	)
	if err != nil {
		return nil, nil, err
	}
	medicalDecisionMaker, err := server.createMedicalDecisionMakerFromStationRequest(
		ctx,
		qtx,
		req.Patient.MedicalDecisionMaker,
		newPatient.ID,
	)
	if err != nil {
		return nil, nil, err
	}
	insurances, err := server.createInsurancesFromStationRequest(
		ctx,
		qtx,
		req.Patient.Insurances,
		newPatient.ID,
	)
	if err != nil {
		return nil, nil, err
	}

	patientParams = PatientProtoFromPatientSQLParams{
		medicalDecisionMaker: medicalDecisionMaker,
		insurance:            GetInsuranceWithHighestPriority(insurances),
	}

	return newPatient, &patientParams, nil
}

func (server *CaremanagerGRPCServer) createEpisodeFromStationRequest(
	ctx context.Context,
	qtx *caremanagerdb.Queries,
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) (*caremanagerpb.Episode, *caremanagerpb.Patient, error) {
	patient, patientParams, err := server.findOrCreatePatientByAthenaID(ctx, qtx, req)
	if err != nil {
		return nil, nil, err
	}
	patientResponse := PatientProtoFromPatientSQL(patient, *patientParams)
	if err != nil {
		return nil, nil, err
	}
	newEpisodeParams, err := CreateEpisodeSQLParamsFromCreateVisitFromStationCRProtoRequest(req, patient.ID)
	if err != nil {
		return nil, nil, err
	}
	newEpisode, err := qtx.CreateEpisode(ctx, *newEpisodeParams)
	if err != nil {
		return nil, nil, err
	}
	relatedEntities, err := server.getEpisodeRelatedEntities(ctx, &GetEpisodeRelatedEntitiesParams{
		CarePhaseID: newEpisodeParams.CarePhaseID,
		EpisodeID:   newEpisode.ID,
		PatientID:   patient.ID,
	})
	if err != nil {
		return nil, nil, err
	}
	episodeResponse := EpisodeProtoFromEpisodeSQL(newEpisode, EpisodeProtoFromEpisodeSQLParams{
		patient:    patient,
		carePhases: relatedEntities.carePhases,
	})

	return episodeResponse, patientResponse, nil
}

func (server *CaremanagerGRPCServer) CreateVisitFromStationCR(
	ctx context.Context,
	req *caremanagerpb.CreateVisitFromStationCRRequest,
) (*caremanagerpb.CreateVisitFromStationCRResponse, error) {
	isVisitCreationEnabled := server.StatsigProvider.Bool(VisitsV1StatsigFlag, false)
	if !isVisitCreationEnabled {
		return nil, status.Error(codes.PermissionDenied, "this feature is still not enabled")
	}
	careRequestID, err := GetVisitByCareRequestIDSQLParamsFromCreateVisitFromStationCRProtoRequest(req)
	if err != nil {
		return nil, err
	}

	foundVisit, err := server.CaremanagerDB.queries.GetVisitByCareRequestId(ctx, careRequestID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if foundVisit.CareRequestID.Int64 == careRequestID {
		return nil, status.Error(codes.AlreadyExists, "the requested care request already exists")
	}

	episodeID := int64(0)

	if req.OriginalCareRequestId > 0 {
		foundSourceEpisode, err := server.CaremanagerDB.queries.GetEpisodeByOriginalCareRequestId(ctx, sqltypes.ToNullInt64(&req.OriginalCareRequestId))
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		if err == nil {
			episodeID = foundSourceEpisode.ID
		}
	}
	if episodeID == 0 && req.SourceCareRequestId != nil && *req.SourceCareRequestId >= 0 {
		foundDuplicatedSourceVisit, err := server.CaremanagerDB.queries.GetVisitByCareRequestId(ctx, *req.SourceCareRequestId)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
		if err == nil {
			episodeID = foundDuplicatedSourceVisit.EpisodeID
		}
	}
	episodeResponse := &caremanagerpb.Episode{}
	patientResponse := &caremanagerpb.Patient{}
	visit := &caremanagerdb.Visit{}
	err = server.CaremanagerDB.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := server.CaremanagerDB.queries.WithTx(tx)
		if episodeID == 0 {
			episode, patient, err := server.createEpisodeFromStationRequest(ctx, qtx, req)
			if err != nil {
				return err
			}
			episodeID = episode.Id
			episodeResponse = episode
			patientResponse = patient
		}

		visitParams, err := CreateVisitSQLParamsFromCreateVisitFromStationCRProtoRequest(req, episodeID)
		if err != nil {
			return err
		}

		visit, err = qtx.CreateVisit(ctx, *visitParams)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	visitResponse := VisitProtoFromVisitSQL(visit)

	err = server.SegmentClient.track(
		ctx,
		SegmentTrackCreateVisit,
		CreateVisitSegmentEventFromCreateVisitProtoRequest(visitResponse, req),
	)
	if err != nil {
		server.Logger.Infof("Segment returned an error: %s", err)
	}

	return &caremanagerpb.CreateVisitFromStationCRResponse{
		Visit:   visitResponse,
		Patient: patientResponse,
		Episode: episodeResponse,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateInsurance(ctx context.Context, req *caremanagerpb.CreateInsuranceRequest) (*caremanagerpb.CreateInsuranceResponse, error) {
	if req.Name == "" {
		return nil, status.Errorf(codes.InvalidArgument, "name cannot be empty")
	}

	_, err := server.CaremanagerDB.queries.GetPatient(ctx, req.PatientId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, "patient not found")
		}
		return nil, err
	}

	insurances, err := server.CaremanagerDB.queries.GetPatientInsurances(ctx, req.PatientId)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if len(insurances) >= AllowedNumberOfInsurancesPerPatient {
		return nil, status.Errorf(codes.FailedPrecondition, "cannot create more than three insurances per patient")
	}

	nextPriority := int32(1)
	if len(insurances) > 0 {
		insuranceWithLowestPriority := insurances[len(insurances)-1]
		nextPriority = insuranceWithLowestPriority.Priority + 1
	}

	if !slices.Contains(supportedInsurancePriorities, nextPriority) {
		return nil, status.Errorf(codes.FailedPrecondition, "cannot assign priority to insurance, priority is out of range")
	}

	params := CreateInsuranceSQLParamsFromCreateInsuranceRequestProto(req, nextPriority)
	createdInsurance, err := server.CaremanagerDB.queries.CreateInsurance(ctx, params)
	if err != nil {
		return nil, err
	}

	insurances, err = server.CaremanagerDB.queries.GetPatientInsurances(ctx, req.PatientId)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	newInsuranceProto := InsuranceProtoFromInsuranceSQL(createdInsurance)

	patientInsuranceProtos := make([]*caremanagerpb.Insurance, len(insurances))
	for i, insurance := range insurances {
		patientInsuranceProtos[i] = InsuranceProtoFromInsuranceSQL(insurance)
	}

	return &caremanagerpb.CreateInsuranceResponse{
		Insurance:         newInsuranceProto,
		PatientInsurances: patientInsuranceProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateInsurance(ctx context.Context, req *caremanagerpb.UpdateInsuranceRequest) (*caremanagerpb.UpdateInsuranceResponse, error) {
	_, err := server.CaremanagerDB.queries.GetInsurance(ctx, req.InsuranceId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "Insurance not found")
		}
		return nil, err
	}

	sqlParams, err := UpdateInsuranceSQLParamsFromUpdateInsuranceRequest(req)
	if err != nil {
		return nil, err
	}

	updatedInsurance, err := server.CaremanagerDB.queries.UpdateInsurance(ctx, *sqlParams)
	if err != nil {
		return nil, err
	}

	insurances, err := server.CaremanagerDB.queries.GetPatientInsurances(ctx, updatedInsurance.PatientID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	patientInsuranceProtos := make([]*caremanagerpb.Insurance, len(insurances))
	for i, insurance := range insurances {
		patientInsuranceProtos[i] = InsuranceProtoFromInsuranceSQL(insurance)
	}

	updatedInsuranceProto := InsuranceProtoFromInsuranceSQL(updatedInsurance)

	return &caremanagerpb.UpdateInsuranceResponse{
		Insurance:         updatedInsuranceProto,
		PatientInsurances: patientInsuranceProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) DeleteInsurance(ctx context.Context, req *caremanagerpb.DeleteInsuranceRequest) (*caremanagerpb.DeleteInsuranceResponse, error) {
	_, err := server.CaremanagerDB.queries.GetInsurance(ctx, req.InsuranceId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "Insurance not found")
		}
		return nil, err
	}

	var patientInsurances []*caremanagerpb.Insurance
	err = server.CaremanagerDB.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := server.CaremanagerDB.queries.WithTx(tx)

		deletedInsurance, err := qtx.DeleteInsurance(ctx, req.InsuranceId)
		if err != nil {
			return err
		}

		patientID := deletedInsurance.PatientID

		insurances, err := qtx.GetPatientInsurances(ctx, patientID)
		if err != nil {
			return err
		}

		// no matter in which order insurances are deleted, priorities must always
		// be sorted and sequential, so after a deletion we recompute the priorities
		// and assign them to current patient's insurances.
		for i, insurance := range insurances {
			priority := int32(i) + 1

			updatedInsurance, err := qtx.UpdateInsurance(ctx, caremanagerdb.UpdateInsuranceParams{
				Priority: sqltypes.ToNullInt32(&priority),
				ID:       insurance.ID,
			})
			if err != nil {
				return err
			}
			patientInsurances = append(patientInsurances, InsuranceProtoFromInsuranceSQL(updatedInsurance))
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.DeleteInsuranceResponse{
		PatientInsurances: patientInsurances,
	}, nil
}

func (server *CaremanagerGRPCServer) CreatePharmacy(ctx context.Context, req *caremanagerpb.CreatePharmacyRequest) (*caremanagerpb.CreatePharmacyResponse, error) {
	_, err := server.CaremanagerDB.queries.GetPatient(ctx, req.PatientId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, ErrPatientNotFoundMessage)
		}
		return nil, err
	}

	params, err := CreatePharmacySQLParamsFromCreatePharmacyRequestProto(req)
	if err != nil {
		return nil, err
	}
	createdPharmacy, err := server.CaremanagerDB.queries.CreatePharmacy(ctx, *params)
	if err != nil {
		return nil, err
	}
	pharmacies, err := server.CaremanagerDB.queries.GetPatientPharmacies(ctx, req.PatientId)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	patientPharmaciesProtos := make([]*caremanagerpb.Pharmacy, len(pharmacies))
	for i, pharmacy := range pharmacies {
		patientPharmaciesProtos[i] = PharmacyProtoFromPharmacySQL(pharmacy)
	}

	return &caremanagerpb.CreatePharmacyResponse{
		Pharmacy:          PharmacyProtoFromPharmacySQL(createdPharmacy),
		PatientPharmacies: patientPharmaciesProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdatePharmacy(ctx context.Context, req *caremanagerpb.UpdatePharmacyRequest) (*caremanagerpb.UpdatePharmacyResponse, error) {
	params, err := UpdatePharmacySQLParamsFromUpdatePharmacyRequestProto(req)
	if err != nil {
		return nil, err
	}

	updatedPharmacy, err := server.CaremanagerDB.queries.UpdatePharmacy(ctx, *params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, "Pharmacy not found")
		}
		return nil, err
	}
	pharmacies, err := server.CaremanagerDB.queries.GetPatientPharmacies(ctx, updatedPharmacy.PatientID)
	if err != nil {
		return nil, err
	}
	patientPharmaciesProtos := make([]*caremanagerpb.Pharmacy, len(pharmacies))
	for i, pharmacy := range pharmacies {
		patientPharmaciesProtos[i] = PharmacyProtoFromPharmacySQL(pharmacy)
	}

	return &caremanagerpb.UpdatePharmacyResponse{
		Pharmacy:          PharmacyProtoFromPharmacySQL(updatedPharmacy),
		PatientPharmacies: patientPharmaciesProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateMedicalDecisionMaker(ctx context.Context, req *caremanagerpb.CreateMedicalDecisionMakerRequest) (*caremanagerpb.CreateMedicalDecisionMakerResponse, error) {
	_, err := server.CaremanagerDB.queries.GetPatient(ctx, req.PatientId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, ErrPatientNotFoundMessage)
		}
		return nil, err
	}

	sqlParams, err := CreateMedicalDecisionMakerSQLParamsFromCreateMedicalDecisionMakerRequestProto(req)
	if err != nil {
		return nil, err
	}

	createdMedicalDecisionMaker, err := server.CaremanagerDB.queries.CreateMedicalDecisionMaker(ctx, *sqlParams)
	if err != nil {
		return nil, err
	}

	medicalDecisionMakerProto := MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(createdMedicalDecisionMaker)

	patientMedicalDecisionMakers, err := server.CaremanagerDB.queries.GetPatientMedicalDecisionMakers(ctx, req.PatientId)
	if err != nil {
		return nil, err
	}

	patientMedicalDecisionMakersProtos := make([]*caremanagerpb.MedicalDecisionMaker, len(patientMedicalDecisionMakers))
	for i, maker := range patientMedicalDecisionMakers {
		patientMedicalDecisionMakersProtos[i] = MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(maker)
	}

	return &caremanagerpb.CreateMedicalDecisionMakerResponse{
		MedicalDecisionMaker:         medicalDecisionMakerProto,
		PatientMedicalDecisionMakers: patientMedicalDecisionMakersProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateMedicalDecisionMaker(ctx context.Context, req *caremanagerpb.UpdateMedicalDecisionMakerRequest) (*caremanagerpb.UpdateMedicalDecisionMakerResponse, error) {
	_, err := server.CaremanagerDB.queries.GetMedicalDecisionMaker(ctx, req.MedicalDecisionMakerId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, "MedicalDecisionMaker not found")
		}
		return nil, err
	}

	sqlParams, err := UpdateMedicalDecisionMakerSQLParamsFromUpdateMedicalDecisionMakerRequestProto(req)
	if err != nil {
		return nil, err
	}

	updatedMedicalDecisionMaker, err := server.CaremanagerDB.queries.UpdateMedicalDecisionMaker(ctx, *sqlParams)
	if err != nil {
		return nil, err
	}

	medicalDecisionMakerProto := MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(updatedMedicalDecisionMaker)

	patientMedicalDecisionMakers, err := server.CaremanagerDB.queries.GetPatientMedicalDecisionMakers(ctx, updatedMedicalDecisionMaker.PatientID)
	if err != nil {
		return nil, err
	}

	patientMedicalDecisionMakersProtos := make([]*caremanagerpb.MedicalDecisionMaker, len(patientMedicalDecisionMakers))
	for i, maker := range patientMedicalDecisionMakers {
		patientMedicalDecisionMakersProtos[i] = MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(maker)
	}

	return &caremanagerpb.UpdateMedicalDecisionMakerResponse{
		MedicalDecisionMaker:         medicalDecisionMakerProto,
		PatientMedicalDecisionMakers: patientMedicalDecisionMakersProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateExternalCareProvider(
	ctx context.Context,
	req *caremanagerpb.CreateExternalCareProviderRequest,
) (*caremanagerpb.CreateExternalCareProviderResponse, error) {
	_, err := server.CaremanagerDB.queries.GetPatient(ctx, req.PatientId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.InvalidArgument, ErrPatientNotFoundMessage)
		}
		return nil, err
	}

	params, err := CreateExternalCareProviderSQLParamsFromCreateExternalCareProviderRequestProto(req)
	if err != nil {
		return nil, err
	}

	createdEcp, err := server.CaremanagerDB.queries.CreateExternalCareProvider(ctx, *params)
	if err != nil {
		return nil, err
	}

	ecps, err := server.CaremanagerDB.queries.GetPatientExternalCareProviders(ctx, req.PatientId)
	if err != nil {
		return nil, err
	}

	newExternalCareProviderProto := ExternalCareProviderProtoFromExternalCareProviderSQL(createdEcp)

	patientExternalCareProviders := make([]*caremanagerpb.ExternalCareProvider, len(ecps))
	for i, ecp := range ecps {
		patientExternalCareProviders[i] = ExternalCareProviderProtoFromExternalCareProviderSQL(ecp)
	}

	return &caremanagerpb.CreateExternalCareProviderResponse{
		ExternalCareProvider:         newExternalCareProviderProto,
		PatientExternalCareProviders: patientExternalCareProviders,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateExternalCareProvider(
	ctx context.Context,
	req *caremanagerpb.UpdateExternalCareProviderRequest,
) (*caremanagerpb.UpdateExternalCareProviderResponse, error) {
	_, err := server.CaremanagerDB.queries.GetPatientExternalCareProvider(ctx, req.ExternalCareProviderId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "ExternalCareProvider not found")
		}
	}
	sqlParams, err := UpdateExternalCareProviderSQLParamsFromUpdateExternalCareProviderRequestProto(req)
	if err != nil {
		return nil, err
	}

	updatedEcp, err := server.CaremanagerDB.queries.UpdateExternalCareProvider(ctx, *sqlParams)
	if err != nil {
		return nil, err
	}

	updatedExternalCareProviderProto := ExternalCareProviderProtoFromExternalCareProviderSQL(updatedEcp)

	ecps, err := server.CaremanagerDB.queries.GetPatientExternalCareProviders(
		ctx,
		updatedEcp.PatientID,
	)
	if err != nil {
		return nil, err
	}
	patientExternalCareProviders := make([]*caremanagerpb.ExternalCareProvider, len(ecps))
	for i, ecp := range ecps {
		patientExternalCareProviders[i] = ExternalCareProviderProtoFromExternalCareProviderSQL(ecp)
	}

	return &caremanagerpb.UpdateExternalCareProviderResponse{
		ExternalCareProvider:         updatedExternalCareProviderProto,
		PatientExternalCareProviders: patientExternalCareProviders,
	}, nil
}

func (server *CaremanagerGRPCServer) DeleteExternalCareProvider(
	ctx context.Context,
	req *caremanagerpb.DeleteExternalCareProviderRequest,
) (*caremanagerpb.DeleteExternalCareProviderResponse, error) {
	if req.ExternalCareProviderId == 0 {
		return nil, status.Error(codes.InvalidArgument, "ExternalCareProviderId cannot be zero")
	}
	_, err := server.CaremanagerDB.queries.GetPatientExternalCareProvider(ctx, req.ExternalCareProviderId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "ExternalCareProvider not found")
		}
	}

	deletedEcp, err := server.CaremanagerDB.queries.DeleteExternalCareProvider(ctx, req.ExternalCareProviderId)
	if err != nil {
		return nil, err
	}

	ecps, err := server.CaremanagerDB.queries.GetPatientExternalCareProviders(
		ctx,
		deletedEcp.PatientID,
	)
	if err != nil {
		return nil, err
	}

	patientExternalCareProviders := make([]*caremanagerpb.ExternalCareProvider, len(ecps))
	for i, ecp := range ecps {
		patientExternalCareProviders[i] = ExternalCareProviderProtoFromExternalCareProviderSQL(ecp)
	}

	return &caremanagerpb.DeleteExternalCareProviderResponse{
		PatientExternalCareProviders: patientExternalCareProviders,
	}, nil
}

func (server *CaremanagerGRPCServer) DuplicateEpisodeLatestVisit(
	ctx context.Context,
	req *caremanagerpb.DuplicateEpisodeLatestVisitRequest,
) (*caremanagerpb.DuplicateEpisodeLatestVisitResponse, error) {
	if req.EpisodeId < 1 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid episode_id %d", req.EpisodeId)
	}

	visit, err := server.CaremanagerDB.queries.GetEpisodeLatestVisitWithCareRequest(ctx, req.EpisodeId)
	if err != nil {
		return nil, err
	}

	careRequest, err := server.StationClient.DuplicateCareRequest(
		ctx,
		visit.CareRequestID.Int64,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.DuplicateEpisodeLatestVisitResponse{
		CareRequestId: careRequest.Id,
	}, nil
}

func (server *CaremanagerGRPCServer) validateVisitScheduling(ctx context.Context,
	careRequest *commonpb.CareRequestInfo,
	startTime, endTime int64) error {
	isCareRequestEligibleForAdvancedCare, err := server.StationClient.IsAdvancedCareAvailableForCareRequest(ctx, careRequest.Id)
	if err != nil {
		return err
	}

	if !isCareRequestEligibleForAdvancedCare {
		return ErrAdvancedCareNotElegible
	}

	err = server.StationClient.UpdateServiceLine(ctx, careRequest.Id, fmt.Sprint(advancedCareServiceLineID), nil)
	if err != nil {
		return err
	}

	result, err := server.StationClient.CheckAvailability(ctx, checkAvailabilityParams{
		CareRequestID:     careRequest.Id,
		MarketID:          *careRequest.MarketId,
		Latitude:          fmt.Sprint(float64(careRequest.Location.LatitudeE6) / 1e6),
		Longitude:         fmt.Sprint(float64(careRequest.Location.LongitudeE6) / 1e6),
		StartTimestampSec: startTime,
		EndTimestampSec:   endTime,
	})
	if err != nil {
		return err
	}

	if result.Availability != availabilityStatusAvailable {
		return ErrVisitScheduling
	}

	return nil
}

func (server *CaremanagerGRPCServer) ScheduleVisit(
	ctx context.Context,
	req *caremanagerpb.ScheduleVisitRequest,
) (*caremanagerpb.ScheduleVisitResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	careRequest, err := server.StationClient.GetCareRequest(ctx, req.CareRequestId)
	if err != nil {
		return nil, err
	}

	market, err := server.StationClient.GetMarket(ctx, *careRequest.MarketId)
	if err != nil {
		return nil, err
	}

	err = server.validateVisitScheduling(ctx, careRequest, req.PatientAvailabilityStartTime, req.PatientAvailabilityEndTime)
	if err != nil {
		return nil, err
	}

	loc, err := time.LoadLocation(market.TzName)
	if err != nil {
		return nil, err
	}

	startDate := time.Unix(req.PatientAvailabilityStartTime, 0).In(loc)
	endDate := time.Unix(req.PatientAvailabilityEndTime, 0).In(loc)

	err = server.StationClient.UpsertCareRequestETARange(ctx, upsertCareRequestETARangeParams{
		CareRequestID:       careRequest.Id,
		CareRequestStatusID: *careRequest.RequestStatus.Id,
		ArrivalTimeWindow:   TimeWindowFromTimeInterval(startDate, endDate),
	})
	if err != nil {
		return nil, err
	}

	assigmentDate := startDate.Format("2006-01-02")
	err = server.StationClient.UpdateServiceLine(ctx, careRequest.Id, fmt.Sprint(advancedCareServiceLineID), &assigmentDate)
	if err != nil {
		return nil, err
	}

	err = server.StationClient.UpdateCareRequestStatus(ctx, careRequest.Id, careRequestStatusAccepted, nil)
	if err != nil {
		return nil, err
	}

	// Scheduling is a process that involves executing several steps, as can be seen above.
	// To schedule a visit, we have so far implemented three operations:
	// 1. Check availability and AC assignability.
	// 2. Upsert the ETA ranges.
	// 3. Update the status, assignment date, and service line of a CareRequest.
	// 4. Create a Visit in CareManager.
	//
	// When 2. is executed, Station will try to call CreateVisitFromStationCR and create a Visit in CareManager.
	// Ideally, if a Visit is scheduled in CareManager, that creating process should be done by this
	// endpoint, and Station's operation would fail, given that a Visit with the same care_request_id would already
	// exist. However, there are cases where a race condition is present: 2. and 3. could take very long to finish,
	// giving time to Station to call CreateVisitFromStationCR successfully before reaching 4., causing 4. and the
	// rest of this endpoint to fail.
	//
	// To handle this scenario, we query the database to see if the Visit already exists before attempting to create it
	// upon successful scheduling. If it exists, we should just return it. Otherwise, we have the green light to insert it
	// in CareManager's DB.

	var visit *caremanagerdb.Visit
	visit, err = server.CaremanagerDB.queries.GetVisitByCareRequestId(ctx, careRequest.Id)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}

	if visit.ID != 0 {
		return &caremanagerpb.ScheduleVisitResponse{
			Visit: VisitProtoFromVisitSQL(visit),
		}, nil
	}

	statusUpdatedAt := time.Unix(*careRequest.RequestStatus.CreatedAtSec, 0)
	visit, err = server.CaremanagerDB.queries.CreateVisit(ctx, caremanagerdb.CreateVisitParams{
		CareRequestID:   sqltypes.ToNullInt64(&careRequest.Id),
		EpisodeID:       req.EpisodeId,
		Status:          sqltypes.ToNullString(careRequest.RequestStatus.Name),
		CreatedByUserID: sqltypes.ToNullInt64(&user.Id),
		StatusUpdatedAt: sqltypes.ToNullTime(&statusUpdatedAt),
	})

	if err != nil {
		return nil, err
	}

	return &caremanagerpb.ScheduleVisitResponse{
		Visit: VisitProtoFromVisitSQL(visit),
	}, nil
}

func (server *CaremanagerGRPCServer) GetVisitAvailability(
	ctx context.Context,
	req *caremanagerpb.GetVisitAvailabilityRequest,
) (*caremanagerpb.GetVisitAvailabilityResponse, error) {
	if req.CareRequestId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "invalid care_request_id %d", req.CareRequestId)
	}

	careRequest, err := server.StationClient.GetCareRequest(ctx, req.CareRequestId)
	if err != nil {
		return nil, err
	}

	isCareRequestEligibleForAdvanceCare, err := server.StationClient.IsAdvancedCareAvailableForCareRequest(ctx, careRequest.Id)
	if err != nil {
		return nil, err
	}

	if !isCareRequestEligibleForAdvanceCare {
		errMsg := fmt.Sprintf("care request %d is not eligible for Advanced Care", careRequest.Id)
		return nil, status.Errorf(codes.FailedPrecondition, errMsg)
	}

	if err := server.StationClient.UpdateServiceLine(
		ctx,
		careRequest.Id,
		strconv.Itoa(advancedCareServiceLineID),
		nil, // assigmentDate no needed for this purpose
	); err != nil {
		return nil, err
	}

	availabilityByDate := make([]*caremanagerpb.DateAvailability, len(req.RequestedDates))
	group, groupCtx := errgroup.WithContext(ctx)

	for i := 0; i < len(req.RequestedDates); i++ {
		index := i

		group.Go(func() error {
			date := req.RequestedDates[index]
			result, err := server.StationClient.CheckAvailability(groupCtx, checkAvailabilityParams{
				CareRequestID: careRequest.Id,
				MarketID:      *careRequest.MarketId,
				Latitude:      fmt.Sprint(float64(careRequest.Location.LatitudeE6) / 1e6),
				Longitude:     fmt.Sprint(float64(careRequest.Location.LongitudeE6) / 1e6),
				Date:          date,
			})
			if err != nil {
				return err
			}

			availabilityByDate[index] = &caremanagerpb.DateAvailability{
				Date: date,
			}
			if result.Availability == availabilityStatusAvailable {
				availabilityByDate[index].IsAvailable = true
			}

			return nil
		})
	}
	if err := group.Wait(); err != nil {
		return nil, err
	}

	return &caremanagerpb.GetVisitAvailabilityResponse{
		Availability: availabilityByDate,
	}, nil
}

func (server *CaremanagerGRPCServer) CanScheduleVisit(
	ctx context.Context,
	req *caremanagerpb.CanScheduleVisitRequest,
) (*caremanagerpb.CanScheduleVisitResponse, error) {
	if req.CareRequestId <= 0 {
		return nil, status.Error(codes.InvalidArgument, fmt.Sprintf("invalid care_request_id %d", req.CareRequestId))
	}

	careRequest, err := server.StationClient.GetCareRequest(ctx, req.CareRequestId)
	if err != nil {
		return nil, err
	}

	isCareRequestEligibleForAdvancedCare, err := server.StationClient.IsAdvancedCareAvailableForCareRequest(
		ctx,
		careRequest.Id,
	)
	if err != nil {
		return nil, err
	}

	if !isCareRequestEligibleForAdvancedCare {
		return &caremanagerpb.CanScheduleVisitResponse{
			Reason: caremanagerpb.UnableToScheduleReason_UNABLE_TO_SCHEDULE_REASON_ADVANCED_CARE_UNAVAILABLE,
		}, nil
	}

	err = server.StationClient.UpdateServiceLine(
		ctx,
		careRequest.Id,
		strconv.Itoa(advancedCareServiceLineID),
		nil,
	)
	if err != nil {
		return nil, err
	}

	result, err := server.StationClient.CheckAvailability(ctx, checkAvailabilityParams{
		CareRequestID:     careRequest.Id,
		MarketID:          *careRequest.MarketId,
		Latitude:          fmt.Sprint(float64(careRequest.Location.LatitudeE6) / 1e6),
		Longitude:         fmt.Sprint(float64(careRequest.Location.LongitudeE6) / 1e6),
		StartTimestampSec: req.PatientAvailabilityStartTime,
		EndTimestampSec:   req.PatientAvailabilityEndTime,
	})
	if err != nil {
		return nil, err
	}

	if result.Availability != availabilityStatusAvailable {
		return &caremanagerpb.CanScheduleVisitResponse{
			Reason: caremanagerpb.UnableToScheduleReason_UNABLE_TO_SCHEDULE_REASON_VISIT_TIME_SLOT_UNAVAILABLE,
		}, nil
	}

	return &caremanagerpb.CanScheduleVisitResponse{
		CanScheduleVisit: true,
	}, nil
}

func (server *CaremanagerGRPCServer) CancelVisit(
	ctx context.Context,
	req *caremanagerpb.CancelVisitRequest,
) (*caremanagerpb.CancelVisitResponse, error) {
	if err := server.StationClient.UpdateCareRequestStatus(
		ctx,
		req.CareRequestId,
		careRequestStatusArchived,
		nil,
	); err != nil {
		return nil, err
	}

	return &caremanagerpb.CancelVisitResponse{}, nil
}

func (server *CaremanagerGRPCServer) validateStatusChangeInServiceRequest(ctx context.Context, newStatusID *int64, serviceRequest *caremanagerdb.ServiceRequest) error {
	if newStatusID == nil {
		return nil
	}

	fromStatus, err := server.CaremanagerDB.queries.GetServiceRequestStatus(ctx, serviceRequest.StatusID)
	if err != nil {
		return err
	}

	if !fromStatus.IsActive {
		return status.Errorf(codes.InvalidArgument, "ServiceRequest status is not active anymore")
	}

	_, err = server.CaremanagerDB.queries.GetServiceRequestStatus(ctx, *newStatusID)

	return err
}

func (server *CaremanagerGRPCServer) executeUpdateServiceRequestQuery(
	ctx context.Context,
	params caremanagerdb.UpdateServiceRequestParams,
) (*caremanagerdb.ServiceRequest, error) {
	serviceRequest, err := server.CaremanagerDB.queries.GetServiceRequest(ctx, params.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "no ServiceRequest was found")
		}
		return nil, err
	}

	if params.StatusID.Valid {
		err = server.validateStatusChangeInServiceRequest(ctx, &params.StatusID.Int64, serviceRequest)
		if err != nil {
			return nil, err
		}
	}

	if params.IsInsuranceVerified.Valid &&
		!params.IsInsuranceVerified.Bool {
		params.CmsNumber = sqltypes.ToValidNullString("")
	}

	return server.CaremanagerDB.queries.UpdateServiceRequest(ctx, params)
}

func (server *CaremanagerGRPCServer) UpdateServiceRequest(
	ctx context.Context,
	req *caremanagerpb.UpdateServiceRequestRequest,
) (*caremanagerpb.UpdateServiceRequestResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	updateServiceRequestParams := UpdateServiceRequestSQLParamsFromUpdateServiceRequestProto(req, user.Id)
	serviceRequest, err := server.executeUpdateServiceRequestQuery(ctx, updateServiceRequestParams)
	if err != nil {
		return nil, err
	}

	serviceRequestProto := ServiceRequestProtoFromServiceRequestSQL(serviceRequest)
	return &caremanagerpb.UpdateServiceRequestResponse{
		ServiceRequest: &serviceRequestProto,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateEHRAppointment(
	ctx context.Context,
	req *caremanagerpb.CreateEHRAppointmentRequest,
) (*caremanagerpb.CreateEHRAppointmentResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	appointmentID, err := server.StationClient.CreateEHRAppointment(
		ctx,
		createEHRAppointmentParams{
			CareRequestID:             visit.CareRequestID.Int64,
			AppointmentType:           req.Appointment.AppointmentType,
			AppointmentDate:           req.Appointment.Date,
			AppointmentPlaceOfService: req.Appointment.PlaceOfService,
			AppointmentStartTime:      req.Appointment.StartTime,
		},
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.CreateEHRAppointmentResponse{
		AppointmentId: appointmentID,
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateEHRAppointment(
	ctx context.Context,
	req *caremanagerpb.UpdateEHRAppointmentRequest,
) (*caremanagerpb.UpdateEHRAppointmentResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	appointmentID, err := server.StationClient.UpdateEHRAppointment(
		ctx,
		updateEHRAppointmentParams{
			CareRequestID:             visit.CareRequestID.Int64,
			AppointmentType:           req.Appointment.AppointmentType,
			AppointmentPlaceOfService: req.Appointment.PlaceOfService,
		},
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UpdateEHRAppointmentResponse{
		AppointmentId: appointmentID,
	}, nil
}

func (server *CaremanagerGRPCServer) AssignVirtualAPP(
	ctx context.Context,
	req *caremanagerpb.AssignVirtualAPPRequest,
) (*caremanagerpb.AssignVirtualAPPResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	err = server.StationClient.AssignVirtualAPP(
		ctx,
		visit.CareRequestID.Int64,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.AssignVirtualAPPResponse{}, nil
}

func (server *CaremanagerGRPCServer) UnassignVirtualAPP(
	ctx context.Context,
	req *caremanagerpb.UnassignVirtualAPPRequest,
) (*caremanagerpb.UnassignVirtualAPPResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	err = server.StationClient.UnassignVirtualAPP(
		ctx,
		visit.CareRequestID.Int64,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UnassignVirtualAPPResponse{}, nil
}

func (server *CaremanagerGRPCServer) GetServiceRequestStatus(
	ctx context.Context,
	req *caremanagerpb.GetServiceRequestStatusRequest,
) (*caremanagerpb.GetServiceRequestStatusResponse, error) {
	serviceRequestStatuses, err := server.CaremanagerDB.queries.GetAllServiceRequestStatus(ctx)
	if err != nil {
		return nil, err
	}

	statusProtos := make([]*caremanagerpb.ServiceRequestStatus, len(serviceRequestStatuses))
	for i, srs := range serviceRequestStatuses {
		statusProtos[i] = ServiceRequestStatusProtoFromServiceRequestStatusSQL(srs)
	}

	return &caremanagerpb.GetServiceRequestStatusResponse{
		ServiceRequestStatus: statusProtos,
	}, nil
}

func (server *CaremanagerGRPCServer) RejectServiceRequest(
	ctx context.Context,
	req *caremanagerpb.RejectServiceRequestRequest,
) (*caremanagerpb.RejectServiceRequestResponse, error) {
	user, err := server.StationClient.GetAuthenticatedUser(ctx)
	if err != nil {
		return nil, err
	}

	rejectedStatus, err := server.CaremanagerDB.queries.GetServiceRequestStatusByName(ctx, "Rejected")
	if err != nil {
		return nil, err
	}

	rejectServiceRequestParams := RejectServiceRequestSQLParamsFromRejectServiceRequestProto(req, user.Id, rejectedStatus.ID)
	updatedServiceRequest, err := server.executeUpdateServiceRequestQuery(ctx, rejectServiceRequestParams)
	if err != nil {
		return nil, err
	}

	serviceRequesProto := ServiceRequestProtoFromServiceRequestSQL(updatedServiceRequest)
	return &caremanagerpb.RejectServiceRequestResponse{
		ServiceRequest: &serviceRequesProto,
	}, nil
}

func (server *CaremanagerGRPCServer) CreateVisitNote(
	ctx context.Context,
	req *caremanagerpb.CreateVisitNoteRequest,
) (*caremanagerpb.CreateVisitNoteResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	note, err := server.StationClient.CreateNote(
		ctx,
		createNoteParams{
			CareRequestID: visit.CareRequestID.Int64,
			Details:       req.Details,
		},
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.CreateVisitNoteResponse{
		Note: VisitNoteProtoFromStationNote(note),
	}, nil
}

func (server *CaremanagerGRPCServer) UpdateVisitNote(
	ctx context.Context,
	req *caremanagerpb.UpdateVisitNoteRequest,
) (*caremanagerpb.UpdateVisitNoteResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}
	if req.NoteId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidNoteID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	note, err := server.StationClient.UpdateNote(
		ctx,
		updateNoteParams{
			CareRequestID: visit.CareRequestID.Int64,
			NoteID:        req.NoteId,
			Details:       req.Details,
			Pinned:        req.Pinned,
		},
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.UpdateVisitNoteResponse{
		Note: VisitNoteProtoFromStationNote(note),
	}, nil
}

func (server *CaremanagerGRPCServer) DeleteVisitNote(
	ctx context.Context,
	req *caremanagerpb.DeleteVisitNoteRequest,
) (*caremanagerpb.DeleteVisitNoteResponse, error) {
	if req.VisitId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidVisitID)
	}
	if req.NoteId < 1 {
		return nil, status.Error(codes.InvalidArgument, ErrInvalidNoteID)
	}

	visit, err := server.CaremanagerDB.queries.GetVisit(ctx, req.VisitId)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	err = server.StationClient.DeleteNote(
		ctx,
		deleteNoteParams{
			CareRequestID: visit.CareRequestID.Int64,
			NoteID:        req.NoteId,
		},
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.DeleteVisitNoteResponse{}, nil
}

func filterScheduledVisits(virtualAPPVisits []*caremanagerpb.VirtualAPPVisit, scheduledCareRequestIDs []int64) []*caremanagerpb.VirtualAPPVisit {
	scheduledVisits := []*caremanagerpb.VirtualAPPVisit{}

	for _, virtualAPPVisit := range virtualAPPVisits {
		if slices.Contains(scheduledCareRequestIDs, *virtualAPPVisit.Visit.CareRequestId) {
			scheduledVisits = append(scheduledVisits, virtualAPPVisit)
		}
	}

	return scheduledVisits
}

func filterAssignableVisits(virtualAPPVisits []*caremanagerpb.VirtualAPPVisit, assignableCareRequestIDs []int64) []*caremanagerpb.VirtualAPPVisit {
	assignableVisits := []*caremanagerpb.VirtualAPPVisit{}

	for _, virtualAPPVisit := range virtualAPPVisits {
		if slices.Contains(assignableCareRequestIDs, *virtualAPPVisit.Visit.CareRequestId) && virtualAPPVisit.Visit.GetVirtualAppId() == 0 {
			assignableVisits = append(assignableVisits, virtualAPPVisit)
		}
	}

	return assignableVisits
}

func filterAssignedVisits(virtualAPPVisits []*caremanagerpb.VirtualAPPVisit, virtualAPPID int64) []*caremanagerpb.VirtualAPPVisit {
	assignedVisits := []*caremanagerpb.VirtualAPPVisit{}

	for _, virtualAPPVisit := range virtualAPPVisits {
		if virtualAPPVisit.Visit.GetVirtualAppId() == virtualAPPID {
			assignedVisits = append(assignedVisits, virtualAPPVisit)
		}
	}

	return assignedVisits
}

func (server *CaremanagerGRPCServer) GetVirtualAPPVisitsQueue(
	ctx context.Context,
	req *caremanagerpb.GetVirtualAPPVisitsQueueRequest,
) (*caremanagerpb.GetVirtualAPPVisitsQueueResponse, error) {
	if req.UserId <= 0 {
		return nil, status.Error(codes.InvalidArgument, "UserId is invalid")
	}
	if req.ShiftTeamId <= 0 {
		return nil, status.Error(codes.InvalidArgument, "ShiftTeamId is invalid")
	}
	if len(req.MarketIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "MarketIds is empty")
	}

	shiftTeams, err := server.StationClient.ListSoloDHMTShiftTeams(ctx, req.MarketIds)
	if err != nil {
		return nil, err
	}

	soloDHMTShiftTeamIds := make([]int64, len(shiftTeams))
	for i, shiftTeam := range shiftTeams {
		soloDHMTShiftTeamIds[i] = shiftTeam.Id
	}

	timeNow := time.Now()
	todayDate := protoconv.TimeToProtoDate(&timeNow)
	scheduledCareRequestIDs := []int64{}
	for _, marketID := range req.MarketIds {
		schedulesResponse, err := server.LogisticsClient.GetServiceRegionSchedule(ctx, &logisticspb.GetServiceRegionScheduleRequest{MarketId: proto.Int64(marketID)})
		if err != nil {
			return nil, err
		}

		for _, dateSchedule := range schedulesResponse.GetDateSchedules() {
			serviceDate := dateSchedule.GetMeta().GetServiceDate()
			if serviceDate == nil {
				serviceDate = dateSchedule.GetServiceDate()
			}
			if proto.Equal(todayDate, serviceDate) {
				for _, schedule := range dateSchedule.GetSchedules() {
					if slices.Contains(soloDHMTShiftTeamIds, schedule.GetShiftTeamId()) {
						for _, stop := range schedule.GetRoute().GetStops() {
							if visit := stop.GetVisit(); visit != nil {
								scheduledCareRequestIDs = append(scheduledCareRequestIDs, visit.GetCareRequestId())
							}
						}
					}
				}
			}
		}
	}

	shiftTeamResponse, err := server.StationClient.shiftTeamService.GetShiftTeam(ctx, &shiftteampb.GetShiftTeamRequest{
		Id: req.ShiftTeamId,
	})
	if err != nil {
		return nil, err
	}

	shiftTeam := shiftTeamResponse.ShiftTeam

	assignableVisits, err := server.LogisticsClient.GetAssignableVisits(ctx, &logisticspb.GetAssignableVisitsRequest{
		MarketIds: req.MarketIds,
		VisitPhases: []logisticspb.VisitPhase{
			logisticspb.VisitPhase_VISIT_PHASE_EN_ROUTE,
			logisticspb.VisitPhase_VISIT_PHASE_ON_SCENE,
		},
		VirtualAppVisitPhases: []logisticspb.VirtualAPPVisitPhase{
			logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_UNASSIGNED,
			logisticspb.VirtualAPPVisitPhase_VIRTUAL_APP_VISIT_PHASE_VIRTUAL_APP_ASSIGNED,
		},
		ShiftTeamAttributes: shiftTeam.ShiftTeamAttributes,
		TimeWindow:          shiftTeam.ShiftTimeWindow,
	})
	if err != nil {
		return nil, err
	}

	assignableCareRequestIDs := []int64{}
	for _, visits := range assignableVisits.Visits {
		assignableCareRequestIDs = append(assignableCareRequestIDs, visits.CareRequestId)
	}

	dbVisits, err := server.CaremanagerDB.queries.GetVisitsByCareRequestIDs(ctx, append(scheduledCareRequestIDs, assignableCareRequestIDs...))
	if err != nil {
		return nil, err
	}

	visits := make([]*caremanagerpb.VirtualAPPVisit, len(dbVisits))
	for i, visit := range dbVisits {
		visits[i] = &caremanagerpb.VirtualAPPVisit{
			Visit: VisitProtoFromVisitSQL(visit),
		}
	}

	return &caremanagerpb.GetVirtualAPPVisitsQueueResponse{
		Scheduled: filterScheduledVisits(visits, scheduledCareRequestIDs),
		Available: filterAssignableVisits(visits, assignableCareRequestIDs),
		Assigned:  filterAssignedVisits(visits, req.UserId),
	}, nil
}

func (server *CaremanagerGRPCServer) GetServiceRequest(
	ctx context.Context,
	req *caremanagerpb.GetServiceRequestRequest,
) (*caremanagerpb.GetServiceRequestResponse, error) {
	serviceRequest, err := server.CaremanagerDB.queries.GetServiceRequest(ctx, req.ServiceRequestId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "no ServiceRequest was found")
		}
		return nil, err
	}

	visitRequest := GetVisitRequestFromServiceRequestSQL(serviceRequest)
	careRequestDetails, err := server.StationClient.GetCareRequestDetails(
		ctx,
		visitRequest,
	)
	if err != nil {
		return nil, err
	}

	protoServiceRequest := ServiceRequestProtoFromServiceRequestSQL(serviceRequest)

	return &caremanagerpb.GetServiceRequestResponse{
		ServiceRequest:     &protoServiceRequest,
		StationCareRequest: careRequestDetails.careRequest,
		StationPatient:     careRequestDetails.patient,
	}, nil
}

func (server *CaremanagerGRPCServer) ListCarsByIDs(
	ctx context.Context,
	req *caremanagerpb.ListCarsByIDsRequest,
) (*caremanagerpb.ListCarsByIDsResponse, error) {
	if len(req.CarIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "CarIDs can not be empty")
	}

	cars, err := server.StationClient.ListCarsByIDs(
		ctx,
		req.CarIds,
	)
	if err != nil {
		return nil, err
	}

	return &caremanagerpb.ListCarsByIDsResponse{
		Cars: cars,
	}, nil
}

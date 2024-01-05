package main

import (
	"context"
	"net/http"
	"net/url"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type DBService any

type GRPCServer struct {
	athenapb.UnimplementedAthenaServiceServer
	AuthToken                       auth.Valuer
	AthenaClient                    athena.ClientAPI
	DBService                       DBService
	RedisClient                     *redisclient.Client
	StatsigProvider                 *providers.StatsigProvider
	Logger                          *zap.SugaredLogger
	EnableInsuranceEligibilityCheck bool
}

const (
	departmentIDEmptyErrorMessage       = "departmentId is empty"
	clinicalProviderIDEmptyErrorMessage = "clinicalProviderId is empty"
	encounterIDEmptyErrorMessage        = "encounterId is empty"
	orderIDEmptyErrorMessage            = "orderId is empty"
	discussionNotesEmptyErrorMessage    = "discussion notes is empty"
	dateOfServiceEmptyErrorMessage      = "dateOfService is empty"
	serviceTypeCodeEmptyErrorMessage    = "serviceTypeCode is empty"
)

func (s *GRPCServer) GetPatient(ctx context.Context, request *athenapb.GetPatientRequest) (*athenapb.GetPatientResponse, error) {
	patientID := request.GetPatientId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, "patientID is empty")
	}
	patientProto, err := s.AthenaClient.GetPatient(ctx, patientID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetPatientResponse{Patient: patientProto}, nil
}

func (s *GRPCServer) EnhancedBestMatch(ctx context.Context, request *athenapb.EnhancedBestMatchRequest) (*athenapb.EnhancedBestMatchResponse, error) {
	if request.FirstName == "" {
		return nil, status.Error(codes.InvalidArgument, "first name is empty")
	}
	if request.LastName == "" {
		return nil, status.Error(codes.InvalidArgument, "last name is empty")
	}
	if request.DateOfBirth == nil {
		return nil, status.Error(codes.InvalidArgument, "date of birth is empty")
	}
	enhancedBestMatchRequest, err := converters.ProtoToEnhancedBestMatchRequest(request)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Failed to convert proto to enhancedbestmatch. err: %s", err)
	}

	results, err := s.AthenaClient.EnhancedBestMatch(ctx, enhancedBestMatchRequest)
	if err != nil {
		return nil, err
	}
	return &athenapb.EnhancedBestMatchResponse{Results: results}, nil
}

func (s *GRPCServer) UpdateDefaultPharmacy(ctx context.Context, request *athenapb.UpdateDefaultPharmacyRequest) (*athenapb.UpdateDefaultPharmacyResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()
	clinicalProviderID := request.GetClinicalProviderId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	if clinicalProviderID == "" {
		return nil, status.Error(codes.InvalidArgument, clinicalProviderIDEmptyErrorMessage)
	}

	err := s.AthenaClient.UpdateDefaultPharmacy(ctx, patientID, departmentID, clinicalProviderID)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdateDefaultPharmacyResponse{}, nil
}

func (s *GRPCServer) GetPreferredPharmacies(ctx context.Context, request *athenapb.GetPreferredPharmaciesRequest) (*athenapb.GetPreferredPharmaciesResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	pharmacies, err := s.AthenaClient.GetPreferredPharmacies(ctx, patientID, departmentID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetPreferredPharmaciesResponse{Pharmacies: pharmacies}, nil
}

func (s *GRPCServer) UpdatePreferredPharmacy(ctx context.Context, request *athenapb.UpdatePreferredPharmacyRequest) (*athenapb.UpdatePreferredPharmacyResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()
	clinicalProviderID := request.GetClinicalProviderId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	if clinicalProviderID == "" {
		return nil, status.Error(codes.InvalidArgument, clinicalProviderIDEmptyErrorMessage)
	}

	err := s.AthenaClient.UpdatePreferredPharmacy(ctx, patientID, departmentID, clinicalProviderID)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdatePreferredPharmacyResponse{}, nil
}

func (s *GRPCServer) GetDefaultPharmacy(ctx context.Context, request *athenapb.GetDefaultPharmacyRequest) (*athenapb.GetDefaultPharmacyResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	pharmacy, err := s.AthenaClient.GetDefaultPharmacy(ctx, patientID, departmentID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetDefaultPharmacyResponse{Pharmacy: pharmacy}, nil
}

func (s *GRPCServer) DeletePreferredPharmacy(ctx context.Context, request *athenapb.DeletePreferredPharmacyRequest) (*athenapb.DeletePreferredPharmacyResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()
	clinicalProviderID := request.GetClinicalProviderId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	if clinicalProviderID == "" {
		return nil, status.Error(codes.InvalidArgument, clinicalProviderIDEmptyErrorMessage)
	}

	err := s.AthenaClient.DeletePreferredPharmacy(ctx, patientID, departmentID, clinicalProviderID)
	if err != nil {
		return nil, err
	}
	return &athenapb.DeletePreferredPharmacyResponse{}, nil
}

func httpResponseModifier(ctx context.Context, w http.ResponseWriter, _ proto.Message) error {
	md, ok := runtime.ServerMetadataFromContext(ctx)
	if !ok {
		return nil
	}

	values := md.HeaderMD.Get("x-http-code")

	if len(values) > 0 {
		code, err := strconv.Atoi(values[0])
		if err != nil {
			return err
		}

		// Delete the headers to not expose any grpc-metadata in http response.
		delete(md.HeaderMD, "x-http-code")
		delete(w.Header(), "Grpc-Metadata-X-Http-Code")
		w.WriteHeader(code)
	}

	return nil
}

func (s *GRPCServer) GetCareTeam(ctx context.Context, r *athenapb.GetCareTeamRequest) (*athenapb.GetCareTeamResponse, error) {
	patientID, departmentID := r.GetPatientId(), r.GetDepartmentId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, "department id is empty")
	}

	members, note, err := s.AthenaClient.GetCareTeam(ctx, patientID, departmentID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetCareTeamResponse{
		Members: members,
		Note:    note,
	}, nil
}

func (s *GRPCServer) CreatePatient(ctx context.Context, request *athenapb.CreatePatientRequest) (*athenapb.CreatePatientResponse, error) {
	patient := request.GetPatient()
	if patient == nil {
		return nil, status.Error(codes.InvalidArgument, "patient is empty")
	}
	if patient.GetDepartmentId() == "" {
		return nil, status.Error(codes.InvalidArgument, "department id is empty")
	}
	if patient.Name.GetGivenName() == "" {
		return nil, status.Error(codes.InvalidArgument, "patient given_name is empty")
	}
	if patient.Name.GetFamilyName() == "" {
		return nil, status.Error(codes.InvalidArgument, "patient family_name is empty")
	}
	if patient.GetDateOfBirth() == nil {
		return nil, status.Error(codes.InvalidArgument, "patient date_of_birth is empty")
	}
	patientID, err := s.AthenaClient.CreatePatient(ctx, patient)
	if err != nil {
		return nil, err
	}
	return &athenapb.CreatePatientResponse{PatientId: patientID}, nil
}

func (s *GRPCServer) UpdateCareTeam(ctx context.Context, r *athenapb.UpdateCareTeamRequest) (*athenapb.UpdateCareTeamResponse, error) {
	patientID := r.GetPatientId()
	clinicalProviderID := r.GetClinicalProviderId()
	departmentID := r.GetDepartmentId()
	recipientClassID := r.GetRecipientClassId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if clinicalProviderID == "" {
		return nil, status.Error(codes.InvalidArgument, "clinical provider id is empty")
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, "department id is empty")
	}

	if recipientClassID == "" {
		return nil, status.Error(codes.InvalidArgument, "recipient class id is empty")
	}

	err := s.AthenaClient.UpdateCareTeam(ctx, patientID, clinicalProviderID, departmentID, recipientClassID)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdateCareTeamResponse{}, nil
}

func (s *GRPCServer) UpdatePatient(ctx context.Context, request *athenapb.UpdatePatientRequest) (*athenapb.UpdatePatientResponse, error) {
	patient := request.GetPatient()
	if patient == nil {
		return nil, status.Error(codes.InvalidArgument, "patient is empty")
	}
	if patient.GetPatientId() == "" {
		return nil, status.Error(codes.InvalidArgument, "patient_id is empty")
	}
	patientID, err := s.AthenaClient.UpdatePatient(ctx, patient)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdatePatientResponse{PatientId: patientID}, nil
}

func (s *GRPCServer) DeleteCareTeam(ctx context.Context, r *athenapb.DeleteCareTeamRequest) (*athenapb.DeleteCareTeamResponse, error) {
	patientID := r.GetPatientId()
	memberID := r.GetMemberId()
	departmentID := r.GetDepartmentId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if memberID == "" {
		return nil, status.Error(codes.InvalidArgument, "member id is empty")
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, "department id is empty")
	}

	err := s.AthenaClient.DeleteCareTeam(ctx, patientID, memberID, departmentID)
	if err != nil {
		return nil, err
	}

	return &athenapb.DeleteCareTeamResponse{}, nil
}

func (s *GRPCServer) CreatePatientInsurance(ctx context.Context, request *athenapb.CreatePatientInsuranceRequest) (*athenapb.CreatePatientInsuranceResponse, error) {
	insurance := request.GetInsuranceRecord()
	if insurance == nil {
		return nil, status.Error(codes.InvalidArgument, "insurance data is empty")
	}
	if insurance.PatientId == nil {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}
	if insurance.PackageId == nil {
		return nil, status.Error(codes.InvalidArgument, "insurance package id is empty")
	}
	r, err := s.AthenaClient.CreatePatientInsurance(ctx, insurance)
	if err != nil {
		return nil, err
	}
	return &athenapb.CreatePatientInsuranceResponse{InsuranceRecord: r}, nil
}

func (s *GRPCServer) GetPatientInsurance(ctx context.Context, request *athenapb.GetPatientInsuranceRequest) (*athenapb.GetPatientInsuranceResponse, error) {
	patientID := request.GetPatientId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}
	records, err := s.AthenaClient.GetPatientInsurances(ctx, patientID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetPatientInsuranceResponse{InsuranceRecord: records}, nil
}

func (s *GRPCServer) UpdatePatientInsurance(ctx context.Context, request *athenapb.UpdatePatientInsuranceRequest) (*athenapb.UpdatePatientInsuranceResponse, error) {
	insurance := request.GetInsuranceRecord()
	if insurance == nil {
		return nil, status.Error(codes.InvalidArgument, "insurance data is empty")
	}
	if insurance.PatientId == nil {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}
	if insurance.InsuranceId == nil {
		return nil, status.Error(codes.InvalidArgument, insuranceIDEmptyErrorMessage)
	}
	err := s.AthenaClient.UpdateSpecificInsurance(ctx, insurance)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdatePatientInsuranceResponse{}, nil
}

func (s *GRPCServer) DeletePatientSpecificInsurance(ctx context.Context, request *athenapb.DeletePatientSpecificInsuranceRequest) (*athenapb.DeletePatientSpecificInsuranceResponse, error) {
	patientID := request.GetPatientId()
	insuranceID := request.GetInsuranceId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}
	if insuranceID == "" {
		return nil, status.Error(codes.InvalidArgument, insuranceIDEmptyErrorMessage)
	}
	err := s.AthenaClient.DeleteSpecificInsurance(ctx, patientID, insuranceID)
	if err != nil {
		return nil, err
	}
	return &athenapb.DeletePatientSpecificInsuranceResponse{}, nil
}

func (s *GRPCServer) SearchClinicalProviders(ctx context.Context, r *athenapb.SearchClinicalProvidersRequest) (*athenapb.SearchClinicalProvidersResponse, error) {
	if r == nil {
		return nil, status.Error(codes.InvalidArgument, "search clinical providers request is empty")
	}
	clinicalProviderRequest, err := converters.ProtoToClinicalProvider(r)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Failed to convert proto to clinical provider: %s", err)
	}

	providers, err := s.AthenaClient.SearchClinicalProviders(ctx, clinicalProviderRequest)
	if err != nil {
		return nil, err
	}
	return &athenapb.SearchClinicalProvidersResponse{
		ClinicalProviders: providers,
	}, nil
}

func (s *GRPCServer) UpdatePatientDiscussionNotes(ctx context.Context, request *athenapb.UpdatePatientDiscussionNotesRequest) (*athenapb.UpdatePatientDiscussionNotesResponse, error) {
	encounterID := request.GetEncounterId()
	discussionNotes := request.GetDiscussionNotes()
	replaceDiscussionNotes := request.GetReplaceDiscussionNotes()

	if encounterID == "" {
		return nil, status.Error(codes.InvalidArgument, encounterIDEmptyErrorMessage)
	}

	if discussionNotes == "" {
		return nil, status.Error(codes.InvalidArgument, discussionNotesEmptyErrorMessage)
	}

	notes, err := s.AthenaClient.UpdatePatientDiscussionNotes(ctx, encounterID, discussionNotes, replaceDiscussionNotes)
	if err != nil {
		return nil, err
	}
	return &athenapb.UpdatePatientDiscussionNotesResponse{DiscussionNotes: *notes}, nil
}

func (s *GRPCServer) ListPatientLabResults(ctx context.Context, request *athenapb.ListPatientLabResultsRequest) (*athenapb.ListPatientLabResultsResponse, error) {
	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()
	encounterID := request.GetEncounterId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if departmentID == "" {
		return nil, status.Error(codes.InvalidArgument, departmentIDEmptyErrorMessage)
	}

	if encounterID == "" {
		return nil, status.Error(codes.InvalidArgument, encounterIDEmptyErrorMessage)
	}

	results, err := s.AthenaClient.ListPatientLabResults(ctx, patientID, departmentID, encounterID)
	if err != nil {
		return nil, err
	}
	return &athenapb.ListPatientLabResultsResponse{Results: results}, nil
}

func (s *GRPCServer) ListRecipientClasses(ctx context.Context, request *athenapb.ListRecipientClassesRequest) (*athenapb.ListRecipientClassesResponse, error) {
	response, err := s.AthenaClient.ListRecipientClasses(ctx, request.Limit, request.Offset)
	if err != nil {
		return nil, err
	}

	results := make([]*athenapb.RecipientClass, len(response.RecipientClasses))
	for i, athenaRecipientClass := range response.RecipientClasses {
		results[i] = converters.AthenaRecipientClassToProto(&athenaRecipientClass)
	}
	return &athenapb.ListRecipientClassesResponse{RecipientClasses: results}, nil
}

func (s *GRPCServer) ListChangedPatients(ctx context.Context, request *athenapb.ListChangedPatientsRequest) (*athenapb.ListChangedPatientsResponse, error) {
	params := url.Values{"showpreviouspatientids": []string{"true"}}
	if request.LeaveUnprocessed != nil {
		params.Set("leaveunprocessed", strconv.FormatBool(*request.LeaveUnprocessed))
	}
	if request.ShowProcessedStartDatetime != nil {
		params.Set("showprocessedstartdatetime", *request.ShowProcessedStartDatetime)
	}
	if request.ShowProcessedEndDatetime != nil {
		params.Set("showprocessedenddatetime", *request.ShowProcessedEndDatetime)
	}
	if request.Limit != nil {
		params.Set("limit", strconv.Itoa(int(*request.Limit)))
	}
	if request.Offset != nil {
		params.Set("offset", strconv.Itoa(int(*request.Offset)))
	}

	changedPatients, err := s.AthenaClient.ListChangedPatients(ctx, params)
	if err != nil {
		return nil, err
	}

	results := make([]*athenapb.ListChangedPatientsResult, len(changedPatients.Patients))
	for i, cp := range changedPatients.Patients {
		results[i] = &athenapb.ListChangedPatientsResult{
			DepartmentId:       cp.DepartmentID,
			PatientId:          cp.PatientID,
			PreviousPatientIds: cp.PreviousPatientIDs,
		}
	}

	return &athenapb.ListChangedPatientsResponse{Results: results}, nil
}

func (s *GRPCServer) ListChangedLabResults(ctx context.Context, request *athenapb.ListChangedLabResultsRequest) (*athenapb.ListChangedLabResultsResponse, error) {
	params := url.Values{}
	if request.ShowProcessedStartDatetime != nil {
		params.Set("showprocessedstartdatetime", *request.ShowProcessedStartDatetime)
	}
	if request.ShowProcessedEndDatetime != nil {
		params.Set("showprocessedenddatetime", *request.ShowProcessedEndDatetime)
	}
	if request.LeaveUnprocessed != nil {
		params.Set("leaveunprocessed", strconv.FormatBool(*request.LeaveUnprocessed))
	}
	if request.Limit != nil {
		params.Set("limit", strconv.Itoa(int(*request.Limit)))
	}
	if request.Offset != nil {
		params.Set("offset", strconv.Itoa(int(*request.Offset)))
	}

	changedLabResults, err := s.AthenaClient.ListChangedLabResults(ctx, params)
	if err != nil {
		return nil, err
	}

	results := make([]*athenapb.ListChangedLabResultsResult, len(changedLabResults.LabResults))
	for i, cp := range changedLabResults.LabResults {
		results[i] = &athenapb.ListChangedLabResultsResult{
			LabResultId:  cp.LabResultID,
			DepartmentId: cp.DepartmentID,
			EncounterId:  cp.EncounterID,
			PatientId:    cp.PatientID,
		}
	}

	return &athenapb.ListChangedLabResultsResponse{Results: results}, nil
}

func (s *GRPCServer) CheckLabResultsSubscriptionStatus(
	ctx context.Context, request *athenapb.CheckLabResultsSubscriptionStatusRequest) (*athenapb.CheckLabResultsSubscriptionStatusResponse, error) {
	statusStr, err := s.AthenaClient.CheckLabResultsSubscriptionStatus(ctx)
	if err != nil {
		return nil, err
	}

	return &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: converters.StatusChangeSubscriptionToEnum(statusStr)}, nil
}

func (s *GRPCServer) SubscribeLabResultEvents(ctx context.Context, _ *athenapb.SubscribeLabResultEventsRequest) (*athenapb.SubscribeLabResultEventsResponse, error) {
	err := s.AthenaClient.SubscribeLabResultEvents(ctx)
	if err != nil {
		return nil, err
	}
	return &athenapb.SubscribeLabResultEventsResponse{}, nil
}

func (s *GRPCServer) CheckPatientsSubscriptionStatus(
	ctx context.Context, request *athenapb.CheckPatientsSubscriptionStatusRequest) (*athenapb.CheckPatientsSubscriptionStatusResponse, error) {
	statusStr, err := s.AthenaClient.CheckPatientsSubscriptionStatus(ctx)
	if err != nil {
		return nil, err
	}

	return &athenapb.CheckPatientsSubscriptionStatusResponse{Status: converters.StatusChangeSubscriptionToEnum(statusStr)}, nil
}

func (s *GRPCServer) SubscribePatientEvents(ctx context.Context, _ *athenapb.SubscribePatientEventsRequest) (*athenapb.SubscribePatientEventsResponse, error) {
	err := s.AthenaClient.SubscribePatientEvents(ctx)
	if err != nil {
		return nil, err
	}
	return &athenapb.SubscribePatientEventsResponse{}, nil
}

func (s *GRPCServer) SearchPatients(ctx context.Context, request *athenapb.SearchPatientsRequest) (*athenapb.SearchPatientsResponse, error) {
	if request == nil || request.SearchTerm == "" {
		return nil, status.Error(codes.InvalidArgument, "search patients request is empty")
	}

	patientsSearchResults, err := s.AthenaClient.SearchPatients(ctx, request.SearchTerm)
	if err != nil {
		return nil, err
	}

	return &athenapb.SearchPatientsResponse{
		Results: patientsSearchResults,
	}, nil
}

func (s *GRPCServer) GetPatientLabResultDocument(ctx context.Context, r *athenapb.GetPatientLabResultDocumentRequest) (*athenapb.GetPatientLabResultDocumentResponse, error) {
	patientID, labResultID := r.GetPatientId(), r.GetLabResultId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if labResultID == "" {
		return nil, status.Error(codes.InvalidArgument, "lab result id is empty")
	}

	labResultDocuments, err := s.AthenaClient.GetPatientLabResultDocument(ctx, patientID, labResultID)
	if err != nil {
		return nil, err
	}
	return &athenapb.GetPatientLabResultDocumentResponse{
		Results: labResultDocuments,
	}, nil
}

func (s *GRPCServer) GetPatientInsuranceBenefitDetails(ctx context.Context, request *athenapb.GetPatientInsuranceBenefitDetailsRequest) (*athenapb.GetPatientInsuranceBenefitDetailsResponse, error) {
	patientID := request.GetPatientId()
	insuranceID := request.GetInsuranceId()
	serviceTypeCode := request.GetServiceTypeCode()
	dateOfService := request.GetDateOfService()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if insuranceID == "" {
		return nil, status.Error(codes.InvalidArgument, insuranceIDEmptyErrorMessage)
	}

	insuranceBenefitDetails, err := s.AthenaClient.GetPatientInsuranceBenefitDetails(ctx, patientID, insuranceID, serviceTypeCode, dateOfService)
	if err != nil {
		return nil, err
	}

	return &athenapb.GetPatientInsuranceBenefitDetailsResponse{Details: insuranceBenefitDetails}, nil
}

func (s *GRPCServer) TriggerPatientInsuranceEligibilityCheck(ctx context.Context, request *athenapb.TriggerPatientInsuranceEligibilityCheckRequest) (*athenapb.TriggerPatientInsuranceEligibilityCheckResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *insuranceEligibilityCheckTimeout)
	defer cancel()

	patientID := request.GetPatientId()
	insuranceID := request.GetInsuranceId()
	dateOfService := request.GetDateOfService()
	serviceTypeCode := request.GetServiceTypeCode()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	if insuranceID == "" {
		return nil, status.Error(codes.InvalidArgument, insuranceIDEmptyErrorMessage)
	}

	if !s.EnableInsuranceEligibilityCheck {
		return nil, status.Error(codes.Unimplemented, "insurance eligibility check is disabled for this environment")
	}

	err := s.AthenaClient.TriggerPatientInsuranceEligibilityCheck(ctx, patientID, insuranceID, serviceTypeCode, dateOfService)
	if err != nil {
		return nil, err
	}

	return &athenapb.TriggerPatientInsuranceEligibilityCheckResponse{}, nil
}

func (s *GRPCServer) GetPatientGoals(ctx context.Context, request *athenapb.GetPatientGoalsRequest) (*athenapb.GetPatientGoalsResponse, error) {
	encounterID := request.GetEncounterId()

	if encounterID == "" {
		return nil, status.Error(codes.InvalidArgument, encounterIDEmptyErrorMessage)
	}

	goalNotes, err := s.AthenaClient.GetPatientGoals(ctx, encounterID)
	if err != nil {
		return nil, err
	}

	return &athenapb.GetPatientGoalsResponse{DiscussionNotes: *goalNotes}, nil
}

func (s *GRPCServer) GetPatientOrder(ctx context.Context, request *athenapb.GetPatientOrderRequest) (*athenapb.GetPatientOrderResponse, error) {
	patientID := request.GetPatientId()

	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, patientIDEmptyErrorMessage)
	}

	orderID := request.GetOrderId()

	if orderID == "" {
		return nil, status.Error(codes.InvalidArgument, orderIDEmptyErrorMessage)
	}

	order, err := s.AthenaClient.GetPatientOrder(ctx, patientID, orderID)
	if err != nil {
		return nil, err
	}

	return &athenapb.GetPatientOrderResponse{Order: order}, nil
}

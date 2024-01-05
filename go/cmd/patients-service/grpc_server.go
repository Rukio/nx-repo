package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/patient/patientconv"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
)

const (
	// Athena considers a score of 26 or higher an automatch.
	athenaEMBScoreThreshold           = 26.0
	patientsServiceCallsToStationFlag = "patients_service_calls_station"
	stationCallsToPatientsServiceFlag = "patient_controller_calls_patients_service"
)

var (
	failedToGenerateConsistencyTokenText   = "failed to generate consistency token"
	errFailureToGenerateConsistencyToken   = status.Error(codes.Internal, failedToGenerateConsistencyTokenText)
	errNoPatientID                         = status.Error(codes.InvalidArgument, "patient id cannot be empty")
	errNoPatientGivenName                  = status.Error(codes.InvalidArgument, "patient given name cannot be empty")
	errNoPatientFamilyName                 = status.Error(codes.InvalidArgument, "patient family name cannot be empty")
	errNoPatientDateOfBirth                = status.Error(codes.InvalidArgument, "patient date of birth cannot be empty")
	errNoPatientBillingCity                = status.Error(codes.InvalidArgument, "patient billing city cannot be empty")
	errNoPatientMobilePhone                = status.Error(codes.InvalidArgument, "patient mobile phone cannot be empty")
	errNoDepartmentID                      = status.Error(codes.InvalidArgument, "department id cannot be empty")
	errNoMemberID                          = status.Error(codes.InvalidArgument, "member id cannot be empty")
	errNoClinicalProviderID                = status.Error(codes.InvalidArgument, "clinical provider id cannot be empty")
	errNoRecipientClassID                  = status.Error(codes.InvalidArgument, "recipient class id cannot be empty")
	errNoSearchTermParams                  = status.Error(codes.InvalidArgument, "search params cannot be empty")
	insurancesURLTemplate                  = "api/patients/%s/insurances/%s"
	getPatientURLTemplate                  = "api/patients/%s"
	errNoInsuranceID                       = status.Error(codes.InvalidArgument, "insurance id cannot be empty")
	errFailureToConvertPatient             = status.Error(codes.Internal, "failed to convert patient to proto")
	errNoPatient                           = status.Error(codes.InvalidArgument, "patient cannot be empty")
	errFailedToGetUnverifiedPatient        = status.Error(codes.Internal, "failed to get unverified patient")
	failedToParsePatientIDMessage          = "failed to parse patient id"
	failedToParseAthenaIDMessage           = "failed to parse athena id"
	failedToUpdateUnverifiedPatientMessage = "failed to update unverified patient"
	failedToRetrievePatientFromStation     = "failed to retrieve patient from Station"
	failedToConvertPatient                 = "failed to convert patient"
	errFailureToCheckFeatureFlags          = status.Error(codes.FailedPrecondition, "feature flags collision detected")
	athenaPatientAlreadyExistsMetric       = "athena_patient_already_exists"
)

type DBService interface {
	AddUnverifiedPatient(ctx context.Context, params patientssql.AddUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error)
	ListUnverifiedPatientsByIds(ctx context.Context, IDs []int64) ([]*patientssql.UnverifiedPatient, error)
	GetUnverifiedPatientByID(ctx context.Context, IDs int64) (*patientssql.UnverifiedPatient, error)
	UpdateUnverifiedPatientByID(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error)
}

var _ DBService = (*PatientsDB)(nil)

type GRPCServer struct {
	patientspb.UnimplementedPatientsServiceServer
	DBService             DBService
	StationClient         *station.Client
	StationPatientsClient stationpatientspb.StationPatientsServiceClient
	Logger                *zap.SugaredLogger
	AthenaClient          athenapb.AthenaServiceClient
	StatsigProvider       *providers.StatsigProvider
	DataDogRecorder       *monitoring.DataDogRecorder
}

func generateProtoConsistencyToken(protoStruct protoreflect.ProtoMessage) ([]byte, error) {
	protoToBytes, err := proto.Marshal(protoStruct)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to parse proto to bytes")
	}
	hash := sha256.Sum256(protoToBytes)

	return hash[:], nil
}

type ConsistencyToken []byte

func (s *GRPCServer) composeWithAthenaPatient(ctx context.Context, stationPatient *stationpatientspb.Patient) (*common.Patient, ConsistencyToken, error) {
	if stationPatient.GetEhrId() == "" {
		return nil, nil, errors.New("EHR id cannot be empty")
	}

	getAthenaPatientResp, err := s.AthenaClient.GetPatient(ctx, &athenapb.GetPatientRequest{PatientId: stationPatient.EhrId})
	if err != nil {
		return nil, nil, errors.New("failed to retrieve patient from AthenaService")
	}

	composedPatient, err := patientconv.ToPatientProto(getAthenaPatientResp.Patient, stationPatient)
	if err != nil {
		return nil, nil, errors.New("failed to convert to patient proto")
	}

	consistencyToken, err := generateProtoConsistencyToken(composedPatient)
	if err != nil {
		return nil, nil, errors.New(failedToGenerateConsistencyTokenText)
	}

	return composedPatient, consistencyToken, nil
}

func (s *GRPCServer) GetPatient(ctx context.Context, req *patientspb.GetPatientRequest) (*patientspb.GetPatientResponse, error) {
	logger := s.Logger.With("method", "GetPatient", "patient_id", req.GetPatientId())
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()
	callsStationEnabled := s.StatsigProvider.Bool(patientsServiceCallsToStationFlag, false)
	stationCallsPatientsServiceEnabled := s.StatsigProvider.Bool(stationCallsToPatientsServiceFlag, false)
	if callsStationEnabled && stationCallsPatientsServiceEnabled {
		logger.Errorf("feature flags %s and %s collision detected", patientsServiceCallsToStationFlag, stationCallsToPatientsServiceFlag)
		return nil, errFailureToCheckFeatureFlags
	}

	if callsStationEnabled {
		var stationPatient *patient.StationPatient
		patientGetPath := fmt.Sprintf(getPatientURLTemplate, req.GetPatientId())
		err := s.StationClient.Request(ctx, &station.RequestConfig{
			Method:   http.MethodGet,
			Path:     patientGetPath,
			RespData: &stationPatient,
		})
		if err != nil {
			logger.Errorw(failedToRetrievePatientFromStation, zap.Error(err))
			return nil, status.Error(codes.Internal, failedToRetrievePatientFromStation)
		}

		convertedPatient, err := patientconv.StationPatientToProto(stationPatient)
		if err != nil {
			logger.Errorw(failedToConvertPatient, zap.Error(err))
			return nil, status.Error(codes.Internal, failedToConvertPatient)
		}

		consistencyToken, err := generateProtoConsistencyToken(convertedPatient)
		if err != nil {
			logger.Errorw("failed to generate consistency token", zap.Error(err))
			return nil, errors.New(failedToGenerateConsistencyTokenText)
		}

		return &patientspb.GetPatientResponse{
			Patient:          convertedPatient,
			ConsistencyToken: consistencyToken,
		}, nil
	}
	patientID := req.GetPatientId()
	intPatientID, err := strconv.ParseInt(patientID, 10, 64)
	if err != nil {
		logger.Errorw("failed to parse patient id", zap.Error(err))
		return nil, status.Error(codes.InvalidArgument, failedToParsePatientIDMessage)
	}
	// Call the StationService to retrieve the patient.
	// athena id is ehr id from station
	stationResp, err := s.StationPatientsClient.GetPatient(ctx, &stationpatientspb.GetPatientRequest{
		PatientId: intPatientID,
	})
	if err != nil {
		if status.Convert(err).Code() == codes.NotFound {
			return nil, status.Error(codes.NotFound, "patient ID not found")
		}
		logger.Errorw("failed to retrieve patient from StationPatientsService", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to retrieve patient from StationPatientsService")
	}

	if stationResp == nil || stationResp.Patient == nil ||
		stationResp.Patient.EhrId == nil || *(stationResp.Patient.EhrId) == "" {
		return nil, status.Error(codes.Internal, "fetched station patient has no ehr_id, unable to call athena patient")
	}

	composedPatient, consistencyToken, err := s.composeWithAthenaPatient(ctx, stationResp.Patient)
	if err != nil {
		logger.Errorw("failed to compose with Athena patient", "ID", stationResp.Patient.Id, zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to compose with Athena patient")
	}

	return &patientspb.GetPatientResponse{
		Patient:          composedPatient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) SearchPatients(ctx context.Context, req *patientspb.SearchPatientsRequest) (*patientspb.SearchPatientsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if req.GetSearchTerm() == "" {
		return nil, errNoSearchTermParams
	}

	athenaSearchPatient, err := s.AthenaClient.SearchPatients(ctx, &athenapb.SearchPatientsRequest{
		SearchTerm: *req.SearchTerm,
	})
	if err != nil {
		s.Logger.Errorw("SearchPatients failed to search patients in Athena", zap.Error(err))
		return nil, status.Error(codes.Internal, "could not search patients in Athena")
	}

	if len(athenaSearchPatient.Results) == 0 {
		return &patientspb.SearchPatientsResponse{}, nil
	}

	var stationPatientsResp *stationpatientspb.ListPatientsResponse
	ehrIDs := patientconv.SearchPatientsResultPatientIDs(athenaSearchPatient.Results)

	stationPatientsResp, err = s.StationPatientsClient.ListPatients(ctx, &stationpatientspb.ListPatientsRequest{
		EhrIds:         ehrIDs,
		ChannelItemIds: req.ChannelItemIds,
		PartnerId:      req.GetPartnerId(),
	})
	if err != nil {
		s.Logger.Errorw("SearchPatients failed to list patients from Station", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to list patients from Station")
	}

	athenaPatientsArray := make([]*athenapb.Patient, len(athenaSearchPatient.Results))
	for i, searchPatientsResult := range athenaSearchPatient.Results {
		athenaPatientsArray[i] = searchPatientsResult.GetPatient()
	}

	var composedPatients []*common.Patient
	composedPatients, err = patientconv.ToPatientProtos(athenaPatientsArray, stationPatientsResp.Patients)
	if err != nil {
		s.Logger.Errorw("SearchPatients failed to convert patient proto", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to convert patient proto")
	}

	patientsWithConsistencyTokens := make([]*patientspb.SearchPatientsResult, len(composedPatients))
	for i, p := range composedPatients {
		consistencyToken, err := generateProtoConsistencyToken(p)
		if err != nil {
			s.Logger.Errorw("SearchPatients failed to generate consistency token", zap.Error(err))
			return nil, errFailureToGenerateConsistencyToken
		}

		patientsWithConsistencyTokens[i] = &patientspb.SearchPatientsResult{
			Patient:          p,
			ConsistencyToken: consistencyToken,
		}
	}

	return &patientspb.SearchPatientsResponse{Results: patientsWithConsistencyTokens}, nil
}

func (s *GRPCServer) CreatePatient(ctx context.Context, r *patientspb.CreatePatientRequest) (*patientspb.CreatePatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if r.GetPatient().GetName().GetGivenName() == "" {
		return nil, errNoPatientGivenName
	}

	if r.GetPatient().GetName().GetFamilyName() == "" {
		return nil, errNoPatientFamilyName
	}

	if r.Patient.DateOfBirth == nil {
		return nil, errNoPatientDateOfBirth
	}

	if r.GetPatient().GetContactInfo().GetMobileNumber().GetPhoneNumber() == "" {
		return nil, errNoPatientMobilePhone
	}

	if r.Patient.BillingCity == nil {
		return nil, errNoPatientBillingCity
	}

	billingCityID, err := strconv.ParseInt(r.Patient.BillingCity.Id, 10, 64)
	if err != nil {
		s.Logger.Errorw("CreatePatient failed to parse billing city ID", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to parse billing city ID")
	}

	getDepartmentIDResp, err := s.StationPatientsClient.GetDepartmentIDByBillingCityID(ctx, &stationpatientspb.GetDepartmentIDByBillingCityIDRequest{BillingCityId: billingCityID})
	if err != nil {
		s.Logger.Errorw("CreatePatient failed to find department id", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to find department id")
	}

	// TODO(PT-1709): Add metrics for when created patient already exists
	athenaPatientsResponse, err := s.AthenaClient.EnhancedBestMatch(ctx, &athenapb.EnhancedBestMatchRequest{
		FirstName:         r.GetPatient().GetName().GetGivenName(),
		LastName:          r.GetPatient().GetName().GetFamilyName(),
		DateOfBirth:       r.GetPatient().GetDateOfBirth(),
		ReturnBestMatches: false,
		UseSoundexSearch:  false,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Athena enhanced best match error: %v", err)
	}
	// Setting ReturnBestMatches to false should ensure only 1 match is returned
	if len(athenaPatientsResponse.Results) > 1 {
		return nil, status.Error(codes.FailedPrecondition, "Athena enhanced best match returned more than 1 match")
	}

	var ehrID *string
	if len(athenaPatientsResponse.Results) != 0 {
		bestMatch := athenaPatientsResponse.Results[0]
		score, err := strconv.ParseFloat(bestMatch.ScoreString, 64)
		if err != nil {
			s.Logger.Errorw("failed to parse athena EBM score", zap.Error(err))
			return nil, status.Error(codes.Internal, "failed to parse Athena EBM score")
		}

		if score >= athenaEMBScoreThreshold {
			ehrID = bestMatch.Patient.PatientId

			if s.DataDogRecorder != nil {
				s.DataDogRecorder.Count(athenaPatientAlreadyExistsMetric, 1, nil)
			}
		}
	}

	if ehrID == nil {
		athenaRequestPatient := patientconv.ToAthenaPatient(r.Patient, &getDepartmentIDResp.DepartmentId)
		athenaCreatePatient, err := s.AthenaClient.CreatePatient(ctx, &athenapb.CreatePatientRequest{
			Patient: athenaRequestPatient})
		if err != nil {
			s.Logger.Errorw("CreatePatient failed to find or create patient in Athena", zap.Error(err))
			return nil, status.Error(codes.Internal, "failed to create patient in Athena")
		}

		ehrID = athenaCreatePatient.PatientId
	}

	stationPatient, err := patientconv.StationPatientProto(ehrID, r.Patient)
	if err != nil {
		s.Logger.Errorw("CreatePatient failed to convert patient to station patient proto", zap.Error(err))
		return nil, status.Error(codes.Internal, failedToConvertPatient)
	}

	stationPatientsResp, err := s.StationPatientsClient.FindOrCreatePatient(ctx, &stationpatientspb.FindOrCreatePatientRequest{Patient: stationPatient})
	if err != nil {
		s.Logger.Errorw("CreatePatient failed to find or create patient in station", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to create patient")
	}

	if stationPatientsResp == nil {
		return nil, status.Error(codes.Internal, "failed to create patient")
	}

	patientIDStr := strconv.FormatInt(stationPatientsResp.PatientId, 10)

	getPatientAfterCreateResp, err := s.GetPatient(ctx, &patientspb.GetPatientRequest{PatientId: &patientIDStr})
	if err != nil {
		s.Logger.Errorw("CreatePatient failed to get patient after creation", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to retrieve patient from PatientService")
	}

	var consistencyToken []byte

	if getPatientAfterCreateResp != nil {
		consistencyToken, err = generateProtoConsistencyToken(getPatientAfterCreateResp.Patient)
		if err != nil {
			s.Logger.Errorw("CreatePatient failed to generate consistency token", zap.Error(err))
			return nil, errFailureToGenerateConsistencyToken
		}
	}

	return &patientspb.CreatePatientResponse{
		Patient:          getPatientAfterCreateResp.Patient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) UpdatePatient(ctx context.Context, r *patientspb.UpdatePatientRequest) (*patientspb.UpdatePatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patientID := r.Patient.GetId()
	getPatientRequest := &patientspb.GetPatientRequest{PatientId: &patientID}
	getPatientResponse, err := s.GetPatient(ctx, getPatientRequest)
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to retrieve patient from PatientService", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to retrieve patient from PatientService")
	}

	if !bytes.Equal(getPatientResponse.ConsistencyToken, r.ConsistencyToken) {
		return nil, status.Error(codes.FailedPrecondition, "consistency tokens do not match")
	}

	if getPatientResponse.Patient.BillingCity == nil || getPatientResponse.Patient.BillingCity.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "billing city not provided")
	}

	billingCityID, err := strconv.ParseInt(getPatientResponse.Patient.BillingCity.Id, 10, 64)
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to parse billing city ID", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to parse billing city ID")
	}

	getDepartmentIDResp, err := s.StationPatientsClient.GetDepartmentIDByBillingCityID(ctx, &stationpatientspb.GetDepartmentIDByBillingCityIDRequest{BillingCityId: billingCityID})
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to find department ID", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to find department ID")
	}

	athenaPatient := patientconv.ToAthenaPatient(r.Patient, &getDepartmentIDResp.DepartmentId)

	athenaUpdatePatientResponse, err := s.AthenaClient.UpdatePatient(ctx, &athenapb.UpdatePatientRequest{
		Patient: athenaPatient,
	})
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to update patient in AthenaService", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to update patient in AthenaService")
	}

	athenaPatientID := athenaUpdatePatientResponse.GetPatientId()
	stationPatient, err := patientconv.StationPatientProto(&athenaPatientID, r.Patient)

	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to convert patient", zap.Error(err))
		return nil, errFailureToConvertPatient
	}
	_, err = s.StationPatientsClient.UpdatePatient(ctx, &stationpatientspb.UpdatePatientRequest{
		Patient: stationPatient,
	})
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to update patient in Station", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to update patient in Station")
	}

	getPatientAfterUpdateResp, err := s.GetPatient(ctx, getPatientRequest)
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to retrieve patient from PatientService after updating", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to retrieve patient from PatientService after updating")
	}

	consistencyToken, err := generateProtoConsistencyToken(getPatientAfterUpdateResp.Patient)
	if err != nil {
		s.Logger.Errorw("UpdatePatient failed to generate consistency token", zap.Error(err))
		return nil, errFailureToGenerateConsistencyToken
	}

	return &patientspb.UpdatePatientResponse{
		Patient:          getPatientAfterUpdateResp.Patient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) CreateInsurance(ctx context.Context, r *patientspb.CreateInsuranceRequest) (*patientspb.CreateInsuranceResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	stationInsurance, err := patientconv.ProtoToStationInsurance(r.InsuranceRecord)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert Insurance proto into StationInsurance")
	}

	var stationInsuranceWithURL patient.StationInsuranceWithURL
	insuranceCreatePath := fmt.Sprintf("api/patients/%s/insurances", r.InsuranceRecord.GetPatientId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodPost,
		Path:     insuranceCreatePath,
		ReqBody:  stationInsurance,
		RespData: &stationInsuranceWithURL,
	}
	err = s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	insuranceProto, err := patientconv.StationInsuranceToProto(&stationInsuranceWithURL)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert StationInsurance into Insurance proto.")
	}

	return &patientspb.CreateInsuranceResponse{
		InsuranceRecord: insuranceProto,
	}, nil
}

func (s *GRPCServer) GetInsurance(ctx context.Context, r *patientspb.GetInsuranceRequest) (*patientspb.GetInsuranceResponse, error) {
	logger := s.Logger.With("method", "GetInsurance", "patient_id", r.GetPatientId(), "insurance_id", r.GetInsuranceId())
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if r.GetSyncEhr() {
		insuranceGetPath := fmt.Sprintf(insurancesURLTemplate, r.GetPatientId(), "sync")
		requestConfig := &station.RequestConfig{
			Method: http.MethodPatch,
			Path:   insuranceGetPath,
		}
		err := s.StationClient.Request(ctx, requestConfig)
		if err != nil {
			logger.Error("failed to sync insurances with EHR")
			return nil, err
		}
	}

	var stationInsuranceWithURL patient.StationInsuranceWithURL
	insuranceGetPath := fmt.Sprintf(insurancesURLTemplate, r.GetPatientId(), r.GetInsuranceId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     insuranceGetPath,
		ReqBody:  nil,
		RespData: &stationInsuranceWithURL,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	if stationInsuranceWithURL == (patient.StationInsuranceWithURL{}) {
		return nil, status.Error(codes.NotFound, "insurance doesn't exist")
	}

	insuranceProto, err := patientconv.StationInsuranceToProto(&stationInsuranceWithURL)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert StationInsurance struct into Insurance proto")
	}

	return &patientspb.GetInsuranceResponse{
		InsuranceRecord: insuranceProto,
	}, nil
}

func (s *GRPCServer) ListInsurances(ctx context.Context, r *patientspb.ListInsurancesRequest) (*patientspb.ListInsurancesResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	var stationInsurancesWithURL []*patient.StationInsuranceWithURL
	insurancesListPath := fmt.Sprintf("api/patients/%s/insurances", r.GetPatientId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     insurancesListPath,
		ReqBody:  nil,
		RespData: &stationInsurancesWithURL,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, status.Error(status.Code(err), failedToRetrievePatientFromStation)
	}

	listInsuranceResults := make([]*patientspb.ListInsurancesResult, len(stationInsurancesWithURL))
	for i, insurance := range stationInsurancesWithURL {
		insuranceRecord, err := patientconv.StationInsuranceToProto(insurance)
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to convert StationInsurance into Insurance proto.")
		}
		consistencyToken, err := generateProtoConsistencyToken(insuranceRecord)
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to generate token from Insurance proto.")
		}
		listInsuranceResults[i] = &patientspb.ListInsurancesResult{
			InsuranceRecord:  insuranceRecord,
			ConsistencyToken: consistencyToken,
		}
	}

	return &patientspb.ListInsurancesResponse{Results: listInsuranceResults}, nil
}

func (s *GRPCServer) HealthCheck(ctx context.Context, _ *patientspb.HealthCheckRequest) (*patientspb.HealthCheckResponse, error) {
	_, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	return &patientspb.HealthCheckResponse{}, nil
}

func (s *GRPCServer) UpdateInsurance(ctx context.Context, r *patientspb.UpdateInsuranceRequest) (*patientspb.UpdateInsuranceResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	stationInsurance, err := patientconv.ProtoToStationInsurance(r.InsuranceRecord)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert Insurance proto into StationInsurance")
	}

	if _, err := s.GetInsurance(ctx, &patientspb.GetInsuranceRequest{
		InsuranceId: proto.String(r.InsuranceRecord.GetId()),
		PatientId:   proto.String(r.InsuranceRecord.GetPatientId()),
	}); err != nil {
		return nil, err
	}

	var stationInsuranceWithURL patient.StationInsuranceWithURL
	insuranceUpdatePath := fmt.Sprintf(insurancesURLTemplate, r.InsuranceRecord.GetPatientId(), r.InsuranceRecord.GetId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodPatch,
		Path:     insuranceUpdatePath,
		ReqBody:  stationInsurance,
		RespData: &stationInsuranceWithURL,
	}
	err = s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	insuranceProto, err := patientconv.StationInsuranceToProto(&stationInsuranceWithURL)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert StationInsurance struct into Insurance proto")
	}

	return &patientspb.UpdateInsuranceResponse{
		InsuranceRecord: insuranceProto,
	}, nil
}

func (s *GRPCServer) DeleteInsurance(ctx context.Context, r *patientspb.DeleteInsuranceRequest) (*patientspb.DeleteInsuranceResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if _, err := s.GetInsurance(ctx, &patientspb.GetInsuranceRequest{
		InsuranceId: proto.String(r.GetInsuranceId()),
		PatientId:   proto.String(r.GetPatientId()),
	}); err != nil {
		return nil, err
	}

	insuranceDeletePath := fmt.Sprintf(insurancesURLTemplate, r.GetPatientId(), r.GetInsuranceId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodDelete,
		Path:     insuranceDeletePath,
		ReqBody:  nil,
		RespData: nil,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	return &patientspb.DeleteInsuranceResponse{}, nil
}

func (s *GRPCServer) GetPrimaryCareProvider(ctx context.Context, r *patientspb.GetPrimaryCareProviderRequest) (*patientspb.GetPrimaryCareProviderResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	var stationPCPResponse patient.StationPCP
	pcpGetPath := fmt.Sprintf("api/patients/%s/primary_care_provider", r.GetPatientId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     pcpGetPath,
		ReqBody:  nil,
		RespData: &stationPCPResponse,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	if stationPCPResponse.PatientHasPCP == nil || !(*stationPCPResponse.PatientHasPCP) {
		return nil, status.Error(codes.NotFound, "primary care provider doesn't exist")
	}

	pcpProto, err := patientconv.StationPCPToProto(&stationPCPResponse)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert StationPCP struct into Primary Care Provider proto")
	}

	return &patientspb.GetPrimaryCareProviderResponse{
		PatientHasPcp:       stationPCPResponse.PatientHasPCP,
		PrimaryCareProvider: pcpProto,
	}, nil
}

func (s *GRPCServer) AddInsuranceImage(ctx context.Context, req *patientspb.AddInsuranceImageRequest) (*patientspb.AddInsuranceImageResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	stationInsuranceImageReq, err := patientconv.ProtoToStationInsuranceImage(req)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert Insurance Image proto into StationInsurance")
	}

	addInsuranceImagePath := fmt.Sprintf(insurancesURLTemplate, req.GetPatientId(), req.GetInsuranceId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodPatch,
		Path:     addInsuranceImagePath,
		ReqBody:  stationInsuranceImageReq,
		RespData: nil,
	}
	err = s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	return &patientspb.AddInsuranceImageResponse{}, nil
}

func (s *GRPCServer) UpdatePrimaryCareProvider(ctx context.Context, r *patientspb.UpdatePrimaryCareProviderRequest) (*patientspb.UpdatePrimaryCareProviderResponse, error) {
	patientID, clinicalProviderID := r.GetPatientId(), r.GetClinicalProviderId()
	if patientID == "" {
		return nil, status.Error(codes.InvalidArgument, "patient id cannot be empty")
	}

	if clinicalProviderID == "" {
		return nil, status.Error(codes.InvalidArgument, "clinical provider id cannot be empty")
	}

	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	pcpUpdatePath := fmt.Sprintf("api/patients/%s/care_team/primary_care_provider/%s", patientID, clinicalProviderID)
	requestConfig := &station.RequestConfig{
		Method:   http.MethodPatch,
		Path:     pcpUpdatePath,
		ReqBody:  nil,
		RespData: nil,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	return &patientspb.UpdatePrimaryCareProviderResponse{}, nil
}

func (s *GRPCServer) RemoveInsuranceImage(ctx context.Context, r *patientspb.RemoveInsuranceImageRequest) (*patientspb.RemoveInsuranceImageResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if _, err := s.GetInsurance(ctx, &patientspb.GetInsuranceRequest{
		InsuranceId: proto.String(r.GetInsuranceId()),
		PatientId:   proto.String(r.GetPatientId()),
	}); err != nil {
		return nil, err
	}

	stationInsuranceImageRemoval, err := patientconv.ProtoToStationInsuranceImageRemoval(r)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to convert Insurance image proto to StationInsuranceImageRemoval")
	}

	insuranceRemoveImagePath := fmt.Sprintf(insurancesURLTemplate, r.GetPatientId(), r.GetInsuranceId())
	requestConfig := &station.RequestConfig{
		Method:   http.MethodDelete,
		Path:     insuranceRemoveImagePath,
		ReqBody:  stationInsuranceImageRemoval,
		RespData: nil,
	}
	err = s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}

	return &patientspb.RemoveInsuranceImageResponse{}, nil
}

func (s *GRPCServer) DeletePrimaryCareProvider(ctx context.Context, r *patientspb.DeletePrimaryCareProviderRequest) (*patientspb.DeletePrimaryCareProviderResponse, error) {
	patientID := r.GetPatientId()
	if patientID == "" {
		return nil, errNoPatientID
	}
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	pcpDeletePath := fmt.Sprintf("api/patients/%s/primary_care_provider", patientID)
	requestConfig := &station.RequestConfig{
		Method:   http.MethodDelete,
		Path:     pcpDeletePath,
		ReqBody:  nil,
		RespData: nil,
	}
	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return nil, err
	}
	return &patientspb.DeletePrimaryCareProviderResponse{}, nil
}

func (s *GRPCServer) UpsertCareTeam(ctx context.Context, request *patientspb.UpsertCareTeamRequest) (*patientspb.UpsertCareTeamResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patientID := request.GetPatientId()
	clinicalProviderID := request.GetClinicalProviderId()
	departmentID := request.GetDepartmentId()
	recipientClassID := request.GetRecipientClassId()

	if patientID == "" {
		return nil, errNoPatientID
	}

	if clinicalProviderID == "" {
		return nil, errNoClinicalProviderID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	if recipientClassID == "" {
		return nil, errNoRecipientClassID
	}

	_, err := s.AthenaClient.UpdateCareTeam(ctx, &athenapb.UpdateCareTeamRequest{PatientId: patientID, ClinicalProviderId: clinicalProviderID, DepartmentId: departmentID, RecipientClassId: recipientClassID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to upsert care team member: %s", err)
	}

	return &patientspb.UpsertCareTeamResponse{}, nil
}

func (s *GRPCServer) DeleteCareTeam(ctx context.Context, request *patientspb.DeleteCareTeamRequest) (*patientspb.DeleteCareTeamResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patientID := request.GetPatientId()
	memberID := request.GetMemberId()
	departmentID := request.GetDepartmentId()

	if patientID == "" {
		return nil, errNoPatientID
	}

	if memberID == "" {
		return nil, errNoMemberID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	_, err := s.AthenaClient.DeleteCareTeam(ctx, &athenapb.DeleteCareTeamRequest{PatientId: patientID, MemberId: memberID, DepartmentId: departmentID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete care team member: %s", err)
	}

	return &patientspb.DeleteCareTeamResponse{}, nil
}

func (s *GRPCServer) UpdateDefaultPharmacy(ctx context.Context, r *patientspb.UpdateDefaultPharmacyRequest) (*patientspb.UpdateDefaultPharmacyResponse, error) {
	patientID := r.GetPatientId()
	departmentID := r.GetDepartmentId()
	clinicalProviderID := r.GetClinicalProviderId()

	if patientID == "" {
		return nil, errNoPatientID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	if clinicalProviderID == "" {
		return nil, errNoClinicalProviderID
	}

	_, err := s.AthenaClient.UpdateDefaultPharmacy(ctx, &athenapb.UpdateDefaultPharmacyRequest{PatientId: patientID, DepartmentId: departmentID, ClinicalProviderId: clinicalProviderID})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update patient preferred pharmacy: %s", err)
	}

	return &patientspb.UpdateDefaultPharmacyResponse{}, nil
}

func (s *GRPCServer) GetDefaultPharmacy(ctx context.Context, r *patientspb.GetDefaultPharmacyRequest) (*patientspb.GetDefaultPharmacyResponse, error) {
	patientID, departmentID := r.GetPatientId(), r.GetDepartmentId()
	if patientID == "" {
		return nil, errNoPatientID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	response, err := s.AthenaClient.GetDefaultPharmacy(ctx, &athenapb.GetDefaultPharmacyRequest{PatientId: patientID, DepartmentId: departmentID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get patient default pharmacy: %s", err)
	}

	return &patientspb.GetDefaultPharmacyResponse{Pharmacy: response.Pharmacy}, nil
}

func (s *GRPCServer) GetPreferredPharmacies(ctx context.Context, request *patientspb.GetPreferredPharmaciesRequest) (*patientspb.GetPreferredPharmaciesResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patientID := request.GetPatientId()
	departmentID := request.GetDepartmentId()

	if patientID == "" {
		return nil, errNoPatientID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	response, err := s.AthenaClient.GetPreferredPharmacies(ctx, &athenapb.GetPreferredPharmaciesRequest{PatientId: patientID, DepartmentId: departmentID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get patient preferred pharmacies: %s", err)
	}

	return &patientspb.GetPreferredPharmaciesResponse{Pharmacies: response.Pharmacies}, nil
}

func (s *GRPCServer) DeletePreferredPharmacy(ctx context.Context, r *patientspb.DeletePreferredPharmacyRequest) (*patientspb.DeletePreferredPharmacyResponse, error) {
	patientID, departmentID, clinicalProviderID := r.GetPatientId(), r.GetDepartmentId(), r.GetClinicalProviderId()
	if patientID == "" {
		return nil, errNoPatientID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	if clinicalProviderID == "" {
		return nil, errNoClinicalProviderID
	}

	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	_, err := s.AthenaClient.DeletePreferredPharmacy(ctx, &athenapb.DeletePreferredPharmacyRequest{PatientId: patientID, DepartmentId: departmentID, ClinicalProviderId: clinicalProviderID})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete patient preferred pharmacy: %s", err)
	}

	return &patientspb.DeletePreferredPharmacyResponse{}, nil
}

func (s *GRPCServer) UpdatePreferredPharmacy(ctx context.Context, r *patientspb.UpdatePreferredPharmacyRequest) (*patientspb.UpdatePreferredPharmacyResponse, error) {
	patientID := r.GetPatientId()
	departmentID := r.GetDepartmentId()
	clinicalProviderID := r.GetClinicalProviderId()

	if patientID == "" {
		return nil, errNoPatientID
	}

	if departmentID == "" {
		return nil, errNoDepartmentID
	}

	if clinicalProviderID == "" {
		return nil, errNoClinicalProviderID
	}

	_, err := s.AthenaClient.UpdatePreferredPharmacy(ctx, &athenapb.UpdatePreferredPharmacyRequest{PatientId: patientID, DepartmentId: departmentID, ClinicalProviderId: clinicalProviderID})

	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update patient preferred pharmacy: %s", err)
	}

	return &patientspb.UpdatePreferredPharmacyResponse{}, nil
}

func (s *GRPCServer) ListPatients(ctx context.Context, request *patientspb.ListPatientsRequest) (*patientspb.ListPatientsResponse, error) {
	if request.FirstName == "" {
		return nil, status.Error(codes.InvalidArgument, "first name is empty")
	}

	if request.LastName == "" {
		return nil, status.Error(codes.InvalidArgument, "last name is empty")
	}

	if request.DateOfBirth == nil {
		return nil, status.Error(codes.InvalidArgument, "date of birth is empty")
	}

	var patients []*common.Patient

	athenaPatients, err := s.AthenaClient.EnhancedBestMatch(ctx, &athenapb.EnhancedBestMatchRequest{
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		DateOfBirth: request.DateOfBirth,
		ZipCode:     request.ZipCode,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "could not find patients at Athena: %v", err)
	}
	if len(athenaPatients.Results) == 0 {
		return &patientspb.ListPatientsResponse{}, nil
	}
	ehrIDs := patientconv.EnhancedBestMatchResultPatientIDs(athenaPatients.Results)

	stationPatientsResp, err := s.StationPatientsClient.ListPatients(ctx, &stationpatientspb.ListPatientsRequest{
		EhrIds:         ehrIDs,
		ChannelItemIds: request.ChannelItemIds,
		PartnerId:      request.PartnerId,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list patients: %v", err)
	}

	athenaPatientsArray := make([]*athenapb.Patient, len(athenaPatients.Results))
	for i, enhancedBestMatchResult := range athenaPatients.Results {
		athenaPatientsArray[i] = enhancedBestMatchResult.GetPatient()
	}

	patients, err = patientconv.ToPatientProtos(athenaPatientsArray, stationPatientsResp.Patients)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to convert patient proto: %v", err)
	}

	patientsWithConsistencyTokens := make([]*patientspb.ListPatientsResult, len(patients))

	for i, p := range patients {
		consistencyToken, err := generateProtoConsistencyToken(p)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to generate patient consistency token: %v", err)
		}
		patientWithConsistencyToken := &patientspb.ListPatientsResult{
			Patient:          p,
			ConsistencyToken: consistencyToken,
		}

		patientsWithConsistencyTokens[i] = patientWithConsistencyToken
	}

	return &patientspb.ListPatientsResponse{Results: patientsWithConsistencyTokens}, nil
}

func (s *GRPCServer) getInsuranceEHRID(ctx context.Context, patientID, insuranceID string) (string, error) {
	var stationInsuranceWithURL patient.StationInsuranceWithURL
	insuranceGetPath := fmt.Sprintf(insurancesURLTemplate, patientID, insuranceID)
	requestConfig := &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     insuranceGetPath,
		ReqBody:  nil,
		RespData: &stationInsuranceWithURL,
	}

	err := s.StationClient.Request(ctx, requestConfig)
	if err != nil {
		return "", err
	}

	if *stationInsuranceWithURL.StationInsurance.EHRID == "" {
		return "", status.Error(codes.Internal, "insurance EHR ID is nil")
	}

	return *stationInsuranceWithURL.StationInsurance.EHRID, err
}

func (s *GRPCServer) getPatientEHRID(ctx context.Context, stationPatientID string) (string, error) {
	intPatientID, err := strconv.ParseInt(stationPatientID, 10, 64)
	if err != nil {
		s.Logger.Errorw("GetPatient failed to parse patient id", zap.Error(err))
		return "", status.Error(codes.InvalidArgument, failedToParsePatientIDMessage)
	}

	stationPatientResp, err := s.StationPatientsClient.GetPatient(ctx, &stationpatientspb.GetPatientRequest{
		PatientId: intPatientID,
	})
	if err != nil {
		return "", err
	}

	if stationPatientResp.Patient.EhrId == nil {
		return "", status.Error(codes.Internal, "patient EHR ID is nil")
	}

	return *stationPatientResp.Patient.EhrId, err
}

func (s *GRPCServer) GetPatientInsuranceBenefitDetails(ctx context.Context, r *patientspb.GetPatientInsuranceBenefitDetailsRequest) (*patientspb.GetPatientInsuranceBenefitDetailsResponse, error) {
	patientID := r.GetPatientId()
	insuranceID := r.GetInsuranceId()

	if patientID == "" {
		return nil, errNoPatientID
	}
	if insuranceID == "" {
		return nil, errNoInsuranceID
	}

	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patientEHRID, err := s.getPatientEHRID(ctx, patientID)
	if err != nil {
		return nil, err
	}

	insuranceEHRID, err := s.getInsuranceEHRID(ctx, patientID, insuranceID)
	if err != nil {
		return nil, err
	}

	getBenefitDetailsResp, err := s.AthenaClient.GetPatientInsuranceBenefitDetails(ctx, &athenapb.GetPatientInsuranceBenefitDetailsRequest{
		PatientId:       patientEHRID,
		InsuranceId:     insuranceEHRID,
		ServiceTypeCode: r.ServiceTypeCode,
		DateOfService:   r.DateOfService,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get patient insurance benefit details")
	}

	patientInsuranceBenefitDetails := patientconv.AthenaPatientInsuranceBenefitDetailsToProto(getBenefitDetailsResp.Details)

	return &patientspb.GetPatientInsuranceBenefitDetailsResponse{
		Details: patientInsuranceBenefitDetails,
	}, nil
}

func (s *GRPCServer) TriggerPatientInsuranceEligibilityCheck(ctx context.Context, r *patientspb.TriggerPatientInsuranceEligibilityCheckRequest) (*patientspb.TriggerPatientInsuranceEligibilityCheckResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *insuranceEligibilityCheckTimeout)
	defer cancel()

	patientID := r.GetPatientId()
	insuranceID := r.GetInsuranceId()

	if patientID == "" {
		return nil, errNoPatientID
	}
	if insuranceID == "" {
		return nil, errNoInsuranceID
	}

	patientEHRID, err := s.getPatientEHRID(ctx, patientID)
	if err != nil {
		return nil, err
	}

	insuranceEHRID, err := s.getInsuranceEHRID(ctx, patientID, insuranceID)
	if err != nil {
		return nil, err
	}

	_, err = s.AthenaClient.TriggerPatientInsuranceEligibilityCheck(ctx, &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
		PatientId:       patientEHRID,
		InsuranceId:     insuranceEHRID,
		DateOfService:   r.DateOfService,
		ServiceTypeCode: r.ServiceTypeCode,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to trigger patient insurance eligibility check")
	}

	return &patientspb.TriggerPatientInsuranceEligibilityCheckResponse{}, nil
}

func (s *GRPCServer) ListUnverifiedPatients(ctx context.Context, r *patientspb.ListUnverifiedPatientsRequest) (*patientspb.ListUnverifiedPatientsResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	listUnverifiedPatientsResp, err := s.DBService.ListUnverifiedPatientsByIds(ctx, r.GetIds())
	if err != nil {
		s.Logger.Errorw("Failed to list unverified patients", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to list unverified patients")
	}

	unverifiedPatientResults := make([]*patientspb.ListUnverifiedPatientResult, len(listUnverifiedPatientsResp))
	for i, dbPatient := range listUnverifiedPatientsResp {
		unverifiedPatient := UnverifiedPatientSQLToProto(dbPatient)
		consistencyToken, err := protoconv.TimestampToBytes(unverifiedPatient.UpdatedAt)
		if err != nil {
			s.Logger.Errorw("Failed to parse timestamp to bytes", zap.Error(err))
			return nil, errFailureToGenerateConsistencyToken
		}

		unverifiedPatientResults[i] = &patientspb.ListUnverifiedPatientResult{
			Patient:          unverifiedPatient,
			ConsistencyToken: consistencyToken,
		}
	}

	return &patientspb.ListUnverifiedPatientsResponse{Results: unverifiedPatientResults}, nil
}

func (s *GRPCServer) GetUnverifiedPatient(ctx context.Context, r *patientspb.GetUnverifiedPatientRequest) (*patientspb.GetUnverifiedPatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	getUnverifiedPatientResp, err := s.DBService.GetUnverifiedPatientByID(ctx, r.GetId())
	if err != nil {
		if errors.Is(err, errPatientNotFound) {
			s.Logger.Errorw("Failed to find unverified patient", "ID", r.GetId(), zap.Error(err))
			return nil, status.Error(codes.NotFound, "unverified patient not found")
		}
		s.Logger.Errorw(errFailedToGetUnverifiedPatient.Error(), "ID", r.GetId(), zap.Error(err))
		return nil, errFailedToGetUnverifiedPatient
	}

	unverifiedPatient := UnverifiedPatientSQLToProto(getUnverifiedPatientResp)
	consistencyToken, err := protoconv.TimestampToBytes(unverifiedPatient.UpdatedAt)
	if err != nil {
		s.Logger.Errorw("Failed to parse timestamp to bytes", zap.Error(err))
		return nil, errFailureToGenerateConsistencyToken
	}

	return &patientspb.GetUnverifiedPatientResponse{
		Patient:          unverifiedPatient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) ListPatientsByID(ctx context.Context, r *patientspb.ListPatientsByIDRequest) (*patientspb.ListPatientsByIDResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	stationResp, err := s.StationPatientsClient.ListPatientsByID(ctx, &stationpatientspb.ListPatientsByIDRequest{PatientIds: r.PatientIds})
	if err != nil {
		s.Logger.Errorw("ListPatientsByID: failed to list patients from StationPatientsService", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to list patients from StationPatientsService")
	}

	var results []*patientspb.ListPatientsByIDResult
	for _, p := range stationResp.Patients {
		composedPatient, consistencyToken, err := s.composeWithAthenaPatient(ctx, p)
		if err != nil {
			s.Logger.Errorw("ListPatientsByID: failed to compose with Athena patient", "ID", p.Id, zap.Error(err))
			continue
		}

		results = append(results, &patientspb.ListPatientsByIDResult{
			Patient:          composedPatient,
			ConsistencyToken: consistencyToken,
		})
	}

	return &patientspb.ListPatientsByIDResponse{Results: results}, nil
}

func (s *GRPCServer) CreateUnverifiedPatient(ctx context.Context, r *patientspb.CreateUnverifiedPatientRequest) (*patientspb.CreateUnverifiedPatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	if r.GetGivenName() == "" {
		return nil, errNoPatientGivenName
	}
	if r.GetFamilyName() == "" {
		return nil, errNoPatientFamilyName
	}
	if r.GetDateOfBirth() == nil {
		return nil, errNoPatientDateOfBirth
	}
	if r.PhoneNumber == nil || r.PhoneNumber.GetPhoneNumber() == "" {
		return nil, errNoPatientMobilePhone
	}
	unverifiedSQLPatient, err := ToUnverifiedPatientSQL(&patientspb.UnverifiedPatient{
		AthenaId:       r.AthenaId,
		DateOfBirth:    r.DateOfBirth,
		PhoneNumber:    r.PhoneNumber,
		LegalSex:       r.LegalSex,
		BirthSex:       r.BirthSex,
		GenderIdentity: r.GenderIdentity,
		GivenName:      r.GivenName,
		FamilyName:     r.FamilyName,
	})
	if err != nil {
		s.Logger.Errorw("CreateUnverifiedPatient: failed to convert patient", zap.Error(err))
		return nil, errFailureToConvertPatient
	}

	addUnverifiedPatientResp, err := s.DBService.AddUnverifiedPatient(ctx, *UnverifiedSQLPatientToAddUnverifiedPatientParams(unverifiedSQLPatient))
	if err != nil {
		s.Logger.Errorw("CreateUnverifiedPatient: failed to create unverified patient", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to create unverified patient")
	}

	unverifiedPatient := UnverifiedPatientSQLToProto(addUnverifiedPatientResp)
	consistencyToken, err := protoconv.TimestampToBytes(unverifiedPatient.UpdatedAt)
	if err != nil {
		s.Logger.Errorw("CreateUnverifiedPatient: failed to parse timestamp to bytes", zap.Error(err))
		return nil, errFailureToGenerateConsistencyToken
	}

	return &patientspb.CreateUnverifiedPatientResponse{
		Patient:          unverifiedPatient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) UpdateUnverifiedPatient(ctx context.Context, r *patientspb.UpdateUnverifiedPatientRequest) (*patientspb.UpdateUnverifiedPatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	patient := r.Patient
	if patient == nil {
		return nil, errNoPatient
	}

	logger := s.Logger.With("method", "UpdateUnverifiedPatient", "unverified_patient_id", patient.Id)
	getUnverifiedPatientByIDResp, err := s.GetUnverifiedPatient(ctx, &patientspb.GetUnverifiedPatientRequest{Id: proto.Int64(patient.GetId())})
	if err != nil {
		logger.Errorw(errFailedToGetUnverifiedPatient.Error(), zap.Error(err))
		return nil, errFailedToGetUnverifiedPatient
	}

	if !bytes.Equal(r.ConsistencyToken, getUnverifiedPatientByIDResp.ConsistencyToken) {
		return nil, status.Error(codes.FailedPrecondition, "consistency tokens do not match")
	}

	unverifiedPatientSQL, err := ToUnverifiedPatientSQL(patient)
	if err != nil {
		logger.Errorw(errFailureToConvertPatient.Error(), zap.Error(err))
		return nil, errFailureToConvertPatient
	}

	updateUnverifiedPatientResp, err := s.DBService.UpdateUnverifiedPatientByID(ctx, patientssql.UpdateUnverifiedPatientParams{
		ID:                    unverifiedPatientSQL.ID,
		AthenaID:              unverifiedPatientSQL.AthenaID,
		DateOfBirth:           unverifiedPatientSQL.DateOfBirth,
		GivenName:             unverifiedPatientSQL.GivenName,
		FamilyName:            unverifiedPatientSQL.FamilyName,
		PhoneNumber:           unverifiedPatientSQL.PhoneNumber,
		LegalSex:              unverifiedPatientSQL.LegalSex,
		BirthSexID:            unverifiedPatientSQL.BirthSexID,
		GenderIdentity:        unverifiedPatientSQL.GenderIdentity,
		GenderIdentityDetails: unverifiedPatientSQL.GenderIdentityDetails,
	})
	if err != nil {
		logger.Errorw(failedToUpdateUnverifiedPatientMessage, zap.Error(err))
		return nil, status.Error(codes.Internal, failedToUpdateUnverifiedPatientMessage)
	}

	unverifiedPatient := UnverifiedPatientSQLToProto(updateUnverifiedPatientResp)
	consistencyToken, err := protoconv.TimestampToBytes(unverifiedPatient.UpdatedAt)
	if err != nil {
		logger.Errorw("failed to parse timestamp to bytes", zap.Error(err))
		return nil, errFailureToGenerateConsistencyToken
	}

	return &patientspb.UpdateUnverifiedPatientResponse{
		Patient:          unverifiedPatient,
		ConsistencyToken: consistencyToken,
	}, nil
}

func (s *GRPCServer) FindOrCreatePatientForUnverifiedPatient(ctx context.Context, r *patientspb.FindOrCreatePatientForUnverifiedPatientRequest) (*patientspb.FindOrCreatePatientForUnverifiedPatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	logger := s.Logger.With("method", "FindOrCreatePatientForUnverifiedPatient", "unverified_patient_id", r.GetId(), "billing_city_id", r.GetBillingCityId())
	unverifiedPatientSQL, err := s.DBService.GetUnverifiedPatientByID(ctx, r.GetId())
	if err != nil {
		if errors.Is(err, errPatientNotFound) {
			logger.Errorw("unverified patient not found with given ID", zap.Error(err))
			return nil, status.Error(codes.NotFound, "unverified patient not found with given ID")
		}
		logger.Errorw(errFailedToGetUnverifiedPatient.Error(), zap.Error(err))
		return nil, errFailedToGetUnverifiedPatient
	}

	if unverifiedPatientSQL.PatientID.Valid {
		associatedPatientID := unverifiedPatientSQL.PatientID.Int64
		patientIDStr := strconv.FormatInt(associatedPatientID, 10)
		patient, err := s.GetPatient(ctx, &patientspb.GetPatientRequest{
			PatientId: &patientIDStr,
		})
		if err != nil {
			logger.Errorw("failed to get patient linked to the unverified patient", zap.Error(err))
			return nil, err
		}

		return &patientspb.FindOrCreatePatientForUnverifiedPatientResponse{
			Patient:          patient.Patient,
			ConsistencyToken: patient.ConsistencyToken,
		}, nil
	}

	if r.BillingCityId == nil {
		return nil, errNoPatientBillingCity
	}

	unverifiedPatientProto := UnverifiedPatientSQLToProto(unverifiedPatientSQL)
	patientProto, err := patientconv.UnverifiedPatientToPatientProto(unverifiedPatientProto, r.BillingCityId)
	if err != nil {
		logger.Errorw("failed to convert unverified patient to create patient param", zap.Error(err))
		return nil, status.Error(codes.Internal, "failed to convert unverified patient to create patient param")
	}
	createdPatient, err := s.CreatePatient(ctx, &patientspb.CreatePatientRequest{Patient: patientProto})
	if err != nil {
		return nil, err
	}

	newPatientID, err := strconv.ParseInt(createdPatient.Patient.GetId(), 10, 64)
	if err != nil {
		logger.Errorw(failedToParsePatientIDMessage, zap.Error(err))
		return nil, status.Error(codes.Internal, failedToParsePatientIDMessage)
	}

	newPatientAthenaID, err := strconv.ParseInt(createdPatient.Patient.PrimaryIdentifier.GetRecordId(), 10, 64)
	if err != nil {
		logger.Errorw(failedToParseAthenaIDMessage, zap.Error(err))
		return nil, status.Error(codes.InvalidArgument, failedToParseAthenaIDMessage)
	}

	_, err = s.DBService.UpdateUnverifiedPatientByID(ctx, patientssql.UpdateUnverifiedPatientParams{
		ID:                    unverifiedPatientSQL.ID,
		AthenaID:              sqltypes.ToValidNullInt64(newPatientAthenaID),
		DateOfBirth:           unverifiedPatientSQL.DateOfBirth,
		GivenName:             unverifiedPatientSQL.GivenName,
		FamilyName:            unverifiedPatientSQL.FamilyName,
		PhoneNumber:           unverifiedPatientSQL.PhoneNumber,
		LegalSex:              unverifiedPatientSQL.LegalSex,
		BirthSexID:            unverifiedPatientSQL.BirthSexID,
		GenderIdentity:        unverifiedPatientSQL.GenderIdentity,
		GenderIdentityDetails: unverifiedPatientSQL.GenderIdentityDetails,
		PatientID:             sqltypes.ToValidNullInt64(newPatientID),
	})
	if err != nil {
		logger.Errorw(failedToUpdateUnverifiedPatientMessage, zap.Error(err))
		return nil, status.Error(codes.Internal, failedToUpdateUnverifiedPatientMessage)
	}

	return &patientspb.FindOrCreatePatientForUnverifiedPatientResponse{
		Patient:          createdPatient.Patient,
		ConsistencyToken: createdPatient.ConsistencyToken,
	}, nil
}

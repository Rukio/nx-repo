package athena

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	patientsBasePath                        = "patients"
	patientInsuranceBasePathTemplate        = "/patients/%s/insurances"
	patientInsuranceBenefitDetailsPath      = "/patients/%s/insurances/%s/benefitdetails"
	athenaPreferredPharmacyPathSuffix       = "pharmacies/preferred"
	athenaDefaultPharmacyPathSuffix         = "pharmacies/default"
	athenaEncounterPatientGoalsSegment      = "patientgoals"
	athenaEncounterUpdateDiscussNotesSuffix = "discussionnotes"
	athenaLabResultsPathSuffix              = "labresults"
	athenaLabResultsChangedSubscriptionPath = "labresults/changed/subscription"
	athenaPatientDocumentBasePathTemplate   = "patients/%s/documents"
	athenaLabResultSegment                  = "labresult/%s"
	athenaOrderSegment                      = "order/%s"
	patientsChangedBasePath                 = "patients/changed"
	patientsChangedSubscriptionPath         = "patients/changed/subscription"
	patientPaymentPath                      = "patients/%s/collectpayment"
	patientStoredCardPath                   = "patients/%s/collectpayment/storedcard"
	patientDeleteCreditCardPath             = "patients/%s/collectpayment/storedcard/%s"
	dateLayout                              = "01/02/2006"
)

type ClientAPI interface {
	IsHealthy(ctx context.Context) bool
	GetPatient(ctx context.Context, patientID string) (*athenapb.Patient, error)
	EnhancedBestMatch(ctx context.Context, request *converters.EnhancedBestMatchRequest) ([]*athenapb.EnhancedBestMatchResult, error)
	GetCareTeam(ctx context.Context, patientID, departmentID string) ([]*athenapb.CareTeamMember, *string, error)
	UpdateDefaultPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error
	GetPreferredPharmacies(ctx context.Context, patientID string, departmentID string) ([]*athenapb.Pharmacy, error)
	UpdatePreferredPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error
	GetDefaultPharmacy(ctx context.Context, patientID string, departmentID string) (*athenapb.Pharmacy, error)
	DeletePreferredPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error
	CreatePatient(ctx context.Context, patient *athenapb.Patient) (*string, error)
	UpdateCareTeam(ctx context.Context, patientID, clinicalProviderID, departmentID, recipientClassID string) error
	UpdatePatient(ctx context.Context, patient *athenapb.Patient) (*string, error)
	DeleteCareTeam(ctx context.Context, patientID, memberID, departmentID string) error
	CreatePatientInsurance(ctx context.Context, insuranceRecord *athenapb.Insurance) (*athenapb.Insurance, error)
	GetPatientInsurances(ctx context.Context, patientID string) ([]*athenapb.Insurance, error)
	UpdateSpecificInsurance(ctx context.Context, insuranceRecord *athenapb.Insurance) error
	DeleteSpecificInsurance(ctx context.Context, patientID string, insuranceID string) error
	SearchClinicalProviders(ctx context.Context, r *converters.ClinicalProvider) ([]*athenapb.ClinicalProviderSearchResult, error)
	ListChangedLabResults(ctx context.Context, params url.Values) (*converters.ChangedLabResults, error)
	ListChangedPatients(ctx context.Context, params url.Values) (*converters.ChangedPatients, error)
	GetPatientGoals(ctx context.Context, encounterID string) (*string, error)
	UpdatePatientDiscussionNotes(ctx context.Context, encounterID string, discussionNotes string, replaceDiscussionNotes bool) (*string, error)
	ListPatientLabResults(ctx context.Context, patientID string, departmentID string, encounterID string) ([]*athenapb.LabResult, error)
	ListRecipientClasses(ctx context.Context, limit *int32, offset *int32) (*converters.GetRecipientClassesResponse, error)
	CheckLabResultsSubscriptionStatus(ctx context.Context) (string, error)
	SubscribeLabResultEvents(ctx context.Context) error
	CheckPatientsSubscriptionStatus(ctx context.Context) (string, error)
	SubscribePatientEvents(ctx context.Context) error
	MakePatientPayment(ctx context.Context, patientID string, paymentInfo *converters.PatientPaymentInformation) ([]*converters.PatientPaymentResponse, error)
	UploadPatientCreditCardDetails(ctx context.Context, patientID string, creditCardInfo *converters.AthenaCreditCardInformation) ([]*converters.UploadPatientCreditCardResponse, error)
	GetPatientCreditCardDetails(ctx context.Context, patientID string, departmentID string) ([]*converters.GetStoredCreditCardResponse, error)
	DeleteStoredCreditCard(ctx context.Context, patientID string, storedCardID string, departmentID string) (*converters.DeleteStoredCardResponse, error)
	SearchPatients(ctx context.Context, searchTerm string) ([]*athenapb.SearchPatientsResult, error)
	GetPatientLabResultDocument(ctx context.Context, patientID string, labResultID string) ([]*athenapb.LabResultDocument, error)
	GetPatientInsuranceBenefitDetails(ctx context.Context, patientID, insuranceID, serviceTypeCode string, dateOfService *common.Date) (*athenapb.InsuranceBenefitDetails, error)
	TriggerPatientInsuranceEligibilityCheck(ctx context.Context, patientID, insuranceID, serviceTypeCode string, dateOfService *common.Date) error
	GetPatientOrder(ctx context.Context, patientID string, orderID string) (*athenapb.PatientOrder, error)
}

func (c *Client) IsHealthy(ctx context.Context) bool {
	resp := &healthcheckResponse{}
	options := RequestOptions{
		Method:   http.MethodGet,
		Path:     "ping",
		Request:  nil,
		Response: resp,
	}
	err := c.request(ctx, &options)
	if err != nil {
		return false
	}
	return resp.Pong == "true"
}

func (c *Client) GetPatient(ctx context.Context, patientID string) (*athenapb.Patient, error) {
	var patient []converters.Patient
	path, err := url.JoinPath(patientsBasePath, patientID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build get patient URL. err: %s", err)
	}

	params := url.Values{}
	params.Set("show2015edcehrtvalues", "true")
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		Response:    &patient,
		QueryParams: params,
	}
	err = c.request(ctx, &options)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to get patient from AthenaAPI. err: %s", err)
	}
	if len(patient) != 1 {
		return nil, status.Errorf(codes.Internal, "Failed to get patient from AthenaAPI. Expected 1 result, received %d", len(patient))
	}
	patientProto, err := converters.PatientProtoFromAthenaPatient(patient[0])
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build GetPatient response. err: %s", err)
	}
	return patientProto, nil
}

func (c *Client) EnhancedBestMatch(ctx context.Context, request *converters.EnhancedBestMatchRequest) ([]*athenapb.EnhancedBestMatchResult, error) {
	path := "patients/enhancedbestmatch"

	urlValues := converters.StructToURLValues(request, fieldNameFromTagJSON)
	urlValues.Set("show2015edcehrtvalues", "true")

	var results []converters.EnhancedBestMatchResult
	options := RequestOptions{
		Method:      http.MethodGet,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Path:        path,
		QueryParams: urlValues,
		Response:    &results,
	}
	err := c.request(ctx, &options)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to query enhancedbestmatch from AthenaAPI. err: %s", err)
	}

	resultProtos := make([]*athenapb.EnhancedBestMatchResult, len(results))
	for i, result := range results {
		enhancedBestMatchResultProto, err := converters.EnhancedBestMatchResultToProto(result)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to build EnhancedBestMatch response. err: %s", err)
		}
		resultProtos[i] = enhancedBestMatchResultProto
	}
	return resultProtos, nil
}

func (c *Client) GetCareTeam(ctx context.Context, patientID, departmentID string) ([]*athenapb.CareTeamMember, *string, error) {
	path, err := url.JoinPath("chart", patientID, "careteam")
	if err != nil {
		return nil, nil, status.Errorf(codes.Internal, "failed to build get care team URL: %v", err)
	}

	params := url.Values{"departmentid": []string{departmentID}}

	var careTeam converters.CareTeam
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		Response:    &careTeam,
		QueryParams: params,
	}

	if err = c.request(ctx, &options); err != nil {
		return nil, nil, status.Errorf(codes.Internal, "failed to get care team from Athena: %s", err)
	}

	if len(careTeam.Members) == 0 {
		return nil, nil, status.Error(codes.NotFound, "patient does not have a care team")
	}

	members := make([]*athenapb.CareTeamMember, len(careTeam.Members))

	for i, ct := range careTeam.Members {
		careTeamProto, err := converters.CareTeamMemberToProto(&ct)
		if err != nil {
			return nil, nil, status.Errorf(codes.Internal, "failed to convert Care Team struct into Care Team proto: %s", err)
		}

		members[i] = careTeamProto
	}

	return members, careTeam.Note, nil
}

func (c *Client) UpdateDefaultPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error {
	path, err := url.JoinPath("chart", patientID, athenaDefaultPharmacyPathSuffix)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build update default pharmacy URL: %v", err)
	}
	params := url.Values{}
	params.Set("departmentid", departmentID)
	params.Set("clinicalproviderid", clinicalProviderID)

	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		QueryParams: params,
	}

	err = c.request(ctx, &options)
	if err != nil {
		respStatus, _ := status.FromError(err)
		return status.Errorf(respStatus.Code(), respStatus.Message())
	}

	return nil
}

func (c *Client) GetPreferredPharmacies(ctx context.Context, patientID string, departmentID string) ([]*athenapb.Pharmacy, error) {
	var pharmacyResponse converters.PreferredPharmacies

	path, err := url.JoinPath("chart", patientID, athenaPreferredPharmacyPathSuffix)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build get preferred pharmacy URL: %v", err)
	}
	params := url.Values{}
	params.Set("departmentid", departmentID)

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &pharmacyResponse,
	}
	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "Failed to get patient preferred pharmacy from AthenaAPI. err: %s", err)
	}

	pharmaciesProto, err := converters.PatientPreferredPharmaciesProtoFromAthena(pharmacyResponse.PreferredPharmacies)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build GetPreferredPharmacy response. err: %s", err)
	}

	return pharmaciesProto, nil
}

func (c *Client) UpdatePreferredPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error {
	path, err := url.JoinPath("chart", patientID, athenaPreferredPharmacyPathSuffix)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build update preferred pharmacy URL: %v", err)
	}
	params := url.Values{}
	params.Set("departmentid", departmentID)
	params.Set("clinicalproviderid", clinicalProviderID)

	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		QueryParams: params,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return status.Errorf(codes.Internal, "Failed to update patient preferred pharmacy from AthenaAPI. err: %s", err)
	}

	return nil
}

func (c *Client) GetDefaultPharmacy(ctx context.Context, patientID string, departmentID string) (*athenapb.Pharmacy, error) {
	var defaultPharmacy converters.Pharmacy

	path := fmt.Sprintf("chart/%s/pharmacies/default", patientID)
	params := url.Values{}
	params.Set("departmentid", departmentID)

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &defaultPharmacy,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "Failed to get patient default pharmacy from AthenaAPI. err: %s", err)
	}

	defaultPharmacyProto, err := converters.PatientDefaultPharmacyProtoFromAthena(defaultPharmacy)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build GetPreferredPharmacy response. err: %s", err)
	}

	return defaultPharmacyProto, nil
}

func (c *Client) DeletePreferredPharmacy(ctx context.Context, patientID string, departmentID string, clinicalProviderID string) error {
	path, err := url.JoinPath("chart", patientID, athenaPreferredPharmacyPathSuffix)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build delete preferred pharmacy URL: %v", err)
	}
	params := url.Values{}
	params.Set("departmentid", departmentID)
	params.Set("clinicalproviderid", clinicalProviderID)

	options := RequestOptions{
		Method:      http.MethodDelete,
		Path:        path,
		QueryParams: params,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return status.Errorf(codes.Internal, "Failed to delete patient preferred pharmacy from AthenaAPI. err: %s", err)
	}

	return nil
}

func (c *Client) CreatePatient(ctx context.Context, patient *athenapb.Patient) (*string, error) {
	apiPatient, err := converters.PatientFromPatientProto(patient)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Failed to build athena API patient. err: %s", err)
	}
	patientURLValues := converters.StructToURLValues(apiPatient, fieldNameFromTagJSON)
	resp := []converters.CreateOrUpdatePatientResponse{}
	options := RequestOptions{
		Method:      http.MethodPost,
		Path:        patientsBasePath,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Request:     patientURLValues,
		Response:    &resp,
	}
	err = c.request(ctx, &options)
	if err != nil {
		return nil, err
	}
	if len(resp) != 1 {
		return nil, status.Errorf(codes.Internal, "Unexpected AthenaAPI response for create patient. Expected 1 result, received %d", len(resp))
	}
	return proto.String(resp[0].PatientID), nil
}

func (c *Client) UpdateCareTeam(ctx context.Context, patientID, clinicalProviderID, departmentID, recipientClassID string) error {
	path, err := url.JoinPath("chart", patientID, "careteam")
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build update care team URL: %v", err)
	}

	reqValues := url.Values{
		"clinicalproviderid": []string{clinicalProviderID},
		"departmentid":       []string{departmentID},
		"recipientclassid":   []string{recipientClassID},
	}

	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Request:     reqValues,
	}

	if err = c.request(ctx, &options); err != nil {
		return status.Errorf(codes.Internal, "failed to update care team from Athena: %s", err)
	}

	return nil
}

func (c *Client) UpdatePatient(ctx context.Context, patient *athenapb.Patient) (*string, error) {
	path, err := url.JoinPath(patientsBasePath, *patient.PatientId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build update patient URL: %v", err)
	}

	apiPatient, err := converters.PatientFromPatientProto(patient)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "Failed to build athena API patient. err: %s", err)
	}
	patientURLValues := converters.StructToURLValues(apiPatient, fieldNameFromTagJSON)
	patientURLValues.Set("show2015edcehrtvalues", "true")
	resp := []converters.CreateOrUpdatePatientResponse{}
	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Request:     patientURLValues,
		Response:    &resp,
	}
	err = c.request(ctx, &options)
	if err != nil {
		return nil, err
	}
	if len(resp) != 1 {
		return nil, status.Errorf(codes.Internal, "Unexpected AthenaAPI response for create patient. Expected 1 result, received %d", len(resp))
	}
	return proto.String(resp[0].PatientID), nil
}

func (c *Client) DeleteCareTeam(ctx context.Context, patientID, memberID, departmentID string) error {
	path, err := url.JoinPath("chart", patientID, "careteam")
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build delete care team URL: %v", err)
	}

	params := url.Values{
		"memberid":     []string{memberID},
		"departmentid": []string{departmentID},
	}

	options := RequestOptions{
		Method:      http.MethodDelete,
		Path:        path,
		ContentType: httpclient.ContentTypeJSON,
		QueryParams: params,
	}

	if err = c.request(ctx, &options); err != nil {
		return status.Errorf(codes.Internal, "failed to delete care team from Athena: %s", err)
	}

	return nil
}

func (c *Client) CreatePatientInsurance(ctx context.Context, insuranceRecord *athenapb.Insurance) (*athenapb.Insurance, error) {
	path := fmt.Sprintf(patientInsuranceBasePathTemplate, *insuranceRecord.PatientId)

	apiInsuranceRecord := converters.PatientInsuranceRecordFromInsuranceProto(insuranceRecord)
	insuranceRecordURLValues := converters.StructToURLValues(apiInsuranceRecord, fieldNameFromTagJSON)

	resp := []converters.PatientInsurance{}
	options := RequestOptions{
		Method:      http.MethodPost,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Request:     insuranceRecordURLValues,
		Response:    &resp,
	}
	err := c.request(ctx, &options)
	if err != nil {
		return nil, err
	}
	if len(resp) != 1 {
		return nil, status.Errorf(codes.Internal, "Unexpected athena response for create patient insurance. Expected 1 result, received %d", len(resp))
	}

	protoInsuranceRecord, err := converters.PatientInsuranceProtoFromAthenaPatientInsurance(&resp[0])
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build CreatePatientInsurance response, err: %s", err)
	}

	return protoInsuranceRecord, nil
}

func (c *Client) GetPatientInsurances(ctx context.Context, patientID string) ([]*athenapb.Insurance, error) {
	path := fmt.Sprintf(patientInsuranceBasePathTemplate, patientID)

	resp := converters.GetPatientInsuranceResponse{}
	options := RequestOptions{
		Method:   http.MethodGet,
		Path:     path,
		Response: &resp,
	}
	err := c.request(ctx, &options)
	if err != nil {
		return nil, err
	}

	var insuranceRecords = make([]*athenapb.Insurance, len(resp.Insurances))
	for i, record := range resp.Insurances {
		protoInsurance, err := converters.PatientInsuranceProtoFromAthenaPatientInsurance(&record)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to build GetPatientInsurance response, err: %s", err)
		}
		insuranceRecords[i] = protoInsurance
	}

	return insuranceRecords, nil
}

func (c *Client) UpdateSpecificInsurance(ctx context.Context, insuranceRecord *athenapb.Insurance) error {
	if insuranceRecord == nil {
		return status.Error(codes.InvalidArgument, "insurance data is empty")
	}
	if insuranceRecord.PatientId == nil {
		return status.Error(codes.InvalidArgument, "patient id is empty")
	}
	if insuranceRecord.InsuranceId == nil {
		return status.Error(codes.InvalidArgument, "athena insurance id is empty")
	}
	basePath := fmt.Sprintf(patientInsuranceBasePathTemplate, *insuranceRecord.PatientId)
	path, err := url.JoinPath(basePath, *insuranceRecord.InsuranceId)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build update specific insurance URL: %v", err)
	}

	apiInsuranceRecord := converters.PatientInsuranceRecordFromInsuranceProto(insuranceRecord)
	insuranceRecordURLValues := converters.StructToURLValues(apiInsuranceRecord, fieldNameFromTagJSON)

	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Request:     insuranceRecordURLValues,
	}
	err = c.request(ctx, &options)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to update patient insurance: %s", err)
	}
	return nil
}

func (c *Client) DeleteSpecificInsurance(ctx context.Context, patientID string, insuranceID string) error {
	basePath := fmt.Sprintf(patientInsuranceBasePathTemplate, patientID)
	path, err := url.JoinPath(basePath, insuranceID)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to build delete specific patient insurance URL: %v", err)
	}
	params := url.Values{
		"patientid":   []string{patientID},
		"insuranceid": []string{insuranceID},
	}

	options := RequestOptions{
		Method:      http.MethodDelete,
		Path:        path,
		ContentType: httpclient.ContentTypeJSON,
		QueryParams: params,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return status.Errorf(codes.Internal, "Failed to delete specific patient insurance from AthenaAPI. err: %s", err)
	}

	return nil
}

func (c *Client) SearchClinicalProviders(ctx context.Context, r *converters.ClinicalProvider) ([]*athenapb.ClinicalProviderSearchResult, error) {
	path := "clinicalproviders/search"

	reqValues := converters.StructToURLValues(r, fieldNameFromTagJSON)

	var searchResp converters.ClinicalProviderSearchResult
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: reqValues,
		Response:    &searchResp,
	}

	if err := c.request(ctx, &options); err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to search clinical providers: %s", err)
	}

	clinicalProviderProtos := make([]*athenapb.ClinicalProviderSearchResult, len(searchResp.ClinicalProviders))
	for i, clinicalProvider := range searchResp.ClinicalProviders {
		clinicalProviderProto, err := converters.ClinicalProviderToProto(clinicalProvider)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to convert Clinical Provider to Clinical Provider proto: %s", err)
		}

		clinicalProviderProtos[i] = clinicalProviderProto
	}

	return clinicalProviderProtos, nil
}

func (c *Client) ListChangedLabResults(ctx context.Context, params url.Values) (*converters.ChangedLabResults, error) {
	path := "labresults/changed"
	var changedLabResultsResponse converters.ChangedLabResults

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		Response:    &changedLabResultsResponse,
		QueryParams: params,
	}
	if err := c.request(ctx, &options); err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to list changed lab results: %s", err)
	}

	return &converters.ChangedLabResults{LabResults: changedLabResultsResponse.LabResults}, nil
}

func (c *Client) ListChangedPatients(ctx context.Context, params url.Values) (*converters.ChangedPatients, error) {
	var changedPatientsResponse converters.ChangedPatients
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        patientsChangedBasePath,
		Response:    &changedPatientsResponse,
		QueryParams: params,
	}

	if err := c.request(ctx, &options); err != nil {
		respStatus := status.Convert(err)
		if respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to list changed patients: %s", err)
	}

	return &changedPatientsResponse, nil
}

func (c *Client) CheckPatientsSubscriptionStatus(ctx context.Context) (string, error) {
	var resp converters.PatientChangeEventsSubscription

	options := RequestOptions{
		Method:   http.MethodGet,
		Path:     patientsChangedSubscriptionPath,
		Response: &resp,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return "", status.Errorf(codes.NotFound, respStatus.Message())
		}
		return "", status.Errorf(codes.Internal, "Failed to get changed patients subscription from AthenaAPI. err: %s", err)
	}

	return *resp.Status, nil
}

func (c *Client) SubscribePatientEvents(ctx context.Context) error {
	options := RequestOptions{
		Method: http.MethodPost,
		Path:   patientsChangedSubscriptionPath,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return status.Errorf(codes.NotFound, respStatus.Message())
		}
		return status.Errorf(codes.Internal, "Failed to subscribe to changed patients. err: %s", err)
	}

	return err
}

func (c *Client) UpdatePatientDiscussionNotes(ctx context.Context, encounterID string, discussionNotes string, replaceDiscussionNotes bool) (*string, error) {
	var discussionNotesResponse converters.UpdatePatientDiscussionNotes

	path, err := url.JoinPath("chart/encounter", encounterID, athenaEncounterPatientGoalsSegment, athenaEncounterUpdateDiscussNotesSuffix)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build update patient discussion notes URL: %v", err)
	}
	params := url.Values{}
	params.Set("discussionnotes", discussionNotes)
	params.Set("replacediscussionnotes", strconv.FormatBool(replaceDiscussionNotes))

	options := RequestOptions{
		Method:      http.MethodPut,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		QueryParams: params,
		Response:    &discussionNotesResponse,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "Failed to update patient discussion notes from AthenaAPI. err: %s", err)
	}

	return &discussionNotesResponse.DiscussionNotes, nil
}

func (c *Client) ListPatientLabResults(ctx context.Context, patientID string, departmentID string, encounterID string) ([]*athenapb.LabResult, error) {
	var labResultsResponse converters.LabResults

	path, err := url.JoinPath("chart", patientID, athenaLabResultsPathSuffix)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build list patient lab results URL: %v", err)
	}
	params := url.Values{}
	params.Set("departmentid", departmentID)
	params.Set("allresultsbyencounterid", encounterID)

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &labResultsResponse,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "Failed to get patient lab results from AthenaAPI. err: %s", err)
	}

	labResultsProto, err := converters.PatientLabResultsProtoFromAthena(labResultsResponse.LabResults)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build ListPatientLabResults response. err: %s", err)
	}

	return labResultsProto, nil
}

func (c *Client) ListRecipientClasses(ctx context.Context, limit *int32, offset *int32) (*converters.GetRecipientClassesResponse, error) {
	var response converters.GetRecipientClassesResponse
	path := "chart/configuration/recipientclasses"

	params := url.Values{}
	if limit != nil {
		params.Add("limit", string(*limit))
	}
	if offset != nil {
		params.Add("offset", string(*offset))
	}
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		Response:    &response,
		QueryParams: params,
	}
	err := c.request(ctx, &options)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to get recipient classes from AthenaAPI. err: %s", err)
	}
	return &response, nil
}

func (c *Client) CheckLabResultsSubscriptionStatus(ctx context.Context) (string, error) {
	var resp converters.LabResultChangeEventsSubscription

	options := RequestOptions{
		Method:   http.MethodGet,
		Path:     athenaLabResultsChangedSubscriptionPath,
		Response: &resp,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return "", status.Errorf(codes.NotFound, respStatus.Message())
		}
		return "", status.Errorf(codes.Internal, "Failed to get changed lab results subscription from AthenaAPI. err: %s", err)
	}

	return *resp.Status, nil
}

func (c *Client) SubscribeLabResultEvents(ctx context.Context) error {
	options := RequestOptions{
		Method: http.MethodPost,
		Path:   athenaLabResultsChangedSubscriptionPath,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return status.Errorf(codes.NotFound, respStatus.Message())
		}
		return status.Errorf(codes.Internal, "Failed to subscribe to changed lab results. err: %s", err)
	}

	return err
}

func (c *Client) MakePatientPayment(ctx context.Context, patientID string, paymentInfo *converters.PatientPaymentInformation) ([]*converters.PatientPaymentResponse, error) {
	var paymentsResponse []*converters.PatientPaymentResponse
	path := fmt.Sprintf(patientPaymentPath, patientID)

	paymentInfoURLValues := converters.StructToURLValues(paymentInfo, fieldNameFromTagJSON)

	options := RequestOptions{
		Method:      http.MethodPost,
		Path:        path,
		Request:     paymentInfoURLValues,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Response:    &paymentsResponse,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "Failed to make a patient's payment. err: %s", err)
	}

	return paymentsResponse, nil
}

func (c *Client) UploadPatientCreditCardDetails(ctx context.Context, patientID string, creditCardInfo *converters.AthenaCreditCardInformation) ([]*converters.UploadPatientCreditCardResponse, error) {
	var creditCardsResponse []*converters.UploadPatientCreditCardResponse
	path := fmt.Sprintf(patientStoredCardPath, patientID)

	paymentInfoURLValues := converters.StructToURLValues(creditCardInfo, fieldNameFromTagJSON)

	options := RequestOptions{
		Method:      http.MethodPost,
		Path:        path,
		Request:     paymentInfoURLValues,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Response:    &creditCardsResponse,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to make a patient's payment. err: %s", err)
	}

	return creditCardsResponse, nil
}

func (c *Client) GetPatientCreditCardDetails(ctx context.Context, patientID string, departmentID string) ([]*converters.GetStoredCreditCardResponse, error) {
	var creditCardsResponse []*converters.GetStoredCreditCardResponse

	path := fmt.Sprintf(patientStoredCardPath, patientID)
	params := url.Values{}
	params.Set("departmentid", departmentID)

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &creditCardsResponse,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.NotFound {
			return nil, status.Errorf(codes.NotFound, respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to get patient credit card details. err: %s", err)
	}

	return creditCardsResponse, nil
}

func (c *Client) DeleteStoredCreditCard(ctx context.Context, patientID string, storedCardID string, departmentID string) (*converters.DeleteStoredCardResponse, error) {
	var deleteCreditCardResponse *converters.DeleteStoredCardResponse
	path := fmt.Sprintf(patientDeleteCreditCardPath, patientID, storedCardID)

	params := url.Values{}
	params.Set("departmentid", departmentID)

	options := RequestOptions{
		Method:      http.MethodDelete,
		Path:        path,
		QueryParams: params,
		Response:    &deleteCreditCardResponse,
	}

	err := c.request(ctx, &options)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() != codes.Unknown {
			return nil, status.Errorf(respStatus.Code(), respStatus.Message())
		}
		return nil, status.Errorf(codes.Internal, "failed to delete patient credit card from AthenaAPI. err: %s", err)
	}

	return deleteCreditCardResponse, nil
}

func (c *Client) SearchPatients(ctx context.Context, searchTerm string) ([]*athenapb.SearchPatientsResult, error) {
	path := "patients/search"

	params := url.Values{}
	params.Set("searchterm", searchTerm)
	var results converters.SearchPatientResponse
	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &results,
	}

	err := c.request(ctx, &options)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to query patients from AthenaAPI. err: %s", err)
	}

	resultProtos := make([]*athenapb.SearchPatientsResult, len(results.SearchPatientResults))
	for i, result := range results.SearchPatientResults {
		searchPatientResultProto, err := converters.SearchPatientResultToProto(&result)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "Failed to build SearchPatient response. err: %s", err)
		}
		resultProtos[i] = searchPatientResultProto
	}
	return resultProtos, nil
}

func (c *Client) GetPatientLabResultDocument(ctx context.Context, patientID string, labResultID string) ([]*athenapb.LabResultDocument, error) {
	var labResultDocumentResponse []converters.LabResultDocument

	basePath := fmt.Sprintf(athenaPatientDocumentBasePathTemplate, patientID)
	labResultPath := fmt.Sprintf(athenaLabResultSegment, labResultID)
	path, err := url.JoinPath(basePath, labResultPath)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build get patient lab result document path: %v", err)
	}

	options := RequestOptions{
		Method:   http.MethodGet,
		Path:     path,
		Response: &labResultDocumentResponse,
	}

	err = c.request(ctx, &options)
	if err != nil {
		if status.Convert(err).Code() == codes.NotFound {
			return nil, err
		}
		return nil, status.Errorf(codes.Internal, "Failed to get patient lab results from AthenaAPI. err: %s", err)
	}

	labResultsProto, err := converters.PatientLabResultDocumentProtoFromAthena(labResultDocumentResponse)

	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build GetPatientLabResultDocument response. err: %s", err)
	}

	return labResultsProto, nil
}

func (c *Client) GetPatientInsuranceBenefitDetails(ctx context.Context, patientID, insuranceID, serviceTypeCode string, dateOfService *common.Date) (*athenapb.InsuranceBenefitDetails, error) {
	var patientInsuranceBenefitDetails converters.PatientInsuranceBenefitDetails
	path := fmt.Sprintf(patientInsuranceBenefitDetailsPath, patientID, insuranceID)

	params := url.Values{}
	if serviceTypeCode != "" {
		params.Set("servicetypecode", serviceTypeCode)
	}
	if dateOfService != nil {
		params.Set("dateofservice", *protoconv.ProtoDateToString(dateOfService, dateLayout))
	}

	options := RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		QueryParams: params,
		Response:    &patientInsuranceBenefitDetails,
	}
	err := c.request(ctx, &options)
	if err != nil {
		if status.Convert(err).Code() == codes.NotFound {
			return nil, err
		}
		return nil, status.Errorf(codes.Internal, "Failed to GetPatientInsuranceBenefitDetails from AthenaAPI. err: %s", err)
	}

	insuranceProto, err := converters.InsuranceBenefitDetailsToProto(patientInsuranceBenefitDetails)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to build GetPatientInsuranceBenefitDetails response. err: %s", err)
	}

	return insuranceProto, nil
}

func (c *Client) TriggerPatientInsuranceEligibilityCheck(ctx context.Context, patientID, insuranceID, serviceTypeCode string, dateOfService *common.Date) error {
	path := fmt.Sprintf(patientInsuranceBenefitDetailsPath, patientID, insuranceID)

	params := url.Values{}
	if serviceTypeCode != "" {
		params.Set("servicetypecode", serviceTypeCode)
	}
	if dateOfService != nil {
		params.Set("dateofservice", *protoconv.ProtoDateToString(dateOfService, dateLayout))
	}

	options := RequestOptions{
		Method:      http.MethodPost,
		Path:        path,
		QueryParams: params,
	}

	err := c.request(ctx, &options)
	if err != nil {
		return status.Errorf(codes.Internal, "Failed to trigger patient insurance eligibility check. err: %s", err)
	}

	return err
}

func (c *Client) GetPatientGoals(ctx context.Context, encounterID string) (*string, error) {
	var patientGoalsResponse converters.PatientGoals

	path, err := url.JoinPath("chart/encounter", encounterID, athenaEncounterPatientGoalsSegment)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build get patient goals path: %v", err)
	}

	err = c.request(ctx, &RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		ContentType: httpclient.ContentTypeFormURLEncoded,
		Response:    &patientGoalsResponse,
	})

	if err != nil {
		if code := status.Code(err); code != codes.NotFound {
			return nil, status.Errorf(codes.Internal, "failed to get patient goals from AthenaAPI: %s", err)
		}

		return nil, err
	}

	return &patientGoalsResponse.DiscussionNotes, nil
}

func (c *Client) GetPatientOrder(ctx context.Context, patientID string, orderID string) (*athenapb.PatientOrder, error) {
	var patientOrder []converters.PatientOrder

	basePath := fmt.Sprintf(athenaPatientDocumentBasePathTemplate, patientID)
	orderPath := fmt.Sprintf(athenaOrderSegment, orderID)
	path, err := url.JoinPath(basePath, orderPath)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to build get patient order path: %v", err)
	}

	err = c.request(ctx, &RequestOptions{
		Method:      http.MethodGet,
		Path:        path,
		ContentType: httpclient.ContentTypeJSON,
		Response:    &patientOrder,
	})

	if err != nil {
		if code := status.Code(err); code != codes.NotFound {
			return nil, status.Errorf(codes.Internal, "failed to get patient order from AthenaAPI: %s", err)
		}

		return nil, err
	}

	if len(patientOrder) != 1 {
		return nil, status.Errorf(codes.Internal, "received %d count patient orders in response from AthenaAPI: %s", len(patientOrder), err)
	}

	return &athenapb.PatientOrder{
		OrderId:     patientOrder[0].OrderID,
		EncounterId: patientOrder[0].EncounterID,
	}, nil
}

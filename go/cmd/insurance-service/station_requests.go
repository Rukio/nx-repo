package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"

	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	"github.com/*company-data-covered*/services/go/pkg/station"
)

type StationInsuranceClassification struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

type StationModality struct {
	ID          int64  `json:"id"`
	DisplayName string `json:"display_name"`
	Type        string `json:"type"`
}

type StationNetworkModalityConfig struct {
	ID            *int64 `json:"id"`
	NetworkID     int64  `json:"network_id"`
	BillingCityID int64  `json:"billing_city_id"`
	ServiceLineID int64  `json:"service_line_id"`
	ModalityID    int64  `json:"modality_id"`
}

type StationModalitiesResponse struct {
	Modalities []StationModality `json:"modalities"`
}

type StationNetworkModalityConfigsResponse struct {
	Configs []StationNetworkModalityConfig `json:"configs"`
}

type StationUpdateNetworkModalityConfigsParams struct {
	NetworkID int64                          `json:"network_id"`
	Configs   []StationNetworkModalityConfig `json:"configs"`
}

type StationAppointmentType struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type StationServiceLine struct {
	ID                             int64                   `json:"id"`
	Name                           string                  `json:"name"`
	Default                        bool                    `json:"default"`
	ExistingPatientAppointmentType *StationAppointmentType `json:"existing_patient_appointment_type"`
	NewPatientAppointmentType      *StationAppointmentType `json:"new_patient_appointment_type"`
	ShiftTypeID                    int64                   `json:"shift_type_id"`
	ShiftTeamServiceID             *int64                  `json:"shift_team_service_id"`
	ParentID                       *int64                  `json:"parent_id"`
	OutOfNetworkInsurance          bool                    `json:"out_of_network_insurance"`
	RequireCheckout                bool                    `json:"require_checkout"`
	RequireConsentSignature        bool                    `json:"require_consent_signature"`
	RequireMedicalNecessity        bool                    `json:"require_medical_necessity"`
	Followup2Day                   bool                    `json:"followup_2_day"`
	Followup14To30Day              bool                    `json:"follow_up_14_30_day"`
	Is911                          bool                    `json:"is_911"`
	UpgradeableWithScreening       bool                    `json:"upgradeable_with_screening"`
	UpdatedAt                      string                  `json:"updated_at"`
	CreatedAt                      string                  `json:"created_at"`
}

type StationListEligibleNetworksRequest struct {
	BillingCityID *int64 `json:"billing_city_id"`
	ServiceLineID *int64 `json:"service_line_id"`
}

func (s *InsuranceGRPCServer) getInsuranceClassifications(ctx context.Context) ([]StationInsuranceClassification, error) {
	var insuranceClassifications []StationInsuranceClassification

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/insurance_classifications",
		RespData: &insuranceClassifications,
	})
	if err != nil {
		return nil, err
	}

	return insuranceClassifications, nil
}

func (s *InsuranceGRPCServer) getModalities(ctx context.Context) ([]StationModality, error) {
	var respData StationModalitiesResponse

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/modalities",
		RespData: &respData,
	})
	if err != nil {
		return nil, err
	}

	return respData.Modalities, nil
}

func (s *InsuranceGRPCServer) listNetworkModalityConfigs(ctx context.Context, networkID int64) ([]StationNetworkModalityConfig, error) {
	var respData StationNetworkModalityConfigsResponse

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        "/api/modalities/network-configs",
		QueryParams: url.Values{"network_id": []string{fmt.Sprintf("%d", networkID)}},
		RespData:    &respData,
	})
	if err != nil {
		return nil, err
	}

	return respData.Configs, nil
}

func (s *InsuranceGRPCServer) updateNetworkModalityConfigs(ctx context.Context, params *StationUpdateNetworkModalityConfigsParams) ([]StationNetworkModalityConfig, error) {
	var respData StationNetworkModalityConfigsResponse

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodPatch,
		Path:     "/api/modalities/network-configs",
		RespData: &respData,
		ReqBody:  params,
	})
	if err != nil {
		return nil, err
	}

	return respData.Configs, nil
}

func (s *InsuranceGRPCServer) listNetworkServiceLines(ctx context.Context, networkID int64) ([]StationServiceLine, error) {
	var serviceLines []StationServiceLine

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        "/api/modalities/network-service-lines",
		QueryParams: url.Values{"network_id": []string{fmt.Sprintf("%d", networkID)}},
		RespData:    &serviceLines,
	})
	if err != nil {
		return nil, err
	}

	return serviceLines, nil
}

func (s *InsuranceGRPCServer) listEligibleNetworks(ctx context.Context, req StationListEligibleNetworksRequest) ([]int64, error) {
	var networkIDs []int64
	queryParams := url.Values{}

	if req.BillingCityID != nil {
		queryParams["billing_city_id"] = []string{fmt.Sprintf("%d", *req.BillingCityID)}
	}
	if req.ServiceLineID != nil {
		queryParams["service_line_id"] = []string{fmt.Sprintf("%d", *req.ServiceLineID)}
	}

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        "/api/modalities/eligible-networks",
		QueryParams: queryParams,
		RespData:    &networkIDs,
	})
	if err != nil {
		return nil, err
	}

	return networkIDs, nil
}

func (s *InsuranceGRPCServer) getServiceLines(ctx context.Context) ([]StationServiceLine, error) {
	var serviceLines []StationServiceLine

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/service_lines",
		RespData: &serviceLines,
	})
	if err != nil {
		return nil, err
	}

	return serviceLines, nil
}

func (s *InsuranceGRPCServer) GetPayerGroups(ctx context.Context, ids []int64) ([]*insurancepb.PayerGroup, error) {
	response, err := s.PayerGroupService.ListPayerGroups(ctx, &payergrouppb.ListPayerGroupsRequest{PayerGroupIds: ids})

	if err != nil {
		return nil, err
	}

	return PayerGroupsFromStationPayerGroups(response.PayerGroups), nil
}

func (s *InsuranceGRPCServer) getStates(ctx context.Context, stateIds []int64) ([]*insurancepb.State, error) {
	res, err := s.StateService.ListStates(ctx, &statepb.ListStatesRequest{Ids: stateIds})

	if err != nil {
		return nil, err
	}

	return StatesFromStationStates(res.States), nil
}

func (s *InsuranceGRPCServer) createInsurancePlan(ctx context.Context, r *insuranceplanpb.CreateInsurancePlanRequest) (*insuranceplanpb.InsurancePlan, error) {
	res, err := s.InsurancePlanService.CreateInsurancePlan(ctx, r)
	if err != nil {
		return nil, err
	}

	return res.InsurancePlan, nil
}

func (s *InsuranceGRPCServer) updateInsurancePlan(ctx context.Context, r *insuranceplanpb.UpdateInsurancePlanRequest) (*insuranceplanpb.InsurancePlan, error) {
	res, err := s.InsurancePlanService.UpdateInsurancePlan(ctx, r)
	if err != nil {
		return nil, err
	}

	return res.InsurancePlan, nil
}

func (s *InsuranceGRPCServer) upsertInsurancePlanCreditCardPolicies(ctx context.Context, r *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest) (*insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse, error) {
	_, err := s.InsurancePlanService.UpsertInsurancePlanCreditCardPolicy(ctx, r)
	if err != nil {
		return nil, err
	}

	return &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{}, nil
}

func (s *InsuranceGRPCServer) listInsuranceCreditCardRules(ctx context.Context, insurancePlanID int64) (*insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse, error) {
	return s.InsurancePlanService.ListInsurancePlanCreditCardPolicy(ctx, &insuranceplanpb.ListInsurancePlanCreditCardPolicyRequest{InsurancePlanId: insurancePlanID})
}

func (s *InsuranceGRPCServer) getAppointmentTypes(ctx context.Context) ([]StationAppointmentType, error) {
	var appointmentTypes []StationAppointmentType

	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/ehrs/appointment_types",
		RespData: &appointmentTypes,
	})
	if err != nil {
		return nil, err
	}

	return appointmentTypes, nil
}

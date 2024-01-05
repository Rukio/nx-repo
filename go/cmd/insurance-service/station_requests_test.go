package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

func TestGetInsuranceClassifications(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()

	goodResponse := []StationInsuranceClassification{
		{
			ID:   baseID,
			Name: "Commercial",
		},
	}
	badResponse := struct {
		insuranceClassifications *[]StationInsuranceClassification
	}{
		insuranceClassifications: &goodResponse,
	}

	tcs := []struct {
		description       string
		stationHTTPStatus int
		stationResponse   any

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationInsuranceClassification
	}{
		{
			description:       "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			description:       "failure - bad response",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.getInsuranceClassifications(context.Background())
			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			if status.Code(err) != tc.wantStatusCode {
				t.Fatalf("%s got;  want %s", status.Code(err), tc.wantStatusCode)
			}

			if tc.wantResponse != nil {
				testutils.MustMatch(t, tc.wantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}

func TestGetModalities(t *testing.T) {
	goodResponse := StationModalitiesResponse{
		Modalities: []StationModality{
			{
				ID:          1,
				DisplayName: "Virtual",
				Type:        "virtual",
			},
		},
	}
	badResponse := []StationModalitiesResponse{goodResponse}

	tcs := []struct {
		description       string
		stationHTTPStatus int
		stationResponse   any

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationModality
	}{
		{
			description:       "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse.Modalities,
		},
		{
			description:       "failure - bad response",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.getModalities(context.Background())
			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			testutils.MustMatch(t, status.Code(err), tc.wantStatusCode)

			if tc.wantResponse != nil {
				testutils.MustMatch(t, tc.wantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}

func TestGetServiceLines(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	mockServiceLineName := "Bridge Service Line"
	mockAppointmentTypeName := "D05 - type"

	goodResponse := []StationServiceLine{
		{
			ID:      baseID,
			Name:    mockServiceLineName,
			Default: true,
			ExistingPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(int(baseID + 1)),
				Name: mockAppointmentTypeName,
			},
			NewPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(int(baseID + 2)),
				Name: mockAppointmentTypeName,
			},
			ShiftTypeID:              baseID + 3,
			OutOfNetworkInsurance:    false,
			RequireCheckout:          false,
			RequireMedicalNecessity:  false,
			RequireConsentSignature:  false,
			Followup2Day:             false,
			Followup14To30Day:        false,
			Is911:                    true,
			UpgradeableWithScreening: false,
			UpdatedAt:                now.String(),
			CreatedAt:                now.String(),
		},
	}
	badResponse := struct {
		serviceLines []StationServiceLine
	}{serviceLines: goodResponse}

	tcs := []struct {
		description       string
		stationHTTPStatus int
		stationResponse   any

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationServiceLine
	}{
		{
			description:       "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			description:       "failure - bad response",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.getServiceLines(context.Background())
			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			testutils.MustMatch(t, status.Code(err), tc.wantStatusCode)

			if tc.wantResponse != nil {
				testutils.MustMatch(t, tc.wantResponse, stationResponse, "unexpected response body")
			}
		})
	}
}

func TestStationClientGetPayerGroups(t *testing.T) {
	tcs := []struct {
		description string
		payerGroups []*insurancepb.PayerGroup

		grpcRes *payergrouppb.ListPayerGroupsResponse
		grpcErr error
		errMsg  string
	}{
		{
			description: "success - returns payer groups",
			payerGroups: []*insurancepb.PayerGroup{
				{Id: 1, Name: "Test", PayerGroupId: 3},
				{Id: 2, Name: "Test Two", PayerGroupId: 5},
			},

			grpcRes: &payergrouppb.ListPayerGroupsResponse{
				PayerGroups: []*payergrouppb.PayerGroup{
					{
						Id:           1,
						Name:         "Test",
						PayerGroupId: 3,
					},
					{
						Id:           2,
						Name:         "Test Two",
						PayerGroupId: 5,
					},
				},
			},
		},
		{
			description: "fails - station returns an error",
			payerGroups: nil,
			grpcErr:     errors.New("an error occurred"),
			errMsg:      "an error occurred",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				PayerGroupService: &MockPayerGroupServiceClient{
					ListPayerGroupsResult: tc.grpcRes,
					ListPayerGroupsErr:    tc.grpcErr,
				},
			}

			payerGroups, err := s.GetPayerGroups(context.Background(), []int64{})
			reqStatus, _ := status.FromError(err)

			testutils.MustMatch(t, tc.errMsg, reqStatus.Message())
			testutils.MustMatch(t, tc.payerGroups, payerGroups, "payer groups don't match")
		})
	}
}

func TestStationClientGetStates(t *testing.T) {
	testCases := []struct {
		description string
		states      []*insurancepb.State

		grpcRes *statepb.ListStatesResponse
		grpcErr error
		errMsg  string
	}{
		{
			description: "success - returns states",
			states: []*insurancepb.State{
				{Id: 1, Name: "Colorado", Abbreviation: "CO", BillingCities: []*insurancepb.BillingCity{}},
				{Id: 2, Name: "Texas", Abbreviation: "TX", BillingCities: []*insurancepb.BillingCity{}},
			},

			grpcRes: &statepb.ListStatesResponse{
				States: []*statepb.State{
					{Id: 1, Name: "Colorado", Abbreviation: "CO", BillingCities: nil},
					{Id: 2, Name: "Texas", Abbreviation: "TX", BillingCities: nil}},
			},
		},
		{
			description: "fails - station returns an error",
			states:      nil,
			grpcErr:     errors.New("an error occurred"),
			errMsg:      "an error occurred",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.description, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				StateService: &MockStateServiceClient{
					ListStatesResult: testCase.grpcRes,
					ListStatesErr:    testCase.grpcErr,
				},
			}

			states, err := s.getStates(context.Background(), []int64{})
			reqStatus, _ := status.FromError(err)

			testutils.MustMatch(t, testCase.errMsg, reqStatus.Message())
			testutils.MustMatch(t, testCase.states, states)
		})
	}
}

func TestStationClientCreateInsurancePlan(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockPackageID := "1"

	tcs := []struct {
		description string
		input       *insuranceplanpb.CreateInsurancePlanRequest

		grpcRes *insuranceplanpb.CreateInsurancePlanResponse
		grpcErr error
	}{
		{
			description: "success - creates insurance plan",
			input: &insuranceplanpb.CreateInsurancePlanRequest{
				Name:                      "New Insurance Plan",
				PackageId:                 mockPackageID,
				PayerGroupId:              &baseID,
				InsuranceClassificationId: baseID + 1,
			},

			grpcRes: &insuranceplanpb.CreateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:                        baseID + 2,
					Name:                      mockPayerName,
					PackageId:                 mockPackageID,
					PayerGroupId:              &baseID,
					InsuranceClassificationId: baseID + 1,
				},
			},
		},
		{
			description: "failure - station returns an error",

			grpcErr: errors.New("something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				InsurancePlanService: &MockInsurancePlanServiceClient{
					CreateInsurancePlanResult: tc.grpcRes,
					CreateInsurancePlanErr:    tc.grpcErr,
				},
			}

			insurancePlan, err := s.createInsurancePlan(context.Background(), tc.input)
			reqStatus, _ := status.FromError(err)

			if tc.grpcErr == nil && err != nil {
				t.Fatalf("received unexpected error: %s", err)
			}

			if tc.grpcErr != nil {
				testutils.MustMatch(t, tc.grpcErr.Error(), reqStatus.Message())
			} else {
				testutils.MustMatch(t, tc.grpcRes.InsurancePlan, insurancePlan)
			}
		})
	}
}

func TestStationClientUpdateInsurancePlan(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockPackageID := "1"
	mockInsurancePlan := "Medicare All State"
	mockInsurancePlanNote := "Awesome insurance plan"
	mockInsurancePlanActive := false

	tcs := []struct {
		description string
		input       *insuranceplanpb.UpdateInsurancePlanRequest

		insurancePlanServiceRes *insuranceplanpb.UpdateInsurancePlanResponse
		insurancePlanServiceErr error
	}{
		{
			description: "success - updates insurance plan",
			input: &insuranceplanpb.UpdateInsurancePlanRequest{
				InsurancePlanId:           baseID,
				Name:                      mockInsurancePlan,
				PackageId:                 mockPackageID,
				InsuranceClassificationId: baseID,
				Note:                      &mockInsurancePlanNote,
				Active:                    mockInsurancePlanActive,
			},

			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{
				InsurancePlan: &insuranceplanpb.InsurancePlan{
					Id:                        baseID,
					Name:                      mockInsurancePlan,
					Note:                      &mockInsurancePlanNote,
					PackageId:                 mockPackageID,
					InsuranceClassificationId: baseID,
					Active:                    mockInsurancePlanActive,
				},
			},
		},
		{
			description:             "failure - station returns an error",
			insurancePlanServiceRes: &insuranceplanpb.UpdateInsurancePlanResponse{},

			insurancePlanServiceErr: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				InsurancePlanService: &MockInsurancePlanServiceClient{
					UpdateInsurancePlanResult: tc.insurancePlanServiceRes,
					UpdateInsurancePlanErr:    tc.insurancePlanServiceErr,
				},
			}

			insurancePlan, err := s.updateInsurancePlan(context.Background(), tc.input)
			reqStatus, _ := status.FromError(err)

			testutils.MustMatch(t, tc.insurancePlanServiceErr, reqStatus.Err())
			testutils.MustMatch(t, tc.insurancePlanServiceRes.InsurancePlan, insurancePlan)
		})
	}
}

func TestListNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()

	goodResponse := StationNetworkModalityConfigsResponse{
		Configs: []StationNetworkModalityConfig{
			{
				ID:            &baseID,
				NetworkID:     baseID + 1,
				BillingCityID: baseID + 2,
				ServiceLineID: baseID + 3,
				ModalityID:    baseID + 4,
			},
		},
	}
	badResponse := []StationNetworkModalityConfigsResponse{goodResponse}

	tcs := []struct {
		description       string
		stationHTTPStatus int
		stationResponse   any
		networkID         int64

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationNetworkModalityConfig
	}{
		{
			description:       "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,
			networkID:         baseID,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse.Configs,
		},
		{
			description:       "failure - bad response",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,
			networkID:         baseID,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.listNetworkModalityConfigs(context.Background(), tc.networkID)

			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			testutils.MustMatch(t, status.Code(err), tc.wantStatusCode)
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestUpdateNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()

	goodResponse := StationNetworkModalityConfigsResponse{
		Configs: []StationNetworkModalityConfig{
			{
				ID:            &baseID,
				NetworkID:     baseID + 1,
				BillingCityID: baseID + 2,
				ServiceLineID: baseID + 3,
				ModalityID:    baseID + 4,
			},
		},
	}
	badResponse := []StationNetworkModalityConfigsResponse{goodResponse}

	tcs := []struct {
		description       string
		input             *StationUpdateNetworkModalityConfigsParams
		stationHTTPStatus int
		stationResponse   any

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []StationNetworkModalityConfig
	}{
		{
			description: "success - base case",
			input: &StationUpdateNetworkModalityConfigsParams{
				NetworkID: baseID,
				Configs: []StationNetworkModalityConfig{
					{
						ID:            &baseID,
						NetworkID:     baseID + 1,
						BillingCityID: baseID + 2,
						ServiceLineID: baseID + 3,
						ModalityID:    baseID + 4,
					},
				},
			},
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse.Configs,
		},
		{
			description: "failure - bad response",
			input: &StationUpdateNetworkModalityConfigsParams{
				NetworkID: baseID,
				Configs:   []StationNetworkModalityConfig{},
			},
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.updateNetworkModalityConfigs(context.Background(), tc.input)

			if err != nil && !tc.wantError {
				t.Fatalf("received unexpected error: %s", err)
			}

			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			testutils.MustMatch(t, status.Code(err), tc.wantStatusCode)
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestListNetworkServiceLines(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	mockServiceLineName := "Acute Care"
	mockAppointmentTypeName := "D06 - virtual"

	goodResponse := []StationServiceLine{
		{
			ID:      baseID,
			Name:    mockServiceLineName,
			Default: true,
			ExistingPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(int(baseID + 1)),
				Name: mockAppointmentTypeName,
			},
			NewPatientAppointmentType: &StationAppointmentType{
				ID:   strconv.Itoa(int(baseID + 2)),
				Name: mockAppointmentTypeName,
			},
			ShiftTypeID:              baseID + 3,
			OutOfNetworkInsurance:    false,
			RequireCheckout:          false,
			RequireMedicalNecessity:  false,
			RequireConsentSignature:  false,
			Followup2Day:             false,
			Followup14To30Day:        false,
			Is911:                    true,
			UpgradeableWithScreening: false,
			UpdatedAt:                now.String(),
			CreatedAt:                now.String(),
		},
	}
	badResponse := struct {
		serviceLines []StationServiceLine
	}{serviceLines: goodResponse}

	tcs := []struct {
		description       string
		networkID         int64
		stationHTTPStatus int
		stationResponse   any

		wantStatusCode codes.Code
		wantResponse   []StationServiceLine
	}{
		{
			description:       "success - base case",
			networkID:         baseID,
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			description:       "failure - bad response",
			networkID:         baseID,
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.listNetworkServiceLines(context.Background(), tc.networkID)

			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestStationClientUpdateInsuranceCreditCardPolicies(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		description string
		input       *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest

		insurancePlanServiceRes *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse
		insurancePlanServiceErr error
	}{
		{
			description: "success - updates insurance plan",
			input: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest{
				InsurancePlanId: baseID,
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						ServiceLineId:      2,
						OnboardingCcPolicy: "Required",
					},
				},
			},

			insurancePlanServiceRes: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse{},
		},
		{
			description: "failure - station returns an error",
			input: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest{
				InsurancePlanId: 0,
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						ServiceLineId:      2,
						OnboardingCcPolicy: "Required",
					},
				},
			},

			insurancePlanServiceRes: nil,
			insurancePlanServiceErr: status.Error(codes.NotFound, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				InsurancePlanService: &MockInsurancePlanServiceClient{
					UpsertInsurancePlanCreditCardPolicyResult: tc.insurancePlanServiceRes,
					UpsertInsurancePlanCreditCardPolicyErr:    tc.insurancePlanServiceErr,
				},
			}

			resp, err := s.upsertInsurancePlanCreditCardPolicies(context.Background(), tc.input)
			reqStatus, _ := status.FromError(err)

			testutils.MustMatch(t, tc.insurancePlanServiceErr, reqStatus.Err())
			testutils.MustMatch(t, tc.insurancePlanServiceRes, resp)
		})
	}
}

func TestStationClientListInsuranceCreditCardRules(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		desc            string
		ctx             context.Context
		insurancePlanID int64

		want    *insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse
		wantErr error
	}{
		{
			desc:            "success - returns list of credit card rules",
			ctx:             context.Background(),
			insurancePlanID: baseID,

			want: &insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse{
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						Id:                 &baseID,
						ServiceLineId:      baseID,
						OnboardingCcPolicy: "disabled",
					},
				},
			},
		},
		{
			desc:            "failure - station returns an error",
			ctx:             context.Background(),
			insurancePlanID: baseID,

			wantErr: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s := &InsuranceGRPCServer{
				InsurancePlanService: &MockInsurancePlanServiceClient{
					ListInsurancePlanCreditCardPolicyResult: tc.want,
					ListInsurancePlanCreditCardPolicyErr:    tc.wantErr,
				},
			}

			creditCardRulesRes, err := s.listInsuranceCreditCardRules(tc.ctx, tc.insurancePlanID)
			reqStatus, _ := status.FromError(err)

			testutils.MustMatch(t, tc.wantErr, reqStatus.Err())
			testutils.MustMatch(t, tc.want, creditCardRulesRes)
		})
	}
}

func TestGetAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockAppointmentTypeName := "D01 New"

	goodResponse := []StationAppointmentType{
		{
			ID:   strconv.Itoa(int(baseID)),
			Name: mockAppointmentTypeName,
		},
	}
	badResponse := struct {
		appointmentTypes []StationAppointmentType
	}{appointmentTypes: goodResponse}

	tcs := []struct {
		description       string
		stationHTTPStatus int
		stationResponse   any

		wantStatusCode codes.Code
		wantResponse   []StationAppointmentType
	}{
		{
			description:       "success - base case",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			description:       "failure - bad response",
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.getAppointmentTypes(context.Background())

			testutils.MustMatch(t, status.Code(err), tc.wantStatusCode)
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

func TestListEligibleNetworks(t *testing.T) {
	baseID := time.Now().UnixNano()
	billingCityID := baseID + 1
	serviceLineID := baseID + 2
	networkID := baseID + 3

	goodResponse := []int64{networkID}
	badResponse := struct {
		networks []int64
	}{
		networks: []int64{networkID},
	}

	tcs := []struct {
		description       string
		input             StationListEligibleNetworksRequest
		stationHTTPStatus int
		stationResponse   any

		wantResponse   []int64
		wantStatusCode codes.Code
		wantError      bool
	}{
		{
			description:       "success - base case",
			input:             StationListEligibleNetworksRequest{},
			stationHTTPStatus: http.StatusOK,
			stationResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			description: "success - base case empty response",
			input: StationListEligibleNetworksRequest{
				BillingCityID: &billingCityID,
			},
			stationHTTPStatus: http.StatusOK,
			stationResponse:   []int64{},

			wantStatusCode: codes.OK,
			wantResponse:   []int64{},
		},
		{
			description: "failure - bad response",
			input: StationListEligibleNetworksRequest{
				BillingCityID: &billingCityID,
				ServiceLineID: &serviceLineID,
			},
			stationHTTPStatus: http.StatusOK,
			stationResponse:   badResponse,

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus)
					if tc.stationResponse != nil {
						resp, err := json.Marshal(tc.stationResponse)
						if err != nil {
							t.Fatalf("failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			s := &InsuranceGRPCServer{
				StationClient: &station.Client{
					AuthToken:  mockAuthValuer{},
					StationURL: stationServer.URL,
					HTTPClient: stationServer.Client(),
				},
			}

			stationResponse, err := s.listEligibleNetworks(context.Background(), tc.input)
			if err != nil && !tc.wantError {
				t.Fatalf(err.Error())
			}
			if err == nil && tc.wantError {
				t.Fatalf("did not receive error when one was expected")
			}

			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.wantResponse, stationResponse)
		})
	}
}

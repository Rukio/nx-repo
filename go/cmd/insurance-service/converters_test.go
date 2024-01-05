//go:build db_test

package main

import (
	"database/sql"
	"fmt"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestCreateInsurancePayerSQLParamsFromCreateInsurancePayerProtoRequest(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		description string
		input       *insurancepb.CreateInsurancePayerRequest

		want  *insurancesql.CreateInsurancePayerParams
		error error
	}{
		{
			description: "success - with all data",

			input: &insurancepb.CreateInsurancePayerRequest{
				Name:         mockPayerName,
				Notes:        &mockPayerNotes,
				PayerGroupId: &baseID,
				Active:       &mockPayerIsActive,
			},

			want: &insurancesql.CreateInsurancePayerParams{
				Name:         mockPayerName,
				Notes:        sqltypes.ToValidNullString(mockPayerNotes),
				PayerGroupID: baseID,
				IsActive:     mockPayerIsActive,
			},
		},
		{
			description: "success - with only required data",

			input: &insurancepb.CreateInsurancePayerRequest{
				Name: mockPayerName,
			},

			want: &insurancesql.CreateInsurancePayerParams{
				Name:         mockPayerName,
				Notes:        sqltypes.ToNullString(nil),
				PayerGroupID: 0,
				IsActive:     false,
			},
		},
		{
			description: "failure - without required data",
			input: &insurancepb.CreateInsurancePayerRequest{
				Notes:        &mockPayerNotes,
				PayerGroupId: &baseID,
				Active:       &mockPayerIsActive,
			},

			error: status.Errorf(codes.InvalidArgument, "Payer.name cannot be empty"),
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := CreateInsurancePayerSQLParamsFromCreateInsurancePayerProtoRequest(tc.input)
			testutils.MustMatch(t, tc.want, output)
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestInsurancePayerProtoFromInsurancePayerSQL(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	payerGroupID := baseID + 1

	tcs := []struct {
		description string
		input       *insurancesql.InsurancePayer
		want        *insurancepb.InsurancePayer
	}{
		{
			description: "with all data",
			input: &insurancesql.InsurancePayer{
				ID:           baseID,
				Name:         fmt.Sprintf("testName_%d_1", baseID),
				Notes:        sqltypes.ToValidNullString(mockPayerNotes),
				PayerGroupID: payerGroupID,
				IsActive:     mockPayerIsActive,
				CreatedAt:    now,
				UpdatedAt:    now,
				DeletedAt:    sql.NullTime{},
			},
			want: &insurancepb.InsurancePayer{
				Id:           baseID,
				Name:         fmt.Sprintf("testName_%d_1", baseID),
				Notes:        mockPayerNotes,
				PayerGroupId: payerGroupID,
				Active:       mockPayerIsActive,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:    nil,
			},
		},
		{
			description: "with only required data",
			input: &insurancesql.InsurancePayer{
				ID:           baseID,
				Name:         fmt.Sprintf("testName_%d_2", baseID),
				Notes:        sqltypes.ToNullString(nil),
				PayerGroupID: 0,
				IsActive:     false,
				CreatedAt:    now,
				UpdatedAt:    now,
				DeletedAt:    sql.NullTime{},
			},
			want: &insurancepb.InsurancePayer{
				Id:           baseID,
				Name:         fmt.Sprintf("testName_%d_2", baseID),
				Notes:        "",
				PayerGroupId: 0,
				Active:       false,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:    nil,
			},
		},
		{
			description: "with deleted payer",
			input: &insurancesql.InsurancePayer{
				ID:           baseID,
				Name:         fmt.Sprintf("testName_%d_3", baseID),
				Notes:        sqltypes.ToValidNullString(mockPayerNotes),
				PayerGroupID: payerGroupID,
				IsActive:     mockPayerIsActive,
				CreatedAt:    now,
				UpdatedAt:    now,
				DeletedAt:    sql.NullTime{Time: now, Valid: true},
			},
			want: &insurancepb.InsurancePayer{
				Id:           baseID,
				Name:         fmt.Sprintf("testName_%d_3", baseID),
				Notes:        mockPayerNotes,
				PayerGroupId: payerGroupID,
				Active:       mockPayerIsActive,
				CreatedAt:    protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:    protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:    protoconv.TimeToProtoTimestamp(&now),
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsurancePayerProtoFromInsurancePayerSQL(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateInsurancePayerSQLParamsFromUpdateInsurancePayerProtoRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	payerID := baseID + 1

	tcs := []struct {
		description string
		input       *insurancepb.UpdateInsurancePayerRequest

		want  insurancesql.UpdateInsurancePayerParams
		error error
	}{
		{
			description: "success - transform insurance payer data",

			input: &insurancepb.UpdateInsurancePayerRequest{
				PayerId:      payerID,
				Name:         mockPayerName,
				Notes:        &mockPayerNotes,
				PayerGroupId: &baseID,
				Active:       &mockPayerIsActive,
			},

			want: insurancesql.UpdateInsurancePayerParams{
				ID:           payerID,
				Name:         mockPayerName,
				Notes:        sqltypes.ToValidNullString(mockPayerNotes),
				PayerGroupID: baseID,
				IsActive:     mockPayerIsActive,
			},
		},
		{
			description: "success - transform with required data only",
			input: &insurancepb.UpdateInsurancePayerRequest{
				PayerId: payerID,
				Name:    mockPayerName,
			},

			want: insurancesql.UpdateInsurancePayerParams{
				ID:           payerID,
				Name:         mockPayerName,
				Notes:        sqltypes.ToNullString(nil),
				PayerGroupID: 0,
				IsActive:     false,
			},
		},
		{
			description: "failure - due to invalid PayerID",
			input: &insurancepb.UpdateInsurancePayerRequest{
				PayerId: 0,
				Name:    mockPayerName,
			},

			error: status.Error(codes.InvalidArgument, "payer_id cannot be empty"),
		},
		{
			description: "failure - due to invalid payer.name",
			input: &insurancepb.UpdateInsurancePayerRequest{
				PayerId: payerID,
				Name:    "",
			},

			error: status.Error(codes.InvalidArgument, "name cannot be empty"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := UpdateInsurancePayerSQLParamsFromUpdateInsurancePayerProtoRequest(tc.input)
			if tc.error == nil {
				testutils.MustMatch(t, tc.want, *output)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestCreateInsuranceNetworkStatesSQLParamsFromUpdateInsuranceNetworkStatesRequest(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		description string
		input       *insurancepb.UpdateInsuranceNetworkStatesRequest

		want []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams
	}{
		{
			description: "success - transform insurance network states data with few states",
			input: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  baseID,
				StateAbbrs: []string{"CO", "NY"},
			},

			want: []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
				{InsuranceNetworkID: baseID, StateAbbr: "CO"},
				{InsuranceNetworkID: baseID, StateAbbr: "NY"},
			},
		},
		{
			description: "success - transform insurance network states data without states",
			input: &insurancepb.UpdateInsuranceNetworkStatesRequest{
				NetworkId:  baseID,
				StateAbbrs: []string{},
			},

			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := CreateInsuranceNetworkStatesSQLParamsFromUpdateInsuranceNetworkStatesRequest(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceClassificationsProtoFromStationInsuranceClassifications(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()

	tcs := []struct {
		description string
		input       []StationInsuranceClassification

		want []*insurancepb.InsuranceClassification
	}{
		{
			description: "success - base case",
			input: []StationInsuranceClassification{
				{
					ID:   baseID,
					Name: "Medicare",
				},
			},

			want: []*insurancepb.InsuranceClassification{
				{
					Id:   baseID,
					Name: "Medicare",
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceClassificationsProtoFromStationInsuranceClassifications(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestModalitiesListProtoFromStationModalities(t *testing.T) {
	tcs := []struct {
		description string
		input       []StationModality

		want []*insurancepb.Modality
	}{
		{
			description: "success - base case",
			input: []StationModality{
				{
					ID:          1,
					DisplayName: "Virtual",
					Type:        "virtual",
				},
				{
					ID:          2,
					DisplayName: "In Person",
					Type:        "in-person",
				},
			},

			want: []*insurancepb.Modality{
				{
					Id:          1,
					DisplayName: "Virtual",
					Type:        "virtual",
				},
				{
					Id:          2,
					DisplayName: "In Person",
					Type:        "in-person",
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := ModalitiesListProtoFromStationModalities(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestServiceLinesProtoFromStationServiceLines(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	mockServiceLineName := "Bridge Care"
	mockAppointmentTypeName := "Bridge appointment"
	existingAppointmentTypeID := int(baseID + 1)
	newAppointmentTypeID := int(baseID + 2)
	shiftTypeID := baseID + 3

	tcs := []struct {
		description string
		input       []StationServiceLine

		want []*insurancepb.ServiceLine
	}{
		{
			description: "success - base case full data",
			input: []StationServiceLine{
				{
					ID:      baseID,
					Name:    mockServiceLineName,
					Default: true,
					ExistingPatientAppointmentType: &StationAppointmentType{
						ID:   strconv.Itoa(existingAppointmentTypeID),
						Name: mockAppointmentTypeName,
					},
					NewPatientAppointmentType: &StationAppointmentType{
						ID:   strconv.Itoa(newAppointmentTypeID),
						Name: mockAppointmentTypeName,
					},
					ShiftTypeID:              shiftTypeID,
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
			},

			want: []*insurancepb.ServiceLine{
				{
					Id:      baseID,
					Name:    mockServiceLineName,
					Default: true,
					ExistingPatientAppointmentType: &insurancepb.AppointmentType{
						Id:   strconv.Itoa(existingAppointmentTypeID),
						Name: mockAppointmentTypeName,
					},
					NewPatientAppointmentType: &insurancepb.AppointmentType{
						Id:   strconv.Itoa(newAppointmentTypeID),
						Name: mockAppointmentTypeName,
					},
					ShiftTypeId:              shiftTypeID,
					OutOfNetworkInsurance:    false,
					RequireCheckout:          false,
					RequireMedicalNecessity:  false,
					RequireConsentSignature:  false,
					Followup_2Day:            false,
					Followup_14_30Day:        false,
					Is_911:                   true,
					UpgradeableWithScreening: false,
					UpdatedAt:                now.String(),
					CreatedAt:                now.String(),
				},
			},
		},
		{
			description: "success - base case empty appointment types",
			input: []StationServiceLine{
				{
					ID:                       baseID,
					Name:                     mockServiceLineName,
					Default:                  true,
					ShiftTypeID:              shiftTypeID,
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
			},

			want: []*insurancepb.ServiceLine{
				{
					Id:                       baseID,
					Name:                     mockServiceLineName,
					Default:                  true,
					ShiftTypeId:              shiftTypeID,
					OutOfNetworkInsurance:    false,
					RequireCheckout:          false,
					RequireMedicalNecessity:  false,
					RequireConsentSignature:  false,
					Followup_2Day:            false,
					Followup_14_30Day:        false,
					Is_911:                   true,
					UpgradeableWithScreening: false,
					UpdatedAt:                now.String(),
					CreatedAt:                now.String(),
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := ServiceLinesProtoFromStationServiceLines(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestPayerGroupsFromStationPayerGroups(t *testing.T) {
	tcs := []struct {
		description string
		input       []*payergrouppb.PayerGroup

		want []*insurancepb.PayerGroup
	}{
		{
			description: "Successfully transform payer groups",
			input: []*payergrouppb.PayerGroup{
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

			want: []*insurancepb.PayerGroup{
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
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := PayerGroupsFromStationPayerGroups(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestStatesFromStationStates(t *testing.T) {
	tcs := []struct {
		description string
		input       []*statepb.State

		want []*insurancepb.State
	}{
		{
			description: "Succesfully transform states",
			input: []*statepb.State{
				{
					Id:            1,
					Name:          "Colorado",
					Abbreviation:  "CO",
					BillingCities: []*statepb.BillingCity{},
				},
				{
					Id:           2,
					Name:         "Texas",
					Abbreviation: "TX",
					BillingCities: []*statepb.BillingCity{
						{Id: 1, Name: "Test", State: "TX", ShortName: "Te", Enabled: true, MarketId: 23},
					},
				},
			},
			want: []*insurancepb.State{
				{
					Id:            1,
					Name:          "Colorado",
					Abbreviation:  "CO",
					BillingCities: []*insurancepb.BillingCity{},
				},
				{
					Id:           2,
					Name:         "Texas",
					Abbreviation: "TX",
					BillingCities: []*insurancepb.BillingCity{
						{Id: 1, Name: "Test", State: "TX", ShortName: "Te", Enabled: true, MarketId: 23},
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := StatesFromStationStates(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestBillingCitiesFromStationBillingCities(t *testing.T) {
	tcs := []struct {
		description string
		input       []*statepb.BillingCity

		want []*insurancepb.BillingCity
	}{{
		description: "successfully transform billing cities data",
		input: []*statepb.BillingCity{
			{Id: 1, Name: "Test", State: "TX", ShortName: "Te", Enabled: true, MarketId: 23},
			{Id: 2, Name: "Next", State: "NX", ShortName: "Test", Enabled: false, MarketId: 2},
		},
		want: []*insurancepb.BillingCity{
			{Id: 1, Name: "Test", State: "TX", ShortName: "Te", Enabled: true, MarketId: 23},
			{Id: 2, Name: "Next", State: "NX", ShortName: "Test", Enabled: false, MarketId: 2},
		},
	}}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := BillingCitiesFromStationBillingCities(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestCreateInsuranceNetworkSQLParamsFromCreateInsuranceNetworkProtoRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePayerID := baseID + 3

	type input struct {
		r               *insurancepb.CreateInsuranceNetworkRequest
		insurancePlanID int64
	}

	tcs := []struct {
		description string
		input       input

		wantAddressesParams []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams
		wantNetworkParams   insurancesql.CreateInsuranceNetworkParams
		error               error
	}{
		{
			description: "success - with all data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					Notes:                     &mockNetworkNotes,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					Active:                    &mockNetworkIsActive,
					EmcCode:                   &mockEMCCode,
					EligibilityCheck:          &mockNetworkEligibilityCheckEnabled,
					ProviderEnrollment:        &mockNetworkProviderEnrollmentEnabled,
					Addresses: []*common.Address{{
						City:           proto.String(mockNetworkCity),
						ZipCode:        proto.String(mockNetworkZipcode),
						AddressLineOne: proto.String(mockNetworkAddress),
						State:          proto.String(mockNetworkBillingState),
					}},
				},
				insurancePlanID: baseID,
			},

			wantAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{{
				City:         mockNetworkCity,
				Zipcode:      mockNetworkZipcode,
				Address:      mockNetworkAddress,
				BillingState: mockNetworkBillingState,
			}},
			wantNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          insurancePayerID,
				InsurancePlanID:           baseID,
				IsActive:                  mockNetworkIsActive,
				EmcCode:                   sqltypes.ToValidNullString(mockEMCCode),
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
			},
		},
		{
			description: "success - with only required data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
				},
				insurancePlanID: baseID,
			},

			wantAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{},
			wantNetworkParams: insurancesql.CreateInsuranceNetworkParams{
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToNullString(nil),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          insurancePayerID,
				InsurancePlanID:           baseID,
				IsActive:                  false,
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
			},
		},
		{
			description: "failure - without required name data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Notes:                     &mockNetworkNotes,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					Active:                    &mockNetworkIsActive,
					EligibilityCheck:          &mockNetworkEligibilityCheckEnabled,
					ProviderEnrollment:        &mockNetworkProviderEnrollmentEnabled,
				},
				insurancePlanID: baseID,
			},

			error: status.Errorf(codes.InvalidArgument, "network.name cannot be empty"),
		},
		{
			description: "failure - without required package id data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					Notes:                     &mockNetworkNotes,
					InsuranceClassificationId: insuranceClassificationID,
					InsurancePayerId:          insurancePayerID,
					Active:                    &mockNetworkIsActive,
					EligibilityCheck:          &mockNetworkEligibilityCheckEnabled,
					ProviderEnrollment:        &mockNetworkProviderEnrollmentEnabled,
				},
				insurancePlanID: baseID,
			},

			error: status.Errorf(codes.InvalidArgument, "network.package_id cannot be empty"),
		},
		{
			description: "failure - without required insurance classification id data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:               mockNetworkName,
					Notes:              &mockNetworkNotes,
					PackageId:          &packageID,
					InsurancePayerId:   insurancePayerID,
					Active:             &mockNetworkIsActive,
					EligibilityCheck:   &mockNetworkEligibilityCheckEnabled,
					ProviderEnrollment: &mockNetworkProviderEnrollmentEnabled,
				},
				insurancePlanID: baseID,
			},

			error: status.Errorf(codes.InvalidArgument, "network.insurance_classification_id cannot be empty"),
		},
		{
			description: "failure - without required insurance payer id data",
			input: input{
				r: &insurancepb.CreateInsuranceNetworkRequest{
					Name:                      mockNetworkName,
					Notes:                     &mockNetworkNotes,
					PackageId:                 &packageID,
					InsuranceClassificationId: insuranceClassificationID,
					Active:                    &mockNetworkIsActive,
					EligibilityCheck:          &mockNetworkEligibilityCheckEnabled,
					ProviderEnrollment:        &mockNetworkProviderEnrollmentEnabled,
				},
				insurancePlanID: baseID,
			},

			error: status.Errorf(codes.InvalidArgument, "network.insurance_payer_id cannot be empty"),
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			networkParams, addressesParams, err := CreateInsuranceNetworkSQLParamsFromCreateInsuranceNetworkProtoRequest(tc.input.r, tc.input.insurancePlanID)
			if tc.error == nil {
				testutils.MustMatch(t, tc.wantNetworkParams, *networkParams)
				testutils.MustMatch(t, tc.wantAddressesParams, addressesParams)
			}
			testutils.MustMatch(t, tc.error, err)
		})
	}
}

func TestInsuranceNetworkProtoFromInsuranceNetworkSQL(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePayerID := baseID + 3

	tcs := []struct {
		description    string
		inputNetwork   *insurancesql.InsuranceNetwork
		inputAddresses []*insurancesql.InsuranceNetworkAddress

		want *insurancepb.InsuranceNetwork
	}{
		{
			description: "success - with all data",
			inputNetwork: &insurancesql.InsuranceNetwork{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          insurancePayerID,
				IsActive:                  mockNetworkIsActive,
				EmcCode:                   sqltypes.ToValidNullString(mockEMCCode),
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
			},
			inputAddresses: []*insurancesql.InsuranceNetworkAddress{{
				InsuranceNetworkID: baseID,
				City:               mockNetworkCity,
				Address:            mockNetworkAddress,
				Zipcode:            mockNetworkZipcode,
				BillingState:       mockNetworkBillingState,
			}},

			want: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePayerId:          insurancePayerID,
				Active:                    mockNetworkIsActive,
				EmcCode:                   mockEMCCode,
				EligibilityCheck:          mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:        mockNetworkProviderEnrollmentEnabled,
				Addresses: []*common.Address{{
					City:           &mockNetworkCity,
					ZipCode:        &mockNetworkZipcode,
					AddressLineOne: &mockNetworkAddress,
					State:          &mockNetworkBillingState,
				}},
				CreatedAt: protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt: protoconv.TimeToProtoTimestamp(&now),
				DeletedAt: nil,
			},
		},
		{
			description: "success - with only required data",
			inputNetwork: &insurancesql.InsuranceNetwork{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToNullString(nil),
				InsurancePayerID:          insurancePayerID,
				IsActive:                  mockNetworkIsActive,
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
			},

			want: &insurancepb.InsuranceNetwork{
				Id:                 baseID,
				Name:               mockNetworkName,
				Notes:              "",
				InsurancePayerId:   insurancePayerID,
				Active:             mockNetworkIsActive,
				EligibilityCheck:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment: mockNetworkProviderEnrollmentEnabled,
				Addresses:          []*common.Address{},
				CreatedAt:          protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:          protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:          nil,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceNetworkProtoFromInsuranceNetworkSQL(tc.inputNetwork, tc.inputAddresses)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceNetworkProtoFromGetInsuranceNetworkByInsurancePlanIDRowSQL(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePayerID := baseID + 3
	payerGroupID := baseID + 4
	insurancePayerName := fmt.Sprintf("Awesome payer - %d", insurancePayerID)

	tcs := []struct {
		description    string
		inputNetwork   *insurancesql.GetInsuranceNetworkByInsurancePlanIDRow
		inputAddresses []*insurancesql.InsuranceNetworkAddress

		want *insurancepb.InsuranceNetwork
	}{
		{
			description: "success - with all data",
			inputNetwork: &insurancesql.GetInsuranceNetworkByInsurancePlanIDRow{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePayerID:          insurancePayerID,
				InsurancePayerName:        insurancePayerName,
				IsActive:                  mockNetworkIsActive,
				EmcCode:                   sqltypes.ToValidNullString(mockEMCCode),
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
				InsurancePayerGroupID:     payerGroupID,
			},
			inputAddresses: []*insurancesql.InsuranceNetworkAddress{{
				InsuranceNetworkID: baseID,
				City:               mockNetworkCity,
				Address:            mockNetworkAddress,
				Zipcode:            mockNetworkZipcode,
				BillingState:       mockNetworkBillingState,
			}},

			want: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePayerId:          insurancePayerID,
				InsurancePayerName:        insurancePayerName,
				Active:                    mockNetworkIsActive,
				EmcCode:                   mockEMCCode,
				EligibilityCheck:          mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:        mockNetworkProviderEnrollmentEnabled,
				Addresses: []*common.Address{{
					City:           &mockNetworkCity,
					ZipCode:        &mockNetworkZipcode,
					AddressLineOne: &mockNetworkAddress,
					State:          &mockNetworkBillingState,
				}},
				CreatedAt:             protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:             protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:             nil,
				InsurancePayerGroupId: payerGroupID,
			},
		},
		{
			description: "success - with only required data",
			inputNetwork: &insurancesql.GetInsuranceNetworkByInsurancePlanIDRow{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToNullString(nil),
				InsurancePayerID:          insurancePayerID,
				InsurancePayerName:        insurancePayerName,
				IsActive:                  mockNetworkIsActive,
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
				InsurancePayerGroupID:     payerGroupID,
			},

			want: &insurancepb.InsuranceNetwork{
				Id:                    baseID,
				Name:                  mockNetworkName,
				Notes:                 "",
				InsurancePayerId:      insurancePayerID,
				InsurancePayerName:    insurancePayerName,
				Active:                mockNetworkIsActive,
				EligibilityCheck:      mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:    mockNetworkProviderEnrollmentEnabled,
				Addresses:             []*common.Address{},
				CreatedAt:             protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:             protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:             nil,
				InsurancePayerGroupId: payerGroupID,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceNetworkProtoFromGetInsuranceNetworkByInsurancePlanIDRowSQL(tc.inputNetwork, tc.inputAddresses)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceNetworkProtoFromSearchInsuranceNetworksRowSQL(t *testing.T) {
	now := time.Now()
	baseID := now.UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	tcs := []struct {
		description    string
		inputNetwork   *insurancesql.SearchInsuranceNetworksRow
		inputAddresses []*insurancesql.InsuranceNetworkAddress

		want *insurancepb.InsuranceNetwork
	}{
		{
			description: "success - with all data",
			inputNetwork: &insurancesql.SearchInsuranceNetworksRow{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePlanID:           insurancePlanID,
				InsurancePayerID:          insurancePayerID,
				InsurancePayerName:        mockPayerName,
				IsActive:                  mockNetworkIsActive,
				EmcCode:                   sqltypes.ToValidNullString(mockEMCCode),
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
			},
			inputAddresses: []*insurancesql.InsuranceNetworkAddress{{
				InsuranceNetworkID: baseID,
				City:               mockNetworkCity,
				Address:            mockNetworkAddress,
				Zipcode:            mockNetworkZipcode,
				BillingState:       mockNetworkBillingState,
			}},

			want: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     mockNetworkNotes,
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				InsurancePayerName:        mockPayerName,
				Active:                    mockNetworkIsActive,
				EmcCode:                   mockEMCCode,
				EligibilityCheck:          mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:        mockNetworkProviderEnrollmentEnabled,
				Addresses: []*common.Address{{
					City:           &mockNetworkCity,
					ZipCode:        &mockNetworkZipcode,
					AddressLineOne: &mockNetworkAddress,
					State:          &mockNetworkBillingState,
				}},
				CreatedAt: protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt: protoconv.TimeToProtoTimestamp(&now),
				DeletedAt: nil,
			},
		},
		{
			description: "success - with only required data",
			inputNetwork: &insurancesql.SearchInsuranceNetworksRow{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToNullString(nil),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePlanID:           insurancePlanID,
				InsurancePayerID:          insurancePayerID,
				InsurancePayerName:        mockPayerName,
				IsActive:                  mockNetworkIsActive,
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 now,
				UpdatedAt:                 now,
				DeletedAt:                 sql.NullTime{},
			},

			want: &insurancepb.InsuranceNetwork{
				Id:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     "",
				PackageId:                 packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				InsurancePayerName:        mockPayerName,
				Active:                    mockNetworkIsActive,
				Addresses:                 []*common.Address{},
				EligibilityCheck:          mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:        mockNetworkProviderEnrollmentEnabled,
				CreatedAt:                 protoconv.TimeToProtoTimestamp(&now),
				UpdatedAt:                 protoconv.TimeToProtoTimestamp(&now),
				DeletedAt:                 nil,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceNetworkProtoFromSearchInsuranceNetworksRowSQL(tc.inputNetwork, tc.inputAddresses)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateInsuranceNetworkSQLParamsFromUpdateInsuranceNetworkProtoRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	tcs := []struct {
		description string
		input       *insurancepb.UpdateInsuranceNetworkRequest

		wantNetworkParams   *insurancesql.UpdateInsuranceNetworkParams
		wantAddressesParams []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams
	}{
		{
			description: "success - with all data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				PackageId:                 &packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
				Active:                    &mockNetworkIsActive,
				EmcCode:                   &mockEMCCode,
				EligibilityCheck:          &mockNetworkEligibilityCheckEnabled,
				ProviderEnrollment:        &mockNetworkProviderEnrollmentEnabled,
				Addresses: []*common.Address{{
					City:           &mockNetworkCity,
					ZipCode:        &mockNetworkZipcode,
					AddressLineOne: &mockNetworkAddress,
					State:          &mockNetworkBillingState,
				}},
			},

			wantAddressesParams: []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{{
				City:         mockNetworkCity,
				Zipcode:      mockNetworkZipcode,
				Address:      mockNetworkAddress,
				BillingState: mockNetworkBillingState,
			}},
			wantNetworkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToValidNullString(mockNetworkNotes),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePlanID:           insurancePlanID,
				InsurancePayerID:          insurancePayerID,
				IsActive:                  mockNetworkIsActive,
				EmcCode:                   sqltypes.ToValidNullString(mockEMCCode),
				EligibilityCheckEnabled:   mockNetworkEligibilityCheckEnabled,
				ProviderEnrollmentEnabled: mockNetworkProviderEnrollmentEnabled,
			},
		},
		{
			description: "success - with only required data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Name:                      mockNetworkName,
				PackageId:                 &packageID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
			},

			wantNetworkParams: &insurancesql.UpdateInsuranceNetworkParams{
				ID:                        baseID,
				Name:                      mockNetworkName,
				Notes:                     sqltypes.ToNullString(nil),
				PackageID:                 packageID,
				InsuranceClassificationID: insuranceClassificationID,
				InsurancePlanID:           insurancePlanID,
				InsurancePayerID:          insurancePayerID,
				IsActive:                  false,
				EligibilityCheckEnabled:   false,
				ProviderEnrollmentEnabled: false,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			outputNetwork, outputAddresses := UpdateInsuranceNetworkSQLParamsFromUpdateInsuranceNetworkProtoRequest(tc.input)
			testutils.MustMatch(t, tc.wantNetworkParams, outputNetwork)
			if tc.wantAddressesParams != nil {
				testutils.MustMatch(t, tc.wantAddressesParams, outputAddresses)
			}
		})
	}
}

func TestCreateInsurancePlanRequestFromCreateInsuranceNetworkRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	insuranceClassificationID := baseID + 1
	insurancePayerID := baseID + 2

	tcs := []struct {
		description string
		input       *insurancepb.CreateInsuranceNetworkRequest
		want        *insuranceplanpb.CreateInsurancePlanRequest

		error error
	}{
		{
			description: "success - with all data",
			input: &insurancepb.CreateInsuranceNetworkRequest{
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				PackageId:                 &baseID,
				Active:                    &mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
			},
			want: &insuranceplanpb.CreateInsurancePlanRequest{
				Name:                      mockNetworkName,
				Note:                      &mockNetworkNotes,
				PackageId:                 strconv.FormatInt(baseID, 10),
				Active:                    mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
			},
		},
		{
			description: "failure - without required name data",
			input: &insurancepb.CreateInsuranceNetworkRequest{
				Notes:                     &mockNetworkNotes,
				PackageId:                 &baseID,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePayerId:          insurancePayerID,
			},

			error: status.Errorf(codes.InvalidArgument, "insurance_plan.name cannot be empty"),
		},
		{
			description: "failure - without required package id data",
			input: &insurancepb.CreateInsuranceNetworkRequest{
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				InsuranceClassificationId: baseID,
				InsurancePayerId:          insurancePayerID,
			},

			error: status.Errorf(codes.InvalidArgument, "insurance_plan.package_id cannot be empty"),
		},
		{
			description: "failure - without required insurance classification id data",
			input: &insurancepb.CreateInsuranceNetworkRequest{
				Name:             mockNetworkName,
				Notes:            &mockNetworkNotes,
				PackageId:        &baseID,
				InsurancePayerId: insurancePayerID,
			},

			error: status.Errorf(codes.InvalidArgument, "insurance_plan.insurance_classification_id cannot be empty"),
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := CreateInsurancePlanRequestFromCreateInsuranceNetworkRequest(tc.input)
			testutils.MustMatch(t, tc.error, err)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateInsurancePlanRequestFromUpdateInsuranceNetworkRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	packageID := baseID + 1
	insuranceClassificationID := baseID + 2
	insurancePlanID := baseID + 3
	insurancePayerID := baseID + 4

	tcs := []struct {
		description string
		input       *insurancepb.UpdateInsuranceNetworkRequest
		want        *insuranceplanpb.UpdateInsurancePlanRequest

		error error
	}{
		{
			description: "success - with all data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				PackageId:                 &packageID,
				Active:                    &mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
			},

			want: &insuranceplanpb.UpdateInsurancePlanRequest{
				InsurancePlanId:           insurancePlanID,
				Name:                      mockNetworkName,
				Note:                      &mockNetworkNotes,
				PackageId:                 strconv.FormatInt(packageID, 10),
				Active:                    mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
			},
		},
		{
			description: "failure - without required insurance plan id data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				PackageId:                 &packageID,
				Active:                    &mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePayerId:          insurancePayerID,
			},

			error: status.Error(codes.InvalidArgument, "insurance_plan.id should be greater than 0"),
		},
		{
			description: "failure - without required name data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Notes:                     &mockNetworkNotes,
				PackageId:                 &packageID,
				Active:                    &mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
			},

			error: status.Error(codes.InvalidArgument, "insurance_plan.name cannot be empty"),
		},
		{
			description: "failure - without required package id data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:                 baseID,
				Name:                      mockNetworkName,
				Notes:                     &mockNetworkNotes,
				Active:                    &mockNetworkIsActive,
				InsuranceClassificationId: insuranceClassificationID,
				InsurancePlanId:           insurancePlanID,
				InsurancePayerId:          insurancePayerID,
			},

			error: status.Error(codes.InvalidArgument, "insurance_plan.package_id cannot be empty"),
		},
		{
			description: "failure - without required insurance classification id data",
			input: &insurancepb.UpdateInsuranceNetworkRequest{
				NetworkId:        baseID,
				Name:             mockNetworkName,
				Notes:            &mockNetworkNotes,
				PackageId:        &packageID,
				Active:           &mockNetworkIsActive,
				InsurancePlanId:  insurancePlanID,
				InsurancePayerId: insurancePayerID,
			},

			error: status.Error(codes.InvalidArgument, "insurance_plan.insurance_classification_id should be greater than 0"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output, err := UpdateInsurancePlanRequestFromUpdateInsuranceNetworkRequest(tc.input)

			testutils.MustMatch(t, tc.error, err)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestGetInsurancePayersWithFilterAndOrderSQLParamsFromListInsurancePayersProtoRequest(t *testing.T) {
	payerNameSearchField := "test"
	filterBySingleState := []string{"CO"}
	filterByMultiStates := []string{"CO", "TX"}

	tcs := []struct {
		description string
		input       *insurancepb.ListInsurancePayersRequest

		want *insurancesql.GetInsurancePayersWithFilterAndOrderParams
	}{
		{
			description: "success - with all data set and descending order by updated_at",
			input: &insurancepb.ListInsurancePayersRequest{
				PayerName:     &payerNameSearchField,
				StateAbbrs:    filterByMultiStates,
				SortField:     insurancepb.ListInsurancePayersRequest_SORT_FIELD_UPDATED_AT,
				SortDirection: insurancepb.SortDirection_SORT_DIRECTION_DESCENDING,
			},

			want: &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				FilterStates:  filterByMultiStates,
				SearchString:  payerNameSearchField,
				SortBy:        "updated_at",
				SortDirection: "desc",
			},
		},
		{
			description: "success - with unspecified sort parameters",
			input: &insurancepb.ListInsurancePayersRequest{
				PayerName:     &payerNameSearchField,
				StateAbbrs:    filterByMultiStates,
				SortField:     insurancepb.ListInsurancePayersRequest_SORT_FIELD_UNSPECIFIED,
				SortDirection: insurancepb.SortDirection_SORT_DIRECTION_UNSPECIFIED,
			},

			want: &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				FilterStates:  filterByMultiStates,
				SearchString:  payerNameSearchField,
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
		{
			description: "success - with one state and asc sort by name",
			input: &insurancepb.ListInsurancePayersRequest{
				PayerName:     &payerNameSearchField,
				StateAbbrs:    filterBySingleState,
				SortField:     insurancepb.ListInsurancePayersRequest_SORT_FIELD_NAME,
				SortDirection: insurancepb.SortDirection_SORT_DIRECTION_ASCENDING,
			},

			want: &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				FilterStates:  filterBySingleState,
				SearchString:  payerNameSearchField,
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
		{
			description: "success - without search string",
			input: &insurancepb.ListInsurancePayersRequest{
				StateAbbrs:    filterByMultiStates,
				SortField:     insurancepb.ListInsurancePayersRequest_SORT_FIELD_NAME,
				SortDirection: insurancepb.SortDirection_SORT_DIRECTION_ASCENDING,
			},

			want: &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				FilterStates:  filterByMultiStates,
				SearchString:  "",
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
		{
			description: "success - without all unspecified data",
			input:       &insurancepb.ListInsurancePayersRequest{},

			want: &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
				FilterStates:  nil,
				SearchString:  "",
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := GetInsurancePayersWithFilterAndOrderSQLParamsFromListInsurancePayersProtoRequest(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestSearchInsuranceNetworksSQLParamsFromListInsurancePayersProtoRequest(t *testing.T) {
	type input struct {
		req      *insurancepb.ListInsurancePayersRequest
		payerIDs []int64
	}

	payerID := []int64{1}
	payerIDs := []int64{1, 2, 3}
	filterBySingleState := []string{"CO"}
	filterByMultiStates := []string{"CO,TX"}

	tcs := []struct {
		description string
		input       input

		want *insurancesql.SearchInsuranceNetworksParams
	}{
		{
			description: "success - with all data set",
			input: input{
				req: &insurancepb.ListInsurancePayersRequest{
					StateAbbrs: filterByMultiStates,
				},
				payerIDs: payerIDs,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates: filterByMultiStates,
				PayerIds:     payerIDs,
			},
		},
		{
			description: "success - with one state",
			input: input{
				req: &insurancepb.ListInsurancePayersRequest{
					StateAbbrs: filterBySingleState,
				},
				payerIDs: payerIDs,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates: filterBySingleState,
				PayerIds:     payerIDs,
			},
		},
		{
			description: "success - without states",
			input: input{
				req:      &insurancepb.ListInsurancePayersRequest{},
				payerIDs: payerIDs,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates: nil,
				PayerIds:     payerIDs,
			},
		},
		{
			description: "success - with one id",
			input: input{
				req: &insurancepb.ListInsurancePayersRequest{
					StateAbbrs: filterBySingleState,
				},
				payerIDs: payerID,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates: filterBySingleState,
				PayerIds:     payerID,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := SearchInsuranceNetworksSQLParamsFromListInsurancePayersProtoRequest(tc.input.req, tc.input.payerIDs)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestSearchInsuranceNetworksSQLParamsFromSearchInsuranceNetworksProtoRequest(t *testing.T) {
	type input struct {
		req        *insurancepb.SearchInsuranceNetworksRequest
		networkIDs []int64
	}
	baseID := time.Now().UnixNano()
	payerID := baseID + 1
	firstInsuranceClassificationID := baseID + 2
	secondInsuranceClassificationID := baseID + 3
	networkID := baseID + 4
	packageID := baseID + 5
	insurancePlanID := baseID + 6
	payerIDs := []int64{payerID}
	filterBySingleState := []string{"CO"}
	filterByMultiStates := []string{"CO,TX"}
	filterBySingleInsuranceClassification := []int64{firstInsuranceClassificationID}
	filterByMultiInsuranceClassifications := []int64{firstInsuranceClassificationID, secondInsuranceClassificationID}
	searchString := "network"
	filterByNetworkIDs := []int64{networkID}
	filterByPackageIDs := []int64{packageID}
	filterByInsurancePlanIDs := []int64{insurancePlanID}
	showInactive := true

	tcs := []struct {
		description string
		input       input

		want *insurancesql.SearchInsuranceNetworksParams
	}{
		{
			description: "success - with all data set",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					PayerIds:                 payerIDs,
					StateAbbrs:               filterByMultiStates,
					SortField:                insurancepb.SearchInsuranceNetworksRequest_SORT_FIELD_NAME,
					SortDirection:            insurancepb.SortDirection_SORT_DIRECTION_ASCENDING,
					Search:                   &searchString,
					InsuranceClassifications: filterByMultiInsuranceClassifications,
					PackageIds:               filterByPackageIDs,
					InsurancePlanIds:         filterByInsurancePlanIDs,
				},
				networkIDs: filterByNetworkIDs,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates:          filterByMultiStates,
				PayerIds:              payerIDs,
				SortBy:                "name",
				SortDirection:         "asc",
				SearchString:          searchString,
				FilterClassifications: filterByMultiInsuranceClassifications,
				NetworkIds:            filterByNetworkIDs,
				PackageIds:            filterByPackageIDs,
				InsurancePlanIds:      filterByInsurancePlanIDs,
			},
		},
		{
			description: "success - with one state",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					PayerIds:      payerIDs,
					StateAbbrs:    filterBySingleState,
					SortField:     insurancepb.SearchInsuranceNetworksRequest_SORT_FIELD_UNSPECIFIED,
					SortDirection: insurancepb.SortDirection_SORT_DIRECTION_UNSPECIFIED,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates:  filterBySingleState,
				PayerIds:      payerIDs,
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
		{
			description: "success - without states and with unspecified sort",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					PayerIds:      payerIDs,
					SortField:     insurancepb.SearchInsuranceNetworksRequest_SORT_FIELD_UNSPECIFIED,
					SortDirection: insurancepb.SortDirection_SORT_DIRECTION_UNSPECIFIED,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates:  nil,
				PayerIds:      payerIDs,
				SortBy:        "name",
				SortDirection: "asc",
			},
		},
		{
			description: "success - with descending sort by updated_at",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					PayerIds:      payerIDs,
					StateAbbrs:    filterByMultiStates,
					SortField:     insurancepb.SearchInsuranceNetworksRequest_SORT_FIELD_UPDATED_AT,
					SortDirection: insurancepb.SortDirection_SORT_DIRECTION_DESCENDING,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				FilterStates:  filterByMultiStates,
				PayerIds:      payerIDs,
				SortBy:        "updated_at",
				SortDirection: "desc",
			},
		},
		{
			description: "success - with one insurance classification and default sort",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					InsuranceClassifications: filterBySingleInsuranceClassification,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				SortBy:                "name",
				SortDirection:         "asc",
				FilterClassifications: filterBySingleInsuranceClassification,
			},
		},
		{
			description: "success - with one network ID filter",
			input: input{
				req:        &insurancepb.SearchInsuranceNetworksRequest{},
				networkIDs: filterByNetworkIDs,
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				SortBy:        "name",
				SortDirection: "asc",
				NetworkIds:    filterByNetworkIDs,
			},
		},
		{
			description: "success - with one package ID filter",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					PackageIds: filterByPackageIDs,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				SortBy:        "name",
				SortDirection: "asc",
				PackageIds:    filterByPackageIDs,
			},
		},
		{
			description: "success - with only insurance plan IDs filter",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					InsurancePlanIds: filterByInsurancePlanIDs,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				SortBy:           "name",
				SortDirection:    "asc",
				InsurancePlanIds: filterByInsurancePlanIDs,
			},
		},
		{
			description: "success - with only show inactive filter",
			input: input{
				req: &insurancepb.SearchInsuranceNetworksRequest{
					ShowInactive: &showInactive,
				},
			},

			want: &insurancesql.SearchInsuranceNetworksParams{
				SortBy:        "name",
				SortDirection: "asc",
				ShowInactive:  showInactive,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := SearchInsuranceNetworksSQLParamsFromSearchInsuranceNetworksProtoRequest(tc.input.req, tc.input.networkIDs)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceNetworkModalityConfigsProtoFromStationNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	billingCityID := baseID + 2
	serviceLineID := baseID + 3
	modalityID := baseID + 4

	tcs := []struct {
		description string
		input       []StationNetworkModalityConfig

		want []*insurancepb.InsuranceNetworkModalityConfig
	}{
		{
			description: "success - base case",
			input: []StationNetworkModalityConfig{
				{
					ID:            &baseID,
					NetworkID:     networkID,
					BillingCityID: billingCityID,
					ServiceLineID: serviceLineID,
					ModalityID:    modalityID,
				},
			},

			want: []*insurancepb.InsuranceNetworkModalityConfig{
				{
					Id:            &baseID,
					NetworkId:     networkID,
					BillingCityId: billingCityID,
					ServiceLineId: serviceLineID,
					ModalityId:    modalityID,
				},
			},
		},
		{
			description: "success - base case without ID",
			input: []StationNetworkModalityConfig{
				{
					NetworkID:     networkID,
					BillingCityID: billingCityID,
					ServiceLineID: serviceLineID,
					ModalityID:    modalityID,
				},
			},

			want: []*insurancepb.InsuranceNetworkModalityConfig{
				{
					NetworkId:     networkID,
					BillingCityId: billingCityID,
					ServiceLineId: serviceLineID,
					ModalityId:    modalityID,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceNetworkModalityConfigsProtoFromStationNetworkModalityConfigs(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestStationUpdateNetworkModalityConfigsParamsFromUpdateInsuranceNetworkModalityConfigsRequest(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	billingCityID := baseID + 2
	serviceLineID := baseID + 3
	modalityID := baseID + 4

	tcs := []struct {
		description string
		input       *insurancepb.UpdateInsuranceNetworkModalityConfigsRequest

		want *StationUpdateNetworkModalityConfigsParams
	}{
		{
			description: "success - base case",
			input: &insurancepb.UpdateInsuranceNetworkModalityConfigsRequest{
				NetworkId: baseID,
				Configs: []*insurancepb.InsuranceNetworkModalityConfig{
					{
						Id:            &baseID,
						NetworkId:     networkID,
						BillingCityId: billingCityID,
						ServiceLineId: serviceLineID,
						ModalityId:    modalityID,
					},
				},
			},

			want: &StationUpdateNetworkModalityConfigsParams{
				NetworkID: baseID,
				Configs: []StationNetworkModalityConfig{
					{
						ID:            &baseID,
						NetworkID:     networkID,
						BillingCityID: billingCityID,
						ServiceLineID: serviceLineID,
						ModalityID:    modalityID,
					},
				},
			},
		},
		{
			description: "success - base case without ID",
			input: &insurancepb.UpdateInsuranceNetworkModalityConfigsRequest{
				NetworkId: baseID,
				Configs: []*insurancepb.InsuranceNetworkModalityConfig{
					{
						NetworkId:     networkID,
						BillingCityId: billingCityID,
						ServiceLineId: serviceLineID,
						ModalityId:    modalityID,
					},
				},
			},

			want: &StationUpdateNetworkModalityConfigsParams{
				NetworkID: baseID,
				Configs: []StationNetworkModalityConfig{
					{
						NetworkID:     networkID,
						BillingCityID: billingCityID,
						ServiceLineID: serviceLineID,
						ModalityID:    modalityID,
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := StationUpdateNetworkModalityConfigsParamsFromUpdateInsuranceNetworkModalityConfigsRequest(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpsertInsurancePlanCreditCardPoliciesRequestFromUpsertInsuranceNetworkCreditCardRulesRequest(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		description          string
		input                *insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest
		inputInsurancePlanID int64

		want *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest
	}{
		{
			description: "success - base case",
			input: &insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest{
				NetworkId: baseID,
				CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
					{
						ServiceLineId:  1,
						CreditCardRule: "DISABLED",
					},
					{
						ServiceLineId:  2,
						CreditCardRule: "OPTIONAL",
					},
				},
			},
			inputInsurancePlanID: baseID + 1,

			want: &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest{
				InsurancePlanId: baseID + 1,
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						ServiceLineId:      1,
						OnboardingCcPolicy: "DISABLED",
					},
					{
						ServiceLineId:      2,
						OnboardingCcPolicy: "OPTIONAL",
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := UpsertInsurancePlanCreditCardPoliciesRequestFromUpsertInsuranceNetworkCreditCardRulesRequest(tc.input, tc.inputInsurancePlanID)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestListInsurancePlanCreditCardPolicyResponseToListInsuranceNetworkServiceLinesResponse(t *testing.T) {
	baseID := time.Now().UnixNano()

	tcs := []struct {
		desc  string
		input *insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse

		want *insurancepb.ListInsuranceNetworkCreditCardRulesResponse
	}{
		{
			desc: "success - base case",
			input: &insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse{
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{
					{
						Id:                 &baseID,
						ServiceLineId:      baseID,
						OnboardingCcPolicy: "disabled",
					},
				},
			},

			want: &insurancepb.ListInsuranceNetworkCreditCardRulesResponse{
				CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{
					{
						Id:             &baseID,
						ServiceLineId:  baseID,
						CreditCardRule: "disabled",
					},
				},
			},
		},
		{
			desc: "success - empty response",
			input: &insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse{
				CreditCardPolicies: []*insuranceplanpb.InsurancePlanCreditCardPolicy{},
			},

			want: &insurancepb.ListInsuranceNetworkCreditCardRulesResponse{
				CreditCardRules: []*insurancepb.InsuranceNetworkCreditCardRule{},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			output := ListInsurancePlanCreditCardPolicyResponseToListInsuranceNetworkServiceLinesResponse(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestAppointmentTypesProtoFromStationAppointmentTypes(t *testing.T) {
	baseID := time.Now().UnixNano()
	mockedAppointmentType := "D02 Appointment"

	tcs := []struct {
		description string
		input       []StationAppointmentType

		want []*insurancepb.AppointmentType
	}{
		{
			description: "success - base case",
			input: []StationAppointmentType{
				{
					ID:   strconv.Itoa(int(baseID)),
					Name: mockedAppointmentType,
				},
			},

			want: []*insurancepb.AppointmentType{
				{
					Id:   strconv.Itoa(int(baseID)),
					Name: mockedAppointmentType,
				},
			},
		},
		{
			description: "success - base case empty slice",
			input:       []StationAppointmentType{},

			want: []*insurancepb.AppointmentType{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := AppointmentTypesProtoFromStationAppointmentTypes(tc.input)
			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceNetworkAppointmentTypesProtoFromSQL(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	modalityType := "in_person"
	newPatientAppointmentType := "C0-16"
	existingPatientAppointmentType := "C1-16"

	tcs := []struct {
		description string
		input       []*insurancesql.InsuranceNetworksAppointmentType

		want []*insurancepb.InsuranceNetworkAppointmentType
	}{
		{
			description: "success - base case",
			input: []*insurancesql.InsuranceNetworksAppointmentType{
				{
					ID:                             baseID,
					NetworkID:                      networkID,
					ServiceLineID:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},

			want: []*insurancepb.InsuranceNetworkAppointmentType{
				{
					Id:                             baseID,
					NetworkId:                      networkID,
					ServiceLineId:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},
		},
		{
			description: "success - base case empty slice",
			input:       []*insurancesql.InsuranceNetworksAppointmentType{},

			want: []*insurancepb.InsuranceNetworkAppointmentType{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := InsuranceNetworkAppointmentTypesProtoFromSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestCreateInsuranceNetworksAppointmentTypesParamsSQLFromUpdateInsuranceNetworkAppointmentTypesRequestProto(t *testing.T) {
	baseID := time.Now().UnixNano()
	networkID := baseID + 1
	serviceLineID := baseID + 2
	modalityType := "virtual"
	newPatientAppointmentType := "D0-new"
	existingPatientAppointmentType := "D1-existing"

	tcs := []struct {
		description string
		input       []*insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest_InsuranceNetworkAppointmentType

		want insurancesql.CreateInsuranceNetworksAppointmentTypesParams
	}{
		{
			description: "success - base case",
			input: []*insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest_InsuranceNetworkAppointmentType{
				{
					NetworkId:                      networkID,
					ServiceLineId:                  serviceLineID,
					ModalityType:                   modalityType,
					NewPatientAppointmentType:      newPatientAppointmentType,
					ExistingPatientAppointmentType: existingPatientAppointmentType,
				},
			},

			want: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
				NetworkIds:                      []int64{networkID},
				ServiceLineIds:                  []int64{serviceLineID},
				ModalityTypes:                   []string{modalityType},
				NewPatientAppointmentTypes:      []string{newPatientAppointmentType},
				ExistingPatientAppointmentTypes: []string{existingPatientAppointmentType},
			},
		},
		{
			description: "success - base case with empty slice",
			input:       []*insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest_InsuranceNetworkAppointmentType{},

			want: insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
				NetworkIds:                      []int64{},
				ServiceLineIds:                  []int64{},
				ModalityTypes:                   []string{},
				NewPatientAppointmentTypes:      []string{},
				ExistingPatientAppointmentTypes: []string{},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			output := CreateInsuranceNetworksAppointmentTypesParamsSQLFromUpdateInsuranceNetworkAppointmentTypesRequestProto(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

package main

import (
	"strconv"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func CreateInsurancePayerSQLParamsFromCreateInsurancePayerProtoRequest(r *insurancepb.CreateInsurancePayerRequest) (*insurancesql.CreateInsurancePayerParams, error) {
	if r.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "Payer.name cannot be empty")
	}

	createInsurancePayerParams := insurancesql.CreateInsurancePayerParams{
		Name:         r.Name,
		Notes:        sqltypes.ToNullString(r.Notes),
		PayerGroupID: r.GetPayerGroupId(),
		IsActive:     r.GetActive(),
	}

	return &createInsurancePayerParams, nil
}

func InsurancePayerProtoFromInsurancePayerSQL(p *insurancesql.InsurancePayer) *insurancepb.InsurancePayer {
	protoInsurancePayer := insurancepb.InsurancePayer{
		Id:           p.ID,
		Name:         p.Name,
		Notes:        p.Notes.String,
		PayerGroupId: p.PayerGroupID,
		Active:       p.IsActive,
		CreatedAt:    protoconv.TimeToProtoTimestamp(&p.CreatedAt),
		UpdatedAt:    protoconv.TimeToProtoTimestamp(&p.UpdatedAt),
	}

	deletedAt, _ := p.DeletedAt.Value()
	if deletedAt != nil {
		deletedAtTime := deletedAt.(time.Time)
		protoInsurancePayer.DeletedAt = protoconv.TimeToProtoTimestamp(&deletedAtTime)
	}

	return &protoInsurancePayer
}

func UpdateInsurancePayerSQLParamsFromUpdateInsurancePayerProtoRequest(r *insurancepb.UpdateInsurancePayerRequest) (*insurancesql.UpdateInsurancePayerParams, error) {
	payerID := r.GetPayerId()
	if payerID <= 0 {
		return nil, status.Error(codes.InvalidArgument, "payer_id cannot be empty")
	}
	if r.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name cannot be empty")
	}

	return &insurancesql.UpdateInsurancePayerParams{
		ID:           payerID,
		Name:         r.Name,
		Notes:        sqltypes.ToNullString(r.Notes),
		IsActive:     r.GetActive(),
		PayerGroupID: r.GetPayerGroupId(),
	}, nil
}

func InsuranceClassificationsProtoFromStationInsuranceClassifications(stationInsuranceClassifications []StationInsuranceClassification) []*insurancepb.InsuranceClassification {
	insuranceClassifications := make([]*insurancepb.InsuranceClassification, len(stationInsuranceClassifications))
	for i, ic := range stationInsuranceClassifications {
		insuranceClassifications[i] = &insurancepb.InsuranceClassification{
			Id:   ic.ID,
			Name: ic.Name,
		}
	}

	return insuranceClassifications
}

func ModalitiesListProtoFromStationModalities(stationModalities []StationModality) []*insurancepb.Modality {
	modalities := make([]*insurancepb.Modality, len(stationModalities))
	for i, m := range stationModalities {
		modalities[i] = &insurancepb.Modality{
			Id:          m.ID,
			DisplayName: m.DisplayName,
			Type:        m.Type,
		}
	}

	return modalities
}

func ServiceLinesProtoFromStationServiceLines(stationServiceLines []StationServiceLine) []*insurancepb.ServiceLine {
	serviceLines := make([]*insurancepb.ServiceLine, len(stationServiceLines))
	for i, s := range stationServiceLines {
		serviceLines[i] = &insurancepb.ServiceLine{
			Id:                       s.ID,
			Name:                     s.Name,
			Default:                  s.Default,
			ShiftTypeId:              s.ShiftTypeID,
			OutOfNetworkInsurance:    s.OutOfNetworkInsurance,
			RequireCheckout:          s.RequireCheckout,
			RequireConsentSignature:  s.RequireConsentSignature,
			RequireMedicalNecessity:  s.RequireMedicalNecessity,
			Followup_2Day:            s.Followup2Day,
			Followup_14_30Day:        s.Followup14To30Day,
			Is_911:                   s.Is911,
			UpgradeableWithScreening: s.UpgradeableWithScreening,
			UpdatedAt:                s.UpdatedAt,
			CreatedAt:                s.CreatedAt,
		}

		if s.ExistingPatientAppointmentType != nil {
			serviceLines[i].ExistingPatientAppointmentType = &insurancepb.AppointmentType{
				Id:   s.ExistingPatientAppointmentType.ID,
				Name: s.ExistingPatientAppointmentType.Name,
			}
		}

		if s.NewPatientAppointmentType != nil {
			serviceLines[i].NewPatientAppointmentType = &insurancepb.AppointmentType{
				Id:   s.NewPatientAppointmentType.ID,
				Name: s.NewPatientAppointmentType.Name,
			}
		}
	}

	return serviceLines
}

func PayerGroupsFromStationPayerGroups(stationPayerGroups []*payergrouppb.PayerGroup) []*insurancepb.PayerGroup {
	payerGroups := make([]*insurancepb.PayerGroup, len(stationPayerGroups))

	for i, payerGroup := range stationPayerGroups {
		payerGroups[i] = &insurancepb.PayerGroup{
			Id:           payerGroup.Id,
			Name:         payerGroup.Name,
			PayerGroupId: payerGroup.PayerGroupId,
		}
	}
	return payerGroups
}

func StatesFromStationStates(stationStates []*statepb.State) []*insurancepb.State {
	states := make([]*insurancepb.State, len(stationStates))

	for i, state := range stationStates {
		states[i] = &insurancepb.State{
			Id:            state.Id,
			Name:          state.Name,
			Abbreviation:  state.Abbreviation,
			BillingCities: BillingCitiesFromStationBillingCities(state.BillingCities),
		}
	}
	return states
}

func BillingCitiesFromStationBillingCities(stationBillingCities []*statepb.BillingCity) []*insurancepb.BillingCity {
	billingCities := make([]*insurancepb.BillingCity, len(stationBillingCities))

	for i, billingCity := range stationBillingCities {
		billingCities[i] = &insurancepb.BillingCity{
			Id:        billingCity.Id,
			Name:      billingCity.Name,
			State:     billingCity.State,
			ShortName: billingCity.ShortName,
			Enabled:   billingCity.Enabled,
			MarketId:  billingCity.MarketId,
		}
	}
	return billingCities
}

func CreateInsuranceNetworkSQLParamsFromCreateInsuranceNetworkProtoRequest(req *insurancepb.CreateInsuranceNetworkRequest, insurancePlanID int64) (*insurancesql.CreateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams, error) {
	if req.Name == "" {
		return nil, nil, status.Error(codes.InvalidArgument, "network.name cannot be empty")
	}

	if req.PackageId == nil {
		return nil, nil, status.Error(codes.InvalidArgument, "network.package_id cannot be empty")
	}

	if req.GetInsuranceClassificationId() == 0 {
		return nil, nil, status.Error(codes.InvalidArgument, "network.insurance_classification_id cannot be empty")
	}

	if req.GetInsurancePayerId() == 0 {
		return nil, nil, status.Error(codes.InvalidArgument, "network.insurance_payer_id cannot be empty")
	}

	createInsuranceNetworkParams := insurancesql.CreateInsuranceNetworkParams{
		Name:                      req.Name,
		Notes:                     sqltypes.ToNullString(req.Notes),
		PackageID:                 req.GetPackageId(),
		InsuranceClassificationID: req.GetInsuranceClassificationId(),
		InsurancePlanID:           insurancePlanID,
		InsurancePayerID:          req.GetInsurancePayerId(),
		EligibilityCheckEnabled:   req.GetEligibilityCheck(),
		ProviderEnrollmentEnabled: req.GetProviderEnrollment(),
		IsActive:                  req.GetActive(),
		EmcCode:                   sqltypes.ToNullString(req.EmcCode),
	}

	requestAddresses := req.GetAddresses()
	createInsuranceNetworkAddressesByInsuranceNetworkIDParams := make([]insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams, len(requestAddresses))

	for i, requestAddress := range requestAddresses {
		createInsuranceNetworkAddressesByInsuranceNetworkIDParams[i] = insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
			City:         *requestAddress.City,
			Zipcode:      *requestAddress.ZipCode,
			Address:      *requestAddress.AddressLineOne,
			BillingState: *requestAddress.State,
		}
	}

	return &createInsuranceNetworkParams, createInsuranceNetworkAddressesByInsuranceNetworkIDParams, nil
}

func InsuranceNetworkProtoFromInsuranceNetworkSQL(p *insurancesql.InsuranceNetwork, a []*insurancesql.InsuranceNetworkAddress) *insurancepb.InsuranceNetwork {
	addresses := make([]*common.Address, len(a))
	for i, address := range a {
		addresses[i] = &common.Address{
			City:           &address.City,
			ZipCode:        &address.Zipcode,
			AddressLineOne: &address.Address,
			State:          &address.BillingState,
		}
	}

	return &insurancepb.InsuranceNetwork{
		Id:                        p.ID,
		Name:                      p.Name,
		Notes:                     p.Notes.String,
		PackageId:                 p.PackageID,
		InsuranceClassificationId: p.InsuranceClassificationID,
		InsurancePlanId:           p.InsurancePlanID,
		InsurancePayerId:          p.InsurancePayerID,
		EligibilityCheck:          p.EligibilityCheckEnabled,
		ProviderEnrollment:        p.ProviderEnrollmentEnabled,
		Active:                    p.IsActive,
		EmcCode:                   p.EmcCode.String,
		CreatedAt:                 protoconv.TimeToProtoTimestamp(&p.CreatedAt),
		UpdatedAt:                 protoconv.TimeToProtoTimestamp(&p.UpdatedAt),
		Addresses:                 addresses,
	}
}

func ProtoAddresesFromInsuranceNetworkAddressesSQL(a []*insurancesql.InsuranceNetworkAddress) []*common.Address {
	addresses := make([]*common.Address, len(a))
	for i, address := range a {
		addresses[i] = &common.Address{
			City:           &address.City,
			ZipCode:        &address.Zipcode,
			AddressLineOne: &address.Address,
			State:          &address.BillingState,
		}
	}

	return addresses
}

func InsuranceNetworkProtoFromGetInsuranceNetworkByInsurancePlanIDRowSQL(p *insurancesql.GetInsuranceNetworkByInsurancePlanIDRow, a []*insurancesql.InsuranceNetworkAddress) *insurancepb.InsuranceNetwork {
	addresses := ProtoAddresesFromInsuranceNetworkAddressesSQL(a)

	return &insurancepb.InsuranceNetwork{
		Id:                        p.ID,
		Name:                      p.Name,
		Notes:                     p.Notes.String,
		PackageId:                 p.PackageID,
		InsuranceClassificationId: p.InsuranceClassificationID,
		InsurancePlanId:           p.InsurancePlanID,
		InsurancePayerId:          p.InsurancePayerID,
		InsurancePayerName:        p.InsurancePayerName,
		InsurancePayerGroupId:     p.InsurancePayerGroupID,
		EligibilityCheck:          p.EligibilityCheckEnabled,
		ProviderEnrollment:        p.ProviderEnrollmentEnabled,
		Active:                    p.IsActive,
		EmcCode:                   p.EmcCode.String,
		CreatedAt:                 protoconv.TimeToProtoTimestamp(&p.CreatedAt),
		UpdatedAt:                 protoconv.TimeToProtoTimestamp(&p.UpdatedAt),
		Addresses:                 addresses,
	}
}

func InsuranceNetworkProtoFromSearchInsuranceNetworksRowSQL(p *insurancesql.SearchInsuranceNetworksRow, a []*insurancesql.InsuranceNetworkAddress) *insurancepb.InsuranceNetwork {
	addresses := ProtoAddresesFromInsuranceNetworkAddressesSQL(a)

	return &insurancepb.InsuranceNetwork{
		Id:                        p.ID,
		Name:                      p.Name,
		Notes:                     p.Notes.String,
		PackageId:                 p.PackageID,
		InsuranceClassificationId: p.InsuranceClassificationID,
		InsurancePlanId:           p.InsurancePlanID,
		InsurancePayerId:          p.InsurancePayerID,
		InsurancePayerName:        p.InsurancePayerName,
		EligibilityCheck:          p.EligibilityCheckEnabled,
		ProviderEnrollment:        p.ProviderEnrollmentEnabled,
		Active:                    p.IsActive,
		EmcCode:                   p.EmcCode.String,
		CreatedAt:                 protoconv.TimeToProtoTimestamp(&p.CreatedAt),
		UpdatedAt:                 protoconv.TimeToProtoTimestamp(&p.UpdatedAt),
		Addresses:                 addresses,
	}
}

func GetInsurancePayersWithFilterAndOrderSQLParamsFromListInsurancePayersProtoRequest(r *insurancepb.ListInsurancePayersRequest) *insurancesql.GetInsurancePayersWithFilterAndOrderParams {
	sortDirection := "asc"
	if r.GetSortDirection() == insurancepb.SortDirection_SORT_DIRECTION_DESCENDING {
		sortDirection = "desc"
	}

	sortField := "name"
	if r.GetSortField() == insurancepb.ListInsurancePayersRequest_SORT_FIELD_UPDATED_AT {
		sortField = "updated_at"
	}
	return &insurancesql.GetInsurancePayersWithFilterAndOrderParams{
		FilterStates:  r.GetStateAbbrs(),
		SearchString:  r.GetPayerName(),
		SortBy:        sortField,
		SortDirection: sortDirection,
	}
}

func SearchInsuranceNetworksSQLParamsFromListInsurancePayersProtoRequest(r *insurancepb.ListInsurancePayersRequest, payerIDs []int64) *insurancesql.SearchInsuranceNetworksParams {
	return &insurancesql.SearchInsuranceNetworksParams{
		PayerIds:     payerIDs,
		FilterStates: r.GetStateAbbrs(),
	}
}

func SearchInsuranceNetworksSQLParamsFromSearchInsuranceNetworksProtoRequest(r *insurancepb.SearchInsuranceNetworksRequest, networkIDs []int64) *insurancesql.SearchInsuranceNetworksParams {
	sortDirection := "asc"
	if r.GetSortDirection() == insurancepb.SortDirection_SORT_DIRECTION_DESCENDING {
		sortDirection = "desc"
	}

	sortField := "name"
	if r.GetSortField() == insurancepb.SearchInsuranceNetworksRequest_SORT_FIELD_UPDATED_AT {
		sortField = "updated_at"
	}

	return &insurancesql.SearchInsuranceNetworksParams{
		PayerIds:              r.GetPayerIds(),
		FilterStates:          r.GetStateAbbrs(),
		FilterClassifications: r.GetInsuranceClassifications(),
		SortBy:                sortField,
		SortDirection:         sortDirection,
		SearchString:          r.GetSearch(),
		NetworkIds:            networkIDs,
		PackageIds:            r.GetPackageIds(),
		InsurancePlanIds:      r.GetInsurancePlanIds(),
		ShowInactive:          r.GetShowInactive(),
	}
}

func UpdateInsuranceNetworkSQLParamsFromUpdateInsuranceNetworkProtoRequest(r *insurancepb.UpdateInsuranceNetworkRequest) (*insurancesql.UpdateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) {
	updateInsuranceNetworkParams := &insurancesql.UpdateInsuranceNetworkParams{
		ID:                        r.NetworkId,
		PackageID:                 r.GetPackageId(),
		Name:                      r.Name,
		Notes:                     sqltypes.ToNullString(r.Notes),
		InsuranceClassificationID: r.GetInsuranceClassificationId(),
		InsurancePlanID:           r.GetInsurancePlanId(),
		InsurancePayerID:          r.GetInsurancePayerId(),
		EligibilityCheckEnabled:   r.GetEligibilityCheck(),
		ProviderEnrollmentEnabled: r.GetProviderEnrollment(),
		IsActive:                  r.GetActive(),
		EmcCode:                   sqltypes.ToNullString(r.EmcCode),
	}

	requestAddresses := r.GetAddresses()
	createInsuranceNetworkAddressesByInsuranceNetworkIDParams := make([]insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams, len(requestAddresses))

	for i, requestAddress := range requestAddresses {
		createInsuranceNetworkAddressesByInsuranceNetworkIDParams[i] = insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams{
			City:         *requestAddress.City,
			Zipcode:      *requestAddress.ZipCode,
			Address:      *requestAddress.AddressLineOne,
			BillingState: *requestAddress.State,
		}
	}

	return updateInsuranceNetworkParams, createInsuranceNetworkAddressesByInsuranceNetworkIDParams
}

func CreateInsurancePlanRequestFromCreateInsuranceNetworkRequest(r *insurancepb.CreateInsuranceNetworkRequest) (*insuranceplanpb.CreateInsurancePlanRequest, error) {
	if r.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.name cannot be empty")
	}
	if r.PackageId == nil {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.package_id cannot be empty")
	}
	if r.GetInsuranceClassificationId() == 0 {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.insurance_classification_id cannot be empty")
	}
	return &insuranceplanpb.CreateInsurancePlanRequest{
		Name:                      r.Name,
		Note:                      r.Notes,
		PackageId:                 strconv.FormatInt(r.GetPackageId(), 10),
		Active:                    r.GetActive(),
		InsuranceClassificationId: r.GetInsuranceClassificationId(),
	}, nil
}

func UpdateInsurancePlanRequestFromUpdateInsuranceNetworkRequest(r *insurancepb.UpdateInsuranceNetworkRequest) (*insuranceplanpb.UpdateInsurancePlanRequest, error) {
	if r.GetInsurancePlanId() <= 0 {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.id should be greater than 0")
	}

	if r.GetName() == "" {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.name cannot be empty")
	}

	if r.PackageId == nil {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.package_id cannot be empty")
	}

	if r.GetInsuranceClassificationId() <= 0 {
		return nil, status.Error(codes.InvalidArgument, "insurance_plan.insurance_classification_id should be greater than 0")
	}

	return &insuranceplanpb.UpdateInsurancePlanRequest{
		InsurancePlanId:           r.InsurancePlanId,
		Name:                      r.Name,
		Note:                      r.Notes,
		PackageId:                 strconv.FormatInt(r.GetPackageId(), 10),
		Active:                    r.GetActive(),
		InsuranceClassificationId: r.InsuranceClassificationId,
	}, nil
}

func CreateInsuranceNetworkStatesSQLParamsFromUpdateInsuranceNetworkStatesRequest(r *insurancepb.UpdateInsuranceNetworkStatesRequest) []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams {
	var createQueryParams []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams
	for _, stateAbbr := range r.GetStateAbbrs() {
		createQueryParams = append(createQueryParams, insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams{
			InsuranceNetworkID: r.GetNetworkId(),
			StateAbbr:          stateAbbr,
		})
	}

	return createQueryParams
}

func InsuranceNetworkModalityConfigsProtoFromStationNetworkModalityConfigs(stationNetworkModalityConfigs []StationNetworkModalityConfig) []*insurancepb.InsuranceNetworkModalityConfig {
	modalityConfigs := make([]*insurancepb.InsuranceNetworkModalityConfig, len(stationNetworkModalityConfigs))
	for i, mc := range stationNetworkModalityConfigs {
		modalityConfigs[i] = &insurancepb.InsuranceNetworkModalityConfig{
			Id:            mc.ID,
			NetworkId:     mc.NetworkID,
			BillingCityId: mc.BillingCityID,
			ServiceLineId: mc.ServiceLineID,
			ModalityId:    mc.ModalityID,
		}
	}

	return modalityConfigs
}

func StationUpdateNetworkModalityConfigsParamsFromUpdateInsuranceNetworkModalityConfigsRequest(req *insurancepb.UpdateInsuranceNetworkModalityConfigsRequest) *StationUpdateNetworkModalityConfigsParams {
	modalityConfigs := make([]StationNetworkModalityConfig, len(req.Configs))

	for i, config := range req.Configs {
		modalityConfigs[i] = StationNetworkModalityConfig{
			ID:            config.Id,
			NetworkID:     config.NetworkId,
			BillingCityID: config.BillingCityId,
			ServiceLineID: config.ServiceLineId,
			ModalityID:    config.ModalityId,
		}
	}

	return &StationUpdateNetworkModalityConfigsParams{
		NetworkID: req.NetworkId,
		Configs:   modalityConfigs,
	}
}

func UpsertInsurancePlanCreditCardPoliciesRequestFromUpsertInsuranceNetworkCreditCardRulesRequest(r *insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest, planID int64) *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest {
	creditCardRules := r.GetCreditCardRules()

	creditCardPolicies := make([]*insuranceplanpb.InsurancePlanCreditCardPolicy, len(creditCardRules))

	for i, creditCardRule := range creditCardRules {
		creditCardPolicies[i] = &insuranceplanpb.InsurancePlanCreditCardPolicy{
			ServiceLineId:      creditCardRule.GetServiceLineId(),
			OnboardingCcPolicy: creditCardRule.GetCreditCardRule(),
		}
	}

	return &insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest{
		InsurancePlanId:    planID,
		CreditCardPolicies: creditCardPolicies,
	}
}

func ListInsurancePlanCreditCardPolicyResponseToListInsuranceNetworkServiceLinesResponse(res *insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse) *insurancepb.ListInsuranceNetworkCreditCardRulesResponse {
	creditCardPolicies := make([]*insurancepb.InsuranceNetworkCreditCardRule, len(res.CreditCardPolicies))

	for i, creditCardPolicy := range res.CreditCardPolicies {
		creditCardPolicies[i] = &insurancepb.InsuranceNetworkCreditCardRule{
			Id:             creditCardPolicy.Id,
			ServiceLineId:  creditCardPolicy.ServiceLineId,
			CreditCardRule: creditCardPolicy.OnboardingCcPolicy,
		}
	}

	return &insurancepb.ListInsuranceNetworkCreditCardRulesResponse{
		CreditCardRules: creditCardPolicies,
	}
}

func AppointmentTypesProtoFromStationAppointmentTypes(stationAppointmentTypes []StationAppointmentType) []*insurancepb.AppointmentType {
	appointmentTypes := make([]*insurancepb.AppointmentType, len(stationAppointmentTypes))
	for i, appointmentType := range stationAppointmentTypes {
		appointmentTypes[i] = &insurancepb.AppointmentType{
			Id:   appointmentType.ID,
			Name: appointmentType.Name,
		}
	}

	return appointmentTypes
}

func InsuranceNetworkAppointmentTypesProtoFromSQL(sqlAppointmentTypes []*insurancesql.InsuranceNetworksAppointmentType) []*insurancepb.InsuranceNetworkAppointmentType {
	appointmentTypes := make([]*insurancepb.InsuranceNetworkAppointmentType, len(sqlAppointmentTypes))

	for i, appointmentType := range sqlAppointmentTypes {
		appointmentTypes[i] = &insurancepb.InsuranceNetworkAppointmentType{
			Id:                             appointmentType.ID,
			NetworkId:                      appointmentType.NetworkID,
			ServiceLineId:                  appointmentType.ServiceLineID,
			ModalityType:                   appointmentType.ModalityType,
			NewPatientAppointmentType:      appointmentType.NewPatientAppointmentType,
			ExistingPatientAppointmentType: appointmentType.ExistingPatientAppointmentType,
		}
	}

	return appointmentTypes
}

func CreateInsuranceNetworksAppointmentTypesParamsSQLFromUpdateInsuranceNetworkAppointmentTypesRequestProto(appointmentTypes []*insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest_InsuranceNetworkAppointmentType) insurancesql.CreateInsuranceNetworksAppointmentTypesParams {
	appointmentTypesLen := len(appointmentTypes)
	networkIDs := make([]int64, appointmentTypesLen)
	serviceLineIDs := make([]int64, appointmentTypesLen)
	modalityTypes := make([]string, appointmentTypesLen)
	newPatientAppointmentTypes := make([]string, appointmentTypesLen)
	existingPatientAppointmentTypes := make([]string, appointmentTypesLen)

	for i, appointmentType := range appointmentTypes {
		networkIDs[i] = appointmentType.NetworkId
		serviceLineIDs[i] = appointmentType.ServiceLineId
		modalityTypes[i] = appointmentType.ModalityType
		newPatientAppointmentTypes[i] = appointmentType.NewPatientAppointmentType
		existingPatientAppointmentTypes[i] = appointmentType.ExistingPatientAppointmentType
	}

	return insurancesql.CreateInsuranceNetworksAppointmentTypesParams{
		NetworkIds:                      networkIDs,
		ServiceLineIds:                  serviceLineIDs,
		ModalityTypes:                   modalityTypes,
		NewPatientAppointmentTypes:      newPatientAppointmentTypes,
		ExistingPatientAppointmentTypes: existingPatientAppointmentTypes,
	}
}

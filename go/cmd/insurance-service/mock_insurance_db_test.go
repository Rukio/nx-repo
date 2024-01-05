package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/cmd/insurance-service/insurancedb"

	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
)

type mockInsuranceDB struct {
	isHealthyResult                                               bool
	createInsuranceNetworkResult                                  *insurancesql.InsuranceNetwork
	createInsuranceNetworkError                                   error
	createInsurancePayerResult                                    *insurancesql.InsurancePayer
	createInsurancePayerError                                     error
	deleteInsurancePayerResult                                    *insurancesql.InsurancePayer
	deleteInsurancePayerError                                     error
	getInsuranceNetworkResult                                     *insurancesql.InsuranceNetwork
	getInsuranceNetworkError                                      error
	getInsuranceNetworkByInsurancePlanIDResult                    *insurancesql.GetInsuranceNetworkByInsurancePlanIDRow
	getInsuranceNetworkByInsurancePlanIDError                     error
	searchInsuranceNetworksResult                                 []*insurancesql.SearchInsuranceNetworksRow
	searchInsuranceNetworksError                                  error
	getInsuranceNetworkStatesByInsuranceNetworksIDsResult         []*insurancesql.InsuranceNetworkState
	getInsuranceNetworkStatesByInsuranceNetworksIDsError          error
	getInsuranceNetworkAddressesByInsuranceNetworksIDsResult      []*insurancesql.InsuranceNetworkAddress
	getInsuranceNetworkAddressesByInsuranceNetworksIDsError       error
	getInsurancePayerResult                                       *insurancesql.InsurancePayer
	getInsurancePayerError                                        error
	getInsurancePayersWithFilterAndOrderResult                    []*insurancesql.InsurancePayer
	getInsurancePayersWithFilterAndOrderError                     error
	updateInsurancePayerResult                                    *insurancesql.InsurancePayer
	updateInsurancePayerError                                     error
	updateInsuranceNetworkResult                                  *insurancesql.InsuranceNetwork
	updateInsuranceNetworkError                                   error
	updateInsuranceNetworkStatesResult                            []*insurancesql.InsuranceNetworkState
	updateInsuranceNetworkStatesError                             error
	updateInsuranceNetworkAppointmentTypesResponse                []*insurancesql.InsuranceNetworksAppointmentType
	updateInsuranceNetworkAppointmentTypesError                   error
	getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDResult []*insurancesql.InsuranceNetworksAppointmentType
	getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDError  error
}

func (m *mockInsuranceDB) IsHealthy(context.Context) bool {
	return m.isHealthyResult
}

func (m *mockInsuranceDB) CreateInsurancePayer(context.Context, insurancesql.CreateInsurancePayerParams) (*insurancesql.InsurancePayer, error) {
	return m.createInsurancePayerResult, m.createInsurancePayerError
}

func (m *mockInsuranceDB) DeleteInsurancePayer(context.Context, int64) (*insurancesql.InsurancePayer, error) {
	return m.deleteInsurancePayerResult, m.deleteInsurancePayerError
}

func (m *mockInsuranceDB) GetInsuranceNetwork(context.Context, int64) (*insurancesql.InsuranceNetwork, error) {
	return m.getInsuranceNetworkResult, m.getInsuranceNetworkError
}

func (m *mockInsuranceDB) GetInsuranceNetworkByInsurancePlanID(context.Context, int64) (*insurancesql.GetInsuranceNetworkByInsurancePlanIDRow, error) {
	return m.getInsuranceNetworkByInsurancePlanIDResult, m.getInsuranceNetworkByInsurancePlanIDError
}

func (m *mockInsuranceDB) SearchInsuranceNetworks(context.Context, insurancesql.SearchInsuranceNetworksParams) ([]*insurancesql.SearchInsuranceNetworksRow, error) {
	return m.searchInsuranceNetworksResult, m.searchInsuranceNetworksError
}

func (m *mockInsuranceDB) GetInsuranceNetworkStatesByInsuranceNetworksIDs(context.Context, []int64) ([]*insurancesql.InsuranceNetworkState, error) {
	return m.getInsuranceNetworkStatesByInsuranceNetworksIDsResult, m.getInsuranceNetworkStatesByInsuranceNetworksIDsError
}

func (m *mockInsuranceDB) GetInsuranceNetworkAddressByInsuranceNetworksIDs(context.Context, []int64) ([]*insurancesql.InsuranceNetworkAddress, error) {
	return m.getInsuranceNetworkAddressesByInsuranceNetworksIDsResult, m.getInsuranceNetworkAddressesByInsuranceNetworksIDsError
}

func (m *mockInsuranceDB) GetInsurancePayer(context.Context, int64) (*insurancesql.InsurancePayer, error) {
	return m.getInsurancePayerResult, m.getInsurancePayerError
}

func (m *mockInsuranceDB) GetInsurancePayersWithFilterAndOrder(context.Context, insurancesql.GetInsurancePayersWithFilterAndOrderParams) ([]*insurancesql.InsurancePayer, error) {
	return m.getInsurancePayersWithFilterAndOrderResult, m.getInsurancePayersWithFilterAndOrderError
}

func (m *mockInsuranceDB) UpdateInsurancePayer(context.Context, insurancesql.UpdateInsurancePayerParams) (*insurancesql.InsurancePayer, error) {
	return m.updateInsurancePayerResult, m.updateInsurancePayerError
}

func (m *mockInsuranceDB) CreateInsuranceNetwork(context.Context, insurancesql.CreateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error) {
	return m.createInsuranceNetworkResult, m.createInsuranceNetworkError
}

func (m *mockInsuranceDB) UpdateInsuranceNetwork(context.Context, insurancesql.UpdateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error) {
	return m.updateInsuranceNetworkResult, m.updateInsuranceNetworkError
}

func (m *mockInsuranceDB) UpdateInsuranceNetworkStates(context.Context, int64, []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworkState, error) {
	return m.updateInsuranceNetworkStatesResult, m.updateInsuranceNetworkStatesError
}

func (m *mockInsuranceDB) UpdateInsuranceNetworkAppointmentTypes(context.Context, insurancedb.UpdateInsuranceNetworkAppointmentTypesParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error) {
	return m.updateInsuranceNetworkAppointmentTypesResponse, m.updateInsuranceNetworkAppointmentTypesError
}

func (m *mockInsuranceDB) GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(context.Context, insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error) {
	return m.getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDResult, m.getInsuranceNetworkAppointmentTypesByInsuranceNetworkIDError
}

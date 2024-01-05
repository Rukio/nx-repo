import mapper from '../insurance-networks.mapper';
import {
  MOCK_SEARCH_INSURANCE_NETWORKS_ALL_PARAMS,
  MOCKS_SEARCH_INSURANCE_NETWORKS_NULL_SORT_PARAMS,
  MOCK_SEARCH_INSURANCE_NETWORKS_SORT_PARAMS,
  MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_ALL_PARAMS,
  MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_NULL_SORT_PARAMS,
  MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_SORT_PARAMS,
  MOCK_SERVICES_INSURANCE_NETWORKS,
  MOCK_INSURANCE_PAYER_ALL_PARAMS,
  MOCK_INSURANCE_SERVICES_PAYER_ALL_PARAMS,
  MOCK_INSURANCE_NETWORK,
} from './mocks/insurance-networks.mock';

describe('Insurance networks mapper tests', () => {
  it('transform SearchInsuranceNetwork to ServicesInsuranceNetworkRequest', () => {
    const transformedAllResult =
      mapper.SearchInsuranceNetworkToServiceInsuranceNetwork(
        MOCK_SEARCH_INSURANCE_NETWORKS_ALL_PARAMS
      );
    const transformedSortResult =
      mapper.SearchInsuranceNetworkToServiceInsuranceNetwork(
        MOCK_SEARCH_INSURANCE_NETWORKS_SORT_PARAMS
      );
    const transformedNullSortResult =
      mapper.SearchInsuranceNetworkToServiceInsuranceNetwork(
        MOCKS_SEARCH_INSURANCE_NETWORKS_NULL_SORT_PARAMS
      );
    expect(transformedAllResult).toEqual(
      MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_ALL_PARAMS
    );
    expect(transformedSortResult).toEqual(
      MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_SORT_PARAMS
    );
    expect(transformedNullSortResult).toEqual(
      MOCK_SEARCH_SERVICES_INSURANCE_NETWORKS_NULL_SORT_PARAMS
    );
  });

  it('transform ServicesInsuranceNetwork to InsuranceNetwork', () => {
    const transformedAllResult =
      mapper.ServicesInsuranceNetworkToInsuranceNetwork(
        MOCK_SERVICES_INSURANCE_NETWORKS
      );
    expect(transformedAllResult).toEqual(MOCK_INSURANCE_NETWORK);
  });

  it('transform ServicesInsuranceNetworkAddress to InsuranceNetworkAddress', () => {
    const transformedResult =
      mapper.ServicesInsuranceNetworkAddressToInsuranceNetworkAddress(
        MOCK_SERVICES_INSURANCE_NETWORKS.address
      );
    expect(transformedResult).toEqual(MOCK_INSURANCE_NETWORK.claimsAddress);
  });
});

describe('Insurance payers mapper tests', () => {
  it('transform Insurance Service Payers to InsurancePayers', () => {
    const transformedAllResult = mapper.InsuranceServicePayersToInsurancePayers(
      MOCK_INSURANCE_SERVICES_PAYER_ALL_PARAMS
    );
    expect(transformedAllResult).toEqual(MOCK_INSURANCE_PAYER_ALL_PARAMS);
  });
});

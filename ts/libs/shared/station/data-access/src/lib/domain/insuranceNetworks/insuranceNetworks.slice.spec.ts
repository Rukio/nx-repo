import { setupTestStore } from '../../../testUtils';
import {
  insuranceNetworksSlice,
  INSURANCE_NETWORKS_BASE_PATH,
  INSURANCE_NETWORKS_SEARCH_SEGMENT,
  selectInsuranceNetworks,
  SearchInsuranceNetworksQuery,
  InsuranceNetworkSortDirection,
  InsuranceNetworkSortField,
} from './insuranceNetworks.slice';
import { environment } from '../../../environments/environment';
import { buildUrlQuery } from '../../utils/query';
import { mockedInsuranceNetwork } from './mocks';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

const mockedQuery: SearchInsuranceNetworksQuery = {
  search: 'test',
  payer_ids: [1],
  state_abbrs: ['CO'],
  insurance_classifications: [1],
  sort_field: InsuranceNetworkSortField.NAME,
  sort_direction: InsuranceNetworkSortDirection.DESC,
};

describe('insuranceNetworksSlice.slice', () => {
  describe('searchInsuranceNetworks', () => {
    it('should make correct API call with query', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();
      await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate(
          mockedQuery
        )
      );
      expect(fetchMock).toBeCalledTimes(1);

      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${INSURANCE_NETWORKS_BASE_PATH}${INSURANCE_NETWORKS_SEARCH_SEGMENT}?${buildUrlQuery(
          mockedQuery
        )}`
      );
    });

    it('should make correct API call without query', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();
      await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate()
      );
      expect(fetchMock).toBeCalledTimes(1);

      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${INSURANCE_NETWORKS_BASE_PATH}${INSURANCE_NETWORKS_SEARCH_SEGMENT}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();
      const action = await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate()
      );
      testApiSuccessResponse(action, [mockedInsuranceNetwork]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();
      const action = await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select insurance network from store with query', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();
      await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate(
          mockedQuery
        )
      );

      const { data: insuranceNetworksFromStore } = selectInsuranceNetworks(
        mockedQuery
      )(store.getState());
      expect(insuranceNetworksFromStore).toEqual([mockedInsuranceNetwork]);
    });

    it('should select insurance network from store without query', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ networks: [mockedInsuranceNetwork] })
      );
      const store = setupTestStore();
      await store.dispatch(
        insuranceNetworksSlice.endpoints.searchInsuranceNetworks.initiate()
      );

      const { data: insuranceNetworksFromStore } = selectInsuranceNetworks()(
        store.getState()
      );
      expect(insuranceNetworksFromStore).toEqual([mockedInsuranceNetwork]);
    });
  });
});

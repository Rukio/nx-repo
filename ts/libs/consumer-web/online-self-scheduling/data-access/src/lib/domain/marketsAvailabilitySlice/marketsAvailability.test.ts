import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  domainSelectMarketsAvailabilityZipCode,
  marketsAvailabilitySlice,
  buildZipcodePath,
} from './marketsAvailability.slice';
import { environment } from '../../../environments/environment';
import {
  mockMarketsAvailabilityZipCode,
  mockMarketsAvailabilityZipCodeQuery,
} from './mocks';

const { serviceURL } = environment;

describe('marketsAvailability.slice', () => {
  describe('getMarketsAvailabilityZipCode', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockMarketsAvailabilityZipCode })
      );
      const { store } = setupTestStore();

      await store.dispatch(
        marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
          mockMarketsAvailabilityZipCodeQuery
        )
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      const marketsAvailabilityZipcodePath = buildZipcodePath();

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${marketsAvailabilityZipcodePath}?zipcode=${mockMarketsAvailabilityZipCodeQuery.zipCode}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockMarketsAvailabilityZipCode })
      );
      const store = setupTestStore();

      const action = await store.store.dispatch(
        marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
          mockMarketsAvailabilityZipCodeQuery
        )
      );
      testApiSuccessResponse(action, mockMarketsAvailabilityZipCode);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.store.dispatch(
        marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
          mockMarketsAvailabilityZipCodeQuery
        )
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select zip code details from store', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ data: mockMarketsAvailabilityZipCode })
      );
      const store = setupTestStore();
      await store.store.dispatch(
        marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
          mockMarketsAvailabilityZipCodeQuery
        )
      );

      const { data: zipCodeDetailsFromState } =
        domainSelectMarketsAvailabilityZipCode(
          mockMarketsAvailabilityZipCodeQuery
        )(store.store.getState());
      expect(zipCodeDetailsFromState).toEqual(mockMarketsAvailabilityZipCode);
    });
  });
});

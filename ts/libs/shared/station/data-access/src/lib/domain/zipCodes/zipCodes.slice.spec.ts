import { environment } from '../../../environments/environment';
import { setupTestStore } from '../../../testUtils';
import { mockZipCodeDetails, mockZipCodeDetailsQuery } from './mocks';
import {
  domainSelectZipCodeDetails,
  zipCodesSlice,
  ZIP_CODES_BASE_PATH,
} from './zipCodes.slice';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('zipCodes.slice', () => {
  describe('getZipCodeDetails', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        zipCodesSlice.endpoints.getZipCodeDetails.initiate(
          mockZipCodeDetailsQuery
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${ZIP_CODES_BASE_PATH}?zipcode=${mockZipCodeDetailsQuery.zipCode}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockZipCodeDetails));
      const store = setupTestStore();

      const action = await store.dispatch(
        zipCodesSlice.endpoints.getZipCodeDetails.initiate(
          mockZipCodeDetailsQuery
        )
      );
      testApiSuccessResponse(action, mockZipCodeDetails);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        zipCodesSlice.endpoints.getZipCodeDetails.initiate(
          mockZipCodeDetailsQuery
        )
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select zip code details from store', async () => {
      fetchMock.mockResponse(JSON.stringify(mockZipCodeDetails));
      const store = setupTestStore();
      await store.dispatch(
        zipCodesSlice.endpoints.getZipCodeDetails.initiate(
          mockZipCodeDetailsQuery
        )
      );

      const { data: zipCodeDetailsFromState } = domainSelectZipCodeDetails(
        mockZipCodeDetailsQuery
      )(store.getState());
      expect(zipCodeDetailsFromState).toEqual(mockZipCodeDetails);
    });
  });
});

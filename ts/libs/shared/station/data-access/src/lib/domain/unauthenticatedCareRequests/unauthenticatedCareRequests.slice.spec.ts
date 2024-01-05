import { environment } from '../../../environments/environment';
import { setupTestStore } from '../../../testUtils';
import {
  CARE_REQUESTS_BASE_PATH,
  unauthenticatedCareRequestsSlice,
} from './unauthenticatedCareRequests.slice';
import {
  mockCareRequestResult,
  mockCreateCareRequestDataPayload,
} from './mocks';
import {
  testApiUpdateSuccessResponse,
  testApiUpdateErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('unauthenticatedCareRequests.slice', () => {
  describe('createCareRequest', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store
        .dispatch(
          unauthenticatedCareRequestsSlice.endpoints.createCareRequest.initiate(
            mockCreateCareRequestDataPayload
          )
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('POST');
          expect(url).toEqual(`${stationURL}${CARE_REQUESTS_BASE_PATH}`);
        });
    });

    it('should return successful response with correct data', async () => {
      fetchMock.mockResponse(JSON.stringify(mockCareRequestResult));
      const store = setupTestStore();

      const action = await store.dispatch(
        unauthenticatedCareRequestsSlice.endpoints.createCareRequest.initiate(
          mockCreateCareRequestDataPayload
        )
      );
      testApiUpdateSuccessResponse(action, mockCareRequestResult);
    });

    it('should return unsuccessful response if error is thrown', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        unauthenticatedCareRequestsSlice.endpoints.createCareRequest.initiate(
          mockCreateCareRequestDataPayload
        )
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });
});

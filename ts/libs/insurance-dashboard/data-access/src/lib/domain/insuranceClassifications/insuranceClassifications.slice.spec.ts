import {
  testApiUpdateErrorResponse,
  testApiUpdateSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  insuranceClassificationsSlice,
  INSURANCE_CLASSIFICATIONS_API_PATH,
} from './insuranceClassifications.slice';
import { mockedInsuranceClassifications } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

describe('insuranceClassification.slice', () => {
  describe('getInsuranceClassifications', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          insuranceClassifications: mockedInsuranceClassifications,
        })
      );
      const store = setupTestStore();
      await store
        .dispatch(
          insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
        )
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(
            `${serviceURL}${INSURANCE_CLASSIFICATIONS_API_PATH}`
          );
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({
          insuranceClassifications: mockedInsuranceClassifications,
        })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );
      testApiUpdateSuccessResponse(action, mockedInsuranceClassifications);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );
      testApiUpdateErrorResponse(action, 'Failed');
    });
  });
});

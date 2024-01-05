import { setupTestStore } from '../../../testUtils';
import {
  insuranceClassificationsSlice,
  INSURANCE_CLASSIFICATIONS_BASE_PATH,
  selectInsuranceClassifications,
} from './insuranceClassifications.slice';
import { mockedInsuranceClassification } from './mocks';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('insuranceClassifications.slice', () => {
  describe('getInsuranceClassifications', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${INSURANCE_CLASSIFICATIONS_BASE_PATH}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedInsuranceClassification]));
      const store = setupTestStore();

      const action = await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );
      testApiSuccessResponse(action, [mockedInsuranceClassification]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select insurance classifications from store', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedInsuranceClassification]));
      const store = setupTestStore();
      await store.dispatch(
        insuranceClassificationsSlice.endpoints.getInsuranceClassifications.initiate()
      );

      const { data: insuranceClassificationsFromStore } =
        selectInsuranceClassifications(store.getState());
      expect(insuranceClassificationsFromStore).toEqual([
        mockedInsuranceClassification,
      ]);
    });
  });
});

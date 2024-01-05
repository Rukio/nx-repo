import { setupTestStore } from '../../../testUtils';
import { MARKETS_BASE_PATH } from '../markets';
import {
  insurancePlansSlice,
  INSURANCE_PLANS_BASE_PATH,
  INSURANCE_PLANS_SEARCH_SEGMENT,
  selectInsurancePlans,
  SearchInsurancePlansQuery,
} from './insurancePlans.slice';
import { mockedInsurancePlan } from './mocks';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

const mockedQuery: SearchInsurancePlansQuery = {
  marketId: 1,
  search: 'test',
  classificationId: 1,
};

describe('insurancePlans.slice', () => {
  describe('getInsurancePlans', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        insurancePlansSlice.endpoints.getInsurancePlans.initiate(mockedQuery)
      );
      expect(fetchMock).toBeCalledTimes(1);

      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${MARKETS_BASE_PATH}/${mockedQuery.marketId}${INSURANCE_PLANS_BASE_PATH}${INSURANCE_PLANS_SEARCH_SEGMENT}?search=${mockedQuery.search}&classification_id=${mockedQuery.classificationId}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedInsurancePlan]));
      const store = setupTestStore();

      const action = await store.dispatch(
        insurancePlansSlice.endpoints.getInsurancePlans.initiate(mockedQuery)
      );
      testApiSuccessResponse(action, [mockedInsurancePlan]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        insurancePlansSlice.endpoints.getInsurancePlans.initiate(mockedQuery)
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select insurance plans from store', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedInsurancePlan]));
      const store = setupTestStore();
      await store.dispatch(
        insurancePlansSlice.endpoints.getInsurancePlans.initiate(mockedQuery)
      );

      const { data: insurancePlansFromState } = selectInsurancePlans(
        mockedQuery
      )(store.getState());
      expect(insurancePlansFromState).toEqual([mockedInsurancePlan]);
    });
  });
});

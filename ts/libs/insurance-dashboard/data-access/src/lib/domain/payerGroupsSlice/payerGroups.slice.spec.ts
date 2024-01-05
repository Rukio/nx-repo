import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  payerGroupsSlice,
  PAYER_GROUPS_API_PATH,
  selectPayerGroups,
} from './payerGroups.slice';
import { mockedInsurancePayerGroups } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

describe('payerGroups.slice', () => {
  describe('getPayerGroups', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payerGroups: mockedInsurancePayerGroups })
      );
      const store = setupTestStore();
      await store
        .dispatch(payerGroupsSlice.endpoints.getPayerGroups.initiate())
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(`${serviceURL}${PAYER_GROUPS_API_PATH}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payerGroups: mockedInsurancePayerGroups })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        payerGroupsSlice.endpoints.getPayerGroups.initiate()
      );
      testApiSuccessResponse(action, mockedInsurancePayerGroups);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Payer does not exist.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        payerGroupsSlice.endpoints.getPayerGroups.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });

    it('should select payers from store', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ payerGroups: mockedInsurancePayerGroups })
      );
      const store = setupTestStore();
      await store.dispatch(
        payerGroupsSlice.endpoints.getPayerGroups.initiate()
      );

      const { data: payerGroupsFromState } = selectPayerGroups(
        store.getState()
      );
      expect(payerGroupsFromState).toEqual(mockedInsurancePayerGroups);
    });
  });
});

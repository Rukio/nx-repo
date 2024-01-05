import { setupTestStore } from '../../../testUtils';
import { mockStates } from './mocks';
import {
  statesSlice,
  domainSelectStates,
  buildStatesPath,
} from './states.slice';

import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { serviceURL } = environment;

describe('states.slice', () => {
  describe('getStates', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockStates }));
      const { store } = setupTestStore();

      await store.dispatch(statesSlice.endpoints.getStates.initiate());

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${buildStatesPath()}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockStates }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        statesSlice.endpoints.getStates.initiate()
      );
      testApiSuccessResponse(action, mockStates);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        statesSlice.endpoints.getStates.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  describe('selectors', () => {
    describe('selectStates', () => {
      it('should select state from store', async () => {
        fetchMock.mockResponse(JSON.stringify({ data: mockStates }));
        const { store } = setupTestStore();
        await store.dispatch(statesSlice.endpoints.getStates.initiate());

        const { data } = domainSelectStates(store.getState());
        expect(data).toEqual(mockStates);
      });
    });
  });
});

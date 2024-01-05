import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  statesSlice,
  STATES_API_PATH,
  domainSelectStates,
} from './states.slice';
import { mockedStates } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

describe('states.slice', () => {
  describe('getStates', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ states: mockedStates }));
      const store = setupTestStore();
      await store
        .dispatch(statesSlice.endpoints.getStates.initiate())
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(`${serviceURL}${STATES_API_PATH}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ states: mockedStates }));
      const store = setupTestStore();

      const action = await store.dispatch(
        statesSlice.endpoints.getStates.initiate()
      );
      testApiSuccessResponse(action, mockedStates);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'States do not exist.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        statesSlice.endpoints.getStates.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });

    it('should select states from store', async () => {
      fetchMock.mockResponse(JSON.stringify({ states: mockedStates }));
      const store = setupTestStore();
      await store.dispatch(statesSlice.endpoints.getStates.initiate());

      const { data: statesState } = domainSelectStates(store.getState());
      expect(statesState).toEqual(mockedStates);
    });
  });
});

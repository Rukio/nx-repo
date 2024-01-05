import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import {
  MODALITIES_API_PATH,
  buildModalitiesPath,
  modalitiesSlice,
  selectDomainModalities,
} from './modalities.slice';
import { setupTestStore } from '../../../testUtils';
import { mockedModalitiesList } from './mocks';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

describe('modalitiesSlice.slice', () => {
  describe('build api urls', () => {
    it('buildModalitiesPath build correct api url', () => {
      const path = buildModalitiesPath();

      expect(path).toEqual(`${MODALITIES_API_PATH}`);
    });
  });

  describe('getModalities', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ modalities: mockedModalitiesList })
      );
      const store = setupTestStore();

      await store.dispatch(modalitiesSlice.endpoints.getModalities.initiate());

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(serviceURL + buildModalitiesPath());
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ modalities: mockedModalitiesList })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalities.initiate()
      );
      testApiSuccessResponse(action, mockedModalitiesList);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        modalitiesSlice.endpoints.getModalities.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });
  });

  it('should select modalities from store', async () => {
    fetchMock.mockResponse(
      JSON.stringify({ modalities: mockedModalitiesList })
    );
    const store = setupTestStore();
    await store.dispatch(modalitiesSlice.endpoints.getModalities.initiate());

    const { data: modalitiesState } = selectDomainModalities(store.getState());
    expect(modalitiesState).toEqual(mockedModalitiesList);
  });
});

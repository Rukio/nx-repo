import {
  testApiSuccessResponse,
  testApiErrorResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import { mockedServiceLine, mockedServiceLinesList } from './mocks';
import { environment } from '../../../environments/environment';
import {
  SERVICE_LINES_API_PATH,
  domainSelectServiceLines,
  serviceLinesSlice,
} from './serviceLines.slice';

const { serviceURL } = environment;

describe('serviceLines.slice', () => {
  describe('getServiceLines', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ serviceLines: [mockedServiceLine] })
      );
      const store = setupTestStore();
      await store
        .dispatch(serviceLinesSlice.endpoints.getServiceLines.initiate())
        .then(() => {
          expect(fetchMock).toBeCalledTimes(1);
          const { method, url } = fetchMock.mock.calls[0][0] as Request;

          expect(method).toEqual('GET');
          expect(url).toEqual(`${serviceURL}${SERVICE_LINES_API_PATH}`);
        });
    });

    it('successful response', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ serviceLines: [mockedServiceLine] })
      );
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      testApiSuccessResponse(action, [mockedServiceLine]);
    });

    it('unsuccessful response', async () => {
      const errorMessage = 'Invalid syntax.';
      fetchMock.mockReject(new Error(errorMessage));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      testApiErrorResponse(action, errorMessage);
    });

    it('should select serviceLines from store', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ serviceLines: mockedServiceLinesList })
      );
      const store = setupTestStore();
      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );

      const { data: serviceLinesState } = domainSelectServiceLines(
        store.getState()
      );
      expect(serviceLinesState).toEqual(mockedServiceLinesList);
    });
  });
});

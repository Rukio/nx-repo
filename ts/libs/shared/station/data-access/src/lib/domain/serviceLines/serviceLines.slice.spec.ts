import { setupTestStore } from '../../../testUtils';
import {
  serviceLinesSlice,
  SERVICE_LINES_BASE_PATH,
  selectServiceLine,
  selectServiceLines,
} from './serviceLines.slice';
import { mockedServiceLine, mockedServiceLinesList } from './mocks';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('serviceLines.slice', () => {
  describe('getServiceLines', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${stationURL}${SERVICE_LINES_BASE_PATH}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedServiceLinesList));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      testApiSuccessResponse(action, mockedServiceLinesList);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select service lines from store', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedServiceLinesList));
      const store = setupTestStore();

      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLines.initiate()
      );
      const { data: serviceLines } = selectServiceLines(store.getState());
      expect(serviceLines).toEqual(mockedServiceLinesList);
    });
  });

  describe('getServiceLine', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLine.initiate(1)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${stationURL}${SERVICE_LINES_BASE_PATH}/1`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedServiceLine));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLine.initiate(1)
      );
      testApiSuccessResponse(action, mockedServiceLine);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLine.initiate(1)
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select service line from store', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedServiceLine));
      const store = setupTestStore();

      await store.dispatch(
        serviceLinesSlice.endpoints.getServiceLine.initiate(
          mockedServiceLine.id
        )
      );
      const { data: serviceLine } = selectServiceLine(mockedServiceLine.id)(
        store.getState()
      );
      expect(serviceLine).toEqual(mockedServiceLine);
    });
  });
});

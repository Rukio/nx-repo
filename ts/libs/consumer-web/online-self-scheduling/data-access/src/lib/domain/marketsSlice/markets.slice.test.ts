import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';
import { setupTestStore } from '../../../testUtils';
import {
  marketsSlice,
  buildMarketPath,
  MARKETS_API_PATH,
  domainSelectMarket,
} from './markets.slice';
import { environment } from '../../../environments/environment';
import { mockMarket } from './mocks';

const { serviceURL } = environment;

describe('marketsSlice.slice', () => {
  describe('getMarket', () => {
    it('should make correct API call', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockMarket }));
      const { store } = setupTestStore();

      await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockMarket.id)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${serviceURL}${buildMarketPath(mockMarket.id)}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockMarket }));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockMarket.id)
      );
      testApiSuccessResponse(action, mockMarket);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const { store } = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockMarket.id)
      );

      testApiErrorResponse(action, 'Failed');
    });

    it('should select market details from store', async () => {
      fetchMock.mockResponse(JSON.stringify({ data: mockMarket }));
      const { store } = setupTestStore();

      await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockMarket.id)
      );

      const { data: marketDetailsFromState } = domainSelectMarket(
        mockMarket.id
      )(store.getState());
      expect(marketDetailsFromState).toEqual(mockMarket);
    });
  });

  describe('url builders', () => {
    it('buildMarketPath - should build correct path', () => {
      expect(buildMarketPath(mockMarket.id)).toEqual(
        `${MARKETS_API_PATH}/${mockMarket.id}`
      );
    });
  });
});

import { setupTestStore } from '../../../testUtils';
import {
  marketsSlice,
  MARKETS_BASE_PATH,
  selectMarkets,
  selectMarket,
} from './markets.slice';
import { mockedMarket } from './mocks';
import { environment } from '../../../environments/environment';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('markets.slice', () => {
  describe('getMarkets', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(marketsSlice.endpoints.getMarkets.initiate());
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(`${stationURL}${MARKETS_BASE_PATH}`);
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedMarket]));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarkets.initiate()
      );
      testApiSuccessResponse(action, [mockedMarket]);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarkets.initiate()
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select markets from store', async () => {
      fetchMock.mockResponse(JSON.stringify([mockedMarket]));
      const store = setupTestStore();
      await store.dispatch(marketsSlice.endpoints.getMarkets.initiate());

      const { data: marketsFromState } = selectMarkets(store.getState());
      expect(marketsFromState).toEqual([mockedMarket]);
    });
  });

  describe('getMarket', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockedMarket.id)
      );

      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${MARKETS_BASE_PATH}/${mockedMarket.id}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedMarket));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockedMarket.id)
      );
      testApiSuccessResponse(action, mockedMarket);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockedMarket.id)
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select market details from store', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedMarket));
      const store = setupTestStore();
      await store.dispatch(
        marketsSlice.endpoints.getMarket.initiate(mockedMarket.id)
      );
      const { data: marketDetails } = selectMarket(mockedMarket.id)(
        store.getState()
      );
      expect(marketDetails).toEqual(mockedMarket);
    });
  });
});

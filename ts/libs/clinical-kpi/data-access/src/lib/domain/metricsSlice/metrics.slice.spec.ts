import fetchMock from 'jest-fetch-mock';
import {
  metricsSlice,
  selectLatestMetricsByMarket,
  selectLatestMetricsForProvider,
  METRICS_PROVIDERS_API_PATH,
  METRICS_MARKETS_API_PATH,
} from './metrics.slice';
import { mockedProviderMetrics, mockedMarketMetrics } from './mocks';
import {
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
  ERROR_MESSAGE,
} from '../../../testUtils';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;

const providerId = 1;
const marketId = 1;

describe('metrics slice', () => {
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('GetLatestMetricsForProvider', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(
        JSON.stringify({ metrics: mockedProviderMetrics })
      );
      const store = setupTestStore();

      const { data: dataBefore } = selectLatestMetricsForProvider(providerId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        metricsSlice.endpoints.getLatestMetricsForProvider.initiate(providerId)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${METRICS_PROVIDERS_API_PATH}/${providerId}`
      );

      testApiSuccessResponse(action, mockedProviderMetrics);

      const { data: dataAfter } = selectLatestMetricsForProvider(providerId)(
        store.getState()
      );
      expect(dataAfter).toEqual(mockedProviderMetrics);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        metricsSlice.endpoints.getLatestMetricsForProvider.initiate(providerId)
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });

  describe('GetLatestMetricsByMarket', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(JSON.stringify(mockedMarketMetrics));
      const store = setupTestStore();

      const { data: dataBefore } = selectLatestMetricsByMarket(marketId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        metricsSlice.endpoints.getLatestMetricsByMarket.initiate(marketId)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${serviceURL}${METRICS_MARKETS_API_PATH}/${marketId}`
      );

      testApiSuccessResponse(action, mockedMarketMetrics);

      const { data: dataAfter } = selectLatestMetricsByMarket(marketId)(
        store.getState()
      );
      expect(dataAfter).toEqual(mockedMarketMetrics);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const actionMarket = await store.dispatch(
        metricsSlice.endpoints.getLatestMetricsByMarket.initiate(marketId)
      );
      testApiErrorResponse(actionMarket, ERROR_MESSAGE);
    });
  });
});

import fetchMock from 'jest-fetch-mock';
import {
  marketProviderMetricsSlice,
  selectDomainMarketProviderMetrics,
} from './marketProviderMetricsSlice.slice';
import {
  ERROR_MESSAGE,
  setupFetchMocks,
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
} from '../../../testUtils';
import {
  MOCK_MARKET_PROVIDERS_PARAMS,
  MOCK_PROVIDER_METRICS_RESPONSE,
  LEADS_MARKET_PROVIDER_METRICS,
  MOCK_PROVIDER_LEADER_HUB_METRICS_PARAMS,
  MOCK_PROVIDER_LEADER_HUB_METRICS_RESPONSE,
} from './mock';

describe('marketProviderMetrics slice', () => {
  setupFetchMocks();

  describe('GetMarketProviderMetrics', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(JSON.stringify(MOCK_PROVIDER_METRICS_RESPONSE));
      const store = setupTestStore();

      const { data: dataBefore } = selectDomainMarketProviderMetrics(
        MOCK_MARKET_PROVIDERS_PARAMS
      )(store.getState());
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        marketProviderMetricsSlice.endpoints.getMarketProviderMetrics.initiate(
          MOCK_MARKET_PROVIDERS_PARAMS
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');

      testApiSuccessResponse(action, MOCK_PROVIDER_METRICS_RESPONSE);

      const { data: dataAfter } = selectDomainMarketProviderMetrics(
        MOCK_MARKET_PROVIDERS_PARAMS
      )(store.getState());
      expect(dataAfter).toEqual(MOCK_PROVIDER_METRICS_RESPONSE);
    });
  });

  describe('GetProviderLeaderHubMetrics', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(
        JSON.stringify(MOCK_PROVIDER_LEADER_HUB_METRICS_RESPONSE)
      );
      const store = setupTestStore();
      const { data: dataBefore } =
        marketProviderMetricsSlice.endpoints.getProviderLeaderHubMetrics.select(
          MOCK_PROVIDER_LEADER_HUB_METRICS_PARAMS
        )(store.getState());
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        marketProviderMetricsSlice.endpoints.getProviderLeaderHubMetrics.initiate(
          MOCK_PROVIDER_LEADER_HUB_METRICS_PARAMS
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');

      testApiSuccessResponse(action, LEADS_MARKET_PROVIDER_METRICS);

      const { data: dataAfter } = action;

      expect(dataAfter).toEqual(LEADS_MARKET_PROVIDER_METRICS);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketProviderMetricsSlice.endpoints.getProviderLeaderHubMetrics.initiate(
          MOCK_PROVIDER_LEADER_HUB_METRICS_PARAMS
        )
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });
});

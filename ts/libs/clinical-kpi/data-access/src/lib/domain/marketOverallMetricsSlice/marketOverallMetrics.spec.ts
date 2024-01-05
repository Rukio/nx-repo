import fetchMock from 'jest-fetch-mock';
import { marketOverallMetricsSlice } from './marketOverallMetrics.slice';
import {
  ERROR_MESSAGE,
  setupFetchMocks,
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
} from '../../../testUtils';
import {
  MOCK_LEADER_HUB_METRICS_RESPONSE,
  MARKET_ID,
  MARKET_METRICS,
} from './mocks';

describe('metricsLeaderHub slice', () => {
  setupFetchMocks();

  describe('GetLeaderHubMetrics', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(JSON.stringify(MOCK_LEADER_HUB_METRICS_RESPONSE));
      const store = setupTestStore();

      const { data: dataBefore } =
        marketOverallMetricsSlice.endpoints.getMarketLeaderHubMetrics.select(
          MARKET_ID
        )(store.getState());
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        marketOverallMetricsSlice.endpoints.getMarketLeaderHubMetrics.initiate(
          MARKET_ID
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');

      testApiSuccessResponse(action, MARKET_METRICS);

      const { data: dataAfter } = action;

      expect(dataAfter).toEqual(MARKET_METRICS);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        marketOverallMetricsSlice.endpoints.getMarketLeaderHubMetrics.initiate(
          MARKET_ID
        )
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });
});

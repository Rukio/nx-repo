import fetchMock from 'jest-fetch-mock';
import {
  ERROR_MESSAGE,
  setupFetchMocks,
  setupTestStore,
  testApiErrorResponse,
  testApiSuccessResponse,
} from '../../../testUtils';
import { MOCK_PROVIDER_MARKETS, MOCK_PROVIDER_MARKETS_RESPONSE } from './mocks';
import {
  providerMarketsSlice,
  selectDomainProviderMarkets,
} from './providerMarketsSlice.slice';

const providerId = '116600';

describe('providerMarkets slice', () => {
  setupFetchMocks();

  describe('GetProviderMarkets', () => {
    it('successful API call and selectors have correct state', async () => {
      fetchMock.mockResponse(JSON.stringify(MOCK_PROVIDER_MARKETS_RESPONSE));
      const store = setupTestStore();

      const { data: dataBefore } = selectDomainProviderMarkets(providerId)(
        store.getState()
      );
      expect(dataBefore).toEqual(undefined);

      const action = await store.dispatch(
        providerMarketsSlice.endpoints.getProviderMarkets.initiate(providerId)
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method } = fetchMock.mock.calls[0][0] as Request;
      expect(method).toEqual('GET');

      testApiSuccessResponse(action, MOCK_PROVIDER_MARKETS);

      const { data: dataAfter } = selectDomainProviderMarkets(providerId)(
        store.getState()
      );
      expect(dataAfter).toEqual(MOCK_PROVIDER_MARKETS);
    });

    it('unsuccessful API call', async () => {
      fetchMock.mockReject(new Error(ERROR_MESSAGE));
      const store = setupTestStore();

      const action = await store.dispatch(
        providerMarketsSlice.endpoints.getProviderMarkets.initiate(providerId)
      );
      testApiErrorResponse(action, ERROR_MESSAGE);
    });
  });
});

import mapper from '../market.mapper';
import {
  MOCK_MARKET_FETCH_RESPONSE,
  MOCK_STATION_MARKET_FETCH,
} from './mocks/market.mock';

describe('Market mapper tests', () => {
  describe(`${mapper.StationMarketToMarket.name}`, () => {
    it('transform station Market into AOB Market', async () => {
      const transformedResult = mapper.StationMarketToMarket(
        MOCK_STATION_MARKET_FETCH
      );
      expect(transformedResult).toEqual(MOCK_MARKET_FETCH_RESPONSE);
    });

    it('transform station Market into AOB Market without dispatcher line', async () => {
      const mockStationMarketFetch = {
        ...MOCK_STATION_MARKET_FETCH,
        state_locale: {
          ...MOCK_STATION_MARKET_FETCH.state_locale,
          dispatcher_line: null,
        },
      };

      const mockMarketFetchResponse = {
        ...MOCK_MARKET_FETCH_RESPONSE,
        stateLocale: {
          ...MOCK_MARKET_FETCH_RESPONSE.stateLocale,
          dispatcherLine: null,
        },
      };

      const transformedResult = mapper.StationMarketToMarket(
        mockStationMarketFetch
      );
      expect(transformedResult).toEqual(mockMarketFetchResponse);
    });
  });
});

import {
  marketsSlice,
  mockZipCodeDetails,
  mockZipCodeDetailsQuery,
  zipCodesSlice,
  mockedMarket as mockMarketDetails,
} from '@*company-data-covered*/station/data-access';
import { setupTestStore } from '../../../testUtils';
import { toMarketDetails, toZipCodeDetails } from '../../utils';
import { selectMarketDetails, selectZipCodeDetails } from './market.slice';

describe('market.slice', () => {
  describe('domain feature selectors', () => {
    it('should select transformed zip code details', async () => {
      fetchMock.mockResponse(JSON.stringify(mockZipCodeDetails));
      const store = setupTestStore();

      await store.dispatch(
        zipCodesSlice.endpoints.getZipCodeDetails.initiate(
          mockZipCodeDetailsQuery
        )
      );

      const data = selectZipCodeDetails(mockZipCodeDetailsQuery)(
        store.getState()
      );
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        zipCodeDetails: toZipCodeDetails(mockZipCodeDetails),
      });
    });

    it('should select transformed market details', async () => {
      fetchMock.mockResponse(JSON.stringify(mockMarketDetails));
      const store = setupTestStore();

      await store.dispatch(marketsSlice.endpoints.getMarket.initiate(1));

      const data = selectMarketDetails(1)(store.getState());
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        marketDetails: toMarketDetails(mockMarketDetails),
      });
    });
  });
});

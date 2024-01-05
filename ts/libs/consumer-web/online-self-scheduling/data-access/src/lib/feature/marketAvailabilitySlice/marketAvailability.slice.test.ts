import {
  marketsAvailabilitySlice,
  mockMarketsAvailabilityZipCode,
  mockMarketsAvailabilityZipCodeQuery,
} from '../../domain';
import { setupTestStore } from '../../../testUtils';
import {
  selectMarketAvailability,
  selectMarketAvailabilityDetails,
} from './marketAvailability.slice';

describe('marketAvailability.slice', () => {
  it('should select correct market availability if response is truthy', async () => {
    fetchMock.mockResponse(
      JSON.stringify({ data: mockMarketsAvailabilityZipCode })
    );
    const store = setupTestStore();

    await store.store.dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        mockMarketsAvailabilityZipCodeQuery
      )
    );

    const data = selectMarketAvailability(mockMarketsAvailabilityZipCodeQuery)(
      store.store.getState()
    );
    expect(data).toEqual({
      isMarketAvailabilityLoading: false,
      isMarketAvailabilityClosed: false,
      isMarketAvailabilityError: false,
      isMarketAvailabilityOpen: true,
    });
  });

  it('should select correct market availability if response is falsy', async () => {
    fetchMock.mockResponse(JSON.stringify({ data: null }));
    const store = setupTestStore();

    await store.store.dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        mockMarketsAvailabilityZipCodeQuery
      )
    );

    const data = selectMarketAvailability(mockMarketsAvailabilityZipCodeQuery)(
      store.store.getState()
    );
    expect(data).toEqual({
      isMarketAvailabilityLoading: false,
      isMarketAvailabilityClosed: true,
      isMarketAvailabilityError: false,
      isMarketAvailabilityOpen: false,
    });
  });

  it('should select correct market availability if response is unsuccessful', async () => {
    fetchMock.mockReject(new Error('Failed'));
    const store = setupTestStore();

    await store.store.dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        mockMarketsAvailabilityZipCodeQuery
      )
    );

    const data = selectMarketAvailability(mockMarketsAvailabilityZipCodeQuery)(
      store.store.getState()
    );
    expect(data).toEqual({
      isMarketAvailabilityLoading: false,
      isMarketAvailabilityClosed: false,
      isMarketAvailabilityError: true,
      isMarketAvailabilityOpen: false,
    });
  });

  it('should select correct market availability details if response is truthy', async () => {
    fetchMock.mockResponse(
      JSON.stringify({ data: mockMarketsAvailabilityZipCode })
    );
    const store = setupTestStore();

    await store.store.dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        mockMarketsAvailabilityZipCodeQuery
      )
    );

    const data = selectMarketAvailabilityDetails(
      mockMarketsAvailabilityZipCodeQuery
    )(store.store.getState());

    expect(data).toEqual({
      marketAvailabilityDetails: mockMarketsAvailabilityZipCode,
    });
  });

  it('should select correct market availability details if response is falsy', async () => {
    fetchMock.mockResponse(JSON.stringify({ data: null }));
    const store = setupTestStore();

    await store.store.dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        mockMarketsAvailabilityZipCodeQuery
      )
    );

    const data = selectMarketAvailabilityDetails(
      mockMarketsAvailabilityZipCodeQuery
    )(store.store.getState());

    expect(data).toEqual({
      marketAvailabilityDetails: null,
    });
  });
});

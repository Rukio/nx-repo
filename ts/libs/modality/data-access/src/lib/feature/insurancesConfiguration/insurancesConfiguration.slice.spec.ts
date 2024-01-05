import fetchMock from 'jest-fetch-mock';
import {
  mockedInsuranceClassification,
  mockedInsurancePlan,
  mockedMarket as domainMockedMarket,
  MARKETS_BASE_PATH,
  marketsSlice,
} from '@*company-data-covered*/station/data-access';
import {
  insurancesConfigurationSlice,
  INSURANCES_CONFIGURATION_KEY,
  InsurancesConfigurationState,
  initialInsurancesConfigurationState,
  setInsuranceClassification,
  setInsurancesCurrentPage,
  setInsurancesRowsPerPage,
  setMarket,
  selectSelectedInsuranceClassification,
  selectSelectedMarket,
  selectInsurancesCurrentPage,
  selectInsurancesRowsPerPage,
  selectInsurancePlans,
  setInsurancesSearch,
  selectInsurancesSearch,
  selectInsurancesSortOrder,
  selectInsurancesSortBy,
  setInsuranceSortBy,
  setInsuranceSortOrder,
  selectSortedInsurancePlans,
  SortBy,
  SortOrder,
} from './';
import {
  transformInsurancePlansList,
  transformDomainMarket,
  sortInsurancePlans,
} from '../../utils/mappers';
import { setupStore } from '../../testUtils';

const mockedMarket = transformDomainMarket(domainMockedMarket);

jest.mock('@*company-data-covered*/station/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/station/data-access'),
  selectInsurancePlans: jest.fn().mockImplementation(() => () => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: [mockedInsurancePlan],
    total: 1,
  })),
}));

const mockedState: {
  [INSURANCES_CONFIGURATION_KEY]: InsurancesConfigurationState;
} = {
  [INSURANCES_CONFIGURATION_KEY]: {
    ...initialInsurancesConfigurationState,
    selectedMarket: mockedMarket,
    selectedInsuranceClassification: mockedInsuranceClassification,
  },
};

describe('InsurancesConfiguration slice', () => {
  it('should initialize default reducer state', () => {
    const state = insurancesConfigurationSlice.reducer(undefined, {
      type: undefined,
    });

    expect(state).toEqual(initialInsurancesConfigurationState);
  });

  describe('reducers', () => {
    it('setInsuranceClassification should update the state', () => {
      const store = setupStore();
      const initialSelectedInsuranceClassification =
        selectSelectedInsuranceClassification(store.getState());

      expect(initialSelectedInsuranceClassification).toBeUndefined();

      store.dispatch(
        setInsuranceClassification({
          selectedInsuranceClassification: mockedInsuranceClassification,
        })
      );
      const updatedSelectedInsuranceClassification =
        selectSelectedInsuranceClassification(store.getState());

      expect(updatedSelectedInsuranceClassification).toEqual(
        mockedInsuranceClassification
      );
    });

    it('setMarket should update the state', () => {
      const store = setupStore();
      const initialSelectedMarket = selectSelectedMarket(store.getState());

      expect(initialSelectedMarket).toBeUndefined();

      store.dispatch(
        setMarket({
          selectedMarket: mockedMarket,
        })
      );
      const updatedSelectedMarket = selectSelectedMarket(store.getState());

      expect(updatedSelectedMarket).toEqual(mockedMarket);
    });

    it('setInsurancesCurrentPage should update the state', () => {
      const store = setupStore();
      const initialPage = selectInsurancesCurrentPage(store.getState());
      expect(initialPage).toEqual(
        initialInsurancesConfigurationState.currentPage
      );
      store.dispatch(setInsurancesCurrentPage({ currentPage: 1 }));
      const updatedPage = selectInsurancesCurrentPage(store.getState());
      expect(updatedPage).toEqual(1);
    });

    it('setInsurancesRowsPerPage should update the state', () => {
      const store = setupStore();
      const initialRowsPerPage = selectInsurancesRowsPerPage(store.getState());
      expect(initialRowsPerPage).toEqual(
        initialInsurancesConfigurationState.rowsPerPage
      );
      store.dispatch(setInsurancesRowsPerPage({ rowsPerPage: 20 }));
      const updatedRowsPerPage = selectInsurancesRowsPerPage(store.getState());
      expect(updatedRowsPerPage).toEqual(20);
    });

    it('setInsurancesSearch should update the state', () => {
      const store = setupStore();
      const initialSearch = selectInsurancesSearch(store.getState());
      expect(initialSearch).toEqual(initialInsurancesConfigurationState.search);
      store.dispatch(setInsurancesSearch({ search: 'test' }));
      const updatedSearch = selectInsurancesSearch(store.getState());
      expect(updatedSearch).toEqual('test');
    });

    it('setInsuranceSortBy should update the state', () => {
      const store = setupStore();
      const initialSortBy = selectInsurancesSortBy(store.getState());
      expect(initialSortBy).toEqual(initialInsurancesConfigurationState.sortBy);
      store.dispatch(setInsuranceSortBy({ sortBy: SortBy.UPDATED_AT }));
      const updatedSortBy = selectInsurancesSortBy(store.getState());
      expect(updatedSortBy).toEqual(SortBy.UPDATED_AT);
    });

    it('setInsuranceSortOrder should update the state', () => {
      const store = setupStore();
      const initialSortOrder = selectInsurancesSortOrder(store.getState());
      expect(initialSortOrder).toEqual(
        initialInsurancesConfigurationState.sortOrder
      );
      store.dispatch(setInsuranceSortOrder({ sortOrder: SortOrder.DESC }));
      const updatedSortOrder = selectInsurancesSortOrder(store.getState());
      expect(updatedSortOrder).toEqual(SortOrder.DESC);
    });

    it('marketsSlice.endpoints.getMarkets.matchFulfilled, should set preselected market', async () => {
      fetchMock.mockResponse((req) => {
        if (req.url.includes(MARKETS_BASE_PATH)) {
          return Promise.resolve(JSON.stringify([domainMockedMarket]));
        }

        return Promise.resolve(JSON.stringify([]));
      });
      const store = setupStore();

      await store.dispatch(marketsSlice.endpoints.getMarkets.initiate());
      const selectedMarket = selectSelectedMarket(store.getState());
      expect(selectedMarket).toEqual(mockedMarket);
    });
  });

  describe('domain feature selectors', () => {
    it('should select all insurance plans', () => {
      const store = setupStore({ ...mockedState });
      const data = selectInsurancePlans({ marketId: 1 })(store.getState());
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        insurancePlans: transformInsurancePlansList([mockedInsurancePlan]),
      });
    });

    it('should select all insurance plans and sort', () => {
      const store = setupStore({ ...mockedState });
      const data = selectSortedInsurancePlans({ marketId: 1 })(
        store.getState()
      );
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        insurancePlans: sortInsurancePlans(
          transformInsurancePlansList([mockedInsurancePlan]),
          initialInsurancesConfigurationState.sortBy,
          initialInsurancesConfigurationState.sortOrder
        ),
        sortBy: initialInsurancesConfigurationState.sortBy,
        sortOrder: initialInsurancesConfigurationState.sortOrder,
      });
    });
  });
});

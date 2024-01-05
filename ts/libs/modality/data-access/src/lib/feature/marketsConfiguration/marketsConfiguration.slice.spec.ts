import {
  mockedMarket,
  mockedServiceLine as domainMockedServiceLine,
  mockedModalitiesList,
} from '@*company-data-covered*/station/data-access';
import {
  marketsConfigurationSlice,
  initialMarketsConfigurationState,
  selectSelectedServiceLine,
  MARKETS_CONFIGURATION_KEY,
  MarketsConfigurationState,
  setServiceLine,
  selectServiceLines,
  selectMarkets,
  setCurrentPage,
  setRowsPerPage,
  selectCurrentPage,
  selectRowsPerPage,
} from './';
import {
  transformMarketsList,
  transformServiceLinesList,
  transformDomainServiceLine,
} from '../../utils/mappers';
import { setupStore } from '../../testUtils';

const mockedServiceLine = transformDomainServiceLine(domainMockedServiceLine);

jest.mock('@*company-data-covered*/station/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/station/data-access'),
  selectServiceLines: jest.fn().mockImplementation(() => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: [domainMockedServiceLine],
    total: 1,
  })),
  selectMarkets: jest.fn().mockImplementation(() => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: [mockedMarket],
  })),
  selectModalities: jest.fn().mockImplementation(() => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: mockedModalitiesList,
  })),
}));

const mockedState: {
  [MARKETS_CONFIGURATION_KEY]: MarketsConfigurationState;
} = {
  [MARKETS_CONFIGURATION_KEY]: {
    ...initialMarketsConfigurationState,
    selectedServiceLine: mockedServiceLine,
  },
};

describe('MarketsConfiguration slice', () => {
  it('should initialize default reducer state', () => {
    const state = marketsConfigurationSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(initialMarketsConfigurationState);
  });

  describe('reducers', () => {
    it('setServiceLine should update the state', () => {
      const store = setupStore();
      const initialSelectedServiceLine = selectSelectedServiceLine(
        store.getState()
      );
      expect(initialSelectedServiceLine).toEqual(
        initialMarketsConfigurationState.selectedServiceLine
      );
      store.dispatch(
        setServiceLine({ selectedServiceLine: mockedServiceLine })
      );
      const updatedSelectedServiceLine = selectSelectedServiceLine(
        store.getState()
      );
      expect(updatedSelectedServiceLine).toEqual(mockedServiceLine);
    });

    it('setCurrentPage should update the state', () => {
      const store = setupStore();
      const initialPage = selectCurrentPage(store.getState());
      expect(initialPage).toEqual(initialMarketsConfigurationState.currentPage);
      store.dispatch(setCurrentPage({ currentPage: 1 }));
      const updatedPage = selectCurrentPage(store.getState());
      expect(updatedPage).toEqual(1);
    });

    it('setRowsPerPage should update the state', () => {
      const store = setupStore();
      const initialRowsPerPage = selectRowsPerPage(store.getState());
      expect(initialRowsPerPage).toEqual(
        initialMarketsConfigurationState.rowsPerPage
      );
      store.dispatch(setRowsPerPage({ rowsPerPage: 20 }));
      const updatedRowsperPage = selectRowsPerPage(store.getState());
      expect(updatedRowsperPage).toEqual(20);
    });
  });

  describe('domain feature selectors', () => {
    it('should select all service lines', () => {
      const store = setupStore({ ...mockedState });
      const data = selectServiceLines(store.getState());
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        serviceLines: transformServiceLinesList([domainMockedServiceLine]),
      });
    });

    it('should select all markets', () => {
      const store = setupStore({ ...mockedState });
      const data = selectMarkets(store.getState());
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        markets: transformMarketsList([mockedMarket]),
        total: 1,
      });
    });
  });
});

import fetchMock from 'jest-fetch-mock';
import {
  mockedInsuranceNetwork,
  mockedNetworksModalityConfigs,
  mockedMarket as domainMockedMarket,
  marketsSlice,
} from '@*company-data-covered*/station/data-access';
import {
  networksConfigurationSlice,
  NETWORKS_CONFIGURATION_KEY,
  NetworksConfigurationState,
  initialNetworksConfigurationState,
  setNetworksCurrentPage,
  selectNetworksConfigurationSearchParams,
  setNetworksRowsPerPage,
  setNetworksSearch,
  setNetworksSortBy,
  setNetworksSortOrder,
  NetworksSortBy,
  NetworksSortOrder,
  selectDisplayedNetworks,
  selectNetworksModalityConfigs,
  selectNetworksModalityConfigsHierarchy,
  setNetworksMarket,
  selectNetworksSelectedMarket,
} from './';
import {
  transformDomainNetworkModalityConfigs,
  buildNetworksModalityConfigsHierarchy,
  transformDomainInsuranceNetworksTo,
  transformDomainMarket,
} from '../../utils';
import { setupStore } from '../../testUtils';

const mockedMarket = transformDomainMarket(domainMockedMarket);

const mockedInsuranceNetworks = Array(15)
  .fill(mockedInsuranceNetwork)
  .map((network, index) => ({
    ...network,
    id: index,
    name: `Network ${index}`,
  }));

jest.mock('@*company-data-covered*/station/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/station/data-access'),
  selectInsuranceNetworks: jest.fn().mockImplementation(() => () => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: mockedInsuranceNetworks,
  })),
  selectNetworksModalityConfigs: jest.fn().mockImplementation(() => () => ({
    isError: false,
    isSuccess: true,
    isLoading: false,
    error: undefined,
    data: mockedNetworksModalityConfigs.configs,
  })),
}));

const mockedState: {
  [NETWORKS_CONFIGURATION_KEY]: NetworksConfigurationState;
} = {
  [NETWORKS_CONFIGURATION_KEY]: {
    ...initialNetworksConfigurationState,
    page: 1,
    rowsPerPage: 15,
    search: 'test',
    sortBy: NetworksSortBy.UPDATED_AT,
    sortOrder: NetworksSortOrder.DESC,
  },
};

describe('networksConfigurationSlice', () => {
  it('should initialize default reducer state', () => {
    const state = networksConfigurationSlice.reducer(undefined, {
      type: undefined,
    });

    expect(state).toEqual(initialNetworksConfigurationState);
  });

  describe('reducers', () => {
    it('setNetworksCurrentPage should update the state', () => {
      const store = setupStore();
      const { page: initialPage } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(initialPage).toEqual(initialNetworksConfigurationState.page);
      store.dispatch(setNetworksCurrentPage({ page: 1 }));
      const { page: updatedPage } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(updatedPage).toEqual(1);
    });

    it('setNetworksRowsPerPage should update the state', () => {
      const store = setupStore();
      const { rowsPerPage: initialRowsPerPage } =
        selectNetworksConfigurationSearchParams(store.getState());
      expect(initialRowsPerPage).toEqual(
        initialNetworksConfigurationState.rowsPerPage
      );
      store.dispatch(setNetworksRowsPerPage({ rowsPerPage: 20 }));
      const { rowsPerPage: updatedRowsPerPage } =
        selectNetworksConfigurationSearchParams(store.getState());
      expect(updatedRowsPerPage).toEqual(20);
    });

    it('setNetworksSearch should update the state', () => {
      const mockedSearch = 'test';
      const store = setupStore();
      const { search: initialSearch } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(initialSearch).toEqual(initialNetworksConfigurationState.search);
      store.dispatch(setNetworksSearch({ search: mockedSearch }));
      const { search: updatedSearch } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(updatedSearch).toEqual(mockedSearch);
    });

    it('setNetworksSortBy should update the state', () => {
      const store = setupStore();
      const { sortBy: initialSortBy } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(initialSortBy).toEqual(initialNetworksConfigurationState.sortBy);
      store.dispatch(setNetworksSortBy({ sortBy: NetworksSortBy.UPDATED_AT }));
      const { sortBy: updatedSortBy } = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(updatedSortBy).toEqual(NetworksSortBy.UPDATED_AT);
    });

    it('setNetworksSortOrder should update the state', () => {
      const store = setupStore();
      const { sortOrder: initialSortOrder } =
        selectNetworksConfigurationSearchParams(store.getState());
      expect(initialSortOrder).toEqual(
        initialNetworksConfigurationState.sortOrder
      );
      store.dispatch(
        setNetworksSortOrder({ sortOrder: NetworksSortOrder.DESC })
      );
      const { sortOrder: updatedSortOrder } =
        selectNetworksConfigurationSearchParams(store.getState());
      expect(updatedSortOrder).toEqual(NetworksSortOrder.DESC);
    });

    it('setNetworksMarket should update the state', () => {
      const store = setupStore();
      const initialSelectedMarket = selectNetworksSelectedMarket(
        store.getState()
      );

      expect(initialSelectedMarket).toBeUndefined();

      store.dispatch(
        setNetworksMarket({
          selectedMarket: mockedMarket,
        })
      );
      const updatedSelectedMarket = selectNetworksSelectedMarket(
        store.getState()
      );

      expect(updatedSelectedMarket).toEqual(mockedMarket);
    });

    it('marketsSlice.endpoints.getMarkets.matchFulfilled should set preselected market', async () => {
      fetchMock.mockResponse(JSON.stringify([domainMockedMarket]));
      const store = setupStore();

      await store.dispatch(marketsSlice.endpoints.getMarkets.initiate());
      const selectedMarket = selectNetworksSelectedMarket(store.getState());
      expect(selectedMarket).toEqual(mockedMarket);
    });
  });

  describe('selectors', () => {
    it('should select all networks search params', () => {
      const store = setupStore({ ...mockedState });

      const searchParams = selectNetworksConfigurationSearchParams(
        store.getState()
      );
      expect(searchParams).toEqual({
        page: mockedState[NETWORKS_CONFIGURATION_KEY].page,
        search: mockedState[NETWORKS_CONFIGURATION_KEY].search,
        rowsPerPage: mockedState[NETWORKS_CONFIGURATION_KEY].rowsPerPage,
        sortBy: mockedState[NETWORKS_CONFIGURATION_KEY].sortBy,
        sortOrder: mockedState[NETWORKS_CONFIGURATION_KEY].sortOrder,
      });
    });

    it('should select displayed networks', () => {
      const store = setupStore({
        [NETWORKS_CONFIGURATION_KEY]: {
          ...mockedState[NETWORKS_CONFIGURATION_KEY],
          page: 1,
          rowsPerPage: 10,
        },
      });

      const { networks, total } = selectDisplayedNetworks()(store.getState());
      expect(networks).toEqual(
        transformDomainInsuranceNetworksTo(mockedInsuranceNetworks.slice(10))
      );
      expect(total).toEqual(mockedInsuranceNetworks.length);
    });

    it('should select networks modality configs', () => {
      const store = setupStore();

      const configs = selectNetworksModalityConfigs({})(store.getState());
      expect(configs).toEqual(
        transformDomainNetworkModalityConfigs(
          mockedNetworksModalityConfigs.configs
        )
      );
    });

    it('should select and build networks networks modality configs hierarchy', () => {
      const store = setupStore();

      const configsHierarchy = selectNetworksModalityConfigsHierarchy({})(
        store.getState()
      );
      expect(configsHierarchy).toEqual(
        buildNetworksModalityConfigsHierarchy(
          transformDomainNetworkModalityConfigs(
            mockedNetworksModalityConfigs.configs
          )
        )
      );
    });
  });
});

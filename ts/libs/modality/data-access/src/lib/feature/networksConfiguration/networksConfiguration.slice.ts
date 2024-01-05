import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  selectInsuranceNetworks as domainSelectInsuranceNetworks,
  selectNetworksModalityConfigs as domainSelectNetworksModalityConfigs,
  marketsSlice,
  useGetNetworksModalityConfigsQuery,
  useSearchInsuranceNetworksQuery,
} from '@*company-data-covered*/station/data-access';
import {
  NetworksConfigurationState,
  NetworksSearchParams,
  NetworksSortOrder,
  NetworksSortBy,
  GetNetworksModalityConfigsQuery,
} from './types';
import {
  transformNetworksSearchParamsToDomain,
  buildPaginatedInsuranceNetworks,
  transformDomainInsuranceNetworksTo,
  filterInsuranceNetworksByMarket,
  transformDomainNetworkModalityConfigs,
  transformNetworksModalityConfigsQueryTo,
  buildNetworksModalityConfigsHierarchy,
  transformMarketsList,
  sortMarketsList,
} from '../../utils';

export const NETWORKS_CONFIGURATION_KEY = 'networksConfiguration';

type RootState = unknown & {
  [NETWORKS_CONFIGURATION_KEY]: NetworksConfigurationState;
};

export const initialNetworksConfigurationState: NetworksConfigurationState = {
  page: 0,
  rowsPerPage: 10,
  search: '',
  sortOrder: NetworksSortOrder.ASC,
  sortBy: NetworksSortBy.NAME,
};

export const networksConfigurationSlice = createSlice({
  name: NETWORKS_CONFIGURATION_KEY,
  initialState: initialNetworksConfigurationState,
  reducers: {
    setNetworksCurrentPage(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'page'>>
    ) {
      state.page = action.payload.page;
    },
    setNetworksRowsPerPage(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'rowsPerPage'>>
    ) {
      state.rowsPerPage = action.payload.rowsPerPage;
    },
    setNetworksSearch(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'search'>>
    ) {
      state.search = action.payload.search;
    },
    setNetworksSortBy(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'sortBy'>>
    ) {
      state.sortBy = action.payload.sortBy;
    },
    setNetworksSortOrder(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'sortOrder'>>
    ) {
      state.sortOrder = action.payload.sortOrder;
    },
    setNetworksMarket(
      state,
      action: PayloadAction<Pick<NetworksConfigurationState, 'selectedMarket'>>
    ) {
      state.selectedMarket = action.payload.selectedMarket;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      marketsSlice.endpoints.getMarkets.matchFulfilled,
      (state, action) => {
        const preselectedMarket = sortMarketsList(
          transformMarketsList(action.payload)
        )[0];

        state.selectedMarket = preselectedMarket;
      }
    );
  },
});

const selectNetworksConfigurationState = (state: RootState) =>
  state[NETWORKS_CONFIGURATION_KEY];

export const selectNetworksConfigurationSearchParams = createSelector(
  selectNetworksConfigurationState,
  ({ page, search, rowsPerPage, sortOrder, sortBy }): NetworksSearchParams => ({
    page,
    search,
    rowsPerPage,
    sortOrder,
    sortBy,
  })
);

export const selectNetworksSelectedMarket = createSelector(
  selectNetworksConfigurationState,
  ({ selectedMarket }) => selectedMarket
);

export const selectDisplayedNetworks = (query?: NetworksSearchParams) =>
  createSelector(
    [
      domainSelectInsuranceNetworks(
        query ? transformNetworksSearchParamsToDomain(query) : undefined
      ),
      selectNetworksConfigurationState,
    ],
    ({ data: networks }, { rowsPerPage, page, selectedMarket }) => {
      const transformedNetworks = transformDomainInsuranceNetworksTo(networks);
      const filteredNetworks = filterInsuranceNetworksByMarket(
        transformedNetworks,
        selectedMarket
      );

      return buildPaginatedInsuranceNetworks({
        networks: filteredNetworks,
        rowsPerPage,
        page,
      });
    }
  );

export const selectNetworksModalityConfigs = (
  params: GetNetworksModalityConfigsQuery
) =>
  createSelector(
    domainSelectNetworksModalityConfigs(
      transformNetworksModalityConfigsQueryTo(params)
    ),
    ({ data: configs }) => transformDomainNetworkModalityConfigs(configs)
  );

export const selectNetworksModalityConfigsHierarchy = (
  params: GetNetworksModalityConfigsQuery
) =>
  createSelector(selectNetworksModalityConfigs(params), (configs) =>
    buildNetworksModalityConfigsHierarchy(configs)
  );

export { useGetNetworksModalityConfigsQuery, useSearchInsuranceNetworksQuery };

export const {
  setNetworksCurrentPage,
  setNetworksRowsPerPage,
  setNetworksSearch,
  setNetworksSortBy,
  setNetworksSortOrder,
  setNetworksMarket,
} = networksConfigurationSlice.actions;

import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  selectInsuranceClassifications,
  useGetInsuranceClassificationsQuery,
  useLazyGetInsuranceClassificationsQuery,
  selectInsurancePlans as domainSelectInsurancePlans,
  useGetInsurancePlansQuery,
  useLazyGetInsurancePlansQuery,
  SelectSearchInsurancePlansQuery,
  marketsSlice,
} from '@*company-data-covered*/station/data-access';
import { InsurancesConfigurationState, SortBy, SortOrder } from './types';
import {
  transformInsurancePlansList,
  sortInsurancePlans,
  transformMarketsList,
  sortMarketsList,
} from '../../utils';

export const INSURANCES_CONFIGURATION_KEY = 'insurancesConfiguration';

type RootState = unknown & {
  [INSURANCES_CONFIGURATION_KEY]: InsurancesConfigurationState;
};

export const initialInsurancesConfigurationState: InsurancesConfigurationState =
  {
    currentPage: 0,
    rowsPerPage: 10,
    search: '',
    sortOrder: SortOrder.ASC,
    sortBy: SortBy.NAME,
  };

export const insurancesConfigurationSlice = createSlice({
  name: INSURANCES_CONFIGURATION_KEY,
  initialState: initialInsurancesConfigurationState,
  reducers: {
    setInsuranceClassification(
      state,
      action: PayloadAction<
        Pick<InsurancesConfigurationState, 'selectedInsuranceClassification'>
      >
    ) {
      state.selectedInsuranceClassification =
        action.payload.selectedInsuranceClassification;
    },
    setMarket(
      state,
      action: PayloadAction<
        Pick<InsurancesConfigurationState, 'selectedMarket'>
      >
    ) {
      state.selectedMarket = action.payload.selectedMarket;
    },
    setInsurancesCurrentPage(
      state,
      action: PayloadAction<Pick<InsurancesConfigurationState, 'currentPage'>>
    ) {
      state.currentPage = action.payload.currentPage;
    },
    setInsurancesRowsPerPage(
      state,
      action: PayloadAction<Pick<InsurancesConfigurationState, 'rowsPerPage'>>
    ) {
      state.rowsPerPage = action.payload.rowsPerPage;
    },
    setInsurancesSearch(
      state,
      action: PayloadAction<Pick<InsurancesConfigurationState, 'search'>>
    ) {
      state.search = action.payload.search;
    },
    setInsuranceSortBy(
      state,
      action: PayloadAction<Pick<InsurancesConfigurationState, 'sortBy'>>
    ) {
      state.sortBy = action.payload.sortBy;
    },
    setInsuranceSortOrder(
      state,
      action: PayloadAction<Pick<InsurancesConfigurationState, 'sortOrder'>>
    ) {
      state.sortOrder = action.payload.sortOrder;
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

const selectInsurancesConfigurationState = (state: RootState) =>
  state[INSURANCES_CONFIGURATION_KEY];

export const selectSelectedInsuranceClassification = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) =>
    insurancesConfiguration.selectedInsuranceClassification
);

export const selectSelectedMarket = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.selectedMarket
);
export const selectInsurancePlans = (query: SelectSearchInsurancePlansQuery) =>
  createSelector(
    domainSelectInsurancePlans(query),
    ({ data, isLoading, isError, error, isSuccess }) => ({
      isLoading,
      isError,
      error,
      isSuccess,
      insurancePlans: transformInsurancePlansList(data),
    })
  );

export const selectInsurancesCurrentPage = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.currentPage
);

export const selectInsurancesRowsPerPage = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.rowsPerPage
);

export const selectInsurancesSearch = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.search
);

export const selectInsurancesSortOrder = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.sortOrder
);

export const selectInsurancesSortBy = createSelector(
  selectInsurancesConfigurationState,
  (insurancesConfiguration) => insurancesConfiguration.sortBy
);

export const selectSortedInsurancePlans = (
  query: SelectSearchInsurancePlansQuery
) =>
  createSelector(
    [
      selectInsurancePlans(query),
      selectInsurancesSortOrder,
      selectInsurancesSortBy,
    ],
    ({ insurancePlans, ...rest }, sortOrder, sortBy) => ({
      ...rest,
      sortBy,
      sortOrder,
      insurancePlans: sortInsurancePlans(insurancePlans, sortBy, sortOrder),
    })
  );

export const {
  setInsurancesCurrentPage,
  setInsuranceClassification,
  setMarket,
  setInsurancesRowsPerPage,
  setInsurancesSearch,
  setInsuranceSortBy,
  setInsuranceSortOrder,
} = insurancesConfigurationSlice.actions;

export {
  useGetInsurancePlansQuery,
  useLazyGetInsurancePlansQuery,
  useGetInsuranceClassificationsQuery,
  useLazyGetInsuranceClassificationsQuery,
  selectInsuranceClassifications,
};

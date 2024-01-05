import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  selectServiceLines as domainSelectServiceLines,
  useGetServiceLineQuery,
  useGetServiceLinesQuery,
  useLazyGetServiceLineQuery,
  useLazyGetServiceLinesQuery,
  useGetMarketQuery,
  useLazyGetMarketsQuery,
  useLazyGetMarketQuery,
  useGetMarketsQuery,
  useGetModalitiesQuery,
  useLazyGetModalitiesQuery,
  selectMarkets as domainSelectMarkets,
} from '@*company-data-covered*/station/data-access';
import { MarketsConfigurationState } from './types';
import {
  transformMarketsList,
  transformServiceLinesList,
  sortMarketsList,
} from '../../utils/mappers';

export const MARKETS_CONFIGURATION_KEY = 'marketsConfiguration';

type RootState = unknown & {
  [MARKETS_CONFIGURATION_KEY]: MarketsConfigurationState;
};

export const initialMarketsConfigurationState: MarketsConfigurationState = {
  currentPage: 0,
  rowsPerPage: 10,
};

export const marketsConfigurationSlice = createSlice({
  name: MARKETS_CONFIGURATION_KEY,
  initialState: initialMarketsConfigurationState,
  reducers: {
    setServiceLine(
      state,
      action: PayloadAction<
        Pick<MarketsConfigurationState, 'selectedServiceLine'>
      >
    ) {
      state.selectedServiceLine = action.payload.selectedServiceLine;
    },
    setCurrentPage(
      state,
      action: PayloadAction<Pick<MarketsConfigurationState, 'currentPage'>>
    ) {
      state.currentPage = action.payload.currentPage;
    },
    setRowsPerPage(
      state,
      action: PayloadAction<Pick<MarketsConfigurationState, 'rowsPerPage'>>
    ) {
      state.rowsPerPage = action.payload.rowsPerPage;
    },
  },
});

const selectMarketConfigurationState = (state: RootState) =>
  state[MARKETS_CONFIGURATION_KEY];

export const selectSelectedServiceLine = createSelector(
  selectMarketConfigurationState,
  (marketsConfiguration) => marketsConfiguration.selectedServiceLine
);

export const selectCurrentPage = createSelector(
  selectMarketConfigurationState,
  (marketsConfiguration) => marketsConfiguration.currentPage
);

export const selectRowsPerPage = createSelector(
  selectMarketConfigurationState,
  (marketsConfiguration) => marketsConfiguration.rowsPerPage
);

export const selectServiceLines = createSelector(
  domainSelectServiceLines,
  ({ isError, isLoading, error, data, isSuccess }) => ({
    isError,
    isLoading,
    error,
    isSuccess,
    serviceLines: transformServiceLinesList(data),
  })
);

export const selectMarkets = createSelector(
  domainSelectMarkets,
  ({ isError, isLoading, error, data, isSuccess }) => ({
    isError,
    isLoading,
    error,
    isSuccess,
    markets: sortMarketsList(transformMarketsList(data)),
    total: data?.length || 0,
  })
);

export const { setServiceLine, setCurrentPage, setRowsPerPage } =
  marketsConfigurationSlice.actions;

export {
  useGetServiceLineQuery,
  useGetServiceLinesQuery,
  useLazyGetServiceLineQuery,
  useLazyGetServiceLinesQuery,
  useGetMarketQuery,
  useLazyGetMarketsQuery,
  useLazyGetMarketQuery,
  useGetMarketsQuery,
  useGetModalitiesQuery,
  useLazyGetModalitiesQuery,
};

import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../store';

const DEFAULT_PAGE = 1;

export const PROVIDER_VISITS_TABLE_KEY = 'providerVisitsTable';

export interface ProviderVisitsTableState {
  page: number;
  searchText: string;
  isAbxPrescribed: boolean;
  isEscalated: boolean;
}

export const initialProviderVisitsTableState: ProviderVisitsTableState = {
  page: DEFAULT_PAGE,
  searchText: '',
  isAbxPrescribed: false,
  isEscalated: false,
};

export const providerVisitsTableSlice = createSlice({
  name: PROVIDER_VISITS_TABLE_KEY,
  initialState: initialProviderVisitsTableState,
  reducers: {
    setProviderVisitsPage(
      state,
      action: PayloadAction<Pick<ProviderVisitsTableState, 'page'>>
    ) {
      state.page = action.payload.page;
    },
    setProviderVisitsSearchText(
      state,
      action: PayloadAction<Pick<ProviderVisitsTableState, 'searchText'>>
    ) {
      state.searchText = action.payload.searchText;
      state.page = DEFAULT_PAGE;
    },
    setProviderVisitsIsAbxPrescribed(
      state,
      action: PayloadAction<Pick<ProviderVisitsTableState, 'isAbxPrescribed'>>
    ) {
      state.isAbxPrescribed = action.payload.isAbxPrescribed;
      state.page = DEFAULT_PAGE;
    },
    setProviderVisitsIsEscalated(
      state,
      action: PayloadAction<Pick<ProviderVisitsTableState, 'isEscalated'>>
    ) {
      state.isEscalated = action.payload.isEscalated;
      state.page = DEFAULT_PAGE;
    },
    resetProviderVisitsState(state) {
      Object.assign(state, initialProviderVisitsTableState);
    },
  },
});

const selectProviderVisitsState = (
  state: Pick<RootState, 'providerVisitsTable'>
) => state[PROVIDER_VISITS_TABLE_KEY];

export const selectProviderVisitsSearchFilters = createSelector(
  selectProviderVisitsState,
  ({ page, searchText, isAbxPrescribed, isEscalated }) => ({
    page,
    searchText,
    isAbxPrescribed,
    isEscalated,
  })
);

export const {
  setProviderVisitsPage,
  setProviderVisitsSearchText,
  setProviderVisitsIsAbxPrescribed,
  setProviderVisitsIsEscalated,
  resetProviderVisitsState,
} = providerVisitsTableSlice.actions;

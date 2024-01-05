import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export const DEFAULT_PAGE = 1;
export const PROVIDER_SHIFTS_KEY = 'providerShiftsTable';

export interface ProviderShiftsTableState {
  page: number;
  fromTimestamp: string | undefined;
}

export const initialProviderShiftsTableState: ProviderShiftsTableState = {
  page: DEFAULT_PAGE,
  fromTimestamp: undefined,
};

export const providerShiftsTableSlice = createSlice({
  name: PROVIDER_SHIFTS_KEY,
  initialState: initialProviderShiftsTableState,
  reducers: {
    setProviderShiftsPage(
      state,
      action: PayloadAction<Pick<ProviderShiftsTableState, 'page'>>
    ) {
      state.page = action.payload.page;
    },
    setProviderShiftsTimestamp(
      state,
      action: PayloadAction<Pick<ProviderShiftsTableState, 'fromTimestamp'>>
    ) {
      state.fromTimestamp = action.payload.fromTimestamp;
      state.page = DEFAULT_PAGE;
    },
  },
});

const selectProviderShiftsState = (
  state: Pick<RootState, 'providerShiftsTable'>
) => state[PROVIDER_SHIFTS_KEY];

export const selectProviderShiftsPage = createSelector(
  selectProviderShiftsState,
  ({ page }) => page
);

export const selectProviderShiftsTimestamp = createSelector(
  selectProviderShiftsState,
  ({ fromTimestamp }) => fromTimestamp
);

export const { setProviderShiftsPage, setProviderShiftsTimestamp } =
  providerShiftsTableSlice.actions;

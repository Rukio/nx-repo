import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { ProfilePosition } from '../../types';

export const INDIVIDUAL_PERFORMANCE_POSITION_KEY =
  'individualPerformancePosition';

export interface IndividualPerformancePositionState {
  position: ProfilePosition;
}

export const initialIndividualPerformancePositionState: IndividualPerformancePositionState =
  {
    position: ProfilePosition.App,
  };

export const individualPerformancePositionSlice = createSlice({
  name: INDIVIDUAL_PERFORMANCE_POSITION_KEY,
  initialState: initialIndividualPerformancePositionState,
  reducers: {
    setProviderPosition(state, action: PayloadAction<ProfilePosition>) {
      state.position = action.payload;
    },
  },
});

const selectIndividualPerformancePositionState = (
  state: Pick<RootState, 'individualPerformancePosition'>
) => state[INDIVIDUAL_PERFORMANCE_POSITION_KEY];

export const selectIndividualPerformancePosition = createSelector(
  selectIndividualPerformancePositionState,
  ({ position }) => position
);

export const { setProviderPosition } =
  individualPerformancePositionSlice.actions;

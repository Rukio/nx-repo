import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import {
  authSlice,
  peerRankingsSlice,
  providerShiftsTableSlice,
  providerVisitsTableSlice,
  careTeamRankingsSlice,
  individualPerformancePositionSlice,
} from '../feature';
import { clinicalKpiApiSlice } from '../domain';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [clinicalKpiApiSlice.reducerPath]: clinicalKpiApiSlice.reducer,
    [peerRankingsSlice.name]: peerRankingsSlice.reducer,
    [providerVisitsTableSlice.name]: providerVisitsTableSlice.reducer,
    [providerShiftsTableSlice.name]: providerShiftsTableSlice.reducer,
    [careTeamRankingsSlice.name]: careTeamRankingsSlice.reducer,
    [individualPerformancePositionSlice.name]:
      individualPerformancePositionSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(clinicalKpiApiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

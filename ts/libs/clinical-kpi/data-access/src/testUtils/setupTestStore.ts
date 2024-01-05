import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import {
  clinicalKpiApiSlice,
  metricsSlice,
  providerOverallMetricsSlice,
  marketOverallMetricsSlice,
  marketProviderMetricsSlice,
  providerVisitsSlice,
  userSlice,
  CARE_TEAM_RANKINGS_KEY,
  careTeamRankingsSlice,
  PEER_RANKINGS_KEY,
  peerRankingsSlice,
} from '../';
import {
  authSlice,
  AUTH_FEATURE_KEY,
  PROVIDER_VISITS_TABLE_KEY,
  providerVisitsTableSlice,
  PROVIDER_SHIFTS_KEY,
  providerShiftsTableSlice,
  INDIVIDUAL_PERFORMANCE_POSITION_KEY,
  individualPerformancePositionSlice,
} from '../lib/feature';
import { RootState } from '../lib/store/index';

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootState>['preloadedState']
) =>
  configureStore({
    reducer: combineReducers({
      [clinicalKpiApiSlice.reducerPath]: clinicalKpiApiSlice.reducer,
      [metricsSlice.reducerPath]: metricsSlice.reducer,
      [providerOverallMetricsSlice.reducerPath]:
        providerOverallMetricsSlice.reducer,
      [marketOverallMetricsSlice.reducerPath]:
        marketOverallMetricsSlice.reducer,
      [marketProviderMetricsSlice.reducerPath]:
        marketProviderMetricsSlice.reducer,
      [providerVisitsSlice.reducerPath]: providerVisitsSlice.reducer,
      [AUTH_FEATURE_KEY]: authSlice.reducer,
      [PROVIDER_VISITS_TABLE_KEY]: providerVisitsTableSlice.reducer,
      [PROVIDER_SHIFTS_KEY]: providerShiftsTableSlice.reducer,
      [PEER_RANKINGS_KEY]: peerRankingsSlice.reducer,
      [CARE_TEAM_RANKINGS_KEY]: careTeamRankingsSlice.reducer,
      [INDIVIDUAL_PERFORMANCE_POSITION_KEY]:
        individualPerformancePositionSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      })
        .concat(clinicalKpiApiSlice.middleware)
        .concat(userSlice.middleware)
        .concat(metricsSlice.middleware)
        .concat(providerOverallMetricsSlice.middleware)
        .concat(marketOverallMetricsSlice.middleware)
        .concat(marketProviderMetricsSlice.middleware)
        .concat(providerVisitsSlice.middleware),
    preloadedState: overrides,
  });

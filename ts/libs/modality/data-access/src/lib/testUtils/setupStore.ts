import { configureStore } from '@reduxjs/toolkit';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { stationApiSlice } from '@*company-data-covered*/station/data-access';
import {
  marketsConfigurationSlice,
  MARKETS_CONFIGURATION_KEY,
  insurancesConfigurationSlice,
  INSURANCES_CONFIGURATION_KEY,
  MODALITY_CONFIGURATIONS_KEY,
  modalityConfigurationsSlice,
  networksConfigurationSlice,
  NETWORKS_CONFIGURATION_KEY,
} from '../feature';
import { RootState } from '../store';

export const setupStore = (overrides?: Partial<RootState>) =>
  configureStore({
    reducer: {
      [AUTH_FEATURE_KEY]: authSlice.reducer,
      [stationApiSlice.reducerPath]: stationApiSlice.reducer,
      [MARKETS_CONFIGURATION_KEY]: marketsConfigurationSlice.reducer,
      [INSURANCES_CONFIGURATION_KEY]: insurancesConfigurationSlice.reducer,
      [MODALITY_CONFIGURATIONS_KEY]: modalityConfigurationsSlice.reducer,
      [NETWORKS_CONFIGURATION_KEY]: networksConfigurationSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(stationApiSlice.middleware),
    preloadedState: overrides,
  });

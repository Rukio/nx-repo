import { configureStore } from '@reduxjs/toolkit';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { stationApiSlice } from '@*company-data-covered*/station/data-access';
import { useDispatch } from 'react-redux';
import {
  marketsConfigurationSlice,
  MARKETS_CONFIGURATION_KEY,
  insurancesConfigurationSlice,
  INSURANCES_CONFIGURATION_KEY,
  modalityConfigurationsSlice,
  MODALITY_CONFIGURATIONS_KEY,
  networksConfigurationSlice,
  NETWORKS_CONFIGURATION_KEY,
} from './feature';

export const store = configureStore({
  reducer: {
    [AUTH_FEATURE_KEY]: authSlice.reducer,
    [stationApiSlice.reducerPath]: stationApiSlice.reducer,
    [MARKETS_CONFIGURATION_KEY]: marketsConfigurationSlice.reducer,
    [INSURANCES_CONFIGURATION_KEY]: insurancesConfigurationSlice.reducer,
    [MODALITY_CONFIGURATIONS_KEY]: modalityConfigurationsSlice.reducer,
    [NETWORKS_CONFIGURATION_KEY]: networksConfigurationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(stationApiSlice.middleware),
});

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

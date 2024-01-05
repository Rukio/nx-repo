import { stationApiSlice } from '@*company-data-covered*/station/data-access';
import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { RootState } from '../lib/store';
import { requestSlice, careRequestsConfigurationSlice } from '../lib/feature';

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootState>['preloadedState']
) =>
  configureStore({
    reducer: combineReducers({
      [stationApiSlice.reducerPath]: stationApiSlice.reducer,
      [careRequestsConfigurationSlice.name]:
        careRequestsConfigurationSlice.reducer,
      [requestSlice.name]: requestSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(stationApiSlice.middleware),
    preloadedState: overrides,
  });

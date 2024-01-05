import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { stationApiSlice } from '../';

export const setupTestStore = () =>
  configureStore({
    reducer: combineReducers({
      [AUTH_FEATURE_KEY]: authSlice.reducer,
      [stationApiSlice.reducerPath]: stationApiSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(stationApiSlice.middleware),
  });

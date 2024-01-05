import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { AUTH_FEATURE_KEY, authSlice } from '@*company-data-covered*/auth0/data-access';
import { RootState } from '../lib/store';
import { patientPortalApiSlice } from '../lib/domain';

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootState>['preloadedState']
) =>
  configureStore({
    reducer: combineReducers({
      [AUTH_FEATURE_KEY]: authSlice.reducer,
      [patientPortalApiSlice.reducerPath]: patientPortalApiSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(patientPortalApiSlice.middleware),
    preloadedState: overrides,
  });

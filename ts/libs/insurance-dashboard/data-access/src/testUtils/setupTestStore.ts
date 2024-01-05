import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import {
  insuranceDashboardApiSlice,
  managePayersSlice,
  notificationsSlice,
  manageNetworksSlice,
  manageNetworkModalitiesSlice,
} from '../';
import { RootState } from '../lib/store';

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootState>['preloadedState']
) =>
  configureStore({
    reducer: combineReducers({
      [authSlice.name]: authSlice.reducer,
      [insuranceDashboardApiSlice.reducerPath]:
        insuranceDashboardApiSlice.reducer,
      [managePayersSlice.name]: managePayersSlice.reducer,
      [notificationsSlice.name]: notificationsSlice.reducer,
      [manageNetworksSlice.name]: manageNetworksSlice.reducer,
      [manageNetworkModalitiesSlice.name]: manageNetworkModalitiesSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(insuranceDashboardApiSlice.middleware),
    preloadedState: overrides,
  });

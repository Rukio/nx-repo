import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { insuranceDashboardApiSlice } from './domain';
import {
  managePayersSlice,
  notificationsSlice,
  manageNetworksSlice,
  manageNetworkModalitiesSlice,
} from './feature';

export const store = configureStore({
  reducer: {
    [AUTH_FEATURE_KEY]: authSlice.reducer,
    [insuranceDashboardApiSlice.reducerPath]:
      insuranceDashboardApiSlice.reducer,
    [managePayersSlice.name]: managePayersSlice.reducer,
    [notificationsSlice.name]: notificationsSlice.reducer,
    [manageNetworksSlice.name]: manageNetworksSlice.reducer,
    [manageNetworkModalitiesSlice.name]: manageNetworkModalitiesSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(insuranceDashboardApiSlice.middleware),
});

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

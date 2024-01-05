import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { patientPortalApiSlice } from './domain';

export const store = configureStore({
  reducer: {
    [AUTH_FEATURE_KEY]: authSlice.reducer,
    [patientPortalApiSlice.reducerPath]: patientPortalApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(patientPortalApiSlice.middleware),
});

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

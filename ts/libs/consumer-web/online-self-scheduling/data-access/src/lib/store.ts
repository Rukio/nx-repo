import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import {
  PersistConfig,
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import hardSet from 'redux-persist/lib/stateReconciler/hardSet';
import storage from 'redux-persist/lib/storage';
import { onlineSelfSchedulingApiSlice } from './domain';
import {
  PreLoginState,
  preLoginSlice,
  manageSelfScheduleSlice,
  managePatientDemographicsSlice,
  manageInsurancesSlice,
  managePatientAddressSlice,
  ManageSelfScheduleState,
} from './feature';
import { manageConsentSlice } from './feature/manageConsentSlice/manageConsent.slice';

export const preLoginStatePersistConfig: PersistConfig<PreLoginState> = {
  key: preLoginSlice.name,
  storage,
  stateReconciler: hardSet,
};

export const manageSelfScheduleSlicePersistConfig: PersistConfig<ManageSelfScheduleState> =
  {
    key: manageSelfScheduleSlice.name,
    storage,
    stateReconciler: hardSet,
    whitelist: ['offboardReason'],
  };

export const store = configureStore({
  reducer: {
    [authSlice.name]: authSlice.reducer,
    [preLoginSlice.name]: persistReducer<PreLoginState>(
      preLoginStatePersistConfig,
      preLoginSlice.reducer
    ),
    [onlineSelfSchedulingApiSlice.reducerPath]:
      onlineSelfSchedulingApiSlice.reducer,
    [manageSelfScheduleSlice.name]: persistReducer<ManageSelfScheduleState>(
      manageSelfScheduleSlicePersistConfig,
      manageSelfScheduleSlice.reducer
    ),
    [managePatientDemographicsSlice.name]:
      managePatientDemographicsSlice.reducer,
    [manageInsurancesSlice.name]: manageInsurancesSlice.reducer,
    [managePatientAddressSlice.name]: managePatientAddressSlice.reducer,
    [manageConsentSlice.name]: manageConsentSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(onlineSelfSchedulingApiSlice.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default { store, persistor };

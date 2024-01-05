import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { preLoginStatePersistConfig, RootState } from '../lib/store';
import {
  managePatientDemographicsSlice,
  manageInsurancesSlice,
  manageSelfScheduleSlice,
  preLoginSlice,
  managePatientAddressSlice,
  PreLoginState,
  manageConsentSlice,
  ManageSelfScheduleState,
} from '../lib/feature';
import { persistReducer, persistStore } from 'redux-persist';
import { onlineSelfSchedulingApiSlice } from '../lib/domain/apiSlice';

type RootTestState = Omit<RootState, 'preLogin' | 'manageSelfSchedule'> & {
  [preLoginSlice.name]: PreLoginState;
  [manageSelfScheduleSlice.name]: ManageSelfScheduleState;
};

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootTestState>['preloadedState']
) => {
  const store = configureStore({
    reducer: combineReducers({
      [authSlice.name]: authSlice.reducer,
      [preLoginSlice.name]: persistReducer<PreLoginState>(
        preLoginStatePersistConfig,
        preLoginSlice.reducer
      ),
      [onlineSelfSchedulingApiSlice.reducerPath]:
        onlineSelfSchedulingApiSlice.reducer,
      [manageSelfScheduleSlice.name]: manageSelfScheduleSlice.reducer,
      [managePatientDemographicsSlice.name]:
        managePatientDemographicsSlice.reducer,
      [manageInsurancesSlice.name]: manageInsurancesSlice.reducer,
      [managePatientAddressSlice.name]: managePatientAddressSlice.reducer,
      [manageConsentSlice.name]: manageConsentSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(onlineSelfSchedulingApiSlice.middleware),
    preloadedState: overrides,
  });
  const persistor = persistStore(store);

  return { store, persistor };
};

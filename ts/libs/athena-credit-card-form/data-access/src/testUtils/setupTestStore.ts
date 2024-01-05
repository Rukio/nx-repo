import {
  combineReducers,
  configureStore,
  ConfigureStoreOptions,
} from '@reduxjs/toolkit';
import { authSlice } from '@*company-data-covered*/auth0/data-access';
import { athenaCreditCardFormApiSlice } from '../';
import { RootState } from '../lib/store';
import { collectPaymentSlice, creditCardSlice } from '../lib/feature';

export const setupTestStore = (
  overrides?: ConfigureStoreOptions<RootState>['preloadedState']
) =>
  configureStore({
    reducer: combineReducers({
      [authSlice.name]: authSlice.reducer,
      [athenaCreditCardFormApiSlice.reducerPath]:
        athenaCreditCardFormApiSlice.reducer,
      [collectPaymentSlice.name]: collectPaymentSlice.reducer,
      [creditCardSlice.name]: creditCardSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(athenaCreditCardFormApiSlice.middleware),
    preloadedState: overrides,
  });

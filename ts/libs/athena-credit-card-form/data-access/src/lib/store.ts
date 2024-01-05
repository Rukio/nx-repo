import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { authSlice, AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';
import { athenaCreditCardFormApiSlice } from './domain';
import { collectPaymentSlice } from './feature';
import { creditCardSlice } from './feature/creditCard';

export const store = configureStore({
  reducer: {
    [AUTH_FEATURE_KEY]: authSlice.reducer,
    [athenaCreditCardFormApiSlice.reducerPath]:
      athenaCreditCardFormApiSlice.reducer,
    [collectPaymentSlice.name]: collectPaymentSlice.reducer,
    [creditCardSlice.name]: creditCardSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(athenaCreditCardFormApiSlice.middleware),
});

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();

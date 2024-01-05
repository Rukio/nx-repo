import { createSlice, createSelector } from '@reduxjs/toolkit';
import { patientsSlice } from '../../domain';
import { RootState } from '../../store';
import { toPaymentData } from '../../utils/mappers';
import { CollectPaymentState, CollectPaymentPayload } from './types';

export const COLLECT_PAYMENT_KEY = 'collectPayment';

export const collectPaymentInitialState: CollectPaymentState = {};

export const collectPaymentSlice = createSlice({
  name: COLLECT_PAYMENT_KEY,
  initialState: collectPaymentInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      patientsSlice.endpoints.createPayment.matchPending,
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      patientsSlice.endpoints.createPayment.matchFulfilled,
      (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
        state.payment = toPaymentData(action.payload);
      }
    );
    builder.addMatcher(
      patientsSlice.endpoints.createPayment.matchRejected,
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
  },
});

export const collectPayment = (data: CollectPaymentPayload) =>
  patientsSlice.endpoints.createPayment.initiate(data);

export const selectCollectPaymentState = (state: RootState) =>
  state[COLLECT_PAYMENT_KEY];

export const selectPayment = createSelector(
  selectCollectPaymentState,
  (collectPaymentState) => collectPaymentState.payment
);

export const selectCollectPaymentLoadingState = createSelector(
  selectCollectPaymentState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

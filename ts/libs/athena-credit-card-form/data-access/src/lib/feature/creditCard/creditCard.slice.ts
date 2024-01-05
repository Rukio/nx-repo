import { createSlice, createSelector, isAnyOf } from '@reduxjs/toolkit';
import {
  patientsSlice,
  selectCreditCards as domainSelectCreditCards,
  SelectCreditCardsQuery,
} from '../../domain';
import { RootState } from '../../store';
import {
  toCreditCards,
  toDeleteCreditCardResult,
  toSavedCreditCardData,
} from '../../utils/mappers';
import {
  CreditCardState,
  DeleteCreditCardPayload,
  SaveCreditCardPayload,
} from './types';

export const CREDIT_CARD_KEY = 'creditCard';

export const creditCardInitialState: CreditCardState = {};

export const creditCardSlice = createSlice({
  name: CREDIT_CARD_KEY,
  initialState: creditCardInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        patientsSlice.endpoints.saveCreditCard.matchPending,
        patientsSlice.endpoints.deleteCreditCard.matchPending
      ),
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      patientsSlice.endpoints.saveCreditCard.matchFulfilled,
      (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
        state.savedCreditCardData = toSavedCreditCardData(action.payload);
      }
    );
    builder.addMatcher(
      isAnyOf(
        patientsSlice.endpoints.saveCreditCard.matchRejected,
        patientsSlice.endpoints.deleteCreditCard.matchRejected
      ),
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
    builder.addMatcher(
      patientsSlice.endpoints.deleteCreditCard.matchFulfilled,
      (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
        state.deleteCreditCardResult = toDeleteCreditCardResult(action.payload);
      }
    );
  },
});

export const saveCreditCard = (data: SaveCreditCardPayload) =>
  patientsSlice.endpoints.saveCreditCard.initiate(data);

export const deleteCreditCard = (data: DeleteCreditCardPayload) =>
  patientsSlice.endpoints.deleteCreditCard.initiate(data);

export const selectCreditCardState = (state: RootState) =>
  state[CREDIT_CARD_KEY];

export const selectSavedCreditCardData = createSelector(
  selectCreditCardState,
  (creditCardState) => creditCardState.savedCreditCardData
);

export const selectCreditCardLoadingState = createSelector(
  selectCreditCardState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectDeleteCreditCardResult = createSelector(
  selectCreditCardState,
  (creditCardState) => creditCardState.deleteCreditCardResult
);

export const selectFirstExistingCreditCard = (query: SelectCreditCardsQuery) =>
  createSelector(
    domainSelectCreditCards(query),
    ({ isError, isLoading, error, data, isSuccess }) => ({
      isError,
      isLoading,
      error,
      isSuccess,
      creditCard: toCreditCards(data).at(0),
    })
  );

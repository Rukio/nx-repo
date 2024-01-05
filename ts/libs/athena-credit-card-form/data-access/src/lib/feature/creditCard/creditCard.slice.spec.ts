import {
  mockCreditCardsQuery,
  mockDeleteCreditCardPayload,
  mockSaveCreditCardPayload,
} from './mocks';
import { setupTestStore } from '../../../testUtils';
import {
  mockCreditCards,
  mockDeleteCreditCardResult,
  mockSavedCreditCard,
} from '../../domain/patientsSlice/mocks';
import {
  creditCardInitialState,
  creditCardSlice,
  selectCreditCardLoadingState,
  saveCreditCard,
  selectFirstExistingCreditCard,
  deleteCreditCard,
} from './creditCard.slice';
import { patientsSlice } from '../../domain';
import { toCreditCards } from '../../utils/mappers';

describe('creditCard.slice', () => {
  it('should initialize default reducer state', () => {
    const state = creditCardSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(creditCardInitialState);
  });

  describe('reducers', () => {
    it('saveCreditCard should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify(mockSavedCreditCard));
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      store.dispatch(saveCreditCard(mockSaveCreditCardPayload));
      const pendingLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('saveCreditCard should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify(mockSavedCreditCard));
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      await store.dispatch(saveCreditCard(mockSaveCreditCardPayload));
      const fulfilledLoadingState = selectCreditCardLoadingState(
        store.getState()
      );

      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('saveCreditCard should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      await store.dispatch(saveCreditCard(mockSaveCreditCardPayload));
      const rejectedLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });

    it('deleteCreditCard should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify(mockDeleteCreditCardResult));
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      store.dispatch(deleteCreditCard(mockDeleteCreditCardPayload));
      const pendingLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('deleteCreditCard should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify(mockDeleteCreditCardResult));
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      await store.dispatch(deleteCreditCard(mockDeleteCreditCardPayload));
      const fulfilledLoadingState = selectCreditCardLoadingState(
        store.getState()
      );

      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('deleteCreditCard should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [creditCardSlice.name]: creditCardInitialState,
      });

      const initialLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: creditCardInitialState.isLoading,
        isError: creditCardInitialState.isError,
        isSuccess: creditCardInitialState.isSuccess,
        error: creditCardInitialState.error,
      });

      await store.dispatch(deleteCreditCard(mockDeleteCreditCardPayload));
      const rejectedLoadingState = selectCreditCardLoadingState(
        store.getState()
      );
      expect(rejectedLoadingState).toEqual({
        isLoading: false,
        isError: true,
        isSuccess: false,
        error: mockedError,
      });
    });
  });

  describe('domain feature selectors', () => {
    it('should select first existing transformed credit card', async () => {
      fetchMock.mockResponse(JSON.stringify({ creditCards: mockCreditCards }));
      const store = setupTestStore();

      await store.dispatch(
        patientsSlice.endpoints.getCreditCards.initiate(mockCreditCardsQuery)
      );

      const data = selectFirstExistingCreditCard(mockCreditCardsQuery)(
        store.getState()
      );
      expect(data).toEqual({
        isError: false,
        isLoading: false,
        isSuccess: true,
        creditCard: toCreditCards(mockCreditCards)[0],
      });
    });
  });
});

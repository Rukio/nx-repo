import { mockCollectPaymentPayload } from './mocks';
import { setupTestStore } from '../../../testUtils';
import {
  collectPayment,
  collectPaymentInitialState,
  collectPaymentSlice,
  selectCollectPaymentLoadingState,
  selectCollectPaymentState,
} from './collectPayment.slice';
import { mockPayment } from '../../domain/patientsSlice/mocks';

describe('collectPayment.slice', () => {
  it('should initialize default reducer state', () => {
    const state = collectPaymentSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(collectPaymentInitialState);
  });

  describe('reducers', () => {
    it('collectPayment should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockPayment }));
      const store = setupTestStore({
        [collectPaymentSlice.name]: collectPaymentInitialState,
      });

      const initialLoadingState = selectCollectPaymentState(store.getState());
      expect(initialLoadingState).toEqual({
        isLoading: collectPaymentInitialState.isLoading,
        isError: collectPaymentInitialState.isError,
        isSuccess: collectPaymentInitialState.isSuccess,
        error: collectPaymentInitialState.error,
      });

      store.dispatch(collectPayment(mockCollectPaymentPayload));
      const pendingLoadingState = selectCollectPaymentLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('collectPayment should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify(mockPayment));
      const store = setupTestStore({
        [collectPaymentSlice.name]: collectPaymentInitialState,
      });

      const initialLoadingState = selectCollectPaymentLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: collectPaymentInitialState.isLoading,
        isError: collectPaymentInitialState.isError,
        isSuccess: collectPaymentInitialState.isSuccess,
        error: collectPaymentInitialState.error,
      });

      await store.dispatch(collectPayment(mockCollectPaymentPayload));
      const fulfilledLoadingState = selectCollectPaymentLoadingState(
        store.getState()
      );

      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('collectPayment should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [collectPaymentSlice.name]: collectPaymentInitialState,
      });

      const initialLoadingState = selectCollectPaymentLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: collectPaymentInitialState.isLoading,
        isError: collectPaymentInitialState.isError,
        isSuccess: collectPaymentInitialState.isSuccess,
        error: collectPaymentInitialState.error,
      });

      await store.dispatch(collectPayment(mockCollectPaymentPayload));
      const rejectedLoadingState = selectCollectPaymentLoadingState(
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
});

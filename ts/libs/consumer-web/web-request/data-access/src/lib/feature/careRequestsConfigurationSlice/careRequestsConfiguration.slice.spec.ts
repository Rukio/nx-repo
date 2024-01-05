import { mockCareRequestResult } from '@*company-data-covered*/station/data-access';
import fetchMock from 'jest-fetch-mock';
import { setupTestStore } from '../../../testUtils';
import {
  careRequestsConfigurationInitialState,
  careRequestsConfigurationSlice,
  createCareRequest,
  selectCareRequestsConfigurationLoadingState,
} from './careRequestsConfiguration.slice';
import { mockCreateCareRequestDataPayload } from './mocks';

describe('careRequestsConfiguration.slice', () => {
  it('should initialize default reducer state', () => {
    const state = careRequestsConfigurationSlice.reducer(undefined, {
      type: undefined,
    });
    expect(state).toEqual(careRequestsConfigurationInitialState);
  });

  describe('reducers', () => {
    it('createCareRequest should update the state on pending status', () => {
      fetchMock.mockResponse(JSON.stringify({ payer: mockCareRequestResult }));
      const store = setupTestStore({
        [careRequestsConfigurationSlice.name]:
          careRequestsConfigurationInitialState,
      });

      const initialLoadingState = selectCareRequestsConfigurationLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: careRequestsConfigurationInitialState.isLoading,
        isError: careRequestsConfigurationInitialState.isError,
        isSuccess: careRequestsConfigurationInitialState.isSuccess,
        error: careRequestsConfigurationInitialState.error,
      });

      store.dispatch(createCareRequest(mockCreateCareRequestDataPayload));
      const pendingLoadingState = selectCareRequestsConfigurationLoadingState(
        store.getState()
      );
      expect(pendingLoadingState).toEqual({
        isLoading: true,
        isError: false,
        isSuccess: false,
      });
    });

    it('createCareRequest should update the state on fulfilled status', async () => {
      fetchMock.mockResponse(JSON.stringify(mockCareRequestResult));
      const store = setupTestStore({
        [careRequestsConfigurationSlice.name]:
          careRequestsConfigurationInitialState,
      });

      const initialLoadingState = selectCareRequestsConfigurationLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: careRequestsConfigurationInitialState.isLoading,
        isError: careRequestsConfigurationInitialState.isError,
        isSuccess: careRequestsConfigurationInitialState.isSuccess,
        error: careRequestsConfigurationInitialState.error,
      });

      await store.dispatch(createCareRequest(mockCreateCareRequestDataPayload));
      const fulfilledLoadingState = selectCareRequestsConfigurationLoadingState(
        store.getState()
      );

      expect(fulfilledLoadingState).toEqual({
        isLoading: false,
        isError: false,
        isSuccess: true,
      });
    });

    it('createCareRequest should update the state on rejected status', async () => {
      const mockedError = { message: 'Rejected' };
      fetchMock.mockRejectedValue(mockedError);
      const store = setupTestStore({
        [careRequestsConfigurationSlice.name]:
          careRequestsConfigurationInitialState,
      });

      const initialLoadingState = selectCareRequestsConfigurationLoadingState(
        store.getState()
      );
      expect(initialLoadingState).toEqual({
        isLoading: careRequestsConfigurationInitialState.isLoading,
        isError: careRequestsConfigurationInitialState.isError,
        isSuccess: careRequestsConfigurationInitialState.isSuccess,
        error: careRequestsConfigurationInitialState.error,
      });

      await store.dispatch(createCareRequest(mockCreateCareRequestDataPayload));
      const rejectedLoadingState = selectCareRequestsConfigurationLoadingState(
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

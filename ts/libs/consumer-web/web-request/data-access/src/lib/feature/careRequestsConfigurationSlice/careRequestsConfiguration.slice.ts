import { unauthenticatedCareRequestsSlice } from '@*company-data-covered*/station/data-access';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { toCareRequestResult, toCreateCareRequestPayload } from '../../utils';
import {
  CareRequestsConfigurationState,
  CreateCareRequestPayload,
} from './types';

export const CARE_REQUESTS_CONFIGURATION_KEY = 'careRequestsConfiguration';

export const careRequestsConfigurationInitialState: CareRequestsConfigurationState =
  {};

export const careRequestsConfigurationSlice = createSlice({
  name: CARE_REQUESTS_CONFIGURATION_KEY,
  initialState: careRequestsConfigurationInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      unauthenticatedCareRequestsSlice.endpoints.createCareRequest.matchPending,
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      unauthenticatedCareRequestsSlice.endpoints.createCareRequest
        .matchFulfilled,
      (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
        state.careRequestResult = toCareRequestResult(action.payload);
      }
    );
    builder.addMatcher(
      unauthenticatedCareRequestsSlice.endpoints.createCareRequest
        .matchRejected,
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
  },
});

export const createCareRequest = (data: CreateCareRequestPayload) =>
  unauthenticatedCareRequestsSlice.endpoints.createCareRequest.initiate(
    toCreateCareRequestPayload(data)
  );

export const selectCareRequestsConfigurationState = (state: RootState) =>
  state[CARE_REQUESTS_CONFIGURATION_KEY];

export const selectCareRequestResult = createSelector(
  selectCareRequestsConfigurationState,
  (careRequestsConfigurationState) =>
    careRequestsConfigurationState.careRequestResult
);

export const selectCareRequestsConfigurationLoadingState = createSelector(
  selectCareRequestsConfigurationState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

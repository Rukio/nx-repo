import {
  createSlice,
  createSelector,
  isAnyOf,
  PayloadAction,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { RootState } from '../../store';
import {
  buildBillingCitiesModalityConfigsHierarchy,
  prepareNetworkStateRequestData,
} from '../../utils/mappers';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  networksSlice,
  networkModalitiesSlice,
  selectDomainNetworkModalityConfigs,
} from '../../domain';
import {
  NetworkModalityConfigWithOptionalId,
  PatchNetworkModalityConfigPayload,
} from '../../types';
import { ManageNetworkModalitiesState, NetworkModalitiesError } from './types';

export const MANAGE_NETWORK_MODALITIES_KEY = 'manageNetworkModalities';

export const resetNetworkModalityConfigs = createAsyncThunk<
  {
    configs: NetworkModalityConfigWithOptionalId[];
    filterableConfigs: NetworkModalityConfigWithOptionalId[];
  },
  string
>('networkModalities/resetModalityConfigs', (networkId, { getState }) => {
  const currentState = getState() as RootState;
  const domainNetworkModalityConfigs =
    selectDomainNetworkModalityConfigs(networkId)(currentState);

  return {
    configs: domainNetworkModalityConfigs.data || [],
    filterableConfigs: domainNetworkModalityConfigs.data || [],
  };
});

export const patchUpdateNetworkStatesAndModalityConfigurations =
  createAsyncThunk<
    {
      networkModalityConfigs?: NetworkModalityConfigWithOptionalId[];
      networkModalityConfigsError?: NetworkModalitiesError;
      stateAbbrs?: string[];
      stateAbbrsError?: NetworkModalitiesError;
    },
    { networkId: string; stateAbbrs: string[] }
  >(
    'networkModalities/patchUpdateNetworkStatesAndModalityConfigurations',
    async ({ networkId, stateAbbrs }, { getState, dispatch }) => {
      const currentState = getState() as RootState;
      const [networkModalityConfigsResponse, stateAbbrsResponse] =
        await Promise.all([
          dispatch(
            networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
              {
                networkId,
                configs: currentState[MANAGE_NETWORK_MODALITIES_KEY].configs,
              }
            )
          ),
          dispatch(
            networksSlice.endpoints.patchNetworkStates.initiate(
              prepareNetworkStateRequestData({
                networkId,
                stateAbbrs: stateAbbrs,
              })
            )
          ),
        ]);

      const hasModalitiesError = isQueryErrorResponse(
        networkModalityConfigsResponse
      );
      const hasStatesError = isQueryErrorResponse(stateAbbrsResponse);

      return {
        modalityConfigs: hasModalitiesError
          ? undefined
          : networkModalityConfigsResponse.data,
        stateAbbrs: hasStatesError ? undefined : stateAbbrsResponse.data,
        networkModalityConfigsError: hasModalitiesError
          ? networkModalityConfigsResponse.error
          : undefined,
        stateAbbrsError: hasStatesError ? stateAbbrsResponse.error : undefined,
      };
    }
  );

export const manageNetworkModalitiesInitialState: ManageNetworkModalitiesState =
  {
    configs: [],
    filterableConfigs: [],
  };

export const manageNetworkModalitiesSlice = createSlice({
  name: MANAGE_NETWORK_MODALITIES_KEY,
  initialState: manageNetworkModalitiesInitialState,
  reducers: {
    updateNetworkModalityConfigs(
      state,
      action: PayloadAction<NetworkModalityConfigWithOptionalId>
    ) {
      const { payload } = action;
      const currentConfigs = [...(state.configs || [])];
      const currentConfigIndex = currentConfigs.findIndex(
        (config) =>
          config.networkId === payload.networkId &&
          config.billingCityId === payload.billingCityId &&
          config.modalityId === payload.modalityId &&
          config.serviceLineId === payload.serviceLineId
      );
      if (currentConfigIndex !== -1) {
        currentConfigs.splice(currentConfigIndex, 1);
        state.configs = currentConfigs;
      } else {
        state.configs = [...currentConfigs, payload];
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      patchUpdateNetworkStatesAndModalityConfigurations.pending,
      (state) => {
        state.error = undefined;
        state.isError = false;
        state.isSuccess = false;
        state.isLoading = true;
      }
    );
    builder.addCase(
      patchUpdateNetworkStatesAndModalityConfigurations.fulfilled,
      (state, action) => {
        const {
          networkModalityConfigs,
          stateAbbrsError,
          networkModalityConfigsError,
        } = action.payload;
        const hasError = !!(networkModalityConfigsError || stateAbbrsError);
        state.configs = networkModalityConfigs || state.configs;
        state.filterableConfigs =
          networkModalityConfigs || state.filterableConfigs;
        state.isLoading = false;
        state.isError = hasError;
        state.isSuccess = !hasError;
        state.error = networkModalityConfigsError || stateAbbrsError;
      }
    );
    builder.addCase(resetNetworkModalityConfigs.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = true;
      state.error = undefined;
      state.configs = action.payload.configs;
      state.filterableConfigs = action.payload.configs;
    });
    builder.addMatcher(
      isAnyOf(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs.matchPending,
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs
          .matchPending
      ),
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      isAnyOf(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs
          .matchFulfilled,
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs
          .matchFulfilled
      ),
      (state) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      isAnyOf(
        networkModalitiesSlice.endpoints.getNetworkModalityConfigs
          .matchRejected,
        networkModalitiesSlice.endpoints.patchNetworkModalityConfigs
          .matchRejected
      ),
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
    builder.addMatcher(
      networkModalitiesSlice.endpoints.getNetworkModalityConfigs.matchFulfilled,
      (state, action) => {
        state.configs = action.payload;
        state.filterableConfigs = action.payload;
      }
    );
  },
});

export const selectManageNetworkModalitiesState = (state: RootState) =>
  state[MANAGE_NETWORK_MODALITIES_KEY];

export const selectNetworkModalityConfigs = createSelector(
  selectManageNetworkModalitiesState,
  (manageNetworkModalitiesState) => manageNetworkModalitiesState.configs || []
);

export const selectFilterableNetworkModalityConfigs = createSelector(
  selectManageNetworkModalitiesState,
  (manageNetworkModalitiesState) =>
    manageNetworkModalitiesState.filterableConfigs || []
);

export const selectSelectedNetworkModalityConfigs = createSelector(
  selectNetworkModalityConfigs,
  (networkModalityConfigs) =>
    buildBillingCitiesModalityConfigsHierarchy(networkModalityConfigs)
);

export const patchNetworkModalityConfigs = (
  modalityConfigPayload: PatchNetworkModalityConfigPayload
) =>
  networkModalitiesSlice.endpoints.patchNetworkModalityConfigs.initiate(
    modalityConfigPayload
  );

export const selectNetworkModalitiesLoadingState = createSelector(
  selectManageNetworkModalitiesState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);
export const { updateNetworkModalityConfigs } =
  manageNetworkModalitiesSlice.actions;

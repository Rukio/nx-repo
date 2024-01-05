import {
  createSelector,
  createSlice,
  PayloadAction,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import {
  selectModalities as domainSelectModalities,
  useGetMarketsModalityConfigsQuery,
  useLazyGetMarketsModalityConfigsQuery,
  useGetModalityConfigsQuery,
  useLazyGetModalitiesQuery,
  modalitiesSlice,
  usePatchMarketsModalityConfigsMutation,
  usePatchModalityConfigsMutation,
  selectMarketsModalityConfigs as domainSelectMarketsModalityConfigs,
  selectModalityConfigs as domainSelectModalityConfigs,
} from '@*company-data-covered*/station/data-access';
import {
  ModalitiesConfigurationState,
  MarketModalityConfig,
  ModalityConfig,
  ModalityError,
} from './types';
import { RootState } from '../../store';
import {
  transformModalitiesList,
  transformMarketsModalityConfigs,
  transformModalityConfigs,
  transformMarketsModalityConfigsToDomain,
  transformModalityConfigsToDomain,
  buildMarketsModalityConfigsHierarchy,
  buildModalityConfigsHierarchy,
} from '../../utils';

export const MODALITY_CONFIGURATIONS_KEY = 'modalityConfigurations';

export const initialModalitiesConfigurationState: ModalitiesConfigurationState =
  { showSuccessMessage: false };

export const patchUpdateModalityConfigurations = createAsyncThunk<
  {
    marketModalityConfigs?: MarketModalityConfig[];
    marketModalityConfigsError?: ModalityError;
    modalityConfigs?: ModalityConfig[];
    modalityConfigsError?: ModalityError;
  },
  number
>(
  'modalities/patchModalities',
  async (serviceLineId, { getState, dispatch }) => {
    const currentState = getState() as RootState;
    const [marketsModalityConfigsResponse, modalityConfigsResponse] =
      await Promise.all([
        dispatch(
          modalitiesSlice.endpoints.patchMarketsModalityConfigs.initiate({
            service_line_id: serviceLineId,
            configs: transformMarketsModalityConfigsToDomain(
              currentState[MODALITY_CONFIGURATIONS_KEY].marketsModalityConfigs
            ),
          })
        ),
        dispatch(
          modalitiesSlice.endpoints.patchModalityConfigs.initiate({
            service_line_id: serviceLineId,
            configs: transformModalityConfigsToDomain(
              currentState[MODALITY_CONFIGURATIONS_KEY].modalityConfigs
            ),
          })
        ),
      ]);

    return {
      modalityConfigs:
        'data' in modalityConfigsResponse
          ? transformModalityConfigs(modalityConfigsResponse.data)
          : undefined,
      marketModalityConfigs:
        'data' in marketsModalityConfigsResponse
          ? transformMarketsModalityConfigs(marketsModalityConfigsResponse.data)
          : undefined,
      modalityConfigsError:
        'error' in modalityConfigsResponse
          ? modalityConfigsResponse.error
          : undefined,
      marketModalityConfigsError:
        'error' in marketsModalityConfigsResponse
          ? marketsModalityConfigsResponse.error
          : undefined,
    };
  }
);

export const resetModalityConfigurationsState = createAsyncThunk<
  {
    marketModalityConfigs: MarketModalityConfig[];
    modalityConfigs: ModalityConfig[];
  },
  number
>('modalities/resetState', (serviceLineId, { getState }) => {
  const currentState = getState() as RootState;
  const domainMarketsModalityConfigurations =
    domainSelectMarketsModalityConfigs(serviceLineId)(currentState);
  const domainModalityConfigurations =
    domainSelectModalityConfigs(serviceLineId)(currentState);

  return {
    marketModalityConfigs: transformMarketsModalityConfigs(
      domainMarketsModalityConfigurations.data
    ),
    modalityConfigs: transformModalityConfigs(
      domainModalityConfigurations.data
    ),
  };
});

export const modalityConfigurationsSlice = createSlice({
  name: MODALITY_CONFIGURATIONS_KEY,
  initialState: initialModalitiesConfigurationState,
  reducers: {
    updateMarketModalityConfig(
      state,
      action: PayloadAction<
        Pick<MarketModalityConfig, 'marketId' | 'modalityId' | 'serviceLineId'>
      >
    ) {
      const { payload } = action;
      const currentConfigs = [...(state.marketsModalityConfigs || [])];
      const currentConfigIndex = currentConfigs.findIndex(
        (marketConfig) =>
          marketConfig.marketId === payload.marketId &&
          marketConfig.serviceLineId === payload.serviceLineId &&
          marketConfig.modalityId === payload.modalityId
      );

      if (currentConfigIndex !== -1) {
        currentConfigs.splice(currentConfigIndex, 1);
        state.marketsModalityConfigs = currentConfigs;
      } else {
        state.marketsModalityConfigs = [...currentConfigs, payload];
      }
    },
    updateModalityConfig(
      state,
      action: PayloadAction<
        Pick<
          ModalityConfig,
          'marketId' | 'modalityId' | 'serviceLineId' | 'insurancePlanId'
        >
      >
    ) {
      const { payload } = action;
      const currentConfigs = [...(state.modalityConfigs || [])];
      const currentConfigIndex = currentConfigs.findIndex(
        (config) =>
          config.marketId === payload.marketId &&
          config.serviceLineId === payload.serviceLineId &&
          config.modalityId === payload.modalityId &&
          config.insurancePlanId === payload.insurancePlanId
      );

      if (currentConfigIndex !== -1) {
        currentConfigs.splice(currentConfigIndex, 1);
        state.modalityConfigs = currentConfigs;
      } else {
        state.modalityConfigs = [...currentConfigs, payload];
      }
    },
    setShowSuccessMessage(
      state,
      action: PayloadAction<
        Pick<ModalitiesConfigurationState, 'showSuccessMessage'>
      >
    ) {
      state.showSuccessMessage = action.payload.showSuccessMessage;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      resetModalityConfigurationsState.fulfilled,
      (state, action) => {
        state.error = undefined;
        state.isLoading = false;
        state.isSuccess = undefined;
        state.isError = undefined;
        state.showSuccessMessage = false;
        state.marketsModalityConfigs = action.payload.marketModalityConfigs;
        state.modalityConfigs = action.payload.modalityConfigs;
      }
    );
    builder.addCase(patchUpdateModalityConfigurations.pending, (state) => {
      state.error = undefined;
      state.isError = undefined;
      state.isSuccess = undefined;
      state.isLoading = true;
      state.showSuccessMessage = false;
    });
    builder.addCase(
      patchUpdateModalityConfigurations.fulfilled,
      (state, action) => {
        const {
          modalityConfigs,
          marketModalityConfigs,
          marketModalityConfigsError,
          modalityConfigsError,
        } = action.payload;
        const hasError = !!(modalityConfigsError || marketModalityConfigsError);
        state.modalityConfigs = modalityConfigs;
        state.marketsModalityConfigs = marketModalityConfigs;
        state.isLoading = false;
        state.isError = hasError;
        state.isSuccess = !hasError;
        state.showSuccessMessage = !hasError;
        state.error = modalityConfigsError || marketModalityConfigsError;
      }
    );
    builder.addMatcher(
      modalitiesSlice.endpoints.getMarketsModalityConfigs.matchFulfilled,
      (state, action) => {
        state.marketsModalityConfigs = transformMarketsModalityConfigs(
          action.payload
        );
      }
    );
    builder.addMatcher(
      modalitiesSlice.endpoints.getModalityConfigs.matchFulfilled,
      (state, action) => {
        state.modalityConfigs = transformModalityConfigs(action.payload);
      }
    );
  },
});

export const selectModalityConfigurationsState = createSelector(
  (state: RootState) => state[MODALITY_CONFIGURATIONS_KEY],
  (modalityConfigurationsState: ModalitiesConfigurationState) =>
    modalityConfigurationsState
);

export const selectModalities = createSelector(
  domainSelectModalities,
  ({ isError, isLoading, error, data, isSuccess }) => ({
    isError,
    isLoading,
    error,
    isSuccess,
    modalities: transformModalitiesList(data),
  })
);

export const selectMarketsModalityConfigs = createSelector(
  selectModalityConfigurationsState,
  ({ marketsModalityConfigs }) => marketsModalityConfigs
);

export const selectSelectedMarketsModalityConfigs = createSelector(
  selectMarketsModalityConfigs,
  (marketsModalityConfigs) =>
    buildMarketsModalityConfigsHierarchy(marketsModalityConfigs)
);

export const selectModalityConfigs = createSelector(
  selectModalityConfigurationsState,
  ({ modalityConfigs }) => modalityConfigs
);

export const selectSelectedModalityConfigs = createSelector(
  selectModalityConfigs,
  (modalityConfigs) => buildModalityConfigsHierarchy(modalityConfigs)
);

export const selectModalityConfigurationsLoadingState = createSelector(
  selectModalityConfigurationsState,
  ({ isLoading, isError, isSuccess, error, showSuccessMessage }) => ({
    isLoading,
    isError,
    isSuccess,
    showSuccessMessage,
    error,
  })
);

export {
  useGetMarketsModalityConfigsQuery,
  useLazyGetMarketsModalityConfigsQuery,
  useGetModalityConfigsQuery,
  useLazyGetModalitiesQuery,
  usePatchMarketsModalityConfigsMutation,
  usePatchModalityConfigsMutation,
};

export const {
  updateMarketModalityConfig,
  updateModalityConfig,
  setShowSuccessMessage,
} = modalityConfigurationsSlice.actions;

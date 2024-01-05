import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
  isAnyOf,
} from '@reduxjs/toolkit';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  AccountAddress,
  AddressStatus,
  SuggestedAddress,
} from '@*company-data-covered*/consumer-web-types';
import {
  selectDomainPatientAccount,
  patientAccountsSlice,
  selectDomainPatientAddresses,
  onlineSelfSchedulingApiSlice,
  OnlineSelfSchedulingApiSliceTag,
  selectPlacesOfService,
} from '../../domain';
import {
  selectSelfScheduleData,
  updateCachedSelfScheduleData,
} from '../manageSelfScheduleSlice';
import { RootState } from '../../store';
import { ManagePatientAddressState } from './types';
import {
  CacheSelfScheduleDataPayload,
  DomainPatientAccountAddress,
  PatientAccountAddressData,
} from '../../types';
import {
  preparePatientAccountAddressRequestData,
  prepareUpdatePatientAddressRequestData,
  transformDomainPatientAddressesTo,
  toFormattedAddress,
} from '../../utils/mappers';

export const MANAGE_PATIENT_ADDRESS_SLICE_KEY = 'managePatientAddress';

export const managePatientAddressInitialState: ManagePatientAddressState = {
  isLoading: false,
  isError: false,
  isSuccess: false,
};

export const managePatientAddressSlice = createSlice({
  name: MANAGE_PATIENT_ADDRESS_SLICE_KEY,
  initialState: managePatientAddressInitialState,
  reducers: {
    updateAddressStatus(
      state,
      action: PayloadAction<ManagePatientAddressState['addressStatus']>
    ) {
      state.addressStatus = action.payload;
    },
    updateEnteredAddress(
      state,
      action: PayloadAction<ManagePatientAddressState['enteredAddress']>
    ) {
      state.enteredAddress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setExistingPatientAddress.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
    });
    builder.addCase(upsertPatientAddress.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
      state.suggestedAddress = action.payload.suggestedAddress;
      state.addressStatus = action.payload.addressStatus;
      state.createdAddressId = action.payload.createdAddressId;
      state.createdAddressConsistencyToken =
        action.payload.createdAddressConsistencyToken;
    });
    builder.addMatcher(
      isAnyOf(
        upsertPatientAddress.pending.match,
        setExistingPatientAddress.pending.match
      ),
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.getAddresses.matchPending,
      (state) => {
        state.isLoading = true;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.getAddresses.matchFulfilled,
      (state) => {
        state.isLoading = false;
      }
    );
  },
});

export const selectManagePatientAddressState = (state: RootState) =>
  state[MANAGE_PATIENT_ADDRESS_SLICE_KEY];

export const selectManagePatientAddressLoadingState = createSelector(
  selectManagePatientAddressState,
  ({ isLoading, isError, isSuccess }) => ({
    isLoading,
    isError,
    isSuccess,
  })
);

export const selectPatientAddressData = createSelector(
  selectManagePatientAddressState,
  (managePatientAddressState) => ({
    enteredAddress: managePatientAddressState.enteredAddress,
    suggestedAddress: managePatientAddressState.suggestedAddress,
    addressStatus: managePatientAddressState.addressStatus,
    createdAddressId: managePatientAddressState.createdAddressId,
    createdAddressConsistencyToken:
      managePatientAddressState.createdAddressConsistencyToken,
  })
);

export const selectPatientAddresses = createSelector(
  (state: RootState) =>
    selectDomainPatientAddresses(
      selectDomainPatientAccount(state)?.data?.id || skipToken
    )(state),
  ({ isLoading, isError, isSuccess, data: addresses = [] }) => ({
    isLoading,
    isError,
    isSuccess,
    patientAddresses: transformDomainPatientAddressesTo(addresses),
  })
);

export const selectPatientAddress = () =>
  createSelector(
    (state: RootState) =>
      selectDomainPatientAddresses(
        selectDomainPatientAccount(state)?.data?.id || skipToken
      )(state),
    selectSelfScheduleData,
    ({ data: addresses = [] }, selfScheduleData) =>
      addresses.find((address) => address.id === selfScheduleData?.addressId) ??
      null
  );

export const selectFormattedPatientAddress = () =>
  createSelector(selectPatientAddress(), (address) =>
    toFormattedAddress(address)
  );

export const upsertPatientAddress = createAsyncThunk<
  {
    isError: boolean;
    isUpsertPatientAddressError: boolean;
    isUpdateCacheError: boolean;
    addressStatus?: AddressStatus;
    suggestedAddress?: SuggestedAddress;
    createdAddressId?: DomainPatientAccountAddress['id'];
    createdAddressConsistencyToken?: AccountAddress['consistencyToken'];
  },
  {
    patientAddress: PatientAccountAddressData;
    marketId?: CacheSelfScheduleDataPayload['marketId'];
    createdAddressId?: DomainPatientAccountAddress['id'];
    createdAddressConsistencyToken?: AccountAddress['consistencyToken'];
  }
>(
  `${MANAGE_PATIENT_ADDRESS_SLICE_KEY}/upsertPatientAddress`,
  async (
    {
      patientAddress,
      marketId,
      createdAddressId,
      createdAddressConsistencyToken,
    },
    { dispatch, getState }
  ) => {
    const currentState = getState() as RootState;

    const { data: patientAccount } = selectDomainPatientAccount(currentState);

    let upsertPatientAddressResponse = null;

    if (createdAddressId) {
      upsertPatientAddressResponse =
        patientAccount?.id && createdAddressConsistencyToken
          ? await dispatch(
              patientAccountsSlice.endpoints.updateAddress.initiate(
                prepareUpdatePatientAddressRequestData({
                  accountId: patientAccount.id,
                  addressId: createdAddressId,
                  consistencyToken: createdAddressConsistencyToken,
                  address: patientAddress,
                })
              )
            )
          : null;
    } else {
      upsertPatientAddressResponse = patientAccount?.id
        ? await dispatch(
            patientAccountsSlice.endpoints.createAddress.initiate(
              preparePatientAccountAddressRequestData(
                patientAccount.id,
                patientAddress
              )
            )
          )
        : null;
    }

    const isUpsertPatientAddressResponseError =
      !!upsertPatientAddressResponse &&
      isQueryErrorResponse(upsertPatientAddressResponse);

    const upsertPatientAddressResponseData =
      !!upsertPatientAddressResponse &&
      !isQueryErrorResponse(upsertPatientAddressResponse)
        ? upsertPatientAddressResponse.data
        : undefined;

    const updateCacheResponse =
      !isUpsertPatientAddressResponseError &&
      upsertPatientAddressResponseData?.address?.id &&
      upsertPatientAddressResponseData?.status === AddressStatus.VALID
        ? await dispatch(
            updateCachedSelfScheduleData({
              marketId,
              addressId: upsertPatientAddressResponseData.address.id,
            })
          ).unwrap()
        : null;

    const isUpdateCacheResponseError =
      !!updateCacheResponse && updateCacheResponse.isError;

    return {
      isError:
        !upsertPatientAddressResponse ||
        isUpsertPatientAddressResponseError ||
        isUpdateCacheResponseError,
      isUpsertPatientAddressError: isUpsertPatientAddressResponseError,
      isUpdateCacheError: isUpdateCacheResponseError,
      addressStatus: upsertPatientAddressResponseData?.status,
      suggestedAddress: upsertPatientAddressResponseData?.suggestedAddress,
      createdAddressId: upsertPatientAddressResponseData?.address?.id,
      createdAddressConsistencyToken:
        upsertPatientAddressResponseData?.consistencyToken,
    };
  }
);

export const setExistingPatientAddress = createAsyncThunk<
  { isError: boolean },
  { addressId: number; marketId: number }
>(
  `${MANAGE_PATIENT_ADDRESS_SLICE_KEY}/setAddress`,
  async (data, { dispatch }) => {
    return dispatch(updateCachedSelfScheduleData(data)).unwrap();
  }
);

export const invalidatePatientAddressesData = createAsyncThunk(
  `${MANAGE_PATIENT_ADDRESS_SLICE_KEY}/invalidatePatientAddressesData`,
  (_, { dispatch }) => {
    dispatch(
      onlineSelfSchedulingApiSlice.util.invalidateTags([
        OnlineSelfSchedulingApiSliceTag.PatientAccountAddresses,
      ])
    );
  }
);

export const selectActivePlacesOfService = (
  ...query: Parameters<typeof selectPlacesOfService>
) =>
  createSelector(selectPlacesOfService(...query), ({ data = [] }) =>
    data.filter((placeOfService) => !!placeOfService.active)
  );

export const { updateAddressStatus, updateEnteredAddress } =
  managePatientAddressSlice.actions;

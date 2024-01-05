import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';
import {
  GetPatientQuery,
  selectDomainPatientAccount,
  selectPatient,
} from '../../domain';
import { RootState } from '../../store';
import { CachePatientPOAPayload, ManageConsentState } from './types';
import { selectUnverifiedPatient } from '../managePatientDemographicsSlice';
import { prepareUpdatePOARequestData } from '../../utils/mappers';
import {
  selectIsRequesterRelationshipSelf,
  updateCachedSelfScheduleData,
} from '../manageSelfScheduleSlice';
import { getPatientForPOA } from './utils';

export const MANAGE_CONSENT_SLICE_KEY = 'manageConsentSliceKey';

export const manageConsentInitialState: ManageConsentState = {
  isLoading: false,
  isError: false,
  isSuccess: false,
};

export const cachePatientPOA = createAsyncThunk<
  {
    isError: boolean;
  },
  CachePatientPOAPayload
>(
  `${MANAGE_CONSENT_SLICE_KEY}/cachePatientPOA`,
  async (data, { dispatch, getState }) => {
    const currentState = getState() as RootState;

    const { data: patientAccount } = selectDomainPatientAccount(currentState);

    const unverifiedPatient = selectUnverifiedPatient()(currentState);

    const getPatientQuery: GetPatientQuery | SkipToken =
      patientAccount?.id && unverifiedPatient?.patientId
        ? {
            accountId: patientAccount.id,
            patientId: unverifiedPatient?.patientId,
          }
        : skipToken;

    const { data: patient } = selectPatient(getPatientQuery)(currentState);

    if (!patientAccount?.id) {
      return { isError: false };
    }

    const isRequesterRelationshipSelf =
      selectIsRequesterRelationshipSelf(currentState);

    const patientData = getPatientForPOA(
      isRequesterRelationshipSelf,
      unverifiedPatient,
      patientAccount,
      patient
    );

    const powerOfAttorney = prepareUpdatePOARequestData(data, patientData);

    const cacheSelfCheduleDataResponse = await dispatch(
      updateCachedSelfScheduleData({
        powerOfAttorney,
      })
    ).unwrap();
    const isCacheSelfCheduleDataResponseError =
      cacheSelfCheduleDataResponse?.isError;

    return {
      isError: isCacheSelfCheduleDataResponseError,
    };
  }
);

export const manageConsentSlice = createSlice({
  name: MANAGE_CONSENT_SLICE_KEY,
  initialState: manageConsentInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(cachePatientPOA.pending, (state) => {
      state.isLoading = true;
      state.isError = false;
      state.isSuccess = false;
    });
    builder.addCase(cachePatientPOA.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
    });
  },
});

export const selectManageConsentState = (state: RootState) =>
  state[MANAGE_CONSENT_SLICE_KEY];

export const selectManageConsentLoadingState = createSelector(
  selectManageConsentState,
  ({ isLoading, isError, isSuccess }) => ({
    isLoading,
    isError,
    isSuccess,
  })
);

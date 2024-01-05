import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  isAnyOf,
} from '@reduxjs/toolkit';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import {
  GetAccountPatientsQuery,
  GetPatientQuery,
  patientAccountsSlice,
  selectDomainPatientAccount,
  selectDomainPatientAccountPatients,
  selectPatient,
} from '../../domain';
import { RootState } from '../../store';
import { OnlineSelfSchedulingError, RelationToPatient } from '../../types';
import {
  prepareUpdatePatientDemographicsRequestData,
  toConsentingRelationshipCategory,
} from '../../utils/mappers';
import {
  selectIsRequesterRelationshipSelf,
  selectSelfScheduleData,
  updateCachedSelfScheduleData,
} from '../manageSelfScheduleSlice';
import {
  ManagePatientDemographicsState,
  UpdatePatientDemographicsPayload,
  UpsertPatientPayload,
} from './types';

export const MANAGE_PATIENT_DEMOGRAPHICS_SLICE_KEY =
  'managePatientDemographics';

export const managePatientDemographicsInitialState: ManagePatientDemographicsState =
  {
    isLoading: false,
  };

export const updatePatientDemographics = createAsyncThunk<
  {
    isError: boolean;
    updateAccountResponseError?: OnlineSelfSchedulingError;
    createUnverifiedPatientResponseError?: OnlineSelfSchedulingError;
    addUnverifiedAccountPatientLinkResponseError?: OnlineSelfSchedulingError;
  },
  UpdatePatientDemographicsPayload
>(
  `${MANAGE_PATIENT_DEMOGRAPHICS_SLICE_KEY}/updatePatientDemographics`,
  async (data, { dispatch, getState }) => {
    const currentState = getState() as RootState;

    const isRequesterRelationshipSelf =
      selectIsRequesterRelationshipSelf(currentState);

    const selfScheduleData = selectSelfScheduleData(currentState);

    const { data: patientAccount } = selectDomainPatientAccount(currentState);

    if (!patientAccount?.id) {
      return { isError: false };
    }

    const { account, patient } =
      prepareUpdatePatientDemographicsRequestData(data);

    const createUnverifiedPatientResponse = await dispatch(
      patientAccountsSlice.endpoints.createUnverifiedPatient.initiate({
        accountId: patientAccount.id,
        unverifiedPatient: patient,
      })
    );

    const isCreateUnverifiedPatientResponseError = isQueryErrorResponse(
      createUnverifiedPatientResponse
    );

    const addUnverifiedAccountPatientLinkResponse =
      !isCreateUnverifiedPatientResponseError &&
      createUnverifiedPatientResponse.data.id
        ? await dispatch(
            patientAccountsSlice.endpoints.addUnverifiedAccountPatientLink.initiate(
              {
                accountId: patientAccount.id,
                unverifiedPatientId: createUnverifiedPatientResponse.data.id,
                consentingRelationship: {
                  category: toConsentingRelationshipCategory(
                    selfScheduleData?.requester?.relationToPatient ||
                      RelationToPatient.Patient
                  ),
                },
              }
            )
          )
        : null;

    const isAddUnverifiedAccountPatientLinkResponseError =
      !!addUnverifiedAccountPatientLinkResponse &&
      isQueryErrorResponse(addUnverifiedAccountPatientLinkResponse);

    const updateAccountResponse =
      !isRequesterRelationshipSelf && patientAccount.consistencyToken
        ? await dispatch(
            patientAccountsSlice.endpoints.updateAccount.initiate({
              ...account,
              id: patientAccount.id,
              consistencyToken: patientAccount.consistencyToken,
            })
          )
        : null;

    const isUpdateAccountResponseError =
      !!updateAccountResponse && isQueryErrorResponse(updateAccountResponse);

    if (
      !isCreateUnverifiedPatientResponseError &&
      !isAddUnverifiedAccountPatientLinkResponseError &&
      addUnverifiedAccountPatientLinkResponse?.data.id
    ) {
      await dispatch(
        updateCachedSelfScheduleData({
          patientId: Number(addUnverifiedAccountPatientLinkResponse?.data.id),
          patientInfo: patient,
          ...(isRequesterRelationshipSelf && { requester: account }),
        })
      );
    }

    return {
      isError:
        isUpdateAccountResponseError || isCreateUnverifiedPatientResponseError,
      updateAccountResponseError: isUpdateAccountResponseError
        ? updateAccountResponse.error
        : undefined,
      createUnverifiedPatientResponseError:
        isCreateUnverifiedPatientResponseError
          ? createUnverifiedPatientResponse.error
          : undefined,
      addUnverifiedAccountPatientLinkResponseError:
        isAddUnverifiedAccountPatientLinkResponseError
          ? addUnverifiedAccountPatientLinkResponse.error
          : undefined,
    };
  }
);

export const upsertPatient = createAsyncThunk<
  {
    isError: boolean;
    createPatientEhrRecordResponseError: OnlineSelfSchedulingError | undefined;
    updateAccountPatientResponseError: OnlineSelfSchedulingError | undefined;
  },
  UpsertPatientPayload
>(
  `${MANAGE_PATIENT_DEMOGRAPHICS_SLICE_KEY}/upsertPatient`,
  async ({ billingCityId }, { dispatch, getState }) => {
    const currentState = getState() as RootState;
    const { data: account } = selectDomainPatientAccount(currentState);
    const unverifiedPatient = selectUnverifiedPatient()(currentState);
    const selfScheduleData = selectSelfScheduleData(currentState);

    const getPatientQuery: GetPatientQuery | SkipToken =
      account?.id && unverifiedPatient?.patientId
        ? {
            accountId: account.id,
            patientId: unverifiedPatient.patientId,
          }
        : skipToken;

    const { data: patient } = selectPatient(getPatientQuery)(currentState);

    const createPatientEhrRecordResponse =
      !unverifiedPatient?.patientId &&
      unverifiedPatient?.id &&
      billingCityId &&
      account?.id
        ? await dispatch(
            patientAccountsSlice.endpoints.createPatientEhrRecord.initiate({
              accountId: account.id,
              billingCityId,
              unverifiedPatientId: unverifiedPatient.id,
            })
          )
        : null;

    const isCreatePatientEhrRecordResponseError =
      !!createPatientEhrRecordResponse &&
      isQueryErrorResponse(createPatientEhrRecordResponse);
    const isCachedPOADataExist = !!selfScheduleData?.powerOfAttorney?.name;
    const createPatientEhrRecordResponseError =
      isCreatePatientEhrRecordResponseError
        ? createPatientEhrRecordResponse.error
        : undefined;

    const isPatientSuccessfullyCreated =
      createPatientEhrRecordResponse && !isCreatePatientEhrRecordResponseError;

    const patientData = isPatientSuccessfullyCreated
      ? createPatientEhrRecordResponse.data
      : patient;

    const isPatientNotUpdatedWithPOA =
      (isPatientSuccessfullyCreated || !!patient?.id) && isCachedPOADataExist;

    const updateAccountPatientResponse =
      isPatientNotUpdatedWithPOA &&
      account?.id &&
      patientData?.id &&
      billingCityId
        ? await dispatch(
            patientAccountsSlice.endpoints.updateAccountPatient.initiate({
              accountId: account.id,
              patientId: patientData.id,
              patient: {
                ...patientData,
                powerOfAttorney: selfScheduleData?.powerOfAttorney,
                billingCityId,
              },
            })
          )
        : null;
    const isUpdateAccountPatientError =
      !!updateAccountPatientResponse &&
      isQueryErrorResponse(updateAccountPatientResponse);
    const updateAccountPatientResponseError = isUpdateAccountPatientError
      ? updateAccountPatientResponse.error
      : undefined;

    return {
      isError:
        isCreatePatientEhrRecordResponseError || isUpdateAccountPatientError,
      createPatientEhrRecordResponseError,
      updateAccountPatientResponseError,
    };
  }
);

export const managePatientDemographicsSlice = createSlice({
  name: MANAGE_PATIENT_DEMOGRAPHICS_SLICE_KEY,
  initialState: managePatientDemographicsInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(updatePatientDemographics.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
      state.error =
        action.payload.createUnverifiedPatientResponseError ||
        action.payload.updateAccountResponseError;
    });
    builder.addCase(upsertPatient.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
      state.error = action.payload.createPatientEhrRecordResponseError;
    });
    builder.addMatcher(
      isAnyOf(updatePatientDemographics.pending, upsertPatient.pending),
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
  },
});

export const selectManagePatientDemographicsState = (state: RootState) =>
  state[MANAGE_PATIENT_DEMOGRAPHICS_SLICE_KEY];

export const selectManagePatientDemographicsLoadingState = createSelector(
  selectManagePatientDemographicsState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectVerifiedPatient = () =>
  createSelector(
    (state: RootState) => {
      const { data: account } = selectDomainPatientAccount(state);

      const getAccountPatientsQuery: GetAccountPatientsQuery | SkipToken =
        account?.id ? { id: account.id } : skipToken;

      return selectDomainPatientAccountPatients(getAccountPatientsQuery)(state);
    },
    selectSelfScheduleData,
    ({ data: accountPatients = [] }, selfScheduleData) =>
      accountPatients.find(
        (accountPatient) => accountPatient?.id === selfScheduleData?.patientId
      )?.patient ?? null
  );

export const selectUnverifiedPatient = () =>
  createSelector(
    (state: RootState) => {
      const { data: account } = selectDomainPatientAccount(state);

      const getAccountPatientsQuery: GetAccountPatientsQuery | SkipToken =
        account?.id ? { id: account.id } : skipToken;

      return selectDomainPatientAccountPatients(getAccountPatientsQuery)(state);
    },
    selectSelfScheduleData,
    ({ data: accountPatients = [] }, selfScheduleData) =>
      accountPatients.find(
        (accountPatient) => accountPatient?.id === selfScheduleData?.patientId
      )?.unverifiedPatient ?? null
  );

export const selectIsPatientDismissed = (
  getPatientQuery: GetPatientQuery | SkipToken
) =>
  createSelector(
    (state: RootState) => selectPatient(getPatientQuery)(state),
    ({ data: patient }) => !!patient?.patientSafetyFlag
  );

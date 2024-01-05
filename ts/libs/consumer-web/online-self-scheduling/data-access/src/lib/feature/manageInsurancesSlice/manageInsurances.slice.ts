import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { InsurancesState } from './types';
import {
  DomainPatientInsurance,
  InsuranceEligibilityStatus,
  OnlineSelfSchedulingError,
} from '../../types';
import {
  CheckInsuranceEligibilityPayload,
  domainSelectMarket,
  GetPatientInsurancesQuery,
  PatientAccountCheckEligibilityQuery,
  patientAccountsSlice,
  selectDomainPatientAccount,
  selectPatientInsurances,
  selectInsuranceClassifications,
  selectInsuranceNetworks,
  DeletePatientInsuranceQuery,
} from '../../domain';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import {
  prepareInsuranceParams,
  transformNetworksToPayers,
  transformPayerWithClassificationName,
} from '../../utils/mappers';
import { selectUnverifiedPatient } from '../managePatientDemographicsSlice';

export const INSURANCES_SLICE_KEY = 'manageInsurances';
const PRIMARY_INSURANCE_PRIORITY = '1';
const SECONDARY_INSURANCE_PRIORITY = '2';

export const insurancesInitialState: InsurancesState = {
  isLoaded: false,
};

export const checkInsuranceEligibility = createAsyncThunk<
  {
    isError: boolean;
    createInsuranceError?: OnlineSelfSchedulingError | null;
    updateInsuranceError?: OnlineSelfSchedulingError | null;
    insuranceWithEligibleStatus?: DomainPatientInsurance | null;
    checkEligibilityError?: OnlineSelfSchedulingError | null;
  },
  CheckInsuranceEligibilityPayload
>(
  `${INSURANCES_SLICE_KEY}/checkInsuranceEligibility`,
  async (
    {
      patient,
      selectedNetwork,
      accountId,
      patientId,
      memberId,
      isRequesterRelationshipSelf,
      insurancePriority,
      insuranceId,
    },
    { dispatch }
  ) => {
    if (!accountId || !patientId) {
      return { isError: true };
    }

    const insurance = prepareInsuranceParams({
      memberId,
      isRequesterRelationshipSelf,
      selectedNetwork,
      patient,
      insurancePriority,
    });

    const insuranceResponse = !insuranceId
      ? await dispatch(
          patientAccountsSlice.endpoints.createInsurance.initiate({
            accountId,
            patientId,
            insuranceParams: insurance,
          })
        )
      : await dispatch(
          patientAccountsSlice.endpoints.updatePatientInsurance.initiate({
            accountId,
            patientId,
            insuranceParams: insurance,
            insuranceId,
          })
        );

    const isInsuranceResponseError =
      !!insuranceResponse && isQueryErrorResponse(insuranceResponse);

    const createInsuranceError =
      !insuranceId && isInsuranceResponseError ? insuranceResponse.error : null;

    const updateInsuranceError =
      insuranceId && isInsuranceResponseError ? insuranceResponse.error : null;

    if (isInsuranceResponseError) {
      return {
        isError: isInsuranceResponseError,
        createInsuranceError,
        updateInsuranceError,
      };
    }

    const insuranceData = insuranceResponse.data;

    const checkEligibilityResponse = insuranceData?.id
      ? await dispatch(
          checkEligibility({
            accountId,
            insuranceId: insuranceData.id.toString(),
            patientId,
          })
        )
      : null;

    const isCheckEligibilityError =
      !!checkEligibilityResponse &&
      isQueryErrorResponse(checkEligibilityResponse);

    const checkEligibilityError = isCheckEligibilityError
      ? checkEligibilityResponse.error
      : null;

    const insuranceWithEligibleStatus = !isCheckEligibilityError
      ? checkEligibilityResponse?.data
      : null;

    return {
      isError: isCheckEligibilityError,
      insuranceWithEligibleStatus,
      checkEligibilityError,
    };
  }
);

export const manageInsurancesSlice = createSlice({
  name: INSURANCES_SLICE_KEY,
  initialState: insurancesInitialState,
  reducers: {
    resetInsurance(state) {
      return { ...insurancesInitialState, isLoaded: state.isLoaded };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(checkInsuranceEligibility.pending, (state) => {
      state.insuranceEligibility = undefined;
      state.isLoading = true;
      state.isError = false;
      state.isSuccess = false;
      state.error = undefined;
    });
    builder.addCase(checkInsuranceEligibility.fulfilled, (state, action) => {
      state.insuranceId =
        action.payload.insuranceWithEligibleStatus?.id?.toString();
      state.insuranceEligibility =
        action.payload.insuranceWithEligibleStatus?.eligible;
      state.isLoading = false;
      state.isError = action.payload.isError;
      state.isSuccess = !action.payload.isError;
      state.error =
        action.payload.createInsuranceError ||
        action.payload.updateInsuranceError ||
        action.payload.checkEligibilityError;
    });
    builder.addMatcher(
      patientAccountsSlice.endpoints.getPatientInsurances.matchFulfilled,
      (state) => {
        state.isLoaded = true;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.getPatientInsurances.matchRejected,
      (state) => {
        state.isLoaded = true;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.deletePatientInsurance.matchPending,
      (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.deletePatientInsurance.matchFulfilled,
      (state) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      patientAccountsSlice.endpoints.deletePatientInsurance.matchRejected,
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
  },
});

export const checkEligibility = (query: PatientAccountCheckEligibilityQuery) =>
  patientAccountsSlice.endpoints.checkEligibility.initiate(query);

export const deleteInsurance = (query: DeletePatientInsuranceQuery) =>
  patientAccountsSlice.endpoints.deletePatientInsurance.initiate(query);

export const selectInsurancesData = (state: RootState) =>
  state[INSURANCES_SLICE_KEY];

export const selectInsuranceEligibility = createSelector(
  selectInsurancesData,
  (insuranceState) => insuranceState.insuranceEligibility
);

export const selectManageInsurancesLoadingState = createSelector(
  selectInsurancesData,
  ({ isLoading, isError, isSuccess, error, isLoaded }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
    isLoaded,
  })
);

export const selectPatientPrimaryInsurance = (
  query: GetPatientInsurancesQuery | SkipToken
) =>
  createSelector(
    selectPatientInsurances(query),
    ({ data: insurances = [] }) =>
      insurances.find(
        (insurance) => insurance.priority === PRIMARY_INSURANCE_PRIORITY
      ) ?? null
  );

export const selectPatientSecondaryInsurance = (
  query: GetPatientInsurancesQuery | SkipToken
) =>
  createSelector(
    selectPatientInsurances(query),
    ({ data: insurances = [] }) =>
      insurances.find(
        (insurance) => insurance.priority === SECONDARY_INSURANCE_PRIORITY
      ) ?? null
  );

export const selectPayersFromNetworksWithClassifications = (
  classificationIds?: string[]
) =>
  createSelector(
    [
      selectInsuranceNetworks(
        classificationIds
          ? {
              insuranceClassifications: classificationIds,
            }
          : {}
      ),
      selectInsuranceClassifications(),
    ],
    ({ data: insuranceNetworks }, { data: insuranceClassifications }) =>
      transformPayerWithClassificationName(
        transformNetworksToPayers(insuranceNetworks),
        insuranceClassifications
      )
  );

export const selectIsInsuranceAcuitySegmented = ({
  acuitySegmentationMarketShortNames,
  acuitySegmentationInsuranceClassificationIds,
  insuranceClassificationId,
}: {
  acuitySegmentationMarketShortNames: string[];
  acuitySegmentationInsuranceClassificationIds: number[];
  insuranceClassificationId?: string | number;
}) =>
  createSelector(
    (state: RootState) =>
      domainSelectMarket(state.manageSelfSchedule.data?.marketId || skipToken)(
        state
      ),
    ({ data: market }) => {
      if (!market?.shortName || !insuranceClassificationId) {
        return false;
      }

      return (
        acuitySegmentationMarketShortNames.includes(
          market.shortName.toString()
        ) &&
        acuitySegmentationInsuranceClassificationIds.includes(
          Number(insuranceClassificationId)
        )
      );
    }
  );

export const selectIsAnyPatientInsuranceAcuitySegmented = ({
  acuitySegmentationMarketShortNames,
  acuitySegmentationInsuranceClassificationIds,
}: {
  acuitySegmentationMarketShortNames: string[];
  acuitySegmentationInsuranceClassificationIds: number[];
}) =>
  createSelector(
    (state: RootState) => {
      const { data: patientAccount } = selectDomainPatientAccount(state);

      const unverifiedPatient = selectUnverifiedPatient()(state);

      const getPatientInsurancesQuery: GetPatientInsurancesQuery | SkipToken =
        patientAccount?.id && unverifiedPatient?.patientId
          ? {
              accountId: patientAccount.id,
              patientId: unverifiedPatient?.patientId,
            }
          : skipToken;

      const primaryInsurance = selectPatientPrimaryInsurance(
        getPatientInsurancesQuery
      )(state);

      return selectIsInsuranceAcuitySegmented({
        acuitySegmentationMarketShortNames,
        acuitySegmentationInsuranceClassificationIds,
        insuranceClassificationId:
          primaryInsurance?.insuranceNetwork?.insuranceClassificationId,
      })(state);
    },
    (isPrimaryInsuranceAcuitySegmented) => {
      return isPrimaryInsuranceAcuitySegmented;
    }
  );

export const selectIsPrimaryInsuranceOssEligible = createSelector(
  (state: RootState) => {
    const { data: patientAccount } = selectDomainPatientAccount(state);

    const unverifiedPatient = selectUnverifiedPatient()(state);

    const getPatientInsurancesQuery: GetPatientInsurancesQuery | SkipToken =
      patientAccount?.id && unverifiedPatient?.patientId
        ? {
            accountId: patientAccount.id,
            patientId: unverifiedPatient?.patientId,
          }
        : skipToken;

    return selectPatientPrimaryInsurance(getPatientInsurancesQuery)(state);
  },
  (primaryInsurance) => {
    return (
      !!primaryInsurance &&
      primaryInsurance.eligible !== InsuranceEligibilityStatus.Ineligible &&
      !!primaryInsurance.insuranceNetwork
    );
  }
);

export const { resetInsurance } = manageInsurancesSlice.actions;

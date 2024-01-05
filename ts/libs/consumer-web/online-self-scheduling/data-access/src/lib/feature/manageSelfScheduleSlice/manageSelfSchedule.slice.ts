import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
  isAnyOf,
} from '@reduxjs/toolkit';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import { format, startOfToday, startOfTomorrow } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import {
  SelectCheckMarketFeasibilityPayload,
  selfScheduleSlice,
  selectCheckMarketFeasibilityData,
  GetPatientQuery,
  selectDomainPatientAccount,
  domainSelectMarket,
} from '../../domain';
import { RootState } from '../../store';
import {
  CacheSelfScheduleDataPayload,
  CheckMarketFeasibilityPayload,
  CreateCareRequestPayload,
  MarketFeasibilityStatus,
  RelationToPatient,
  RequestStatus,
  UpdateCareRequestPayload,
  UpdateEtaRangesPayload,
} from '../../types';
import {
  selectIsAnyPatientInsuranceAcuitySegmented,
  selectIsPrimaryInsuranceOssEligible,
} from '../manageInsurancesSlice';
import {
  selectIsPatientDismissed,
  selectUnverifiedPatient,
} from '../managePatientDemographicsSlice';
import {
  CreateSelfSchedulingCareRequestPayload,
  ManageSelfScheduleState,
} from './types';
import { getOffboardReasonAndComment } from './utils';

export const MANAGE_SELF_SCHEDULE_SLICE_KEY = 'manageSelfSchedule';

export const manageSelfScheduleInitialState: ManageSelfScheduleState = {
  data: {},
};

export const manageSelfScheduleSlice = createSlice({
  name: MANAGE_SELF_SCHEDULE_SLICE_KEY,
  initialState: manageSelfScheduleInitialState,
  reducers: {
    updateSelfScheduleData(
      state,
      action: PayloadAction<Partial<ManageSelfScheduleState['data']>>
    ) {
      state.data = {
        ...state.data,
        ...action.payload,
      };
    },
    updateOffboardReason(
      state,
      action: PayloadAction<ManageSelfScheduleState['offboardReason']>
    ) {
      state.offboardReason = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      isAnyOf(
        selfScheduleSlice.endpoints.cacheSelfScheduleData.matchPending,
        selfScheduleSlice.endpoints.createNotificationJob.matchPending,
        updateEtaRangesAndCareRequestStatus.pending.match,
        createSelfSchedulingCareRequest.pending.match
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
        selfScheduleSlice.endpoints.cacheSelfScheduleData.matchRejected,
        selfScheduleSlice.endpoints.createNotificationJob.matchRejected
      ),
      (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.error = action.error;
      }
    );
    builder.addMatcher(
      selfScheduleSlice.endpoints.cacheSelfScheduleData.matchFulfilled,
      (state) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      selfScheduleSlice.endpoints.getCachedSelfScheduleData.matchFulfilled,
      (state, action) => {
        state.data = action.payload;
      }
    );
    builder.addMatcher(
      selfScheduleSlice.endpoints.createNotificationJob.matchFulfilled,
      (state, action) => {
        state.notificationJobId = action.payload.jobId;
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.error = undefined;
      }
    );
    builder.addMatcher(
      isAnyOf(
        updateEtaRangesAndCareRequestStatus.fulfilled.match,
        createSelfSchedulingCareRequest.fulfilled.match
      ),
      (state, action) => {
        const { isError } = action.payload;

        state.isLoading = false;
        state.isError = isError;
        state.isSuccess = !isError;
        state.error = undefined;
      }
    );
  },
});

export const updateCachedSelfScheduleData = createAsyncThunk<
  { isError: boolean },
  CacheSelfScheduleDataPayload
>(
  `${MANAGE_SELF_SCHEDULE_SLICE_KEY}/updateCachedSelfScheduleData`,
  async (data, { getState, dispatch }) => {
    const currentState = getState() as RootState;
    const selfScheduleData = selectSelfScheduleData(currentState) || {};

    const cacheSelfScheduleDataResponse = await dispatch(
      selfScheduleSlice.endpoints.cacheSelfScheduleData.initiate({
        ...selfScheduleData,
        ...data,
        requester: {
          ...selfScheduleData.requester,
          ...data.requester,
        },
        preferredEta: {
          ...selfScheduleData.preferredEta,
          ...data.preferredEta,
        },
      })
    );

    return { isError: isQueryErrorResponse(cacheSelfScheduleDataResponse) };
  }
);

export const updateEtaRangesAndCareRequestStatus = createAsyncThunk<
  { isError: boolean },
  Pick<UpdateEtaRangesPayload, 'startsAt' | 'endsAt'> &
    Pick<UpdateCareRequestPayload, 'assignmentDate'> & {
      careRequestId: number;
      careRequestStatusId: number;
    }
>(
  `${MANAGE_SELF_SCHEDULE_SLICE_KEY}/createEtaRanges`,
  async (
    { startsAt, endsAt, careRequestId, careRequestStatusId, assignmentDate },
    { dispatch }
  ) => {
    const updateEtaRangesResponse = await dispatch(
      selfScheduleSlice.endpoints.updateEtaRanges.initiate({
        startsAt: startsAt,
        endsAt: endsAt,
        careRequestId,
        careRequestStatusId,
      })
    );

    if (isQueryErrorResponse(updateEtaRangesResponse)) {
      return { isError: true };
    }

    const updateCareRequestStatusResponse = await dispatch(
      selfScheduleSlice.endpoints.updateCareRequestStatus.initiate({
        careRequestId: String(careRequestId),
        status: RequestStatus.accepted,
      })
    );

    if (isQueryErrorResponse(updateCareRequestStatusResponse)) {
      return { isError: true };
    }

    const updateCareRequestResponse = await dispatch(
      selfScheduleSlice.endpoints.updateCareRequest.initiate({
        assignmentDate,
      })
    );

    return { isError: isQueryErrorResponse(updateCareRequestResponse) };
  }
);

export const createSelfSchedulingCareRequest = createAsyncThunk<
  {
    isError: boolean;
    isRoutedToOffboard?: boolean;
    isRoutedToBookedTimeScreen?: boolean;
    isRoutedToCallScreen?: boolean;
    careRequestId?: number;
  },
  {
    createSelfSchedulingCareRequestPayload: CreateSelfSchedulingCareRequestPayload;
    acuitySegmentationMarketShortNames: string[];
    acuitySegmentationInsuranceClassificationIds: number[];
    isSymptomOSSEligible: boolean;
  }
>(
  `${MANAGE_SELF_SCHEDULE_SLICE_KEY}/createSelfSchedulingCareRequest`,
  async (
    {
      createSelfSchedulingCareRequestPayload,
      acuitySegmentationMarketShortNames,
      acuitySegmentationInsuranceClassificationIds,
      isSymptomOSSEligible,
    },
    { getState, dispatch }
  ) => {
    const currentState = getState() as RootState;

    const createCareRequestPayload: CreateCareRequestPayload = {
      ...createSelfSchedulingCareRequestPayload,
      mpoaConsent: {
        ...createSelfSchedulingCareRequestPayload.mpoaConsent,
        consented: true,
        timeOfConsentChange: new Date().toISOString(),
      },
    };

    const createCareRequestResponse = await dispatch(
      selfScheduleSlice.endpoints.createCareRequest.initiate(
        createCareRequestPayload
      )
    );

    const isCreateCareRequestResponseError = isQueryErrorResponse(
      createCareRequestResponse
    );

    if (isCreateCareRequestResponseError) {
      return { isError: true };
    }

    const { marketId } = createCareRequestResponse.data.careRequest;

    const { data: market } = domainSelectMarket(marketId ?? skipToken)(
      currentState
    );

    const marketTzName = market?.tzName || '';

    const careRequestId = Number(createCareRequestResponse.data.careRequest.id);

    const careRequestStatusId = Number(
      createCareRequestResponse.data.careRequest.activeStatus?.id
    );

    const cacheSelfScheduleDataResponse = await dispatch(
      updateCachedSelfScheduleData({
        careRequestId,
      })
    ).unwrap();

    const { data: patientAccount } = selectDomainPatientAccount(currentState);

    const unverifiedPatient = selectUnverifiedPatient()(currentState);

    const getPatientQuery: GetPatientQuery | SkipToken =
      patientAccount?.id && unverifiedPatient?.patientId
        ? {
            accountId: patientAccount.id,
            patientId: unverifiedPatient?.patientId,
          }
        : skipToken;

    const isDismissedPatient =
      selectIsPatientDismissed(getPatientQuery)(currentState);

    const isAcuitySegmentationEnabled = selectIsAcuitySegmentationEnabled({
      acuitySegmentationMarketShortNames,
      acuitySegmentationInsuranceClassificationIds,
    })(currentState);

    const isPrimaryInsuranceOssEligible =
      selectIsPrimaryInsuranceOssEligible(currentState);

    if (
      (!isPrimaryInsuranceOssEligible || !isSymptomOSSEligible) &&
      !isDismissedPatient &&
      !isAcuitySegmentationEnabled
    ) {
      const createNotificationJobResponse = await dispatch(
        selfScheduleSlice.endpoints.createNotificationJob.initiate(
          careRequestId
        )
      );

      const isCreateNotificationJobResponseError = isQueryErrorResponse(
        createNotificationJobResponse
      );

      return {
        isError:
          cacheSelfScheduleDataResponse.isError ||
          isCreateNotificationJobResponseError,
        isRoutedToCallScreen: true,
        careRequestId,
      };
    }

    const checkMarketFeasibilityTodayPayload:
      | CheckMarketFeasibilityPayload
      | SkipToken = {
      marketId,
      careRequestId,
      date: format(zonedTimeToUtc(startOfToday(), marketTzName), 'MM-dd-yyyy'),
    };

    const checkMarketFeasibilityTomorrowPayload:
      | CheckMarketFeasibilityPayload
      | SkipToken = {
      marketId,
      careRequestId,
      date: format(
        zonedTimeToUtc(startOfTomorrow(), marketTzName),
        'MM-dd-yyyy'
      ),
    };

    const checkTodayMarketFeasibilityResponse = await dispatch(
      selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
        checkMarketFeasibilityTodayPayload
      )
    );

    const checkTomorrowMarketFeasibilityResponse = await dispatch(
      selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
        checkMarketFeasibilityTomorrowPayload
      )
    );

    if (
      !checkTodayMarketFeasibilityResponse.data?.availability ||
      !checkTomorrowMarketFeasibilityResponse.data?.availability
    ) {
      return { isError: true };
    }

    const isMarketFullyBooked =
      checkTodayMarketFeasibilityResponse.data.availability ===
        MarketFeasibilityStatus.Unavailable &&
      checkTomorrowMarketFeasibilityResponse.data.availability ===
        MarketFeasibilityStatus.Unavailable;

    if (
      isDismissedPatient ||
      isAcuitySegmentationEnabled ||
      isMarketFullyBooked
    ) {
      const { reason, comment } = getOffboardReasonAndComment({
        isDismissedPatient,
        isAcuitySegmentationEnabled,
      });

      const updateCareRequestStatus = await dispatch(
        selfScheduleSlice.endpoints.updateCareRequestStatus.initiate({
          careRequestId: String(careRequestId),
          status: RequestStatus.archived,
          comment,
        })
      );

      const isUpdateCareRequestStatusError = isQueryErrorResponse(
        updateCareRequestStatus
      );

      if (isUpdateCareRequestStatusError) {
        return { isError: true };
      }

      dispatch(updateOffboardReason(reason));

      return { isError: false, isRoutedToOffboard: true, careRequestId };
    }

    if (
      !createSelfSchedulingCareRequestPayload.careRequest.patientPreferredEta
        ?.patientPreferredEtaStart ||
      !createSelfSchedulingCareRequestPayload.careRequest.patientPreferredEta
        ?.patientPreferredEtaEnd
    ) {
      return {
        isError: false,
        isRoutedToBookedTimeScreen: true,
        careRequestId,
      };
    }

    const startDateAndTime = zonedTimeToUtc(
      createSelfSchedulingCareRequestPayload.careRequest.patientPreferredEta
        .patientPreferredEtaStart,
      marketTzName
    );

    const endDateAndTime = zonedTimeToUtc(
      createSelfSchedulingCareRequestPayload.careRequest.patientPreferredEta
        .patientPreferredEtaEnd,
      marketTzName
    );

    const startTime = startDateAndTime.getTime();
    const endTime = endDateAndTime.getTime();

    const checkMarketFeasibilityPayload:
      | CheckMarketFeasibilityPayload
      | SkipToken = {
      marketId: Number(createCareRequestResponse.data.careRequest.marketId),
      careRequestId: careRequestId,
      date: format(startDateAndTime, 'MM-dd-yyyy'),
      startTimeSec: startTime / 1000,
      endTimeSec: endTime / 1000,
    };

    const checkMarketFeasibilityResponse = await dispatch(
      selfScheduleSlice.endpoints.checkMarketFeasibility.initiate(
        checkMarketFeasibilityPayload
      )
    );

    const isPreferredTimeBooked =
      !checkMarketFeasibilityResponse.data?.availability ||
      checkMarketFeasibilityResponse.data.availability ===
        MarketFeasibilityStatus.Unavailable;

    if (isPreferredTimeBooked) {
      return {
        isError: false,
        isRoutedToBookedTimeScreen: true,
        careRequestId,
      };
    }

    const updateEtaRangesAndCareRequestStatusResponse = await dispatch(
      updateEtaRangesAndCareRequestStatus({
        startsAt: new Date(startTime).toISOString(),
        endsAt: new Date(endTime).toISOString(),
        careRequestId,
        careRequestStatusId,
        assignmentDate: format(startDateAndTime, 'yyyy-MM-dd'),
      })
    ).unwrap();

    return {
      isError: updateEtaRangesAndCareRequestStatusResponse.isError,
      careRequestId,
    };
  }
);

export const selectManageSelfScheduleState = (state: RootState) =>
  state[MANAGE_SELF_SCHEDULE_SLICE_KEY];

export const selectManageSelfScheduleLoadingState = createSelector(
  selectManageSelfScheduleState,
  ({ isLoading, isError, isSuccess, error }) => ({
    isLoading,
    isError,
    isSuccess,
    error,
  })
);

export const selectSelfScheduleData = createSelector(
  selectManageSelfScheduleState,
  (manageSelfScheduleState) => manageSelfScheduleState.data
);

export const selectIsRequesterRelationshipSelf = createSelector(
  selectSelfScheduleData,
  (selfScheduleData) =>
    selfScheduleData?.requester?.relationToPatient === RelationToPatient.Patient
);

export const selectIsRequesterRelationshipAcuityExcluded = createSelector(
  selectSelfScheduleData,
  (selfScheduleData) =>
    selfScheduleData?.requester?.relationToPatient ===
      RelationToPatient.Clinician ||
    selfScheduleData?.requester?.relationToPatient ===
      RelationToPatient.FamilyFriend
);

export const selectNotificationJobId = createSelector(
  selectManageSelfScheduleState,
  (manageSelfScheduleState) => manageSelfScheduleState.notificationJobId
);

export const selectOffboardReason = createSelector(
  selectManageSelfScheduleState,
  (manageSelfScheduleState) => manageSelfScheduleState.offboardReason
);

export const selectMarketFeasibilityLoadingData = (
  payload: SelectCheckMarketFeasibilityPayload
) =>
  createSelector(
    selectCheckMarketFeasibilityData(payload),
    ({ isSuccess, isError, isLoading, error }) => ({
      isLoading,
      isError,
      isSuccess,
      error,
    })
  );

export const selectMarketFeasibilityStatus = (
  payload: SelectCheckMarketFeasibilityPayload
) =>
  createSelector(selectCheckMarketFeasibilityData(payload), ({ data }) => ({
    availabilityStatus: data?.availability,
  }));

export const selectIsAcuitySegmentationEnabled = ({
  acuitySegmentationMarketShortNames,
  acuitySegmentationInsuranceClassificationIds,
}: {
  acuitySegmentationMarketShortNames: string[];
  acuitySegmentationInsuranceClassificationIds: number[];
}) =>
  createSelector(
    selectIsRequesterRelationshipAcuityExcluded,
    selectIsAnyPatientInsuranceAcuitySegmented({
      acuitySegmentationMarketShortNames,
      acuitySegmentationInsuranceClassificationIds,
    }),
    (
      isRequesterRelationshipAcuityExcluded,
      isPatientInsurancesAcuitySegmented
    ) => {
      return (
        isPatientInsurancesAcuitySegmented &&
        !isRequesterRelationshipAcuityExcluded
      );
    }
  );

export const { updateSelfScheduleData, updateOffboardReason } =
  manageSelfScheduleSlice.actions;

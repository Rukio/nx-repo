import { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitHandler, useForm } from 'react-hook-form';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import { useSelector } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import { ValidationError } from 'yup';
import { logError } from '@*company-data-covered*/shared/datadog/util';
import {
  ConfirmDetailsForm,
  ConfirmDetailsFormFieldValues,
  LoadingSection,
  PageLayout,
  PageLayoutProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import {
  createSelfSchedulingCareRequest,
  CreateSelfSchedulingCareRequestPayload,
  domainSelectMarket,
  GetAccountPatientsQuery,
  GetPatientInsurancesQuery,
  GetPatientQuery,
  GetRiskStratificationProtocolQuery,
  prepareCreateSelfSchedulingCareRequestPayload,
  selectDomainChannelItem,
  selectDomainPatientAccount,
  selectDomainPatientAccountPatients,
  selectFormattedPatientAddress,
  selectIsRequesterRelationshipSelf,
  selectManageSelfScheduleLoadingState,
  selectPatient,
  selectPatientAddress,
  selectPatientInsurances,
  selectPatientPrimaryInsurance,
  selectPatientSecondaryInsurance,
  selectRiskStratificationProtocol,
  selectSelfScheduleData,
  selectUnverifiedPatient,
  useAppDispatch,
  useGetAccountPatientsQuery,
  useGetAccountQuery,
  useGetAddressesQuery,
  useGetCachedSelfScheduleDataQuery,
  useGetChannelItemQuery,
  useGetMarketQuery,
  useGetPatientInsurancesQuery,
  useGetPatientQuery,
  useGetRiskStratificationProtocolQuery,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  confirmDetailsFormSchema,
  createSelfSchedulingCareRequestPayloadSchema,
  getAboutPatientDetails,
  getAboutYouDetails,
  getAppointmentDetails,
  getInsuranceDetails,
} from './utils';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  getAcuitySegmentationMarketClassifications,
  getStructuredSymptomBySelectedSymptoms,
} from '../utils/statsig';
import { getRiskAssessmentOptionsByStructuredSymptom } from '../utils/riskAssessment/riskAssessment';

const backButtonOptions: PageLayoutProps['backButtonOptions'] = {
  text: 'Insurance',
  link: ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE,
};

export const ConfirmDetails: FC = () => {
  const navigate = useNavigate();
  const segment = useSegment();
  const dispatch = useAppDispatch();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_CONFIRM_DETAILS);
  }, [segment]);

  const { isLoading: isManageSelfScheduleLoading } = useSelector(
    selectManageSelfScheduleLoadingState
  );

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );

  useGetCachedSelfScheduleDataQuery();

  const selfScheduleData = useSelector(selectSelfScheduleData);

  useGetAccountQuery();

  const { data: patientAccount, isLoading: isPatientAccountLoading } =
    useSelector(selectDomainPatientAccount);

  const accountPatientsQuery: GetAccountPatientsQuery | SkipToken =
    patientAccount?.id ? { id: patientAccount.id } : skipToken;

  useGetAccountPatientsQuery(accountPatientsQuery);

  const unverifiedPatient = useSelector(selectUnverifiedPatient());

  const { isLoading: isAccountPatientsLoading } = useSelector(
    selectDomainPatientAccountPatients(accountPatientsQuery)
  );

  useGetAddressesQuery(patientAccount?.id || skipToken);

  const getPatientQuery: GetPatientQuery | SkipToken =
    patientAccount?.id && unverifiedPatient?.patientId
      ? {
          accountId: patientAccount.id,
          patientId: unverifiedPatient?.patientId,
        }
      : skipToken;

  useGetPatientQuery(getPatientQuery);

  const { isLoading: isPatientLoading, data: patient } = useSelector(
    selectPatient(getPatientQuery)
  );

  const getChannelItemQuery = selfScheduleData?.channelItemId || skipToken;

  useGetChannelItemQuery(getChannelItemQuery, {
    refetchOnMountOrArgChange: true,
  });

  const { data: channelItem, isLoading: isChannelItemLoading } = useSelector(
    selectDomainChannelItem(getChannelItemQuery)
  );

  const patientAddress = useSelector(selectPatientAddress());

  const formattedAddress = useSelector(selectFormattedPatientAddress());

  const getPatientInsurancesQuery: GetPatientInsurancesQuery | SkipToken =
    patientAccount?.id && unverifiedPatient?.patientId
      ? {
          accountId: patientAccount.id,
          patientId: unverifiedPatient.patientId,
        }
      : skipToken;

  useGetPatientInsurancesQuery(getPatientInsurancesQuery);

  const { isLoading: isPatientInsurancesLoading } = useSelector(
    selectPatientInsurances(getPatientInsurancesQuery)
  );

  const primaryInsurance = useSelector(
    selectPatientPrimaryInsurance(getPatientInsurancesQuery)
  );

  const secondaryInsurance = useSelector(
    selectPatientSecondaryInsurance(getPatientInsurancesQuery)
  );

  const acuitySegmentationMarketClassifications =
    getAcuitySegmentationMarketClassifications();

  const getMarketQuery = selfScheduleData?.marketId ?? skipToken;

  useGetMarketQuery(getMarketQuery);

  const { isLoading: isMarketLoading } = useSelector(
    domainSelectMarket(getMarketQuery)
  );

  const structuredSymptom = getStructuredSymptomBySelectedSymptoms(
    selfScheduleData?.symptoms
  );

  const getRiskStratificationProtocolQuery:
    | GetRiskStratificationProtocolQuery
    | SkipToken =
    structuredSymptom?.legacy_rs_protocol_id &&
    unverifiedPatient?.legalSex &&
    unverifiedPatient.dateOfBirth
      ? {
          id: structuredSymptom.legacy_rs_protocol_id.toString(),
          dob: unverifiedPatient.dateOfBirth,
          gender: unverifiedPatient.legalSex,
        }
      : skipToken;

  useGetRiskStratificationProtocolQuery(getRiskStratificationProtocolQuery);

  const {
    data: riskStratificationProtocol,
    isLoading: isRiskStratificationProtocolLoading,
  } = useSelector(
    selectRiskStratificationProtocol(getRiskStratificationProtocolQuery)
  );

  const { control, formState, handleSubmit } =
    useForm<ConfirmDetailsFormFieldValues>({
      mode: 'onTouched',
      resolver: yupResolver(confirmDetailsFormSchema),
      defaultValues: {
        isConsented: false,
      },
    });

  const onSubmit: SubmitHandler<ConfirmDetailsFormFieldValues> = async () => {
    const { isRiskAssessmentRequired, riskAssessmentScore } =
      getRiskAssessmentOptionsByStructuredSymptom(structuredSymptom);

    const createSelfSchedulingCareRequestPayload: CreateSelfSchedulingCareRequestPayload =
      prepareCreateSelfSchedulingCareRequestPayload({
        powerOfAttorneyId: patient?.powerOfAttorney?.id,
        unverifiedPatient,
        patientAddress,
        selfScheduleData,
        patientAccount,
        riskStratificationProtocol,
        isRiskAssessmentRequired,
        riskAssessmentScore,
        isRequesterRelationshipSelf,
        channelItem,
      });

    try {
      await createSelfSchedulingCareRequestPayloadSchema.validate(
        createSelfSchedulingCareRequestPayload
      );

      dispatch(
        createSelfSchedulingCareRequest({
          acuitySegmentationInsuranceClassificationIds:
            acuitySegmentationMarketClassifications.classifications,
          acuitySegmentationMarketShortNames:
            acuitySegmentationMarketClassifications.markets,
          createSelfSchedulingCareRequestPayload,
          isSymptomOSSEligible: !!structuredSymptom?.is_oss_eligible,
        })
      )
        .unwrap()
        .then(
          ({
            isError,
            isRoutedToBookedTimeScreen,
            isRoutedToOffboard,
            isRoutedToCallScreen,
            careRequestId,
          }) => {
            if (careRequestId) {
              segment.track(SEGMENT_EVENTS.CONFIRM_CARE_REQUEST_CREATED, {
                [SEGMENT_EVENTS.CONFIRM_CARE_REQUEST_CREATED]: careRequestId,
              });
            }
            if (isRoutedToOffboard) {
              navigate(ONLINE_SELF_SCHEDULING_ROUTES.OFFBOARD, {
                replace: true,
              });
            } else if (isRoutedToBookedTimeScreen) {
              navigate(ONLINE_SELF_SCHEDULING_ROUTES.BOOKED_TIME, {
                replace: true,
              });
            } else if (isRoutedToCallScreen) {
              navigate(ONLINE_SELF_SCHEDULING_ROUTES.CALL_SCREENER, {
                replace: true,
              });
            } else if (!isError) {
              navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRMATION, {
                replace: true,
              });
            }
          }
        );
    } catch (error) {
      logError(
        `[Confirm Details] Submit CR validation failed: ${
          (error as ValidationError).message
        }`
      );
    }
  };

  const aboutYouDetails = getAboutYouDetails({
    isRequesterRelationshipSelf,
    unverifiedPatient,
    patientAccount,
  });

  const aboutPatientDetails = getAboutPatientDetails({
    isRequesterRelationshipSelf,
    unverifiedPatient,
  });

  const appointmentDetails = getAppointmentDetails({
    selfScheduleData,
    formattedAddress,
  });

  const primaryInsuranceDetails = getInsuranceDetails({
    insurance: primaryInsurance,
  });

  const secondaryInsuranceDetails = getInsuranceDetails({
    insurance: secondaryInsurance,
  });

  const formHeaderSubtitle = isRequesterRelationshipSelf
    ? 'One last step! Please review your details below before booking your appointment.'
    : 'One last step! Please review the details below before booking the appointment.';

  const isLoading =
    isPatientAccountLoading ||
    isPatientInsurancesLoading ||
    isAccountPatientsLoading ||
    isPatientLoading ||
    isRiskStratificationProtocolLoading ||
    isMarketLoading ||
    isChannelItemLoading;

  if (isManageSelfScheduleLoading) {
    const loadingSectionTitle = isRequesterRelationshipSelf
      ? 'Finding your care team'
      : 'Finding a care team';

    const loadingSectionSubtitle = isRequesterRelationshipSelf
      ? 'Based on your details, we’re finding the best team to come to you.'
      : 'Based on the patient’s details, we’re finding the best medical team to come to them.';

    return (
      <LoadingSection
        title={loadingSectionTitle}
        subtitle={loadingSectionSubtitle}
      />
    );
  }

  return (
    <PageLayout
      stepProgress={RequestProgressStep.ConfirmDetails}
      backButtonOptions={backButtonOptions}
      isLoading={isLoading}
    >
      <ConfirmDetailsForm
        formHeaderSubtitle={formHeaderSubtitle}
        aboutYouDetails={aboutYouDetails}
        appointmentDetails={appointmentDetails}
        primaryInsuranceDetails={primaryInsuranceDetails}
        secondaryInsuranceDetails={secondaryInsuranceDetails}
        aboutPatientDetails={aboutPatientDetails}
        isSubmitButtonDisabled={!formState.isValid}
        onSubmit={handleSubmit(onSubmit)}
        formControl={control}
      />
    </PageLayout>
  );
};

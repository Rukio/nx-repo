import { FC, useEffect } from 'react';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import {
  ConsentForm,
  ConsentFormFieldValues,
  ConsentFormProps,
  DefaultConsentQuestionAnswer,
  MedicalDecisionMakerQuestionAnswer,
  PageLayout,
  PageLayoutProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import {
  GetAccountPatientsQuery,
  GetPatientQuery,
  selectDomainPatientAccount,
  selectDomainPatientAccountPatients,
  selectIsRequesterRelationshipSelf,
  selectPatient,
  selectUnverifiedPatient,
  cachePatientPOA,
  useAppDispatch,
  useGetAccountPatientsQuery,
  useGetAccountQuery,
  useGetPatientQuery,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  comparePatientNameToPOAName,
  consentFormSchema,
  consentFormWithNonSelfRequesterRelationSchema,
} from './utils';
import { Patient } from '@*company-data-covered*/consumer-web-types';

const backButtonOptions: PageLayoutProps['backButtonOptions'] = {
  text: 'About you',
  link: ONLINE_SELF_SCHEDULING_ROUTES.PATIENT_DEMOGRAPHICS,
};

export const getAlertOptions = (
  isRelationshipSelf: boolean
): ConsentFormProps['alertOptions'] => {
  if (isRelationshipSelf) {
    return {
      message:
        'Sorry, we can only book an appointment if your medical decision maker will be present.',
    };
  }

  return {
    title:
      'Sorry, we can only book an appointment if the patient’s medical decision maker will be present.',
    message:
      'Our recommendation is that you go to your nearest urgent care or contact your primary care provider.',
  };
};

const defaultConsentFormFieldValues: Required<ConsentFormFieldValues> = {
  firstConsentQuestion: '',
  secondConsentQuestion: '',
  thirdConsentQuestion: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
};

export const Consent: FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const segment = useSegment();

  useGetAccountQuery();

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );

  useGetAccountQuery();

  const { data: patientAccount, isLoading: isPatientAccountLoading } =
    useSelector(selectDomainPatientAccount);

  const accountPatientsQuery: GetAccountPatientsQuery | SkipToken =
    patientAccount?.id ? { id: patientAccount.id } : skipToken;

  useGetAccountPatientsQuery(accountPatientsQuery);

  const { isLoading: isAccountPatientsLoading } = useSelector(
    selectDomainPatientAccountPatients(accountPatientsQuery)
  );

  const unverifiedPatient = useSelector(selectUnverifiedPatient());

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

  const patientPOA: Patient['powerOfAttorney'] = patient?.powerOfAttorney;

  const isPatientPOADataExist = Boolean(patientPOA?.id);

  const patientPOAName = patientPOA?.name ?? '';

  const patientFullname = `${patient?.firstName} ${patient?.lastName}`;

  const patientAccountName = `${patientAccount?.firstName} ${patientAccount?.lastName}`;

  const patientIsDecisionMakerDefaultAnswer =
    patient && comparePatientNameToPOAName(patientFullname, patientPOAName)
      ? DefaultConsentQuestionAnswer.Yes
      : DefaultConsentQuestionAnswer.No;

  const requesterIsDecisionMakerDefaultAnswer = comparePatientNameToPOAName(
    patientAccountName,
    patientPOAName
  )
    ? MedicalDecisionMakerQuestionAnswer.Me
    : MedicalDecisionMakerQuestionAnswer.SomeoneElse;

  const { control, handleSubmit, reset, getValues, formState } =
    useForm<ConsentFormFieldValues>({
      mode: 'onTouched',
      resolver: yupResolver(
        isRequesterRelationshipSelf
          ? consentFormSchema
          : consentFormWithNonSelfRequesterRelationSchema
      ),
      values: {
        firstConsentQuestion: isPatientPOADataExist
          ? patientIsDecisionMakerDefaultAnswer
          : defaultConsentFormFieldValues.firstConsentQuestion,
        secondConsentQuestion: isPatientPOADataExist
          ? DefaultConsentQuestionAnswer.Yes
          : defaultConsentFormFieldValues.secondConsentQuestion,
        thirdConsentQuestion: isPatientPOADataExist
          ? requesterIsDecisionMakerDefaultAnswer
          : defaultConsentFormFieldValues.thirdConsentQuestion,
        firstName:
          patientPOAName?.split(' ')[0] ??
          defaultConsentFormFieldValues.firstName,
        lastName:
          patientPOAName?.split(' ')[1] ??
          defaultConsentFormFieldValues.lastName,
        phoneNumber:
          patientPOA?.phone ?? defaultConsentFormFieldValues.phoneNumber,
      },
    });

  const [
    firstConsentQuestionValue,
    secondConsentQuestionValue,
    thirdConsentQuestionValue,
  ] = useWatch({
    control,
    name: [
      'firstConsentQuestion',
      'secondConsentQuestion',
      'thirdConsentQuestion',
    ],
  });

  useEffect(() => {
    if (firstConsentQuestionValue === DefaultConsentQuestionAnswer.Yes) {
      reset(
        {
          ...getValues(),
          secondConsentQuestion:
            defaultConsentFormFieldValues.secondConsentQuestion,
          thirdConsentQuestion:
            defaultConsentFormFieldValues.thirdConsentQuestion,
          firstName: defaultConsentFormFieldValues.firstName,
          lastName: defaultConsentFormFieldValues.lastName,
          phoneNumber: defaultConsentFormFieldValues.phoneNumber,
        },
        { keepDefaultValues: true }
      );
    } else if (secondConsentQuestionValue === DefaultConsentQuestionAnswer.No) {
      reset(
        {
          ...getValues(),
          thirdConsentQuestion:
            defaultConsentFormFieldValues.thirdConsentQuestion,
          firstName: defaultConsentFormFieldValues.firstName,
          lastName: defaultConsentFormFieldValues.lastName,
          phoneNumber: defaultConsentFormFieldValues.phoneNumber,
        },
        { keepDefaultValues: true }
      );
    }
  }, [firstConsentQuestionValue, reset, secondConsentQuestionValue, getValues]);

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_CONSENT);
  }, [segment]);

  const isSecondQuestionDisplayed =
    firstConsentQuestionValue === DefaultConsentQuestionAnswer.No;

  const isThirdQuestionDisplayed =
    secondConsentQuestionValue === DefaultConsentQuestionAnswer.Yes &&
    !isRequesterRelationshipSelf;

  const isMedicalDecisionMakerSectionDisplayed = isRequesterRelationshipSelf
    ? secondConsentQuestionValue === DefaultConsentQuestionAnswer.Yes
    : thirdConsentQuestionValue ===
      MedicalDecisionMakerQuestionAnswer.SomeoneElse;

  const isSubmitButtonDisplayed =
    secondConsentQuestionValue !== DefaultConsentQuestionAnswer.No;

  const isAlertDisplayed =
    secondConsentQuestionValue === DefaultConsentQuestionAnswer.No;

  const alertOptions = getAlertOptions(isRequesterRelationshipSelf);

  const onSubmit: SubmitHandler<ConsentFormFieldValues> = (data) => {
    if (!isSecondQuestionDisplayed) {
      segment.track(SEGMENT_EVENTS.CONSENT_MAKER_SELECTION, {
        [SEGMENT_EVENTS.CONSENT_MAKER_SELECTION]:
          MedicalDecisionMakerQuestionAnswer.Me,
      });
    } else {
      segment.track(SEGMENT_EVENTS.CONSENT_ON_SCENE_SELECTION, {
        [SEGMENT_EVENTS.CONSENT_ON_SCENE_SELECTION]: data.secondConsentQuestion,
      });

      if (isThirdQuestionDisplayed) {
        segment.track(SEGMENT_EVENTS.CONSENT_MAKER_SELECTION, {
          [SEGMENT_EVENTS.CONSENT_MAKER_SELECTION]: data.thirdConsentQuestion,
        });
      }
    }

    const isPatientDecisionMaker =
      data.firstConsentQuestion === DefaultConsentQuestionAnswer.Yes;

    dispatch(
      cachePatientPOA({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phoneNumber: data.phoneNumber ?? '',
        isPatientDecisionMaker,
      })
    )
      .unwrap()
      .then(({ isError }) => {
        if (!isError) {
          navigate(ONLINE_SELF_SCHEDULING_ROUTES.ADDRESS);
        }
      });
  };

  const isPageLoading =
    isPatientAccountLoading || isAccountPatientsLoading || isPatientLoading;

  return (
    <PageLayout
      stepProgress={RequestProgressStep.Consent}
      backButtonOptions={backButtonOptions}
      isLoading={isPageLoading}
    >
      <ConsentForm
        isFirstQuestionDisplayed
        isSecondQuestionDisplayed={isSecondQuestionDisplayed}
        isThirdQuestionDisplayed={isThirdQuestionDisplayed}
        isMedicalDecisionMakerSectionDisplayed={
          isMedicalDecisionMakerSectionDisplayed
        }
        isSubmitButtonDisabled={!formState.isValid}
        isSubmitButtonDisplayed={isSubmitButtonDisplayed}
        isAlertDisplayed={isAlertDisplayed}
        isRelationToPatientSelf={isRequesterRelationshipSelf}
        alertOptions={alertOptions}
        onSubmit={handleSubmit(onSubmit)}
        formControl={control}
      />
    </PageLayout>
  );
};

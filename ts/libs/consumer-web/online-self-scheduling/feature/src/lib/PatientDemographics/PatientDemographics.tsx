import { FC, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { skipToken, SkipToken } from '@reduxjs/toolkit/query';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  selectIsRequesterRelationshipSelf,
  useGetAccountQuery,
  useAppDispatch,
  updatePatientDemographics,
  selectManagePatientDemographicsLoadingState,
  GetAccountPatientsQuery,
  selectDomainPatientAccount,
  selectDomainPatientAccountPatients,
  selectSelfScheduleData,
  updateCachedSelfScheduleData,
  useGetAccountPatientsQuery,
  useGetCachedSelfScheduleDataQuery,
  selectManageSelfScheduleLoadingState,
  PatientAccountPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  PageLayout,
  PatientDemographicsForm,
  PatientDemographicsFormFieldValues,
  PatientDemographicsFormProps,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { Alert } from '@*company-data-covered*/design-system';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import {
  LEGAL_SEX_OPTIONS,
  ASSIGNED_SEX_AT_BIRTH_OPTIONS,
  GENDER_IDENTITY_OPTIONS,
} from './constants';
import {
  ADD_SOMEONE_ELSE_OPTION,
  getPatientDemographicsFormSchema,
  getPatientDemographicsFormWithNonSelfRelationshipSchema,
  isGenderIdentityOtherSelected,
} from './utils';

const getFormHeaderTitle = ({
  isReturningPatient,
  patientAccountFirstName = '',
  isRequesterRelationshipSelf,
}: {
  isReturningPatient: boolean;
  patientAccountFirstName?: string;
  isRequesterRelationshipSelf: boolean;
}) => {
  if (isReturningPatient) {
    return patientAccountFirstName
      ? `Welcome back, ${patientAccountFirstName}`
      : 'Welcome back';
  }
  if (isRequesterRelationshipSelf) {
    return 'Tell us more about yourself';
  }

  return 'Tell us more about the patient';
};

const getRelationshipToPatientOptions = (
  accountPatients: PatientAccountPatient[] = []
): PatientDemographicsFormProps['relationshipToPatientOptions'] => {
  return [
    ...accountPatients.map(({ unverifiedPatient, id }) => ({
      value: id?.toString() ?? '',
      label: `${unverifiedPatient?.givenName ?? ''} ${
        unverifiedPatient?.familyName ?? ''
      }`,
    })),
    { label: ADD_SOMEONE_ELSE_OPTION, value: ADD_SOMEONE_ELSE_OPTION },
  ];
};

export const PatientDemographics: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const segment = useSegment();

  useGetAccountQuery();

  const { data: patientAccount, isLoading: isPatientAccountLoading } =
    useSelector(selectDomainPatientAccount);

  const accountPatientsQuery: GetAccountPatientsQuery | SkipToken =
    patientAccount?.id ? { id: patientAccount.id } : skipToken;

  useGetAccountPatientsQuery(accountPatientsQuery);

  const { data: accountPatients, isLoading: isAccountPatientsLoading } =
    useSelector(selectDomainPatientAccountPatients(accountPatientsQuery));

  useGetCachedSelfScheduleDataQuery();

  const selfScheduleData = useSelector(selectSelfScheduleData);

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_PATIENT_DEMOGRAPHICS);
  }, [segment]);

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );

  const { isLoading: isManagePatientDemographicsLoading } = useSelector(
    selectManagePatientDemographicsLoadingState
  );

  const { isLoading: isManageSelfScheduleLoading } = useSelector(
    selectManageSelfScheduleLoadingState
  );

  const patientDemographicsFormSchema = isRequesterRelationshipSelf
    ? getPatientDemographicsFormSchema({ accountPatients })
    : getPatientDemographicsFormWithNonSelfRelationshipSchema({
        accountPatients,
      });

  const [isSexAndGenderDetailsExpanded, setSexAndGenderDetailsExpanded] =
    useState(false);

  const onClickAddSexAndGenderDetails = () => {
    setSexAndGenderDetailsExpanded((prev) => !prev);
  };

  const { control, handleSubmit, formState } =
    useForm<PatientDemographicsFormFieldValues>({
      mode: 'onTouched',
      resolver: yupResolver(patientDemographicsFormSchema),
      defaultValues: {
        selectedPatientId: selfScheduleData?.patientId?.toString() || '',
        requesterFirstName: '',
        requesterLastName: '',
        requesterPhone: '',
        patientFirstName: '',
        patientLastName: '',
        patientMiddleName: '',
        patientSuffix: '',
        patientPhone: '',
        birthday: '',
        legalSex: '',
        assignedSexAtBirth: '',
        genderIdentity: '',
      },
    });

  const selectedPatientIdValue = useWatch<
    PatientDemographicsFormFieldValues,
    'selectedPatientId'
  >({
    control,
    name: 'selectedPatientId',
  });

  const genderIdentityValue = useWatch<
    PatientDemographicsFormFieldValues,
    'genderIdentity'
  >({
    control,
    name: 'genderIdentity',
  });

  const onSubmitSuccess = () => {
    navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONSENT);
  };

  const onSubmit: SubmitHandler<PatientDemographicsFormFieldValues> = (
    data
  ) => {
    if (
      data.selectedPatientId &&
      data.selectedPatientId !== ADD_SOMEONE_ELSE_OPTION
    ) {
      dispatch(
        updateCachedSelfScheduleData({
          patientId: +data.selectedPatientId,
        })
      )
        .unwrap()
        .then(({ isError }) => {
          if (!isError) {
            onSubmitSuccess();
          }
        });
    } else {
      dispatch(updatePatientDemographics(data))
        .unwrap()
        .then(({ isError }) => {
          if (!isError) {
            onSubmitSuccess();
          }
        });
    }
  };

  const isReturningPatient = !!accountPatients?.length;

  const formHeaderTitle = getFormHeaderTitle({
    isReturningPatient,
    isRequesterRelationshipSelf,
    patientAccountFirstName: patientAccount?.firstName,
  });

  const formHeaderSubtitle = isReturningPatient
    ? 'Who are you requesting care for?'
    : undefined;

  const isReturningPatientSectionVisible = isReturningPatient;

  const isFieldsSectionVisible =
    !isReturningPatient || selectedPatientIdValue === ADD_SOMEONE_ELSE_OPTION;

  const relationshipToPatientOptions =
    getRelationshipToPatientOptions(accountPatients);

  const isRequesterSectionVisible =
    !isRequesterRelationshipSelf && isFieldsSectionVisible;

  const isPatientSectionVisible = isFieldsSectionVisible;

  const isSubmitButtonLoading =
    isManagePatientDemographicsLoading || isManageSelfScheduleLoading;

  const isLoading = isPatientAccountLoading || isAccountPatientsLoading;

  const isGenderIdentityDetailsFieldVisible =
    isGenderIdentityOtherSelected(genderIdentityValue);

  return (
    <PageLayout
      stepProgress={RequestProgressStep.PatientDemographics}
      message={<Alert message="Email verified!" />}
      isLoading={isLoading}
    >
      <PatientDemographicsForm
        formHeaderTitle={formHeaderTitle}
        formHeaderSubtitle={formHeaderSubtitle}
        formControl={control}
        legalSexOptions={LEGAL_SEX_OPTIONS}
        assignedSexAtBirthOptions={ASSIGNED_SEX_AT_BIRTH_OPTIONS}
        genderIdentityOptions={GENDER_IDENTITY_OPTIONS}
        relationshipToPatientOptions={relationshipToPatientOptions}
        isSexAndGenderDetailsExpanded={isSexAndGenderDetailsExpanded}
        onClickAddSexAndGenderDetails={onClickAddSexAndGenderDetails}
        isRequesterSectionVisible={isRequesterSectionVisible}
        isPatientSectionVisible={isPatientSectionVisible}
        isReturningPatientSectionVisible={isReturningPatientSectionVisible}
        isSubmitButtonDisabled={!formState.isValid}
        isSubmitButtonLoading={isSubmitButtonLoading}
        isGenderIdentityDetailsFieldVisible={
          isGenderIdentityDetailsFieldVisible
        }
        onSubmit={handleSubmit(onSubmit)}
      />
    </PageLayout>
  );
};

import {
  PageLayout,
  InsuranceClassificationFormValues,
  InsuranceType,
  QuestionYesNoAnswer,
  InsuranceClassification,
  PageLayoutProps,
  SelectInsuranceProviderModal,
  SearchNetworkForm,
  SearchNetworkFormFieldValues,
  ReturningPatientInsurance,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSelector } from 'react-redux';
import { SkipToken, skipToken } from '@reduxjs/toolkit/query';
import {
  domainSelectStates,
  useGetStatesQuery,
  useAppDispatch,
  selectIsRequesterRelationshipSelf,
  ListNetworksPayload,
  useListNetworksQuery,
  selectInsuranceNetworks,
  resetInsurance,
  useGetAccountQuery,
  selectDomainPatientAccount,
  GetAccountPatientsQuery,
  useGetAccountPatientsQuery,
  useGetCachedSelfScheduleDataQuery,
  selectInsuranceEligibility,
  checkInsuranceEligibility,
  selectManageInsurancesLoadingState,
  InsurancePriority,
  useGetPatientInsurancesQuery,
  GetPatientInsurancesQuery,
  selectPatientPrimaryInsurance,
  selectPatientSecondaryInsurance,
  InsuranceEligibilityStatus,
  useGetInsuranceClassificationsQuery,
  selectPayersFromNetworksWithClassifications,
  selectInsuranceClassifications,
  deleteInsurance,
  selectUnverifiedPatient,
  selectDomainPatientAccountPatients,
  GetPatientQuery,
  useGetPatientQuery,
  selectPatient,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import { mockedSearchNetworkFormProps } from './mocks';
import {
  findMatchingPayer,
  getInsuranceEligibilityAlert,
  getNetworkOptions,
  getSearchNetworkFormFieldsValues,
  insuranceClassificationSchema,
  searchNetworkFormSchema,
} from './utils';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';

enum InsuranceSteps {
  PROVIDER = 'provider',
  NETWORK = 'network',
}

const INSURANCE_PAYER_FORM_KEY = 'payer';
const INSURANCE_PAYER_ID_CLASSIFICATION_FORM_KEY = 'insurancePayerId';
const INSURANCE_PAYER_NAME_CLASSIFICATION_FORM_KEY = 'insurancePayerName';
const IN_NETWORK_INSURANCE_ALERT_TITLE = 'In Network';
const OUT_OF_NETWORK_INSURANCE_ALERT_TITLE = 'Out of Network';

const backButtonOptions: PageLayoutProps['backButtonOptions'] = {
  text: 'Address',
  link: ONLINE_SELF_SCHEDULING_ROUTES.ADDRESS,
};

const insuranceMedicareTypes = [
  `${InsuranceType.Medicare} Advantage`,
  InsuranceType.Medicare,
];

const getVerifyInsuranceButtonLabel = (
  isLoading?: boolean,
  alertTitle?: string
) => {
  if (isLoading) {
    return 'Verifying Insurance...';
  }

  return alertTitle === OUT_OF_NETWORK_INSURANCE_ALERT_TITLE
    ? 'Re-Verify Insurance'
    : 'Verify Insurance';
};

export const Insurance: FC = () => {
  const segment = useSegment();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    control,
    resetField,
    handleSubmit,
    formState,
    trigger: triggerClassificationForm,
    setValue: setClassificationValue,
    reset: resetInsuranceClassificationForm,
  } = useForm<InsuranceClassificationFormValues>({
    mode: 'onTouched',
    resolver: yupResolver(insuranceClassificationSchema),
    defaultValues: {
      isPublicInsuranceThroughCompany: '',
    },
  });

  const [
    insuranceTypeQuestionValue,
    isPublicInsuranceThroughCompanyValue,
    insurancePayerId = '',
    stateAbbr,
  ] = useWatch<
    InsuranceClassificationFormValues,
    [
      'insuranceType',
      'isPublicInsuranceThroughCompany',
      'insurancePayerId',
      'stateAbbr'
    ]
  >({
    control,
    name: [
      'insuranceType',
      'isPublicInsuranceThroughCompany',
      'insurancePayerId',
      'stateAbbr',
    ],
  });

  useGetInsuranceClassificationsQuery();
  useGetStatesQuery();
  useGetCachedSelfScheduleDataQuery();
  useGetAccountQuery();

  const { data: patientAccount } = useSelector(selectDomainPatientAccount);

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

  const { data: patient, isLoading: isPatientLoading } = useSelector(
    selectPatient(getPatientQuery)
  );

  const { data: insuranceClassifications = [] } = useSelector(
    selectInsuranceClassifications()
  );
  const { data: states = [] } = useSelector(domainSelectStates);

  const getPatientInsurancesQuery: GetPatientInsurancesQuery | SkipToken =
    patientAccount?.id && patient?.id
      ? { accountId: patientAccount.id, patientId: patient.id }
      : skipToken;

  useGetPatientInsurancesQuery(getPatientInsurancesQuery);

  const primaryInsurance = useSelector(
    selectPatientPrimaryInsurance(getPatientInsurancesQuery)
  );
  const secondaryInsurance = useSelector(
    selectPatientSecondaryInsurance(getPatientInsurancesQuery)
  );

  const [hasInsuranceChanged, setHasInsuranceChanged] = useState(false);
  const [insurancePriority, setInsurancePriority] = useState<InsurancePriority>(
    InsurancePriority.PRIMARY
  );

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );
  const insuranceEligibility = useSelector(selectInsuranceEligibility);
  const { isLoading, isLoaded: isInsurancesLoaded } = useSelector(
    selectManageInsurancesLoadingState
  );

  const searchNetworkFormTitle = `Please select the network that best matches ${
    isRequesterRelationshipSelf ? 'your' : 'the patient’s'
  } insurance card`;

  const insuranceClassificationIds = useMemo(
    () =>
      insuranceClassifications
        .filter((classification) =>
          insuranceTypeQuestionValue === InsuranceType.Medicare
            ? insuranceMedicareTypes.includes(classification.name)
            : classification.name === insuranceTypeQuestionValue
        )
        .map((classification) => classification.id.toString()),
    [insuranceClassifications, insuranceTypeQuestionValue]
  );

  const listNetworksPayload: ListNetworksPayload = {
    insuranceClassifications: insuranceClassificationIds,
  };

  useListNetworksQuery(listNetworksPayload);

  const { data: insuranceNetworks = [] } = useSelector(
    selectInsuranceNetworks(listNetworksPayload)
  );
  const payersList = useSelector(
    selectPayersFromNetworksWithClassifications(insuranceClassificationIds)
  );

  const networkOptions = getNetworkOptions({
    insuranceNetworks,
    insurancePayerId,
    hasInsuranceChanged,
    insurancePriority,
    primaryInsurance,
    secondaryInsurance,
  });

  const searchNetworkFormFieldsValues = getSearchNetworkFormFieldsValues({
    payers: payersList,
    insurancePayerId,
    networkOptions,
    hasInsuranceChanged,
    insurancePriority,
    primaryInsurance,
    secondaryInsurance,
  });

  const {
    control: searchNetworkFormControl,
    setValue: setSearchNetworkFormValue,
    handleSubmit: handleSubmitSearchNetworkForm,
    formState: searchNetworkFormState,
    reset: resetNetworkForm,
  } = useForm<SearchNetworkFormFieldValues>({
    mode: 'onTouched',
    resolver: yupResolver(searchNetworkFormSchema),
    values: searchNetworkFormFieldsValues,
  });

  const [isSelectInsuranceModalShown, setIsSelectInsuranceModalShown] =
    useState(false);
  const [insuranceSearchValue, setInsuranceSearchValue] = useState('');
  const [insuranceStep, setInsuranceStep] = useState<InsuranceSteps>(
    InsuranceSteps.PROVIDER
  );

  const [insuranceNetworkId, memberId] = useWatch<
    SearchNetworkFormFieldValues,
    ['networkId', 'memberId']
  >({
    control: searchNetworkFormControl,
    name: ['networkId', 'memberId'],
  });

  useEffect(() => {
    dispatch(resetInsurance());
  }, [insuranceNetworkId, memberId, dispatch]);

  const selectedNetwork = useMemo(
    () =>
      insuranceNetworks.find(({ id }) => id.toString() === insuranceNetworkId),
    [insuranceNetworks, insuranceNetworkId]
  );

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_INSURANCE);
  }, [segment]);

  useEffect(() => {
    if (
      !!insuranceEligibility &&
      insuranceEligibility === InsuranceEligibilityStatus.Ineligible
    ) {
      segment.pageView(SEGMENT_EVENTS.INSURANCE_OON_MESSAGE_VISIBLE);
    }
  }, [insuranceEligibility, segment]);

  useEffect(() => {
    resetField('stateAbbr');
    resetField('insurancePayerId');
    resetField('insurancePayerName');
    resetField('isPublicInsuranceThroughCompany');
  }, [insuranceTypeQuestionValue, resetField]);

  useEffect(() => {
    resetField('stateAbbr');
  }, [isPublicInsuranceThroughCompanyValue, resetField]);

  const isPublicInsuranceProviderQuestionDisplayed =
    insuranceTypeQuestionValue === InsuranceType.Medicaid ||
    insuranceTypeQuestionValue === InsuranceType.Medicare;

  const isInsuranceCompanySearchFieldsSectionDisplayed =
    insuranceTypeQuestionValue === InsuranceType.EmployerProvidedOrPrivate ||
    (isPublicInsuranceProviderQuestionDisplayed &&
      isPublicInsuranceThroughCompanyValue === QuestionYesNoAnswer.Yes);

  const isInsuranceStatesSelectDisplayed =
    isPublicInsuranceProviderQuestionDisplayed &&
    isPublicInsuranceThroughCompanyValue === QuestionYesNoAnswer.No;

  const publicInsuranceStatePayer = useMemo(() => {
    if (stateAbbr) {
      return findMatchingPayer(
        payersList,
        insuranceTypeQuestionValue,
        stateAbbr
      );
    }
  }, [payersList, stateAbbr, insuranceTypeQuestionValue]);

  const switchToSecondaryInsuranceFlow = () => {
    setInsurancePriority(InsurancePriority.SECONDARY);
    setInsuranceStep(InsuranceSteps.PROVIDER);
    resetInsuranceClassificationForm();
    resetNetworkForm();
    dispatch(resetInsurance());
    setHasInsuranceChanged(false);
  };

  const deletePrimaryInsurance = ({
    accountId,
    patientId,
    insuranceId,
  }: {
    accountId: number;
    patientId: number;
    insuranceId: number;
  }) => {
    dispatch(
      deleteInsurance({
        accountId,
        patientId,
        insuranceId,
      })
    ).then((res) => {
      if (isQueryErrorResponse(res)) {
        return;
      }
      if (secondaryInsurance) {
        switchToSecondaryInsuranceFlow();
        setIsSelectInsuranceModalShown(false);
      } else {
        navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS);
      }
    });
  };

  const deleteSecondaryInsurance = ({
    accountId,
    patientId,
    insuranceId,
  }: {
    accountId: number;
    patientId: number;
    insuranceId: number;
  }) => {
    dispatch(
      deleteInsurance({
        accountId,
        patientId,
        insuranceId,
      })
    ).then((res) => {
      if (!isQueryErrorResponse(res)) {
        navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS);
      }
    });
  };

  const handleNoInsuranceClick = () => {
    if (!patientAccount?.id || !patient?.id) {
      return;
    }

    if (
      insurancePriority === InsurancePriority.PRIMARY &&
      primaryInsurance?.id
    ) {
      deletePrimaryInsurance({
        accountId: patientAccount.id,
        patientId: patient.id,
        insuranceId: primaryInsurance.id,
      });

      return;
    }

    if (
      insurancePriority === InsurancePriority.SECONDARY &&
      secondaryInsurance?.id
    ) {
      deleteSecondaryInsurance({
        accountId: patientAccount.id,
        patientId: patient.id,
        insuranceId: secondaryInsurance.id,
      });

      return;
    }

    navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS);
  };

  const onSubmit: SubmitHandler<InsuranceClassificationFormValues> = () => {
    if (insuranceTypeQuestionValue === InsuranceType.None) {
      handleNoInsuranceClick();

      return;
    }
    if (stateAbbr && publicInsuranceStatePayer) {
      setSearchNetworkFormValue(INSURANCE_PAYER_FORM_KEY, {
        id: String(publicInsuranceStatePayer.id),
        label: publicInsuranceStatePayer.name,
      });
      setClassificationValue(
        INSURANCE_PAYER_ID_CLASSIFICATION_FORM_KEY,
        String(publicInsuranceStatePayer.id)
      );
      setClassificationValue(
        INSURANCE_PAYER_NAME_CLASSIFICATION_FORM_KEY,
        publicInsuranceStatePayer.name
      );
    }
    setInsuranceStep(InsuranceSteps.NETWORK);
  };

  const resetSelectedInsuranceProvider = () => {
    setClassificationValue(INSURANCE_PAYER_ID_CLASSIFICATION_FORM_KEY, '');
    setClassificationValue(INSURANCE_PAYER_NAME_CLASSIFICATION_FORM_KEY, '');
    setSearchNetworkFormValue(INSURANCE_PAYER_FORM_KEY, { id: '', label: '' });
    triggerClassificationForm();
  };

  const onSearchInsuranceProvidersClick = () => {
    setIsSelectInsuranceModalShown(true);
  };

  const onSetInsuranceSearchValue = (value: string) => {
    setInsuranceSearchValue(value);
  };

  const onCloseSelectInsuranceModal = () => {
    setInsuranceSearchValue('');
    setIsSelectInsuranceModalShown(false);
  };

  const onRemoveSelectedInsuranceProvider = () => {
    resetSelectedInsuranceProvider();
    dispatch(resetInsurance());
    resetNetworkForm();
    setInsuranceStep(InsuranceSteps.PROVIDER);
    resetInsuranceClassificationForm();
    setHasInsuranceChanged(true);
  };

  const onInsuranceNotOnThisListClick = () => {
    handleNoInsuranceClick();
  };

  const onChooseInsurance = (id: string) => {
    const payerSelected = payersList.find(
      (payer) => payer.id.toString() === id
    );

    if (payerSelected) {
      const payerSelectedId = payerSelected.id.toString();

      setSearchNetworkFormValue(INSURANCE_PAYER_FORM_KEY, {
        id: payerSelectedId,
        label: payerSelected.name,
      });
      setClassificationValue(
        INSURANCE_PAYER_ID_CLASSIFICATION_FORM_KEY,
        payerSelectedId
      );
      setClassificationValue(
        INSURANCE_PAYER_NAME_CLASSIFICATION_FORM_KEY,
        payerSelected.name
      );
      dispatch(resetInsurance());
    } else {
      resetSelectedInsuranceProvider();
    }
    triggerClassificationForm();
    onCloseSelectInsuranceModal();
  };

  const onSubmitSearchNetworkForm: SubmitHandler<
    SearchNetworkFormFieldValues
  > = () => {
    dispatch(
      checkInsuranceEligibility({
        patient,
        selectedNetwork,
        memberId,
        accountId: patientAccount?.id,
        patientId: patient?.id,
        isRequesterRelationshipSelf,
        insurancePriority,
        insuranceId:
          insurancePriority === InsurancePriority.PRIMARY
            ? primaryInsurance?.id
            : secondaryInsurance?.id,
      })
    );
  };

  const onContinueToConfirmDetailsClick = () => {
    if (insurancePriority === InsurancePriority.PRIMARY && secondaryInsurance) {
      switchToSecondaryInsuranceFlow();
    } else {
      navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS);
    }
  };

  const insuranceEligibilityAlert = getInsuranceEligibilityAlert(
    insuranceEligibility,
    isRequesterRelationshipSelf
  );

  const isVerifyInsuranceButtonVisible =
    insuranceEligibilityAlert?.title !== IN_NETWORK_INSURANCE_ALERT_TITLE;

  const verifyInsuranceButtonLabel = getVerifyInsuranceButtonLabel(
    isLoading,
    insuranceEligibilityAlert?.title
  );

  const returningPatientInsuranceTitle =
    insurancePriority === InsurancePriority.PRIMARY
      ? 'Do you have the same primary insurance?'
      : 'Do you have the same secondary insurance?';

  const isAddAnotherInsuranceButtonVisible =
    !!insuranceEligibility &&
    insurancePriority !== InsurancePriority.SECONDARY &&
    !secondaryInsurance;

  const onAddSecondaryInsurance = () => {
    switchToSecondaryInsuranceFlow();
  };

  const getInsuranceClassificationFormTitle = () => {
    if (insurancePriority === InsurancePriority.SECONDARY) {
      return 'Secondary insurance';
    }

    return isRequesterRelationshipSelf
      ? 'Let’s capture your health insurance'
      : 'Let’s capture the patient’s health insurance';
  };

  const onSetHasInsuranceChanged = () => {
    setHasInsuranceChanged(true);
    setInsuranceStep(InsuranceSteps.NETWORK);
  };

  const onClickInusranceIsSame = () => {
    if (insurancePriority === InsurancePriority.PRIMARY) {
      setInsurancePriority(InsurancePriority.SECONDARY);
    } else {
      navigate(ONLINE_SELF_SCHEDULING_ROUTES.CONFIRM_DETAILS);
    }
  };

  const isPageLoading =
    isAccountPatientsLoading || isPatientLoading || !isInsurancesLoaded;

  const renderInsurancePageLayout = (child: ReactNode) => {
    return (
      <PageLayout
        stepProgress={RequestProgressStep.Insurance}
        backButtonOptions={backButtonOptions}
        isLoading={isPageLoading}
      >
        {child}
      </PageLayout>
    );
  };

  if (
    primaryInsurance &&
    !hasInsuranceChanged &&
    insuranceStep !== InsuranceSteps.NETWORK &&
    insurancePriority === InsurancePriority.PRIMARY
  ) {
    return renderInsurancePageLayout(
      <ReturningPatientInsurance
        returningPatientInsuranceTitle={returningPatientInsuranceTitle}
        onClickInsuranceIsSameButton={onClickInusranceIsSame}
        onClickInsuranceHasChangedButton={onSetHasInsuranceChanged}
      />
    );
  }

  if (
    secondaryInsurance &&
    !hasInsuranceChanged &&
    insuranceStep !== InsuranceSteps.NETWORK &&
    insurancePriority === InsurancePriority.SECONDARY
  ) {
    return renderInsurancePageLayout(
      <ReturningPatientInsurance
        returningPatientInsuranceTitle={returningPatientInsuranceTitle}
        onClickInsuranceIsSameButton={onClickInusranceIsSame}
        onClickInsuranceHasChangedButton={onSetHasInsuranceChanged}
      />
    );
  }

  return renderInsurancePageLayout(
    <>
      {insuranceStep === InsuranceSteps.NETWORK ? (
        <SearchNetworkForm
          {...mockedSearchNetworkFormProps}
          onVerifyInsurance={handleSubmitSearchNetworkForm(
            onSubmitSearchNetworkForm
          )}
          isVerifyInsuranceButtonDisabled={!searchNetworkFormState.isValid}
          formControl={searchNetworkFormControl}
          onClickSelectedInsuranceProvider={onSearchInsuranceProvidersClick}
          onRemoveSelectedInsuranceProvider={onRemoveSelectedInsuranceProvider}
          onContinueToConfirmDetailsClick={onContinueToConfirmDetailsClick}
          networkOptions={networkOptions}
          searchNetworkFormTitle={searchNetworkFormTitle}
          isRemoveInsurancePayerButtonVisible={
            insuranceStep === InsuranceSteps.NETWORK
          }
          isAddAnotherInsuranceButtonVisible={
            isAddAnotherInsuranceButtonVisible
          }
          alert={insuranceEligibilityAlert}
          isLoading={isLoading}
          isNetworkSelectVisible={networkOptions.length !== 1}
          isVerifyInsuranceButtonVisible={isVerifyInsuranceButtonVisible}
          isContinueButtonVisible={!!insuranceEligibilityAlert}
          verifyInsuranceButtonLabel={verifyInsuranceButtonLabel}
          onAddAnotherInsuranceButton={onAddSecondaryInsurance}
        />
      ) : (
        <InsuranceClassification
          formTitle={getInsuranceClassificationFormTitle()}
          isRequesterRelationshipSelf={isRequesterRelationshipSelf}
          formControl={control}
          stateOptions={states}
          showSearchInsurance={isInsuranceCompanySearchFieldsSectionDisplayed}
          showSelectState={isInsuranceStatesSelectDisplayed}
          showSecondQuestion={isPublicInsuranceProviderQuestionDisplayed}
          insuranceValue={insuranceTypeQuestionValue}
          isSubmitButtonDisabled={!formState.isValid}
          isLoading={isLoading}
          onSearchInsuranceProvidersClick={onSearchInsuranceProvidersClick}
          onSubmit={handleSubmit(onSubmit)}
        />
      )}
      <SelectInsuranceProviderModal
        open={isSelectInsuranceModalShown}
        insuranceNotInListButtonLabel="My insurance isn't on this list"
        onChangeSearch={onSetInsuranceSearchValue}
        onClose={onCloseSelectInsuranceModal}
        onChooseInsurance={onChooseInsurance}
        insuranceSearch={insuranceSearchValue}
        searchOptions={payersList}
        onNotOnThisListClick={onInsuranceNotOnThisListClick}
        isLoading={isLoading}
      />
    </>
  );
};

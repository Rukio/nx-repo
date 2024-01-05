import { FC, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { SkipToken, skipToken } from '@reduxjs/toolkit/query';
import { format, startOfToday, startOfTomorrow } from 'date-fns';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  useAppDispatch,
  selectIsRequesterRelationshipSelf,
  useGetAccountQuery,
  upsertPatientAddress,
  useGetStatesQuery,
  domainSelectStates,
  selectManagePatientAddressLoadingState,
  GetPlacesOfServiceQuery,
  MarketFeasibilityStatus,
  selectMarketFeasibilityLoadingData,
  selectMarketFeasibilityStatus,
  prepareCheckMarketFeasibilityPayload,
  useGetAddressesQuery,
  selectSelfScheduleData,
  selectPatientAddresses,
  selectDomainPatientAccount,
  setExistingPatientAddress,
  GetAccountPatientsQuery,
  useGetAccountPatientsQuery,
  upsertPatient,
  selectPatientAddressData,
  updateAddressStatus,
  updateEnteredAddress,
  updateCachedSelfScheduleData,
  invalidatePatientAddressesData,
  toFormattedAddress,
  selectManagePatientDemographicsLoadingState,
  SelectMarketsAvailabilityZipCodeQuery,
  selectMarketAvailability,
  selectMarketAvailabilityDetails,
  checkMarketAvailabilityDetails,
  MarketsAvailabilityZipCodeQuery,
  selectActivePlacesOfService,
  transformAddressDataToPatientAddress,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import {
  PageLayout,
  PageLayoutProps,
  AddressForm,
  AddressFormFieldValues,
  AddressSuggestionSection,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';
import { useSegment } from '@*company-data-covered*/segment/feature';
import {
  Alert,
  Box,
  CircularProgress,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  ONLINE_SELF_SCHEDULING_ROUTES,
  RequestProgressStep,
  SEGMENT_EVENTS,
} from '../constants';
import { convertToFormSelectMenuItems } from '@*company-data-covered*/shared/ui/forms';
import { AddressStatus } from '@*company-data-covered*/consumer-web-types';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';
import { addressFormSchema } from './utils';
import {
  isMarketFeasibilityAvailable,
  getFiveDigitZipCode,
} from '../utils/market';
import { ADDRESS_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    loaderWrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const backButtonOptions: PageLayoutProps['backButtonOptions'] = {
  text: 'Medical decision maker',
  link: ONLINE_SELF_SCHEDULING_ROUTES.CONSENT,
};

const ADD_NEW_ADDRESS_OPTION = {
  value: '',
  label: 'Add New Address',
};

export const Address: FC = () => {
  const segment = useSegment();
  const styles = makeStyles();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useGetAccountQuery();

  const { data: patientAccount, isLoading: isPatientAccountLoading } =
    useSelector(selectDomainPatientAccount);

  const accountPatientsQuery: GetAccountPatientsQuery | SkipToken =
    patientAccount?.id ? { id: patientAccount.id } : skipToken;

  useGetAccountPatientsQuery(accountPatientsQuery);

  const {
    enteredAddress: enteredPatientAddress,
    suggestedAddress,
    addressStatus: patientAddressStatus,
    createdAddressId,
    createdAddressConsistencyToken,
  } = useSelector(selectPatientAddressData);

  const isRequesterRelationshipSelf = useSelector(
    selectIsRequesterRelationshipSelf
  );

  const { data: states = [], isLoading: isStatesLoading } =
    useSelector(domainSelectStates);

  const stateOptions = convertToFormSelectMenuItems(
    states,
    'abbreviation',
    'name'
  );

  const cacheData = useSelector(selectSelfScheduleData);

  useGetAddressesQuery(patientAccount?.id || skipToken);

  const { isLoading: isPatientAddressesLoading, patientAddresses } =
    useSelector(selectPatientAddresses);

  useGetStatesQuery();

  useEffect(() => {
    segment.pageView(SEGMENT_EVENTS.PAGE_VIEW_LOCATION);
  }, [segment]);

  const { control, handleSubmit, formState, getFieldState } =
    useForm<AddressFormFieldValues>({
      mode: 'onTouched',
      defaultValues: {
        zipCode: '',
        streetAddress1: '',
        streetAddress2: '',
        city: '',
        state: '',
        locationType: '',
        locationDetails: '',
        selectedAddressId: cacheData?.addressId
          ? String(cacheData.addressId)
          : '',
      },
      resolver: yupResolver(addressFormSchema(stateOptions)),
    });

  const zipCodeFormValue = useWatch<AddressFormFieldValues>({
    control,
    name: 'zipCode',
  });

  const { invalid: isZipCodeValueInvalid } = getFieldState(
    'zipCode',
    formState
  );

  const isZipCodeInvalid =
    formState.isValidating ||
    (!formState.isValidating && isZipCodeValueInvalid);

  const selectedAddressIdValue = useWatch<
    AddressFormFieldValues,
    'selectedAddressId'
  >({
    control,
    name: 'selectedAddressId',
  });

  const activeZipCode = useMemo(() => {
    if (selectedAddressIdValue && patientAddresses.length) {
      return patientAddresses?.find(
        (address) => address.value === selectedAddressIdValue
      )?.zip;
    }

    return zipCodeFormValue;
  }, [selectedAddressIdValue, zipCodeFormValue, patientAddresses]);

  const fiveDigitZipCode = getFiveDigitZipCode(activeZipCode);

  const onDispatchCheckMarketAvailabilityDetails = useCallback(
    (query: MarketsAvailabilityZipCodeQuery) =>
      dispatch(checkMarketAvailabilityDetails(query)),
    [dispatch]
  );

  const onFetchMarketsAvailability = useDebouncedCallback(
    onDispatchCheckMarketAvailabilityDetails
  );

  useEffect(() => {
    if ((selectedAddressIdValue || !isZipCodeInvalid) && fiveDigitZipCode) {
      onFetchMarketsAvailability({
        zipCode: fiveDigitZipCode,
      });
    }
  }, [
    selectedAddressIdValue,
    isZipCodeInvalid,
    fiveDigitZipCode,
    onFetchMarketsAvailability,
  ]);

  const marketAvailabilityZipCodePayload: SelectMarketsAvailabilityZipCodeQuery =
    fiveDigitZipCode ? { zipCode: fiveDigitZipCode } : skipToken;

  const {
    isMarketAvailabilityLoading,
    isMarketAvailabilityOpen,
    isMarketAvailabilityClosed,
  } = useSelector(selectMarketAvailability(marketAvailabilityZipCodePayload));

  const { marketAvailabilityDetails } = useSelector(
    selectMarketAvailabilityDetails(marketAvailabilityZipCodePayload)
  );

  const marketAvailabilityCheckTodayPayload =
    prepareCheckMarketFeasibilityPayload(
      fiveDigitZipCode,
      marketAvailabilityDetails?.marketId,
      format(startOfToday(), 'MM-dd-yyyy')
    );

  const marketAvailabilityCheckTomorrowPayload =
    prepareCheckMarketFeasibilityPayload(
      fiveDigitZipCode,
      marketAvailabilityDetails?.marketId,
      format(startOfTomorrow(), 'MM-dd-yyyy')
    );

  const { isLoading: isMarketFeasibilityTodayLoading } = useSelector(
    selectMarketFeasibilityLoadingData(marketAvailabilityCheckTodayPayload)
  );
  const { availabilityStatus: marketFeasibilityStatusToday } = useSelector(
    selectMarketFeasibilityStatus(marketAvailabilityCheckTodayPayload)
  );

  const { isLoading: isMarketFeasibilityTomorrowLoading } = useSelector(
    selectMarketFeasibilityLoadingData(marketAvailabilityCheckTomorrowPayload)
  );
  const { availabilityStatus: marketFeasibilityStatusTomorrow } = useSelector(
    selectMarketFeasibilityStatus(marketAvailabilityCheckTomorrowPayload)
  );

  const { isLoading: isPatientAddressLoading } = useSelector(
    selectManagePatientAddressLoadingState
  );

  const getPlacesOfServiceQuery: GetPlacesOfServiceQuery | SkipToken =
    marketAvailabilityDetails?.billingCityId
      ? {
          billingCityId: marketAvailabilityDetails.billingCityId,
        }
      : skipToken;

  const placesOfService = useSelector(
    selectActivePlacesOfService(getPlacesOfServiceQuery)
  );

  const locationTypeOptions = convertToFormSelectMenuItems(
    placesOfService,
    'placeOfService',
    'placeOfService'
  );

  const { isLoading: isPatientDemographicsUpdateLoading } = useSelector(
    selectManagePatientDemographicsLoadingState
  );

  const addressesOptions = useMemo(() => {
    if (!patientAddresses.length) {
      return [];
    }

    return [...patientAddresses, ADD_NEW_ADDRESS_OPTION];
  }, [patientAddresses]);

  const isMarketAvailable =
    isMarketAvailabilityOpen &&
    (isMarketFeasibilityAvailable(marketFeasibilityStatusToday) ||
      isMarketFeasibilityAvailable(marketFeasibilityStatusTomorrow));

  const isMarketAvailabilityStatusLoading =
    isMarketAvailabilityLoading ||
    isMarketFeasibilityTodayLoading ||
    isMarketFeasibilityTomorrowLoading;

  const isLocationFieldsSectionVisible =
    isMarketAvailable && !isMarketAvailabilityStatusLoading;

  const isFormFooterVisible =
    !!selectedAddressIdValue || isMarketAvailable || !zipCodeFormValue;

  const isPageLayoutLoading =
    isPatientAccountLoading || isStatesLoading || isPatientAddressesLoading;

  const isPatientAddressStatusInvalid =
    patientAddressStatus === AddressStatus.INVALID;

  const formHeaderTitle = isPatientAddressStatusInvalid
    ? 'Confirm your address'
    : 'Where should we send our team?';

  const formHeaderSubtitle = `Enter ${
    isRequesterRelationshipSelf ? 'your' : 'the patient’s'
  } ZIP Code to confirm that the address is in our service area`;

  const isSubmitButtonDisabled =
    (!formState.isValid && !selectedAddressIdValue) ||
    !isMarketAvailabilityOpen;

  const isSubmitButtonLoading =
    isPatientAddressLoading || isMarketAvailabilityLoading;

  const validatedAddress = toFormattedAddress(suggestedAddress);

  const enteredAddress = toFormattedAddress(enteredPatientAddress);

  const onSubmitCallBack = () => {
    dispatch(
      upsertPatient({
        billingCityId: marketAvailabilityDetails?.billingCityId,
      })
    )
      .unwrap()
      .then(({ isError: isUpsertPatientError }) => {
        if (!isUpsertPatientError) {
          segment.track(SEGMENT_EVENTS.LOCATION_ZIP_CODE, {
            [SEGMENT_EVENTS.LOCATION_ZIP_CODE]: activeZipCode,
          });

          navigate(ONLINE_SELF_SCHEDULING_ROUTES.INSURANCE);
        }
      });
  };

  const onSubmit: SubmitHandler<AddressFormFieldValues> = (address) => {
    if (address.selectedAddressId) {
      dispatch(
        setExistingPatientAddress({
          addressId: Number(address.selectedAddressId),
          marketId: Number(marketAvailabilityDetails?.marketId),
        })
      )
        .unwrap()
        .then(({ isError }) => {
          if (!isError) {
            onSubmitCallBack();
          }
        });
    } else {
      dispatch(
        updateEnteredAddress(transformAddressDataToPatientAddress(address))
      );

      dispatch(
        upsertPatientAddress({
          patientAddress: address,
          marketId: marketAvailabilityDetails?.marketId,
          createdAddressId,
          createdAddressConsistencyToken,
        })
      )
        .unwrap()
        .then(({ isError, addressStatus }) => {
          if (!isError && addressStatus === AddressStatus.VALID) {
            onSubmitCallBack();
          }
        });
    }
  };

  const onClickValidatedAddress = () => {
    if (createdAddressId) {
      dispatch(
        updateCachedSelfScheduleData({
          addressId: createdAddressId,
          marketId: marketAvailabilityDetails?.marketId,
        })
      )
        .unwrap()
        .then(({ isError }) => {
          if (!isError) {
            dispatch(invalidatePatientAddressesData());

            onSubmitCallBack();
          }
        });
    }
  };

  const onClickEnteredAddress = () => {
    dispatch(updateAddressStatus(AddressStatus.INVALID));
  };

  const renderAddressAvailabilityAlert = () => {
    const isMarketUnavailable =
      isMarketAvailabilityOpen &&
      marketFeasibilityStatusToday === MarketFeasibilityStatus.Unavailable &&
      marketFeasibilityStatusTomorrow === MarketFeasibilityStatus.Unavailable;

    if (!zipCodeFormValue) {
      return null;
    }

    if (isMarketAvailabilityStatusLoading) {
      return (
        <Box sx={styles.loaderWrapper}>
          <CircularProgress
            size={30}
            data-testid={ADDRESS_TEST_IDS.MARKET_AVAILABILITY_CIRCULAR_PROGRESS}
          />
        </Box>
      );
    }

    if (isMarketAvailable) {
      return (
        <Alert
          severity="success"
          message="Great news! That location is in our service area"
        />
      );
    }
    if (isMarketAvailabilityClosed) {
      return (
        <Alert
          severity="error"
          title="Sorry, we’re not available in your area yet."
          message="We encourage you to call your primary care provider or seek care at a facility."
        />
      );
    }
    if (isMarketUnavailable) {
      return (
        <Alert
          severity="error"
          title="Sorry, we’re fully booked in your location today and tomorrow."
          message="We encourage you to call your primary care provider or seek care at a facility."
        />
      );
    }

    return null;
  };

  return (
    <PageLayout
      stepProgress={RequestProgressStep.Address}
      backButtonOptions={backButtonOptions}
      isLoading={isPageLayoutLoading}
    >
      {patientAddressStatus === AddressStatus.CONFIRM ? (
        <AddressSuggestionSection
          isAutocorrectedResponseButtonLoading={
            isPatientDemographicsUpdateLoading
          }
          validatedAddress={validatedAddress}
          onClickValidatedAddress={onClickValidatedAddress}
          enteredAddress={enteredAddress}
          onClickEnteredAddress={onClickEnteredAddress}
        />
      ) : (
        <AddressForm
          formHeaderTitle={formHeaderTitle}
          formHeaderSubtitle={formHeaderSubtitle}
          formControl={control}
          isInvalidAddressAlertVisible={isPatientAddressStatusInvalid}
          isLocationFieldsSectionVisible={isLocationFieldsSectionVisible}
          addressAvailabilityAlert={renderAddressAvailabilityAlert()}
          stateOptions={stateOptions}
          locationTypeOptions={locationTypeOptions}
          isFormFooterVisible={isFormFooterVisible}
          isSubmitButtonLoading={isSubmitButtonLoading}
          isSubmitButtonDisabled={isSubmitButtonDisabled}
          onSubmit={handleSubmit(onSubmit)}
          radioOptions={addressesOptions}
          selectedAddressId={selectedAddressIdValue}
        />
      )}
    </PageLayout>
  );
};

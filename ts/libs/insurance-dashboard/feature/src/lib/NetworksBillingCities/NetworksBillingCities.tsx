import { useCallback, useEffect } from 'react';
import {
  NetworksBillingCitiesFilters,
  NetworksBillingCitiesStates,
  FormManageControls,
  State,
  NetworkBillingCitiesFilterOptionTitle,
} from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  selectNetworkModalityConfigs,
  selectDomainModalities,
  selectServiceLines,
  selectStatesData,
  useAppDispatch,
  useGetNetworkModalityConfigsQuery,
  useGetModalitiesQuery,
  useGetServiceLinesQuery,
  useGetStatesQuery,
  selectNetworkModalitiesLoadingState,
  showSuccess,
  showError,
  updateNetworkModalityConfigs,
  selectSelectedNetworkModalityConfigs,
  resetNetworkModalityConfigs,
  patchUpdateNetworkStatesAndModalityConfigurations,
  getErrorMessageFromResponse,
  selectNetworkBillingCitiesFilterOptions,
  selectActiveStatesIds,
  setNetworkBillingCitiesFilterOptions,
  selectFilteredStatesData,
  resetNetworkBillingCitiesFilterOptions,
  NetworkModalityConfigWithOptionalId,
  StatesStatusOptions,
  selectAllStates,
} from '@*company-data-covered*/insurance/data-access';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
  PayerNetworkPathParams,
} from '../constants';
import { skipToken } from '@reduxjs/toolkit/query';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';

const makeStyles = () =>
  makeSxStyles({
    rootWrapper: {
      px: 3,
      mt: 4,
      mb: 12,
    },
    boxFormControlsWrapper: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
    },
  });

export const getStateAbbreviationByBillingCityId = (
  states: State[],
  billingCityId: string
): string | null => {
  const foundStateByBillingCityId = states.find((stateInner) =>
    stateInner.billingCities.some(
      (billingCity) => billingCity.id === billingCityId
    )
  );

  return foundStateByBillingCityId?.abbreviation || null;
};

const NetworksBillingCities = () => {
  const styles = makeStyles();
  const { payerId = '', networkId = '' } = useParams<PayerNetworkPathParams>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  useGetStatesQuery();
  useGetServiceLinesQuery();
  useGetModalitiesQuery();
  useGetNetworkModalityConfigsQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  const statesFilterOptions = useSelector(selectStatesData);
  const states = useSelector(selectFilteredStatesData);
  const allStates = useSelector(selectAllStates);
  const { serviceLines } = useSelector(selectServiceLines);
  const modalityConfigs = useSelector(selectNetworkModalityConfigs);
  const selectedModalityIdsForBillingCity = useSelector(
    selectSelectedNetworkModalityConfigs
  );
  const activeStatesIds = useSelector(selectActiveStatesIds);
  const { data: modalities = [] } = useSelector(selectDomainModalities);
  const { isLoading: isModalitiesLoading } = useSelector(
    selectNetworkModalitiesLoadingState
  );
  const { serviceLineId, stateId, statesStatusOption } = useSelector(
    selectNetworkBillingCitiesFilterOptions
  );

  useEffect(() => {
    return () => {
      dispatch(resetNetworkBillingCitiesFilterOptions());
    };
  }, [dispatch]);

  const onChangeModality = (
    billingCityId: string,
    serviceLineId: string,
    modalityId: string
  ) => {
    const selectedConfigParams: NetworkModalityConfigWithOptionalId = {
      billingCityId,
      serviceLineId,
      modalityId,
      networkId,
    };

    dispatch(updateNetworkModalityConfigs(selectedConfigParams));
  };

  const onSubmit = useCallback(() => {
    const configStateAbbreviations: string[] = Array.from(
      new Set(
        modalityConfigs.reduce((acc: string[], config) => {
          const abbr = getStateAbbreviationByBillingCityId(
            allStates || [],
            config.billingCityId
          );
          if (abbr) {
            acc.push(abbr);
          }

          return acc;
        }, [])
      )
    );

    dispatch(
      patchUpdateNetworkStatesAndModalityConfigurations({
        networkId,
        stateAbbrs: configStateAbbreviations,
      })
    )
      .unwrap()
      .then((res) => {
        const error = res.networkModalityConfigsError || res.stateAbbrsError;
        if (error) {
          const errorMessage = getErrorMessageFromResponse({ error });
          dispatch(
            showError({
              message:
                errorMessage ||
                DEFAULT_NOTIFICATION_MESSAGES.BILLING_CITY_EDIT_ERROR,
            })
          );
        } else {
          dispatch(
            showSuccess({
              message: DEFAULT_NOTIFICATION_MESSAGES.BILLING_CITY_EDIT_SUCCESS,
            })
          );
        }
      });
  }, [dispatch, allStates, modalityConfigs, networkId]);

  const onCancel = useCallback(() => {
    if (networkId) {
      dispatch(resetNetworkModalityConfigs(networkId));
    }
    navigate(INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId));
  }, [networkId, navigate, payerId, dispatch]);

  const onChangeFilterValue = (name: string, value: string) => {
    switch (name) {
      case NetworkBillingCitiesFilterOptionTitle.StateId: {
        dispatch(setNetworkBillingCitiesFilterOptions({ stateId: value }));
        break;
      }
      case NetworkBillingCitiesFilterOptionTitle.ServiceLineId: {
        dispatch(
          setNetworkBillingCitiesFilterOptions({ serviceLineId: value })
        );
        break;
      }
      case NetworkBillingCitiesFilterOptionTitle.StatesStatusOption: {
        dispatch(
          setNetworkBillingCitiesFilterOptions({
            statesStatusOption: value as StatesStatusOptions,
          })
        );
        break;
      }
      default:
        break;
    }
  };

  const onResetFilterOptions = () => {
    dispatch(resetNetworkBillingCitiesFilterOptions());
  };

  return (
    <Box sx={styles.rootWrapper}>
      <NetworksBillingCitiesFilters
        stateId={stateId}
        serviceLineId={serviceLineId}
        states={statesFilterOptions}
        statesStatusOption={statesStatusOption}
        serviceLines={serviceLines}
        onChangeFilterValue={onChangeFilterValue}
        onResetFilterOptions={onResetFilterOptions}
      />
      <NetworksBillingCitiesStates
        activeStatesIds={activeStatesIds}
        states={states}
        serviceLines={serviceLines}
        modalities={modalities}
        onChangeModality={onChangeModality}
        selectedModalityIdsForBillingCity={selectedModalityIdsForBillingCity}
        isDisabled={!isInsuranceAdmin}
      />
      {isInsuranceAdmin && (
        <Box sx={styles.boxFormControlsWrapper}>
          <FormManageControls
            onCancel={onCancel}
            onSubmit={onSubmit}
            isLoading={isModalitiesLoading}
          />
        </Box>
      )}
    </Box>
  );
};

export default NetworksBillingCities;

import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  FormManageControls,
  NETWORKS_SERVICE_LINE_FORM_TEST_IDS,
  NetworksServiceLineForm,
  ServiceLineAppointmentOption,
} from '@*company-data-covered*/insurance/ui';
import { Box, Grid, Paper, makeSxStyles } from '@*company-data-covered*/design-system';
import { NETWORKS_APPOINTMENT_TYPES_TEST_IDS } from './testIds';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  useGetNetworkAppointmentTypesQuery,
  useGetNetworkServiceLinesQuery,
  useGetServiceLinesQuery,
  selectNetworkAllServiceLinesAppointmentTypes,
  useAppDispatch,
  resetNetworkAppointmentTypes,
  useGetAppointmentTypesQuery,
  useGetModalitiesQuery,
  selectDomainModalities,
  selectDomainAppointmentTypes,
  selectNetworkAppointmentTypes,
  upsertNetworkAppointmentTypes,
  InsuranceNetworkServiceLineAppointmentType,
  updateInsuranceNetworkApointmentTypes,
  showSuccess,
  showError,
  getErrorMessageFromResponse,
  selectManageNetworksLoadingState,
} from '@*company-data-covered*/insurance/data-access';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import {
  PayerNetworkPathParams,
  INSURANCE_DASHBOARD_ROUTES,
  DEFAULT_NOTIFICATION_MESSAGES,
} from '../constants';

const { NETWORK_APPOINTMENT_TYPES_SUCCESS, NETWORK_APPOINTMENT_TYPES_ERROR } =
  DEFAULT_NOTIFICATION_MESSAGES;

const makeStyles = () =>
  makeSxStyles({
    rootWrapper: {
      display: 'flex',
      justifyContent: 'center',
      mt: 3,
      mb: 12,
    },
    boxFormControlsWrapper: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 1,
    },
    formsRoot: {
      maxWidth: '800px',
      width: '100%',
      p: 3,
    },
  });

const NetworksAppointmentTypes = () => {
  const { networkId = '', payerId = '' } = useParams<PayerNetworkPathParams>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const styles = makeStyles();

  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  useGetModalitiesQuery();
  useGetAppointmentTypesQuery();
  useGetServiceLinesQuery();
  useGetNetworkServiceLinesQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });
  useGetNetworkAppointmentTypesQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });

  const { data: modalities = [] } = useSelector(selectDomainModalities);
  const { data: appointmentTypes = [] } = useSelector(
    selectDomainAppointmentTypes
  );
  const networkAppointmentTypes = useSelector(selectNetworkAppointmentTypes);
  const networkServiceLinesAppointmentTypes = useSelector(
    selectNetworkAllServiceLinesAppointmentTypes(networkId || skipToken)
  );
  const { isLoading } = useSelector(selectManageNetworksLoadingState);

  const getNetworkServiceLineAppointmentTypes = (serviceLineId: string) => {
    return networkAppointmentTypes.filter(
      (networkAppointmentType) =>
        networkAppointmentType.serviceLineId === serviceLineId
    );
  };

  const handleOnSelectAppointmentType = ({
    appointmentTypeName,
    modalityType,
    serviceLineId,
    serviceLineAppointmentOption,
  }: {
    appointmentTypeName: string;
    modalityType: string;
    serviceLineId: string;
    serviceLineAppointmentOption: ServiceLineAppointmentOption;
  }) => {
    if (!networkId) {
      return;
    }

    const newPatientAppointmentType = [
      ServiceLineAppointmentOption.AllPatients,
      ServiceLineAppointmentOption.NewPatients,
    ].includes(serviceLineAppointmentOption)
      ? appointmentTypeName
      : undefined;
    const existingPatientAppointmentType = [
      ServiceLineAppointmentOption.AllPatients,
      ServiceLineAppointmentOption.ExistingPatients,
    ].includes(serviceLineAppointmentOption)
      ? appointmentTypeName
      : undefined;

    const appointmentType: InsuranceNetworkServiceLineAppointmentType = {
      networkId,
      serviceLineId,
      modalityType,
      newPatientAppointmentType,
      existingPatientAppointmentType,
    };
    dispatch(upsertNetworkAppointmentTypes(appointmentType));
  };

  const onCancel = () => {
    if (networkId) {
      dispatch(resetNetworkAppointmentTypes(networkId));
      navigate(INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId));
    }
  };

  const onSubmit = () => {
    dispatch(
      updateInsuranceNetworkApointmentTypes(networkId, networkAppointmentTypes)
    ).then((res) => {
      if (!isQueryErrorResponse(res)) {
        dispatch(
          showSuccess({
            message: NETWORK_APPOINTMENT_TYPES_SUCCESS,
          })
        );
      } else {
        dispatch(
          showError({
            message:
              getErrorMessageFromResponse(res) ||
              NETWORK_APPOINTMENT_TYPES_ERROR,
          })
        );
      }
    });
  };

  return (
    <>
      <Box sx={styles.rootWrapper}>
        <Paper
          sx={styles.formsRoot}
          data-testid={NETWORKS_APPOINTMENT_TYPES_TEST_IDS.ROOT}
        >
          <Grid container rowSpacing={3}>
            {networkServiceLinesAppointmentTypes.map((serviceLine) => {
              return (
                <NetworksServiceLineForm
                  key={NETWORKS_SERVICE_LINE_FORM_TEST_IDS.getServiceLineFormTestId(
                    serviceLine.serviceLineId
                  )}
                  serviceLine={serviceLine}
                  modalities={modalities}
                  appointmentTypes={appointmentTypes}
                  networkAppointmentTypes={getNetworkServiceLineAppointmentTypes(
                    serviceLine.serviceLineId
                  )}
                  onSelectAppointmentType={handleOnSelectAppointmentType}
                  isDisabled={!isInsuranceAdmin}
                />
              );
            })}
          </Grid>
        </Paper>
      </Box>
      {isInsuranceAdmin && (
        <Box sx={styles.boxFormControlsWrapper}>
          <FormManageControls
            onCancel={onCancel}
            onSubmit={onSubmit}
            isLoading={isLoading}
          />
        </Box>
      )}
    </>
  );
};

export default NetworksAppointmentTypes;

import { NetworkForm, FormManageControls } from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  addAddress,
  domainSelectStates,
  getErrorMessageFromResponse,
  removeAddress,
  resetNetworkForm,
  selectInsuranceClassifications,
  selectNetworkForm,
  showError,
  showSuccess,
  updateInsuranceNetwork,
  updateNetworkAddressFormField,
  updateNetworkFormField,
  useAppDispatch,
  useGetInsuranceClassificationsQuery,
  useGetNetworkQuery,
  useGetStatesQuery,
} from '@*company-data-covered*/insurance/data-access';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
  MAX_NETWORK_ADDRESSES_AMOUNT,
  PayerNetworkPathParams,
} from '../constants';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect } from 'react';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';

const makeStyles = () =>
  makeSxStyles({
    boxFormWrapper: {
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
    },
  });

const NetworksDetails = () => {
  const styles = makeStyles();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);

  const { networkId = '' } = useParams<PayerNetworkPathParams>();
  useGetNetworkQuery(networkId || skipToken, {
    refetchOnMountOrArgChange: true,
  });
  useGetInsuranceClassificationsQuery();
  useGetStatesQuery();

  const networkForm = useSelector(selectNetworkForm);
  const { data: insuranceClassifications = [] } = useSelector(
    selectInsuranceClassifications
  );
  const { data: addressStates = [] } = useSelector(domainSelectStates);

  useEffect(() => {
    return () => {
      dispatch(resetNetworkForm());
    };
  }, [dispatch]);

  const onNavigateToPayerNetworksList = () => {
    navigate(
      INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
        networkForm.insurancePayerId
      ),
      { replace: true }
    );
  };

  const onCancel = () => onNavigateToPayerNetworksList();

  const onSubmit = () => {
    dispatch(updateInsuranceNetwork(Number(networkId), networkForm)).then(
      (res) => {
        if (!isQueryErrorResponse(res)) {
          dispatch(
            showSuccess({
              message:
                DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_UPDATE_SUCCESS,
            })
          );
          onNavigateToPayerNetworksList();
        } else {
          const errorMessage = getErrorMessageFromResponse(res);
          dispatch(
            showError({
              message:
                errorMessage ||
                DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_UPDATE_ERROR,
            })
          );
        }
      }
    );
  };
  const onChangeField = (fieldName: string, value: string | boolean) => {
    dispatch(updateNetworkFormField({ fieldName, value }));
  };
  const onChangeNetworkAddressFormField = (
    fieldName: string,
    value: string,
    addressToUpdateIndex: number
  ) => {
    dispatch(
      updateNetworkAddressFormField({
        fieldName,
        value,
        addressToUpdateIndex,
      })
    );
  };
  const onAddAddress = () => {
    dispatch(addAddress());
  };
  const onRemoveAddress = (addressToRemoveIndex: number) => {
    dispatch(removeAddress(addressToRemoveIndex));
  };

  const isAddAddressButtonVisible =
    networkForm.addresses.length < MAX_NETWORK_ADDRESSES_AMOUNT;

  const addAddressButtonTitle = networkForm.addresses.length
    ? 'Add Another Address'
    : 'Add Address';

  return (
    <>
      <Box sx={styles.boxFormWrapper}>
        <NetworkForm
          network={networkForm}
          onChangeField={onChangeField}
          onChangeNetworkAddressFormField={onChangeNetworkAddressFormField}
          networkClassifications={insuranceClassifications}
          addressStates={addressStates}
          isEditingForm
          isDisabled={!isInsuranceAdmin}
          isAddAddressButtonVisible={isAddAddressButtonVisible}
          addAddressButtonTitle={addAddressButtonTitle}
          onAddAddress={onAddAddress}
          onRemoveAddress={onRemoveAddress}
        />
      </Box>
      {isInsuranceAdmin && (
        <Box sx={styles.boxFormControlsWrapper}>
          <FormManageControls onCancel={onCancel} onSubmit={onSubmit} />
        </Box>
      )}
    </>
  );
};

export default NetworksDetails;

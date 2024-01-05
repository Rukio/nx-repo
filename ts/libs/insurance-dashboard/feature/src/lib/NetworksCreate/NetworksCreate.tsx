import { NetworkForm, FormManageControls } from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  addAddress,
  createInsuranceNetwork,
  domainSelectStates,
  getErrorMessageFromResponse,
  removeAddress,
  resetNetworkForm,
  selectInsuranceClassifications,
  selectNetworkForm,
  showError,
  showSuccess,
  updateNetworkAddressFormField,
  updateNetworkFormField,
  useAppDispatch,
  useGetInsuranceClassificationsQuery,
  useGetStatesQuery,
} from '@*company-data-covered*/insurance/data-access';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
  MAX_NETWORK_ADDRESSES_AMOUNT,
  PayerPathParams,
} from '../constants';

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

const NetworksCreate = () => {
  const styles = makeStyles();
  const { payerId = '' } = useParams<PayerPathParams>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const networkForm = useSelector(selectNetworkForm);
  useGetInsuranceClassificationsQuery();
  useGetStatesQuery();

  const { data: insuranceClassifications = [] } = useSelector(
    selectInsuranceClassifications
  );
  const { data: addressStates = [] } = useSelector(domainSelectStates);

  const onNavigateToPayerNetworksList = () => {
    dispatch(resetNetworkForm());
    navigate(INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(payerId), {
      replace: true,
    });
  };

  const onCancel = () => onNavigateToPayerNetworksList();

  const onSubmit = () => {
    dispatch(createInsuranceNetwork(networkForm, payerId)).then((res) => {
      if (!isQueryErrorResponse(res)) {
        dispatch(
          showSuccess({
            message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_SUCCESS,
          })
        );
        onNavigateToPayerNetworksList();
      } else {
        const errorMessage = getErrorMessageFromResponse(res);
        dispatch(
          showError({
            message:
              errorMessage ||
              DEFAULT_NOTIFICATION_MESSAGES.PAYER_NETWORK_CREATE_ERROR,
          })
        );
      }
    });
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
          isAddAddressButtonVisible={isAddAddressButtonVisible}
          addAddressButtonTitle={addAddressButtonTitle}
          onAddAddress={onAddAddress}
          onRemoveAddress={onRemoveAddress}
        />
      </Box>
      <Box sx={styles.boxFormControlsWrapper}>
        <FormManageControls onCancel={onCancel} onSubmit={onSubmit} />
      </Box>
    </>
  );
};

export default NetworksCreate;

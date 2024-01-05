import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DetailsPageHeader,
  PayerForm,
  FormManageControls,
} from '@*company-data-covered*/insurance/ui';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  selectPayerForm,
  updatePayerFormField,
  resetPayerForm,
  useAppDispatch,
  createInsurancePayer,
  selectManagePayersLoadingState,
  useGetPayerGroupsQuery,
  selectPayerGroupsForm,
  showSuccess,
  showError,
  getErrorMessageFromResponse,
} from '@*company-data-covered*/insurance/data-access';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  DEFAULT_NOTIFICATION_MESSAGES,
  INSURANCE_DASHBOARD_ROUTES,
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

const NewPayer = () => {
  const styles = makeStyles();
  const navigate = useNavigate();
  const payerForm = useSelector(selectPayerForm);
  useGetPayerGroupsQuery();
  const payerGroups = useSelector(selectPayerGroupsForm);
  const dispatch = useAppDispatch();
  const { isLoading: isLoadingCreatePayer } = useSelector(
    selectManagePayersLoadingState
  );

  const onNavigateToPayersList = () => {
    dispatch(resetPayerForm());
    navigate(INSURANCE_DASHBOARD_ROUTES.PAYERS);
  };
  const onChangeField = (
    fieldName: string,
    value: string | number | boolean
  ) => {
    dispatch(updatePayerFormField({ fieldName, value }));
  };
  const onCancel = () => {
    onNavigateToPayersList();
  };
  const onSubmit = () => {
    dispatch(createInsurancePayer(payerForm)).then((res) => {
      const errorMessage = getErrorMessageFromResponse(res);

      if (!isQueryErrorResponse(res)) {
        dispatch(
          showSuccess({
            message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_CREATE_SUCCESS,
          })
        );
        onNavigateToPayersList();
      } else {
        dispatch(
          showError({
            message:
              errorMessage || DEFAULT_NOTIFICATION_MESSAGES.PAYER_CREATE_ERROR,
          })
        );
      }
    });
  };

  return (
    <>
      <DetailsPageHeader title="New payer" onGoBack={onNavigateToPayersList} />
      <Box sx={styles.boxFormWrapper}>
        <PayerForm
          payerName={payerForm.name}
          payerNotes={payerForm.notes}
          active={payerForm.active}
          payerGroup={payerForm.payerGroupId}
          onChangeField={onChangeField}
          payerGroups={payerGroups}
        />
      </Box>
      <Box sx={styles.boxFormControlsWrapper}>
        <FormManageControls
          onCancel={onCancel}
          onSubmit={onSubmit}
          disabled={isLoadingCreatePayer}
        />
      </Box>
    </>
  );
};

export default NewPayer;

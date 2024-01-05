import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { PayerForm, FormManageControls } from '@*company-data-covered*/insurance/ui';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import { isQueryErrorResponse } from '@*company-data-covered*/shared/util/rtk';
import {
  useGetPayerQuery,
  selectPayerForm,
  updatePayerFormField,
  useAppDispatch,
  resetPayerForm,
  updateInsurancePayer,
  useDeletePayerMutation,
  useGetPayerGroupsQuery,
  selectPayerGroupsForm,
  showSuccess,
  showError,
  getErrorMessageFromResponse,
} from '@*company-data-covered*/insurance/data-access';
import { useUserRoles } from '@*company-data-covered*/auth0/feature';
import { UserRoles } from '@*company-data-covered*/auth0/util';
import {
  INSURANCE_DASHBOARD_ROUTES,
  PayerPathParams,
  DEFAULT_NOTIFICATION_MESSAGES,
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

const ManagePayer = () => {
  const styles = makeStyles();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { payerId } = useParams<PayerPathParams>();
  const [isInsuranceAdmin] = useUserRoles([UserRoles.INSURANCE_ADMIN]);
  useGetPayerQuery(payerId || skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const payerForm = useSelector(selectPayerForm);
  useGetPayerGroupsQuery();
  const payerGroups = useSelector(selectPayerGroupsForm);
  const [deletePayer] = useDeletePayerMutation();

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
    dispatch(updateInsurancePayer(Number(payerId), payerForm)).then((res) => {
      const errorMessage = getErrorMessageFromResponse(res);

      if (!errorMessage) {
        dispatch(
          showSuccess({
            message: DEFAULT_NOTIFICATION_MESSAGES.PAYER_EDIT_SUCCESS,
          })
        );
        onNavigateToPayersList();
      } else {
        dispatch(
          showError({
            message:
              errorMessage || DEFAULT_NOTIFICATION_MESSAGES.PAYER_EDIT_ERROR,
          })
        );
      }
    });
  };
  const onArchivePayer = () => {
    if (payerId) {
      deletePayer(payerId).then((res) => {
        if (!isQueryErrorResponse(res)) {
          onNavigateToPayersList();
        }
      });
    }
  };

  return (
    <>
      <Box sx={styles.boxFormWrapper}>
        <PayerForm
          payerName={payerForm.name}
          payerNotes={payerForm.notes}
          active={payerForm.active}
          payerGroup={payerForm.payerGroupId}
          onChangeField={onChangeField}
          payerGroups={payerGroups}
          onArchive={onArchivePayer}
          isEditingForm
          disabled={!isInsuranceAdmin}
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

export default ManagePayer;

import { useCallback } from 'react';
import { useSnackbar as useNotistackSnackbar } from 'notistack';
import { getErrorMessage } from './error';

export const SNACKBAR_MESSAGES = {
  CREATED_PATIENT: 'Patient Created',
  EDITED_PATIENT: 'Patient details saved',
  CREATED_EPISODE: 'Episode created',
  EDITED_EPISODE: 'Episode details saved',
  CREATED_NOTE: 'Note created',
  EDITED_NOTE: 'Note details saved',
  DELETED_NOTE: 'Note deleted',
  PINNED_NOTE: 'Note pinned',
  UNPINNED_NOTE: 'Note unpinned',
  CREATED_TASK: 'Task created',
  CREATED_TEMPLATE: 'Template created',
  EDITED_TASK: 'Task details saved',
  EDITED_TEMPLATE: 'Template saved',
  DELETED_TASK: 'Task deleted',
  DELETED_TEMPLATE: 'Template deleted',
  UPDATED_VISIT: 'Visit updated',
  CREATED_CALL: 'Call created',
  UPDATED_CALL: 'Call saved',
  CREATED_INSURANCE: 'Insurance created',
  UPDATED_INSURANCE: 'Insurance saved',
  CREATED_PHARMACY: 'Pharmacy created',
  EDITED_PHARMACY: 'Pharmacy saved',
  EDITED_MEDICAL_DECISION_MAKER: 'Medical Decision Maker details saved',
  DELETED_INSURANCE: 'Insurance deleted',
  CREATED_EXTERNAL_CARE_PROVIDER: 'External Care Provider created',
  UPDATED_EXTERNAL_CARE_PROVIDER: 'External Care Provider updated',
  DELETED_EXTERNAL_CARE_PROVIDER: 'External Care Provider deleted',
  SCHEDULED_VISIT: 'Visit scheduled',
  REMOVED_VISIT: 'Visit removed',
  CANCELED_VISIT: 'Visit canceled',
};

export const DEFAULT_AUTO_HIDE_SNACKBAR = 3000;

export const useSnackbar = () => {
  const { enqueueSnackbar } = useNotistackSnackbar();

  const showSuccess = useCallback(
    (message: string) =>
      enqueueSnackbar(message, {
        variant: 'success',
        autoHideDuration: DEFAULT_AUTO_HIDE_SNACKBAR,
      }),
    [enqueueSnackbar]
  );

  const showWarning = useCallback(
    (message: string) =>
      enqueueSnackbar(message, {
        variant: 'warning',
        autoHideDuration: DEFAULT_AUTO_HIDE_SNACKBAR,
      }),
    [enqueueSnackbar]
  );

  const showError = useCallback(
    async (err: Response) =>
      enqueueSnackbar(await getErrorMessage(err), {
        variant: 'error',
        autoHideDuration: DEFAULT_AUTO_HIDE_SNACKBAR,
      }),
    [enqueueSnackbar]
  );

  return {
    showSuccess,
    showWarning,
    showError,
  };
};

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  SNACKBAR_MESSAGES,
  useSnackbar,
} from '@*company-data-covered*/caremanager/utils';
import { useDeleteExternalCareProvider } from '@*company-data-covered*/caremanager/data-access';
import { ExternalCareProvider } from '@*company-data-covered*/caremanager/data-access-types';

const styles = makeSxStyles({
  actions: { padding: 3 },
  content: { paddingBottom: 0 },
});

export const SUBMIT_BUTTON_TEST_ID =
  'delete-external-care-provider-submit-button';

type Props = {
  externalCareProvider: ExternalCareProvider;
  open: boolean;
  onClose: () => void;
};

const DeleteExternalCareProviderDialog: React.FC<Props> = ({
  externalCareProvider,
  open,
  onClose,
}) => {
  const { showSuccess } = useSnackbar();
  const { mutateAsync: deleteECP, isLoading } = useDeleteExternalCareProvider(
    externalCareProvider.patientId
  );

  const handleSubmit = async () => {
    await deleteECP({ externalCareProviderId: externalCareProvider.id });

    showSuccess(SNACKBAR_MESSAGES.DELETED_EXTERNAL_CARE_PROVIDER);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete External Care Provider?</DialogTitle>
      <DialogContent sx={styles.content}>
        <DialogContentText>
          This action cannot be undone. You will need to type the information
          again if you need it.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button
          disabled={isLoading}
          onClick={handleSubmit}
          color="error"
          data-testid={SUBMIT_BUTTON_TEST_ID}
        >
          Delete
        </Button>
        <Button
          disabled={isLoading}
          onClick={onClose}
          variant="contained"
          autoFocus
        >
          Keep
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteExternalCareProviderDialog;

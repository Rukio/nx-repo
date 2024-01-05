import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useDeleteInsurance } from '@*company-data-covered*/caremanager/data-access';
import { Insurance } from '@*company-data-covered*/caremanager/data-access-types';

export const SUBMIT_BUTTON_TEST_ID = 'delete-insurance-submit-button';

const styles = makeSxStyles({
  actions: { padding: 3 },
  content: { paddingBottom: 0 },
});

type Props = {
  insurance: Insurance;
  open: boolean;
  onClose: () => void;
};

const DeleteInsuranceDialog: React.FC<Props> = ({
  insurance,
  open,
  onClose,
}) => {
  const { mutateAsync: deleteInsurance, isLoading } = useDeleteInsurance(
    insurance.patientId
  );

  const handleSubmit = async () => {
    await deleteInsurance({ insuranceId: insurance.id });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Insurance?</DialogTitle>
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

export default DeleteInsuranceDialog;

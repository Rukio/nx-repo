import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@*company-data-covered*/design-system';

type TemplateDeleteConfirmationProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

const TemplateDeleteConfirmation: React.FC<TemplateDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => (
  <Dialog open={isOpen} data-testid="idle-logout-modal">
    <DialogTitle id="alert-dialog-title" data-testid="idle-logout-modal-title">
      Delete Template?
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="alert-dialog-description">
        <Typography variant="body2" data-testid="idle-logout-modal-message">
          All tasks and information belonging to this template will be deleted
        </Typography>
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button color="primary" variant="text" onClick={onClose}>
        Close
      </Button>
      <Button
        color="error"
        onClick={onSubmit}
        data-testid="delete-template-confirmation-button"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default TemplateDeleteConfirmation;

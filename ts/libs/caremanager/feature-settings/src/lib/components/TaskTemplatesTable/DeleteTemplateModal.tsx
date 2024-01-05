import { FC } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@*company-data-covered*/design-system';

interface DeleteTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteTemplate: () => void;
}

const DeleteTemplateModal: FC<DeleteTemplateModalProps> = ({
  isOpen,
  onClose,
  onDeleteTemplate,
}) => (
  <Dialog
    open={isOpen}
    onClose={onClose}
    data-testid="delete-task-template-modal"
  >
    <DialogTitle>Delete Template?</DialogTitle>
    <DialogContent>
      All tasks and information belonging to this template will be deleted
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        data-testid="delete-template-button"
        onClick={onDeleteTemplate}
        variant="contained"
        color="error"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteTemplateModal;

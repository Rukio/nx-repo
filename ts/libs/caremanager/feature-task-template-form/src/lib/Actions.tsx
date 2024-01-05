import {
  Box,
  Button,
  DeleteIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  deleteIcon: { mr: 1 },
});

type ActionProps = {
  onSave: () => void;
  onDelete?: () => void;
  disabled?: boolean;
};

const CreateButton: React.FC<ActionProps> = ({ onSave }) => (
  <Box width="100%" display="flex" mt={3} justifyContent="flex-end">
    <Button
      color="primary"
      variant="contained"
      data-testid="create-task-template-submit-button"
      onClick={onSave}
    >
      Create Template
    </Button>
  </Box>
);

const SaveDeleteButton: React.FC<ActionProps> = ({ onSave, onDelete }) => (
  <Box width="100%" display="flex" mt={3} justifyContent="space-between">
    <Button
      color="error"
      variant="text"
      data-testid="task-template-delete-button"
      onClick={onDelete}
    >
      <DeleteIcon sx={styles.deleteIcon} /> Delete
    </Button>
    <Button
      color="primary"
      variant="contained"
      data-testid="task-template-submit-button"
      type="submit"
      onClick={onSave}
    >
      Save
    </Button>
  </Box>
);

export { CreateButton, SaveDeleteButton };

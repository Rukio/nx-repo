import {
  DhDialog,
  IconButton,
  Menu,
  MenuItem,
  MoreVertIcon,
  TableCell,
  Typography,
} from '@*company-data-covered*/design-system';
import React, { SyntheticEvent, useState } from 'react';
import { QUESTION_BANK_TABLE_BODY_ACTIONS_CELL_TEST_IDS as TEST_IDS } from '../testIds';
import QuestionBankQuestionModal from '../../QuestionBankQuestionModal/QuestionBankQuestionModal';
import { QuestionBankQuestion } from '../../../types';

type ActionsCellProps = {
  onDelete: () => void;
  isDeleteDisabled: boolean;
  question: QuestionBankQuestion;
  onEdit: (patientQuestion: string, noPatientQuestion?: string) => void;
};

const ActionsCell: React.FC<ActionsCellProps> = ({
  onEdit,
  question,
  onDelete,
  isDeleteDisabled,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<
    (EventTarget & HTMLButtonElement) | null
  >(null);
  const isMenuOpen = Boolean(anchorEl);

  const openMenu = (event: SyntheticEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const openDeleteConfirm = () => {
    closeMenu();
    setIsDeleteDialogOpen(true);
  };

  const handleOnDelete = () => {
    setIsDeleteDialogOpen(false);

    onDelete();
  };

  const openEditQuestion = () => {
    setIsEditModalOpen(true);
  };

  const handleOnEditSubmit = (
    patientQuestion: string,
    noPatientQuestion?: string
  ) => {
    setIsEditModalOpen(false);
    onEdit(patientQuestion, noPatientQuestion);
  };

  return (
    <TableCell>
      <IconButton onClick={openMenu} data-testid={TEST_IDS.MENU_BUTTON}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="edit-delete-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
      >
        <MenuItem onClick={openEditQuestion} data-testid={TEST_IDS.EDIT_BUTTON}>
          <Typography variant="body2">Edit</Typography>
        </MenuItem>
        <MenuItem
          onClick={openDeleteConfirm}
          disabled={isDeleteDisabled}
          data-testid={TEST_IDS.DELETE_BUTTON}
        >
          <Typography variant="body2" color="error.main">
            Delete
          </Typography>
        </MenuItem>
      </Menu>

      <DhDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Question?"
        content="This action cannot be undone."
        cancelButtonLabel="Cancel"
        confirmButtonLabel="Delete"
        confirmButtonProps={{ color: 'error' }}
        handleClose={() => setIsDeleteDialogOpen(false)}
        handleConfirm={handleOnDelete}
      />

      {isEditModalOpen && (
        <QuestionBankQuestionModal
          isOpen
          title="Edit Question"
          onSubmit={handleOnEditSubmit}
          confirmButtonLabel="Update Question"
          patientQuestionValue={question.patientQuestion}
          noPatientQuestionValue={question.thirdPersonQuestion}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
        />
      )}
    </TableCell>
  );
};

export { ActionsCellProps };
export default ActionsCell;

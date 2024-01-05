import { FC, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  DeleteIcon,
  DhDialog,
  EditIcon,
  KeyboardBackspaceIcon,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';
import { QUESTION_BANK_QUESTION_DETAIL_TEST_IDS as TEST_IDS } from './testIds';
import { QuestionBankQuestion } from '../../types';
import { QuestionBankQuestionModal } from '../QuestionBankQuestionModal';

const makeStyles = () =>
  makeSxStyles({
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerBack: {
      padding: 0,
      marginBottom: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerBackIcon: { color: 'text.secondary', marginRight: 1 },
    content: { backgroundColor: 'background.paper', padding: 3, marginTop: 3 },
    questionItem: { marginTop: 4 },
    response: { marginTop: 1 },
    idVersion: { display: 'flex', gap: 7 },
    concerns: { display: 'flex', gap: 1, flexWrap: 'wrap' },
    deleteBtn: { marginTop: 4 },
  });

interface Props {
  onBack: () => void;
  onDelete: (id: QuestionBankQuestion['id']) => void;
  question: Omit<QuestionBankQuestion, 'createdBy' | 'lastUpdated'>;
  onEdit: (
    questionId: QuestionBankQuestion['id'],
    patientQuestion: string,
    noPatientQuestion?: string
  ) => void;
}

const QuestionBankQuestionDetail: FC<Props> = ({
  question,
  onBack,
  onEdit,
  onDelete,
}) => {
  const styles = makeStyles();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openDeleteDialog = () => setIsDeleteDialogOpen(true);
  const closeDeleteDialog = () => setIsDeleteDialogOpen(false);
  const handleOnDelete = () => {
    setIsDeleteDialogOpen(false);

    onDelete(question.id);
  };

  const openEditQuestion = () => setIsEditModalOpen(true);
  const closeEditQuestion = () => setIsEditModalOpen(false);
  const handleOnEditSubmit = (
    patientQuestion: string,
    noPatientQuestion?: string
  ) => {
    closeEditQuestion();
    onEdit(question.id, patientQuestion, noPatientQuestion);
  };

  return (
    <>
      <Box data-testid={TEST_IDS.QUESTION_DETAIL}>
        <Box sx={styles.header}>
          <Box>
            <Button
              onClick={onBack}
              sx={styles.headerBack}
              data-testid={TEST_IDS.BACK_BTN}
            >
              <KeyboardBackspaceIcon sx={styles.headerBackIcon} />
              <Typography variant="body2" color="text.secondary">
                Back
              </Typography>
            </Button>

            <Typography variant="h5">View Question</Typography>
          </Box>

          <Button
            size="large"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={openEditQuestion}
            data-testid={TEST_IDS.EDIT_BTN}
          >
            Edit
          </Button>
        </Box>

        <Box sx={styles.content}>
          <Box>
            <Typography variant="subtitle2">Patient Question</Typography>
            <Typography variant="body1" sx={styles.response}>
              {question.patientQuestion}
            </Typography>
          </Box>

          <Box sx={styles.questionItem}>
            <Typography variant="subtitle2">Someone else Question</Typography>
            <Typography variant="body1" sx={styles.response}>
              {question.thirdPersonQuestion}
            </Typography>
          </Box>

          <Box sx={[styles.questionItem, styles.idVersion]}>
            <Box>
              <Typography variant="subtitle2">Unique Identifier</Typography>
              <Typography variant="body2" sx={styles.response}>
                {question.id}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Version</Typography>
              <Typography variant="body2" sx={styles.response}>
                {question.version}
              </Typography>
            </Box>
          </Box>

          <Box sx={styles.questionItem}>
            <Typography variant="subtitle2">
              Time Sensitive Concerns Appearances
            </Typography>

            <Box sx={[styles.response, styles.concerns]}>
              {question.timeSensitiveConcerns.map((concern) => (
                <Chip
                  key={concern.value}
                  label={concern.value}
                  data-testid={TEST_IDS.CONCERN}
                />
              ))}
            </Box>
          </Box>
        </Box>

        <Button
          size="large"
          color="error"
          variant="contained"
          sx={styles.deleteBtn}
          startIcon={<DeleteIcon />}
          disabled={!question.isDeletable}
          data-testid={TEST_IDS.DELETE_BTN}
          onClick={openDeleteDialog}
        >
          Delete
        </Button>

        <DhDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Question?"
          content="This action cannot be undone."
          cancelButtonLabel="Cancel"
          confirmButtonLabel="Delete"
          confirmButtonProps={{ color: 'error' }}
          handleClose={closeDeleteDialog}
          handleConfirm={handleOnDelete}
        />
      </Box>

      {isEditModalOpen && (
        <QuestionBankQuestionModal
          isOpen
          title="Edit Question"
          onSubmit={handleOnEditSubmit}
          confirmButtonLabel="Update Question"
          patientQuestionValue={question.patientQuestion}
          noPatientQuestionValue={question.thirdPersonQuestion}
          onClose={closeEditQuestion}
        />
      )}
    </>
  );
};

export { Props as QuestionBankQuestionDetailProps };
export default QuestionBankQuestionDetail;

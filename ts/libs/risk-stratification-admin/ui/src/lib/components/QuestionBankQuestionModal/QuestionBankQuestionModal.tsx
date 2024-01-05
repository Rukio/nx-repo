import { FC, useState } from 'react';
import {
  DhDialog,
  DhDialogProps,
  Divider,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import ModalQuestion from './ModalQuestion';
import { QUESTION_BANK_QUESTION_MODAL_TEST_IDS as TEST_IDS } from './testIds';
import { QuestionBankQuestion } from '../../types';

interface QuestionBankQuestionModalProps
  extends Pick<DhDialogProps, 'isOpen' | 'title' | 'confirmButtonLabel'> {
  onClose: () => void;
  patientQuestionValue?: QuestionBankQuestion['patientQuestion'];
  noPatientQuestionValue?: QuestionBankQuestion['thirdPersonQuestion'];
  onSubmit: (patientQuestion: string, noPatientQuestion?: string) => void;
}

const makeStyles = () =>
  makeSxStyles({
    content: { width: 600 },
  });

const QuestionBankQuestionModal: FC<QuestionBankQuestionModalProps> = ({
  title,
  isOpen,
  onClose,
  onSubmit,
  confirmButtonLabel,
  patientQuestionValue,
  noPatientQuestionValue,
}) => {
  const styles = makeStyles();

  const [patientQuestion, setPatientQuestion] = useState(
    patientQuestionValue || ''
  );
  const [noPatientQuestion, setNoPatientQuestion] = useState(
    noPatientQuestionValue || ''
  );

  const handleConfirm = () => {
    onSubmit(patientQuestion, noPatientQuestion);
  };

  return (
    <DhDialog
      title={title}
      isOpen={isOpen}
      fixedHeight="543"
      handleClose={onClose}
      handleConfirm={handleConfirm}
      confirmButtonLabel={confirmButtonLabel}
      dialogProps={{ PaperProps: { sx: styles.content }, keepMounted: false }}
      confirmButtonProps={{ disabled: !patientQuestion }}
      content={
        <div data-testid={TEST_IDS.CONTENT}>
          <ModalQuestion
            title="Patient"
            value={patientQuestion}
            onChange={setPatientQuestion}
            placeholder="Patient Question"
            label="Phrase this question for when we are speaking directly to the patient."
          />

          <Divider sx={{ marginTop: 2, marginBottom: 3 }} />

          <ModalQuestion
            title="Someone else"
            helperText="Optional"
            value={noPatientQuestion}
            placeholder="Someone else"
            onChange={setNoPatientQuestion}
            label="Phrase this question for when we are speaking to someone other than the patient."
          />
        </div>
      }
    />
  );
};

export { QuestionBankQuestionModalProps };
export default QuestionBankQuestionModal;

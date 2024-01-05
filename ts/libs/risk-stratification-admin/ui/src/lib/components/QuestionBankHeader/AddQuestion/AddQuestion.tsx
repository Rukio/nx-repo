import { AddIcon, Button } from '@*company-data-covered*/design-system';
import { FC, useState } from 'react';
import {
  QuestionBankQuestionModal,
  QuestionBankQuestionModalProps,
} from '../../QuestionBankQuestionModal';
import { QUESTION_BANK_HEADER_ADD_QUESTION_TEST_IDS as TEST_IDS } from '../testIds';

interface AddQuestionProps {
  onPublish: QuestionBankQuestionModalProps['onSubmit'];
}

const AddQuestion: FC<AddQuestionProps> = ({ onPublish }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleIsModalOpen = (modalOpen = true) => setIsModalOpen(modalOpen);

  const handleOnPublish = (
    patientQuestion: string,
    noPatientQuestion?: string
  ) => {
    toggleIsModalOpen(false);

    onPublish(patientQuestion, noPatientQuestion);
  };

  return (
    <>
      <Button
        size="large"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => toggleIsModalOpen(true)}
        data-testid={TEST_IDS.OPEN_MODAL_BUTTON}
      >
        Add New Question
      </Button>

      {isModalOpen && (
        <QuestionBankQuestionModal
          isOpen
          title="Add New Question"
          confirmButtonLabel="Publish Question"
          onClose={() => toggleIsModalOpen(false)}
          onSubmit={handleOnPublish}
        />
      )}
    </>
  );
};

export { AddQuestionProps };
export default AddQuestion;

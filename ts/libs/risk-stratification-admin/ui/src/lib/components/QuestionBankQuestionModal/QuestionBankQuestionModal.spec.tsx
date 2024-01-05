import { render, screen } from '../../../testUtils';
import QuestionBankQuestionModal, {
  QuestionBankQuestionModalProps,
} from './QuestionBankQuestionModal';

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

const setup = (props: Partial<QuestionBankQuestionModalProps> = {}) => {
  return render(
    <QuestionBankQuestionModal
      isOpen={true}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
      title="Add Question"
      confirmButtonLabel="Publish Question"
      {...props}
    />
  );
};

describe('<QuestionBankQuestionModal />', () => {
  it('should render modal with default values', () => {
    setup();

    const patientQuestionInput = screen.getByLabelText('Patient Question');
    const noPatientQuestionInput = screen.getByLabelText('Someone else');

    expect(patientQuestionInput).toHaveValue('');
    expect(noPatientQuestionInput).toHaveValue('');
  });

  it('should accept pre-defined values for patient question and no patient question', () => {
    setup({
      patientQuestionValue: 'some patient question?',
      noPatientQuestionValue: 'some no patient question?',
    });

    const patientQuestionInput = screen.getByLabelText('Patient Question');
    const noPatientQuestionInput = screen.getByLabelText('Someone else');

    expect(patientQuestionInput).toHaveValue('some patient question?');
    expect(noPatientQuestionInput).toHaveValue('some no patient question?');
  });

  it('should call onClose', async () => {
    const { user } = setup();

    // "x" button
    const closeButton = screen.getByRole('button', { name: 'close' });

    expect(mockOnClose).not.toHaveBeenCalled();

    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable submit button if patient question is not typed', async () => {
    const { user } = setup();

    expect(screen.getByText('Publish Question')).toBeDisabled();

    await user.type(
      screen.getByLabelText('Someone else'),
      'someone else question?'
    );

    expect(screen.getByText('Publish Question')).toBeDisabled();

    await user.type(
      screen.getByLabelText('Patient Question'),
      'some patient question?'
    );

    expect(screen.getByText('Publish Question')).toBeEnabled();
  });

  it('should call onSubmit', async () => {
    const { user } = setup();

    await user.type(
      screen.getByLabelText('Patient Question'),
      'some patient question?'
    );

    await user.type(
      screen.getByLabelText('Someone else'),
      'someone else question?'
    );

    await user.click(screen.getByText('Publish Question'));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      'some patient question?',
      'someone else question?'
    );
  });

  it('should allow title and confirm button label to be customized', () => {
    setup({
      title: 'Edit Question',
      confirmButtonLabel: 'Update Question',
    });

    expect(screen.getByText('Edit Question')).toBeVisible();
    expect(screen.getByText('Update Question')).toBeVisible();
  });
});

import { render, screen } from '../../../testUtils';
import QuestionDetail, {
  QuestionBankQuestionDetailProps,
} from './QuestionBankQuestionDetail';
import { QUESTION_BANK_QUESTION_DETAIL_TEST_IDS as TEST_IDS } from './testIds';
import { QUESTION_BANK_QUESTION_MODAL_TEST_IDS as MODAL_TEST_IDS } from '../QuestionBankQuestionModal';

const mockOnBack = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

const setup = (
  props: Partial<QuestionBankQuestionDetailProps> = {},
  questionProps: Partial<QuestionBankQuestionDetailProps['question']> = {}
) => {
  return render(
    <QuestionDetail
      onBack={mockOnBack}
      onEdit={mockOnEdit}
      onDelete={mockOnDelete}
      question={{
        id: '1234',
        version: 1,
        isDeletable: true,
        patientQuestion: 'Did you hit your head?',
        thirdPersonQuestion: 'Did he/she hit their head?',
        timeSensitiveConcerns: [
          {
            isBranch: false,
            value: 'Heart Attack 19+',
          },
          { isBranch: false, value: 'Stroke' },
        ],
        ...questionProps,
      }}
      {...props}
    />
  );
};

describe('<QuestionDetail />', () => {
  it('should render properly', () => {
    setup();

    expect(screen.getByTestId(TEST_IDS.QUESTION_DETAIL)).toBeVisible();
  });

  it('should render time sensitive concerns', () => {
    const timeSensitiveConcerns = [
      { isBranch: false, value: 'Heart Attack 19+' },
      { isBranch: false, value: 'Nausea / Vomiting' },
      { isBranch: false, value: 'Respiratory Distress' },
      { isBranch: false, value: 'Shortness of Breath' },
      { isBranch: false, value: 'Stroke' },
    ];

    setup({}, { timeSensitiveConcerns });

    expect(screen.getAllByTestId(TEST_IDS.CONCERN)).toHaveLength(5);
    expect(screen.getByText(timeSensitiveConcerns[0].value)).toBeVisible();
    expect(screen.getByText(timeSensitiveConcerns[1].value)).toBeVisible();
    expect(screen.getByText(timeSensitiveConcerns[2].value)).toBeVisible();
    expect(screen.getByText(timeSensitiveConcerns[3].value)).toBeVisible();
    expect(screen.getByText(timeSensitiveConcerns[4].value)).toBeVisible();
  });

  it('should enable Delete button when isDeletable is true', () => {
    setup({}, { isDeletable: true });

    expect(screen.getByTestId(TEST_IDS.DELETE_BTN)).toBeEnabled();
  });

  it('should disable Delete button when isDeletable is false', () => {
    setup({}, { isDeletable: false });

    expect(screen.getByTestId(TEST_IDS.DELETE_BTN)).toBeDisabled();
  });

  it('should call onDelete', async () => {
    const { user } = setup();

    expect(mockOnDelete).not.toHaveBeenCalled();

    await user.click(screen.getByTestId(TEST_IDS.DELETE_BTN));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('1234');
  });

  it('should call onBack', async () => {
    const { user } = setup();

    expect(mockOnBack).toHaveBeenCalledTimes(0);

    await user.click(screen.getByTestId(TEST_IDS.BACK_BTN));

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should open modal on Edit button click', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.EDIT_BTN));

    const editQuestionModal = screen.getByTestId(MODAL_TEST_IDS.CONTENT);

    expect(editQuestionModal).toBeVisible();
  });

  it('should display question values as initial values in modal', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.EDIT_BTN));

    const patientQuestionInput = screen.getByLabelText('Patient Question');
    const thirdPersonQuestionInput = screen.getByLabelText('Someone else');

    expect(screen.getByTestId(MODAL_TEST_IDS.CONTENT)).toBeVisible();
    expect(patientQuestionInput).toHaveValue('Did you hit your head?');
    expect(thirdPersonQuestionInput).toHaveValue('Did he/she hit their head?');
  });

  it('should call onEdit with updated question values', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.EDIT_BTN));

    const patientQuestionInput = screen.getByLabelText('Patient Question');
    const patientQuestionNewValue = 'new patient question?';
    const thirdPersonQuestionInput = screen.getByLabelText('Someone else');
    const noPatientQuestionNewValue = 'new third person question?';
    const saveButton = screen.getByText('Update Question');

    await user.clear(patientQuestionInput);
    await user.type(patientQuestionInput, patientQuestionNewValue);
    await user.clear(thirdPersonQuestionInput);
    await user.type(thirdPersonQuestionInput, noPatientQuestionNewValue);
    await user.click(saveButton);

    expect(mockOnEdit).toHaveBeenCalledWith(
      '1234',
      patientQuestionNewValue,
      noPatientQuestionNewValue
    );
  });
});

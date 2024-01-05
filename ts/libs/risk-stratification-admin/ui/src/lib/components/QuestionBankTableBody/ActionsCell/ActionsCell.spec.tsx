import { render, screen } from '../../../../testUtils';
import { Table, TableBody, TableRow } from '@*company-data-covered*/design-system';
import { ActionsCell, ActionsCellProps } from './index';
import { QUESTION_BANK_TABLE_BODY_ACTIONS_CELL_TEST_IDS as TEST_IDS } from '../testIds';
import { QuestionBankQuestion } from '../../../types';
import { QUESTION_BANK_QUESTION_MODAL_TEST_IDS as MODAL_TEST_IDS } from '../../QuestionBankQuestionModal';

const mockOnDelete = jest.fn();
const mockOnEdit = jest.fn();

const setup = (props?: Partial<ActionsCellProps>) => {
  const mockQuestion: QuestionBankQuestion = {
    id: '1',
    patientQuestion: 'some question?',
    thirdPersonQuestion: 'third person question?',
    version: 1,
    isDeletable: false,
    createdBy: 'John Doe',
    lastUpdated: new Date().toISOString(), // ISO string
    timeSensitiveConcerns: [],
  };

  return render(
    <Table>
      <TableBody>
        <TableRow>
          <ActionsCell
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            question={mockQuestion}
            isDeleteDisabled={false}
            {...props}
          />
        </TableRow>
      </TableBody>
    </Table>
  );
};

describe('<ActionsCell />', () => {
  it('should render properly', () => {
    setup();

    expect(screen.getByTestId(TEST_IDS.MENU_BUTTON)).toBeVisible();
  });

  it('should disable Delete button when isDeletable', async () => {
    const { user } = setup({ isDeleteDisabled: true });

    await user.click(screen.getByTestId(TEST_IDS.MENU_BUTTON));

    // toBeDisabled() does not work in this case
    // https://github.com/testing-library/jest-dom/issues/144
    expect(screen.getByTestId(TEST_IDS.DELETE_BUTTON)).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('should display confirmation dialog when Delete button is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(TEST_IDS.DELETE_BUTTON));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('This action cannot be undone.')).toBeVisible();
    expect(mockOnDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('should open modal on Edit button click', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(TEST_IDS.EDIT_BUTTON));

    const editQuestionModal = screen.getByTestId(MODAL_TEST_IDS.CONTENT);

    expect(editQuestionModal).toBeVisible();
  });

  it('should display question values as initial values in modal', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(TEST_IDS.EDIT_BUTTON));

    const patientQuestionInput = screen.getByLabelText('Patient Question');
    const thirdPersonQuestionInput = screen.getByLabelText('Someone else');

    expect(screen.getByTestId(MODAL_TEST_IDS.CONTENT)).toBeVisible();
    expect(patientQuestionInput).toHaveValue('some question?');
    expect(thirdPersonQuestionInput).toHaveValue('third person question?');
  });

  it('should call onEdit with updated question values', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(TEST_IDS.EDIT_BUTTON));

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
      patientQuestionNewValue,
      noPatientQuestionNewValue
    );
  });
});

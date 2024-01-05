import { render, screen } from '../../../testUtils';
import QuestionBankTableBody from './QuestionBankTableBody';
import {
  QUESTION_BANK_TABLE_BODY_ACTIONS_CELL_TEST_IDS as QUESTION_ROW_TEST_IDS,
  QUESTION_BANK_TABLE_BODY_TEST_IDS as TEST_IDS,
} from './testIds';
import { Table } from '@*company-data-covered*/design-system';
import { QuestionBankQuestion } from '../../types';

const mockOnDelete = jest.fn();
const mockOnEdit = jest.fn();

const setup = () => {
  const questions: QuestionBankQuestion[] = [
    {
      id: '123',
      patientQuestion: 'Are you having any new chest pain?',
      thirdPersonQuestion: 'Is the patient having any new chest pain?',
      version: 1,
      isDeletable: true,
      createdBy: 'John Doe',
      lastUpdated: new Date().toISOString(), // ISO string
      timeSensitiveConcerns: [
        { value: 'Heart Attack', isBranch: Math.random() > 0.5 },
        { value: 'Nausea / Vomiting', isBranch: Math.random() > 0.5 },
        { value: 'Shortness of Breath', isBranch: Math.random() > 0.5 },
      ],
    },
  ];

  return render(
    <Table>
      <QuestionBankTableBody
        questions={questions}
        onDelete={mockOnDelete}
        onEdit={mockOnEdit}
      />
    </Table>
  );
};

describe('<QuestionBankTableBody />', () => {
  it('should render properly', () => {
    setup();

    const body = screen.getByTestId(TEST_IDS.BODY);

    expect(body).toBeVisible();
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(QUESTION_ROW_TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(QUESTION_ROW_TEST_IDS.DELETE_BUTTON));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const { user } = setup();

    await user.click(screen.getByTestId(QUESTION_ROW_TEST_IDS.MENU_BUTTON));
    await user.click(screen.getByTestId(QUESTION_ROW_TEST_IDS.EDIT_BUTTON));
    await user.click(screen.getByText('Update Question'));

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(
      '123',
      'Are you having any new chest pain?',
      'Is the patient having any new chest pain?'
    );
  });
});

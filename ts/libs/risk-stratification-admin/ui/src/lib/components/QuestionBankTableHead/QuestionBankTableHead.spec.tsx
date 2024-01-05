import { render, screen } from '../../../testUtils';
import QuestionBankTableHead from './QuestionBankTableHead';
import { QUESTION_BANK_TABLE_HEAD_TEST_IDS } from './testIds';

describe('<QuestionBankTableHead />', () => {
  it('should render properly', () => {
    render(
      <table>
        <QuestionBankTableHead />
      </table>
    );

    const head = screen.getByTestId(QUESTION_BANK_TABLE_HEAD_TEST_IDS.HEAD);

    expect(head).toBeVisible();
  });

  it('should render expected columns', () => {
    render(
      <table>
        <QuestionBankTableHead />
      </table>
    );

    const columns = screen.getAllByRole('columnheader');
    // 5 columns
    expect(columns).toHaveLength(5);

    // Visible
    expect(columns[0]).toBeVisible();
    expect(columns[1]).toBeVisible();
    expect(columns[2]).toBeVisible();
    expect(columns[3]).toBeVisible();
    expect(columns[4]).toBeVisible();

    // and in the correct order
    expect(columns[0]).toHaveTextContent('Question');
    expect(columns[1]).toHaveTextContent('Time Sensitive Concerns');
    expect(columns[2]).toHaveTextContent('Created By');
    expect(columns[3]).toHaveTextContent('Last Updated');
    expect(columns[4]).toHaveTextContent('');
  });
});

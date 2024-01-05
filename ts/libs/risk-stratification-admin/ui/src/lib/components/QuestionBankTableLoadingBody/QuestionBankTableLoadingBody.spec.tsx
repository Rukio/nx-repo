import { render, screen } from '../../../testUtils';
import QuestionBankTableLoadingBody from './QuestionBankTableLoadingBody';
import { QUESTION_BANK_TABLE_LOADING_BODY_TEST_IDS } from './testIds';
import { Table } from '@*company-data-covered*/design-system';

describe('<QuestionBankTableLoadingBody />', () => {
  it('should render properly', () => {
    render(
      <Table>
        <QuestionBankTableLoadingBody columns={1} />
      </Table>
    );

    const body = screen.getByTestId(
      QUESTION_BANK_TABLE_LOADING_BODY_TEST_IDS.BODY
    );

    expect(body).toBeVisible();
  });

  it('should render default number of rows', () => {
    render(
      <Table>
        <QuestionBankTableLoadingBody columns={1} />
      </Table>
    );

    const rows = screen.getAllByRole('row');

    expect(rows).toHaveLength(7);
  });

  it('should render passed number of rows', () => {
    render(
      <Table>
        <QuestionBankTableLoadingBody rows={5} columns={1} />
      </Table>
    );

    const rows = screen.getAllByRole('row');

    expect(rows).toHaveLength(5);
  });

  it('should render passed number of columns', () => {
    render(
      <Table>
        <QuestionBankTableLoadingBody rows={1} columns={4} />
      </Table>
    );

    const columns = screen.getAllByRole('cell');

    expect(columns).toHaveLength(4);
  });
});

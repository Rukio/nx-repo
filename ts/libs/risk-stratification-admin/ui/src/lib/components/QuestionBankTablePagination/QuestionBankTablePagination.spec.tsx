import { render, screen } from '../../../testUtils';
import QuestionBankTablePagination, {
  QuestionBankTablePaginationProps,
} from './QuestionBankTablePagination';
import { QUESTION_BANK_TABLE_PAGINATION_TEST_IDS } from './testIds';
import { Table } from '@*company-data-covered*/design-system';

describe('<QuestionBankTablePagination />', () => {
  const props: QuestionBankTablePaginationProps = {
    page: 0,
    rowsPerPage: 25,
    count: 0,
    onPageChange: jest.fn(),
  };

  it('should render properly', () => {
    render(
      <Table>
        <QuestionBankTablePagination {...props} />
      </Table>
    );

    const footer = screen.getByTestId(
      QUESTION_BANK_TABLE_PAGINATION_TEST_IDS.FOOTER
    );
    const pagination = screen.getByTestId(
      QUESTION_BANK_TABLE_PAGINATION_TEST_IDS.PAGINATION
    );

    expect(footer).toBeVisible();
    expect(pagination).toBeVisible();
  });

  it('should defined rows per page', async () => {
    const { user } = render(
      <Table>
        <QuestionBankTablePagination {...props} />
      </Table>
    );

    let rowsPerPageSelect = screen.queryByRole('listbox');

    // It does not exist until is opened
    expect(rowsPerPageSelect).toBeNull();

    const rowsPerPageSelectBtn = screen.getByRole('button', {
      expanded: false,
    });

    // Open the select
    await user.click(rowsPerPageSelectBtn);

    // Now it exists
    rowsPerPageSelect = screen.queryByRole('listbox');
    expect(rowsPerPageSelect).not.toBeNull();

    // Check the options are correct
    const rowsPerPage = screen.getAllByRole('option');

    expect(rowsPerPage).toHaveLength(3);
    expect(rowsPerPage[0]).toHaveTextContent('25');
    expect(rowsPerPage[1]).toHaveTextContent('50');
    expect(rowsPerPage[2]).toHaveTextContent('100');
  });
});

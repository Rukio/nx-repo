import {
  TableFooter,
  TablePagination,
  TablePaginationProps,
  TableRow,
} from '@*company-data-covered*/design-system';
import { FC } from 'react';
import { QUESTION_BANK_TABLE_PAGINATION_TEST_IDS } from './testIds';

type QuestionBankTablePaginationProps = Omit<
  TablePaginationProps,
  'rowsPerPageOptions'
>;

const QuestionBankTablePagination: FC<QuestionBankTablePaginationProps> = (
  props
) => {
  return (
    <TableFooter data-testid={QUESTION_BANK_TABLE_PAGINATION_TEST_IDS.FOOTER}>
      <TableRow>
        <TablePagination
          {...props}
          rowsPerPageOptions={[25, 50, 100]}
          data-testid={QUESTION_BANK_TABLE_PAGINATION_TEST_IDS.PAGINATION}
        />
      </TableRow>
    </TableFooter>
  );
};

export { QuestionBankTablePaginationProps };
export default QuestionBankTablePagination;

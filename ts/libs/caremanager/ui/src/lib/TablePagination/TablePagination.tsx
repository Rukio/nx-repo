import {
  TablePagination as TablePaginationBase,
  TablePaginationProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FC } from 'react';
import { ROWS_PER_PAGE_OPTIONS } from '@*company-data-covered*/caremanager/utils';

const styles = makeSxStyles({
  container: { borderBottom: 0 },
});

export const TablePagination: FC<TablePaginationProps> = ({ sx, ...props }) => (
  <TablePaginationBase
    sx={{ ...styles.container, ...sx }}
    colSpan={5}
    rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
    labelDisplayedRows={({ from, to, count }) => (
      <span data-testid="table-pagination-count">
        {from}-{to} of {count}
      </span>
    )}
    {...props}
  />
);

export default TablePagination;

import { MouseEvent, ChangeEventHandler, FC, useState } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableCell,
  TableSortLabel,
  TableBody,
  TablePagination,
  TableRow,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import PayerTableRow, { Payer } from './PayersTableRow';
import { PAYERS_TABLE_TEST_IDS } from './testIds';

// TODO(ON-235): Need to create a new project with generic types from where we can take it for re-use
export enum PayersSortDirection {
  ASC = '1',
  DESC = '2',
}

export enum PayersSortFields {
  NAME = '1',
  UPDATED_AT = '2',
}

enum MuiSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type PayersTableProps = {
  payers: Payer[];
  sortField: PayersSortFields;
  sortOrder: PayersSortDirection;
  total: number;
  page: number;
  onChangePage: (page: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  onChangeRowsPerPage?: (rows: number) => void;
  onChangeSortOrder: (
    sortField: PayersSortFields,
    value: PayersSortDirection
  ) => void;
};

export const defaultPageSizeOptions = [25, 50, 75, 100];

const makeStyles = () =>
  makeSxStyles({
    tableRootWrapper: {
      mt: 4,
      mb: 4.5,
      '& th, & tr td': (theme) => ({
        boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)',
        backgroundColor: theme.palette.common.white,
      }),
      '& tr:last-child td': {
        boxShadow: 'none',
      },
    },
    tableChip: {
      width: 'max-content',
      height: 24,
      m: 0.5,
    },
    tableBodyCell: {
      verticalAlign: 'top',
    },
    payerCell: {
      textAlign: 'left',
      width: '20%',
    },
    networksCell: {
      width: '20%',
    },
    statesCell: {
      width: '25%',
    },
    payerGroupCell: {
      width: '15%',
    },
    lastUpdatedCell: {
      width: '15%',
    },
    payersTablePagination: {
      '.MuiTablePagination-selectLabel': (theme) => ({
        my: 2,
        color: theme.palette.text.secondary,
      }),
      '.MuiTablePagination-displayedRows': {
        my: 2,
      },
    },
  });

const PayersTable: FC<PayersTableProps> = ({
  payers,
  sortField = PayersSortFields.NAME,
  sortOrder = PayersSortDirection.DESC,
  total,
  page,
  onChangePage,
  rowsPerPageOptions = defaultPageSizeOptions,
  rowsPerPage,
  onChangeRowsPerPage,
  onChangeSortOrder,
}) => {
  const styles = makeStyles();

  const [expandedRowId, setExpandedRowId] = useState<number | null>();

  const changePage = (
    _ev: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => onChangePage(newPage);
  const handleChangeRowsPerPage: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (event) => onChangeRowsPerPage?.(Number(event.target.value));
  const handleChangeSortOrder = (sortFieldValue: PayersSortFields) => () => {
    const newSortOrder =
      sortOrder === PayersSortDirection.ASC
        ? PayersSortDirection.DESC
        : PayersSortDirection.ASC;
    onChangeSortOrder(sortFieldValue, newSortOrder);
  };

  const getSortDirection = (
    sortOrderNew: PayersSortDirection
  ): MuiSortDirection => {
    switch (sortOrderNew) {
      case PayersSortDirection.ASC:
        return MuiSortDirection.ASC;
      case PayersSortDirection.DESC:
        return MuiSortDirection.DESC;
    }
  };

  const sortDirection = getSortDirection(sortOrder);

  const isRowExpanded = (payerId: number): boolean => expandedRowId === payerId;
  const expandRow = (payerId: number) =>
    setExpandedRowId((prevExpandedRowId) =>
      prevExpandedRowId === payerId ? null : payerId
    );

  return (
    <TableContainer
      data-testid={PAYERS_TABLE_TEST_IDS.TABLE_ROOT}
      sx={styles.tableRootWrapper}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell
              align="right"
              sx={styles.payerCell}
              sortDirection={sortDirection}
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER}
            >
              <TableSortLabel
                active={sortField === PayersSortFields.NAME}
                direction={sortDirection}
                onClick={handleChangeSortOrder(PayersSortFields.NAME)}
                data-testid={
                  PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL
                }
              >
                Payer
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={styles.networksCell}
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_NETWORKS}
            >
              Networks
            </TableCell>
            <TableCell
              sx={styles.statesCell}
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_STATES}
            >
              States
            </TableCell>
            <TableCell
              sx={styles.payerGroupCell}
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_GROUP}
            >
              Payer Group
            </TableCell>
            <TableCell
              sx={styles.lastUpdatedCell}
              sortDirection={sortDirection}
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED}
            >
              <TableSortLabel
                active={sortField === PayersSortFields.UPDATED_AT}
                direction={sortDirection}
                onClick={handleChangeSortOrder(PayersSortFields.UPDATED_AT)}
                data-testid={
                  PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL
                }
              >
                Last Updated
              </TableSortLabel>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {payers.map((payer) => (
            <PayerTableRow
              key={PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)}
              payer={payer}
              expanded={isRowExpanded(payer.id)}
              expandRow={() => expandRow(payer.id)}
            />
          ))}
          <TableRow>
            <TablePagination
              sx={styles.payersTablePagination}
              page={page}
              onPageChange={changePage}
              rowsPerPageOptions={rowsPerPageOptions}
              count={total}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              variant="footer"
              data-testid={PAYERS_TABLE_TEST_IDS.TABLE_PAGINATION}
            />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PayersTable;

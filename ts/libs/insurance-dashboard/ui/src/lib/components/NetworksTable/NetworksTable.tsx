import { MouseEvent, ChangeEventHandler, FC } from 'react';
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
import NetworkTableRow, { Network } from './NetworkTableRow';
import { NETWORKS_TABLE_TEST_IDS } from './testIds';

// TODO(ON-235): Need to create a new project with generic types from where we can take it for re-use
export enum NetworksSortDirection {
  ASC = 1,
  DESC = 2,
}

export enum NetworksSortField {
  NAME = 1,
  UPDATED_AT = 2,
}

export interface NetworksListSortOptions {
  sortField: NetworksSortField;
  sortDirection: NetworksSortDirection;
}

export enum MuiSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export type NetworksTableProps = {
  networks: Network[];
  sortDirection: MuiSortDirection;
  sortBy: NetworksSortField;
  total: number;
  page: number;
  onChangePage: (page: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  onChangeRowsPerPage?: (rows: number) => void;
  onChangeSortOptions: (
    sortField: NetworksSortField,
    sortDirection: NetworksSortDirection
  ) => void;
};

export const defaultPageSizeOptions = [10, 25, 50];

const makeStyles = () =>
  makeSxStyles({
    tableRootWrapper: {
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
      m: 0.5,
    },
    tableBodyCell: {
      verticalAlign: 'top',
    },
    networksCell: {
      textAlign: 'left',
      width: '20%',
    },
    statesCell: {
      width: '25%',
    },
    classificationsCell: {
      width: '20%',
    },
    packageIdCell: {
      width: '15%',
    },
    lastUpdatedCell: {
      width: '15%',
    },
    expandingIconEmptyCell: {
      width: '5%',
    },
    networksTablePagination: {
      '.MuiTablePagination-selectLabel': (theme) => ({
        my: 2,
        color: theme.palette.text.secondary,
      }),
      '.MuiTablePagination-displayedRows': {
        my: 2,
      },
    },
  });

const NetworksTable: FC<NetworksTableProps> = ({
  networks,
  sortBy,
  sortDirection,
  total,
  page,
  onChangePage,
  rowsPerPageOptions = defaultPageSizeOptions,
  rowsPerPage,
  onChangeRowsPerPage,
  onChangeSortOptions,
}) => {
  const styles = makeStyles();

  const changePage = (
    _ev: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => onChangePage(newPage);
  const handleChangeRowsPerPage: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (event) => onChangeRowsPerPage?.(Number(event.target.value));
  const handleChangeSortOptions = (sortField: NetworksSortField) => () => {
    let isAsc = sortDirection === MuiSortDirection.ASC;
    if (sortField !== sortBy) {
      isAsc = false;
    }
    const newSortOrder = isAsc
      ? NetworksSortDirection.DESC
      : NetworksSortDirection.ASC;
    onChangeSortOptions(sortField, newSortOrder);
  };

  const isSortByName = sortBy === NetworksSortField.NAME;
  const isSortByUpdatedAt = sortBy === NetworksSortField.UPDATED_AT;

  return (
    <TableContainer
      data-testid={NETWORKS_TABLE_TEST_IDS.ROOT}
      sx={styles.tableRootWrapper}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell
              align="right"
              sx={styles.networksCell}
              sortDirection={sortDirection}
              data-testid={NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS}
            >
              <TableSortLabel
                active={isSortByName}
                direction={!isSortByName ? MuiSortDirection.ASC : sortDirection}
                onClick={handleChangeSortOptions(NetworksSortField.NAME)}
                data-testid={
                  NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_NAME_LABEL
                }
              >
                Networks
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={styles.statesCell}
              data-testid={NETWORKS_TABLE_TEST_IDS.HEADER_CELL_STATES}
            >
              States
            </TableCell>
            <TableCell
              sx={styles.classificationsCell}
              data-testid={
                NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORK_CLASSIFICATION
              }
            >
              Classification
            </TableCell>
            <TableCell
              sx={styles.packageIdCell}
              data-testid={
                NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORK_PACKAGE_ID
              }
            >
              Package ID
            </TableCell>
            <TableCell
              sx={styles.lastUpdatedCell}
              sortDirection={sortDirection}
              data-testid={NETWORKS_TABLE_TEST_IDS.HEADER_CELL_LAST_UPDATED}
            >
              <TableSortLabel
                active={isSortByUpdatedAt}
                direction={
                  !isSortByUpdatedAt ? MuiSortDirection.ASC : sortDirection
                }
                onClick={handleChangeSortOptions(NetworksSortField.UPDATED_AT)}
                data-testid={
                  NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_UPDATED_AT_LABEL
                }
              >
                Last Updated
              </TableSortLabel>
            </TableCell>
            <TableCell sx={styles.expandingIconEmptyCell} />
          </TableRow>
        </TableHead>
        <TableBody>
          {networks?.map((network) => (
            <NetworkTableRow
              key={NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(network.id)}
              network={network}
            />
          ))}
          <TableRow>
            <TablePagination
              sx={styles.networksTablePagination}
              page={page}
              onPageChange={changePage}
              rowsPerPageOptions={rowsPerPageOptions}
              count={total}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              variant="footer"
              data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_PAGINATION}
            />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NetworksTable;

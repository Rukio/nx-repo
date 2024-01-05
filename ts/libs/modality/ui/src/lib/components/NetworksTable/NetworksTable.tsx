import { FC, MouseEvent, ChangeEventHandler } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
  TablePagination,
  Typography,
  makeSxStyles,
  Box,
  SearchIcon,
  CheckIcon,
} from '@*company-data-covered*/design-system';
import { format, isValid } from 'date-fns';
import { NETWORKS_TABLE_TEST_IDS } from './testIds';

export enum NetworksSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum NetworksSortBy {
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export type Modality = {
  id: number;
  type: string;
  displayName: string;
};

export type InsuranceNetwork = {
  id: number;
  name: string;
  updatedAt: string;
};

type InsuranceNetworkId = InsuranceNetwork['id'];

type ModalityId = Modality['id'];

export type NetworksTableProps = {
  networks: InsuranceNetwork[];
  modalities: Modality[];
  page: number;
  onChangePage: (page: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  onChangeRowsPerPage?: (rows: number) => void;
  selectedModalities?: Record<InsuranceNetworkId, ModalityId[]>;
  total: number;
  sortBy?: NetworksSortBy;
  sortOrder?: NetworksSortOrder;
  onChangeSortBy?: (value: NetworksSortBy) => void;
  onChangeSortOrder?: (value: NetworksSortOrder) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  const isValidDate = isValid(date);

  if (!isValidDate) {
    return '';
  }

  return format(date, 'M/d/yyyy');
}

const makeStyles = () =>
  makeSxStyles({
    tableContainer: {
      mt: 3,
    },
    networkNameTableCell: (theme) => ({
      fontWeight: 700,
      color: theme.palette.primary.main,
    }),
    tablePagination: {
      fontSize: '0.75rem',
      boxShadow: 'none',
      '& .MuiTablePagination-selectLabel': {
        color: 'text.secondary',
        fontSize: 'inherit',
      },
      '& .MuiTablePagination-displayedRows': {
        fontSize: 'inherit',
      },
    },
    modalityTableCell: {
      width: '15%',
    },
    noSearchResultsWrapper: {
      display: 'flex',
      alignItems: 'center',
      py: 10,
      flexDirection: 'column',
      color: 'text.secondary',
    },
    noSearchResultsIcon: {
      width: 45,
      height: 45,
    },
    tableBodyCell: {
      py: 1,
    },
  });

const NetworksTable: FC<NetworksTableProps> = ({
  networks,
  modalities,
  selectedModalities,
  page,
  onChangePage,
  rowsPerPage,
  rowsPerPageOptions,
  onChangeRowsPerPage,
  total,
  sortBy,
  sortOrder,
  onChangeSortOrder,
  onChangeSortBy,
}) => {
  const styles = makeStyles();

  const handleChangePage = (
    _ev: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => onChangePage(newPage);

  const handleChangeRowsPerPage: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (event) => onChangeRowsPerPage?.(Number(event.target.value));

  const handleChangeSortFieldDirection =
    (fieldToSort: NetworksSortBy) => () => {
      const isAsc =
        sortBy === fieldToSort && sortOrder === NetworksSortOrder.ASC;
      onChangeSortOrder?.(
        isAsc ? NetworksSortOrder.DESC : NetworksSortOrder.ASC
      );
      onChangeSortBy?.(fieldToSort);
    };

  const getSortDirectionByField = (field: NetworksSortBy) => {
    return sortBy === field ? sortOrder : NetworksSortOrder.ASC;
  };

  return (
    <TableContainer
      sx={styles.tableContainer}
      data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_ROOT}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell
              sortDirection={getSortDirectionByField(NetworksSortBy.NAME)}
              data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_NAME}
            >
              <TableSortLabel
                active={sortBy === NetworksSortBy.NAME}
                onClick={handleChangeSortFieldDirection(NetworksSortBy.NAME)}
                direction={getSortDirectionByField(NetworksSortBy.NAME)}
                data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_NAME_SORT_LABEL}
              >
                Network Name
              </TableSortLabel>
            </TableCell>
            {modalities.map(({ displayName, id }) => (
              <TableCell
                key={id}
                sx={styles.modalityTableCell}
                data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_MODALITY}
              >
                {displayName}
              </TableCell>
            ))}
            <TableCell
              sortDirection={getSortDirectionByField(NetworksSortBy.UPDATED_AT)}
              data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_LAST_UPDATED}
            >
              <TableSortLabel
                active={sortBy === NetworksSortBy.UPDATED_AT}
                direction={getSortDirectionByField(NetworksSortBy.UPDATED_AT)}
                onClick={handleChangeSortFieldDirection(
                  NetworksSortBy.UPDATED_AT
                )}
                data-testid={
                  NETWORKS_TABLE_TEST_IDS.TABLE_LAST_UPDATED_SORT_LABEL
                }
              >
                Last Updated Date
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        {!!networks?.length && (
          <TableBody>
            {networks.map((network) => {
              const selector = NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(
                network.id
              );

              return (
                <TableRow key={selector} data-testid={selector}>
                  <TableCell
                    data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_CELL_NAME}
                    sx={styles.tableBodyCell}
                  >
                    <Typography
                      sx={styles.networkNameTableCell}
                      variant="body2"
                    >
                      {network.name}
                    </Typography>
                  </TableCell>
                  {modalities.map(({ id }) => {
                    const modalityCellSelector =
                      NETWORKS_TABLE_TEST_IDS.getModalityCellTestId(id);
                    const isSelected =
                      !!selectedModalities?.[network.id]?.includes(id);

                    return (
                      <TableCell
                        key={modalityCellSelector}
                        data-testid={modalityCellSelector}
                        sx={styles.tableBodyCell}
                      >
                        {isSelected && (
                          <CheckIcon
                            color="success"
                            data-testid={
                              NETWORKS_TABLE_TEST_IDS.TABLE_CELL_MODALITY_CHECK_ICON
                            }
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    data-testid={
                      NETWORKS_TABLE_TEST_IDS.TABLE_CELL_LAST_UPDATED
                    }
                    sx={styles.tableBodyCell}
                  >
                    {formatDate(network.updatedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TablePagination
                page={page}
                onPageChange={handleChangePage}
                rowsPerPageOptions={rowsPerPageOptions}
                count={total}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                variant="footer"
                sx={styles.tablePagination}
                data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_PAGINATION}
              />
            </TableRow>
          </TableBody>
        )}
      </Table>
      {!networks?.length && (
        <Box
          sx={styles.noSearchResultsWrapper}
          data-testid={NETWORKS_TABLE_TEST_IDS.TABLE_NO_RESULTS_TEXT}
        >
          <SearchIcon sx={styles.noSearchResultsIcon} />
          <Typography>
            No insurance networks found. Please try another filter.
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default NetworksTable;

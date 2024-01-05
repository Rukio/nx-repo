import React, { MouseEvent, ChangeEventHandler } from 'react';
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
  Switch,
  makeSxStyles,
  Box,
  SearchIcon,
} from '@*company-data-covered*/design-system';
import { format } from 'date-fns';
import { INSURANCE_TABLE_TEST_IDS } from './testIds';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortBy {
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export type Modality = {
  id: number;
  type: string;
  displayName: string;
};

export type Insurance = {
  id: number;
  name: string;
  packageId: string;
  insuranceClassification: string;
  updatedAt: string;
};

type InsuranceId = Insurance['id'];

type ModalityId = Modality['id'];

type ModalityIds = ModalityId[];

type Props = {
  insurances: Insurance[];
  modalities: Modality[];
  page: number;
  onChangePage: (page: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  onChangeRowsPerPage?: (rows: number) => void;
  total: number;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onChangeSortBy: (value: SortBy) => void;
  onChangeSortOrder: (value: SortOrder) => void;
  selectedModalities?: Record<InsuranceId, ModalityIds>;
  onChangeModality: (value: {
    insurancePlanId: InsuranceId;
    modalityId: ModalityId;
  }) => void;
};

function formatDate(date: string) {
  return format(new Date(date), 'M/d/yyyy');
}

const makeStyles = () =>
  makeSxStyles({
    tableContainer: {
      mt: 3,
    },
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
    insuranceName: {
      fontWeight: '700',
    },
    insuranceData: {
      color: 'text.secondary',
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
    modalityTableCell: {
      width: '15%',
    },
  });

const InsurancesTable: React.FC<Props> = ({
  insurances,
  modalities,
  onChangePage,
  page,
  total,
  rowsPerPage,
  onChangeRowsPerPage,
  rowsPerPageOptions,
  sortBy,
  sortOrder,
  onChangeSortBy,
  onChangeSortOrder,
  selectedModalities,
  onChangeModality,
}) => {
  const classes = makeStyles();

  const changePage = (
    _ev: MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => onChangePage(newPage);

  const changeRowsPerPage: ChangeEventHandler<
    HTMLTextAreaElement | HTMLInputElement
  > = (event) => onChangeRowsPerPage?.(Number(event.target.value));

  const updateSortRule = (property: SortBy) => () => {
    const isAsc = sortBy === property && sortOrder === SortOrder.ASC;
    onChangeSortOrder(isAsc ? SortOrder.DESC : SortOrder.ASC);
    onChangeSortBy(property);
  };

  return (
    <TableContainer
      sx={classes.tableContainer}
      data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_ROOT}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell
              sortDirection={sortBy === SortBy.NAME ? sortOrder : false}
              data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_HEADER_CELL_NAME}
            >
              <TableSortLabel
                active={sortBy === SortBy.NAME}
                direction={sortBy === SortBy.NAME ? sortOrder : SortOrder.ASC}
                data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_NAME_SORT_LABEL}
                onClick={updateSortRule(SortBy.NAME)}
              >
                Insurance Name
              </TableSortLabel>
            </TableCell>
            {modalities.map(({ displayName, id }) => (
              <TableCell
                data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_CELL_HEAD_MODALITY}
                key={id}
                sx={classes.modalityTableCell}
              >
                {displayName}
              </TableCell>
            ))}
            <TableCell
              sortDirection={sortBy === SortBy.UPDATED_AT ? sortOrder : false}
              data-testid={
                INSURANCE_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED
              }
            >
              <TableSortLabel
                active={sortBy === SortBy.UPDATED_AT}
                direction={
                  sortBy === SortBy.UPDATED_AT ? sortOrder : SortOrder.ASC
                }
                data-testid={
                  INSURANCE_TABLE_TEST_IDS.TABLE_LAST_UPDATED_SORT_LABEL
                }
                onClick={updateSortRule(SortBy.UPDATED_AT)}
              >
                Last Updated Date
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        {!!insurances?.length && (
          <TableBody>
            {insurances.map((insurance) => {
              const selector =
                INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(
                  insurance.id
                );

              return (
                <TableRow key={selector} data-testid={selector}>
                  <TableCell
                    data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_CELL_NAME}
                  >
                    <Typography variant="body2" sx={classes.insuranceName}>
                      {insurance.name}
                    </Typography>
                    <Typography variant="body2" sx={classes.insuranceData}>
                      {`${insurance.packageId} • ${insurance.insuranceClassification}`}
                    </Typography>
                  </TableCell>
                  {modalities.map(({ id }) => {
                    const modalitySelector =
                      INSURANCE_TABLE_TEST_IDS.getModalityCellTestId(id);
                    const isSelected =
                      !!selectedModalities?.[insurance.id]?.includes(id);

                    return (
                      <TableCell
                        key={modalitySelector}
                        data-testid={modalitySelector}
                      >
                        <Switch
                          checked={isSelected}
                          onChange={() =>
                            onChangeModality({
                              modalityId: id,
                              insurancePlanId: insurance.id,
                            })
                          }
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell
                    data-testid={
                      INSURANCE_TABLE_TEST_IDS.TABLE_CELL_LAST_UPDATED
                    }
                  >
                    {formatDate(insurance.updatedAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TablePagination
                page={page}
                onPageChange={changePage}
                rowsPerPageOptions={rowsPerPageOptions}
                count={total}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={changeRowsPerPage}
                variant="footer"
                sx={classes.tablePagination}
                data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_PAGINATION}
              />
            </TableRow>
          </TableBody>
        )}
      </Table>
      {!insurances?.length && (
        <Box sx={classes.noSearchResultsWrapper}>
          <SearchIcon sx={classes.noSearchResultsIcon} />
          <Typography
            data-testid={INSURANCE_TABLE_TEST_IDS.TABLE_NO_RESULTS_TEXT}
          >
            No insurance plans found. Please try another filter.
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default InsurancesTable;

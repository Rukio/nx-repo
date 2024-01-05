import { MouseEvent, ChangeEventHandler } from 'react';
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Switch,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { MARKETS_TABLE_TEST_IDS } from './testIds';

export type Market = {
  id: number;
  name: string;
  shortName: string;
};

export type Modality = {
  id: number;
  type: string;
  displayName: string;
};

type MarketId = Market['id'];

type ModalityId = Modality['id'];

type ModalityIds = ModalityId[];

type Props = {
  markets: Market[];
  modalities: Modality[];
  page: number;
  onChangePage: (page: number) => void;
  rowsPerPageOptions?: number[];
  rowsPerPage: number;
  onChangeRowsPerPage?: (rows: number) => void;
  total: number;
  selectedModalities?: Record<MarketId, ModalityIds>;
  onChangeModality: (value: {
    marketId: MarketId;
    modalityId: ModalityId;
  }) => void;
};

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
    modalityTableCell: {
      width: '20%',
    },
  });

const MarketsTable = ({
  markets,
  modalities,
  onChangePage,
  page,
  total,
  rowsPerPage,
  onChangeRowsPerPage,
  rowsPerPageOptions,
  selectedModalities,
  onChangeModality,
}: Props) => {
  const classes = makeStyles();

  const changePage = (
    _ev: MouseEvent<HTMLButtonElement> | null,
    page: number
  ) => onChangePage(page);

  const changeRowsPerPage: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => onChangeRowsPerPage?.(Number(event.target.value));

  return (
    <TableContainer
      sx={classes.tableContainer}
      data-testid={MARKETS_TABLE_TEST_IDS.TABLE_ROOT}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Market</TableCell>
            {modalities.map(({ displayName, id }) => (
              <TableCell
                data-testid={MARKETS_TABLE_TEST_IDS.TABLE_CELL_HEAD_MODALITY}
                key={id}
              >
                {displayName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {markets.map((market) => {
            const selector = MARKETS_TABLE_TEST_IDS.getMarketRowTestId(
              market.id
            );

            return (
              <TableRow key={selector} data-testid={selector}>
                <TableCell data-testid={MARKETS_TABLE_TEST_IDS.TABLE_CELL_NAME}>
                  {market.name} ({market.shortName})
                </TableCell>
                {modalities.map(({ id }) => {
                  const modalitySelector =
                    MARKETS_TABLE_TEST_IDS.getModalityCellTestId(id);
                  const isSelected =
                    !!selectedModalities?.[market.id]?.includes?.(id);

                  return (
                    <TableCell
                      key={modalitySelector}
                      data-testid={modalitySelector}
                      sx={classes.modalityTableCell}
                    >
                      <Switch
                        checked={isSelected}
                        onChange={() =>
                          onChangeModality({
                            marketId: market.id,
                            modalityId: id,
                          })
                        }
                      />
                    </TableCell>
                  );
                })}
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
              data-testid={MARKETS_TABLE_TEST_IDS.TABLE_PAGINATION}
            />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MarketsTable;

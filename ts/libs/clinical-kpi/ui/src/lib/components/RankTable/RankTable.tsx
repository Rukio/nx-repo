import { FC, ReactNode, useCallback, useMemo } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  makeSxStyles,
  colorManipulator,
  Box,
} from '@*company-data-covered*/design-system';
import {
  formatMetricValue,
  formatMetricValueChange,
} from '../../utils/metricsUtils';
import {
  Metrics,
  METRICS_DEFAULT_SORT_DIRECTION,
  METRICS_DISPLAY_NAME,
  SortDirection,
} from '../../constants';
import { PLACEHOLDER_ROW_RANKS, RANK_TABLE_TEST_IDS } from './TestIds';

export type Row = {
  id: number;
  rank: number;
  name: string;
  value: number;
  valueChange: number;
  position?: string;
};
export type RankTableProps = {
  startRank: number;
  rows: Array<Omit<Row, 'rank'>>;
  type: Metrics;
  isLoading: boolean;
};

type TableCellConfiguration = {
  label: string;
  dataTestId: (rank?: number) => string;
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
  key: keyof Row;
  hideOnMobile?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    tableContainer: {
      backgroundColor: 'background.paper',
      overflowX: 'unset',
    },
    tableHeadRow: {
      position: 'sticky',
      top: 0,
      backgroundColor: 'background.paper',
      borderBottom: 2,
      borderBottomColor: 'divider',
      borderBottomStyle: 'solid',
    },
    tableRow: (theme) => ({
      '&:hover': {
        cursor: 'pointer',
        backgroundColor: `${colorManipulator.alpha(
          theme.palette.primary.main,
          0.08
        )} !important`,
      },
      '&:last-child td, &:last-child th': { border: 0 },
    }),
    tableHeaderCellRank: { width: '60px' },
    tableHeaderCellOther: { width: '120px' },
    greyRow: (theme) => ({
      backgroundColor: theme.palette.grey[50],
    }),
    cellWithFontWeightMedium: {
      fontWeight: 600,
    },
    hideOnMobile: (theme) => ({
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    }),
  });

type MakeStylesKey = keyof ReturnType<typeof makeStyles>;

const RankTable: FC<RankTableProps> = ({
  startRank,
  rows,
  type,
  isLoading,
}) => {
  const styles = makeStyles();
  const sortedRows = useMemo(() => {
    return [...rows]
      .sort((a, b) =>
        METRICS_DEFAULT_SORT_DIRECTION[type] === SortDirection.Ascending
          ? a.value - b.value
          : b.value - a.value
      )
      .map((row, index) => ({
        ...row,
        rank: startRank + index,
      }));
  }, [type, rows, startRank]);

  const tableCellConfiguration: TableCellConfiguration[] = useMemo(() => {
    return [
      {
        label: '#',
        dataTestId: (rank) => RANK_TABLE_TEST_IDS.getRankTestId(rank),
        key: 'rank',
      },
      {
        label: 'Name',
        dataTestId: (rank) => RANK_TABLE_TEST_IDS.getProviderNameTestId(rank),
        align: 'left',
        key: 'name',
      },
      {
        label: 'Position',
        dataTestId: (rank) => RANK_TABLE_TEST_IDS.getPositionTestId(rank),
        key: 'position',
      },
      {
        label: METRICS_DISPLAY_NAME[type],
        dataTestId: (rank) => RANK_TABLE_TEST_IDS.getValueTestId(rank),
        key: 'value',
      },
      {
        label: 'Change',
        dataTestId: (rank) => RANK_TABLE_TEST_IDS.getValueChangeTestId(rank),
        key: 'valueChange',
        hideOnMobile: true,
      },
    ];
  }, [type]);

  const getCellValue = useCallback(
    (row: Row, key: keyof Row): ReactNode => {
      switch (key) {
        case 'rank':
          return row.rank;
        case 'name':
          if (!row.name) {
            return (
              <Skeleton
                variant="rectangular"
                animation={false}
                sx={{
                  margin: 'inherit',
                }}
                width={120}
                height={20}
              />
            );
          }

          return row.name;
        case 'value': {
          const { displayValue } = formatMetricValue({
            type,
            value: row.value,
          });

          return displayValue;
        }
        case 'valueChange': {
          const { displayValue } = formatMetricValueChange({
            type,
            value: row.valueChange,
          });

          return displayValue;
        }
        case 'position':
          return row.position;
        default:
          return '';
      }
    },
    [type]
  );

  const getCellValueStyle = (row: Row, key: keyof Row) => {
    switch (key) {
      case 'valueChange': {
        const { styles: valueChangeStyles } = formatMetricValueChange({
          type,
          value: row.valueChange,
        });

        return valueChangeStyles;
      }
      case 'value':
        return styles['cellWithFontWeightMedium'];
      default:
        return undefined;
    }
  };

  const getCellHeaderStyle = (key: keyof Row): MakeStylesKey => {
    if (key === 'rank') {
      return 'tableHeaderCellRank';
    }

    return 'tableHeaderCellOther';
  };

  const renderSortedRows = () =>
    sortedRows?.map((row) => (
      <TableRow
        sx={[styles.tableRow, row.rank % 2 !== 0 && styles.greyRow]}
        hover
        key={row.rank}
      >
        {tableCellConfiguration.map(
          ({ key, dataTestId, align, hideOnMobile }) => {
            const cellStyle = getCellValueStyle(row, key);

            return (
              <TableCell
                key={`value-${key}`}
                sx={[cellStyle ?? {}, hideOnMobile ? styles.hideOnMobile : {}]}
                data-testid={dataTestId(row.rank)}
                align={align}
              >
                {getCellValue(row, key)}
              </TableCell>
            );
          }
        )}
      </TableRow>
    ));

  const renderPlaceholders = () =>
    PLACEHOLDER_ROW_RANKS.map((rank, index) => (
      <TableRow
        sx={styles.tableRow}
        hover
        key={`row-${rank}`}
        data-testid={RANK_TABLE_TEST_IDS.getPlaceholderTestId(rank)}
      >
        {tableCellConfiguration.map(({ key, align, hideOnMobile }) => {
          return (
            <TableCell
              sx={[
                styles.cellWithFontWeightMedium,
                hideOnMobile ? styles.hideOnMobile : {},
              ]}
              key={`cell-${key}`}
              align={align}
            >
              {key === 'rank' ? (
                startRank + index
              ) : (
                <Skeleton
                  variant="rectangular"
                  sx={{
                    margin: key === 'name' ? 'inherit' : 'auto',
                  }}
                  width={120}
                  height={20}
                />
              )}
            </TableCell>
          );
        })}
      </TableRow>
    ));

  return (
    <Box>
      <TableContainer sx={styles.tableContainer}>
        <Table data-testid={RANK_TABLE_TEST_IDS.TABLE}>
          <TableHead>
            <TableRow sx={styles.tableHeadRow}>
              {tableCellConfiguration.map(
                ({ key, label, dataTestId, align, hideOnMobile }) => {
                  const cellHeaderStyle = getCellHeaderStyle(key);

                  return (
                    <TableCell
                      sx={[
                        styles.cellWithFontWeightMedium,
                        cellHeaderStyle ? styles[cellHeaderStyle] : {},
                        hideOnMobile ? styles.hideOnMobile : {},
                      ]}
                      key={`head-${key}`}
                      data-testid={dataTestId()}
                      align={align}
                    >
                      {label}
                    </TableCell>
                  );
                }
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading ? renderSortedRows() : renderPlaceholders()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RankTable;

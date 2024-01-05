import { FC, ReactNode, useCallback, useMemo } from 'react';
import { Metrics, METRICS_DISPLAY_NAME } from '../../constants';
import {
  CARE_TEAM_RANK_TABLE_TEST_IDS,
  CARE_TEAM_PLACEHOLDER_ROW_RANKS,
} from './TestIds';
import {
  Box,
  colorManipulator,
  makeSxStyles,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@*company-data-covered*/design-system';
import {
  formatMetricValue,
  formatMetricValueChange,
} from '../../utils/metricsUtils';
import { LeaderHubRankTableRow } from './mocks';

export type CareTeamRankTableRow = {
  id: number;
  rank: number;
  name: string;
  value?: number;
  valueChange: number;
};

export type CareTeamRankTableProps = {
  rows: Array<LeaderHubRankTableRow>;
  type: Metrics;
  isLoading: boolean;
  onRowClick: (rowId: CareTeamRankTableRow['id']) => void;
};

type CareTeamRankTableConfiguration = {
  label: string;
  dataTestId: (rank?: number) => string;
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
  key: keyof CareTeamRankTableRow;
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
    tableHeaderCellRank: { width: '30px' },
    tableHeaderCellName: { width: '300px' },
    tableHeaderCellOther: { width: '120px' },
    greyRow: (theme) => ({
      backgroundColor: theme.palette.grey[50],
    }),
    cellWithFontWeightMedium: {
      fontWeight: 600,
    },
    cellWithNeutral: (theme) => ({
      color: theme.palette.text.disabled,
    }),
    hideOnMobile: (theme) => ({
      [theme.breakpoints.down('sm')]: {
        display: 'none',
      },
    }),
  });

type MakeStylesKey = keyof ReturnType<typeof makeStyles>;

export const CareTeamRankTable: FC<CareTeamRankTableProps> = ({
  rows,
  type,
  isLoading,
  onRowClick,
}) => {
  const styles = makeStyles();

  const tableCellConfiguration: CareTeamRankTableConfiguration[] =
    useMemo(() => {
      return [
        {
          label: '#',
          dataTestId: (rank) =>
            CARE_TEAM_RANK_TABLE_TEST_IDS.getRankTestId(rank),
          key: 'rank',
        },
        {
          label: 'Name',
          dataTestId: (rank) =>
            CARE_TEAM_RANK_TABLE_TEST_IDS.getProviderNameTestId(rank),
          align: 'left',
          key: 'name',
        },
        {
          label: METRICS_DISPLAY_NAME[type],
          dataTestId: (rank) =>
            CARE_TEAM_RANK_TABLE_TEST_IDS.getValueTestId(rank),
          key: 'value',
        },
        {
          label: 'Change',
          dataTestId: (rank) =>
            CARE_TEAM_RANK_TABLE_TEST_IDS.getValueChangeTestId(rank),
          key: 'valueChange',
          hideOnMobile: true,
        },
      ];
    }, [type]);

  const getCellValue = useCallback(
    (row: CareTeamRankTableRow, key: keyof CareTeamRankTableRow): ReactNode => {
      switch (key) {
        case 'rank':
          return row.rank;
        case 'name':
          return row.name;
        case 'value': {
          return row.value || row.value === 0
            ? formatMetricValue({ type, value: row.value }).displayValue
            : 'No data';
        }
        case 'valueChange': {
          const { displayValue } = formatMetricValueChange({
            type,
            value: row.valueChange,
          });

          return displayValue;
        }
        default:
          return '';
      }
    },
    [type]
  );

  const getCellValueStyle = (
    row: CareTeamRankTableRow,
    key: keyof CareTeamRankTableRow
  ) => {
    switch (key) {
      case 'valueChange': {
        const { styles: valueChangeStyles } = formatMetricValueChange({
          type,
          value: row.valueChange,
        });

        return valueChangeStyles;
      }
      case 'value':
        return row.value
          ? styles.cellWithFontWeightMedium
          : styles.cellWithNeutral;
      default:
        return undefined;
    }
  };

  const getCellHeaderStyle = (
    key: keyof CareTeamRankTableRow
  ): MakeStylesKey => {
    switch (key) {
      case 'name':
        return 'tableHeaderCellName';
      case 'rank':
        return 'tableHeaderCellRank';
      default:
        return 'tableHeaderCellOther';
    }
  };

  const renderPlaceholders = () =>
    CARE_TEAM_PLACEHOLDER_ROW_RANKS.map((rank: number) => (
      <TableRow
        sx={styles.tableRow}
        hover
        key={`row-${rank}`}
        data-testid={CARE_TEAM_RANK_TABLE_TEST_IDS.getPlaceholderTestId(rank)}
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
                rank
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
        <Table data-testid={CARE_TEAM_RANK_TABLE_TEST_IDS.TABLE}>
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
            {!isLoading
              ? rows.map((row) => (
                  <TableRow
                    sx={styles.tableRow}
                    hover
                    key={row.id}
                    onClick={() => onRowClick(row.id)}
                  >
                    {tableCellConfiguration.map(
                      ({ key, dataTestId, align, hideOnMobile }) => {
                        const cellStyle = getCellValueStyle(row, key);

                        return (
                          <TableCell
                            key={`value-${key}-${row.id}`}
                            sx={[
                              cellStyle ?? {},
                              hideOnMobile ? styles.hideOnMobile : {},
                            ]}
                            data-testid={dataTestId(row.id)}
                            align={align}
                          >
                            {getCellValue(row, key)}
                          </TableCell>
                        );
                      }
                    )}
                  </TableRow>
                ))
              : renderPlaceholders()}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

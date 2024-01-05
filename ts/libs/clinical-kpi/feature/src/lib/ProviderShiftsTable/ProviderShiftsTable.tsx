import { FC, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import { subDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  TableSortLabel,
  ArrowDropDownIcon,
  makeSxStyles,
  Pagination,
  Grid,
  ButtonGroup,
  Container,
  Alert,
} from '@*company-data-covered*/design-system';
import {
  ServiceDate,
  selectProviderShiftsPage,
  selectProviderShiftsTimestamp,
  setProviderShiftsPage,
  setProviderShiftsTimestamp,
  useGetLeaderHubProviderShiftsQuery,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { convertSecondsToTime, formatTimeRange } from '../util/metricUtils';
import {
  FromTimestampDays,
  SortOrder,
  PROVIDER_SHIFTS_TABLE_CONFIGURATION,
  PROVIDER_SHIFTS_TABLE_ALERT,
} from './constants';
import BreakdownModal from './BreakdownModal';
import { PROVIDER_SHIFTS_TABLE_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    tableContainer: (theme) => ({
      backgroundColor: theme.palette.common.white,
      p: theme.spacing(2, 1),
    }),
    tableHead: (theme) => ({
      backgroundColor: theme.palette.background.default,
    }),
    tableCell: (theme) => ({
      p: theme.spacing(1, 2),
    }),
    tableRow: (theme) => ({
      borderBottom: `2px solid ${theme.palette.background.default}`,
    }),
    timeRangeText: (theme) => ({ color: theme.palette.text.secondary }),
    tableSortLabel: {
      flexDirection: 'row-reverse',
    },
    pagination: {
      float: 'right',
      width: 'fit-content',
    },
    timeWindow: (theme) => ({
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(3),
      marginBottom: theme.spacing(2),
    }),
    showText: (theme) => ({ color: theme.palette.text.secondary }),
    tableHeader: (theme) => ({
      marginBottom: theme.spacing(3),
    }),
  });

export const calculateSubDaysTimestamp = (
  daysCount: number | undefined
): string | undefined => {
  if (daysCount === undefined) {
    return undefined;
  }

  const today = new Date();

  return subDays(today, daysCount).toISOString();
};

export interface ProviderShiftsTableProps {
  providerId?: string | number;
}

const ProviderShiftsTable: FC<ProviderShiftsTableProps> = ({ providerId }) => {
  const styles = makeStyles();

  const [shiftSortOrder, setShiftSortOrder] = useState<SortOrder>(
    SortOrder.DESC
  );
  const fromTimestamp = useSelector(selectProviderShiftsTimestamp);
  const currentPage = useSelector(selectProviderShiftsPage);
  const [breakdownModalData, setBreakdownModalData] = useState<{
    isModalOpen: boolean;
    selectedShiftTeamId?: string;
    shiftTeamServiceDate?: ServiceDate;
  }>({
    isModalOpen: false,
  });

  const dispatch = useDispatch();

  const { data: providerShiftsBreakdown } = useGetLeaderHubProviderShiftsQuery(
    providerId
      ? {
          id: providerId,
          page: currentPage,
          sort_order: shiftSortOrder,
          from_timestamp: fromTimestamp,
        }
      : skipToken
  );

  const handleBreakdownModalClose = () => {
    setBreakdownModalData((prev) => ({ ...prev, isModalOpen: false }));
  };

  if (!providerShiftsBreakdown?.providerShifts) {
    return (
      <Alert
        color="warning"
        severity="warning"
        message={PROVIDER_SHIFTS_TABLE_ALERT}
      />
    );
  }

  const handleShiftSortOrder = () => {
    setShiftSortOrder(
      shiftSortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
    );
  };

  const handlePaginationChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    dispatch(setProviderShiftsPage({ page: page }));
  };

  const handleShiftsFromTimestamp = (
    daysCount: FromTimestampDays | undefined
  ) => {
    dispatch(
      setProviderShiftsTimestamp({
        fromTimestamp: calculateSubDaysTimestamp(daysCount),
      })
    );
  };

  return (
    <Container>
      <Grid sx={styles.timeWindow}>
        <Typography variant="body2" sx={styles.showText}>
          Show
        </Typography>
        <ButtonGroup variant="text">
          <Button onClick={() => handleShiftsFromTimestamp(undefined)}>
            All
          </Button>
          <Button
            onClick={() => handleShiftsFromTimestamp(FromTimestampDays.SEVEN)}
          >
            Last 7 Days
          </Button>
          <Button
            onClick={() => handleShiftsFromTimestamp(FromTimestampDays.THIRTY)}
          >
            Last 30 Days
          </Button>
        </ButtonGroup>
      </Grid>
      <TableContainer
        sx={styles.tableContainer}
        data-testid={PROVIDER_SHIFTS_TABLE_TEST_IDS.PROVIDER_SHIFTS_TABLE_ROOT}
      >
        <Typography variant="h5" sx={styles.tableHeader}>
          Latest Shifts Breakdown
        </Typography>
        <Table>
          <TableHead sx={styles.tableHead}>
            <TableRow>
              <TableCell sx={styles.tableCell}>
                <TableSortLabel
                  onClick={handleShiftSortOrder}
                  sx={styles.tableSortLabel}
                  active
                  direction={shiftSortOrder === SortOrder.ASC ? 'asc' : 'desc'}
                  IconComponent={ArrowDropDownIcon}
                >
                  Shift
                </TableSortLabel>
              </TableCell>
              {PROVIDER_SHIFTS_TABLE_CONFIGURATION.map(
                ({ label, key, dataTestId }) => (
                  <TableCell
                    key={key}
                    data-testid={dataTestId}
                    sx={styles.tableCell}
                  >
                    {label}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {providerShiftsBreakdown.providerShifts.map(
              ({
                shiftTeamId,
                endTime,
                startTime,
                serviceDate,
                outTheDoorDurationSeconds,
                enRouteDurationSeconds,
                onSceneDurationSeconds,
                onBreakDurationSeconds,
                idleDurationSeconds,
                patientsSeen,
              }) => (
                <TableRow key={shiftTeamId} sx={styles.tableRow}>
                  <TableCell sx={styles.tableCell}>
                    <Typography variant="body2">
                      {`${serviceDate.month}/${serviceDate.day}/${serviceDate.year} `}
                    </Typography>
                    <Typography sx={styles.timeRangeText} variant="caption">
                      {formatTimeRange(startTime.hours, endTime.hours)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {convertSecondsToTime(outTheDoorDurationSeconds)}
                  </TableCell>
                  <TableCell>
                    {convertSecondsToTime(enRouteDurationSeconds)}
                  </TableCell>
                  <TableCell>
                    {convertSecondsToTime(onSceneDurationSeconds)}
                  </TableCell>
                  <TableCell>
                    {convertSecondsToTime(onBreakDurationSeconds)}
                  </TableCell>
                  <TableCell>
                    {convertSecondsToTime(idleDurationSeconds)}
                  </TableCell>
                  <TableCell>{patientsSeen}</TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      onClick={() =>
                        setBreakdownModalData({
                          selectedShiftTeamId: shiftTeamId,
                          shiftTeamServiceDate: serviceDate,
                          isModalOpen: true,
                        })
                      }
                    >
                      <Typography variant="body2">See details</Typography>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        <Pagination
          page={currentPage}
          count={parseInt(
            providerShiftsBreakdown.pagination?.totalPages || '1'
          )}
          sx={styles.pagination}
          onChange={handlePaginationChange}
        />
      </TableContainer>

      <BreakdownModal
        shiftTeamId={breakdownModalData.selectedShiftTeamId}
        isModalOpen={breakdownModalData.isModalOpen}
        shiftTeamServiceDate={breakdownModalData.shiftTeamServiceDate}
        handleClose={handleBreakdownModalClose}
      />
    </Container>
  );
};

export default ProviderShiftsTable;

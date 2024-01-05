import { FC, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import {
  TableRow,
  TableCell,
  Chip,
  Box,
  ExpandLessIcon,
  ExpandMoreIcon,
  makeSxStyles,
  Link,
  chipClasses,
  Tooltip,
} from '@*company-data-covered*/design-system';
import { PAYERS_TABLE_TEST_IDS } from './testIds';
import { NetworkShort } from '../NetworksTable/NetworkTableRow';

const MAX_NETWORK_CHIPS_AMOUNT_FOR_COLLAPSED_ROW = 1;
const MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW = 4;

export type PayerGroupForm = {
  name: string;
  payerGroupId: string;
};

export type Payer = {
  id: number;
  name: string;
  link: string;
  insuranceNetworks: NetworkShort[];
  stateAbbrs: string[];
  payerGroup?: PayerGroupForm;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type PayerRowProps = {
  payer: Payer;
  expanded: boolean;
  expandRow: () => void;
};

function formatDate(date: string) {
  return format(new Date(date), 'M/d/yyyy');
}

const makeStyles = ({ expanded }: { expanded: boolean }) =>
  makeSxStyles({
    tableChip: {
      width: 'max-content',
      m: 0.5,
      [`.${chipClasses.label}`]: {
        px: 1.25,
      },
    },
    tableBodyRow: {
      cursor: 'pointer',
    },
    tableBodyCell: {
      verticalAlign: 'top',
      pt: 2.5,
    },
    tableBodyCellNetworks: {
      pt: 2,
      width: '20%',
    },
    tableBodyCellPayerName: (theme) => ({
      fontWeight: theme.typography.fontWeightBold,
      color: theme.palette.primary.main,
    }),
    tableBodyCellLink: {
      textDecoration: 'none',
    },
    payerCell: {
      textAlign: 'left',
    },
    tableBodyCellStates: {
      p: 2,
      pr: expanded ? 12 : 2,
    },
    tableBodyCellPayerGroup: {
      maxWidth: '200px',
    },
    tableBodyCellPayerGroupNameWrapper: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    chipsContainerWrapper: {
      flexDirection: expanded ? 'column' : 'row',
      display: 'flex',
    },
    expandIconContainerWrapper: {
      verticalAlign: expanded ? 'top' : 'center',
      textAlign: 'right',
    },
  });

const getMaxVisibleData = <T,>(
  data: T[],
  lastIndexToView: number,
  isRowExpanded: boolean
): T[] => {
  if (!isRowExpanded) {
    return data.slice(0, lastIndexToView);
  }

  return data;
};

export const isTruncated = (contentWidth = 0, containerWidth = 0) =>
  contentWidth > containerWidth;

const PayersTableRow: FC<PayerRowProps> = ({ payer, expanded, expandRow }) => {
  const [isPayerGroupNameTooltipOpen, setIsPayerGroupNameTooltipOpen] =
    useState(false);
  const payerGroupNameWrapperRef = useRef<HTMLDivElement | null>(null);
  const payerGroupNameRef = useRef<HTMLSpanElement | null>(null);

  const handleCloseTooltip = () => {
    setIsPayerGroupNameTooltipOpen(false);
  };

  const handleOpenTooltip = () => {
    const isTruncatedName = isTruncated(
      payerGroupNameRef.current?.getBoundingClientRect().width,
      payerGroupNameWrapperRef.current?.getBoundingClientRect().width
    );
    setIsPayerGroupNameTooltipOpen(isTruncatedName);
  };

  const styles = makeStyles({ expanded: expanded });
  const networksCellSelector =
    PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellTestId(payer.id);
  const networksCellName =
    PAYERS_TABLE_TEST_IDS.getPayerRowNetworkNameCellTestId(payer.id);
  const statesCellSelector = PAYERS_TABLE_TEST_IDS.getPayerRowStateCellTestId(
    payer.id
  );
  const groupCellTestId = PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTestId(
    payer.id
  );
  const groupCellTooltipTestId =
    PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTooltipTestId(payer.id);
  const payerGroupNameTestId =
    PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellPayerGroupNameTestId(payer.id);
  const lastUpdatedCellTestId =
    PAYERS_TABLE_TEST_IDS.getPayerRowLastUpdatedCellTestId(payer.id);
  const expandCellTestId = PAYERS_TABLE_TEST_IDS.getPayerRowExpandCellTestId(
    payer.id
  );
  const getNetworksCellValueTestId = (networkId: number | string): string =>
    PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellValueTestId(
      payer.id,
      networkId
    );
  const getStateCellValueTestId = (stateId: number | string): string =>
    PAYERS_TABLE_TEST_IDS.getPayerRowStateCellValueTestId(payer.id, stateId);
  const getPayerRowCollapsedCounterChipsTestId = (cellName: string): string =>
    PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedCounterChipsTestId(
      payer.id,
      cellName
    );

  const toggleExpanded = () => expandRow();

  const networks = getMaxVisibleData<NetworkShort>(
    payer.insuranceNetworks,
    MAX_NETWORK_CHIPS_AMOUNT_FOR_COLLAPSED_ROW,
    expanded
  );
  const states = getMaxVisibleData<string>(
    payer.stateAbbrs,
    MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW,
    expanded
  );

  const onClickPayerLink = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
  };

  return (
    <TableRow
      data-testid={PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)}
      onClick={toggleExpanded}
      sx={styles.tableBodyRow}
    >
      <TableCell
        sx={[styles.tableBodyCell, styles.tableBodyCellPayerName]}
        data-testid={networksCellName}
      >
        <Link
          to={payer.link}
          data-testid={PAYERS_TABLE_TEST_IDS.getPayerRowLinkTestId(payer.id)}
          sx={styles.tableBodyCellLink}
          onClick={onClickPayerLink}
          component={RouterLink}
        >
          {payer.name}
        </Link>
      </TableCell>
      <TableCell
        sx={[styles.tableBodyCell, styles.tableBodyCellNetworks]}
        data-testid={networksCellSelector}
      >
        <Box sx={styles.chipsContainerWrapper}>
          {networks.map((network) => {
            const selector = getNetworksCellValueTestId(network.id);

            return (
              <Chip
                size="small"
                key={selector}
                label={network.name}
                data-testid={selector}
                sx={styles.tableChip}
              />
            );
          })}
          {!expanded &&
            payer.insuranceNetworks.length >
              MAX_NETWORK_CHIPS_AMOUNT_FOR_COLLAPSED_ROW && (
              <Chip
                size="small"
                label={`+${
                  payer.insuranceNetworks.length -
                  MAX_NETWORK_CHIPS_AMOUNT_FOR_COLLAPSED_ROW
                }`}
                sx={styles.tableChip}
                variant="outlined"
                data-testid={getPayerRowCollapsedCounterChipsTestId('networks')}
              />
            )}
        </Box>
      </TableCell>
      <TableCell
        sx={[styles.tableBodyCell, styles.tableBodyCellStates]}
        data-testid={statesCellSelector}
      >
        {states.map((state) => {
          const selector = getStateCellValueTestId(state);

          return (
            <Chip
              size="small"
              key={selector}
              label={state}
              data-testid={selector}
              sx={styles.tableChip}
            />
          );
        })}
        {!expanded &&
          payer.stateAbbrs.length > MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW && (
            <Chip
              size="small"
              label={`+${
                payer.stateAbbrs.length - MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW
              }`}
              sx={styles.tableChip}
              variant="outlined"
              data-testid={getPayerRowCollapsedCounterChipsTestId('states')}
            />
          )}
      </TableCell>
      <TableCell
        sx={[styles.tableBodyCell, styles.tableBodyCellPayerGroup]}
        data-testid={groupCellTestId}
      >
        <Box
          sx={styles.tableBodyCellPayerGroupNameWrapper}
          ref={payerGroupNameWrapperRef}
        >
          <Tooltip
            title={
              <div data-testid={groupCellTooltipTestId}>
                {payer.payerGroup?.name}
              </div>
            }
            placement="top-start"
            followCursor
            open={isPayerGroupNameTooltipOpen}
            onOpen={handleOpenTooltip}
            onClose={handleCloseTooltip}
          >
            <span ref={payerGroupNameRef} data-testid={payerGroupNameTestId}>
              {payer.payerGroup?.name}
            </span>
          </Tooltip>
        </Box>
      </TableCell>
      <TableCell sx={styles.tableBodyCell} data-testid={lastUpdatedCellTestId}>
        {formatDate(payer.updatedAt)}
      </TableCell>
      <TableCell
        sx={styles.expandIconContainerWrapper}
        data-testid={expandCellTestId}
      >
        {expanded ? (
          <ExpandLessIcon
            data-testid={PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(
              payer.id
            )}
            color="primary"
          />
        ) : (
          <ExpandMoreIcon
            data-testid={PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(
              payer.id
            )}
            color="primary"
          />
        )}
      </TableCell>
    </TableRow>
  );
};

export default PayersTableRow;

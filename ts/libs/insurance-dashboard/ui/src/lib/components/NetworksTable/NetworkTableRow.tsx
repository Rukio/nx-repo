import { useState, FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';
import {
  TableRow,
  TableCell,
  Chip,
  Link,
  ExpandLessIcon,
  ExpandMoreIcon,
  makeSxStyles,
  chipClasses,
  Box,
} from '@*company-data-covered*/design-system';
import { NETWORKS_TABLE_TEST_IDS } from './testIds';

const MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW = 4;

export type NetworkShort = {
  id: number;
  name: string;
};

export type Network = {
  id: number;
  name: string;
  url: string;
  stateAbbrs: string[];
  classification: string;
  packageId: string;
  updatedAt: string;
};

export type NetworkRowProps = {
  network: Network;
};

function formatDate(date: string) {
  return format(new Date(date), 'M/d/yyyy');
}

const makeStyles = () =>
  makeSxStyles({
    tableRow: {
      cursor: 'pointer',
    },
    tableChip: {
      width: 'max-content',
      m: 0.5,
      [`.${chipClasses.label}`]: {
        px: 1.25,
      },
    },
    tableBodyCell: {
      verticalAlign: 'top',
      pt: 2.5,
    },
    tableBodyCellLink: (theme) => ({
      fontWeight: theme.typography.fontWeightBold,
      color: theme.palette.primary.main,
      textDecoration: 'none',
    }),
    tableBodyCellStates: {
      p: 2,
    },
    chipsContainerWrapper: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, max-content)',
      justifyItems: 'center',
    },
    expandIconContainerWrapper: {
      verticalAlign: 'top',
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

const NetworkTableRow: FC<NetworkRowProps> = ({ network }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = makeStyles();
  const statesCellSelector =
    NETWORKS_TABLE_TEST_IDS.getNetworkRowStateCellTestId(network.id);

  const toggleExpanded = () => setExpanded((val) => !val);

  const states = getMaxVisibleData<string>(
    network.stateAbbrs,
    MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW,
    expanded
  );

  return (
    <TableRow
      data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(network.id)}
      onClick={toggleExpanded}
      sx={styles.tableRow}
    >
      <TableCell sx={styles.tableBodyCell}>
        <Link
          to={network.url}
          data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowLinkTestId(
            network.id
          )}
          sx={styles.tableBodyCellLink}
          component={RouterLink}
        >
          {network.name}
        </Link>
      </TableCell>
      <TableCell
        sx={styles.tableBodyCellStates}
        data-testid={statesCellSelector}
      >
        <Box sx={styles.chipsContainerWrapper}>
          {states.map((stateAbbr) => {
            const stateSelector =
              NETWORKS_TABLE_TEST_IDS.getNetworkRowStateCellValueTestId(
                network.id,
                stateAbbr
              );

            return (
              <Chip
                size="small"
                key={stateSelector}
                label={stateAbbr}
                data-testid={stateSelector}
                sx={styles.tableChip}
              />
            );
          })}
          {!expanded &&
            network.stateAbbrs.length > MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW && (
              <Chip
                size="small"
                label={`+${
                  network.stateAbbrs.length - MAX_CHIPS_AMOUNT_FOR_COLLAPSED_ROW
                }`}
                sx={styles.tableChip}
                variant="outlined"
                data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedCounterChipsTestId(
                  network.id
                )}
              />
            )}
        </Box>
      </TableCell>
      <TableCell
        sx={styles.tableBodyCell}
        data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowClassificationCellValueTestId(
          network.id
        )}
      >
        {network.classification}
      </TableCell>
      <TableCell
        sx={styles.tableBodyCell}
        data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowPackageIdCellValueTestId(
          network.id
        )}
      >
        {network.packageId}
      </TableCell>
      <TableCell sx={styles.tableBodyCell}>
        {formatDate(network.updatedAt)}
      </TableCell>
      <TableCell sx={styles.expandIconContainerWrapper}>
        {expanded ? (
          <ExpandLessIcon
            data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowExpandedTestId(
              network.id
            )}
            color="primary"
          />
        ) : (
          <ExpandMoreIcon
            data-testid={NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedTestId(
              network.id
            )}
            color="primary"
          />
        )}
      </TableCell>
    </TableRow>
  );
};

export default NetworkTableRow;

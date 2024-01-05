import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { LeaderHubIndividualProviderLatestVisit } from '@*company-data-covered*/clinical-kpi/data-access';
import InformationChip, {
  ChipActiveColor,
  ChipState,
} from '../../../InformationChip';
import { PROVIDER_VISITS_TABLE_TEST_IDS } from './testIds';
import { PLACEHOLDER_COUNT } from './constants';

type TableCellConfiguration = {
  label: string;
  key: string;
  width?: string;
};

export const tableConfiguration: Array<TableCellConfiguration> = [
  {
    label: 'Patient',
    key: 'patient',
    width: '200px',
  },
  {
    label: 'Date',
    key: 'date',
    width: '100px',
  },
  {
    label: 'Chief Complaint',
    key: 'chief-complaint',
    width: '250px',
  },
  {
    label: 'Diagnosis',
    key: 'diagnosis',
  },
  {
    label: 'ABX',
    key: 'abx',
    width: '100px',
  },
  {
    label: 'Escalated',
    key: 'escalated',
    width: '100px',
  },
];

const makeStyles = () =>
  makeSxStyles({
    table: {
      tableLayout: 'fixed',
    },
    tableHeader: {
      backgroundColor: 'grey.100',
    },
    tableBody: {
      '& .MuiTableCell-body': {
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
      },
    },
    tableCell: {
      pt: 2,
    },
    id: { color: 'text.secondary' },
  });

export const getChipState = (value: boolean) =>
  value ? ChipState.YES : ChipState.NO;

export type ProviderVisitsTableProps = {
  providerVisits?: LeaderHubIndividualProviderLatestVisit[];
  isLoading: boolean;
};

const ProviderVisitsTable = ({
  providerVisits,
  isLoading,
}: ProviderVisitsTableProps) => {
  const styles = makeStyles();

  return (
    <TableContainer>
      <Table
        sx={styles.table}
        data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.TABLE}
      >
        <TableHead sx={styles.tableHeader}>
          <TableRow>
            {tableConfiguration.map(({ label, key, width }) => (
              <TableCell
                key={key}
                data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.buildHeaderColumnTestId(
                  key
                )}
                sx={{ width: width }}
              >
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody sx={styles.tableBody}>
          {isLoading
            ? Array.from({ length: PLACEHOLDER_COUNT }).map(
                (_: unknown, tableRowIndex: number) => {
                  return (
                    <TableRow key={tableRowIndex}>
                      {tableConfiguration.map(({ key }) => (
                        <TableCell key={key}>
                          <Skeleton
                            height={45}
                            variant="rectangular"
                            data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getCellSkeleton(
                              tableRowIndex,
                              key
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }
              )
            : providerVisits?.map(
                ({
                  careRequestId,
                  patientAthenaId,
                  patientFirstName,
                  patientLastName,
                  serviceDate: { day, month, year },
                  chiefComplaint,
                  diagnosis,
                  isAbxPrescribed,
                  abxDetails,
                  isEscalated,
                  escalatedReason,
                }) => (
                  <TableRow key={patientAthenaId}>
                    <TableCell sx={styles.tableCell}>
                      <Typography
                        variant="body2"
                        data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getPatientName(
                          careRequestId
                        )}
                      >
                        {patientFirstName} {patientLastName}
                      </Typography>
                      <Typography
                        sx={styles.id}
                        variant="caption"
                        data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getAthenaId(
                          careRequestId
                        )}
                      >
                        ID: {patientAthenaId}
                      </Typography>
                    </TableCell>
                    <TableCell
                      data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getDate(
                        careRequestId
                      )}
                    >
                      {month}/{day}/{year}
                    </TableCell>
                    <TableCell
                      data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getChiefComplaint(
                        careRequestId
                      )}
                    >
                      {chiefComplaint}
                    </TableCell>
                    <TableCell
                      data-testid={PROVIDER_VISITS_TABLE_TEST_IDS.getDiagnosis(
                        careRequestId
                      )}
                    >
                      {diagnosis}
                    </TableCell>
                    <TableCell>
                      <InformationChip
                        chipState={getChipState(isAbxPrescribed)}
                        activeColor={ChipActiveColor.GREEN}
                        text={abxDetails}
                        dataTestId={PROVIDER_VISITS_TABLE_TEST_IDS.getAbx(
                          careRequestId
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <InformationChip
                        chipState={getChipState(isEscalated)}
                        activeColor={ChipActiveColor.RED}
                        text={escalatedReason}
                        dataTestId={PROVIDER_VISITS_TABLE_TEST_IDS.getEscalated(
                          careRequestId
                        )}
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProviderVisitsTable;

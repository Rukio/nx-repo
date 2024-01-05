import { useGetUser } from '@*company-data-covered*/caremanager/data-access';
import {
  StationCareRequest,
  StationPatient,
} from '@*company-data-covered*/caremanager/data-access-types';
import { getFullName } from '@*company-data-covered*/caremanager/utils';
import {
  Divider,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { RiskStratScoreChip } from '../RiskStratScoreChip';
import { DataRow } from './DataRow';

const styles = makeSxStyles({
  container: {
    padding: '16px',
  },
  column: {
    gap: '4px',
  },
  row: {
    alignItems: 'baseline',
  },
});

type Props = {
  careRequest?: StationCareRequest;
  patient?: StationPatient;
  'data-testid'?: string;
};

export const getPreviousAdvCareLabel = (
  hasBeenInAdvancedCare: boolean | undefined
) => {
  if (hasBeenInAdvancedCare === undefined) {
    return null;
  }

  return hasBeenInAdvancedCare ? 'Yes' : 'No';
};

export const ClinicalSummary: React.FC<Props> = ({
  careRequest,
  patient,
  'data-testid': testId,
}) => {
  const { data: secondaryScreeningScreener } = useGetUser(
    careRequest?.secondaryScreeningProviderId ?? ''
  );

  const { hasBeenInAdvancedCare } = patient ?? {};

  return (
    <Stack spacing={2} sx={styles.container} data-testid={testId}>
      <Typography variant="h6">Clinical Summary</Typography>
      <Stack sx={styles.column}>
        <DataRow sx={styles.row} label="Chief Complaint">
          {careRequest?.chiefComplaint}
        </DataRow>
        <DataRow sx={styles.row} label="Risk Strat Score">
          {careRequest?.riskStratScore !== undefined ? (
            <RiskStratScoreChip score={careRequest.riskStratScore} />
          ) : null}
        </DataRow>
        <DataRow sx={styles.row} label="Screening Note">
          {careRequest?.secondaryScreeningNote}
        </DataRow>
        <DataRow sx={styles.row} label="Screener">
          {secondaryScreeningScreener
            ? `${getFullName(secondaryScreeningScreener)}, ${
                secondaryScreeningScreener.jobTitle
              }`
            : null}
        </DataRow>
      </Stack>
      <Divider />
      <Stack sx={styles.column}>
        <DataRow sx={styles.row} label="DH Patient">
          {patient?.ehrId ? `MRN ${patient.ehrId}` : 'No'}
        </DataRow>
        <DataRow sx={styles.row} label="DH Visits in Past 90 Days">
          {patient?.visitsInPast90Days}
        </DataRow>
        <DataRow sx={styles.row} label="Previous Adv Care">
          {getPreviousAdvCareLabel(hasBeenInAdvancedCare)}
        </DataRow>
      </Stack>
    </Stack>
  );
};

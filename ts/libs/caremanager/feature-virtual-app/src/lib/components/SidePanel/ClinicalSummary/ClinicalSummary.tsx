import { FC } from 'react';
import { Grid, Typography, makeSxStyles } from '@*company-data-covered*/design-system';

import { RiskStratScore, RiskStratStates } from './RiskStratScore';
import { CLINICAL_SUMMARY_TEST_IDS } from '../testIds';

const makeStyles = () =>
  makeSxStyles({
    summaryContainer: {
      flexDirection: 'column',
      gap: 2,
    },
    clinicalContent: {
      gap: 0.5,
    },
    clinicalRow: {
      gap: 2,
      py: 1,
    },
    label: {
      width: 150,
    },
    text: {
      flex: 1,
    },
  });

export interface ClinicalSummaryProps {
  chiefComplaint: string;
  symptoms: string;
  secondaryScreeningNote: string;
  screener: string;
  riskStratScore: RiskStratStates;
}

export const MOCKED_CLINICAL_SUMMARY: ClinicalSummaryProps = {
  chiefComplaint: 'Cough/Upper Respiratory Infection/Dizziness',
  symptoms: 'Cough, Chest Pain',
  secondaryScreeningNote:
    'speaking with pt\'s daughter. is not currently with patient but has been in constant contact and watching pt on home camera. daughter is able to answer all assessment questions appropriately. reports generalized abd pain x 2 days and an episode of diarrhea yesterday. "she\'s just kind of tired." denies N/V, fever, difficulty urinating, dizzines, SOB, CP. tolerating PO. hx HTN, insomnia. ED precautions for fever, vomiting, worsening abd pain. OKAY TO BE SEEN',
  screener: 'Taylor Dickerson, RN',
  riskStratScore: RiskStratStates.Medium,
};

export const ClinicalSummary: FC<ClinicalSummaryProps> = ({
  chiefComplaint,
  symptoms,
  secondaryScreeningNote,
  screener,
  riskStratScore,
}) => {
  const styles = makeStyles();

  return (
    <Grid
      container
      sx={styles.summaryContainer}
      data-testid={CLINICAL_SUMMARY_TEST_IDS.CONTAINER}
    >
      <Grid item>
        <Typography variant="h6">Clinical Summary</Typography>
      </Grid>
      <Grid item sx={styles.clinicalContent}>
        <Grid
          container
          sx={styles.clinicalRow}
          data-testid={CLINICAL_SUMMARY_TEST_IDS.CHIEF_COMPLAINT}
        >
          <Typography variant="body2" sx={styles.label}>
            Chief Complaint
          </Typography>
          <Typography variant="body2" sx={styles.text}>
            {chiefComplaint}
          </Typography>
        </Grid>
        <Grid
          container
          sx={styles.clinicalRow}
          data-testid={CLINICAL_SUMMARY_TEST_IDS.SYMPTOMS}
        >
          <Typography variant="body2" sx={styles.label}>
            Symptoms
          </Typography>
          <Typography variant="body2" sx={styles.text}>
            {symptoms}
          </Typography>
        </Grid>
        <Grid
          container
          sx={styles.clinicalRow}
          data-testid={CLINICAL_SUMMARY_TEST_IDS.RISK_STRAT_SCORE}
        >
          <Typography variant="body2" sx={styles.label}>
            Risk Strat Score
          </Typography>
          <Typography variant="body2" sx={styles.text}>
            <RiskStratScore score={riskStratScore} />
          </Typography>
        </Grid>
        <Grid
          container
          sx={styles.clinicalRow}
          data-testid={CLINICAL_SUMMARY_TEST_IDS.SECONDARY_SCREENING_NOTE}
        >
          <Typography variant="body2" sx={styles.label}>
            Secondary Screening Note
          </Typography>
          <Typography variant="body2" sx={styles.text}>
            {secondaryScreeningNote}
          </Typography>
        </Grid>
        <Grid
          container
          sx={styles.clinicalRow}
          data-testid={CLINICAL_SUMMARY_TEST_IDS.SCREENER}
        >
          <Typography variant="body2" sx={styles.label}>
            Screener
          </Typography>
          <Typography variant="body2" sx={styles.text}>
            {screener}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

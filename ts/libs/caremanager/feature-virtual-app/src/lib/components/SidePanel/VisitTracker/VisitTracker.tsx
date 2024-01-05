import { format } from 'date-fns';
import {
  Box,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Circle } from './Circle';
import { Visit } from './types';
import { VISIT_TRACKER_TEST_IDS } from '../testIds';

interface VisitTrackerProps {
  visits: Visit[];
}

const makeStyles = () =>
  makeSxStyles({
    stepLabel: {
      gap: 2,
    },
    stepTextContainer: {
      gap: 1,
      alignItems: 'center',
    },
    stepHelperText: (theme) => ({
      height: '100%',
      color: theme.palette.text.secondary,
      '&:before': {
        content: '"\\2022"',
        mr: 1,
      },
    }),
  });

export const VisitTracker = ({ visits }: VisitTrackerProps) => {
  const styles = makeStyles();

  return (
    <Box>
      <Stepper
        orientation="vertical"
        data-testid={VISIT_TRACKER_TEST_IDS.CONTAINER}
      >
        {visits.map((visit) => (
          <Step key={visit.status}>
            <StepLabel
              sx={styles.stepLabel}
              data-testid={VISIT_TRACKER_TEST_IDS.LABEL}
              StepIconComponent={Circle}
              StepIconProps={{ active: !!visit.date }}
            >
              <Grid container sx={styles.stepTextContainer}>
                <Typography variant="body2">{visit.status}</Typography>
                {visit.date && (
                  <Typography variant="label" sx={styles.stepHelperText}>
                    {format(visit.date, 'MM/dd/yy, HH:mm')}
                  </Typography>
                )}
              </Grid>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

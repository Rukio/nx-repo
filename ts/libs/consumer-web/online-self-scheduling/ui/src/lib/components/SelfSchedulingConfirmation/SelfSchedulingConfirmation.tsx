import { FC, ReactNode } from 'react';
import {
  Box,
  makeSxStyles,
  CheckCircleOutlineIcon,
  Typography,
} from '@*company-data-covered*/design-system';
import { FormHeader } from '../FormHeader';
import { SELF_SCHEDULING_CONFIRMATION_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    titleContainer: {
      display: 'flex',
      alignItems: 'flex-start',
    },
    title: {
      pl: 1,
    },
    titleTimeRange: {
      fontWeight: '600',
    },
    titleIcon: (theme) => ({
      color: theme.palette.success.main,
      fontSize: '36px',
    }),
    medicalConcernsMessage: (theme) => ({
      color: theme.palette.text.secondary,
      pt: 3,
    }),
  });

export type SelfSchedulingConfirmationProps = {
  *company-data-covered*PhoneNumber: string;
  subtitle: ReactNode;
};

const SelfSchedulingConfirmation: FC<SelfSchedulingConfirmationProps> = ({
  subtitle,
  *company-data-covered*PhoneNumber,
}) => {
  const styles = makeStyles();

  return (
    <>
      <FormHeader
        title={
          <Box sx={styles.titleContainer}>
            <CheckCircleOutlineIcon sx={styles.titleIcon} />
            <Typography variant="h4" sx={styles.title}>
              Appointment confirmed!
            </Typography>
          </Box>
        }
        subtitle={subtitle}
      />
      <Box sx={styles.medicalConcernsMessage}>
        <Typography
          variant="label"
          data-testid={
            SELF_SCHEDULING_CONFIRMATION_TEST_IDS.MEDICAL_CONCERNS_MESSAGE
          }
        >
          {`Medical conditions may change quickly. If you have new or worsening
          symptoms before our team arrives, please call us at ${*company-data-covered*PhoneNumber}, call
          911, or go to the emergency department if you feel that may be
          necessary.`}
        </Typography>
      </Box>
    </>
  );
};

export default SelfSchedulingConfirmation;

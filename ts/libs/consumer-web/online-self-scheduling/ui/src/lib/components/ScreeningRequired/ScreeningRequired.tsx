import { FC } from 'react';
import {
  Box,
  Button,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { SCREENING_REQUIRED_TEST_IDS } from './testIds';

export type ScreeningRequiredProps = {
  isRelationshipSelf: boolean;
  patientFirstName?: string;
  phoneNumber: string;
  onClickCall: (phoneNumber: string) => void;
};

const makeStyles = () =>
  makeSxStyles({
    marginTop: { mt: 3 },
  });

export const ScreeningRequired: FC<ScreeningRequiredProps> = ({
  isRelationshipSelf,
  patientFirstName,
  phoneNumber,
  onClickCall,
}) => {
  const styles = makeStyles();

  const contactUsText = `To complete your check-in and lock in ${
    isRelationshipSelf ? 'your' : 'an'
  } appointment time, please call us at ${phoneNumber}.`;

  const patientName = patientFirstName ? `${patientFirstName}’s` : 'an';
  const helpScheduleAppointmentText = `We know your time is important, and we want to help you schedule ${
    isRelationshipSelf ? 'your' : patientName
  } appointment as fast as possible. We're excited to hear from you soon!`;

  return (
    <Box data-testid={SCREENING_REQUIRED_TEST_IDS.ROOT}>
      <Typography variant="h4" data-testid={SCREENING_REQUIRED_TEST_IDS.TITLE}>
        Our friendly team is standing by
      </Typography>
      <Typography
        variant="body2"
        sx={styles.marginTop}
        data-testid={SCREENING_REQUIRED_TEST_IDS.CONTACT_US_MESSAGE}
      >
        {contactUsText}
      </Typography>
      <Typography
        variant="body2"
        sx={styles.marginTop}
        data-testid={
          SCREENING_REQUIRED_TEST_IDS.HELP_SCHEDULE_APPOINTMENT_MESSAGE
        }
      >
        {helpScheduleAppointmentText}
      </Typography>
      <Button
        fullWidth
        variant="contained"
        size="extraLarge"
        onClick={() => {
          onClickCall(phoneNumber);
        }}
        component="a"
        sx={styles.marginTop}
        data-testid={SCREENING_REQUIRED_TEST_IDS.CALL_BUTTON}
        href={`tel:${phoneNumber}`}
      >
        Call Now
      </Button>
    </Box>
  );
};

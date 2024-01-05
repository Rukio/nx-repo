import { FC } from 'react';
import {
  Grid,
  IconButton,
  CloseIcon,
  Typography,
  Chip,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PATIENT_INFO_HEADER_TEST_IDS } from '../testIds';

const styles = makeSxStyles({
  header: {
    flexDirection: 'column',
    p: 2,
    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
    backgroundColor: (theme) => theme.palette.background.paper,
  },
  iconButton: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  personalDetails: {
    mb: 1,
    'p:not(:last-child):after': {
      content: '"\\2022"',
      mx: 1,
      color: (theme) => theme.palette.text.disabled,
    },
  },
  chipsHolder: {
    flexDirection: 'row',
  },
  chip: {
    borderColor: (theme) => theme.palette.text.disabled,
  },
});

export interface PatientInfoHeaderProps {
  name: string;
  ehrId: string;
  birthDate: string;
  phoneNumber: string;
  sex: string;
  age: string;
  timeZone: string;
  onClose?: () => void;
}

export const SIDE_PANEL_HEADER_MOCKED_DATA: Omit<
  PatientInfoHeaderProps,
  'onClose'
> = {
  name: 'Juan Pablo Ortiz',
  ehrId: '32223',
  birthDate: '08/16/1967',
  phoneNumber: '(629) 555-0129',
  sex: 'M',
  age: '54',
  timeZone: 'CIN (EST)',
};

export const PatientInfoHeader: FC<PatientInfoHeaderProps> = ({
  name,
  ehrId,
  birthDate,
  phoneNumber,
  sex,
  age,
  timeZone,
  onClose,
}) => {
  return (
    <Grid
      container
      gap={1}
      sx={styles.header}
      data-testid={PATIENT_INFO_HEADER_TEST_IDS.CONTAINER}
    >
      <Typography variant="h5" data-testid={PATIENT_INFO_HEADER_TEST_IDS.NAME}>
        {name}
      </Typography>
      {!!onClose && (
        <IconButton
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.CLOSE_BUTTON}
          aria-label="close"
          onClick={onClose}
          sx={styles.iconButton}
        >
          <CloseIcon />
        </IconButton>
      )}
      <Grid container sx={styles.personalDetails}>
        <Typography
          variant="body2"
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.EHR}
        >
          MRN {ehrId}
        </Typography>
        <Typography
          variant="body2"
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.BIRTH_DATE}
        >
          {birthDate}
        </Typography>
        <Typography
          variant="body2"
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.AGE_AND_SEX}
        >
          {age}yo {sex}
        </Typography>
        <Typography
          variant="body2"
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.PHONE_NUMBER}
        >
          {phoneNumber}
        </Typography>
      </Grid>
      <Grid container sx={styles.chipsHolder}>
        <Chip
          label={timeZone}
          variant="outlined"
          sx={styles.chip}
          data-testid={PATIENT_INFO_HEADER_TEST_IDS.TIME_ZONE_CHIP}
        />
      </Grid>
    </Grid>
  );
};

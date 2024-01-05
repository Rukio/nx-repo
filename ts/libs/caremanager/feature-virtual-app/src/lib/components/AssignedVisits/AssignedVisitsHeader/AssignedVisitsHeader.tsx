import { FC } from 'react';
import {
  Button,
  Grid,
  PhoneInTalkIcon,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

import { ASSIGNED_VISITS_HEADER_TEST_IDS } from '../testIds';

const makeStyles = () =>
  makeSxStyles({
    container: {
      alignItems: 'center',
      justifyContent: 'space-between',
      p: 1.65,
      backgroundColor: (theme) => theme.palette.background.paper,
    },
    buttonsContainer: {
      display: 'flex',
      gap: 1,
    },
  });

export interface AssignedVisitsHeaderProps {
  onOnCallDoctorsClick: () => void;
  onOpenAthenaClick: () => void;
  onOpenTytoCareClick: () => void;
}

export const AssignedVisitsHeader: FC<AssignedVisitsHeaderProps> = ({
  onOnCallDoctorsClick,
  onOpenAthenaClick,
  onOpenTytoCareClick,
}) => {
  const styles = makeStyles();

  return (
    <Grid
      container
      sx={styles.container}
      data-testid={ASSIGNED_VISITS_HEADER_TEST_IDS.root}
    >
      <Typography variant="h6">Assigned to Me</Typography>

      <Grid sx={styles.buttonsContainer}>
        <Button
          startIcon={<PhoneInTalkIcon />}
          onClick={onOnCallDoctorsClick}
          data-testid={ASSIGNED_VISITS_HEADER_TEST_IDS.onCallDoctorsButton}
        >
          On Call Doctors
        </Button>
        <Button
          variant="outlined"
          onClick={onOpenAthenaClick}
          data-testid={ASSIGNED_VISITS_HEADER_TEST_IDS.openAthena}
        >
          Open Athena
        </Button>
        <Button
          variant="outlined"
          onClick={onOpenTytoCareClick}
          data-testid={ASSIGNED_VISITS_HEADER_TEST_IDS.openTytoCare}
        >
          Open TytoCare
        </Button>
      </Grid>
    </Grid>
  );
};

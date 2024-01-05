import React from 'react';
import { UnableToScheduleReason } from '@*company-data-covered*/caremanager/data-access-types';
import {
  Box,
  Grid,
  InfoOutlinedIcon,
  List,
  ListItem,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { testIds } from '../../SchedulingModal.testids';

const styles = makeSxStyles({
  container: {
    paddingLeft: '12px',
    paddingTop: '16px',
  },
  grid: (theme) => ({
    background: '#FBEAE5',
    borderLeft: `8px solid ${theme.palette.error.main}`,
    borderRadius: '6px',
    padding: '12px 0',
    flexWrap: 'nowrap',
  }),
  list: {
    paddingTop: '0',
    paddingLeft: '16px',
    '&::marker': {
      fontSize: '0.75rem',
    },
    listStyleType: 'disc',
    listStylePosition: 'inside',
    marginBottom: '16px',
  },
  listContainer: {
    marginTop: '8px',
    paddingRight: '8px',
  },
  listItem: {
    display: 'list-item',
  },
  listItemText: {
    display: 'inline',
  },
});

const SCHEDULING_ERROR_REASON_CAUSES: Record<UnableToScheduleReason, string[]> =
  {
    [UnableToScheduleReason.Unspecified]: ['Unknown reason'],
    [UnableToScheduleReason.AdvancedCareUnavailable]: [
      'Market does not support Advanced Care',
      'The Service Line is not Advanced Care',
      "The Patient doesn't have a valid insurance for Advanced Care",
      'There are shift teams available, but none of them is elegible for Advanced Care',
      'Make sure the rendering provider of the shift team is an APP (Advanced Practice Provider)',
    ],
    [UnableToScheduleReason.VisitTimeSlotUnavailable]: [
      "There's no car available in the specified hours",
      'No one on the car has a valid license assigned to operate in the state of the Market',
      'Market is closed',
      'The Market is closing soon and not accepting new patients',
      'The Market is open but nearing capacity to accept new patients',
      'The Market is open for any short duration visit but at least one',
    ],
  };

interface Props {
  reason: UnableToScheduleReason;
}

const SchedulingError: React.FC<Props> = ({ reason }) => {
  const possibleCauses = SCHEDULING_ERROR_REASON_CAUSES[reason];

  return (
    <Box data-testid={testIds.ERROR_REASONS} sx={styles.container}>
      <Grid columnSpacing={1.5} container sx={styles.grid}>
        <Grid item>
          <InfoOutlinedIcon />
        </Grid>
        <Grid item>
          <Stack>
            <Typography variant="h6">The visit can not be scheduled</Typography>
            <Box sx={styles.listContainer}>
              <Typography variant="body2">Possible reasons:</Typography>
              <List sx={styles.list}>
                {possibleCauses.map((cause) => (
                  <ListItem key={cause} disablePadding sx={styles.listItem}>
                    <Typography sx={styles.listItemText} variant="body2">
                      {cause}
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Typography variant="body2">
                Please try again after fixing the issue
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SchedulingError;

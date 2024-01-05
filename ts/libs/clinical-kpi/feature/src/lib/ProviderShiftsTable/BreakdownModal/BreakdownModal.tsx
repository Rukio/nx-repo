import { FC } from 'react';
import { format } from 'date-fns';
import {
  Typography,
  makeSxStyles,
  Dialog,
  DialogTitle,
  IconButton,
  CloseIcon,
  InsightsIcon,
  DialogContent,
  Grid,
  Alert,
} from '@*company-data-covered*/design-system';
import {
  OnSceneTimeLine,
  OnSceneTimeLineEvent,
  TimelineEvent,
} from '@*company-data-covered*/clinical-kpi-design';
import {
  TimelineSnapshot,
  SnapshotPhase,
  selectTimelineSnapshotsForShiftTeam,
  useAppSelector,
  useListShiftSnapshotsQuery,
  ServiceDate,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { BREAKDOWN_MODAL_TEST_IDS } from './testIds';
import { skipToken } from '@reduxjs/toolkit/query';

const phaseToTimelineEventMap: Record<SnapshotPhase, TimelineEvent> = {
  [SnapshotPhase.PHASE_EN_ROUTE]: TimelineEvent.EnRoute,
  [SnapshotPhase.PHASE_ON_BREAK]: TimelineEvent.Break,
  [SnapshotPhase.PHASE_ON_SCENE]: TimelineEvent.OnScene,
  [SnapshotPhase.PHASE_IDLE]: TimelineEvent.Idle,
};

export const mapBreakdownToOnSceneEvents = (
  snapshots: TimelineSnapshot[]
): OnSceneTimeLineEvent[] => {
  return snapshots.map(
    (snapshot: TimelineSnapshot): OnSceneTimeLineEvent => ({
      type: phaseToTimelineEventMap[snapshot.phase],
      startTime: snapshot.startTimestamp.replace('Z', ''),
      endTime: snapshot.endTimestamp.replace('Z', ''),
    })
  );
};

export const formatSelectedServiceDate = (
  serviceDate?: ServiceDate
): string => {
  if (!serviceDate) {
    return 'X';
  }

  return format(
    new Date(serviceDate.year, serviceDate.month - 1, serviceDate.day),
    'd MMM'
  );
};

const makeStyles = () =>
  makeSxStyles({
    root: (theme) => ({
      p: theme.spacing(4),
      backgroundColor: theme.palette.background.default,
      borderRadius: 0.5,
      [theme.breakpoints.up('md')]: {
        '& .MuiDialog-paper': {
          width: '100%',
          minWidth: '740px',
          minHeight: '300px',
        },
      },
      [theme.breakpoints.down('md')]: {
        '& .MuiDialog-paper': {
          minWidth: '100%',
          minHeight: '100%',
        },
      },
    }),
    title: {
      m: 0,
      p: 2,
      gap: 1,
      display: 'flex',
    },
    iconButton: {
      position: 'absolute',
      right: 8,
      top: 8,
    },
    content: (theme) => ({
      padding: 2,
      gap: 4,
      backgroundColor: theme.palette.background.paper,
    }),
    timeline: {
      mt: 2,
    },
  });

type BreakdownModalProps = {
  shiftTeamServiceDate?: ServiceDate;
  shiftTeamId?: string;
  isModalOpen: boolean;
  handleClose: () => void;
};

const BreakdownModal: FC<BreakdownModalProps> = ({
  shiftTeamServiceDate,
  shiftTeamId,
  isModalOpen,
  handleClose,
}) => {
  const styles = makeStyles();

  useListShiftSnapshotsQuery(shiftTeamId ?? skipToken);

  const snapshots = useAppSelector(
    selectTimelineSnapshotsForShiftTeam(shiftTeamId)
  );
  const timelineEvents = mapBreakdownToOnSceneEvents(snapshots);

  const formattedDate = formatSelectedServiceDate(shiftTeamServiceDate);

  return (
    <Dialog open={isModalOpen} sx={styles.root}>
      <DialogTitle sx={styles.title}>
        <InsightsIcon />
        <Typography data-testid={BREAKDOWN_MODAL_TEST_IDS.HEADER} variant="h6">
          {`Shift Breakdown – ${formattedDate}`}
        </Typography>
        <IconButton
          aria-label="close"
          data-testid={BREAKDOWN_MODAL_TEST_IDS.CLOSE_ICON}
          onClick={handleClose}
          sx={styles.iconButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container sx={styles.content}>
          <Grid item xs={12} data-testid={BREAKDOWN_MODAL_TEST_IDS.ALERT}>
            <Alert
              severity="warning"
              title="There is no location data for this shift"
              message="Your shift breakdown is based on button pushes."
            />
          </Grid>
          <Grid
            item
            xs={12}
            sx={styles.timeline}
            data-testid={BREAKDOWN_MODAL_TEST_IDS.TIMELIME}
          >
            {timelineEvents?.length ? (
              <OnSceneTimeLine events={timelineEvents} />
            ) : (
              <Alert
                severity="warning"
                message="There is no timeline data for this shift"
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default BreakdownModal;

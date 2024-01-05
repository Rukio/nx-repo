import { FC } from 'react';
import { Box, Grid, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  calculateDisplayTimeRange,
  getActionColor,
  getTimeLabelLeftOffset,
} from './utilities';
import { Typography } from '@mui/material';

export enum Event {
  EnRoute = 'En Route',
  OnScene = 'On Scene',
  Break = 'Break',
  Idle = 'Idle',
}

export interface OnSceneTimeLineEvent {
  type: Event;
  startTime: string;
  endTime: string;
}

interface OnSceneTimeLineProps {
  events: OnSceneTimeLineEvent[];
}

export const TIME_LABEL_TEST_ID = 'time-label-test-id';
export const LEGEND_EVENT_TEST_ID = (event: Event) => `legend-${event}-test-id`;

const makeStyles = () =>
  makeSxStyles({
    root: { position: 'relative', height: '20px' },
    timeMark: {
      position: 'absolute',
      top: '-15px',
      width: '30px',
      textAlign: 'center',
      fontSize: '12px',
    },
    timeMarkContainer: {
      position: 'absolute',
      top: '0',
      width: '1px',
      height: '100%',
      color: 'text.secondary',
      backgroundColor: 'grey.200',
    },
    action: {
      position: 'absolute',
      top: '0',
      height: '100%',
    },
    legendContainer: {
      display: 'flex',
      gap: 2,
      position: 'absolute',
      top: '150%',
    },
    legendEvent: {
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
    },
    legendCircle: {
      borderRadius: '50%',
      width: 12,
      height: 12,
    },
  });

const OnSceneTimeline: FC<OnSceneTimeLineProps> = ({ events }) => {
  const styles = makeStyles();

  const firstEvent = events.at(0);
  const lastEvent = events.at(-1);

  if (!firstEvent || !lastEvent) {
    return null;
  }

  const { minTimeInMs, maxTimeInMs } = calculateDisplayTimeRange(
    firstEvent,
    lastEvent
  );

  const timeRangeInMs = Math.abs(maxTimeInMs - minTimeInMs);

  const renderTimeLabels = () => {
    const timeLabels: JSX.Element[] = [];
    const currentTime = new Date(minTimeInMs);

    while (currentTime <= new Date(maxTimeInMs)) {
      const hour = currentTime.getHours();

      const currentTimeIsMs = currentTime.getTime();

      const containerLeft =
        ((currentTimeIsMs - minTimeInMs) / timeRangeInMs) * 100;

      const isFirstTimeLabel = currentTimeIsMs === minTimeInMs;
      const isLastTimeLabel = currentTimeIsMs === maxTimeInMs;

      const timeLeft = getTimeLabelLeftOffset(
        isFirstTimeLabel,
        isLastTimeLabel
      );

      timeLabels.push(
        <Box
          key={hour}
          data-testid={TIME_LABEL_TEST_ID}
          sx={[
            styles.timeMarkContainer,
            {
              left: `${containerLeft}%`,
            },
          ]}
        >
          <Box
            sx={[
              styles.timeMark,
              {
                left: `${timeLeft}px`,
              },
            ]}
          >
            {hour}:00
          </Box>
        </Box>
      );

      currentTime.setTime(currentTime.getTime() + 60 * 60 * 1000); // Add one hour
    }

    return timeLabels;
  };

  return (
    <Box sx={styles.root}>
      {renderTimeLabels()}
      {events.map((event, index) => {
        const { startTime, endTime, type } = event;

        const durationInMs =
          new Date(endTime).getTime() - new Date(startTime).getTime();

        const startMs = Math.floor(new Date(startTime).getTime() - minTimeInMs);

        const width = (durationInMs / timeRangeInMs) * 100;
        const left = (startMs / timeRangeInMs) * 100;

        return (
          <Box
            key={index}
            sx={[
              styles.action,
              {
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: getActionColor(type),
              },
            ]}
          />
        );
      })}
      <Grid sx={styles.legendContainer}>
        {Object.values(Event).map((event) => (
          <Grid
            key={event}
            sx={styles.legendEvent}
            data-testid={LEGEND_EVENT_TEST_ID(event)}
          >
            <Box
              sx={[
                styles.legendCircle,
                { backgroundColor: getActionColor(event) },
              ]}
            />
            <Typography variant="caption" color="text.secondary">
              {event}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default OnSceneTimeline;

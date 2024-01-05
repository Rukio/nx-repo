import { Event, OnSceneTimeLineEvent } from './index';
import { theme } from '@*company-data-covered*/design-system';

const COLORS_FOR_EVENTS = {
  'En Route': theme.palette.info.main,
  'On Scene': theme.palette.info.light,
  Break: theme.palette.grey.A700,
  Idle: theme.palette.error.light,
};

const ceilRoundToHour = (date: Date) => {
  const MillisecondsInHours = 60 * 60 * 1000;

  return new Date(
    Math.ceil(date.getTime() / MillisecondsInHours) * MillisecondsInHours
  );
};

const floorRoundToHour = (date: string): number =>
  new Date(date).setMinutes(0, 0, 0);

export const getActionColor = (type: Event) => COLORS_FOR_EVENTS[type];

export const calculateDisplayTimeRange = (
  firstAction: OnSceneTimeLineEvent,
  lastAction: OnSceneTimeLineEvent
) => {
  const minTimeInMs = floorRoundToHour(firstAction.startTime);
  const maxTimeInMs = ceilRoundToHour(new Date(lastAction.endTime)).getTime();

  return { minTimeInMs, maxTimeInMs };
};

export const getTimeLabelLeftOffset = (
  isFirstLabel: boolean,
  isLastLabel: boolean
): string => {
  if (isFirstLabel) {
    return '0';
  }

  if (isLastLabel) {
    return '-30';
  }

  return '-15';
};

import { differenceInHours } from 'date-fns';

const AVAILABILITY_MINIMUM_TIME_WINDOW_HOURS = 4;

export const isPatientAvailabilitayWindowValid = (
  startTime?: string,
  endTime?: string
): boolean =>
  !!startTime &&
  !!endTime &&
  differenceInHours(new Date(endTime), new Date(startTime)) >=
    AVAILABILITY_MINIMUM_TIME_WINDOW_HOURS;

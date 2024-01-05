import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import { intervalToDuration, setHours, format } from 'date-fns';
import { ProviderPosition } from '../../constants';

export const convertSecondsToMinutes = (valueSecs: number) => valueSecs / 60;

export const convertSecondsToTime = (seconds: number) => {
  const { hours, minutes } = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });

  const formattedMinutes = `${minutes}m`;

  return hours !== 0 ? `${hours}h ${formattedMinutes}` : formattedMinutes;
};

/*
 * format hours of start and end time to readable time range
 * @param {Number} start time in 24 hour format
 * @param {Number} end time in 24 hour format
 */
export const formatTimeRange = (
  startTimeHours: number,
  endTimeHours: number
) => {
  const startTime = setHours(new Date(), startTimeHours);
  const endTime = setHours(new Date(), endTimeHours);

  return `${format(startTime, 'haaa')} - ${format(endTime, 'haaa')}`;
};

export const roundValue = (value: number, fractionDigits = 2) =>
  Number(parseFloat(value.toString()).toFixed(fractionDigits));

export const convertMetricValue = (type: Metrics, value: number): number => {
  if (type === Metrics.OnSceneTime) {
    return convertSecondsToMinutes(value);
  }

  return value;
};

export const getNumericMetricValue = (
  value: number | null | undefined,
  type: Metrics
) => roundValue(convertMetricValue(type, value ?? 0));

export const getValidMetricValue = (
  type: Metrics,
  value?: number | string | null
) => {
  if ((!value && value !== 0) || typeof value === 'string') {
    return;
  }

  return roundValue(convertMetricValue(type, value));
};

export const isValidMetricValue = (value: unknown): value is number =>
  Number.isFinite(value);

export const formatProviderPosition = (position: string | undefined) => {
  switch (position) {
    case ProviderPosition.APP:
      return 'APP';
    case ProviderPosition.DHMT:
      return 'DHMT';
    default:
      return '';
  }
};

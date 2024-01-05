import {
  startOfHour,
  setHours,
  isBefore,
  isSameHour,
  addHours,
  getHours,
  format,
  parseISO,
  isValid,
  isSameDay,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const MIN_HOUR = 0;
const MAX_HOUR = 23;
export const UTC_TIME_ZONE = '+00:00';

export enum AvailibilityDay {
  Today = 'today',
  Tomorrow = 'tomorrow',
}

const isValidHour = (hour: number): boolean => {
  return hour >= MIN_HOUR && hour <= MAX_HOUR;
};

export const getHoursSelectList = (minHour = MIN_HOUR, maxHour = MAX_HOUR) => {
  if (!isValidHour(minHour) || !isValidHour(maxHour)) {
    return [];
  }
  const nowDate = new Date();
  const startDate = startOfHour(setHours(nowDate, minHour));
  const endDate = startOfHour(setHours(nowDate, maxHour));

  const timestamps: Date[] = [];
  let timeCurrent = startDate;

  while (isBefore(timeCurrent, endDate) || isSameHour(timeCurrent, endDate)) {
    timestamps.push(timeCurrent);
    timeCurrent = addHours(timeCurrent, 1);
  }

  return timestamps.map((timestamp) => ({
    value: getHours(timestamp).toString(),
    label: format(timestamp, 'hh:mm aaa'),
  }));
};

export const getMarketTimeSelectList = (
  marketStartTime = '',
  marketEndTime = '',
  marketTimeZone = ''
) => {
  if (![marketStartTime, marketEndTime, marketTimeZone].every(Boolean)) {
    return [];
  }
  const startDate = utcToZonedTime(marketStartTime, UTC_TIME_ZONE);
  const endDate = utcToZonedTime(marketEndTime, UTC_TIME_ZONE);

  const marketStartHours = getHours(startDate);
  const marketEndHours = getHours(endDate);
  const currentHours = getHours(utcToZonedTime(new Date(), marketTimeZone));
  const minStartHours =
    currentHours >= marketStartHours ? currentHours + 1 : marketStartHours;

  return getHoursSelectList(minStartHours, marketEndHours);
};

export const formatDate = (
  dateString?: string,
  timezone?: string,
  formatString?: string
) => {
  if (!dateString || !timezone || !formatString) {
    return '';
  }

  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    return '';
  }
  const zonedDate = utcToZonedTime(parsedDate, timezone);

  return format(zonedDate, formatString);
};

export const getAvailabilityDay = (dateString?: string, timezone?: string) => {
  if (!dateString || !timezone) {
    return AvailibilityDay.Today;
  }

  const date = parseISO(dateString);

  if (isValid(date)) {
    const zonedDate = utcToZonedTime(date, timezone);
    const tomorrow = utcToZonedTime(new Date(), timezone);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return isSameDay(zonedDate, tomorrow)
      ? AvailibilityDay.Tomorrow
      : AvailibilityDay.Today;
  }

  return AvailibilityDay.Today;
};

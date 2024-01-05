import { format as dateFnsFormat, add, sub, endOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { DateTime } from '../../types/utils/dateTime';

export const DATE_TIME_FORMATS = {
  YEAR: 'yyyy',
  YEAR_MONTH_DAY: 'yyyy-MM-dd',
  YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE: 'yyyy-MM-dd H:mm:ss z',
  YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE_SHIFT_FORMAT:
    "yyyy-MM-dd'T'HH:mm:ss'Z'",
  YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE_DATETIME_TZ: 'yyyy-MM-dd H:mm:ssXXX',
  MONTH_FULL_NAME: 'MMMM',
  MONTH_SHORT_NAME_DAY: 'MMM d',
  MONTH_DAY_YEAR_SHORT: 'M/d/yyyy',
  MONTH_DAY_YEAR_FULL: 'MM/dd/yyyy',
  MONTH_SHORT_DAY_FULL_YEAR_FULL: 'M/dd/yyyy',
  MONTH_FULL_NAME_DAY_YEAR: 'MMMM d, yyyy',
  MONTH_SHORT_NAME_DAY_ORDINAL: 'MMM do',
  MONTH_SHORT_NAME_DAY_ORDINAL_YEAR: 'MMM do, yyyy',
  MONTH_DAY_YEAR_HOUR_MINUTE_MERIDIEM: 'M/d/yyyy h:mm a',
  DAY: 'd',
  DAY_SHORT_NAME: 'eee',
  DAY_MONTH_SHORT_NAME_YEAR_HOUR_MINUTE_MERIDIEM: 'd MMM yyyy, h:mm a',
  DAY_MONTH_SHORT_NAME_YEAR_HOUR_MINUTE_MERIDIEM_ZONE: 'd MMM yyyy, h:mm a z',
  HOUR_MINUTE_MERIDIEM_TOGETHER: 'h:mma',
  HOUR_MINUTE_MERIDIEM_SPLIT: 'h:mm a',
  HOUR_MINUTE_SECONDS: 'HH:mm:ss',
  TIMEZONE: 'z',
};

export const format = ({
  dateTime = new Date(),
  dateTimeFormat = DATE_TIME_FORMATS.YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE,
}: DateTime.FormatParams = {}) => dateFnsFormat(dateTime, dateTimeFormat);

export const increment = ({
  dateTime = new Date(),
  duration = { days: 1 },
}: DateTime.DurationParams = {}) => add(dateTime, duration);

export const subtract = ({
  dateTime = new Date(),
  duration = { days: 1 },
}: DateTime.DurationParams = {}) => sub(dateTime, duration);

export const formatWithTimeZone = ({
  dateTime = new Date(),
  timeZone = 'Denver',
  dateTimeFormat = DATE_TIME_FORMATS.YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ZONE_DATETIME_TZ,
}: DateTime.TimeZoneParams = {}) =>
  formatInTimeZone(dateTime, `America/${timeZone}`, dateTimeFormat);

export const END_OF_DAY = endOfDay(new Date());

export const TODAYS_DATE = format({
  dateTimeFormat: DATE_TIME_FORMATS.YEAR_MONTH_DAY,
});

export const TOMORROWS_DATE = format({
  dateTime: increment(),
  dateTimeFormat: DATE_TIME_FORMATS.YEAR_MONTH_DAY,
});

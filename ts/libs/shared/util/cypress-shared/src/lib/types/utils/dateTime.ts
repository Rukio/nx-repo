import { Duration } from 'date-fns';

export declare namespace DateTime {
  type FormatParams = {
    dateTime?: Date;
    dateTimeFormat?: string;
  };
  type TimeZoneParams = FormatParams & {
    timeZone?: string;
  };
  type DurationParams = {
    dateTime?: Date;
    duration?: Duration;
  };
}

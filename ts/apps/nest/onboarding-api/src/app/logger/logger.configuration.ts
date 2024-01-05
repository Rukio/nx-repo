import { registerAs } from '@nestjs/config';

export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'verbose'
  | 'silly';

export interface LoggingConfiguration {
  useProductionLogFormat: boolean;
  logExtendedRequestData: boolean;
  level: LogLevel;
}

export default registerAs<LoggingConfiguration>('logging', () => {
  return {
    useProductionLogFormat: process.env.NODE_ENV === 'production',
    logExtendedRequestData: process.env.LOG_INCLUDE_EXTENDED_DATA === 'true',
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  };
});

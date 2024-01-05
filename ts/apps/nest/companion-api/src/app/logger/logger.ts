import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';

const defaultLoggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.ms(),
        winston.format.json(),
        winston.format.uncolorize()
      ),
    }),
  ],
};

const developmentLoggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike(),
        winston.format.colorize({ all: true })
      ),
    }),
  ],
};

export const loggerOptions =
  process.env.LOG_USE_PRODUCTION_FORMAT === 'true'
    ? defaultLoggerOptions
    : developmentLoggerOptions;

export const logger = WinstonModule.createLogger(loggerOptions);

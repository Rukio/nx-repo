import { Module } from '@nestjs/common';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import * as winston from 'winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import loggerConfiguration, {
  LoggingConfiguration,
} from './logger.configuration';

const winstonFactory = (
  configService: ConfigService
): winston.LoggerOptions => {
  const loggingConfig = configService.get<LoggingConfiguration>('logging');

  return {
    level: loggingConfig?.level || 'info',
    transports: [
      new winston.transports.Console({
        format: loggingConfig?.useProductionLogFormat
          ? winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.json(),
              winston.format.uncolorize()
            )
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike(),
              winston.format.colorize({ all: true })
            ),
      }),
    ],
  };
};

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule.forFeature(loggerConfiguration)],
      inject: [ConfigService],
      useFactory: winstonFactory,
    }),
  ],
  exports: [WinstonModule],
})
export default class LoggerModule {}

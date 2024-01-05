import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { LoggingConfiguration } from '../configuration/logger.configuration';
import { InjectLogger } from './logger.decorator';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private useProductionLogFormat: boolean;
  private useExtendedDataOption: boolean;

  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    configService: ConfigService<Record<`logging`, unknown>, true>
  ) {
    const loggingConfig = configService.get<LoggingConfiguration>('logging');

    this.useProductionLogFormat = loggingConfig.useProductionLogFormat;
    this.useExtendedDataOption = loggingConfig.logExtendedRequestData;
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || '-';

      this.logger.info(
        `${method} ${originalUrl} ${statusCode} ${contentLength}`,
        this.useProductionLogFormat && this.useExtendedDataOption
          ? {
              req: request,
              res: response,
              sid: request.sessionID,
            }
          : undefined
      );
    });

    next();
  }
}

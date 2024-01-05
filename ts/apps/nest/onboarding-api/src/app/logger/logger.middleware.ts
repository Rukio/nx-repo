import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { LoggingConfiguration } from './logger.configuration';
import { InjectLogger } from '../decorators/logger.decorator';

@Injectable()
export default class LoggerMiddleware implements NestMiddleware {
  private useProductionLogFormat: boolean;

  private useExtendedDataOption: boolean;

  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    private configService: ConfigService
  ) {
    const loggingConfig =
      this.configService.get<LoggingConfiguration>('logging');
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
            }
          : undefined
      );
    });

    next();
  }
}

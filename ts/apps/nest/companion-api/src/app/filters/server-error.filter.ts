import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
} from '@nestjs/common';

import { Logger } from 'winston';
import { InjectLogger } from '../logger/logger.decorator';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  SEGMENT_UNKNOWN_ID,
  SegmentService,
} from '@*company-data-covered*/nest-segment';
import { Request } from 'express';
import { CompanionSegmentEventTrackParams } from '../common/types/segment';
import { COMPANION_SEGMENT_EVENTS } from '../common/constants';

interface ServerError {
  message: string;
  error: string;
  status?: number | string;
}

@Catch()
@Injectable()
export class ServerErrorFilter extends BaseExceptionFilter {
  private serverError: ServerError;

  constructor(
    @InjectLogger() private logger: Logger,
    private segment: SegmentService
  ) {
    super();
    this.serverError = {} as ServerError;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();

    if (exception instanceof HttpException) {
      this.serverError.status = exception.getStatus();
    } else {
      this.serverError.status = exception.code;
    }

    this.serverError.message = exception.message;
    this.serverError.error = exception.name;

    this.segment.track<CompanionSegmentEventTrackParams>({
      anonymousId: request.user?.linkId ?? SEGMENT_UNKNOWN_ID,
      event: COMPANION_SEGMENT_EVENTS.SERVER_ERROR,
      properties: {
        errorName: exception.name,
        errorMessage: exception.message,
        path: request.path,
      },
    });

    this.logger.error(this.serverError.message, {
      error: this.serverError.error,
      status: this.serverError.status,
    });

    super.catch(exception, host);
  }
}

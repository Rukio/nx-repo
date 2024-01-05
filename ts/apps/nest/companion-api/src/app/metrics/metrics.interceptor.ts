import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { getException, getHttpOutcome } from './common';
import { DatadogService } from '@*company-data-covered*/nest-datadog';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly datadog: DatadogService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>
  ): Observable<unknown> {
    const startAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logMetrics(context, startAt),
        error: (error) => this.logMetrics(context, startAt, error),
      })
    );
  }

  private logMetrics(
    context: ExecutionContext,
    start: number,
    error?: Error | HttpException
  ): void {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();
    const exception = getException(error);
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const fullHandlerName = `${className}.${handlerName}`;
    const { method, originalUrl } = request;

    response.on('finish', async () => {
      const duration = Date.now() - start;
      const code = response.statusCode;
      const outcome = getHttpOutcome(code);

      try {
        const ddTags: Record<string, string> = {
          code: code?.toString(),
          exception,
          handler: fullHandlerName,
          method,
          path: originalUrl,
          outcome,
        };

        this.datadog.histogram('http_calls', duration, ddTags);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    });
  }
}

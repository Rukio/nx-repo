import { HttpService } from '@nestjs/axios';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/** Retrieves the bearer token passed from the incoming request and pass it to http request to station */
@Injectable()
export class HttpServiceInterceptor implements NestInterceptor {
  constructor(private httpService: HttpService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const token = ctx.getRequest().headers.authorization;

    if (token) {
      this.httpService.axiosRef.defaults.headers.common.authorization = token;
    } else {
      this.httpService.axiosRef.defaults.headers.common.authorization = null;
    }

    return next.handle().pipe();
  }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { validateIncomingRequest } from 'twilio/lib/webhooks/webhooks';
import { ConfigService } from '@nestjs/config';
import { getRequiredEnvironmentVariable } from '../utility/utils';

@Injectable()
export class TwilioValidRequestGuard implements CanActivate {
  private authToken: string;

  constructor(private config: ConfigService) {
    const authToken = getRequiredEnvironmentVariable(
      'TWILIO_AUTH_TOKEN',
      this.config
    );

    this.authToken = authToken;
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      return validateIncomingRequest(request, this.authToken);
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error validating Twilio request: ${error.message}`;
      }

      throw error;
    }
  }
}

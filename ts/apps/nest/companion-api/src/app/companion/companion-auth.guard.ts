import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanionSessionExpressRequest } from './companion.strategy';

/**
 * The authentication guard using the custom companion passport strategy.
 *
 * This guard is custom to create the log in session.
 */
@Injectable()
export class CompanionAuthGuard extends AuthGuard('companion') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<CompanionSessionExpressRequest>();

    const isAuthenticated = request.isAuthenticated();
    if (isAuthenticated) {
      return true;
    }

    const authSuccessful = await super.canActivate(context);
    if (authSuccessful) {
      await super.logIn(request); // starts session

      return true;
    }

    return false;
  }
}

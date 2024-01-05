import { AuthenticationClient } from 'auth0';
import { InjectAuthOptions } from './auth.decorators';
import { AuthenticationModuleOptions } from './auth.module-options.interface';

/** The base functionality of Auth0 clients. */
export class Auth0Client extends AuthenticationClient {
  constructor(
    @InjectAuthOptions() { auth0ClientOptions }: AuthenticationModuleOptions
  ) {
    super(auth0ClientOptions);
  }
}

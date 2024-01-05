import { AuthenticationClientOptions } from 'auth0';

export interface AuthenticationModuleOptions {
  /** The Auth0 audience to use for token requests. */
  audience: string;

  /** The Auth0 issuer used with token validation */
  issuer: string;

  /** The key used to store tokens. */
  tokenKey: string;

  auth0ClientOptions: AuthenticationClientOptions;
}

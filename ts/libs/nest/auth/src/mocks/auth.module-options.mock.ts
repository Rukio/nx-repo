import { AuthenticationModuleOptions } from '../lib/auth.module-options.interface';
import * as faker from 'faker';

export function buildMockAuthenticationModuleOptions(
  init: Partial<AuthenticationModuleOptions> = {}
): AuthenticationModuleOptions {
  return {
    auth0ClientOptions: {
      domain: 'example.com',
      clientId: 'abc123',
      clientSecret: 'def456',
    },
    audience: 'some-audience',
    issuer: 'https://testing-auth.*company-data-covered*.com/',
    tokenKey: faker.datatype.string(),
    ...init,
  };
}

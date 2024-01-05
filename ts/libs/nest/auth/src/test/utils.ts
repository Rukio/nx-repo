import * as faker from 'faker';
import { AuthenticationModuleOptions } from '../lib/auth.module-options.interface';

export const buildMockAuthenticationModuleOptions = (
  overrideOptions: Partial<AuthenticationModuleOptions> = {}
): AuthenticationModuleOptions => {
  return {
    auth0ClientOptions: {
      domain: faker.internet.domainName(),
      clientId: faker.datatype.string(),
      clientSecret: faker.datatype.string(),
    },
    audience: 'some-audience',
    issuer: 'https://testing-auth.*company-data-covered*.com/',
    tokenKey: faker.datatype.string(),
    ...overrideOptions,
  };
};

import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { UserKey } from './src/fixtures/loginUsers';

export type UserPasswordConfig = Record<UserKey, string | undefined>;

const userPasswords: UserPasswordConfig = {
  admin: process.env['NX_CYPRESS_STATION_PASSWORD_ADMIN'],
};

export default defineConfig({
  env: {
    stationUrl: 'https://qa.*company-data-covered*.com',
    authUrl: 'https://staging-auth.*company-data-covered*.com/oauth/token',
    authClientId: 'cXh3JzHjE85ehCv7KY4xczy4cG44LqrZ',
    authAudience: 'internal.*company-data-covered*.com',
    authStationUrl: 'https://staging-auth.*company-data-covered*.com/oauth/token',
    authStationClientId: '2OzJiHf1L5boin2RIU1NgtTgUIcSFG9c',
    apiUrl: 'http://localhost:8182',
    userPasswords,
  },
  e2e: {
    ...nxE2EPreset(__filename),
    baseUrl: 'https://localhost:4200',
    /**
     * TODO(@nx/cypress): In Cypress v12,the testIsolation option is turned on by default.
     * This can cause tests to start breaking where not indended.
     * You should consider enabling this once you verify tests do not depend on each other
     * More Info: https://docs.cypress.io/guides/references/migration-guide#Test-Isolation
     **/
    testIsolation: false,
  },
});

import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { UserKey } from './src/fixtures/loginUsers';

export type UserPasswordConfig = Record<UserKey, string | undefined>;

const userPasswords: UserPasswordConfig = {
  provider: process.env['NX_CYPRESS_STATION_PASSWORD_PROVIDER'],
};

export default defineConfig({
  env: {
    stationUrl: 'https://qa.*company-data-covered*.com',
    authUrl: 'https://staging-auth.*company-data-covered*.com/oauth/token',
    authClientId: 'jwdBIvE9iZj9ODuSBd8kbqjcXb9S1gQ4',
    authAudience: 'internal.*company-data-covered*.com',
    authStationUrl: 'https://staging-auth.*company-data-covered*.com/oauth/token',
    authStationClientId: '2OzJiHf1L5boin2RIU1NgtTgUIcSFG9c',
    apiUrl: 'http://localhost:8182',
    userPasswords,
  },
  e2e: {
    ...nxE2EPreset(__filename),
    baseUrl: 'https://localhost:4252',
    /**
     * TODO(@nx/cypress): In Cypress v12,the testIsolation option is turned on by default.
     * This can cause tests to start breaking where not indended.
     * You should consider enabling this once you verify tests do not depend on each other
     * More Info: https://docs.cypress.io/guides/references/migration-guide#Test-Isolation
     **/
    testIsolation: false,
  },
});

import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  env: {
    authUrl: 'dispatch-uat.us.auth0.com',
    authClientId: 'eRuHhQkiCKt3iKShtHrTq2dvnglHIdAJ',
    authAudience: 'insurance-service.*company-data-covered*.com',
  },
  e2e: {
    ...nxE2EPreset(__filename),
    baseUrl: 'https://insurance-uat.stage.*company-data-covered*.com/payers',
  },
});

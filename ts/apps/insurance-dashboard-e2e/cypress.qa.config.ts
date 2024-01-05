import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';

export default defineConfig({
  env: {
    authUrl: 'staging-auth.*company-data-covered*.com',
    authClientId: '4zBDRbWBhpOigKx8TUA4at8VSnvkKGV7',
    authAudience: 'insurance-service.*company-data-covered*.com',
  },
  e2e: {
    ...nxE2EPreset(__filename),
    baseUrl: 'https://insurance-qa.stage.*company-data-covered*.com/payers',
  },
});

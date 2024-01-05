import { baseCypressConfig } from '@*company-data-covered*/caremanager/utils-e2e/cypress-config';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...nxE2EPreset(__filename, { cypressDir: 'cypress' }),
    ...baseCypressConfig.e2e,
    /**
     * TODO: check if `testIsolation` can be turned on for feature libraries,
     * which is the default behavior for the current Cypress version
     */
    // testIsolation: true,
  },
});

import { defineConfig } from 'cypress';
import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { baseCypressConfig } from '@*company-data-covered*/caremanager/utils-e2e/cypress-config';

const nxConfigPreset = nxE2EPreset(__dirname);

export default defineConfig({
  ...baseCypressConfig,
  e2e: {
    ...nxConfigPreset,
    ...baseCypressConfig.e2e,
  },
  env: {
    daytonaBeachId: 197,
  },
});

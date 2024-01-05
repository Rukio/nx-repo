export const baseCypressConfig: Cypress.ConfigOptions = {
  projectId: '6gpwvt',
  chromeWebSecurity: false,
  viewportHeight: 784,
  viewportWidth: 1366,
  numTestsKeptInMemory: 5,
  defaultCommandTimeout: 10000,
  responseTimeout: 30000,
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: process.env.BASE_URL,
    testIsolation: false,
    experimentalRunAllSpecs: true,
    setupNodeEvents(on, config) {
      /**
       * TODO: enable Vite as a file preprocessor once we have a solution for
       * polyfills and other errors that it is throwing when enabled.
       * on('file:preprocessor', vitePreprocessor('vite.config.ts'));
       */

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('cypress-terminal-report/src/installLogsPrinter')(on);

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@cypress/code-coverage/task')(on, config);
    },
  },
};

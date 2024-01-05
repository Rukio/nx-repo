// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@*company-data-covered*/cypress-shared';
import '@cypress/code-coverage/support';
import 'cypress-real-events/support';
import * as logCollector from 'cypress-terminal-report/src/installLogsCollector';
import '@*company-data-covered*/caremanager/utils-e2e/commands';

logCollector();

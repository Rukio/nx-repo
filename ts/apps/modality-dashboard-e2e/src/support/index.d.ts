/// <reference types="cypress" />

declare namespace Cypress {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  interface Chainable<Subject> {
    /**
     * A custom command that logs in through the Auth0 API.
     *
     * @example cy.login();
     */
    login(userKey?: import('./commands/apiCommands').UserKey): Chainable<void>;
  }
}

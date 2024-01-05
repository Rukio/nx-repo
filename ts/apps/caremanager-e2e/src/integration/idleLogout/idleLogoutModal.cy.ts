import { el } from '@*company-data-covered*/cypress-shared';
import {
  TIMER_TIMEOUT,
  TIMER_UNTIL_PROMPT,
} from '@*company-data-covered*/caremanager/utils';
import { navigateCareManagerTo } from '@*company-data-covered*/caremanager/utils-e2e';

const IDLE_LOGOUT_MODAL_TITLE = 'idle-logout-modal-title';
const MAX_IDLE_COUNTER = TIMER_UNTIL_PROMPT * 60 * 1000 - 1000; // seconds
const MAX_TIMEOUT_TIMER = TIMER_TIMEOUT * 60 * 1000 - 1000; // seconds
const IDLE_LOGOUT_MODAL_COUNTDOWN = 'idle-logout-modal-countdown';
const IDLE_LOGOUT_MODAL_MESSAGE = 'idle-logout-modal-message';
const IDLE_LOGOUT_MODAL = 'idle-logout-modal';

describe('Idle Logout Modal', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.clock();
    navigateCareManagerTo({ location: 'CARE_MANAGER_MAIN' });
  });

  it('should display idle modal after idle timeout', () => {
    cy.tick(MAX_IDLE_COUNTER);
    el(IDLE_LOGOUT_MODAL).should('not.exist');
    cy.tick(1000);
    el(IDLE_LOGOUT_MODAL).isVisible();
    el(IDLE_LOGOUT_MODAL_MESSAGE).hasText(
      'For security reasons Dispatch Health sessions automatically end after 30 minutes of inactivity'
    );
    el(IDLE_LOGOUT_MODAL_TITLE).hasText('Inactivity Log Out');
    el(IDLE_LOGOUT_MODAL_COUNTDOWN).hasText(
      `Your session will expire in ${TIMER_UNTIL_PROMPT} minutes and 0 seconds`
    );
  });

  it('should dismiss the modal on click', () => {
    cy.tick(MAX_IDLE_COUNTER + 1000);
    el(IDLE_LOGOUT_MODAL).isVisible().click();
    // TODO (AC-950): Investigate cypress issue with tick() not hiding elements on the screen properly
    cy.reload();
    el(IDLE_LOGOUT_MODAL).should('not.exist');
  });

  // TODO: investigate exception on sign in page
  it.skip('should disconnect the user after 30 minutes', () => {
    cy.tick(MAX_TIMEOUT_TIMER);
    el(IDLE_LOGOUT_MODAL).isVisible();
    cy.tick(2000);
    cy.url().should('contain', Cypress.env('AUTH0_SIGN_OUT_REDIRECT_DOMAIN'));
  });
});

import { navigateCareManagerTo } from '@*company-data-covered*/caremanager/utils-e2e';
import { el } from '@*company-data-covered*/cypress-shared';

/* Selectors */
const ACCESS_DENIED_MODE = 'access-denied-mode';
const SOMETHING_WENT_WRONG_MODE = 'something-went-wrong-mode';

// TODO: AC-641 This is temporary due to local Uncaught Error Boundary work. Once this is fixed, then we can remove this.
Cypress.on('uncaught:exception', (err) => {
  if (
    // eslint-disable-next-line vitest/valid-expect
    expect(err.message).to.include(' > ') ||
    // eslint-disable-next-line vitest/valid-expect
    expect(err.message).to.include('Unexpected token < in JSON at position 0')
  ) {
    return false;
  }

  return true;
});

describe('Error Status', () => {
  before(() => {
    cy.login();
  });

  describe('Forbidden Error', () => {
    beforeEach(() => {
      navigateCareManagerTo({ location: 'FORBIDDEN_ERROR' });
    });

    it('should display an error if you do not have correct permissions', () => {
      el(`${ACCESS_DENIED_MODE}-logo`).isVisible();
      el(`${ACCESS_DENIED_MODE}-title`).hasText(
        "You don't have access to this"
      );
      el(`${ACCESS_DENIED_MODE}-message`).hasText(
        'To request access, please contact your manager.'
      );
    });
  });

  describe('Something Went Wrong Error', () => {
    beforeEach(() => {
      navigateCareManagerTo({ location: 'SOMETHING_WENT_WRONG_ERROR' });
    });

    it('should display an error if api call fails to retrieve data', () => {
      el(`${SOMETHING_WENT_WRONG_MODE}-logo`).isVisible();
      el(`${SOMETHING_WENT_WRONG_MODE}-title`).hasText('Something went wrong');
      el('something-went-wrong-error-message').hasText(
        'Please try again. If the issue persists, please contact support@*company-data-covered*.com.'
      );
    });
  });
});

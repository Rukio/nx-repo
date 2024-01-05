import { el } from '@*company-data-covered*/cypress-shared';

const HOME_PAGE = 'homepage';

describe('risk-stratification-admin', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    el(HOME_PAGE).hasText('Risk Stratification');
  });
});

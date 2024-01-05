import { el } from '@*company-data-covered*/cypress-shared';
import { interceptGETModalities } from './helpers/interceptHelper';

const MARKETS_TABLE = 'markets-table';

describe('modality-dashboard', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('localhost:4200');
    interceptGETModalities();
  });

  it('should display welcome message', () => {
    el(MARKETS_TABLE).isVisible();
  });
});

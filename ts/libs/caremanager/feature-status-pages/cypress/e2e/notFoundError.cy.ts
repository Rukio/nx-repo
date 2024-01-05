import { el } from '@*company-data-covered*/cypress-shared';
import {
  interceptGETConfigData,
  interceptGETEpisodes,
  navigateCareManagerTo,
  validateHeader,
} from '@*company-data-covered*/caremanager/utils-e2e';

const NOT_FOUND = 'page-not-found';
const NOT_FOUND_LOGO = 'page-not-found-logo';
const RETURN_HOME_BUTTON = 'return-home-button';
const EPISODES_SEARCH_INPUT = 'search-input';

describe('404 Not Found Page', () => {
  before(() => {
    cy.login();
  });

  it('should display not found page', () => {
    navigateCareManagerTo({ location: 'NOT_FOUND' });
    el(NOT_FOUND).hasText('Page not found');
    el(NOT_FOUND_LOGO).isVisible();
    el(RETURN_HOME_BUTTON).hasHref('/episodes');
  });

  it('should return to home', () => {
    navigateCareManagerTo({ location: 'NOT_FOUND' });
    interceptGETConfigData();
    interceptGETEpisodes();
    el(RETURN_HOME_BUTTON).click();
    validateHeader();
    el(EPISODES_SEARCH_INPUT).hasPlaceholder('Search by patient name');
  });
});

import { el } from '@*company-data-covered*/cypress-shared';
import { APP_BAR_CONTAINER, LANDING_PAGE_TEST_IDS } from './helpers/selectors';

describe('Landing Page', () => {
  beforeEach(() => cy.visit('/'));

  it('should render saved addresses section  correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();
    el(LANDING_PAGE_TEST_IDS.PAGE).isVisible();
  });

  it('should render My Settings section correctly', () => {
    el(LANDING_PAGE_TEST_IDS.MY_SETTINGS_SECTION).isVisible();
  });

  it('should render saved addresses section correctly', () => {
    el(LANDING_PAGE_TEST_IDS.SAVED_ADDRESSED_SECTION_TITLE).should(
      'contain',
      'Saved Addresses'
    );

    el(LANDING_PAGE_TEST_IDS.SAVED_ADDRESSED_SECTION_SUBTITLE).should(
      'contain',
      'Addresses where we deliver care'
    );
  });
});

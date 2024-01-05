import { el } from '@*company-data-covered*/cypress-shared';

/* Shared Selectors */
export const ACTIVE_CARE_PHASES = [
  'Active',
  'High Acuity',
  'Transition - High',
];
export const CARE_PHASE_ACTIVE_SUBHEADING = 'care-phase-active-subheading';
export const CARE_PHASE_DROPDOWN_LIST = 'care-phase-dropdown-list';
export const CARE_PHASE_FILTER = 'care-phase-filter';
export const CARE_PHASE_INACTIVE_SUBHEADING = 'care-phase-inactive-subheading';
export const CLEAR_ALL_BUTTON = 'clear-all-button';
export const CLEAR_FILTER_BUTTON = 'clear-filter-button';
export const DISPATCH_HEALTH_LOGO = 'dispatch-health-logo';
export const DONE_FILTER_BUTTON = 'done-filter-button';
export const EPISODES_ROUTER_BUTTON = 'episodes-router-button';
export const FILTERS_SECTION = 'filters-section';
export const INACTIVE_CARE_PHASES = ['Closed', 'Discharged', 'Pending'];
export const INCOMPLETE_TASK_FILTER = 'incomplete-task-filter';
export const LOGOUT_BUTTON = 'logout-button';
export const MARKET_DROPDOWN_LIST = 'market-dropdown-list';
export const MARKET_FILTER = 'market-filter';
export const MARKET_LABEL_TEXT = 'market-label-text';
export const MARKET_SEARCH_INPUT = 'market-search-input';
export const SERVICE_LINE_DROPDOWN_LIST = 'service-line-dropdown-list';
export const SERVICE_LINE_FILTER = 'service-line-filter';
const SETTINGS_BUTTON = 'settings-button';
export const USER_MENU_BUTTON = 'user-menu-button';

/* Shared Helpers */
export const validateHeader = (user = 'admin') => {
  cy.fixture('loginUsers').then((loginUsers) => {
    const { username } = loginUsers[user];

    el(DISPATCH_HEALTH_LOGO).isVisible();
    el(EPISODES_ROUTER_BUTTON).hasText('Episodes');
    el(SETTINGS_BUTTON).isVisible();
    el(LOGOUT_BUTTON).should('not.exist');
    el(USER_MENU_BUTTON).hasText(username).click();
    el(LOGOUT_BUTTON).hasText('Log Out');
    cy.clickOutside();
  });
};

export const selectAllFilterOptions = (
  dropdownButton: string,
  dropdownList: string
) => {
  el(dropdownButton).click({ force: true });
  el(dropdownList)
    .children()
    .each((option: string) => {
      cy.wrap(option).click();
    });
};

export const selectFilterOptions = (
  testId: string,
  options?: {
    selectList?: string[];
    selectAll?: boolean;
  }
) => {
  el(testId).each(($event) => {
    cy.wrap($event)
      .get('[type="checkbox"]')
      .then(($el) => {
        $el.map((option) => {
          if (
            options?.selectList?.includes(
              ($el.get(option) as HTMLSelectElement).value
            ) ||
            options?.selectAll
          ) {
            return cy.wrap($el.get(option)).check({ force: true });
          } else {
            return cy.wrap($el.get(option)).uncheck({ force: true });
          }
        });
      });
  });
};

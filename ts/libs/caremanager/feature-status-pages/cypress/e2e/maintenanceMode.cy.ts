import { navigateCareManagerTo } from '@*company-data-covered*/caremanager/utils-e2e';
import { statsigHelper } from '@*company-data-covered*/caremanager/utils-e2e/statsig';
import { el } from '@*company-data-covered*/cypress-shared';

/* Selectors */
const FILTERS_SECTION = 'filters-section';
const MAINTENANCE_MODE_LOGO = 'maintenance-mode-logo';
const MAINTENANCE_MODE_MESSAGE = 'maintenance-mode-message';
const MAINTENANCE_MODE_TITLE = 'maintenance-mode-title';

describe(`Maintenance Mode`, () => {
  before(() => {
    cy.login();
  });

  it('should display a maintenance page if care manager is undergoing changes', () => {
    statsigHelper.overrideFeatureGate('maintenanceMode', true);
    navigateCareManagerTo({ location: 'CARE_MANAGER_MAIN' });

    el(MAINTENANCE_MODE_LOGO).isVisible();
    el(MAINTENANCE_MODE_TITLE).hasText('Care Manager is under Maintenance');
    el(MAINTENANCE_MODE_MESSAGE).hasText('Please check back in a bit');
    el(FILTERS_SECTION).should('not.exist');
  });

  it('should not display a maintenance page if care manager is not undergoing changes', () => {
    statsigHelper.overrideFeatureGate('maintenanceMode', false);
    navigateCareManagerTo({ location: 'CARE_MANAGER_MAIN' });

    el(MAINTENANCE_MODE_LOGO).should('not.exist');
    el(MAINTENANCE_MODE_TITLE).should('not.exist');
    el(MAINTENANCE_MODE_MESSAGE).should('not.exist');
    el(FILTERS_SECTION).isVisible();
  });
});

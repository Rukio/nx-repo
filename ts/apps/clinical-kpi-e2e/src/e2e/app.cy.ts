import { el } from '@*company-data-covered*/cypress-shared';
import {
  DISPATCH_HEALTH_LOGO_LINK,
  APPBAR_STATION_DASHBOARD_LINK,
  APPBAR_STATION_DASHBOARD_LINK_LABEL_PREFIX,
  KPI_DASHBOARD_GRAPHIC,
  HEADER_GREETING_TEXT,
  HEADER_LAST_UPDATED_TEXT,
  HEADER_VISITS_COMPLETED_TEXT,
  HEADER_PERFORMANCE_TEXT,
  HEADER_LEARN_MORE_LINK,
} from './helpers/selectors';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

function validateAppBar(deviceType: DeviceType) {
  el(DISPATCH_HEALTH_LOGO_LINK)
    .isVisible()
    .hasHref('https://qa.*company-data-covered*.com/');
  el(APPBAR_STATION_DASHBOARD_LINK)
    .isVisible()
    .hasHref('https://qa.*company-data-covered*.com/');
  el(APPBAR_STATION_DASHBOARD_LINK).hasText('Dashboard');
  if (deviceType === 'mobile') {
    el(APPBAR_STATION_DASHBOARD_LINK_LABEL_PREFIX).isHidden();
    el(KPI_DASHBOARD_GRAPHIC).isHidden();
  } else {
    el(APPBAR_STATION_DASHBOARD_LINK_LABEL_PREFIX).hasText('Continue to');
    el(KPI_DASHBOARD_GRAPHIC).isVisible();
  }
}

function validateAppHeader(greetingText) {
  el(HEADER_GREETING_TEXT).hasText(greetingText);
  el(HEADER_LAST_UPDATED_TEXT).hasText('Last Updated:');
  el(HEADER_VISITS_COMPLETED_TEXT).hasText('Visits Completed Last Week:');
  el(HEADER_PERFORMANCE_TEXT).hasExactText(
    'Performance based on an 80 acute visit trailing average.'
  );
  el(HEADER_LEARN_MORE_LINK).hasHref('/');
  el(HEADER_LEARN_MORE_LINK).hasExactText('Learn More');
}

describe('clinical kpi dashboard', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
  });

  it('should display app bar', () => {
    validateAppBar('desktop');
  });

  it('should display correct morning header', () => {
    cy.clock(new Date(2020, 3, 1, 8));
    validateAppHeader('Good Morning,');
  });

  it('should display correct afternoon header', () => {
    cy.clock(new Date(2020, 3, 1, 13));
    validateAppHeader('Good Afternoon');
  });

  it('should display correct evening header', () => {
    cy.clock(new Date(2020, 3, 1, 19));
    validateAppHeader('Good Evening');
  });

  describe('mobile viewport', () => {
    beforeEach(() => cy.viewport('iphone-x'));

    it('should display app bar', () => {
      validateAppBar('mobile');
    });
  });
});

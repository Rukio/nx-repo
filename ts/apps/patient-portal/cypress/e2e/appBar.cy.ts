import { el } from '@*company-data-covered*/cypress-shared';
import {
  APP_BAR_CONTAINER,
  APP_BAR_DISPATCH_HEALTH_LOGO_LINK,
} from './helpers/selectors';

describe('Patient portal', () => {
  beforeEach(() => cy.visit('/'));

  it('should render app bar correctly correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();

    el(APP_BAR_DISPATCH_HEALTH_LOGO_LINK).isVisible().hasHref('/');
  });
});

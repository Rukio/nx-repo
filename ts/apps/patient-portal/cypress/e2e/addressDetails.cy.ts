import { el } from '@*company-data-covered*/cypress-shared';
import { APP_BAR_CONTAINER } from './helpers/selectors';

describe('Address Details', () => {
  const mockId = 1;

  beforeEach(() => cy.visit(`/addresses/${mockId}`));

  it('should render correctly', () => {
    el(APP_BAR_CONTAINER).isVisible();
    cy.contains(new RegExp(`Editing address ${mockId}`)).isVisible();
  });
});

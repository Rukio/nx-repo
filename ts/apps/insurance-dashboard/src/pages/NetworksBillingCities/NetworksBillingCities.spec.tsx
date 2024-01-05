import { render, screen } from '../../testUtils';
import NetworksBillingCitiesPage from './NetworksBillingCities';
import { NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS } from '@*company-data-covered*/insurance/ui';

describe('<NetworksBillingCitiesPage />', () => {
  it('should render properly', () => {
    render(<NetworksBillingCitiesPage />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(NETWORKS_BILLING_CITIES_FILTERS_TEST_IDS.ROOT)
    ).toBeVisible();
  });
});

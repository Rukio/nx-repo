import { NetworksBillingCities } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const NetworksBillingCitiesPage = () => (
  <Box data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_BILLING_CITIES}>
    <NetworksBillingCities />
  </Box>
);

export default NetworksBillingCitiesPage;

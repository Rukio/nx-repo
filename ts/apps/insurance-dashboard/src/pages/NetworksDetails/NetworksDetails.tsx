import { NetworksDetails } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const NetworksDetailsPage = () => (
  <Box data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_DETAILS}>
    <NetworksDetails />
  </Box>
);

export default NetworksDetailsPage;

import { NetworksCreate } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const NetworksCreatePage = () => (
  <Box data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_CREATE}>
    <NetworksCreate />
  </Box>
);

export default NetworksCreatePage;

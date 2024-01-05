import { ManagePayer } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const PayersDetailsPage = () => (
  <Box data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYER_DETAILS}>
    <ManagePayer />
  </Box>
);

export default PayersDetailsPage;

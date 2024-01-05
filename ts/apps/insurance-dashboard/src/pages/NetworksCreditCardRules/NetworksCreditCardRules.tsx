import { NetworksCreditCardRules } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const NetworksCreditCardRulesPage = () => (
  <Box
    data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_CREDIT_CARD_RULES}
  >
    <NetworksCreditCardRules />
  </Box>
);

export default NetworksCreditCardRulesPage;

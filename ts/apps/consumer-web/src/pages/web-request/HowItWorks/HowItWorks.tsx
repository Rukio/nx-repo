import { HowItWorks } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const HowItWorksPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.HOW_IT_WORKS}>
    <HowItWorks />
  </Box>
);

export default HowItWorksPage;

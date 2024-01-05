import { WhoNeedsCare } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { Box } from '@*company-data-covered*/design-system';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from './testIds';

const WhoNeedsCarePage = () => (
  <Box data-testid={ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.WHO_NEEDS_CARE}>
    <WhoNeedsCare />
  </Box>
);

export default WhoNeedsCarePage;

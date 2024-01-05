import { Offboard } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { Box } from '@*company-data-covered*/design-system';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from './testIds';

const OffboardPage = () => (
  <Box data-testid={ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.OFFBOARD}>
    <Offboard />
  </Box>
);

export default OffboardPage;

import { ConfirmDetails } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { Box } from '@*company-data-covered*/design-system';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from './testIds';

const ConfirmDetailsPage = () => (
  <Box data-testid={ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CONFIRM_DETAILS}>
    <ConfirmDetails />
  </Box>
);

export default ConfirmDetailsPage;

import { Confirmation } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';
import { Box } from '@*company-data-covered*/design-system';
import { ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS } from './testIds';
import { environment } from '../../environments/environment';

const { dispatcherLinePhoneNumber } = environment;

const ConfirmationPage = () => (
  <Box data-testid={ONLINE_SELF_SCHEDULING_PAGES_TEST_IDS.CONFIRMATION}>
    <Confirmation dispatcherPhoneNumber={dispatcherLinePhoneNumber} />
  </Box>
);

export default ConfirmationPage;

import { RequestTimeWindows } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const RequestTimeWindowsPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.REQUEST_TIME_WINDOWS}>
    <RequestTimeWindows />
  </Box>
);

export default RequestTimeWindowsPage;

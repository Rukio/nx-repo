import { RequestPersonalInfo } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const RequestPersonalInfoPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.REQUEST_PERSONAL_INFO}>
    <RequestPersonalInfo />
  </Box>
);

export default RequestPersonalInfoPage;

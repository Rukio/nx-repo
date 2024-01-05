import { RequestAddress } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const RequestAddressPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.REQUEST_ADDRESS}>
    <RequestAddress />
  </Box>
);

export default RequestAddressPage;

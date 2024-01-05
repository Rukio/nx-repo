import { RequestDetails } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const RequestDetailsPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.REQUEST_DETAILS}>
    <RequestDetails />
  </Box>
);

export default RequestDetailsPage;

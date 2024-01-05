import { RequestCareFor } from '@*company-data-covered*/consumer-web/web-request/feature';
import { Box } from '@*company-data-covered*/design-system';
import { WEB_REQUEST_PAGES_TEST_IDS } from '../testIds';

const RequestCareForPage = () => (
  <Box data-testid={WEB_REQUEST_PAGES_TEST_IDS.REQUEST_CARE_FOR}>
    <RequestCareFor />
  </Box>
);

export default RequestCareForPage;

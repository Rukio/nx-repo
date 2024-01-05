import { NewPayer } from '@*company-data-covered*/insurance/feature';
import { Box } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from './testIds';

const NewPayerPage = () => {
  return (
    <Box data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYER_CREATE}>
      <NewPayer />
    </Box>
  );
};

export default NewPayerPage;

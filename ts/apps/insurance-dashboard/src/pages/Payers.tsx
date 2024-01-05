import { PayersList, PayersHeader } from '@*company-data-covered*/insurance/feature';
import { Container } from '@*company-data-covered*/design-system';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from './testIds';

const PayersPage = () => {
  return (
    <Container
      maxWidth="xl"
      data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYERS_LIST}
    >
      <PayersHeader />
      <PayersList />
    </Container>
  );
};

export default PayersPage;

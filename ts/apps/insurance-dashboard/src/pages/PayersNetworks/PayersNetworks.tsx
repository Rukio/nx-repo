import { Container } from '@*company-data-covered*/design-system';
import {
  NetworksList,
  NetworkControls,
} from '@*company-data-covered*/insurance/feature';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../testIds';

const PayersNetworksPage = () => {
  return (
    <Container
      maxWidth="xl"
      data-testid={INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYER_NETWORKS_LIST}
    >
      <NetworkControls />
      <NetworksList />
    </Container>
  );
};

export default PayersNetworksPage;

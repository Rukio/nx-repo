import { render, screen } from '../../testUtils';
import NetworksCreditCardRulesPage from './NetworksCreditCardRules';
import { NETWORKS_CREDIT_CARD_RULES_TEST_IDS } from '@*company-data-covered*/insurance/ui';

describe('<NetworksCreditCardRulesPage />', () => {
  it('should render properly', () => {
    render(<NetworksCreditCardRulesPage />, { withRouter: true });

    expect(
      screen.getByTestId(NETWORKS_CREDIT_CARD_RULES_TEST_IDS.ROOT)
    ).toBeVisible();
  });
});

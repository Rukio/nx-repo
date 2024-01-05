import { render, screen } from '../../testUtils';
import PayersNetworks from './PayersNetworks';
import { NETWORKS_TABLE_TEST_IDS } from '@*company-data-covered*/insurance/ui';

describe('<PayersNetworks />', () => {
  it('should render properly', () => {
    render(<PayersNetworks />, {
      withRouter: true,
    });

    expect(screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT)).toBeVisible();
  });
});

import { NETWORK_FORM_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import NetworksDetailsPage from './NetworksDetails';

describe('<NetworksDetailsPage />', () => {
  it('should render properly', () => {
    render(<NetworksDetailsPage />, {
      withRouter: true,
    });

    expect(screen.getByTestId(NETWORK_FORM_TEST_IDS.NAME_INPUT)).toBeVisible();
  });
});

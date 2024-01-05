import { NETWORK_FORM_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import NetworksCreatePage from './NetworksCreate';

describe('<NetworksCreatePage />', () => {
  it('should render properly', () => {
    render(<NetworksCreatePage />, {
      withRouter: true,
    });

    expect(screen.getByTestId(NETWORK_FORM_TEST_IDS.NAME_INPUT)).toBeVisible();
  });
});

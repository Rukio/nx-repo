import { PAYER_FORM_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import PayersDetails from './PayersDetails';

describe('<PayersDetails />', () => {
  it('should render properly', () => {
    render(<PayersDetails />, {
      withRouter: true,
    });

    expect(
      screen.getByTestId(PAYER_FORM_TEST_IDS.PAYER_NAME_INPUT)
    ).toBeVisible();
  });
});

import { NAVIGATION_BAR_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import Payer from './Payer';
import { INSURANCE_DASHBOARD_ROUTES } from '@*company-data-covered*/insurance/feature';

const mockedInsurancePayerId = '1';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    payerId: mockedInsurancePayerId,
  })),
}));

describe('<Payer />', () => {
  it('should render properly', () => {
    render(<Payer />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(
            mockedInsurancePayerId
          ),
        ],
      },
    });

    expect(screen.getByTestId(NAVIGATION_BAR_TEST_IDS.ROOT)).toBeVisible();
  });
});

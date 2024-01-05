import { NAVIGATION_BAR_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import NetworkNavigationPage from './NetworkNavigation';
import { INSURANCE_DASHBOARD_ROUTES } from '@*company-data-covered*/insurance/feature';

const mockedInsurancePayerId = '1';
const mockedInsuranceNetworkId = '1';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({
    payerId: mockedInsurancePayerId,
    networkId: mockedInsuranceNetworkId,
  })),
}));

describe('<NetworkNavigationPage />', () => {
  it('should render properly', () => {
    render(<NetworkNavigationPage />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getNetworkDetailsTabPath(
            mockedInsurancePayerId,
            mockedInsuranceNetworkId
          ),
        ],
      },
    });

    expect(screen.getByTestId(NAVIGATION_BAR_TEST_IDS.ROOT)).toBeVisible();
  });
});

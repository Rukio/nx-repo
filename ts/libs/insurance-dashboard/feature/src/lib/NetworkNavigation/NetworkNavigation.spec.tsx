import {
  NAVIGATION_BAR_TEST_IDS,
  NETWORK_HEADER_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import { render, screen, waitFor } from '../../testUtils';
import NetworkNavigation from './NetworkNavigation';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';
import {
  mockedInsuranceNetwork,
  mockedInsurancePayer,
} from '@*company-data-covered*/insurance/data-access';

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({
      payerId: mockedInsurancePayer.id,
      networkId: mockedInsuranceNetwork.id,
    })),
    useLocation: vi.fn(() => ({
      pathname: INSURANCE_DASHBOARD_ROUTES.getNetworkDetailsTabPath(
        mockedInsurancePayer.id,
        mockedInsuranceNetwork.id
      ),
    })),
  };
});

const getBackButton = () =>
  screen.getByTestId(NETWORK_HEADER_TEST_IDS.BACK_BUTTON);
const getNetworkHeader = () =>
  screen.getByTestId(NETWORK_HEADER_TEST_IDS.HEADER_TITLE);

describe('<NetworkNavigation />', () => {
  it('should render properly', () => {
    render(<NetworkNavigation />);

    const backButton = getBackButton();
    expect(backButton).toBeVisible();

    const networkHeader = getNetworkHeader();
    expect(networkHeader).toBeVisible();

    expect(screen.getByTestId(NAVIGATION_BAR_TEST_IDS.ROOT)).toBeVisible();
  });

  it('should set Network name and Payer name to the network header and back button from store', async () => {
    render(<NetworkNavigation />);

    const backButton = getBackButton();
    await waitFor(() =>
      expect(backButton).toHaveTextContent(mockedInsurancePayer.name)
    );

    const networkHeader = getNetworkHeader();
    expect(networkHeader).toHaveTextContent(mockedInsuranceNetwork.name);
  });

  it('should navigate to networks tab', async () => {
    const { user } = render(<NetworkNavigation />);
    const backButton = getBackButton();
    await user.click(backButton);
    expect(mockedNavigator).toBeCalledWith(
      INSURANCE_DASHBOARD_ROUTES.getPayerNetworksTabPath(
        mockedInsurancePayer.id
      )
    );
  });
});

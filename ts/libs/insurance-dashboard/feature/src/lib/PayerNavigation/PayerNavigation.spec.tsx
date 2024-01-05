import {
  NAVIGATION_BAR_TEST_IDS,
  DETAILS_PAGE_HEADER_TEST_IDS,
} from '@*company-data-covered*/insurance/ui';
import * as insuranceDataAccess from '@*company-data-covered*/insurance/data-access';
import { render, screen, waitFor } from '../../testUtils';
import PayerNavigation from './PayerNavigation';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';

const { mockedInsurancePayer } = insuranceDataAccess;

const mockedNavigator = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
    useParams: vi.fn(() => ({ payerId: mockedInsurancePayer.id })),
    useLocation: vi.fn(() => ({
      pathname: `/payers/${mockedInsurancePayer.id}`,
    })),
  };
});

vi.mock('@*company-data-covered*/insurance/data-access', async () => {
  const actual = await vi.importActual<typeof insuranceDataAccess>(
    '@*company-data-covered*/insurance/data-access'
  );

  return {
    ...actual,
    selectPayer: () => vi.fn(() => ({ data: mockedInsurancePayer })),
  };
});

const getHeaderBackButton = () =>
  screen.getByTestId(DETAILS_PAGE_HEADER_TEST_IDS.BACK_BUTTON);
const getHeaderTitle = () =>
  screen.getByTestId(DETAILS_PAGE_HEADER_TEST_IDS.TITLE);

const setup = () =>
  render(<PayerNavigation />, {
    withRouter: true,
  });

describe('<PayerNavigation />', () => {
  it('should render properly', async () => {
    setup();

    expect(screen.getByTestId(NAVIGATION_BAR_TEST_IDS.ROOT)).toBeVisible();
    expect(getHeaderBackButton()).toBeVisible();
    await waitFor(() => {
      const headerTitle = getHeaderTitle();
      expect(headerTitle).toHaveTextContent(mockedInsurancePayer.name);
    });
  });

  it('should navigate back to payers list page', async () => {
    const { user } = setup();

    const backButton = getHeaderBackButton();
    await user.click(backButton);

    await waitFor(() => {
      expect(mockedNavigator).toBeCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.PAYERS);
    });
  });
});

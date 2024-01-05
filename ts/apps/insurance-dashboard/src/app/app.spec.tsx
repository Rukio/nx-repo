import { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { render, screen } from '../testUtils';
import { INSURANCE_DASHBOARD_ROUTES } from '@*company-data-covered*/insurance/feature';
import App from './app';
import { INSURANCE_DASHBOARD_PAGES_TEST_IDS } from '../pages/testIds';

const MockRouterOutlet = jest.fn(() => <Outlet />);

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getAccessTokenSilently: jest.fn(() => Promise.resolve('test-token')),
  }),
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

jest.mock('@*company-data-covered*/insurance/feature', () => {
  const mockedModule = jest.createMockFromModule(
    '@*company-data-covered*/insurance/feature'
  );
  const actualModule = jest.requireActual('@*company-data-covered*/insurance/feature');

  return {
    ...Object(mockedModule),
    INSURANCE_DASHBOARD_ROUTES: actualModule.INSURANCE_DASHBOARD_ROUTES,
    StoreProvider: actualModule.StoreProvider,
    Payer: () => MockRouterOutlet(),
    NetworkNavigation: () => MockRouterOutlet(),
  };
});

const mockedInsurancePayerId = '1';
const mockedInsuranceNetworkId = '1';

describe('App', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render Payers list page', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [INSURANCE_DASHBOARD_ROUTES.PAYERS],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYERS_LIST
    );
    expect(page).toBeVisible();
  });

  it('should render Payers create page', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [INSURANCE_DASHBOARD_ROUTES.PAYER_CREATE],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYER_CREATE
    );
    expect(page).toBeVisible();
  });

  it('should render Payer details page', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(
            mockedInsurancePayerId
          ),
        ],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.PAYER_DETAILS
    );
    expect(page).toBeVisible();
  });

  it('should render NetworkDetails page if path is correct', async () => {
    render(<App />, {
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

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_DETAILS
    );
    expect(page).toBeVisible();
  });

  it('should render NetworkAppointmentTypes page if path is correct', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getNetworkAppointmentTypeTabPath(
            mockedInsurancePayerId,
            mockedInsuranceNetworkId
          ),
        ],
      },
    });

    const rootServiceLinesFormsComponent = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_APPOINTMENT_TYPES
    );
    expect(rootServiceLinesFormsComponent).toBeVisible();
  });

  it('should render NetworksBillingCities page if path is correct', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getNetworkBillingCitiesTabPath(
            mockedInsurancePayerId,
            mockedInsuranceNetworkId
          ),
        ],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_BILLING_CITIES
    );
    expect(page).toBeVisible();
  });

  it('should render NetworksCreditCard page if path is correct', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getNetworkCreditCardTabPath(
            mockedInsurancePayerId,
            mockedInsuranceNetworkId
          ),
        ],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_CREDIT_CARD_RULES
    );
    expect(page).toBeVisible();
  });

  it('should render NetworksCreate page if path is correct', async () => {
    render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [
          INSURANCE_DASHBOARD_ROUTES.getPayerNetworksCreatePath(
            mockedInsurancePayerId
          ),
        ],
      },
    });

    const page = await screen.findByTestId(
      INSURANCE_DASHBOARD_PAGES_TEST_IDS.NETWORK_CREATE
    );
    expect(page).toBeVisible();
  });
});

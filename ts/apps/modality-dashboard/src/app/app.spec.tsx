import { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import App from './app';
import {
  MARKETS_TABLE_TEST_IDS,
  INSURANCE_TABLE_TEST_IDS,
  NETWORKS_TABLE_TEST_IDS,
} from '@*company-data-covered*/modality/ui';
import { Auth0Provider } from '@auth0/auth0-react';

const mockedStatsigCheckGate = jest.fn();

const mockGlobalCypress = (defined: boolean) =>
  Object.defineProperty(window, 'Cypress', {
    writable: true,
    configurable: true,
    value: defined ? {} : undefined,
  });

jest.mock('statsig-js', () => ({
  checkGate: () => mockedStatsigCheckGate(),
  initialize: () => Promise.resolve(),
}));

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getIdTokenClaims: jest.fn(() => Promise.resolve({ __raw: 'test-token' })),
    user: { email: 'mocked@mail.com' },
  }),
  Auth0Provider: jest.fn(
    ({ children }: { children: ReactElement }) => children
  ),
}));

jest.mock('@*company-data-covered*/statsig/feature', () => ({
  StatsigProvider: jest.fn(
    ({ children }: { children: ReactElement }) => children
  ),
}));

const findMarketsTable = () =>
  screen.findByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
const findInsurancePlansTable = () =>
  screen.findByTestId(INSURANCE_TABLE_TEST_IDS.TABLE_ROOT);
const findInsuranceNetworksTable = () =>
  screen.findByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_ROOT);

describe('App', () => {
  beforeEach(() => {
    mockGlobalCypress(false);
    jest.clearAllMocks();
  });

  it('should render successfully with insurance plans configurations', async () => {
    mockedStatsigCheckGate.mockReturnValue(false);
    render(<App />);
    const marketsTable = await findMarketsTable();
    const insurancePlansTable = await findInsurancePlansTable();

    expect(marketsTable).toBeVisible();
    expect(insurancePlansTable).toBeVisible();
  });

  it('should render successfully with insurance networks configurations', async () => {
    mockedStatsigCheckGate.mockReturnValue(true);
    render(<App />);
    const marketsTable = await findMarketsTable();
    const insuranceNetworksTable = await findInsuranceNetworksTable();

    expect(marketsTable).toBeVisible();
    expect(insuranceNetworksTable).toBeVisible();
  });

  it('should render successfully with Cypress configured', async () => {
    mockGlobalCypress(true);
    mockedStatsigCheckGate.mockReturnValue(true);
    render(<App />);

    expect(Auth0Provider).toHaveBeenCalledTimes(1);
    expect(Auth0Provider).toHaveBeenCalledWith(
      expect.objectContaining({ cacheLocation: 'localstorage' }),
      {}
    );
  });
});

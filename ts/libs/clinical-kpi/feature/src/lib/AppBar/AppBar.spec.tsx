import { mocked } from 'jest-mock';
import { useAuth0 } from '@auth0/auth0-react';

import { renderWithUserProvider, screen } from '../util/testUtils';
import AppBar from './AppBar';
import { APP_BAR_TEST_IDS } from './TestIds';
import AuthGuard from '../AuthGuard/AuthGuard';
import { mockedUseAuth0DefaultReturn, user } from '../AuthGuard/AuthGuard.spec';
import { MOCK_JWT_TOKEN_APP, MOCK_JWT_TOKEN_MARKET_MANAGER } from '../mocks';

const mockCheckGate = jest.fn();

jest.mock('statsig-js', () => ({
  checkGate: () => mockCheckGate(),
}));

jest.mock('@auth0/auth0-react');

const mockedUseAuth0 = mocked(useAuth0);

const setup = () => {
  return renderWithUserProvider(
    <AuthGuard>
      <AppBar stationURL="https://qa.*company-data-covered*.com/" />
    </AuthGuard>,
    {}
  );
};

const testRender = async () => {
  const { asFragment } = setup();
  const appBar = await screen.findByTestId(
    APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK
  );
  expect(appBar).toBeVisible();
  // verified in cypress - url values, logo link, continue link, graphic displayed
  expect(asFragment()).toMatchSnapshot();
};

describe('AppBar', () => {
  describe('with allowed roles in JWT', () => {
    beforeEach(() => {
      mockedUseAuth0.mockReturnValue({
        ...mockedUseAuth0DefaultReturn,
        isAuthenticated: true,
        user,
        isLoading: false,
        getAccessTokenSilently: jest
          .fn()
          .mockResolvedValue(MOCK_JWT_TOKEN_MARKET_MANAGER),
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render correctly when flag is turned on', async () => {
      mockCheckGate.mockReturnValue(true);
      await testRender();
    });

    it('should render correctly when flag is turned off', async () => {
      mockCheckGate.mockReturnValue(false);
      await testRender();
    });
  });

  describe('without allowed roles in JWT', () => {
    beforeEach(() => {
      mockedUseAuth0.mockReturnValue({
        ...mockedUseAuth0DefaultReturn,
        isAuthenticated: true,
        user,
        isLoading: false,
        getAccessTokenSilently: jest.fn().mockResolvedValue(MOCK_JWT_TOKEN_APP),
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render correctly when flag is turned on', async () => {
      mockCheckGate.mockReturnValue(true);
      await testRender();
    });

    it('should render correctly when flag is turned off', async () => {
      mockCheckGate.mockReturnValue(false);
      await testRender();
    });
  });
});

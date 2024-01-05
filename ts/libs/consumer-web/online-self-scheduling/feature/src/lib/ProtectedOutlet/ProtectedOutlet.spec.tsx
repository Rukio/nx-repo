import { Auth0ContextInterface, useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router-dom';
import { mocked } from 'jest-mock';
import { ProtectedOutlet, ProtectedOutletProps } from './ProtectedOutlet';
import { render, screen } from '../../testUtils';
import {
  PRE_LOGIN_SLICE_KEY,
  mockPreLoginRequester,
  mockPreLoginPreferredEtaRange,
  mockPreLoginChannelItemId,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { AUTH_FEATURE_KEY } from '@*company-data-covered*/auth0/data-access';

const mockAccessToken = 'test-token';

const useAuth0ReturnValue: Auth0ContextInterface = {
  isAuthenticated: false,
  isLoading: true,
  getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: mockAccessToken }),
  getAccessTokenSilently: jest.fn().mockResolvedValue(mockAccessToken),
  getAccessTokenWithPopup: jest.fn(),
  loginWithRedirect: jest.fn(),
  loginWithPopup: jest.fn(),
  logout: jest.fn(),
  handleRedirectCallback: jest.fn(),
};

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

jest.mock('@*company-data-covered*/auth0/data-access', () => ({
  ...jest.requireActual('@*company-data-covered*/auth0/data-access'),
  setAuthToken: jest.fn(),
}));

const mockUseAuth0 = mocked(useAuth0).mockReturnValue(useAuth0ReturnValue);

const mockLoaderTestId = 'loader';
const MockLoader = () => <div data-testid={mockLoaderTestId}>Loading...</div>;

const mockRouteElementTestId = 'route-element';
const MockRouteElement = () => (
  <div data-testid={mockRouteElementTestId}>router</div>
);

const defaultProps: ProtectedOutletProps = {
  protectedContentProps: { loadingComponent: <MockLoader /> },
};

const setup = (props: ProtectedOutletProps = {}) => {
  return render(
    <Routes>
      <Route element={<ProtectedOutlet {...defaultProps} {...props} />}>
        <Route path="/" element={<MockRouteElement />} />
      </Route>
    </Routes>,
    {
      withRouter: true,
      routerProps: { initialEntries: ['/'] },
    }
  );
};

const setupWithToken = (props: ProtectedOutletProps = {}) => {
  return render(
    <Routes>
      <Route element={<ProtectedOutlet {...defaultProps} {...props} />}>
        <Route path="/" element={<MockRouteElement />} />
      </Route>
    </Routes>,
    {
      withRouter: true,
      routerProps: { initialEntries: ['/'] },
      preloadedState: {
        [PRE_LOGIN_SLICE_KEY]: {
          requester: mockPreLoginRequester,
          preferredEtaRange: mockPreLoginPreferredEtaRange,
          channelItemId: mockPreLoginChannelItemId,
        },
        [AUTH_FEATURE_KEY]: {
          authToken: mockAccessToken,
        },
      },
    }
  );
};

describe('<ProtectedOutlet />', () => {
  it('should render loader correctly', () => {
    setup();

    const loader = screen.getByTestId(mockLoaderTestId);

    expect(loader).toBeVisible();
  });

  it('should render outlet and route if user is authenticated', async () => {
    mockUseAuth0.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
      isAuthenticated: true,
    });

    setupWithToken();

    const routeElement = await screen.findByTestId(mockRouteElementTestId);

    expect(routeElement).toBeVisible();
  });
});

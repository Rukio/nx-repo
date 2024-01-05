import { render, screen, waitFor } from '@*company-data-covered*/shared/testing/react';
import * as Redux from 'react-redux';
import * as Auth0 from '@auth0/auth0-react';
import { useAuth0 } from '@auth0/auth0-react';
import { setAuthToken } from '@*company-data-covered*/auth0/data-access';

import AuthGuard, { AuthGuardProps } from './AuthGuard';
import testIds from './testIds';

const MockedLoader = () => <p>Loading...</p>;
const MockedChildrenContent = () => <p>My App</p>;

const mockedProps: AuthGuardProps = {
  clientId: 'mocked-client',
  domain: 'example.com',
  children: <MockedChildrenContent />,
  loadingComponent: <MockedLoader />,
};

const mockedToken = 'test-token';

const useAuth0ReturnValue: ReturnType<typeof useAuth0> = {
  isAuthenticated: false,
  isLoading: true,
  getIdTokenClaims: vi.fn(() => Promise.resolve({ __raw: mockedToken })),
  getAccessTokenSilently: vi.fn(() => Promise.resolve(mockedToken)) as never, // casting to never due to overloaded function
  getAccessTokenWithPopup: vi.fn(),
  loginWithRedirect: vi.fn(),
  loginWithPopup: vi.fn(),
  logout: vi.fn(),
  handleRedirectCallback: vi.fn(),
};

vi.mock('@auth0/auth0-react', async () => {
  const actual = await vi.importActual<typeof import('@auth0/auth0-react')>(
    '@auth0/auth0-react'
  );

  return {
    ...actual,
    useAuth0: vi.fn(),
    Auth0Provider: ({ children }: AuthGuardProps) => children,
  };
});

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
  useDispatch: () => vi.fn(),
}));

vi.mock('@*company-data-covered*/auth0/data-access', () => ({
  selectAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
}));

const useAuth0Spy = vi.spyOn(Auth0, 'useAuth0');
const useSelectorSpy = vi.spyOn(Redux, 'useSelector');

const renderAuthGuard = (overrideProps?: AuthGuardProps) => {
  return render(<AuthGuard {...{ ...mockedProps, ...overrideProps }} />);
};

describe('<AuthGuard />', () => {
  beforeEach(() => {
    useAuth0Spy.mockReturnValue(useAuth0ReturnValue);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render custom loading component during getting session', () => {
    renderAuthGuard();
    const loaderText = screen.getByText('Loading...');

    expect(loaderText).toBeTruthy();
  });

  it('should render default loading component during getting session', () => {
    renderAuthGuard({ ...mockedProps, loadingComponent: undefined });
    const defaultLoader = screen.getByTestId(testIds.AUTH_GUARD_LOADER);

    expect(defaultLoader).toBeTruthy();
  });

  it('should render children when authentication passed', () => {
    useAuth0Spy.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
      isAuthenticated: true,
    });
    useSelectorSpy.mockReturnValueOnce(mockedToken);
    renderAuthGuard({ ...mockedProps, loadingComponent: <MockedLoader /> });

    const appText = screen.getByText('My App');

    expect(appText).toBeTruthy();
  });

  it('should not render children when auth token not in a store', () => {
    useAuth0Spy.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
      isAuthenticated: true,
    });
    renderAuthGuard();
    useSelectorSpy.mockReturnValueOnce(undefined);
    const loaderText = screen.getByText('Loading...');

    expect(loaderText).toBeTruthy();
  });

  it('should call onAuthorized callback and set id token', async () => {
    useAuth0Spy.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
      isAuthenticated: true,
    });
    const onAuthorized = vi.fn();
    renderAuthGuard({ ...mockedProps, onAuthorized });

    await waitFor(() => {
      expect(onAuthorized).toHaveBeenCalledWith({ __raw: mockedToken });
    });
    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith({ authToken: mockedToken });
    });
  });

  it('should call onAuthorized callback and set access token', async () => {
    useAuth0Spy.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
      isAuthenticated: true,
    });
    const onAuthorized = vi.fn();
    renderAuthGuard({ ...mockedProps, onAuthorized, useAccessToken: true });

    await waitFor(() => {
      expect(onAuthorized).toHaveBeenCalledWith(mockedToken);
    });
    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith({ authToken: mockedToken });
    });
  });

  it('should call loginWithRedirect', async () => {
    useAuth0Spy.mockReturnValue({
      ...useAuth0ReturnValue,
      isLoading: false,
    });
    const redirectOptions: Auth0.RedirectLoginOptions<Auth0.AppState> = {
      openUrl: vi.fn(),
    };
    renderAuthGuard({ ...mockedProps, redirectOptions });

    await waitFor(() => {
      expect(useAuth0ReturnValue.loginWithRedirect).toHaveBeenCalledWith(
        redirectOptions
      );
    });
  });
});

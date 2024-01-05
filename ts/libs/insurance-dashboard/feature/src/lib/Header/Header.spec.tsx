import { useAuth0 } from '@auth0/auth0-react';
import { HEADER_TEST_IDS } from '@*company-data-covered*/insurance/ui';
import { render, screen } from '../../testUtils';
import Header from './Header';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';

const mockedNavigator = vi.fn();
const logoutMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useNavigate: () => mockedNavigator,
  };
});

vi.mock('@auth0/auth0-react');

const mockedUseAuth0 = vi.mocked(useAuth0);

const mockedUseAuth0DefaultReturn: ReturnType<typeof useAuth0> = {
  isAuthenticated: true,
  user: undefined,
  isLoading: false,
  loginWithRedirect: vi.fn(),
  getIdTokenClaims: vi.fn(),
  logout: vi.fn(),
  getAccessTokenWithPopup: vi.fn(),
  getAccessTokenSilently: vi.fn().mockReturnValue('mock-token'),
  loginWithPopup: vi.fn(),
  handleRedirectCallback: vi.fn(),
};

const userMock = {
  name: 'John Doe',
  email: 'johndoe@me.com',
  email_verified: true,
  sub: 'google-oauth2|12345678901234',
};

mockedUseAuth0.mockReturnValue({
  ...mockedUseAuth0DefaultReturn,
  isAuthenticated: true,
  user: userMock,
  logout: logoutMock,
  loginWithRedirect: vi.fn(),
});

describe('<Header />', () => {
  it('should render properly', () => {
    render(<Header />);

    expect(screen.getByText(userMock.name)).toBeVisible();
  });

  it('should navigate to home page after logout button click', async () => {
    const { user } = render(<Header />);
    const userNameButton = screen.getByTestId(HEADER_TEST_IDS.USER_NAME_BUTTON);
    expect(userNameButton).toBeEnabled();
    await user.click(userNameButton);
    const menu = screen.getByTestId(HEADER_TEST_IDS.HEADER_MENU);
    expect(menu).toBeVisible();
    const logoutMenuItem = screen.getByTestId(
      HEADER_TEST_IDS.SIGN_OUT_MENU_ITEM
    );
    expect(logoutMenuItem).toBeVisible();
    await user.click(logoutMenuItem);
    expect(logoutMock).toBeCalledTimes(1);
    expect(mockedNavigator).toBeCalledWith(INSURANCE_DASHBOARD_ROUTES.HOME);
  });
});

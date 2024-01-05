import { screen } from '@testing-library/react';
import AuthGuard from './AuthGuard';
import { useAuth0, type User as Auth0User } from '@auth0/auth0-react';
import { render } from '../util/testUtils';
import { mocked } from 'jest-mock';

jest.mock('@auth0/auth0-react');
const mockedUseAuth0 = mocked(useAuth0);

export const mockedUseAuth0DefaultReturn: ReturnType<typeof useAuth0> = {
  isAuthenticated: true,
  user: undefined,
  isLoading: false,
  loginWithRedirect: jest.fn(),
  getIdTokenClaims: jest.fn(),
  logout: jest.fn(),
  getAccessTokenWithPopup: jest.fn(),
  getAccessTokenSilently: jest.fn(),
  loginWithPopup: jest.fn(),
  handleRedirectCallback: jest.fn(),
};

export const user: Auth0User = {
  name: 'Joe Provider',
  email: 'joeprovidere@me.com',
  email_verified: true,
  sub: 'google-oauth2|12345678901234',
};

describe('AuthGuard', () => {
  describe('authenticated users', () => {
    beforeEach(() => {
      mockedUseAuth0.mockReturnValue({
        ...mockedUseAuth0DefaultReturn,
        isAuthenticated: true,
        user,
        isLoading: false,
        getAccessTokenSilently: jest.fn().mockResolvedValue('token'),
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render children when user is authenticated', async () => {
      render(
        <AuthGuard>
          <p>Protected Section</p>
        </AuthGuard>
      );
      const text = await screen.findByText('Protected Section');
      expect(text).toBeTruthy();
    });
  });

  describe('unauthenticated users', () => {
    const mockedRedirect = jest.fn();

    beforeEach(() => {
      mockedUseAuth0.mockReturnValue({
        ...mockedUseAuth0DefaultReturn,
        isAuthenticated: false,
        user: undefined,
        isLoading: false,
        loginWithRedirect: mockedRedirect,
        getIdTokenClaims: jest.fn().mockResolvedValue({ __raw: '' }),
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call Auth0 loginRedirect when user not authenticated', async () => {
      render(
        <AuthGuard>
          <p>Protected Section</p>
        </AuthGuard>
      );
      expect(mockedRedirect).toBeCalled();
    });
  });
});

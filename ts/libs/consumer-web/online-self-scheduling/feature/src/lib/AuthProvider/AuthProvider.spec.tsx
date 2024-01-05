import {
  AppState,
  Auth0Provider,
  type Auth0ProviderOptions,
} from '@auth0/auth0-react';
import AuthProvider from './AuthProvider';
import { mocked } from 'jest-mock';
import { render, waitFor, screen } from '../../testUtils';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: jest.fn(),
}));

const mockAuth0Provider = mocked(Auth0Provider).mockImplementation(
  ({ children, onRedirectCallback }: Auth0ProviderOptions) => {
    onRedirectCallback?.();

    return <>{children}</>;
  }
);

const mockChildrenTestId = 'children';

const MockChildren = <div data-testid={mockChildrenTestId}>test</div>;

const defaultProps: Auth0ProviderOptions = {
  domain: 'domain',
  clientId: 'client-id',
  children: MockChildren,
};

const setup = () => {
  return render(<AuthProvider {...defaultProps} />);
};

describe('AuthProvider', () => {
  it('should render children correctly', async () => {
    setup();

    const children = screen.getByTestId(mockChildrenTestId);
    expect(children).toBeVisible();
  });

  it('should call onRedirectCallback with fallback pathname', async () => {
    setup();

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(window.location.pathname);
    });
  });

  it('should call onRedirectCallback with provided return to path', async () => {
    const mockAppState: AppState = { returnTo: '/test' };
    mockAuth0Provider.mockImplementationOnce(
      ({ children, onRedirectCallback }: Auth0ProviderOptions) => {
        onRedirectCallback?.(mockAppState);

        return <>{children}</>;
      }
    );

    setup();

    await waitFor(() => {
      expect(mockNavigate).toBeCalledWith(mockAppState.returnTo);
    });
  });
});

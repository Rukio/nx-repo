import { Auth0Provider, type Auth0ProviderOptions } from '@auth0/auth0-react';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { environment } from '../../../environments/environment';
import AuthProvider from './AuthProvider';
import { mocked } from 'jest-mock';

jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: jest
    .fn()
    .mockImplementation(({ children }: { children: ReactNode }) => children),
}));

const mockAuth0Provider = mocked(Auth0Provider);

describe('AuthProvider', () => {
  beforeEach(() => {
    mockAuth0Provider.mockClear();
  });

  it('should render its children', () => {
    environment.auth0ClientId = 'client-id';
    render(
      <AuthProvider>
        <p>Test Auth0 Provider</p>
      </AuthProvider>
    );

    expect(screen.getByText('Test Auth0 Provider')).toBeTruthy();
  });

  it('should use local storage for cacheLocation in Cypress environment', () => {
    window.Cypress = 'defined';
    render(
      <AuthProvider>
        <p>Test Auth0 Provider</p>
      </AuthProvider>
    );

    expect(Auth0Provider).toHaveBeenCalledTimes(1);
    expect(Auth0Provider).toHaveBeenCalledWith(
      expect.objectContaining<Partial<Auth0ProviderOptions>>({
        cacheLocation: 'localstorage',
      }),
      {}
    );
  });

  it('should use memory for cacheLocation in non-Cypress environment', () => {
    delete window.Cypress;
    render(
      <AuthProvider>
        <p>Test Auth0 Provider</p>
      </AuthProvider>
    );

    expect(Auth0Provider).toHaveBeenCalledTimes(1);
    expect(Auth0Provider).toHaveBeenCalledWith(
      expect.objectContaining<Partial<Auth0ProviderOptions>>({
        cacheLocation: 'memory',
      }),
      expect.anything()
    );
  });
});

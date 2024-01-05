import { ReactNode } from 'react';
import { render } from '../testUtils';
import {
  initDatadogRum,
  initDatadogLogs,
} from '@*company-data-covered*/shared/datadog/util';
import App from './app';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getIdTokenClaims: jest.fn(() => Promise.resolve({ __raw: 'test-token' })),
  }),
  Auth0Provider: jest
    .fn()
    .mockImplementation(({ children }: { children: ReactNode }) => children),
}));

jest.mock('@*company-data-covered*/shared/datadog/util', () => ({
  initDatadogRum: jest.fn(),
  initDatadogLogs: jest.fn(),
}));

jest.mock('@*company-data-covered*/clinical-kpi/feature', () => {
  const mockedModule = jest.createMockFromModule(
    '@*company-data-covered*/clinical-kpi/feature'
  );
  const actualModule = jest.requireActual(
    '@*company-data-covered*/clinical-kpi/feature'
  );

  return {
    ...Object(mockedModule),
    StoreProvider: actualModule.StoreProvider,
  };
});

describe('App', () => {
  it('should initialize app successfully', () => {
    const { baseElement, rerender } = render(<App />);
    expect(baseElement).toBeTruthy();

    expect(initDatadogRum).toHaveBeenCalledTimes(1);
    expect(initDatadogLogs).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    rerender(<App />);

    expect(initDatadogRum).toHaveBeenCalledTimes(1);
    expect(initDatadogLogs).toHaveBeenCalledTimes(1);
  });
});

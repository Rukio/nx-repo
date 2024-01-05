import '@testing-library/jest-dom/extend-expect';
import { cleanup } from '@testing-library/react';
import * as utilsReact from '@*company-data-covered*/caremanager/utils-react';
import { mockedGates } from '@*company-data-covered*/caremanager/utils-mocks';
import { server } from './mockServer';

// TODO: fix alerts on tests
console.error = vi.fn();
console.warn = vi.fn();

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
// Clean up after the tests are finished.
afterAll(() => server.close());

vi.stubEnv('VITE_AUTH0_DOMAIN', 'domain');
vi.stubEnv('VITE_AUTH0_CLIENT_ID', 'client-id');
vi.stubEnv('VITE_AUTH0_AUDIENCE', 'audience');

vi.mock('statsig-react', () => ({
  StatsigProvider: ({ children }: React.PropsWithChildren) => children,
  useGate: (gateName: string) => ({
    isLoading: false,
    value: mockedGates.get(gateName) ?? false,
  }),
  useConfig: vi.fn(),
  useExperiment: vi.fn(),
  Statsig: {
    logEvent: vi.fn(),
    checkGate: (gateName: string) => mockedGates.get(gateName) ?? false,
    getConfig: () => ({
      get: (_name: string, fallback: unknown) => fallback,
      getValue: (_name: string, fallback: unknown) => fallback,
    }),
  },
}));

vi.spyOn(utilsReact, 'useAnalytics').mockImplementation(() => ({
  trackPageViewed: vi.fn(),
  trackEvent: vi.fn(),
  identifyUser: vi.fn(),
}));

import '@testing-library/jest-dom';
import 'jest-fetch-mock';
import { mswServer } from './server';

jest.mock('@segment/analytics-next', () => {
  const actual = jest.requireActual('@segment/analytics-next');

  return {
    ...actual,
    AnalyticsBrowser: jest.fn().mockImplementation(() => ({
      ...actual.AnalyticsBrowser,
      load: jest.fn().mockResolvedValue({}),
      pageView: jest.fn(),
      track: jest.fn(),
    })),
  };
});

beforeAll(() => {
  mswServer.listen();
});

afterEach(() => {
  mswServer.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  mswServer.close();
});

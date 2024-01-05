import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import ClientConfigHealthIndicator from '../client-config.health';

export type MockClientConfigHealthIndicator =
  MockProxy<ClientConfigHealthIndicator>;

export const mockClientConfigHealthIndicator =
  mockDeep<ClientConfigHealthIndicator>({
    indicatorName: 'client-config',
  });

beforeEach(() => {
  mockReset(mockClientConfigHealthIndicator);
});

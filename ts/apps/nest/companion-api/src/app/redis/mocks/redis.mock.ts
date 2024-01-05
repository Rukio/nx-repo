import Redis from 'ioredis';
import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockRedis);
});

export type MockRedis = MockProxy<Redis>;

export const mockRedis = mockDeep<Redis>();

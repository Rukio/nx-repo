import Redis from 'ioredis';
import { mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockRedis);
});

export const mockRedis = mockDeep<Redis>();

import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { RedisHealthIndicator, REDIS_HEALTH_CHECK_KEY } from '../redis.health';

beforeEach(() => {
  mockReset(mockRedisHealthIndicator);
});

export type MockRedisHealthIndicator = MockProxy<RedisHealthIndicator>;

export const mockRedisHealthIndicator = mockDeep<RedisHealthIndicator>({
  indicatorName: REDIS_HEALTH_CHECK_KEY,
});

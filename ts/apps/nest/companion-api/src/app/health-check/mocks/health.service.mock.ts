import { HealthIndicatorResult } from '@nestjs/terminus';
import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { HealthService } from '../health.service';

beforeEach(() => {
  mockReset(mockHealthService);
});

export type MockHealthService = MockProxy<HealthService>;

export const mockHealthService = mockDeep<HealthService>();

export const buildMockHealthIndicatorResult = (
  name: string,
  isHealthy: boolean
): HealthIndicatorResult => {
  const result: HealthIndicatorResult = {};

  result[name] = {
    status: isHealthy ? 'up' : 'down',
  };

  return result;
};

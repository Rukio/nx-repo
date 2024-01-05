import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { DashboardHealthIndicator } from '../dashboard.health';

beforeEach(() => {
  mockReset(mockDashboardHealthIndicator);
});

export type MockDashboardHealthIndicator = MockProxy<DashboardHealthIndicator>;

export const mockDashboardHealthIndicator = mockDeep<DashboardHealthIndicator>({
  indicatorName: 'dashboard',
});

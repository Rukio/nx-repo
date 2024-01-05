import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { DashboardService } from '../dashboard.service';

beforeEach(() => {
  mockReset(mockDashboardService);
});

export type MockDashboardService = MockProxy<DashboardService>;

export const mockDashboardService = mockDeep<DashboardService>({
  basePath: process.env.STATION_URL,
});

import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { DatabaseHealthIndicator } from '../database.health';

beforeEach(() => {
  mockReset(mockDatabaseHealthIndicator);
});

export type MockDatabaseHealthIndicator = MockProxy<DatabaseHealthIndicator>;

export const mockDatabaseHealthIndicator = mockDeep<DatabaseHealthIndicator>({
  indicatorName: 'database',
});

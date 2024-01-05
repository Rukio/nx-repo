import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { DatabaseService } from '../database.service';

beforeEach(() => {
  mockReset(mockDatabaseService);
});

export type MockDatabaseService = MockProxy<DatabaseService>;

export const mockDatabaseService = mockDeep<DatabaseService>();

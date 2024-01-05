import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { CompanionService } from '../companion.service';

beforeEach(() => {
  mockReset(mockCompanionService);
});

export type MockCompanionService = MockProxy<CompanionService>;

export const mockCompanionService = mockDeep<CompanionService>();

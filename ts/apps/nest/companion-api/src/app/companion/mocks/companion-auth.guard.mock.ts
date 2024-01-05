import { mockDeep, MockProxy } from 'jest-mock-extended';
import { CompanionAuthGuard } from '../companion-auth.guard';

export type MockCareRequestsGuard = MockProxy<CompanionAuthGuard>;

export const mockCompanionAuthGuard = mockDeep<CompanionAuthGuard>({
  canActivate: jest.fn().mockReturnValue(true),
});

import { mockClear, mockDeep } from 'jest-mock-extended';
import { AuthService, StoredToken } from '@*company-data-covered*/nest/auth';
import { buildMockStoredToken } from './stored-token.mock';

beforeEach(() => {
  mockClear(mockAuthService);
});

export const mockAuthService = mockDeep<AuthService>({
  getToken: jest.fn().mockImplementation((): Promise<StoredToken> => {
    return Promise.resolve(buildMockStoredToken());
  }),
});

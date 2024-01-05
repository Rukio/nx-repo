import { mockDeep } from 'jest-mock-extended';
import {
  AuthService,
  buildMockTokenResponse,
  StoredToken,
} from '@*company-data-covered*/nest/auth';

export const mockAuthService = mockDeep<AuthService>({
  getToken: jest.fn().mockImplementation((): Promise<StoredToken> => {
    return Promise.resolve(
      StoredToken.fromTokenResponse(buildMockTokenResponse({}))
    );
  }),
});

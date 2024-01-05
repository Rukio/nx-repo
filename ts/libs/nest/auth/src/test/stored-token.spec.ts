import {
  buildMockExpiredTokenResponse,
  buildMockTokenResponse,
} from '../mocks/token-response.mock';
import { StoredToken } from '../lib/stored-token';

describe(`${StoredToken.name}`, () => {
  describe(`${StoredToken.fromTokenResponse.name}`, () => {
    const mockTokenResponse = buildMockTokenResponse();

    test('should initialize correctly', () => {
      const result = StoredToken.fromTokenResponse(mockTokenResponse);

      expect(result.accessToken).toStrictEqual(mockTokenResponse.access_token);
      expect(result.refreshToken).toStrictEqual(
        mockTokenResponse.refresh_token
      );
      expect(result.tokenType).toStrictEqual(mockTokenResponse.token_type);
    });
  });

  describe(`expired getter`, () => {
    const notExpiredTokenResponse = buildMockTokenResponse();
    const expiredTokenResponse = buildMockExpiredTokenResponse();
    const withinOffsetTokenResponse = buildMockTokenResponse({
      expires_in: StoredToken.TOKEN_EXPIRATION_OFFSET_MS / 2 / 1000,
    });

    test('should return false if not expired', () => {
      const result = StoredToken.fromTokenResponse(notExpiredTokenResponse);

      expect(result.expired).toStrictEqual(false);
    });

    test('should return true if expired', () => {
      const result = StoredToken.fromTokenResponse(expiredTokenResponse);

      expect(result.expired).toStrictEqual(true);
    });

    test('should return true if not expired but within offset', () => {
      const result = StoredToken.fromTokenResponse(withinOffsetTokenResponse);

      expect(result.expired).toStrictEqual(true);
    });
  });

  describe(`authorizationValue getter`, () => {
    const tokenResponse = buildMockTokenResponse();

    test('should return false if not expired', () => {
      const result = StoredToken.fromTokenResponse(tokenResponse);

      expect(result.authorizationValue).toStrictEqual(
        `${result.tokenType} ${result.accessToken}`
      );
    });
  });
});

import { TokenResponse } from 'auth0';
import { StoredToken } from '../lib/stored-token';
import { buildMockTokenResponse } from './token-response.mock';

export function buildMockStoredToken(
  init: Partial<TokenResponse> = {}
): StoredToken {
  return StoredToken.fromTokenResponse(buildMockTokenResponse(init));
}

import { TokenResponse } from 'auth0';
import * as faker from 'faker';

export function buildMockTokenResponse(
  init: Partial<TokenResponse> = {}
): TokenResponse {
  return {
    access_token: faker.datatype.string(32),
    id_token: faker.datatype.string(32),
    token_type: 'Bearer',
    expires_in: 86400,
    ...init,
  };
}

export const buildMockExpiredTokenResponse = (
  init: Partial<Omit<TokenResponse, 'expires_in'>> = {}
) => buildMockTokenResponse({ expires_in: -1 * 60, ...init });

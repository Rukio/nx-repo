import * as faker from 'faker';
import { TokenResponse } from 'auth0';
import { StoredToken } from '@*company-data-covered*/nest/auth';

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

export function buildMockStoredToken(
  init: Partial<TokenResponse> = {}
): StoredToken {
  return StoredToken.fromTokenResponse(buildMockTokenResponse(init));
}

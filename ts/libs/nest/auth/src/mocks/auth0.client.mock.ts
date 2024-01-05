import {
  ClientCredentialsGrantOptions,
  RefreshTokenOptions,
  TokenResponse,
} from 'auth0';
import { mockClear, mockDeep, mockReset } from 'jest-mock-extended';
import { Auth0Client } from '../lib/auth0.client';

export const mockAuth0ClientV2 = mockDeep<Auth0Client>();

beforeEach(() => {
  mockReset(mockAuth0ClientV2);
  mockClear(clientCredentialsGrantMock);
  mockClear(refreshTokenMock);
});

/**
 * The correctly typed instance of `jest.fn()` for the Promise overload
 * of AuthenticationClient.clientCredentialsGrant.
 */
export const clientCredentialsGrantMock = jest.fn<
  Promise<TokenResponse>,
  [data: ClientCredentialsGrantOptions]
>();

export const refreshTokenMock = jest.fn<
  Promise<TokenResponse>,
  [data: RefreshTokenOptions]
>();

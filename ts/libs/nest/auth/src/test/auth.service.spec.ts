import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { mockReset } from 'jest-mock-extended';
import { MemoryTokenStore } from '../lib/memory-token-store';
import { Auth0Client } from '../lib/auth0.client';
import { AuthService } from '../lib/auth.service';
import { AuthModule } from '../lib/auth.module';
import { StoredToken } from '../lib/stored-token';
import {
  clientCredentialsGrantMock,
  mockAuth0ClientV2,
  refreshTokenMock,
} from '../mocks/auth0.client.mock';
import {
  buildMockExpiredTokenResponse,
  buildMockTokenResponse,
} from '../mocks/token-response.mock';
import { buildMockAuthenticationModuleOptions } from './utils';
import { buildMockStoredToken } from '../mocks/stored-token.mock';
import { mockMemoryTokenStore } from '../mocks/memory-token-store.mock';
import { mockCache } from '../mocks/cache.mock';

beforeEach(() => {
  mockReset(mockMemoryTokenStore);
  mockReset(mockCache);
});

describe(`${AuthService.name}`, () => {
  let app: INestApplication;
  let subject: AuthService;
  const mockOptions = buildMockAuthenticationModuleOptions();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.register(mockOptions)],
    })
      .overrideProvider(MemoryTokenStore)
      .useValue(mockMemoryTokenStore)
      .overrideProvider(Auth0Client)
      .useValue(mockAuth0ClientV2)
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCache)
      .compile();

    subject = moduleRef.get<AuthService>(AuthService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${AuthService.prototype.getToken.name}`, () => {
    describe('Token does not exist', () => {
      const mockTokenResponse = buildMockTokenResponse();

      beforeEach(() => {
        mockMemoryTokenStore.getToken.mockReturnValue(undefined);
        mockAuth0ClientV2.clientCredentialsGrant.mockImplementation(
          clientCredentialsGrantMock.mockResolvedValue(mockTokenResponse)
        );
      });

      test('should fetch and save new token', async () => {
        const result = await subject.getToken();

        expect(result).toBeInstanceOf(StoredToken);
        expect(mockMemoryTokenStore.getToken).toHaveBeenCalledTimes(1);
        expect(mockMemoryTokenStore.getToken).toHaveBeenCalledWith(
          mockOptions.tokenKey
        );
        expect(mockAuth0ClientV2.refreshToken).toHaveBeenCalledTimes(0);
        expect(mockAuth0ClientV2.clientCredentialsGrant).toHaveBeenCalledTimes(
          1
        );
        expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledTimes(1);
        expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledWith(
          mockOptions.tokenKey,
          expect.any(StoredToken)
        );
      });
    });

    describe('Token exists', () => {
      describe('Token is expired', () => {
        describe('Token does have a refresh token', () => {
          const mockToken = buildMockStoredToken(
            buildMockExpiredTokenResponse({ refresh_token: 'defined' })
          );
          const mockNewTokenResponse = buildMockTokenResponse();

          beforeEach(() => {
            mockMemoryTokenStore.getToken.mockReturnValue(mockToken);
            mockAuth0ClientV2.refreshToken.mockImplementation(
              refreshTokenMock.mockResolvedValue(mockNewTokenResponse)
            );
          });

          test('should refresh and save new token', async () => {
            const result = await subject.getToken();

            expect(result).toBeInstanceOf(StoredToken);
            expect(mockMemoryTokenStore.getToken).toHaveBeenCalledTimes(1);
            expect(mockMemoryTokenStore.getToken).toHaveBeenCalledWith(
              mockOptions.tokenKey
            );
            expect(mockAuth0ClientV2.refreshToken).toHaveBeenCalledTimes(1);
            expect(
              mockAuth0ClientV2.clientCredentialsGrant
            ).toHaveBeenCalledTimes(0);
            expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledTimes(1);
            expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledWith(
              mockOptions.tokenKey,
              expect.any(StoredToken)
            );
          });
        });

        describe('Token does not have a refresh token', () => {
          const mockToken = buildMockStoredToken(
            buildMockExpiredTokenResponse({ refresh_token: undefined })
          );
          const mockNewTokenResponse = buildMockTokenResponse();

          beforeEach(() => {
            mockMemoryTokenStore.getToken.mockReturnValue(mockToken);
            mockAuth0ClientV2.clientCredentialsGrant.mockImplementation(
              clientCredentialsGrantMock.mockResolvedValue(mockNewTokenResponse)
            );
          });

          test('should fetch and save new token', async () => {
            const result = await subject.getToken();

            expect(result).toBeInstanceOf(StoredToken);
            expect(mockMemoryTokenStore.getToken).toHaveBeenCalledTimes(1);
            expect(mockMemoryTokenStore.getToken).toHaveBeenCalledWith(
              mockOptions.tokenKey
            );
            expect(mockAuth0ClientV2.refreshToken).toHaveBeenCalledTimes(0);
            expect(
              mockAuth0ClientV2.clientCredentialsGrant
            ).toHaveBeenCalledTimes(1);
            expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledTimes(1);
            expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledWith(
              mockOptions.tokenKey,
              expect.any(StoredToken)
            );
          });
        });
      });
    });

    describe('Token is not expired', () => {
      const mockToken = buildMockStoredToken();

      beforeEach(() => {
        mockMemoryTokenStore.getToken.mockReturnValue(mockToken);
      });

      test('should return token without fetching or refreshing', async () => {
        const result = await subject.getToken();

        expect(result).toBeInstanceOf(StoredToken);
        expect(mockMemoryTokenStore.getToken).toHaveBeenCalledTimes(1);
        expect(mockMemoryTokenStore.getToken).toHaveBeenCalledWith(
          mockOptions.tokenKey
        );
        expect(mockAuth0ClientV2.refreshToken).toHaveBeenCalledTimes(0);
        expect(mockAuth0ClientV2.clientCredentialsGrant).toHaveBeenCalledTimes(
          0
        );
        expect(mockMemoryTokenStore.saveToken).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe(`${AuthService.prototype.getPolicyActor.name}`, () => {
    describe('Policy Actor claims exist', () => {
      const accessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Rlc3RpbmctYXV0aC5kaXNwYXRjaGhlYWx0aC5jb20vIiwic3ViIjoiMTIzNDU2Nzg5MCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNTAwMDAwMDAwLCJhdWQiOlsic29tZS1hdWRpZW5jZSJdLCJlbWFpbCI6InRlc3RAZW1haWwuY29tIiwic2NvcGUiOiJyZWFkOnBhdGllbnRzIiwiaHR0cHM6Ly9kaXNwYXRjaGhlYWx0aC5jb20vdHlwZSI6InVzZXIiLCJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS9wcm9wcyI6eyJpZCI6MTAwLCJlbWFpbCI6InRlc3QudXNlckBkaXNwYXRjaGhlYWx0aC5jb20iLCJpZGVudGl0eV9wcm92aWRlcl91c2VyX2lkIjoicXdlcnR5LWFzZGYifX0.cI9JYy64T0S0xLN5kCYbEOV8ks85QjDH86bAaeQcJQ4';
      const mockToken = buildMockStoredToken({ access_token: accessToken });
      const mockPolicyActor = {
        type: 'user',
        properties: {
          id: 100,
          email: 'test.user@*company-data-covered*.com',
          identity_provider_user_id: 'qwerty-asdf',
        },
      };

      beforeEach(() => {
        mockMemoryTokenStore.getToken.mockReturnValue(mockToken);
      });

      test('should return the policy actor from the token claims', async () => {
        const result = await subject.getPolicyActor();

        expect(result).toEqual(mockPolicyActor);
      });
    });
  });
});

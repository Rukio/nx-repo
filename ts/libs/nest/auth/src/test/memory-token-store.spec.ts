import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as faker from 'faker';
import { TokenResponse } from 'auth0';
import { MemoryTokenStore } from '../lib/memory-token-store';
import { StoredToken } from '../lib/stored-token';
import { buildMockTokenResponse } from '../mocks/token-response.mock';

function buildMockStoredToken(init: Partial<TokenResponse> = {}): StoredToken {
  return StoredToken.fromTokenResponse(buildMockTokenResponse(init));
}

describe(`${MemoryTokenStore.name}`, () => {
  let app: INestApplication;
  let subject: MemoryTokenStore;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MemoryTokenStore],
    }).compile();

    subject = moduleRef.get<MemoryTokenStore>(MemoryTokenStore);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${MemoryTokenStore.prototype.getToken.name}`, () => {
    describe('Token does not exist', () => {
      const mockKey = 'not-exist';

      test('should return token if token exists', () => {
        const result = subject.getToken(mockKey);

        expect(result).toBeUndefined();
      });
    });

    describe('Token exists', () => {
      const mockKey = 'exists';
      const mockToken = buildMockStoredToken();

      beforeEach(() => {
        subject.saveToken(mockKey, mockToken);
      });

      test('should return token if token exists', () => {
        const result = subject.getToken(mockKey);

        expect(result).toBeInstanceOf(StoredToken);
      });
    });
  });

  describe(`${MemoryTokenStore.prototype.saveToken.name}`, () => {
    const mockKey = 'exists';
    const mockToken = buildMockStoredToken();

    test('should save token and be able to return it', () => {
      subject.saveToken(mockKey, mockToken);
      const result = subject.getToken(mockKey);

      expect(result).toBeInstanceOf(StoredToken);
    });
  });
});

describe(`${MemoryTokenStore.name} static behavior`, () => {
  let app: INestApplication;
  let subject1: MemoryTokenStore;
  let subject2: MemoryTokenStore;
  const tokenStoreKey1 = 'token-store-1';
  const tokenStoreKey2 = 'token-store-2';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: tokenStoreKey1, useValue: new MemoryTokenStore() },
        { provide: tokenStoreKey2, useValue: new MemoryTokenStore() },
      ],
    }).compile();

    subject1 = moduleRef.get<MemoryTokenStore>(tokenStoreKey1);
    subject2 = moduleRef.get<MemoryTokenStore>(tokenStoreKey2);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('should share token source', () => {
    const mockKey1 = faker.datatype.uuid();
    const mockKey2 = faker.datatype.uuid();
    const mockToken1 = buildMockStoredToken();
    const mockToken2 = buildMockStoredToken();

    subject1.saveToken(mockKey1, mockToken1);
    subject2.saveToken(mockKey2, mockToken2);

    expect(subject1.getToken(mockKey1)).toStrictEqual(mockToken1);
    expect(subject1.getToken(mockKey2)).toStrictEqual(mockToken2);
    expect(subject2.getToken(mockKey1)).toStrictEqual(mockToken1);
    expect(subject2.getToken(mockKey2)).toStrictEqual(mockToken2);
  });
});

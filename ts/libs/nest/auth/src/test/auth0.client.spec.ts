import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthenticationClient } from 'auth0';
import { Auth0Client } from '../lib/auth0.client';
import { AuthModule } from '../lib/auth.module';
import { buildMockAuthenticationModuleOptions } from './utils';

describe(`${Auth0Client.name}`, () => {
  let app: INestApplication;
  let subject: Auth0Client;
  const mockOptions = buildMockAuthenticationModuleOptions();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.register(mockOptions)],
    }).compile();

    subject = moduleRef.get<Auth0Client>(Auth0Client);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test(`should initialize correctly`, async () => {
    expect(subject).toBeInstanceOf(AuthenticationClient);
  });
});

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  Auth0ConfigurationFactory,
  Auth0ConfigurationSettings,
} from '../lib/auth0.configuration.factory';
import { AuthModule } from '../lib/auth.module';
import {
  MissingEnvironmentVariableException,
  MissingConfigurationSettingException,
} from '../lib/config';

describe(`${Auth0ConfigurationFactory.name}`, () => {
  let app: INestApplication;

  const configKeys: Auth0ConfigurationSettings = {
    domainKey: 'TEST_M2M_AUTH0_DOMAIN',
    clientIdKey: 'TEST_M2M_CLIENT_ID',
    clientSecretKey: 'TEST_M2M_CLIENT_SECRET',
    audienceKey: 'M2M_STATION_AUDIENCE',
    issuerKey: 'AUTH0_ISSUER',
    tokenKey: 'STATION',
  };

  async function initializeApplication(configKeys: Auth0ConfigurationSettings) {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return new Auth0ConfigurationFactory(
              configService,
              configKeys
            ).createAuthOptions();
          },
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  beforeEach(() => {
    process.env['TEST_M2M_AUTH0_DOMAIN'] = 'auth0Domain-12345678';
    process.env['TEST_M2M_CLIENT_ID'] = 'clientId-12345678';
    process.env['TEST_M2M_CLIENT_SECRET'] = 'clientSecret-12345678';
    process.env['M2M_STATION_AUDIENCE'] = 'audience-12345678';
    process.env['AUTH0_ISSUER'] = 'https://testing-auth.*company-data-covered*.com';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('initializeApplication', () => {
    it('sets correctly', async () => {
      await expect(initializeApplication(configKeys)).resolves.toBeUndefined();
    });

    it('returns a MissingEnvironmentVariableException of TEST_M2M_AUTH0_DOMAIN', async () => {
      delete process.env['TEST_M2M_AUTH0_DOMAIN'];
      await expect(initializeApplication(configKeys)).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });

    it('returns a MissingEnvironmentVariableException of TEST_M2M_CLIENT_ID', async () => {
      delete process.env['TEST_M2M_CLIENT_ID'];
      await expect(initializeApplication(configKeys)).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });

    it('returns a MissingEnvironmentVariableException of TEST_M2M_CLIENT_SECRET', async () => {
      delete process.env['TEST_M2M_CLIENT_SECRET'];
      await expect(initializeApplication(configKeys)).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });

    it('returns a MissingEnvironmentVariableException of M2M_STATION_AUDIENCE', async () => {
      delete process.env['M2M_STATION_AUDIENCE'];
      await expect(initializeApplication(configKeys)).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });

    it('returns a MissingEnvironmentVariableException of AUTH0_ISSUER', async () => {
      delete process.env['AUTH0_ISSUER'];
      await expect(initializeApplication(configKeys)).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });

    it('returns a MissingConfigurationSettingException for empty tokenKey', async () => {
      await expect(
        initializeApplication({ ...configKeys, tokenKey: '' })
      ).rejects.toBeInstanceOf(MissingConfigurationSettingException);
    });
  });
});

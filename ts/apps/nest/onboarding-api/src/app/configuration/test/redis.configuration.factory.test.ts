import { RedisConfigurationFactory } from '../redis.configuration.factory';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@*company-data-covered*/nest/redis';
import MissingEnvironmentVariableException from '../../common/exceptions/missing-environment-variable.exception';

describe(`${RedisConfigurationFactory.name}`, () => {
  let app: INestApplication;

  async function initializeApplication() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        RedisModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useClass: RedisConfigurationFactory,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterAll(async () => {
    await app.close();
  });

  describe('ONBOARDING_REDIS_URL', () => {
    it('sets correctly', async () => {
      await expect(initializeApplication()).resolves.toBeUndefined();
    });

    it('returns a MissingEnvironmentVariableException exception', async () => {
      delete process.env.ONBOARDING_REDIS_URL;
      const result = initializeApplication();

      await expect(result).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });
  });
});

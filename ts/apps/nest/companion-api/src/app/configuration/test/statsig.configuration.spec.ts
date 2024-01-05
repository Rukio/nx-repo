import { StatsigConfigurationFactory } from '../statsig.configuration.factory';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { StatsigModule } from '@*company-data-covered*/nest-statsig';

describe(`${StatsigConfigurationFactory.name}`, () => {
  let app: INestApplication;

  async function initializeApplication() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        StatsigModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useClass: StatsigConfigurationFactory,
          isGlobal: true,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterAll(async () => {
    await app.close();
  });

  describe('STATSIG_SDK_SERVER_SECRET_KEY', () => {
    it('sets correctly', async () => {
      process.env.STATSIG_SDK_SERVER_SECRET_KEY = 'secret-12345678';
      await expect(initializeApplication()).resolves.toBeUndefined();
    });

    it('returns a MissingEnvironmentVariableException exception', async () => {
      delete process.env.STATSIG_SDK_SERVER_SECRET_KEY;
      const result = initializeApplication();

      await expect(result).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });
  });
});

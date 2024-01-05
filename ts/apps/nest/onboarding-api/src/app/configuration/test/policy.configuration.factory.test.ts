import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PolicyModule } from '@*company-data-covered*/nest/policy';
import { PolicyConfigurationFactory } from '../policy.configuration.factory';
import MissingEnvironmentVariableException from '../../common/exceptions/missing-environment-variable.exception';

describe(`${PolicyConfigurationFactory.name}`, () => {
  let app: INestApplication;

  async function initializeApplication() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PolicyModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useClass: PolicyConfigurationFactory,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterAll(async () => {
    await app.close();
  });

  describe('POLICY_SERVICE_BASE_URL', () => {
    it('sets correctly', async () => {
      await expect(initializeApplication()).resolves.toBeUndefined();
    });

    it('returns a MissingEnvironmentVariableException exception', async () => {
      delete process.env.POLICY_SERVICE_BASE_URL;
      const result = initializeApplication();

      await expect(result).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });
  });
});

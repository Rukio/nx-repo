import { SegmentConfigurationFactory } from '../segment.configuration.factory';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MissingEnvironmentVariableException } from '../../common/exceptions/missing-environment-variable.exception';
import { SegmentModule } from '@*company-data-covered*/nest-segment';

describe(`${SegmentConfigurationFactory.name}`, () => {
  let app: INestApplication;

  async function initializeApplication() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        SegmentModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useClass: SegmentConfigurationFactory,
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

  describe('SEGMENT_SDK_SOURCE_WRITE_KEY', () => {
    it('sets correctly', async () => {
      process.env.SEGMENT_SDK_SOURCE_WRITE_KEY =
        'Qw3rTyD1sPA7chH34l7He45yAs123abc';
      await expect(initializeApplication()).resolves.toBeUndefined();
    });

    it('returns a MissingEnvironmentVariableException exception', async () => {
      delete process.env.SEGMENT_SDK_SOURCE_WRITE_KEY;
      const result = initializeApplication();

      await expect(result).rejects.toBeInstanceOf(
        MissingEnvironmentVariableException
      );
    });
  });
});

import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthIndicatorStatus, HttpHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { buildMockHealthIndicatorResult } from '../../health-check/mocks/health-check.service.mock';
import ClientConfigHealthIndicator from '../client-config.health';
import ClientConfigModule from '../client-config.module';
import ClientConfigService from '../client-config.service';
import { CacheConfigService } from '../../common/cache.config.service';

export type MockClientConfigService = MockProxy<ClientConfigService>;

export const mockClientConfigService = mockDeep<ClientConfigService>({
  basePath: process.env.STATION_URL,
});

beforeEach(() => {
  mockReset(mockClientConfigService);
});

const mockHttpHealthIndicator = mockDeep<HttpHealthIndicator>();

beforeEach(() => {
  mockReset(mockHttpHealthIndicator);
});

describe(`${ClientConfigHealthIndicator.name}`, () => {
  let app: INestApplication;
  let healthIndicator: ClientConfigHealthIndicator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ClientConfigService],
      imports: [
        ClientConfigModule,
        HttpModule,
        ConfigModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(ClientConfigService)
      .useValue(mockClientConfigService)
      .overrideProvider(HttpHealthIndicator)
      .useValue(mockHttpHealthIndicator)
      .compile();

    healthIndicator = moduleRef.get<ClientConfigHealthIndicator>(
      ClientConfigHealthIndicator
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`Service is Healthy`, () => {
    beforeEach(() => {
      mockClientConfigService.isHealthy.mockResolvedValue(true);
    });

    test(`Calls ${HttpHealthIndicator.prototype.pingCheck.name}`, async () => {
      jest
        .spyOn(mockHttpHealthIndicator, 'pingCheck')
        .mockImplementation(jest.fn());

      await healthIndicator.isHealthy();

      expect(mockHttpHealthIndicator.pingCheck).toHaveBeenCalledTimes(0);
    });

    test(`Returns healthy result`, async () => {
      const result = await healthIndicator.isHealthy();
      for (let dependency; dependency < result.length; dependency += 1) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'up'
        );
      }
    });
  });

  describe(`Service is Unhealthy`, () => {
    beforeEach(() => {
      mockClientConfigService.isHealthy.mockResolvedValue(false);
    });

    test(`Does not call ${HttpHealthIndicator.prototype.pingCheck.name}`, async () => {
      jest
        .spyOn(mockHttpHealthIndicator, 'pingCheck')
        .mockImplementation(jest.fn());

      await healthIndicator.isHealthy();

      expect(mockHttpHealthIndicator.pingCheck).toHaveBeenCalledTimes(0);
    });

    test(`Returns unhealthy result`, async () => {
      const result = await healthIndicator.isHealthy();

      for (let dependency; dependency < result.length; dependency += 1) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'down'
        );
      }
    });
  });

  describe(`Service health is unknown`, () => {
    beforeEach(() => {
      mockClientConfigService.isHealthy.mockResolvedValue(undefined);
    });

    test(`Calls ${HttpHealthIndicator.prototype.pingCheck.name}`, async () => {
      jest
        .spyOn(mockHttpHealthIndicator, 'pingCheck')
        .mockResolvedValue(
          Promise.resolve(
            buildMockHealthIndicatorResult(healthIndicator.indicatorName, true)
          )
        );

      await healthIndicator.isHealthy();

      expect(mockHttpHealthIndicator.pingCheck).toHaveBeenCalledTimes(1);
    });

    describe(`Test is Positive`, () => {
      test(`Returns healthy result`, async () => {
        jest
          .spyOn(mockHttpHealthIndicator, 'pingCheck')
          .mockResolvedValueOnce(
            buildMockHealthIndicatorResult(healthIndicator.indicatorName, true)
          );

        const result = await healthIndicator.isHealthy();

        for (let dependency; dependency < result.length; dependency += 1) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('up');
        }
      });
    });

    describe(`Test is Negative`, () => {
      test(`Returns unhealthy result`, async () => {
        jest
          .spyOn(mockHttpHealthIndicator, 'pingCheck')
          .mockResolvedValueOnce(
            buildMockHealthIndicatorResult(healthIndicator.indicatorName, false)
          );

        const result = await healthIndicator.isHealthy();

        for (let dependency; dependency < result.length; dependency += 1) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('down');
        }
      });
    });

    describe(`Test throws error`, () => {
      test(`Returns unhealthy result`, async () => {
        jest
          .spyOn(mockHttpHealthIndicator, 'pingCheck')
          .mockRejectedValue(new Error());

        const result = await healthIndicator.isHealthy();

        for (let dependency; dependency < result.length; dependency += 1) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('down');
        }
      });
    });
  });
});

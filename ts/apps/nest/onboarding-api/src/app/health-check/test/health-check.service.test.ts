import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthCheckError, HttpHealthIndicator } from '@nestjs/terminus';
import { HealthCheckStatus } from '@nestjs/terminus/dist/health-check';
import { Test } from '@nestjs/testing';
import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import HealthCheckModule from '../health-check.module';
import HealthService from '../health-check.service';
import BaseHealthIndicator from '../indicators/base.health';
import { buildMockHealthIndicatorResult } from '../mocks/health-check.service.mock';
import ClientConfigHealthIndicator from '../../client-config/client-config.health';
import { mockClientConfigHealthIndicator } from '../../client-config/mocks/client-config.health.mock';
import { CacheConfigService } from '../../common/cache.config.service';

const mockHttpHealthIndicator = mockDeep<HttpHealthIndicator>();

beforeEach(() => {
  mockReset(mockHttpHealthIndicator);
});

describe(`${HealthService.name}`, () => {
  let app: INestApplication;
  let service: HealthService;
  const mockHealthIndicators: MockProxy<BaseHealthIndicator>[] = [
    mockClientConfigHealthIndicator,
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        HealthCheckModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(ClientConfigHealthIndicator)
      .useValue(mockClientConfigHealthIndicator)
      .compile();

    service = moduleRef.get<HealthService>(HealthService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${HealthService.prototype.check.name}`, () => {
    describe('Indicators return healthy', () => {
      beforeEach(() => {
        // eslint-disable-next-line no-restricted-syntax
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Calls ${HealthService.name}`, async () => {
        const result = await service.check();

        expect(result?.status).toStrictEqual<HealthCheckStatus>('ok');
      });
    });

    describe('Indicators return unhealthy', () => {
      beforeEach(() => {
        for (
          let indicator;
          indicator < mockHealthIndicators.length;
          indicator += 1
        ) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, false)
          );
        }
      });

      test(`Throws ${HealthCheckError.name}`, async () => {
        const result = service.check();

        await expect(result).rejects.toBeInstanceOf(
          ServiceUnavailableException
        );
      });
    });

    describe('Indicators throw error', () => {
      beforeEach(() => {
        for (
          let indicator;
          indicator < mockHealthIndicators.length;
          indicator += 1
        ) {
          indicator.isHealthy.mockRejectedValue(
            new HealthCheckError('Error', null)
          );
        }
      });

      test(`Throws ${HealthCheckError.name}`, async () => {
        const result = service.check();

        await expect(result).rejects.toBeInstanceOf(
          ServiceUnavailableException
        );
      });
    });
  });
});

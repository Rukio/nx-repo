import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckError, HttpHealthIndicator } from '@nestjs/terminus';
import { HealthCheckStatus } from '@nestjs/terminus/dist/health-check';
import { Test } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { CommonModule } from '../../common/common.module';
import { DashboardHealthIndicator } from '../../dashboard/dashboard.health';
import { mockDashboardHealthIndicator } from '../../dashboard/mocks/dashboard.health.mock';
import { DatabaseHealthIndicator } from '../../database/database.health';
import { mockDatabaseHealthIndicator } from '../../database/mocks/database.health.mock';
import { mockRedisHealthIndicator } from '../../redis/mocks/redis.health.mock';
import { RedisHealthIndicator } from '../../redis/redis.health';
import { HealthCheckModule } from '../health-check.module';
import { HealthService } from '../health.service';
import { buildMockHealthIndicatorResult } from '../mocks/health.service.mock';

const mockHttpHealthIndicator = mockDeep<HttpHealthIndicator>();

beforeEach(() => {
  mockReset(mockHttpHealthIndicator);
});

describe(`${HealthService.name}`, () => {
  let app: INestApplication;
  let service: HealthService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthCheckModule, CommonModule],
    })
      .overrideProvider(DatabaseHealthIndicator)
      .useValue(mockDatabaseHealthIndicator)
      .overrideProvider(DashboardHealthIndicator)
      .useValue(mockDashboardHealthIndicator)
      .overrideProvider(HttpHealthIndicator)
      .useValue(mockHttpHealthIndicator)
      .overrideProvider(RedisHealthIndicator)
      .useValue(mockRedisHealthIndicator)
      .compile();

    service = moduleRef.get<HealthService>(HealthService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each([
    {
      description: 'check',
      func: () => service.check(),
      mockHealthIndicators: [
        mockDatabaseHealthIndicator,
        mockDashboardHealthIndicator,
        mockRedisHealthIndicator,
      ],
    },
    {
      description: 'readiness',
      func: () => service.readiness(),
      mockHealthIndicators: [
        mockDatabaseHealthIndicator,
        mockDashboardHealthIndicator,
        mockRedisHealthIndicator,
      ],
    },
    {
      description: 'liveness',
      func: () => service.liveness(),
      mockHealthIndicators: [
        mockDatabaseHealthIndicator,
        mockRedisHealthIndicator,
      ],
    },
  ])(`$description`, ({ func, mockHealthIndicators }) => {
    describe('Indicators return healthy', () => {
      beforeEach(() => {
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Calls ${HealthService.name}`, async () => {
        const result = await func();

        expect(result?.status).toStrictEqual<HealthCheckStatus>('ok');
      });
    });

    describe('Indicators return unhealthy', () => {
      beforeEach(() => {
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, false)
          );
        }
      });

      test(`Throws ${HealthCheckError.name}`, async () => {
        const result = func();

        await expect(result).rejects.toBeInstanceOf(
          ServiceUnavailableException
        );
      });
    });

    describe('Indicators throw error', () => {
      beforeEach(() => {
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockRejectedValue(
            new HealthCheckError('Error', null)
          );
        }
      });

      test(`Throws ${HealthCheckError.name}`, async () => {
        const result = func();

        await expect(result).rejects.toBeInstanceOf(
          ServiceUnavailableException
        );
      });
    });
  });
});

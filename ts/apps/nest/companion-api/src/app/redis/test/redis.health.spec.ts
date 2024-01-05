import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HealthIndicatorStatus } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { RedisHealthIndicator, REDIS_HEALTH_CHECK_KEY } from '../redis.health';
import { RedisHealthModule } from '../redis.module';
import { mockCache } from '../../common/mocks/cache.mock';
import { IOREDIS_CLIENT_TOKEN } from '../common';
import { mockRedis } from '../mocks/redis.mock';

describe(`${RedisHealthIndicator.name}`, () => {
  let app: INestApplication;
  let healthIndicator: RedisHealthIndicator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RedisHealthModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCache)
      .overrideProvider(IOREDIS_CLIENT_TOKEN)
      .useValue(mockRedis)
      .compile();

    healthIndicator = moduleRef.get<RedisHealthIndicator>(RedisHealthIndicator);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`Service is Healthy`, () => {
    beforeEach(() => {
      mockCache.get.calledWith(REDIS_HEALTH_CHECK_KEY).mockResolvedValue(true);
    });

    test(`should return unhealthy result`, async () => {
      const result = await healthIndicator.isHealthy();

      for (const dependency in result) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'up'
        );
      }
    });
  });

  describe(`Service is Unhealthy`, () => {
    beforeEach(() => {
      mockCache.get.calledWith(REDIS_HEALTH_CHECK_KEY).mockResolvedValue(false);
    });

    test(`should return unhealthy result`, async () => {
      const result = await healthIndicator.isHealthy();

      for (const dependency in result) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'down'
        );
      }
    });
  });

  describe(`Service health is unknown`, () => {
    beforeEach(() => {
      mockCache.get
        .calledWith(REDIS_HEALTH_CHECK_KEY)
        .mockResolvedValue(undefined);
    });

    describe(`Test is Positive`, () => {
      beforeEach(() => {
        mockRedis.ping.mockResolvedValue('PONG');
      });

      test(`should return healthy result`, async () => {
        const result = await healthIndicator.isHealthy();

        for (const dependency in result) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('up');
        }
      });
    });

    describe(`Test is Negative`, () => {
      beforeEach(() => {
        mockRedis.ping.mockRejectedValue(new Error('Test'));
      });

      test(`should return unhealthy result`, async () => {
        const result = await healthIndicator.isHealthy();

        for (const dependency in result) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('down');
        }
      });
    });
  });
});

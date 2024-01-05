import request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthCheckController } from '../health-check.controller';
import { HealthCheckModule } from '../health-check.module';
import { HealthCheckError } from '@nestjs/terminus';
import { DashboardHealthIndicator } from '../../dashboard/dashboard.health';
import { mockDashboardHealthIndicator } from '../../dashboard/mocks/dashboard.health.mock';
import { buildMockHealthIndicatorResult } from '../mocks/health.service.mock';
import { mockDatabaseHealthIndicator } from '../../database/mocks/database.health.mock';
import { DatabaseHealthIndicator } from '../../database/database.health';
import { RedisHealthIndicator } from '../../redis/redis.health';
import { mockRedisHealthIndicator } from '../../redis/mocks/redis.health.mock';
import { CommonModule } from '../../common/common.module';
import { HealthCheckResponseDto } from '../dto/health-check-response.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe(`${HealthCheckController.name} API Tests`, () => {
  let app: INestApplication;

  const checkResponse = (
    status: HttpStatus,
    build: string,
    gitSHA = 'any string'
  ) => {
    return request(app.getHttpServer())
      .get(build)
      .expect(status)
      .expect((res) => {
        expect(res.body).toStrictEqual({
          GIT_SHA: gitSHA,
          healthCheckResult: expect.any(Object),
        });
      });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthCheckModule, CommonModule],
    })
      .overrideProvider(DatabaseHealthIndicator)
      .useValue(mockDatabaseHealthIndicator)
      .overrideProvider(DashboardHealthIndicator)
      .useValue(mockDashboardHealthIndicator)
      .overrideProvider(RedisHealthIndicator)
      .useValue(mockRedisHealthIndicator)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`check`, () => {
    const path = `/health-check`;
    const mockHealthIndicators = [
      mockDatabaseHealthIndicator,
      mockDashboardHealthIndicator,
      mockRedisHealthIndicator,
    ];

    describe('Indicators return healthy', () => {
      const mockSitSha1 = 'git_sha_1';

      beforeEach(() => {
        process.env.GIT_SHA = mockSitSha1;
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Returns ${HttpStatus.OK}`, () => {
        return checkResponse(HttpStatus.OK, path, mockSitSha1);
      });

      test(`Returns unknown if GIT_SHA is not set`, () => {
        delete process.env.GIT_SHA;

        return checkResponse(HttpStatus.OK, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
      });
    });
  });

  describe(`readiness`, () => {
    const path = `/readiness`;
    const mockHealthIndicators = [
      mockDatabaseHealthIndicator,
      mockDashboardHealthIndicator,
      mockRedisHealthIndicator,
    ];

    describe('Indicators return healthy', () => {
      const mockSitSha1 = 'git_sha_1';

      beforeEach(() => {
        process.env.GIT_SHA = mockSitSha1;
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Returns ${HttpStatus.OK}`, () => {
        return checkResponse(HttpStatus.OK, path, mockSitSha1);
      });

      test(`Returns unknown if GIT_SHA is not set`, () => {
        delete process.env.GIT_SHA;

        return checkResponse(HttpStatus.OK, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
      });
    });
  });

  describe(`liveness`, () => {
    const path = `/liveness`;
    const mockHealthIndicators = [
      mockDatabaseHealthIndicator,
      mockRedisHealthIndicator,
    ];

    describe('Indicators return healthy', () => {
      const mockSitSha1 = 'git_sha_1';

      beforeEach(() => {
        process.env.GIT_SHA = mockSitSha1;
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Returns ${HttpStatus.OK}`, () => {
        return checkResponse(HttpStatus.OK, path, mockSitSha1);
      });

      test(`Returns unknown if GIT_SHA is not set`, () => {
        delete process.env.GIT_SHA;

        return checkResponse(HttpStatus.OK, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
      });
    });
  });

  describe(`aptible health check`, () => {
    const path = `/healthcheck`;
    const mockHealthIndicators = [
      mockDatabaseHealthIndicator,
      mockRedisHealthIndicator,
    ];

    describe('Indicators return healthy', () => {
      const mockSitSha1 = 'git_sha_1';

      beforeEach(() => {
        process.env.GIT_SHA = mockSitSha1;
        for (const indicator of mockHealthIndicators) {
          indicator.isHealthy.mockResolvedValue(
            buildMockHealthIndicatorResult(indicator.indicatorName, true)
          );
        }
      });

      test(`Returns ${HttpStatus.OK}`, () => {
        return checkResponse(HttpStatus.OK, path, mockSitSha1);
      });

      test(`Returns unknown if GIT_SHA is not set`, () => {
        delete process.env.GIT_SHA;

        return checkResponse(HttpStatus.OK, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
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

      test(`Returns ${HttpStatus.SERVICE_UNAVAILABLE}`, () => {
        return checkResponse(HttpStatus.SERVICE_UNAVAILABLE, path, 'unknown');
      });
    });
  });
});

describe(`${HealthCheckResponseDto.name}`, () => {
  describe('validations', () => {
    test('it passes with valid properties', async () => {
      const body = {
        GIT_SHA: 'df08eb357dd7f432c3dcbe0ef4b3212a38b4aeff',
        healthCheckResult: {},
      };
      const dto = plainToInstance(HealthCheckResponseDto, body);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    test('it fails with invalid properties', async () => {
      const body = {
        healthCheckResult: undefined,
      };
      const dto = plainToInstance(HealthCheckResponseDto, body);
      const errors = await validate(dto);

      expect(errors.length).not.toBe(0);
      expect(JSON.stringify(errors)).toContain('GIT_SHA must be a string');
    });
  });
});

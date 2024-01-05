import { INestApplication } from '@nestjs/common';
import { HealthIndicatorStatus, HttpHealthIndicator } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { CommonModule } from '../../common/common.module';
import { buildMockHealthIndicatorResult } from '../../health-check/mocks/health.service.mock';
import { DashboardHealthIndicator } from '../dashboard.health';
import { DashboardModule } from '../dashboard.module';
import { DashboardService } from '../dashboard.service';
import { mockDashboardService } from '../mocks/dashboard.service.mock';

const mockHttpHealthIndicator = mockDeep<HttpHealthIndicator>();

beforeEach(() => {
  mockReset(mockHttpHealthIndicator);
});

describe(`${DashboardHealthIndicator.name}`, () => {
  let app: INestApplication;
  let healthIndicator: DashboardHealthIndicator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DashboardModule, CommonModule],
    })
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(HttpHealthIndicator)
      .useValue(mockHttpHealthIndicator)
      .compile();

    healthIndicator = moduleRef.get<DashboardHealthIndicator>(
      DashboardHealthIndicator
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`Service is Healthy`, () => {
    beforeEach(() => {
      mockDashboardService.isHealthy.mockResolvedValue(true);
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

      for (const dependency in result) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'up'
        );
      }
    });
  });

  describe(`Service is Unhealthy`, () => {
    beforeEach(() => {
      mockDashboardService.isHealthy.mockResolvedValue(false);
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

      for (const dependency in result) {
        expect(result[dependency].status).toStrictEqual<HealthIndicatorStatus>(
          'down'
        );
      }
    });
  });

  describe(`Service health is unknown`, () => {
    beforeEach(() => {
      mockDashboardService.isHealthy.mockResolvedValue(undefined);
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

        for (const dependency in result) {
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

        for (const dependency in result) {
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

        for (const dependency in result) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('down');
        }
      });
    });
  });
});

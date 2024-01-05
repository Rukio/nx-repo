import { INestApplication } from '@nestjs/common';
import { HealthIndicatorStatus } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { CommonModule } from '../../common/common.module';
import { DatabaseHealthIndicator } from '../database.health';
import { DatabaseModule } from '../database.module';
import { DatabaseService } from '../database.service';
import { mockDatabaseService } from '../mocks/database.service.mock';

describe(`${DatabaseHealthIndicator.name}`, () => {
  let app: INestApplication;
  let healthIndicator: DatabaseHealthIndicator;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .compile();

    healthIndicator = moduleRef.get<DatabaseHealthIndicator>(
      DatabaseHealthIndicator
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`Service is Healthy`, () => {
    beforeEach(() => {
      mockDatabaseService.isHealthy.mockResolvedValue(true);
    });

    test(`Does not call ${DatabaseService.prototype.$executeRaw.name}`, async () => {
      await healthIndicator.isHealthy();

      expect(mockDatabaseService.$executeRaw).toHaveBeenCalledTimes(0);
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
      mockDatabaseService.isHealthy.mockResolvedValue(false);
    });

    test(`Calls ${DatabaseService.prototype.$executeRaw.name}`, async () => {
      await healthIndicator.isHealthy();

      expect(mockDatabaseService.$executeRaw).toHaveBeenCalledTimes(0);
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
      mockDatabaseService.isHealthy.mockResolvedValue(undefined);
    });

    test(`Calls ${DatabaseService.prototype.$executeRaw.name}`, async () => {
      await healthIndicator.isHealthy();

      expect(mockDatabaseService.$executeRaw).toHaveBeenCalledTimes(1);
    });

    describe(`Test is Positive`, () => {
      beforeEach(() => {
        mockDatabaseService.$executeRaw.mockResolvedValue(1);
      });

      test(`Returns healthy result`, async () => {
        const result = await healthIndicator.isHealthy();

        for (const dependency in result) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('up');
        }
      });
    });

    describe(`Test is Negative`, () => {
      test(`Prisma Error - Returns unhealthy result`, async () => {
        const message = 'Error Communicating with database.';
        const code = 'P1001';

        mockDatabaseService.$executeRaw.mockRejectedValue(
          new PrismaClientKnownRequestError(message, code, '1')
        );

        const result = await healthIndicator.isHealthy();

        for (const dependency in result) {
          expect(
            result[dependency].status
          ).toStrictEqual<HealthIndicatorStatus>('down');
        }
      });

      test(`Prisma Error - Adds Prisma metadata`, async () => {
        const message = 'Error Communicating with database.';
        const prismaCode = 'P1001';

        mockDatabaseService.$executeRaw.mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError(message, prismaCode, '1')
        );
        jest.spyOn(healthIndicator, 'getUnhealthyResult');

        await healthIndicator.isHealthy();

        expect(healthIndicator.getUnhealthyResult).toHaveBeenCalledWith({
          prismaCode,
          message,
        });
      });

      test(`Non-Prisma Error - Metadata is Empty`, async () => {
        const message = 'Error Communicating with database.';

        mockDatabaseService.$executeRaw.mockRejectedValue(
          new Prisma.PrismaClientUnknownRequestError(message, '1')
        );
        jest.spyOn(healthIndicator, 'getUnhealthyResult');

        await healthIndicator.isHealthy();

        expect(healthIndicator.getUnhealthyResult).toHaveBeenCalledWith({});
      });
    });
  });
});

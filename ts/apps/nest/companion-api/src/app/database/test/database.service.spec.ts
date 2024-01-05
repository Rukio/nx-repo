import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { INestApplication } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { CommonModule } from '../../common/common.module';
import { mockCache } from '../../common/mocks/cache.mock';
import { mockDatadogService } from '../../common/mocks/datadog.service.mock';
import { DatabaseModule } from '../database.module';
import { DatabaseService } from '../database.service';

describe(`${DatabaseService.name}`, () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, CommonModule],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCache)
      .overrideProvider(DatadogService)
      .useValue(mockDatadogService)
      .compile();

    databaseService = moduleRef.get<DatabaseService>(DatabaseService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${DatabaseService.prototype.onModuleInit.name}`, () => {
    describe(`NODE_ENV equals test`, () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'test';
      });

      test(`Does not call ${DatabaseService.prototype.$connect.name}`, async () => {
        jest.spyOn(databaseService, '$connect');

        await databaseService.onModuleInit();

        expect(databaseService.$connect).toHaveBeenCalledTimes(0);
      });
    });

    describe(`NODE_ENV does not equal test`, () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      test(`Calls ${DatabaseService.prototype.$connect.name}`, async () => {
        jest.spyOn(databaseService, '$connect').mockImplementation(jest.fn());

        await databaseService.onModuleInit();

        expect(databaseService.$connect).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe(`${DatabaseService.prototype.onModuleDestroy.name}`, () => {
    test(`Calls ${DatabaseService.prototype.$disconnect.name}`, async () => {
      jest.spyOn(databaseService, '$disconnect').mockImplementation(jest.fn());

      await databaseService.onModuleDestroy();

      expect(databaseService.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${DatabaseService.prototype.markAsHealthy.name}`, () => {
    test(`Sets healthCacheKey to true`, async () => {
      await databaseService.markAsHealthy();

      expect(mockCache.set).toHaveBeenCalledWith(
        databaseService.healthCheckKey,
        true,
        {
          ttl: 0,
        }
      );
    });
  });

  describe(`${DatabaseService.prototype.markAsUnhealthy.name}`, () => {
    test(`Sets healthCacheKey to false`, async () => {
      await databaseService.markAsUnhealthy();

      expect(mockCache.set).toHaveBeenCalledWith(
        databaseService.healthCheckKey,
        false,
        {
          ttl: 0,
        }
      );
    });
  });

  describe(`${DatabaseService.prototype.isHealthy.name}`, () => {
    test(`Gets healthCacheKey from cache`, async () => {
      await databaseService.isHealthy();

      expect(mockCache.get).toHaveBeenCalledWith(
        databaseService.healthCheckKey
      );
    });
  });

  describe(`Metrics Middleware`, () => {
    const mockParamsWithModel: Prisma.MiddlewareParams = {
      model: 'CompanionLink',
      action: 'count',
      args: [],
      dataPath: [],
      runInTransaction: false,
    };

    // eslint-disable-next-line jest/expect-expect
    test(`logs metrics without model`, async () => {
      const mockParamsWithoutModel: Prisma.MiddlewareParams = {
        ...mockParamsWithModel,
        model: undefined,
      };

      const mockNext = jest.fn();

      await databaseService.metricsMiddleware(mockParamsWithoutModel, mockNext);

      expect(mockDatadogService.histogram).toHaveBeenCalledTimes(1);
    });

    // eslint-disable-next-line jest/expect-expect
    test(`logs metrics with model`, async () => {
      const mockNext = jest.fn();

      await databaseService.metricsMiddleware(mockParamsWithModel, mockNext);

      expect(mockDatadogService.histogram).toHaveBeenCalledTimes(1);
    });
  });
});

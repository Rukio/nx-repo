import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthCheckError, HealthCheckResult } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import HealthCheckController from '../health-check.controller';
import HealthCheckModule from '../health-check.module';
import HealthService from '../health-check.service';
import { mockHealthService } from '../mocks/health-check.service.mock';
import { CacheConfigService } from '../../common/cache.config.service';

describe(`${HealthCheckController.name}`, () => {
  let app: INestApplication;
  let controller: HealthCheckController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        HealthCheckModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(HealthService)
      .useValue(mockHealthService)
      .compile();

    controller = moduleRef.get<HealthCheckController>(HealthCheckController);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockHealthyCheckResult: HealthCheckResult = {
    status: 'ok',
    details: {},
    error: {},
    info: {},
  };

  const mockUnhealthyCheckResult: HealthCheckResult = {
    status: 'error',
    details: {},
    error: {},
    info: {},
  };

  describe(`${HealthCheckController.prototype.check.name}`, () => {
    test(`Calls ${HealthService.name}`, async () => {
      mockHealthService.check.mockResolvedValue(mockHealthyCheckResult);

      await controller.check();

      expect(mockHealthService.check).toHaveBeenCalledTimes(1);
    });

    test(`Returns ok if healthy`, async () => {
      mockHealthService.check.mockResolvedValue(mockHealthyCheckResult);

      const result = await controller.check();

      expect(result).toEqual(mockHealthyCheckResult);
    });

    test(`Throws if unhealthy`, async () => {
      mockHealthService.check.mockResolvedValue(mockUnhealthyCheckResult);

      const result = controller.check();

      await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    test(`Throws if ${HealthService.name}.${HealthService.prototype.check.name} throws`, async () => {
      mockHealthService.check.mockRejectedValue(
        new HealthCheckError('Error', null)
      );

      const result = controller.check();

      await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});

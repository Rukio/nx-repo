import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { HealthCheckError, HealthCheckResult } from '@nestjs/terminus';
import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { HealthCheckController } from '../health-check.controller';
import { HealthCheckModule } from '../health-check.module';
import { HealthService } from '../health.service';
import { mockHealthService } from '../mocks/health.service.mock';

describe(`${HealthCheckController.name}`, () => {
  let app: INestApplication;
  let controller: HealthCheckController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthCheckModule, CommonModule],
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

    test(`Returns nothing if healthy`, async () => {
      mockHealthService.check.mockResolvedValue(mockHealthyCheckResult);

      const result = await controller.check();

      expect(result).toStrictEqual({
        GIT_SHA: expect.any(String),
        healthCheckResult: expect.any(Object),
      });
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

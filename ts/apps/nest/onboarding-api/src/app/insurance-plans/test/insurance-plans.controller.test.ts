import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import InsurancePlansService from '../insurance-plans.service';
import InsurancePlansController from '../insurance-plans.controller';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_EHR_INSURANCE_QUERY,
  MOCK_EHR_INSURANCE_RESPONSE,
  MOCK_INSURANCE_PLAN_RESPONSE,
} from './mocks/insurance-plans.mock';
import LoggerModule from '../../logger/logger.module';

describe('InsurancePlansController', () => {
  let controller: InsurancePlansController;
  const mockInsurancePlansService = mockDeep<InsurancePlansService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InsurancePlansController],
      providers: [InsurancePlansService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(InsurancePlansService)
      .useValue(mockInsurancePlansService)
      .compile();

    controller = app.get<InsurancePlansController>(InsurancePlansController);
  });

  beforeEach(async () => {
    mockReset(mockInsurancePlansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${InsurancePlansService.prototype.fetchEhr.name}`, () => {
    it('get ehr insurance plans', async () => {
      mockInsurancePlansService.fetchEhr.mockResolvedValue([
        MOCK_EHR_INSURANCE_RESPONSE,
      ]);

      expect(await controller.fetchEhr(MOCK_EHR_INSURANCE_QUERY)).toEqual({
        success: true,
        data: [MOCK_EHR_INSURANCE_RESPONSE],
      });
    });

    it(`throw exception on get ehr insurance plans`, async () => {
      mockInsurancePlansService.fetchEhr.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchEhr(MOCK_EHR_INSURANCE_QUERY);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InsurancePlansService.prototype.fetch.name}`, () => {
    it('get insurance plans', async () => {
      mockInsurancePlansService.fetch.mockResolvedValue([
        MOCK_INSURANCE_PLAN_RESPONSE,
      ]);

      expect(await controller.fetch('billingCityId')).toEqual({
        success: true,
        data: [MOCK_INSURANCE_PLAN_RESPONSE],
      });
    });

    it(`throw exception on get insurance plans`, async () => {
      mockInsurancePlansService.fetch.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetch('billingCityId');
      }).rejects.toThrow(HttpException);
    });
  });
});

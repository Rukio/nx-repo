import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import AdvancedCareController from '../advanced-care.controller';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import AdvancedCareService from '../advanced-care.service';
import { MOCK_ADVANCED_CARE_PATIENT_DATA } from './mocks/advanced-care.mock';

describe('AdvancedCareController', () => {
  let controller: AdvancedCareController;
  const mockAdvancedCareService = mockDeep<AdvancedCareService>();
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [AdvancedCareController],
      providers: [AdvancedCareService],
    })
      .overrideProvider(AdvancedCareService)
      .useValue(mockAdvancedCareService)
      .compile();

    controller = app.get<AdvancedCareController>(AdvancedCareController);
  });

  beforeEach(async () => {
    mockReset(mockAdvancedCareService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${AdvancedCareService.prototype.getActivePatients.name}`, () => {
    it('should return success', async () => {
      mockAdvancedCareService.getActivePatients.mockResolvedValue(
        MOCK_ADVANCED_CARE_PATIENT_DATA
      );
      const res = await controller.getActivePatient('3239');
      expect(res).toHaveProperty('success', true);
      expect(res).toHaveProperty('data', MOCK_ADVANCED_CARE_PATIENT_DATA);
    });

    it('throw httpException on update', async () => {
      jest
        .spyOn(mockAdvancedCareService, 'getActivePatients')
        .mockImplementation(() => {
          throw new Error('error');
        });

      await expect(async () => {
        await controller.getActivePatient('612985');
      }).rejects.toThrow(HttpException);

      expect(mockAdvancedCareService.getActivePatients).toHaveBeenCalledWith(
        '612985'
      );
    });
  });
});

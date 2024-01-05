import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { mockBillingCityPlaceOfService } from '../../station/test/mocks/station.service.mock';
import PlacesOfServiceController from '../places-of-service.controller';
import StationService from '../../station/station.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import LoggerModule from '../../logger/logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from '../../common/cache.config.service';

describe(`${PlacesOfServiceController.name}`, () => {
  let controller: PlacesOfServiceController;
  const mockStationService = mockDeep<StationService>();
  const OLD_ENV = process.env;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StationService],
      controllers: [PlacesOfServiceController],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(StationService)
      .useValue(mockStationService)
      .compile();

    controller = module.get<PlacesOfServiceController>(
      PlacesOfServiceController
    );
  });

  beforeEach(async () => {
    mockReset(mockStationService);
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe(`${PlacesOfServiceController.prototype.fetchAll.name}`, () => {
    it(`get empty places of service assessment`, async () => {
      mockStationService.fetchPlacesOfService.mockResolvedValue([]);

      const result = await controller.fetchAll('11');
      expect(mockStationService.fetchPlacesOfService).toBeCalledTimes(1);
      expect(result).toStrictEqual({ success: true, data: [] });
    });

    it(`gets places of service`, async () => {
      mockStationService.fetchPlacesOfService.mockResolvedValue(
        mockBillingCityPlaceOfService
      );

      const result = await controller.fetchAll('19');
      expect(mockStationService.fetchPlacesOfService).toBeCalledTimes(1);
      expect(result).toStrictEqual({
        success: true,
        data: mockBillingCityPlaceOfService,
      });
    });

    it('throws error', async () => {
      mockStationService.fetchPlacesOfService.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await controller.fetchAll('1234');
      }).rejects.toThrow(HttpException);
    });
  });
});

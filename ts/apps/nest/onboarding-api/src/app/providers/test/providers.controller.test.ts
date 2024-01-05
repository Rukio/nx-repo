import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep } from 'jest-mock-extended';
import ProvidersController from '../providers.controller';
import ProvidersService from '../providers.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import { PROVIDER_MOCK } from './mocks/providers.common.test.mock';

describe('ProvidersController', () => {
  let controller: ProvidersController;
  const mockProvidersService = mockDeep<ProvidersService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [ProvidersController],
      providers: [ProvidersService],
    })
      .overrideProvider(ProvidersService)
      .useValue(mockProvidersService)
      .compile();
    controller = app.get<ProvidersController>(ProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${ProvidersService.prototype.fetchAll.name}`, () => {
    it('should return list of providers', async () => {
      mockProvidersService.fetchAll.mockResolvedValue([PROVIDER_MOCK]);
      expect(await controller.fetchAll()).toStrictEqual({
        success: true,
        data: [PROVIDER_MOCK],
      });
    });

    it('should throw error on fetchAll', async () => {
      jest.spyOn(mockProvidersService, 'fetchAll').mockImplementation(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.fetchAll();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${ProvidersService.prototype.fetch.name}`, () => {
    it('should return provider', async () => {
      mockProvidersService.fetch.mockResolvedValue(PROVIDER_MOCK);
      expect(await controller.searchScreeningProviders()).toStrictEqual({
        success: true,
        data: PROVIDER_MOCK,
      });
    });

    it('should throw error on searchScreeningProviders', async () => {
      jest.spyOn(mockProvidersService, 'fetch').mockImplementation(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.searchScreeningProviders();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${ProvidersService.prototype.fetchByName.name}`, () => {
    it('should return provider based on name search', async () => {
      mockProvidersService.fetchByName.mockResolvedValue([PROVIDER_MOCK]);
      expect(
        await controller.fetchByName({
          name: 'Zach',
          secondaryScreeningLicenseState: 'CO',
        })
      ).toStrictEqual({
        success: true,
        data: [PROVIDER_MOCK],
      });
    });

    it('should throw error on fetchByName', async () => {
      jest.spyOn(mockProvidersService, 'fetchByName').mockImplementation(() => {
        throw new Error('error');
      });

      await expect(async () => {
        await controller.fetchByName();
      }).rejects.toThrow(HttpException);
    });
  });
});

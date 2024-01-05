import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  CareRequestAPIResponse,
  CreateMpoaConsent,
  MpoaConsent,
} from '@*company-data-covered*/consumer-web-types';
import { CacheConfigService } from '../../common/cache.config.service';
import MpoaConsentController from '../mpoa-consent.controller';
import MpoaConsentService from '../mpoa-consent.service';
import LoggerModule from '../../logger/logger.module';
import { mockMpoaConsent } from './mocks/mpoa-consent.mock';

describe('MMpoaConsentController tests', () => {
  let controller: MpoaConsentController;
  const mockMpoaConsentService = mockDeep<MpoaConsentService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MpoaConsentController],
      providers: [MpoaConsentService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(MpoaConsentService)
      .useValue(mockMpoaConsentService)
      .compile();

    controller = app.get<MpoaConsentController>(MpoaConsentController);
  });

  beforeEach(async () => {
    mockReset(mockMpoaConsentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(mockMpoaConsentService).toBeDefined();
  });

  it('create mpoa consent', async () => {
    const createMpoaConsent: CreateMpoaConsent = {
      consented: true,
      powerOfAttorneyId: 123141,
      timeOfConsentChange: new Date(),
    };
    const careRequestId = 2354326;
    const mockResult: MpoaConsent = {
      ...mockMpoaConsent,
      careRequestId,
      timeOfConsentChange: createMpoaConsent.timeOfConsentChange,
    };
    const response: CareRequestAPIResponse<MpoaConsent> = {
      data: mockResult,
      success: true,
    };

    mockMpoaConsentService.create.mockResolvedValue(mockResult);

    const result = await controller.create(careRequestId, createMpoaConsent);
    expect(result).toStrictEqual(response);
  });

  it('update mpoa consent', async () => {
    const careRequestId = 1234;
    const mpoaConsentId = 11685;
    const mpoaConsent: MpoaConsent = {
      ...mockMpoaConsent,
      careRequestId,
      consented: false,
      id: mpoaConsentId,
    };
    mockMpoaConsentService.update.mockResolvedValue(mpoaConsent);

    const result = await controller.update(mpoaConsentId, mpoaConsent);
    const response: CareRequestAPIResponse<MpoaConsent> = {
      data: mpoaConsent,
      success: true,
    };
    expect(result).toStrictEqual(response);
  });

  it('get mpoa consent', async () => {
    const careRequestId = 1234;
    const mpoaConsent: MpoaConsent = {
      ...mockMpoaConsent,
      careRequestId,
      consented: false,
    };
    const response: CareRequestAPIResponse<MpoaConsent> = {
      data: mpoaConsent,
      success: true,
    };

    mockMpoaConsentService.get.mockResolvedValue(mpoaConsent);

    expect(await controller.get(careRequestId)).toStrictEqual(response);
  });

  it(`get empty mpoa consent`, async () => {
    mockMpoaConsentService.get.mockResolvedValue(null);

    const result = await controller.get(17902);
    expect(result).toStrictEqual({ success: false, data: undefined });
  });

  it('get mpoa consent error', async () => {
    mockMpoaConsentService.get.mockImplementation(() => {
      throw new Error('error');
    });
    await expect(async () => {
      await controller.get(1234);
    }).rejects.toThrow(HttpException);
  });

  it('create mpoa consent error', async () => {
    mockMpoaConsentService.create.mockImplementation(() => {
      throw new Error('error');
    });
    await expect(async () => {
      await controller.create(1234, {
        consented: true,
        powerOfAttorneyId: 1,
        timeOfConsentChange: null,
      });
    }).rejects.toThrow(HttpException);
  });

  it('update mpoa consent error', async () => {
    mockMpoaConsentService.update.mockImplementation(() => {
      throw new Error('error');
    });
    await expect(async () => {
      await controller.update(1234, {
        consented: true,
        powerOfAttorneyId: 1,
        timeOfConsentChange: null,
      });
    }).rejects.toThrow(HttpException);
  });
});

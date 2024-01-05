import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  CreateMpoaConsent,
  MpoaConsent,
} from '@*company-data-covered*/consumer-web-types';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import MpoaConsentService from '../mpoa-consent.service';
import { AxiosError, AxiosResponse } from 'axios';
import {
  mockMpoaConsent,
  mockStationMpoaConsent,
} from './mocks/mpoa-consent.mock';

describe(`${MpoaConsentService.name}`, () => {
  let app: INestApplication;
  let mpoaConsentService: MpoaConsentService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [MpoaConsentService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    mpoaConsentService = module.get<MpoaConsentService>(MpoaConsentService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${MpoaConsentService.prototype.get}`, () => {
    it(`returns mpoa consent`, async () => {
      const stationResponse: AxiosResponse = wrapInAxiosResponse(
        mockStationMpoaConsent
      );

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(stationResponse));

      const actualResponse = await mpoaConsentService.get(
        mockStationMpoaConsent.care_request_id
      );
      expect(actualResponse).toEqual(mockMpoaConsent);
    });

    it(`returns empty mpoa consent`, async () => {
      const careRequestId = 1282728;
      jest.spyOn(httpService, 'get').mockImplementationOnce(() => {
        const err = new AxiosError('Empty response');
        err.response = wrapInAxiosResponse('Empty', 404);
        throw err;
      });

      const actualResponse = await mpoaConsentService.get(careRequestId);
      expect(actualResponse).toEqual(null);
    });

    it(`returns error`, async () => {
      const careRequestId = 1282728;
      jest.spyOn(httpService, 'get').mockImplementationOnce(() => {
        throw new Error('Empty response');
      });

      await expect(async () => {
        await mpoaConsentService.get(careRequestId);
      }).rejects.toThrow(Error);
    });
  });

  describe(`${MpoaConsentService.prototype.create}`, () => {
    it('create mpoa consent', async () => {
      const mockData: CreateMpoaConsent = {
        consented: true,
        powerOfAttorneyId: 123141,
        timeOfConsentChange: mockStationMpoaConsent.time_of_consent_change,
      };

      const stationResponse: AxiosResponse = wrapInAxiosResponse(
        mockStationMpoaConsent
      );
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(stationResponse));

      const actualResponse = await mpoaConsentService.create(
        mockData,
        mockStationMpoaConsent.care_request_id
      );
      expect(actualResponse).toEqual(mockMpoaConsent);
    });
  });

  describe(`${MpoaConsentService.prototype.update}`, () => {
    it('update mpoa consent', async () => {
      const careRequestId = 1234;
      const mpoaConsentId = 11685;
      const mockData: MpoaConsent = {
        careRequestId,
        consented: false,
        powerOfAttorneyId: 90380,
        timeOfConsentChange: mockMpoaConsent.timeOfConsentChange,
        userId: 84949,
        id: mpoaConsentId,
      };
      const stationResponse: AxiosResponse = wrapInAxiosResponse(
        mockStationMpoaConsent
      );

      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() => of(stationResponse));

      const actualResponse = await mpoaConsentService.update(
        mpoaConsentId,
        mockData
      );
      expect(actualResponse).toEqual(mockMpoaConsent);
    });
  });
});

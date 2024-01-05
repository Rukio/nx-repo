import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import InsurancePlansService from '../insurance-plans.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MOCK_EHR_INSURANCE_QUERY,
  MOCK_EHR_INSURANCE_RESPONSE,
  MOCK_INSURANCE_PLAN_RESPONSE,
  MOCK_STATION_EHR_INSURANCE_RESPONSE,
  MOCK_STATION_INSURANCE_PLAN_RESPONSE,
} from './mocks/insurance-plans.mock';

describe(`${InsurancePlansService.name}`, () => {
  let app: INestApplication;
  let insurancePlansService: InsurancePlansService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [InsurancePlansService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    insurancePlansService = module.get<InsurancePlansService>(
      InsurancePlansService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${InsurancePlansService.prototype.fetch.name}`, () => {
    it('get insurance plans', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([MOCK_STATION_INSURANCE_PLAN_RESPONSE]))
        );
      expect(await insurancePlansService.fetch('billingCityId')).toEqual([
        MOCK_INSURANCE_PLAN_RESPONSE,
      ]);
    });
  });

  describe(`${InsurancePlansService.prototype.fetchEhr.name}`, () => {
    it('get ehr insurance plans', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([MOCK_STATION_EHR_INSURANCE_RESPONSE]))
        );
      expect(
        await insurancePlansService.fetchEhr(MOCK_EHR_INSURANCE_QUERY)
      ).toEqual([MOCK_EHR_INSURANCE_RESPONSE]);
    });
  });
});

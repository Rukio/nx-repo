import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import ProvidersService from '../providers.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  PROVIDER_CALL_SEARCH_PARAMS_MOCK,
  PROVIDER_QUERY_MOCK,
  PROVIDERS_BODY_MOCK,
  STATION_PROVIDER_MOCK,
} from './mocks/providers.service.mock';
import { PROVIDER_MOCK } from './mocks/providers.common.test.mock';

describe(`${ProvidersService.name}`, () => {
  let app: INestApplication;
  let providersService: ProvidersService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ProvidersService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    providersService = module.get<ProvidersService>(ProvidersService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${ProvidersService.prototype.fetchAll.name}`, () => {
    it(`should return list of providers`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([STATION_PROVIDER_MOCK]))
        );
      expect(await providersService.fetchAll(PROVIDER_QUERY_MOCK)).toEqual([
        PROVIDER_MOCK,
      ]);
    });
  });

  describe(`${ProvidersService.prototype.fetch.name}`, () => {
    it(`should return provider`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PROVIDER_MOCK))
        );
      expect(
        await providersService.fetch(PROVIDER_CALL_SEARCH_PARAMS_MOCK)
      ).toEqual(PROVIDER_MOCK);
    });
  });

  describe(`${ProvidersService.prototype.fetchByName.name}`, () => {
    it(`should return provider based on name search`, async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([STATION_PROVIDER_MOCK]))
        );
      expect(await providersService.fetchByName(PROVIDERS_BODY_MOCK)).toEqual([
        PROVIDER_MOCK,
      ]);
    });
  });
});

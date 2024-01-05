import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import MarketService from '../market.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MOCK_MARKET_FETCH_RESPONSE,
  MOCK_STATION_MARKET_FETCH,
} from './mocks/market.mock';

describe(`${MarketService.name}`, () => {
  let app: INestApplication;
  let marketService: MarketService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [MarketService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    marketService = module.get<MarketService>(MarketService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${MarketService.prototype.fetch.name}`, () => {
    it(`get market by id`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_MARKET_FETCH))
        );
      expect(await marketService.fetch(123)).toEqual(
        MOCK_MARKET_FETCH_RESPONSE
      );
    });
  });

  describe(`${MarketService.prototype.fetchAll.name}`, () => {
    it(`get all market details`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([MOCK_STATION_MARKET_FETCH]))
        );
      expect(await marketService.fetchAll()).toEqual([
        MOCK_MARKET_FETCH_RESPONSE,
      ]);
    });
  });

  describe(`${MarketService.prototype.fetchAllTelepresentation.name}`, () => {
    it(`retrieve all market details`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([MOCK_STATION_MARKET_FETCH]))
        );
      expect(await marketService.fetchAllTelepresentation()).toEqual([
        MOCK_MARKET_FETCH_RESPONSE,
      ]);
    });
  });
});

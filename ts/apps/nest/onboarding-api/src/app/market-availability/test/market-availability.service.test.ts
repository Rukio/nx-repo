import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication, InternalServerErrorException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';

import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_MARKET_DETAILS_STATION_RESPONSE,
  MOCK_CHECK_AVAILABILITY_REQUEST_BODY,
  MOCK_CHECK_AVAILABILITY_STATION_REQUEST_BODY,
  MOCK_AVAILABLE_RESPONSE,
  MOCK_ZIPCODE_FETCH_RESPONSE,
  MOCK_ZIPCODE_FETCH_STATION_RESPONSE,
  MOCK_ZIPCODE_WITH_MARKET_NAME_FETCH_RESPONSE,
} from './mocks/market-availability.mock';
import MarketAvailabilityService from '../market-availability.service';
import LoggerModule from '../../logger/logger.module';
import mapper from '../market-availability.mapper';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MarketAvailabilities,
  MarketAvailabilityBody,
} from '@*company-data-covered*/consumer-web-types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mockLogger } from '../../logger/mocks/logger.mock';

describe(`${MarketAvailabilityService.name}`, () => {
  let app: INestApplication;
  let marketAvailabilityService: MarketAvailabilityService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [MarketAvailabilityService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    marketAvailabilityService = module.get<MarketAvailabilityService>(
      MarketAvailabilityService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${MarketAvailabilityService.prototype.fetchMarketByZipcode.name}`, () => {
    const testZipcode = '80218';

    it('fetch market without shortName', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_ZIPCODE_FETCH_STATION_RESPONSE))
        );

      const actualResponse =
        await marketAvailabilityService.fetchMarketByZipcode(testZipcode);
      expect(actualResponse).toEqual(MOCK_ZIPCODE_FETCH_RESPONSE);
    });

    it('fetch market with shortName', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_ZIPCODE_FETCH_STATION_RESPONSE))
        )
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_MARKET_DETAILS_STATION_RESPONSE))
        );

      const actualResponse =
        await marketAvailabilityService.fetchMarketByZipcode(
          testZipcode,
          'true'
        );
      expect(actualResponse).toEqual(
        MOCK_ZIPCODE_WITH_MARKET_NAME_FETCH_RESPONSE
      );
    });

    it('fetch market with shortName when market details returns internal server error', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_ZIPCODE_FETCH_STATION_RESPONSE))
        )
        .mockImplementationOnce(() => {
          throw new InternalServerErrorException();
        });

      expect(mockLogger.error).toHaveBeenCalledTimes(0);

      const actualResponse =
        await marketAvailabilityService.fetchMarketByZipcode(
          testZipcode,
          'true'
        );
      expect(actualResponse).toEqual(MOCK_ZIPCODE_FETCH_RESPONSE);
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'MarketAvailabilityService pulling marketId 165 short name error: Internal Server Error'
      );
    });

    it('returns null when no market was found by the zip code', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(null)));

      expect(mockLogger.error).toHaveBeenCalledTimes(0);

      const actualResponse =
        await marketAvailabilityService.fetchMarketByZipcode(
          testZipcode,
          'true'
        );
      expect(actualResponse).toEqual(null);
      expect(mockLogger.error).toHaveBeenCalledTimes(0);
    });
  });

  describe(`${MarketAvailabilityService.prototype.checkMarketAvailability.name}`, () => {
    it('check market availability', async () => {
      const httpPostSpy = jest.spyOn(httpService, 'post');
      httpPostSpy.mockImplementationOnce(() =>
        of(wrapInAxiosResponse(MOCK_AVAILABLE_RESPONSE))
      );

      const mapperSpy = jest.spyOn(
        mapper,
        'CheckMarketAvailabilityBodyToStationCheckMarketAvailabilityBody'
      );

      expect(mapperSpy).toHaveBeenCalledTimes(0);
      expect(httpPostSpy).toHaveBeenCalledTimes(0);

      const actualResponse =
        await marketAvailabilityService.checkMarketAvailability(
          MOCK_CHECK_AVAILABILITY_REQUEST_BODY
        );
      expect(actualResponse).toEqual(MOCK_AVAILABLE_RESPONSE);

      expect(mapperSpy).toHaveBeenCalledTimes(1);
      expect(httpPostSpy).toHaveBeenCalledTimes(1);
      expect(mapperSpy).toHaveBeenCalledWith(
        MOCK_CHECK_AVAILABILITY_REQUEST_BODY
      );
      expect(httpPostSpy).toHaveBeenCalledWith(
        // URL endpoint
        expect.any(String),
        MOCK_CHECK_AVAILABILITY_STATION_REQUEST_BODY,
        // Headers
        expect.any(Object)
      );
    });
  });

  describe(`${MarketAvailabilityService.prototype.marketAvailability.name}`, () => {
    const availabilities: MarketAvailabilities = {
      availabilities: [
        {
          availability: 'available',
        },
        {
          availability: 'limited_availability',
        },
      ],
    };

    it('fetch market availability', async () => {
      const httpPostSpy = jest.spyOn(httpService, 'post');
      httpPostSpy.mockImplementationOnce(() =>
        of(wrapInAxiosResponse(availabilities))
      );

      const payload: MarketAvailabilityBody = {
        market_id: 123,
        service_date: '02/02/2023',
        requested_service_line: 'acute_care',
      };

      const response = await marketAvailabilityService.marketAvailability(
        payload
      );

      expect(response).toEqual(availabilities);
    });
  });
});

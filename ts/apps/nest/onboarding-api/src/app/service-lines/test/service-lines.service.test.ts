import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import ServiceLinesService from '../service-lines.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  FETCH_911_RESPONSE_MOCK,
  FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK,
  FETCH_RESPONSE_MOCK,
  STATION_FETCH_911_RESPONSE_MOCK,
  STATION_FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK,
  STATION_FETCH_RESPONSE_MOCK,
} from './mocks/service-lines.service.mock';

describe(`${ServiceLinesService.name}`, () => {
  let app: INestApplication;
  let serviceLinesService: ServiceLinesService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ServiceLinesService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    serviceLinesService = module.get<ServiceLinesService>(ServiceLinesService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${ServiceLinesService.prototype.fetchAll.name}`, () => {
    it('should return service lines', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK))
        );
      expect(await serviceLinesService.fetchAll(1234)).toEqual(
        FETCH_ALL_SERVICE_LINES_RESPONSE_MOCK
      );
    });
  });

  describe(`${ServiceLinesService.prototype.fetch.name}`, () => {
    it('should return service lines', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_FETCH_RESPONSE_MOCK))
        );
      expect(await serviceLinesService.fetch(1234)).toEqual(
        FETCH_RESPONSE_MOCK
      );
    });
  });

  describe(`${ServiceLinesService.prototype.create.name}`, () => {
    it('should create service lines', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_FETCH_RESPONSE_MOCK))
        );
      expect(
        await serviceLinesService.create(123, FETCH_RESPONSE_MOCK)
      ).toEqual(FETCH_RESPONSE_MOCK);
    });
  });

  describe(`${ServiceLinesService.prototype.update.name}`, () => {
    it('should update service lines', async () => {
      jest
        .spyOn(httpService, 'put')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_FETCH_RESPONSE_MOCK))
        );
      expect(
        await serviceLinesService.update(1234, FETCH_RESPONSE_MOCK)
      ).toEqual(FETCH_RESPONSE_MOCK);
    });
  });

  describe(`${ServiceLinesService.prototype.delete.name}`, () => {
    it('should delete service lines', async () => {
      jest
        .spyOn(httpService, 'delete')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );
      expect(await serviceLinesService.delete(1234)).toEqual({ success: true });
    });
  });

  describe(`${ServiceLinesService.prototype.get911ServiceLine.name}`, () => {
    it('get 911 service lines', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([STATION_FETCH_911_RESPONSE_MOCK]))
        );
      expect(await serviceLinesService.get911ServiceLine()).toEqual(
        FETCH_911_RESPONSE_MOCK
      );
    });
  });
});

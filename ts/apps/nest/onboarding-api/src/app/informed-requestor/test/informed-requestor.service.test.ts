import { HttpException, INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import InformedRequestorsService from '../informed-requestor.service';
import {
  MOCK_INFORMED_REQUESTOR_RESPONSE,
  MOCK_INFORMED_REQUESTOR_PAYLOAD,
  MOCK_STATION_CREATE_INFORMED_REQUESTOR,
} from './mocks/informed-requestor.mock';
import { wrapInAxiosResponse } from '../../../testUtils/utils';

describe(`${InformedRequestorsService.name}`, () => {
  let app: INestApplication;
  let informedRequestorsService: InformedRequestorsService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [InformedRequestorsService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    informedRequestorsService = module.get<InformedRequestorsService>(
      InformedRequestorsService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${InformedRequestorsService.prototype.create.name}`, () => {
    it(`create informed requester`, async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_CREATE_INFORMED_REQUESTOR))
        );

      expect(
        await informedRequestorsService.create(MOCK_INFORMED_REQUESTOR_PAYLOAD)
      ).toEqual(MOCK_INFORMED_REQUESTOR_RESPONSE);
    });

    it(`throw error without payload on create informed requester`, async () => {
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore CALL CREATE WITHOUT PAYLOAD
        await informedRequestorsService.create({});
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InformedRequestorsService.prototype.update.name}`, () => {
    it(`update informed requester`, async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_CREATE_INFORMED_REQUESTOR))
        );
      expect(
        await informedRequestorsService.update(MOCK_INFORMED_REQUESTOR_PAYLOAD)
      ).toEqual(MOCK_INFORMED_REQUESTOR_RESPONSE);
    });

    it(`throw error without payload on create informed requester`, async () => {
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore CALL UPDATE WITHOUT PAYLOAD
        await informedRequestorsService.update({});
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InformedRequestorsService.prototype.fetch.name}`, () => {
    it(`get informed requester`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_CREATE_INFORMED_REQUESTOR))
        );
      expect(await informedRequestorsService.fetch(1234)).toEqual(
        MOCK_INFORMED_REQUESTOR_RESPONSE
      );
    });
  });
});

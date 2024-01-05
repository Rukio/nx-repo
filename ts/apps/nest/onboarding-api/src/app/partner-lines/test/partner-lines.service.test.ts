import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import PartnerLinesService from '../partner-lines.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  PARTNER_LINE_MOCK,
  STATION_PARTNER_LINE_MOCK,
} from './mocks/partner-lines.common.mock';

describe(`${PartnerLinesService.name}`, () => {
  let app: INestApplication;
  let partnerLinesService: PartnerLinesService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [PartnerLinesService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    partnerLinesService = module.get<PartnerLinesService>(PartnerLinesService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${PartnerLinesService.prototype.fetchAll.name}`, () => {
    it(`get list of partner lists`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PARTNER_LINE_MOCK))
        );
      expect(await partnerLinesService.fetchAll()).toEqual([PARTNER_LINE_MOCK]);
    });
  });

  describe(`${PartnerLinesService.prototype.fetch.name}`, () => {
    it(`search partner list by phone number`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PARTNER_LINE_MOCK))
        );
      expect(await partnerLinesService.fetch('tel:+17206899684')).toEqual(
        PARTNER_LINE_MOCK
      );
    });
  });

  describe(`${PartnerLinesService.prototype.formatPhoneNumber.name}`, () => {
    it(`should return formatted phone number`, async () => {
      const formattedNumber = '(720)689-9684';
      expect(partnerLinesService.formatPhoneNumber('tel:+17206899684')).toEqual(
        formattedNumber
      );
    });

    it(`should return already formatted phone number`, async () => {
      const formattedNumber = '(720)689-9684';
      expect(partnerLinesService.formatPhoneNumber('(720)689-9684')).toEqual(
        formattedNumber
      );
    });

    it(`should return null when called formatted phone number`, async () => {
      expect(partnerLinesService.formatPhoneNumber('wrongNumber')).toEqual(
        null
      );
    });
  });
});

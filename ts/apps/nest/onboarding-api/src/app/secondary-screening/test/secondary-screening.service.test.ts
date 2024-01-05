import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import SecondaryScreeningService from '../secondary-screening.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  SECONDARY_SCREENING_MOCK,
  SECONDARY_SCREENING_PARAMS_MOCK,
  STATION_SECONDARY_SCREENING_MOCK,
} from './mocks/secondary-screening.common.mock';

describe(`${SecondaryScreeningService.name}`, () => {
  let app: INestApplication;
  let secondaryScreeningService: SecondaryScreeningService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [SecondaryScreeningService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    secondaryScreeningService = module.get<SecondaryScreeningService>(
      SecondaryScreeningService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${SecondaryScreeningService.prototype.create.name}`, () => {
    it('create secondary screening', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_SECONDARY_SCREENING_MOCK))
        );
      expect(
        await secondaryScreeningService.create(
          'careRequestId',
          SECONDARY_SCREENING_PARAMS_MOCK
        )
      ).toEqual(SECONDARY_SCREENING_MOCK);
    });
  });

  describe(`${SecondaryScreeningService.prototype.fetchAll.name}`, () => {
    it('fetch all secondary screenings', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([STATION_SECONDARY_SCREENING_MOCK]))
        );
      expect(await secondaryScreeningService.fetchAll('careRequestId')).toEqual(
        [SECONDARY_SCREENING_MOCK]
      );
    });
  });

  describe(`${SecondaryScreeningService.prototype.update.name}`, () => {
    it('update secondary screening', async () => {
      jest
        .spyOn(httpService, 'put')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_SECONDARY_SCREENING_MOCK))
        );
      expect(
        await secondaryScreeningService.update(
          'careRequestId',
          'Id',
          SECONDARY_SCREENING_PARAMS_MOCK
        )
      ).toEqual(SECONDARY_SCREENING_MOCK);
    });
  });

  describe(`${SecondaryScreeningService.prototype.remove.name}`, () => {
    it('remove secondary screening', async () => {
      jest
        .spyOn(httpService, 'delete')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );
      expect(
        await secondaryScreeningService.remove('careRequestId', 'Id')
      ).toEqual({ success: true });
    });
  });
});

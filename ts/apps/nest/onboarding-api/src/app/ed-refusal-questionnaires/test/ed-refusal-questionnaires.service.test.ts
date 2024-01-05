import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import { Test } from '@nestjs/testing';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import EdRefusalQuestionnairesService from '../ed-refusal-questionnaires.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  REFUSAL_QUESTIONNAIRES_BODY_MOCK,
  REFUSAL_QUESTIONNAIRES_ID_MOCK,
  REFUSAL_QUESTIONNAIRES_MOCK,
  STATION_REFUSAL_QUESTIONNAIRES_MOCK,
} from './mocks/ed-refusal-questionnaires.common.mock';

describe(`${EdRefusalQuestionnairesService.name}`, () => {
  let app: INestApplication;
  let edRefusalQuestionnairesService: EdRefusalQuestionnairesService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [EdRefusalQuestionnairesService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    edRefusalQuestionnairesService = module.get<EdRefusalQuestionnairesService>(
      EdRefusalQuestionnairesService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${EdRefusalQuestionnairesService.prototype.fetchAll.name}`, () => {
    it(`fetch all EdRefusalQuestionnaires`, async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse([STATION_REFUSAL_QUESTIONNAIRES_MOCK]))
        );
      expect(await edRefusalQuestionnairesService.fetchAll('612398')).toEqual([
        REFUSAL_QUESTIONNAIRES_MOCK,
      ]);
    });
  });

  describe(`${EdRefusalQuestionnairesService.prototype.create.name}`, () => {
    it(`create EdRefusalQuestionnaire`, async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_REFUSAL_QUESTIONNAIRES_MOCK))
        );
      expect(
        await edRefusalQuestionnairesService.create(
          '612398',
          REFUSAL_QUESTIONNAIRES_BODY_MOCK
        )
      ).toEqual(REFUSAL_QUESTIONNAIRES_MOCK);
    });
  });

  describe(`${EdRefusalQuestionnairesService.prototype.update.name}`, () => {
    it(`update EdRefusalQuestionnaire`, async () => {
      jest
        .spyOn(httpService, 'put')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_REFUSAL_QUESTIONNAIRES_MOCK))
        );
      expect(
        await edRefusalQuestionnairesService.update(
          '612398',
          REFUSAL_QUESTIONNAIRES_ID_MOCK,
          REFUSAL_QUESTIONNAIRES_BODY_MOCK
        )
      ).toEqual(REFUSAL_QUESTIONNAIRES_MOCK);
    });
  });
});

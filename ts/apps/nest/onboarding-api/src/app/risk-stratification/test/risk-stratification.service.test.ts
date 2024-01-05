import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import {
  RSTimeSensitiveAnswerEvent,
  TimeSensitiveAnswerEvent,
  TimeSensitiveAnswerEventBody,
  TimeSensitiveQuestion,
  RSTimeSensitiveQuestion,
  RSTimeSensitiveScreeningResultResponse,
  TimeSensitiveScreeningResultResponse,
  SearchSymptomAliasesResponse,
} from '@*company-data-covered*/consumer-web-types';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import RiskStratificationService from '../risk-stratification.service';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { mockAuthService } from '../../common/mocks/auth.mock';
import {
  RS_TIME_SENSITIVE_QUESTION,
  TIME_SENSITIVE_QUESTION,
  RS_TIME_SENSITIVE_ANSWER_EVENT_DATA,
  TIME_SENSITIVE_ANSWER_EVENT_BODY,
  TIME_SENSITIVE_ANSWER_EVENT_DATA,
  TIME_SENSITIVE_SCREENING_RESULT_BODY,
  RS_TIME_SENSITIVE_SCREENING_RESULT_RESPONSE,
  TIME_SENSITIVE_SCREENING_RESULT_RESPONSE,
  RS_SEARCH_SYMPTOM_ALIASES_RESPONSE,
  RS_SEARCH_SYMPTOM_ALIASES_EMPTY_RESPONSE,
  UPSERT_CARE_REQUEST_SYMPTOMS_BODY,
  RS_SEARCH_SYMPTOM_ALIASES_PARAMS,
} from './mocks/risk-stratification.service.mock';

describe('RiskStratificationService', () => {
  let app: INestApplication;
  let riskStratificationService: RiskStratificationService;
  let httpService: HttpService;
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';

    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [
        RiskStratificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => 'http://example.com'),
          },
        },
      ],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    riskStratificationService = module.get<RiskStratificationService>(
      RiskStratificationService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    process.env = OLD_ENV;
    await app.close();
  });

  describe(`${RiskStratificationService.prototype.publishTimeSensitiveAnswerEvent.name}`, () => {
    it('should return time sensitive answer event after post call', async () => {
      const mockBody: TimeSensitiveAnswerEventBody =
        TIME_SENSITIVE_ANSWER_EVENT_BODY;
      const mockQuestionId = 'uuid';
      const mockRSResult: RSTimeSensitiveAnswerEvent =
        RS_TIME_SENSITIVE_ANSWER_EVENT_DATA;
      const mockResult: TimeSensitiveAnswerEvent =
        TIME_SENSITIVE_ANSWER_EVENT_DATA;
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(mockRSResult)));
      const response =
        await riskStratificationService.publishTimeSensitiveAnswerEvent(
          mockQuestionId,
          mockBody
        );
      expect(response).toEqual(mockResult);
    });
  });

  describe(`${RiskStratificationService.prototype.upsertTimeSensitiveScreeningResult.name}`, () => {
    // TODO(ON-843)
    it.skip('should return success', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );

      expect(
        await riskStratificationService.upsertTimeSensitiveScreeningResult(
          TIME_SENSITIVE_SCREENING_RESULT_BODY
        )
      ).toHaveProperty('success', true);
    });
  });

  describe('basePath', () => {
    it('should return the RISK_STRAT_SERVICE_URL from the ConfigService', () => {
      expect(riskStratificationService.basePath).toEqual('http://example.com');
    });
  });

  describe(`${RiskStratificationService.prototype.getListTimeSensitiveQuestions.name}`, () => {
    it('should return active advanced care patients after get call', async () => {
      const mockRSResult: RSTimeSensitiveQuestion[] =
        RS_TIME_SENSITIVE_QUESTION;
      const mockResult: TimeSensitiveQuestion[] = TIME_SENSITIVE_QUESTION;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ questions: mockRSResult }))
        );
      const response =
        await riskStratificationService.getListTimeSensitiveQuestions();
      expect(response).toEqual(mockResult);
    });

    it('should return empty array since there are no advanced care patients after get call', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ questions: [] }))
        );
      const response =
        await riskStratificationService.getListTimeSensitiveQuestions();
      expect(response).toEqual([]);
    });
  });

  describe(`${RiskStratificationService.prototype.getTimeSensitiveScreeningResult.name}`, () => {
    it('should return active advanced care patients after get call', async () => {
      const careRequestId = '1234';
      const mockRSResult: RSTimeSensitiveScreeningResultResponse[] =
        RS_TIME_SENSITIVE_SCREENING_RESULT_RESPONSE;
      const mockResult: TimeSensitiveScreeningResultResponse[] =
        TIME_SENSITIVE_SCREENING_RESULT_RESPONSE;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ questions: mockRSResult }))
        );
      const response =
        await riskStratificationService.getTimeSensitiveScreeningResult(
          careRequestId
        );
      expect(response).toEqual(mockResult);
    });

    it('should return empty array since there are no advanced care patients after get call', async () => {
      const careRequestId = '1234';

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ questions: [] }))
        );
      const response =
        await riskStratificationService.getTimeSensitiveScreeningResult(
          careRequestId
        );
      expect(response).toEqual([]);
    });
  });

  describe(`${RiskStratificationService.prototype.searchSymptomAliases.name}`, () => {
    it('should return a list of symptom aliases that matched the search term', async () => {
      const mockRSResult: SearchSymptomAliasesResponse =
        RS_SEARCH_SYMPTOM_ALIASES_RESPONSE;

      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(mockRSResult)));
      const response = await riskStratificationService.searchSymptomAliases(
        RS_SEARCH_SYMPTOM_ALIASES_PARAMS
      );
      expect(response).toEqual({
        symptoms: [
          {
            id: '7542bae98764-43b2-e4667e49-99cd-53d4',
            symptomId: 'e4667e49-53d4-43b2-99cd-7542bae98764',
            symptomName: 'Cough',
            name: 'Cough',
            legacyRiskProtocolName: 'Cough/',
          },
        ],
        pagination: {
          pageSize: 1,
          totalPages: 1,
          totalResults: 1,
          currentPage: 1,
        },
      });
    });

    it('should return empty array since there are no advanced care patients after get call', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(RS_SEARCH_SYMPTOM_ALIASES_EMPTY_RESPONSE))
        );
      const response = await riskStratificationService.searchSymptomAliases(
        RS_SEARCH_SYMPTOM_ALIASES_PARAMS
      );
      expect(response).toEqual({
        pagination: {
          currentPage: 0,
          pageSize: 1,
          totalPages: 0,
          totalResults: 0,
        },
        symptoms: [],
      });
    });
  });

  describe(`${RiskStratificationService.prototype.upsertCareRequestSymptoms.name}`, () => {
    // TODO(ON-843)
    it('should return success', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );

      expect(
        await riskStratificationService.upsertCareRequestSymptoms(
          UPSERT_CARE_REQUEST_SYMPTOMS_BODY
        )
      ).toHaveProperty('success', true);
    });
  });
});

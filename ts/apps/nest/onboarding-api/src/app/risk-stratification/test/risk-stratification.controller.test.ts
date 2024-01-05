import { HttpModule } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import RiskStratificationController from '../risk-stratification.controller';
import RiskStratificationService from '../risk-stratification.service';
import {
  TIME_SENSITIVE_ANSWER_EVENT_BODY,
  TIME_SENSITIVE_ANSWER_EVENT_DATA,
  TIME_SENSITIVE_SCREENING_RESULT_BODY,
  TIME_SENSITIVE_QUESTION,
  TIME_SENSITIVE_SCREENING_RESULT_RESPONSE,
  RS_SEARCH_SYMPTOM_ALIASES_RESPONSE,
  UPSERT_CARE_REQUEST_SYMPTOMS_BODY,
  RS_SEARCH_SYMPTOM_ALIASES_PARAMS,
} from './mocks/risk-stratification.service.mock';

describe('RiskStratificationController', () => {
  let controller: RiskStratificationController;
  const mockRiskStratificationService = mockDeep<RiskStratificationService>();
  const OLD_ENV = process.env;

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
      controllers: [RiskStratificationController],
      providers: [RiskStratificationService],
    })
      .overrideProvider(RiskStratificationService)
      .useValue(mockRiskStratificationService)
      .compile();

    controller = app.get<RiskStratificationController>(
      RiskStratificationController
    );
  });

  beforeEach(async () => {
    mockReset(mockRiskStratificationService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe(`${RiskStratificationController.prototype.publishTimeSensitiveAnswerEvent.name}`, () => {
    it('should return success', async () => {
      const mockResult = TIME_SENSITIVE_ANSWER_EVENT_DATA;
      mockRiskStratificationService.publishTimeSensitiveAnswerEvent.mockResolvedValue(
        mockResult
      );
      const res = await controller.publishTimeSensitiveAnswerEvent(
        'uuid',
        TIME_SENSITIVE_ANSWER_EVENT_BODY
      );
      expect(res).toHaveProperty('success', true);
      expect(res).toHaveProperty('data', mockResult);
    });

    it('throw httpException on update', async () => {
      mockRiskStratificationService.publishTimeSensitiveAnswerEvent.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.publishTimeSensitiveAnswerEvent(
          'uuid',
          TIME_SENSITIVE_ANSWER_EVENT_BODY
        );
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.publishTimeSensitiveAnswerEvent
      ).toHaveBeenCalledWith('uuid', TIME_SENSITIVE_ANSWER_EVENT_BODY);
    });
  });

  describe(`${RiskStratificationController.prototype.upsertTimeSensitiveScreeningResult.name}`, () => {
    it('should return success', async () => {
      mockRiskStratificationService.upsertTimeSensitiveScreeningResult.mockResolvedValue(
        { success: true }
      );

      expect(
        await controller.upsertTimeSensitiveScreeningResult(
          TIME_SENSITIVE_SCREENING_RESULT_BODY
        )
      ).toHaveProperty('success', true);
    });

    it('throw httpException on upsert', async () => {
      mockRiskStratificationService.upsertTimeSensitiveScreeningResult.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.upsertTimeSensitiveScreeningResult(
          TIME_SENSITIVE_SCREENING_RESULT_BODY
        );
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.upsertTimeSensitiveScreeningResult
      ).toHaveBeenCalledWith(TIME_SENSITIVE_SCREENING_RESULT_BODY);
    });
  });

  describe(`${RiskStratificationController.prototype.getListTimeSensitiveQuestions.name}`, () => {
    it('should return success', async () => {
      const mockResult = TIME_SENSITIVE_QUESTION;
      mockRiskStratificationService.getListTimeSensitiveQuestions.mockResolvedValue(
        mockResult
      );
      const res = await controller.getListTimeSensitiveQuestions();
      expect(res).toHaveProperty('success', true);
      expect(res).toHaveProperty('data', mockResult);
    });

    it('throw httpException on get', async () => {
      mockRiskStratificationService.getListTimeSensitiveQuestions.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.getListTimeSensitiveQuestions();
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.getListTimeSensitiveQuestions
      ).toHaveBeenCalledWith();
    });
  });

  describe(`${RiskStratificationController.prototype.getTimeSensitiveScreeningResult.name}`, () => {
    it('should return success', async () => {
      const careRequestId = '1234';
      const mockResult = TIME_SENSITIVE_SCREENING_RESULT_RESPONSE;
      mockRiskStratificationService.getTimeSensitiveScreeningResult.mockResolvedValue(
        mockResult
      );
      const res = await controller.getTimeSensitiveScreeningResult(
        careRequestId
      );
      expect(res).toHaveProperty('success', true);
      expect(res).toHaveProperty('data', mockResult);
    });

    it('throw httpException on get', async () => {
      const careRequestId = '1234';
      mockRiskStratificationService.getTimeSensitiveScreeningResult.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.getTimeSensitiveScreeningResult(careRequestId);
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.getTimeSensitiveScreeningResult
      ).toHaveBeenCalledWith(careRequestId);
    });
  });

  describe(`${RiskStratificationController.prototype.searchSymptomAliases.name}`, () => {
    it('should return success', async () => {
      const mockResult = RS_SEARCH_SYMPTOM_ALIASES_RESPONSE;
      mockRiskStratificationService.searchSymptomAliases.mockResolvedValue(
        mockResult
      );
      const res = await controller.searchSymptomAliases(
        RS_SEARCH_SYMPTOM_ALIASES_PARAMS
      );
      expect(res).toHaveProperty('success', true);
      expect(res).toHaveProperty('data', mockResult);
    });

    it('throw httpException on get', async () => {
      mockRiskStratificationService.searchSymptomAliases.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.searchSymptomAliases(RS_SEARCH_SYMPTOM_ALIASES_PARAMS);
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.searchSymptomAliases
      ).toHaveBeenCalledWith(RS_SEARCH_SYMPTOM_ALIASES_PARAMS);
    });
  });

  describe(`${RiskStratificationController.prototype.upsertCareRequestSymptoms.name}`, () => {
    it('should return success', async () => {
      mockRiskStratificationService.upsertCareRequestSymptoms.mockResolvedValue(
        { success: true }
      );

      expect(
        await controller.upsertCareRequestSymptoms(
          UPSERT_CARE_REQUEST_SYMPTOMS_BODY
        )
      ).toHaveProperty('success', true);
    });

    it('throw httpException on upsert', async () => {
      mockRiskStratificationService.upsertCareRequestSymptoms.mockRejectedValue(
        new Error('error')
      );

      await expect(async () => {
        await controller.upsertCareRequestSymptoms(
          UPSERT_CARE_REQUEST_SYMPTOMS_BODY
        );
      }).rejects.toThrow(HttpException);

      expect(
        mockRiskStratificationService.upsertCareRequestSymptoms
      ).toHaveBeenCalledWith(UPSERT_CARE_REQUEST_SYMPTOMS_BODY);
    });
  });
});

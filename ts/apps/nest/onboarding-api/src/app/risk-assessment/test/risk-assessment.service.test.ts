import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication, InternalServerErrorException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  buildMockRiskAssessment,
  mockRiskAssessment,
  mockStationRiskAssessment,
} from './mocks/risk-assessment.service.mock';
import RiskAssessmentService from '../risk-assessment.service';
import LoggerModule from '../../logger/logger.module';

describe(`${RiskAssessmentService.name}`, () => {
  let app: INestApplication;
  let riskAssessmentService: RiskAssessmentService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [RiskAssessmentService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    riskAssessmentService = module.get<RiskAssessmentService>(
      RiskAssessmentService
    );

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${RiskAssessmentService.prototype.create.name}`, () => {
    it(`create a risk assessment`, async () => {
      const response: AxiosResponse = wrapInAxiosResponse(
        mockStationRiskAssessment
      );

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(response));

      const result = await riskAssessmentService.create(
        622332,
        buildMockRiskAssessment()
      );

      expect(result).toStrictEqual(mockRiskAssessment);
    });

    it(`throws error when something bad happens during creation of risk assessment`, async () => {
      jest.spyOn(httpService, 'post').mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });

      try {
        const result = await riskAssessmentService.create(
          622332,
          buildMockRiskAssessment()
        );

        expect(result).toStrictEqual(null);
      } catch (error) {
        expect(error).toHaveProperty('message', 'Internal Server Error');
        expect(error).toHaveProperty('status', 500);
      }
    });
  });
});

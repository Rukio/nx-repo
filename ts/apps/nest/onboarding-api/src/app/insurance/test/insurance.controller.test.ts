import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import {
  CareRequestAPIResponse,
  Insurance,
  InsuranceClassification,
  InsuranceEligibility,
  SelfUploadInsurance,
} from '@*company-data-covered*/consumer-web-types';
import InsuranceController from '../insurance.controller';
import InsuranceService from '../insurance.service';
import { CacheConfigService } from '../../common/cache.config.service';

import {
  MOCK_INSURANCE,
  MOCK_INSURANCE_PARAMS,
  MOCK_INSURANCE_BODY,
  MOCK_RESULT_ELIGIBILITY,
  MOCK_INSURANCE_QUERY_DTO,
  MOCK_RESULT_SELF_UPLOADED_INSURANCE,
} from './mocks/insurance.mock';
import LoggerModule from '../../logger/logger.module';
import { MOCK_INSURANCE_CLASSIFICATION } from '../../self-schedule/test/mocks/self-schedule.mock';
import StationService from '../../station/station.service';
import {
  AuthModule,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';

describe('InsuranceController tests', () => {
  let controller: InsuranceController;
  let insuranceService: InsuranceService;

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [InsuranceController],
      providers: [InsuranceService, StationService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    controller = app.get<InsuranceController>(InsuranceController);
    insuranceService = app.get<InsuranceService>(InsuranceService);
  });

  it('get insurances', async () => {
    const response: CareRequestAPIResponse<Insurance[]> = {
      data: [MOCK_INSURANCE],
      success: true,
    };
    jest
      .spyOn(insuranceService, 'fetch')
      .mockImplementation(() => Promise.resolve([MOCK_INSURANCE]));

    expect(await controller.fetch(MOCK_INSURANCE_QUERY_DTO)).toStrictEqual(
      response
    );
    expect(insuranceService.fetch).toBeCalled();
  });

  it('create insurance', async () => {
    const response: CareRequestAPIResponse<Insurance> = {
      data: MOCK_INSURANCE,
      success: true,
    };
    jest
      .spyOn(insuranceService, 'create')
      .mockImplementation(() => Promise.resolve(MOCK_INSURANCE));

    expect(
      await controller.create(MOCK_INSURANCE_QUERY_DTO, MOCK_INSURANCE_PARAMS)
    ).toStrictEqual(response);
    expect(insuranceService.create).toBeCalled();
  });

  it('update insurance', async () => {
    const insuranceId = 402998;

    const response: CareRequestAPIResponse<Insurance> = {
      data: MOCK_INSURANCE,
      success: true,
    };
    jest
      .spyOn(insuranceService, 'update')
      .mockImplementation(() => Promise.resolve(MOCK_INSURANCE));

    expect(
      await controller.update(
        MOCK_INSURANCE_QUERY_DTO,
        insuranceId.toString(),
        MOCK_INSURANCE_BODY
      )
    ).toStrictEqual(response);
    expect(insuranceService.update).toBeCalled();
  });

  it('get insurances eligibility', async () => {
    const response: CareRequestAPIResponse<InsuranceEligibility[]> = {
      data: [MOCK_RESULT_ELIGIBILITY],
      success: true,
    };
    jest
      .spyOn(insuranceService, 'checkEligibility')
      .mockImplementation(() => Promise.resolve([MOCK_RESULT_ELIGIBILITY]));

    expect(
      await controller.checkEligibility(MOCK_INSURANCE_QUERY_DTO)
    ).toStrictEqual(response);
    expect(insuranceService.checkEligibility).toBeCalled();
  });

  it('get self uploaded insurance', async () => {
    const careRequestId = 637526;

    const response: CareRequestAPIResponse<SelfUploadInsurance> = {
      data: MOCK_RESULT_SELF_UPLOADED_INSURANCE,
      success: true,
    };
    jest
      .spyOn(insuranceService, 'getSelfUploadInsurance')
      .mockImplementation(() =>
        Promise.resolve(MOCK_RESULT_SELF_UPLOADED_INSURANCE)
      );

    expect(await controller.selfUploadInsurance(careRequestId)).toStrictEqual(
      response
    );
    expect(insuranceService.getSelfUploadInsurance).toBeCalled();
  });

  it('get insurances HttpException', async () => {
    jest.spyOn(insuranceService, 'fetch').mockImplementation(() => {
      throw new Error();
    });

    await expect(async () =>
      controller.fetch(MOCK_INSURANCE_QUERY_DTO)
    ).rejects.toThrow(HttpException);
  });

  it('create insurance HttpException', async () => {
    const requestQuery = {
      patientId: 407474,
      careRequestId: null,
      marketId: 159,
    };

    jest
      .spyOn(insuranceService, 'create')
      .mockImplementation(() => Promise.resolve(MOCK_INSURANCE));

    await expect(async () =>
      controller.create(requestQuery, MOCK_INSURANCE_PARAMS)
    ).rejects.toThrow(HttpException);
  });

  it('update insurance HttpException', async () => {
    const requestQuery = {
      patientId: 407474,
      careRequestId: null,
      marketId: 159,
    };
    const insuranceId = 402998;

    jest.spyOn(insuranceService, 'update').mockImplementation(() => {
      throw new Error();
    });

    await expect(async () =>
      controller.update(
        requestQuery,
        insuranceId.toString(),
        MOCK_INSURANCE_BODY
      )
    ).rejects.toThrow(HttpException);
  });

  it('get insurances eligibility HttpException', async () => {
    jest.spyOn(insuranceService, 'checkEligibility').mockImplementation(() => {
      throw new Error();
    });

    await expect(async () =>
      controller.checkEligibility(MOCK_INSURANCE_QUERY_DTO)
    ).rejects.toThrow(HttpException);
  });

  it('get self uploaded insurance HttpException', async () => {
    const careRequestId = 637526;

    jest
      .spyOn(insuranceService, 'getSelfUploadInsurance')
      .mockImplementation(() => {
        throw new Error();
      });

    await expect(async () =>
      controller.selfUploadInsurance(careRequestId)
    ).rejects.toThrow(HttpException);
  });

  it('get self uploaded insurance NotFound', async () => {
    const careRequestId = 123123;

    const response: CareRequestAPIResponse<SelfUploadInsurance> = {
      data: null,
      success: true,
    };
    jest
      .spyOn(insuranceService, 'getSelfUploadInsurance')
      .mockImplementation(() => Promise.resolve(null));

    expect(await controller.selfUploadInsurance(careRequestId)).toStrictEqual(
      response
    );
  });

  it('get insurance classification HttpException', async () => {
    jest
      .spyOn(insuranceService, 'getClassifications')
      .mockImplementation(() => {
        throw new Error();
      });

    await expect(async () =>
      controller.getInsuranceClassifications()
    ).rejects.toThrow(HttpException);
  });

  it('get insurance classification empty list', async () => {
    const response: CareRequestAPIResponse<InsuranceClassification[]> = {
      data: [],
      success: true,
    };
    jest
      .spyOn(insuranceService, 'getClassifications')
      .mockImplementation(() => Promise.resolve([]));

    await expect(
      controller.getInsuranceClassifications()
    ).resolves.toStrictEqual(response);
  });

  it('get insurance classification list', async () => {
    const response: CareRequestAPIResponse<InsuranceClassification[]> = {
      data: MOCK_INSURANCE_CLASSIFICATION,
      success: true,
    };
    jest
      .spyOn(insuranceService, 'getClassifications')
      .mockResolvedValue(MOCK_INSURANCE_CLASSIFICATION);

    expect(await controller.getInsuranceClassifications()).toStrictEqual(
      response
    );
  });
});

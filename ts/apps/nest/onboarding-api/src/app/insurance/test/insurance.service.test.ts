import { HttpModule, HttpService } from '@nestjs/axios';
import {
  HttpException,
  INestApplication,
  InternalServerErrorException,
} from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_INSURANCE,
  MOCK_ELIGIBILITY_STATION_RESPONSE,
  MOCK_INSURANCE_PARAMS,
  MOCK_INSURANCE_QUERY_DTO,
  MOCK_FETCH_INSURANCE_RESPONSE,
  MOCK_STATION_FETCH_INSURANCE_RESPONSE,
  MOCK_ELIGIBILITY_RESPONSE,
  MOCK_RESULT_SELF_UPLOADED_INSURANCE,
  MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE,
  MOCK_EXPECTED_UPDATE_INSURANCE,
  MOCK_STATION_INSURANCE,
} from './mocks/insurance.mock';
import InsuranceService from '../insurance.service';
import LoggerModule from '../../logger/logger.module';
import mapper from '../insurance.mapper';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mockLogger } from '../../logger/mocks/logger.mock';
import { mockAuthService } from '../../common/mocks/auth.mock';
import StationService from '../../station/station.service';
import { MOCK_INSURANCE_CLASSIFICATION } from '../../self-schedule/test/mocks/self-schedule.mock';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';

describe(`${InsuranceService.name}`, () => {
  let app: INestApplication;
  let insuranceService: InsuranceService;
  let httpService: HttpService;
  let stationService: StationService;
  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'InsuranceParamsToStationInsuranceParams'
  );
  const spyMapperResponse = jest.spyOn(mapper, 'StationInsuranceToInsurance');
  const spyMapperInsuranceEligibilityResponse = jest.spyOn(
    mapper,
    'StationInsuranceEligibilityToInsuranceEligibility'
  );
  const spyMapperSelfUploadInsuranceResponse = jest.spyOn(
    mapper,
    'StationSelfUploadInsuranceToSelfUploadInsurance'
  );

  beforeAll(async () => {
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [InsuranceService, StationService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    insuranceService = module.get<InsuranceService>(InsuranceService);
    stationService = module.get<StationService>(StationService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${InsuranceService.prototype.create.name}`, () => {
    it('create an insurance', async () => {
      const insuranceResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_STATION_INSURANCE
      );
      const mockCreateInsuranceResponseEligible = {
        ...MOCK_INSURANCE,
        eligibilityMessage: '',
        eligible: '',
      };
      const eligiblityResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_ELIGIBILITY_STATION_RESPONSE
      );

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(insuranceResponse));

      const httpPatchSpy = jest.spyOn(httpService, 'patch');
      httpPatchSpy.mockImplementationOnce(() => of(eligiblityResponse));

      const result = await insuranceService.create(
        { patientId: '1234', marketId: '1235', careRequestId: '1236' },
        MOCK_INSURANCE_PARAMS
      );
      expect(result).toEqual(mockCreateInsuranceResponseEligible);
      expect(spyMapperQueryParams).toHaveBeenCalledWith(MOCK_INSURANCE_PARAMS);
      expect(spyMapperResponse).toHaveBeenCalledWith(MOCK_STATION_INSURANCE);
    });

    it('creates an insurance with failed eligibility check', async () => {
      const insuranceResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_STATION_INSURANCE
      );

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(insuranceResponse));

      const httpPatchSpy = jest.spyOn(httpService, 'patch');
      httpPatchSpy.mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });

      expect(mockLogger.error).toHaveBeenCalledTimes(0);

      const result = await insuranceService.create(
        MOCK_INSURANCE_QUERY_DTO,
        MOCK_INSURANCE_PARAMS
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Insurance create - eligibility error: Internal Server Error',
        [MOCK_STATION_INSURANCE.id, MOCK_INSURANCE_QUERY_DTO]
      );

      expect(result).toEqual(MOCK_INSURANCE);
    });
  });

  describe(`${InsuranceService.prototype.update.name}`, () => {
    it('update an insurance', async () => {
      const insuranceResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_STATION_INSURANCE
      );

      jest
        .spyOn(httpService, 'put')
        .mockImplementationOnce(() => of(insuranceResponse));

      const result = await insuranceService.update(
        { patientId: '1234', marketId: '1235', careRequestId: '1236' },
        '1237',
        MOCK_INSURANCE
      );

      expect(result).toEqual(MOCK_INSURANCE);
      expect(httpService.put).toBeCalledWith(
        `${process.env.STATION_URL}/api/patients/1234/insurances/1237`,
        MOCK_EXPECTED_UPDATE_INSURANCE,
        {
          headers: {
            Accept: 'application/vnd.*company-data-covered*.com; version=1',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  describe(`${InsuranceService.prototype.fetch.name}`, () => {
    it('should fetch an insurance', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() =>
          of(wrapInAxiosResponse(MOCK_STATION_FETCH_INSURANCE_RESPONSE))
        );

      const result = await insuranceService.fetch(MOCK_INSURANCE_QUERY_DTO);
      expect(result).toEqual(MOCK_FETCH_INSURANCE_RESPONSE);
      expect(spyMapperResponse).toHaveBeenCalledWith(MOCK_STATION_INSURANCE);
    });
  });

  describe(`${InsuranceService.prototype.remove.name}`, () => {
    it('should delete an insurance', async () => {
      jest.spyOn(httpService, 'delete').mockImplementation(() =>
        of(
          wrapInAxiosResponse({
            success: true,
            data: {},
          })
        )
      );

      const result = await insuranceService.remove('id', 'id');
      expect(result.success).toEqual(true);
    });

    it('should throw error', async () => {
      jest.spyOn(httpService, 'delete').mockImplementation(() => {
        throw new Error();
      });

      await expect(async () => {
        await insuranceService.remove('id', 'id');
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${InsuranceService.prototype.checkEligibility.name}`, () => {
    it('should return insurance eligibility', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementation(() =>
          of(wrapInAxiosResponse(MOCK_ELIGIBILITY_STATION_RESPONSE))
        );

      const result = await insuranceService.checkEligibility(
        'id',
        'id',
        'id',
        'id'
      );
      expect(result).toEqual(MOCK_ELIGIBILITY_RESPONSE);
      expect(spyMapperInsuranceEligibilityResponse).toHaveBeenCalled();
    });
  });

  describe(`${InsuranceService.prototype.getSelfUploadInsurance.name}`, () => {
    it('should return self uploaded insurance', async () => {
      jest
        .spyOn(httpService, 'get')
        .mockImplementation(() =>
          of(wrapInAxiosResponse(MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE))
        );

      const result = await insuranceService.getSelfUploadInsurance(637526);
      expect(result).toEqual(MOCK_RESULT_SELF_UPLOADED_INSURANCE);
      expect(spyMapperSelfUploadInsuranceResponse).toHaveBeenCalledWith(
        MOCK_STATION_RESULT_SELF_UPLOADED_INSURANCE
      );
    });
  });

  describe(`${InsuranceService.prototype.getClassifications.name}`, () => {
    it('should return all insurance classifications', async () => {
      jest
        .spyOn(stationService, 'getClassifications')
        .mockResolvedValue(MOCK_INSURANCE_CLASSIFICATION);

      const result = await insuranceService.getClassifications();
      expect(result).toEqual(MOCK_INSURANCE_CLASSIFICATION);
    });

    it('should return empty insurance classification data', async () => {
      jest.spyOn(stationService, 'getClassifications').mockResolvedValue([]);

      const result = await insuranceService.getClassifications();
      expect(result).toEqual([]);
    });
  });
});

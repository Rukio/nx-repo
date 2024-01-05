import {
  BadRequestException,
  CacheModule,
  INestApplication,
} from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import {
  Patient,
  PatientSearchParam,
  StationPatient,
} from '@*company-data-covered*/consumer-web-types';
import { CacheConfigService } from '../../common/cache.config.service';
import PatientService from '../patient.service';

import {
  CREATE_PATIENT_MOCK,
  PATIENT_MOCK,
  PATIENT_RESULT_MOCK,
  PATIENT_SEARCH_PARAM_MOCK,
  STATION_PATIENT_MOCK,
  UPDATE_PATIENT_MOCK,
  CREATE_GRPC_PATIENT_RESPONSE_MOCK,
  EHR_PARAMS_MOCK,
  EHR_PATIENTS_SEARCH_RESULT_MOCK,
  PATIENTS_SEARCH_RESULT_MOCK,
  STATION_EHR_PATIENT_SEARCH_RESULT_MOCK,
  STATION_PATIENT_SEARCH_RESULT_MOCK,
  STATION_PATIENT_UPDATE_MOCK,
  UPDATE_PATIENT_RESULT_MOCK,
  CREATE_PATIENT_TRANSFORMED_MOCK,
  PATIENT_ID_MOCK,
  GET_GRPC_PATIENT_RESPONSE_MOCK,
  GET_PATIENT_TRANSFORMED_MOCK,
  UPDATE_GRPC_PATIENT_RESPONSE_MOCK,
  UPDATE_PATIENT_TRANSFORMED_MOCK,
  UPDATE_PATIENT_WITHOUT_CONSISTENCY_TOKEN_MOCK,
  SEARCH_GRPC_PATIENTS_RESPONSE_MOCK,
  PATIENTS_SEARCH_TRANSFORMED_RESULT_MOCK,
  PATIENT_SEARCH_PARAM_WITH_OFFSET_MOCK,
  PATIENTS_SEARCH_TRANSFORMED_RESULT_WITH_OFFSET_MOCK,
  SEARCH_GRPC_PATIENTS_EMPTY_RESPONSE_MOCK,
  SEARCH_GRPC_PATIENTS_WITHOUT_LIST_RESPONSE_MOCK,
  PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK,
  PATIENTS_SEARCH_SORTED_TRANSFORMED_RESULT_WITH_OFFSET_MOCK,
  SEARCH_GRPC_PATIENTS_WITH_ID_RESPONSE_MOCK,
  PATIENT_SEARCH_SORTED_PARAM_MOCK,
  STATION_WEB_REQUEST_PATIENT_MOCK,
  WEB_REQUEST_PATIENT_MOCK,
  STATION_PATIENT_WITH_LAST_REQUEST_MOCK,
  PATIENT_RESULT_WITH_LAST_REQUEST_MOCK,
  UPDATE_UNVERIFIED_GRPC_PATIENT_RESPONSE_MOCK,
  UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK,
  INSURANCE_PARAMS_MOCK,
  INSURANCE_RESPONSE_MOCK,
  GET_OR_CREATE_GRPC_PATIENT_RESPONSE_MOCK,
  LIST_INSURANCE_RESPONSE_MOCK,
  LIST_INSURANCE_RESPONSE_WITHOUT_INSURANCE_PLAN_ID_MOCK,
} from './mocks/patient.service.mock';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import { mockAuthService } from '../../common/mocks/auth.mock';

import { PATIENTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/service';

import mapper from '../patient.mapper';
import UpdatePatientDto from '../dto/update-patient.dto';
import CreateEhrPatientDto from '../dto/create-ehr-patient.dto';
import {
  GRPC_CREATE_UNVERIFIED_RESPONSE,
  UNVERIFIED_PATIENT_MOCK,
  PATIENT_INSURANCE_MOCK,
  UNVERIFIED_PATIENT_MOCK_WITHOUT_CONSISTENCY_TOKEN,
  PATIENT_INSURANCE_WITHOUT_INSURANCE_PLAN_ID_MOCK,
} from './mocks/patient.mapper.mock';
import {
  INSURANCE_ID_MOCK,
  INSURANCE_QUERY_DTO_MOCK,
} from '../../patient-accounts/test/mocks/patient-accounts.controller.mock';
import LoggerModule from '../../logger/logger.module';
import { mockLogger } from '../../logger/mocks/logger.mock';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import InsuranceNetworksService from '../../insurance-networks/insurance-networks.service';
import { AxiosResponse } from 'axios';
import { MOCK_SERVICES_INSURANCE_NETWORKS_RESPONSE } from '../../insurance-networks/test/mocks/insurance-networks.mock';

const grpcHealthCheckMock = jest.fn(() => of(true));
const grpcCreatePatientMock = jest.fn(() =>
  of(CREATE_GRPC_PATIENT_RESPONSE_MOCK)
);
const grpcGetPatientMock = jest.fn(() => of(GET_GRPC_PATIENT_RESPONSE_MOCK));
const grpcUpdatePatientMock = jest.fn(() =>
  of(UPDATE_GRPC_PATIENT_RESPONSE_MOCK)
);
const grpcCreateUnverifiedPatientMock = jest.fn(() =>
  of(GRPC_CREATE_UNVERIFIED_RESPONSE)
);
const grocUpdateUnverifiedPatientMock = jest.fn(() =>
  of(UPDATE_UNVERIFIED_GRPC_PATIENT_RESPONSE_MOCK)
);
const grpcCreateEhrRecordMock = jest.fn(() =>
  of(GET_OR_CREATE_GRPC_PATIENT_RESPONSE_MOCK)
);
const grpcSearchPatientsMock = jest.fn(() =>
  of(SEARCH_GRPC_PATIENTS_RESPONSE_MOCK)
);
const grpcCreateInsuranceMock = jest.fn(() => of(INSURANCE_RESPONSE_MOCK));
const grpcGetInsuranceListMock = jest.fn(() =>
  of(LIST_INSURANCE_RESPONSE_MOCK)
);

const grpcUpdateInsuranceMock = jest.fn(() => of(INSURANCE_RESPONSE_MOCK));

const grpcTriggerPatientInsuranceEligibilityCheck = jest.fn(() => of(true));

const grpcGetInsuranceMock = jest.fn(() => of(INSURANCE_RESPONSE_MOCK));

const grpcDeleteInsuranceMock = jest.fn(() => of(true));

const grpcClient = {
  getService: jest.fn(() => ({
    healthCheck: grpcHealthCheckMock,
    createPatient: grpcCreatePatientMock,
    getPatient: grpcGetPatientMock,
    updatePatient: grpcUpdatePatientMock,
    updateUnverifiedPatient: grocUpdateUnverifiedPatientMock,
    searchPatients: grpcSearchPatientsMock,
    createUnverifiedPatient: grpcCreateUnverifiedPatientMock,
    createInsurance: grpcCreateInsuranceMock,
    updateInsurance: grpcUpdateInsuranceMock,
    triggerPatientInsuranceEligibilityCheck:
      grpcTriggerPatientInsuranceEligibilityCheck,
    getInsurance: grpcGetInsuranceMock,
    findOrCreatePatientForUnverifiedPatient: grpcCreateEhrRecordMock,
    listInsurances: grpcGetInsuranceListMock,
    deleteInsurance: grpcDeleteInsuranceMock,
  })),
};

jest.mock(
  '@nestjs/microservices',
  jest.fn(() => ({
    Transport: {},
    ClientGrpc: jest.fn(() => grpcClient),
    ClientProxyFactory: {
      create: jest.fn(() => grpcClient),
    },
  }))
);

describe(`${PatientService.name}`, () => {
  let app: INestApplication;
  let patientService: PatientService;
  let httpService: HttpService;
  const OLD_ENV = process.env;
  const spyMapperQueryParams = jest.spyOn(
    mapper,
    'SearchPatientToStationSearchPatient'
  );
  const spyMapperResponse = jest.spyOn(mapper, 'StationPatientToPatient');

  beforeAll(async () => {
    const mockPatientServiceProvider = {
      provide: PATIENTS_PACKAGE_NAME,
      useFactory: () => ({
        getService: grpcClient.getService,
      }),
    };

    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [
        PatientService,
        mockPatientServiceProvider,
        InsuranceNetworksService,
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
      .overrideProvider(WINSTON_MODULE_PROVIDER)
      .useValue(mockLogger)
      .compile();

    httpService = module.get<HttpService>(HttpService);
    patientService = module.get<PatientService>(PatientService);

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    spyMapperQueryParams.mockClear();
    spyMapperResponse.mockClear();
    grpcCreatePatientMock.mockClear();
    grpcGetPatientMock.mockClear();
    grpcUpdatePatientMock.mockClear();
    grpcSearchPatientsMock.mockClear();
    grocUpdateUnverifiedPatientMock.mockClear();
    grpcGetInsuranceListMock.mockClear();
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
  });

  afterAll(async () => {
    process.env = OLD_ENV;
    await app.close();
  });

  describe(`${PatientService.prototype.createStationPatient.name}`, () => {
    it('should return patient after create', async () => {
      const mockData: Patient = PATIENT_MOCK;
      const mockResult: Patient = PATIENT_RESULT_MOCK;
      const stationPatient: StationPatient = STATION_PATIENT_MOCK;
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationPatient)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.createStationPatient(mockData);
      expect(response).toEqual(mockResult);
    });
  });

  describe(`${PatientService.prototype.updateStationPatient.name}`, () => {
    it('should return patient after update', async () => {
      const mockData: UpdatePatientDto = UPDATE_PATIENT_MOCK;
      const mockResult: Patient = UPDATE_PATIENT_RESULT_MOCK;
      const stationPatient: StationPatient = STATION_PATIENT_UPDATE_MOCK;
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationPatient)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.updateStationPatient(
        mockData.id,
        mockData
      );
      expect(response).toEqual(mockResult);
    });
  });

  describe(`${PatientService.prototype.searchStationPatients.name}`, () => {
    it('should return list of patients', async () => {
      const mockData: PatientSearchParam = PATIENT_SEARCH_PARAM_MOCK;
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_PATIENT_SEARCH_RESULT_MOCK))
        );
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.searchStationPatients(mockData);
      expect(response).toEqual(PATIENTS_SEARCH_RESULT_MOCK);
    });
  });

  describe(`${PatientService.prototype.getEHRPatient.name}`, () => {
    it('should return list of EHR patients', async () => {
      const patientId = 123;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_EHR_PATIENT_SEARCH_RESULT_MOCK))
        );
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.getEHRPatient(patientId);
      expect(response).toEqual(EHR_PATIENTS_SEARCH_RESULT_MOCK);
    });
  });

  describe(`${PatientService.prototype.createEHR.name}`, () => {
    it('should return patient after create EHR', async () => {
      const patientId = 123;
      const mockData: CreateEhrPatientDto = EHR_PARAMS_MOCK;
      const mockResult: Patient = PATIENT_RESULT_MOCK;
      const stationPatient: StationPatient = STATION_PATIENT_MOCK;
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationPatient)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.createEHR(patientId, mockData);
      expect(response).toEqual(mockResult);
    });
  });

  describe(`${PatientService.prototype.gRPCHealthCheck.name}`, () => {
    it('success response', async () => {
      expect(grpcHealthCheckMock).not.toBeCalled();
      expect(await patientService.gRPCHealthCheck()).toEqual('Success!');
      expect(grpcHealthCheckMock).toHaveBeenCalledTimes(1);
      expect(mockAuthService.getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.createGrpcPatient.name}`, () => {
    it('create gRPC Patient', async () => {
      expect(grpcCreatePatientMock).not.toBeCalled();
      expect(
        await patientService.createGrpcPatient(CREATE_PATIENT_MOCK)
      ).toEqual(CREATE_PATIENT_TRANSFORMED_MOCK);
      expect(grpcCreatePatientMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.getStationPatient.name}`, () => {
    it('should return patient', async () => {
      const mockResult: Patient = PATIENT_RESULT_MOCK;
      const stationPatient: StationPatient = STATION_PATIENT_MOCK;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationPatient)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.getStationPatient(PATIENT_ID_MOCK);
      expect(response).toEqual(mockResult);
    });

    it('should return patient with last request', async () => {
      const mockResult: Patient = PATIENT_RESULT_WITH_LAST_REQUEST_MOCK;
      const stationPatient: StationPatient =
        STATION_PATIENT_WITH_LAST_REQUEST_MOCK;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(stationPatient)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.getStationPatient(PATIENT_ID_MOCK);
      expect(response).toEqual(mockResult);
    });
  });

  describe(`${PatientService.prototype.getGrpcPatient.name}`, () => {
    it('get gRPC Patient', async () => {
      expect(grpcGetPatientMock).not.toBeCalled();
      const res = await patientService.getGrpcPatient(PATIENT_ID_MOCK);
      expect(res).toEqual(GET_PATIENT_TRANSFORMED_MOCK);
      expect(grpcGetPatientMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.updateGrpcPatient.name}`, () => {
    it('update gRPC Patient', async () => {
      expect(grpcUpdatePatientMock).not.toBeCalled();
      const res = await patientService.updateGrpcPatient(
        PATIENT_ID_MOCK,
        UPDATE_PATIENT_MOCK
      );
      expect(res).toEqual(UPDATE_PATIENT_TRANSFORMED_MOCK);
      expect(grpcUpdatePatientMock).toHaveBeenCalledTimes(1);
    });

    it('throw error on update gRPC Patient without consistency token', async () => {
      expect(grpcUpdatePatientMock).not.toBeCalled();
      const serviceFunction = patientService.updateGrpcPatient(
        PATIENT_ID_MOCK,
        UPDATE_PATIENT_WITHOUT_CONSISTENCY_TOKEN_MOCK
      );
      await expect(serviceFunction).rejects.toThrow(BadRequestException);
      await expect(serviceFunction).rejects.toThrow(
        'Field consistencyToken is required.'
      );
      expect(grpcUpdatePatientMock).toHaveBeenCalledTimes(0);
    });
  });

  describe(`${PatientService.prototype.updateGrpcUnverifiedPatient.name}`, () => {
    it('update unverified Patient', async () => {
      expect(grocUpdateUnverifiedPatientMock).not.toBeCalled();
      const res = await patientService.updateGrpcUnverifiedPatient(
        PATIENT_ID_MOCK,
        UNVERIFIED_PATIENT_MOCK
      );
      expect(res).toEqual(UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK);
      expect(grocUpdateUnverifiedPatientMock).toHaveBeenCalledTimes(1);
    });

    it('throw error on update gRPC Patient without consistency token', async () => {
      expect(grocUpdateUnverifiedPatientMock).not.toBeCalled();
      const serviceFunction = patientService.updateGrpcUnverifiedPatient(
        PATIENT_ID_MOCK,
        UNVERIFIED_PATIENT_MOCK_WITHOUT_CONSISTENCY_TOKEN
      );
      await expect(serviceFunction).rejects.toThrow(BadRequestException);
      await expect(serviceFunction).rejects.toThrow(
        'Field consistencyToken is required.'
      );
      expect(grocUpdateUnverifiedPatientMock).toHaveBeenCalledTimes(0);
    });
  });

  describe(`${PatientService.prototype.searchGrpcPatients.name}`, () => {
    it('search gRPC Patients', async () => {
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_PARAM_MOCK
      );
      expect(res).toEqual(PATIENTS_SEARCH_TRANSFORMED_RESULT_MOCK);
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });

    it('search gRPC Patients with zip code and date of birth', async () => {
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK
      );
      expect(res).toEqual(PATIENTS_SEARCH_TRANSFORMED_RESULT_MOCK);
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });

    it('search gRPC Patients result should be sorted by id', async () => {
      grpcSearchPatientsMock.mockImplementationOnce(() =>
        of(SEARCH_GRPC_PATIENTS_WITH_ID_RESPONSE_MOCK)
      );
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_SORTED_PARAM_MOCK
      );
      expect(res).toEqual(
        PATIENTS_SEARCH_SORTED_TRANSFORMED_RESULT_WITH_OFFSET_MOCK
      );
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });

    it('search gRPC Patients with limit and offset', async () => {
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_PARAM_WITH_OFFSET_MOCK
      );
      expect(res).toEqual(PATIENTS_SEARCH_TRANSFORMED_RESULT_WITH_OFFSET_MOCK);
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });

    it('search gRPC Patients result with empty array', async () => {
      grpcSearchPatientsMock.mockImplementationOnce(() =>
        of(SEARCH_GRPC_PATIENTS_EMPTY_RESPONSE_MOCK)
      );
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_PARAM_WITH_OFFSET_MOCK
      );
      expect(res).toEqual([]);
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });

    it('search gRPC Patients result with undefined array', async () => {
      grpcSearchPatientsMock.mockImplementationOnce(() =>
        of(SEARCH_GRPC_PATIENTS_WITHOUT_LIST_RESPONSE_MOCK)
      );
      expect(grpcSearchPatientsMock).not.toBeCalled();
      const res = await patientService.searchGrpcPatients(
        PATIENT_SEARCH_PARAM_WITH_OFFSET_MOCK
      );
      expect(res).toEqual([]);
      expect(grpcSearchPatientsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.fetchWebRequestPatient.name}`, () => {
    it('should return web request patient', async () => {
      const careRequestId = 1;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(STATION_WEB_REQUEST_PATIENT_MOCK))
        );
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.fetchWebRequestPatient(
        careRequestId
      );
      expect(response).toEqual(WEB_REQUEST_PATIENT_MOCK);
    });

    it('empty response from fetch web request patient function', async () => {
      const careRequestId = 1557513;
      jest
        .spyOn(httpService, 'get')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(null)));
      expect(spyMapperQueryParams).toHaveBeenCalledTimes(0);
      expect(spyMapperResponse).toHaveBeenCalledTimes(0);
      const response = await patientService.fetchWebRequestPatient(
        careRequestId
      );
      expect(response).toEqual(null);
    });
  });

  describe(`${PatientService.prototype.createUnverifiedPatient.name}`, () => {
    it('create unverified patient', async () => {
      expect(grpcCreateUnverifiedPatientMock).not.toBeCalled();
      const res = await patientService.createUnverifiedPatient(
        UNVERIFIED_PATIENT_MOCK
      );
      expect(res).toEqual(UNVERIFIED_PATIENT_MOCK);
      expect(grpcCreateUnverifiedPatientMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.createInsurance.name}`, () => {
    it('create patient insurance', async () => {
      expect(grpcCreateInsuranceMock).not.toBeCalled();
      expect(
        await patientService.createInsurance(
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_PARAMS_MOCK
        )
      ).toEqual(PATIENT_INSURANCE_MOCK);
      expect(grpcCreateInsuranceMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.updateInsurance.name}`, () => {
    it('update patient insurance', async () => {
      expect(grpcUpdateInsuranceMock).not.toBeCalled();
      await expect(
        patientService.updateInsurance(
          INSURANCE_QUERY_DTO_MOCK,
          '1',
          INSURANCE_PARAMS_MOCK
        )
      ).resolves.toEqual(PATIENT_INSURANCE_MOCK);
      expect(grpcUpdateInsuranceMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.checkEligibility.name}`, () => {
    it('should check insurance eligibility', async () => {
      expect(grpcTriggerPatientInsuranceEligibilityCheck).not.toBeCalled();
      expect(grpcGetInsuranceMock).not.toBeCalled();
      await expect(
        patientService.checkEligibility(INSURANCE_QUERY_DTO_MOCK, '1')
      ).resolves.toEqual(PATIENT_INSURANCE_MOCK);
      expect(grpcTriggerPatientInsuranceEligibilityCheck).toHaveBeenCalledTimes(
        1
      );
      expect(grpcGetInsuranceMock).toHaveBeenCalledTimes(1);
    });

    it('throws ServiceUnavailableException when triggerPatientInsuranceEligibilityCheck fails', async () => {
      grpcTriggerPatientInsuranceEligibilityCheck.mockReturnValueOnce(
        throwError(new Error('Failed to trigger eligibility check'))
      );

      await patientService.checkEligibility(INSURANCE_QUERY_DTO_MOCK, '1');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to trigger patient insurance eligibility check for patient ID: 407474, insurance ID: 1. Error: Failed to trigger eligibility check'
      );
    });
  });

  describe(`${PatientService.prototype.createEhrRecord.name}`, () => {
    it('create ehr record', async () => {
      expect(grpcCreateEhrRecordMock).not.toBeCalled();
      const res = await patientService.createEhrRecord({
        unverifiedPatientId: PATIENT_ID_MOCK,
        billingCityId: 1,
      });
      expect(res).toEqual(GET_PATIENT_TRANSFORMED_MOCK);
      expect(grpcCreateEhrRecordMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientService.prototype.listInsurances.name}`, () => {
    it('get patient insurance list', async () => {
      const insuranceNetworkResponse: AxiosResponse = wrapInAxiosResponse(
        MOCK_SERVICES_INSURANCE_NETWORKS_RESPONSE
      );

      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() => of(insuranceNetworkResponse));

      expect(grpcGetInsuranceListMock).not.toBeCalled();
      await expect(patientService.listInsurances('1157870')).resolves.toEqual([
        PATIENT_INSURANCE_MOCK,
      ]);
      expect(grpcGetInsuranceListMock).toHaveBeenCalledTimes(1);
    });

    it('get patient insurance list without insurance plan id', async () => {
      grpcGetInsuranceListMock.mockImplementationOnce(() =>
        of(LIST_INSURANCE_RESPONSE_WITHOUT_INSURANCE_PLAN_ID_MOCK)
      );

      await expect(patientService.listInsurances('1157870')).resolves.toEqual([
        PATIENT_INSURANCE_WITHOUT_INSURANCE_PLAN_ID_MOCK,
      ]);
      expect(grpcGetInsuranceListMock).toHaveBeenCalledTimes(1);
    });

    it('get patient insurance list with undefined response', async () => {
      grpcGetInsuranceListMock.mockImplementationOnce(() => of(undefined));
      await expect(patientService.listInsurances('1157870')).resolves.toEqual(
        []
      );
    });

    it('get patient insurance list with empty response', async () => {
      grpcGetInsuranceListMock.mockImplementationOnce(() =>
        of({ results: undefined })
      );
      await expect(patientService.listInsurances('1157870')).resolves.toEqual(
        []
      );
    });
  });

  describe(`${PatientService.prototype.deleteInsurance.name}`, () => {
    it('should delete patient insurance', async () => {
      expect(grpcDeleteInsuranceMock).not.toBeCalled();
      await expect(
        patientService.deleteInsurance(
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_ID_MOCK
        )
      ).resolves.toEqual({
        success: true,
      });
      expect(grpcDeleteInsuranceMock).toHaveBeenCalledTimes(1);
    });

    it('should throw an error', async () => {
      const mockDetails = "insurance doesn't exist";
      const mockError = { details: mockDetails };

      grpcDeleteInsuranceMock.mockReturnValueOnce(throwError(mockError));

      await expect(
        patientService.deleteInsurance(
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_ID_MOCK
        )
      ).rejects.toThrow("insurance doesn't exist");
    });
  });
});

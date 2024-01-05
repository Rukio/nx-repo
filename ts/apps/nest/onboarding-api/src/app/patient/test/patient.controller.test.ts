import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { mockDeep, mockReset } from 'jest-mock-extended';
import PatientController from '../patient.controller';
import PatientService from '../patient.service';
import { CacheConfigService } from '../../common/cache.config.service';
import LoggerModule from '../../logger/logger.module';
import {
  PATIENT_BILLING_CITY_ID_MOCK,
  PATIENT_EHR_MOCK,
  PATIENT_ID_MOCK,
  PATIENT_MOCK,
  PATIENT_RESULT_MOCK,
  PATIENT_SEARCH_PARAM_MOCK,
  SECOND_PATIENT_MOCK,
  UPDATE_PATIENT_MOCK,
  PATIENTS_SEARCH_RESULT_MOCK,
  REQUEST_MOCK,
  PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK,
  WEB_REQUEST_PATIENT_MOCK,
  PATIENT_RESULT_WITH_LAST_REQUEST_MOCK,
} from './mocks/patient.controller.mock';
import StatsigService from '../../statsig/statsig.service';
import { StatsigModuleOptions } from '../../statsig/interfaces';
import StatsigModule from '../../statsig/statsig.module';

describe('PatientController tests', () => {
  let controller: PatientController;
  const mockPatientService = mockDeep<PatientService>();

  const OLD_ENV = process.env;

  const config: StatsigModuleOptions = {
    secretApiKey: 'secret-12345678',
    options: {
      localMode: true,
    },
  };

  beforeAll(async () => {
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [PatientService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        StatsigModule.forRootAsync({
          useFactory: () => config,
        }),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(PatientService)
      .useValue(mockPatientService)
      .compile();

    controller = app.get<PatientController>(PatientController);
  });

  beforeEach(async () => {
    mockReset(mockPatientService);
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onboarding patient service toggle is closed', () => {
    describe(`${PatientController.prototype.create.name}`, () => {
      it('create patient', async () => {
        mockPatientService.createStationPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        expect(
          await controller.create(REQUEST_MOCK, PATIENT_MOCK)
        ).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
      });

      it('throw error on create', async () => {
        mockPatientService.createStationPatient.mockImplementation(() => {
          throw new Error('error');
        });

        await expect(async () => {
          await controller.create(PATIENT_MOCK, PATIENT_MOCK);
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.update.name}`, () => {
      it('update patient', async () => {
        mockPatientService.updateStationPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        const result = await controller.update(
          REQUEST_MOCK,
          PATIENT_ID_MOCK,
          UPDATE_PATIENT_MOCK
        );
        expect(result).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
      });

      it('throw error on update', async () => {
        mockPatientService.updateStationPatient.mockImplementation(() => {
          throw new Error();
        });
        await expect(async () => {
          await controller.update(
            REQUEST_MOCK,
            PATIENT_ID_MOCK,
            UPDATE_PATIENT_MOCK
          );
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.search.name}`, () => {
      it('search patient', async () => {
        mockPatientService.searchStationPatients.mockResolvedValue([
          PATIENT_RESULT_MOCK,
          SECOND_PATIENT_MOCK,
        ]);
        expect(
          await controller.search(REQUEST_MOCK, PATIENT_SEARCH_PARAM_MOCK)
        ).toEqual({
          success: true,
          data: [PATIENT_RESULT_MOCK, SECOND_PATIENT_MOCK],
        });
      });

      it('throw error on search', async () => {
        mockPatientService.searchStationPatients.mockImplementation(() => {
          throw new Error();
        });

        await expect(async () => {
          await controller.search(REQUEST_MOCK, PATIENT_SEARCH_PARAM_MOCK);
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.showEhr.name}`, () => {
      it('return patient EHR', async () => {
        mockPatientService.getEHRPatient.mockResolvedValue([PATIENT_EHR_MOCK]);
        expect(await controller.showEhr(123)).toEqual({
          success: true,
          data: [PATIENT_EHR_MOCK],
        });
      });

      it('throw error on get EHR', async () => {
        mockPatientService.getEHRPatient.mockImplementation(() => {
          throw new Error();
        });

        await expect(async () => {
          await controller.showEhr(123);
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.createEhr.name}`, () => {
      it('create patient EHR', async () => {
        mockPatientService.createEHR.mockResolvedValue(PATIENT_MOCK);
        expect(
          await controller.createEhr(
            PATIENT_ID_MOCK,
            PATIENT_BILLING_CITY_ID_MOCK
          )
        ).toEqual({
          success: true,
          data: PATIENT_MOCK,
        });
      });

      it('throw error on create EHR', async () => {
        mockPatientService.createEHR.mockImplementation(() => {
          throw new Error();
        });

        await expect(async () => {
          await controller.createEhr(
            PATIENT_ID_MOCK,
            PATIENT_BILLING_CITY_ID_MOCK
          );
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.healthCheck.name}`, () => {
      it('return health check', async () => {
        mockPatientService.gRPCHealthCheck.mockResolvedValue('id');
        expect(await controller.healthCheck()).toEqual({
          success: true,
          data: 'id',
        });
      });

      it('health check catch Error', async () => {
        mockPatientService.gRPCHealthCheck.mockImplementationOnce(() => {
          throw new Error();
        });
        await expect(() => controller.healthCheck()).rejects.toThrow(
          HttpException
        );
      });
    });

    describe(`${PatientController.prototype.show.name}`, () => {
      it('get patient', async () => {
        mockPatientService.getStationPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        expect(
          await controller.show(REQUEST_MOCK, PATIENT_ID_MOCK)
        ).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
      });

      it('get patient with last request', async () => {
        mockPatientService.getStationPatient.mockResolvedValue(
          PATIENT_RESULT_WITH_LAST_REQUEST_MOCK
        );
        expect(
          await controller.show(REQUEST_MOCK, PATIENT_ID_MOCK)
        ).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_WITH_LAST_REQUEST_MOCK,
        });
      });

      it('throw error on get', async () => {
        mockPatientService.getStationPatient.mockImplementation(() => {
          throw new Error('error');
        });

        await expect(async () => {
          await controller.show(PATIENT_MOCK, PATIENT_ID_MOCK);
        }).rejects.toThrow(HttpException);
      });
    });
  });

  describe('onboarding patient service toggle is open', () => {
    const test = new StatsigService(config);

    beforeAll(async () => {
      await test.overrideGate('onboarding_patient_service_toggle', true);
    });

    afterAll(async () => {
      await test.overrideGate('onboarding_patient_service_toggle', false);
    });

    describe(`${PatientController.prototype.create.name} with gRPC call`, () => {
      it('create patient using gRPC', async () => {
        mockPatientService.createGrpcPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        expect(await controller.create(REQUEST_MOCK, PATIENT_MOCK)).toEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
        expect(mockPatientService.createGrpcPatient).toBeCalled();
      });

      it('throw error on create patient using gRPC', async () => {
        mockPatientService.createGrpcPatient.mockImplementationOnce(() => {
          throw new Error();
        });
        await expect(() =>
          controller.create(REQUEST_MOCK, PATIENT_MOCK)
        ).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.show.name} with gRPC call`, () => {
      it('get patient using gRPC', async () => {
        mockPatientService.getGrpcPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        const result = await controller.show(REQUEST_MOCK, PATIENT_ID_MOCK);
        expect(result).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
      });

      it('throw error on get patient using gRPC', async () => {
        mockPatientService.getGrpcPatient.mockImplementation(() => {
          throw new Error();
        });
        await expect(async () => {
          await controller.show(REQUEST_MOCK, PATIENT_ID_MOCK);
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.update.name} with gRPC call`, () => {
      it('update patient using gRPC', async () => {
        mockPatientService.updateGrpcPatient.mockResolvedValue(
          PATIENT_RESULT_MOCK
        );
        const result = await controller.update(
          REQUEST_MOCK,
          PATIENT_ID_MOCK,
          UPDATE_PATIENT_MOCK
        );
        expect(result).toStrictEqual({
          success: true,
          data: PATIENT_RESULT_MOCK,
        });
        expect(mockPatientService.updateGrpcPatient).toBeCalled();
      });

      it('throw error on update patient using gRPC', async () => {
        mockPatientService.updateGrpcPatient.mockImplementation(() => {
          throw new Error();
        });
        await expect(async () => {
          await controller.update(
            REQUEST_MOCK,
            PATIENT_ID_MOCK,
            UPDATE_PATIENT_MOCK
          );
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.search.name} with gRPC call`, () => {
      it('search patient using gRPC', async () => {
        mockPatientService.searchGrpcPatients.mockResolvedValue(
          PATIENTS_SEARCH_RESULT_MOCK
        );
        expect(
          await controller.search(REQUEST_MOCK, PATIENT_SEARCH_PARAM_MOCK)
        ).toEqual({
          success: true,
          data: PATIENTS_SEARCH_RESULT_MOCK,
        });
      });

      it('search patient with zipCode and date of birth using gRPC', async () => {
        mockPatientService.searchGrpcPatients.mockResolvedValue(
          PATIENTS_SEARCH_RESULT_MOCK
        );
        expect(
          await controller.search(
            REQUEST_MOCK,
            PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK
          )
        ).toEqual({
          success: true,
          data: PATIENTS_SEARCH_RESULT_MOCK,
        });
      });

      it('throw error on search using gRPC', async () => {
        mockPatientService.searchGrpcPatients.mockImplementation(() => {
          throw new Error();
        });

        await expect(async () => {
          await controller.search(REQUEST_MOCK, PATIENT_SEARCH_PARAM_MOCK);
        }).rejects.toThrow(HttpException);
      });
    });

    describe(`${PatientController.prototype.fetchPatients.name}`, () => {
      it('return web request patient', async () => {
        mockPatientService.fetchWebRequestPatient.mockResolvedValue(
          WEB_REQUEST_PATIENT_MOCK
        );
        expect(await controller.fetchPatients(1)).toEqual({
          success: true,
          data: WEB_REQUEST_PATIENT_MOCK,
        });
      });

      it('throw error on get web request patient', async () => {
        mockPatientService.fetchWebRequestPatient.mockImplementation(() => {
          throw new Error();
        });

        await expect(async () => {
          await controller.fetchPatients(2);
        }).rejects.toThrow(HttpException);
      });

      it(`get empty web request patient object`, async () => {
        mockPatientService.fetchWebRequestPatient.mockResolvedValue(null);

        const result = await controller.fetchPatients(17902);
        expect(result).toStrictEqual({ success: false, data: undefined });
      });
    });
  });
});

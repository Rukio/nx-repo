import { of } from 'rxjs';
import {
  INSURANCE_RESPONSE_MOCK,
  INSURANCE_PARAMS_MOCK,
  ACCOUNT_ADDRESS_MOCK,
  CREATE_ADDRESS_RESPONSE_MOCK,
  CREATE_GRPC_ADDRESS_RESPONSE_MOCK,
  UPDATE_ACCOUNT_ADDRESS_MOCK_RESPONSE,
  ACCOUNT_ADDRESS_MOCK_RESPONSE,
  LIST_ACCOUNT_ADDRESSES_MOCK,
  LIST_GRPC_ACCOUNT_ADDRESS_RESPONSE_MOCK,
  ACCOUNT_MOCK,
  GRPC_ACCOUNT_RESPONSE_MOCK,
  ACCOUNT_PATIENT_RESPONSE,
  GRPC_LIST_ACCOUNT_PATIENT_RESPONSE_MOCK,
  ASSOCIATE_PATIENT_RESPONSE_MOCK,
} from './mocks/patient-accounts.service.mock';
import PatientAccountsService from '../patient-accounts.service';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../../common/cache.config.service';
import { PATIENTS_ACCOUNTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/accounts/service';
import PatientService from '../../patient/patient.service';
import {
  UPDATE_PATIENT_MOCK,
  UPDATE_PATIENT_TRANSFORMED_MOCK,
  UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK,
} from '../../patient/test/mocks/patient.service.mock';
import {
  AuthModule,
  AuthService,
  buildMockAuthenticationModuleOptions,
} from '@*company-data-covered*/nest/auth';
import { mockAuthService } from '../../common/mocks/auth.mock';

import LoggerModule from '../../logger/logger.module';
import { PATIENTS_PACKAGE_NAME } from '@*company-data-covered*/protos/nest/patients/service';
import {
  PATIENT_MOCK,
  PATIENT_RESULT_MOCK,
} from '../../patient/test/mocks/patient.controller.mock';
import {
  INSURANCE_ID_MOCK,
  INSURANCE_QUERY_DTO_MOCK,
  PATIENT_ASSOCIATION_MOCK,
} from './mocks/patient-accounts.controller.mock';
import { UNVERIFIED_PATIENT_MOCK } from '../../patient/test/mocks/patient.mapper.mock';
import InsuranceNetworksService from '../../insurance-networks/insurance-networks.service';
import { OSS_ACCOUNT_ADDRESS_MOCK } from './mocks/patient-accounts.mapper.mock';

const grpcGetAccountMock = jest.fn(() => of(GRPC_ACCOUNT_RESPONSE_MOCK));

const grpcUpdateAccountMock = jest.fn(() => of(GRPC_ACCOUNT_RESPONSE_MOCK));

const grpcCreateAddressMock = jest.fn(() =>
  of(CREATE_GRPC_ADDRESS_RESPONSE_MOCK)
);

const grpcListAddressesMock = jest.fn(() =>
  of(LIST_GRPC_ACCOUNT_ADDRESS_RESPONSE_MOCK)
);

const grpcUpdateAddressMock = jest.fn(() =>
  of(UPDATE_ACCOUNT_ADDRESS_MOCK_RESPONSE)
);

const grpcListAccountPatientMock = jest.fn(() =>
  of(GRPC_LIST_ACCOUNT_PATIENT_RESPONSE_MOCK)
);

const grpcAddUnverifiedAccountPatientLink = jest.fn(() =>
  of(ASSOCIATE_PATIENT_RESPONSE_MOCK)
);

const grpcTriggerPatientInsuranceEligibilityCheck = jest.fn(() => of(true));

const grpcGetInsuranceMock = jest.fn(() => of(INSURANCE_RESPONSE_MOCK));

const grpcClient = {
  getService: jest.fn(() => ({
    findOrCreateAccountByToken: grpcGetAccountMock,
    updateAccount: grpcUpdateAccountMock,
    createAddress: grpcCreateAddressMock,
    listAddresses: grpcListAddressesMock,
    updateAddress: grpcUpdateAddressMock,
    listAccountPatientLinks: grpcListAccountPatientMock,
    addUnverifiedAccountPatientLink: grpcAddUnverifiedAccountPatientLink,
    triggerPatientInsuranceEligibilityCheck:
      grpcTriggerPatientInsuranceEligibilityCheck,
    getInsurance: grpcGetInsuranceMock,
  })),
  getPatientService: jest.fn(() => ({})),
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

describe(`${PatientAccountsService.name}`, () => {
  let app: INestApplication;
  let patientAccountsService: PatientAccountsService;
  let patientService: PatientService;
  const OLD_ENV = process.env;

  beforeAll(async () => {
    const mockPatientAccountsServiceProvider = {
      provide: PATIENTS_ACCOUNTS_PACKAGE_NAME,
      useFactory: () => ({
        getService: grpcClient.getService,
      }),
    };
    const mockPatientServiceProvider = {
      provide: PATIENTS_PACKAGE_NAME,
      useFactory: () => ({
        getService: grpcClient.getPatientService,
      }),
    };
    const mockOptions = buildMockAuthenticationModuleOptions();

    const module = await Test.createTestingModule({
      providers: [
        PatientAccountsService,
        InsuranceNetworksService,
        mockPatientAccountsServiceProvider,
        PatientService,
        mockPatientServiceProvider,
      ],
      imports: [
        LoggerModule,
        HttpModule,
        ConfigModule,
        AuthModule.register(mockOptions),
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .compile();

    patientAccountsService = module.get<PatientAccountsService>(
      PatientAccountsService
    );
    patientService = module.get<PatientService>(PatientService);

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    grpcUpdateAccountMock.mockClear();
    grpcCreateAddressMock.mockClear();
    grpcListAddressesMock.mockClear();
    grpcUpdateAddressMock.mockClear();
    process.env.ONBOARDING_M2M_AUTH0_DOMAIN = 'test';
  });

  afterAll(async () => {
    process.env = OLD_ENV;
    await app.close();
  });

  describe(`${PatientAccountsService.prototype.get.name}`, () => {
    it('get account', async () => {
      expect(await patientAccountsService.get()).toEqual(ACCOUNT_MOCK);
      expect(grpcGetAccountMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientAccountsService.prototype.update.name}`, () => {
    it('updates account', async () => {
      expect(await patientAccountsService.update(ACCOUNT_MOCK)).toEqual(
        ACCOUNT_MOCK
      );
      expect(grpcUpdateAccountMock).toHaveBeenCalledTimes(1);
    });

    it('throws error because of missing consistencyToken field', async () => {
      await expect(async () => {
        await patientAccountsService.update({
          ...ACCOUNT_MOCK,
          consistencyToken: undefined,
        });
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe(`${PatientAccountsService.prototype.createAddress.name}`, () => {
    it('create address', async () => {
      expect(
        await patientAccountsService.createAddress(OSS_ACCOUNT_ADDRESS_MOCK, 1)
      ).toEqual(CREATE_ADDRESS_RESPONSE_MOCK);
      expect(grpcCreateAddressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientAccountsService.prototype.listAddresses.name}`, () => {
    it('list addresses', async () => {
      expect(await patientAccountsService.listAddresses(1)).toEqual(
        LIST_ACCOUNT_ADDRESSES_MOCK
      );
      expect(grpcListAddressesMock).toHaveBeenCalledTimes(1);
    });
  });

  describe(`${PatientAccountsService.prototype.updateAddress.name}`, () => {
    it('update address', async () => {
      expect(
        await patientAccountsService.updateAddress(
          {
            ...OSS_ACCOUNT_ADDRESS_MOCK,
            consistencyToken: new Uint8Array(8),
          },
          1
        )
      ).toEqual(ACCOUNT_ADDRESS_MOCK_RESPONSE);
      expect(grpcUpdateAddressMock).toHaveBeenCalledTimes(1);
    });

    it('throws error because of missing address id field', async () => {
      await expect(async () => {
        await patientAccountsService.updateAddress(
          {
            ...ACCOUNT_ADDRESS_MOCK,
            id: 0,
          },
          0
        );
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe(`${PatientAccountsService.prototype.updatePatient.name}`, () => {
    it('updates unverified patient', async () => {
      const mockUpdateUnverifiedPatient = jest
        .spyOn(patientService, 'updateGrpcUnverifiedPatient')
        .mockResolvedValue(UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK);
      const res = await patientAccountsService.updatePatient(
        UPDATE_PATIENT_MOCK.id,
        UPDATE_PATIENT_MOCK
      );
      expect(mockUpdateUnverifiedPatient).toHaveBeenCalledWith(
        UPDATE_PATIENT_MOCK.id,
        UPDATE_PATIENT_MOCK
      );
      expect(res).toEqual(UPDATE_UNVERIFIED_PATIENT_TRANSFORMED_MOCK);
    });

    it('updates verified patient', async () => {
      const response = {
        ...UPDATE_PATIENT_TRANSFORMED_MOCK,
        ehrPatientId: '222',
      };
      const mockUpdatePatient = jest
        .spyOn(patientService, 'updateGrpcPatient')
        .mockResolvedValue(response);
      const payload = { ...UPDATE_PATIENT_MOCK, ehrPatientId: '222' };
      const res = await patientAccountsService.updatePatient(
        UPDATE_PATIENT_MOCK.id,
        payload
      );
      expect(mockUpdatePatient).toHaveBeenCalledWith(
        UPDATE_PATIENT_MOCK.id,
        payload
      );
      expect(res).toEqual(response);
    });
  });

  describe(`${PatientAccountsService.prototype.createUnverifiedPatient.name}`, () => {
    it('create unverified patient', async () => {
      const mockCreateUnverifiedPatient = jest
        .spyOn(patientService, 'createUnverifiedPatient')
        .mockResolvedValue(UNVERIFIED_PATIENT_MOCK);
      const res = await patientAccountsService.createUnverifiedPatient(
        UNVERIFIED_PATIENT_MOCK
      );
      expect(mockCreateUnverifiedPatient).toHaveBeenCalledWith(
        UNVERIFIED_PATIENT_MOCK
      );
      expect(res).toEqual(UNVERIFIED_PATIENT_MOCK);
    });
  });

  describe(`${PatientAccountsService.prototype.listPatients.name}`, () => {
    it('get account patient list', async () => {
      expect(await patientAccountsService.listPatients(1)).toEqual([
        ACCOUNT_PATIENT_RESPONSE,
      ]);
    });
  });

  describe(`${PatientAccountsService.prototype.addUnverifiedAccountPatientLink.name}`, () => {
    it('associate patient to account', async () => {
      await expect(
        patientAccountsService.addUnverifiedAccountPatientLink(
          1,
          PATIENT_ASSOCIATION_MOCK
        )
      ).resolves.toEqual(ACCOUNT_PATIENT_RESPONSE);
    });
  });

  describe(`${PatientAccountsService.prototype.createInsurance.name}`, () => {
    it('should create an insurance successfully', async () => {
      const mockCreateInsurance = jest
        .spyOn(patientService, 'createInsurance')
        .mockResolvedValue(INSURANCE_RESPONSE_MOCK);

      const result = await patientAccountsService.createInsurance(
        INSURANCE_QUERY_DTO_MOCK,
        INSURANCE_PARAMS_MOCK
      );

      expect(mockCreateInsurance).toHaveBeenCalledWith(
        INSURANCE_QUERY_DTO_MOCK,
        INSURANCE_PARAMS_MOCK
      );
      expect(result).toEqual(INSURANCE_RESPONSE_MOCK);
    });
  });

  describe(`${PatientAccountsService.prototype.updateInsurance.name}`, () => {
    it('should update an insurance successfully', async () => {
      const mockUpdateInsurance = jest
        .spyOn(patientService, 'updateInsurance')
        .mockResolvedValue(INSURANCE_RESPONSE_MOCK);

      const result = await patientAccountsService.updateInsurance(
        INSURANCE_QUERY_DTO_MOCK,
        '7',
        INSURANCE_PARAMS_MOCK
      );

      expect(mockUpdateInsurance).toHaveBeenCalledWith(
        INSURANCE_QUERY_DTO_MOCK,
        '7',
        INSURANCE_PARAMS_MOCK
      );
      expect(result).toEqual(INSURANCE_RESPONSE_MOCK);
    });
  });

  describe(`${PatientAccountsService.prototype.checkEligibility.name}`, () => {
    it('should check insurance eligibility successfully', async () => {
      const mockCheckEligibility = jest
        .spyOn(patientService, 'checkEligibility')
        .mockResolvedValue(INSURANCE_RESPONSE_MOCK);

      await expect(
        patientAccountsService.checkEligibility(INSURANCE_QUERY_DTO_MOCK, '1')
      ).resolves.toEqual(INSURANCE_RESPONSE_MOCK);

      expect(mockCheckEligibility).toHaveBeenCalledWith(
        INSURANCE_QUERY_DTO_MOCK,
        '1'
      );
    });
  });

  describe(`${PatientAccountsService.prototype.createEhrRecord.name}`, () => {
    it('create ehr record', async () => {
      const mockCreateEhrRecord = jest
        .spyOn(patientService, 'createEhrRecord')
        .mockResolvedValue(PATIENT_RESULT_MOCK);
      const res = await patientAccountsService.createEhrRecord({
        unverifiedPatientId: 1,
        billingCityId: 123,
      });
      expect(mockCreateEhrRecord).toHaveBeenCalledWith({
        unverifiedPatientId: 1,
        billingCityId: 123,
      });
      expect(res).toEqual(PATIENT_RESULT_MOCK);
    });
  });

  describe(`${PatientAccountsService.prototype.listInsurances.name}`, () => {
    it('should get insurance successfully', async () => {
      const mockGetInsurance = jest
        .spyOn(patientService, 'listInsurances')
        .mockResolvedValue([INSURANCE_RESPONSE_MOCK]);

      const result = await patientAccountsService.listInsurances('1157870');

      expect(mockGetInsurance).toHaveBeenCalledWith('1157870');
      expect(result).toEqual([INSURANCE_RESPONSE_MOCK]);
    });
  });

  describe(`${PatientAccountsService.prototype.getPatient.name}`, () => {
    it('should get patient successfully', async () => {
      const mockGetGrpcPatient = jest
        .spyOn(patientService, 'getGrpcPatient')
        .mockResolvedValue(PATIENT_MOCK);

      const result = await patientAccountsService.getPatient(123);

      expect(mockGetGrpcPatient).toHaveBeenCalledWith(123);
      expect(result).toEqual(PATIENT_MOCK);
    });
  });

  describe(`${PatientAccountsService.prototype.deleteInsurance.name}`, () => {
    it('should delete an insurance successfully', async () => {
      const mockDeleteInsurance = jest
        .spyOn(patientService, 'deleteInsurance')
        .mockResolvedValue({
          success: true,
        });

      const result = await patientAccountsService.deleteInsurance(
        INSURANCE_QUERY_DTO_MOCK,
        INSURANCE_ID_MOCK
      );

      expect(mockDeleteInsurance).toHaveBeenCalledWith(
        INSURANCE_QUERY_DTO_MOCK,
        INSURANCE_ID_MOCK
      );
      expect(result).toEqual({
        success: true,
      });
    });
  });
});

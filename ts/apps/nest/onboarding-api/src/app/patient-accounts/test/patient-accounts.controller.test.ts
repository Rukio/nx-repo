import PatientAccountsController from '../patient-accounts.controller';
import { mockDeep, mockReset } from 'jest-mock-extended';
import PatientAccountsService from '../patient-accounts.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import LoggerModule from '../../logger/logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheConfigService } from '../../common/cache.config.service';
import {
  MOCK_PATIENT_ACCOUNT_ID,
  INSURANCE_MOCK_RESPONSE,
  INSURANCE_PARAMS_MOCK,
  INSURANCE_QUERY_DTO_MOCK,
  ADDRESS_ID_MOCK,
  CREATE_ADDRESS_BODY_MOCK,
  CREATE_ADDRESS_RESPONSE,
  LIST_ACCOUNT_ADDRESSES_MOCK,
  UPDATE_ACCOUNT_BODY_MOCK,
  ACCOUNT_MOCK_RESPONSE,
  UPDATE_ADDRESS_BODY_MOCK,
  UPDATE_ADDRESS_MOCK_RESPONSE,
  GET_ACCOUNT_PATIENTS_LIST_RESPONSE,
  ACCOUNT_PATIENT_MOCK,
  PATIENT_ASSOCIATION_MOCK,
  INSURANCE_ID_MOCK,
} from './mocks/patient-accounts.controller.mock';
import { HttpException } from '@nestjs/common';
import {
  CareRequestAPIResponse,
  Insurance,
  Patient,
} from '@*company-data-covered*/consumer-web-types';
import {
  PATIENT_RESULT_MOCK,
  UPDATE_PATIENT_MOCK,
} from '../../patient/test/mocks/patient.controller.mock';
import { UNVERIFIED_PATIENT_MOCK } from '../../patient/test/mocks/patient.mapper.mock';
import { PATIENT_MOCK } from '../../patient/test/mocks/patient.service.mock';

describe(`${PatientAccountsController.name}`, () => {
  let patientAccountsController: PatientAccountsController;
  const mockPatientAccountsService = mockDeep<PatientAccountsService>();

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PatientAccountsController],
      providers: [PatientAccountsService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    })
      .overrideProvider(PatientAccountsService)
      .useValue(mockPatientAccountsService)
      .compile();

    patientAccountsController = app.get<PatientAccountsController>(
      PatientAccountsController
    );
  });

  beforeEach(() => {
    mockReset(mockPatientAccountsService);
  });

  it('should be defined', () => {
    expect(patientAccountsController).toBeDefined();
  });

  describe(`${PatientAccountsController.prototype.get.name}`, () => {
    it('get account', async () => {
      mockPatientAccountsService.get.mockResolvedValue(ACCOUNT_MOCK_RESPONSE);
      const res = await patientAccountsController.get();
      expect(res).toEqual({
        success: true,
        data: ACCOUNT_MOCK_RESPONSE,
      });
    });

    it('throws error', async () => {
      mockPatientAccountsService.get.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.get();
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.update.name}`, () => {
    it('update account', async () => {
      mockPatientAccountsService.update.mockResolvedValue(
        ACCOUNT_MOCK_RESPONSE
      );
      const res = await patientAccountsController.update(
        MOCK_PATIENT_ACCOUNT_ID,
        UPDATE_ACCOUNT_BODY_MOCK
      );
      expect(res).toEqual({
        success: true,
        data: ACCOUNT_MOCK_RESPONSE,
      });
    });

    it('throws error', async () => {
      mockPatientAccountsService.update.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.update(
          MOCK_PATIENT_ACCOUNT_ID,
          UPDATE_ACCOUNT_BODY_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.createAddress.name}`, () => {
    it('create address', async () => {
      mockPatientAccountsService.createAddress.mockResolvedValue(
        CREATE_ADDRESS_RESPONSE
      );
      const res = await patientAccountsController.createAddress(
        MOCK_PATIENT_ACCOUNT_ID,
        CREATE_ADDRESS_BODY_MOCK
      );
      expect(res).toEqual({
        success: true,
        data: CREATE_ADDRESS_RESPONSE,
      });
    });

    it('throws error', async () => {
      mockPatientAccountsService.createAddress.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.createAddress(
          MOCK_PATIENT_ACCOUNT_ID,
          CREATE_ADDRESS_BODY_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.listAddresses.name}`, () => {
    it('list addresses', async () => {
      mockPatientAccountsService.listAddresses.mockResolvedValue(
        LIST_ACCOUNT_ADDRESSES_MOCK
      );
      const res = await patientAccountsController.listAddresses(
        MOCK_PATIENT_ACCOUNT_ID
      );
      expect(res).toEqual({
        success: true,
        data: LIST_ACCOUNT_ADDRESSES_MOCK,
      });
    });

    it('throws error', async () => {
      mockPatientAccountsService.listAddresses.mockRejectedValueOnce(
        new Error()
      );
      await expect(
        patientAccountsController.listAddresses(MOCK_PATIENT_ACCOUNT_ID)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.updateAddress.name}`, () => {
    it('update address', async () => {
      mockPatientAccountsService.updateAddress.mockResolvedValue(
        UPDATE_ADDRESS_MOCK_RESPONSE
      );
      const res = await patientAccountsController.updateAddress(
        MOCK_PATIENT_ACCOUNT_ID,
        ADDRESS_ID_MOCK,
        UPDATE_ADDRESS_BODY_MOCK
      );
      expect(res).toEqual({
        success: true,
        data: UPDATE_ADDRESS_MOCK_RESPONSE,
      });
    });

    it('throws error', async () => {
      mockPatientAccountsService.updateAddress.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.updateAddress(
          MOCK_PATIENT_ACCOUNT_ID,
          ADDRESS_ID_MOCK,
          UPDATE_ADDRESS_BODY_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.updatePatient.name}`, () => {
    it('update patient', async () => {
      mockPatientAccountsService.updatePatient.mockResolvedValue(
        PATIENT_RESULT_MOCK
      );
      const result = await patientAccountsController.updatePatient(
        MOCK_PATIENT_ACCOUNT_ID,
        UPDATE_PATIENT_MOCK.id,
        UPDATE_PATIENT_MOCK
      );
      expect(result).toStrictEqual({
        success: true,
        data: PATIENT_RESULT_MOCK,
      });
      expect(mockPatientAccountsService.updatePatient).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.updatePatient.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.updatePatient(
          MOCK_PATIENT_ACCOUNT_ID,
          UPDATE_PATIENT_MOCK.id,
          UPDATE_PATIENT_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.createUnverifiedPatient.name}`, () => {
    it('create unverified patient', async () => {
      mockPatientAccountsService.createUnverifiedPatient.mockResolvedValue(
        UNVERIFIED_PATIENT_MOCK
      );
      const result = await patientAccountsController.createUnverifiedPatient(
        MOCK_PATIENT_ACCOUNT_ID,
        UNVERIFIED_PATIENT_MOCK
      );
      expect(result).toStrictEqual({
        success: true,
        data: UNVERIFIED_PATIENT_MOCK,
      });
      expect(mockPatientAccountsService.createUnverifiedPatient).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.createUnverifiedPatient.mockImplementation(
        () => {
          throw new Error();
        }
      );
      await expect(async () => {
        await patientAccountsController.createUnverifiedPatient(
          MOCK_PATIENT_ACCOUNT_ID,
          UNVERIFIED_PATIENT_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.listPatients.name}`, () => {
    it('get account patients list', async () => {
      mockPatientAccountsService.listPatients.mockResolvedValue(
        GET_ACCOUNT_PATIENTS_LIST_RESPONSE
      );

      await expect(
        patientAccountsController.listPatients(MOCK_PATIENT_ACCOUNT_ID)
      ).resolves.toEqual({
        success: true,
        data: GET_ACCOUNT_PATIENTS_LIST_RESPONSE,
      });
    });

    it('throw error on get account patients list', async () => {
      mockPatientAccountsService.listPatients.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await expect(async () => {
        await patientAccountsController.listPatients(MOCK_PATIENT_ACCOUNT_ID);
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.addUnverifiedAccountPatientLink.name}`, () => {
    it('associate patient to account', async () => {
      mockPatientAccountsService.addUnverifiedAccountPatientLink.mockResolvedValue(
        ACCOUNT_PATIENT_MOCK
      );

      await expect(
        patientAccountsController.addUnverifiedAccountPatientLink(
          MOCK_PATIENT_ACCOUNT_ID,
          PATIENT_ASSOCIATION_MOCK
        )
      ).resolves.toEqual({
        success: true,
        data: ACCOUNT_PATIENT_MOCK,
      });
    });

    it('throw error on associate patient to account', async () => {
      mockPatientAccountsService.addUnverifiedAccountPatientLink.mockImplementationOnce(
        () => {
          throw new Error('error');
        }
      );
      await expect(
        patientAccountsController.addUnverifiedAccountPatientLink(
          MOCK_PATIENT_ACCOUNT_ID,
          PATIENT_ASSOCIATION_MOCK
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.createInsurance.name}`, () => {
    it('should create insurance', async () => {
      const response: CareRequestAPIResponse<Insurance> = {
        data: INSURANCE_MOCK_RESPONSE,
        success: true,
      };
      jest
        .spyOn(mockPatientAccountsService, 'createInsurance')
        .mockImplementation(() => Promise.resolve(INSURANCE_MOCK_RESPONSE));

      expect(
        await patientAccountsController.createInsurance(
          1234,
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_PARAMS_MOCK
        )
      ).toStrictEqual(response);
      expect(mockPatientAccountsService.createInsurance).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.createInsurance.mockImplementation(() => {
        throw new Error();
      });
      await expect(async () => {
        await patientAccountsController.createInsurance(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_PARAMS_MOCK
        );
      }).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.updateInsurance.name}`, () => {
    it('should update insurance', async () => {
      const response: CareRequestAPIResponse<Insurance> = {
        data: INSURANCE_MOCK_RESPONSE,
        success: true,
      };
      mockPatientAccountsService.updateInsurance.mockResolvedValueOnce(
        INSURANCE_MOCK_RESPONSE
      );

      await expect(
        patientAccountsController.updateInsurance(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          '1',
          INSURANCE_PARAMS_MOCK
        )
      ).resolves.toStrictEqual(response);
      expect(mockPatientAccountsService.updateInsurance).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.updateInsurance.mockImplementation(() => {
        throw new Error();
      });
      await expect(
        patientAccountsController.updateInsurance(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          '1',
          INSURANCE_PARAMS_MOCK
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.checkEligibility.name}`, () => {
    it('should check insurance eligibility', async () => {
      const response: CareRequestAPIResponse<Insurance> = {
        data: INSURANCE_MOCK_RESPONSE,
        success: true,
      };
      mockPatientAccountsService.checkEligibility.mockResolvedValueOnce(
        INSURANCE_MOCK_RESPONSE
      );

      await expect(
        patientAccountsController.checkEligibility(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          '1'
        )
      ).resolves.toStrictEqual(response);
      expect(mockPatientAccountsService.checkEligibility).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.checkEligibility.mockRejectedValueOnce(
        new Error()
      );
      await expect(
        patientAccountsController.checkEligibility(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          '1'
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.createEhrRecord.name}`, () => {
    it('create ehr record', async () => {
      mockPatientAccountsService.createEhrRecord.mockResolvedValue(
        PATIENT_RESULT_MOCK
      );
      const result = await patientAccountsController.createEhrRecord(
        MOCK_PATIENT_ACCOUNT_ID,
        {
          unverifiedPatientId: 1,
          billingCityId: 123,
        }
      );
      expect(result).toStrictEqual({
        success: true,
        data: PATIENT_RESULT_MOCK,
      });
      expect(mockPatientAccountsService.createEhrRecord).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.createEhrRecord.mockImplementation(() => {
        throw new Error();
      });
      await expect(
        patientAccountsController.createEhrRecord(MOCK_PATIENT_ACCOUNT_ID, {
          unverifiedPatientId: 1,
          billingCityId: 123,
        })
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.listInsurances.name}`, () => {
    it('should get insurance list', async () => {
      const response: CareRequestAPIResponse<Insurance[]> = {
        data: [INSURANCE_MOCK_RESPONSE],
        success: true,
      };
      mockPatientAccountsService.listInsurances.mockResolvedValueOnce([
        INSURANCE_MOCK_RESPONSE,
      ]);

      await expect(
        patientAccountsController.listInsurances(
          MOCK_PATIENT_ACCOUNT_ID,
          '1157870'
        )
      ).resolves.toStrictEqual(response);
      expect(mockPatientAccountsService.listInsurances).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.listInsurances.mockImplementation(() => {
        throw new Error();
      });
      await expect(
        patientAccountsController.listInsurances(
          MOCK_PATIENT_ACCOUNT_ID,
          '1157870'
        )
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.getPatient.name}`, () => {
    it('should get patient', async () => {
      const response: CareRequestAPIResponse<Patient> = {
        data: PATIENT_MOCK,
        success: true,
      };
      mockPatientAccountsService.getPatient.mockResolvedValueOnce(PATIENT_MOCK);

      await expect(
        patientAccountsController.getPatient(123, 123)
      ).resolves.toStrictEqual(response);
      expect(mockPatientAccountsService.getPatient).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.getPatient.mockImplementation(() => {
        throw new Error();
      });
      await expect(
        patientAccountsController.getPatient(123, 123)
      ).rejects.toThrow(HttpException);
    });
  });

  describe(`${PatientAccountsController.prototype.deleteInsurance.name}`, () => {
    it('should delete insurance', async () => {
      const response: CareRequestAPIResponse<Insurance> = {
        success: true,
      };
      mockPatientAccountsService.deleteInsurance.mockResolvedValueOnce({
        success: true,
      });

      await expect(
        patientAccountsController.deleteInsurance(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_ID_MOCK
        )
      ).resolves.toStrictEqual(response);
      expect(mockPatientAccountsService.deleteInsurance).toBeCalled();
    });

    it('throws error', async () => {
      mockPatientAccountsService.deleteInsurance.mockImplementation(() => {
        throw new Error();
      });
      await expect(
        patientAccountsController.deleteInsurance(
          MOCK_PATIENT_ACCOUNT_ID,
          INSURANCE_QUERY_DTO_MOCK,
          INSURANCE_ID_MOCK
        )
      ).rejects.toThrow(HttpException);
    });
  });
});

import { HttpArgumentsHost, ExecutionContext } from '@nestjs/common/interfaces';
import { mock, mockReset } from 'jest-mock-extended';
import { PatientOwnerGuard } from '../patient-owner.guard';
import PatientAccountsService from '../../patient-accounts.service';
import { mockPolicyService } from '../../../../testUtils/mocks/policy.mock';
import {
  ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE,
  ACCOUNT_PATIENT_RESPONSE,
} from '../../test/mocks/patient-accounts.service.mock';
import { mockExpressRequest } from './policy-utils.test';
import { BELONGS_TO_ACCOUNT_POLICY } from '../policy-utils';
import { PatientActor } from '@*company-data-covered*/nest/auth';

const mockHttpArgumentsHost = mock<HttpArgumentsHost>();
const mockCtx = mock<ExecutionContext>({
  switchToHttp: jest.fn(() => mockHttpArgumentsHost),
});

const mockRequest = ({
  accountId,
  patientId,
  unverifiedPatientId,
}: {
  accountId: string;
  patientId?: string;
  unverifiedPatientId?: string;
}) =>
  mockExpressRequest({
    params: { accountId },
    query: { patientId, unverifiedPatientId },
  });

const mockPatientAccountSvc = mock<PatientAccountsService>();
const patientOwnerGuard = new PatientOwnerGuard(
  mockPatientAccountSvc,
  mockPolicyService
);

afterEach(() => {
  mockReset(mockPatientAccountSvc);
});

describe(`${PatientOwnerGuard.name}`, () => {
  it('should be defined', () => {
    expect(patientOwnerGuard).toBeDefined();
  });

  describe(`${PatientOwnerGuard.prototype.canActivate.name}`, () => {
    beforeEach(() => {
      mockPolicyService.allowed.mockImplementationOnce(
        async (
          policy,
          actor: PatientActor & { properties: { patients: string[] } },
          resource: { patient_id: string }
        ) => {
          expect(policy).toEqual(BELONGS_TO_ACCOUNT_POLICY);

          return actor.properties.patients.includes(resource.patient_id);
        }
      );
    });

    it('should return true when actor owns requested patient', async () => {
      mockPatientAccountSvc.listPatients.mockResolvedValueOnce([
        ACCOUNT_PATIENT_RESPONSE,
      ]);
      mockHttpArgumentsHost.getRequest.mockReturnValueOnce(
        mockRequest({
          accountId: ACCOUNT_PATIENT_RESPONSE.accountId.toString(),
          patientId: ACCOUNT_PATIENT_RESPONSE.patient.id.toString(),
        })
      );

      await expect(
        patientOwnerGuard.canActivate(mockCtx)
      ).resolves.toStrictEqual(true);
    });

    it('should return true when actor owns requested patient though unverified', async () => {
      mockPatientAccountSvc.listPatients.mockResolvedValueOnce([
        ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE,
      ]);
      mockHttpArgumentsHost.getRequest.mockReturnValueOnce(
        mockRequest({
          accountId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.accountId.toString(),
          patientId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.unverifiedPatient.patientId.toString(),
        })
      );

      await expect(
        patientOwnerGuard.canActivate(mockCtx)
      ).resolves.toStrictEqual(true);
    });

    it('should return false when actor does not own requested patient', async () => {
      mockPatientAccountSvc.listPatients.mockResolvedValueOnce([]);
      mockHttpArgumentsHost.getRequest.mockReturnValueOnce(
        mockRequest({
          accountId: ACCOUNT_PATIENT_RESPONSE.accountId.toString(),
          patientId: ACCOUNT_PATIENT_RESPONSE.patient.id.toString(),
        })
      );

      await expect(
        patientOwnerGuard.canActivate(mockCtx)
      ).resolves.toStrictEqual(false);
    });
  });
});

import { HttpArgumentsHost, ExecutionContext } from '@nestjs/common/interfaces';
import { mock, mockReset } from 'jest-mock-extended';
import { UnverifiedPatientOwnerGuard } from '../unverified-patient-owner.guard';
import PatientAccountsService from '../../patient-accounts.service';
import { mockPolicyService } from '../../../../testUtils/mocks/policy.mock';
import { ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE } from '../../test/mocks/patient-accounts.service.mock';
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
const unverifiedPatientOwnerGuard = new UnverifiedPatientOwnerGuard(
  mockPatientAccountSvc,
  mockPolicyService
);

afterEach(() => {
  mockReset(mockPatientAccountSvc);
});

describe(`${UnverifiedPatientOwnerGuard.name}`, () => {
  it('should be defined', () => {
    expect(unverifiedPatientOwnerGuard).toBeDefined();
  });

  describe(`${UnverifiedPatientOwnerGuard.prototype.canActivate.name}`, () => {
    beforeEach(() => {
      mockPolicyService.allowed.mockImplementationOnce(
        async (
          policy,
          actor: PatientActor & {
            properties: { unverified_patients: string[] };
          },
          resource: { unverified_patient_id: string }
        ) => {
          expect(policy).toEqual(BELONGS_TO_ACCOUNT_POLICY);

          return actor.properties.unverified_patients.includes(
            resource.unverified_patient_id
          );
        }
      );
    });

    it('should return true when actor owns requested unverified patient', async () => {
      mockPatientAccountSvc.listPatients.mockResolvedValueOnce([
        ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE,
      ]);
      mockHttpArgumentsHost.getRequest.mockReturnValueOnce(
        mockRequest({
          accountId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.accountId.toString(),
          unverifiedPatientId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.unverifiedPatient.id.toString(),
        })
      );

      await expect(
        unverifiedPatientOwnerGuard.canActivate(mockCtx)
      ).resolves.toStrictEqual(true);
    });

    it('should return false when actor does not own requested unverified patient', async () => {
      mockPatientAccountSvc.listPatients.mockResolvedValueOnce([]);
      mockHttpArgumentsHost.getRequest.mockReturnValueOnce(
        mockRequest({
          accountId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.accountId.toString(),
          unverifiedPatientId:
            ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE.unverifiedPatient.id.toString(),
        })
      );

      await expect(
        unverifiedPatientOwnerGuard.canActivate(mockCtx)
      ).resolves.toStrictEqual(false);
    });
  });
});

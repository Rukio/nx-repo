import {
  OssAddress,
  InsuranceNetwork,
  InsuranceParams,
  Patient,
  PatientAssociation,
} from '@*company-data-covered*/consumer-web-types';
import {
  PatientAccount,
  DomainPatient,
  InsurancePriority,
  DomainUnverifiedPatient,
} from '../../types';

export type UpdatePatientAccountPayload = Required<
  Pick<PatientAccount, 'id' | 'consistencyToken'>
> &
  Partial<Pick<PatientAccount, 'firstName' | 'lastName' | 'phone'>>;

export type CreatePatientAccountAddressPayload = Required<
  Pick<OssAddress, 'accountId'>
> &
  Omit<OssAddress, 'accountId'>;

export type UpdatePatientAccountAddressPayload = Required<
  Pick<OssAddress, 'accountId' | 'id' | 'consistencyToken'>
> &
  Omit<OssAddress, 'accountId' | 'id' | 'consistencyToken'>;

export type GetAccountPatientsQuery = { id: string | number };

export type CreatePatientAccountUnverifiedPatientPayload = {
  accountId: string | number;
  unverifiedPatient: Pick<
    DomainUnverifiedPatient,
    | 'givenName'
    | 'familyName'
    | 'phoneNumber'
    | 'legalSex'
    | 'birthSex'
    | 'genderIdentity'
    | 'genderIdentityDetails'
    | 'dateOfBirth'
  >;
};

export type AddPatientAccountUnverifiedPatientLinkPayload = {
  accountId: string | number;
} & PatientAssociation;

export type CreatePatientAccountInsurancePayload = {
  accountId: string | number;
  patientId: string | number;
  insuranceParams: InsuranceParams;
};

export type PatientAccountCheckEligibilityQuery = {
  accountId: string | number;
  patientId: string | number;
  insuranceId: string;
};

export type CheckInsuranceEligibilityPayload = {
  patient?: Patient | null;
  selectedNetwork?: InsuranceNetwork;
  insurancePriority?: InsurancePriority;
  accountId?: string | number;
  patientId?: number;
  memberId: string;
  isRequesterRelationshipSelf: boolean;
  insuranceId?: number;
};

export type CreatePatientEhrRecordPayload = {
  accountId: string | number;
  unverifiedPatientId: string | number;
  billingCityId: number;
};

export type GetPatientInsurancesQuery = {
  accountId: string | number;
  patientId: string | number;
};

export type UpdatePatientAccountInsurancePayload = {
  accountId: string | number;
  patientId: string | number;
  insuranceId: string | number;
  insuranceParams: InsuranceParams;
};

export type UpdateAccountPatientPayload = {
  accountId: string | number;
  patientId: string | number;
  patient: Partial<DomainPatient>;
};

export type GetPatientQuery = {
  accountId: string | number;
  patientId: string | number;
};

export type DeletePatientInsuranceQuery = {
  accountId: string | number;
  patientId: string | number;
  insuranceId: string | number;
};

export type DeletePatientInsuranceResult = {
  success: boolean;
};

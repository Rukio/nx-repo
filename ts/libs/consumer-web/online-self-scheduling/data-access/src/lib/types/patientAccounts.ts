import {
  Account,
  AccountPatient,
  Patient,
  UnverifiedPatient,
  OssInsurance,
  OssAddress,
} from '@*company-data-covered*/consumer-web-types';

export type PatientAccount = Account;

export type PatientAccountPatient = AccountPatient;

export type PatientAccountAddressData = {
  zipCode?: string;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  locationType?: string;
  locationDetails?: string;
};

export type DomainPatient = Patient;

export type DomainUnverifiedPatient = UnverifiedPatient;

// ID always exists for stored address.
export type DomainPatientAccountAddress = Required<Pick<OssAddress, 'id'>> &
  Omit<OssAddress, 'id'>;

export type PatientAddress = Omit<OssAddress, 'id' | 'facilityType'>;

export type PatientAccountPatientLink = {
  id: string;
  accountId: string;
  patient: Patient;
  consistencyToken?: Uint8Array | string;
};

export type DomainPatientInsurance = OssInsurance;

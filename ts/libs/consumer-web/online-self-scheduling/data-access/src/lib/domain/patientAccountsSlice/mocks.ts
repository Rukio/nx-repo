import {
  UpdatePatientAccountPayload,
  CreatePatientAccountAddressPayload,
  UpdatePatientAccountAddressPayload,
  GetAccountPatientsQuery,
  CreatePatientAccountUnverifiedPatientPayload,
  AddPatientAccountUnverifiedPatientLinkPayload,
  CreatePatientAccountInsurancePayload,
  CheckInsuranceEligibilityPayload,
  PatientAccountCheckEligibilityQuery,
  CreatePatientEhrRecordPayload,
  GetPatientInsurancesQuery,
  UpdatePatientAccountInsurancePayload,
  UpdateAccountPatientPayload,
  GetPatientQuery,
  DeletePatientInsuranceQuery,
  DeletePatientInsuranceResult,
} from './types';
import {
  PatientAccount,
  PatientAccountAddressData,
  PatientAccountPatient,
  DomainPatient,
  PatientAccountPatientLink,
  RelationToPatient,
  DomainPatientInsurance,
  InsuranceEligibilityStatus,
  DomainPatientAccountAddress,
  InsurancePriority,
  DomainUnverifiedPatient,
  Gender,
  PatientAddress,
} from '../../types';
import {
  AccountAddress,
  AddressStatus,
  BirthSex,
  ConsentingRelationship,
  ConsentingRelationshipCategory,
  GenderIdentityCategory,
  InsuranceParams,
  PowerOfAttorney,
  FacilityType,
} from '@*company-data-covered*/consumer-web-types';
import { mockedInsuranceNetwork } from '../selfScheduleSlice';

const mockConsentingRelationship: ConsentingRelationship = {
  category: ConsentingRelationshipCategory.CATEGORY_SELF,
};

export const mockPatientAccount: Required<PatientAccount> = {
  id: 1,
  email: 'test@gmail.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '4023999305',
  consistencyToken: new Uint8Array(8).toString(),
  updatedAt: '2023-07-26T10:44:42.254Z',
};

export const mockUpdatePatientAccountPayload: Required<UpdatePatientAccountPayload> =
  {
    id: 123,
    firstName: 'John',
    lastName: 'Doe',
    phone: '4023999305',
    consistencyToken: new Uint8Array(),
  };

export const mockCreatePatientAccountAddressResponse: AccountAddress = {
  address: {
    id: 1,
    zip: '80205',
    streetAddress1: '5830 Elliot Ave',
    streetAddress2: '#202',
    city: 'Denver',
    state: 'Colorado',
    additionalDetails: 'Parking is behind the building',
  },
  suggestedAddress: {
    zip: '80205-3316',
    streetAddress1: '5830 Elliot Avenue',
    streetAddress2: '#202',
    city: 'Denver',
    state: 'CO',
    additionalDetails: 'Parking is behind the building',
    valid: true,
    reasons: [],
  },
  consistencyToken: new Uint8Array(8).toString(),
  accountId: 1,
  status: AddressStatus.VALID,
};

export const mockCreatePatientAccountAddressPayload: CreatePatientAccountAddressPayload =
  {
    accountId: 1,
    city: 'Denver',
    state: 'Colorado',
    zip: '80205',
    streetAddress1: '5830 Elliot Avenue',
    streetAddress2: '#202',
    additionalDetails: 'Parking is behind the building',
    facilityType: FacilityType.FACILITY_TYPE_HOME,
  };

export const mockUpdatePatientAccountAddressResponse: AccountAddress = {
  address: {
    id: 1,
    zip: '80205',
    streetAddress1: '5830 Elliot Ave',
    streetAddress2: '#202',
    city: 'Denver',
    state: 'Colorado',
    additionalDetails: 'Parking is behind the building',
  },
  suggestedAddress: {
    zip: '80205-3316',
    streetAddress1: '5830 Elliot Avenue',
    streetAddress2: '#202',
    city: 'Denver',
    state: 'CO',
    additionalDetails: 'Parking is behind the building',
    valid: true,
    reasons: [],
  },
  consistencyToken: new Uint8Array(8).toString(),
  accountId: 1,
  status: AddressStatus.VALID,
};

export const mockUpdatePatientAccountAddressPayload: UpdatePatientAccountAddressPayload =
  {
    accountId: 1,
    id: 1,
    consistencyToken: new Uint8Array(8).toString(),
    city: 'Denver',
    state: 'Colorado',
    zip: '80205',
    streetAddress1: '5830 Elliot Avenue',
    streetAddress2: '#202',
    additionalDetails: 'Parking is behind the building',
    facilityType: FacilityType.FACILITY_TYPE_HOME,
  };

export const mockPatientAddress: PatientAddress = {
  city: 'Denver',
  state: 'Colorado',
  zip: '80205',
  streetAddress1: '5830 Elliot Avenue',
  streetAddress2: '#202',
  additionalDetails: 'Parking is behind the building',
};

export const mockPatientAccountAddressData: Required<PatientAccountAddressData> =
  {
    zipCode: '80205',
    streetAddress1: '5830 Elliot Avenue',
    streetAddress2: '#202',
    city: 'Denver',
    state: 'Colorado',
    locationType: 'Home',
    locationDetails: 'Parking is behind the building',
  };

export const mockGetAccountPatientsQuery: GetAccountPatientsQuery = { id: 1 };

export const mockPatientAccountUnverifiedPatient: Required<
  Pick<
    DomainUnverifiedPatient,
    | 'id'
    | 'dateOfBirth'
    | 'phoneNumber'
    | 'legalSex'
    | 'genderIdentity'
    | 'givenName'
    | 'familyName'
    | 'patientId'
    | 'consistencyToken'
  >
> = {
  id: 1,
  dateOfBirth: '1944-08-30',
  phoneNumber: '4023999305',
  legalSex: 'm',
  genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
  givenName: 'John',
  familyName: 'Doe',
  patientId: 1,
  consistencyToken: new Uint8Array(8).toString(),
};

export const mockCreatePatientAccountUnverifiedPatientPayload: CreatePatientAccountUnverifiedPatientPayload & {
  unverifiedPatient: Required<
    CreatePatientAccountUnverifiedPatientPayload['unverifiedPatient']
  >;
} = {
  accountId: 1,
  unverifiedPatient: {
    givenName: 'John',
    familyName: 'Doe',
    phoneNumber: '4023999305',
    legalSex: Gender.Male,
    birthSex: BirthSex.BIRTH_SEX_MALE,
    genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
    genderIdentityDetails: 'Other',
    dateOfBirth: '1980-01-30',
  },
};

export const mockPatientAccountPatientLink: PatientAccountPatientLink = {
  id: '1',
  accountId: '1',
  patient: mockPatientAccountUnverifiedPatient,
};

export const mockAddPatientAccountUnverifiedPatientLinkPayload: AddPatientAccountUnverifiedPatientLinkPayload =
  {
    accountId: '1',
    unverifiedPatientId: 1,
    consentingRelationship: {
      category: ConsentingRelationshipCategory.CATEGORY_SELF,
    },
  };

export const mockInsuranceParams: InsuranceParams = {
  priority: InsurancePriority.PRIMARY,
  memberId: '123',
  packageId: '123',
  companyName: 'Awesome Network 1',
  insurancePlanId: 1,
  primaryInsuranceHolderToggle: RelationToPatient.Patient,
  insuredSameAsPatient: true,
  patientRelationToSubscriber: RelationToPatient.Patient,
  patientRelationshipToInsured: 'self',
  firstName: 'John',
  middleInitial: 'Joseph',
  lastName: 'Doe',
  gender: 'm',
  primaryInsuranceHolderAttributes: {
    firstName: 'John',
    middleInitial: 'Joseph',
    lastName: 'Doe',
    gender: 'm',
    patientRelationshipToInsured: 'self',
  },
};

export const mockCreatePatientAccountInsurancePayload: CreatePatientAccountInsurancePayload =
  {
    accountId: '1',
    patientId: '1',
    insuranceParams: mockInsuranceParams,
  };

export const mockInsurance: Required<
  Pick<
    DomainPatientInsurance,
    | 'id'
    | 'priority'
    | 'memberId'
    | 'packageId'
    | 'companyName'
    | 'insurancePlanId'
    | 'primaryInsuranceHolderToggle'
    | 'insuredSameAsPatient'
    | 'patientRelationToSubscriber'
    | 'patientRelationshipToInsured'
    | 'firstName'
    | 'middleInitial'
    | 'lastName'
    | 'gender'
    | 'primaryInsuranceHolder'
    | 'insuranceNetwork'
  >
> & {
  insuranceNetwork: Required<DomainPatientInsurance['insuranceNetwork']>;
} = {
  id: 1,
  priority: '1',
  memberId: '123',
  packageId: '123',
  companyName: 'Awesome Network 1',
  insurancePlanId: 1,
  primaryInsuranceHolderToggle: RelationToPatient.Patient,
  insuredSameAsPatient: true,
  patientRelationToSubscriber: RelationToPatient.Patient,
  patientRelationshipToInsured: 'self',
  firstName: 'John',
  middleInitial: 'Joseph',
  lastName: 'Doe',
  gender: 'm',
  primaryInsuranceHolder: {
    firstName: 'John',
    middleInitial: 'Joseph',
    lastName: 'Doe',
    gender: 'm',
    patientRelationshipToInsured: 'self',
  },
  insuranceNetwork: {
    id: 1,
    name: 'Awesome Network 1',
    notes: 'very cool network',
    packageId: 123,
    active: true,
    insurancePayerId: 1,
    insurancePayerName: 'Awesome Payer',
    insuranceClassificationId: 1,
    insurancePlanId: 1,
    eligibilityCheck: true,
    providerEnrollment: false,
    stateAbbrs: ['AS1'],
    claimsAddress: {
      zip: '80205',
      streetAddress1: '5830 Elliot Avenue',
      streetAddress2: '#202',
      city: 'Denver',
      state: 'Colorado',
    },
    addresses: [],
    createdAt: '2023-07-26T10:44:42.254Z',
    updatedAt: '2023-07-26T10:44:42.254Z',
    deletedAt: '',
  },
};

export const mockPatientAccountCheckEligibilityQuery: PatientAccountCheckEligibilityQuery =
  { accountId: '1', insuranceId: '1', patientId: '1' };

export const mockInsuranceWithEligibleStatus: typeof mockInsurance & {
  eligible: InsuranceEligibilityStatus;
} = {
  ...mockInsurance,
  eligible: InsuranceEligibilityStatus.Eligible,
};

export const mockCheckInsuranceEligibilityPayload: CheckInsuranceEligibilityPayload =
  {
    patient: {
      firstName: 'John',
      middleName: 'Joseph',
      lastName: 'Doe',
      gender: 'm',
    },
    selectedNetwork: mockedInsuranceNetwork,
    accountId: '1',
    patientId: 1,
    memberId: '1',
    isRequesterRelationshipSelf: true,
  };

export const mockCreatePatientEhrRecordPayload: CreatePatientEhrRecordPayload =
  {
    accountId: '1',
    unverifiedPatientId: '1',
    billingCityId: 1,
  };

export const mockPatientAccountVerifiedPatient: Required<
  Pick<
    DomainPatient,
    | 'id'
    | 'dateOfBirth'
    | 'phone'
    | 'gender'
    | 'firstName'
    | 'lastName'
    | 'suffix'
    | 'middleName'
    | 'email'
    | 'age'
    | 'consistencyToken'
    | 'powerOfAttorney'
  >
> = {
  id: 1,
  dateOfBirth: '1993-03-30',
  phone: '4023999305',
  gender: 'm',
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr.',
  middleName: 'Joseph',
  email: 'test@test.test',
  powerOfAttorney: {
    id: 1,
    name: 'John Doe',
  },
  age: 29,
  consistencyToken: new Uint8Array(8).toString(),
};

export const mockAccountPatients: (PatientAccountPatient & {
  patient: typeof mockPatientAccountVerifiedPatient;
  unverifiedPatient: typeof mockPatientAccountUnverifiedPatient;
})[] = [
  {
    id: 1,
    accountId: 1,
    accessLevel: 'phi',
    consentingRelationship: mockConsentingRelationship,
    patient: mockPatientAccountVerifiedPatient,
    unverifiedPatient: mockPatientAccountUnverifiedPatient,
    updatedAt: '2023-07-26T10:44:42.254Z',
    consistencyToken: new Uint8Array(8).toString(),
  },
];

export const mockDomainPatientAccountAddress: DomainPatientAccountAddress = {
  id: 1,
  zip: '80205',
  streetAddress1: '5830 Elliot Ave',
  streetAddress2: '#202',
  city: 'Denver',
  state: 'Colorado',
  additionalDetails: 'Parking is behind the building',
  facilityType: FacilityType.FACILITY_TYPE_HOME,
};

export const mockGetPatientInsurancesQuery: GetPatientInsurancesQuery = {
  accountId: 1,
  patientId: 1,
};

export const mockUpdatePatientAccountInsurancePayload: UpdatePatientAccountInsurancePayload =
  {
    accountId: '1',
    patientId: '1',
    insuranceId: '1',
    insuranceParams: mockInsuranceParams,
  };

export const mockUpdateAccountPatientPayload: UpdateAccountPatientPayload = {
  accountId: 1,
  patientId: 1,
  patient: {
    powerOfAttorney: {
      name: 'Peter Doe',
    },
  },
};

export const mockPatient: Required<
  Pick<
    DomainPatient,
    | 'id'
    | 'dateOfBirth'
    | 'phone'
    | 'gender'
    | 'firstName'
    | 'lastName'
    | 'suffix'
    | 'middleName'
    | 'email'
    | 'age'
    | 'consistencyToken'
    | 'powerOfAttorney'
  >
> = {
  id: 1,
  dateOfBirth: '1993-03-30',
  phone: '4023999305',
  gender: 'm',
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr.',
  middleName: 'Joseph',
  email: 'test@test.test',
  powerOfAttorney: {
    id: 1,
    name: 'John Doe',
  },
  age: 29,
  consistencyToken: new Uint8Array(8).toString(),
};

export const mockGetPatientQuery: GetPatientQuery = {
  accountId: '1',
  patientId: '1',
};

export const mockDeletePatientInsuranceQuery: DeletePatientInsuranceQuery = {
  accountId: '1',
  insuranceId: '1',
  patientId: '1',
};

export const mockDeletePatientInsuranceSuccessfulResponse: DeletePatientInsuranceResult =
  { success: true };

export const mockPatientPOA: Required<PowerOfAttorney> = {
  id: 1,
  patientId: 1,
  name: 'Peter Doe',
  phone: '3334123444',
  phoneNumber: {
    mobile: true,
  },
  relationship: RelationToPatient.Other,
  createdAt: '2023-08-26T20:44:50.254Z',
  updatedAt: '2023-07-26T10:44:42.254Z',
};

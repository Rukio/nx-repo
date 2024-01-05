import AccountDto from '../../dto/patient-account.dto';
import PatientAccountsInsuranceQueryDto from '../../dto/patient-insurance-query.dto';
import {
  AccessLevel,
  Account,
  AccountPatient,
  Insurance,
  InsuranceParams,
  OssAccountAddress,
  OssAddress,
  PatientAssociation,
  FacilityType,
} from '@*company-data-covered*/consumer-web-types';
import AccountAddressDto from '../../dto/address.dto';
import { MOCK_CONSENTING_RELATIONSHIP } from './patient-accounts.service.mock';

export const MOCK_PATIENT_ACCOUNT_ID = 28;

export const UPDATE_ACCOUNT_BODY_MOCK: AccountDto = {
  id: 123412,
  firstName: 'John',
  lastName: 'Doe',
  phone: '+12312312312',
};

export const ACCOUNT_MOCK_RESPONSE: Account = {
  id: UPDATE_ACCOUNT_BODY_MOCK.id,
  firstName: UPDATE_ACCOUNT_BODY_MOCK.firstName,
  lastName: UPDATE_ACCOUNT_BODY_MOCK.lastName,
  phone: UPDATE_ACCOUNT_BODY_MOCK.phone,
  email: UPDATE_ACCOUNT_BODY_MOCK.email,
  consistencyToken: new Uint8Array(8),
};

export const CREATE_ADDRESS_BODY_MOCK: AccountAddressDto = {
  city: 'Denver',
  state: 'Colorado',
  streetAddress1: 'Lafayette Street 123',
  streetAddress2: '',
  zip: '80205',
  id: 2,
  facilityType: FacilityType.FACILITY_TYPE_HOME,
};

export const CREATE_ADDRESS_RESPONSE: OssAccountAddress = {
  address: {
    id: 1,
    city: CREATE_ADDRESS_BODY_MOCK.city,
    state: CREATE_ADDRESS_BODY_MOCK.state,
    streetAddress1: CREATE_ADDRESS_BODY_MOCK.streetAddress1,
    streetAddress2: CREATE_ADDRESS_BODY_MOCK.streetAddress2,
    zip: CREATE_ADDRESS_BODY_MOCK.zip,
    facilityType: CREATE_ADDRESS_BODY_MOCK.facilityType,
  },
  consistencyToken: new Uint8Array(8),
};

export const LIST_ACCOUNT_ADDRESSES_MOCK: OssAddress[] = [
  {
    ...CREATE_ADDRESS_BODY_MOCK,
    consistencyToken: new Uint8Array(8),
  },
];

export const ADDRESS_ID_MOCK = 20;

export const UPDATE_ADDRESS_BODY_MOCK: AccountAddressDto = {
  city: CREATE_ADDRESS_BODY_MOCK.city,
  state: CREATE_ADDRESS_BODY_MOCK.state,
  streetAddress1: CREATE_ADDRESS_BODY_MOCK.streetAddress1,
  streetAddress2: CREATE_ADDRESS_BODY_MOCK.streetAddress2,
  zip: CREATE_ADDRESS_BODY_MOCK.zip,
  id: ADDRESS_ID_MOCK,
  consistencyToken: new Uint8Array(8),
  facilityType: CREATE_ADDRESS_BODY_MOCK.facilityType,
};

export const UPDATE_ADDRESS_MOCK_RESPONSE: OssAccountAddress = {
  address: {
    city: UPDATE_ADDRESS_BODY_MOCK.city,
    state: UPDATE_ADDRESS_BODY_MOCK.state,
    streetAddress1: UPDATE_ADDRESS_BODY_MOCK.streetAddress1,
    streetAddress2: UPDATE_ADDRESS_BODY_MOCK.streetAddress2,
    zip: UPDATE_ADDRESS_BODY_MOCK.zip,
    id: ADDRESS_ID_MOCK,
    facilityType: UPDATE_ADDRESS_BODY_MOCK.facilityType,
  },
  consistencyToken: new Uint8Array(8),
};

export const ACCOUNT_PATIENT_MOCK: AccountPatient = {
  id: 1,
  accountId: 1,
  patient: {
    id: 1,
    firstName: 'test',
    lastName: 'test',
    middleName: 'test',
    phone: '(303) 642-5578',
    email: 'test@gmail.com',
    ehrPatientId: '1',
    dateOfBirth: '1996-05-20',
    gender: 'male',
    address: {
      city: 'FORT MYERS',
      state: 'FL',
      zip: '33901',
      streetAddress1: '123 College Parkway',
      streetAddress2: '123 College Parkway',
    },
    voicemailConsent: true,
    guarantor: {
      firstName: 'test',
      lastName: 'test',
      dob: '1950-09-12',
      phone: '(240) 589-6052',
      email: 'test.te@hotmail.com',
      billingAddressZipcode: '33901',
      billingAddressCity: 'FORT MYERS',
      billingAddressState: 'FL',
      billingAddressStreetAddress1: '123 College Parkway',
    },
  },
  unverifiedPatient: undefined,
  accessLevel: AccessLevel.unspecified,
  consentingRelationship: MOCK_CONSENTING_RELATIONSHIP,
};

export const GET_ACCOUNT_PATIENTS_LIST_RESPONSE: AccountPatient[] = [
  ACCOUNT_PATIENT_MOCK,
];

export const PATIENT_ASSOCIATION_MOCK: PatientAssociation = {
  unverifiedPatientId: 1,
  consentingRelationship: MOCK_CONSENTING_RELATIONSHIP,
};

export const INSURANCE_MOCK_RESPONSE: Insurance = {
  middleInitial: '',
  firstName: '',
  gender: '',
  insuredSameAsPatient: false,
  lastName: '',
  primaryInsuranceHolderAttributes: {
    id: 555291,
    firstName: 'John',
    middleInitial: '',
    lastName: 'Dow ',
    gender: 'male',
    patientRelationshipToInsured: 'self',
  },
  id: 402998,
  patientId: 399656,
  priority: '1',
  companyName: 'Aetna Commercial',
  memberId: 59598,
  groupNumber: null,
  packageId: 6545,
  insurancePlanId: 1,
  patientRelationToSubscriber: 'patient',
  subscriberCity: '',
  primaryInsuranceHolder: {
    id: 555291,
    firstName: 'John',
    middleInitial: '',
    lastName: 'Dow ',
    gender: 'male',
    patientRelationshipToInsured: 'self',
    insuranceId: 402998,
    updatedAt: '2021-10-05T13:57:29.753Z',
  },
};

export const INSURANCE_PARAMS_MOCK: InsuranceParams = {
  primaryInsuranceHolderAttributes: undefined,
  priority: '1',
  companyName: 'Aetna Commercial',
  memberId: '12345',
  primaryInsuranceHolderToggle: 'patient',
  insuredSameAsPatient: false,
  packageId: 1,
  insurancePlanId: 1,
  patientRelationToSubscriber: 'self',
  gender: 'male',
  firstName: 'Oscar',
  lastName: 'Umeh ',
  middleInitial: 'P',
  patientRelationshipToInsured: 'self',
  skipProcessing: true,
};

export const INSURANCE_QUERY_DTO_MOCK: PatientAccountsInsuranceQueryDto = {
  patientId: '407474',
};

export const INSURANCE_ID_MOCK = '1';

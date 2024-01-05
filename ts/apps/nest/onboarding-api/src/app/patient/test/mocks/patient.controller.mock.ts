import {
  CareRequestType,
  EhrPatient,
  Patient,
  PatientSearchParam,
  RequestStatus,
  WebRequestPatient,
} from '@*company-data-covered*/consumer-web-types';
import UpdatePatientDto from '../../dto/update-patient.dto';
import CreateEhrPatientDto from '../../dto/create-ehr-patient.dto';

export const PATIENT_MOCK: Patient = {
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  gender: 'm',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  patientSafetyFlag: {
    id: 1,
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
};

export const UNVERIFIED_PATIENT_MOCK: Patient = {
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  gender: 'm',
};

export const PATIENT_RESULT_MOCK: Patient = {
  id: 123,
  suffix: 'Mr',
  firstName: 'John',
  lastName: 'Doe',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  gender: 'm',
  voicemailConsent: undefined,
  ehrPatientId: undefined,
  age: 22,
  channelItemId: undefined,
  eligibilityFileId: undefined,
  eligiblePatientId: undefined,
  className: undefined,
  patientId: undefined,
  guarantor: undefined,
  powerOfAttorney: undefined,
  address: {
    city: 'test-city',
    state: 'test-state',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
  },
  patientSafetyFlag: {
    flagType: 'permanent',
    flagReason: 'Provider Safety',
  },
};

export const PATIENT_RESULT_WITH_LAST_REQUEST_MOCK: Patient = {
  id: 123,
  suffix: 'Mr',
  firstName: 'John',
  lastName: 'Doe',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  gender: 'm',
  voicemailConsent: undefined,
  ehrPatientId: undefined,
  age: 22,
  channelItemId: undefined,
  eligibilityFileId: undefined,
  eligiblePatientId: undefined,
  className: undefined,
  patientId: undefined,
  guarantor: undefined,
  powerOfAttorney: undefined,
  address: {
    city: 'test-city',
    state: 'test-state',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
  },
  lastCareRequest: {
    id: 1390765,
    patientId: 918115,
    requestStatus: RequestStatus.archived,
    requestType: CareRequestType.express,
    createdAt: '2022-09-15T18:03:46.000Z',
    updatedAt: '2022-09-15T18:31:42.000Z',
    city: 'test-city',
    state: 'test-state',
    zipcode: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    billingCityId: 6,
    channelItemId: 3769,
    channelItem: {
      id: 3769,
      channelId: 56,
      name: 'Healthcare provider\t',
      sourceName: 'Healthcare Partners',
      typeName: 'Provider Group',
      agreement: null,
      addressOld: null,
      cityOld: null,
      zipcodeOld: null,
      phone: '303-555-1234',
      email: 'sam_runte@wehner-graham.io',
      contactPerson: 'Ahsoka Tano',
      createdAt: '2020-04-07T00:00:00.000Z',
      updatedAt: '2022-10-15T09:53:27.697Z',
      stateOld: null,
      deactivatedAt: null,
      casePolicyNumber: '8594840822',
      blendedBill: false,
      blendedDescription: null,
      emrProviderId: null,
      preferredPartner: null,
      preferredPartnerDescription: null,
      sendClinicalNote: null,
      sendNoteAutomatically: null,
      erDiversion: null,
      nineOneOneDiversion: null,
      observationDiversion: null,
      hospitalizationDiversion: null,
      snfCredentials: false,
      prepopulateBasedOnAddress: false,
      address2Old: null,
    },
    callerId: 1468481,
    chiefComplaint: 'Charged my Asparagus',
    consentSignature: {
      url: null,
      thumb: {
        url: null,
      },
      tiny: {
        url: null,
      },
    },
    dispatchQueueId: 4,
    marketId: 160,
    latitude: 43.7235259,
    longitude: -116.2692976,
    originPhone: '3035001518',
    placeOfService: 'Home',
    requiredSkillIds: [52],
    serviceLineId: 1,
    signed: false,
  },
};

export const SECOND_PATIENT_MOCK: Patient = {
  id: 13,
  suffix: 'Mr',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '0923319057',
  email: 'test@email2.com',
  dateOfBirth: '11-05-1989',
  gender: 'f',
  voicemailConsent: undefined,
  ehrPatientId: undefined,
  age: 22,
  channelItemId: undefined,
  eligibilityFileId: undefined,
  eligiblePatientId: undefined,
  className: undefined,
  patientId: undefined,
  guarantor: undefined,
  powerOfAttorney: undefined,
  address: {
    city: 'test-city',
    state: 'test-state',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
  },
};

export const PATIENT_EHR_MOCK: EhrPatient = {
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: undefined,
    city: 'test-city',
    state: 'test-state',
  },
  patientId: 123,
  dateOfBirth: '01-05-1981',
  gender: 'm',
  firstName: 'John',
  lastName: 'Doe',
  ehrPatientId: undefined,
};

export const WEB_REQUEST_PATIENT_MOCK: WebRequestPatient = {
  id: 1,
  firstName: 'test',
  lastName: 'test',
  phone: '4242424242',
  dateOfBirth: '1997-12-05',
  email: 'test@gmail.com',
  gender: 'male',
  createdAt: '2022-12-19T16:25:19.000Z',
  updatedAt: '2022-12-19T16:25:21.000Z',
  careRequestId: 613979,
};

export const UPDATE_PATIENT_MOCK: UpdatePatientDto = {
  id: 123,
  firstName: 'John',
  lastName: 'Doe',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  gender: 'm',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  patientSafetyFlag: {
    id: 1,
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
};

export const PATIENTS_SEARCH_RESULT_MOCK: Array<Patient> = [
  {
    id: 12,
    firstName: 'John',
    lastName: 'Doe',
    suffix: 'Mr',
    email: 'test@email1.com',
    phone: '0923319057',
    dateOfBirth: '1981-05-01',
    ehrPatientId: undefined,
    guarantor: undefined,
    powerOfAttorney: undefined,
    channelItemId: undefined,
    voicemailConsent: undefined,
    gender: 'm',
    address: {
      zip: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    age: 22,
  },
  {
    id: 13,
    firstName: 'Jane',
    lastName: 'Doe',
    suffix: 'Ms',
    email: 'test@email2.com',
    phone: '0923319057',
    dateOfBirth: '1989-05-11',
    ehrPatientId: undefined,
    guarantor: undefined,
    powerOfAttorney: undefined,
    channelItemId: undefined,
    voicemailConsent: undefined,
    gender: 'f',
    address: {
      zip: '1231',
      streetAddress1: '123',
      streetAddress2: 'example',
      city: 'test-city',
      state: 'test-state',
    },
    age: 22,
  },
];

export const PATIENT_SEARCH_PARAM_MOCK: PatientSearchParam = {
  firstName: 'John',
  lastName: 'Doe',
  limit: 50,
  offset: 0,
};

export const PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK: PatientSearchParam = {
  firstName: 'John',
  lastName: 'Doe',
  zipCode: '1231',
  dateOfBirth: '1993-03-31',
  limit: 50,
  offset: 0,
};

export const PATIENT_ID_MOCK = 123;

export const PATIENT_BILLING_CITY_ID_MOCK: CreateEhrPatientDto = {
  billingCityId: 5,
};

export const REQUEST_MOCK = {
  user: {
    'https://*company-data-covered*.com/email': 'test@test.com',
  },
};

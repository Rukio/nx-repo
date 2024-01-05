import { getDate, getMonth, getYear } from 'date-fns';
import {
  CareRequestType,
  Insurance,
  InsuranceParams,
  Patient,
  PatientSearchParam,
  RequestStatus,
  StationPatient,
  UnverifiedPatient,
} from '@*company-data-covered*/consumer-web-types';
import {
  Patient as GrpcPatient,
  PatientRecordIdentifier_PatientRecordSource,
  PatientSafetyFlag_FlagType,
  RelationToPatient,
} from '@*company-data-covered*/protos/nest/common/patient';
import {
  PhoneNumber_PhoneNumberType,
  Sex,
} from '@*company-data-covered*/protos/nest/common/demographic';
import {
  CreateUnverifiedPatientRequest,
  CreateUnverifiedPatientResponse,
  SearchPatientsRequest,
  SearchPatientsResult,
} from '@*company-data-covered*/protos/nest/patients/service';

import grpcMapper from '../../patient.grpc.mapper';
import { UnverifiedPatient as GrpcUnverifiedPatient } from '@*company-data-covered*/protos/nest/patients/patient';
import { InsuranceRecord } from '@*company-data-covered*/protos/nest/patients/insurance';
import PhoneNumberType = PhoneNumber_PhoneNumberType;

export const STATION_PATIENT_MOCK: StationPatient = {
  id: 123,
  first_name: 'Station',
  last_name: 'Patient',
  suffix: '',
  mobile_number: '+13234234212',
  email: 'station@patient.mock',
  dob: '1993-03-30',
  gender: 'm',
  age: 29,
  channel_item_id: 6235,
  zipcode: '1231',
  street_address_1: '123',
  street_address_2: 'example',
  city: 'test-city',
  state: 'test-state',
  patient_safety_flag_attributes: {
    id: 1,
    flag_reason: 'Provider Safety',
    flag_type: 'permanent',
  },
};

export const TRANSFORMED_AOB_PATIENT: Patient = {
  id: 123,
  suffix: '',
  firstName: 'Station',
  lastName: 'Patient',
  phone: '+13234234212',
  email: 'station@patient.mock',
  dateOfBirth: '1993-03-30',
  gender: 'm',
  age: 29,
  channelItemId: 6235,
  address: {
    city: 'test-city',
    state: 'test-state',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
  },
};

export const STATION_PATIENT_WITH_LAST_REQUEST_MOCK: StationPatient = {
  id: 321,
  first_name: 'Station',
  last_name: 'Patient',
  suffix: '',
  mobile_number: '+13234234212',
  email: 'station@patient.mock',
  dob: '1993-03-30',
  gender: 'm',
  age: 29,
  channel_item_id: 6235,
  zipcode: '1231',
  street_address_1: '123',
  city: 'test-city',
  state: 'test-state',
  patient_safety_flag_attributes: {
    id: 1,
    flag_reason: 'Provider Safety',
    flag_type: 'permanent',
  },
  guarantor: {
    email: 'guarantor@email.com',
    first_name: 'GFirstname',
    last_name: 'GLastname',
    relationship_to_patient: 'else',
    dob: '1993-01-01',
    ssn: '6345345',
    billing_address_city: 'New City',
    billing_address_state: 'AA',
    billing_address_street_address_1: 'address 1',
    billing_address_street_address_2: '2',
    billing_address_zipcode: '12345',
  },
  power_of_attorney: {
    phone: '1000460800',
    phone_number: {
      mobile: false,
    },
    relationship: 'patient',
  },
  last_care_request: {
    billing_city_id: 6,
    caller_id: 1468481,
    channel_item_id: 3769,
    chief_complaint: 'Charged my Asparagus',
    created_at: '2022-09-15T18:03:46.000Z',
    dispatch_queue_id: 4,
    id: 1390765,
    market_id: 160,
    origin_phone: '3035001518',
    patient_id: 918115,
    place_of_service: 'Home',
    request_status: RequestStatus.archived,
    request_type: CareRequestType.express,
    required_skill_ids: [52],
    service_line_id: 1,
    updated_at: '2022-09-15T18:31:42.000Z',
    city: 'Denwer',
    latitude: 43.7235259,
    longitude: -116.2692976,
    state: 'ID',
    unsynched_changes: {},
  },
};

export const TRANSFORMED_AOB_PATIENT_WITH_LAST_REQUEST: Patient = {
  id: 321,
  suffix: '',
  firstName: 'Station',
  lastName: 'Patient',
  phone: '+13234234212',
  email: 'station@patient.mock',
  dateOfBirth: '1993-03-30',
  gender: 'm',
  age: 29,
  channelItemId: 6235,
  guarantor: {
    email: 'guarantor@email.com',
    firstName: 'GFirstname',
    lastName: 'GLastname',
    relationshipToPatient: 'else',
    dob: '1993-01-01',
    ssn: '6345345',
    billingAddressCity: 'New City',
    billingAddressState: 'AA',
    billingAddressStreetAddress1: 'address 1',
    billingAddressStreetAddress2: '2',
    billingAddressZipcode: '12345',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: false,
    },
    relationship: 'patient',
  },
  address: {
    city: 'Denwer',
    state: 'ID',
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: undefined,
  },
  lastCareRequest: {
    id: 1390765,
    patientId: 918115,
    requestStatus: RequestStatus.archived,
    requestType: CareRequestType.express,
    createdAt: '2022-09-15T18:03:46.000Z',
    updatedAt: '2022-09-15T18:31:42.000Z',
    state: 'ID',
    city: 'Denwer',
    billingCityId: 6,
    channelItemId: 3769,
    callerId: 1468481,
    chiefComplaint: 'Charged my Asparagus',
    dispatchQueueId: 4,
    marketId: 160,
    latitude: 43.7235259,
    longitude: -116.2692976,
    originPhone: '3035001518',
    placeOfService: 'Home',
    requiredSkillIds: [52],
    serviceLineId: 1,
    unsynchedChanges: {},
  },
};

export const CREATE_PATIENT_MOCK: Patient = {
  firstName: 'Mapper',
  lastName: 'Test',
  suffix: 'Mrs',
  phone: '8004601000',
  email: 'test2@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  gender: 'f',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  billingCityId: 5,
};

export const TRANSFORMED_STATION_PATIENT: StationPatient = {
  first_name: 'Mapper',
  last_name: 'Test',
  suffix: 'Mrs',
  mobile_number: '8004601000',
  patient_email: 'test2@test.test',
  dob: '1981-05-01',
  gender: 'f',
};

export const PATIENT_AOB_MOCK: Patient = {
  firstName: 'Mapper',
  lastName: 'Test',
  suffix: 'Mrs',
  phone: '8004601000',
  email: 'test2@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: undefined,
  gender: 'f',
};

export const PATIENT_AOB_WITH_GUARANTOR_MOCK: Patient = {
  firstName: 'Mapper',
  lastName: 'Test',
  suffix: 'Mrs',
  phone: '8004601000',
  email: 'test2@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: undefined,
  gender: 'f',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  guarantor: {
    lastName: 'GLastname',
    firstName: 'GFirstname',
    dob: '1993-01-01',
    billingAddressCity: 'New City',
    billingAddressZipcode: '12345',
    billingAddressState: 'AA',
    billingAddressStreetAddress1: 'address 1',
    billingAddressStreetAddress2: '2',
    relationshipToPatient: 'else',
    ssn: '6345345',
    email: 'guarantor@email.com',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: false,
    },
    relationship: 'patient',
  },
};

export const TRANSFORMED_STATION_PATIENT_WITH_GUARANTOR: StationPatient = {
  first_name: 'John',
  last_name: 'Doe',
  middle_name: 'Jeremy',
  suffix: 'Mr',
  mobile_number: '0923319057',
  patient_email: 'test@test.test',
  ssn: 'ssnnumber',
  dob: '1981-05-01',
  gender: 'other',
  city: 'test-city',
  state: 'test-state',
  zipcode: '1231',
  voicemail_consent: true,
  street_address_1: '123',
  street_address_2: 'example',
  ehr_id: '345353',
  guarantor_attributes: {
    email: 'guarantor@email.com',
    first_name: 'GFirstname',
    last_name: 'GLastname',
    relationship_to_patient: 'else',
    dob: '1993-01-01',
    ssn: '6345345',
    billing_address_city: 'New City',
    billing_address_state: 'AA',
    billing_address_street_address_1: 'address 1',
    billing_address_street_address_2: '2',
    billing_address_zipcode: '12345',
  },
  power_of_attorney: {
    phone: '1000460800',
    phone_number: {
      mobile: false,
    },
    relationship: 'patient',
  },
  power_of_attorney_attributes: {
    phone: '1000460800',
    phone_number: {
      mobile: false,
    },
    relationship: 'patient',
  },
};

export const CREATE_PATIENT_WITH_GUARANTOR_MOCK: Patient = {
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Jeremy',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: '345353',
  gender: 'other',
  ssn: 'ssnnumber',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  guarantor: {
    lastName: 'GLastname',
    firstName: 'GFirstname',
    dob: '1993-01-01',
    billingAddressCity: 'New City',
    billingAddressZipcode: '12345',
    billingAddressState: 'AA',
    billingAddressStreetAddress1: 'address 1',
    billingAddressStreetAddress2: '2',
    relationshipToPatient: 'else',
    ssn: '6345345',
    email: 'guarantor@email.com',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: false,
    },
    relationship: 'patient',
  },
  voicemailConsent: true,
  billingCityId: 5,
};

export const CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK: Patient = {
  id: 1,
  ssn: 'ssnnumber',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Jeremy',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: '345353',
  gender: 'other',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  voicemailConsent: true,
  consistencyToken: new Uint8Array(8),
  guarantor: {
    lastName: 'GLastname',
    firstName: 'GFirstname',
    dob: '1993-01-01',
    billingAddressCity: 'New City',
    billingAddressZipcode: '12345',
    billingAddressState: 'AA',
    billingAddressStreetAddress1: 'address 1',
    billingAddressStreetAddress2: '2',
    relationToPatient: 'else',
    ssn: '6345345',
    email: 'guarantor@email.com',
    phone: '',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: false,
    },
    relationship: 'patient',
  },
  billingCityId: 5,
};

export const UPDATE_PATIENT_MOCK: Patient = {
  firstName: 'Updated',
  lastName: 'Patient',
  phone: '8004601000',
  email: 'test2@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  billingCityId: 5,
};

export const TRANSFORMED_GRPC_PATIENT_MOCK: GrpcPatient = {
  name: {
    given_name: CREATE_PATIENT_MOCK.firstName,
    family_name: CREATE_PATIENT_MOCK.lastName,
    suffix: CREATE_PATIENT_MOCK.suffix,
  },
  contact_info: {
    address: {
      city: CREATE_PATIENT_MOCK.address.city,
      state: CREATE_PATIENT_MOCK.address.state,
      zip_code: CREATE_PATIENT_MOCK.address.zip,
      address_line_one: CREATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: CREATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: CREATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: CREATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: CREATE_PATIENT_MOCK.gender === 'f' ? Sex.SEX_FEMALE : Sex.SEX_MALE,
  birth_sex: grpcMapper.protoBirthSex(CREATE_PATIENT_MOCK.birthSex),
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: CREATE_PATIENT_MOCK.billingCityId.toString(),
  },
};

export const TRANSFORMED_UPDATE_GRPC_PATIENT_MOCK: GrpcPatient = {
  id: '1',
  name: {
    given_name: UPDATE_PATIENT_MOCK.firstName,
    family_name: UPDATE_PATIENT_MOCK.lastName,
  },
  contact_info: {
    address: {
      city: UPDATE_PATIENT_MOCK.address.city,
      state: UPDATE_PATIENT_MOCK.address.state,
      zip_code: UPDATE_PATIENT_MOCK.address.zip,
      address_line_one: UPDATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: UPDATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: UPDATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: UPDATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(UPDATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: UPDATE_PATIENT_MOCK.billingCityId.toString(),
  },
};

export const TRANSFORMED_GRPC_PATIENT_WITH_GUARANTOR_MOCK: GrpcPatient = {
  social_security_number: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.ssn,
  name: {
    given_name: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.firstName,
    family_name: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.lastName,
    suffix: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.suffix,
    middle_name_or_initial: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.middleName,
  },
  voicemail_consent: true,
  primary_identifier: {
    record_id: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.ehrPatientId,
    source:
      PatientRecordIdentifier_PatientRecordSource.PATIENT_RECORD_SOURCE_ATHENA,
  },
  contact_info: {
    address: {
      city: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.address.city,
      state: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.address.state,
      zip_code: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.address.zip,
      address_line_one:
        CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.address.streetAddress1,
      address_line_two:
        CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.address.streetAddress2,
    },
    email: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.email,
    mobile_number: {
      phone_number: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: Sex.SEX_OTHER,
  date_of_birth: {
    day: getDate(
      grpcMapper.currentDate(
        CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.dateOfBirth,
        'yyyy-MM-dd'
      )
    ),
    month:
      getMonth(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.dateOfBirth,
          'yyyy-MM-dd'
        )
      ) + 1,
    year: getYear(
      grpcMapper.currentDate(
        CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.dateOfBirth,
        'yyyy-MM-dd'
      )
    ),
  },
  additional_identifiers: [],
  billing_city: {
    id: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.billingCityId.toString(),
  },
  guarantor: {
    name: {
      given_name: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.firstName,
      family_name: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.lastName,
    },
    date_of_birth: {
      day: getDate(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.dob,
          'yyyy-MM-dd'
        )
      ),
      month:
        getMonth(
          grpcMapper.currentDate(
            CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.dob,
            'yyyy-MM-dd'
          )
        ) + 1,
      year: getYear(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.dob,
          'yyyy-MM-dd'
        )
      ),
    },
    contact_info: {
      address: {
        city: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor
          .billingAddressCity,
        state:
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.billingAddressState,
        zip_code:
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressZipcode,
        address_line_one:
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressStreetAddress1,
        address_line_two:
          CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressStreetAddress2,
      },
      email: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.email,
      mobile_number: {
        phone_number: CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.phone,
        phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
    },
    social_security_number:
      CREATE_PATIENT_WITH_GUARANTOR_INFO_MOCK.guarantor.ssn,
  },
  medical_power_of_attorney: {
    patient_relation: {
      relation: RelationToPatient.RELATION_TO_PATIENT_SELF,
      other_relation_text: 'patient',
    },
    contact_info: {
      mobile_number: {
        phone_number: '1000460800',
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
    },
  },
};

export const CREATE_PATIENT_TRANSFORMED_MOCK: Patient = {
  id: 5443,
  ssn: '234234234',
  firstName: 'Mapper',
  lastName: 'Test',
  suffix: 'Mrs',
  phone: '8004601000',
  email: 'test2@test.test',
  dateOfBirth: '1981-05-01',
  ehrPatientId: undefined,
  gender: 'female',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  patientSafetyFlag: {
    flagReason: 'Provider Safety',
    flagType: 'permanent',
  },
  consistencyToken: new Uint8Array(8),
};

export const CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK: Patient = {
  id: 1,
  ssn: '1',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Jeremy',
  suffix: 'Mr',
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '01-05-1981',
  ehrPatientId: undefined,
  gender: 'male',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  voicemailConsent: false,
  consistencyToken: new Uint8Array(8),
  guarantor: {
    lastName: undefined,
    firstName: undefined,
    dob: '01-12-2005',
    billingAddressCity: undefined,
    billingAddressZipcode: undefined,
    billingAddressState: undefined,
    billingAddressStreetAddress1: undefined,
    billingAddressStreetAddress2: undefined,
    relationshipToPatient: 'else',
    ssn: '6345345',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: true,
    },
    relationship: 'patient',
  },
};

export const CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_TRANSFORMED_MOCK: Patient = {
  id: 1,
  ssn: '1',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'Jeremy',
  suffix: 'Mr',
  ehrPatientId: undefined,
  phone: '0923319057',
  email: 'test@test.test',
  dateOfBirth: '1981-05-01',
  gender: 'male',
  address: {
    zip: '1231',
    streetAddress1: '123',
    streetAddress2: 'example',
    city: 'test-city',
    state: 'test-state',
  },
  voicemailConsent: false,
  consistencyToken: new Uint8Array(8),
  guarantor: {
    dob: '2005-12-01',
    ssn: '6345345',
  },
  powerOfAttorney: {
    phone: '1000460800',
    phoneNumber: {
      mobile: true,
    },
    relationship: 'patient',
  },
};

export const CREATE_GRPC_PATIENT_MOCK: GrpcPatient = {
  id: '5443',
  social_security_number: '234234234',
  name: {
    given_name: CREATE_PATIENT_MOCK.firstName,
    family_name: CREATE_PATIENT_MOCK.lastName,
    suffix: CREATE_PATIENT_MOCK.suffix,
  },
  contact_info: {
    address: {
      city: CREATE_PATIENT_MOCK.address.city,
      state: CREATE_PATIENT_MOCK.address.state,
      zip_code: CREATE_PATIENT_MOCK.address.zip,
      address_line_one: CREATE_PATIENT_MOCK.address.streetAddress1,
      address_line_two: CREATE_PATIENT_MOCK.address.streetAddress2,
    },
    email: CREATE_PATIENT_MOCK.email,
    mobile_number: {
      phone_number: CREATE_PATIENT_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
  },
  sex: CREATE_PATIENT_MOCK.gender === 'f' ? Sex.SEX_FEMALE : Sex.SEX_MALE,
  date_of_birth: {
    day: getDate(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
    month:
      getMonth(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)) + 1,
    year: getYear(grpcMapper.currentDate(CREATE_PATIENT_MOCK.dateOfBirth)),
  },
  additional_identifiers: [],
  billing_city: {
    id: '59',
  },
  patient_safety_flag: {
    flagger_user_id: '1',
    type: PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT,
    reason: 'Provider Safety',
  },
};

export const CREATE_GRPC_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK: GrpcPatient = {
  id: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.id.toString(),
  social_security_number: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.ssn,
  name: {
    given_name: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.firstName,
    family_name: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.lastName,
    suffix: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.suffix,
    middle_name_or_initial:
      CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.middleName,
  },
  voicemail_consent:
    CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.voicemailConsent,
  primary_identifier: {
    record_id: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.ehrPatientId,
    source:
      PatientRecordIdentifier_PatientRecordSource.PATIENT_RECORD_SOURCE_ATHENA,
  },
  contact_info: {
    address: {
      city: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.address.city,
      state: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.address.state,
      zip_code: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.address.zip,
      address_line_one:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.address.streetAddress1,
      address_line_two:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.address.streetAddress2,
    },
    email: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.email,
    mobile_number: {
      phone_number: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      country_code: 1,
    },
    work_number: {
      phone_number: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_WORK,
      country_code: 1,
    },
    home_number: {
      phone_number: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.phone,
      phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_HOME,
      country_code: 1,
    },
  },
  sex:
    CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.gender === 'f'
      ? Sex.SEX_FEMALE
      : Sex.SEX_MALE,
  date_of_birth: {
    day: getDate(
      grpcMapper.currentDate(
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.dateOfBirth
      )
    ),
    month:
      getMonth(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.dateOfBirth
        )
      ) + 1,
    year: getYear(
      grpcMapper.currentDate(
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.dateOfBirth
      )
    ),
  },
  additional_identifiers: [],
  billing_city: {
    id: '59',
  },
  guarantor: {
    name: {
      given_name:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.firstName,
      family_name:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.lastName,
    },
    date_of_birth: {
      day: getDate(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.dob
        )
      ),
      month:
        getMonth(
          grpcMapper.currentDate(
            CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.dob
          )
        ) + 1,
      year: getYear(
        grpcMapper.currentDate(
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.dob
        )
      ),
    },
    patient_relation: {
      relation: RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED,
      other_relation_text:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.relationToPatient,
    },
    contact_info: {
      address: {
        city: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor
          .billingAddressCity,
        state:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressState,
        zip_code:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressZipcode,
        address_line_one:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressStreetAddress1,
        address_line_two:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor
            .billingAddressStreetAddress2,
      },
      email: CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.email,
      mobile_number: {
        phone_number:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.phone,
        phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
      work_number: {
        phone_number:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.phone,
        phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_WORK,
        country_code: 1,
      },
      home_number: {
        phone_number:
          CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.phone,
        phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_HOME,
        country_code: 1,
      },
    },
    social_security_number:
      CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.guarantor.ssn,
  },
  medical_power_of_attorney: {
    name: {
      preferred_name:
        CREATE_PATIENT_WITHOUT_GUARANTOR_INFO_MOCK.powerOfAttorney.name,
    },
    patient_relation: {
      relation: RelationToPatient.RELATION_TO_PATIENT_SELF,
      other_relation_text: 'patient',
    },
    contact_info: {
      mobile_number: {
        phone_number: '1000460800',
        phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
        country_code: 1,
      },
    },
  },
};

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
  dateOfBirth: '1993-03-30',
  limit: 2,
  offset: 0,
};

export const TRANSFORMED_PATIENT_GRPC_SEARCH_PARAM_MOCK: SearchPatientsRequest =
  {
    given_name: PATIENT_SEARCH_PARAM_MOCK.firstName,
    family_name: PATIENT_SEARCH_PARAM_MOCK.lastName,
    channel_item_ids: [],
    search_term: `${PATIENT_SEARCH_PARAM_MOCK.lastName}, ${PATIENT_SEARCH_PARAM_MOCK.firstName}`,
  };

export const TRANSFORMED_PATIENT_GRPC_SEARCH_WITH_ZIPCODE_PARAM_MOCK: SearchPatientsRequest =
  {
    given_name: PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.firstName,
    family_name: PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.lastName,
    search_term: `${PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.lastName}, ${PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.firstName}`,
    zip_code: PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.zipCode,
    date_of_birth: {
      day: getDate(
        grpcMapper.currentDate(
          PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.dateOfBirth,
          'yyyy-MM-dd'
        )
      ),
      month:
        getMonth(
          grpcMapper.currentDate(
            PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.dateOfBirth,
            'yyyy-MM-dd'
          )
        ) + 1,
      year: getYear(
        grpcMapper.currentDate(
          PATIENT_SEARCH_PARAM_WITH_ZIP_MOCK.dateOfBirth,
          'yyyy-MM-dd'
        )
      ),
    },
    channel_item_ids: [],
  };

export const GRPC_PATIENT_SEARCH_RESULTS: SearchPatientsResult[] = [
  {
    patient: {
      ...TRANSFORMED_GRPC_PATIENT_MOCK,
      id: '1',
    },
  },
  {
    patient: {
      ...TRANSFORMED_GRPC_PATIENT_MOCK,
      id: '2',
    },
  },
];

export const GRPC_UNVERIFIED_BODY_MOCK: CreateUnverifiedPatientRequest = {
  athena_id: 123,
  birth_sex: TRANSFORMED_GRPC_PATIENT_MOCK.birth_sex,
  date_of_birth: TRANSFORMED_GRPC_PATIENT_MOCK.date_of_birth,
  legal_sex: TRANSFORMED_GRPC_PATIENT_MOCK.sex,
  given_name: TRANSFORMED_GRPC_PATIENT_MOCK.name?.given_name,
  family_name: TRANSFORMED_GRPC_PATIENT_MOCK.name?.family_name,
  gender_identity: {
    category: 3,
    other_details: undefined,
  },
  phone_number: {
    phone_number: CREATE_PATIENT_MOCK.phone,
    phone_number_type: PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
    country_code: 1,
  },
};

export const GRPC_UNVERIFIED_PATIENT_MOCK: GrpcUnverifiedPatient = {
  ...GRPC_UNVERIFIED_BODY_MOCK,
  id: 1,
};

export const GRPC_CREATE_UNVERIFIED_RESPONSE: CreateUnverifiedPatientResponse =
  {
    patient: GRPC_UNVERIFIED_PATIENT_MOCK,
    consistency_token: new Uint8Array(8),
  };

export const INSURANCE_PARAMS_MOCK: InsuranceParams = {
  priority: '1',
  memberId: '12345',
  companyName: 'Aetna Commercial',
  primaryInsuranceHolderToggle: 'patient',
  insuredSameAsPatient: true,
  packageId: 1,
  insurancePlanId: 1,
  patientRelationToSubscriber: 'other',
  primaryInsuranceHolderAttributes: {
    firstName: 'Doe',
    middleInitial: 'P',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'self',
  },
  eligibilityStatus: 'unspecified',
  eligibilityMessage: 'unspecified',
  gender: 'male',
  firstName: 'Doe',
  lastName: 'John ',
  middleInitial: 'P',
  patientRelationshipToInsured: 'self',
  skipProcessing: true,
  cardFront:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1644241415-card_front.png',
  cardBack:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1654241415-card_front.png',
};

export const INSURANCE_RECORD_MOCK: InsuranceRecord = {
  id: '1',
  patient_id: '1',
  priority: 1,
  member_id: '12345',
  primary_insurance_holder: {
    name: {
      family_name: 'John',
      given_name: 'Doe',
      middle_name_or_initial: 'P',
    },
    patient_relation_to_subscriber: 7,
    sex: 1,
  },
  eligibility_status: 0,
  eligibility_message: 'unspecified',
  images: {
    '1': {
      image_type: 1,
      image_url:
        'https://uat.*company-data-covered*.com/card_front/default/408265/1644241415-card_front.png',
      verified: false,
    },
    '2': {
      image_type: 2,
      image_url:
        'https://uat.*company-data-covered*.com/card_front/default/408265/1654241415-card_front.png',
      verified: false,
    },
  },
  company_name: 'Aetna Commercial',
  package_id: '1',
  insurance_plan_id: 1,
};

export const INSURANCE_RECORD_WITHOUT_INSURANCE_PLAN_ID_MOCK: InsuranceRecord =
  {
    ...INSURANCE_RECORD_MOCK,
    insurance_plan_id: undefined,
  };

export const PATIENT_INSURANCE_MOCK: Insurance = {
  id: 1,
  insurancePlanId: 1,
  packageId: '1',
  patientId: '1',
  memberId: '12345',
  priority: '1',
  companyName: 'Aetna Commercial',
  primaryInsuranceHolder: {
    firstName: 'Doe',
    middleInitial: 'P',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'other',
    insuranceId: '1',
  },
  groupNumber: '56789',
  patientRelationToSubscriber: 'other',
  primaryInsuranceHolderAttributes: {
    firstName: 'Doe',
    middleInitial: 'P',
    lastName: 'John',
    gender: 'male',
    patientRelationshipToInsured: 'other',
    insuranceId: '1',
  },
  cardBackUrl:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1654241415-card_front.png',
  cardFrontUrl:
    'https://uat.*company-data-covered*.com/card_front/default/408265/1644241415-card_front.png',
  eligibilityMessage: 'unspecified',
  eligible: 'unspecified',
  firstName: 'Doe',
  gender: 'male',
  insuredSameAsPatient: true,
  lastName: 'John',
  middleInitial: 'P',
  updatedAt: new Date('2023-07-07T12:34:56.123Z'),
};

export const PATIENT_INSURANCE_WITHOUT_INSURANCE_PLAN_ID_MOCK: Insurance = {
  ...PATIENT_INSURANCE_MOCK,
  insurancePlanId: undefined,
};

export const UNVERIFIED_PATIENT_MOCK: UnverifiedPatient = {
  id: 1,
  givenName: 'Mapper',
  familyName: 'Test',
  phoneNumber: '8004601000',
  dateOfBirth: '1981-05-01',
  legalSex: 'female',
  birthSex: undefined,
  athenaId: 123,
  genderIdentity: 3,
  genderIdentityDetails: undefined,
  patientId: undefined,
  consistencyToken: new Uint8Array(8),
};

export const UNVERIFIED_PATIENT_MOCK_WITHOUT_CONSISTENCY_TOKEN: UnverifiedPatient =
  {
    ...UNVERIFIED_PATIENT_MOCK,
    consistencyToken: undefined,
  };

import {
  Account as GrpcAccount,
  AccountPatientLink as GrpcAccountPatient,
  AccountPatientLink_AccessLevel,
  AddressValidationStatus,
  AddUnverifiedAccountPatientLinkResponse,
  ConsentingRelationship as GrpcConsentingRelationship,
  ConsentingRelationship_Category,
  CreateAddressResponse,
  ListAccountPatientLinksResponse,
  ListAddressesResponse,
  UpdateAccountResponse,
  UpdateAddressResponse,
} from '@*company-data-covered*/protos/nest/patients/accounts/service';
import {
  GenderIdentity_Category,
  PhoneNumber_PhoneNumberType,
} from '@*company-data-covered*/protos/nest/common/demographic';
import {
  AccessLevel,
  Account,
  AccountPatient,
  Address,
  AddressStatus,
  BirthSex,
  ConsentingRelationship,
  ConsentingRelationshipCategory,
  GenderIdentityCategory,
  Insurance,
  InsuranceParams,
  OssAccountAddress,
  OssAddress,
  FacilityType,
} from '@*company-data-covered*/consumer-web-types';

export const MOCK_CONSENTING_RELATIONSHIP: ConsentingRelationship = {
  category: ConsentingRelationshipCategory.CATEGORY_SELF,
};

export const GRPC_CONSENTING_RELATIONSHIP_MOCK: GrpcConsentingRelationship = {
  category: ConsentingRelationship_Category.CATEGORY_SELF,
};

export const ACCOUNT_MOCK: Account = {
  id: 1,
  email: 'test@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '3035001518',
  consistencyToken: new Uint8Array(8),
};

export const GRPC_ACCOUNT_MOCK: GrpcAccount = {
  account_id: ACCOUNT_MOCK.id,
  email: ACCOUNT_MOCK.email,
  given_name: ACCOUNT_MOCK.firstName,
  family_name: ACCOUNT_MOCK.lastName,
  number: {
    phone_number_type:
      PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
    country_code: 1,
    phone_number: ACCOUNT_MOCK.phone,
  },
};

export const GRPC_ACCOUNT_RESPONSE_MOCK: UpdateAccountResponse = {
  account: GRPC_ACCOUNT_MOCK,
  consistency_token: new Uint8Array(8),
};

export const ACCOUNT_ADDRESS_MOCK: OssAddress = {
  city: 'Denver',
  state: 'Colorado',
  streetAddress1: 'Lafayette Street 123',
  streetAddress2: '',
  zip: '80205',
  additionalDetails: 'test',
  facilityType: FacilityType.FACILITY_TYPE_HOME,
};

export const CREATE_GRPC_ADDRESS_RESPONSE_MOCK: CreateAddressResponse = {
  address_validation_status:
    AddressValidationStatus.ADDRESS_VALIDATION_STATUS_VALID,
  address: {
    id: 1,
    account_id: 1,
    address: {
      city: ACCOUNT_ADDRESS_MOCK.city,
      state: ACCOUNT_ADDRESS_MOCK.state,
      address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
      address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
      zip_code: ACCOUNT_ADDRESS_MOCK.zip,
    },
    facility_type: ACCOUNT_ADDRESS_MOCK.facilityType,
    location: {
      latitude_e6: 39986633,
      longitude_e6: -82626003,
    },
  },
  suggested_address: undefined,
  consistency_token: new Uint8Array(8),
};

export const CREATE_ADDRESS_RESPONSE_MOCK: OssAccountAddress = {
  address: {
    id: CREATE_GRPC_ADDRESS_RESPONSE_MOCK.address.id,
    city: ACCOUNT_ADDRESS_MOCK.city,
    state: ACCOUNT_ADDRESS_MOCK.state,
    streetAddress1: ACCOUNT_ADDRESS_MOCK.streetAddress1,
    streetAddress2: ACCOUNT_ADDRESS_MOCK.streetAddress2,
    zip: ACCOUNT_ADDRESS_MOCK.zip,
    facilityType: ACCOUNT_ADDRESS_MOCK.facilityType,
  },
  status: AddressStatus.VALID,
  consistencyToken: new Uint8Array(8),
};

export const LIST_GRPC_ACCOUNT_ADDRESS_RESPONSE_MOCK: ListAddressesResponse = {
  results: [
    {
      address: {
        id: 1,
        account_id: 1,
        address: {
          city: ACCOUNT_ADDRESS_MOCK.city,
          state: ACCOUNT_ADDRESS_MOCK.state,
          address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
          address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
          zip_code: ACCOUNT_ADDRESS_MOCK.zip,
        },
        facility_type: ACCOUNT_ADDRESS_MOCK.facilityType,
        location_details: ACCOUNT_ADDRESS_MOCK.additionalDetails,
      },
      consistency_token: new Uint8Array(8),
    },
  ],
};

export const LIST_ACCOUNT_ADDRESSES_MOCK: Address[] = [
  {
    ...ACCOUNT_ADDRESS_MOCK,
    id: LIST_GRPC_ACCOUNT_ADDRESS_RESPONSE_MOCK.results[0].address.id,
    consistencyToken: new Uint8Array(8),
  },
];

export const UPDATE_ACCOUNT_ADDRESS_MOCK_RESPONSE: UpdateAddressResponse = {
  address_validation_status:
    AddressValidationStatus.ADDRESS_VALIDATION_STATUS_VALID,
  address: {
    id: 1,
    account_id: 2,
    address: {
      city: ACCOUNT_ADDRESS_MOCK.city,
      state: ACCOUNT_ADDRESS_MOCK.state,
      address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
      address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
      zip_code: ACCOUNT_ADDRESS_MOCK.zip,
    },
    facility_type: ACCOUNT_ADDRESS_MOCK.facilityType,
    location: {
      latitude_e6: 39986633,
      longitude_e6: -82626003,
    },
  },
  suggested_address: undefined,
  consistency_token: new Uint8Array(8),
};

export const ACCOUNT_ADDRESS_MOCK_RESPONSE: OssAccountAddress = {
  address: {
    city: ACCOUNT_ADDRESS_MOCK.city,
    state: ACCOUNT_ADDRESS_MOCK.state,
    streetAddress1: ACCOUNT_ADDRESS_MOCK.streetAddress1,
    streetAddress2: ACCOUNT_ADDRESS_MOCK.streetAddress2,
    zip: ACCOUNT_ADDRESS_MOCK.zip,
    id: 1,
    facilityType: ACCOUNT_ADDRESS_MOCK.facilityType,
  },
  status: AddressStatus.VALID,
  consistencyToken: new Uint8Array(8),
};

export const GRPC_LIST_ACCOUNT_PATIENT_MOCK: GrpcAccountPatient = {
  id: 1,
  account_id: 1,
  verified_patient: {
    id: '1',
    primary_identifier: { source: 1, record_id: '1' },
    name: {
      given_name: 'test',
      family_name: 'test',
      middle_name_or_initial: 'test',
    },
    billing_city: {
      id: '1',
    },
    additional_identifiers: [
      {
        source: 1,
        record_id: '1',
      },
    ],
    contact_info: {
      home_number: {
        phone_number_type: 1,
        country_code: 1,
        phone_number: '(520) 451-8895',
      },
      mobile_number: {
        phone_number_type: 2,
        country_code: 1,
        phone_number: '(303) 642-5578',
      },
      work_number: {
        phone_number_type: 3,
        country_code: 1,
        phone_number: '(555) 577-0723',
      },
      email: 'test@gmail.com',
      address: {
        address_line_one: '123 College Parkway',
        city: 'FORT MYERS',
        state: 'FL',
        zip_code: '33901',
      },
    },
    date_of_birth: { year: 1996, month: 5, day: 20 },
    sex: 1,
    guarantor: {
      name: {
        given_name: 'test',
        family_name: 'test',
        middle_name_or_initial: 'test',
      },
      date_of_birth: { year: 1950, month: 9, day: 12 },
      contact_info: {
        home_number: {
          phone_number_type: 1,
          country_code: 1,
          phone_number: '(240) 589-6052',
        },
        email: 'test.te@hotmail.com',
        address: {
          address_line_one: '123 College Parkway',
          city: 'FORT MYERS',
          state: 'FL',
          zip_code: '33901',
        },
      },
      patient_relation: {
        relation: 1,
        other_relation_text: 'test',
      },
    },
    voicemail_consent: true,
    channel_item_id: 1,
    source_type: 'mobile',
  },
  access_level: 2,
  consenting_relationship: GRPC_CONSENTING_RELATIONSHIP_MOCK,
  updated_at: { seconds: 1, nanos: 1 },
  consistency_token: new Uint8Array(8),
};

export const GRPC_LIST_ACCOUNT_PATIENT_RESPONSE_MOCK: ListAccountPatientLinksResponse =
  {
    result: [
      {
        account_patient_link: GRPC_LIST_ACCOUNT_PATIENT_MOCK,
        consistency_token: new Uint8Array(8),
      },
    ],
  };

export const ASSOCIATE_PATIENT_RESPONSE_MOCK: AddUnverifiedAccountPatientLinkResponse =
  {
    account_patient_link: GRPC_LIST_ACCOUNT_PATIENT_MOCK,
    consistency_token: new Uint8Array(8),
  };

export const GRPC_LIST_ACCOUNT_PATIENT_UNVERIFIED_MOCK: GrpcAccountPatient = {
  id: 1,
  account_id: 1,
  unverified_patient: {
    id: 1,
    athena_id: 123,
    date_of_birth: { year: 2023, month: 7, day: 19 },
    phone_number: {
      phone_number_type: 2,
      country_code: 1,
      phone_number: '(303) 642-5578',
    },
    legal_sex: 1,
    birth_sex: 1,
    gender_identity: {
      category: GenderIdentity_Category.CATEGORY_MALE,
      other_details: 'detail',
    },
    given_name: 'test',
    family_name: 'test',
    created_at: { seconds: 1, nanos: 1 },
    updated_at: { seconds: 1, nanos: 1 },
    patient_id: 123,
  },
  access_level: AccountPatientLink_AccessLevel.ACCESS_LEVEL_PHI,
  consenting_relationship: GRPC_CONSENTING_RELATIONSHIP_MOCK,
  updated_at: { seconds: 1, nanos: 1 },
  consistency_token: new Uint8Array(8),
};

export const ACCOUNT_PATIENT_RESPONSE: AccountPatient = {
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
    powerOfAttorney: undefined,
    ssn: undefined,
    suffix: undefined,
    consistencyToken: undefined,
    address: {
      city: 'FORT MYERS',
      state: 'FL',
      zip: '33901',
      streetAddress1: '123 College Parkway',
      streetAddress2: undefined,
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
      billingAddressStreetAddress2: undefined,
      ssn: undefined,
      relationToPatient: 'patient',
    },
  },
  unverifiedPatient: undefined,
  accessLevel: AccessLevel.phi,
  consentingRelationship: MOCK_CONSENTING_RELATIONSHIP,
  consistencyToken: new Uint8Array(8),
};

export const ACCOUNT_PATIENTS_LIST_UNVERIFIED_RESPONSE: AccountPatient = {
  id: 1,
  accountId: 1,
  unverifiedPatient: {
    id: 1,
    dateOfBirth: '2023-07-19',
    phoneNumber: '(303) 642-5578',
    legalSex: 'male',
    birthSex: BirthSex.BIRTH_SEX_MALE,
    genderIdentity: GenderIdentityCategory.CATEGORY_MALE,
    genderIdentityDetails: 'detail',
    givenName: 'test',
    familyName: 'test',
    athenaId: 123,
    patientId: 123,
    consistencyToken: undefined,
  },
  patient: undefined,
  accessLevel: AccessLevel.phi,
  consentingRelationship: MOCK_CONSENTING_RELATIONSHIP,
  consistencyToken: new Uint8Array(8),
};

export const INSURANCE_PARAMS_MOCK: InsuranceParams = {
  priority: 'normal',
  memberId: 1,
  packageId: 1,
  insurancePlanId: 1,
  companyName: 'test name',
  primaryInsuranceHolderToggle: '',
  insuredSameAsPatient: false,
  patientRelationToSubscriber: 'none',
  patientRelationshipToInsured: 'none',
  firstName: 'F name',
  middleInitial: 'M initial',
  lastName: 'L name',
  gender: 'gender',
  primaryInsuranceHolderAttributes: {
    firstName: 'f name',
    gender: 'gender',
    middleInitial: 'M initial',
    lastName: 'l name',
    patientRelationshipToInsured: 'none',
  },
};

export const INSURANCE_RESPONSE_MOCK: Insurance = {
  id: 7,
  packageId: 1,
  memberId: 1,
  insurancePlanId: 1,
  priority: 'normal',
  companyName: 'test name',
  insuredSameAsPatient: false,
  patientRelationToSubscriber: 'none',
  primaryInsuranceHolder: {
    firstName: 'f name',
    gender: 'gender',
    middleInitial: 'M initial',
    lastName: 'l name',
    patientRelationshipToInsured: 'none',
  },
  firstName: 'F name',
  gender: 'gender',
  middleInitial: 'M initial',
  lastName: 'L name',
};

import {
  Account,
  AccountAddress,
  Address,
  AddressStatus,
  OssAccountAddress,
  OssAddress,
  PatientAssociation,
} from '@*company-data-covered*/consumer-web-types';
import {
  Account as GrpcAccount,
  AccountAddress as GrpcAccountAddress,
  AddressValidationStatus,
  AddUnverifiedAccountPatientLinkRequest,
  CreateAddressRequest,
  CreateAddressResponse,
  FacilityType,
  UpdateAccountRequest,
} from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { PhoneNumber_PhoneNumberType } from '@*company-data-covered*/protos/nest/common/demographic';
import {
  GRPC_CONSENTING_RELATIONSHIP_MOCK,
  MOCK_CONSENTING_RELATIONSHIP,
} from './patient-accounts.service.mock';

export const PATIENT_ACCOUNT_MOCK: Account = {
  id: 1,
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '3035001518',
};

export const PATIENT_ASSOCIATION_PAYLOAD_MOCK: AddUnverifiedAccountPatientLinkRequest =
  {
    account_id: 1,
    unverified_patient_id: 123,
    consenting_relationship: GRPC_CONSENTING_RELATIONSHIP_MOCK,
  };

export const PATIENT_ASSOCIATION_MOCK: PatientAssociation = {
  unverifiedPatientId: 123,
  consentingRelationship: MOCK_CONSENTING_RELATIONSHIP,
};

export const TRANSFORM_GRPC_PATIENT_ACCOUNT_MOCK: GrpcAccount = {
  account_id: PATIENT_ACCOUNT_MOCK.id,
  email: PATIENT_ACCOUNT_MOCK.email,
  number: {
    phone_number_type:
      PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
    country_code: 1,
    phone_number: PATIENT_ACCOUNT_MOCK.phone,
  },
  given_name: PATIENT_ACCOUNT_MOCK.firstName,
  family_name: PATIENT_ACCOUNT_MOCK.lastName,
};

export const TRANSFORM_GRPC_UPDATE_ACCOUNT_PAYLOAD_MOCK: UpdateAccountRequest =
  {
    account_id: PATIENT_ACCOUNT_MOCK.id,
    given_name: PATIENT_ACCOUNT_MOCK.firstName,
    family_name: PATIENT_ACCOUNT_MOCK.lastName,
    number: {
      phone_number_type:
        PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
      country_code: 1,
      phone_number: PATIENT_ACCOUNT_MOCK.phone,
    },
    consistency_token: Buffer.from(new Uint8Array(8)),
  };

export const ACCOUNT_ID_MOCK = 2;

export const ACCOUNT_ADDRESS_MOCK: Address = {
  city: 'Denver',
  state: 'Colorado',
  streetAddress1: 'Lafayette Street 123',
  streetAddress2: '',
  zip: '80205',
  id: 1,
};

export const OSS_ACCOUNT_ADDRESS_MOCK: OssAddress = {
  ...ACCOUNT_ADDRESS_MOCK,
  facilityType: FacilityType.FACILITY_TYPE_HOME,
};

export const ACCOUNT_ADDRESS_WITH_PLACE_OF_SERVICE_MOCK: OssAddress = {
  ...ACCOUNT_ADDRESS_MOCK,
  facilityType: FacilityType.FACILITY_TYPE_HOME,
};

export const TRANSFORM_GRPC_ACCOUNT_ADDRESS_MOCK: GrpcAccountAddress = {
  id: ACCOUNT_ADDRESS_MOCK.id,
  account_id: ACCOUNT_ID_MOCK,
  address: {
    address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
    address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
    city: ACCOUNT_ADDRESS_MOCK.city,
    state: ACCOUNT_ADDRESS_MOCK.state,
    zip_code: ACCOUNT_ADDRESS_MOCK.zip,
  },
  location_details: ACCOUNT_ADDRESS_MOCK.additionalDetails,
  facility_type: OSS_ACCOUNT_ADDRESS_MOCK.facilityType,
};

export const TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_MOCK_PAYLOAD: CreateAddressRequest =
  {
    account_id: ACCOUNT_ID_MOCK,
    address: {
      address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
      address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
      city: ACCOUNT_ADDRESS_MOCK.city,
      state: ACCOUNT_ADDRESS_MOCK.state,
      zip_code: ACCOUNT_ADDRESS_MOCK.zip,
    },
    location_details: ACCOUNT_ADDRESS_MOCK.additionalDetails,
    facility_type: ACCOUNT_ADDRESS_WITH_PLACE_OF_SERVICE_MOCK.facilityType,
  };

export const TRANSFORM_GRPC_CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK: CreateAddressResponse =
  {
    address: TRANSFORM_GRPC_ACCOUNT_ADDRESS_MOCK,
    suggested_address: null,
    address_validation_status:
      AddressValidationStatus.ADDRESS_VALIDATION_STATUS_VALID,
  };

export const CREATE_ACCOUNT_ADDRESS_RESPONSE_MOCK: AccountAddress = {
  address: OSS_ACCOUNT_ADDRESS_MOCK,
  suggestedAddress: null,
  status: AddressStatus.VALID,
};

export const TRANSFORM_GRPC_CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK: CreateAddressResponse =
  {
    suggested_address: {
      ...TRANSFORM_GRPC_ACCOUNT_ADDRESS_MOCK,
      geocodeable: true,
      google_validation_response_id: 'tests',
      reasons: ['invalid address'],
      is_complete: false,
    },
    address: {
      id: 1,
      account_id: 1,
      address: {
        address_line_one: ACCOUNT_ADDRESS_MOCK.streetAddress1,
        address_line_two: ACCOUNT_ADDRESS_MOCK.streetAddress2,
        city: ACCOUNT_ADDRESS_MOCK.city,
        state: ACCOUNT_ADDRESS_MOCK.state,
        zip_code: ACCOUNT_ADDRESS_MOCK.zip,
      },
      facility_type: OSS_ACCOUNT_ADDRESS_MOCK.facilityType,
    },
    address_validation_status:
      AddressValidationStatus.ADDRESS_VALIDATION_STATUS_INVALID,
  };

export const CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK: OssAccountAddress =
  {
    suggestedAddress: {
      ...ACCOUNT_ADDRESS_MOCK,
      id: undefined,
      valid: true,
      reasons:
        TRANSFORM_GRPC_CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK
          .suggested_address.reasons,
      googleValidationResponseId:
        TRANSFORM_GRPC_CREATE_ACCOUNT_SUGGESTED_ADDRESS_RESPONSE_MOCK
          .suggested_address.google_validation_response_id,
    },
    status: AddressStatus.INVALID,
    address: {
      ...OSS_ACCOUNT_ADDRESS_MOCK,
    },
  };

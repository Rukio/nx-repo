import {
  Account as GrpcAccount,
  AccountAddress as GrpcAccountAddress,
  AccountPatientLink,
  AccountPatientLink_AccessLevel,
  AddUnverifiedAccountPatientLinkRequest,
  CreateAddressRequest,
  UpdateAccountRequest,
  UpdateAddressRequest,
  CreateAddressResponse,
  UpdateAddressResponse,
  ConsentingRelationship as GrpcConsentingRelationship,
  ConsentingRelationship_Category,
  FacilityType as ProtoFacilityType,
} from '@*company-data-covered*/protos/nest/patients/accounts/service';
import {
  AccessLevel,
  Account,
  AccountPatient,
  GenderIdentityCategory,
  PatientAssociation,
  ConsentingRelationshipCategory,
  ConsentingRelationship,
  FacilityType,
  OssAccountAddress,
  OssAddress,
} from '@*company-data-covered*/consumer-web-types';

import { getAddressStatus, getPhoneNumber } from '../common/utils';
import grpcPatientMapper from '../patient/patient.grpc.mapper';
import { GenderIdentity_Category } from '@*company-data-covered*/protos/nest/common/demographic';

const onboardingAccountPatientLinkAccessLevel = (
  accessLevel: AccountPatientLink_AccessLevel
): AccessLevel => {
  switch (+accessLevel) {
    case AccountPatientLink_AccessLevel.ACCESS_LEVEL_UNSPECIFIED:
      return AccessLevel.unspecified;
    case AccountPatientLink_AccessLevel.ACCESS_LEVEL_PHI:
      return AccessLevel.phi;
    case AccountPatientLink_AccessLevel.ACCESS_LEVEL_UNVERIFIED:
      return AccessLevel.unverified;
    case AccountPatientLink_AccessLevel.ACCESS_LEVEL_PRIMARY:
      return AccessLevel.primary;
    default:
      return undefined;
  }
};

const protoConsentingRelationshipCategory = (
  category: ConsentingRelationshipCategory
): ConsentingRelationship_Category => {
  switch (+category) {
    case ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED:
      return ConsentingRelationship_Category.CATEGORY_UNSPECIFIED;
    case ConsentingRelationshipCategory.CATEGORY_SELF:
      return ConsentingRelationship_Category.CATEGORY_SELF;
    case ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND:
      return ConsentingRelationship_Category.CATEGORY_FAMILY_FRIEND;
    case ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION:
      return ConsentingRelationship_Category.CATEGORY_CLINICIAN_ORGANIZATION;
    case ConsentingRelationshipCategory.CATEGORY_OTHER:
      return ConsentingRelationship_Category.CATEGORY_OTHER;
    default:
      return undefined;
  }
};

const onboardingConsentingRelationshipCategory = (
  category: ConsentingRelationship_Category
): ConsentingRelationshipCategory => {
  switch (+category) {
    case ConsentingRelationship_Category.CATEGORY_UNSPECIFIED:
      return ConsentingRelationshipCategory.CATEGORY_UNSPECIFIED;
    case ConsentingRelationship_Category.CATEGORY_SELF:
      return ConsentingRelationshipCategory.CATEGORY_SELF;
    case ConsentingRelationship_Category.CATEGORY_FAMILY_FRIEND:
      return ConsentingRelationshipCategory.CATEGORY_FAMILY_FRIEND;
    case ConsentingRelationship_Category.CATEGORY_CLINICIAN_ORGANIZATION:
      return ConsentingRelationshipCategory.CATEGORY_CLINICIAN_ORGANIZATION;
    case ConsentingRelationship_Category.CATEGORY_OTHER:
      return ConsentingRelationshipCategory.CATEGORY_OTHER;
    default:
      return undefined;
  }
};

export const onboardingGenderIdentityCategory = (
  category?: GenderIdentity_Category
): GenderIdentityCategory => {
  switch (+category) {
    case GenderIdentity_Category.CATEGORY_UNSPECIFIED:
      return GenderIdentityCategory.CATEGORY_UNSPECIFIED;
    case GenderIdentity_Category.CATEGORY_MALE:
      return GenderIdentityCategory.CATEGORY_MALE;
    case GenderIdentity_Category.CATEGORY_FEMALE:
      return GenderIdentityCategory.CATEGORY_FEMALE;
    case GenderIdentity_Category.CATEGORY_FEMALE_TO_MALE:
      return GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE;
    case GenderIdentity_Category.CATEGORY_MALE_TO_FEMALE:
      return GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE;
    case GenderIdentity_Category.CATEGORY_NON_BINARY:
      return GenderIdentityCategory.CATEGORY_NON_BINARY;
    case GenderIdentity_Category.CATEGORY_UNDISCLOSED:
      return GenderIdentityCategory.CATEGORY_UNDISCLOSED;
    case GenderIdentity_Category.CATEGORY_OTHER:
      return GenderIdentityCategory.CATEGORY_OTHER;
    default:
      return undefined;
  }
};

export const protoGenderIdentityCategory = (
  category?: GenderIdentityCategory
): GenderIdentity_Category => {
  switch (+category) {
    case GenderIdentityCategory.CATEGORY_UNSPECIFIED:
      return GenderIdentity_Category.CATEGORY_UNSPECIFIED;
    case GenderIdentityCategory.CATEGORY_MALE:
      return GenderIdentity_Category.CATEGORY_MALE;
    case GenderIdentityCategory.CATEGORY_FEMALE:
      return GenderIdentity_Category.CATEGORY_FEMALE;
    case GenderIdentityCategory.CATEGORY_FEMALE_TO_MALE:
      return GenderIdentity_Category.CATEGORY_FEMALE_TO_MALE;
    case GenderIdentityCategory.CATEGORY_MALE_TO_FEMALE:
      return GenderIdentity_Category.CATEGORY_MALE_TO_FEMALE;
    case GenderIdentityCategory.CATEGORY_NON_BINARY:
      return GenderIdentity_Category.CATEGORY_NON_BINARY;
    case GenderIdentityCategory.CATEGORY_UNDISCLOSED:
      return GenderIdentity_Category.CATEGORY_UNDISCLOSED;
    case GenderIdentityCategory.CATEGORY_OTHER:
      return GenderIdentity_Category.CATEGORY_OTHER;
    default:
      return undefined;
  }
};

export const onboardingFacilityType = (
  facilityType?: ProtoFacilityType
): FacilityType => {
  switch (+facilityType) {
    case ProtoFacilityType.FACILITY_TYPE_UNSPECIFIED:
      return FacilityType.FACILITY_TYPE_UNSPECIFIED;
    case ProtoFacilityType.FACILITY_TYPE_HOME:
      return FacilityType.FACILITY_TYPE_HOME;
    case ProtoFacilityType.FACILITY_TYPE_WORK:
      return FacilityType.FACILITY_TYPE_WORK;
    case ProtoFacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY:
      return FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY;
    case ProtoFacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY:
      return FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY;
    case ProtoFacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY:
      return FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY;
    case ProtoFacilityType.FACILITY_TYPE_CLINIC:
      return FacilityType.FACILITY_TYPE_CLINIC;
    case ProtoFacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY:
      return FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY;
    case ProtoFacilityType.FACILITY_TYPE_REHABILITATION_FACILITY:
      return FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY;
    case ProtoFacilityType.FACILITY_TYPE_VIRTUAL_VISIT:
      return FacilityType.FACILITY_TYPE_VIRTUAL_VISIT;
    case ProtoFacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING:
      return FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING;
    case ProtoFacilityType.FACILITY_TYPE_SCHOOL:
      return FacilityType.FACILITY_TYPE_SCHOOL;
    case ProtoFacilityType.FACILITY_TYPE_HOTEL:
      return FacilityType.FACILITY_TYPE_HOTEL;
    default:
      return FacilityType.UNRECOGNIZED;
  }
};

export const protoFacilityType = (
  facilityType?: FacilityType
): ProtoFacilityType => {
  switch (+facilityType) {
    case FacilityType.FACILITY_TYPE_UNSPECIFIED:
      return ProtoFacilityType.FACILITY_TYPE_UNSPECIFIED;
    case FacilityType.FACILITY_TYPE_HOME:
      return ProtoFacilityType.FACILITY_TYPE_HOME;
    case FacilityType.FACILITY_TYPE_WORK:
      return ProtoFacilityType.FACILITY_TYPE_WORK;
    case FacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY:
      return ProtoFacilityType.FACILITY_TYPE_INDEPENDENT_LIVING_FACILITY;
    case FacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY:
      return ProtoFacilityType.FACILITY_TYPE_ASSISTED_LIVING_FACILITY;
    case FacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY:
      return ProtoFacilityType.FACILITY_TYPE_SKILLED_NURSING_FACILITY;
    case FacilityType.FACILITY_TYPE_CLINIC:
      return ProtoFacilityType.FACILITY_TYPE_CLINIC;
    case FacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY:
      return ProtoFacilityType.FACILITY_TYPE_LONG_TERM_CARE_FACILITY;
    case FacilityType.FACILITY_TYPE_REHABILITATION_FACILITY:
      return ProtoFacilityType.FACILITY_TYPE_REHABILITATION_FACILITY;
    case FacilityType.FACILITY_TYPE_VIRTUAL_VISIT:
      return ProtoFacilityType.FACILITY_TYPE_VIRTUAL_VISIT;
    case FacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING:
      return ProtoFacilityType.FACILITY_TYPE_SENIOR_LIVING_TESTING;
    case FacilityType.FACILITY_TYPE_SCHOOL:
      return ProtoFacilityType.FACILITY_TYPE_SCHOOL;
    case FacilityType.FACILITY_TYPE_HOTEL:
      return ProtoFacilityType.FACILITY_TYPE_HOTEL;
    default:
      return ProtoFacilityType.UNRECOGNIZED;
  }
};

export const protoConsentingRelationship = (
  input: ConsentingRelationship
): GrpcConsentingRelationship => ({
  category: protoConsentingRelationshipCategory(input.category),
});

export const onboardingConsentingRelationship = (
  input: GrpcConsentingRelationship
): ConsentingRelationship => ({
  category: onboardingConsentingRelationshipCategory(input.category),
});

const AccountToGrpcAccount = (
  input: Account,
  accountId?: number
): GrpcAccount => {
  const output: GrpcAccount = {
    account_id: accountId || input.id,
    given_name: input.firstName,
    family_name: input.lastName,
    email: input.email,
    number: getPhoneNumber(input.phone),
  };

  return output;
};

const GrpcAccountToAccount = (
  input: GrpcAccount,
  consistencyToken?: Uint8Array | string
): Account => {
  const output: Account = {
    id: parseInt(String(input.account_id)),
    email: input.email,
    firstName: input.given_name,
    lastName: input.family_name,
    phone: input.number?.phone_number,
    consistencyToken,
  };

  return output;
};

const UpdateAccountRequestPayload = (
  input: Account,
  accountId?: number
): UpdateAccountRequest => {
  const output: UpdateAccountRequest = {
    account_id: accountId || input.id,
    given_name: input.firstName,
    family_name: input.lastName,
    number: getPhoneNumber(input.phone),
    consistency_token: Buffer.from(input.consistencyToken),
  };

  return output;
};

const GrpcAccountAddressToAccountAddress = (
  input: CreateAddressResponse | UpdateAddressResponse,
  consistencyToken?: Uint8Array | string
): OssAccountAddress => {
  const output: OssAccountAddress = {
    address: input.address && {
      id: parseInt(String(input.address?.id)),
      streetAddress1: input.address.address?.address_line_one,
      streetAddress2: input.address.address?.address_line_two,
      city: input.address.address?.city,
      state: input.address.address?.state,
      zip: input.address.address?.zip_code,
      additionalDetails: input.address?.location_details,
      facilityType: onboardingFacilityType(input.address?.facility_type),
    },
    suggestedAddress: input.suggested_address && {
      streetAddress1: input.suggested_address.address?.address_line_one,
      streetAddress2: input.suggested_address.address?.address_line_two,
      city: input.suggested_address.address?.city,
      state: input.suggested_address.address?.state,
      zip: input.suggested_address.address?.zip_code,
      valid: input.suggested_address.geocodeable,
      googleValidationResponseId:
        input.suggested_address.google_validation_response_id,
      reasons: input.suggested_address.reasons,
    },
    status: getAddressStatus(input.address_validation_status),
    consistencyToken,
  };

  return output;
};

const GrpcAddressToAddress = (
  input: GrpcAccountAddress,
  consistencyToken?: Uint8Array | string
): OssAddress => {
  const output: OssAddress = {
    id: parseInt(String(input.id)),
    streetAddress1: input.address?.address_line_one,
    streetAddress2: input.address?.address_line_two,
    city: input.address?.city,
    state: input.address?.state,
    zip: input.address?.zip_code,
    additionalDetails: input.location_details,
    facilityType: onboardingFacilityType(input.facility_type),
    consistencyToken,
  };

  return output;
};

const GrpcAccountPatientToAccountPatient = (
  input: AccountPatientLink,
  consistencyToken: Uint8Array | string
): AccountPatient => {
  return {
    id: parseInt(String(input.id)),
    accountId: parseInt(String(input.account_id)),
    patient:
      input.verified_patient &&
      grpcPatientMapper.GrpcPatientToPatient(input.verified_patient),
    unverifiedPatient:
      input.unverified_patient &&
      grpcPatientMapper.GrpcUnverifiedPatientToUnverifiedPatient(
        input.unverified_patient
      ),

    accessLevel: onboardingAccountPatientLinkAccessLevel(input.access_level),
    consentingRelationship: onboardingConsentingRelationship(
      input.consenting_relationship
    ),
    consistencyToken,
  };
};

const createAddressPayload = (
  input: OssAddress,
  account_id: number
): CreateAddressRequest => {
  const payload: CreateAddressRequest = {
    account_id,
    address: {
      address_line_one: input.streetAddress1,
      address_line_two: input.streetAddress2,
      city: input.city,
      state: input.state,
      zip_code: input.zip,
    },
    location_details: input.additionalDetails,
    previous_google_validation_response_id: input.googleValidationResponseId,
    facility_type: protoFacilityType(input.facilityType),
  };

  return payload;
};

const updateAddressPayload = (
  input: OssAddress,
  address_id?: number
): UpdateAddressRequest => ({
  address_id: address_id || input.id,
  address: {
    address_line_one: input.streetAddress1,
    address_line_two: input.streetAddress2,
    city: input.city,
    state: input.state,
    zip_code: input.zip,
  },
  location_details: input.additionalDetails,
  previous_google_validation_response_id: input.googleValidationResponseId,
  consistency_token: Buffer.from(input.consistencyToken),
  facility_type: protoFacilityType(input.facilityType),
});

const addUnverifiedAccountPatientLinkPayload = (
  input: PatientAssociation,
  account_id: number
): AddUnverifiedAccountPatientLinkRequest => ({
  account_id,
  unverified_patient_id: input.unverifiedPatientId,
  consenting_relationship: protoConsentingRelationship(
    input.consentingRelationship
  ),
});

export default {
  AccountToGrpcAccount,
  GrpcAccountToAccount,
  UpdateAccountRequestPayload,
  GrpcAccountAddressToAccountAddress,
  GrpcAccountPatientToAccountPatient,
  GrpcAddressToAddress,
  createAddressPayload,
  updateAddressPayload,
  addUnverifiedAccountPatientLinkPayload,
};

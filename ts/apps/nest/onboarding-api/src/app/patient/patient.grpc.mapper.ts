import {
  BirthSex,
  Insurance,
  InsuranceEligibilityStatus,
  InsuranceParams,
  InsuranceParamsPatientRelation,
  Patient,
  PatientGuarantor,
  PatientInsurancePriority,
  PatientRelationshipToSubscriber,
  PatientSearchParam,
  UnverifiedPatient,
} from '@*company-data-covered*/consumer-web-types';
import { format, getDate, getMonth, getYear, parse } from 'date-fns';
import {
  CreateUnverifiedPatientRequest,
  SearchPatientsRequest,
  SearchPatientsResult,
} from '@*company-data-covered*/protos/nest/patients/service';
import { UnverifiedPatient as GrpcUnverifiedPatient } from '@*company-data-covered*/protos/nest/patients/patient';
import {
  ContactInfo,
  Guarantor,
  Patient as GrpcPatient,
  PatientRecordIdentifier_PatientRecordSource,
  PatientRelation,
  PatientSafetyFlag_FlagType,
  RelationToPatient,
} from '@*company-data-covered*/protos/nest/common/patient';
import {
  BirthSex as ProtoBirthSex,
  PhoneNumber,
  PhoneNumber_PhoneNumberType,
  Sex,
} from '@*company-data-covered*/protos/nest/common/demographic';
import { DateMessage } from '@*company-data-covered*/protos/nest/common/date';
import {
  getPhoneNumber,
  SEARCH_TERM_REGEX,
  unparsePhoneNumber,
} from '../common/utils';
import {
  InsuranceImageType,
  InsurancePriority,
  InsuranceRecord,
  PatientRelationToSubscriber,
  PrimaryInsuranceHolder as PatientPrimaryInsuranceHolder,
} from '@*company-data-covered*/protos/nest/patients/insurance';
import { EligibilityStatus } from '@*company-data-covered*/protos/nest/insurance_eligibility/insurance_eligibility';
import {
  onboardingGenderIdentityCategory,
  protoGenderIdentityCategory,
} from '../patient-accounts/patient-accounts.mapper';
import InputNotSpecifiedException from '../common/exceptions/input-not-specified.exception';
import UnverifiedPatientDto from '../patient-accounts/dto/unverified-patient.dto';

const currentDate = (dob: Date | string, formatStr = 'dd-MM-yyyy') =>
  parse(dob.toString(), formatStr, new Date());

const protoDOB = (input: Date | string): DateMessage => {
  let dob = currentDate(input);

  if (isNaN(dob.getTime())) {
    dob = currentDate(input, 'yyyy-MM-dd');
  }

  const output: DateMessage = {
    day: getDate(dob),
    month: getMonth(dob) + 1,
    year: getYear(dob),
  };

  return output;
};

const onboardingDOB = (dob: DateMessage) =>
  format(new Date(dob.year, dob.month - 1, dob.day), 'yyyy-MM-dd');

const protoSex = (gender: string): Sex => {
  switch (gender.toLowerCase()) {
    case 'male':
    case 'm':
      return Sex.SEX_MALE;
    case 'female':
    case 'f':
      return Sex.SEX_FEMALE;
    case 'other':
      return Sex.SEX_OTHER;
    default:
      return Sex.SEX_UNSPECIFIED;
  }
};

const onboardingGender = (sex: Sex): string => {
  switch (+sex) {
    case Sex.SEX_MALE:
      return 'male';
    case Sex.SEX_FEMALE:
      return 'female';
    case Sex.SEX_OTHER:
      return 'other';
    default:
      return undefined;
  }
};

export const onboardingBirthSex = (
  birthSex: ProtoBirthSex
): BirthSex | undefined => {
  switch (+birthSex) {
    case ProtoBirthSex.BIRTH_SEX_MALE:
      return BirthSex.BIRTH_SEX_MALE;
    case ProtoBirthSex.BIRTH_SEX_FEMALE:
      return BirthSex.BIRTH_SEX_FEMALE;
    case ProtoBirthSex.BIRTH_SEX_UNDISCLOSED:
      return BirthSex.BIRTH_SEX_UNDISCLOSED;
    case ProtoBirthSex.BIRTH_SEX_UNKNOWN:
      return BirthSex.BIRTH_SEX_UNKNOWN;
    default:
      return undefined;
  }
};

export const protoBirthSex = (
  birthSex?: BirthSex
): ProtoBirthSex | undefined => {
  switch (+birthSex) {
    case BirthSex.BIRTH_SEX_MALE:
      return ProtoBirthSex.BIRTH_SEX_MALE;
    case BirthSex.BIRTH_SEX_FEMALE:
      return ProtoBirthSex.BIRTH_SEX_FEMALE;
    case BirthSex.BIRTH_SEX_UNDISCLOSED:
      return ProtoBirthSex.BIRTH_SEX_UNDISCLOSED;
    case BirthSex.BIRTH_SEX_UNKNOWN:
      return ProtoBirthSex.BIRTH_SEX_UNKNOWN;
    default:
      return undefined;
  }
};

const protoPhoneNumber = (
  phoneNumber?: string,
  isMobile?: boolean
): ContactInfo => {
  return isMobile
    ? {
        mobile_number: {
          phone_number_type:
            PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
          country_code: 1,
          phone_number: unparsePhoneNumber(phoneNumber),
        },
      }
    : {
        home_number: {
          phone_number_type: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_HOME,
          country_code: 1,
          phone_number: unparsePhoneNumber(phoneNumber),
        },
      };
};

const onboardingPhoneNumber = (contactInfo?: ContactInfo): PhoneNumber =>
  contactInfo?.mobile_number ||
  contactInfo?.home_number ||
  contactInfo?.work_number || {
    phone_number: undefined,
    phone_number_type: PhoneNumber_PhoneNumberType.UNRECOGNIZED,
  };

const protoContactInfo = (input: Patient): ContactInfo => {
  const output: ContactInfo = {
    address: {
      city: input.address?.city,
      zip_code: input.address?.zip,
      state: input.address?.state,
      address_line_one: input.address?.streetAddress1,
      address_line_two: input.address?.streetAddress2,
    },
    email: input.email,
    ...protoPhoneNumber(input.phone, true),
  };

  return output;
};

const protoPatientRelation = (relation: string): RelationToPatient => {
  switch (relation.toLowerCase()) {
    case 'patient':
      return RelationToPatient.RELATION_TO_PATIENT_SELF;
    case 'family':
    case 'family:mother':
    case 'family:father':
    case 'family:child':
    case 'family:spouse':
    case 'family:friend':
      return RelationToPatient.RELATION_TO_PATIENT_FAMILY;
    case 'friend':
      return RelationToPatient.RELATION_TO_PATIENT_FRIEND;
    case 'case_manager':
      return RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT;
    case 'home_health_team':
      return RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM;
    case 'clinician':
      return RelationToPatient.RELATION_TO_PATIENT_CLINICIAN;
    case 'facility_staff':
      return RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF;
    case 'other':
      return RelationToPatient.RELATION_TO_PATIENT_OTHER;
    default:
      return RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED;
  }
};

const onboardingPatientRelation = (relation: RelationToPatient): string => {
  switch (+relation) {
    case RelationToPatient.RELATION_TO_PATIENT_SELF:
      return 'patient';
    case RelationToPatient.RELATION_TO_PATIENT_FAMILY:
      return 'family:friend';
    case RelationToPatient.RELATION_TO_PATIENT_FRIEND:
      return 'friend';
    case RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT:
      return 'case_manager';
    case RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM:
      return 'home_health_team';
    case RelationToPatient.RELATION_TO_PATIENT_CLINICIAN:
      return 'clinician';
    case RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF:
      return 'facility_staff';
    case RelationToPatient.RELATION_TO_PATIENT_OTHER:
      return 'other';
    default:
      return undefined;
  }
};

export const protoPatientSafetyFlag = (
  safetyType?: string
): PatientSafetyFlag_FlagType => {
  switch (safetyType?.toLowerCase()) {
    case 'permanent':
      return PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT;
    case 'temporary':
      return PatientSafetyFlag_FlagType.FLAG_TYPE_TEMPORARY;
    case 'unspecified':
      return PatientSafetyFlag_FlagType.FLAG_TYPE_UNSPECIFIED;
    default:
      return PatientSafetyFlag_FlagType.UNRECOGNIZED;
  }
};

export const onboardingPatientSafetyFlag = (
  safetyType?: PatientSafetyFlag_FlagType
): string => {
  switch (+safetyType) {
    case PatientSafetyFlag_FlagType.FLAG_TYPE_PERMANENT:
      return 'permanent';
    case PatientSafetyFlag_FlagType.FLAG_TYPE_TEMPORARY:
      return 'temporary';
    case PatientSafetyFlag_FlagType.FLAG_TYPE_UNSPECIFIED:
      return 'unspecified';
    default:
      return 'unrecognized';
  }
};

const protoGuarantor = (input: PatientGuarantor): Guarantor => {
  const output: Guarantor = {
    name: {
      given_name: input.firstName,
      family_name: input.lastName,
    },
    contact_info: {
      address: {
        city: input.billingAddressCity,
        state: input.billingAddressState,
        zip_code: input.billingAddressZipcode,
        address_line_one: input.billingAddressStreetAddress1,
        address_line_two: input.billingAddressStreetAddress2,
      },
      email: input.email,
      ...protoPhoneNumber(input.phone, true),
    },
    date_of_birth: protoDOB(input.dob),
    social_security_number: input.ssn,
    patient_relation: input.relationToPatient && {
      other_relation_text: input.relationToPatient,
      relation: protoPatientRelation(input.relationToPatient),
    },
  };

  return output;
};

const PatientToGrpcPatient = (
  input: Patient,
  patientId?: number
): GrpcPatient => {
  const output: GrpcPatient = {
    id: patientId && patientId.toString(),
    name: {
      given_name: input.firstName,
      family_name: input.lastName,
      middle_name_or_initial: input.middleName,
      suffix: input.suffix,
    },
    social_security_number: input.ssn,
    additional_identifiers: [],
    primary_identifier: input.ehrPatientId && {
      record_id: input.ehrPatientId,
      source:
        PatientRecordIdentifier_PatientRecordSource.PATIENT_RECORD_SOURCE_ATHENA,
    },
    contact_info: protoContactInfo(input),
    date_of_birth: input.dateOfBirth && protoDOB(input.dateOfBirth),
    guarantor: input.guarantor && protoGuarantor(input.guarantor),
    medical_power_of_attorney: input.powerOfAttorney && {
      id: input.powerOfAttorney.id,
      name: input.powerOfAttorney.name && {
        preferred_name: input.powerOfAttorney.name,
      },
      contact_info:
        input.powerOfAttorney.phone &&
        protoPhoneNumber(input.powerOfAttorney.phone, true),
      patient_relation: input.powerOfAttorney.relationship && {
        other_relation_text: input.powerOfAttorney.relationship,
        relation: protoPatientRelation(input.powerOfAttorney.relationship),
      },
    },
    patient_safety_flag: input.patientSafetyFlag && {
      flagger_user_id: input.patientSafetyFlag.id?.toString(),
      type: protoPatientSafetyFlag(input.patientSafetyFlag.flagType),
      reason: input.patientSafetyFlag.flagReason,
    },
    sex: input.gender && protoSex(input.gender),
    voicemail_consent: input.voicemailConsent,
    ...(input.billingCityId && {
      billing_city: {
        id: input.billingCityId.toString(),
      },
    }),
  };

  return output;
};

const CreateUnverifiedPatientToCreateGrpcUnverifiedPatient = (
  input: UnverifiedPatientDto
): CreateUnverifiedPatientRequest => {
  return {
    athena_id: input.athenaId,
    date_of_birth: protoDOB(input.dateOfBirth || ''),
    phone_number: getPhoneNumber(input.phoneNumber),
    legal_sex: protoSex(input.legalSex || ''),
    birth_sex: protoBirthSex(input.birthSex),
    gender_identity: input.genderIdentity
      ? {
          category: protoGenderIdentityCategory(input.genderIdentity),
          other_details: input.genderIdentityDetails,
        }
      : undefined,
    given_name: input.givenName,
    family_name: input.familyName,
  };
};

const GrpcPatientToPatient = (
  input: GrpcPatient,
  consistencyToken?: Uint8Array | string
): Patient => {
  const output: Patient = {
    id: input.id && parseInt(input.id, 10),
    suffix: input.name?.suffix,
    firstName: input.name?.given_name,
    lastName: input.name?.family_name,
    middleName: input.name?.middle_name_or_initial,
    ssn: input.social_security_number,
    phone: onboardingPhoneNumber(input.contact_info).phone_number,
    email: input.contact_info?.email,
    ehrPatientId: input.primary_identifier?.record_id,
    dateOfBirth: input.date_of_birth && onboardingDOB(input.date_of_birth),
    gender: onboardingGender(input.sex),
    address: input.contact_info && {
      city: input.contact_info.address?.city,
      state: input.contact_info.address?.state,
      zip: input.contact_info.address?.zip_code,
      streetAddress1: input.contact_info.address?.address_line_one,
      streetAddress2: input.contact_info.address?.address_line_two,
    },
    voicemailConsent: input.voicemail_consent,
    powerOfAttorney: input.medical_power_of_attorney && {
      id:
        input.medical_power_of_attorney.id &&
        parseInt(String(input.medical_power_of_attorney.id), 10),
      name: input.medical_power_of_attorney.name?.preferred_name,
      phone: onboardingPhoneNumber(input.medical_power_of_attorney.contact_info)
        .phone_number,
      phoneNumber: {
        mobile:
          onboardingPhoneNumber(input.medical_power_of_attorney.contact_info)
            .phone_number_type ===
          PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
      },
      relationship: onboardingPatientRelation(
        input.medical_power_of_attorney.patient_relation?.relation
      ),
    },
    guarantor: input.guarantor && {
      firstName: input.guarantor.name?.given_name,
      lastName: input.guarantor.name?.family_name,
      dob:
        input.guarantor.date_of_birth &&
        onboardingDOB(input.guarantor.date_of_birth),
      phone: onboardingPhoneNumber(input.guarantor.contact_info).phone_number,
      email: input.guarantor.contact_info?.email,
      billingAddressZipcode: input.guarantor.contact_info?.address?.zip_code,
      billingAddressCity: input.guarantor.contact_info?.address?.city,
      billingAddressState: input.guarantor.contact_info?.address?.state,
      billingAddressStreetAddress1:
        input.guarantor.contact_info?.address?.address_line_one,
      billingAddressStreetAddress2:
        input.guarantor.contact_info?.address?.address_line_two,
      ssn: input.guarantor.social_security_number,
      relationToPatient: onboardingPatientRelation(
        input.guarantor.patient_relation?.relation
      ),
    },
    patientSafetyFlag: input.patient_safety_flag && {
      flagType: onboardingPatientSafetyFlag(input.patient_safety_flag.type),
      flagReason: input.patient_safety_flag.reason,
    },
    consistencyToken,
  };

  return output;
};

const SearchPatientToGrpcSearchPatient = (
  input: PatientSearchParam
): SearchPatientsRequest => {
  const searchTerm = `${input.lastName ?? ''}, ${input.firstName ?? ''}`
    .replace(SEARCH_TERM_REGEX, '')
    .trim();
  const output: SearchPatientsRequest = {
    given_name: input.firstName,
    family_name: input.lastName,
    zip_code: input.zipCode,
    date_of_birth: input.dateOfBirth && protoDOB(input.dateOfBirth),
    channel_item_ids: [],
    search_term: searchTerm,
  };

  return output;
};

// Sort results by ID in descending order (from newest to oldest)
const sortSearchResults = (
  results: SearchPatientsResult[] = []
): SearchPatientsResult[] =>
  [...results].sort((a, b) => {
    const aId = parseInt(a.patient.id || '0', 10);
    const bId = parseInt(b.patient.id || '0', 10);

    return bId - aId;
  });

const PatientInsuranceParamsToGrpcPatientInsuranceRecord = ({
  input,
  patientId,
  insuranceId,
}: {
  input: InsuranceParams;
  patientId?: string;
  insuranceId?: string;
}): InsuranceRecord => {
  const output: InsuranceRecord = {
    id: insuranceId,
    patient_id: patientId,
    insurance_plan_id: input.insurancePlanId,
    priority: InsurancePriorityToGrpcInsurancePriority(input.priority),
    member_id: input.memberId?.toString(),
    primary_insurance_holder:
      PrimaryInsuranceHolderToGrpcPrimaryInsuranceHolder(input),
    eligibility_status: InsuranceEligibilityStatusToGrpcEligibilityStatus(
      input.eligibilityStatus
    ),
    eligibility_message: input.eligibilityMessage,
    images: InsuranceImageToGrpcInsuranceImageType(input),
    company_name: input.companyName,
    package_id: input.packageId.toString(),
  };

  return output;
};

const InsurancePriorityToGrpcInsurancePriority = (
  priority: string
): InsurancePriority => {
  switch (priority) {
    case PatientInsurancePriority.INSURANCE_PRIORITY_PRIMARY:
      return InsurancePriority.INSURANCE_PRIORITY_PRIMARY;
    case PatientInsurancePriority.INSURANCE_PRIORITY_SECONDARY:
      return InsurancePriority.INSURANCE_PRIORITY_SECONDARY;
    case PatientInsurancePriority.INSURANCE_PRIORITY_TERTIARY:
      return InsurancePriority.INSURANCE_PRIORITY_TERTIARY;
    default:
      return InsurancePriority.INSURANCE_PRIORITY_UNSPECIFIED;
  }
};

const PrimaryInsuranceHolderToGrpcPrimaryInsuranceHolder = (
  input: InsuranceParams
): PatientPrimaryInsuranceHolder => {
  return {
    name: {
      given_name: input.primaryInsuranceHolderAttributes.firstName,
      middle_name_or_initial:
        input.primaryInsuranceHolderAttributes.middleInitial,
      family_name: input.primaryInsuranceHolderAttributes.lastName,
    },
    sex: protoSex(input.primaryInsuranceHolderAttributes.gender),
    patient_relation_to_subscriber:
      PatientRelationshipToSubscriberToGrpcPatientRelationToSubscriber(
        input.patientRelationToSubscriber
      ),
  };
};

const PatientRelationshipToGrpcInsuredToPatientRelation = (
  relation: string
): PatientRelation => {
  switch (relation.toLowerCase()) {
    case InsuranceParamsPatientRelation.SELF:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_SELF,
      };
    case InsuranceParamsPatientRelation.FACILITY_STAFF:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_FACILITY_STAFF,
      };
    case InsuranceParamsPatientRelation.FAMILY:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_FAMILY,
      };
    case InsuranceParamsPatientRelation.CLINICIAN:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_CLINICIAN,
      };
    case InsuranceParamsPatientRelation.FRIEND:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_FRIEND,
      };
    case InsuranceParamsPatientRelation.HOME_HEALTH_TEAM:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_HOME_HEALTH_TEAM,
      };
    case InsuranceParamsPatientRelation.CASE_MANAGEMENT:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_CASE_MANAGEMENT,
      };
    case InsuranceParamsPatientRelation.OTHER:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_OTHER,
        other_relation_text: relation,
      };
    default:
      return {
        relation: RelationToPatient.RELATION_TO_PATIENT_UNSPECIFIED,
        other_relation_text: relation,
      };
  }
};

const PatientRelationshipToSubscriberToGrpcPatientRelationToSubscriber = (
  relation: string
): PatientRelationToSubscriber => {
  switch (relation) {
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND;
    case PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER;
    default:
      return PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED;
  }
};

const InsuranceImageToGrpcInsuranceImageType = (
  input: InsuranceParams
): InsuranceRecord['images'] => {
  const images = {};
  if (input.cardFront) {
    images[InsuranceImageType.INSURANCE_IMAGE_TYPE_FRONT] = {
      image_url: input.cardFront,
      image_type: InsuranceImageType.INSURANCE_IMAGE_TYPE_FRONT,
      verified: false,
    };
  }
  if (input.cardBack) {
    images[InsuranceImageType.INSURANCE_IMAGE_TYPE_BACK] = {
      image_url: input.cardBack,
      image_type: InsuranceImageType.INSURANCE_IMAGE_TYPE_BACK,
      verified: false,
    };
  }

  return images;
};

const InsuranceEligibilityStatusToGrpcEligibilityStatus = (
  status?: string
): EligibilityStatus => {
  switch (status?.toLowerCase()) {
    case InsuranceEligibilityStatus.UNSPECIFIED:
      return EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED;
    case InsuranceEligibilityStatus.ELIGIBLE:
      return EligibilityStatus.ELIGIBILITY_STATUS_ELIGIBLE;
    case InsuranceEligibilityStatus.INELIGIBLE:
      return EligibilityStatus.ELIGIBILITY_STATUS_INELIGIBLE;
    case InsuranceEligibilityStatus.UNVERIFIED:
      return EligibilityStatus.ELIGIBILITY_STATUS_UNVERIFIED;
    default:
      return EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED;
  }
};

const GrpcPatientInsuranceRecordToPatientInsurance = (
  input: InsuranceRecord
): Insurance => {
  if (!input) {
    throw new InputNotSpecifiedException(
      GrpcPatientInsuranceRecordToPatientInsurance.name
    );
  }
  const primaryInsuranceHolder = input.primary_insurance_holder
    ? {
        firstName: input.primary_insurance_holder.name?.given_name ?? '',
        middleInitial:
          input.primary_insurance_holder.name?.middle_name_or_initial ?? '',
        lastName: input.primary_insurance_holder.name?.family_name ?? '',
        gender: onboardingGender(input.primary_insurance_holder?.sex),
        patientRelationshipToInsured:
          PatientRelationToPatientRelationToSubscriber(
            input.primary_insurance_holder?.patient_relation_to_subscriber
          ),
        insuranceId: input.id,
      }
    : undefined;
  const updatedAt = input?.updated_at
    ? new Date(
        input.updated_at.seconds * 1000 + input.updated_at.nanos / 1000000
      )
    : undefined;

  return {
    id: Number(input.id),
    packageId: input.package_id,
    insurancePlanId:
      input.insurance_plan_id &&
      parseInt(input.insurance_plan_id.toString(), 10),
    memberId: input.member_id,
    patientId: input.patient_id,
    priority: GrpcInsurancePriorityToInsurancePriority(input.priority),
    companyName: input.company_name,
    primaryInsuranceHolder: primaryInsuranceHolder,
    groupNumber: input.group_id,
    primaryInsuranceHolderAttributes: primaryInsuranceHolder,
    cardFrontUrl:
      input.images?.[InsuranceImageType.INSURANCE_IMAGE_TYPE_FRONT]?.image_url,
    cardBackUrl:
      input.images?.[InsuranceImageType.INSURANCE_IMAGE_TYPE_BACK]?.image_url,
    patientRelationToSubscriber: PatientRelationToPatientRelationToSubscriber(
      input.primary_insurance_holder?.patient_relation_to_subscriber
    ),
    firstName: primaryInsuranceHolder?.firstName,
    middleInitial: primaryInsuranceHolder?.middleInitial,
    lastName: primaryInsuranceHolder?.lastName,
    gender: primaryInsuranceHolder?.gender,
    insuredSameAsPatient: true,
    eligibilityMessage: input.eligibility_message,
    eligible: EligibilityStatusToEligible(input.eligibility_status),
    updatedAt: updatedAt,
  };
};

const GrpcInsurancePriorityToInsurancePriority = (
  priority: InsurancePriority
): string => {
  switch (priority) {
    case InsurancePriority.INSURANCE_PRIORITY_PRIMARY:
      return PatientInsurancePriority.INSURANCE_PRIORITY_PRIMARY;
    case InsurancePriority.INSURANCE_PRIORITY_SECONDARY:
      return PatientInsurancePriority.INSURANCE_PRIORITY_SECONDARY;
    case InsurancePriority.INSURANCE_PRIORITY_TERTIARY:
      return PatientInsurancePriority.INSURANCE_PRIORITY_TERTIARY;
    default:
      return PatientInsurancePriority.INSURANCE_PRIORITY_UNSPECIFIED;
  }
};

const EligibilityStatusToEligible = (status: EligibilityStatus): string => {
  switch (status) {
    case EligibilityStatus.ELIGIBILITY_STATUS_UNSPECIFIED:
      return InsuranceEligibilityStatus.UNSPECIFIED;
    case EligibilityStatus.ELIGIBILITY_STATUS_ELIGIBLE:
      return InsuranceEligibilityStatus.ELIGIBLE;
    case EligibilityStatus.ELIGIBILITY_STATUS_INELIGIBLE:
      return InsuranceEligibilityStatus.INELIGIBLE;
    case EligibilityStatus.ELIGIBILITY_STATUS_UNVERIFIED:
      return InsuranceEligibilityStatus.UNVERIFIED;
    default:
      return InsuranceEligibilityStatus.UNSPECIFIED;
  }
};

const PatientRelationToPatientRelationToSubscriber = (
  relation: PatientRelationToSubscriber | undefined
): string => {
  switch (relation) {
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_PATIENT;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_MOTHER;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FATHER;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_CHILD;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_FRIEND;
    case PatientRelationToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_OTHER;
    case PatientRelationToSubscriber.UNRECOGNIZED:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNRECOGNIZED;
    default:
      return PatientRelationshipToSubscriber.PATIENT_RELATION_TO_SUBSCRIBER_UNRECOGNIZED;
  }
};

const UnverifiedPatientToGrpcUnverifiedPatient = (
  input: UnverifiedPatient,
  patientId?: number
): GrpcUnverifiedPatient => {
  const output: GrpcUnverifiedPatient = {
    id: input.id || patientId,
    athena_id: input.athenaId,
    date_of_birth: input.dateOfBirth && protoDOB(input.dateOfBirth),
    birth_sex: protoBirthSex(input.birthSex),
    legal_sex: input.legalSex && protoSex(input.legalSex),
    phone_number: getPhoneNumber(input.phoneNumber),
    gender_identity: input.genderIdentity
      ? {
          category: protoGenderIdentityCategory(input.genderIdentity),
          other_details: input.genderIdentityDetails,
        }
      : undefined,
    given_name: input.givenName,
    family_name: input.familyName,
  };

  return output;
};

const GrpcUnverifiedPatientToUnverifiedPatient = (
  input: GrpcUnverifiedPatient,
  consistencyToken?: Uint8Array | string
): UnverifiedPatient => {
  const output: UnverifiedPatient = {
    id: input.id && parseInt(input.id.toString(), 10),
    patientId: input.patient_id && parseInt(input.patient_id.toString(), 10),
    dateOfBirth: input.date_of_birth && onboardingDOB(input.date_of_birth),
    birthSex: onboardingBirthSex(input.birth_sex),
    legalSex: onboardingGender(input.legal_sex),
    givenName: input.given_name,
    familyName: input.family_name,
    phoneNumber: input.phone_number.phone_number,
    athenaId: input.athena_id
      ? parseInt(input.athena_id.toString(), 10)
      : undefined,
    genderIdentity: onboardingGenderIdentityCategory(
      input.gender_identity?.category
    ),
    genderIdentityDetails: input.gender_identity?.other_details,
    consistencyToken,
  };

  return output;
};

export default {
  protoDOB,
  protoSex,
  currentDate,
  protoPhoneNumber,
  protoPatientRelation,
  onboardingDOB,
  onboardingGender,
  onboardingBirthSex,
  protoBirthSex,
  onboardingPatientRelation,
  onboardingPhoneNumber,
  PatientToGrpcPatient,
  GrpcPatientToPatient,
  SearchPatientToGrpcSearchPatient,
  sortSearchResults,
  UnverifiedPatientToGrpcUnverifiedPatient,
  CreateUnverifiedPatientToCreateGrpcUnverifiedPatient,
  GrpcUnverifiedPatientToUnverifiedPatient,
  PatientInsuranceParamsToGrpcPatientInsuranceRecord,
  GrpcPatientInsuranceRecordToPatientInsurance,
  InsurancePriorityToGrpcInsurancePriority,
  PatientRelationshipToGrpcInsuredToPatientRelation,
  InsuranceEligibilityStatusToGrpcEligibilityStatus,
  GrpcInsurancePriorityToInsurancePriority,
  EligibilityStatusToEligible,
  PatientRelationToPatientRelationToSubscriber,
  PatientRelationshipToSubscriberToGrpcPatientRelationToSubscriber,
};

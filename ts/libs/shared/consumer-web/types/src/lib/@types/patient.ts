import { Address } from './address';
import { LastCareRequest, StationLastCareRequest } from './care-request';

export enum BirthSex {
  BIRTH_SEX_UNSPECIFIED = 0,
  /** BIRTH_SEX_MALE - Designated as a male at birth */
  BIRTH_SEX_MALE = 1,
  /** BIRTH_SEX_FEMALE - Designated as a female at birth */
  BIRTH_SEX_FEMALE = 2,
  /** BIRTH_SEX_UNDISCLOSED - Choose not to disclose */
  BIRTH_SEX_UNDISCLOSED = 3,
  /** BIRTH_SEX_UNKNOWN - Unknown */
  BIRTH_SEX_UNKNOWN = 4,
  UNRECOGNIZED = -1,
}

export enum GenderIdentityCategory {
  CATEGORY_UNSPECIFIED = 0,
  /** CATEGORY_OTHER - Additional gender category. Typically specified in an "Other" field */
  CATEGORY_OTHER = 1,
  /** CATEGORY_UNDISCLOSED - Choose not to disclose */
  CATEGORY_UNDISCLOSED = 2,
  /** CATEGORY_MALE - Identifies as male */
  CATEGORY_MALE = 3,
  /** CATEGORY_FEMALE - Identifies as female */
  CATEGORY_FEMALE = 4,
  /** CATEGORY_MALE_TO_FEMALE - Transgender female */
  CATEGORY_MALE_TO_FEMALE = 5,
  /** CATEGORY_FEMALE_TO_MALE - Transgender male */
  CATEGORY_FEMALE_TO_MALE = 6,
  /** CATEGORY_NON_BINARY - Gender non-conforming (neither exclusively male nor female) */
  CATEGORY_NON_BINARY = 7,
  UNRECOGNIZED = -1,
}

export interface Patient {
  id?: number;
  suffix?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  ssn?: string;
  phone?: string;
  email?: string;
  ehrPatientId?: string;
  dateOfBirth?: Date | string;
  birthSex?: BirthSex;
  gender?: string;
  genderIdentity?: GenderIdentityCategory;
  genderIdentityDetails?: string | undefined;
  address?: Address;
  voicemailConsent?: boolean;
  age?: number;
  channelItemId?: number;
  powerOfAttorney?: PowerOfAttorney;
  guarantor?: PatientGuarantor;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  consistencyToken?: Uint8Array | string;
  className?: string;
  eligiblePatientId?: number;
  patientId?: number;
  eligibilityFileId?: number;
  patientSafetyFlag?: PatientSafetyFlag;
  lastCareRequest?: LastCareRequest;
  billingCityId?: number;
}

export interface PatientGuarantor {
  id?: number;
  patientId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  relationToPatient?: string;
  relationshipToPatient?: string;
  sameAsCareAddress?: boolean;
  phone?: string;
  dob?: string | Date;
  ssn?: string | null;
  billingAddressCity?: string;
  billingAddressState?: string;
  billingAddressStreetAddress1?: string;
  billingAddressStreetAddress2?: string;
  billingAddressZipcode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StationPatientGuarantor {
  id?: number;
  patient_id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  relation_to_patient?: string;
  relationship_to_patient?: string;
  same_as_care_address?: boolean;
  phone?: string;
  dob?: string | Date;
  ssn?: string | null;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_street_address_1?: string;
  billing_address_street_address_2?: string;
  billing_address_zipcode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PowerOfAttorney {
  id?: number;
  patientId?: number;
  name?: string;
  phone?: string;
  phoneNumber?: {
    mobile: boolean;
  };
  relationship?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface StationPowerOfAttorney {
  id?: number;
  patient_id?: number;
  name?: string;
  phone?: string;
  phone_number?: {
    mobile: boolean;
  };
  relationship?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface StationPatient {
  id?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  dob?: Date | string;
  gender?: string;
  ssn?: string;
  street_address_1?: string;
  street_address_2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  ins_member_id?: string;
  policy_number?: string;
  pcp?: string;
  channel_item_id?: number;
  patient_id?: number;
  deleted_at?: string;
  attention?: string;
  created_at?: string;
  updated_at?: string;
  eligibility_file_id?: number;
  eligible_patient_id?: number;
  class_name?: string;
  mobile_number?: string;
  user_id?: number;
  chrono_patient_id?: string;
  is_user?: boolean;
  patient_safety_flag?: StationPatientSafetyFlag;
  patient_safety_flag_attributes?: StationPatientSafetyFlag;
  patient_email?: string;
  pcp_name?: string;
  pcp_phone?: string;
  account_id?: number;
  phone_number?: {
    mobile?: boolean;
  };
  avatar?: {
    url?: string;
    medium?: {
      url?: string;
    };
    small?: {
      url?: string;
    };
    thumb?: {
      url?: string;
    };
  };
  'has_been_billed?'?: boolean;
  pulled_at?: string;
  pushed_at?: string;
  patient_salesforce_id?: string;
  ehr_name?: string;
  ehr_id?: string;
  pcp_practice_name?: string;
  middle_name?: string;
  voicemail_consent?: boolean;
  partner_id?: number;
  portal_access?: boolean;
  suffix?: string;
  source_type?: string;
  billing_address_street_address_1?: string;
  billing_address_street_address_2?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_zipcode?: string;
  'new_patient?'?: boolean;
  age?: number;
  requested_care_requests?: object[];
  unsynched_changes?: object;
  guarantor?: StationPatientGuarantor;
  guarantor_attributes?: StationPatientGuarantor;
  power_of_attorney?: StationPowerOfAttorney;
  power_of_attorney_attributes?: StationPowerOfAttorney;
  last_care_request?: StationLastCareRequest;
  care_history?: {
    last_visit_on_scene?: string;
    last_week?: {
      requested?: number;
      completed?: number;
      escalated_on_scene?: number;
    };
    all_time?: {
      requested?: number;
      completed?: number;
      escalated_on_scene?: number;
    };
  };
}

export interface EhrPatient {
  address?: Address;
  patientId?: number;
  dateOfBirth?: Date | string;
  gender?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  ehrPatientId?: string;
}

export interface StationEhrPatient extends StationPatient {
  address1: string;
  countryid?: string;
  currentdepartment?: string;
  currentdepartmentid?: string;
  department_id?: string;
  dh_id?: number;
  emergency_contact?: string;
  firstname?: string;
  localpatientid?: string;
  patient_email?: string;
  patientid?: string;
  primaryproviderid?: string;
  providergroupid?: string;
  sex?: string;
  ssn?: string;
  zip?: string;
}

export interface StationPatientSafetyFlag {
  id?: number;
  flag_type?: string;
  flag_reason?: string;
  _destroy?: boolean;
}

export interface PatientSafetyFlag {
  id?: number;
  flagType?: string;
  flagReason?: string;
  destroy?: boolean;
}

export interface StationWebRequestPatient {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  dob?: string;
  email?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
  care_request_id?: number;
}

export interface WebRequestPatient {
  id: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  email?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
  careRequestId?: number;
}

export interface CMAdvancedCarePatient {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  phone_number?: string;
  athena_medical_record_number?: string;
  payer?: string;
  preferred_pharmacy_details?: string;
  doctor_details?: string;
  address_street?: string;
  address_street_2?: string;
  address_city?: string;
  address_state?: string;
  address_zipcode?: string;
  address_notes?: string;
  created_at?: string;
  updated_at?: string;
  athena_id: string;
}

export interface AdvancedCarePatient {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  phoneNumber?: string;
  athenaMedicalRecordNumber?: string;
  payer?: string;
  preferredPharmacyDetails?: string;
  doctorDetails?: string;
  addressStreet?: string;
  addressStreet2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  athenaId: string;
}

export enum InsuranceParamsPatientRelation {
  SELF = 'self',
  FACILITY_STAFF = 'facility staff',
  FAMILY = 'family',
  CLINICIAN = 'clinician',
  FRIEND = 'friend',
  HOME_HEALTH_TEAM = 'home health team',
  CASE_MANAGEMENT = 'case management',
  OTHER = 'other',
  UNSPECIFIED = 'unspecified',
}

export enum InsuranceEligibilityStatus {
  UNSPECIFIED = 'unspecified',
  ELIGIBLE = 'eligible',
  INELIGIBLE = 'ineligible',
  UNVERIFIED = 'unverified',
}

export enum PatientRelationshipToSubscriber {
  PATIENT_RELATION_TO_SUBSCRIBER_UNSPECIFIED = 'unspecified',
  PATIENT_RELATION_TO_SUBSCRIBER_PATIENT = 'patient',
  PATIENT_RELATION_TO_SUBSCRIBER_MOTHER = 'mother',
  PATIENT_RELATION_TO_SUBSCRIBER_FATHER = 'father',
  PATIENT_RELATION_TO_SUBSCRIBER_CHILD = 'child',
  PATIENT_RELATION_TO_SUBSCRIBER_SPOUSE = 'spouse',
  PATIENT_RELATION_TO_SUBSCRIBER_FRIEND = 'friend',
  PATIENT_RELATION_TO_SUBSCRIBER_OTHER = 'other',
  PATIENT_RELATION_TO_SUBSCRIBER_UNRECOGNIZED = 'unrecognized',
}

export enum PatientInsurancePriority {
  INSURANCE_PRIORITY_PRIMARY = '1',
  INSURANCE_PRIORITY_SECONDARY = '2',
  INSURANCE_PRIORITY_TERTIARY = '3',
  INSURANCE_PRIORITY_UNSPECIFIED = 'unspecified',
}

export interface UnverifiedPatient {
  id: number;
  athenaId?: number;
  dateOfBirth?: string;
  phoneNumber?: string;
  legalSex?: string;
  birthSex?: BirthSex;
  genderIdentity?: GenderIdentityCategory;
  genderIdentityDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
  givenName?: string;
  familyName?: string;
  patientId?: number;
  consistencyToken?: Uint8Array | string;
}

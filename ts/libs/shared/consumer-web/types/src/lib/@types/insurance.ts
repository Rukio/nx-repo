import { InsuranceNetwork } from './insurance-network';

export interface StationPrimaryInsuranceHolder {
  id?: string | number;
  first_name: string;
  gender: string;
  middle_initial?: string;
  last_name: string;
  patient_relationship_to_insured: string;
  insurance_id?: string | number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface PrimaryInsuranceHolder {
  id?: string | number;
  firstName: string;
  middleInitial: string;
  lastName: string;
  gender: string;
  patientRelationshipToInsured: string;
  insuranceId?: string | number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface StationInsurancePlanNetwork {
  id: number;
  name: string;
  notes: string;
  package_id: number;
  active: boolean;
  insurance_classification_id: number;
  insurance_plan_id: number;
  insurance_payer_id: number;
  insurance_payer_name: string;
  eligibility_check: boolean;
  provider_enrollment: boolean;
  state_abbrs: string[];
}

export interface StationInsurancePlan {
  id: number;
  name: string;
  package_id: string | number;
  active: boolean;
  primary: boolean;
  secondary: boolean;
  tertiary: boolean;
  insurance_plan_network?: StationInsurancePlanNetwork;
}

export interface StationInsurance {
  id?: number;
  ehr_id?: string | number;
  package_id: string | number;
  insurance_plan?: StationInsurancePlan;
  insurance_plan_id?: number;
  patient_id?: string | number;
  member_id: string | number;
  insurance_classification_id?: string | number;
  created_at?: Date | string;
  updated_at?: Date | string;
  pulled_at?: Date | string;
  pushed_at?: Date | string;
  start_date?: Date | string;
  end_date?: Date | string;
  priority: string;
  company_name: string;
  group_number?: string;
  insured_same_as_patient: boolean;
  patient_relation_to_subscriber: string;
  copay_office_visit?: string;
  copay_specialist?: string;
  copay_urgent_care?: string;
  plan_type?: string;
  web_address?: string;
  list_phone?: string;
  subscriber_first_name?: string;
  subscriber_last_name?: string;
  subscriber_middle_initial?: string;
  subscriber_phone?: string;
  subscriber_street_address?: string;
  subscriber_city?: string;
  subscriber_state?: string;
  subscriber_zipcode?: string;
  subscriber_dob?: Date | string;
  subscriber_gender?: string;
  policy_holder_type?: string;
  employer?: string;
  eligible?: string;
  ehr_name?: string;
  eligibility_message?: string;
  primary_insurance_holder: StationPrimaryInsuranceHolder;
  skip_processing?: boolean;
  image_requires_verification?: boolean;
  street_address_1?: string;
  street_address_2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string | number;
  longitude?: string | number;
  insurance_classification?: string;
  primary_insurance_holder_toggle?: string;
  patient_relationship_to_insured?: string;
  first_name: string;
  gender: string;
  middle_initial: string;
  last_name: string;
  primary_insurance_holder_attributes?: StationPrimaryInsuranceHolder;
  card_front?: object;
  card_back?: object;
  remove_card_front?: boolean;
  remove_card_back?: boolean;
  card_back_url?: string;
  card_front_url?: string;
}

export interface InsurancePlanNetwork {
  id: number;
  name: string;
  notes: string;
  packageId: number;
  active: boolean;
  insuranceClassificationId: number;
  insurancePlanId: number;
  insurancePayerId: number;
  insurancePayerName: string;
  eligibilityCheck: boolean;
  providerEnrollment: boolean;
  stateAbbrs: string[];
}

export interface InsurancePlan {
  id: number;
  name: string;
  packageId: string | number;
  active: boolean;
  primary: boolean;
  secondary: boolean;
  tertiary: boolean;
  insurancePlanNetwork?: InsurancePlanNetwork;
}

export interface Insurance {
  id?: number;
  ehrId?: string | number;
  packageId: string | number;
  insurancePlanId?: number;
  patientId?: string | number;
  memberId: string | number;
  insuranceClassificationId?: string | number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  pulledAt?: Date | string;
  pushedAt?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  priority: string;
  companyName: string;
  groupNumber?: string;
  insuredSameAsPatient: boolean;
  patientRelationToSubscriber: string;
  copayOfficeVisit?: string;
  copaySpecialist?: string;
  copayUrgentCare?: string;
  planType?: string;
  webAddress?: string;
  listPhone?: string;
  subscriberFirstName?: string;
  subscriberLastName?: string;
  subscriberMiddleInitial?: string;
  subscriberPhone?: string;
  subscriberStreetAddress?: string;
  subscriberCity?: string;
  subscriberState?: string;
  subscriberZipcode?: string;
  subscriberDob?: Date | string;
  subscriberGender?: string;
  policyHolderType?: string;
  employer?: string;
  eligible?: string;
  ehrName?: string;
  eligibilityMessage?: string;
  primaryInsuranceHolder: PrimaryInsuranceHolder;
  skipProcessing?: boolean;
  imageRequiresVerification?: boolean;
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  latitude?: string | number;
  longitude?: string | number;
  insuranceClassification?: string;
  primaryInsuranceHolderToggle?: string;
  patientRelationshipToInsured?: string;
  firstName: string;
  gender: string;
  middleInitial: string;
  lastName: string;
  primaryInsuranceHolderAttributes?: PrimaryInsuranceHolder;
  cardFront?: object;
  cardBack?: object;
  removeCardFront?: boolean;
  removeCardBack?: boolean;
  cardBackUrl?: string;
  cardFrontUrl?: string;
  insurancePlan?: InsurancePlan;
}

export interface OssInsurance extends Omit<Insurance, 'insurancePlan'> {
  insuranceNetwork?: InsuranceNetwork;
}

export interface StationSelfUploadInsurance {
  id: number;
  member_id: string;
  insurance_provider: string;
  insurance_plan: string;
  self_pay: boolean;
  self_upload_insurance_card_front: InsuranceImageCard;
  self_upload_insurance_card_back: InsuranceImageCard;
  care_request_id: number;
  created_at: string;
  updated_at: string;
}

export interface SelfUploadInsurance {
  id: number;
  memberId: string;
  insuranceProvider: string;
  insurancePlan: string;
  selfPay: boolean;
  selfUploadInsuranceCardFront: InsuranceImageCard;
  selfUploadInsuranceCardBack: InsuranceImageCard;
  careRequestId: number;
  createdAt: string;
  updatedAt: string;
}
export interface InsuranceImageCard {
  url: string;
  thumb: {
    url: string;
  };
  small: {
    url: string;
  };
}

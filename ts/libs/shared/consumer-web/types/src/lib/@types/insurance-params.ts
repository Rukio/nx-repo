import {
  PrimaryInsuranceHolder,
  StationPrimaryInsuranceHolder,
} from './insurance';

// TODO(ON-1012): Change `patientRelationToSubscriber` to an enum type.

export interface InsuranceParams {
  priority: string;
  memberId: string | number;
  packageId: string | number;
  companyName: string;
  insurancePlanId?: number | null;
  primaryInsuranceHolderToggle: string;
  insuredSameAsPatient: boolean;
  patientRelationToSubscriber: string;
  patientRelationshipToInsured: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  gender: string;
  primaryInsuranceHolderAttributes: PrimaryInsuranceHolder;
  cardBack?: string;
  cardFront?: string;
  removeCardBack?: boolean;
  removeCardFront?: boolean;
  skipProcessing?: boolean;
  copayUrgentCare?: string;
  policyHolderType?: string;
  eligibilityStatus?: string;
  eligibilityMessage?: string;
}

export interface StationInsuranceParams {
  priority: string;
  member_id: string | number;
  package_id: string | number;
  company_name: string;
  insurance_plan_id?: number | null;
  primary_insurance_holder_toggle: string;
  insured_same_as_patient: boolean;
  patient_relation_to_subscriber: string;
  patient_relationship_to_insured: string;
  first_name: string;
  middle_initial: string;
  last_name: string;
  gender: string;
  primary_insurance_holder_attributes: StationPrimaryInsuranceHolder;
  card_back?: string;
  card_front?: string;
  remove_card_back?: boolean;
  remove_card_front?: boolean;
  skip_processing?: boolean;
  copay_urgent_care?: string;
  policy_holder_type?: string;
}

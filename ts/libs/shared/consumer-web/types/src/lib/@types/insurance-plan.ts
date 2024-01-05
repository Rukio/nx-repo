export interface AppointmentType {
  id: string | number;
  name: string;
}

export interface StationInsurancePlanServiceLine {
  id: number;
  service_line_id: number;
  insurance_plan_id: number;
  schedule_now?: boolean;
  schedule_future?: boolean;
  capture_cc_on_scene?: boolean;
  note?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  all_channel_items?: boolean;
  enabled: boolean;
  new_patient_appointment_type?: AppointmentType;
  existing_patient_appointment_type?: AppointmentType;
  onboarding_cc_policy?: string;
}

export interface InsurancePlanServiceLine {
  id: number;
  serviceLineId: number;
  insurancePlanId: number;
  scheduleNow?: boolean;
  scheduleFuture?: boolean;
  captureCcOnScene?: boolean;
  note?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  allChannelItems?: boolean;
  enabled: boolean;
  newPatientAppointmentType?: AppointmentType;
  existingPatientAppointmentType?: AppointmentType;
  onboardingCcPolicy?: string;
}

export interface StationBillingCityInsurancePlan {
  id: number;
  insurance_plan_id: number;
  billing_city_id: number;
  enabled: boolean;
  note?: string;
  advanced_care_eligibility?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface BillingCityInsurancePlan {
  id: number;
  insurancePlanId: number;
  billingCityId: number;
  enabled: boolean;
  note?: string;
  advancedCareEligibility?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface StationInsurancePlan {
  id: number;
  name: string;
  package_id: string | number;
  note?: string;
  active: boolean;
  primary: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  state_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  plan_type?: string;
  insurance_classification_id: number;
  bypass_scrubbing: boolean;
  always_scrubbing: boolean;
  er_diversion?: string | number;
  nine_one_one_diversion?: string | number;
  observation_diversion?: string | number;
  hospitalization_diversion?: string | number;
  contracted: boolean;
  payer_group_id?: string | number;
  insurance_classification_name?: string;
  billing_city_insurance_plans: StationBillingCityInsurancePlan[];
  insurance_plan_service_lines: StationInsurancePlanServiceLine[];
  insurance_classification?: {
    id: number;
    name: string;
    created_at?: Date | string;
    updated_at?: Date | string;
  };
}

export interface InsurancePlan {
  id: number;
  name: string;
  packageId: string | number;
  note?: string;
  active: boolean;
  primary: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  stateId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  planType?: string;
  insuranceClassificationId: number;
  bypassScrubbing: boolean;
  alwaysScrubbing: boolean;
  erDiversion?: string | number;
  nineOneOneDiversion?: string | number;
  observationDiversion?: string | number;
  hospitalizationDiversion?: string | number;
  contracted: boolean;
  payerGroupId?: string | number;
  insuranceClassificationName?: string;
  billingCityInsurancePlans: BillingCityInsurancePlan[];
  insurancePlanServiceLines: InsurancePlanServiceLine[];
  insuranceClassification?: {
    id: number;
    name: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };
}

export interface EhrInsurancePlanParams {
  name: string;
  memberId: string | number;
  checkCasePolicies?: boolean;
}

export interface EhrStationInsurancePlanParams {
  insurance_name: string;
  member_id: string | number;
  check_case_policies?: boolean;
}
export interface EhrInsurancePlan {
  affiliations?: string[];
  planName?: string;
  packageId?: string;
  addressList?: string[];
}

export interface EhrStationInsurancePlan {
  affiliations: string[];
  insuranceplanname: string;
  insurancepackageid: string;
  addresslist: string[];
}

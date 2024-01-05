import { Priority } from './priority';
import { UploadedImageLocations } from './upload-image-location';

export const SELF_PAY_COMPANY_NAME = 'SelfPay';

export interface DashboardInsurance {
  id: number;
  patient_id: number;
  priority: Priority;
  start_date: string;
  end_date: string;
  company_name: string;
  member_id: string;
  group_number: string;
  created_at: string;
  updated_at: string;
  insured_same_as_patient: boolean;
  patient_relation_to_subscriber: string;
  copay_office_visit: string | null;
  copay_specialist: string | null;
  copay_urgent_care: string | null;
  plan_type: string | null;
  web_address: string | null;
  list_phone: string | null;
  subscriber_first_name: string | null;
  subscriber_last_name: string | null;
  subscriber_phone: string | null;
  subscriber_street_address: string | null;
  subscriber_city: string | null;
  subscriber_state: string | null;
  subscriber_zipcode: string | null;
  policy_holder_type: string | null;
  subscriber_dob: string | null;
  subscriber_gender: string | null;
  package_id: string;
  employer: string;
  eligible: string;
  ehr_id: string;
  ehr_name: string;
  pulled_at: string;
  pushed_at: string;
  eligibility_message: string | null;
  subscriber_middle_initial: string | null;
  image_requires_verification: string | null;
  street_address_1: string;
  street_address_2: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
  latitude: unknown | null;
  longitude: unknown | null;
  card_back_url: string | null;
  card_front_url: string | null;
  insurance_classification: string;
  insurance_classification_id: number;
  primary_insurance_holder: PrimaryInsuranceHolder | null;
  card_back: UploadedImageLocations;
  card_front: UploadedImageLocations;
}

export interface PrimaryInsuranceHolder {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial: string;
  gender: string;
  patient_relationship_to_insured: string;
  insurance_id: number;
  created_at: string;
  updated_at: string;
}

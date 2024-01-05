export interface PartnerReferral {
  id?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  relationship?: string;
}

export interface StationPartnerReferral {
  id?: number;
  channel_item_id?: number;
  caller_id?: number;
  chief_complaint?: string;
  contact_phone?: string;
  contact_name?: string;
  contact_relationship_to_patient?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  insurance_plan_name?: string;
  insurance_member_id?: string;
  market_id?: number;
}

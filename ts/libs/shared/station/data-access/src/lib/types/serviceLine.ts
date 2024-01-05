export type ServiceLineAppointmentType = {
  id: string;
  name: string;
};

export type ServiceLine = {
  id: number;
  name: string;
  existing_patient_appointment_type: ServiceLineAppointmentType | null;
  new_patient_appointment_type: ServiceLineAppointmentType | null;
  out_of_network_insurance: boolean;
  require_checkout: boolean;
  require_consent_signature: boolean;
  require_medical_necessity: boolean;
  created_at: string;
  updated_at: string;
  followup_2_day: boolean;
  followup_14_30_day: boolean;
  is_911: boolean;
  shift_type_id: number;
  parent_id: number | null;
  upgradeable_with_screening: boolean;
  default: boolean;
  shift_team_service_id: number | null;
};

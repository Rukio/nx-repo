import {
  AppointmentType,
  InsurancePlanServiceLine,
  StationInsurancePlanServiceLine,
} from './insurance-plan';

export interface StationServiceLine {
  id: number;
  name: string;
  new_patient_appointment_type: AppointmentType;
  existing_patient_appointment_type: AppointmentType;
  created_at: string;
  updated_at: string;
  followup_2_day: boolean;
  followup_14_30_day: boolean;
  out_of_network_insurance: boolean;
  is_911: boolean;
  require_checkout: boolean;
  require_consent_signature: boolean;
  require_medical_necessity: boolean;
  shift_type_id: number;
  parent_id: number;
  upgradeable_with_screening: boolean;
  default: boolean;
  service_line_questions: [];
  insurance_plan_service_lines: StationInsurancePlanServiceLine[];
  sub_service_lines: StationServiceLine[];
  protocol_requirements?: StationProtocolRequirement[];
}

export interface ServiceLine {
  id: number;
  name: string;
  newPatientAppointmentType: AppointmentType;
  existingPatientAppointmentType: AppointmentType;
  createdAt: string;
  updatedAt: string;
  followup2Day: boolean;
  followup_14_30_day: boolean;
  outOfNetworkInsurance: boolean;
  is911: boolean;
  requireCheckout: boolean;
  requireConsentSignature: boolean;
  requireMedicalNecessity: boolean;
  shiftTypeId: number;
  parentId: number;
  upgradeableWithScreening: boolean;
  default: boolean;
  serviceLineQuestions: [];
  insurancePlanServiceLines: InsurancePlanServiceLine[];
  subServiceLines: ServiceLine[];
  protocolRequirements?: ProtocolRequirement[];
}

export interface StationQuestionResponse {
  id: number;
  service_line_id: number;
  question_type: string;
  question_text: string;
  sync_to_athena: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface StationServiceLineQuestionResponse {
  id: number;
  service_line_id: number;
  user_id: number;
  care_request_id: number;
  responses: StationQuestionResponse[];
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  id: number;
  serviceLineId: number;
  questionType: string;
  questionText: string;
  syncToAthena: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceLineQuestionResponse {
  id: number;
  serviceLineId: number;
  userId: number;
  careRequestId: number;
  responses: QuestionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface StationProtocolRequirement {
  id: number;
  color: string;
  name: string;
  service_line_id: number;
  maximum_age: number;
  minimum_age: number;
}

export interface ProtocolRequirement {
  id: number;
  color: string;
  name: string;
  serviceLineId: number;
  maximumAge: number;
  minimumAge: number;
}

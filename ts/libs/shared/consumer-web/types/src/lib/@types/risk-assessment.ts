import { RiskQuestion, StationRiskQuestion } from './risk-question';

export interface StationRiskAssessment {
  id?: number;
  user_id?: number;
  care_request_id?: number;
  type?: string;
  protocol_tags?: string[];
  protocol_score?: number;
  overridden_at?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
  dob: string;
  gender: string;
  worst_case_score: number;
  score: number;
  protocol_id: number;
  protocol_name: string;
  override_reason: string;
  responses: {
    questions: StationRiskQuestion[];
  };
  chief_complaint: string;
  selected_symptoms: string;
}

export interface RiskAssessment {
  id?: number;
  userId?: number;
  careRequestId?: number;
  type?: string;
  protocolTags?: string[];
  protocolScore?: number;
  overriddenAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  dob: string;
  gender: string;
  worstCaseScore: number;
  score: number;
  protocolId: number;
  protocolName: string;
  overrideReason: string;
  complaint: {
    symptom: string;
    selectedSymptoms: string;
  };
  responses: {
    questions: RiskQuestion[];
  };
}

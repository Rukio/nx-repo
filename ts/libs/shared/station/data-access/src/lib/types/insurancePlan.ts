import { InsuranceClassification } from './insuranceClassification';

export type InsurancePlan = {
  id: number;
  name: string;
  package_id: string;
  note: string | null;
  active: boolean;
  primary: false;
  secondary: boolean;
  tertiary: boolean;
  state_id: number;
  created_at: string;
  updated_at: string;
  plan_type: string;
  insurance_classification_id: number;
  insurance_classification: InsuranceClassification;
  bypass_scrubbing: boolean;
  always_scrubbing: boolean;
  er_diversion: number | null;
  nine_one_one_diversion: number | null;
  observation_diversion: number | null;
  hospitalization_diversion: number | null;
  contracted: boolean;
  payer_group_id: number | null;
};

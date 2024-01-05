import { InsurancePlan } from '../../types';
import { mockedInsuranceClassification } from '../insuranceClassifications';

export const mockedInsurancePlan: InsurancePlan = {
  id: 1,
  name: 'Test Insurance Plan',
  package_id: '1111',
  note: '',
  active: true,
  primary: false,
  secondary: true,
  tertiary: true,
  state_id: 3,
  created_at: '2023-01-01T14:44:44.432Z',
  updated_at: '2023-01-01T14:44:44.432Z',
  plan_type: 'insurance_plan',
  insurance_classification_id: 1,
  bypass_scrubbing: false,
  always_scrubbing: false,
  er_diversion: null,
  nine_one_one_diversion: null,
  observation_diversion: null,
  hospitalization_diversion: null,
  contracted: true,
  payer_group_id: null,
  insurance_classification: mockedInsuranceClassification,
};

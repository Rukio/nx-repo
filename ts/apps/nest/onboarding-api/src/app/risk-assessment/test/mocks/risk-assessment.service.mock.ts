import {
  RiskAssessment,
  StationRiskAssessment,
} from '@*company-data-covered*/consumer-web-types';
import RiskAssessmentBodyDto from '../../dto/risk-assessment-body.dto';

const stationResponses = {
  questions: [
    {
      weight_yes: 0,
      weight_no: 0,
      required: false,
      protocol_id: 2903,
      order: null,
      name: 'Does this patient meet initial Advanced Care criteria?',
      id: 23016,
      has_notes: false,
      allow_na: false,
      answer: 'No',
    },
  ],
};

const responses = {
  questions: [
    {
      weightYes: 0,
      weightNo: 0,
      required: false,
      protocolId: 2903,
      order: null,
      name: 'Does this patient meet initial Advanced Care criteria?',
      id: 23016,
      hasNotes: false,
      allowNa: false,
      answer: 'No',
    },
  ],
};

export const mockStationRiskAssessment: StationRiskAssessment = {
  id: 17020,
  protocol_id: 2903,
  protocol_name: 'Advanced Care',
  score: 0,
  responses: stationResponses,
  user_id: 84891,
  care_request_id: 614009,
  override_reason: null,
  overridden_at: null,
  created_at: '2021-10-11T16:28:13.808Z',
  updated_at: '2021-10-11T16:28:13.808Z',
  protocol_score: null,
  dob: '1956-07-08',
  gender: 'female',
  worst_case_score: 0,
  protocol_tags: null,
  type: null,
  chief_complaint: 'Vision Problem',
  selected_symptoms: 'Vision problem|Headache',
};
export const mockRiskAssessment: RiskAssessment = {
  id: 17020,
  protocolId: 2903,
  protocolName: 'Advanced Care',
  score: 0,
  responses,
  userId: 84891,
  careRequestId: 614009,
  overrideReason: null,
  overriddenAt: null,
  createdAt: '2021-10-11T16:28:13.808Z',
  updatedAt: '2021-10-11T16:28:13.808Z',
  protocolScore: null,
  dob: '1956-07-08',
  gender: 'female',
  worstCaseScore: 0,
  protocolTags: null,
  type: null,
  complaint: {
    symptom: 'Vision Problem',
    selectedSymptoms: 'Vision problem|Headache',
  },
};

export const buildMockRiskAssessment = (): RiskAssessmentBodyDto => ({
  score: 1,
  protocolId: 2903,
  protocolName: 'Advanced Care',
  responses,
  worstCaseScore: 0,
  dob: '1956-07-08',
  gender: 'female',
  overrideReason: null,
  complaint: {
    symptom: 'Vision problem',
    selectedSymptoms: 'Vision problem|Headache',
  },
});

import {
  RiskQuestion,
  RiskAssessment,
  StationRiskQuestion,
  StationRiskAssessment,
} from '@*company-data-covered*/consumer-web-types';

const StationRiskQuestionToRiskQuestion = (
  input: StationRiskQuestion
): RiskQuestion => {
  const output: RiskQuestion = {
    allowNa: input.allow_na,
    hasNotes: input.has_notes,
    id: input.id,
    name: input.name,
    order: input.order,
    protocolId: input.protocol_id,
    required: input.required,
    weightNo: input.weight_no,
    weightYes: input.weight_yes,
    answer: input.answer,
  };

  return output;
};

const RiskQuestionToStationRiskQuestion = (
  input: RiskQuestion
): StationRiskQuestion => {
  const output: StationRiskQuestion = {
    allow_na: input.allowNa,
    has_notes: input.hasNotes,
    id: input.id,
    name: input.name,
    order: input.order as number,
    protocol_id: input.protocolId,
    required: input.required,
    weight_no: input.weightNo,
    weight_yes: input.weightYes,
    answer: input.answer,
  };

  return output;
};

const StationRiskAssessmentToRiskAssessment = (
  input: StationRiskAssessment
): RiskAssessment => {
  const output: RiskAssessment = {
    careRequestId: input.care_request_id,
    createdAt: input.created_at,
    dob: input.dob,
    gender: input.gender,
    id: input.id,
    overriddenAt: input.overridden_at,
    overrideReason: input.override_reason,
    protocolId: input.protocol_id,
    protocolName: input.protocol_name,
    protocolScore: input.protocol_score,
    protocolTags: input.protocol_tags,
    responses: {
      questions:
        input.responses && input.responses.questions
          ? input.responses.questions.map(StationRiskQuestionToRiskQuestion)
          : [],
    },
    score: input.score,
    type: input.type,
    updatedAt: input.created_at,
    userId: input.user_id,
    worstCaseScore: input.worst_case_score,
    complaint: {
      symptom: input.chief_complaint,
      selectedSymptoms: input.selected_symptoms,
    },
  };

  return output;
};

const RiskAssessmentToStationRiskAssessment = (
  input: RiskAssessment
): StationRiskAssessment => {
  const output: StationRiskAssessment = {
    care_request_id: input.careRequestId,
    created_at: input.createdAt,
    dob: input.dob,
    gender: input.gender,
    id: input.id,
    overridden_at: input.overriddenAt,
    override_reason: input.overrideReason,
    protocol_id: input.protocolId,
    protocol_name: input.protocolName,
    protocol_score: input.protocolScore,
    protocol_tags: input.protocolTags,
    responses: {
      questions:
        input.responses && input.responses.questions
          ? input.responses.questions.map(RiskQuestionToStationRiskQuestion)
          : [],
    },
    chief_complaint: input.complaint?.symptom,
    selected_symptoms: input.complaint?.selectedSymptoms,
    score: input.score,
    type: input.type,
    updated_at: input.updatedAt,
    user_id: input.userId,
    worst_case_score: input.worstCaseScore,
  };

  return output;
};

export default {
  StationRiskAssessmentToRiskAssessment,
  RiskAssessmentToStationRiskAssessment,
};

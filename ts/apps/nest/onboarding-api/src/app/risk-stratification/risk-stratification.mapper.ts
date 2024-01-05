import {
  RSTimeSensitiveAnswerEvent,
  RSTimeSensitiveAnswerEventBody,
  TimeSensitiveAnswerEvent,
  TimeSensitiveAnswerEventBody,
  TimeSensitiveScreeningResultBody,
  RSTimeSensitiveScreeningResultBody,
  TimeSensitiveQuestion,
  RSTimeSensitiveQuestion,
  RSTimeSensitiveScreeningResultResponse,
  TimeSensitiveScreeningResultResponse,
  SearchSymptomAliasesParams,
  RSSearchSymptomAliasesParams,
} from '@*company-data-covered*/consumer-web-types';

const mapTimeSensitiveAnswerEventBodyToRSTimeSensitiveAnswerEventBody = (
  input: TimeSensitiveAnswerEventBody
): RSTimeSensitiveAnswerEventBody => {
  return {
    care_request_id: input.careRequestId,
    survey_version_id: input.surveyVersionId,
    answer: input.answer,
  };
};

const mapRSTimeSensitiveAnswerEventToTimeSensitiveAnswerEvent = (
  input: RSTimeSensitiveAnswerEvent
): TimeSensitiveAnswerEvent => {
  return {
    escalate: input.escalate,
  };
};

const mapTimeSensitiveScreeningResultBodyToRSTimeSensitiveScreeningResultBody =
  (
    input: TimeSensitiveScreeningResultBody
  ): RSTimeSensitiveScreeningResultBody => {
    return {
      care_request_id: input.careRequestId,
      escalated: input.escalated,
      survey_version_id: input.surveyVersionId,
      escalated_question_id: input?.escalatedQuestionId,
    };
  };

const mapRSTimeSensitiveQuestionToTimeSensitiveQuestion = (
  input: RSTimeSensitiveQuestion
): TimeSensitiveQuestion => {
  return {
    id: input.id,
    surveyVersionId: input.survey_version_id,
    question: input.question,
    signs: input.signs,
    displayOrder: input.display_order,
  };
};

const mapRSTimeSensitiveScreeningResultBodyToTimeSensitiveScreeningResult = (
  input: RSTimeSensitiveScreeningResultResponse
): TimeSensitiveScreeningResultResponse => {
  return {
    question: {
      id: input.question.id,
      surveyVersionId: input.question.survey_version_id,
      question: input.question.question,
      signs: input.question.signs,
      displayOrder: input.question.display_order,
    },
    answer: input.answer,
  };
};

const mapSearchSymptomAliasesParamsToRSSearchSymptomAliasesParams = (
  input: SearchSymptomAliasesParams
): RSSearchSymptomAliasesParams => {
  return {
    search: input.searchTerm,
    'paginationQuery.page': input.page,
    'paginationQuery.pageSize': input.pageSize,
  };
};

export default {
  mapTimeSensitiveAnswerEventBodyToRSTimeSensitiveAnswerEventBody,
  mapRSTimeSensitiveAnswerEventToTimeSensitiveAnswerEvent,
  mapTimeSensitiveScreeningResultBodyToRSTimeSensitiveScreeningResultBody,
  mapRSTimeSensitiveQuestionToTimeSensitiveQuestion,
  mapRSTimeSensitiveScreeningResultBodyToTimeSensitiveScreeningResult,
  mapSearchSymptomAliasesParamsToRSSearchSymptomAliasesParams,
};

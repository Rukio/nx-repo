import {
  EdRefusalQuestionnaire,
  EdRefusalQuestionnaireResponse,
  StationEdRefusalQuestionnaire,
} from '@*company-data-covered*/consumer-web-types';

const StationResponseToResponse = (
  input: EdRefusalQuestionnaireResponse
): EdRefusalQuestionnaireResponse => {
  const output: EdRefusalQuestionnaireResponse = {
    id: input.id,
    question: input.question,
    answer: input.answer === 'yes' ? true : input.answer,
  };

  return output;
};

const ResponseToStationResponse = (
  input: EdRefusalQuestionnaireResponse
): EdRefusalQuestionnaireResponse => {
  const output: EdRefusalQuestionnaireResponse = {
    id: input.id,
    question: input.question,
    answer:
      typeof input.answer === 'boolean'
        ? input.answer
        : input.answer.toLowerCase(),
  };

  return output;
};

const StationEdRefusalQuestionnaireToEdRefusalQuestionnaire = (
  input: StationEdRefusalQuestionnaire
): EdRefusalQuestionnaire => {
  const output: EdRefusalQuestionnaire = {
    id: input.id,
    userId: input.user_id,
    careRequestId: input.care_request_id,
    secondaryScreeningId: input.secondary_screening_id,
    acceptable: input.acceptable,
    type: input.type,
    responses: input.responses.map(StationResponseToResponse),
  };

  return output;
};

const EdRefusalQuestionnaireToStationEdRefusalQuestionnaire = (
  input: EdRefusalQuestionnaire
): StationEdRefusalQuestionnaire => {
  const output: StationEdRefusalQuestionnaire = {
    id: input.id,
    secondary_screening_id: input.secondaryScreeningId,
    type: input.type,
    responses: input.responses.map(ResponseToStationResponse),
  };

  return output;
};

export default {
  StationEdRefusalQuestionnaireToEdRefusalQuestionnaire,
  EdRefusalQuestionnaireToStationEdRefusalQuestionnaire,
};

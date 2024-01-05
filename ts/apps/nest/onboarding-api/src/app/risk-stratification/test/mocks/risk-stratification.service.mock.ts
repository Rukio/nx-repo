import {
  RSTimeSensitiveAnswerEvent,
  RSTimeSensitiveAnswerEventBody,
  TimeSensitiveAnswerEvent,
  TimeSensitiveAnswerEventBody,
  RSTimeSensitiveScreeningResultBody,
  TimeSensitiveScreeningResultBody,
  RSTimeSensitiveQuestion,
  TimeSensitiveQuestion,
  RSTimeSensitiveScreeningResultResponse,
  TimeSensitiveScreeningResultResponse,
  SearchSymptomAliasesResponse,
  CareRequestSymptomsBody,
  SearchSymptomAliasesParams,
} from '@*company-data-covered*/consumer-web-types';

export const RS_TIME_SENSITIVE_ANSWER_EVENT_BODY: RSTimeSensitiveAnswerEventBody =
  {
    survey_version_id: 'uuid',
    answer: false,
    care_request_id: 123456,
  };

export const TIME_SENSITIVE_ANSWER_EVENT_BODY: TimeSensitiveAnswerEventBody = {
  surveyVersionId: 'uuid',
  answer: false,
  careRequestId: 123456,
};

export const RS_TIME_SENSITIVE_ANSWER_EVENT_DATA: RSTimeSensitiveAnswerEvent = {
  escalate: false,
};

export const TIME_SENSITIVE_ANSWER_EVENT_DATA: TimeSensitiveAnswerEvent = {
  escalate: false,
};

export const RS_TIME_SENSITIVE_SCREENING_RESULT_BODY: RSTimeSensitiveScreeningResultBody =
  {
    care_request_id: 123456,
    escalated: false,
    escalated_question_id: '123456',
    survey_version_id: '1234567',
  };

export const TIME_SENSITIVE_SCREENING_RESULT_BODY: TimeSensitiveScreeningResultBody =
  {
    careRequestId: 123456,
    escalated: false,
    escalatedQuestionId: '123456',
    surveyVersionId: '1234567',
  };

export const RS_TIME_SENSITIVE_QUESTION: RSTimeSensitiveQuestion[] = [
  {
    id: '123456',
    survey_version_id: 'uuid',
    question: 'Is the patient demonstrating evidence of respiratory distress?',
    signs: {
      signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
    },
    display_order: 123456,
  },
];

export const TIME_SENSITIVE_QUESTION: TimeSensitiveQuestion[] = [
  {
    id: '123456',
    surveyVersionId: 'uuid',
    question: 'Is the patient demonstrating evidence of respiratory distress?',
    signs: {
      signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
    },
    displayOrder: 123456,
  },
];

export const TIME_SENSITIVE_SCREENING_RESULT_RESPONSE: TimeSensitiveScreeningResultResponse[] =
  [
    {
      question: {
        id: '123456',
        surveyVersionId: 'uuid',
        question:
          'Is the patient demonstrating evidence of respiratory distress?',
        signs: {
          signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
        },
        displayOrder: 123456,
      },
      answer: false,
    },
  ];

export const RS_TIME_SENSITIVE_SCREENING_RESULT_RESPONSE: RSTimeSensitiveScreeningResultResponse[] =
  [
    {
      question: {
        id: '123456',
        survey_version_id: 'uuid',
        question:
          'Is the patient demonstrating evidence of respiratory distress?',
        signs: {
          signs: ['Sign 1', 'Sign 2', ['Nested Sign 1', 'Nested Sign 2']],
        },
        display_order: 123456,
      },
      answer: false,
    },
  ];

export const RS_SEARCH_SYMPTOM_ALIASES_RESPONSE: SearchSymptomAliasesResponse =
  {
    symptoms: [
      {
        id: '7542bae98764-43b2-e4667e49-99cd-53d4',
        symptomId: 'e4667e49-53d4-43b2-99cd-7542bae98764',
        symptomName: 'Cough',
        name: 'Cough',
        legacyRiskProtocolName: 'Cough/',
      },
    ],
    pagination: {
      pageSize: 1,
      totalPages: 1,
      totalResults: 1,
      currentPage: 1,
    },
  };

export const RS_SEARCH_SYMPTOM_ALIASES_EMPTY_RESPONSE: SearchSymptomAliasesResponse =
  {
    symptoms: [],
    pagination: {
      pageSize: 1,
      totalPages: 0,
      totalResults: 0,
      currentPage: 0,
    },
  };

export const UPSERT_CARE_REQUEST_SYMPTOMS_BODY: CareRequestSymptomsBody = {
  careRequestId: 42,
  symptomAliasesIds: [
    '683a3f35-c9f2-4924-9afc-3da5ec402566',
    '9d1ed36d-9898-4e25-b11c-64c7084acbaa',
  ],
};

export const RS_SEARCH_SYMPTOM_ALIASES_PARAMS: SearchSymptomAliasesParams = {
  searchTerm: 'cough',
  pageSize: 1,
  page: 1,
};
